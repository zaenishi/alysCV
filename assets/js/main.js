/*
 * Siti Alawiyah — main.js
 * Tema, scroll progress, state header, reveal-on-scroll, menu mobile, active nav.
 * Setiap fitur dijalankan terpisah (run) agar satu error tidak menghentikan fitur lain.
 * Aman dipakai di halaman yang tidak memiliki elemen tertentu.
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const THEME_KEY = "siti-theme";
  const THEME_COLORS = { light: "#f4eee6", dark: "#1b1c19" };

  const noopQuery = { matches: false, addEventListener() {}, addListener() {} };
  const mq = (query) => (window.matchMedia ? window.matchMedia(query) : noopQuery);
  const listen = (query, fn) => {
    if (query.addEventListener) query.addEventListener("change", fn);
    else if (query.addListener) query.addListener(fn);
  };

  const prefersDark = mq("(prefers-color-scheme: dark)");
  const prefersReduced = mq("(prefers-reduced-motion: reduce)");
  const finePointer = mq("(hover: hover) and (pointer: fine)");

  const run = (name, fn) => {
    try { fn(); } catch (err) {
      if (window.console) console.warn("[portfolio] " + name + " gagal:", err);
    }
  };

  /* ---------- Tema ---------- */
  function initTheme() {
    const toggle = document.getElementById("themeToggle");
    const meta = document.querySelector('meta[name="theme-color"]');
    let animTimer = 0;

    const stored = () => {
      try {
        const value = localStorage.getItem(THEME_KEY);
        return value === "dark" || value === "light" ? value : null;
      } catch (_) { return null; }
    };
    const systemTheme = () => (prefersDark.matches ? "dark" : "light");
    const current = () => (root.dataset.theme === "dark" ? "dark" : "light");

    const apply = (theme, animate) => {
      if (animate && !prefersReduced.matches) {
        root.classList.add("theme-anim");
        clearTimeout(animTimer);
        animTimer = setTimeout(() => root.classList.remove("theme-anim"), 500);
      }
      root.dataset.theme = theme;
      if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
      if (toggle) {
        toggle.setAttribute("aria-pressed", String(theme === "dark"));
        toggle.title = theme === "dark" ? "Beralih ke mode terang" : "Beralih ke mode gelap";
      }
    };

    apply(stored() || systemTheme(), false);

    if (toggle) {
      toggle.addEventListener("click", () => {
        const next = current() === "dark" ? "light" : "dark";
        apply(next, true);
        try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
      });
    }

    // Ikuti perubahan tema sistem selama pengguna belum memilih sendiri.
    listen(prefersDark, () => { if (!stored()) apply(systemTheme(), true); });
    // Sinkron antar-tab.
    window.addEventListener("storage", (event) => {
      if (event.key === THEME_KEY) apply(stored() || systemTheme(), true);
    });
  }

  /* ---------- Tahun footer ---------- */
  function initYear() {
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------- Menu mobile ---------- */
  function initMenu() {
    const button = document.getElementById("menuToggle");
    const panel = document.getElementById("mobileNav");
    if (!button || !panel) return;

    const isOpen = () => panel.classList.contains("is-open");
    const setOpen = (open, returnFocus) => {
      panel.classList.toggle("is-open", open);
      button.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
      if (!open && returnFocus) button.focus();
    };

    button.addEventListener("click", () => setOpen(!isOpen()));
    panel.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) setOpen(false, true);
    });
    document.addEventListener("click", (event) => {
      if (isOpen() && !panel.contains(event.target) && !button.contains(event.target)) setOpen(false);
    });
    const desktop = mq("(min-width: 981px)");
    listen(desktop, () => { if (desktop.matches) setOpen(false); });
  }

  /* ---------- Scroll: progress, header, back-to-top, parallax, active nav ---------- */
  function initScrollEffects() {
    const header = document.querySelector(".site-header");
    const progress = document.getElementById("scrollProgress");
    const backTop = document.querySelector(".back-top");
    const heroVisual = document.querySelector(".hero-visual");

    const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]')];
    const sections = [];
    navLinks.forEach((link) => {
      const id = link.getAttribute("href").slice(1);
      const el = id ? document.getElementById(id) : null;
      if (el && !sections.some((s) => s.id === id)) sections.push({ id, el });
    });
    sections.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

    let ticking = false;
    let lastShift = -1;
    let lastActive = null;

    const parallaxOn = () => !prefersReduced.matches && finePointer.matches;

    const update = () => {
      ticking = false;
      const y = window.pageYOffset || root.scrollTop || 0;
      const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);

      if (header) header.classList.toggle("is-scrolled", y > 8);
      if (progress) progress.style.setProperty("--progress", (maxScroll ? Math.min(1, y / maxScroll) : 0).toFixed(4));
      if (backTop) backTop.classList.toggle("is-visible", y > 600);

      if (heroVisual) {
        const shift = parallaxOn() ? Math.min(Math.round(y), 800) : 0;
        if (shift !== lastShift) {
          lastShift = shift;
          heroVisual.style.setProperty("--hero-shift", String(shift));
        }
      }

      if (sections.length) {
        const headerH = header ? header.offsetHeight : 76;
        const probe = y + headerH + window.innerHeight * 0.3;
        let activeId = "";
        sections.forEach((s) => {
          if (s.el.getBoundingClientRect().top + y <= probe) activeId = s.id;
        });
        if (maxScroll && y >= maxScroll - 4) activeId = sections[sections.length - 1].id;

        if (activeId !== lastActive) {
          lastActive = activeId;
          navLinks.forEach((link) => {
            const on = link.getAttribute("href") === "#" + activeId;
            link.classList.toggle("active", on);
            if (on) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }
      }
    };

    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    window.addEventListener("load", requestUpdate);
    listen(prefersReduced, requestUpdate);
    update();
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    // Penanda untuk fallback di <head>: JS utama berjalan, elemen tidak perlu dipaksa tampil.
    root.classList.add("reveal-ready");

    const targets = [...document.querySelectorAll("[data-reveal]")];
    if (!targets.length) return;

    // Setelah animasi selesai, lepaskan atribut agar hover/transform komponen kembali normal.
    const finish = (el) => {
      el.removeAttribute("data-reveal");
      el.classList.remove("is-visible");
      el.style.removeProperty("--d");
    };

    if (prefersReduced.matches || !("IntersectionObserver" in window)) {
      targets.forEach(finish);
      return;
    }

    const STEP = 70;
    const MAX_STEPS = 6;
    let pending = targets.length;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);

      visible.forEach((entry, index) => {
        const el = entry.target;
        observer.unobserve(el);
        const delay = Math.min(index, MAX_STEPS) * STEP;
        el.style.setProperty("--d", delay + "ms");
        el.classList.add("is-visible");
        window.setTimeout(() => finish(el), delay + 1000);
        pending -= 1;
      });

      if (pending <= 0) observer.disconnect();
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    targets.forEach((el) => observer.observe(el));
  }

  const start = () => {
    run("tema", initTheme);
    run("tahun", initYear);
    run("menu", initMenu);
    run("scroll", initScrollEffects);
    run("reveal", initReveal);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
