import { MAX_PHOTO_SIZE } from "../config.js";
import { mountAppShell } from "../components/app-shell.js";
import { confirmDialog } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import {
  getLatestJournal,
  getJournalByDate,
  saveJournal,
  deleteJournal,
} from "../services/journalService.js";
import { compressPhoto } from "../services/photoService.js";
import { $, $$, show, hide, withLoading } from "../utils/dom.js";
import {
  toISODate,
  formatDateLong,
  formatTime,
  formatFileSize,
  countWords,
  isToday,
} from "../utils/format.js";

const el = {
  heading: $("#page-heading"),
  modeNew: $("#btn-mode-new"),
  modeEdit: $("#btn-mode-edit"),
  notice: $("#edit-notice"),
  noticeText: $("#edit-notice-text"),
  form: $("#journal-form"),
  dateDisplay: $("#journal-date-display"),
  dateNative: $("#journal-date"),
  quickButtons: $$("[data-quick-date]"),
  dropzone: $("#photo-empty"),
  photoInput: $("#photo-input"),
  preview: $("#photo-preview"),
  previewImg: $("#photo-preview-img"),
  previewName: $("#photo-preview-name"),
  photoError: $("#photo-error"),
  photoErrorText: $("#photo-error-text"),
  note: $("#journal-note"),
  noteError: $("#note-error"),
  counter: $("#note-counter"),
  deleteBtn: $("#btn-delete"),
  cancelBtn: $("#btn-cancel"),
  submitBtn: $("#btn-submit"),
};

/** State form saat ini. */
const state = {
  date: toISODate(new Date()),
  journal: null, // jurnal tersimpan pada tanggal ini (null = baru)
  photoFile: null, // file baru yang dipilih
  removePhoto: false, // foto lama dihapus
};

/* ---------- Render ---------- */

function renderMode() {
  const editing = Boolean(state.journal);

  el.modeNew.classList.toggle("is-active", !editing);
  el.modeEdit.classList.toggle("is-active", editing);
  el.modeNew.setAttribute("aria-pressed", String(!editing));
  el.modeEdit.setAttribute("aria-pressed", String(editing));

  el.heading.textContent = editing
    ? "Edit Jurnal"
    : isToday(state.date)
      ? "Journaling Hari Ini"
      : "Tulis Jurnal";

  show(el.notice, editing);
  if (editing) {
    const saved = state.journal.updatedAt ?? state.journal.createdAt;
    el.noticeText.textContent = `Kamu sedang menyunting catatan yang tersimpan pada ${formatDateLong(saved)} pukul ${formatTime(saved)} WIB`;
  }

  show(el.deleteBtn, editing);
  $("#btn-submit-text").textContent = editing ? "Perbarui" : "Simpan";
}

function renderDate() {
  el.dateDisplay.value = formatDateLong(state.date);
  el.dateNative.value = state.date;

  el.quickButtons.forEach((btn) => {
    const d = new Date();
    d.setDate(d.getDate() - Number(btn.dataset.quickDate));
    btn.classList.toggle("is-active", toISODate(d) === state.date);
  });
}

function renderPhoto() {
  hide(el.photoError);
  const existingUrl = state.removePhoto ? null : state.journal?.photoUrl;

  if (state.photoFile) {
    el.previewImg.src = URL.createObjectURL(state.photoFile);
    el.previewName.textContent = `terlampir: ${state.photoFile.name} (${formatFileSize(state.photoFile.size)})`;
  } else if (existingUrl) {
    el.previewImg.src = existingUrl;
    el.previewName.textContent = `terlampir: ${state.journal.photoName ?? "foto momen"}`;
  }

  const hasPhoto = Boolean(state.photoFile || existingUrl);
  show(el.preview, hasPhoto);
  show(el.dropzone, !hasPhoto);
}

function renderCounter() {
  const text = el.note.value;
  el.counter.textContent = `${countWords(text)} kata • ${text.length} karakter`;
}

function renderAll() {
  renderMode();
  renderDate();
  renderPhoto();
  el.note.value = state.journal?.note ?? "";
  hide(el.noteError);
  renderCounter();
}

/* ---------- Memuat data ---------- */

async function loadDate(date) {
  state.date = date;
  state.journal = await getJournalByDate(date);
  state.photoFile = null;
  state.removePhoto = false;
  renderAll();
}

/* ---------- Mode ---------- */

el.modeNew.addEventListener("click", () => loadDate(toISODate(new Date())));

el.modeEdit.addEventListener("click", async () => {
  if (state.journal) return;
  const latest = await getLatestJournal();
  if (!latest) {
    showToast("Belum ada jurnal untuk disunting.", { type: "info" });
    return;
  }
  loadDate(latest.date);
});

/* ---------- Tanggal ---------- */

el.dateNative.max = toISODate(new Date());

el.dateDisplay.addEventListener("click", () => {
  try {
    el.dateNative.showPicker();
  } catch {
    el.dateNative.focus();
  }
});
el.dateDisplay.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    el.dateDisplay.click();
  }
});

el.dateNative.addEventListener("change", () => {
  if (el.dateNative.value) loadDate(el.dateNative.value);
});

el.quickButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const d = new Date();
    d.setDate(d.getDate() - Number(btn.dataset.quickDate));
    loadDate(toISODate(d));
  });
});

/* ---------- Foto ---------- */

async function acceptPhoto(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    el.photoErrorText.textContent = "Berkas harus berupa gambar (JPG, PNG, atau WebP).";
    show(el.photoError);
    return;
  }
  if (file.size > MAX_PHOTO_SIZE) {
    el.photoErrorText.textContent = `Ukuran foto ${formatFileSize(file.size)} melebihi batas 10 MB.`;
    show(el.photoError);
    return;
  }

  // Kompres di browser sebelum disimpan
  el.submitBtn.disabled = true;
  try {
    state.photoFile = await compressPhoto(file);
    state.removePhoto = false;
    renderPhoto();
  } catch (err) {
    el.photoErrorText.textContent = err.message;
    show(el.photoError);
  } finally {
    el.submitBtn.disabled = false;
  }
}

el.photoInput.addEventListener("change", () => {
  acceptPhoto(el.photoInput.files[0]);
  el.photoInput.value = "";
});

["dragenter", "dragover"].forEach((type) =>
  el.dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    el.dropzone.classList.add("is-dragover");
  })
);
["dragleave", "drop"].forEach((type) =>
  el.dropzone.addEventListener(type, () => el.dropzone.classList.remove("is-dragover"))
);
el.dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  acceptPhoto(e.dataTransfer.files[0]);
});

$("#btn-photo-replace").addEventListener("click", () => el.photoInput.click());

$("#btn-photo-remove").addEventListener("click", () => {
  state.photoFile = null;
  state.removePhoto = Boolean(state.journal?.photoUrl);
  renderPhoto();
});

/* ---------- Catatan ---------- */

el.note.addEventListener("input", () => {
  renderCounter();
  hide(el.noteError);
});

/* ---------- Aksi ---------- */

el.cancelBtn.addEventListener("click", () => loadDate(state.date));

/** Tampilkan error hapus jurnal lalu lempar ulang agar dialog konfirmasi tetap terbuka. */
function showDeleteError(err) {
  showToast(err.message || "Gagal menghapus jurnal. Coba lagi.", { type: "error" });
  throw err;
}

el.deleteBtn.addEventListener("click", async () => {
  const deleted = await confirmDialog({
    icon: "delete_forever",
    title: "Hapus jurnal ini?",
    message:
      "Jurnal momen ini akan dihapus permanen dari ruang tenangmu. Tindakan ini tidak dapat dibatalkan.",
    confirmText: "Ya, Hapus",
    onConfirm: () => deleteJournal(state.journal.id).catch(showDeleteError),
  });
  if (!deleted) return;
  showToast("Jurnal berhasil dihapus.");
  loadDate(state.date);
});

el.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const note = el.note.value.trim();
  const hasPhoto = state.photoFile || (state.journal?.photoUrl && !state.removePhoto);

  if (!note && !hasPhoto) {
    show(el.noteError);
    el.note.focus();
    return;
  }

  const wasEditing = Boolean(state.journal);
  try {
    state.journal = await withLoading(
      el.submitBtn,
      () =>
        saveJournal({
          date: state.date,
          note,
          photoFile: state.photoFile,
          removePhoto: state.removePhoto,
        }),
      "Menyimpan..."
    );
    state.photoFile = null;
    state.removePhoto = false;
    renderAll();
    showToast(wasEditing ? "Jurnal berhasil diperbarui." : "Momenmu tersimpan dengan aman.");
  } catch (err) {
    showToast(err.message || "Gagal menyimpan jurnal. Coba lagi.", { type: "error" });
  }
});

/* ---------- Mulai ---------- */

async function init() {
  await mountAppShell({ active: "journal" });
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("date");
  const valid = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested <= toISODate(new Date());
  await loadDate(valid ? requested : toISODate(new Date()));
}

init();
