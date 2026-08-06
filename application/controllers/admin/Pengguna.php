<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

/**
 * FR-9.3: Manajemen Hak Akses Pengguna Internal. Khusus Super Admin (lihat
 * tabel Peran & Aktor FRD bagian 3 -- "Kelola pengguna sistem" cuma
 * wewenang Super Admin, beda dari admin/Jadwal.php & admin/Lokasi.php yang
 * juga dibuka untuk Admin UDD). "Hak akses" di sini = peran (petugas_loket
 * /admin_udd/super_admin), sama seperti sistem role sederhana yang sudah
 * dipakai verify_role() di seluruh aplikasi -- tidak ada tabel permission
 * granular terpisah.
 */
class Pengguna extends MY_Controller {

    protected $peran_valid = array('petugas_loket', 'admin_udd', 'super_admin');

    public function __construct()
    {
        parent::__construct();
        $this->verify_token();
        $this->verify_role(['super_admin']);
        $this->load->model('Pengguna_internal_model');
    }

    private function get_json_input()
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (is_array($data)) {
            $_POST = array_merge($_POST, $data);
        }
        return $_POST;
    }

    // GET /admin/pengguna?peran=
    public function index()
    {
        $data = $this->Pengguna_internal_model->get_all([
            'peran' => $this->input->get('peran'),
        ]);
        json_response(200, 'success', 'Daftar pengguna internal', $data);
    }

    // GET /admin/pengguna/detail/:id
    public function detail($id_pengguna)
    {
        $user = $this->Pengguna_internal_model->get_by_id($id_pengguna);
        if (!$user) {
            json_response(404, 'error', 'Pengguna tidak ditemukan');
            return;
        }
        json_response(200, 'success', 'Detail pengguna internal', $user);
    }

    // POST /admin/pengguna/create
    // Body: nama, email, password, peran
    public function create()
    {
        $this->get_json_input();

        $nama     = $this->input->post('nama');
        $email    = $this->input->post('email');
        $password = $this->input->post('password');
        $peran    = $this->input->post('peran');

        if (empty($nama) || empty($email) || empty($password) || empty($peran)) {
            json_response(400, 'error', 'nama, email, password, dan peran wajib diisi');
            return;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(400, 'error', 'Format email tidak valid');
            return;
        }
        if (strlen($password) < 8) {
            json_response(400, 'error', 'Password minimal 8 karakter');
            return;
        }
        if (!in_array($peran, $this->peran_valid, TRUE)) {
            json_response(400, 'error', 'Peran harus salah satu dari: ' . implode(', ', $this->peran_valid));
            return;
        }
        if ($this->Pengguna_internal_model->get_by_email($email)) {
            json_response(409, 'error', 'Email sudah terdaftar sebagai pengguna internal');
            return;
        }

        $id = $this->Pengguna_internal_model->create([
            'nama'          => $nama,
            'email'         => $email,
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'peran'         => $peran,
            'status_akun'   => 'aktif',
        ]);

        json_response(201, 'success', 'Pengguna internal berhasil dibuat', ['id_pengguna' => $id]);
    }

    // POST /admin/pengguna/update/:id
    // Body (semua opsional, kecuali diisi): nama, email, password, peran, status_akun
    public function update($id_pengguna)
    {
        $this->get_json_input();

        $user = $this->Pengguna_internal_model->get_by_id($id_pengguna);
        if (!$user) {
            json_response(404, 'error', 'Pengguna tidak ditemukan');
            return;
        }

        $peran = $this->input->post('peran');
        if (!empty($peran) && !in_array($peran, $this->peran_valid, TRUE)) {
            json_response(400, 'error', 'Peran harus salah satu dari: ' . implode(', ', $this->peran_valid));
            return;
        }

        $email = $this->input->post('email');
        if (!empty($email) && $email !== $user->email) {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                json_response(400, 'error', 'Format email tidak valid');
                return;
            }
            if ($this->Pengguna_internal_model->get_by_email($email)) {
                json_response(409, 'error', 'Email sudah dipakai pengguna internal lain');
                return;
            }
        }

        $status_akun = $this->input->post('status_akun');
        if (!empty($status_akun) && !in_array($status_akun, ['aktif', 'nonaktif'], TRUE)) {
            json_response(400, 'error', "status_akun harus 'aktif' atau 'nonaktif'");
            return;
        }

        $data = array_filter([
            'nama'        => $this->input->post('nama'),
            'email'       => $email,
            'peran'       => $peran,
            'status_akun' => $status_akun,
        ], function ($v) {
            return $v !== null && $v !== '';
        });

        $password = $this->input->post('password');
        if (!empty($password)) {
            if (strlen($password) < 8) {
                json_response(400, 'error', 'Password minimal 8 karakter');
                return;
            }
            $data['password_hash'] = password_hash($password, PASSWORD_BCRYPT);
        }

        $this->Pengguna_internal_model->update($id_pengguna, $data);
        json_response(200, 'success', 'Pengguna internal berhasil diperbarui');
    }

    // POST /admin/pengguna/delete/:id (soft: status_akun -> nonaktif, pola
    // sama seperti admin/Lokasi::delete() -- bukan hard delete)
    public function delete($id_pengguna)
    {
        $user = $this->Pengguna_internal_model->get_by_id($id_pengguna);
        if (!$user) {
            json_response(404, 'error', 'Pengguna tidak ditemukan');
            return;
        }

        // Cegah Super Admin menonaktifkan akunnya sendiri lewat panel ini --
        // supaya tidak ada yang tidak sengaja mengunci diri sendiri dari akses admin.
        if ((int) $id_pengguna === (int) $this->user_data->id_pengguna) {
            json_response(400, 'error', 'Tidak bisa menonaktifkan akun sendiri');
            return;
        }

        $this->Pengguna_internal_model->update($id_pengguna, ['status_akun' => 'nonaktif']);
        json_response(200, 'success', 'Pengguna internal dinonaktifkan');
    }
}
