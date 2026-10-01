/**
 * Autentikasi.
 * Sekarang: data contoh. Nanti: Firebase Auth
 * (signInWithEmailAndPassword, createUserWithEmailAndPassword,
 *  sendEmailVerification, signInWithPopup(GoogleAuthProvider), signOut).
 *
 * Kode error mengikuti Firebase agar halaman tidak perlu diubah.
 */
import { getState, updateState, delay, serviceError } from "./mockStore.js";

export const AUTH_ERRORS = {
  // Email Enumeration Protection aktif: akun tidak ditemukan & kata sandi salah
  // sama-sama dikembalikan sebagai invalid-credential.
  INVALID_CREDENTIAL: "auth/invalid-credential",
  INVALID_EMAIL: "auth/invalid-email",
  TOO_MANY_REQUESTS: "auth/too-many-requests",
  // Hanya muncul jika Email Enumeration Protection dimatikan
  USER_NOT_FOUND: "auth/user-not-found",
  WRONG_PASSWORD: "auth/wrong-password",
  EMAIL_NOT_VERIFIED: "auth/email-not-verified",
  EMAIL_IN_USE: "auth/email-already-in-use",
  WEAK_PASSWORD: "auth/weak-password",
};

const normalize = (email) => email.trim().toLowerCase();

/** Simulasi pembatasan Firebase: terlalu banyak percobaan gagal berturut-turut. */
const MAX_FAILED_ATTEMPTS = 5;
let failedAttempts = 0;

export async function login(email, password) {
  await delay(800);
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    throw serviceError(AUTH_ERRORS.TOO_MANY_REQUESTS, "Terlalu banyak percobaan masuk.");
  }

  const account = getState().accounts.find((a) => a.email === normalize(email));
  if (!account || account.password !== password) {
    failedAttempts += 1;
    throw serviceError(AUTH_ERRORS.INVALID_CREDENTIAL, "Email atau kata sandi salah.");
  }
  failedAttempts = 0;

  if (!account.emailVerified) {
    throw serviceError(AUTH_ERRORS.EMAIL_NOT_VERIFIED, "Email belum diverifikasi.");
  }

  updateState((s) => {
    s.session = { email: account.email };
  });
  return { email: account.email };
}

export async function loginWithGoogle() {
  await delay(800);
  const { user } = getState();
  updateState((s) => {
    s.session = { email: user.email };
  });
  return { email: user.email };
}

export async function register({ name, email, password }) {
  await delay(900);
  const normalized = normalize(email);

  if (getState().accounts.some((a) => a.email === normalized)) {
    throw serviceError(AUTH_ERRORS.EMAIL_IN_USE, "Email sudah terdaftar.");
  }
  if (password.length < 6) {
    throw serviceError(AUTH_ERRORS.WEAK_PASSWORD, "Kata sandi minimal 6 karakter.");
  }

  updateState((s) => {
    s.accounts.push({ email: normalized, password, emailVerified: false, name });
    s.pendingVerificationEmail = normalized;
  });
  return { email: normalized };
}

/** Email yang sedang menunggu verifikasi (untuk halaman cek email). */
export async function getPendingVerificationEmail() {
  return getState().pendingVerificationEmail ?? getState().user.email;
}

export async function resendVerificationEmail() {
  await delay(600);
  return true;
}

export async function sendPasswordReset(email) {
  await delay(600);
  return { email: normalize(email) };
}

export async function logout() {
  await delay(200);
  updateState((s) => {
    s.session = null;
  });
}

export async function isLoggedIn() {
  return Boolean(getState().session);
}
