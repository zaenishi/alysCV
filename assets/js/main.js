(() => {
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");
  const storedTheme = (() => { try { return localStorage.getItem("siti-theme"); } catch (_) { return null; } })();

  if (storedTheme === "dark") document.body.classList.add("dark-mode");
  if (toggle) {
    toggle.textContent = document.body.classList.contains("dark-mode") ? "☼" : "◐";
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const dark = document.body.classList.contains("dark-mode");
      toggle.textContent = dark ? "☼" : "◐";
      try { localStorage.setItem("siti-theme", dark ? "dark" : "light"); } catch (_) {}
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll(".desktop-nav a")];
  if ("IntersectionObserver" in window && navLinks.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    sections.forEach(section => observer.observe(section));
  }
})();
