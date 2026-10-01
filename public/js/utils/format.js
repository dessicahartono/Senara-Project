/** Helper format tanggal & teks (Bahasa Indonesia). */

const LOCALE = "id-ID";

const pad = (v) => String(v).padStart(2, "0");

/** Date → "YYYY-MM-DD" (waktu lokal, bukan UTC). */
export function toISODate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" → Date lokal jam 00:00. */
export function fromISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDate(value) {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return fromISODate(value);
  return new Date(value);
}

/** "Kamis, 24 Oktober 2024" */
export function formatDateLong(value) {
  return toDate(value).toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "24 Oktober 2024" */
export function formatDate(value) {
  return toDate(value).toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "Oktober 2024" */
export function formatMonthYear(value) {
  return toDate(value).toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
}

/** "08.30" → ditampilkan sebagai "08:30" */
export function formatTime(value) {
  const d = toDate(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Nama hari singkat: "Sen", "Sel", ... */
export function formatWeekdayShort(value) {
  return toDate(value).toLocaleDateString(LOCALE, { weekday: "short" }).slice(0, 3);
}

export function isToday(value) {
  return toISODate(toDate(value)) === toISODate(new Date());
}

export function isYesterday(value) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return toISODate(toDate(value)) === toISODate(y);
}

/** "Hari ini" / "Kemarin" / "24 Oktober 2024" */
export function formatRelativeDay(value) {
  if (isToday(value)) return "Hari ini";
  if (isYesterday(value)) return "Kemarin";
  return formatDate(value);
}

export function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Huruf pertama nama untuk avatar. */
export function initials(name = "") {
  return name.trim().charAt(0).toUpperCase() || "S";
}

/** Nama depan untuk sapaan: "Seno Prasetyo" → "Seno". */
export function firstName(name = "") {
  return name.trim().split(/\s+/)[0];
}

/** Sapaan sesuai jam. */
export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}
