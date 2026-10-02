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

/** Profil di-cache per halaman karena dipakai app-shell dan halaman Profil sekaligus. */
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

/** Ganti foto profil. File sebaiknya sudah dikompres dengan photoService.compressPhoto(). */
export async function updateProfilePhoto(file) {
  const body = new FormData();
  body.append("photo", file);
  const { profile } = await request("actions/profile_photo.php", { method: "POST", body });
  profilePromise = Promise.resolve(profile);
  return profile;
}

/** Hapus foto profil; avatar kembali menampilkan inisial nama. */
export async function removeProfilePhoto() {
  const body = new FormData();
  body.append("remove", "1");
  const { profile } = await request("actions/profile_photo.php", { method: "POST", body });
  profilePromise = Promise.resolve(profile);
  return profile;
}

/**
 * Minta link verifikasi dikirim ke email baru. Email akun berganti setelah link diklik.
 * @returns {Promise<string>} email baru yang menunggu verifikasi
 */
export async function changeEmail({ newEmail, password }) {
  const body = new FormData();
  body.append("newEmail", newEmail.trim());
  body.append("password", password);
  const { pendingEmail } = await request("actions/change_email.php", { method: "POST", body });
  profilePromise = null;
  return pendingEmail;
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
