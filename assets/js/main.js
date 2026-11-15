(function () {
  "use strict";

  var prefKey = "engawa-theme-pref";
  var legacyKey = "engawa-theme";
  var sizeKey = "engawa-content-size";
  var fallbackPrefs = ["auto", "light", "dark"];
  var sizes = ["compact", "comfort", "large"];
  var sizeLabels = { compact: "S", comfort: "M", large: "L" };

  // head.html emits comma lists (or JSON arrays). Prefer live attribute so
  // custom schemes from params are never dropped by a stale fallback.
  function listAttr(name, fallback) {
    var raw = document.documentElement.getAttribute(name);
    if (!raw) return fallback;
    var s = String(raw).replace(/^\s+|\s+$/g, "");
    if (s.charAt(0) === "[") {
      try {
        var v = JSON.parse(s);
        if (Array.isArray(v) && v.length) return v;
      } catch (e) {}
    }
    var parts = s.split(",");
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].replace(/^\s+|\s+$/g, "");
      if (p) out.push(p);
    }
    return out.length ? out : fallback;
  }

  function getPrefs() {
    return listAttr("data-theme-prefs", fallbackPrefs);
  }

  function systemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function resolveTheme(pref) {
    var prefs = getPrefs();
    if (pref === "auto") return systemTheme();
    if (prefs.indexOf(pref) !== -1 && pref !== "auto") return pref;
    return "light";
  }

  function getStoredPref() {
    var prefs = getPrefs();
    try {
      var p = localStorage.getItem(prefKey);
      if (prefs.indexOf(p) !== -1) return p;
      var legacy = localStorage.getItem(legacyKey);
      if (legacy && prefs.indexOf(legacy) !== -1) {
        return legacy;
      }
    } catch (e) {}
    return "auto";
  }

  function applyThemePref(pref) {
    var prefs = getPrefs();
    if (prefs.indexOf(pref) === -1) pref = "auto";
    var resolved = resolveTheme(pref);
    document.documentElement.setAttribute("data-theme-pref", pref);
    document.documentElement.setAttribute("data-theme", resolved);
    try {
      localStorage.setItem(prefKey, pref);
      localStorage.setItem(legacyKey, resolved);
    } catch (e) {}

    document.querySelectorAll("[data-theme-set]").forEach(function (btn) {
      var active = btn.getAttribute("data-theme-set") === pref;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-current", active ? "true" : "false");
    });

    var labels = {
      auto: "Auto",
      light: "Light",
      dark: "Dark",
    };
    document.querySelectorAll("[data-theme-summary-label]").forEach(function (el) {
      // Prefer i18n text already on the matching option button
      var opt = document.querySelector(
        '[data-theme-set="' + pref + '"]'
      );
      el.textContent = opt ? opt.textContent.trim() : labels[pref] || pref;
    });

    // Align Disqus host frame + light/dark preference with scheme (Disqus has no custom palette)
    syncDisqusChrome(resolved);

    // Furifont Sans/Serif follows the resolved scheme
    if (window.engawaFurifont && typeof window.engawaFurifont.syncFamily === "function") {
      window.engawaFurifont.syncFamily();
    }
  }

  // Disqus only has light/dark UI. Panel host sets solid bg + color; Auto re-samples on reload.
  function syncDisqusChrome(theme) {
    var panel = document.querySelector(".comments__panel");
    var thread = document.getElementById("disqus_thread");
    if (!thread && !panel) return;

    var darkish = listAttr("data-theme-darkish", ["dark"]).indexOf(theme) !== -1;
    var scheme = darkish ? "dark" : "light";
    if (panel) panel.style.colorScheme = scheme;
    if (thread) thread.style.colorScheme = scheme;

    try {
      if (window.DISQUS && thread) {
        var id =
          document.documentElement.getAttribute("data-disqus-id") ||
          window.location.pathname;
        // Strip accidental surrounding quotes from older double-encoded builds
        if (id.length >= 2 && id.charAt(0) === '"' && id.charAt(id.length - 1) === '"') {
          id = id.slice(1, -1);
        }
        window.DISQUS.reset({
          reload: true,
          config: function () {
            this.page.url = window.location.href;
            this.page.identifier = id;
          },
        });
      }
    } catch (e) {}
  }

  function applyContentSize(size) {
    if (sizes.indexOf(size) === -1) size = "compact";
    document.documentElement.setAttribute("data-content-size", size);
    try {
      localStorage.setItem(sizeKey, size);
    } catch (e) {}

    document.querySelectorAll("[data-content-size-set]").forEach(function (btn) {
      var active = btn.getAttribute("data-content-size-set") === size;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-current", active ? "true" : "false");
    });

    document.querySelectorAll("[data-content-size-label]").forEach(function (el) {
      el.textContent = sizeLabels[size] || "S";
    });

    syncHeaderStackHeight();
  }

  // Measure sticky header stack (main row + optional utility bar, not open mobile drawer)
  // so sidebar sticky top clears the second bar correctly.
  function syncHeaderStackHeight() {
    var stack = document.querySelector(".site-header-stack");
    if (!stack) return;
    var h = 0;
    var row = stack.querySelector(".site-header__inner");
    var main = stack.querySelector(".site-header");
    var bar = stack.querySelector(".header-bar");
    if (row) {
      h += row.getBoundingClientRect().height;
      if (main) {
        var cs = window.getComputedStyle(main);
        h += (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
      }
    } else if (main) {
      // fallback: full header minus open mobile nav
      var mobile = main.querySelector(".site-nav-mobile");
      var mH = mobile && mobile.classList.contains("is-open") ? mobile.getBoundingClientRect().height : 0;
      h += main.getBoundingClientRect().height - mH;
    }
    if (bar) {
      h += bar.getBoundingClientRect().height;
    }
    if (h > 0) {
      document.documentElement.style.setProperty(
        "--header-stack-height",
        Math.ceil(h) + "px"
      );
    }
  }

  // Early apply if head script didn't run fully
  if (!document.documentElement.getAttribute("data-theme-pref")) {
    applyThemePref(getStoredPref());
  }

  if (!document.documentElement.getAttribute("data-content-size")) {
    var s = null;
    try {
      s = localStorage.getItem(sizeKey);
    } catch (e) {}
    applyContentSize(s || "compact");
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyThemePref(
      document.documentElement.getAttribute("data-theme-pref") || getStoredPref()
    );
    applyContentSize(
      document.documentElement.getAttribute("data-content-size") || "compact"
    );
    syncHeaderStackHeight();

    document.querySelectorAll("[data-theme-set]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        applyThemePref(btn.getAttribute("data-theme-set"));
        var details = btn.closest("details");
        if (details) details.removeAttribute("open");
        // Fonts/chrome may reflow after scheme change
        window.requestAnimationFrame(syncHeaderStackHeight);
      });
    });

    // Follow system changes while in Auto
    try {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", function () {
          var pref =
            document.documentElement.getAttribute("data-theme-pref") || "auto";
          if (pref === "auto") applyThemePref("auto");
        });
    } catch (e) {}

    document.querySelectorAll("[data-content-size-set]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        applyContentSize(btn.getAttribute("data-content-size-set"));
        var details = btn.closest("details");
        if (details) details.removeAttribute("open");
      });
    });

    var toggle = document.querySelector("[data-nav-toggle]");
    var mobileNav = document.querySelector("[data-mobile-nav]");
    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        var open = mobileNav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        window.requestAnimationFrame(syncHeaderStackHeight);
      });
    }

    window.addEventListener("resize", function () {
      syncHeaderStackHeight();
    });

    // Fonts can change metrics after load
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        syncHeaderStackHeight();
      });
    }

    document.addEventListener("click", function (e) {
      document
        .querySelectorAll(
          "details.lang-switcher[open], details.size-switcher[open], details.theme-switcher[open], details.furigana-switcher[open]"
        )
        .forEach(function (d) {
          if (!d.contains(e.target)) d.removeAttribute("open");
        });
    });
  });
})();
