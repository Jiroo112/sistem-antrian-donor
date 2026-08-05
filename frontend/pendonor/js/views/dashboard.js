import { app } from '../elements.js';
import { escapeHtml } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { statusBadgeClass, labelStatusAntrian } from '../format.js';
import { pageHeader } from '../ui.js';
import { routeHref } from '../router.js';
import { requireAuth } from '../guards.js';

export async function viewDashboard() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Area pendonor', 'Dasbor Saya', '')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div id="dash-content" class="grid-2"></div>
    </div>
  `;
  const wrap = document.getElementById('dash-content');
  wrap.innerHTML = `<div class="skeleton" style="height:200px;"></div><div class="skeleton" style="height:200px;"></div>`;
  try {
    const res = await Api.getProfil();
    const { akun, riwayat_kesehatan } = res.data;
    wrap.innerHTML = `
      <div class="card">
        <p class="eyebrow">Profil</p>
        <h2 style="font-size:1.2rem;">${escapeHtml(akun.nama)}</h2>
        <div class="stack" style="margin-top:10px;font-size:.9rem;">
          <div><span class="muted">Email</span><br>${escapeHtml(akun.email)}</div>
          <div><span class="muted">Golongan darah</span><br>${escapeHtml(akun.golongan_darah)}</div>
          <div><span class="muted">Status akun</span><br><span class="badge ${statusBadgeClass(akun.status_akun)}"><i class="badge-dot"></i>${escapeHtml(akun.status_akun)}</span></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
          <a class="btn btn-quiet btn-sm" href="${routeHref('/profil')}" data-route="/profil">Lengkapi / Ubah Profil</a>
          <a class="btn btn-ghost btn-sm" href="${routeHref('/perangkat')}" data-route="/perangkat">Kelola Perangkat</a>
        </div>
      </div>
      <div class="card">
        <p class="eyebrow">Kesehatan</p>
        <h2 style="font-size:1.2rem;">Status Kuesioner Pra-Donor</h2>
        ${riwayat_kesehatan && riwayat_kesehatan.hasil_screening_awal
          ? `<p style="margin-top:8px;">Hasil terakhir:
              <span class="badge ${statusBadgeClass(riwayat_kesehatan.hasil_screening_awal)}"><i class="badge-dot"></i>${riwayat_kesehatan.hasil_screening_awal === 'lolos_screening_awal' ? 'Lolos self-assessment' : 'Perlu pemeriksaan lanjutan'}</span></p>`
          : `<p style="margin-top:8px;">Kamu belum mengisi kuesioner kesehatan pra-donor.</p>`}
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;">
          <a class="btn btn-primary btn-sm" href="${routeHref('/kuesioner')}" data-route="/kuesioner">Isi / Perbarui Kuesioner</a>
          <a class="btn btn-ghost btn-sm" href="${routeHref('/kartu-donor')}" data-route="/kartu-donor">Lihat Kartu Donor Digital</a>
        </div>
      </div>
      <div class="card">
        <p class="eyebrow">Antrian</p>
        <h2 style="font-size:1.2rem;">Nomor Antrian Donor</h2>
        <div id="dash-antrian-status" style="margin-top:8px;"><div class="skeleton" style="height:44px;"></div></div>
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;">
          <a class="btn btn-primary btn-sm" href="${routeHref('/antrian')}" data-route="/antrian">Lihat Antrian Saya</a>
          <a class="btn btn-ghost btn-sm" href="${routeHref('/jadwal')}" data-route="/jadwal">Ambil Nomor Baru</a>
        </div>
      </div>
    `;
    loadDashAntrianStatus();
  } catch (e) {
    wrap.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
  }
}

async function loadDashAntrianStatus() {
  const slot = document.getElementById('dash-antrian-status');
  if (!slot) return;
  try {
    const res = await Api.antrianSaya();
    const a = res.data.antrian_aktif;
    slot.innerHTML = a
      ? `<p>Nomor <strong class="mono">${String(a.nomor_urut).padStart(3, '0')}</strong> di ${escapeHtml((a.jadwal && a.jadwal.nama_lokasi) || 'lokasi donor')}
          <br><span class="badge ${statusBadgeClass(a.status)}"><i class="badge-dot"></i>${escapeHtml(labelStatusAntrian(a.status))}</span></p>`
      : `<p class="muted">Kamu belum punya nomor antrian aktif.</p>`;
  } catch (e) {
    slot.innerHTML = `<p class="muted">Gagal memuat status antrian.</p>`;
  }
}
