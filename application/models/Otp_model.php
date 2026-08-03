<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Otp_model extends CI_Model {

    protected $table = 'otp_codes';

    public function create(array $data)
    {
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    /**
     * Ambil OTP yang masih berlaku (belum dipakai & belum kedaluwarsa)
     * untuk pendonor + tujuan tertentu (mis. 'registrasi').
     */
    public function get_valid_otp($id_pendonor, $tujuan)
    {
        $this->db->where('id_pendonor', $id_pendonor);
        $this->db->where('tujuan', $tujuan);
        $this->db->where('used', 0);
        $this->db->where('expires_at >=', date('Y-m-d H:i:s'));
        $this->db->order_by('id_otp', 'DESC');
        $this->db->limit(1);
        return $this->db->get($this->table)->row();
    }

    /**
     * OTP paling baru untuk pendonor + tujuan tertentu, walau sudah kedaluwarsa/dipakai.
     * Dipakai buat cek cooldown resend.
     */
    public function get_latest($id_pendonor, $tujuan)
    {
        $this->db->where('id_pendonor', $id_pendonor);
        $this->db->where('tujuan', $tujuan);
        $this->db->order_by('id_otp', 'DESC');
        $this->db->limit(1);
        return $this->db->get($this->table)->row();
    }

    public function increment_attempt($id_otp)
    {
        $this->db->set('percobaan', 'percobaan + 1', FALSE);
        $this->db->where('id_otp', $id_otp);
        return $this->db->update($this->table);
    }

    public function mark_used($id_otp)
    {
        $this->db->where('id_otp', $id_otp);
        return $this->db->update($this->table, ['used' => 1]);
    }

    /**
     * Batalkan semua OTP lama yang belum dipakai untuk tujuan yang sama,
     * supaya cuma satu OTP aktif setiap saat per pendonor per tujuan.
     */
    public function invalidate_old($id_pendonor, $tujuan)
    {
        $this->db->where('id_pendonor', $id_pendonor);
        $this->db->where('tujuan', $tujuan);
        $this->db->where('used', 0);
        return $this->db->update($this->table, ['used' => 1]);
    }
}