/**
 * router.js — routing berbasis hash (#/jadwal, dst) untuk panel internal.
 * Navigasi hash native browser sudah cukup di sini (link <a href="#/...">
 * + event 'hashchange'), jadi tidak perlu fungsi navigate() custom seperti
 * di sisi pendonor.
 */
import { Auth } from '../../js/api.js';
import { viewMasuk } from './views/masuk.js';
import { viewJadwal } from './views/jadwal.js';
import { viewLokasi } from './views/lokasi.js';

const routes = {
  '/masuk': viewMasuk,
  '/jadwal': viewJadwal,
  '/lokasi': viewLokasi,
};

export function currentHash() {
  return location.hash.replace(/^#/, '') || (Auth.isLoggedIn('internal') ? '/jadwal' : '/masuk');
}

export function resolveView(hash) {
  return routes[hash] || (Auth.isLoggedIn('internal') ? viewJadwal : viewMasuk);
}
