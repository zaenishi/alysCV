/*
 * Cache foto profil secara aman.
 *
 * Catatan:
 * - localStorage bukan pengganti cache file/CDN untuk foto besar.
 * - Placeholder SVG tidak diproses ke canvas.
 * - Ukuran data URL dibatasi.
 * - Jika canvas tainted, storage penuh, atau gambar gagal dimuat,
 *   halaman tetap memakai URL asli atau placeholder.
 */
(() => {
  'use strict';

  const CACHE_KEY = 'siti-profile-image';
  const CACHE_VERSION = 2;
  const STORAGE_KEY = CACHE_KEY + '-v' + CACHE_VERSION;
  const MAX_DATA_URL_LENGTH = 220000; // ~165 KB biner
  const PLACEHOLDER = 'assets/images/profile-placeholder.svg';

  const images = Array.from(document.querySelectorAll('[data-profile-image]'));
  if (!images.length) return;

  const isPlaceholder = (url) => typeof url === 'string' && /profile-placeholder\.svg(?:[?#]|$)/i.test(url);
  const isSvg = (url) => typeof url === 'string' && /\.svg(?:[?#]|$)/i.test(url);

  images.forEach((img) => {
    if (!img.hasAttribute('data-original-src')) {
      img.setAttribute('data-original-src', img.getAttribute('src') || '');
    }
  });

  images.forEach((img) => {
    img.addEventListener('error', () => {
      const original = img.getAttribute('data-original-src') || '';
      const current = img.getAttribute('src') || '';

      if (current.indexOf('data:') === 0 && original && original !== current) {
        img.src = original;
        return;
      }

      if (img.dataset.fallbackApplied === '1') return;
      img.dataset.fallbackApplied = '1';

      if (original && !isPlaceholder(original)) {
        img.removeAttribute('srcset');
        img.src = PLACEHOLDER;
      } else {
        img.classList.add('is-broken');
      }
    });
  });

  let cached = null;
  try {
    cached = localStorage.getItem(STORAGE_KEY);
  } catch (_) {
    cached = null;
  }

  if (cached && cached.indexOf('data:image/') === 0 && cached.length <= MAX_DATA_URL_LENGTH) {
    images.forEach((img) => {
      img.src = cached;
    });
    return;
  }

  images.forEach((img) => {
    const source = img.getAttribute('src');
    if (isPlaceholder(source) || isSvg(source)) return;

    const onLoad = () => {
      if (img.dataset.cacheAttempted === '1') return;
      img.dataset.cacheAttempted = '1';

      try {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        if (!width || !height) return;

        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const canvasWidth = Math.max(1, Math.round(width * scale));
        const canvasHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const context = canvas.getContext('2d');
        if (!context) return;

        context.drawImage(img, 0, 0, canvasWidth, canvasHeight);

        let dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        } catch (_) {
          return; // canvas tainted
        }

        if (!dataUrl || dataUrl.indexOf('data:image/') !== 0) return;
        if (dataUrl.length < 128 || dataUrl.length > MAX_DATA_URL_LENGTH) return;

        try {
          localStorage.setItem(STORAGE_KEY, dataUrl);
        } catch (_) {
          /* Kuota penuh atau storage diblokir: abaikan. */
        }
      } catch (_) {
        /* Jangan biarkan cache menghentikan halaman. */
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      onLoad();
    } else {
      img.addEventListener('load', onLoad, { once: true });
    }
  });
})();