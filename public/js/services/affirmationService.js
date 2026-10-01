/**
 * Afirmasi harian.
 * Sekarang: daftar contoh. Nanti: Firebase Realtime Database (node `affirmations/{1..365}`).
 */
import { delay, staticData } from "./mockStore.js";

const LAST_KEY = "senara:lastAffirmation";

/** Afirmasi acak yang berganti setiap kali halaman dimuat, tidak sama dengan yang terakhir tampil. */
export async function getRandomAffirmation() {
  await delay(150);
  const list = staticData.affirmations;

  let lastId = null;
  try {
    lastId = sessionStorage.getItem(LAST_KEY);
  } catch {
    // sessionStorage bisa diblokir; cukup abaikan
  }

  const pool = list.length > 1 ? list.filter((a) => a.id !== lastId) : list;
  const affirmation = pool[Math.floor(Math.random() * pool.length)];

  try {
    sessionStorage.setItem(LAST_KEY, affirmation.id);
  } catch {
    // abaikan
  }
  return affirmation;
}
