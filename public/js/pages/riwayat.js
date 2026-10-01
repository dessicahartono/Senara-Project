import { ROUTES } from "../config.js";
import { mountAppShell } from "../components/app-shell.js";
import { confirmDialog } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { getJournals, getMonthSummary, deleteJournal } from "../services/journalService.js";
import { $, show, hide } from "../utils/dom.js";
import {
  toISODate,
  fromISODate,
  formatDate,
  formatDateLong,
  formatMonthYear,
  formatTime,
  initials,
  isToday,
} from "../utils/format.js";

const today = new Date();
const todayISO = toISODate(today);

const state = {
  year: today.getFullYear(),
  month: today.getMonth(), // 0-11
  selected: todayISO,
  journals: new Map(), // date → jurnal untuk bulan yang tampil
  user: null,
};

const el = {
  grid: $("#calendar-grid"),
  title: $("#calendar-title"),
  prev: $("#btn-prev-month"),
  next: $("#btn-next-month"),
  statsCount: $("#stats-count"),
  statsRate: $("#stats-rate"),
  memory: $("#memory-card"),
  empty: $("#empty-card"),
};

/* ---------- Data ---------- */

async function loadMonth() {
  const [list, summary] = await Promise.all([
    getJournals({ year: state.year, month: state.month }),
    getMonthSummary(state.year, state.month),
  ]);
  state.journals = new Map(list.map((j) => [j.date, j]));

  el.statsCount.textContent = `${summary.count} Momen Tersimpan di Bulan Ini`;
  el.statsRate.textContent = `Konsistensi Refleksi ${summary.consistency}%`;

  renderCalendar();
  renderDetail();
}

/* ---------- Kalender ---------- */

function renderCalendar() {
  const first = new Date(state.year, state.month, 1);
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7; // Senin = kolom pertama
  const prevMonthDays = new Date(state.year, state.month, 0).getDate();

  el.title.textContent = formatMonthYear(first);
  const isCurrentMonth = state.year === today.getFullYear() && state.month === today.getMonth();
  el.next.disabled = isCurrentMonth;

  const cells = [];

  for (let i = leading; i > 0; i--) {
    cells.push(outsideCell(prevMonthDays - i + 1));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toISODate(new Date(state.year, state.month, day));
    const classes = ["calendar__day"];
    if (state.journals.has(iso)) classes.push("calendar__day--memory");
    if (iso === todayISO) classes.push("calendar__day--today");
    if (iso === state.selected) classes.push("is-selected");
    const isFuture = iso > todayISO;
    const label = `${formatDateLong(iso)}${state.journals.has(iso) ? ", ada jurnal" : ""}`;

    cells.push(`
      <button class="${classes.join(" ")}" type="button" data-date="${iso}"
        aria-label="${label}" aria-pressed="${iso === state.selected}" ${isFuture ? "disabled" : ""}>
        <span class="calendar__num">${day}</span>
        <span class="calendar__dot"></span>
      </button>`);
  }

  const trailing = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= trailing; day++) cells.push(outsideCell(day));

  el.grid.innerHTML = cells.join("");
}

function outsideCell(day) {
  return `<div class="calendar__day calendar__day--outside" aria-hidden="true"><span class="calendar__num">${day}</span></div>`;
}

el.grid.addEventListener("click", (e) => {
  const cell = e.target.closest("[data-date]");
  if (!cell || cell.disabled) return;
  state.selected = cell.dataset.date;
  renderCalendar();
  renderDetail();

  // Di mobile, detail berada di bawah kalender → gulir ke sana
  if (window.matchMedia("(max-width: 1023px)").matches) {
    $(".history__detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

function changeMonth(delta) {
  const d = new Date(state.year, state.month + delta, 1);
  state.year = d.getFullYear();
  state.month = d.getMonth();
  loadMonth();
}

el.prev.addEventListener("click", () => changeMonth(-1));
el.next.addEventListener("click", () => changeMonth(1));
$("#btn-this-month").addEventListener("click", () => {
  state.year = today.getFullYear();
  state.month = today.getMonth();
  state.selected = todayISO;
  loadMonth();
});

/* ---------- Detail ---------- */

function renderDetail() {
  const journal = state.journals.get(state.selected);
  show(el.memory, Boolean(journal));
  show(el.empty, !journal);

  if (!journal) {
    $("#empty-text").textContent = isToday(state.selected)
      ? "Hari ini masih menjadi lembaran hening. Tuangkan apa yang sedang berbisik di dadamu."
      : `${formatDate(state.selected)} masih menjadi lembaran hening. Kamu masih bisa menuliskannya sekarang.`;
    $("#empty-write").href = `${ROUTES.journal}?date=${state.selected}`;
    return;
  }

  $("#memory-avatar").textContent = initials(state.user.name);
  $("#memory-name").textContent = state.user.name;
  $("#memory-time").textContent = `${formatDateLong(journal.date)} • ${formatTime(journal.createdAt)} WIB`;
  $("#memory-date").textContent = formatDate(journal.date);
  $("#memory-note").textContent = journal.note || "Tanpa catatan — hanya sebuah momen yang diabadikan.";
  $("#memory-edit").href = `${ROUTES.journal}?date=${journal.date}`;

  const photo = $("#memory-photo");
  if (journal.photoUrl) {
    $("#memory-photo-img").src = journal.photoUrl;
    show(photo);
  } else {
    hide(photo);
  }
}

$("#memory-delete").addEventListener("click", async () => {
  const journal = state.journals.get(state.selected);
  if (!journal) return;

  const deleted = await confirmDialog({
    icon: "delete_forever",
    title: "Hapus jurnal ini?",
    message:
      "Jurnal momen ini akan dihapus permanen dari ruang tenangmu. Tindakan ini tidak dapat dibatalkan.",
    confirmText: "Ya, Hapus",
    onConfirm: () => deleteJournal(journal.id),
  });
  if (!deleted) return;

  showToast("Jurnal berhasil dihapus.");
  loadMonth();
});

/* ---------- Mulai ---------- */

async function init() {
  state.user = await mountAppShell({ active: "history" });

  // Pilih tanggal: ?date=… → hari ini bila ada jurnal → jurnal terbaru bulan ini → hari ini
  const requested = new URLSearchParams(window.location.search).get("date");
  if (requested && /^\d{4}-\d{2}-\d{2}$/.test(requested)) {
    const d = fromISODate(requested);
    state.year = d.getFullYear();
    state.month = d.getMonth();
    state.selected = requested;
  } else {
    const [latest] = await getJournals({ year: state.year, month: state.month });
    const todayJournal = latest?.date === todayISO;
    state.selected = todayJournal || !latest ? todayISO : latest.date;
  }

  await loadMonth();
}

init();
