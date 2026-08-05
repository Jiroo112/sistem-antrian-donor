import { Auth } from '../../js/api.js';
import { toast } from '../../js/shared/dom.js';

// Panggil di awal view yang butuh login; return false (dan sudah redirect ke
// #/masuk) kalau petugas/admin belum login, supaya view yang manggil bisa `return`.
export function requireAuth() {
  if (!Auth.isLoggedIn('internal')) {
    toast('Silakan masuk sebagai petugas/admin terlebih dahulu.', 'error');
    location.hash = '#/masuk';
    return false;
  }
  return true;
}
