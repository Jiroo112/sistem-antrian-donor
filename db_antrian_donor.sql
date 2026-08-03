-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 03, 2026 at 06:28 AM
-- Server version: 8.4.3
-- PHP Version: 8.1.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_antrian_donor`
--

-- --------------------------------------------------------

--
-- Table structure for table `antrian`
--

CREATE TABLE `antrian` (
  `id_antrian` int UNSIGNED NOT NULL,
  `id_pendonor` int UNSIGNED NOT NULL,
  `id_jadwal` int UNSIGNED NOT NULL,
  `nomor_urut` int UNSIGNED NOT NULL,
  `status` enum('menunggu','dipanggil','sedang_diproses','selesai','tidak_hadir','dibatalkan') NOT NULL DEFAULT 'menunggu',
  `qr_code` varchar(255) NOT NULL,
  `batas_waktu_checkin` datetime DEFAULT NULL COMMENT 'FR-4.3: nomor hangus jika tidak check-in sebelum ini',
  `waktu_checkin` datetime DEFAULT NULL,
  `waktu_selesai` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hasil_donor`
--

CREATE TABLE `hasil_donor` (
  `id_hasil` int UNSIGNED NOT NULL,
  `id_antrian` int UNSIGNED NOT NULL,
  `status_kelayakan` enum('layak','tidak_layak','ditunda') NOT NULL,
  `volume_darah` decimal(6,2) DEFAULT NULL COMMENT 'dalam ml',
  `catatan_petugas` text,
  `tanggal` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_donor`
--

CREATE TABLE `jadwal_donor` (
  `id_jadwal` int UNSIGNED NOT NULL,
  `id_lokasi` int UNSIGNED NOT NULL,
  `tanggal` date NOT NULL,
  `slot_waktu` varchar(20) NOT NULL COMMENT 'contoh: 08:00-10:00',
  `kuota_total` int UNSIGNED NOT NULL,
  `kuota_tersisa` int UNSIGNED NOT NULL,
  `status` enum('aktif','ditutup','dibatalkan') NOT NULL DEFAULT 'aktif',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lokasi_donor`
--

CREATE TABLE `lokasi_donor` (
  `id_lokasi` int UNSIGNED NOT NULL,
  `nama_lokasi` varchar(150) NOT NULL,
  `jenis` enum('tetap','mobile_unit') NOT NULL DEFAULT 'tetap',
  `alamat` text NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `status_lokasi` enum('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifikasi`
--

CREATE TABLE `notifikasi` (
  `id_notifikasi` int UNSIGNED NOT NULL,
  `id_pendonor` int UNSIGNED NOT NULL,
  `jenis` enum('konfirmasi_pendaftaran','pengingat_h1','giliran_mendekati','perubahan_jadwal') NOT NULL,
  `isi_pesan` text NOT NULL,
  `status_terkirim` enum('pending','terkirim','gagal') NOT NULL DEFAULT 'pending',
  `waktu_kirim` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pendonor`
--

CREATE TABLE `pendonor` (
  `id_pendonor` int UNSIGNED NOT NULL,
  `nik` varchar(16) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `tanggal_lahir` date NOT NULL,
  `jenis_kelamin` enum('L','P') NOT NULL,
  `golongan_darah` enum('A','B','AB','O','Belum Diketahui') NOT NULL DEFAULT 'Belum Diketahui',
  `no_telp` varchar(20) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `alamat` text,
  `status_akun` enum('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengguna_internal`
--

CREATE TABLE `pengguna_internal` (
  `id_pengguna` int UNSIGNED NOT NULL,
  `nama` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `peran` enum('petugas_loket','admin_udd','super_admin') NOT NULL,
  `id_lokasi` int UNSIGNED DEFAULT NULL COMMENT 'NULL untuk super_admin (akses semua cabang)',
  `status_akun` enum('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_kesehatan`
--

CREATE TABLE `riwayat_kesehatan` (
  `id_riwayat` int UNSIGNED NOT NULL,
  `id_pendonor` int UNSIGNED NOT NULL,
  `berat_badan` decimal(5,2) DEFAULT NULL COMMENT 'dalam kg',
  `tekanan_darah` varchar(20) DEFAULT NULL COMMENT 'contoh: 120/80',
  `hasil_kuesioner` json DEFAULT NULL COMMENT 'jawaban self-assessment pra-donor',
  `catatan_medis` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `antrian`
--
ALTER TABLE `antrian`
  ADD PRIMARY KEY (`id_antrian`),
  ADD UNIQUE KEY `qr_code` (`qr_code`),
  ADD UNIQUE KEY `uniq_nomor_per_jadwal` (`id_jadwal`,`nomor_urut`),
  ADD KEY `idx_antrian_pendonor` (`id_pendonor`),
  ADD KEY `idx_antrian_jadwal` (`id_jadwal`),
  ADD KEY `idx_antrian_status` (`status`);

--
-- Indexes for table `hasil_donor`
--
ALTER TABLE `hasil_donor`
  ADD PRIMARY KEY (`id_hasil`),
  ADD UNIQUE KEY `id_antrian` (`id_antrian`);

--
-- Indexes for table `jadwal_donor`
--
ALTER TABLE `jadwal_donor`
  ADD PRIMARY KEY (`id_jadwal`),
  ADD UNIQUE KEY `uniq_jadwal_slot` (`id_lokasi`,`tanggal`,`slot_waktu`),
  ADD KEY `idx_jadwal_lokasi` (`id_lokasi`),
  ADD KEY `idx_jadwal_tanggal` (`tanggal`);

--
-- Indexes for table `lokasi_donor`
--
ALTER TABLE `lokasi_donor`
  ADD PRIMARY KEY (`id_lokasi`);

--
-- Indexes for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD PRIMARY KEY (`id_notifikasi`),
  ADD KEY `idx_notifikasi_pendonor` (`id_pendonor`),
  ADD KEY `idx_notifikasi_status` (`status_terkirim`);

--
-- Indexes for table `pendonor`
--
ALTER TABLE `pendonor`
  ADD PRIMARY KEY (`id_pendonor`),
  ADD UNIQUE KEY `nik` (`nik`),
  ADD UNIQUE KEY `no_telp` (`no_telp`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `pengguna_internal`
--
ALTER TABLE `pengguna_internal`
  ADD PRIMARY KEY (`id_pengguna`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_pengguna_lokasi` (`id_lokasi`),
  ADD KEY `idx_pengguna_peran` (`peran`);

--
-- Indexes for table `riwayat_kesehatan`
--
ALTER TABLE `riwayat_kesehatan`
  ADD PRIMARY KEY (`id_riwayat`),
  ADD KEY `idx_riwayat_pendonor` (`id_pendonor`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `antrian`
--
ALTER TABLE `antrian`
  MODIFY `id_antrian` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hasil_donor`
--
ALTER TABLE `hasil_donor`
  MODIFY `id_hasil` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jadwal_donor`
--
ALTER TABLE `jadwal_donor`
  MODIFY `id_jadwal` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lokasi_donor`
--
ALTER TABLE `lokasi_donor`
  MODIFY `id_lokasi` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifikasi`
--
ALTER TABLE `notifikasi`
  MODIFY `id_notifikasi` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pendonor`
--
ALTER TABLE `pendonor`
  MODIFY `id_pendonor` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pengguna_internal`
--
ALTER TABLE `pengguna_internal`
  MODIFY `id_pengguna` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `riwayat_kesehatan`
--
ALTER TABLE `riwayat_kesehatan`
  MODIFY `id_riwayat` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `antrian`
--
ALTER TABLE `antrian`
  ADD CONSTRAINT `fk_antrian_jadwal` FOREIGN KEY (`id_jadwal`) REFERENCES `jadwal_donor` (`id_jadwal`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_antrian_pendonor` FOREIGN KEY (`id_pendonor`) REFERENCES `pendonor` (`id_pendonor`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `hasil_donor`
--
ALTER TABLE `hasil_donor`
  ADD CONSTRAINT `fk_hasil_antrian` FOREIGN KEY (`id_antrian`) REFERENCES `antrian` (`id_antrian`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `jadwal_donor`
--
ALTER TABLE `jadwal_donor`
  ADD CONSTRAINT `fk_jadwal_lokasi` FOREIGN KEY (`id_lokasi`) REFERENCES `lokasi_donor` (`id_lokasi`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD CONSTRAINT `fk_notifikasi_pendonor` FOREIGN KEY (`id_pendonor`) REFERENCES `pendonor` (`id_pendonor`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pengguna_internal`
--
ALTER TABLE `pengguna_internal`
  ADD CONSTRAINT `fk_pengguna_lokasi` FOREIGN KEY (`id_lokasi`) REFERENCES `lokasi_donor` (`id_lokasi`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `riwayat_kesehatan`
--
ALTER TABLE `riwayat_kesehatan`
  ADD CONSTRAINT `fk_riwayat_pendonor` FOREIGN KEY (`id_pendonor`) REFERENCES `pendonor` (`id_pendonor`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
