import { app } from '../elements.js';
import { el, escapeHtml } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { fmtTanggalWaktu, statusBadgeClass } from '../../../js/shared/format.js';
import { pageHeader } from '../ui.js';
import { requireAuth } from '../guards.js';
import { setJumlahBelumDibaca } from '../notif-badge.js';

const LABEL_JENIS = {
  konfirmasi_pendaftaran: 'Konfirmasi Pendaftaran',
  pengingat_h1: 'Pengingat Jadwal',
  giliran_mendekati: 'Giliran Mendekati',
  perubahan_jadwal: 'Perubahan Jadwal',
  dilewati: 'Antrian Dilewati',
};

const LABEL_STATUS_TERKIRIM = {
  pending: 'Menunggu Dikirim',
  terkirim: 'Terkirim',
  gagal: 'Gagal Terkirim',
};

/* FR-6.1 - FR-6.4: Modul Notifikasi -- daftar notifikasi in-app pendonor */
export async function viewNotifikasi() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Area pendonor', 'Notifikasi', 'Riwayat notifikasi konfirmasi pendaftaran, pengingat jadwal, giliran antrian, dan perubahan jadwal.')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div id="notifikasi-slot" class="stack">
        <div class="skeleton" style="height:70px;"></div>
        <div class="skeleton" style="height:70px;"></div>
      </div>
    </div>
  `;

  const slot = document.getElementById('notifikasi-slot');

  try {
    const res = await Api.notifikasiSaya();
    render(res.data || []);
    // GET /notifikasi sudah menandai semuanya dibaca di server (lihat
    // Notifikasi::index()) -- badge di navbar dibersihkan sekarang juga,
    // tidak perlu nunggu poll berikutnya (maks 30 detik).
    setJumlahBelumDibaca(0);
  } catch (e) {
    slot.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
  }

  function render(list) {
    if (!list.length) {
      slot.innerHTML = `<div class="empty">Belum ada notifikasi.</div>`;
      return;
    }
    slot.innerHTML = '';
    list.forEach((n) => {
      slot.appendChild(el(`
        <div class="card" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start;${n.dibaca == 0 ? 'border-left:3px solid var(--crimson);' : ''}">
          <div style="flex:1 1 320px;min-width:0;">
            <p class="eyebrow" style="margin-bottom:4px;">${escapeHtml(LABEL_JENIS[n.jenis] || n.jenis)} · ${fmtTanggalWaktu(n.created_at)}</p>
            <p style="margin:0;font-size:.9rem;">${escapeHtml(n.isi_pesan)}</p>
          </div>
          <span class="badge ${statusBadgeClass(n.status_terkirim)}" style="flex-shrink:0;"><i class="badge-dot"></i>${escapeHtml(LABEL_STATUS_TERKIRIM[n.status_terkirim] || n.status_terkirim)}</span>
        </div>
      `));
    });
  }
}
