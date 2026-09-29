/**
 * Header halaman publik yang punya navigasi (landing & registrasi).
 * Login & cek email memakai bar kosong <header class="top-bar"> sesuai Stitch.
 * Placeholder di HTML:
 *   <header id="site-header" class="site-header"></header>
 */
import { ROUTES, ASSETS, APP_NAME, APP_TAGLINE } from "../config.js";

const NAV_ITEMS = [
  { key: "home", label: "Beranda", href: ROUTES.home },
  { key: "affirmation", label: "Afirmasi Harian", href: ROUTES.affirmation },
  { key: "features", label: "Fitur", href: ROUTES.features },
];

/**
 * @param {{active?: "home"|"affirmation"|"features", variant?: "default"|"landing"}} options
 *   variant "landing": emblem bulat + nama serif (gaya header landing page di Stitch)
 */
export function mountSiteHeader({ active, variant = "default" } = {}) {
  const header = document.getElementById("site-header");
  if (!header) return;
  const isLanding = variant === "landing";
  header.classList.toggle("site-header--landing", isLanding);

  const logo = `<img class="site-brand__logo" src="${ASSETS.logo}" alt="" width="36" height="36">`;

  const links = NAV_ITEMS.map(
    (item) => `
      <a class="site-nav__link${item.key === active ? " is-active" : ""}" href="${item.href}"
        ${item.key === active ? 'aria-current="page"' : ""}>${item.label}</a>`
  ).join("");

  header.innerHTML = `
    <div class="site-header__inner">
      <a class="site-brand" href="${ROUTES.home}" aria-label="${APP_NAME} — Beranda">
        ${isLanding ? `<span class="site-brand__emblem">${logo}</span>` : logo}
        <span>
          <span class="site-brand__name">${APP_NAME}</span>
          <span class="site-brand__tagline">${APP_TAGLINE}</span>
        </span>
      </a>
      <nav class="site-nav" aria-label="Menu utama">${links}</nav>
      <div class="site-header__actions">
        <a class="site-header__login" href="${ROUTES.login}">Masuk</a>
        <a class="btn btn--solid site-header__cta" href="${ROUTES.register}">
          <span class="site-header__cta-long">Mulai Bersama Senara</span>
          <span class="site-header__cta-short">Daftar</span>
        </a>
      </div>
    </div>`;
}
