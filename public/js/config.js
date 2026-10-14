/** Konfigurasi global aplikasi. */

export const APP_NAME = "Senara";
export const APP_TAGLINE = "Temani Dirimu, Kapan Pun";

/**
 * Folder public, dihitung dari lokasi file ini (public/js/config.js). Halaman ada di dua tingkat
 * (index.html di root, sisanya di views/), jadi alamat dibuat dari sini agar sama di halaman mana pun.
 */
const ROOT = new URL("../", import.meta.url).pathname;

/** Semua alamat halaman di satu tempat. */
export const ROUTES = {
  home: `${ROOT}index.html`,
  features: `${ROOT}index.html#fitur`,
  affirmation: `${ROOT}index.html#afirmasi`,
  login: `${ROOT}views/login.html`,
  register: `${ROOT}views/registrasi.html`,
  checkEmail: `${ROOT}views/cek-email.html`,
  dashboard: `${ROOT}views/dashboard.html`,
  chat: `${ROOT}views/nomi-chat.html`,
  journal: `${ROOT}views/journaling.html`,
  archive: `${ROOT}views/arsip.html`,
  profile: `${ROOT}views/profil.html`,
};

/** Folder endpoint PHP, misalnya `${ACTIONS}journals.php`. */
export const ACTIONS = `${ROOT}actions/`;

export const ASSETS = {
  logo: `${ROOT}assets/images/senara-logo.svg`,
  nomi: `${ROOT}assets/images/nomi.jpg`,
};

export const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB

/** Jurnal baru hanya untuk hari ini dan sekian hari sebelumnya; samakan dengan journals.php. */
export const JOURNAL_BACKDATE_DAYS = 2;
