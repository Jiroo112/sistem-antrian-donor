/**
 * notif-badge.js — bell icon + badge jumlah notifikasi belum dibaca di
 * navbar, di-poll berkala lewat GET /notifikasi/ringkasan (query ringan,
 * lihat Notifikasi::ringkasan()) supaya pendonor tahu ada notifikasi baru
 * TANPA harus buka halaman Notifikasi dulu. Ini bukan push notification
 * OS (butuh tab/browser situs terbuka) -- untuk itu perlu Web Push, beda
 * pekerjaan yang lebih besar (service worker, VAPID, dst).
 *
 * State (jumlah, timer) sengaja disimpan di module-level (bukan di dalam
 * elemen DOM) karena elemen bell-nya sendiri dibongkar-pasang ulang setiap
 * renderNav() dipanggil (lihat main.js render() -- jalan di setiap
 * navigasi SPA), tapi polling-nya harus tetap jalan terus lintas halaman.
 */
import { Api, Auth } from '../../js/api.js';
import { toast } from '../../js/shared/dom.js';
import { routeHref } from './router.js';
import { icons } from './icons.js';

// NFR Performance: "pembaruan status antrian real-time maksimal jeda 5
// detik" -- disamakan dengan interval antrian-alert.js supaya notifikasi
// dari aksi pihak lain (mis. admin melewati antrian) juga terasa cepat
// tanpa perlu refresh/pindah tab manual.
const POLL_INTERVAL_MS = 5000;

let jumlahBelumDibaca = null; // null = belum pernah diambil sama sekali
let timerId = null;

function updateBadgeDom() {
  const badge = document.getElementById('notif-badge');
  if (!badge) return; // bell belum/tidak dirender di halaman ini (mis. belum login)
  if (!jumlahBelumDibaca) {
    badge.style.display = 'none';
    badge.textContent = '';
  } else {
    badge.style.display = '';
    badge.textContent = jumlahBelumDibaca > 9 ? '9+' : String(jumlahBelumDibaca);
  }
}

// Dipanggil viewNotifikasi setelah daftar dimuat (server sudah menandai
// semuanya dibaca sebagai efek samping GET /notifikasi) supaya badge
// langsung bersih tanpa nunggu poll berikutnya.
export function setJumlahBelumDibaca(n) {
  jumlahBelumDibaca = n;
  updateBadgeDom();
}

async function poll() {
  try {
    const res = await Api.notifikasiRingkasan();
    const baru = res.data.jumlah_belum_dibaca;
    // jumlahBelumDibaca masih null cuma pas poll PERTAMA kali sejak
    // halaman dimuat/di-refresh (nilai ini di-reset null lagi tiap modul
    // JS dieksekusi ulang dari awal, beda dari sekadar pindah halaman
    // SPA) -- jadi alert ini sengaja cuma tampil sekali per sesi buka
    // web/refresh, bukan tiap kali poll berkala menemukan sesuatu.
    const baruDibukaWebnya = jumlahBelumDibaca === null;

    jumlahBelumDibaca = baru;
    updateBadgeDom();

    if (baruDibukaWebnya && baru > 0) {
      toast(`Anda punya ${baru} notifikasi belum dibaca.`, 'info');
    }
  } catch (_) {
    // Badge cuma pelengkap -- kalau poll gagal (mis. token kedaluwarsa),
    // diamkan saja, jangan ganggu UX dengan toast error yang tidak perlu.
  }
}

// Dipanggil renderNav() di SETIAP navigasi (bukan cuma sekali) -- supaya
// begitu pendonor pindah halaman setelah aksi yang memicu notifikasi
// (mis. ambil nomor antrian -> navigate('/antrian')), badge langsung
// dicek ulang saat itu juga, bukan nunggu tick interval berikutnya
// (maks 30 detik, yang sebelumnya bikin kesannya "baru muncul kalau
// di-refresh manual" -- refresh mereset modul JS ini jadi poll()
// langsung jalan lagi seolah pertama kali).
export function startPolling() {
  if (!Auth.isLoggedIn('pendonor')) return;
  poll();
  if (timerId) return; // interval berkala sudah jalan, tidak perlu bikin baru
  timerId = setInterval(poll, POLL_INTERVAL_MS);
}

export function stopPolling() {
  clearInterval(timerId);
  timerId = null;
  jumlahBelumDibaca = null;
}

// Browser (terutama Chrome) men-throttle setInterval di tab yang sedang
// tidak fokus/tersembunyi -- kalau lagi buka banyak tab, badge bisa telat
// update sampai tab ini balik aktif. Dipasang sekali di top-level modul
// (bukan di dalam startPolling(), supaya tidak numpuk listener tiap
// dipanggil ulang) supaya begitu tab ini kembali aktif, langsung dicek
// ulang saat itu juga.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && Auth.isLoggedIn('pendonor')) {
    poll();
  }
});

export function bellIconHtml() {
  return `
    <a class="sidebar__link sidebar__link--bell" href="${routeHref('/notifikasi')}" data-route="/notifikasi" aria-label="Notifikasi">
      <span class="sidebar__link-icon">
        ${icons.bell}
        <span id="notif-badge" class="notif-badge" style="display:none;"></span>
      </span>
      Notifikasi
    </a>
  `;
}
