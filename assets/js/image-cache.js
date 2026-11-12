/* Cache foto profil pada browser setelah berhasil dimuat pertama kali. */
(() => {
  const CACHE_KEY = "siti-profile-image-v1";
  const images = document.querySelectorAll("[data-profile-image]");
  if (!images.length) return;

  let cached = null;
  try { cached = localStorage.getItem(CACHE_KEY); } catch (_) {}

  if (cached) {
    images.forEach(img => { img.src = cached; });
    return;
  }

  images.forEach(img => {
    img.addEventListener("load", () => {
      if (img.dataset.cachedOnce) return;
      img.dataset.cachedOnce = "true";
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const data = canvas.toDataURL("image/jpeg", 0.82);
        localStorage.setItem(CACHE_KEY, data);
        images.forEach(other => { if (other !== img) other.src = data; });
      } catch (_) {
        /* Penyimpanan bisa gagal untuk gambar lintas domain; halaman tetap berjalan. */
      }
    }, { once: true });
  });
})();
