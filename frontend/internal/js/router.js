/**
 * router.js — routing berbasis History API untuk panel internal, dengan
 * BASE_PATH berprefix "/admin" (mis. /admin/jadwal) supaya rutenya tidak
 * tabrakan dengan rute pendonor yang juga punya nama seperti "/jadwal".
 * Pola ini sama persis dengan pendonor/js/router.js (navigate() cuma
 * pushState + kabari lewat event, main.js yang benar-benar merender --
 * lihat komentar di sana untuk alasan menghindari circular import dengan nav.js).
 */
import { Auth } from '../../js/api.js';
import { getCurrentUser } from './session.js';
import { defaultRouteFor } from './permissions.js';
import { viewMasuk } from './views/masuk.js';
import { viewJadwal } from './views/jadwal.js';
import { viewLokasi } from './views/lokasi.js';
import { viewAntrian } from './views/antrian.js';
import { viewDashboard } from './views/dashboard.js';
import { viewLaporan } from './views/laporan.js';
import { viewPengguna } from './views/pengguna.js';

function computeBasePath() {
  if (window.__BASE_PATH__ !== undefined) return window.__BASE_PATH__.replace(/\/+$/, '');
  // import.meta.url = URL modul ini sendiri, mis. ".../frontend/internal/js/router.js".
  // "../../../" naik tiga level (js/, internal/, frontend/) untuk sampai ke
  // root situs, lalu ditambah "/admin" sebagai prefix rute panel ini.
  const siteRoot = new URL('../../../', import.meta.url).pathname.replace(/\/+$/, '');
  return siteRoot + '/admin';
}

export const BASE_PATH = computeBasePath();

export function routeHref(path) {
  return BASE_PATH + path;
}

// '' (string kosong) = "root" panel ini (persis /admin, tanpa rute
// spesifik) -- beda dari pendonor yang punya halaman Home sungguhan di
// root, panel internal tidak; root-nya cuma jatuh ke halaman default
// sesuai peran (lihat resolveView()).
export function currentPath() {
  let path = location.pathname;
  if (BASE_PATH && path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length);
  return path === '/' ? '' : path;
}

export function navigate(path) {
  const url = routeHref(path);
  if (location.pathname !== url) {
    history.pushState(null, '', url);
  }
  window.dispatchEvent(new Event('spa:navigate'));
}

const routes = {
  '/masuk': viewMasuk,
  '/jadwal': viewJadwal,
  '/lokasi': viewLokasi,
  '/antrian': viewAntrian,
  '/dashboard': viewDashboard,
  '/laporan': viewLaporan,
  '/pengguna': viewPengguna,
};

export function resolveView(path) {
  if (routes[path]) return routes[path];
  return Auth.isLoggedIn('internal') ? routes[defaultRouteFor(getCurrentUser()?.peran)] : viewMasuk;
}
