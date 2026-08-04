<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Pengguna_internal_model extends CI_Model {

    public function get_by_email($email)
    {
        return $this->db->get_where('pengguna_internal', ['email' => $email])->row();
    }
}