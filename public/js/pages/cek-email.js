import { getPendingVerificationEmail, resendVerificationEmail } from "../services/authService.js";
import { $, icon } from "../utils/dom.js";

const COOLDOWN_SECONDS = 60;

const resendBtn = $("#btn-resend");
const timer = $("#timer");
const originalContent = resendBtn.innerHTML;

// Utamakan email hasil redirect registrasi PHP; fallback mempertahankan mode demo/mock.
const registeredEmail = new URLSearchParams(window.location.search).get("email");
const verificationStatus = new URLSearchParams(window.location.search).get("verification");
if (registeredEmail) {
  $("#email-display").textContent = registeredEmail;
} else {
  getPendingVerificationEmail().then((email) => {
    $("#email-display").textContent = email;
  });
}

if (verificationStatus === "failed") {
  $("#verify-message").textContent =
    "Akun berhasil dibuat, tetapi email verifikasi belum berhasil dikirim. Coba kirim ulang beberapa saat lagi.";
}

function startCooldown(seconds) {
  let remaining = seconds;
  resendBtn.disabled = true;
  timer.classList.remove("is-ready");

  const render = () => {
    timer.innerHTML = `Bisa dikirim ulang dalam <strong>${remaining}</strong> detik`;
  };
  render();

  const interval = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      render();
      return;
    }
    clearInterval(interval);
    resendBtn.disabled = false;
    timer.classList.add("is-ready");
    timer.textContent = "Link siap dikirim kembali sekarang jika belum tiba.";
  }, 1000);
}

resendBtn.addEventListener("click", async () => {
  resendBtn.disabled = true;
  resendBtn.innerHTML = `${icon("sync", "spin")}<span>Mengirim...</span>`;

  await resendVerificationEmail();

  resendBtn.innerHTML = `${icon("check")}<span>Terkirim!</span>`;
  setTimeout(() => {
    resendBtn.innerHTML = originalContent;
    startCooldown(COOLDOWN_SECONDS);
  }, 1500);
});
