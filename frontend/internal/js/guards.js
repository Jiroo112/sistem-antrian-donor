import { Auth } from '../../js/api.js';
import { toast } from '../../js/shared/dom.js';
import { getCurrentUser } from './session.js';
import { canAccessRoute, defaultRouteFor } from './permissions.js';
import { navigate } from './router.js';

// Panggil di awal view yang butuh login; return false (dan sudah redirect ke
// /masuk) kalau petugas/admin belum login, supaya view yang manggil bisa `return`.
export function requireAuth() {
  if (!Auth.isLoggedIn('internal')) {
    toast('Silakan masuk sebagai petugas/admin terlebih dahulu.', 'error');
    navigate('/masuk');
    return false;
  }
  return true;
}

// Gabungan cek login + cek peran untuk satu route tertentu, sesuai
// pembagian tanggung jawab per aktor di permissions.js. Dipakai di awal
// tiap view halaman internal (selain /masuk) supaya orang yang login
// dengan peran lain tidak bisa membuka halaman itu langsung lewat URL,
// bukan cuma disembunyikan dari nav.
export function requireRole(route) {
  if (!requireAuth()) return false;

  const peran = getCurrentUser()?.peran;
  if (!canAccessRoute(route, peran)) {
    toast('Halaman ini bukan untuk peran Anda.', 'error');
    navigate(defaultRouteFor(peran));
    return false;
  }
  return true;
}
