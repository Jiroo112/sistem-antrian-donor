/**
 * router.js — routing berbasis History API untuk SPA pendonor. Murni logika
 * navigasi (hitung path, pushState, lookup view); rendering aktual (renderNav,
 * pemanggilan view, dsb) jadi tanggung jawab main.js supaya file ini tidak
 * perlu tahu apa-apa soal nav.js (menghindari circular import).
 */
import { viewHome } from './views/home.js';
import { viewJadwal } from './views/jadwal.js';
import { viewLokasi } from './views/lokasi.js';
import { viewAntrianSaya } from './views/antrian.js';
import { viewDaftar } from './views/daftar.js';
import { viewVerifikasiOtp } from './views/verifikasi-otp.js';
import { viewMasuk } from './views/masuk.js';
import { viewLupaPassword } from './views/lupa-password.js';
import { viewResetPassword } from './views/reset-password.js';
import { viewDashboard } from './views/dashboard.js';
import { viewProfil } from './views/profil.js';
import { viewKuesioner } from './views/kuesioner.js';
import { viewKartuDonor } from './views/kartu-donor.js';
import { viewPerangkat } from './views/perangkat.js';

function computeBasePath() {
  if (window.__BASE_PATH__ !== undefined) return window.__BASE_PATH__.replace(/\/+$/, '');
  // import.meta.url = URL modul ini sendiri, mis. ".../frontend/pendonor/js/router.js".
  // "../../../" naik tiga level (js/, pendonor/, frontend/) untuk sampai ke
  // root situs -- tempat semua rute bersih pendonor (/jadwal, /dashboard, dst) hidup.
  return new URL('../../../', import.meta.url).pathname.replace(/\/+$/, '');
}

export const BASE_PATH = computeBasePath();

export function routeHref(path) {
  return BASE_PATH + path;
}

export function currentPath() {
  let path = location.pathname;
  if (BASE_PATH && path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length);
  return path || '/';
}

// navigate() tidak langsung merender -- ia hanya ubah URL lalu kabari lewat
// custom event 'spa:navigate'. main.js yang mendengarkan event ini (bareng
// 'popstate') dan benar-benar menjalankan render, supaya router.js tetap
// tidak bergantung pada nav.js/elements.js.
export function navigate(path) {
  const url = routeHref(path);
  if (location.pathname !== url) {
    history.pushState(null, '', url);
  }
  window.dispatchEvent(new Event('spa:navigate'));
}

const routes = {
  '/': viewHome,
  '/jadwal': viewJadwal,
  '/lokasi': viewLokasi,
  '/antrian': viewAntrianSaya,
  '/daftar': viewDaftar,
  '/verifikasi-otp': viewVerifikasiOtp,
  '/masuk': viewMasuk,
  '/lupa-password': viewLupaPassword,
  '/reset-password': viewResetPassword,
  '/dashboard': viewDashboard,
  '/profil': viewProfil,
  '/kuesioner': viewKuesioner,
  '/kartu-donor': viewKartuDonor,
  '/perangkat': viewPerangkat,
};

export function resolveView(path) {
  return routes[path] || viewHome;
}
