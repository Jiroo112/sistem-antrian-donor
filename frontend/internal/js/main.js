/**
 * main.js — composition root panel internal: menyambungkan router.js
 * (History API, prefix /admin) dengan nav.js (rendering navbar/sidebar
 * tergantung peran -- lihat nav.js) dan view aktif, lalu mendaftarkan
 * listener klik/popstate yang menggerakkan semuanya.
 */
import { renderNav } from './nav.js';
import { currentPath, resolveView, navigate } from './router.js';

function render() {
  const path = currentPath();
  window.scrollTo(0, 0);
  renderNav();
  document.querySelectorAll('.nav__link, .sidebar__link').forEach((l) => {
    l.classList.toggle('is-active', l.dataset.route === path);
  });
  // Tutup menu hamburger mobile (kalau lagi terbuka) tiap kali pindah halaman.
  document.querySelectorAll('.menu-toggle').forEach((btn) => {
    document.getElementById(btn.dataset.menuToggle)?.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  });
  resolveView(path)();
}

document.addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-menu-toggle]');
  if (toggle) {
    const target = document.getElementById(toggle.dataset.menuToggle);
    const isOpen = target?.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    return;
  }

  const a = e.target.closest('a[data-route]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  navigate(a.dataset.route);
});

window.addEventListener('popstate', render);
window.addEventListener('spa:navigate', render);
window.addEventListener('DOMContentLoaded', render);
