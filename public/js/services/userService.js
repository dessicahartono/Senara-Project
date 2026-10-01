/**
 * Profil pengguna lewat endpoint PHP (users/{uid} di Realtime Database).
 */

async function request(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...options });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    const error = new Error(result.message || "Permintaan gagal. Coba lagi beberapa saat lagi.");
    error.status = response.status;
    throw error;
  }
  return result;
}

/** Profil dipakai app-shell dan halaman Profil; satu permintaan cukup untuk satu halaman. */
let profilePromise = null;

export async function getProfile() {
  profilePromise ??= request("actions/profile.php").then((result) => result.profile);
  try {
    return await profilePromise;
  } catch (error) {
    profilePromise = null;
    throw error;
  }
}

export async function updateProfile({ name, bio }) {
  const body = new FormData();
  body.append("name", name.trim());
  body.append("bio", bio.trim());
  const { profile } = await request("actions/profile.php", { method: "POST", body });
  profilePromise = Promise.resolve(profile);
  return profile;
}

/** Upload foto profil menunggu keputusan penyimpanan foto (Firebase Storage belum aktif). */
export async function updateProfilePhoto() {
  throw new Error("Ganti foto profil belum tersedia.");
}

/**
 * Hapus akun beserta seluruh datanya.
 * @param {{password?: string, idToken?: string}} confirmation kata sandi (akun email) atau ID token Google baru
 */
export async function deleteAccount({ password, idToken }) {
  const body = new FormData();
  if (password) body.append("password", password);
  if (idToken) body.append("idToken", idToken);
  await request("actions/delete_account.php", { method: "POST", body });
}
