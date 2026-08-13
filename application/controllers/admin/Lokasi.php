<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

class Lokasi extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->verify_token();
        // Baca (index) dibuka untuk semua peran internal termasuk petugas_loket
        // -- panel Kelola Jadwal (admin/Jadwal.php) butuh daftar lokasi buat
        // dropdown, dan sekarang panel itu juga bisa diakses petugas_loket.
        // Tulis (create/update/delete) tetap dibatasi admin_udd/super_admin
        // saja, dicek ulang di masing-masing method di bawah.
        $this->verify_role(['petugas_loket', 'admin_udd', 'super_admin']);
        $this->load->model('Lokasi_model');
    }

    /**
     * Ambil body request JSON dan set ke $_POST supaya bisa dipakai $this->input->post().
     * Duplikat method yang sama di Auth.php secara sengaja (bukan dipindah ke
     * MY_Controller) karena PHP tidak izinkan method induk protected diturunkan
     * jadi private di anak -- lebih aman didefinisikan lokal di tiap controller
     * yang butuh, daripada berisiko bentrok visibility dan bikin fatal error.
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

    public function index()
    {
        $data = $this->Lokasi_model->get_all();
        json_response(200, 'success', 'Daftar lokasi', $data);
    }

    public function create()
    {
        $this->verify_role(['admin_udd', 'super_admin']);
        $this->get_json_input();

        $nama = $this->input->post('nama_lokasi');
        $jenis = $this->input->post('jenis');
        $alamat = $this->input->post('alamat');
        $lat = $this->input->post('latitude');
        $lng = $this->input->post('longitude');

        if (empty($nama) || empty($alamat)) {
            json_response(400, 'error', 'nama_lokasi dan alamat wajib diisi');
            return;
        }

        $id = $this->Lokasi_model->create([
            'nama_lokasi' => $nama,
            'jenis'       => $jenis ?: 'tetap',
            'alamat'      => $alamat,
            'latitude'    => $lat,
            'longitude'   => $lng,
        ]);

        json_response(201, 'success', 'Lokasi berhasil ditambahkan', ['id_lokasi' => $id]);
    }

    public function update($id_lokasi)
    {
        $this->verify_role(['admin_udd', 'super_admin']);
        $this->get_json_input();

        $lokasi = $this->Lokasi_model->get_by_id($id_lokasi);
        if (!$lokasi) {
            json_response(404, 'error', 'Lokasi tidak ditemukan');
            return;
        }

        // Kolom lokasi_donor.status_lokasi cuma ENUM('aktif','nonaktif') --
        // divalidasi eksplisit di sini sebelum masuk array_filter di bawah,
        // biar konsisten dengan pola yang sama di admin/Jadwal::update().
        $status_lokasi = $this->input->post('status_lokasi');
        if ($status_lokasi !== null && $status_lokasi !== '' && !in_array($status_lokasi, ['aktif', 'nonaktif'], true)) {
            json_response(400, 'error', 'status_lokasi harus salah satu dari: aktif, nonaktif');
            return;
        }

        $data = array_filter([
            'nama_lokasi'   => $this->input->post('nama_lokasi'),
            'jenis'         => $this->input->post('jenis'),
            'alamat'        => $this->input->post('alamat'),
            'latitude'      => $this->input->post('latitude'),
            'longitude'     => $this->input->post('longitude'),
            'status_lokasi' => $status_lokasi,
        ], function($v) {
            return $v !== null && $v !== '';
        });

        $this->Lokasi_model->update($id_lokasi, $data);
        json_response(200, 'success', 'Lokasi berhasil diperbarui');
    }

    public function delete($id_lokasi)
    {
        $this->verify_role(['admin_udd', 'super_admin']);
        $lokasi = $this->Lokasi_model->get_by_id($id_lokasi);
        if (!$lokasi) {
            json_response(404, 'error', 'Lokasi tidak ditemukan');
            return;
        }

        $this->Lokasi_model->delete($id_lokasi);
        json_response(200, 'success', 'Lokasi dinonaktifkan');
    }

    // Hapus permanen -- beda dari delete() di atas yang cuma soft-delete
    // (set status_lokasi='nonaktif'). Cuma boleh kalau lokasi ini belum
    // pernah dipakai di jadwal_donor sama sekali (FK jadwal_donor.id_lokasi
    // ON DELETE RESTRICT bakal menolak hard delete kalau masih dipakai --
    // dicek eksplisit di sini dulu supaya pesan errornya jelas, bukan error
    // SQL mentah, sama seperti pola cek bentrok slot di admin/Jadwal.php).
    public function hapus_permanen($id_lokasi)
    {
        $this->verify_role(['admin_udd', 'super_admin']);
        $lokasi = $this->Lokasi_model->get_by_id($id_lokasi);
        if (!$lokasi) {
            json_response(404, 'error', 'Lokasi tidak ditemukan');
            return;
        }

        $this->load->model('Jadwal_model');
        if ($this->Jadwal_model->count_by_lokasi($id_lokasi) > 0) {
            json_response(409, 'error', 'Lokasi ini sudah pernah dipakai di jadwal donor, tidak bisa dihapus permanen. Nonaktifkan saja lokasinya.');
            return;
        }

        $this->Lokasi_model->hapus_permanen($id_lokasi);
        json_response(200, 'success', 'Lokasi berhasil dihapus permanen');
    }
}