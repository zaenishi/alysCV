(() => {
  'use strict';

  const root = document.documentElement;
  const THEME_KEY = 'siti-theme';

  /* ----------------------------------------------------------------------
     Theme
     ---------------------------------------------------------------------- */

  const getStoredTheme = () => {
    try {
      const value = localStorage.getItem(THEME_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (_) {
      return null;
    }
  };

  const storeTheme = (value) => {
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch (_) {
      /* Storage bisa diblokir; tema tetap berjalan untuk sesi ini. */
    }
  };

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const themeButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));

  const applyTheme = (theme, persist) => {
    const next = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = next;

    if (persist) storeTheme(next);

    if (themeMeta) {
      themeMeta.setAttribute('content', next === 'dark' ? '#1b1c19' : '#f4eee6');
    }

    themeButtons.forEach((button) => {
      const isDark = next === 'dark';
      button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      button.setAttribute('aria-label', isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
      button.title = isDark ? 'Mode terang' : 'Mode gelap';
    });
  };

  const initialTheme = (() => {
    if (root.dataset.theme === 'dark' || root.dataset.theme === 'light') {
      return root.dataset.theme;
    }

    const stored = getStoredTheme();
    if (stored) return stored;

    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (_) {
      return 'light';
    }
  })();

  applyTheme(initialTheme, false);

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });
  });

  if (window.matchMedia) {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemThemeChange = (event) => {
      if (getStoredTheme()) return;
      applyTheme(event.matches ? 'dark' : 'light', false);
    };

    if (typeof systemTheme.addEventListener === 'function') {
      systemTheme.addEventListener('change', onSystemThemeChange);
    } else if (typeof systemTheme.addListener === 'function') {
      systemTheme.addListener(onSystemThemeChange);
    }
  }

  /* ----------------------------------------------------------------------
     Year
     ---------------------------------------------------------------------- */

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  /* ----------------------------------------------------------------------
     Print
     ---------------------------------------------------------------------- */

  document.querySelectorAll('[data-print]').forEach((button) => {
    button.addEventListener('click', () => {
      window.print();
    });
  });

  /* ----------------------------------------------------------------------
     Mobile menu
     ---------------------------------------------------------------------- */

  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuToggle && mobileNav) {
    const setMenuOpen = (open) => {
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
      mobileNav.classList.toggle('is-open', open);
    };

    menuToggle.addEventListener('click', () => {
      setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 800) setMenuOpen(false);
    }, { passive: true });
  }

  /* ----------------------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------------------- */

  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const revealTargets = Array.from(document.querySelectorAll('[data-reveal]'));

  if (!reduceMotion) {
    document.querySelectorAll('[data-reveal-group]').forEach((group) => {
      const items = Array.from(group.querySelectorAll('[data-reveal]'));
      items.forEach((element, index) => {
        element.style.setProperty('--reveal-delay', Math.min(index * 70, 420) + 'ms');
      });
    });
  }

  const revealAll = () => {
    revealTargets.forEach((element) => element.classList.add('is-revealed'));
    window.__sitiRevealReady = true;
  };

  if (!revealTargets.length) {
    window.__sitiRevealReady = true;
  } else if (reduceMotion || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    try {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px'
      });

      revealTargets.forEach((element) => revealObserver.observe(element));
      window.__sitiRevealReady = true;
    } catch (_) {
      revealAll();
    }
  }

  /* ----------------------------------------------------------------------
     Scroll UI: progress, header state, back to top, active navigation
     ---------------------------------------------------------------------- */

  const progress = document.querySelector('[data-scroll-progress]');
  const header = document.querySelector('[data-header]');
  const backTop = document.querySelector('[data-back-top]');

  const navLinks = Array.from(document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]'));
  const navHrefs = Array.from(new Set(navLinks.map((link) => link.getAttribute('href')).filter((href) => href && href.length > 1)));
  const navSections = navHrefs
    .map((href) => ({ id: href.slice(1), element: document.getElementById(href.slice(1)) }))
    .filter((item) => item.element);

  let ticking = false;

  const updateScrollUI = () => {
    ticking = false;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const docHeight = document.documentElement.scrollHeight;
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const maxScroll = Math.max(1, docHeight - viewport);

    if (progress) {
      const ratio = Math.min(1, Math.max(0, scrollTop / maxScroll));
      progress.style.transform = 'scaleX(' + ratio + ')';
    }

    if (header) {
      header.classList.toggle('is-scrolled', scrollTop > 24);
    }

    if (backTop) {
      backTop.classList.toggle('is-visible', scrollTop > 480);
    }

    if (navSections.length) {
      const probe = scrollTop + (header ? header.offsetHeight : 76) + 90;
      let current = null;
      let currentTop = -Infinity;

      navSections.forEach((item) => {
        const top = item.element.getBoundingClientRect().top + scrollTop;
        if (top <= probe && top > currentTop) {
          currentTop = top;
          current = item;
        }
      });

      const currentId = current ? current.id : null;

      navLinks.forEach((link) => {
        const isActive = !!currentId && link.getAttribute('href') === '#' + currentId;
        link.classList.toggle('active', isActive);

        if (isActive) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollUI);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateScrollUI();
})();