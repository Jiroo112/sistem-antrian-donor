<?php
defined('BASEPATH') OR exit('No direct script access allowed');

// Panjang kode OTP (jumlah digit)
$config['otp_length'] = 6;

// Masa berlaku kode OTP, dalam menit
$config['otp_ttl_minutes'] = 5;

// Maksimal percobaan salah sebelum kode OTP dianggap hangus dan harus minta baru
$config['otp_max_attempts'] = 5;

// Jeda minimum (detik) sebelum user boleh minta kirim ulang OTP, supaya tidak bisa di-spam
$config['otp_resend_cooldown_seconds'] = 60;

$config['otp_gateway_driver'] = 'mail';

// Kredensial di bawah ini DIAMBIL DARI FILE .env (bukan ditulis langsung di
// sini) supaya tidak ikut ke-commit ke git kalau repo ini di-push. Isi
// nilainya di .env (salin dari .env.example kalau belum ada) -- lihat
// application/helpers/env_helper.php.
//
// Cara isi cepat SMTP pakai Gmail (gratis):
// 1. Aktifkan verifikasi 2 langkah di akun Google kamu.
// 2. Buat "App Password" di https://myaccount.google.com/apppasswords
// 3. OTP_MAIL_SMTP_USER = alamat Gmail kamu, OTP_MAIL_SMTP_PASS = App Password
//    (16 karakter, BUKAN password akun biasa)
$config['otp_gateway'] = [
    'mail' => [
        'smtp_host'   => env('OTP_MAIL_SMTP_HOST', 'smtp.gmail.com'),
        'smtp_port'   => (int) env('OTP_MAIL_SMTP_PORT', 587),
        'smtp_user'   => env('OTP_MAIL_SMTP_USER', ''),
        'smtp_pass'   => env('OTP_MAIL_SMTP_PASS', ''),
        'smtp_crypto' => env('OTP_MAIL_SMTP_CRYPTO', 'tls'),
        'from_email'  => env('OTP_MAIL_FROM_EMAIL', ''), // kosongkan supaya ikut smtp_user
        'from_name'   => env('OTP_MAIL_FROM_NAME', 'Sistem Antrian Donor Darah'),
    ],
    'fonnte' => [
        'token' => env('OTP_FONNTE_TOKEN', ''),
    ],
    'twilio' => [
        'account_sid' => env('OTP_TWILIO_ACCOUNT_SID', ''),
        'auth_token'  => env('OTP_TWILIO_AUTH_TOKEN', ''),
        'from_number' => env('OTP_TWILIO_FROM_NUMBER', ''),
    ],
];