/**
 * Rangkuman mingguan chat dengan Nomi dari endpoint PHP (summaries/{uid} di Realtime Database).
 */

import { ACTIONS } from "../config.js";

/**
 * Rangkuman minggu lalu (Minggu sampai Sabtu), berganti setiap Senin. Bisa memakan beberapa detik saat pertama kali dibuat
 * minggu itu, karena backend memanggil Gemini.
 * @returns {Promise<{status: "ready"|"not_enough", weekStart: string, weekEnd: string,
 *   text: string|null, messageCount: number, stale?: boolean}>}
 */
export async function getWeeklySummary() {
  const response = await fetch(`${ACTIONS}weekly_summary.php`, { credentials: "same-origin", cache: "no-store" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Rangkuman mingguan gagal dimuat.");
  }
  return result.summary;
}
