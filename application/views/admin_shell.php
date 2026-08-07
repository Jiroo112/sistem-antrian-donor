<?php defined('BASEPATH') OR exit('No direct script access allowed'); ?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Panel Petugas — Antrian Donor Darah</title>
<link rel="stylesheet" href="<?= $base_url ?>/frontend/css/style.css">
</head>
<body>

  <!--
    Sidebar kiri -- cuma ditampilkan untuk peran super_admin (lihat
    document.body.classList "layout-sidebar" yang di-toggle oleh
    frontend/internal/js/nav.js berdasarkan peran pengguna yang login).
    Untuk peran lain sidebar ini tetap ada di DOM tapi disembunyikan lewat
    CSS (default .sidebar{display:none}), topbar di bawah yang dipakai.
  -->
  <aside class="sidebar" id="sidebar">
    <a href="<?= $base_url ?>/admin" class="sidebar__brand">
      <span class="brand__mark">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 5 10.5 5 15.2C5 19 8.13 22 12 22C15.87 22 19 19 19 15.2C19 10.5 12 2 12 2Z" fill="white"/></svg>
      </span>
      <span class="brand__name">Panel Petugas<small>PMI / UDD · Internal</small></span>
    </a>
    <button type="button" class="menu-toggle" data-menu-toggle="sidebar" aria-label="Buka menu" aria-expanded="false">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
    <nav class="sidebar__nav" id="sidebar-nav-slot"></nav>
    <div class="sidebar__foot" id="sidebar-foot-slot"></div>
  </aside>

  <div class="page-wrap" id="page-wrap">
    <header class="topbar" id="topbar">
      <div class="topbar__inner">
        <a href="<?= $base_url ?>/admin" class="brand">
          <span class="brand__mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 5 10.5 5 15.2C5 19 8.13 22 12 22C15.87 22 19 19 19 15.2C19 10.5 12 2 12 2Z" fill="white"/></svg>
          </span>
          <span class="brand__name">Panel Petugas<small>PMI / UDD · Internal</small></span>
        </a>
        <button type="button" class="menu-toggle" data-menu-toggle="topbar" aria-label="Buka menu" aria-expanded="false">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <nav class="nav" id="nav-slot"></nav>
      </div>
    </header>

    <main id="app"></main>

    <footer class="footer">
      <div class="shell">
        <!-- <p class="muted">Panel ini untuk Petugas Loket, Admin UDD/Cabang, dan Super Admin. Fitur panggil antrian &amp; check-in QR (FR-7.2, FR-7.3) belum tersedia di backend saat ini.</p> -->
      </div>
    </footer>
  </div>

  <div class="toast-wrap" id="toast-wrap"></div>

  <script type="module" src="<?= $base_url ?>/frontend/internal/js/main.js"></script>
</body>
</html>
