import { $, icon } from "../utils/dom.js";

const COOLDOWN_SECONDS = 60;

const resendBtn = $("#btn-resend");
const timer = $("#timer");
const originalContent = resendBtn.innerHTML;

// Email dan status pengiriman dikirim oleh actions/register.php lewat query string.
const params = new URLSearchParams(window.location.search);
const message = $("#verify-message");
$("#email-display").textContent = params.get("email") || "emailmu";

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

if (params.get("verification") === "failed") {
  message.textContent =
    "Akun berhasil dibuat, tetapi email verifikasi belum berhasil dikirim. Coba kirim ulang beberapa saat lagi.";
} else if (params.has("email")) {
  // Email baru saja dikirim saat registrasi; server juga menolak kirim ulang sebelum jeda ini selesai.
  startCooldown(COOLDOWN_SECONDS);
}

resendBtn.addEventListener("click", async () => {
  resendBtn.disabled = true;
  resendBtn.innerHTML = `${icon("sync", "spin")}<span>Mengirim...</span>`;

  try {
    const response = await fetch("actions/resend_verification.php", { method: "POST", credentials: "same-origin" });
    const result = await response.json();
    if (result.alreadyVerified) {
      window.location.href = "login.html?verified=1";
      return;
    }
    if (!response.ok || !result.success) {
      resendBtn.innerHTML = originalContent;
      message.textContent = result.message || "Email verifikasi gagal dikirim. Coba lagi beberapa saat lagi.";
      if (result.retryAfter) startCooldown(result.retryAfter);
      else resendBtn.disabled = false;
      return;
    }
  } catch {
    resendBtn.innerHTML = originalContent;
    resendBtn.disabled = false;
    message.textContent = "Email verifikasi gagal dikirim. Periksa koneksi lalu coba lagi.";
    return;
  }

  resendBtn.innerHTML = `${icon("check")}<span>Terkirim!</span>`;
  setTimeout(() => {
    resendBtn.innerHTML = originalContent;
    startCooldown(COOLDOWN_SECONDS);
  }, 1500);
});
