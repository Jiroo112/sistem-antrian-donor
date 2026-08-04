<?php
defined('BASEPATH') OR exit('No direct script access allowed');

require_once APPPATH . 'core/MY_Controller.php';

class Profil extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
        $this->load->model('Pendonor_model');
        $this->load->model('Riwayat_kesehatan_model');
        $this->load->library('form_validation');
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
     * FR-2.1: Lihat Profil Pendonor (data akun + data kesehatan dasar terbaru)
     * GET /profil
     * Header: Authorization: Bearer <token>
     */
    public function index()
    {
        $this->verify_token();

        $pendonor = $this->Pendonor_model->get_by_id($this->user_data->id_pendonor);

        if (!$pendonor) {
            json_response(404, 'error', 'Data pendonor tidak ditemukan');
            return;
        }

        unset($pendonor->password_hash);

        $riwayat = $this->Riwayat_kesehatan_model->get_latest_by_pendonor($pendonor->id_pendonor);

        if ($riwayat && isset($riwayat->hasil_kuesioner)) {
            $riwayat->hasil_kuesioner = json_decode($riwayat->hasil_kuesioner);
        }

        json_response(200, 'success', 'Profil pendonor', [
            'akun'              => $pendonor,
            'riwayat_kesehatan' => $riwayat,
        ]);
    }

    /**
     * FR-2.1: Lengkapi/Update Profil Pendonor
     * PUT /profil
     * Body (semua opsional, kirim yang mau diisi/diubah saja):
     *   golongan_darah (A/B/AB/O), alamat,
     *   berat_badan, tekanan_darah, penyakit_bawaan, riwayat_donor_sebelumnya
     */
    public function update()
    {
        $this->verify_token();
        $data = $this->get_json_input();

        // PENTING: request ini pakai method PUT, bukan POST.
        // Library form_validation bawaan CI3 hanya mau mendaftarkan rule
        // (set_rules) kalau request method-nya POST, KECUALI kita kasih
        // data validasi sendiri lewat set_data(). Tanpa baris ini, semua
        // set_rules() di bawah akan diam-diam diabaikan, run() akan
        // langsung return FALSE (karena tidak ada rule terdaftar), dan
        // error_array() akan selalu kosong -> itu sebabnya sebelumnya
        // muncul "Validasi gagal" tapi daftar error-nya kosong.
        $this->form_validation->set_data($data);

        $this->form_validation->set_rules('golongan_darah', 'Golongan Darah', 'permit_empty|in_list[A,B,AB,O]');
        $this->form_validation->set_rules('alamat', 'Alamat', 'permit_empty|max_length[500]');
        $this->form_validation->set_rules('berat_badan', 'Berat Badan', 'permit_empty|numeric|greater_than[0]');
        $this->form_validation->set_rules('tekanan_darah', 'Tekanan Darah', 'permit_empty|max_length[20]');
        $this->form_validation->set_rules('penyakit_bawaan', 'Penyakit Bawaan', 'permit_empty|max_length[500]');
        $this->form_validation->set_rules('riwayat_donor_sebelumnya', 'Riwayat Donor Sebelumnya', 'permit_empty|max_length[500]');

        if ($this->form_validation->run() === FALSE) {
            json_response(422, 'error', 'Validasi gagal', $this->form_validation->error_array());
            return;
        }

        $id_pendonor = $this->user_data->id_pendonor;

        // Field yang masuk ke tabel pendonor
        $data_akun = [];
        foreach (['golongan_darah', 'alamat'] as $field) {
            $nilai = $this->input->post($field);
            if ($nilai !== null && $nilai !== '') {
                $data_akun[$field] = $nilai;
            }
        }
        if (!empty($data_akun)) {
            $this->Pendonor_model->update($id_pendonor, $data_akun);
        }

        // Field yang masuk ke tabel riwayat_kesehatan
        $data_kesehatan = [];
        foreach (['berat_badan', 'tekanan_darah', 'penyakit_bawaan', 'riwayat_donor_sebelumnya'] as $field) {
            $nilai = $this->input->post($field);
            if ($nilai !== null && $nilai !== '') {
                $data_kesehatan[$field] = $nilai;
            }
        }
        if (!empty($data_kesehatan)) {
            $this->Riwayat_kesehatan_model->simpan_profil_kesehatan($id_pendonor, $data_kesehatan);
        }

        if (empty($data_akun) && empty($data_kesehatan)) {
            json_response(422, 'error', 'Tidak ada data yang dikirim untuk diperbarui');
            return;
        }

        $pendonor = $this->Pendonor_model->get_by_id($id_pendonor);
        unset($pendonor->password_hash);
        $riwayat = $this->Riwayat_kesehatan_model->get_latest_by_pendonor($id_pendonor);
        if ($riwayat && isset($riwayat->hasil_kuesioner)) {
            $riwayat->hasil_kuesioner = json_decode($riwayat->hasil_kuesioner);
        }

        json_response(200, 'success', 'Profil berhasil diperbarui', [
            'akun'              => $pendonor,
            'riwayat_kesehatan' => $riwayat,
        ]);
    }

    /**
     * FR-2.2: Ambil daftar pertanyaan kuesioner kesehatan pra-donor
     * GET /profil/kuesioner
     */
    public function kuesioner_form()
    {
        $this->verify_token();
        $this->config->load('kuesioner_kesehatan');

        json_response(200, 'success', 'Daftar pertanyaan kuesioner kesehatan pra-donor', [
            'pertanyaan' => $this->config->item('pertanyaan_kuesioner'),
        ]);
    }

    /**
     * FR-2.2: Submit jawaban kuesioner kesehatan pra-donor
     * POST /profil/kuesioner
     * Body: { "jawaban": { "kondisi_sehat": "ya", "tidur_cukup": "ya", ... } }
     */
    public function kuesioner_submit()
    {
        $this->verify_token();
        $this->get_json_input();
        $this->config->load('kuesioner_kesehatan');

        $daftar_pertanyaan = $this->config->item('pertanyaan_kuesioner');
        $jawaban = $this->input->post('jawaban');

        if (!is_array($jawaban) || empty($jawaban)) {
            json_response(422, 'error', 'Validasi gagal', ['jawaban' => 'Jawaban kuesioner wajib diisi dalam bentuk object/array']);
            return;
        }

        $error_tidak_lengkap = [];
        $flag_risiko = [];

        foreach ($daftar_pertanyaan as $pertanyaan) {
            $kode = $pertanyaan['kode'];

            if (!isset($jawaban[$kode]) || !in_array($jawaban[$kode], ['ya', 'tidak'], TRUE)) {
                $error_tidak_lengkap[$kode] = 'Pertanyaan "' . $pertanyaan['teks'] . '" wajib dijawab ya/tidak';
                continue;
            }

            if ($jawaban[$kode] === $pertanyaan['jawaban_berisiko']) {
                $flag_risiko[] = $kode;
            }
        }

        if (!empty($error_tidak_lengkap)) {
            json_response(422, 'error', 'Validasi gagal', $error_tidak_lengkap);
            return;
        }

        $hasil_screening_awal = empty($flag_risiko) ? 'lolos_screening_awal' : 'perlu_pemeriksaan_lanjutan';

        $payload = [
            'jawaban'               => $jawaban,
            'flag_risiko'           => $flag_risiko,
            'hasil_screening_awal'  => $hasil_screening_awal,
            'diisi_pada'            => date('Y-m-d H:i:s'),
        ];

        $this->Riwayat_kesehatan_model->simpan_kuesioner($this->user_data->id_pendonor, $payload);

        json_response(200, 'success', 'Kuesioner kesehatan berhasil disimpan', [
            'hasil_screening_awal' => $hasil_screening_awal,
            'flag_risiko'          => $flag_risiko,
            'catatan'              => 'Hasil ini hanya self-assessment awal. Keputusan akhir kelayakan donor tetap ditentukan oleh petugas medis/skrining di lokasi.',
        ]);
    }

    /**
     * FR-2.3: Kartu Donor Digital (e-card)
     * GET /profil/kartu-donor
     */
    public function kartu_donor()
    {
        $this->verify_token();

        $pendonor = $this->Pendonor_model->get_by_id($this->user_data->id_pendonor);

        if (!$pendonor) {
            json_response(404, 'error', 'Data pendonor tidak ditemukan');
            return;
        }

        $golongan_darah_terverifikasi = $pendonor->golongan_darah !== 'Belum Diketahui';

        json_response(200, 'success', 'Kartu donor digital', [
            'id_unik_pendonor'             => 'DONOR-' . str_pad($pendonor->id_pendonor, 6, '0', STR_PAD_LEFT),
            'nama'                         => $pendonor->nama,
            'golongan_darah'               => $pendonor->golongan_darah,
            'golongan_darah_terverifikasi' => $golongan_darah_terverifikasi,
            'status_akun'                  => $pendonor->status_akun,
            'berlaku_sejak'                => $pendonor->created_at,
        ]);
    }
}