// Referensi elemen shell yang dipakai lintas modul (router, nav, semua view).
export const app = document.getElementById('app');
export const navSlot = document.getElementById('nav-slot');

// Sidebar -- dipakai nav.js buat merender navigasi peran super_admin sebagai
// sidebar kiri, bukan navbar atas (lihat komentar di admin_shell.php).
export const sidebarNavSlot = document.getElementById('sidebar-nav-slot');
export const sidebarFootSlot = document.getElementById('sidebar-foot-slot');
