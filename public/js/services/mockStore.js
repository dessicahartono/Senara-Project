/**
 * Penyimpanan data contoh sementara (tahap UI).
 * Data disalin dari mock.js lalu disimpan di localStorage, sehingga perubahan
 * (misalnya jurnal baru) tetap terlihat saat pindah halaman.
 *
 * File ini akan DIHAPUS saat services diganti Firebase.
 */
import * as mock from "../data/mock.js";

const STORAGE_KEY = "senara:mock:v2";

function initialState() {
  return structuredClone({
    journals: mock.journals,
    chatMessages: mock.chatMessages,
  });
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* localStorage tidak tersedia (mode privat) → pakai data awal */
  }
  return initialState();
}

let state = load();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* abaikan: data tetap ada di memori selama halaman terbuka */
  }
}

/** Salinan state saat ini (read-only untuk pemanggil). */
export function getState() {
  return structuredClone(state);
}

/** Ubah state lewat fungsi mutator, lalu simpan. */
export function updateState(mutator) {
  mutator(state);
  persist();
  return getState();
}

/** Kembalikan semua data ke contoh awal. */
export function resetMockData() {
  state = initialState();
  persist();
}

/** Simulasi jeda jaringan agar state loading di UI ikut teruji. */
export function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Error dengan `code` seperti format Firebase (mis. "auth/wrong-password"). */
export function serviceError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

export function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Data statis (tidak diubah pengguna) langsung dari mock.js. */
export const staticData = {
  affirmations: mock.affirmations,
  journalPrompts: mock.journalPrompts,
  streakDays: mock.streakDays,
  chatQuickPrompts: mock.chatQuickPrompts,
  nomiReplies: mock.nomiReplies,
};
