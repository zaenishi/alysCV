/*
 * Cache foto profil — opsional dan aman.
 *
 * Catatan jujur: localStorage bukan tempat ideal untuk file gambar (kuota kecil, sinkron).
 * Karena itu foto hanya disimpan jika:
 *   - bukan placeholder SVG,
 *   - berasal dari domain yang sama (canvas tidak "tainted"),
 *   - sudah diperkecil (maks. 900px) dan hasilnya tidak lebih dari ±450 KB.
 * Jika salah satu syarat gagal, halaman tetap memakai URL gambar asli tanpa error.
 *
 * Mengganti foto: ubah atribut src di HTML (cache lama otomatis diabaikan karena URL berbeda)
 * atau naikkan CACHE_VERSION di bawah ini bila nama file foto tetap sama.
 */
(() => {
  "use strict";

  const CACHE_VERSION = "v2";
  const KEY_PREFIX = "siti-profile-image-";
  const CACHE_KEY = KEY_PREFIX + CACHE_VERSION;
  const FALLBACK_SRC = "assets/images/profile-placeholder.svg";
  const MAX_DIMENSION = 900;
  const MAX_CACHE_CHARS = 450000;

  const images = [...document.querySelectorAll("[data-profile-image]")];
  if (!images.length) return;

  const isSvg = (src) => /\.svg(\?|#|$)/i.test(src || "");
  const isDataImage = (value) =>
    typeof value === "string" && value.length > 200 && /^data:image\/(jpeg|png|webp);base64,/.test(value);

  const store = {
    get() { try { return localStorage.getItem(CACHE_KEY); } catch (_) { return null; } },
    set(value) { try { localStorage.setItem(CACHE_KEY, value); return true; } catch (_) { return false; } },
    remove() { try { localStorage.removeItem(CACHE_KEY); } catch (_) {} },
    clearOldVersions() {
      try {
        for (let i = localStorage.length - 1; i >= 0; i -= 1) {
          const key = localStorage.key(i);
          if (key && key.indexOf(KEY_PREFIX) === 0 && key !== CACHE_KEY) localStorage.removeItem(key);
        }
      } catch (_) {}
    }
  };

  store.clearOldVersions();

  let record = null;
  try {
    const raw = store.get();
    record = raw ? JSON.parse(raw) : null;
  } catch (_) { record = null; }
  if (record && (!isDataImage(record.data) || typeof record.src !== "string")) {
    store.remove();
    record = null;
  }

  let cachedOnce = false;

  const cacheImage = (img, originalSrc) => {
    if (cachedOnce) return;
    if (img.dataset.usingCache === "true" || img.dataset.fallback === "true") return;
    if (!img.naturalWidth || !img.naturalHeight) return;
    cachedOnce = true;
    try {
      const ratio = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", 0.82); // melempar error jika canvas tainted
      if (!isDataImage(data) || data.length > MAX_CACHE_CHARS) return;
      store.set(JSON.stringify({ src: originalSrc, data, savedAt: Date.now() }));
    } catch (_) {
      /* Lintas domain / kuota penuh / canvas gagal: abaikan, gambar asli tetap dipakai. */
    }
  };

  images.forEach((img) => {
    const originalSrc = img.getAttribute("src") || "";

    const handleError = () => {
      if (img.dataset.usingCache === "true") {
        // Data cache rusak: buang dan kembali ke URL asli.
        img.dataset.usingCache = "false";
        store.remove();
        img.src = originalSrc;
        return;
      }
      if (img.dataset.fallback !== "true" && !isSvg(img.getAttribute("src"))) {
        img.dataset.fallback = "true";
        img.src = FALLBACK_SRC;
      }
    };
    img.addEventListener("error", handleError);

    // Placeholder SVG tidak perlu diproses / disimpan.
    if (isSvg(originalSrc)) return;

    if (record && record.src === originalSrc) {
      img.dataset.usingCache = "true";
      img.src = record.data;
      return;
    }

    if (img.complete) {
      if (img.naturalWidth) cacheImage(img, originalSrc);
      else handleError();
    } else {
      img.addEventListener("load", () => cacheImage(img, originalSrc), { once: true });
    }
  });
})();
