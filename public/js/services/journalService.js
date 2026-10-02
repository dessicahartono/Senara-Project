/**
 * Jurnal harian (satu jurnal per tanggal) lewat endpoint PHP.
 * Tanggal (yyyy-mm-dd) sekaligus menjadi id jurnal.
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

const monthKey = (year, month) => `${year}-${String(month + 1).padStart(2, "0")}`;

/** Daftar jurnal per bulan di-cache karena halaman arsip memanggil getJournals dan getMonthSummary bersamaan. */
const monthCache = new Map();

/** Jurnal pada satu bulan (month 0-11), terbaru dulu. */
export async function getJournals({ year, month }) {
  const key = monthKey(year, month);
  if (!monthCache.has(key)) {
    const promise = request(`actions/journals.php?month=${key}`).then((result) => result.journals);
    monthCache.set(key, promise);
    promise.catch(() => monthCache.delete(key));
  }
  return monthCache.get(key);
}

export async function getJournalByDate(date) {
  const { journal } = await request(`actions/journals.php?date=${encodeURIComponent(date)}`);
  return journal;
}

export async function getLatestJournal() {
  const { journal } = await request("actions/journals.php?latest=1");
  return journal;
}

/**
 * Buat atau perbarui jurnal pada tanggal tertentu.
 * @param {{date: string, note: string, photoFile?: File|null, removePhoto?: boolean}} data
 */
export async function saveJournal({ date, note, photoFile = null, removePhoto = false }) {
  const body = new FormData();
  body.append("date", date);
  body.append("note", note);
  if (photoFile) body.append("photo", photoFile);
  if (removePhoto) body.append("removePhoto", "1");

  const { journal } = await request("actions/journals.php", { method: "POST", body });
  monthCache.clear();
  return journal;
}

/** Hapus jurnal. id jurnal adalah tanggalnya. */
export async function deleteJournal(id) {
  const body = new FormData();
  body.append("date", id);
  await request("actions/delete_journal.php", { method: "POST", body });
  monthCache.clear();
  return true;
}

/** Streak hari berturut-turut beserta status 5 hari terakhir untuk dashboard. */
export async function getStreak() {
  const { streak } = await request("actions/streak.php");
  return streak;
}

/** Ringkasan bulan untuk halaman arsip. */
export async function getMonthSummary(year, month) {
  const list = await getJournals({ year, month });
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const daysElapsed = isCurrentMonth ? now.getDate() : new Date(year, month + 1, 0).getDate();
  return {
    count: list.length,
    consistency: daysElapsed ? Math.round((list.length / daysElapsed) * 100) : 0,
  };
}
