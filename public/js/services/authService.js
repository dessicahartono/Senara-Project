/**
 * Autentikasi lewat endpoint PHP (session di server).
 * Login, registrasi, login Google, dan kirim ulang verifikasi ditangani langsung
 * oleh form/halaman login.js, registrasi.js, dan cek-email.js.
 */

import { ACTIONS } from "../config.js";

async function postJson(url) {
  const response = await fetch(url, { method: "POST", credentials: "same-origin" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Permintaan gagal. Coba lagi beberapa saat lagi.");
  }
  return result;
}

export async function logout() {
  await postJson(`${ACTIONS}logout.php`);
}

/** Kirim email atur ulang kata sandi ke akun yang sedang login. */
export async function sendPasswordReset() {
  return postJson(`${ACTIONS}reset_password.php`);
}
