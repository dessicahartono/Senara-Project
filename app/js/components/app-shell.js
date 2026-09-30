/**
 * Kerangka halaman app: sidebar (desktop) dan bottom nav (mobile).
 * Cukup satu tempat untuk menu — halaman hanya menaruh placeholder:
 *
 *   <aside id="sidebar" class="sidebar"></aside>
 *   <header class="app-header"></header>   ← bar kosong sesuai Stitch
 *   <nav id="bottom-nav" class="bottom-nav"></nav>
 *
 * lalu memanggil mountAppShell({ active: "journal" }).
 */
import { ROUTES, ASSETS, APP_NAME } from "../config.js";
import { getProfile } from "../services/userService.js";
import { logout, isLoggedIn } from "../services/authService.js";
import { escapeHtml, icon } from "../utils/dom.js";

// Tombol Back setelah logout bisa menampilkan halaman dari cache browser → muat ulang agar dicek lagi
window.addEventListener("pageshow", (e) => {
  if (e.persisted) window.location.reload();
});

const NAV_ITEMS = [
  { key: "dashboard", label: "Beranda", short: "Beranda", href: ROUTES.dashboard },
  { key: "chat", label: "Nomi (Chat)", short: "Nomi", href: ROUTES.chat },
  { key: "journal", label: "Journaling", short: "Journal", href: ROUTES.journal },
  { key: "history", label: "Log History", short: "Riwayat", href: ROUTES.history },
  { key: "profile", label: "Profil", short: "Profil", href: ROUTES.profile },
];

function brandMarkup() {
  return `
    <a class="brand" href="${ROUTES.dashboard}" aria-label="${APP_NAME} — Beranda">
      <img class="brand__logo" src="${ASSETS.logo}" alt="" width="32" height="32">
      <span class="brand__name">${APP_NAME}</span>
    </a>`;
}

function avatarMarkup(user, sizeClass = "") {
  const inner = user.photoUrl
    ? `<img src="${escapeHtml(user.photoUrl)}" alt="">`
    : icon("person", "icon--md");
  return `<span class="avatar ${sizeClass}">${inner}</span>`;
}

function sidebarMarkup(active, user) {
  // Profil tidak masuk daftar menu sidebar: kartu nama pengguna di bawah sudah menuju ke sana
  const links = NAV_ITEMS.filter((item) => item.key !== "profile").map(
    (item) => `
      <a class="sidebar__link${item.key === active ? " is-active" : ""}" href="${item.href}"
        ${item.key === active ? 'aria-current="page"' : ""}>${item.label}</a>`
  ).join("");

  return `
    <div class="sidebar__top">
      ${brandMarkup()}
      <nav class="sidebar__nav" aria-label="Menu utama">${links}</nav>
    </div>
    <div class="sidebar__bottom">
      <button class="sidebar__link" type="button" data-action="logout">
        ${icon("logout", "icon--lg")}<span>Keluar</span>
      </button>
      <a class="sidebar__user${active === "profile" ? " is-active" : ""}" href="${ROUTES.profile}"
        ${active === "profile" ? 'aria-current="page"' : ""}>
        ${avatarMarkup(user)}
        <span class="sidebar__user-name text-label-md truncate">${escapeHtml(user.name)}</span>
      </a>
    </div>`;
}

function bottomNavMarkup(active) {
  return NAV_ITEMS.map(
    (item) => `
      <a class="bottom-nav__link${item.key === active ? " is-active" : ""}" href="${item.href}"
        ${item.key === active ? 'aria-current="page"' : ""}>
        <span class="text-label-sm">${item.short}</span>
      </a>`
  ).join("");
}

/**
 * @param {{active: "dashboard"|"chat"|"journal"|"history"|"profile"}} options
 * @returns {Promise<object>} profil pengguna (agar halaman tidak perlu memanggil ulang)
 */
export async function mountAppShell({ active }) {
  // Halaman dalam hanya untuk pengguna yang sudah masuk
  if (!(await isLoggedIn())) {
    window.location.replace(ROUTES.login);
    return new Promise(() => {}); // hentikan inisialisasi halaman
  }

  const user = await getProfile();

  const sidebar = document.getElementById("sidebar");
  const bottomNav = document.getElementById("bottom-nav");

  if (sidebar) sidebar.innerHTML = sidebarMarkup(active, user);
  if (bottomNav) {
    bottomNav.setAttribute("aria-label", "Menu utama");
    bottomNav.innerHTML = bottomNavMarkup(active);
  }

  sidebar?.querySelector('[data-action="logout"]')?.addEventListener("click", async () => {
    await logout();
    window.location.href = ROUTES.login;
  });

  return user;
}

/** Perbarui nama/foto di sidebar setelah profil diubah. */
export function refreshShellUser(user) {
  document.querySelectorAll(".sidebar__user-name").forEach((el) => {
    el.textContent = user.name;
  });
  document.querySelectorAll(".sidebar__user .avatar").forEach((el) => {
    el.outerHTML = avatarMarkup(user);
  });
}
