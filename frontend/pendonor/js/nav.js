import { navSlot } from './elements.js';
import { el } from '../../js/shared/dom.js';
import { toast } from '../../js/shared/dom.js';
import { Auth, Api } from '../../js/api.js';
import { routeHref, navigate } from './router.js';
import { bellIconHtml, startPolling, stopPolling } from './notif-badge.js';
import { startAntrianAlertPolling, stopAntrianAlertPolling } from './antrian-alert.js';

export function renderNav() {
  const loggedIn = Auth.isLoggedIn('pendonor');
  navSlot.innerHTML = '';
  const links = loggedIn
    ? [
        ['/jadwal', 'Cari Jadwal'],
        ['/lokasi', 'Lokasi'],
        ['/antrian', 'Antrian Saya'],
        ['/riwayat', 'Riwayat & Sertifikat'],
        ['/dashboard', 'Dasbor Saya'],
      ]
    : [
        ['/jadwal', 'Cari Jadwal'],
        ['/lokasi', 'Lokasi'],
      ];
  links.forEach(([path, label]) => {
    const a = el(`<a class="nav__link" href="${routeHref(path)}" data-route="${path}">${label}</a>`);
    navSlot.appendChild(a);
  });
  if (loggedIn) {
    // FR-6.x: bell notifikasi -- badge-nya di-poll berkala, lihat notif-badge.js
    navSlot.appendChild(el(bellIconHtml()));
    navSlot.appendChild(el(`<button class="nav__link" id="btn-logout">Keluar</button>`));
    startPolling();
    startAntrianAlertPolling();
  } else {
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
