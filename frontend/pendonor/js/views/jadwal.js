import { app } from '../elements.js';
import { el, escapeHtml, setLoading, toast } from '../../../js/shared/dom.js';
import { Auth, Api } from '../../../js/api.js';
import { fmtTanggal } from '../../../js/shared/format.js';
import { pageHeader } from '../ui.js';
import { routeHref, navigate } from '../router.js';

/* FR-3.1 / FR-3.3: Cari Jadwal Donor */
export async function viewJadwal() {
  app.innerHTML = `
    ${pageHeader('Cari jadwal', 'Jadwal & Kuota Donor Darah', 'Cari kegiatan donor darah berdasarkan lokasi dan tanggal, lengkap dengan sisa kuota sebelum kamu mendaftar.')}
    <div class="shell" style="padding:24px 24px 60px;">
      <div class="card" style="margin-bottom:22px;">
        <form id="form-cari-jadwal" class="field-row" style="align-items:end;">
          <div class="field" style="margin-bottom:0;">
            <label for="f-tanggal">Tanggal</label>
            <input class="input" type="date" id="f-tanggal" name="tanggal">
          </div>
          <div class="field" style="margin-bottom:0;">
            <label for="f-nama-lokasi">Nama Lokasi <span class="muted">(opsional)</span></label>
            <input class="input" id="f-nama-lokasi" name="nama_lokasi" placeholder="mis. UDD PMI Jember">
          </div>
          <div class="field" style="margin-bottom:0;grid-column:1/-1;">
            <button class="btn btn-primary" type="submit" id="btn-cari">Cari Jadwal</button>
          </div>
        </form>
      </div>
      <div id="hasil-jadwal" class="stack"></div>
    </div>
  `;

  const hasil = document.getElementById('hasil-jadwal');
  const form = document.getElementById('form-cari-jadwal');

  async function loadJadwal(filter = {}) {
    hasil.innerHTML = `<div class="skeleton" style="height:110px;"></div><div class="skeleton" style="height:110px;"></div>`;
    try {
      const res = await Api.cariJadwal(filter);
      renderJadwalList(res.data);
    } catch (e) {
      hasil.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
    }
  }

  function renderJadwalList(list) {
    if (!list || list.length === 0) {
      hasil.innerHTML = `<div class="empty">Tidak ada jadwal yang cocok. Coba ubah tanggal atau nama lokasi.</div>`;
      return;
    }
    hasil.innerHTML = '';
    list.forEach((j) => {
      const sisa = j.kuota_tersisa ?? j.sisa_kuota ?? j.kuota_total;
      const habis = Number(sisa) <= 0;
      const loggedIn = Auth.isLoggedIn('pendonor');
      const node = el(`
        <div class="ticket">
          <div class="ticket__main">
            <p class="ticket__eyebrow">Jadwal #${j.id_jadwal ?? '-'}</p>
            <h3 class="ticket__title">${escapeHtml(j.nama_lokasi || 'Lokasi Donor')}</h3>
            <p class="muted" style="margin:2px 0 8px;">${escapeHtml(j.alamat || '')}</p>
            <div class="ticket__meta">
              <span>📅 ${fmtTanggal(j.tanggal)}</span>
              <span>⏰ ${escapeHtml(j.slot_waktu || '-')}</span>
              <span class="badge ${habis ? 'badge--nonaktif' : 'badge--aktif'}"><i class="badge-dot"></i>${habis ? 'Kuota penuh' : `Sisa kuota: ${sisa}`}</span>
            </div>
            <div style="margin-top:12px;">
              ${loggedIn
                ? `<button class="btn btn-primary btn-sm" data-ambil="${j.id_jadwal}" ${habis ? 'disabled' : ''}>Ambil Nomor Antrian</button>`
                : `<a class="btn btn-ghost btn-sm" href="${routeHref('/masuk')}" data-route="/masuk">Masuk untuk Ambil Antrian</a>`}
            </div>
          </div>
          <div class="ticket__divider"></div>
          <div class="ticket__stub">
            <div class="ticket__stub-label">Kuota total</div>
            <div class="ticket__stub-value">${j.kuota_total ?? '-'}</div>
          </div>
        </div>
      `);
      const btnAmbil = node.querySelector('[data-ambil]');
      if (btnAmbil) {
        btnAmbil.addEventListener('click', async () => {
          setLoading(btnAmbil, true);
          try {
            await Api.ambilAntrian(j.id_jadwal);
            toast('Nomor antrian berhasil diambil!', 'success');
            navigate('/antrian');
          } catch (err) {
            toast(err.message, 'error');
            setLoading(btnAmbil, false, 'Ambil Nomor Antrian');
          }
        });
      }
      hasil.appendChild(node);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    loadJadwal({
      tanggal: document.getElementById('f-tanggal').value,
      nama_lokasi: document.getElementById('f-nama-lokasi').value,
    });
  });

  loadJadwal();
}
