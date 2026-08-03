<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Session_model extends CI_Model {

    protected $table = 'sesi_pendonor';

    public function create_session($id_pendonor, $jti, $device_info, $ip_address)
    {
        $this->db->insert($this->table, [
            'id_pendonor' => $id_pendonor,
            'jti'         => $jti,
            'device_info' => $device_info,
            'ip_address'  => $ip_address,
            'status'      => 'aktif',
        ]);
        return $this->db->insert_id();
    }

    public function get_by_jti($jti)
    {
        return $this->db->get_where($this->table, ['jti' => $jti])->row();
    }

    public function get_active_sessions($id_pendonor)
    {
        $this->db->where('id_pendonor', $id_pendonor);
        $this->db->where('status', 'aktif');
        $this->db->order_by('last_active_at', 'DESC');
        return $this->db->get($this->table)->result();
    }

    public function touch_last_active($jti)
    {
        $this->db->where('jti', $jti);
        return $this->db->update($this->table, ['last_active_at' => date('Y-m-d H:i:s')]);
    }

    public function logout_by_jti($jti)
    {
        $this->db->where('jti', $jti);
        return $this->db->update($this->table, ['status' => 'logout']);
    }

    // logout dari semua perangkat LAIN, kecuali sesi yang sedang dipakai sekarang
    public function logout_all_except($id_pendonor, $current_jti)
    {
        $this->db->where('id_pendonor', $id_pendonor);
        $this->db->where('jti !=', $current_jti);
        $this->db->where('status', 'aktif');
        return $this->db->update($this->table, ['status' => 'logout']);
    }
}