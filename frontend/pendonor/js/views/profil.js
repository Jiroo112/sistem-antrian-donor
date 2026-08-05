import { app } from '../elements.js';
import { escapeHtml, toast, setLoading, renderAlertError } from '../../../js/shared/dom.js';
import { Api } from '../../../js/api.js';
import { pageHeader, val } from '../ui.js';
import { requireAuth } from '../guards.js';

/* FR-2.1: Profil & Data Kesehatan Dasar */
export async function viewProfil() {
  if (!requireAuth()) return;
  app.innerHTML = `
    ${pageHeader('Area pendonor', 'Profil & Data Kesehatan Dasar', 'Lengkapi data ini supaya petugas skrining di lokasi bisa memverifikasi kelayakanmu lebih cepat.')}
    <div class="shell shell--narrow" style="padding:16px 24px 60px;">
      <div class="card" id="profil-card"><div class="skeleton" style="height:320px;"></div></div>
    </div>
  `;
  const card = document.getElementById('profil-card');
  let current = null;
  try {
    const res = await Api.getProfil();
    current = res.data;
  } catch (e) {
    card.innerHTML = `<div class="alert alert-error">${escapeHtml(e.message)}</div>`;
    return;
  }

  const akun = current.akun;
  const riw = current.riwayat_kesehatan || {};

  card.innerHTML = `
    <div id="alert-slot"></div>
    <form id="form-profil">
      <div class="field-row">
        <div class="field">
          <label for="p-golongan">Golongan Darah</label>
          <select class="input" id="p-golongan">
            <option value="">— Belum diketahui —</option>
            ${['A', 'B', 'AB', 'O'].map((g) => `<option value="${g}" ${akun.golongan_darah === g ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="p-berat">Berat Badan (kg)</label>
          <input class="input" id="p-berat" type="number" step="0.1" min="0" value="${riw.berat_badan ?? ''}">
        </div>
      </div>
      <div class="field">
        <label for="p-alamat">Alamat</label>
        <textarea class="input" id="p-alamat" rows="2" maxlength="500">${escapeHtml(akun.alamat || '')}</textarea>
      </div>
      <div class="field">
        <label for="p-tekanan">Tekanan Darah</label>
        <input class="input" id="p-tekanan" placeholder="mis. 120/80" value="${escapeHtml(riw.tekanan_darah || '')}">
      </div>
      <div class="field">
        <label for="p-penyakit">Penyakit Bawaan</label>
        <textarea class="input" id="p-penyakit" rows="2" maxlength="500">${escapeHtml(riw.penyakit_bawaan || '')}</textarea>
      </div>
      <div class="field">
        <label for="p-riwayat">Riwayat Donor Sebelumnya</label>
        <textarea class="input" id="p-riwayat" rows="2" maxlength="500">${escapeHtml(riw.riwayat_donor_sebelumnya || '')}</textarea>
      </div>
      <button class="btn btn-primary btn-block" type="submit" id="btn-simpan-profil">Simpan Perubahan</button>
    </form>
  `;

  document.getElementById('form-profil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertSlot = document.getElementById('alert-slot');
    alertSlot.innerHTML = '';
    const btn = document.getElementById('btn-simpan-profil');
    setLoading(btn, true);
    try {
      await Api.updateProfil({
        golongan_darah: val('p-golongan'),
        alamat: val('p-alamat'),
        berat_badan: val('p-berat'),
        tekanan_darah: val('p-tekanan'),
        penyakit_bawaan: val('p-penyakit'),
        riwayat_donor_sebelumnya: val('p-riwayat'),
      });
      alertSlot.innerHTML = `<div class="alert alert-success">Profil berhasil diperbarui.</div>`;
      toast('Profil berhasil diperbarui.', 'success');
    } catch (err) {
      alertSlot.innerHTML = renderAlertError(err);
    } finally {
      setLoading(btn, false, 'Simpan Perubahan');
    }
  });
}
