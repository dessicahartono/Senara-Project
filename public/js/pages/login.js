import { ROUTES } from "../config.js";
import { initFormHelpers, setFieldError, isValidEmail } from "../components/form.js";
// Dinonaktifkan: authService.js masih memakai mockStore, bukan Firebase/PHP.
// import { login, loginWithGoogle, resendVerificationEmail, sendPasswordReset, AUTH_ERRORS } from "../services/authService.js";
import { $, show, hide, shake } from "../utils/dom.js";

initFormHelpers();

const form = $("#login-form");
const card = $(".auth-card");
const emailInput = $("#email-input");
const passwordInput = $("#password-input");

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

/** Validasi sederhana sebelum form dikirim ke PHP. */
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

// Submit valid dibiarkan berjalan normal ke action PHP (method POST).
// preventDefault hanya dipakai saat input tidak valid agar browser tidak mengirimkannya.
form.addEventListener("submit", (e) => {
  setState("normal");

  if (!validate()) {
    e.preventDefault();
    shake(card);
  }
});

/* Handler login lama dinonaktifkan

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  await login(emailInput.value, passwordInput.value);
  window.location.href = ROUTES.dashboard;
});
*/

// Hapus tanda error begitu pengguna mulai mengetik ulang
emailInput.addEventListener("input", () => {
  setFieldError(el.emailGroup, el.emailError, false);
  hide(el.emailErrorLabel);
});
passwordInput.addEventListener("input", () => {
  setFieldError(el.passwordGroup, el.passwordError, false);
  el.emailGroup.classList.remove("is-error"); // sisa tanda dari state "invalid"
});

// Google login 
const googleButton = $("#btn-google");
const googleStatus = $("#google-status");

googleButton.addEventListener("click", async () => {
  googleButton.disabled = true;
  googleStatus.classList.remove("hidden");
  googleStatus.textContent = "Menghubungkan ke Google...";

  try {
    const configResponse = await fetch("actions/firebase_web_config.php");
    const firebaseConfig = await configResponse.json();
    if (!configResponse.ok) {
      throw new Error(firebaseConfig.message || "Konfigurasi Firebase Web belum tersedia.");
    }

    const [{ initializeApp }, { getAuth, GoogleAuthProvider, signInWithPopup }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"),
    ]);

    const auth = getAuth(initializeApp(firebaseConfig));
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    googleStatus.textContent = "Memverifikasi akun...";

    const formData = new FormData();
    formData.append("idToken", await result.user.getIdToken());

    const verifyResponse = await fetch("actions/google_login.php", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
    const verification = await verifyResponse.json();
    if (!verifyResponse.ok || !verification.success) {
      throw new Error(verification.message || "Verifikasi akun gagal.");
    }

    window.location.href = ROUTES.dashboard;
  } catch (error) {
    googleStatus.textContent = error.message || "Google sign-in gagal. Coba lagi.";
    googleButton.disabled = false;
  }
});

// Dinonaktifkan: tombol-tombol ini masih memanggil implementasi mock.
/*
$("#btn-resend").addEventListener("click", async (e) => {
  await withLoading(e.currentTarget, () => resendVerificationEmail(), "Mengirim...");
});

$("#btn-forgot").addEventListener("click", async () => {
  await sendPasswordReset(emailInput.value.trim());
});

*/
