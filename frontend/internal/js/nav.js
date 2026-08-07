import { navSlot, sidebarNavSlot, sidebarFootSlot } from './elements.js';
import { el, escapeHtml, toast } from '../../js/shared/dom.js';
import { Auth } from '../../js/api.js';
import { getCurrentUser, clearCurrentUser } from './session.js';
import { navItemsFor } from './permissions.js';
import { routeHref, navigate } from './router.js';
import { icons } from './icons.js';

const LABEL_PERAN = {
  petugas_loket: 'Petugas Loket',
  admin_udd: 'Admin UDD',
  super_admin: 'Super Admin',
};

function sidebarLinkHtml(path, label, icon) {
  return `<a class="sidebar__link" href="${routeHref(path)}" data-route="${path}"><span class="sidebar__link-icon">${icon}</span>${escapeHtml(label)}</a>`;
}

/**
 * Sidebar sekarang dipakai SEMUA peran internal yang login (dulu cuma
 * super_admin, peran lain pakai topbar sempit) -- disamakan dengan pola
 * yang sudah diterapkan di sisi pendonor supaya konsisten. Guest/belum
 * login tetap pakai topbar biasa (cuma tombol "Masuk").
 */
export function renderNav() {
  const loggedIn = Auth.isLoggedIn('internal');
  const user = getCurrentUser();

  document.body.classList.toggle('layout-sidebar', loggedIn);

  navSlot.innerHTML = '';
  sidebarNavSlot.innerHTML = '';
  sidebarFootSlot.innerHTML = '';

  if (!loggedIn) {
    navSlot.appendChild(el(`<a class="nav__link" href="${routeHref('/masuk')}" data-route="/masuk">Masuk</a>`));
    return;
  }

  const items = navItemsFor(user?.peran);
  items.forEach((item) => {
    sidebarNavSlot.appendChild(el(sidebarLinkHtml(item.route, item.label, icons[item.icon] || '')));
  });

  sidebarFootSlot.appendChild(el(`<span class="badge badge--info" style="align-self:flex-start;">${escapeHtml(LABEL_PERAN[user?.peran] || user?.peran || '')}</span>`));
  sidebarFootSlot.appendChild(el(`<button class="sidebar__link sidebar__link--logout" id="btn-logout"><span class="sidebar__link-icon">${icons.keluar}</span>Keluar</button>`));

  document.getElementById('btn-logout').addEventListener('click', () => {
    Auth.clearToken('internal');
    clearCurrentUser();
    toast('Berhasil keluar.', 'success');
    navigate('/masuk');
  });
}
