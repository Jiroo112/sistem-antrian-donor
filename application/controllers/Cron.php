<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Modul Notifikasi (FR-6.2): tugas terjadwal yang TIDAK dipicu request HTTP
 * biasa -- sistem ini tidak punya worker/queue, jadi pengingat H-1 dikirim
 * lewat controller CLI ini, dijalankan sekali sehari oleh cron job (Linux)
 * atau Task Scheduler (Windows) di server:
 *
 *   php index.php cron pengingat_h1
 *
 * Sengaja bukan endpoint HTTP (beda dari controller lain di app ini) --
 * kalau dibuka lewat browser/HTTP akan ditolak, supaya tidak ada orang luar
 * yang bisa memicu pengiriman massal notifikasi lewat URL publik.
 */
class Cron extends CI_Controller {

    public function __construct()
    {
        parent::__construct();

        if (!$this->input->is_cli_request()) {
            show_404();
        }

        $this->load->database();
        $this->load->model('Jadwal_model');
        $this->load->model('Antrian_model');
        $this->load->model('Notifikasi_model');
        $this->load->library('Notifikasi_service');
    }

    /**
     * FR-6.2: pengingat otomatis menjelang jadwal donor darah pendonor --
     * dikirim ke semua pendonor dengan antrian aktif (menunggu/dipanggil)
     * pada jadwal yang jatuh besok.
     */
    public function pengingat_h1()
    {
        $besok = date('Y-m-d', strtotime('+1 day'));
        $jadwal_besok = $this->Jadwal_model->get_by_tanggal($besok);

        $jumlah_terkirim = 0;

        foreach ($jadwal_besok as $jadwal) {
            $antrian_aktif = $this->Antrian_model->get_menunggu_by_jadwal($jadwal->id_jadwal);

            foreach ($antrian_aktif as $antrian) {
                // Cegah kirim dobel kalau cron sempat jalan lebih dari
                // sekali di hari yang sama.
                if ($this->Notifikasi_model->sudah_ada_hari_ini($antrian->id_pendonor, 'pengingat_h1')) {
                    continue;
                }

                $this->notifikasi_service->kirim($antrian->id_pendonor, 'pengingat_h1', sprintf(
                    'Pengingat: besok (%s) Anda terjadwal donor darah di %s (%s), nomor antrian #%d. Jangan lupa hadir tepat waktu.',
                    $jadwal->tanggal,
                    $jadwal->nama_lokasi,
                    $jadwal->slot_waktu,
                    $antrian->nomor_urut
                ));
                $jumlah_terkirim++;
            }
        }

        echo "Pengingat H-1: {$jumlah_terkirim} notifikasi terkirim untuk jadwal tanggal {$besok}." . PHP_EOL;
    }
}
