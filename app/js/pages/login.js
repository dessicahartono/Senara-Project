import { ROUTES } from "../config.js";
import { initFormHelpers, setFieldError, isValidEmail } from "../components/form.js";
import { showToast } from "../components/toast.js";
import {
  login,
  loginWithGoogle,
  resendVerificationEmail,
  sendPasswordReset,
  AUTH_ERRORS,
} from "../services/authService.js";
import { $, show, hide, shake, withLoading } from "../utils/dom.js";

initFormHelpers();

const form = $("#login-form");
const card = $(".auth-card");
const emailInput = $("#email-input");
const passwordInput = $("#password-input");
const submitBtn = $("#btn-submit");

const el = {
  banners: $("#banners"),
  unverified: $("#banner-unverified"),
  notFound: $("#banner-notfound"),
  tooMany: $("#banner-toomany"),
  resent: $("#banner-resent"),
  emailGroup: $("#email-group"),
  emailError: $("#email-error"),
  emailErrorLabel: $("#email-error-label"),
  passwordGroup: $("#password-group"),
  passwordError: $("#password-error"),
  passwordErrorText: $("#password-error-text"),
};

/**
 * State tampilan: "normal" | "invalid" | "invalidemail" | "toomany" | "unverified"
 * + "notfound" | "wrongpw" (desain Stitch; hanya terpakai bila Email Enumeration Protection mati)
 */
function setState(state) {
  hide(el.unverified);
  hide(el.notFound);
  hide(el.tooMany);
  hide(el.resent);
  setFieldError(el.emailGroup, el.emailError, false);
  hide(el.emailErrorLabel);
  setFieldError(el.passwordGroup, el.passwordError, false);

  if (state === "invalid") {
    // Firebase tidak memberi tahu mana yang salah, jadi tandai keduanya dengan satu pesan
    el.passwordErrorText.textContent =
      "Email atau kata sandi salah. Periksa kembali atau gunakan opsi lupa kata sandi.";
    setFieldError(el.emailGroup, null, true);
    setFieldError(el.passwordGroup, el.passwordError, true);
  } else if (state === "invalidemail") {
    el.emailError.textContent = "Format email belum sesuai.";
    setFieldError(el.emailGroup, el.emailError, true);
  } else if (state === "toomany") {
    show(el.tooMany);
  } else if (state === "unverified") {
    show(el.unverified);
  } else if (state === "notfound") {
    show(el.notFound);
    setFieldError(el.emailGroup, el.emailError, true);
    show(el.emailErrorLabel);
  } else if (state === "wrongpw") {
    el.passwordErrorText.textContent =
      "Kata sandi salah. Harap coba lagi atau gunakan opsi lupa kata sandi.";
    setFieldError(el.passwordGroup, el.passwordError, true);
  }

  updateBannerContainer();
}

function updateBannerContainer() {
  const anyVisible = [el.unverified, el.notFound, el.tooMany, el.resent].some(
    (b) => !b.classList.contains("hidden")
  );
  show(el.banners, anyVisible);
}

/** Validasi sederhana sebelum memanggil service. */
function validate() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  let valid = true;

  if (!isValidEmail(email)) {
    el.emailError.textContent = email ? "Format email belum sesuai." : "Email wajib diisi.";
    setFieldError(el.emailGroup, el.emailError, true);
    valid = false;
  }
  if (!password) {
    el.passwordErrorText.textContent = "Kata sandi wajib diisi.";
    setFieldError(el.passwordGroup, el.passwordError, true);
    valid = false;
  }
  return valid;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setState("normal");
  el.emailError.textContent = "Email belum terdaftar. Periksa kembali atau daftar akun baru.";

  if (!validate()) {
    shake(card);
    return;
  }

  try {
    await withLoading(
      submitBtn,
      () => login(emailInput.value, passwordInput.value),
      "Memasuki Ruang..."
    );
    window.location.href = ROUTES.dashboard;
  } catch (err) {
    const stateByCode = {
      [AUTH_ERRORS.INVALID_CREDENTIAL]: "invalid",
      [AUTH_ERRORS.INVALID_EMAIL]: "invalidemail",
      [AUTH_ERRORS.TOO_MANY_REQUESTS]: "toomany",
      [AUTH_ERRORS.USER_NOT_FOUND]: "notfound",
      [AUTH_ERRORS.WRONG_PASSWORD]: "wrongpw",
      [AUTH_ERRORS.EMAIL_NOT_VERIFIED]: "unverified",
    };
    setState(stateByCode[err.code] ?? "normal");
    if (!stateByCode[err.code]) showToast("Terjadi kendala. Coba lagi sebentar.", { type: "error" });
    shake(card);
  }
});

// Hapus tanda error begitu pengguna mulai mengetik ulang
emailInput.addEventListener("input", () => {
  setFieldError(el.emailGroup, el.emailError, false);
  hide(el.emailErrorLabel);
});
passwordInput.addEventListener("input", () => {
  setFieldError(el.passwordGroup, el.passwordError, false);
  el.emailGroup.classList.remove("is-error"); // sisa tanda dari state "invalid"
});

$("#btn-resend").addEventListener("click", async (e) => {
  await withLoading(e.currentTarget, () => resendVerificationEmail(), "Mengirim...");
  show(el.resent);
  updateBannerContainer();
  setTimeout(() => {
    hide(el.resent);
    updateBannerContainer();
  }, 4500);
});

$("#btn-forgot").addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!isValidEmail(email)) {
    el.emailError.textContent = "Isi email kamu dulu untuk menerima tautan atur ulang.";
    setFieldError(el.emailGroup, el.emailError, true);
    emailInput.focus();
    return;
  }
  await sendPasswordReset(email);
  showToast(`Tautan atur ulang kata sandi dikirim ke ${email}`, { icon: "mail" });
});

$("#btn-google").addEventListener("click", async (e) => {
  await withLoading(e.currentTarget, () => loginWithGoogle(), "Menghubungkan...");
  window.location.href = ROUTES.dashboard;
});

console.info(
  "[Senara demo] Akun contoh:\n" +
    "  seno.refleksi@gmail.com / senara123 → berhasil\n" +
    "  belum.verifikasi@senara.id / senara123 → belum verifikasi\n" +
    '  email lain / kata sandi lain → "Email atau kata sandi salah"\n' +
    "  5x gagal berturut-turut → terlalu banyak percobaan (muat ulang halaman untuk reset)"
);
