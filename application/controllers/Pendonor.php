<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Shell HTML untuk SPA pendonor (frontend/pendonor/). Controller ini cuma
 * merender satu view yang sama untuk SEMUA rute bersih pendonor (/jadwal,
 * /dashboard, dst) -- halaman yang sebenarnya ditampilkan ditentukan
 * client-side oleh frontend/pendonor/js/router.js berdasarkan URL saat itu.
 * Tanggung jawab controller ini cuma satu: suntikkan base_url yang benar
 * dari config (bukan ditebak lewat JS) supaya referensi CSS/JS di view
 * selalu resolve dengan benar, di URL sebersih/sedalam apa pun.
 */
class Pendonor extends CI_Controller {

    public function index($sub = null)
    {
        $data['base_url'] = rtrim($this->config->item('base_url'), '/');
        $this->load->view('pendonor_shell', $data);
    }
}
