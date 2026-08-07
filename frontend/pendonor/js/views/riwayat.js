import { app } from '../elements.js';
import { el, escapeHtml, setLoading, toast } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { fmtTanggal, statusBadgeClass, labelStatusAntrian, labelKelayakan } from '../../../js/shared/format.js';
import { pageHeader, emptyState, paginateList, paginationHtml, bindPagination } from '../ui.js';
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
      <div id="riwayat-slot"></div>
    </div>
  `;

  const ringkasanSlot = document.getElementById('ringkasan-slot');
  const riwayatSlot = document.getElementById('riwayat-slot');

  let daftarRiwayat = [];
  let halaman = 1;

  try {
    const res = await Api.riwayatSaya();
    renderRingkasan(res.data);
    daftarRiwayat = res.data.riwayat || [];
    renderRiwayat();
  } catch (e) {
    ringkasanSlot.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
    riwayatSlot.innerHTML = '';
  }

  function renderRingkasan(data) {
    const { jumlah_donor_berhasil, boleh_donor_sekarang, estimasi_donor_berikutnya } = data;
    ringkasanSlot.innerHTML = `
      <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;">
        <div style="flex:0 0 auto;padding-right:28px;border-right:1px solid var(--line);">
          <p class="eyebrow" style="margin-bottom:4px;white-space:nowrap;">Total donor berhasil</p>
          <div class="mono" style="font-size:1.8rem;font-weight:700;">${jumlah_donor_berhasil}</div>
        </div>
        <div style="flex:1 1 240px;min-width:0;">
          <p class="muted" style="margin:0 0 4px;font-size:.78rem;font-weight:600;">Estimasi donor berikutnya</p>
          <p class="muted" style="margin:0 0 6px;font-size:.78rem;">Interval minimal antar donor darah adalah 3 bulan sesuai ketentuan PMI.</p>
          <span style="font-size:1rem;font-weight:700;color:${boleh_donor_sekarang ? 'var(--success)' : 'var(--amber)'};">${boleh_donor_sekarang ? 'Sudah bisa mendaftar sekarang' : `Bisa mendaftar mulai ${fmtTanggal(estimasi_donor_berikutnya)}`}</span>
        </div>
        ${boleh_donor_sekarang ? `<a class="btn btn-primary btn-sm" href="${routeHref('/jadwal')}" data-route="/jadwal" style="flex-shrink:0;">Cari Jadwal Donor</a>` : ''}
      </div>
    `;
  }

  function renderRiwayat() {
    if (!daftarRiwayat.length) {
      riwayatSlot.innerHTML = emptyState('Belum ada riwayat donor. Ambil nomor antrian pertamamu di halaman Cari Jadwal.');
      return;
    }
    const { items, page, totalPages } = paginateList(daftarRiwayat, halaman);
    riwayatSlot.innerHTML = '';
    const listCard = el('<div class="list-card"></div>');
    items.forEach((r) => {
      listCard.appendChild(el(`
        <div class="list-row">
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
    riwayatSlot.appendChild(listCard);

    const pagHtml = paginationHtml(page, totalPages);
    if (pagHtml) riwayatSlot.appendChild(el(pagHtml));
    bindPagination(riwayatSlot, (delta) => {
      halaman += delta;
      renderRiwayat();
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
