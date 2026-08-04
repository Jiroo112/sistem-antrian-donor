<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

class Lokasi extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->load->model('Lokasi_model');
    }

    // GET /lokasi/peta?jenis=tetap|mobile_unit
    public function peta()
    {
        $jenis = $this->input->get('jenis');

        if ($jenis !== null && !in_array($jenis, ['tetap', 'mobile_unit'], true)) {
            json_response(400, 'error', "jenis harus 'tetap' atau 'mobile_unit'");
            return;
        }

        $filter = ['status_lokasi' => 'aktif'];
        if (!empty($jenis)) {
            $filter['jenis'] = $jenis;
        }

        $data = $this->Lokasi_model->get_all($filter);
        json_response(200, 'success', 'Titik lokasi donor untuk peta', $data);
    }
}