/**
 * Perilaku form yang dipakai di banyak halaman.
 *
 *   <button data-toggle-password="password-input">…visibility…</button>
 *   <button data-clear-input="email-input">…</button>
 *
 * Panggil initFormHelpers() sekali per halaman.
 */
import { $$ } from "../utils/dom.js";

export function initFormHelpers(root = document) {
  $$("[data-toggle-password]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.togglePassword);
      const iconEl = btn.querySelector(".icon");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      if (iconEl) iconEl.textContent = show ? "visibility_off" : "visibility";
      btn.setAttribute("aria-label", show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
    });
  });

  $$("[data-clear-input]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.clearInput);
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    });
  });
}

/**
 * Tandai field error/normal.
 * @param {HTMLElement} group elemen .input-group
 * @param {HTMLElement|null} message elemen pesan error (disembunyikan bila valid)
 */
export function setFieldError(group, message, isError) {
  group.classList.toggle("is-error", isError);
  message?.classList.toggle("hidden", !isError);
  const input = group.querySelector("input, textarea");
  if (input) input.setAttribute("aria-invalid", String(isError));
}

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
