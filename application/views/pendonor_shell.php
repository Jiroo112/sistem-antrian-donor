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

  <aside class="sidebar" id="sidebar">
    <a href="<?= $base_url ?>/" data-route="/" class="sidebar__brand">
      <span class="brand__mark">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 5 10.5 5 15.2C5 19 8.13 22 12 22C15.87 22 19 19 19 15.2C19 10.5 12 2 12 2Z" fill="white"/></svg>
      </span>
      <span class="brand__name">Antrian Donor Darah<small>PMI / UDD · Layanan Digital</small></span>
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
        <a href="<?= $base_url ?>/" data-route="/" class="brand">
          <span class="brand__mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 5 10.5 5 15.2C5 19 8.13 22 12 22C15.87 22 19 19 19 15.2C19 10.5 12 2 12 2Z" fill="white"/></svg>
          </span>
          <span class="brand__name">Antrian Donor Darah<small>PMI / UDD · Layanan Digital</small></span>
        </a>
        <button type="button" class="menu-toggle" data-menu-toggle="topbar" aria-label="Buka menu" aria-expanded="false">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <nav class="nav" id="nav-slot"></nav>
      </div>
    </header>

    <main id="app"></main>

  </div>

  <div class="toast-wrap" id="toast-wrap"></div>

  
  <script src="<?= $base_url ?>/frontend/js/qrcode.js"></script>
  <script type="module" src="<?= $base_url ?>/frontend/pendonor/js/main.js"></script>
</body>
</html>
