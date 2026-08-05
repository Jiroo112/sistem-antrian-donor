<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

class Jadwal extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->verify_token();
        // Baca (index/detail) dibuka untuk semua peran internal termasuk
        // petugas_loket -- Modul Manajemen Antrian (FR-7.2/7.3, lihat
        // admin/Antrian.php) butuh daftar jadwal buat dropdown pemilihan.
        // Tulis (create/update/delete) tetap dibatasi admin_udd/super_admin
        // saja, dicek ulang di masing-masing method di bawah.
        $this->verify_role(['petugas_loket', 'admin_udd', 'super_admin']);
        $this->load->model('Jadwal_model');
        $this->load->model('Lokasi_model');
    }

    /**
     * Duplikat sengaja dari Lokasi.php -- lihat komentar di sana untuk alasannya.
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
        $filter = [
            'id_lokasi' => $this->input->get('id_lokasi'),
            'tanggal'   => $this->input->get('tanggal'),
            'status'    => $this->input->get('status'),
        ];

        $data = $this->Jadwal_model->get_all($filter);
        json_response(200, 'success', 'Daftar jadwal', $data);
    }

    public function detail($id_jadwal)
    {
        $jadwal = $this->Jadwal_model->get_by_id($id_jadwal);
        if (!$jadwal) {
            json_response(404, 'error', 'Jadwal tidak ditemukan');
            return;
        }
        json_response(200, 'success', 'Detail jadwal', $jadwal);
    }

    public function create()
    {
        $this->verify_role(['admin_udd', 'super_admin']);
        $this->get_json_input();

        $id_lokasi   = $this->input->post('id_lokasi');
        $tanggal     = $this->input->post('tanggal');
        $slot_waktu  = $this->input->post('slot_waktu'); // contoh: "08:00-10:00"
        $kuota_total = $this->input->post('kuota_total');

        if (empty($id_lokasi) || empty($tanggal) || empty($slot_waktu) || empty($kuota_total)) {
            json_response(400, 'error', 'id_lokasi, tanggal, slot_waktu, dan kuota_total wajib diisi');
            return;
        }

        if (!is_numeric($kuota_total) || (int) $kuota_total <= 0) {
            json_response(400, 'error', 'kuota_total harus berupa angka positif');
            return;
        }

        if (strtotime($tanggal) < strtotime(date('Y-m-d'))) {
            json_response(400, 'error', 'Tanggal jadwal tidak boleh di masa lalu');
            return;
        }

        // Pastikan lokasi valid & masih aktif sebelum jadwal dibuat di atasnya
        $lokasi = $this->Lokasi_model->get_by_id($id_lokasi);
        if (!$lokasi) {
            json_response(404, 'error', 'Lokasi tidak ditemukan');
            return;
        }

        // Tabel jadwal_donor punya UNIQUE KEY (id_lokasi, tanggal, slot_waktu)
        // -- cek dulu di sini supaya errornya jelas, bukan error SQL mentah
        $bentrok = $this->Jadwal_model->get_by_slot($id_lokasi, $tanggal, $slot_waktu);
        if ($bentrok) {
            json_response(409, 'error', 'Jadwal dengan lokasi, tanggal, dan slot waktu yang sama sudah ada');
            return;
        }

        $id = $this->Jadwal_model->create([
            'id_lokasi'   => $id_lokasi,
            'tanggal'     => $tanggal,
            'slot_waktu'  => $slot_waktu,
            'kuota_total' => (int) $kuota_total,
        ]);

        json_response(201, 'success', 'Jadwal berhasil dibuat', ['id_jadwal' => $id]);
    }

    public function update($id_jadwal)
    {
        $this->verify_role(['admin_udd', 'super_admin']);
        $this->get_json_input();

        $jadwal = $this->Jadwal_model->get_by_id($id_jadwal);
        if (!$jadwal) {
            json_response(404, 'error', 'Jadwal tidak ditemukan');
            return;
        }

        $kuota_total = $this->input->post('kuota_total');
        if ($kuota_total !== null && (!is_numeric($kuota_total) || (int) $kuota_total <= 0)) {
            json_response(400, 'error', 'kuota_total harus berupa angka positif');
            return;
        }

        $id_lokasi  = $this->input->post('id_lokasi') ?: $jadwal->id_lokasi;
        $tanggal    = $this->input->post('tanggal') ?: $jadwal->tanggal;
        $slot_waktu = $this->input->post('slot_waktu') ?: $jadwal->slot_waktu;

        // Cek bentrok unique key lagi kalau salah satu dari 3 kolom itu diubah
        $bentrok = $this->Jadwal_model->get_by_slot($id_lokasi, $tanggal, $slot_waktu, $id_jadwal);
        if ($bentrok) {
            json_response(409, 'error', 'Jadwal dengan lokasi, tanggal, dan slot waktu yang sama sudah ada');
            return;
        }

        $data = array_filter([
            'id_lokasi'   => $this->input->post('id_lokasi'),
            'tanggal'     => $this->input->post('tanggal'),
            'slot_waktu'  => $this->input->post('slot_waktu'),
            'kuota_total' => $kuota_total !== null ? (int) $kuota_total : null,
            'status'      => $this->input->post('status'),
        ], function ($v) {
            return $v !== null && $v !== '';
        });

        $this->Jadwal_model->update($id_jadwal, $data);
        json_response(200, 'success', 'Jadwal berhasil diperbarui');
    }

    public function delete($id_jadwal)
    {
        $this->verify_role(['admin_udd', 'super_admin']);
        $jadwal = $this->Jadwal_model->get_by_id($id_jadwal);
        if (!$jadwal) {
            json_response(404, 'error', 'Jadwal tidak ditemukan');
            return;
        }

        $this->Jadwal_model->delete($id_jadwal);
        json_response(200, 'success', 'Jadwal dibatalkan');
    }
}
