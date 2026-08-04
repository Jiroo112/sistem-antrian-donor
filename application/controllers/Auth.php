<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

class Auth extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->load->model('Pendonor_model');
        $this->load->library('form_validation');
    }

    /**
     * Ambil body request JSON dan set ke $_POST supaya bisa dipakai form_validation.
     */
    private function get_json_input()
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (is_array($data)) {
            $_POST = array_merge($_POST, $data);
        }
        return $_POST;
    }

    /**
     * FR-1.1: Registrasi Akun Pendonor
     * POST /auth/register
     * Body: nik, nama, tanggal_lahir (YYYY-MM-DD), jenis_kelamin (L/P), no_telp, email, password
     *
     * Kode OTP verifikasi dikirim ke email pendonor (lihat kirim_otp_registrasi()
     * & Otp_gateway::send_via_mail()).
     */
    public function register()
    {
        $this->get_json_input();

        $this->form_validation->set_rules('nik', 'NIK', 'required|exact_length[16]|numeric|is_unique[pendonor.nik]');
        $this->form_validation->set_rules('nama', 'Nama', 'required|min_length[3]|max_length[150]');
        $this->form_validation->set_rules('tanggal_lahir', 'Tanggal Lahir', 'required|callback_valid_date');
        $this->form_validation->set_rules('jenis_kelamin', 'Jenis Kelamin', 'required|in_list[L,P]');
        $this->form_validation->set_rules('no_telp', 'No. Telepon', 'required|min_length[9]|max_length[20]');
        $this->form_validation->set_rules('email', 'Email', 'required|valid_email|is_unique[pendonor.email]');
        $this->form_validation->set_rules('password', 'Password', 'required|min_length[8]');

        if ($this->form_validation->run() === FALSE) {
            json_response(422, 'error', 'Validasi gagal', $this->form_validation->error_array());
            return;
        }

        // Business Rule #1: usia minimal 17, maksimal 65 tahun saat pendaftaran
        $usia = $this->hitung_usia($this->input->post('tanggal_lahir'));
        if ($usia < 17 || $usia > 65) {
            json_response(422, 'error', 'Usia pendonor harus antara 17 - 65 tahun');
            return;
        }

        $id_pendonor = $this->Pendonor_model->insert([
            'nik'            => $this->input->post('nik'),
            'nama'           => $this->input->post('nama'),
            'tanggal_lahir'  => $this->input->post('tanggal_lahir'),
            'jenis_kelamin'  => $this->input->post('jenis_kelamin'),
            'golongan_darah' => 'Belum Diketahui',
            'no_telp'        => $this->input->post('no_telp'),
            'email'          => $this->input->post('email'),
            'password_hash'  => password_hash($this->input->post('password'), PASSWORD_BCRYPT),
            'status_akun'    => 'menunggu_verifikasi',
        ]);

        $pendonor = $this->Pendonor_model->get_by_id($id_pendonor);

        $otp_info = $this->kirim_otp_registrasi($pendonor);

        json_response(201, 'success', 'Registrasi berhasil, silakan cek email untuk kode verifikasi OTP', array_merge([
            'id_pendonor' => $pendonor->id_pendonor,
            'nama'        => $pendonor->nama,
            'email'       => $pendonor->email,
        ], $otp_info));
    }

    /**
 * FR-1.1: Verifikasi OTP setelah registrasi
 * POST /auth/verify-otp
 * Body: email, otp
 */
    public function verify_otp()
    {
        $this->get_json_input();

        $this->form_validation->set_rules('email', 'Email', 'required|valid_email');
        $this->form_validation->set_rules('otp', 'Kode OTP', 'required|numeric|exact_length[6]');

        if ($this->form_validation->run() === FALSE) {
            json_response(422, 'error', 'Validasi gagal', $this->form_validation->error_array());
            return;
        }

        $pendonor = $this->Pendonor_model->get_by_email($this->input->post('email'));

        if (!$pendonor) {
            json_response(404, 'error', 'Akun tidak ditemukan');
            return;
        }

        if ($pendonor->status_akun === 'aktif') {
            json_response(400, 'error', 'Akun sudah terverifikasi, silakan login');
            return;
        }

        $this->load->model('Otp_model');
        $this->config->load('otp');

        $otp_row = $this->Otp_model->get_valid_otp($pendonor->id_pendonor, 'registrasi');

        if (!$otp_row) {
            json_response(400, 'error', 'Kode OTP sudah kedaluwarsa atau tidak ditemukan, silakan minta kode baru');
            return;
        }

        if ($otp_row->percobaan >= (int) $this->config->item('otp_max_attempts')) {
            json_response(429, 'error', 'Terlalu banyak percobaan salah, silakan minta kode OTP baru');
            return;
        }

        $otp_input = (string) $this->input->post('otp');

        if (hash('sha256', $otp_input) !== $otp_row->otp_hash) {
            $this->Otp_model->increment_attempt($otp_row->id_otp);
            json_response(400, 'error', 'Kode OTP salah');
            return;
        }

        $this->Otp_model->mark_used($otp_row->id_otp);
        $this->Pendonor_model->update($pendonor->id_pendonor, ['status_akun' => 'aktif']);

        json_response(200, 'success', 'Verifikasi berhasil, akun sudah aktif. Silakan login.');
    }

    /**
     * FR-1.1: Kirim ulang kode OTP registrasi (ada cooldown biar tidak bisa di-spam)
     * POST /auth/resend-otp
     * Body: email
     */
    public function resend_otp()
    {
        $this->get_json_input();

        $this->form_validation->set_rules('email', 'Email', 'required|valid_email');

        if ($this->form_validation->run() === FALSE) {
            json_response(422, 'error', 'Validasi gagal', $this->form_validation->error_array());
            return;
        }

        $pendonor = $this->Pendonor_model->get_by_email($this->input->post('email'));

        if (!$pendonor) {
            json_response(404, 'error', 'Akun tidak ditemukan');
            return;
        }

        if ($pendonor->status_akun === 'aktif') {
            json_response(400, 'error', 'Akun sudah terverifikasi, silakan login');
            return;
        }

        $this->load->model('Otp_model');
        $this->config->load('otp');

        $latest = $this->Otp_model->get_latest($pendonor->id_pendonor, 'registrasi');
        $cooldown = (int) $this->config->item('otp_resend_cooldown_seconds');

        if ($latest) {
            $elapsed = time() - strtotime($latest->created_at);
            if ($elapsed < $cooldown) {
                json_response(429, 'error', 'Mohon tunggu ' . ($cooldown - $elapsed) . ' detik sebelum minta kode baru');
                return;
            }
        }

        $otp_info = $this->kirim_otp_registrasi($pendonor);

        json_response(200, 'success', 'Kode OTP baru sudah dikirim', $otp_info);
    }

    /**
 * Generate kode OTP baru untuk registrasi, simpan (ter-hash) ke DB, dan kirim
 * lewat Otp_gateway. Dipakai bareng oleh register() dan resend_otp().
 */
    private function kirim_otp_registrasi($pendonor)
    {
        $this->load->model('Otp_model');
        $this->load->library('Otp_gateway');
        $this->config->load('otp');

        // Batalkan OTP registrasi lama yang belum dipakai, biar cuma 1 OTP aktif
        $this->Otp_model->invalidate_old($pendonor->id_pendonor, 'registrasi');

        $otp_length = (int) $this->config->item('otp_length');
        $otp_code = str_pad((string) random_int(0, (10 ** $otp_length) - 1), $otp_length, '0', STR_PAD_LEFT);
        $otp_hash = hash('sha256', $otp_code);

        $ttl_minutes = (int) $this->config->item('otp_ttl_minutes');
        $expires_at = date('Y-m-d H:i:s', time() + ($ttl_minutes * 60));

        $this->Otp_model->create([
            'id_pendonor' => $pendonor->id_pendonor,
            'tujuan'      => 'registrasi',
            'channel'     => 'email',
            'otp_hash'    => $otp_hash,
            'expires_at'  => $expires_at,
        ]);

        $terkirim = $this->otp_gateway->send($pendonor->email, $otp_code, 'email');

        $response = [
            'otp_terkirim'      => $terkirim,
            'otp_berlaku_menit' => $ttl_minutes,
        ];

        // Field DEV_ONLY muncul kalau driver gateway masih 'log', ATAU kalau
        // pengiriman asli gagal (mis. smtp_user/smtp_pass belum diisi) --
        // supaya alur registrasi tidak pernah buntu waktu development.
        if ($this->config->item('otp_gateway_driver') === 'log' || !$terkirim) {
            $response['otp_code_DEV_ONLY'] = $otp_code;
            $response['catatan'] = 'Field ini cuma buat testing lokal karena OTP gateway belum dikonfigurasi ke provider asli.';
        }

        return $response;
    }

    /**
     * FR-1.2: Login Multi-Platform (mobile & website pakai endpoint yang sama)
     * POST /auth/login
     * Body: email, password
     *
     * Catatan: login via akun Google belum diimplementasikan (butuh OAuth2 client
     * dari Google Cloud Console) — jadi belum dikerjakan di endpoint ini.
     */
    public function login()
    {
        $this->get_json_input();

        $this->form_validation->set_rules('email', 'Email', 'required|valid_email');
        $this->form_validation->set_rules('password', 'Password', 'required');

        if ($this->form_validation->run() === FALSE) {
            json_response(422, 'error', 'Validasi gagal', $this->form_validation->error_array());
            return;
        }

        $email = $this->input->post('email');
        $password = $this->input->post('password');

        $pendonor = $this->Pendonor_model->get_by_email($email);

        if (!$pendonor || !password_verify($password, $pendonor->password_hash)) {
            json_response(401, 'error', 'Email atau password salah');
            return;
        }

        if ($pendonor->status_akun === 'menunggu_verifikasi') {
            json_response(403, 'error', 'Akun belum diverifikasi, silakan cek email untuk kode OTP atau minta kirim ulang lewat /auth/resend-otp');
            return;
        }

        if ($pendonor->status_akun !== 'aktif') {
            json_response(403, 'error', 'Akun tidak aktif, hubungi admin PMI/UDD');
            return;
        }

        // FR-1.4: catat perangkat yang login
        $jti = bin2hex(random_bytes(16));
        $this->Session_model->create_session(
            $pendonor->id_pendonor,
            $jti,
            (string) $this->input->user_agent(),
            (string) $this->input->ip_address()
        );

        $token = $this->generate_token($pendonor, $jti);

        json_response(200, 'success', 'Login berhasil', [
            'token'       => $token,
            'id_pendonor' => $pendonor->id_pendonor,
            'nama'        => $pendonor->nama,
            'email'       => $pendonor->email,
        ]);
    }

    public function login_internal()
    {
        $this->get_json_input();

        $this->form_validation->set_rules('email', 'Email', 'required|valid_email');
        $this->form_validation->set_rules('password', 'Password', 'required');

        if ($this->form_validation->run() === FALSE) {
            json_response(422, 'error', 'Validasi gagal', $this->form_validation->error_array());
            return;
        }

        $email = $this->input->post('email');
        $password = $this->input->post('password');

        $this->load->model('Pengguna_internal_model');
        $user = $this->Pengguna_internal_model->get_by_email($email);

        if (!$user || !password_verify($password, $user->password_hash)) {
            json_response(401, 'error', 'Email atau password salah');
            return;
        }

        if ($user->status_akun !== 'aktif') {
            json_response(403, 'error', 'Akun tidak aktif, hubungi super admin');
            return;
        }

        $jti = bin2hex(random_bytes(16));
        $token = $this->generate_token_internal($user, $jti);

        json_response(200, 'success', 'Login berhasil', [
            'token'       => $token,
            'id_pengguna' => $user->id_pengguna,
            'nama'        => $user->nama,
            'peran'       => $user->peran,
        ]);
    }

    private function generate_token_internal($user, $jti)
    {
        $key = $this->config->item('jwt_secret_key');
        $issued_at = time();
        $expire = $issued_at + (60 * 60 * 12);

        $payload = [
            'iat'         => $issued_at,
            'exp'         => $expire,
            'jti'         => $jti,
            'id_pengguna' => $user->id_pengguna,
            'nama'        => $user->nama,
            'peran'       => $user->peran, // 'petugas_loket' / 'admin_udd' / 'super_admin'
        ];

        return \Firebase\JWT\JWT::encode($payload, $key, 'HS256');
    }

    /**
     * Callback form_validation: pastikan format tanggal Y-m-d dan tanggal itu benar-benar ada
     * (CI3 tidak punya rule 'valid_date' bawaan).
     */
    public function valid_date($str)
    {
        $d = DateTime::createFromFormat('Y-m-d', $str);
        if ($d && $d->format('Y-m-d') === $str) {
            return TRUE;
        }
        $this->form_validation->set_message('valid_date', 'Format {field} harus YYYY-MM-DD dan merupakan tanggal yang valid');
        return FALSE;
    }

    private function hitung_usia($tanggal_lahir)
    {
        $lahir = new DateTime($tanggal_lahir);
        $sekarang = new DateTime('today');
        return $lahir->diff($sekarang)->y;
    }

    private function generate_token($pendonor, $jti)
    {
        $key = $this->config->item('jwt_secret_key');
        $issued_at = time();
        $expire = $issued_at + (60 * 60 * 12);

        $payload = [
            'iat'         => $issued_at,
            'exp'         => $expire,
            'jti'         => $jti,
            'id_pendonor' => $pendonor->id_pendonor,
            'nama'        => $pendonor->nama,
            'peran'       => 'pendonor',
        ];

        return \Firebase\JWT\JWT::encode($payload, $key, 'HS256');
    }

    public function forgot_password()
    {
        $this->get_json_input();

        $this->form_validation->set_rules('email', 'Email', 'required|valid_email');
        if ($this->form_validation->run() === FALSE) {
            json_response(422, 'error', 'Validasi gagal', $this->form_validation->error_array());
            return;
        }

        $pendonor = $this->Pendonor_model->get_by_email($this->input->post('email'));

        // Sengaja tidak bilang "email tidak ditemukan" biar endpoint ini
        // tidak bisa dipakai buat menebak-nebak email yang terdaftar.
        if (!$pendonor) {
            json_response(200, 'success', 'Jika email terdaftar, instruksi reset password telah dikirim');
            return;
        }

        $token = bin2hex(random_bytes(32));
        $token_hash = hash('sha256', $token);
        $expires_at = date('Y-m-d H:i:s', time() + (30 * 60)); // berlaku 30 menit

        $this->Pendonor_model->create_password_reset($pendonor->id_pendonor, $token_hash, $expires_at);

        $reset_link = rtrim($this->config->item('base_url'), '/') . '/reset-password?token=' . $token;

        $this->load->library('Mailer');
        $terkirim = $this->mailer->send(
            $pendonor->email,
            'Atur Ulang Kata Sandi - Sistem Antrian Donor Darah',
            '<p>Halo ' . htmlspecialchars($pendonor->nama) . ',</p>' .
            '<p>Ada permintaan atur ulang kata sandi untuk akunmu. Klik tombol di bawah untuk membuat kata sandi baru (berlaku 30 menit):</p>' .
            '<p><a href="' . htmlspecialchars($reset_link) . '" style="display:inline-block;padding:10px 20px;background:#9d1e33;color:#fff;text-decoration:none;border-radius:6px;">Atur Ulang Kata Sandi</a></p>' .
            '<p>Atau salin tautan ini ke browser:<br>' . htmlspecialchars($reset_link) . '</p>' .
            '<p>Kalau kamu tidak merasa meminta ini, abaikan saja email ini.</p>'
        );

        // Field DEV_ONLY cuma muncul kalau email beneran gagal dikirim (mis.
        // smtp_user/smtp_pass belum diisi) -- supaya alur reset password
        // tidak pernah buntu waktu development.
        $response = $terkirim ? null : [
            'reset_token_DEV_ONLY' => $token,
            'catatan' => 'Field ini cuma buat testing lokal karena email gagal dikirim (cek konfigurasi SMTP di application/config/otp.php).',
        ];

        json_response(200, 'success', 'Jika email terdaftar, instruksi reset password telah dikirim', $response);
    }
    public function reset_password()
    {
        $this->get_json_input();

        $this->form_validation->set_rules('token', 'Token', 'required');
        $this->form_validation->set_rules('password_baru', 'Password Baru', 'required|min_length[8]');
        if ($this->form_validation->run() === FALSE) {
            json_response(422, 'error', 'Validasi gagal', $this->form_validation->error_array());
            return;
        }

        $token_hash = hash('sha256', $this->input->post('token'));
        $reset = $this->Pendonor_model->get_valid_reset_by_token_hash($token_hash);

        if (!$reset) {
            json_response(400, 'error', 'Token reset tidak valid atau sudah kedaluwarsa');
            return;
        }

        $this->Pendonor_model->update_password(
            $reset->id_pendonor,
            password_hash($this->input->post('password_baru'), PASSWORD_BCRYPT)
        );
        $this->Pendonor_model->mark_reset_used($reset->id_reset);

        // Demi keamanan, logout semua perangkat begitu password diganti
        $this->Session_model->logout_all_except($reset->id_pendonor, '');

        json_response(200, 'success', 'Password berhasil direset, silakan login kembali');
    }
    public function sessions()
    {
        $this->verify_token();

        $list = $this->Session_model->get_active_sessions($this->user_data->id_pendonor);

        json_response(200, 'success', 'Daftar perangkat aktif', $list);
    }
    public function logout()
    {
        $this->verify_token();

        if (isset($this->user_data->jti)) {
            $this->Session_model->logout_by_jti($this->user_data->jti);
        }

        json_response(200, 'success', 'Berhasil logout');
    }
    public function logout_others()
    {
        $this->verify_token();

        $current_jti = $this->user_data->jti ?? '';
        $this->Session_model->logout_all_except($this->user_data->id_pendonor, $current_jti);

        json_response(200, 'success', 'Berhasil logout dari semua perangkat lain');
    }
}


