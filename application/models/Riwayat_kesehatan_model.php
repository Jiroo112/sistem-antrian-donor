<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Riwayat_kesehatan_model extends CI_Model {

    protected $table = 'riwayat_kesehatan';

    public function __construct()
    {
        parent::__construct();
    }

    // Ambil baris riwayat kesehatan terbaru milik satu pendonor
    public function get_latest_by_pendonor($id_pendonor)
    {
        $this->db->where('id_pendonor', $id_pendonor);
        $this->db->order_by('id_riwayat', 'DESC');
        $this->db->limit(1);
        return $this->db->get($this->table)->row();
    }

    /**
     * FR-2.1: simpan/lengkapi data profil kesehatan dasar (berat badan,
     * tekanan darah, penyakit bawaan, riwayat donor sebelumnya).
     * Kalau pendonor belum punya baris riwayat_kesehatan sama sekali, buat baru.
     * Kalau sudah ada, update baris terbarunya (bukan bikin baris baru terus
     * menerus) supaya "profil kesehatan" tetap terasa seperti satu data yang
     * bisa diedit ulang, bukan riwayat kronologis per kunjungan.
     */
    public function simpan_profil_kesehatan($id_pendonor, array $data)
    {
        $existing = $this->get_latest_by_pendonor($id_pendonor);

        if ($existing) {
            $this->db->where('id_riwayat', $existing->id_riwayat);
            $this->db->update($this->table, $data);
            return $existing->id_riwayat;
        }

        $data['id_pendonor'] = $id_pendonor;
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    // FR-2.2: simpan hasil kuesioner kesehatan pra-donor ke baris riwayat terbaru
    public function simpan_kuesioner($id_pendonor, array $hasil_kuesioner)
    {
        return $this->simpan_profil_kesehatan($id_pendonor, [
            'hasil_kuesioner' => json_encode($hasil_kuesioner),
        ]);
    }
}