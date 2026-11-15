(function () {
  "use strict";

  function init() {
    var figures = Array.prototype.slice.call(
      document.querySelectorAll(".post-figure[data-lightbox], .gallery .post-figure")
    );
    if (!figures.length) return;

    // Also enable lightbox on article images with data-lightbox
    var items = figures
      .map(function (fig) {
        var img = fig.querySelector("img");
        if (!img) return null;
        var dataCap = (fig.getAttribute("data-caption") || "").trim();
        var figCap = "";
        var capEl = fig.querySelector("figcaption");
        if (capEl) figCap = (capEl.textContent || "").trim();
        return {
          figure: fig,
          src: img.getAttribute("data-full") || img.currentSrc || img.src,
          // Prefer explicit caption (title / data-caption), then visible figcaption, then alt
          caption: dataCap || figCap || img.alt || "",
        };
      })
      .filter(Boolean);

    if (!items.length) return;

    var overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML =
      '<div class="lightbox__dialog">' +
      '<button type="button" class="lightbox__close" data-lightbox-close aria-label="Close">&times;</button>' +
      '<button type="button" class="lightbox__nav lightbox__nav--prev" data-lightbox-prev aria-label="Previous">‹</button>' +
      '<img class="lightbox__img" alt="" />' +
      '<button type="button" class="lightbox__nav lightbox__nav--next" data-lightbox-next aria-label="Next">›</button>' +
      '<div class="lightbox__caption"></div>' +
      "</div>";
    document.body.appendChild(overlay);

    var imgEl = overlay.querySelector(".lightbox__img");
    var capEl = overlay.querySelector(".lightbox__caption");
    var prevBtn = overlay.querySelector("[data-lightbox-prev]");
    var nextBtn = overlay.querySelector("[data-lightbox-next]");
    var current = 0;
    var groupItems = items;

    function show(index) {
      if (!groupItems.length) return;
      current = (index + groupItems.length) % groupItems.length;
      var item = groupItems[current];
      imgEl.src = item.src;
      imgEl.alt = item.caption || "";
      capEl.textContent = item.caption || "";
      capEl.hidden = !item.caption;
      var multi = groupItems.length > 1;
      prevBtn.hidden = !multi;
      nextBtn.hidden = !multi;
      overlay.classList.add("is-open");
      document.body.classList.add("lightbox-open");
    }

    function close() {
      overlay.classList.remove("is-open");
      document.body.classList.remove("lightbox-open");
      imgEl.removeAttribute("src");
    }

    items.forEach(function (item, idx) {
      item.figure.addEventListener("click", function (e) {
        e.preventDefault();
        // Scope to gallery siblings if inside .gallery
        var gallery = item.figure.closest(".gallery");
        if (gallery) {
          groupItems = items.filter(function (it) {
            return gallery.contains(it.figure);
          });
          current = groupItems.indexOf(item);
          if (current < 0) current = 0;
        } else {
          groupItems = [item];
          current = 0;
        }
        show(current);
      });
      item.figure.style.cursor = "zoom-in";
      var img = item.figure.querySelector("img");
      if (img) img.style.cursor = "zoom-in";
    });

    overlay.querySelector("[data-lightbox-close]").addEventListener("click", close);
    imgEl.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    prevBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      show(current - 1);
    });
    nextBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      show(current + 1);
    });

    document.addEventListener("keydown", function (e) {
      if (!overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
