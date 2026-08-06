/**
 * antrian-alert.js — modal pop-up begitu nomor antrian pendonor DIPANGGIL
 * petugas, dipoll dari halaman MANAPUN (bukan cuma saat lagi buka halaman
 * "Antrian Saya", yang polling live-nya cuma jalan selagi elemennya ada di
 * DOM -- lihat views/antrian.js). Pakai endpoint yang sama (GET
 * /antrian/saya) dan interval yang sama (5 detik) supaya konsisten dengan
 * NFR Performance ("pembaruan status antrian real-time maksimal jeda 5
 * detik").
 *
 * State (status terakhir yang sudah diproses) disimpan module-level,
 * bukan di elemen DOM, supaya tetap konsisten lintas navigasi SPA.
 */
import { Api, Auth } from '../../js/api.js';
import { el } from '../../js/shared/dom.js';

const POLL_INTERVAL_MS = 5000;

let timerId = null;
let terakhir = null; // { id_antrian, status } dari poll sebelumnya

function tampilkanModalDipanggil(antrian) {
  if (document.getElementById('modal-dipanggil')) return; // sudah tampil, jangan dobel

  const j = antrian.jadwal || {};
  const backdrop = el(`
    <div class="modal-backdrop" id="modal-dipanggil">
      <div class="modal" style="text-align:center;">
        <p class="eyebrow" style="color:var(--crimson-dark);margin-bottom:6px;">🔔 Giliran Anda Dipanggil</p>
        <div class="mono" style="font-size:3rem;font-weight:800;line-height:1;margin:14px 0;">${String(antrian.nomor_urut).padStart(3, '0')}</div>
        <p style="margin:0 0 22px;">Nomor antrian Anda sedang dipanggil petugas${j.nama_lokasi ? ` di <strong>${j.nama_lokasi}</strong>` : ''}. Segera menuju loket.</p>
        <button class="btn btn-primary btn-block" id="btn-tutup-modal-dipanggil">Mengerti, Segera ke Loket</button>
      </div>
    </div>
  `);
  document.body.appendChild(backdrop);
  backdrop.querySelector('#btn-tutup-modal-dipanggil').addEventListener('click', () => backdrop.remove());
}

async function poll() {
  try {
    const res = await Api.antrianSaya();
    const antrian = res.data && res.data.antrian_aktif;

    if (!antrian) {
      terakhir = null;
      return;
    }

    // Dibandingkan pakai updated_at (bukan cuma status) supaya "panggil
    // ulang" nomor yang sama (status TETAP 'dipanggil', tidak berubah)
    // tetap kedeteksi sebagai kejadian baru -- backend memaksa updated_at
    // berubah tiap panggilan, lihat Antrian_model::set_status().
    const panggilanSudahDiproses = terakhir
      && terakhir.id_antrian === antrian.id_antrian
      && terakhir.updated_at === antrian.updated_at;

    if (antrian.status === 'dipanggil' && !panggilanSudahDiproses) {
      tampilkanModalDipanggil(antrian);
    }
    terakhir = { id_antrian: antrian.id_antrian, updated_at: antrian.updated_at };
  } catch (_) {
    // Fitur pelengkap -- diamkan kalau gagal poll (mis. token kedaluwarsa),
    // jangan ganggu UX dengan error yang tidak perlu.
  }
}

// Sama seperti notif-badge.js: selalu poll ulang tiap dipanggil (mis. tiap
// navigasi SPA), bukan cuma sekali di awal -- interval berkalanya saja
// yang cuma dibuat sekali.
export function startAntrianAlertPolling() {
  if (!Auth.isLoggedIn('pendonor')) return;
  poll();
  if (timerId) return;
  timerId = setInterval(poll, POLL_INTERVAL_MS);
}

// Browser (terutama Chrome) men-throttle setInterval di tab yang sedang
// tidak fokus/tersembunyi -- kalau lagi testing pakai 2 tab (pendonor +
// petugas), tab pendonor yang di-background bisa telat "sadar" nomornya
// sudah dipanggil sampai berpuluh detik, kesannya kayak "harus di-refresh
// dulu baru muncul". visibilitychange dipasang SEKALI di top-level modul
// (bukan di dalam startAntrianAlertPolling(), supaya tidak numpuk listener
// tiap kali dipanggil ulang) -- begitu tab ini kembali aktif, langsung
// cek ulang saat itu juga alih-alih nunggu tick interval berikutnya.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && Auth.isLoggedIn('pendonor')) {
    poll();
  }
});

export function stopAntrianAlertPolling() {
  clearInterval(timerId);
  timerId = null;
  terakhir = null;
  const existing = document.getElementById('modal-dipanggil');
  if (existing) existing.remove();
}
