<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Modul Notifikasi (FR-6.1 - FR-6.4). Tabel `notifikasi` murni catatan/log
 * (dipakai juga sebagai daftar notifikasi in-app pendonor) -- pengiriman
 * asli (email) dilakukan Notifikasi_service, model ini cuma CRUD.
 */
class Notifikasi_model extends CI_Model {

    protected $table = 'notifikasi';

    public function create($id_pendonor, $jenis, $isi_pesan)
    {
        $this->db->insert($this->table, array(
            'id_pendonor'     => $id_pendonor,
            'jenis'           => $jenis,
            'isi_pesan'       => $isi_pesan,
            'status_terkirim' => 'pending',
        ));
        return $this->db->insert_id();
    }

    public function mark_terkirim($id_notifikasi)
    {
        $this->db->where('id_notifikasi', $id_notifikasi);
        return $this->db->update($this->table, array(
            'status_terkirim' => 'terkirim',
            'waktu_kirim'     => date('Y-m-d H:i:s'),
        ));
    }

    public function mark_gagal($id_notifikasi)
    {
        $this->db->where('id_notifikasi', $id_notifikasi);
        return $this->db->update($this->table, array(
            'status_terkirim' => 'gagal',
            'waktu_kirim'     => date('Y-m-d H:i:s'),
        ));
    }

    // Daftar notifikasi in-app milik satu pendonor, terbaru duluan.
    public function get_by_pendonor($id_pendonor, $limit = 50)
    {
        $this->db->where('id_pendonor', $id_pendonor);
        $this->db->order_by('created_at', 'DESC');
        $this->db->limit($limit);
        return $this->db->get($this->table)->result();
    }

    // Dipakai bell icon di navbar (poll berkala) -- query ringan, cuma
    // hitung, tanpa tarik seluruh daftar notifikasi.
    public function get_jumlah_belum_dibaca($id_pendonor)
    {
        $this->db->where('id_pendonor', $id_pendonor);
        $this->db->where('dibaca', 0);
        return $this->db->count_all_results($this->table);
    }

    // Dipanggil sebagai efek samping Notifikasi::index() -- membuka daftar
    // notifikasi otomatis menandai semuanya terbaca, sama seperti pola
    // umum kotak notifikasi (Instagram/GitHub, dsb), tanpa perlu endpoint
    // "tandai dibaca" terpisah.
    public function tandai_semua_dibaca($id_pendonor)
    {
        $this->db->where('id_pendonor', $id_pendonor);
        $this->db->where('dibaca', 0);
        return $this->db->update($this->table, array(
            'dibaca'    => 1,
            'dibaca_at' => date('Y-m-d H:i:s'),
        ));
    }

    // FR-6.2: dipakai Cron::pengingat_h1() supaya tidak kirim pengingat
    // dobel ke pendonor yang sama kalau cron sempat jalan lebih dari
    // sekali di hari yang sama (tabel ini tidak punya kolom id_jadwal,
    // jadi deteksi dobelnya per jenis+hari, bukan per jadwal spesifik).
    public function sudah_ada_hari_ini($id_pendonor, $jenis)
    {
        $this->db->where('id_pendonor', $id_pendonor);
        $this->db->where('jenis', $jenis);
        // where('DATE(created_at)', $tanggal, FALSE) TIDAK aman -- escape
        // FALSE bikin nilainya ikut tidak di-quote juga, jadi
        // "DATE(created_at) = 2026-08-06" kebaca MySQL sebagai pengurangan
        // (2026-08-06 = 2012), bukan perbandingan tanggal. $this->db->escape()
        // dipakai manual di sini supaya nilainya tetap ter-quote dengan benar.
        $this->db->where('DATE(created_at) = ' . $this->db->escape(date('Y-m-d')), NULL, FALSE);
        return $this->db->count_all_results($this->table) > 0;
    }
}
