/**
 * permissions.js — satu sumber kebenaran untuk pembagian halaman per peran,
 * sesuai kolom "Hak Akses / Kewenangan Utama" di FRD bagian 3 (Peran dan
 * Aktor Pengguna):
 *   - Petugas Loket    -> Memanggil nomor antrian, verifikasi kehadiran
 *   - Admin UDD/Cabang -> Kelola jadwal, kuota, lokasi, laporan cabang
 *   - Super Admin      -> Kelola pengguna sistem, konfigurasi global, semua
 *                          laporan -- diberi akses ke semua halaman yang ada
 *                          (superset), termasuk /pengguna yang khusus dia.
 *
 * router.js, nav.js, dan guards.js semua merujuk ke daftar ini -- nambah
 * halaman baru cukup nambah satu entri di NAV_ITEMS, tidak perlu ubah
 * logika di tiga tempat itu.
 */
export const NAV_ITEMS = [
  { route: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['admin_udd', 'super_admin'] },
  { route: '/antrian', label: 'Panggil Antrian', icon: 'antrian', roles: ['petugas_loket', 'super_admin'] },
  { route: '/jadwal', label: 'Kelola Jadwal', icon: 'jadwal', roles: ['admin_udd', 'super_admin'] },
  { route: '/lokasi', label: 'Kelola Lokasi', icon: 'lokasi', roles: ['admin_udd', 'super_admin'] },
  { route: '/laporan', label: 'Laporan', icon: 'laporan', roles: ['admin_udd', 'super_admin'] },
  { route: '/pengguna', label: 'Pengguna Internal', icon: 'pengguna', roles: ['super_admin'] },
];

const DEFAULT_ROUTE_BY_ROLE = {
  petugas_loket: '/antrian',
  admin_udd: '/jadwal',
  super_admin: '/jadwal',
};

export function navItemsFor(peran) {
  return NAV_ITEMS.filter((item) => item.roles.includes(peran));
}

export function canAccessRoute(route, peran) {
  const item = NAV_ITEMS.find((i) => i.route === route);
  return !item || item.roles.includes(peran);
}

export function defaultRouteFor(peran) {
  return DEFAULT_ROUTE_BY_ROLE[peran] || NAV_ITEMS[0].route;
}
