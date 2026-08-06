/**
 * api.js — klien kecil untuk memanggil REST API "Sistem Antrian Online Donor Darah".
 * Dipakai bersama oleh aplikasi pendonor (frontend/pendonor/) dan panel
 * internal (frontend/internal/) lewat import ES module.
 *
 * Alamat API dideteksi otomatis dari lokasi file ini sendiri (import.meta.url),
 * jadi tidak perlu diisi manual. Kalau backend ada di alamat lain, timpa lewat
 * window.__API_BASE_URL__ SEBELUM modul ini pertama kali di-import.
 */
function computeApiBaseUrl() {
  if (window.__API_BASE_URL__) return window.__API_BASE_URL__;
  // import.meta.url = URL modul ini sendiri, mis. ".../frontend/js/api.js".
  // "../../" naik dua level (js/ lalu frontend/) untuk sampai ke root situs.
  const siteRoot = new URL('../../', import.meta.url);
  return siteRoot.href.replace(/\/+$/, '') + '/api';
}

const API_BASE_URL = computeApiBaseUrl();

const TOKEN_KEY_PENDONOR = 'antrian_donor_token_pendonor';
const TOKEN_KEY_INTERNAL = 'antrian_donor_token_internal';

export const Auth = {
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

/**
<<<<<<< Updated upstream
 * Unduh file biner (mis. PDF sertifikat, FR-8.2) yang butuh header
 * Authorization -- makanya tidak bisa dipakai lewat `<a href>` navigasi
 * biasa (token JWT tidak boleh disisipkan ke URL). fetch() manual di sini,
 * lalu Blob-nya dipicu-download lewat elemen <a> sementara.
 */
async function unduhBlob(path, fallbackFilename) {
  const url = API_BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  const token = Auth.getToken('pendonor');

  const res = await fetch(url, {
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  });

  if (!res.ok) {
    let message = `Gagal mengunduh file (HTTP ${res.status})`;
    try {
      const json = await res.json();
      if (json && json.message) message = json.message;
    } catch (_) { /* respons bukan JSON */ }
    throw new Error(message);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : fallbackFilename;

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
=======
 * Unduh file (mis. CSV laporan) lewat fetch + Blob, bukan link <a href>
 * biasa -- endpointnya butuh header Authorization (JWT bearer), yang tidak
 * bisa disisipkan ke navigasi/link biasa. Nama file diambil dari header
 * Content-Disposition yang dikirim backend (lihat admin/Laporan::export()).
 */
async function apiDownload(path, { query = null, auth = null } = {}) {
  let url = API_BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '');

  if (query && Object.keys(query).length) {
    const params = Object.entries(query)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (params) url += '?' + params;
  }

  const headers = {};
  if (auth) {
    const token = Auth.getToken(auth);
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    let message = `Gagal mengunduh berkas (HTTP ${res.status})`;
    try {
      const json = await res.json();
      if (json && json.message) message = json.message;
    } catch (_) { /* respons bukan JSON, pakai pesan default */ }
    throw new Error(message);
  }

  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : 'unduhan.csv';
  const blob = await res.blob();

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
>>>>>>> Stashed changes
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
<<<<<<< Updated upstream
  URL.revokeObjectURL(blobUrl);
=======
  URL.revokeObjectURL(objectUrl);
>>>>>>> Stashed changes
}

export const Api = {
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

  // ---- Antrian (FR-4.x) ----
  ambilAntrian: (id_jadwal) => apiCall('antrian', { method: 'POST', body: { id_jadwal }, auth: 'pendonor' }),
  antrianSaya: () => apiCall('antrian/saya', { method: 'GET', auth: 'pendonor' }),
  antrianDetail: (id) => apiCall(`antrian/${id}`, { method: 'GET', auth: 'pendonor' }),
  batalkanAntrian: (id) => apiCall(`antrian/${id}/batalkan`, { method: 'PUT', auth: 'pendonor' }),
  jadwalUlangAntrian: (id, id_jadwal_baru) => apiCall(`antrian/${id}/jadwal-ulang`, { method: 'PUT', body: { id_jadwal_baru }, auth: 'pendonor' }),

  // ---- Tracking (FR-5.4, publik) ----
  papanAntrian: (id_jadwal) => apiCall('papan-antrian', { method: 'GET', query: { id_jadwal } }),

  // ---- Riwayat & Sertifikat Donor (FR-8.x) ----
  riwayatSaya: () => apiCall('riwayat', { method: 'GET', auth: 'pendonor' }),
  unduhSertifikat: (id_antrian) => unduhBlob(`riwayat/${id_antrian}/sertifikat`, `Sertifikat-Donor-${id_antrian}.pdf`),

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

  // ---- Admin: Manajemen Antrian / Petugas Loket (FR-7.2, FR-7.3) ----
  adminAntrianList: (id_jadwal) => apiCall('admin/antrian', { method: 'GET', query: { id_jadwal }, auth: 'internal' }),
  adminAntrianPanggil: (payload) => apiCall('admin/antrian/panggil', { method: 'POST', body: payload, auth: 'internal' }),
  adminAntrianLewati: (id_antrian) => apiCall(`admin/antrian/lewati/${id_antrian}`, { method: 'POST', auth: 'internal' }),
  adminAntrianCheckin: (payload) => apiCall('admin/antrian/checkin', { method: 'POST', body: payload, auth: 'internal' }),
<<<<<<< Updated upstream
  adminAntrianSelesai: (id_antrian, payload) => apiCall(`admin/antrian/selesai/${id_antrian}`, { method: 'POST', body: payload, auth: 'internal' }),
=======
  adminAntrianSelesai: (id_antrian) => apiCall(`admin/antrian/selesai/${id_antrian}`, { method: 'POST', auth: 'internal' }),

  // ---- Admin: Dashboard & Laporan (FR-9.1, FR-9.2) ----
  adminDashboardStatistik: (filter) => apiCall('admin/dashboard/statistik', { method: 'GET', query: filter, auth: 'internal' }),
  adminLaporanList: (filter) => apiCall('admin/laporan', { method: 'GET', query: filter, auth: 'internal' }),
  adminLaporanExport: (filter) => apiDownload('admin/laporan/export', { query: filter, auth: 'internal' }),

  // ---- Admin: Manajemen Hak Akses Pengguna Internal (FR-9.3) ----
  adminPenggunaList: (filter) => apiCall('admin/pengguna', { method: 'GET', query: filter, auth: 'internal' }),
  adminPenggunaCreate: (data) => apiCall('admin/pengguna/create', { method: 'POST', body: data, auth: 'internal' }),
  adminPenggunaUpdate: (id, data) => apiCall(`admin/pengguna/update/${id}`, { method: 'POST', body: data, auth: 'internal' }),
  adminPenggunaDelete: (id) => apiCall(`admin/pengguna/delete/${id}`, { method: 'POST', auth: 'internal' }),
>>>>>>> Stashed changes
};
