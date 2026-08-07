/**
 * icons.js — ikon garis minimal (gaya "stroke", currentColor) untuk sidebar
 * navigasi panel internal. Dibuat sendiri (bukan diunduh dari Flaticon)
 * supaya bebas lisensi/atribusi, gayanya sama persis dengan
 * frontend/pendonor/js/icons.js -- sengaja diduplikasi (bukan di-import
 * silang) supaya kedua SPA (pendonor & internal) tetap independen satu
 * sama lain sesuai desain awal project ini.
 */
function svg(paths) {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

export const icons = {
  jadwal: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  lokasi: svg('<path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>'),
  antrian: svg('<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M10 6v12" stroke-dasharray="2 3"/>'),
  dashboard: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  laporan: svg('<path d="M4 20V10M11 20V4M18 20v-7"/><path d="M2 20h20"/>'),
  pengguna: svg('<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a7 7 0 0 1 14 0v1"/><circle cx="18" cy="8" r="3"/><path d="M22 21v-1a5.5 5.5 0 0 0-4-5.3"/>'),
  masuk: svg('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>'),
  keluar: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>'),
  kosong: svg('<path d="M3 9.5 5.5 4h13L21 9.5"/><path d="M3 9.5v9A2 2 0 0 0 5 20.5h14a2 2 0 0 0 2-2v-9"/><path d="M3 9.5h18"/><path d="M9.5 13h5"/>'),
};
