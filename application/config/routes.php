<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/*
| -------------------------------------------------------------------------
| URI ROUTING
| -------------------------------------------------------------------------
| This file lets you re-map URI requests to specific controller functions.
|
| Typically there is a one-to-one relationship between a URL string
| and its corresponding controller class/method. The segments in a
| URL normally follow this pattern:
|
|	example.com/class/method/id/
|
| In some instances, however, you may want to remap this relationship
| so that a different class/function is called than the one
| corresponding to the URL.
|
| Please see the user guide for complete details:
|
|	https://codeigniter.com/userguide3/general/routing.html
|
| -------------------------------------------------------------------------
| RESERVED ROUTES
| -------------------------------------------------------------------------
|
| There are three reserved routes:
|
|	$route['default_controller'] = 'welcome';
|
| This route indicates which controller class should be loaded if the
| URI contains no data. In the above example, the "welcome" class
| would be loaded.
|
|	$route['404_override'] = 'errors/page_missing';
|
| This route will tell the Router which controller/method to use if those
| provided in the URL cannot be matched to a valid route.
|
|	$route['translate_uri_dashes'] = FALSE;
|
| This is not exactly a route, but allows you to automatically route
| controller and method names that contain dashes. '-' isn't a valid
| class or method name character, so it requires translation.
| When you set this option to TRUE, it will replace ALL dashes in the
| controller and method URI segments.
|
| Examples:	my-controller/index	-> my_controller/index
|		my-controller/my-method	-> my_controller/my_method
*/
$route['default_controller'] = 'pendonor/index';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;

/*
| -------------------------------------------------------------------------
| API ROUTES - Sistem Antrian Online Donor Darah
| -------------------------------------------------------------------------
| Semua endpoint API diakses lewat prefix "api/" (lihat .htaccess) supaya
| tidak tabrakan dengan rute halaman frontend SPA yang path-nya sudah bersih
| tanpa "#" (mis. frontend "/profil" vs endpoint API "profil").
*/
// Modul 4.1: Registrasi dan Autentikasi (FR-1.1, FR-1.2)
$route['api/auth/register']['post'] = 'auth/register';
$route['api/auth/login']['post']    = 'auth/login';
$route['api/auth/login-internal']['post'] = 'auth/login_internal';
$route['api/auth/verify-otp']['post'] = 'auth/verify_otp';
$route['api/auth/resend-otp']['post'] = 'auth/resend_otp';

// FR-1.3: Lupa Kata Sandi
$route['api/auth/forgot-password']['post'] = 'auth/forgot_password';
$route['api/auth/reset-password']['post']  = 'auth/reset_password';

// FR-1.4: Manajemen Sesi & Perangkat
$route['api/auth/sessions']['get']        = 'auth/sessions';
$route['api/auth/logout']['post']         = 'auth/logout';
$route['api/auth/logout-others']['post']  = 'auth/logout_others';

// FR-3.1 + FR-3.3: Cari Jadwal Donor & Info Kuota Tersedia (publik, tanpa login)
$route['api/jadwal/cari']['get'] = 'jadwal/cari';
// FR-3.2: Peta Lokasi Donor -- publik, tanpa login
$route['api/lokasi/peta']['get'] = 'lokasi/peta';


// Modul 4.2: Profil Pendonor dan Kesehatan (FR-2.1, FR-2.2, FR-2.3)
$route['api/profil']['get']             = 'profil/index';
$route['api/profil']['put']             = 'profil/update';
$route['api/profil/kuesioner']['get']   = 'profil/kuesioner_form';
$route['api/profil/kartu-donor']['get'] = 'profil/kartu_donor';

// Modul 4.4: Pendaftaran Antrian Online (FR-4.1 - FR-4.4)
$route['api/antrian']['post']                    = 'antrian/ambil';
$route['api/antrian/saya']['get']                = 'antrian/saya';
$route['api/antrian/(:num)']['get']              = 'antrian/detail/$1';
$route['api/antrian/(:num)/batalkan']['put']     = 'antrian/batalkan/$1';
$route['api/antrian/(:num)/jadwal-ulang']['put'] = 'antrian/jadwal_ulang/$1';

// Modul 4.5: Tracking Antrian Real-Time (FR-5.1 - FR-5.4)
// FR-5.1/5.2/5.3 tidak butuh route terpisah -- sudah nempel di respons
// api/antrian/saya & api/antrian/:id (field "posisi") lewat Antrian.php.
// FR-5.4: papan antrian digital, publik tanpa login.
$route['api/papan-antrian']['get'] = 'papan/antrian';

// Modul 4.6: Notifikasi (FR-6.1 - FR-6.4) -- ini cuma daftar notifikasi
// in-app pendonor; pengiriman notifikasinya sendiri dipicu dari
// Antrian::ambil(), admin\Antrian::panggil(), admin\Jadwal::update()/
// delete(), dan Cron::pengingat_h1() lewat Notifikasi_service.
$route['api/notifikasi']['get']           = 'notifikasi/index';
$route['api/notifikasi/ringkasan']['get'] = 'notifikasi/ringkasan';

// Modul 4.8: Riwayat dan Sertifikat Donor (FR-8.1 - FR-8.3)
$route['api/riwayat']['get']                       = 'riwayat/index';
$route['api/riwayat/(:num)/sertifikat']['get']     = 'riwayat/sertifikat/$1';
// Modul 4.9: Dashboard dan Laporan (FR-9.1 - FR-9.3) -- pakai default
// routing CI3 juga (admin/dashboard/statistik, admin/laporan,
// admin/laporan/export, admin/pengguna/*), sama seperti pola
// admin/Jadwal.php & admin/Lokasi.php di atas, tidak butuh entry eksplisit.

// Fallback: rute lain di bawah prefix "api/" (mis. admin/jadwal/*,
// admin/lokasi/*, admin/dashboard/*, admin/laporan/*, admin/pengguna/*
// yang pakai default routing CI3 di atas) diteruskan apa adanya setelah
// prefix "api/" dibuang.
$route['api/(.+)'] = '$1';

// FR-6.2: Cron.php dipanggil lewat CLI ("php index.php cron pengingat_h1"),
// BUKAN request HTTP -- tapi routing CI3 diproses sama saja untuk CLI
// maupun HTTP, jadi "cron/..." tetap harus dikecualikan eksplisit di sini
// SEBELUM catch-all SPA "(.+)" di bawah, kalau tidak, cron/pengingat_h1
// akan "dicuri" jadi pendonor/index/cron/pengingat_h1 seperti route lain
// yang tidak dikenal.
$route['cron/(:any)'] = 'cron/$1';

/*
| -------------------------------------------------------------------------
| SHELL HTML FRONTEND -- Pendonor & Panel Internal
| -------------------------------------------------------------------------
| Dua baris di bawah ini HARUS tetap di bawah semua rute "api/..." di atas
| (CI3 mencocokkan rute sesuai urutan deklarasi, berhenti di kecocokan
| pertama) -- kalau ditaruh lebih atas, pola tangkap-semua "(.+)" bakal
| "mencuri" request api/* sebelum sempat dicocokkan ke rute yang benar.
|
| Panel internal (petugas/admin): semua /admin dan /admin/... disajikan
| lewat satu view yang sama (base_url disuntik server, bukan ditebak
| client) -- lihat Panel.php & application/views/admin_shell.php. Halaman
| mana yang benar-benar tampil ditentukan client-side oleh
| frontend/internal/js/router.js berdasarkan URL saat itu.
*/
$route['admin']       = 'panel/index';
$route['admin/(.*)']  = 'panel/index/$1';
$route['admin\.html'] = 'panel/index'; // alias URL lama, biar link/bookmark lama tidak putus (kunci rute CI3 adalah regex, titik di-escape)

/*
| SPA Pendonor: rute bersih apa pun yang tidak cocok pola di atas (mis.
| /jadwal, /dashboard, /profil) jatuh ke sini -- sama seperti panel
| internal, satu view yang sama untuk semua, base_url disuntik server
| lewat Pendonor.php & application/views/pendonor_shell.php.
*/
$route['(.+)'] = 'pendonor/index/$1';
