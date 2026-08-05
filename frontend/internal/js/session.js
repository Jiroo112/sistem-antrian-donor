// Data ringkas pengguna internal yang sedang login (nama, peran, dst -- lihat
// respons Api.loginInternal), disimpan terpisah dari token JWT (yang dikelola
// Auth di frontend/js/api.js) supaya nav bisa menampilkan info tanpa decode token.
const USER_KEY = 'antrian_donor_internal_user';

export function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch (_) { return null; }
}

export function setCurrentUser(data) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(data));
}

export function clearCurrentUser() {
  sessionStorage.removeItem(USER_KEY);
}
