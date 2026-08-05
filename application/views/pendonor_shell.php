<?php defined('BASEPATH') OR exit('No direct script access allowed'); ?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sistem Antrian Online Donor Darah</title>
<link rel="stylesheet" href="<?= $base_url ?>/frontend/css/style.css">
</head>
<body>

  <header class="topbar">
    <div class="topbar__inner">
      <a href="<?= $base_url ?>/" data-route="/" class="brand">
        <span class="brand__mark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 5 10.5 5 15.2C5 19 8.13 22 12 22C15.87 22 19 19 19 15.2C19 10.5 12 2 12 2Z" fill="white"/></svg>
        </span>
        <span class="brand__name">Antrian Donor Darah<small>PMI / UDD · Layanan Digital</small></span>
      </a>
      <nav class="nav" id="nav-slot"></nav>
    </div>
  </header>

  <main id="app"></main>

  <footer class="footer">
    <div class="shell">
      <p class="muted">Sistem Antrian Online Donor Darah — bukan pengganti diagnosis medis. Keputusan akhir kelayakan donor ditentukan oleh petugas medis di lokasi.</p>
      <p class="muted">Petugas / Admin UDD? <a href="<?= $base_url ?>/admin">Masuk ke Panel Petugas →</a></p>
    </div>
  </footer>

  <div class="toast-wrap" id="toast-wrap"></div>

  <!-- qrcode.js adalah kode pihak ketiga (UMD, vendored) yang dimuat sebagai
       script klasik supaya bisa dibaca lewat window.qrcode oleh js/qr.js;
       ES module utama (js/main.js) mengurus sisanya lewat import/export. -->
  <script src="<?= $base_url ?>/frontend/js/qrcode.js"></script>
  <script type="module" src="<?= $base_url ?>/frontend/pendonor/js/main.js"></script>
</body>
</html>
