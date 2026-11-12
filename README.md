# Portfolio Siti Alawiyah

Website statis dengan dua tampilan:
- `index.html` — creative portfolio.
- `cv.html` — CV formal, dapat dicetak atau disimpan sebagai PDF.

## Menjalankan
Tidak membutuhkan framework atau proses build. Buka `index.html` melalui browser atau jalankan server lokal.

Contoh Termux:
```bash
cd portfolio-siti-alawiyah
python -m http.server 8080
```
Buka `http://127.0.0.1:8080`.

## Foto profil
Ganti `assets/images/profile-placeholder.svg` dengan foto sendiri bernama `profile.jpg`, lalu ubah atribut `src` pada kedua file HTML menjadi:
```html
src="assets/images/profile.jpg"
```
Sistem `image-cache.js` menyimpan versi foto (diperkecil maks. 900px) di localStorage setelah berhasil dimuat, hanya untuk foto sungguhan dari domain yang sama. Placeholder SVG tidak disimpan. Jika foto gagal dimuat, halaman memakai placeholder otomatis. Cache otomatis diabaikan bila `src` berubah; jika nama file foto tetap sama tetapi isinya diganti, ubah `CACHE_VERSION` (`v2`) pada `assets/js/image-cache.js`.

## Tema dan motion
- Tema memakai satu sumber state: `<html data-theme="light|dark">`, mengikuti pilihan tersimpan atau preferensi sistem, tanpa flash saat dimuat.
- Reveal-on-scroll, progress bar, header, dan menu mobile ada di `assets/js/main.js`. Konten tetap tampil jika JS gagal atau `prefers-reduced-motion` aktif.
- `assets/js/cv.js` hanya mengaktifkan tombol cetak di `cv.html`.

## Catatan data
Konten dibangun dari brief/data awal yang disampaikan, bukan dari variasi informasi di HTML lama. Ejaan nama perusahaan, istilah pekerjaan, nama penerbit sertifikat, dan detail lain dipertahankan sesuai sumber brief; cocokkan ejaan sertifikat dengan dokumen aslinya sebelum dipublikasikan.

## Deploy
Upload seluruh folder ke hosting statis seperti Vercel, Netlify, atau GitHub Pages. Pastikan struktur folder tidak berubah.
