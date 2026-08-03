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
     * Catatan: verifikasi OTP (SMS/WhatsApp) belum diimplementasikan di sini
     * karena butuh integrasi gateway pihak ketiga (mis. Twilio/Zenziva/Fonnte).
     * Untuk sekarang akun langsung aktif setelah registrasi.
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
            'status_akun'    => 'aktif',
        ]);

        $pendonor = $this->Pendonor_model->get_by_id($id_pendonor);

        json_response(201, 'success', 'Registrasi berhasil', [
            'id_pendonor' => $pendonor->id_pendonor,
            'nama'        => $pendonor->nama,
            'email'       => $pendonor->email,
        ]);
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

        if ($pendonor->status_akun !== 'aktif') {
            json_response(403, 'error', 'Akun tidak aktif, hubungi admin PMI/UDD');
            return;
        }

        $token = $this->generate_token($pendonor);

        json_response(200, 'success', 'Login berhasil', [
            'token'       => $token,
            'id_pendonor' => $pendonor->id_pendonor,
            'nama'        => $pendonor->nama,
            'email'       => $pendonor->email,
        ]);
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

    private function generate_token($pendonor)
    {
        $key = $this->config->item('jwt_secret_key');
        $issued_at = time();
        $expire = $issued_at + (60 * 60 * 12); // token berlaku 12 jam

        $payload = [
            'iat'         => $issued_at,
            'exp'         => $expire,
            'id_pendonor' => $pendonor->id_pendonor,
            'nama'        => $pendonor->nama,
            'peran'       => 'pendonor',
        ];

        return \Firebase\JWT\JWT::encode($payload, $key, 'HS256');
    }
}
