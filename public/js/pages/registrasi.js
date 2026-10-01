import { ROUTES } from "../config.js";
import { mountSiteHeader } from "../components/site-header.js";
import { initFormHelpers, isValidEmail } from "../components/form.js";
import { signInWithGoogle } from "../services/googleAuth.js";
import { $, show, hide, shake } from "../utils/dom.js";

mountSiteHeader();
initFormHelpers();

const MIN_PASSWORD = 6;

const form = $("#register-form");
const card = $(".register__card");

const name = {
  input: $("#full-name"),
  validIcon: $("#name-valid-icon"),
  error: $("#name-error"),
};
const email = {
  input: $("#email"),
  icon: $("#email-icon"),
  badge: $("#email-badge"),
  formatError: $("#email-format-error"),
  taken: $("#email-taken"),
};
const password = { input: $("#password"), meter: $("#strength"), label: $("#strength-label") };
const confirm = { input: $("#confirm-password"), mismatch: $("#password-mismatch") };
const terms = { input: $("#terms"), error: $("#terms-error") };

/* ---------- Nama ---------- */
function checkName({ showError }) {
  const ok = name.input.value.trim().length > 0;
  show(name.validIcon, ok);
  if (showError || ok) {
    name.input.classList.toggle("is-error", !ok);
    show(name.error, !ok);
  }
  return ok;
}

name.input.addEventListener("input", () => checkName({ showError: false }));
name.input.addEventListener("blur", () => checkName({ showError: true }));

/* ---------- Email ---------- */
function setEmailState(state) {
  // state: "normal" | "invalid" | "taken"
  const isError = state !== "normal";
  email.input.classList.toggle("is-error", isError);
  show(email.formatError, state === "invalid");
  show(email.taken, state === "taken");
  show(email.badge, state === "taken");
  email.icon.classList.toggle("input-wrap__icon--error", state === "taken");
  email.icon.querySelector(".icon").textContent = state === "taken" ? "mark_email_unread" : "mail";
}

function checkEmail({ showError }) {
  const value = email.input.value.trim();
  const ok = isValidEmail(value);
  if (ok) setEmailState("normal");
  else if (showError) setEmailState("invalid");
  return ok;
}

email.input.addEventListener("input", () => {
  if (!email.taken.classList.contains("hidden")) setEmailState("normal");
  checkEmail({ showError: false });
});
email.input.addEventListener("blur", () => {
  if (email.input.value) checkEmail({ showError: true });
});

/* ---------- Kata sandi & kekuatan ---------- */
function strengthOf(value) {
  if (!value) return { level: 0, text: "Belum diisi" };
  if (value.length < MIN_PASSWORD) return { level: 1, text: "Lemah (min. 6 karakter)" };
  if (!/\d/.test(value)) return { level: 2, text: "Cukup (tambahkan angka)" };
  return { level: 3, text: "Kuat & Aman" };
}

function updateStrength() {
  const { level, text } = strengthOf(password.input.value);
  password.meter.dataset.level = level;
  password.label.textContent = text;
}

function checkMatch({ showError }) {
  const value = confirm.input.value;
  const ok = value.length > 0 && value === password.input.value;
  const mismatch = value.length > 0 && !ok;
  if (showError || !mismatch) {
    confirm.input.classList.toggle("is-error", mismatch || (showError && !value));
    show(confirm.mismatch, mismatch || (showError && !value));
  }
  return ok;
}

password.input.addEventListener("input", () => {
  updateStrength();
  password.input.classList.remove("is-error");
  if (confirm.input.value) checkMatch({ showError: true });
});
confirm.input.addEventListener("input", () => checkMatch({ showError: true }));

terms.input.addEventListener("change", () => hide(terms.error));

/* ---------- Validasi sebelum POST ke PHP ---------- */
form.addEventListener("submit", (e) => {
  const nameOk = checkName({ showError: true });
  const emailOk = checkEmail({ showError: true });
  const passwordOk = password.input.value.length >= MIN_PASSWORD;
  password.input.classList.toggle("is-error", !passwordOk);
  if (!passwordOk) updateStrength();
  const matchOk = checkMatch({ showError: true });
  const termsOk = terms.input.checked;
  show(terms.error, !termsOk);

  if (!(nameOk && emailOk && passwordOk && matchOk && termsOk)) {
    // Hanya hentikan submit saat tidak valid; data valid dikirim ke actions/register.php.
    e.preventDefault();
    shake(card);
    form.querySelector(".is-error, #terms:not(:checked)")?.focus();
  }
});


const googleButton = $("#btn-google");
const googleStatus = $("#google-status");

googleButton.addEventListener("click", async () => {
  googleButton.disabled = true;
  googleStatus.classList.remove("hidden");
  googleStatus.textContent = "Menghubungkan ke Google...";

  try {
    await signInWithGoogle();
    window.location.href = ROUTES.dashboard;
  } catch (error) {
    googleStatus.textContent = error.message || "Google sign-in gagal. Coba lagi.";
    googleButton.disabled = false;
  }
});
