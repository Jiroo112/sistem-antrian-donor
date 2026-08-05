/**
 * main.js — composition root panel internal: menyambungkan router.js
 * (History API, prefix /admin) dengan nav.js (rendering navbar) dan view
 * aktif, lalu mendaftarkan listener klik/popstate yang menggerakkan semuanya.
 */
import { renderNav } from './nav.js';
import { currentPath, resolveView, navigate } from './router.js';

function render() {
  const path = currentPath();
  window.scrollTo(0, 0);
  renderNav();
  document.querySelectorAll('.nav__link').forEach((l) => {
    l.classList.toggle('is-active', l.dataset.route === path);
  });
  resolveView(path)();
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-route]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  navigate(a.dataset.route);
});

window.addEventListener('popstate', render);
window.addEventListener('spa:navigate', render);
window.addEventListener('DOMContentLoaded', render);
