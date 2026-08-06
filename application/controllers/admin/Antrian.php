<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

/**
 * Modul Manajemen Antrian -- Petugas/Admin (FR-7.2, FR-7.3). Beda dari
 * admin/Jadwal.php & admin/Lokasi.php yang khusus admin_udd/super_admin,
 * controller ini juga dibuka untuk petugas_loket karena merekalah aktor
 * utama FR-7.2/7.3 ("memanggil antrian", "verifikasi kehadiran").
 */
class Antrian extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->verify_token();
        $this->verify_role(['petugas_loket', 'admin_udd', 'super_admin']);
        $this->load->model('Antrian_model');
        $this->load->model('Jadwal_model');
        $this->load->model('Hasil_donor_model');
    }

    private function get_json_input()
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (is_array($data)) {
            $_POST = array_merge($_POST, $data);
        }
        return $_POST;
    }

    /**
     * Daftar antrian satu jadwal (buat ditampilkan di panel petugas) --
     * lengkap nama & golongan darah pendonor, sudah termasuk status
     * menunggu/dipanggil/sedang_diproses/selesai/tidak_hadir/dibatalkan.
     * GET /admin/antrian?id_jadwal=X
     */
    public function index()
    {
        $id_jadwal = $this->input->get('id_jadwal');

        if (empty($id_jadwal) || !is_numeric($id_jadwal)) {
            json_response(400, 'error', 'id_jadwal wajib diisi dan berupa angka');
            return;
        }

        $jadwal = $this->Jadwal_model->get_by_id_with_lokasi($id_jadwal);
        if (!$jadwal) {
            json_response(404, 'error', 'Jadwal tidak ditemukan');
            return;
        }

        // FR-4.3: nomor yang sudah hangus jangan ikut tampil seolah masih menunggu
        $this->Antrian_model->expire_overdue_by_jadwal($id_jadwal);

        json_response(200, 'success', 'Daftar antrian', array(
            'jadwal' => array(
                'id_jadwal'   => $jadwal->id_jadwal,
                'nama_lokasi' => $jadwal->nama_lokasi,
                'tanggal'     => $jadwal->tanggal,
                'slot_waktu'  => $jadwal->slot_waktu,
            ),
            'antrian' => $this->Antrian_model->get_for_petugas($id_jadwal),
        ));
    }

    /**
     * FR-7.2: panggil nomor antrian. Kirim `id_antrian` untuk memanggil
     * ulang/nomor tertentu secara spesifik, atau `id_jadwal` saja untuk
     * otomatis memanggil nomor menunggu berikutnya (nomor_urut terkecil).
     * POST /admin/antrian/panggil
     * Body: { id_antrian } atau { id_jadwal }
     */
    public function panggil()
    {
        $this->get_json_input();
        $id_antrian = $this->input->post('id_antrian');
        $id_jadwal  = $this->input->post('id_jadwal');

        if (!empty($id_antrian)) {
            $antrian = $this->Antrian_model->get_by_id($id_antrian);
            if (!$antrian) {
                json_response(404, 'error', 'Antrian tidak ditemukan');
                return;
            }
            if (!in_array($antrian->status, array('menunggu', 'dipanggil'), TRUE)) {
                json_response(400, 'error', 'Antrian ini sudah tidak bisa dipanggil (status: ' . $antrian->status . ')');
                return;
            }

            $this->Antrian_model->set_status($id_antrian, 'dipanggil');
            json_response(200, 'success', 'Nomor antrian berhasil dipanggil ulang', $this->Antrian_model->get_by_id($id_antrian));
            return;
        }

        if (empty($id_jadwal) || !is_numeric($id_jadwal)) {
            json_response(400, 'error', 'Isi id_antrian (panggil ulang nomor tertentu) atau id_jadwal (panggil nomor berikutnya)');
            return;
        }

        $this->Antrian_model->expire_overdue_by_jadwal($id_jadwal);

        $next = $this->Antrian_model->get_next_menunggu($id_jadwal);
        if (!$next) {
            json_response(404, 'error', 'Tidak ada antrian yang menunggu untuk jadwal ini');
            return;
        }

        $this->Antrian_model->set_status($next->id_antrian, 'dipanggil');
        json_response(200, 'success', 'Nomor antrian berikutnya berhasil dipanggil', $this->Antrian_model->get_by_id($next->id_antrian));
    }

    /**
     * FR-7.2: lewati (skip) satu nomor -- misalnya sudah dipanggil tapi
     * pendonornya tidak merespons. Ditandai 'tidak_hadir' dan kuota
     * dikembalikan (simetris dengan pembatalan oleh pendonor sendiri).
     * POST /admin/antrian/lewati/:id_antrian
     */
    public function lewati($id_antrian)
    {
        $antrian = $this->Antrian_model->get_by_id($id_antrian);
        if (!$antrian) {
            json_response(404, 'error', 'Antrian tidak ditemukan');
            return;
        }
        if (!in_array($antrian->status, array('menunggu', 'dipanggil'), TRUE)) {
            json_response(400, 'error', 'Antrian ini sudah tidak bisa dilewati (status: ' . $antrian->status . ')');
            return;
        }

        $this->Antrian_model->set_status($id_antrian, 'tidak_hadir');
        $this->Jadwal_model->tambah_kuota($antrian->id_jadwal);

        json_response(200, 'success', 'Antrian ditandai tidak hadir, kuota dikembalikan');
    }

    /**
     * FR-7.3: verifikasi kehadiran pendonor lewat scan QR code (atau
     * id_antrian manual kalau scanner bermasalah). Nomor harus sudah
     * berstatus 'dipanggil' dulu -- sesuai alur FRD (dipanggil -> baru
     * check-in), bukan langsung dari 'menunggu'.
     * POST /admin/antrian/checkin
     * Body: { qr_code } atau { id_antrian }
     */
    public function checkin()
    {
        $this->get_json_input();
        $qr_code = $this->input->post('qr_code');
        $id_antrian_input = $this->input->post('id_antrian');

        if (!empty($qr_code)) {
            $antrian = $this->Antrian_model->get_by_qr_code($qr_code);
        } elseif (!empty($id_antrian_input)) {
            $antrian = $this->Antrian_model->get_by_id($id_antrian_input);
        } else {
            json_response(400, 'error', 'qr_code atau id_antrian wajib diisi');
            return;
        }

        if (!$antrian) {
            json_response(404, 'error', 'Antrian tidak ditemukan / kode QR tidak valid');
            return;
        }
        if ($antrian->status !== 'dipanggil') {
            json_response(400, 'error', 'Antrian ini belum dipanggil atau statusnya sudah berubah (status: ' . $antrian->status . ')');
            return;
        }

        $this->Antrian_model->set_status($antrian->id_antrian, 'sedang_diproses', array(
            'waktu_checkin' => date('Y-m-d H:i:s'),
        ));

        json_response(200, 'success', 'Check-in berhasil, pendonor sedang diproses', $this->Antrian_model->get_by_id($antrian->id_antrian));
    }

    /**
     * Menutup alur: tandai antrian selesai diproses setelah donor selesai
     * secara fisik di lokasi. Sekaligus mencatat hasil donor (Modul Riwayat
     * & Sertifikat Donor, FR-8.x) -- BR5: keputusan akhir kelayakan donor
     * darah tetap di tangan petugas medis/skrining di lokasi, jadi field ini
     * diisi petugas di sini, bukan otomatis dari kuesioner self-assessment
     * pendonor. status_kelayakan default 'layak' kalau tidak dikirim (supaya
     * tidak jadi breaking change untuk client lama), tapi UI panel petugas
     * saat ini selalu mengirimnya secara eksplisit.
     * POST /admin/antrian/selesai/:id_antrian
     * Body (opsional): { status_kelayakan, volume_darah, catatan_petugas }
     */
    public function selesai($id_antrian)
    {
        $this->get_json_input();

        $antrian = $this->Antrian_model->get_by_id($id_antrian);
        if (!$antrian) {
            json_response(404, 'error', 'Antrian tidak ditemukan');
            return;
        }
        if ($antrian->status !== 'sedang_diproses') {
            json_response(400, 'error', 'Antrian ini belum sedang diproses (status: ' . $antrian->status . ')');
            return;
        }

        $status_kelayakan = $this->input->post('status_kelayakan');
        if (empty($status_kelayakan)) {
            $status_kelayakan = 'layak';
        }
        if (!in_array($status_kelayakan, array('layak', 'tidak_layak', 'ditunda'), TRUE)) {
            json_response(400, 'error', 'status_kelayakan tidak valid (layak/tidak_layak/ditunda)');
            return;
        }

        $volume_darah = $this->input->post('volume_darah');
        $catatan_petugas = $this->input->post('catatan_petugas');
        $waktu_selesai = date('Y-m-d H:i:s');

        $this->Antrian_model->set_status($id_antrian, 'selesai', array(
            'waktu_selesai' => $waktu_selesai,
        ));

        $this->Hasil_donor_model->upsert($id_antrian, array(
            'status_kelayakan' => $status_kelayakan,
            'volume_darah'     => ($volume_darah !== null && $volume_darah !== '') ? $volume_darah : null,
            'catatan_petugas'  => ($catatan_petugas !== null && $catatan_petugas !== '') ? $catatan_petugas : null,
            'tanggal'          => date('Y-m-d'),
        ));

        json_response(200, 'success', 'Antrian ditandai selesai', array(
            'status_kelayakan' => $status_kelayakan,
        ));
    }
}
