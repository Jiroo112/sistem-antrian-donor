// format.js — helper format tanggal & status antrian yang identik dipakai
// pendonor (frontend/pendonor/) dan panel internal (frontend/internal/),
// karena keduanya menampilkan data tabel `antrian` yang sama.

export function fmtTanggal(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (_) { return iso; }
}

export function fmtTanggalWaktu(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso.replace(' ', 'T')).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (_) { return iso; }
}

export function statusBadgeClass(status) {
  const map = {
    aktif: 'aktif', dibuka: 'aktif', tersedia: 'aktif',
    menunggu: 'menunggu', menunggu_verifikasi: 'menunggu', pending: 'menunggu',
    dipanggil: 'menunggu', sedang_diproses: 'aktif',
    selesai: 'selesai', lolos_screening_awal: 'lolos',
    perlu_pemeriksaan_lanjutan: 'risiko', nonaktif: 'nonaktif',
    dibatalkan: 'gagal', tidak_hadir: 'gagal',
    layak: 'selesai', tidak_layak: 'gagal', ditunda: 'risiko',
    terkirim: 'aktif', gagal: 'gagal',
  };
  return 'badge--' + (map[status] || 'info');
}

export function labelStatusAntrian(status) {
  const map = {
    menunggu: 'Menunggu', dipanggil: 'Dipanggil', sedang_diproses: 'Sedang Diproses',
    selesai: 'Selesai', tidak_hadir: 'Tidak Hadir', dibatalkan: 'Dibatalkan',
  };
  return map[status] || status;
}

// FR-8.x: label kelayakan hasil donor (diisi petugas saat menandai antrian
// selesai, lihat admin/Antrian::selesai() -- BR5).
export function labelKelayakan(status) {
  const map = { layak: 'Layak', tidak_layak: 'Tidak Layak', ditunda: 'Ditunda' };
  return map[status] || status;
}
