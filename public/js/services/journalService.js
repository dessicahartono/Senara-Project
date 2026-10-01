/**
 * Jurnal harian (satu jurnal per tanggal).
 * Sekarang: data contoh. Nanti: Firestore (koleksi `users/{uid}/journals`)
 * + Firebase Storage untuk foto.
 */
import { getState, updateState, delay, makeId, staticData } from "./mockStore.js";
import { toISODate } from "../utils/format.js";

const byDateDesc = (a, b) => b.date.localeCompare(a.date);

/** Semua jurnal, terbaru dulu. Opsional filter bulan: { year, month } (month 0-11). */
export async function getJournals({ year, month } = {}) {
  await delay(250);
  let list = getState().journals;
  if (year !== undefined && month !== undefined) {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    list = list.filter((j) => j.date.startsWith(prefix));
  }
  return list.sort(byDateDesc);
}

export async function getJournalByDate(date) {
  await delay(150);
  return getState().journals.find((j) => j.date === date) ?? null;
}

export async function getJournalById(id) {
  await delay(150);
  return getState().journals.find((j) => j.id === id) ?? null;
}

/**
 * Buat atau perbarui jurnal pada tanggal tertentu.
 * @param {{date: string, note: string, photoFile?: File|null, removePhoto?: boolean}} data
 */
export async function saveJournal({ date, note, photoFile = null, removePhoto = false }) {
  const photoUrl = photoFile ? await readAsDataUrl(photoFile) : null;
  await delay(700);
  const now = new Date().toISOString();

  let saved;
  updateState((s) => {
    const existing = s.journals.find((j) => j.date === date);
    if (existing) {
      existing.note = note;
      existing.updatedAt = now;
      if (photoFile) {
        existing.photoUrl = photoUrl;
        existing.photoName = photoFile.name;
      } else if (removePhoto) {
        existing.photoUrl = null;
        existing.photoName = null;
      }
      saved = existing;
    } else {
      saved = {
        id: makeId("jr"),
        date,
        note,
        photoUrl,
        photoName: photoFile?.name ?? null,
        createdAt: now,
        updatedAt: now,
      };
      s.journals.push(saved);
    }
  });
  return structuredClone(saved);
}

export async function deleteJournal(id) {
  await delay(500);
  updateState((s) => {
    s.journals = s.journals.filter((j) => j.id !== id);
  });
  return true;
}

/**
 * Streak: jumlah hari berturut-turut (sampai kemarin/hari ini) yang punya jurnal
 * atau check-in, plus status 5 hari terakhir untuk visual di dashboard.
 */
export async function getStreak() {
  await delay(200);
  const filled = new Set([
    ...staticData.streakDays,
    ...getState().journals.map((j) => j.date),
  ]);

  const today = new Date();
  const dayAt = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    return d;
  };

  let count = filled.has(toISODate(today)) ? 1 : 0;
  for (let i = 1; filled.has(toISODate(dayAt(i))); i++) count++;

  const lastDays = [4, 3, 2, 1, 0].map((offset) => {
    const d = dayAt(offset);
    return { date: toISODate(d), done: filled.has(toISODate(d)), isToday: offset === 0 };
  });

  return { count, lastDays };
}

/** Ringkasan bulan untuk halaman riwayat. */
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

export async function getRandomPrompt() {
  const prompts = staticData.journalPrompts;
  return prompts[Math.floor(Math.random() * prompts.length)];
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
