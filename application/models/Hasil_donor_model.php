<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Modul Riwayat dan Sertifikat Donor (FR-8.x). Satu baris per antrian yang
 * sudah selesai diproses -- diisi petugas loket saat menandai antrian
 * 'selesai' (lihat admin/Antrian::selesai()), sesuai BR5: keputusan akhir
 * kelayakan donor darah tetap di tangan petugas medis/skrining di lokasi.
 */
class Hasil_donor_model extends CI_Model {

    protected $table = 'hasil_donor';

    public function get_by_id_antrian($id_antrian)
    {
        return $this->db->get_where($this->table, array('id_antrian' => $id_antrian))->row();
    }

    // UNIQUE KEY di kolom id_antrian -- satu antrian cuma boleh punya satu
    // hasil donor, jadi upsert supaya aman dipanggil ulang (mis. petugas
    // salah klik lalu retry) tanpa duplicate-entry error.
    public function upsert($id_antrian, array $data)
    {
        $existing = $this->get_by_id_antrian($id_antrian);
        if ($existing) {
            $this->db->where('id_antrian', $id_antrian);
            $this->db->update($this->table, $data);
            return $existing->id_hasil;
        }

        $data['id_antrian'] = $id_antrian;
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }
}
