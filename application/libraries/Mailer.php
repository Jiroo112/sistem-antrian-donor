<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Wrapper tipis di atas CI Email library buat kirim email transaksional
 * (reset password, dll). Pakai kredensial SMTP yang sama dengan OTP
 * (application/config/otp.php -> $config['otp_gateway']['mail']) supaya
 * tidak perlu isi SMTP dua kali di tempat yang beda.
 */
class Mailer {

    protected $CI;

    public function __construct()
    {
        $this->CI =& get_instance();
        $this->CI->config->load('otp');
    }

    /**
     * @param string $to       Alamat email tujuan
     * @param string $subject  Subjek email
     * @param string $html     Isi email (HTML)
     * @return bool TRUE kalau berhasil dikirim
     */
    public function send($to, $subject, $html)
    {
        $cfg = $this->CI->config->item('otp_gateway')['mail'] ?? [];

        if (empty($cfg['smtp_user']) || empty($cfg['smtp_pass'])) {
            log_message('error', 'Mailer: smtp_user/smtp_pass belum diisi di application/config/otp.php');
            return FALSE;
        }

        $this->CI->load->library('email');
        $this->CI->email->initialize([
            'protocol'    => 'smtp',
            'smtp_host'   => $cfg['smtp_host'] ?? 'smtp.gmail.com',
            'smtp_port'   => $cfg['smtp_port'] ?? 587,
            'smtp_user'   => $cfg['smtp_user'],
            'smtp_pass'   => $cfg['smtp_pass'],
            'smtp_crypto' => $cfg['smtp_crypto'] ?? 'tls',
            'mailtype'    => 'html',
            'charset'     => 'utf-8',
            'newline'     => "\r\n",
        ]);

        $this->CI->email->from($cfg['from_email'] ?: $cfg['smtp_user'], $cfg['from_name'] ?? 'Sistem Antrian Donor Darah');
        $this->CI->email->to($to);
        $this->CI->email->subject($subject);
        $this->CI->email->message($html);

        if (!$this->CI->email->send()) {
            log_message('error', 'Mailer: gagal kirim email ke ' . $to . ': ' . $this->CI->email->print_debugger(['headers', 'subject']));
            return FALSE;
        }

        return TRUE;
    }
}
