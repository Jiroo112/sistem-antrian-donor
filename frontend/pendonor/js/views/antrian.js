import { app } from '../elements.js';
import { el, escapeHtml, setLoading, toast } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { fmtTanggal, fmtTanggalWaktu, statusBadgeClass, labelStatusAntrian } from '../../../js/shared/format.js';
import { renderQrCode } from '../qr.js';
import { pageHeader } from '../ui.js';
import { routeHref } from '../router.js';
import { requireAuth } from '../guards.js';

// FR-5.3: sinkronisasi lintas platform + NFR performa ("pembaruan status
// antrian real-time maksimal jeda 5 detik") diwujudkan lewat polling tiap 5
// detik -- backend-nya REST biasa (tanpa websocket), jadi semua platform yang
// memanggil endpoint yang sama otomatis melihat status/posisi yang konsisten.
const INTERVAL_POLLING_MS = 5000;

/* FR-4.1 - FR-4.4: Antrian Saya + FR-5.1/5.2/5.3: Tracking Posisi Real-Time */
export async function viewAntrianSaya() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Area pendonor', 'Antrian Saya', 'Lihat e-ticket antrianmu, pantau posisi antrian secara langsung, batalkan, atau jadwalkan ulang sebelum kegiatan donor dimulai.')}
    <div class="shell" style="padding:16px 24px 60px;">
      <div id="antrian-aktif-slot" class="card" style="margin-bottom:26px;"><div class="skeleton" style="height:180px;"></div></div>
      <h2 style="font-size:1.1rem;margin-bottom:12px;">Riwayat Antrian</h2>
      <div id="antrian-riwayat-slot" class="stack"></div>
    </div>
  `;

  const aktifSlot = document.getElementById('antrian-aktif-slot');
  const riwayatSlot = document.getElementById('antrian-riwayat-slot');

  // Dicek sebelum tiap poll: kalau true, lewati refresh supaya form "Jadwalkan
  // Ulang" yang lagi dibuka pendonor tidak tiba-tiba hilang ketika aktifSlot
  // di-render ulang dari nol tiap loadAntrianSaya() dipanggil.
  let sedangIsiFormJadwalUlang = false;

  async function loadAntrianSaya() {
    try {
      const res = await Api.antrianSaya();
      renderAntrianAktif(res.data.antrian_aktif);
      renderRiwayat(res.data.riwayat || []);
    } catch (e) {
      aktifSlot.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
      riwayatSlot.innerHTML = '';
    }
  }

  // Router hand-rolled ini tidak punya lifecycle "unmount", jadi timer dicek
  // tiap tick apakah elemen slotnya masih ada di DOM -- begitu pendonor
  // pindah halaman (app.innerHTML diganti view lain), slot lama otomatis
  // lepas dari dokumen dan polling berhenti sendiri di sini.
  const pollTimer = setInterval(() => {
    if (!document.body.contains(aktifSlot)) {
      clearInterval(pollTimer);
      return;
    }
    if (sedangIsiFormJadwalUlang) return;
    loadAntrianSaya();
  }, INTERVAL_POLLING_MS);

  function renderAntrianAktif(a) {
    if (!a) {
      aktifSlot.innerHTML = `
        <p class="eyebrow">Belum ada antrian aktif</p>
        <h2 style="font-size:1.2rem;">Kamu belum mengambil nomor antrian</h2>
        <p>Cari jadwal donor darah yang tersedia, lalu ambil nomor antrianmu di sana.</p>
        <a class="btn btn-primary" href="${routeHref('/jadwal')}" data-route="/jadwal" style="margin-top:10px;display:inline-flex;">Cari Jadwal Donor</a>
      `;
      return;
    }
    const j = a.jadwal || {};
    aktifSlot.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <p class="eyebrow" style="margin-bottom:0;">E-Ticket Antrian Aktif</p>
        ${a.posisi ? `<span class="muted" style="font-size:.72rem;">🔄 posisi diperbarui otomatis tiap 5 detik</span>` : ''}
      </div>
      <div class="ticket" style="margin-top:8px;">
        <div class="ticket__main">
          <h3 class="ticket__title">${escapeHtml(j.nama_lokasi || 'Lokasi Donor')}</h3>
          <p class="muted" style="margin:2px 0 8px;">${escapeHtml(j.alamat || '')}</p>
          <div class="ticket__meta">
            <span>📅 ${fmtTanggal(j.tanggal)}</span>
            <span>⏰ ${escapeHtml(j.slot_waktu || '-')}</span>
            <span class="badge ${statusBadgeClass(a.status)}"><i class="badge-dot"></i>${escapeHtml(labelStatusAntrian(a.status))}</span>
            ${a.hasil_screening_kesehatan === 'perlu_pemeriksaan_lanjutan' ? `<span class="badge badge--risiko" title="Self-assessment kesehatan saat ambil nomor ini mengarah ke perlu pemeriksaan lanjutan. Keputusan akhir tetap di petugas medis di lokasi."><i class="badge-dot"></i>⚠️ Perlu Perhatian</span>` : ''}
          </div>
          ${a.posisi ? `
            <div style="display:flex;gap:28px;margin-top:14px;padding-top:14px;border-top:1px solid var(--line);flex-wrap:wrap;">
              <div>
                <div class="mono" style="font-size:1.4rem;font-weight:700;">${a.posisi.nomor_sedang_dilayani !== null ? String(a.posisi.nomor_sedang_dilayani).padStart(3, '0') : '-'}</div>
                <div class="muted" style="font-size:.72rem;">Nomor sedang dilayani</div>
              </div>
              <div>
                <div class="mono" style="font-size:1.4rem;font-weight:700;">${a.posisi.jumlah_di_depan}</div>
                <div class="muted" style="font-size:.72rem;">Orang di depan Anda</div>
              </div>
              <div>
                <div class="mono" style="font-size:1.4rem;font-weight:700;">~${a.posisi.estimasi_menit}<span style="font-size:.8rem;font-weight:600;"> mnt</span></div>
                <div class="muted" style="font-size:.72rem;">Estimasi tunggu</div>
              </div>
            </div>
          ` : ''}
          <p class="muted" style="margin-top:10px;font-size:.82rem;">Batas check-in: ${fmtTanggalWaktu(a.batas_waktu_checkin)}</p>
          <div class="ticket__qr-row">
            <div class="ticket__qr-box" id="qr-slot"></div>
            <div class="ticket__qr-caption">
              Tunjukkan QR ini ke petugas loket saat check-in di lokasi.
              <span class="mono">${escapeHtml(a.qr_code)}</span>
            </div>
          </div>
        </div>
        <div class="ticket__divider"></div>
        <div class="ticket__stub">
          <div class="ticket__stub-label">Nomor Antrian</div>
          <div class="ticket__stub-value">${String(a.nomor_urut).padStart(3, '0')}</div>
        </div>
      </div>
      ${a.status === 'menunggu' ? `
        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" id="btn-jadwal-ulang">Jadwalkan Ulang</button>
          <button class="btn btn-danger btn-sm" id="btn-batalkan">Batalkan Antrian</button>
        </div>
        <div id="jadwal-ulang-slot" style="margin-top:16px;"></div>
      ` : ''}
    `;

    renderQrCode('qr-slot', a.qr_code);

    const btnBatalkan = document.getElementById('btn-batalkan');
    if (btnBatalkan) {
      btnBatalkan.addEventListener('click', async () => {
        if (!confirm('Yakin ingin membatalkan antrian ini? Nomor akan hangus dan kuota dikembalikan.')) return;
        setLoading(btnBatalkan, true);
        try {
          await Api.batalkanAntrian(a.id_antrian);
          toast('Antrian berhasil dibatalkan.', 'success');
          sedangIsiFormJadwalUlang = false;
          loadAntrianSaya();
        } catch (e) {
          toast(e.message, 'error');
          setLoading(btnBatalkan, false, 'Batalkan Antrian');
        }
      });
    }

    const btnJadwalUlang = document.getElementById('btn-jadwal-ulang');
    if (btnJadwalUlang) {
      btnJadwalUlang.addEventListener('click', () => {
        sedangIsiFormJadwalUlang = true;
        renderFormJadwalUlang(a.id_antrian, j.id_jadwal);
      });
    }
  }

  async function renderFormJadwalUlang(idAntrian, idJadwalSaatIni) {
    const slot = document.getElementById('jadwal-ulang-slot');
    slot.innerHTML = `<div class="skeleton" style="height:70px;"></div>`;
    try {
      const res = await Api.cariJadwal({});
      const opsi = (res.data || []).filter((jd) =>
        Number(jd.id_jadwal) !== Number(idJadwalSaatIni) &&
        Number(jd.kuota_tersisa ?? jd.sisa_kuota ?? 0) > 0
      );
      if (opsi.length === 0) {
        slot.innerHTML = `<div class="empty">Tidak ada jadwal lain yang tersedia saat ini.</div>`;
        sedangIsiFormJadwalUlang = false;
        return;
      }
      slot.innerHTML = `
        <div class="card" style="background:var(--paper);">
          <label for="select-jadwal-baru">Pilih jadwal baru</label>
          <select class="input" id="select-jadwal-baru">
            ${opsi.map((jd) => `<option value="${jd.id_jadwal}">${escapeHtml(jd.nama_lokasi)} — ${fmtTanggal(jd.tanggal)}, ${escapeHtml(jd.slot_waktu)} (sisa ${jd.kuota_tersisa ?? jd.sisa_kuota})</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" id="btn-konfirmasi-jadwal-ulang" style="margin-top:12px;">Konfirmasi Jadwal Baru</button>
        </div>
      `;
      document.getElementById('btn-konfirmasi-jadwal-ulang').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const idBaru = document.getElementById('select-jadwal-baru').value;
        setLoading(btn, true);
        try {
          await Api.jadwalUlangAntrian(idAntrian, idBaru);
          toast('Antrian berhasil dijadwalkan ulang.', 'success');
          sedangIsiFormJadwalUlang = false;
          loadAntrianSaya();
        } catch (err) {
          toast(err.message, 'error');
          setLoading(btn, false, 'Konfirmasi Jadwal Baru');
        }
      });
    } catch (e) {
      slot.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
      sedangIsiFormJadwalUlang = false;
    }
  }

  function renderRiwayat(list) {
    if (!list.length) {
      riwayatSlot.innerHTML = `<div class="empty">Belum ada riwayat antrian.</div>`;
      return;
    }
    riwayatSlot.innerHTML = '';
    list.forEach((r) => {
      riwayatSlot.appendChild(el(`
        <div class="card" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center;">
          <div>
            <h3 style="font-size:1rem;margin:0 0 4px;">${escapeHtml(r.nama_lokasi || 'Lokasi Donor')}</h3>
            <p class="muted" style="margin:0;font-size:.85rem;">📅 ${fmtTanggal(r.tanggal)} · ⏰ ${escapeHtml(r.slot_waktu || '-')} · No. ${String(r.nomor_urut).padStart(3, '0')}</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <span class="badge ${statusBadgeClass(r.status)}"><i class="badge-dot"></i>${escapeHtml(labelStatusAntrian(r.status))}</span>
            ${r.hasil_screening_kesehatan === 'perlu_pemeriksaan_lanjutan' ? `<span class="badge badge--risiko"><i class="badge-dot"></i>⚠️</span>` : ''}
          </div>
        </div>
      `));
    });
  }

  loadAntrianSaya();
}
