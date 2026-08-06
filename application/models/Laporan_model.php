<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Modul Dashboard dan Laporan (FR-9.1, FR-9.2). Semua query di sini
 * di-JOIN ke jadwal_donor supaya filter tanggal & id_lokasi mengikuti
 * TANGGAL KEGIATAN donor (bukan created_at antrian, yaitu kapan pendonor
 * mendaftar online) -- inilah tanggal yang relevan buat laporan PMI/UDD.
 */
class Laporan_model extends CI_Model {

    protected $table = 'antrian';

    // Status yang dianggap "hadir" di lokasi (FR-9.1: jumlah kehadiran) --
    // sama dengan status setelah check-in (lihat admin/Antrian::checkin()/selesai()).
    protected $status_hadir = array('sedang_diproses', 'selesai');

    // Status yang dianggap batal/tidak terlayani (FR-9.1: tingkat pembatalan)
    protected $status_batal = array('dibatalkan', 'tidak_hadir');

    private function apply_filter($filter)
    {
        $this->db->from($this->table);
        $this->db->join('jadwal_donor', 'jadwal_donor.id_jadwal = antrian.id_jadwal');

        if (!empty($filter['id_lokasi'])) {
            $this->db->where('jadwal_donor.id_lokasi', $filter['id_lokasi']);
        }
        if (!empty($filter['tanggal_mulai'])) {
            $this->db->where('jadwal_donor.tanggal >=', $filter['tanggal_mulai']);
        }
        if (!empty($filter['tanggal_akhir'])) {
            $this->db->where('jadwal_donor.tanggal <=', $filter['tanggal_akhir']);
        }
    }

    /**
     * FR-9.1: ringkasan jumlah pendaftar, jumlah kehadiran, dan tingkat
     * pembatalan -- dihitung dari satu query GROUP BY status supaya
     * konsisten (total selalu sama dengan penjumlahan per_status).
     */
    public function ringkasan($filter = array())
    {
        $this->apply_filter($filter);
        $this->db->select('antrian.status, COUNT(*) AS jumlah', FALSE);
        $this->db->group_by('antrian.status');
        $rows = $this->db->get()->result();

        $per_status = array();
        $total = 0;
        foreach ($rows as $row) {
            $per_status[$row->status] = (int) $row->jumlah;
            $total += (int) $row->jumlah;
        }

        $jumlah_hadir = 0;
        foreach ($this->status_hadir as $s) {
            $jumlah_hadir += isset($per_status[$s]) ? $per_status[$s] : 0;
        }

        $jumlah_batal = 0;
        foreach ($this->status_batal as $s) {
            $jumlah_batal += isset($per_status[$s]) ? $per_status[$s] : 0;
        }

        return array(
            'jumlah_pendaftar'   => $total,
            'jumlah_kehadiran'   => $jumlah_hadir,
            'jumlah_dibatalkan'  => $jumlah_batal,
            'per_status'         => $per_status,
            'tingkat_kehadiran'  => $total > 0 ? round($jumlah_hadir / $total * 100, 1) : 0,
            'tingkat_pembatalan' => $total > 0 ? round($jumlah_batal / $total * 100, 1) : 0,
        );
    }

    /**
     * FR-9.1: breakdown per lokasi -- dipakai Super Admin buat bandingkan
     * antar cabang UDD sekaligus (Admin UDD juga bisa pakai, tinggal kirim
     * query param id_lokasi kalau cuma mau lihat cabangnya sendiri).
     */
    public function per_lokasi($filter = array())
    {
        $this->apply_filter($filter);
        $this->db->join('lokasi_donor', 'lokasi_donor.id_lokasi = jadwal_donor.id_lokasi');
        $this->db->select("
            lokasi_donor.id_lokasi,
            lokasi_donor.nama_lokasi,
            COUNT(*) AS jumlah_pendaftar,
            SUM(antrian.status IN ('sedang_diproses','selesai')) AS jumlah_kehadiran,
            SUM(antrian.status IN ('dibatalkan','tidak_hadir')) AS jumlah_dibatalkan
        ", FALSE);
        $this->db->group_by('lokasi_donor.id_lokasi, lokasi_donor.nama_lokasi');
        $this->db->order_by('jumlah_pendaftar', 'DESC');

        $rows = $this->db->get()->result();
        foreach ($rows as $row) {
            $row->jumlah_pendaftar  = (int) $row->jumlah_pendaftar;
            $row->jumlah_kehadiran  = (int) $row->jumlah_kehadiran;
            $row->jumlah_dibatalkan = (int) $row->jumlah_dibatalkan;
        }
        return $rows;
    }

    /**
     * FR-9.1: tren harian jumlah pendaftar & kehadiran -- dipakai buat
     * grafik/sparkline sederhana di dashboard.
     */
    public function per_hari($filter = array())
    {
        $this->apply_filter($filter);
        $this->db->select("
            jadwal_donor.tanggal,
            COUNT(*) AS jumlah_pendaftar,
            SUM(antrian.status IN ('sedang_diproses','selesai')) AS jumlah_kehadiran
        ", FALSE);
        $this->db->group_by('jadwal_donor.tanggal');
        $this->db->order_by('jadwal_donor.tanggal', 'ASC');

        $rows = $this->db->get()->result();
        foreach ($rows as $row) {
            $row->jumlah_pendaftar = (int) $row->jumlah_pendaftar;
            $row->jumlah_kehadiran = (int) $row->jumlah_kehadiran;
        }
        return $rows;
    }

    /**
     * FR-9.2: baris detail buat tabel laporan & ekspor -- data pendonor +
     * jadwal/lokasi, dipakai bareng oleh admin/Laporan::index() (tampilan
     * tabel) dan export() (file CSV).
     */
    public function data_export($filter = array())
    {
        $this->apply_filter($filter);
        $this->db->join('pendonor', 'pendonor.id_pendonor = antrian.id_pendonor');
        $this->db->join('lokasi_donor', 'lokasi_donor.id_lokasi = jadwal_donor.id_lokasi');
        $this->db->select("
            antrian.id_antrian,
            antrian.nomor_urut,
            antrian.status,
            antrian.waktu_checkin,
            antrian.waktu_selesai,
            pendonor.nama AS nama_pendonor,
            pendonor.nik,
            pendonor.jenis_kelamin,
            pendonor.golongan_darah,
            jadwal_donor.tanggal,
            jadwal_donor.slot_waktu,
            lokasi_donor.nama_lokasi
        ", FALSE);
        $this->db->order_by('jadwal_donor.tanggal', 'DESC');
        $this->db->order_by('antrian.nomor_urut', 'ASC');
        return $this->db->get()->result();
    }
}
