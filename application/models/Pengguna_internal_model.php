<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Pengguna_internal_model extends CI_Model {

    protected $table = 'pengguna_internal';

    // Kolom yang aman ditampilkan ke klien -- password_hash sengaja
    // dikecualikan dari semua method baca di bawah (FR-9.3).
    protected $kolom_aman = 'id_pengguna, nama, email, peran, status_akun';

    public function get_by_email($email)
    {
        return $this->db->get_where($this->table, ['email' => $email])->row();
    }

    // FR-9.3: daftar pengguna internal buat panel Super Admin
    public function get_all($filter = array())
    {
        $this->db->select($this->kolom_aman);
        if (!empty($filter['peran'])) {
            $this->db->where('peran', $filter['peran']);
        }
        $this->db->order_by('nama', 'ASC');
        return $this->db->get($this->table)->result();
    }

    public function get_by_id($id_pengguna)
    {
        $this->db->select($this->kolom_aman);
        return $this->db->get_where($this->table, ['id_pengguna' => $id_pengguna])->row();
    }

    public function create(array $data)
    {
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    public function update($id_pengguna, array $data)
    {
        $this->db->where('id_pengguna', $id_pengguna);
        return $this->db->update($this->table, $data);
    }
}