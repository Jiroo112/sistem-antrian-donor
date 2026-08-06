import { navSlot, sidebarNavSlot, sidebarFootSlot } from './elements.js';
import { el, escapeHtml, toast } from '../../js/shared/dom.js';
import { Auth } from '../../js/api.js';
import { getCurrentUser, clearCurrentUser } from './session.js';
import { navItemsFor } from './permissions.js';
import { routeHref, navigate } from './router.js';

/**
 * Super Admin dapat halaman lebih banyak daripada peran lain (lihat
 * NAV_ITEMS di permissions.js), jadi navbar atas jadi sempit/padat kalau
 * dipaksakan. Untuk peran ini navigasi dipindah ke sidebar kiri (markup
 * statisnya sudah ada di admin_shell.php, tinggal ditampilkan lewat class
 * body "layout-sidebar" -- lihat aturan CSS ".sidebar" & "#page-wrap" di
 * frontend/css/style.css). Peran lain tetap pakai topbar seperti semula.
 */
function pakaiSidebar(peran) {
  return peran === 'super_admin';
}

function renderLogoutButton(className) {
  return el(`<button class="${className}" id="btn-logout">Keluar</button>`);
}

export function renderNav() {
  const loggedIn = Auth.isLoggedIn('internal');
  const user = getCurrentUser();
  const sidebarMode = loggedIn && pakaiSidebar(user?.peran);

  document.body.classList.toggle('layout-sidebar', sidebarMode);

  navSlot.innerHTML = '';
  sidebarNavSlot.innerHTML = '';
  sidebarFootSlot.innerHTML = '';

  if (!loggedIn) {
    navSlot.appendChild(el(`<a class="nav__link" href="${routeHref('/masuk')}" data-route="/masuk">Masuk</a>`));
    return;
  }

  const items = navItemsFor(user?.peran);

  if (sidebarMode) {
    items.forEach((item) => {
      sidebarNavSlot.appendChild(el(`<a class="sidebar__link" href="${routeHref(item.route)}" data-route="${item.route}">${escapeHtml(item.label)}</a>`));
    });
    sidebarFootSlot.appendChild(el(`<span class="badge badge--info">${escapeHtml(user?.peran || '')}</span>`));
    sidebarFootSlot.appendChild(renderLogoutButton('sidebar__link sidebar__link--logout'));
  } else {
    items.forEach((item) => {
      navSlot.appendChild(el(`<a class="nav__link" href="${routeHref(item.route)}" data-route="${item.route}">${escapeHtml(item.label)}</a>`));
    });
    navSlot.appendChild(el(`<span class="badge badge--info" style="margin:0 6px;">${escapeHtml(user?.peran || '')}</span>`));
    navSlot.appendChild(renderLogoutButton('nav__link'));
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
