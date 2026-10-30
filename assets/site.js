(function () {
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var links = Array.prototype.slice.call(document.querySelectorAll(".steps a"));
  var bar = document.getElementById("progress");
  var currentId = "";

  function setCurrent(id) {
    if (!id || id === currentId) return;
    currentId = id;
    links.forEach(function (a) {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    var active = document.querySelector('.steps a[href="#' + id + '"]');
    var mobile = window.matchMedia("(max-width: 1079px)").matches;
    var scroller = document.querySelector(mobile ? ".steps ol" : ".steps");
    if (!active || !scroller) return;
    var aRect = active.getBoundingClientRect();
    var sRect = scroller.getBoundingClientRect();
    if (mobile) {
      if (aRect.left < sRect.left + 8 || aRect.right > sRect.right - 8) {
        scroller.scrollBy({ left: aRect.left - sRect.left - 16, behavior: "auto" });
      }
    } else if (aRect.top < sRect.top + 8 || aRect.bottom > sRect.bottom - 8) {
      scroller.scrollBy({ top: aRect.top - sRect.top - 16, behavior: "auto" });
    }
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setCurrent(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (section) { observer.observe(section); });
  }

  function onScroll() {
    var root = document.documentElement;
    var max = root.scrollHeight - root.clientHeight;
    var p = max > 0 ? (root.scrollTop / max) * 100 : 0;
    if (bar) bar.style.width = p + "%";
    if (root.scrollTop + window.innerHeight >= root.scrollHeight - 4 && sections.length) {
      setCurrent(sections[sections.length - 1].id);
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var shots = Array.prototype.slice.call(document.querySelectorAll("button.shot"));
  var dialog = document.getElementById("lightbox");
  var img = document.getElementById("lb-img");
  var cap = document.getElementById("lb-cap");
  var count = document.getElementById("lb-count");
  var index = 0;

  function show(i) {
    if (!shots.length) return;
    index = (i + shots.length) % shots.length;
    var source = shots[index].querySelector("img");
    var caption = shots[index].closest("figure");
    caption = caption ? caption.querySelector("figcaption") : null;
    img.src = source.currentSrc || source.src;
    img.alt = source.alt;
    cap.textContent = caption ? caption.textContent : source.alt;
    count.textContent = (index + 1) + " of " + shots.length;
    if (!dialog.open) dialog.showModal();
  }

  shots.forEach(function (btn, i) {
    btn.addEventListener("click", function () { show(i); });
  });

  document.getElementById("lb-close").addEventListener("click", function () { dialog.close(); });
  document.getElementById("lb-prev").addEventListener("click", function () { show(index - 1); });
  document.getElementById("lb-next").addEventListener("click", function () { show(index + 1); });

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") { event.preventDefault(); show(index + 1); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); show(index - 1); }
  });

  dialog.addEventListener("close", function () { img.removeAttribute("src"); });
})();
