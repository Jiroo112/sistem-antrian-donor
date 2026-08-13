-- Jalankan DESCRIBE notifikasi; dulu -- kalau kolom dibaca/dibaca_at
-- sudah ada (kata temanmu backend sudah "selesai"), lewati bagian ALTER
-- yang itu saja, tapi bagian enum `jenis` & tabel device_tokens di bawah
-- ini TETAP WAJIB karena belum pernah disinggung sebelumnya.

-- 1) Kolom baca/belum-baca buat GET /notifikasi/ringkasan (badge bell icon)
ALTER TABLE `notifikasi`
  ADD COLUMN `dibaca` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status_terkirim`,
  ADD COLUMN `dibaca_at` DATETIME DEFAULT NULL AFTER `dibaca`;

-- 2) Tambah jenis notifikasi baru yang dipakai kode (nomor_dipanggil = FIX
-- utama masalah ini, dilewati = sudah dipakai kode tapi belum ada di enum)
ALTER TABLE `notifikasi`
  MODIFY `jenis` ENUM(
    'konfirmasi_pendaftaran',
    'pengingat_h1',
    'giliran_mendekati',
    'perubahan_jadwal',
    'nomor_dipanggil',
    'dilewati'
  ) NOT NULL;

-- 3) Tabel penyimpanan FCM token per device pendonor (satu akun bisa
-- login di beberapa HP, jadi 1 pendonor : banyak token)
CREATE TABLE `device_tokens` (
  `id_device_token` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_pendonor` INT UNSIGNED NOT NULL,
  `fcm_token` VARCHAR(255) NOT NULL,
  `platform` VARCHAR(20) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_device_token`),
  UNIQUE KEY `uq_fcm_token` (`fcm_token`),
  KEY `idx_id_pendonor` (`id_pendonor`),
  CONSTRAINT `fk_device_tokens_pendonor` FOREIGN KEY (`id_pendonor`)
    REFERENCES `pendonor` (`id_pendonor`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
