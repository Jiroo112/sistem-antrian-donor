<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Jadwal_model extends CI_Model {

    protected $table = 'jadwal_donor';

    // ============================================================
    // FR-3.1 + FR-3.3 (PUBLIK): cari jadwal + info kuota
    // Digabung satu query karena keduanya sama-sama nampilin daftar
    // jadwal yang masih available -- misahin jadi 2 endpoint cuma
    // bikin frontend harus panggil 2x buat 1 layar yang sama.
    // ============================================================
    public function cari($filter = array())
    {
        $this->db->select("
            jadwal_donor.id_jadwal,
            jadwal_donor.tanggal,
            jadwal_donor.slot_waktu,
            jadwal_donor.kuota_total,
            jadwal_donor.kuota_tersisa,
            (jadwal_donor.kuota_total - jadwal_donor.kuota_tersisa) AS estimasi_antrian,
            lokasi_donor.id_lokasi,
            lokasi_donor.nama_lokasi,
            lokasi_donor.jenis,
            lokasi_donor.alamat,
            lokasi_donor.latitude,
            lokasi_donor.longitude
        ", FALSE);
        $this->db->from($this->table);
        $this->db->join('lokasi_donor', 'lokasi_donor.id_lokasi = jadwal_donor.id_lokasi');
        $this->db->where('jadwal_donor.status', 'aktif');
        $this->db->where('lokasi_donor.status_lokasi', 'aktif');
        $this->db->where('jadwal_donor.kuota_tersisa >', 0);

        if (!empty($filter['nama_lokasi'])) {
            $this->db->like('lokasi_donor.nama_lokasi', $filter['nama_lokasi']);
        }

        if (!empty($filter['tanggal'])) {
            // tanggal spesifik yang dicari pengguna
            $this->db->where('jadwal_donor.tanggal', $filter['tanggal']);
        } else {
            // default: jangan tampilkan jadwal yang sudah lewat
            $this->db->where('jadwal_donor.tanggal >=', date('Y-m-d'));
        }

        // FR-3.1: urutkan berdasarkan jarak terdekat kalau lat/lng dikirim
        // dari perangkat pengguna (Haversine formula, hasil dalam km)
        if (isset($filter['lat']) && isset($filter['lng']) && $filter['lat'] !== '' && $filter['lng'] !== '') {
            $lat = (float) $filter['lat'];
            $lng = (float) $filter['lng'];

            $haversine = "(6371 * ACOS(
                COS(RADIANS($lat)) * COS(RADIANS(lokasi_donor.latitude)) *
                COS(RADIANS(lokasi_donor.longitude) - RADIANS($lng)) +
                SIN(RADIANS($lat)) * SIN(RADIANS(lokasi_donor.latitude))
            ))";
            $this->db->select("$haversine AS jarak_km", FALSE);
            $this->db->order_by('jarak_km', 'ASC');
        } else {
            $this->db->order_by('jadwal_donor.tanggal', 'ASC');
            $this->db->order_by('jadwal_donor.slot_waktu', 'ASC');
        }

        $limit  = !empty($filter['limit']) ? (int) $filter['limit'] : 20;
        $offset = !empty($filter['offset']) ? (int) $filter['offset'] : 0;
        $this->db->limit($limit, $offset);

        return $this->db->get()->result();
    }

    // ============================================================
    // CRUD ADMIN (FR-7.1)
    // ============================================================

    public function get_all($filter = array())
    {
        $this->db->select('jadwal_donor.*, lokasi_donor.nama_lokasi');
        $this->db->from($this->table);
        $this->db->join('lokasi_donor', 'lokasi_donor.id_lokasi = jadwal_donor.id_lokasi');

        if (!empty($filter['id_lokasi'])) {
            $this->db->where('jadwal_donor.id_lokasi', $filter['id_lokasi']);
        }
        if (!empty($filter['tanggal'])) {
            $this->db->where('jadwal_donor.tanggal', $filter['tanggal']);
        }
        if (!empty($filter['status'])) {
            $this->db->where('jadwal_donor.status', $filter['status']);
        }

        $this->db->order_by('jadwal_donor.tanggal', 'DESC');
        $this->db->order_by('jadwal_donor.slot_waktu', 'ASC');

        return $this->db->get()->result();
    }

    public function get_by_id($id_jadwal)
    {
        return $this->db->get_where($this->table, array('id_jadwal' => $id_jadwal))->row();
    }

    // Sama seperti get_by_id(), tapi ikut JOIN nama_lokasi & alamat -- dipakai
    // di Antrian.php buat nampilin e-ticket (FR-4.2) supaya pendonor lihat
    // nama lokasi, bukan cuma id_lokasi mentah.
    public function get_by_id_with_lokasi($id_jadwal)
    {
        $this->db->select('jadwal_donor.*, lokasi_donor.nama_lokasi, lokasi_donor.alamat');
        $this->db->from($this->table);
        $this->db->join('lokasi_donor', 'lokasi_donor.id_lokasi = jadwal_donor.id_lokasi');
        $this->db->where('jadwal_donor.id_jadwal', $id_jadwal);
        return $this->db->get()->row();
    }

    // Dipakai buat cek bentrok sebelum create/update, karena ada UNIQUE KEY
    // (id_lokasi, tanggal, slot_waktu) di tabel -- kalau nggak dicek dulu,
    // pendonor/admin bakal lihat error MySQL mentah alih-alih pesan yang jelas.
    public function get_by_slot($id_lokasi, $tanggal, $slot_waktu, $exclude_id_jadwal = null)
    {
        $this->db->where('id_lokasi', $id_lokasi);
        $this->db->where('tanggal', $tanggal);
        $this->db->where('slot_waktu', $slot_waktu);
        if ($exclude_id_jadwal) {
            $this->db->where('id_jadwal !=', $exclude_id_jadwal);
        }
        return $this->db->get($this->table)->row();
    }

    public function create($data)
    {
        // Kuota tersisa selalu mulai sama dengan kuota total pas jadwal dibuat
        $data['kuota_tersisa'] = $data['kuota_total'];
        $data['status'] = 'aktif';

        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    public function update($id_jadwal, $data)
    {
        // Kalau admin ubah kuota_total, kuota_tersisa harus ikut disesuaikan
        // proporsional -- bukan ditimpa mentah -- supaya kuota yang sudah
        // "terpakai" (kuota_total lama - kuota_tersisa lama) tidak hilang
        // atau bikin kuota_tersisa jadi lebih besar dari kuota_total baru.
        if (isset($data['kuota_total'])) {
            $jadwal = $this->get_by_id($id_jadwal);
            if ($jadwal) {
                $kuota_terpakai = $jadwal->kuota_total - $jadwal->kuota_tersisa;
                $data['kuota_tersisa'] = max(0, $data['kuota_total'] - $kuota_terpakai);
            }
        }

        $this->db->where('id_jadwal', $id_jadwal);
        return $this->db->update($this->table, $data);
    }

    public function delete($id_jadwal)
    {
        // Soft delete (sama seperti pola di Lokasi_model) -- kolom `status`
        // di tabel ini emang sudah 3 nilai (aktif/ditutup/dibatalkan), dan
        // FK dari antrian ke jadwal_donor pakai ON DELETE RESTRICT, jadi
        // hard delete bakal ditolak MySQL sendiri kalau sudah ada antrian.
        return $this->db->update($this->table, array('status' => 'dibatalkan'), array('id_jadwal' => $id_jadwal));
    }

    // ============================================================
    // FR-4.1 + BR6 (Modul Pendaftaran Antrian Online): kuota dikurangi/
    // dikembalikan lewat UPDATE atomik (bukan read-modify-write PHP) supaya
    // aman dari race condition dua request barengan -- kuota_tersisa tidak
    // pernah lolos di bawah 0 (WHERE kuota_tersisa > 0) atau lampaui
    // kuota_total (LEAST()) walau banyak pendonor mendaftar bersamaan.
    // ============================================================

    public function kurangi_kuota($id_jadwal)
    {
        $this->db->where('id_jadwal', $id_jadwal);
        $this->db->where('kuota_tersisa >', 0);
        $this->db->set('kuota_tersisa', 'kuota_tersisa - 1', FALSE);
        $this->db->update($this->table);
        return $this->db->affected_rows() === 1;
    }

    public function tambah_kuota($id_jadwal)
    {
        $this->db->where('id_jadwal', $id_jadwal);
        $this->db->set('kuota_tersisa', 'LEAST(kuota_tersisa + 1, kuota_total)', FALSE);
        return $this->db->update($this->table);
    }
}
