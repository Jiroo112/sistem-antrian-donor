import { app } from '../elements.js';
import { escapeHtml } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { fmtTanggal } from '../../../js/shared/format.js';
import { pageHeader } from '../ui.js';
import { requireAuth } from '../guards.js';

/* FR-2.3: Kartu Donor Digital -- gaya kartu ID/membership fisik (chip,
   watermark, tata letak nomor kartu) supaya lebih menarik & berwarna
   dibanding kartu putih flat biasa, tapi tetap satu keluarga warna Rausch
   dengan halaman lain (bukan skema gelap terpisah sendiri). Interaksinya
   sengaja dibuat simpel -- cuma hover terangkat + gloss statis, tanpa
   tilt 3D mengikuti kursor. */
export async function viewKartuDonor() {
  if (!requireAuth()) return;
  app.innerHTML = `
    <style>
      .kd-wrap{ display:flex; justify-content:center; padding:20px 0 10px; }
      .kd-card{
        position:relative; width:100%; max-width:420px; aspect-ratio:1.6/1;
        border-radius:20px; overflow:hidden; color:#fff;
        background:linear-gradient(135deg,#ff6f91 0%,#ff385c 45%,#b0173b 100%);
        box-shadow:0 16px 32px -12px rgba(255,56,92,.45);
        transition:transform .2s ease, box-shadow .2s ease;
        padding:26px 28px;
      }
      .kd-card:hover{ transform:translateY(-6px); box-shadow:0 24px 44px -12px rgba(255,56,92,.55); }
      .kd-card::before{
        content:''; position:absolute; inset:0; pointer-events:none;
        background:linear-gradient(115deg, rgba(255,255,255,.28) 0%, transparent 28%, transparent 72%, rgba(255,255,255,.14) 100%);
      }
      .kd-watermark{
        position:absolute; right:-30px; bottom:-40px; width:220px; height:220px; opacity:.14;
        background:#fff; -webkit-mask:url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJDMTIgMiA1IDEwLjUgNSAxNS4yQzUgMTkgOC4xMyAyMiAxMiAyMkMxNS44NyAyMiAxOSAxOSAxOSAxNS4yQzE5IDEwLjUgMTIgMiAxMiAyWiIvPjwvc3ZnPg==") center/contain no-repeat;
        mask:url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJDMTIgMiA1IDEwLjUgNSAxNS4yQzUgMTkgOC4xMyAyMiAxMiAyMkMxNS44NyAyMiAxOSAxOSAxOSAxNS4yQzE5IDEwLjUgMTIgMiAxMiAyWiIvPjwvc3ZnPg==") center/contain no-repeat;
      }
      .kd-row-top{ position:relative; display:flex; align-items:center; justify-content:space-between; }
      .kd-eyebrow{ font-size:.68rem; font-weight:700; letter-spacing:.16em; color:rgba(255,255,255,.85); text-transform:uppercase; }
      .kd-chip{ width:38px; height:28px; border-radius:6px; background:linear-gradient(135deg,#f2d38a,#c9a24a); position:relative; }
      .kd-chip::before, .kd-chip::after{ content:''; position:absolute; left:6px; right:6px; height:1px; background:rgba(0,0,0,.35); }
      .kd-chip::before{ top:9px; } .kd-chip::after{ top:18px; }
      .kd-name{ position:relative; font-size:1.35rem; font-weight:800; letter-spacing:.03em; margin:22px 0 4px; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .kd-id{ position:relative; font-family:var(--font-mono); letter-spacing:.12em; font-size:.85rem; color:rgba(255,255,255,.8); }
      .kd-row-bottom{ position:absolute; left:28px; right:28px; bottom:22px; display:flex; align-items:flex-end; justify-content:space-between; }
      .kd-gol-label{ font-size:.62rem; letter-spacing:.14em; color:rgba(255,255,255,.85); text-transform:uppercase; margin-bottom:2px; }
      .kd-gol-value{ font-size:2rem; font-weight:800; line-height:1; }
      .kd-status{ display:inline-flex; align-items:center; gap:6px; padding:4px 11px; border-radius:100px; font-size:.72rem; font-weight:700; background:rgba(255,255,255,.2); backdrop-filter:blur(2px); }
      .kd-status .dot{ width:6px; height:6px; border-radius:50%; background:#4ADE80; }
      .kd-status.risiko .dot{ background:#F5C451; }
      .kd-berlaku{ font-size:.68rem; color:rgba(255,255,255,.8); margin-top:6px; text-align:right; }
      .kd-hint{ text-align:center; color:var(--slate); font-size:.78rem; margin-top:16px; }
      @media (max-width:420px){
        .kd-card{ aspect-ratio:auto; min-height:190px; padding:20px 20px; }
        .kd-name{ font-size:1.1rem; margin:16px 0 4px; }
        .kd-gol-value{ font-size:1.6rem; }
        .kd-row-bottom{ left:20px; right:20px; bottom:18px; }
      }
    </style>

    ${pageHeader('Area pendonor', 'Kartu Donor Digital', 'Tunjukkan kartu ini ke petugas sebagai identitas pendonor di lokasi.')}
    <div class="shell shell--narrow" style="padding:16px 24px 60px;">
      <div id="kartu-slot"><div class="skeleton" style="height:260px;border-radius:20px;"></div></div>
    </div>
  `;
  const slot = document.getElementById('kartu-slot');
  try {
    const res = await Api.kartuDonor();
    const d = res.data;
    const risiko = !d.golongan_darah_terverifikasi;
    slot.innerHTML = `
      <div class="kd-wrap">
        <div class="kd-card">
          <div class="kd-watermark"></div>
          <div class="kd-row-top">
            <span class="kd-eyebrow">Kartu Donor Digital</span>
            <div class="kd-chip"></div>
          </div>
          <div class="kd-name">${escapeHtml(d.nama)}</div>
          <div class="kd-id">${escapeHtml(d.id_unik_pendonor)}</div>
          <div class="kd-row-bottom">
            <div>
              <div class="kd-gol-label">Gol. Darah</div>
              <div class="kd-gol-value">${escapeHtml(d.golongan_darah)}</div>
            </div>
            <div>
              <span class="kd-status ${risiko ? 'risiko' : ''}"><i class="dot"></i>${escapeHtml(d.status_akun)}</span>
              <div class="kd-berlaku">Berlaku sejak ${fmtTanggal(d.berlaku_sejak)}</div>
            </div>
          </div>
        </div>
      </div>
      ${risiko ? `<p class="kd-hint" style="color:var(--amber);">⚠️ Golongan darah belum terverifikasi petugas.</p>` : ''}
    `;
  } catch (e) {
    slot.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
  }
}
