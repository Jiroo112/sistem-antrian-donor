<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/*
| -------------------------------------------------------------------------
| KONFIGURASI MODUL ANTRIAN (FR-5.1: Tracking Posisi Antrian Real-Time)
| -------------------------------------------------------------------------
| Dipakai untuk menghitung estimasi waktu tunggu (jumlah orang di depan x
| estimasi menit per orang). Angka ini cuma perkiraan kasar -- FRD (2.4
| Batasan Sistem) sudah menegaskan estimasi waktu tunggu bersifat perkiraan
| dan bisa berubah sesuai kondisi aktual di lokasi.
*/
$config['estimasi_menit_per_orang'] = 7;
