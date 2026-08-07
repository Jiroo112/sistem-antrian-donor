import { app } from '../elements.js';
import { escapeHtml } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { statusBadgeClass, labelStatusAntrian } from '../../../js/shared/format.js';
import { routeHref } from '../router.js';
import { requireAuth } from '../guards.js';
import { icons } from '../icons.js';

function inisial(nama) {
  const kata = (nama || '').trim().split(/\s+/).filter(Boolean);
  if (!kata.length) return '?';
  return (kata[0][0] + (kata[1] ? kata[1][0] : '')).toUpperCase();
}

/* Dasbor Saya -- ringkasan cepat (profil, kesehatan, antrian) begitu pendonor
   login, makanya ditaruh paling atas di sidebar. Dirombak dari 3 kartu polos
   berisi teks jadi kartu bergaya: sapaan + avatar, baris statistik, dan
   kartu aksi dengan ikon -- mengikuti sistem desain di frontend/DESIGN.md
   yang sudah jadi fondasi global (variabel warna/radius/shadow di style.css). */
export async function viewDashboard() {
  if (!requireAuth()) return;
  app.innerHTML = `
    <style>
      .dash{ padding:32px 24px 60px; }
      .dash-hero{ display:flex; align-items:center; gap:18px; margin-bottom:28px; }
      .dash-avatar{
        flex-shrink:0; width:56px; height:56px; border-radius:50%;
        background:var(--crimson); color:#fff; font-weight:700; font-size:1.2rem;
        display:flex; align-items:center; justify-content:center;
      }
      .dash-hero h1{ font-size:1.7rem; margin:2px 0 2px; }

      .dash-stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px; }
      @media (max-width:900px){ .dash-stats{ grid-template-columns:repeat(2,1fr); } }
      .dash-stat{
        display:flex; align-items:center; gap:12px;
        background:var(--paper-raised); border:1px solid var(--line); border-radius:var(--radius-l);
        box-shadow:var(--shadow-card); padding:16px 18px;
      }
      .dash-stat__icon{
        flex-shrink:0; width:40px; height:40px; border-radius:50%;
        background:var(--crimson-tint); color:var(--crimson-dark);
        display:flex; align-items:center; justify-content:center;
      }
      .dash-stat__value{ font-weight:700; font-size:1.15rem; line-height:1.2; color:var(--ink); }
      .dash-stat__label{ font-size:.76rem; color:var(--slate); margin-top:1px; }

      .dash-card{
        background:var(--paper-raised); border:1px solid var(--line); border-radius:var(--radius-l);
        box-shadow:var(--shadow-card); padding:24px; transition:box-shadow .15s,transform .15s;
      }
      .dash-card:hover{ box-shadow:0 4px 10px rgba(0,0,0,.08), 0 8px 20px rgba(0,0,0,.06); transform:translateY(-2px); }
      .dash-card__head{ display:flex; align-items:center; gap:12px; margin-bottom:14px; }
      .dash-card__icon{
        flex-shrink:0; width:38px; height:38px; border-radius:50%;
        background:var(--crimson-tint); color:var(--crimson-dark);
        display:flex; align-items:center; justify-content:center;
      }
      .dash-card__head h2{ font-size:1.05rem; margin:0; }
      .dash-card__head .eyebrow{ margin-bottom:2px; }
      .dash-card .stack{ font-size:.9rem; }
      .dash-card__actions{ display:flex; gap:10px; margin-top:16px; flex-wrap:wrap; }
      .dash-antrian-row{ display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
      .dash-antrian-row .lokasi{ color:var(--ink); font-size:.95rem; }
      .dash-antrian-row .nomor{ font-weight:700; font-size:1.05rem; color:var(--ink); }
    </style>

    <div class="shell dash">
      <div id="dash-hero-slot"></div>
      <div id="dash-stats-slot" class="dash-stats">
        ${Array(4).fill('<div class="skeleton" style="height:72px;border-radius:var(--radius-l);"></div>').join('')}
      </div>
      <div id="dash-content" class="grid-2"></div>
    </div>
  `;

  const heroSlot = document.getElementById('dash-hero-slot');
  const statsSlot = document.getElementById('dash-stats-slot');
  const wrap = document.getElementById('dash-content');
  wrap.innerHTML = `<div class="skeleton" style="height:220px;border-radius:var(--radius-l);"></div><div class="skeleton" style="height:220px;border-radius:var(--radius-l);"></div>`;

  try {
    const res = await Api.getProfil();
    const { akun, riwayat_kesehatan } = res.data;
    // PENTING: hasil kuesioner tersimpan BERSARANG di
    // riwayat_kesehatan.hasil_kuesioner.hasil_screening_awal (lihat
    // Profil::index() -- kolom JSON hasil_kuesioner didekode jadi objek),
    // BUKAN riwayat_kesehatan.hasil_screening_awal langsung. Sebelumnya baca
    // path yang salah, jadi badge status kuesioner selalu "Belum Diisi"
    // walau datanya sebenarnya sudah tersimpan di database.
    const hasilKuesioner = riwayat_kesehatan && riwayat_kesehatan.hasil_kuesioner;
    const sudahIsiKuesioner = hasilKuesioner && hasilKuesioner.hasil_screening_awal;

    heroSlot.innerHTML = `
      <div class="dash-hero">
        <div class="dash-avatar">${escapeHtml(inisial(akun.nama))}</div>
        <div>
          <p class="eyebrow" style="margin-bottom:2px;">Area Pendonor</p>
          <h1>Halo, ${escapeHtml(akun.nama)} 👋</h1>
          <p class="muted" style="margin:0;">Ini ringkasan aktivitas donor darahmu.</p>
        </div>
      </div>
    `;

    statsSlot.innerHTML = `
      <div class="dash-stat">
        <span class="dash-stat__icon">${icons.kesehatan}</span>
        <div><div class="dash-stat__value">${escapeHtml(akun.golongan_darah)}</div><div class="dash-stat__label">Golongan Darah</div></div>
      </div>
      <div class="dash-stat">
        <span class="dash-stat__icon">${icons.profil}</span>
        <div><span class="badge ${statusBadgeClass(akun.status_akun)}"><i class="badge-dot"></i>${escapeHtml(akun.status_akun)}</span><div class="dash-stat__label">Status Akun</div></div>
      </div>
      <div class="dash-stat">
        <span class="dash-stat__icon">${icons.checklist}</span>
        <div>${sudahIsiKuesioner
          ? `<span class="badge ${statusBadgeClass(hasilKuesioner.hasil_screening_awal)}"><i class="badge-dot"></i>${hasilKuesioner.hasil_screening_awal === 'lolos_screening_awal' ? 'Lolos' : 'Perlu Cek'}</span>`
          : `<span class="badge badge--menunggu"><i class="badge-dot"></i>Belum Diisi</span>`}<div class="dash-stat__label">Kuesioner Kesehatan</div></div>
      </div>
      <div class="dash-stat" id="dash-stat-antrian">
        <span class="dash-stat__icon">${icons.antrian}</span>
        <div><div class="dash-stat__value">…</div><div class="dash-stat__label">Antrian Aktif</div></div>
      </div>
    `;

    wrap.innerHTML = `
      <div class="dash-card">
        <div class="dash-card__head">
          <span class="dash-card__icon">${icons.profil}</span>
          <div><p class="eyebrow">Profil</p><h2>${escapeHtml(akun.nama)}</h2></div>
        </div>
        <div class="stack">
          <div><span class="muted">Email</span><br>${escapeHtml(akun.email)}</div>
          <div><span class="muted">Golongan darah</span><br>${escapeHtml(akun.golongan_darah)}</div>
        </div>
        <div class="dash-card__actions">
          <a class="btn btn-quiet btn-sm" href="${routeHref('/profil')}" data-route="/profil">Lengkapi / Ubah Profil</a>
          <a class="btn btn-ghost btn-sm" href="${routeHref('/perangkat')}" data-route="/perangkat">Kelola Perangkat</a>
        </div>
      </div>

      <div class="dash-card">
        <div class="dash-card__head">
          <span class="dash-card__icon">${icons.kesehatan}</span>
          <div><p class="eyebrow">Kesehatan</p><h2>Status Kuesioner Pra-Donor</h2></div>
        </div>
        ${sudahIsiKuesioner
          ? `<p>Hasil terakhir: <span class="badge ${statusBadgeClass(hasilKuesioner.hasil_screening_awal)}"><i class="badge-dot"></i>${hasilKuesioner.hasil_screening_awal === 'lolos_screening_awal' ? 'Lolos self-assessment' : 'Perlu pemeriksaan lanjutan'}</span></p>`
          : `<p class="muted">Kamu belum pernah mengisi kuesioner kesehatan pra-donor.</p>`}
        <p class="muted" style="margin-top:2px;">Kuesioner ini diisi ulang setiap kali kamu ambil nomor antrian baru.</p>
        <div class="dash-card__actions">
          <a class="btn btn-primary btn-sm" href="${routeHref('/jadwal')}" data-route="/jadwal">Cari Jadwal untuk Donor</a>
          <a class="btn btn-ghost btn-sm" href="${routeHref('/kartu-donor')}" data-route="/kartu-donor">Lihat Kartu Donor Digital</a>
        </div>
      </div>

      <div class="dash-card" style="grid-column:1 / -1;">
        <div class="dash-card__head">
          <span class="dash-card__icon">${icons.antrian}</span>
          <div><p class="eyebrow">Antrian</p><h2>Nomor Antrian Donor</h2></div>
        </div>
        <div id="dash-antrian-status"><div class="skeleton" style="height:44px;"></div></div>
        <div class="dash-card__actions">
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
  const statTile = document.getElementById('dash-stat-antrian');
  if (!slot) return;
  try {
    const res = await Api.antrianSaya();
    const a = res.data.antrian_aktif;
    slot.innerHTML = a
      ? `<div class="dash-antrian-row">
          <span class="lokasi">Nomor <span class="mono nomor">#${String(a.nomor_urut).padStart(3, '0')}</span> di ${escapeHtml((a.jadwal && a.jadwal.nama_lokasi) || 'lokasi donor')}</span>
          <span class="badge ${statusBadgeClass(a.status)}"><i class="badge-dot"></i>${escapeHtml(labelStatusAntrian(a.status))}</span>
        </div>`
      : `<p class="muted" style="margin:0;">Kamu belum punya nomor antrian aktif.</p>`;
    if (statTile) {
      statTile.querySelector('.dash-stat__value').textContent = a ? `#${String(a.nomor_urut).padStart(3, '0')}` : '—';
    }
  } catch (e) {
    slot.innerHTML = `<p class="muted">Gagal memuat status antrian.</p>`;
    if (statTile) statTile.querySelector('.dash-stat__value').textContent = '—';
  }
}
