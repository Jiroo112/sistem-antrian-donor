import { app } from '../elements.js';
import { el, escapeHtml, setLoading, toast } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { fmtTanggal, statusBadgeClass, labelStatusAntrian, labelKelayakan } from '../../../js/shared/format.js';
import { pageHeader } from '../ui.js';
import { routeHref } from '../router.js';
import { requireAuth } from '../guards.js';

/* FR-8.1 - FR-8.3: Riwayat Donor Pribadi, Sertifikat Donor Digital, Pengingat Jadwal Donor Berikutnya */
export async function viewRiwayat() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Area pendonor', 'Riwayat & Sertifikat Donor', 'Lihat riwayat lengkap kegiatan donor darahmu, unduh sertifikat digital, dan cek kapan boleh mendonor lagi.')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div id="ringkasan-slot" class="card" style="margin-bottom:26px;"><div class="skeleton" style="height:90px;"></div></div>
      <h2 style="font-size:1.1rem;margin-bottom:12px;">Riwayat Donor</h2>
      <div id="riwayat-slot" class="stack"></div>
    </div>
  `;

  const ringkasanSlot = document.getElementById('ringkasan-slot');
  const riwayatSlot = document.getElementById('riwayat-slot');

  try {
    const res = await Api.riwayatSaya();
    renderRingkasan(res.data);
    renderRiwayat(res.data.riwayat || []);
  } catch (e) {
    ringkasanSlot.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
    riwayatSlot.innerHTML = '';
  }

  function renderRingkasan(data) {
    const { jumlah_donor_berhasil, boleh_donor_sekarang, estimasi_donor_berikutnya } = data;
    ringkasanSlot.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;align-items:center;">
        <div>
          <p class="eyebrow" style="margin-bottom:2px;">Total donor berhasil</p>
          <div class="mono" style="font-size:1.8rem;font-weight:700;">${jumlah_donor_berhasil}</div>
        </div>
        <div>
          <p class="eyebrow" style="margin-bottom:6px;">Estimasi donor berikutnya</p>
          ${boleh_donor_sekarang
            ? `<span class="badge badge--aktif"><i class="badge-dot"></i>Sudah bisa mendaftar sekarang</span>`
            : `<span class="badge badge--menunggu"><i class="badge-dot"></i>Bisa mendaftar mulai ${fmtTanggal(estimasi_donor_berikutnya)}</span>`}
          <p class="muted" style="margin-top:6px;font-size:.78rem;">Interval minimal antar donor darah adalah 3 bulan sesuai ketentuan PMI.</p>
        </div>
        ${boleh_donor_sekarang ? `<a class="btn btn-primary btn-sm" href="${routeHref('/jadwal')}" data-route="/jadwal">Cari Jadwal Donor</a>` : ''}
      </div>
    `;
  }

  function renderRiwayat(list) {
    if (!list.length) {
      riwayatSlot.innerHTML = `<div class="empty">Belum ada riwayat donor. Ambil nomor antrian pertamamu di halaman Cari Jadwal.</div>`;
      return;
    }
    riwayatSlot.innerHTML = '';
    list.forEach((r) => {
      riwayatSlot.appendChild(el(`
        <div class="card" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center;">
          <div style="flex:1 1 260px;min-width:0;">
            <h3 style="font-size:1rem;margin:0 0 4px;">${escapeHtml(r.nama_lokasi || 'Lokasi Donor')}</h3>
            <p class="muted" style="margin:0;font-size:.85rem;">📅 ${fmtTanggal(r.tanggal)} · ⏰ ${escapeHtml(r.slot_waktu || '-')} · No. ${String(r.nomor_urut).padStart(3, '0')}</p>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;flex-wrap:wrap;">
            <span class="badge ${statusBadgeClass(r.status)}"><i class="badge-dot"></i>${escapeHtml(labelStatusAntrian(r.status))}</span>
            ${r.status_kelayakan ? `<span class="badge ${statusBadgeClass(r.status_kelayakan)}"><i class="badge-dot"></i>${escapeHtml(labelKelayakan(r.status_kelayakan))}</span>` : ''}
            ${r.sertifikat_tersedia ? `<button class="btn btn-ghost btn-sm" data-unduh="${r.id_antrian}">Unduh Sertifikat</button>` : ''}
          </div>
        </div>
      `));
    });

    riwayatSlot.querySelectorAll('[data-unduh]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        setLoading(btn, true);
        try {
          await Api.unduhSertifikat(btn.dataset.unduh);
        } catch (e) {
          toast(e.message, 'error');
        } finally {
          setLoading(btn, false, 'Unduh Sertifikat');
        }
      });
    });
  }
}
