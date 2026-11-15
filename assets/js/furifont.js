(function () {
  "use strict";

  var modes = ["off", "hiragana", "romaji"];
  var furiganaKey = "engawa-furigana";
  // User content + main menu / header dropdowns — not meta block, TOC, counts, etc.
  var SCOPE =
    ".prose, .furigana-scope, .article-summary, .article-header__title, .term-header__title, .term-header__desc, .category-card__title, .category-card__desc, .terms-cloud__name, .post-summary__title, .post-summary__excerpt, .post-featured__title, .post-featured__excerpt, .post-nav__link .title, .link-card__title, .link-card__desc, .page-header__quote-text, .sidebar-author__bio, .tag-cloud > a, .site-nav a, .site-nav-mobile a, .header-bar__link, .site-header__actions .lang-switcher, .site-header__actions .theme-switcher, .site-header__actions .size-switcher, .site-header__actions .furigana-switcher";
  var SKIP =
    "script,style,textarea,noscript,code,pre,kbd,ruby,[contenteditable]:not([contenteditable=false]),.post-meta-block,.toc,.tag-count,.terms-cloud__count,.category-card__count,.term-header__count,[data-furifont-reading]";

  var pairsCache = null;
  var ivsCache = Object.create(null);
  var reader = null;
  var activeIvsKey = "";
  var latest = 0;
  var observer = null;
  var annotateTimer = null;
  var pieces = new WeakSet();

  var defaultSchemes = {
    light: "serif",
    dark: "serif",
  };

  function getMode() {
    var m = document.documentElement.getAttribute("data-furigana");
    return modes.indexOf(m) !== -1 ? m : "off";
  }

  function getFamily() {
    var f = document.documentElement.getAttribute("data-furifont-family");
    return f === "sans" || f === "serif" ? f : "serif";
  }

  function getBase() {
    var b = document.documentElement.getAttribute("data-furifont-base");
    return b || "/fonts/furifont/";
  }

  function ivsFile(family, mode) {
    if (family === "sans") {
      return mode === "romaji"
        ? "FurifontSansRomajiVF.ivs.json"
        : "FurifontSansVF.ivs.json";
    }
    return mode === "romaji"
      ? "FurifontSerifRomajiVF.ivs.json"
      : "FurifontSerifVF.ivs.json";
  }

  function createOkuriganaReader(tables) {
    var inverted = new Map();
    var RUN = /(?<!\p{sc=Han})\p{sc=Han}+(?=\p{sc=Hiragana})/gu;

    function okuriganaOf(run) {
      if (!inverted.has(run)) {
        var reading = new Map();
        var entries = tables.pairs[run] || {};
        Object.keys(entries).forEach(function (given) {
          (entries[given] || []).forEach(function (ok) {
            reading.set(ok, given || null);
          });
        });
        var longest = 0;
        reading.forEach(function (_v, k) {
          if (k.length > longest) longest = k.length;
        });
        inverted.set(
          run,
          reading.size ? { reading: reading, longest: longest } : undefined
        );
      }
      return inverted.get(run);
    }

    function saltOf(run, reading) {
      var first = Array.from(run)[0] || "";
      var word = run.length > first.length;
      var list;
      if (word) {
        var notations = tables.words[run];
        list = notations
          ? notations.map(function (notation) {
              var parts = [];
              var re = /\[([^\]]*)\]/g;
              var m;
              while ((m = re.exec(notation))) parts.push(m[1]);
              return parts.join("");
            })
          : undefined;
      } else {
        list = tables.readings[run];
      }
      var index = list ? list.indexOf(reading) : -1;
      return index >= (word ? 1 : 0) &&
        index < 15 &&
        tables.lone[run] !== reading
        ? index + 1
        : 0;
    }

    function find(value) {
      var found = [];
      var match;
      RUN.lastIndex = 0;
      while ((match = RUN.exec(value))) {
        var run = match[0];
        var at = match.index;
        var okurigana = okuriganaOf(run);
        var after = value.slice(
          at + run.length,
          at + run.length + (okurigana ? okurigana.longest : 0)
        );
        var reading;
        var kept;
        for (kept = after.length; kept > 0 && reading === undefined; kept--) {
          reading = okurigana
            ? okurigana.reading.get(after.slice(0, kept))
            : undefined;
        }
        var salt = reading ? saltOf(run, reading) : 0;
        if (reading && salt) {
          found.push({ at: at, length: run.length, reading: reading, salt: salt });
        }
      }
      return found;
    }

    return { find: find, saltOf: saltOf };
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url);
      return r.json();
    });
  }

  function loadReader(mode, family) {
    var request = ++latest;
    var key = family + ":" + mode;
    var base = getBase();
    var pairsP = pairsCache
      ? Promise.resolve(pairsCache)
      : fetchJson(base + "okurigana.json").then(function (p) {
          pairsCache = p;
          return p;
        });
    var ivsP = ivsCache[key]
      ? Promise.resolve(ivsCache[key])
      : fetchJson(base + ivsFile(family, mode)).then(function (lists) {
          ivsCache[key] = lists;
          return lists;
        });

    return Promise.all([pairsP, ivsP]).then(function (both) {
      if (request !== latest) return null;
      var pairs = both[0];
      var lists = both[1];
      if (!lists || lists.salt !== true) return null;
      activeIvsKey = key;
      return createOkuriganaReader({
        pairs: pairs,
        readings: lists.kanji,
        words: lists.words,
        lone: lists.lone,
      });
    });
  }

  function textsIn(roots) {
    var texts = [];
    roots.forEach(function (root) {
      if (!root || !root.isConnected) return;
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      var node = walker.currentNode;
      for (; node; node = walker.nextNode()) {
        if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
          texts.push(node);
        }
      }
    });
    return texts;
  }

  function unwrap() {
    var parents = new Set();
    document.querySelectorAll("[data-furifont-reading]").forEach(function (span) {
      if (span.parentNode) parents.add(span.parentNode);
      span.replaceWith.apply(span, Array.from(span.childNodes));
    });
    parents.forEach(function (parent) {
      Array.from(parent.childNodes).forEach(function (node) {
        var before = node.previousSibling;
        if (
          pieces.has(node) &&
          before &&
          before.nodeType === Node.TEXT_NODE
        ) {
          before.appendData(node.nodeValue || "");
          node.remove();
        }
      });
    });
  }

  function scopeRoots(roots) {
    var found = [];
    var seen = new Set();
    function add(el) {
      if (!el || seen.has(el)) return;
      seen.add(el);
      found.push(el);
    }
    (roots || []).forEach(function (root) {
      if (!root) return;
      if (root.nodeType === Node.ELEMENT_NODE) {
        if (root.matches && root.matches(SCOPE)) add(root);
        if (root.querySelectorAll) {
          root.querySelectorAll(SCOPE).forEach(add);
        }
      } else if (root.parentElement) {
        var scope = root.parentElement.closest(SCOPE);
        if (scope) add(scope);
      }
    });
    return found;
  }

  function annotate(roots) {
    if (!reader) return;
    var hanHira = /\p{sc=Han}\p{sc=Hiragana}/u;
    var scoped = scopeRoots(roots);
    if (!scoped.length) return;
    textsIn(scoped).forEach(function (text) {
      var value = text.nodeValue || "";
      if (!hanHira.test(value)) return;
      if (text.parentElement.closest(SKIP)) return;
      // Must sit inside a scope (guards nested chrome accidentally walked)
      if (!text.parentElement.closest(SCOPE)) return;
      var matches = reader.find(value);
      for (var i = matches.length - 1; i >= 0; i--) {
        var m = matches[i];
        var run = m.at ? text.splitText(m.at) : text;
        if (m.at) pieces.add(run);
        if (run.length > m.length) pieces.add(run.splitText(m.length));
        var span = document.createElement("span");
        span.dataset.furifontReading = m.reading;
        span.dataset.furifontSalt = String(m.salt);
        run.replaceWith(span);
        span.append(run);
      }
    });
  }

  function quietly(work) {
    if (observer) {
      observer.takeRecords();
    }
    work();
    if (observer) {
      observer.takeRecords();
    }
  }

  function allScopes() {
    return Array.prototype.slice.call(document.querySelectorAll(SCOPE));
  }

  function scheduleAnnotate(roots) {
    if (annotateTimer) clearTimeout(annotateTimer);
    annotateTimer = setTimeout(function () {
      annotateTimer = null;
      quietly(function () {
        annotate(roots && roots.length ? roots : allScopes());
      });
    }, 200);
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (annotateTimer) {
      clearTimeout(annotateTimer);
      annotateTimer = null;
    }
  }

  function startObserver() {
    stopObserver();
    if (!document.body) return;
    observer = new MutationObserver(function (records) {
      if (getMode() === "off" || !reader) return;
      var roots = [];
      records.forEach(function (record) {
        if (record.type === "characterData") {
          roots.push(record.target);
        } else {
          record.addedNodes.forEach(function (n) {
            roots.push(n);
          });
        }
      });
      if (roots.length) scheduleAnnotate(roots);
    });
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  function syncFamilyFromTheme() {
    var theme =
      document.documentElement.getAttribute("data-theme") || "light";
    var schemes = defaultSchemes;
    try {
      var raw = document.documentElement.getAttribute("data-furifont-schemes");
      if (raw) schemes = Object.assign({}, defaultSchemes, JSON.parse(raw));
    } catch (e) {}
    var family = schemes[theme] || "serif";
    if (family !== "sans" && family !== "serif") family = "serif";
    document.documentElement.setAttribute("data-furifont-family", family);
    return family;
  }

  function applyFurigana(mode) {
    if (modes.indexOf(mode) === -1) mode = "off";
    document.documentElement.setAttribute("data-furigana", mode);
    try {
      localStorage.setItem(furiganaKey, mode);
    } catch (e) {}

    document.querySelectorAll("[data-furigana-set]").forEach(function (btn) {
      var active = btn.getAttribute("data-furigana-set") === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-current", active ? "true" : "false");
    });

    var glyphs = { off: "⊘", hiragana: "あ", romaji: "A" };
    document
      .querySelectorAll("[data-furigana-summary-label]")
      .forEach(function (el) {
        el.textContent = glyphs[mode] || "⊘";
      });

    var family = syncFamilyFromTheme();

    if (mode === "off") {
      latest++;
      reader = null;
      stopObserver();
      quietly(unwrap);
      return;
    }

    loadReader(mode, family)
      .then(function (loaded) {
        if (!loaded || getMode() === "off") return;
        reader = loaded;
        quietly(function () {
          unwrap();
          annotate(allScopes());
        });
        startObserver();
      })
      .catch(function () {
        /* okurigana is a bonus — furigana font still works */
      });
  }

  // Expose for theme changes in main.js
  window.engawaFurifont = {
    apply: applyFurigana,
    syncFamily: function () {
      var mode = getMode();
      var before = getFamily();
      var after = syncFamilyFromTheme();
      if (mode === "off") return;
      if (before !== after || activeIvsKey !== after + ":" + mode) {
        applyFurigana(mode);
      }
    },
    getMode: getMode,
  };

  function boot() {
    var mode = getMode();
    applyFurigana(mode);

    document.querySelectorAll("[data-furigana-set]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        applyFurigana(btn.getAttribute("data-furigana-set"));
        var details = btn.closest("details");
        if (details) details.removeAttribute("open");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
