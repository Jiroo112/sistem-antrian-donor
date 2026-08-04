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
$route['default_controller'] = 'welcome';
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

// FR-7.1: Kelola Jadwal & Kuota (admin) -- pakai default routing CI3
// (admin/jadwal/index, admin/jadwal/detail/:id, admin/jadwal/create,
// admin/jadwal/update/:id, admin/jadwal/delete/:id), sama seperti pola
// admin/Lokasi.php yang juga tidak butuh entry eksplisit di sini.

// Modul 4.2: Profil Pendonor dan Kesehatan (FR-2.1, FR-2.2, FR-2.3)
$route['api/profil']['get']             = 'profil/index';
$route['api/profil']['put']             = 'profil/update';
$route['api/profil/kuesioner']['get']   = 'profil/kuesioner_form';
$route['api/profil/kuesioner']['post']  = 'profil/kuesioner_submit';
$route['api/profil/kartu-donor']['get'] = 'profil/kartu_donor';

// Fallback: rute lain di bawah prefix "api/" (mis. admin/jadwal/*,
// admin/lokasi/* yang pakai default routing CI3 di atas) diteruskan apa
// adanya setelah prefix "api/" dibuang.
$route['api/(.+)'] = '$1';
