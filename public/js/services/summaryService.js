/**
 * Rangkuman mingguan chat dengan Nomi dari endpoint PHP (summaries/{uid} di Realtime Database).
 */

/**
 * Rangkuman minggu lalu (Senin sampai Minggu). Bisa memakan beberapa detik saat pertama kali dibuat
 * minggu itu, karena backend memanggil Gemini.
 * @returns {Promise<{status: "ready"|"not_enough", weekStart: string, weekEnd: string,
 *   text: string|null, themes: string[], messageCount: number, stale?: boolean}>}
 */
export async function getWeeklySummary() {
  const response = await fetch("actions/weekly_summary.php", { credentials: "same-origin", cache: "no-store" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Rangkuman mingguan gagal dimuat.");
  }
  return result.summary;
}
