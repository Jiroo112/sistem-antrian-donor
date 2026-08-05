import { navSlot } from './elements.js';
import { el, escapeHtml, toast } from '../../js/shared/dom.js';
import { Auth } from '../../js/api.js';
import { getCurrentUser, clearCurrentUser } from './session.js';

export function renderNav() {
  const loggedIn = Auth.isLoggedIn('internal');
  const user = getCurrentUser();
  navSlot.innerHTML = '';
  if (loggedIn) {
    navSlot.appendChild(el(`<a class="nav__link" href="#/jadwal">Kelola Jadwal</a>`));
    navSlot.appendChild(el(`<a class="nav__link" href="#/lokasi">Kelola Lokasi</a>`));
    navSlot.appendChild(el(`<span class="badge badge--info" style="margin:0 6px;">${escapeHtml(user?.peran || '')}</span>`));
    navSlot.appendChild(el(`<button class="nav__link" id="btn-logout">Keluar</button>`));
  } else {
    navSlot.appendChild(el(`<a class="nav__link" href="#/masuk">Masuk</a>`));
  }
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.clearToken('internal');
      clearCurrentUser();
      toast('Berhasil keluar.', 'success');
      location.hash = '#/masuk';
    });
  }
}
