<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Abstraksi pengiriman kode OTP lewat Email/SMS/WhatsApp.
 *
 * Driver aktif ditentukan lewat $config['otp_gateway_driver'] di
 * application/config/otp.php. Untuk menambah provider baru, tambahkan
 * case baru di method send() dan buat method send_via_<nama_provider>().
 */
class Otp_gateway {

    protected $CI;
    protected $driver;

    public function __construct()
    {
        $this->CI =& get_instance();
        $this->CI->config->load('otp');
        $this->driver = $this->CI->config->item('otp_gateway_driver') ?: 'log';
    }

    /**
     * Kirim kode OTP ke tujuan (alamat email atau nomor telepon, tergantung driver aktif).
     *
     * @param string $destination  Alamat email (driver 'mail') atau nomor telepon (driver 'fonnte'/'twilio')
     * @param string $otp_code     Kode OTP plain (belum di-hash)
     * @param string $channel      'email', 'whatsapp', atau 'sms', cuma dipakai driver 'log'
     * @return bool TRUE kalau berhasil dikirim/dicatat
     */
    public function send($destination, $otp_code, $channel = 'email')
    {
        switch ($this->driver) {
            case 'mail':
                return $this->send_via_mail($destination, $otp_code);
            case 'fonnte':
                return $this->send_via_fonnte($destination, $otp_code);
            case 'twilio':
                return $this->send_via_twilio($destination, $otp_code);
            case 'log':
            default:
                return $this->send_via_log($destination, $otp_code, $channel);
        }
    }

    /**
     * Kirim OTP lewat email (SMTP) -- gratis pakai akun Gmail + App Password,
     * tidak perlu verifikasi bisnis seperti WhatsApp Business API.
     * Isi smtp_user/smtp_pass di application/config/otp.php sebelum dipakai.
     */
    protected function send_via_mail($email, $otp_code)
    {
        $ttl = (int) $this->CI->config->item('otp_ttl_minutes');

        $this->CI->load->library('Mailer');

        return $this->CI->mailer->send(
            $email,
            'Kode Verifikasi Akun - Sistem Antrian Donor Darah',
            '<p>Kode verifikasi akun kamu:</p>' .
            '<p style="font-size:28px;font-weight:bold;letter-spacing:6px;">' . htmlspecialchars($otp_code) . '</p>' .
            "<p>Kode ini berlaku {$ttl} menit. Jangan bagikan kode ini kepada siapa pun.</p>"
        );
    }

    /**
     * Driver dev: tidak kirim beneran, cuma catat ke application/logs.
     * Kode OTP-nya sendiri dikembalikan ke controller lewat response API
     * (field *_DEV_ONLY) supaya bisa langsung ditest di Postman tanpa
     * perlu akun WhatsApp/SMS gateway asli.
     */
    protected function send_via_log($no_telp, $otp_code, $channel)
    {
        log_message('info', "[OTP-DEV] Kirim OTP ($channel) ke {$no_telp}: {$otp_code}");
        return TRUE;
    }

    /**
     * Contoh integrasi WhatsApp Gateway Fonnte (https://fonnte.com).
     * Isi token API di application/config/otp.php sebelum dipakai.
     */
    protected function send_via_fonnte($no_telp, $otp_code)
    {
        $token = $this->CI->config->item('otp_gateway')['fonnte']['token'] ?? '';

        if (empty($token)) {
            log_message('error', 'Fonnte: token API belum diisi di application/config/otp.php');
            return FALSE;
        }

        $ttl = $this->CI->config->item('otp_ttl_minutes');
        $pesan = "Kode verifikasi akun Anda: {$otp_code}. Berlaku {$ttl} menit. "
               . "Jangan bagikan kode ini kepada siapa pun.";

        $ch = curl_init('https://api.fonnte.com/send');
        curl_setopt($ch, CURLOPT_POST, TRUE);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: ' . $token]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, [
            'target'  => $no_telp,
            'message' => $pesan,
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response  = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_err  = curl_error($ch);
        curl_close($ch);

        if ($response === FALSE || $http_code >= 400) {
            log_message('error', "Fonnte gagal kirim OTP ke {$no_telp}. HTTP {$http_code}. {$curl_err} {$response}");
            return FALSE;
        }

        return TRUE;
    }

    /**
     * Contoh integrasi SMS Twilio (https://www.twilio.com).
     * Isi account_sid, auth_token, dan from_number di application/config/otp.php.
     */
    protected function send_via_twilio($no_telp, $otp_code)
    {
        $cfg   = $this->CI->config->item('otp_gateway')['twilio'] ?? [];
        $sid   = $cfg['account_sid'] ?? '';
        $token = $cfg['auth_token'] ?? '';
        $from  = $cfg['from_number'] ?? '';

        if (empty($sid) || empty($token) || empty($from)) {
            log_message('error', 'Twilio: kredensial belum lengkap di application/config/otp.php');
            return FALSE;
        }

        $pesan = "Kode verifikasi akun Anda: {$otp_code}";
        $url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, TRUE);
        curl_setopt($ch, CURLOPT_USERPWD, "{$sid}:{$token}");
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'To'   => $no_telp,
            'From' => $from,
            'Body' => $pesan,
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response  = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_err  = curl_error($ch);
        curl_close($ch);

        if ($response === FALSE || $http_code >= 400) {
            log_message('error', "Twilio gagal kirim OTP ke {$no_telp}. HTTP {$http_code}. {$curl_err} {$response}");
            return FALSE;
        }

        return TRUE;
    }
}