(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isDesktop = window.matchMedia("(min-width: 861px)");
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ======================================================================
     1) Nav indicator — kayan gösterge + scroll-spy
     ====================================================================== */
  (function navIndicator() {
    var nav = document.querySelector(".main-nav");
    var indicator = document.querySelector(".nav-indicator");
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
    if (!nav || !indicator || !links.length) return;

    var activeLink = null;

    function place(link) {
      if (!link || !isDesktop.matches) {
        indicator.classList.remove("is-visible");
        return;
      }
      indicator.style.left = link.offsetLeft + "px";
      indicator.style.width = link.offsetWidth + "px";
      indicator.classList.add("is-visible");
    }

    function setActive(link) {
      links.forEach(function (l) { l.classList.remove("active"); });
      if (link) link.classList.add("active");
      activeLink = link;
    }

    links.forEach(function (link) {
      link.addEventListener("mouseenter", function () { place(link); });
      link.addEventListener("click", function () { setActive(link); place(link); });
    });

    nav.addEventListener("mouseleave", function () { place(activeLink); });

    window.addEventListener("resize", function () { place(activeLink); });

    /* Scroll-spy: görünür bölüme göre aktif menü öğesini belirle */
    var sections = links
      .map(function (link) {
        var id = link.getAttribute("data-section");
        var section = id && document.getElementById(id);
        return section ? { link: link, section: section } : null;
      })
      .filter(Boolean);

    if (sections.length && "IntersectionObserver" in window) {
      var spy = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var match = sections.find(function (s) { return s.section === entry.target; });
              if (match) {
                setActive(match.link);
                place(match.link);
              }
            }
          });
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
      );
      sections.forEach(function (s) { spy.observe(s.section); });
    }
  })();

  /* ======================================================================
     2) Scroll ile fade-in / slide-up (Intersection Observer)
     ====================================================================== */
  (function scrollReveal() {
    var selector = [
      ".section-header", ".dark-block-head", ".card", ".dark-card", ".feature-card", ".about-visual",
      ".about-text", ".region-card", ".testimonial-card", ".faq-item", ".stat-block",
      ".contact-info-card", ".contact-form-card"
    ].join(", ");

    var items = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!items.length) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("reveal", "in-view"); });
      return;
    }

    var parentIndex = new Map();
    items.forEach(function (el) {
      el.classList.add("reveal");
      var parent = el.parentElement;
      var idx = parentIndex.get(parent) || 0;
      el.style.setProperty("--reveal-delay", Math.min(idx * 90, 360) + "ms");
      parentIndex.set(parent, idx + 1);
    });

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  })();

  /* ======================================================================
     3) Sayaç animasyonu (0'dan hedefe)
     ====================================================================== */
  (function counterAnimations() {
    var counterEls = Array.prototype.slice.call(document.querySelectorAll(".counter"));
    if (!counterEls.length) return;

    function animateCounter(el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";

      if (reducedMotion) {
        el.textContent = prefix + target + suffix;
        return;
      }

      var duration = 1200;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.floor(eased * target);
        el.textContent = prefix + value + suffix;
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = prefix + target + suffix;
        }
      }
      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counterEls.forEach(animateCounter);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counterEls.forEach(function (el) { observer.observe(el); });
  })();

  /* ======================================================================
     4) Hero görsel carousel — otomatik geçiş + ok/nokta kontrolleri
     ====================================================================== */
  (function heroCarousel() {
    var hero = document.querySelector(".hero");
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    var prevBtn = document.querySelector(".hero-arrow--prev");
    var nextBtn = document.querySelector(".hero-arrow--next");
    if (!hero || slides.length < 2) return;

    var current = 0;
    var timer = null;
    var AUTO_MS = 6000;

    function goTo(index) {
      index = (index + slides.length) % slides.length;
      if (index === current) return;
      slides[current].classList.remove("is-active");
      dots[current] && dots[current].classList.remove("is-active");
      dots[current] && dots[current].setAttribute("aria-selected", "false");
      current = index;
      slides[current].classList.add("is-active");
      dots[current] && dots[current].classList.add("is-active");
      dots[current] && dots[current].setAttribute("aria-selected", "true");
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAuto() {
      if (reducedMotion) return;
      stopAuto();
      timer = window.setInterval(next, AUTO_MS);
    }
    function stopAuto() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    prevBtn && prevBtn.addEventListener("click", function () { prev(); startAuto(); });
    nextBtn && nextBtn.addEventListener("click", function () { next(); startAuto(); });
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        goTo(parseInt(dot.getAttribute("data-goto"), 10) || 0);
        startAuto();
      });
    });

    hero.addEventListener("mouseenter", stopAuto);
    hero.addEventListener("mouseleave", startAuto);

    startAuto();
  })();

  /* ======================================================================
     5) Scroll ilerleme çubuğu
     ====================================================================== */
  (function scrollProgress() {
    var bar = document.querySelector(".scroll-progress");
    if (!bar) return;

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = height > 0 ? (scrollTop / height) * 100 : 0;
      bar.style.width = pct + "%";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  /* ======================================================================
     6) Kartlarda imleci takip eden ışık (spotlight)
     ====================================================================== */
  (function spotlight() {
    if (reducedMotion || !canHover) return;
    var targets = document.querySelectorAll(".card, .feature-card, .testimonial-card, .dark-card");
    targets.forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width * 100) + "%");
        el.style.setProperty("--my", ((e.clientY - rect.top) / rect.height * 100) + "%");
      });
    });
  })();

  /* ======================================================================
     7) Hizmet kartlarında hafif 3D tilt (sadece mouse ile, masaüstü)
     ====================================================================== */
  (function tilt() {
    if (reducedMotion || !canHover) return;
    var cards = document.querySelectorAll(".dark-grid .dark-card");
    var maxTilt = 6;
    var raf = null;

    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        if (raf) return;
        raf = window.requestAnimationFrame(function () {
          var rect = card.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width - 0.5;
          var y = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform =
            "translateY(-6px) rotateX(" + (-y * maxTilt).toFixed(2) + "deg) rotateY(" + (x * maxTilt).toFixed(2) + "deg)";
          raf = null;
        });
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "translateY(0) rotateX(0) rotateY(0)";
      });
    });
  })();
})();
