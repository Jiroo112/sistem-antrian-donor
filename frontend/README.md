# Frontend — Sistem Antrian Online Donor Darah

UI statis (HTML/CSS/JavaScript murni, tanpa build tool/bundler) yang memanggil
langsung REST API CodeIgniter yang sudah ada di project ini. Dibuat mengikuti
ruang lingkup dan bahasa pada `FRD_Antrian_Online_Donor_Darah.docx`. Kedua SPA
(pendonor & internal) memakai ES Modules native browser (`import`/`export`),
jadi setiap file punya scope dan dependensi sendiri yang eksplisit.

## Isi folder
```
frontend/
├── pendonor/                  -> UI untuk pendonor (publik + area setelah login)
│   ├── index.html
│   └── js/
│       ├── main.js             -> composition root: sambungkan router + nav + listener
│       ├── router.js            -> routing History API (routeHref, navigate, resolveView)
│       ├── nav.js                -> render navbar atas
│       ├── guards.js              -> requireAuth()
│       ├── elements.js             -> referensi #app / #nav-slot
│       ├── format.js                -> format tanggal & badge status
│       ├── ui.js                     -> pageHeader(), val()
│       ├── qr.js                      -> render QR code e-ticket (FR-4.2)
│       └── views/                      -> satu file per halaman (home, jadwal, antrian, dst)
├── internal/                  -> UI untuk Petugas Loket / Admin UDD / Super Admin
│   ├── admin.html
│   └── js/
│       ├── main.js, router.js (hash-based), nav.js, guards.js, elements.js, ui.js
│       ├── session.js           -> data pengguna internal yang sedang login
│       └── views/                -> masuk, jadwal, lokasi
├── css/style.css              -> Design system bersama (tema "tiket antrian")
└── js/
    ├── api.js                  -> Klien REST API + Auth (token), ES module bersama
    │                              dipakai oleh pendonor & internal
    ├── qrcode.js                -> Library QR pihak ketiga yang di-vendor (MIT,
    │                               kazuhikoarase/qrcode-generator), dimuat sebagai
    │                               script klasik (bukan module) -- lihat js/qr.js
    └── shared/dom.js             -> Helper DOM/UI yang identik dipakai kedua SPA
                                     (el, escapeHtml, toast, setLoading, renderAlertError)
```

UI pendonor dan UI internal dipisah secara fisik supaya masing-masing role
punya folder sendiri, sementara aset yang benar-benar dipakai bersama
(`css/style.css`, `js/api.js`, `js/shared/dom.js`) tetap satu tempat di
`frontend/js/` dan `frontend/css/`, di-`import` langsung oleh modul yang butuh
(tidak lagi lewat alias URL `/js/*` atau `/css/*`).

Fisik file ada di `frontend/`, tapi hanya dua entry point HTML-nya yang di-alias
oleh `.htaccess` supaya URL-nya bersih: `/` → `frontend/pendonor/index.html`
dan `/admin.html` → `frontend/internal/admin.html`. Semua modul JS/CSS
direferensikan lewat path relatif langsung ke lokasi fisiknya (mis.
`frontend/pendonor/js/main.js`), yang otomatis valid karena semua rute bersih
SPA pendonor cuma satu segmen (`/jadwal`, `/dashboard`, dst) sehingga resolusi
path relatif oleh browser selalu jatuh balik ke root situs.

## Cara menjalankan
1. Jalankan backend CodeIgniter seperti biasa (Apache/Nginx), pastikan
   database sudah di-setup sesuai skema di `8. Kebutuhan Data` pada FRD.
2. Kalau backend/situs diakses dari path lain (bukan
   `http://localhost/sistem-antrian-donor/`), set `window.__API_BASE_URL__`
   dan/atau `window.__BASE_PATH__` lewat `<script>` inline SEBELUM tag
   `<script type="module" src="frontend/.../js/main.js">` di `index.html` /
   `admin.html` (default-nya dideteksi otomatis, jadi biasanya tidak perlu diisi).
3. Akses lewat web server (mis. Laragon/Apache), bukan `file://`, supaya
   ES module & `fetch()` tidak diblokir kebijakan same-origin/CORS browser.
4. CORS pada backend sudah diaktifkan (`index.php`) supaya bisa diakses dari
   origin/port berbeda dari backend kalau frontend di-deploy terpisah.

## Halaman yang tersedia

**`pendonor/index.html` (Pendonor)**:
- Beranda, Cari Jadwal Donor (FR-3.1/3.3), Lokasi Donor (FR-3.2)
- Daftar Akun + Verifikasi OTP (FR-1.1), Masuk (FR-1.2)
- Lupa/Atur Ulang Kata Sandi (FR-1.3), Kelola Perangkat/Sesi (FR-1.4)
- Dasbor, Profil & Data Kesehatan (FR-2.1), Kuesioner Kesehatan (FR-2.2),
  Kartu Donor Digital (FR-2.3)
- Ambil Nomor Antrian + E-Ticket QR (FR-4.1/4.2), Batalkan/Jadwalkan Ulang
  Antrian (FR-4.4), batas waktu check-in ditampilkan sesuai FR-4.3

**`internal/admin.html` (Petugas/Admin)**:
- Masuk internal (role Petugas Loket / Admin UDD / Super Admin)
- Kelola Jadwal & Kuota (FR-7.1)
- Kelola Lokasi Donor (FR-7.4)
- Catatan: ketiga role saat ini berbagi UI & fitur yang sama persis (belum
  ada pembatasan akses per role) karena fitur yang benar-benar spesifik per
  role (panggil antrian/check-in untuk Petugas Loket, dashboard/laporan
  untuk Super Admin) belum ada endpoint-nya di backend.

## Yang belum ada UI-nya (karena backend-nya juga belum ada)
Modul berikut belum diimplementasikan di sisi server sehingga sengaja belum
dibuatkan UI-nya: Tracking Antrian Real-Time (FR-5.x), Notifikasi (FR-6.x),
Panggil Antrian/Check-in oleh petugas (FR-7.2, FR-7.3), Riwayat & Sertifikat
Donor (FR-8.x), dan Dashboard/Laporan (FR-9.x). Begitu endpoint-endpoint ini
tersedia di backend, UI-nya bisa ditambahkan sebagai view baru mengikuti pola
yang sama seperti view-view yang sudah ada di `pendonor/js/views/` /
`internal/js/views/`.
