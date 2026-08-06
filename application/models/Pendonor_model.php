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

    // FR-8.3: hitung estimasi tanggal boleh donor berikutnya (interval 3 bulan / 12 minggu).
    // Dasarnya donor yang BENAR-BENAR berhasil (hasil_donor.status_kelayakan =
    // 'layak'), bukan sekadar antrian.status = 'selesai' -- selaras BR5:
    // keputusan akhir kelayakan tetap di tangan petugas medis, jadi donor yang
    // ditolak/ditunda petugas tidak seharusnya mengunci interval 3 bulan.
    public function get_tanggal_donor_terakhir($id_pendonor)
    {
        $this->db->select('h.tanggal');
        $this->db->from('hasil_donor h');
        $this->db->join('antrian a', 'a.id_antrian = h.id_antrian');
        $this->db->where('a.id_pendonor', $id_pendonor);
        $this->db->where('h.status_kelayakan', 'layak');
        $this->db->order_by('h.tanggal', 'DESC');
        $this->db->limit(1);
        $row = $this->db->get()->row();
        return $row ? $row->tanggal : null;
    }
    
    public function update_password($id_pendonor, $password_hash)
    {
        return $this->update($id_pendonor, ['password_hash' => $password_hash]);
    }

    // FR-1.3: buat request reset password baru
    public function create_password_reset($id_pendonor, $token_hash, $expires_at)
    {
        $this->db->insert('password_resets', [
            'id_pendonor' => $id_pendonor,
            'token_hash'  => $token_hash,
            'expires_at'  => $expires_at,
        ]);
        return $this->db->insert_id();
    }

    public function get_valid_reset_by_token_hash($token_hash)
    {
        $this->db->where('token_hash', $token_hash);
        $this->db->where('used', 0);
        $this->db->where('expires_at >=', date('Y-m-d H:i:s'));
        return $this->db->get('password_resets')->row();
    }

    public function mark_reset_used($id_reset)
    {
        $this->db->where('id_reset', $id_reset);
        return $this->db->update('password_resets', ['used' => 1]);
    }
}
