(function () {
  "use strict";

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }

  function resolveIndexUrl(root) {
    if (root && root.getAttribute) {
      var fromRoot = root.getAttribute("data-search-index");
      if (fromRoot) return fromRoot;
    }
    return (
      document.documentElement.getAttribute("data-search-index") ||
      window.engawaSearchIndexUrl ||
      ""
    );
  }

  function initWidget(root, index, opts) {
    var input = root.querySelector("[data-search-input]");
    var results = root.querySelector("[data-search-results]");
    if (!input || !results) return;

    var noResults = opts.noResults || "No results";
    var limit = opts.limit || 8;

    function render(hits) {
      results.innerHTML = "";
      if (!hits.length) {
        results.innerHTML =
          '<div class="search-widget__empty">' + noResults + "</div>";
        results.classList.add("is-open");
        return;
      }
      hits.forEach(function (hit) {
        var a = document.createElement("a");
        a.className = "search-widget__item";
        a.href = hit.permalink;
        a.innerHTML =
          '<span class="title"></span><span class="meta"></span>';
        a.querySelector(".title").textContent = hit.title;
        a.querySelector(".meta").textContent = hit.section || hit.date || "";
        results.appendChild(a);
      });
      results.classList.add("is-open");
    }

    function search(q) {
      q = (q || "").trim().toLowerCase();
      if (q.length < 2) {
        results.classList.remove("is-open");
        results.innerHTML = "";
        return;
      }
      if (!index || !index.length) {
        results.innerHTML =
          '<div class="search-widget__empty">' + noResults + "</div>";
        results.classList.add("is-open");
        return;
      }
      var hits = [];
      for (var i = 0; i < index.length && hits.length < limit; i++) {
        var item = index[i];
        var tags = item.tags || [];
        var hay =
          (item.title || "") +
          " " +
          (item.summary || "") +
          " " +
          (item.content || "") +
          " " +
          (Array.isArray(tags) ? tags.join(" ") : tags);
        if (hay.toLowerCase().indexOf(q) !== -1) hits.push(item);
      }
      render(hits);
    }

    input.addEventListener(
      "input",
      debounce(function () {
        search(input.value);
      }, 180)
    );

    input.addEventListener("focus", function () {
      if (input.value.trim().length >= 2) search(input.value);
    });

    document.addEventListener("click", function (e) {
      if (!root.contains(e.target)) {
        results.classList.remove("is-open");
      }
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        results.classList.remove("is-open");
        input.blur();
      }
    });
  }

  function initPage(root, index, opts) {
    var input = root.querySelector("[data-search-page-input]");
    var list = root.querySelector("[data-search-page-results]");
    if (!input || !list) return;
    var noResults = opts.noResults || "No results";

    function render(hits) {
      list.innerHTML = "";
      if (!hits.length) {
        list.innerHTML = "<li class='empty-state'>" + noResults + "</li>";
        return;
      }
      hits.forEach(function (hit) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = hit.permalink;
        a.textContent = hit.title;
        li.appendChild(a);
        if (hit.summary) {
          var p = document.createElement("p");
          p.className = "post-summary__excerpt";
          p.textContent = hit.summary;
          li.appendChild(p);
        }
        list.appendChild(li);
      });
    }

    input.addEventListener(
      "input",
      debounce(function () {
        var q = input.value.trim().toLowerCase();
        if (q.length < 2) {
          list.innerHTML = "";
          return;
        }
        if (!index || !index.length) {
          list.innerHTML = "<li class='empty-state'>" + noResults + "</li>";
          return;
        }
        var hits = index.filter(function (item) {
          var hay =
            (item.title || "") +
            " " +
            (item.summary || "") +
            " " +
            (item.content || "");
          return hay.toLowerCase().indexOf(q) !== -1;
        });
        render(hits.slice(0, 30));
      }, 180)
    );
  }

  function boot(index) {
    var opts = {
      noResults:
        document.documentElement.getAttribute("data-i18n-no-results") ||
        "No results",
      limit: 8,
    };
    document.querySelectorAll("[data-search-widget]").forEach(function (el) {
      initWidget(el, index, opts);
    });
    document.querySelectorAll("[data-search-page]").forEach(function (el) {
      initPage(el, index, opts);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var widget = document.querySelector("[data-search-widget]");
    var page = document.querySelector("[data-search-page]");
    var url =
      resolveIndexUrl(widget) ||
      resolveIndexUrl(page) ||
      document.documentElement.getAttribute("data-search-index") ||
      "";
    if (!url) return;

    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("search index " + r.status);
        return r.json();
      })
      .then(function (data) {
        boot(Array.isArray(data) ? data : []);
      })
      .catch(function () {
        boot([]);
      });
  });
})();
