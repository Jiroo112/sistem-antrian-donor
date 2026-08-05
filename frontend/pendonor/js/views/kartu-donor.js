import { app } from '../elements.js';
import { escapeHtml } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { fmtTanggal, statusBadgeClass } from '../../../js/shared/format.js';
import { pageHeader } from '../ui.js';
import { requireAuth } from '../guards.js';

/* FR-2.3: Kartu Donor Digital */
export async function viewKartuDonor() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Area pendonor', 'Kartu Donor Digital', 'Tunjukkan kartu ini ke petugas sebagai identitas pendonor di lokasi.')}
    <div class="shell shell--narrow" style="padding:16px 24px 60px;">
      <div id="kartu-slot"><div class="skeleton" style="height:180px;"></div></div>
    </div>
  `;
  const slot = document.getElementById('kartu-slot');
  try {
    const res = await Api.kartuDonor();
    const d = res.data;
    slot.innerHTML = `
      <div class="ticket">
        <div class="ticket__main">
          <p class="ticket__eyebrow">Kartu Donor Digital</p>
          <h3 class="ticket__title">${escapeHtml(d.nama)}</h3>
          <div class="ticket__meta">
            <span class="mono">${escapeHtml(d.id_unik_pendonor)}</span>
            <span class="badge ${statusBadgeClass(d.status_akun)}"><i class="badge-dot"></i>${escapeHtml(d.status_akun)}</span>
          </div>
          <p class="muted" style="margin-top:10px;">Berlaku sejak ${fmtTanggal(d.berlaku_sejak)}</p>
          ${!d.golongan_darah_terverifikasi ? `<p style="margin-top:8px;font-size:.82rem;color:var(--amber);">Golongan darah belum terverifikasi petugas.</p>` : ''}
        </div>
        <div class="ticket__divider"></div>
        <div class="ticket__stub">
          <div class="ticket__stub-label">Gol. Darah</div>
          <div class="ticket__stub-value">${escapeHtml(d.golongan_darah)}</div>
        </div>
      </div>
    `;
  } catch (e) {
    slot.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
  }
}
