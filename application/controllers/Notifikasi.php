<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

/**
 * Modul Notifikasi (FR-6.1 - FR-6.4). Endpoint ini cuma buat pendonor
 * melihat daftar notifikasi in-app miliknya -- pengiriman notifikasinya
 * sendiri dipicu dari tempat lain lewat Notifikasi_service::kirim():
 *   - FR-6.1 konfirmasi_pendaftaran -> Antrian::ambil()
 *   - FR-6.2 pengingat_h1           -> Cron::pengingat_h1() (dijadwalkan)
 *   - FR-6.3 giliran_mendekati      -> admin\Antrian::panggil()
 *   - FR-6.4 perubahan_jadwal       -> admin\Jadwal::update()/delete()
 *   - dilewati (di luar FR-6.x asli) -> admin\Antrian::lewati()
 */
class Notifikasi extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->verify_token();
        $this->verify_role(['pendonor']);
        $this->load->model('Notifikasi_model');
    }

    /**
     * GET /notifikasi
     * Membuka daftar ini otomatis menandai semua notifikasi milik pendonor
     * sebagai terbaca (bell icon di navbar jadi bersih) -- daftar yang
     * dikembalikan tetap mencerminkan status dibaca SEBELUM ditandai,
     * supaya UI masih bisa menyorot mana yang baru masuk.
     */
    public function index()
    {
        $id_pendonor = $this->user_data->id_pendonor;
        $daftar = $this->Notifikasi_model->get_by_pendonor($id_pendonor);
        $this->Notifikasi_model->tandai_semua_dibaca($id_pendonor);
        json_response(200, 'success', 'Daftar notifikasi', $daftar);
    }

    /**
     * GET /notifikasi/ringkasan -- dipoll berkala oleh bell icon di navbar,
     * sengaja dipisah dari index() supaya polling-nya ringan (cuma hitung,
     * tidak ikut menandai dibaca ataupun tarik seluruh daftar).
     */
    public function ringkasan()
    {
        $id_pendonor = $this->user_data->id_pendonor;
        json_response(200, 'success', 'Ringkasan notifikasi', array(
            'jumlah_belum_dibaca' => $this->Notifikasi_model->get_jumlah_belum_dibaca($id_pendonor),
        ));
    }
}
