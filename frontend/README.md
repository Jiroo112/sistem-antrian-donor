# Frontend — Sistem Antrian Online Donor Darah

UI SPA (HTML/CSS/JavaScript murni, tanpa build tool/bundler) yang memanggil
REST API CodeIgniter di project ini lewat `fetch()`. Dibuat mengikuti ruang
lingkup dan bahasa pada `FRD_Antrian_Online_Donor_Darah.docx`. Kedua SPA
(pendonor & internal) memakai ES Modules native browser (`import`/`export`),
jadi setiap file punya scope dan dependensi sendiri yang eksplisit.

## Isi folder
```
frontend/
├── pendonor/                  -> UI untuk pendonor (publik + area setelah login)
│   └── js/
│       ├── main.js             -> composition root: sambungkan router + nav + listener
│       ├── router.js            -> routing History API (routeHref, navigate, resolveView)
│       ├── nav.js                -> render navbar atas
│       ├── guards.js              -> requireAuth()
│       ├── elements.js             -> referensi #app / #nav-slot
│       ├── ui.js                     -> pageHeader(), val()
│       ├── qr.js                      -> render QR code e-ticket (FR-4.2)
│       └── views/                      -> satu file per halaman (home, jadwal, antrian, riwayat, dst)
├── internal/                  -> UI untuk Petugas Loket / Admin UDD / Super Admin
│   └── js/
│       ├── main.js, router.js (History API, prefix /admin), nav.js
│       ├── guards.js            -> requireAuth(), requireRole()
│       ├── permissions.js        -> satu sumber kebenaran akses halaman per peran
│       ├── elements.js, ui.js, session.js
│       └── views/                 -> masuk, jadwal, lokasi, antrian
├── papan-antrian/              -> Papan antrian digital publik (FR-5.4), halaman
│   ├── index.html                 mandiri (bukan bagian SPA pendonor/internal)
│   ├── board.css
│   └── js/main.js
├── css/style.css              -> Design system bersama (tema "tiket antrian")
└── js/
    ├── api.js                  -> Klien REST API + Auth (token), ES module bersama
    │                              dipakai oleh pendonor & internal
    ├── qrcode.js                -> Library QR pihak ketiga yang di-vendor (MIT,
    │                               kazuhikoarase/qrcode-generator), dimuat sebagai
    │                               script klasik (bukan module) -- lihat js/qr.js
    └── shared/
        ├── dom.js                -> el, escapeHtml, toast, setLoading, renderAlertError
        └── format.js             -> format tanggal & badge status antrian
```

Entry point HTML (`pendonor_shell.php`, `admin_shell.php`) ada di
`application/views/`, BUKAN di folder `frontend/` -- lihat bagian "Cara
halaman disajikan" di bawah untuk alasannya.

## Cara halaman disajikan

Dua SPA ini punya rute bersih (tanpa `#`), misalnya `/jadwal` (pendonor) dan
`/admin/lokasi` (internal). Supaya CSS/JS selalu resolve dengan benar di URL
sedalam apa pun -- termasuk saat direfresh langsung di rute yang dalam --
shell HTML-nya **dirender lewat CodeIgniter** (`Pendonor::index()` /
`Panel::index()`, view di `application/views/pendonor_shell.php` /
`admin_shell.php`), yang menyuntikkan `base_url()` dari
`application/config/config.php` ke setiap `<link>`/`<script src>` sebagai
path absolut. Ini satu-satunya bagian yang tidak murni statis; semua modul
JS di folder `frontend/` sendiri tetap file statis biasa yang disajikan
langsung oleh Apache (dicek lewat `RewriteCond %{REQUEST_FILENAME} !-f` di
`.htaccess` -- request ke file yang beneran ada tidak pernah lewat PHP).

Routing-nya: `.htaccess` meneruskan semua request yang bukan file/direktori
asli ke `index.php`, lalu `application/config/routes.php` yang menentukan
controller mana yang menangani -- REST API lewat prefix `/api/*`, panel
internal lewat `/admin` & `/admin/*`, selebihnya halaman pendonor. Baik
`Pendonor::index()` maupun `Panel::index()` merender view yang SAMA
untuk semua sub-rute-nya; halaman spesifik mana yang benar-benar tampil
ditentukan client-side oleh `router.js` masing-masing berdasarkan
`location.pathname` saat itu.

`papan-antrian.html` (FR-5.4) terkecuali dari semua ini -- itu halaman
statis tunggal yang tidak pernah bertingkat (selalu persis satu path), jadi
tetap disajikan langsung sebagai file oleh `.htaccess` tanpa lewat CI3.

## Cara menjalankan
1. Jalankan backend CodeIgniter seperti biasa (Apache/Nginx), pastikan
   database sudah di-setup sesuai skema di `8. Kebutuhan Data` pada FRD, dan
   `application/config/config.php` -> `$config['base_url']` sudah sesuai
   alamat project kamu.
2. Akses lewat web server (mis. Laragon/Apache), bukan `file://`, supaya
   ES module & `fetch()` tidak diblokir kebijakan same-origin/CORS browser.
3. CORS pada backend sudah diaktifkan (`index.php`) supaya bisa diakses dari
   origin/port berbeda dari backend kalau frontend di-deploy terpisah.

## Halaman yang tersedia

**Pendonor** (`/`, `/jadwal`, `/dashboard`, dst):
- Beranda, Cari Jadwal Donor (FR-3.1/3.3), Lokasi Donor (FR-3.2)
- Daftar Akun + Verifikasi OTP (FR-1.1), Masuk (FR-1.2)
- Lupa/Atur Ulang Kata Sandi (FR-1.3), Kelola Perangkat/Sesi (FR-1.4)
- Dasbor, Profil & Data Kesehatan (FR-2.1), Kuesioner Kesehatan (FR-2.2),
  Kartu Donor Digital (FR-2.3)
- Ambil Nomor Antrian + E-Ticket QR (FR-4.1/4.2), Batalkan/Jadwalkan Ulang
  Antrian (FR-4.4), batas waktu check-in (FR-4.3)
- Tracking posisi antrian real-time -- nomor sedang dilayani, jumlah orang
  di depan, estimasi tunggu, auto-refresh tiap 5 detik (FR-5.1/5.2/5.3)
- Riwayat & Sertifikat Donor (`/riwayat`) -- riwayat lengkap donor beserta
  status kelayakan (FR-8.1), unduh sertifikat digital PDF untuk donor yang
  selesai dan dinyatakan layak oleh petugas (FR-8.2), estimasi tanggal boleh
  donor lagi berdasarkan interval 3 bulan (FR-8.3)

**Panel Internal** (`/admin`, `/admin/jadwal`, dst) -- halamannya dibedakan
per peran (lihat `internal/js/permissions.js`), bukan semua role lihat UI
yang sama:
- Masuk internal (Petugas Loket / Admin UDD / Super Admin)
- **Petugas Loket**: Panggil Antrian -- panggil nomor berikutnya/ulang,
  lewati (tidak hadir), verifikasi kehadiran lewat scan/ketik kode QR,
  tandai selesai sekaligus mencatat hasil donor -- status kelayakan, volume
  darah, catatan (FR-7.2, FR-7.3, dasar data buat FR-8.x -- BR5: keputusan
  akhir kelayakan tetap di tangan petugas medis), plus tautan ke Papan
  Antrian (FR-5.4)
- **Admin UDD/Cabang**: Kelola Jadwal & Kuota (FR-7.1), Kelola Lokasi Donor
  (FR-7.4)
- **Super Admin**: akses ke semua halaman di atas (superset) -- fitur
  khususnya sendiri (kelola pengguna sistem, konfigurasi global, semua
  laporan) belum ada endpoint-nya di backend

**Papan Antrian Digital** (`/papan-antrian.html?id_jadwal=<id>`) -- halaman
publik tanpa login, dimaksudkan ditayangkan penuh layar di TV/monitor lokasi
donor, auto-refresh tiap 5 detik (FR-5.4).

## Yang belum ada UI-nya (karena backend-nya juga belum ada)
Notifikasi (FR-6.x) dan Dashboard/Laporan (FR-9.x). Begitu endpoint-endpoint
ini tersedia di backend, UI-nya bisa ditambahkan sebagai view baru mengikuti
pola yang sama seperti view-view yang sudah ada di `pendonor/js/views/` /
`internal/js/views/`.

## Catatan implementasi: Sertifikat Donor Digital (FR-8.2)
PDF-nya dirender server-side lewat `dompdf/dompdf` (composer) di
`Riwayat::sertifikat()` -- `application/views/sertifikat_donor.php` HANYA
dipakai sebagai template HTML->PDF lewat Dompdf, BUKAN halaman web biasa,
jadi CSS-nya sengaja dibatasi ke fitur yang didukung Dompdf (tanpa
flexbox/grid). Endpoint-nya butuh header `Authorization: Bearer <token>`
seperti endpoint lain, jadi tidak bisa diunduh lewat `<a href>` navigasi
biasa -- `Api.unduhSertifikat()` di `js/api.js` melakukan `fetch()` manual,
lalu memicu-download hasilnya lewat Blob URL sementara.
