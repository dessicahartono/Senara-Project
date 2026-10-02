import { ROUTES } from "../config.js";
import { mountAppShell, refreshShellUser } from "../components/app-shell.js";
import { openModal, closeModal } from "../components/modal.js";
import { initFormHelpers } from "../components/form.js";
import { showToast } from "../components/toast.js";
import { updateProfile, updateProfilePhoto, deleteAccount } from "../services/userService.js";
import { compressPhoto } from "../services/photoService.js";
import { logout, sendPasswordReset } from "../services/authService.js";
import { getStreak } from "../services/journalService.js";
import { getGoogleIdToken } from "../services/googleAuth.js";
import { $, $$, show, hide, escapeHtml, withLoading } from "../utils/dom.js";
import { formatDate, initials, firstName } from "../utils/format.js";

const MAX_AVATAR_SIZE = 3 * 1024 * 1024; // 3 MB

initFormHelpers();

const el = {
  avatar: $("#profile-avatar"),
  greeting: $("#profile-greeting"),
  bio: $("#profile-bio"),
  bioView: $("#bio-view"),
  bioEditor: $("#bio-editor"),
  bioSave: $("#btn-save-bio"),
  photoInput: $("#photo-input"),
  form: $("#profile-form"),
  nameInput: $("#input-name"),
  nameError: $("#name-error"),
  bioInput: $("#input-bio"),
  bioCounter: $("#bio-counter"),
  email: $("#profile-email"),
  emailVerified: $("#email-verified"),
  memberSince: $("#member-since"),
  saveFeedback: $("#save-feedback"),
  saveBtn: $("#btn-save"),
  pwdNotice: $("#pwd-notice"),
  deleteModal: $("#delete-modal"),
  deleteForm: $("#delete-form"),
  deletePassword: $("#delete-password"),
  deletePasswordLabel: $("label[for='delete-password']"),
  deletePasswordWrap: $("#delete-password").closest(".input-wrap"),
  deleteError: $("#delete-error"),
  deleteErrorText: $("#delete-error-text"),
};

let user = null;

/* ---------- Render ---------- */

function renderBanner() {
  el.avatar.innerHTML = user.photoUrl
    ? `<img src="${escapeHtml(user.photoUrl)}" alt="Foto profil ${escapeHtml(user.name)}">`
    : escapeHtml(initials(user.name));
  el.greeting.textContent = `Hi, ${firstName(user.name)}`;
  el.bio.textContent = user.bio || "Belum ada bio. Tambahkan kutipan yang menggambarkan dirimu.";
  $("#btn-edit-bio").setAttribute("aria-label", user.bio ? "Edit bio" : "Tulis bio");
  $("#btn-edit-bio").title = user.bio ? "Edit bio" : "Tulis bio";
}

function renderForm() {
  el.nameInput.value = user.name;
  el.email.textContent = user.email;
  show(el.emailVerified, user.emailVerified);
  el.memberSince.textContent = `Bagian dari Senara sejak ${formatDate(user.createdAt)}`;
}

function updateBioCounter() {
  el.bioCounter.textContent = `${el.bioInput.value.length} / ${el.bioInput.maxLength}`;
}

function renderStreak({ count }) {
  const now = new Date();
  const year = now.getFullYear();
  const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
  const percent = Math.min(100, (count / daysInYear) * 100);

  $("#streak-count").textContent = count;
  $("#streak-badge").textContent = `Streak ${count} Hari`;
  $("#streak-of").textContent = `dari ${daysInYear} hari tahun ini`;
  $("#streak-fill").style.width = `${percent.toFixed(1)}%`;

  const bar = $("#streak-bar");
  bar.setAttribute("aria-valuemax", daysInYear);
  bar.setAttribute("aria-valuenow", count);
  bar.setAttribute("aria-label", `${count} dari ${daysInYear} hari`);
}

/* ---------- Foto profil ---------- */

$$("[data-pick-photo]").forEach((btn) => btn.addEventListener("click", () => el.photoInput.click()));

el.photoInput.addEventListener("change", async () => {
  const file = el.photoInput.files[0];
  el.photoInput.value = "";
  if (!file) return;

  if (!["image/jpeg", "image/png"].includes(file.type)) {
    showToast("Pilih foto dalam format JPG atau PNG.", { type: "error" });
    return;
  }
  if (file.size > MAX_AVATAR_SIZE) {
    showToast("Ukuran foto maksimal 3 MB.", { type: "error" });
    return;
  }

  try {
    user = await updateProfilePhoto(await compressPhoto(file));
  } catch (err) {
    showToast(err.message || "Foto gagal diproses. Coba foto lain.", { type: "error" });
    return;
  }
  renderBanner();
  refreshShellUser(user);
  showToast("Foto profil diperbarui.");
});

/* ---------- Bio (diedit langsung di banner) ---------- */

function openBioEditor() {
  el.bioInput.value = user.bio ?? "";
  updateBioCounter();
  hide(el.bioView);
  show(el.bioEditor);
  el.bioInput.focus();
  el.bioInput.setSelectionRange(el.bioInput.value.length, el.bioInput.value.length);
}

function closeBioEditor() {
  hide(el.bioEditor);
  show(el.bioView);
}

$("#btn-edit-bio").addEventListener("click", openBioEditor);
$("#btn-cancel-bio").addEventListener("click", closeBioEditor);
el.bioInput.addEventListener("input", updateBioCounter);

el.bioInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeBioEditor();
  } else if (e.key === "Enter" && !e.shiftKey) {
    // Enter menyimpan, Shift+Enter tetap membuat baris baru.
    e.preventDefault();
    el.bioEditor.requestSubmit();
  }
});

el.bioEditor.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (el.bioSave.disabled) return;
  const bio = el.bioInput.value.trim();
  if (bio === (user.bio ?? "")) {
    closeBioEditor();
    return;
  }

  try {
    // Nama tetap memakai nama yang tersimpan, bukan isi form Data Diri yang mungkin belum disimpan.
    user = await withLoading(el.bioSave, () => updateProfile({ name: user.name, bio }), "Menyimpan...");
  } catch (err) {
    showToast(err.message || "Bio gagal disimpan. Coba lagi.", { type: "error" });
    return;
  }
  renderBanner();
  refreshShellUser(user);
  closeBioEditor();
  showToast(bio ? "Bio diperbarui." : "Bio dihapus.");
});

/* ---------- Simpan data diri ---------- */

el.nameInput.addEventListener("input", () => {
  el.nameInput.classList.remove("is-error");
  hide(el.nameError);
});

el.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = el.nameInput.value.trim();
  if (!name) {
    el.nameInput.classList.add("is-error");
    show(el.nameError);
    el.nameInput.focus();
    return;
  }

  try {
    user = await withLoading(
      el.saveBtn,
      () => updateProfile({ name, bio: user.bio ?? "" }),
      "Menyimpan..."
    );
  } catch (err) {
    showToast(err.message, { type: "error" });
    return;
  }
  renderBanner();
  refreshShellUser(user);

  show(el.saveFeedback);
  setTimeout(() => hide(el.saveFeedback), 3500);
});

/* ---------- Pengaturan akun ---------- */

$("#btn-change-pwd").addEventListener("click", async (e) => {
  try {
    const { email } = await withLoading(e.currentTarget, () => sendPasswordReset(), "Mengirim...");
    $("#pwd-notice-email").textContent = email;
    show(el.pwdNotice);
  } catch (err) {
    showToast(err.message, { type: "error" });
  }
});

$("#btn-close-notice").addEventListener("click", () => hide(el.pwdNotice));

$("#btn-logout").addEventListener("click", async () => {
  try {
    await logout();
    window.location.href = ROUTES.login;
  } catch (err) {
    showToast(err.message, { type: "error" });
  }
});

$("#btn-open-delete").addEventListener("click", () => {
  el.deletePassword.value = "";
  hide(el.deleteError);
  // Akun Google tidak punya kata sandi; konfirmasinya lewat login Google ulang saat tombol Hapus ditekan.
  show(el.deletePasswordLabel, user.hasPassword);
  show(el.deletePasswordWrap, user.hasPassword);
  openModal(el.deleteModal);
});

el.deletePassword.addEventListener("input", () => hide(el.deleteError));

el.deleteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = el.deletePassword.value;
  if (user.hasPassword && !password) {
    el.deleteErrorText.textContent = "Masukkan kata sandi terlebih dahulu.";
    show(el.deleteError);
    el.deletePassword.focus();
    return;
  }

  try {
    await withLoading(
      $("#btn-confirm-delete"),
      async () =>
        deleteAccount(user.hasPassword ? { password } : { idToken: await getGoogleIdToken() }),
      "Menghapus..."
    );
    closeModal(el.deleteModal);
    window.location.href = ROUTES.home;
  } catch (err) {
    el.deleteErrorText.textContent = err.message || "Akun gagal dihapus. Coba lagi.";
    show(el.deleteError);
    if (user.hasPassword) el.deletePassword.focus();
  }
});

/* ---------- Mulai ---------- */

async function init() {
  const [profile, streak] = await Promise.all([mountAppShell({ active: "profile" }), getStreak()]);
  user = profile;
  renderBanner();
  renderForm();
  renderStreak(streak);
}

init();
