<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

class Test_auth extends MY_Controller {

    public function index()
    {
        json_response(200, 'success', ' berjalan tanpa token check');
    }

    public function protected_route()
    {
        $this->verify_token();
        json_response(200, 'success', 'Token valid', $this->user_data);
    }
}