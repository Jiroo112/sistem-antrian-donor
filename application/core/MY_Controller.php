<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class MY_Controller extends CI_Controller {

    protected $user_data = null;

    public function __construct()
    {
        parent::__construct();
        $this->load->database();
        $this->load->helper('api_response');
        $this->load->model('Session_model');
    }

    // Panggil ini di constructor controller turunan yang butuh login
    protected function verify_token()
{
    $auth_header = $this->input->get_request_header('Authorization', TRUE);

    if (empty($auth_header) || !preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
        json_response(401, 'error', 'Token tidak ditemukan');
        exit;
    }

    $jwt = $matches[1];

    try {
        $key = $this->config->item('jwt_secret_key');
        $decoded = \Firebase\JWT\JWT::decode($jwt, new \Firebase\JWT\Key($key, 'HS256'));
        $this->user_data = $decoded;
    } catch (\Throwable $e) {
        json_response(401, 'error', 'Token tidak valid atau kedaluwarsa');
        exit;
    }

    // Cek apakah sesi (jti) ini masih aktif di database
    if (isset($this->user_data->jti)) {
        $sesi = $this->Session_model->get_by_jti($this->user_data->jti);
        if (!$sesi || $sesi->status !== 'aktif') {
            json_response(401, 'error', 'Sesi sudah berakhir, silakan login kembali');
            exit;
        }
        $this->Session_model->touch_last_active($this->user_data->jti);
    }
}

    // Panggil setelah verify_token() untuk controller khusus role tertentu
    protected function verify_role($allowed_roles = array())
    {
        if (!in_array($this->user_data->peran ?? '', $allowed_roles)) {
            json_response(403, 'error', 'Anda tidak punya akses ke resource ini');
            exit;
        }
    }
}