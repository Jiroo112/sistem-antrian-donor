<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Modul Notifikasi (FR-6.1 - FR-6.4). Satu titik masuk buat semua pemicu
 * notifikasi di sistem -- murni in-app (dicatat ke tabel `notifikasi`,
 * ditampilkan di bell/daftar notifikasi pendonor lewat Notifikasi.php),
 * TIDAK dikirim lewat email. status_terkirim ditandai 'terkirim' langsung
 * begitu berhasil dicatat, karena in-app adalah satu-satunya kanal --
 * kalau nanti ditambah kanal asli (email/WhatsApp/push), status ini yang
 * dipakai buat tahu apakah kanal itu berhasil terkirim atau tidak.
 */
class Notifikasi_service {

    protected $CI;

    public function __construct()
    {
        $this->CI =& get_instance();
        $this->CI->load->model('Notifikasi_model');
    }

    /**
     * @param int    $id_pendonor
     * @param string $jenis        salah satu dari kolom enum `notifikasi.jenis`
     * @param string $isi_pesan    teks polos, ditampilkan apa adanya di
     *                             daftar notifikasi in-app
     * @return int id_notifikasi
     */
    public function kirim($id_pendonor, $jenis, $isi_pesan)
    {
        $id_notifikasi = $this->CI->Notifikasi_model->create($id_pendonor, $jenis, $isi_pesan);
        $this->CI->Notifikasi_model->mark_terkirim($id_notifikasi);
        return $id_notifikasi;
    }
}
