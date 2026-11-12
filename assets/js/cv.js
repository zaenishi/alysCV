/* Tombol cetak CV. Tombol disembunyikan sampai JS aktif agar tidak ada tombol yang tidak berfungsi. */
(() => {
  "use strict";
  const button = document.getElementById("printButton");
  if (!button) return;
  button.hidden = false;
  button.addEventListener("click", () => {
    try { window.print(); } catch (_) {}
  });
})();
