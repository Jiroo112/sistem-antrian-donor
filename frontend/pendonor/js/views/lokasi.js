import { app } from '../elements.js';
import { el, escapeHtml } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { pageHeader, emptyState, paginateList, paginationHtml, bindPagination } from '../ui.js';

/* FR-3.2: Peta / Daftar Lokasi */
export async function viewLokasi() {
  app.innerHTML = `
    ${pageHeader('Lokasi donor', 'Lokasi UDD Tetap & Unit Donor Bergerak', 'Daftar titik lokasi donor darah aktif, lengkap dengan koordinat untuk dibuka di aplikasi peta pilihanmu.')}
    <div class="shell" style="padding:24px 24px 60px;">
      <div class="radio-group" id="filter-jenis" style="margin-bottom:20px;">
        <label class="radio-pill is-checked" data-val=""><input type="radio" name="jenis" value="">Semua</label>
        <label class="radio-pill" data-val="tetap"><input type="radio" name="jenis" value="tetap">UDD Tetap</label>
        <label class="radio-pill" data-val="mobile_unit"><input type="radio" name="jenis" value="mobile_unit">Unit Bergerak</label>
      </div>
      <div id="hasil-lokasi"></div>
    </div>
  `;

  const hasil = document.getElementById('hasil-lokasi');
  const pills = document.querySelectorAll('#filter-jenis .radio-pill');

  let daftarLokasi = [];
  let halaman = 1;

  async function load(jenis) {
    hasil.innerHTML = `<div class="skeleton" style="height:90px;"></div>`;
    try {
      const res = await Api.petaLokasi(jenis);
      daftarLokasi = res.data || [];
      halaman = 1;
      renderList();
    } catch (e) {
      hasil.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
    }
  }

  function renderList() {
    if (!daftarLokasi.length) {
      hasil.innerHTML = emptyState('Belum ada lokasi aktif untuk filter ini.');
      return;
    }
    const { items, page, totalPages } = paginateList(daftarLokasi, halaman);
    hasil.innerHTML = '';
    const listCard = el('<div class="list-card"></div>');
    items.forEach((lok) => {
      const mapsUrl = (lok.latitude && lok.longitude)
        ? `https://www.google.com/maps?q=${lok.latitude},${lok.longitude}`
        : null;
      listCard.appendChild(el(`
        <div class="list-row">
          <div style="flex:1 1 260px;min-width:0;">
            <span class="badge ${lok.jenis === 'mobile_unit' ? 'badge--info' : 'badge--aktif'}">${lok.jenis === 'mobile_unit' ? 'Unit Bergerak' : 'UDD Tetap'}</span>
            <h3 style="font-size:1.1rem;margin:8px 0 4px;">${escapeHtml(lok.nama_lokasi)}</h3>
            <p class="muted" style="margin:0;">${escapeHtml(lok.alamat || '')}</p>
          </div>
          <div style="flex-shrink:0;">
            ${mapsUrl ? `<a class="btn btn-ghost btn-sm" href="${mapsUrl}" target="_blank" rel="noopener">Buka di Peta ↗</a>` : `<span class="muted">Koordinat belum tersedia</span>`}
          </div>
        </div>
      `));
    });
    hasil.appendChild(listCard);
    const pagHtml = paginationHtml(page, totalPages);
    if (pagHtml) hasil.appendChild(el(pagHtml));
    bindPagination(hasil, (delta) => {
      halaman += delta;
      renderList();
    });
  }

  pills.forEach((p) => {
    p.addEventListener('click', () => {
      pills.forEach((x) => x.classList.remove('is-checked'));
      p.classList.add('is-checked');
      load(p.dataset.val);
    });
  });

  load('');
}
