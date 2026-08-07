// Helper presentasi kecil yang khas tampilan pendonor (beda dari versi admin
// di frontend/internal/js/ui.js, jadi sengaja tidak digabung ke shared/dom.js).

import { icons } from './icons.js';

export function pageHeader(eyebrow, title, subtitle) {
  return `
    <div class="shell" style="padding-top:40px;">
      <p class="eyebrow">${eyebrow}</p>
      <h1 style="font-size:2rem;max-width:620px;">${title}</h1>
      ${subtitle ? `<p style="max-width:620px;">${subtitle}</p>` : ''}
    </div>`;
}

export function val(id) {
  return document.getElementById(id).value.trim();
}

// Empty state seragam untuk daftar yang kosong (lokasi, riwayat antrian,
// riwayat donor) -- ikon "kosong" mengambang pelan lewat .empty__icon (lihat
// @keyframes float di style.css) supaya kartu kosong tidak terasa statis/mati.
export function emptyState(text) {
  return `
    <div class="empty">
      <div class="empty__icon">${icons.kosong}</div>
      <p style="margin:0;">${text}</p>
    </div>`;
}

// Pagination sisi klien -- backend (lokasi/peta, antrian/saya, riwayat)
// mengembalikan seluruh data sekaligus tanpa parameter page/limit, jadi daftar
// dipotong per halaman di sini supaya kartu tidak menumpuk panjang ke bawah.
const PER_PAGE_DEFAULT = 5;

export function paginateList(list, page, perPage = PER_PAGE_DEFAULT) {
  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * perPage;
  return { items: list.slice(start, start + perPage), page: current, totalPages };
}

export function paginationHtml(page, totalPages) {
  if (totalPages <= 1) return '';
  return `
    <div class="pagination">
      <button type="button" class="btn btn-ghost btn-sm" data-page-nav="prev" ${page <= 1 ? 'disabled' : ''}>← Sebelumnya</button>
      <span class="pagination__info">Halaman ${page} dari ${totalPages}</span>
      <button type="button" class="btn btn-ghost btn-sm" data-page-nav="next" ${page >= totalPages ? 'disabled' : ''}>Selanjutnya →</button>
    </div>`;
}

// Pasang listener klik prev/next pada container yang sudah berisi hasil
// paginationHtml(); onChange menerima nomor halaman baru.
export function bindPagination(container, onChange) {
  container.querySelectorAll('[data-page-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      onChange(btn.dataset.pageNav === 'next' ? 1 : -1);
    });
  });
}
