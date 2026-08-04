# Frontend — Sistem Antrian Online Donor Darah

UI statis (HTML/CSS/JavaScript murni, tanpa build tool) yang memanggil langsung
REST API CodeIgniter yang sudah ada di project ini. Dibuat mengikuti ruang
lingkup dan bahasa pada `FRD_Antrian_Online_Donor_Darah.docx`.

## Isi folder
```
frontend/
├── index.html      -> Situs untuk pendonor (publik + area setelah login)
├── admin.html       -> Panel untuk Petugas Loket / Admin UDD / Super Admin
├── css/style.css    -> Design system bersama (tema "tiket antrian")
└── js/
    ├── api.js       -> Klien kecil ke REST API + penyimpanan token (sessionStorage)
    ├── app.js        -> Logic SPA untuk index.html
    └── admin.js      -> Logic SPA untuk admin.html
```

## Cara menjalankan
1. Jalankan backend CodeIgniter seperti biasa (Apache/Nginx/`php -S`), pastikan
   database sudah di-setup sesuai skema di `8. Kebutuhan Data` pada FRD.
2. Buka `frontend/index.html` dan `frontend/admin.html`, lalu sesuaikan
   `window.__API_BASE_URL__` di bagian `<script>` paling atas dengan alamat
   backend kamu (default: `http://sistem-antrian-donor.test`).
3. Buka `frontend/index.html` lewat web server (disarankan, bukan `file://`)
   supaya `fetch()` tidak diblokir kebijakan CORS browser — misalnya:
   ```bash
   cd frontend && python3 -m http.server 5500
   ```
   lalu akses `http://localhost:5500`.
4. CORS pada backend sudah diaktifkan (`index.php`) supaya bisa diakses dari
   origin/port berbeda dari backend.

## Halaman yang tersedia

**`index.html` (Pendonor)** — mengikuti Modul 4.1–4.3 FRD:
- Beranda, Cari Jadwal Donor (FR-3.1/3.3), Lokasi Donor (FR-3.2)
- Daftar Akun + Verifikasi OTP (FR-1.1), Masuk (FR-1.2)
- Lupa/Atur Ulang Kata Sandi (FR-1.3)
- Dasbor, Profil & Data Kesehatan (FR-2.1), Kuesioner Kesehatan (FR-2.2),
  Kartu Donor Digital (FR-2.3), Kelola Perangkat/Sesi (FR-1.4)

**`admin.html` (Petugas/Admin)** — mengikuti Modul 4.7 FRD:
- Masuk internal (role Petugas Loket / Admin UDD / Super Admin)
- Kelola Jadwal & Kuota (FR-7.1)
- Kelola Lokasi Donor (FR-7.4)

## Yang belum ada UI-nya (karena backend-nya juga belum ada)
Sesuai catatan di kode backend, modul berikut belum diimplementasikan di
sisi server sehingga sengaja belum dibuatkan UI-nya: Ambil Nomor Antrian
Online & E-Ticket QR (FR-4.x), Tracking Antrian Real-Time (FR-5.x),
Notifikasi (FR-6.x), Panggil Antrian/Check-in oleh petugas (FR-7.2, FR-7.3),
Riwayat & Sertifikat Donor (FR-8.x), dan Dashboard/Laporan (FR-9.x). Begitu
endpoint-endpoint ini tersedia di backend, UI-nya bisa ditambahkan mengikuti
pola yang sama seperti view-view yang sudah ada di `app.js`/`admin.js`.
