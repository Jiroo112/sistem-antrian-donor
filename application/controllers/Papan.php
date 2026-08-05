<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

/**
 * FR-5.4: Papan Antrian Digital di Lokasi. Controller publik -- TIDAK pakai
 * verify_token(), karena maksudnya memang ditayangkan di layar/TV lokasi
 * donor tanpa ada yang perlu login (aktor FRD: "Sistem, Petugas Loket").
 * Responsnya sengaja cuma berisi nomor urut, bukan data pribadi pendonor.
 */
class Papan extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->load->model('Antrian_model');
        $this->load->model('Jadwal_model');
    }

    // GET /papan-antrian?id_jadwal=X
    public function antrian()
    {
        $id_jadwal = $this->input->get('id_jadwal');

        if (empty($id_jadwal) || !is_numeric($id_jadwal)) {
            json_response(400, 'error', 'id_jadwal wajib diisi dan berupa angka');
            return;
        }

        $jadwal = $this->Jadwal_model->get_by_id_with_lokasi($id_jadwal);
        if (!$jadwal) {
            json_response(404, 'error', 'Jadwal tidak ditemukan');
            return;
        }

        // FR-4.3: pastikan nomor yang sudah hangus tidak ikut tampil "masih menunggu"
        $this->Antrian_model->expire_overdue_by_jadwal($id_jadwal);

        $papan = $this->Antrian_model->get_papan_antrian($id_jadwal);

        json_response(200, 'success', 'Papan antrian', array(
            'jadwal' => array(
                'id_jadwal'   => $jadwal->id_jadwal,
                'nama_lokasi' => $jadwal->nama_lokasi,
                'tanggal'     => $jadwal->tanggal,
                'slot_waktu'  => $jadwal->slot_waktu,
            ),
            'nomor_sedang_dilayani' => $papan['nomor_sedang_dilayani'],
            'daftar_menunggu'       => $papan['daftar_menunggu'],
            'jumlah_menunggu'       => $papan['jumlah_menunggu'],
        ));
    }
}
