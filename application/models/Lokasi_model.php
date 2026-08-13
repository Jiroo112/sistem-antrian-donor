<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Lokasi_model extends CI_Model {

    protected $table = 'lokasi_donor';

    public function get_all($filter = array())
    {
        // Backward-compat: kalau masih ada kode lain yang manggil get_all('aktif')
        // gaya lama (string, bukan array), tetap diperlakukan sebagai filter status.
        if (is_string($filter)) {
            $filter = array('status_lokasi' => $filter);
        }

        if (!empty($filter['status_lokasi'])) {
            $this->db->where('status_lokasi', $filter['status_lokasi']);
        }
        if (!empty($filter['jenis'])) {
            $this->db->where('jenis', $filter['jenis']);
        }

        return $this->db->get($this->table)->result();
    }

    public function get_by_id($id_lokasi)
    {
        return $this->db->get_where($this->table, ['id_lokasi' => $id_lokasi])->row();
    }

    public function create($data)
    {
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    public function update($id_lokasi, $data)
    {
        $this->db->where('id_lokasi', $id_lokasi);
        return $this->db->update($this->table, $data);
    }

    public function delete($id_lokasi)
    {
        // Soft delete lebih aman -- jangan hard delete kalau lokasi ini
        // sudah pernah dipakai di jadwal_donor (FK RESTRICT akan menolak
        // hard delete otomatis, tapi mending dicegah eksplisit di sini)
        return $this->db->update($this->table, ['status_lokasi' => 'nonaktif'], ['id_lokasi' => $id_lokasi]);
    }

    // Hard delete beneran -- dipanggil dari admin/Lokasi::hapus_permanen()
    // yang sudah mastiin dulu lokasi ini belum pernah dipakai di jadwal_donor,
    // jadi aman dari FK RESTRICT.
    public function hapus_permanen($id_lokasi)
    {
        return $this->db->delete($this->table, ['id_lokasi' => $id_lokasi]);
    }
}