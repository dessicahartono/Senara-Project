/**
 * Afirmasi acak dari endpoint PHP (affirmations/{1..365} di Realtime Database).
 */

const LAST_KEY = "senara:lastAffirmation";

/** Afirmasi acak yang berganti setiap kali halaman dimuat, tidak sama dengan yang terakhir tampil. */
export async function getRandomAffirmation() {
  let lastId = "";
  try {
    lastId = sessionStorage.getItem(LAST_KEY) ?? "";
  } catch {
    // sessionStorage bisa diblokir browser; abaikan
  }

  const response = await fetch(`actions/affirmation.php?exclude=${encodeURIComponent(lastId)}`, {
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Afirmasi gagal dimuat.");
  }

  try {
    sessionStorage.setItem(LAST_KEY, String(result.affirmation.id));
  } catch {
    // abaikan
  }
  return result.affirmation;
}
