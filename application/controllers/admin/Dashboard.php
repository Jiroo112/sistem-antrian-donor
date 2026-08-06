<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

/**
 * FR-9.1: Dashboard Statistik Donor. Dibuka untuk admin_udd & super_admin
 * (sama seperti admin/Jadwal.php & admin/Lokasi.php) -- pengguna internal
 * belum punya kolom cabang tersimpan di tabel pengguna_internal (lihat
 * juga admin/Pengguna.php), jadi Admin UDD sementara mempersempit sendiri
 * lewat query param id_lokasi alih-alih dibatasi otomatis oleh sistem.
 */
class Dashboard extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->verify_token();
        $this->verify_role(['admin_udd', 'super_admin']);
        $this->load->model('Laporan_model');
    }

    private function get_filter()
    {
        return array(
            'id_lokasi'     => $this->input->get('id_lokasi'),
            'tanggal_mulai' => $this->input->get('tanggal_mulai'),
            'tanggal_akhir' => $this->input->get('tanggal_akhir'),
        );
    }

    // GET /admin/dashboard/statistik?id_lokasi=&tanggal_mulai=&tanggal_akhir=
    public function statistik()
    {
        $filter = $this->get_filter();

        json_response(200, 'success', 'Statistik donor', array(
            'filter'     => $filter,
            'ringkasan'  => $this->Laporan_model->ringkasan($filter),
            'per_lokasi' => $this->Laporan_model->per_lokasi($filter),
            'per_hari'   => $this->Laporan_model->per_hari($filter),
        ));
    }
}
