import { navSlot, sidebarNavSlot, sidebarFootSlot } from './elements.js';
import { el } from '../../js/shared/dom.js';
import { toast } from '../../js/shared/dom.js';
import { Auth, Api } from '../../js/api.js';
import { routeHref, navigate } from './router.js';
import { bellIconHtml, startPolling, stopPolling } from './notif-badge.js';
import { startAntrianAlertPolling, stopAntrianAlertPolling } from './antrian-alert.js';
import { icons } from './icons.js';

function sidebarLinkHtml(path, label, icon) {
  return `<a class="sidebar__link" href="${routeHref(path)}" data-route="${path}"><span class="sidebar__link-icon">${icon}</span>${label}</a>`;
}

/**
 * Sidebar cuma dipakai begitu pendonor SUDAH login -- guest/belum login
 * tetap pakai topbar biasa (markup keduanya selalu ada di
 * pendonor_shell.php, tinggal ditampilkan/disembunyikan lewat class body
 * "layout-sidebar", pola dua-mode yang sama dipakai panel admin, lihat
 * frontend/internal/js/nav.js).
 */
export function renderNav() {
  const loggedIn = Auth.isLoggedIn('pendonor');
  document.body.classList.toggle('layout-sidebar', loggedIn);

  navSlot.innerHTML = '';
  sidebarNavSlot.innerHTML = '';
  sidebarFootSlot.innerHTML = '';

  if (loggedIn) {
    const links = [
      ['/dashboard', 'Dasbor Saya', icons.dashboard],
      ['/jadwal', 'Cari Jadwal', icons.jadwal],
      ['/lokasi', 'Lokasi', icons.lokasi],
      ['/antrian', 'Antrian Saya', icons.antrian],
      ['/riwayat', 'Riwayat & Sertifikat', icons.riwayat],
    ];
    links.forEach(([path, label, icon]) => {
      sidebarNavSlot.appendChild(el(sidebarLinkHtml(path, label, icon)));
    });

    // FR-6.x: bell notifikasi -- badge-nya di-poll berkala, lihat notif-badge.js
    sidebarFootSlot.appendChild(el(bellIconHtml()));
    sidebarFootSlot.appendChild(el(`<button class="sidebar__link sidebar__link--logout" id="btn-logout"><span class="sidebar__link-icon">${icons.keluar}</span>Keluar</button>`));
    startPolling();
    startAntrianAlertPolling();
  } else {
    navSlot.appendChild(el(`<a class="nav__link" href="${routeHref('/jadwal')}" data-route="/jadwal">Cari Jadwal</a>`));
    navSlot.appendChild(el(`<a class="nav__link" href="${routeHref('/lokasi')}" data-route="/lokasi">Lokasi</a>`));
    navSlot.appendChild(el(`<a class="nav__link" href="${routeHref('/masuk')}" data-route="/masuk">Masuk</a>`));
    navSlot.appendChild(el(`<a class="btn btn-primary btn-sm" href="${routeHref('/daftar')}" data-route="/daftar">Daftar Pendonor</a>`));
  }

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await Api.logout(); } catch (_) { /* token mungkin sudah kedaluwarsa, tetap logout lokal */ }
      Auth.clearToken('pendonor');
      stopPolling();
      stopAntrianAlertPolling();
      toast('Berhasil keluar.', 'success');
      navigate('/');
    });
  }
}
