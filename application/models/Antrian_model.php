<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Antrian_model extends CI_Model {

    protected $table = 'antrian';

    // Status yang dianggap "masih aktif" -- dipakai buat BR3 (satu akun cuma
    // boleh punya 1 antrian aktif dalam satu waktu) dan buat nentuin nomor
    // antrian mana yang masih bisa dibatalkan/dijadwalkan ulang.
    protected $status_aktif = array('menunggu', 'dipanggil', 'sedang_diproses');

    public function get_by_id($id_antrian)
    {
        return $this->db->get_where($this->table, array('id_antrian' => $id_antrian))->row();
    }

    public function get_by_id_and_pendonor($id_antrian, $id_pendonor)
    {
        return $this->db->get_where($this->table, array(
            'id_antrian'  => $id_antrian,
            'id_pendonor' => $id_pendonor,
        ))->row();
    }

    public function get_active_by_pendonor($id_pendonor)
    {
        $this->db->where('id_pendonor', $id_pendonor);
        $this->db->where_in('status', $this->status_aktif);
        return $this->db->get($this->table)->row();
    }

    public function get_riwayat_by_pendonor($id_pendonor)
    {
        $this->db->select('antrian.*, jadwal_donor.tanggal, jadwal_donor.slot_waktu, lokasi_donor.nama_lokasi');
        $this->db->from($this->table);
        $this->db->join('jadwal_donor', 'jadwal_donor.id_jadwal = antrian.id_jadwal');
        $this->db->join('lokasi_donor', 'lokasi_donor.id_lokasi = jadwal_donor.id_lokasi');
        $this->db->where('antrian.id_pendonor', $id_pendonor);
        $this->db->order_by('antrian.created_at', 'DESC');
        return $this->db->get()->result();
    }

    /**
     * FR-4.3: nomor antrian berstatus 'menunggu' yang sudah lewat
     * batas_waktu_checkin dianggap hangus dan slotnya balik ke kuota
     * jadwal. Sistem ini tidak punya worker/cron terjadwal, jadi
     * kadaluwarsa dicek secara "lazy" -- dipanggil di awal endpoint
     * pendonor/papan-antrian yang relevan supaya status yang dilihat
     * pendonor dan kuota jadwal selalu konsisten dengan business rule #4.
     */
    public function expire_overdue($id_pendonor)
    {
        $this->expire_overdue_where(array('id_pendonor' => $id_pendonor));
    }

    // Sama seperti expire_overdue(), tapi ruang lingkupnya satu jadwal
    // (bukan satu pendonor) -- dipakai papan antrian (FR-5.4) supaya nomor
    // yang sudah hangus tidak ikut dihitung "masih menunggu" di papan.
    public function expire_overdue_by_jadwal($id_jadwal)
    {
        $this->expire_overdue_where(array('id_jadwal' => $id_jadwal));
    }

    private function expire_overdue_where(array $where)
    {
        foreach ($where as $kolom => $nilai) {
            $this->db->where($kolom, $nilai);
        }
        $this->db->where('status', 'menunggu');
        $this->db->where('batas_waktu_checkin IS NOT NULL', NULL, FALSE);
        $this->db->where('batas_waktu_checkin <', date('Y-m-d H:i:s'));
        $overdue = $this->db->get($this->table)->result();

        if (empty($overdue)) {
            return;
        }

        $this->load->model('Jadwal_model');
        foreach ($overdue as $antrian) {
            $this->db->where('id_antrian', $antrian->id_antrian);
            $this->db->update($this->table, array('status' => 'dibatalkan'));
            $this->Jadwal_model->tambah_kuota($antrian->id_jadwal);
        }
    }

    /**
     * FR-5.1: posisi antrian real-time milik satu antrian -- nomor yang
     * sedang dilayani (dipanggil/sedang_diproses tertinggi di jadwal yang
     * sama) dan jumlah orang yang masih aktif di depan nomor ini. Dipakai
     * bareng konfigurasi estimasi_menit_per_orang di controller untuk
     * menghitung estimasi waktu tunggu.
     */
    public function get_posisi($antrian)
    {
        $this->db->select_max('nomor_urut', 'nomor_urut');
        $this->db->where('id_jadwal', $antrian->id_jadwal);
        $this->db->where_in('status', array('dipanggil', 'sedang_diproses'));
        $row = $this->db->get($this->table)->row();
        $nomor_sedang_dilayani = ($row && $row->nomor_urut !== null) ? (int) $row->nomor_urut : null;

        $this->db->where('id_jadwal', $antrian->id_jadwal);
        $this->db->where('nomor_urut <', $antrian->nomor_urut);
        $this->db->where_in('status', $this->status_aktif);
        $jumlah_di_depan = (int) $this->db->count_all_results($this->table);

        return array(
            'nomor_sedang_dilayani' => $nomor_sedang_dilayani,
            'jumlah_di_depan'       => $jumlah_di_depan,
        );
    }

    /**
     * FR-5.4: data papan antrian digital untuk satu jadwal -- sengaja cuma
     * berisi nomor urut (bukan nama/data pribadi pendonor) karena ini
     * ditayangkan di layar publik lokasi donor.
     */
    public function get_papan_antrian($id_jadwal)
    {
        $this->db->select_max('nomor_urut', 'nomor_urut');
        $this->db->where('id_jadwal', $id_jadwal);
        $this->db->where_in('status', array('dipanggil', 'sedang_diproses'));
        $row = $this->db->get($this->table)->row();
        $nomor_sedang_dilayani = ($row && $row->nomor_urut !== null) ? (int) $row->nomor_urut : null;

        $this->db->select('nomor_urut');
        $this->db->where('id_jadwal', $id_jadwal);
        $this->db->where('status', 'menunggu');
        $this->db->order_by('nomor_urut', 'ASC');
        $menunggu = array_map(function ($r) {
            return (int) $r->nomor_urut;
        }, $this->db->get($this->table)->result());

        return array(
            'nomor_sedang_dilayani' => $nomor_sedang_dilayani,
            'daftar_menunggu'       => $menunggu,
            'jumlah_menunggu'       => count($menunggu),
        );
    }

    /**
     * FR-4.1 + FR-4.2: terbitkan nomor antrian + e-ticket (QR code) baru.
     * Kuota jadwal (Jadwal_model::kurangi_kuota) HARUS sudah dikurangi
     * atomik oleh pemanggil SEBELUM method ini dipanggil.
     *
     * nomor_urut dihitung MAX(nomor_urut)+1 per id_jadwal lewat INSERT...SELECT
     * supaya penomoran tetap urut dan tidak pernah dipakai ulang walau ada
     * antrian lain di jadwal yang sama sudah dibatalkan. UNIQUE KEY
     * (id_jadwal, nomor_urut) di tabel jadi pengaman terakhir kalau 2 request
     * barengan lolos menghitung MAX yang sama -- makanya di-retry beberapa kali.
     */
    public function create_with_next_nomor($id_pendonor, $id_jadwal, $batas_waktu_checkin, $max_retry = 5)
    {
        for ($i = 0; $i < $max_retry; $i++) {
            $qr_code = bin2hex(random_bytes(16));

            $sql = "INSERT INTO {$this->table}
                        (id_pendonor, id_jadwal, nomor_urut, status, qr_code, batas_waktu_checkin, created_at, updated_at)
                    SELECT ?, ?, COALESCE(MAX(nomor_urut), 0) + 1, 'menunggu', ?, ?, NOW(), NOW()
                    FROM {$this->table}
                    WHERE id_jadwal = ?";

            $this->db->query($sql, array($id_pendonor, $id_jadwal, $qr_code, $batas_waktu_checkin, $id_jadwal));

            $error = $this->db->error();
            if (empty($error['code'])) {
                return $this->db->insert_id();
            }

            // 1062 = Duplicate entry -- ada request lain yang barengan dapat
            // nomor_urut yang sama persis, coba lagi dengan MAX terbaru.
            if ((int) $error['code'] !== 1062) {
                return FALSE;
            }
        }
        return FALSE;
    }

    public function batalkan($id_antrian)
    {
        $this->db->where('id_antrian', $id_antrian);
        return $this->db->update($this->table, array('status' => 'dibatalkan'));
    }

    // ============================================================
    // Modul Manajemen Antrian -- Petugas/Admin (FR-7.2, FR-7.3)
    // ============================================================

    public function get_by_qr_code($qr_code)
    {
        return $this->db->get_where($this->table, array('qr_code' => $qr_code))->row();
    }

    // FR-7.2 "panggil berikutnya": nomor menunggu dengan nomor_urut terkecil
    // di jadwal tsb -- inilah yang otomatis dipanggil kalau petugas tidak
    // memilih nomor tertentu secara manual.
    public function get_next_menunggu($id_jadwal)
    {
        $this->db->where('id_jadwal', $id_jadwal);
        $this->db->where('status', 'menunggu');
        $this->db->order_by('nomor_urut', 'ASC');
        $this->db->limit(1);
        return $this->db->get($this->table)->row();
    }

    // Daftar antrian satu jadwal buat panel petugas -- ikut join nama &
    // golongan darah pendonor (beda dari papan antrian publik FR-5.4 yang
    // sengaja menyembunyikan data pribadi) karena petugas loket memang perlu
    // tahu siapa yang sedang mereka panggil/verifikasi.
    public function get_for_petugas($id_jadwal)
    {
        $this->db->select('antrian.*, pendonor.nama, pendonor.golongan_darah');
        $this->db->from($this->table);
        $this->db->join('pendonor', 'pendonor.id_pendonor = antrian.id_pendonor');
        $this->db->where('antrian.id_jadwal', $id_jadwal);
        $this->db->order_by('antrian.nomor_urut', 'ASC');
        return $this->db->get()->result();
    }

    // Setter status generik dipakai bareng oleh panggil/lewati/checkin/selesai
    // -- $extra buat kolom timestamp terkait (waktu_checkin, waktu_selesai).
    public function set_status($id_antrian, $status, array $extra = array())
    {
        $data = array_merge(array('status' => $status), $extra);
        $this->db->where('id_antrian', $id_antrian);
        return $this->db->update($this->table, $data);
    }

    /**
     * FR-4.4: pindahkan antrian yang sama ke jadwal lain. Nomor urut & QR
     * code diterbitkan ulang karena keduanya terikat ke slot/jadwal
     * spesifik (pola retry-on-duplicate sama seperti create_with_next_nomor()).
     */
    public function jadwal_ulang($id_antrian, $id_jadwal_baru, $batas_waktu_checkin_baru, $max_retry = 5)
    {
        for ($i = 0; $i < $max_retry; $i++) {
            $qr_code = bin2hex(random_bytes(16));

            $sql = "UPDATE {$this->table}
                    SET id_jadwal = ?,
                        nomor_urut = (SELECT next_nomor FROM (
                            SELECT COALESCE(MAX(nomor_urut), 0) + 1 AS next_nomor
                            FROM {$this->table} WHERE id_jadwal = ?
                        ) AS t),
                        qr_code = ?,
                        batas_waktu_checkin = ?
                    WHERE id_antrian = ?";

            $this->db->query($sql, array($id_jadwal_baru, $id_jadwal_baru, $qr_code, $batas_waktu_checkin_baru, $id_antrian));

            $error = $this->db->error();
            if (empty($error['code'])) {
                return TRUE;
            }
            if ((int) $error['code'] !== 1062) {
                return FALSE;
            }
        }
        return FALSE;
    }
}
