<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/*
| -------------------------------------------------------------------------
| KONFIGURASI KUESIONER KESEHATAN PRA-DONOR (FR-2.2)
| -------------------------------------------------------------------------
| Daftar pertanyaan self-assessment yang ditampilkan ke pendonor sebelum
| mengambil nomor antrian. Setiap pertanyaan dijawab 'ya' atau 'tidak'.
|
| 'jawaban_berisiko' menandai jawaban mana yang membuat pertanyaan itu
| dianggap sebagai flag risiko (dipakai untuk hasil screening awal).
|
| PENTING: hasil kuesioner ini hanya self-assessment awal. Keputusan akhir
| kelayakan donor tetap berada di tangan petugas medis/skrining di lokasi
| (lihat Business Rules FRD poin kelayakan donor).
*/

$config['pertanyaan_kuesioner'] = [
    [
        'kode'             => 'kondisi_sehat',
        'teks'             => 'Apakah Anda dalam kondisi sehat dan tidak sedang demam, flu, atau batuk hari ini?',
        'jawaban_berisiko' => 'tidak',
    ],
    [
        'kode'             => 'tidur_cukup',
        'teks'             => 'Apakah Anda tidur cukup (minimal 4 jam) semalam sebelum donor?',
        'jawaban_berisiko' => 'tidak',
    ],
    [
        'kode'             => 'sudah_makan',
        'teks'             => 'Apakah Anda sudah makan dalam 3 jam terakhir?',
        'jawaban_berisiko' => 'tidak',
    ],
    [
        'kode'             => 'konsumsi_obat',
        'teks'             => 'Apakah Anda sedang mengonsumsi obat-obatan resep dokter dalam 7 hari terakhir?',
        'jawaban_berisiko' => 'ya',
    ],
    [
        'kode'             => 'transfusi_setahun',
        'teks'             => 'Apakah Anda pernah menerima transfusi darah dalam 1 tahun terakhir?',
        'jawaban_berisiko' => 'ya',
    ],
    [
        'kode'             => 'operasi_enam_bulan',
        'teks'             => 'Apakah Anda menjalani operasi/tindakan medis besar dalam 6 bulan terakhir?',
        'jawaban_berisiko' => 'ya',
    ],
    [
        'kode'             => 'hamil_menyusui',
        'teks'             => 'Khusus pendonor wanita: apakah Anda sedang hamil atau menyusui?',
        'jawaban_berisiko' => 'ya',
    ],
];