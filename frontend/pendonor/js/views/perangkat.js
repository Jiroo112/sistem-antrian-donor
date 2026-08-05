import { app } from '../elements.js';
import { escapeHtml, toast } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { fmtTanggalWaktu, statusBadgeClass } from '../../../js/shared/format.js';
import { pageHeader } from '../ui.js';
import { requireAuth } from '../guards.js';

/* FR-1.4: Perangkat / Sesi */
export async function viewPerangkat() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Keamanan akun', 'Perangkat yang Sedang Masuk', 'Kalau ada perangkat yang tidak kamu kenali, keluarkan dari sini.')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div style="margin-bottom:16px;"><button class="btn btn-danger btn-sm" id="btn-logout-others">Keluar dari Semua Perangkat Lain</button></div>
      <div class="card" style="padding:0;overflow:auto;">
        <table class="data" id="tbl-sesi">
          <thead><tr><th>Perangkat</th><th>Alamat IP</th><th>Terakhir Aktif</th><th>Status</th></tr></thead>
          <tbody><tr><td colspan="4"><div class="skeleton" style="height:20px;"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  `;
  const tbody = document.querySelector('#tbl-sesi tbody');
  try {
    const res = await Api.sessions();
    const list = res.data || [];
    tbody.innerHTML = list.length ? list.map((s) => `
      <tr>
        <td>${escapeHtml(s.device_info || '-')}</td>
        <td class="mono">${escapeHtml(s.ip_address || '-')}</td>
        <td>${fmtTanggalWaktu(s.last_active_at || s.created_at)}</td>
        <td><span class="badge ${statusBadgeClass(s.status)}"><i class="badge-dot"></i>${escapeHtml(s.status)}</span></td>
      </tr>`).join('') : `<tr><td colspan="4" class="muted">Belum ada data sesi.</td></tr>`;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="alert alert-error">${escapeHtml(e.message)}</div></td></tr>`;
  }

  document.getElementById('btn-logout-others').addEventListener('click', async () => {
    try {
      await Api.logoutOthers();
      toast('Berhasil keluar dari perangkat lain.', 'success');
      viewPerangkat();
    } catch (e) {
      toast(e.message, 'error');
    }
  });
}
