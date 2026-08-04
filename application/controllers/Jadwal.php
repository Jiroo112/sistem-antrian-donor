<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

/**
 * Controller publik -- TIDAK pakai verify_token(). Pendonor yang belum
 * login pun harus bisa lihat jadwal & sisa kuota sebelum daftar (FR-3.1,
 * FR-3.3 aktornya "Pendonor" tapi belum tentu sudah login).
 */
class Jadwal extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->load->model('Jadwal_model');
    }

    // GET /jadwal/cari?id_lokasi=&tanggal=&lat=&lng=&limit=&offset=
    public function cari()
    {
        $filter = [
            'id_lokasi' => $this->input->get('id_lokasi'),
            'tanggal'   => $this->input->get('tanggal'),
            'lat'       => $this->input->get('lat'),
            'lng'       => $this->input->get('lng'),
            'limit'     => $this->input->get('limit'),
            'offset'    => $this->input->get('offset'),
        ];

        $data = $this->Jadwal_model->cari($filter);
        json_response(200, 'success', 'Daftar jadwal tersedia', $data);
    }
}
