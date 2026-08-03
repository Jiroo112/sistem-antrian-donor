<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Pendonor_model extends CI_Model {

    protected $table = 'pendonor';

    public function __construct()
    {
        parent::__construct();
    }

    public function get_by_email($email)
    {
        return $this->db->get_where($this->table, ['email' => $email])->row();
    }

    public function get_by_nik($nik)
    {
        return $this->db->get_where($this->table, ['nik' => $nik])->row();
    }

    public function get_by_id($id_pendonor)
    {
        return $this->db->get_where($this->table, ['id_pendonor' => $id_pendonor])->row();
    }

    public function insert(array $data)
    {
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    public function update($id_pendonor, array $data)
    {
        $this->db->where('id_pendonor', $id_pendonor);
        return $this->db->update($this->table, $data);
    }

    // FR-8.3: hitung estimasi tanggal boleh donor berikutnya (interval 3 bulan / 12 minggu)
    public function get_tanggal_donor_terakhir($id_pendonor)
    {
        $this->db->select('a.waktu_selesai');
        $this->db->from('antrian a');
        $this->db->where('a.id_pendonor', $id_pendonor);
        $this->db->where('a.status', 'selesai');
        $this->db->order_by('a.waktu_selesai', 'DESC');
        $this->db->limit(1);
        $row = $this->db->get()->row();
        return $row ? $row->waktu_selesai : null;
    }
}
