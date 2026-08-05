<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Shell HTML untuk SPA panel internal / Petugas-Admin (frontend/internal/).
 * Sama seperti Pendonor.php -- satu view yang sama untuk semua rute bersih
 * /admin, /admin/jadwal, /admin/lokasi, /admin/antrian, dst. Halaman yang
 * sebenarnya ditampilkan ditentukan client-side oleh
 * frontend/internal/js/router.js.
 */
class Panel extends CI_Controller {

    public function index($sub = null)
    {
        $data['base_url'] = rtrim($this->config->item('base_url'), '/');
        $this->load->view('admin_shell', $data);
    }
}
