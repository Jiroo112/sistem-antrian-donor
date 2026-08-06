<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

/**
 * FR-9.2: Laporan Ekspor Data. index() mengembalikan data JSON (dipakai
 * frontend buat menampilkan tabel laporan + tombol "Cetak / Simpan PDF"
 * lewat window.print()); export() mengembalikan file CSV mentah (dibuka
 * native oleh Excel). Proyek ini tidak punya library PDF/Excel terpasang
 * (lihat composer.json -- cuma firebase/php-jwt), jadi CSV dipilih sebagai
 * format ekspor yang jalan tanpa dependency baru, sementara "PDF" dipenuhi
 * lewat cetak browser dari tabel yang sama, bukan generate file di server.
 */
class Laporan extends MY_Controller {

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

    // GET /admin/laporan?id_lokasi=&tanggal_mulai=&tanggal_akhir=
    public function index()
    {
        $filter = $this->get_filter();
        json_response(200, 'success', 'Data laporan', array(
            'filter' => $filter,
            'data'   => $this->Laporan_model->data_export($filter),
        ));
    }

    // GET /admin/laporan/export?id_lokasi=&tanggal_mulai=&tanggal_akhir=
    // Butuh header Authorization sama seperti endpoint lain (dipanggil lewat
    // fetch() + blob di frontend, bukan link biasa -- lihat Api.adminLaporanExport()).
    public function export()
    {
        $filter = $this->get_filter();
        $rows = $this->Laporan_model->data_export($filter);

        $kolom = array(
            'id_antrian'     => 'ID Antrian',
            'nomor_urut'     => 'Nomor Urut',
            'status'         => 'Status',
            'nama_pendonor'  => 'Nama Pendonor',
            'nik'            => 'NIK',
            'jenis_kelamin'  => 'Jenis Kelamin',
            'golongan_darah' => 'Golongan Darah',
            'nama_lokasi'    => 'Lokasi',
            'tanggal'        => 'Tanggal',
            'slot_waktu'     => 'Slot Waktu',
            'waktu_checkin'  => 'Waktu Check-in',
            'waktu_selesai'  => 'Waktu Selesai',
        );

        $filename = 'laporan-donor-' . date('Y-m-d_His') . '.csv';

        $this->output
            ->set_content_type('text/csv', 'utf-8')
            ->set_header('Content-Disposition: attachment; filename="' . $filename . '"');

        // Ditulis langsung ke php://output (streaming) alih-alih lewat
        // json_response()/$this->output->set_output() -- CSV bukan payload
        // yang mau dibungkus struktur {status,message,data} seperti endpoint lain.
        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF"); // BOM supaya Excel Windows baca UTF-8 (mis. golongan darah, nama) dengan benar
        fputcsv($out, array_values($kolom));

        foreach ($rows as $row) {
            $line = array();
            foreach (array_keys($kolom) as $key) {
                $line[] = isset($row->$key) ? $row->$key : '';
            }
            fputcsv($out, $line);
        }
        fclose($out);
        exit;
    }
}
