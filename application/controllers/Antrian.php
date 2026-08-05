<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

/**
 * Modul Pendaftaran Antrian Online (FR-4.1 - FR-4.4).
 * Semua endpoint di sini aktornya "Pendonor" terdaftar -- wajib login.
 */
class Antrian extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->verify_token();
        $this->verify_role(['pendonor']);
        $this->load->model('Antrian_model');
        $this->load->model('Jadwal_model');
        $this->load->model('Pendonor_model');
        $this->load->model('Riwayat_kesehatan_model');
        $this->config->load('antrian');
    }

    private function get_json_input()
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (is_array($data)) {
            $_POST = array_merge($_POST, $data);
        }
        return $_POST;
    }

    // slot_waktu formatnya "08:00-10:00" (lihat komentar kolom di DB) --
    // dipakai buat nentuin batas checkin (akhir slot) dan buat cek "sebelum
    // waktu kegiatan donor dimulai" (awal slot) di batalkan()/jadwal_ulang().
    private function jam_akhir_slot($slot_waktu)
    {
        return preg_match('/-\s*(\d{1,2}:\d{2})\s*$/', $slot_waktu, $m) ? $m[1] : '23:59';
    }

    private function jam_awal_slot($slot_waktu)
    {
        return preg_match('/^\s*(\d{1,2}:\d{2})/', $slot_waktu, $m) ? $m[1] : '00:00';
    }

    private function sudah_mulai($jadwal)
    {
        $mulai = $jadwal->tanggal . ' ' . $this->jam_awal_slot($jadwal->slot_waktu) . ':00';
        return strtotime($mulai) <= time();
    }

    // BR2: interval minimal 3 bulan antar donor. Return null kalau memenuhi
    // syarat, atau tanggal terdekat pendonor boleh donor lagi kalau belum.
    private function cek_interval_donor($id_pendonor)
    {
        $tanggal_terakhir = $this->Pendonor_model->get_tanggal_donor_terakhir($id_pendonor);
        if (!$tanggal_terakhir) {
            return null;
        }

        $boleh_lagi = (new DateTime($tanggal_terakhir))->modify('+3 months');
        if (new DateTime('today') < $boleh_lagi) {
            return $boleh_lagi->format('Y-m-d');
        }
        return null;
    }

    private function format_e_ticket($antrian, $jadwal)
    {
        $data = array(
            'id_antrian'          => $antrian->id_antrian,
            'nomor_urut'          => $antrian->nomor_urut,
            'status'              => $antrian->status,
            'qr_code'             => $antrian->qr_code,
            'batas_waktu_checkin' => $antrian->batas_waktu_checkin,
            'jadwal' => $jadwal ? array(
                'id_jadwal'   => $jadwal->id_jadwal,
                'tanggal'     => $jadwal->tanggal,
                'slot_waktu'  => $jadwal->slot_waktu,
                'id_lokasi'   => $jadwal->id_lokasi,
                'nama_lokasi' => isset($jadwal->nama_lokasi) ? $jadwal->nama_lokasi : null,
                'alamat'      => isset($jadwal->alamat) ? $jadwal->alamat : null,
            ) : null,
        );

        // FR-5.1: posisi & estimasi cuma relevan selama antrian masih aktif
        // (belum selesai/hangus/dibatalkan) -- begitu status jadi terminal,
        // "posisi" tidak lagi punya arti.
        if (in_array($antrian->status, array('menunggu', 'dipanggil', 'sedang_diproses'), TRUE)) {
            $posisi = $this->Antrian_model->get_posisi($antrian);
            $menit_per_orang = (int) $this->config->item('estimasi_menit_per_orang');
            $data['posisi'] = array(
                'nomor_sedang_dilayani' => $posisi['nomor_sedang_dilayani'],
                'jumlah_di_depan'       => $posisi['jumlah_di_depan'],
                'estimasi_menit'        => $posisi['jumlah_di_depan'] * $menit_per_orang,
            );
        } else {
            $data['posisi'] = null;
        }

        return $data;
    }

    /**
     * FR-4.1 + FR-4.2 + FR-4.3: ambil nomor antrian online untuk jadwal
     * tertentu -- sistem langsung menerbitkan e-ticket (QR code) dan
     * menetapkan batas waktu check-in.
     * POST /antrian
     * Body: id_jadwal
     */
    public function ambil()
    {
        $this->get_json_input();
        $id_pendonor = $this->user_data->id_pendonor;
        $id_jadwal = $this->input->post('id_jadwal');

        if (empty($id_jadwal) || !is_numeric($id_jadwal)) {
            json_response(400, 'error', 'id_jadwal wajib diisi dan berupa angka');
            return;
        }

        $jadwal = $this->Jadwal_model->get_by_id_with_lokasi($id_jadwal);
        if (!$jadwal || $jadwal->status !== 'aktif') {
            json_response(404, 'error', 'Jadwal tidak ditemukan atau sudah tidak aktif');
            return;
        }
        if ($this->sudah_mulai($jadwal)) {
            json_response(400, 'error', 'Jadwal ini sudah berlangsung/lewat, silakan pilih jadwal lain');
            return;
        }

        // FR-2.2: kuesioner kesehatan pra-donor wajib diisi dulu sebelum
        // pendonor bisa mengambil nomor antrian (sesuai SPO skrining PMI).
        $riwayat = $this->Riwayat_kesehatan_model->get_latest_by_pendonor($id_pendonor);
        if (!$riwayat || empty($riwayat->hasil_kuesioner)) {
            json_response(422, 'error', 'Lengkapi kuesioner kesehatan pra-donor terlebih dahulu sebelum mengambil nomor antrian');
            return;
        }

        // BR2: interval minimal 3 bulan sejak donor terakhir
        $boleh_lagi_pada = $this->cek_interval_donor($id_pendonor);
        if ($boleh_lagi_pada) {
            json_response(422, 'error', 'Belum memenuhi interval minimal donor darah, silakan daftar kembali mulai ' . $boleh_lagi_pada);
            return;
        }

        // BR3: satu akun cuma boleh punya 1 antrian aktif dalam satu waktu.
        // expire_overdue() dulu supaya antrian lama yang sudah hangus (FR-4.3)
        // tidak keliru dianggap masih aktif dan memblokir pendaftaran baru.
        $this->Antrian_model->expire_overdue($id_pendonor);
        $existing = $this->Antrian_model->get_active_by_pendonor($id_pendonor);
        if ($existing) {
            json_response(409, 'error', 'Anda sudah memiliki nomor antrian aktif, selesaikan atau batalkan dulu sebelum mengambil yang baru', array(
                'id_antrian' => $existing->id_antrian,
            ));
            return;
        }

        // BR6: kuota tidak boleh dilampaui -- dikurangi atomik di sini
        // sebelum insert, supaya aman dari race condition antar request.
        if (!$this->Jadwal_model->kurangi_kuota($id_jadwal)) {
            json_response(409, 'error', 'Kuota untuk jadwal ini sudah habis');
            return;
        }

        $batas_waktu_checkin = $jadwal->tanggal . ' ' . $this->jam_akhir_slot($jadwal->slot_waktu) . ':00';
        $id_antrian = $this->Antrian_model->create_with_next_nomor($id_pendonor, $id_jadwal, $batas_waktu_checkin);

        if (!$id_antrian) {
            // Gagal setelah kuota terlanjur dikurangi -- kembalikan supaya tidak hangus percuma
            $this->Jadwal_model->tambah_kuota($id_jadwal);
            json_response(500, 'error', 'Gagal menerbitkan nomor antrian, silakan coba lagi');
            return;
        }

        $antrian = $this->Antrian_model->get_by_id($id_antrian);
        json_response(201, 'success', 'Nomor antrian berhasil diterbitkan', $this->format_e_ticket($antrian, $jadwal));
    }

    /**
     * FR-4.2: lihat detail e-ticket (QR code + info jadwal) satu antrian.
     * GET /antrian/:id
     */
    public function detail($id_antrian)
    {
        $id_pendonor = $this->user_data->id_pendonor;
        $this->Antrian_model->expire_overdue($id_pendonor);

        $antrian = $this->Antrian_model->get_by_id_and_pendonor($id_antrian, $id_pendonor);
        if (!$antrian) {
            json_response(404, 'error', 'Antrian tidak ditemukan');
            return;
        }

        $jadwal = $this->Jadwal_model->get_by_id_with_lokasi($antrian->id_jadwal);
        json_response(200, 'success', 'Detail e-ticket antrian', $this->format_e_ticket($antrian, $jadwal));
    }

    /**
     * Antrian aktif pendonor saat ini (kalau ada) + riwayat singkat.
     * GET /antrian/saya
     */
    public function saya()
    {
        $id_pendonor = $this->user_data->id_pendonor;
        $this->Antrian_model->expire_overdue($id_pendonor);

        $aktif = $this->Antrian_model->get_active_by_pendonor($id_pendonor);
        $aktif_formatted = null;
        if ($aktif) {
            $jadwal = $this->Jadwal_model->get_by_id_with_lokasi($aktif->id_jadwal);
            $aktif_formatted = $this->format_e_ticket($aktif, $jadwal);
        }

        json_response(200, 'success', 'Antrian pendonor', array(
            'antrian_aktif' => $aktif_formatted,
            'riwayat'       => $this->Antrian_model->get_riwayat_by_pendonor($id_pendonor),
        ));
    }

    /**
     * FR-4.4: batalkan antrian sebelum jadwal donor dimulai, slot langsung
     * dikembalikan ke kuota tersedia.
     * PUT /antrian/:id/batalkan
     */
    public function batalkan($id_antrian)
    {
        $id_pendonor = $this->user_data->id_pendonor;
        $this->Antrian_model->expire_overdue($id_pendonor);

        $antrian = $this->Antrian_model->get_by_id_and_pendonor($id_antrian, $id_pendonor);
        if (!$antrian) {
            json_response(404, 'error', 'Antrian tidak ditemukan');
            return;
        }
        if ($antrian->status !== 'menunggu') {
            json_response(400, 'error', 'Antrian ini sudah tidak bisa dibatalkan (status: ' . $antrian->status . ')');
            return;
        }

        $jadwal = $this->Jadwal_model->get_by_id_with_lokasi($antrian->id_jadwal);
        if ($jadwal && $this->sudah_mulai($jadwal)) {
            json_response(400, 'error', 'Tidak bisa membatalkan, kegiatan donor sudah dimulai');
            return;
        }

        $this->Antrian_model->batalkan($id_antrian);
        $this->Jadwal_model->tambah_kuota($antrian->id_jadwal);

        json_response(200, 'success', 'Antrian berhasil dibatalkan');
    }

    /**
     * FR-4.4: jadwalkan ulang antrian ke jadwal lain sebelum jadwal saat
     * ini dimulai -- kuota jadwal lama dikembalikan, kuota jadwal baru
     * dikurangi, nomor urut & QR code diterbitkan ulang untuk jadwal baru.
     * PUT /antrian/:id/jadwal-ulang
     * Body: id_jadwal_baru
     */
    public function jadwal_ulang($id_antrian)
    {
        $this->get_json_input();
        $id_pendonor = $this->user_data->id_pendonor;
        $this->Antrian_model->expire_overdue($id_pendonor);

        $antrian = $this->Antrian_model->get_by_id_and_pendonor($id_antrian, $id_pendonor);
        if (!$antrian) {
            json_response(404, 'error', 'Antrian tidak ditemukan');
            return;
        }
        if ($antrian->status !== 'menunggu') {
            json_response(400, 'error', 'Antrian ini sudah tidak bisa dijadwalkan ulang (status: ' . $antrian->status . ')');
            return;
        }

        $jadwal_lama = $this->Jadwal_model->get_by_id_with_lokasi($antrian->id_jadwal);
        if ($jadwal_lama && $this->sudah_mulai($jadwal_lama)) {
            json_response(400, 'error', 'Tidak bisa dijadwalkan ulang, kegiatan donor pada jadwal saat ini sudah dimulai');
            return;
        }

        $id_jadwal_baru = $this->input->post('id_jadwal_baru');
        if (empty($id_jadwal_baru) || !is_numeric($id_jadwal_baru)) {
            json_response(400, 'error', 'id_jadwal_baru wajib diisi dan berupa angka');
            return;
        }
        if ((int) $id_jadwal_baru === (int) $antrian->id_jadwal) {
            json_response(400, 'error', 'Jadwal baru harus berbeda dari jadwal saat ini');
            return;
        }

        $jadwal_baru = $this->Jadwal_model->get_by_id_with_lokasi($id_jadwal_baru);
        if (!$jadwal_baru || $jadwal_baru->status !== 'aktif') {
            json_response(404, 'error', 'Jadwal baru tidak ditemukan atau sudah tidak aktif');
            return;
        }
        if ($this->sudah_mulai($jadwal_baru)) {
            json_response(400, 'error', 'Jadwal baru sudah berlangsung/lewat, silakan pilih jadwal lain');
            return;
        }

        if (!$this->Jadwal_model->kurangi_kuota($id_jadwal_baru)) {
            json_response(409, 'error', 'Kuota untuk jadwal baru sudah habis');
            return;
        }

        $batas_waktu_checkin_baru = $jadwal_baru->tanggal . ' ' . $this->jam_akhir_slot($jadwal_baru->slot_waktu) . ':00';
        $berhasil = $this->Antrian_model->jadwal_ulang($id_antrian, $id_jadwal_baru, $batas_waktu_checkin_baru);

        if (!$berhasil) {
            $this->Jadwal_model->tambah_kuota($id_jadwal_baru);
            json_response(500, 'error', 'Gagal menjadwalkan ulang, silakan coba lagi');
            return;
        }

        // Kembalikan kuota jadwal lama setelah antrian berhasil dipindah
        $this->Jadwal_model->tambah_kuota($antrian->id_jadwal);

        $antrian_baru = $this->Antrian_model->get_by_id($id_antrian);
        json_response(200, 'success', 'Antrian berhasil dijadwalkan ulang', $this->format_e_ticket($antrian_baru, $jadwal_baru));
    }
}
