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
Sistem `image-cache.js` menyimpan versi foto di localStorage setelah berhasil dimuat. Cache dapat dihapus dengan membersihkan data situs/browser. Jika foto diganti, ubah versi `siti-profile-image-v1` pada file JS agar cache lama tidak digunakan.

## Catatan data
Konten dibangun dari brief/data awal yang disampaikan, bukan dari variasi informasi di HTML lama. Ejaan nama perusahaan, istilah pekerjaan, nama penerbit sertifikat, dan detail lain dipertahankan sesuai sumber brief; cocokkan ejaan sertifikat dengan dokumen aslinya sebelum dipublikasikan.

## Deploy
Upload seluruh folder ke hosting statis seperti Vercel, Netlify, atau GitHub Pages. Pastikan struktur folder tidak berubah.
