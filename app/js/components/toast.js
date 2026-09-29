/**
 * Notifikasi singkat di bawah layar.
 *   showToast("Jurnal tersimpan", { type: "success" });
 */
import { escapeHtml, icon } from "../utils/dom.js";

const ICONS = { success: "check_circle", error: "error", info: "info" };

function getRegion() {
  let region = document.querySelector(".toast-region");
  if (!region) {
    region = document.createElement("div");
    region.className = "toast-region";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }
  return region;
}

/**
 * @param {string} message
 * @param {{type?: "success"|"error"|"info", icon?: string, duration?: number}} options
 */
export function showToast(message, { type = "success", icon: iconName, duration = 3000 } = {}) {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `${icon(iconName ?? ICONS[type], "icon--md")}<span>${escapeHtml(message)}</span>`;
  getRegion().appendChild(toast);

  setTimeout(() => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
