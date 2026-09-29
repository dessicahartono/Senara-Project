import { getPendingVerificationEmail, resendVerificationEmail } from "../services/authService.js";
import { $, icon } from "../utils/dom.js";

const COOLDOWN_SECONDS = 60;

const resendBtn = $("#btn-resend");
const timer = $("#timer");
const originalContent = resendBtn.innerHTML;

getPendingVerificationEmail().then((email) => {
  $("#email-display").textContent = email;
});

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
