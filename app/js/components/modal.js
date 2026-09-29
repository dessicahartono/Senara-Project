/**
 * Modal yang dipakai ulang.
 *
 * 1. Dialog konfirmasi siap pakai:
 *      const ok = await confirmDialog({ title: "Hapus jurnal ini?", ... });
 *
 * 2. Modal kustom dari markup di HTML:
 *      <div class="modal hidden" id="x" role="dialog" aria-modal="true">
 *        <div class="modal__dialog">... <button data-modal-close>Batal</button></div>
 *      </div>
 *      openModal(document.getElementById("x"));
 */
import { escapeHtml, icon } from "../utils/dom.js";

let lastFocused = null;

export function openModal(modal) {
  lastFocused = document.activeElement;
  modal.classList.remove("hidden");
  document.body.classList.add("has-modal");
  requestAnimationFrame(() => modal.classList.add("is-open"));

  const focusTarget = modal.querySelector("[autofocus], input, textarea, button");
  focusTarget?.focus();

  const onKey = (e) => {
    if (e.key === "Escape") closeModal(modal);
  };
  const onClick = (e) => {
    if (e.target === modal || e.target.closest("[data-modal-close]")) closeModal(modal);
  };
  modal._handlers = { onKey, onClick };
  document.addEventListener("keydown", onKey);
  modal.addEventListener("click", onClick);
}

export function closeModal(modal) {
  modal.classList.remove("is-open");
  document.body.classList.remove("has-modal");

  if (modal._handlers) {
    document.removeEventListener("keydown", modal._handlers.onKey);
    modal.removeEventListener("click", modal._handlers.onClick);
    modal._handlers = null;
  }

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.dispatchEvent(new CustomEvent("modal:closed"));
  }, 200);
  lastFocused?.focus?.();
}

/**
 * Dialog konfirmasi. Resolve true bila dikonfirmasi, false bila batal/ditutup.
 * @param {{
 *   title: string, message: string, subtitle?: string,
 *   icon?: string, confirmText?: string, cancelText?: string,
 *   variant?: "danger"|"primary",
 *   onConfirm?: () => Promise<void>   // bila ada, tombol loading sampai selesai;
 *                                     // bila melempar error, modal tetap terbuka
 * }} options
 */
export function confirmDialog({
  title,
  message,
  subtitle = "",
  icon: iconName = "delete",
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "danger",
  onConfirm,
}) {
  const modal = document.createElement("div");
  modal.className = "modal hidden";
  modal.setAttribute("role", "alertdialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "confirm-title");
  modal.innerHTML = `
    <div class="modal__dialog">
      <div class="modal__header">
        <span class="icon-circle icon-circle--lg icon-circle--${variant === "danger" ? "danger" : "peach"}">
          ${icon(iconName, "icon--lg")}
        </span>
        <div>
          <h2 class="modal__title" id="confirm-title">${escapeHtml(title)}</h2>
          ${subtitle ? `<span class="modal__subtitle">${escapeHtml(subtitle)}</span>` : ""}
        </div>
      </div>
      <p class="modal__text">${escapeHtml(message)}</p>
      <div class="modal__actions">
        <button class="btn btn--ghost" type="button" data-modal-close>${escapeHtml(cancelText)}</button>
        <button class="btn btn--${variant === "danger" ? "danger" : "primary"}" type="button" data-confirm>
          ${escapeHtml(confirmText)}
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  return new Promise((resolve) => {
    let confirmed = false;
    const confirmBtn = modal.querySelector("[data-confirm]");

    confirmBtn.addEventListener("click", async () => {
      if (onConfirm) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `${icon("progress_activity", "icon--md spin")}<span>Memproses...</span>`;
        try {
          await onConfirm();
        } catch {
          // onConfirm menampilkan pesan error-nya sendiri; modal tetap terbuka
          confirmBtn.disabled = false;
          confirmBtn.textContent = confirmText;
          return;
        }
      }
      confirmed = true;
      closeModal(modal);
    });

    modal.addEventListener("modal:closed", () => {
      modal.remove();
      resolve(confirmed);
    });

    openModal(modal);
  });
}
