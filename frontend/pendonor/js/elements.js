// Referensi elemen shell yang dipakai lintas modul (router, nav, semua view).
export const app = document.getElementById('app');

// Topbar -- dipakai untuk guest/belum login (lihat nav.js).
export const navSlot = document.getElementById('nav-slot');

// Sidebar -- dipakai untuk pendonor yang SUDAH login (lihat nav.js render():
// document.body.classList.toggle('layout-sidebar', loggedIn)).
export const sidebarNavSlot = document.getElementById('sidebar-nav-slot');
export const sidebarFootSlot = document.getElementById('sidebar-foot-slot');
