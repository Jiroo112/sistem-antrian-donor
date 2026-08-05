/**
 * main.js — composition root panel internal: menyambungkan router.js
 * (lookup rute dari hash) dengan nav.js (rendering navbar) dan view aktif.
 */
import { renderNav } from './nav.js';
import { currentHash, resolveView } from './router.js';

function render() {
  const hash = currentHash();
  window.scrollTo(0, 0);
  renderNav();
  document.querySelectorAll('.nav__link').forEach((l) => {
    l.classList.toggle('is-active', l.getAttribute('href') === '#' + hash);
  });
  resolveView(hash)();
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
