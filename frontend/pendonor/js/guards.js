import { Auth } from '../../js/api.js';
import { toast } from '../../js/shared/dom.js';
import { navigate } from './router.js';

// Panggil di awal view yang butuh login; return false (dan sudah redirect ke
// /masuk) kalau pendonor belum login, supaya view yang manggil bisa `return`.
export function requireAuth() {
  if (!Auth.isLoggedIn('pendonor')) {
    toast('Silakan masuk terlebih dahulu untuk mengakses halaman ini.', 'error');
    navigate('/masuk');
    return false;
  }
  return true;
}
