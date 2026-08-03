<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/*
| -------------------------------------------------------------------------
| KONFIGURASI OTP (Verifikasi Registrasi via SMS/WhatsApp)
| -------------------------------------------------------------------------
*/

// Panjang kode OTP (jumlah digit)
$config['otp_length'] = 6;

// Masa berlaku kode OTP, dalam menit
$config['otp_ttl_minutes'] = 5;

// Maksimal percobaan salah sebelum kode OTP dianggap hangus dan harus minta baru
$config['otp_max_attempts'] = 5;

// Jeda minimum (detik) sebelum user boleh minta kirim ulang OTP, supaya tidak bisa di-spam
$config['otp_resend_cooldown_seconds'] = 60;

/*
| Driver pengiriman OTP:
| - 'log'    : TIDAK benar-benar mengirim. OTP dicatat ke application/logs dan
|              dikembalikan di response API (field *_DEV_ONLY). Dipakai untuk
|              development lokal supaya bisa testing tanpa akun gateway asli.
| - 'fonnte' : kirim lewat WhatsApp Gateway Fonnte (https://fonnte.com)
| - 'twilio' : kirim lewat SMS Twilio (https://www.twilio.com)
*/
$config['otp_gateway_driver'] = 'log';

$config['otp_gateway'] = [
    'fonnte' => [
        'token' => '',
    ],
    'twilio' => [
        'account_sid' => '',
        'auth_token'  => '',
        'from_number' => '',
    ],
];