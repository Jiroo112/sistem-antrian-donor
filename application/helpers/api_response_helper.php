<?php
defined('BASEPATH') OR exit('No direct script access allowed');

function json_response($status_code = 200, $status = 'success', $message = '', $data = null)
{
    $CI =& get_instance();

    $response = array(
        'status'  => $status,   // 'success' atau 'error'
        'message' => $message,
        'data'    => $data,
    );

    $CI->output
       ->set_status_header($status_code)
       ->set_content_type('application/json', 'utf-8')
       ->set_output(json_encode($response));
}