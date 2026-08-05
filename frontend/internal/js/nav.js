import { navSlot } from './elements.js';
import { el, escapeHtml, toast } from '../../js/shared/dom.js';
import { Auth } from '../../js/api.js';
import { getCurrentUser, clearCurrentUser } from './session.js';
import { navItemsFor } from './permissions.js';
import { routeHref, navigate } from './router.js';

export function renderNav() {
  const loggedIn = Auth.isLoggedIn('internal');
  const user = getCurrentUser();
  navSlot.innerHTML = '';
  if (loggedIn) {
    navItemsFor(user?.peran).forEach((item) => {
      navSlot.appendChild(el(`<a class="nav__link" href="${routeHref(item.route)}" data-route="${item.route}">${escapeHtml(item.label)}</a>`));
    });
    navSlot.appendChild(el(`<span class="badge badge--info" style="margin:0 6px;">${escapeHtml(user?.peran || '')}</span>`));
    navSlot.appendChild(el(`<button class="nav__link" id="btn-logout">Keluar</button>`));
  } else {
    navSlot.appendChild(el(`<a class="nav__link" href="${routeHref('/masuk')}" data-route="/masuk">Masuk</a>`));
  }
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.clearToken('internal');
      clearCurrentUser();
      toast('Berhasil keluar.', 'success');
      navigate('/masuk');
    });
  }
}
