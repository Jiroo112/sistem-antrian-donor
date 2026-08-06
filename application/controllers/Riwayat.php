<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

/**
 * Modul Riwayat dan Sertifikat Donor (FR-8.1 - FR-8.3). Semua endpoint di
 * sini aktornya "Pendonor" terdaftar -- wajib login, sama seperti
 * Antrian.php (Modul 4.4).
 */
class Riwayat extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->verify_token();
        $this->verify_role(['pendonor']);
        $this->load->model('Antrian_model');
        $this->load->model('Pendonor_model');
        $this->load->model('Hasil_donor_model');
    }

    // BR2 (dipakai juga oleh Antrian::cek_interval_donor() saat mengambil
    // nomor antrian baru) -- null kalau sudah boleh donor sekarang, atau
    // tanggal terdekat pendonor boleh donor lagi kalau belum.
    private function estimasi_boleh_donor_berikutnya($id_pendonor)
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

    /**
     * FR-8.1: riwayat lengkap kegiatan donor darah pendonor beserta
     * statusnya. FR-8.3: sekaligus dilampirkan estimasi tanggal pendonor
     * berikutnya diperbolehkan mendonor lagi.
     * GET /riwayat
     */
    public function index()
    {
        $id_pendonor = $this->user_data->id_pendonor;
        $this->Antrian_model->expire_overdue($id_pendonor);

        $riwayat = $this->Antrian_model->get_riwayat_by_pendonor($id_pendonor);

        $list = array_map(function ($r) {
            return array(
                'id_antrian'         => $r->id_antrian,
                'nomor_urut'         => $r->nomor_urut,
                'status'             => $r->status,
                'tanggal'            => $r->tanggal,
                'slot_waktu'         => $r->slot_waktu,
                'nama_lokasi'        => $r->nama_lokasi,
                'status_kelayakan'   => $r->status_kelayakan,
                'volume_darah'       => $r->volume_darah,
                // FR-8.2: tombol "Unduh Sertifikat" cuma relevan kalau donor
                // ini benar-benar selesai DAN dinyatakan layak oleh petugas.
                'sertifikat_tersedia' => ($r->status === 'selesai' && $r->status_kelayakan === 'layak'),
            );
        }, $riwayat);

        $boleh_lagi_pada = $this->estimasi_boleh_donor_berikutnya($id_pendonor);
        $jumlah_donor_berhasil = count(array_filter($riwayat, function ($r) {
            return $r->status === 'selesai' && $r->status_kelayakan === 'layak';
        }));

        json_response(200, 'success', 'Riwayat donor', array(
            'riwayat'                     => $list,
            'jumlah_donor_berhasil'       => $jumlah_donor_berhasil,
            'boleh_donor_sekarang'        => empty($boleh_lagi_pada),
            'estimasi_donor_berikutnya'   => $boleh_lagi_pada,
        ));
    }

    /**
     * FR-8.2: unduh sertifikat donor digital (PDF) untuk satu antrian yang
     * sudah selesai dan dinyatakan layak oleh petugas.
     * GET /riwayat/:id_antrian/sertifikat
     */
    public function sertifikat($id_antrian)
    {
        $id_pendonor = $this->user_data->id_pendonor;

        $antrian = $this->Antrian_model->get_by_id_and_pendonor($id_antrian, $id_pendonor);
        if (!$antrian) {
            json_response(404, 'error', 'Antrian tidak ditemukan');
            return;
        }
        if ($antrian->status !== 'selesai') {
            json_response(400, 'error', 'Sertifikat hanya tersedia untuk donor yang sudah selesai diproses');
            return;
        }

        $hasil = $this->Hasil_donor_model->get_by_id_antrian($id_antrian);
        if (!$hasil || $hasil->status_kelayakan !== 'layak') {
            json_response(400, 'error', 'Sertifikat hanya tersedia untuk donor yang dinyatakan layak oleh petugas');
            return;
        }

        $this->load->model('Jadwal_model');
        $jadwal = $this->Jadwal_model->get_by_id_with_lokasi($antrian->id_jadwal);
        $pendonor = $this->Pendonor_model->get_by_id($id_pendonor);

        $nomor_sertifikat = 'SERT-' . date('Y', strtotime($hasil->tanggal)) . '-' . str_pad($hasil->id_hasil, 6, '0', STR_PAD_LEFT);

        $html = $this->load->view('sertifikat_donor', array(
            'nomor_sertifikat' => $nomor_sertifikat,
            'nama'             => $pendonor->nama,
            'golongan_darah'   => $pendonor->golongan_darah,
            'tanggal'          => $hasil->tanggal,
            'nama_lokasi'      => $jadwal ? $jadwal->nama_lokasi : '-',
            'volume_darah'     => $hasil->volume_darah,
        ), TRUE);

        require_once FCPATH . 'vendor/autoload.php';
        $dompdf = new \Dompdf\Dompdf(array('isRemoteEnabled' => false));

        // Font custom sertifikat (Jost, Cormorant Garamond, Alex Brush)
        // didaftarkan manual dari file lokal -- BUKAN lewat @font-face di
        // view, supaya tidak bergantung isRemoteEnabled (yang sengaja
        // dimatikan) dan supaya cache metrik font Dompdf langsung terisi
        // sebelum render.
        $font_dir = APPPATH . 'assets/fonts/';
        $font_metrics = $dompdf->getFontMetrics();
        $font_metrics->registerFont(array('family' => 'Alex Brush', 'style' => 'normal', 'weight' => 'normal'), $font_dir . 'AlexBrush-Regular.ttf');
        $font_metrics->registerFont(array('family' => 'Cormorant Garamond', 'style' => 'normal', 'weight' => 'bold'), $font_dir . 'CormorantGaramond-Bold.ttf');
        $font_metrics->registerFont(array('family' => 'Cormorant Garamond', 'style' => 'normal', 'weight' => '600'), $font_dir . 'CormorantGaramond-SemiBold.ttf');
        $font_metrics->registerFont(array('family' => 'Jost', 'style' => 'normal', 'weight' => 'normal'), $font_dir . 'Jost-Regular.ttf');
        $font_metrics->registerFont(array('family' => 'Jost', 'style' => 'normal', 'weight' => '500'), $font_dir . 'Jost-Medium.ttf');
        $font_metrics->registerFont(array('family' => 'Jost', 'style' => 'normal', 'weight' => '600'), $font_dir . 'Jost-SemiBold.ttf');

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        $filename = 'Sertifikat-Donor-' . $antrian->id_antrian . '.pdf';

        // MY_Controller::verify_token() sudah exit lebih dulu kalau token
        // tidak valid, jadi di titik ini aman untuk langsung stream PDF --
        // request ini datang dari fetch() dengan header Authorization di
        // frontend (bukan navigasi <a href> biasa, karena token JWT tidak
        // bisa disisipkan lewat URL biasa).
        $this->output->set_content_type('application/pdf');
        $this->output->set_header('Content-Disposition: attachment; filename="' . $filename . '"');
        $this->output->set_output($dompdf->output());
    }
}
