/** Helper DOM kecil. */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Escape teks agar aman disisipkan ke innerHTML. */
export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Buat elemen dari string HTML (satu elemen root). */
export function createElement(markup) {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

/** Markup ikon Material Symbols. */
export function icon(name, extraClass = "") {
  return `<span class="icon ${extraClass}" aria-hidden="true">${name}</span>`;
}

export function show(el, visible = true) {
  el?.classList.toggle("hidden", !visible);
}

export function hide(el) {
  show(el, false);
}

/**
 * Ubah tombol ke state loading selama promise berjalan.
 * Mengembalikan hasil promise; konten tombol dipulihkan otomatis.
 */
export async function withLoading(button, promiseFactory, loadingText = "Memproses...") {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `${icon("progress_activity", "icon--md spin")}<span>${escapeHtml(loadingText)}</span>`;
  try {
    return await promiseFactory();
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

/** Mainkan animasi "shake" pada elemen (feedback error). */
export function shake(el) {
  el.classList.remove("shake");
  void el.offsetWidth; // restart animasi
  el.classList.add("shake");
}
