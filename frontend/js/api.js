/**
 * api.js — klien kecil untuk memanggil REST API "Sistem Antrian Online Donor Darah".
 *
 * Alamat API dideteksi otomatis dari lokasi file ini sendiri (origin + folder
 * dasar tempat proyek diakses, ditambah "/api"), jadi tidak perlu diisi manual.
 * Kalau backend ada di alamat lain, timpa lewat window.__API_BASE_URL__
 * SEBELUM tag <script src="js/api.js"> dimuat.
 */
function detectBasePath(scriptSuffix) {
  const src = document.currentScript && document.currentScript.src;
  if (!src) return '';
  try {
    const path = new URL(src).pathname;
    return path.endsWith(scriptSuffix) ? path.slice(0, -scriptSuffix.length) : '';
  } catch (_) {
    return '';
  }
}

const API_BASE_URL = window.__API_BASE_URL__ || (location.origin + detectBasePath('/js/api.js') + '/api');

const TOKEN_KEY_PENDONOR = 'antrian_donor_token_pendonor';
const TOKEN_KEY_INTERNAL = 'antrian_donor_token_internal';

const Auth = {
  getToken(kind = 'pendonor') {
    return sessionStorage.getItem(kind === 'internal' ? TOKEN_KEY_INTERNAL : TOKEN_KEY_PENDONOR);
  },
  setToken(token, kind = 'pendonor') {
    sessionStorage.setItem(kind === 'internal' ? TOKEN_KEY_INTERNAL : TOKEN_KEY_PENDONOR, token);
  },
  clearToken(kind = 'pendonor') {
    sessionStorage.removeItem(kind === 'internal' ? TOKEN_KEY_INTERNAL : TOKEN_KEY_PENDONOR);
  },
  isLoggedIn(kind = 'pendonor') {
    return !!this.getToken(kind);
  },
};

/**
 * Bungkus fetch supaya konsisten: selalu kirim/parse JSON, selalu lempar
 * Error berisi pesan dari backend (field `message`) kalau gagal, dan
 * otomatis menyisipkan header Authorization kalau ada token tersimpan.
 */
async function apiCall(path, { method = 'GET', body = null, auth = null, query = null } = {}) {
  let url = API_BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '');

  if (query && Object.keys(query).length) {
    const params = Object.entries(query)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (params) url += '?' + params;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = Auth.getToken(auth);
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    const err = new Error(
      'Tidak bisa menghubungi server API di ' + API_BASE_URL +
      '. Pastikan backend menyala dan API_BASE_URL di frontend/js/api.js sudah benar.'
    );
    err.isNetworkError = true;
    throw err;
  }

  let json = null;
  try {
    json = await res.json();
  } catch (_) {
    // respons bukan JSON (mis. halaman error 500 default PHP)
  }

  if (!res.ok) {
    const err = new Error((json && json.message) || `Permintaan gagal (HTTP ${res.status})`);
    err.status = res.status;
    err.fieldErrors = json && json.data && typeof json.data === 'object' ? json.data : null;
    throw err;
  }

  return json;
}

const Api = {
  // ---- Auth (FR-1.x) ----
  register: (data) => apiCall('auth/register', { method: 'POST', body: data }),
  verifyOtp: (data) => apiCall('auth/verify-otp', { method: 'POST', body: data }),
  resendOtp: (data) => apiCall('auth/resend-otp', { method: 'POST', body: data }),
  login: (data) => apiCall('auth/login', { method: 'POST', body: data }),
  loginInternal: (data) => apiCall('auth/login-internal', { method: 'POST', body: data }),
  forgotPassword: (data) => apiCall('auth/forgot-password', { method: 'POST', body: data }),
  resetPassword: (data) => apiCall('auth/reset-password', { method: 'POST', body: data }),
  sessions: () => apiCall('auth/sessions', { method: 'GET', auth: 'pendonor' }),
  logout: () => apiCall('auth/logout', { method: 'POST', auth: 'pendonor' }),
  logoutOthers: () => apiCall('auth/logout-others', { method: 'POST', auth: 'pendonor' }),

  // ---- Jadwal & Lokasi (FR-3.x, publik) ----
  cariJadwal: (filter) => apiCall('jadwal/cari', { method: 'GET', query: filter }),
  petaLokasi: (jenis) => apiCall('lokasi/peta', { method: 'GET', query: { jenis } }),

  // ---- Profil & Kesehatan (FR-2.x) ----
  getProfil: () => apiCall('profil', { method: 'GET', auth: 'pendonor' }),
  updateProfil: (data) => apiCall('profil', { method: 'PUT', body: data, auth: 'pendonor' }),
  getKuesioner: () => apiCall('profil/kuesioner', { method: 'GET', auth: 'pendonor' }),
  submitKuesioner: (jawaban) => apiCall('profil/kuesioner', { method: 'POST', body: { jawaban }, auth: 'pendonor' }),
  kartuDonor: () => apiCall('profil/kartu-donor', { method: 'GET', auth: 'pendonor' }),

  // ---- Admin: Jadwal (FR-7.1) ----
  adminJadwalList: (filter) => apiCall('admin/jadwal', { method: 'GET', query: filter, auth: 'internal' }),
  adminJadwalCreate: (data) => apiCall('admin/jadwal/create', { method: 'POST', body: data, auth: 'internal' }),
  adminJadwalUpdate: (id, data) => apiCall(`admin/jadwal/update/${id}`, { method: 'POST', body: data, auth: 'internal' }),
  adminJadwalDelete: (id) => apiCall(`admin/jadwal/delete/${id}`, { method: 'POST', auth: 'internal' }),

  // ---- Admin: Lokasi (FR-7.4) ----
  adminLokasiList: () => apiCall('admin/lokasi', { method: 'GET', auth: 'internal' }),
  adminLokasiCreate: (data) => apiCall('admin/lokasi/create', { method: 'POST', body: data, auth: 'internal' }),
  adminLokasiUpdate: (id, data) => apiCall(`admin/lokasi/update/${id}`, { method: 'POST', body: data, auth: 'internal' }),
  adminLokasiDelete: (id) => apiCall(`admin/lokasi/delete/${id}`, { method: 'POST', auth: 'internal' }),
};
