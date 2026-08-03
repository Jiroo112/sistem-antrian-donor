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

    // set_output() hanya menyimpan konten; CI3 baru benar-benar mengirim output
    // lewat _display() di akhir eksekusi. json_response() dibuat jadi fungsi
    // "terminal": ia langsung menampilkan output DAN mengakhiri eksekusi di sini,
    // supaya perilakunya konsisten baik dipanggil diikuti `exit;`, `return;`,
    // maupun tanpa keduanya (mencegah body kosong akibat exit dini, atau body
    // dobel akibat CI3 memanggil _display() sekali lagi di akhir bootstrap).
    $CI->output->_display();
    exit;
}