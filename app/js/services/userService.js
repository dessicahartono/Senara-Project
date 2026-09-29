/**
 * Profil pengguna.
 * Sekarang: data contoh. Nanti: Firestore (koleksi `users/{uid}`) + Firebase Storage (foto).
 */
import { getState, updateState, delay, serviceError } from "./mockStore.js";

export async function getProfile() {
  await delay(150);
  return getState().user;
}

export async function updateProfile({ name, bio }) {
  await delay(700);
  return updateState((s) => {
    if (name !== undefined) s.user.name = name.trim();
    if (bio !== undefined) s.user.bio = bio.trim();
  }).user;
}

/** Sekarang foto disimpan sebagai data URL; nanti diunggah ke Storage. */
export async function updateProfilePhoto(file) {
  const photoUrl = await readAsDataUrl(file);
  await delay(500);
  return updateState((s) => {
    s.user.photoUrl = photoUrl;
  }).user;
}

export async function deleteAccount(password) {
  await delay(900);
  const { user, accounts } = getState();
  const account = accounts.find((a) => a.email === user.email);
  if (!account || account.password !== password) {
    throw serviceError("auth/wrong-password", "Kata sandi tidak cocok.");
  }
  updateState((s) => {
    s.session = null;
  });
  return true;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
