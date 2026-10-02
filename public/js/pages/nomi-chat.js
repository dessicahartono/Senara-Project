import { ASSETS } from "../config.js";
import { mountAppShell } from "../components/app-shell.js";
import { confirmDialog, openModal } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import {
  getMessages,
  getOlderMessages,
  getQuickPrompts,
  sendMessage,
  getNomiReply,
  deleteMessage,
  clearMessages,
} from "../services/chatService.js";
import { $, escapeHtml, icon } from "../utils/dom.js";
import { toISODate, formatTime, formatRelativeDay, formatDate, firstName } from "../utils/format.js";

const stream = $("#chat-stream");
const form = $("#chat-form");
const input = $("#chat-input");
const sendBtn = $("#send-btn");

let messages = [];
let quickPrompts = [];
let isWaiting = false;
/** Masih ada pesan lama di database yang belum dimuat. */
let hasMore = false;
let isLoadingOlder = false;

/** Sapaan Nomi saat riwayat kosong. Hanya tampil di layar, tidak disimpan ke database. */
const WELCOME_ID = "welcome";
const welcomeMessage = (name) => ({
  id: WELCOME_ID,
  sender: "nomi",
  text: `Halo ${name}, selamat datang di ruang teduh ini. Bagaimana harimu terasa sejauh ini? Kalau ada yang ingin kamu ceritakan, aku di sini untuk mendengarkan.`,
  createdAt: new Date().toISOString(),
});

/* ---------- Markup ---------- */

const nomiAvatar = (extra = "message__avatar") =>
  `<span class="avatar avatar--nomi ${extra}"><img src="${ASSETS.nomi}" alt=""></span>`;

function separatorMarkup(date) {
  const label = formatRelativeDay(date) === "Hari ini" ? `Hari ini, ${formatDate(date)}` : formatRelativeDay(date);
  return `
    <div class="chat__separator">
      <span class="text-label-sm">${icon("calendar_today", "icon--xs")}${escapeHtml(label)}</span>
    </div>`;
}

function actionsMarkup() {
  return `
    <div class="message__actions">
      <button class="message__more" type="button" title="Pilihan pesan" aria-label="Pilihan pesan">
        ${icon("more_horiz", "icon--xs")}
      </button>
      <button class="message__delete" type="button" data-action="delete">
        ${icon("delete", "icon--xs")} Hapus pesan
      </button>
    </div>`;
}

function messageMarkup(message, { withPrompts }) {
  const text = escapeHtml(message.text);
  const time = formatTime(message.createdAt);

  if (message.sender === "user") {
    return `
      <div class="message message--user" data-id="${message.id}">
        <div class="message__bubble"><p>${text}</p></div>
        <div class="message__meta">
          ${actionsMarkup()}
          <span class="text-label-sm">${time}</span>
          ${icon("done_all", "icon--xs message__read")}
        </div>
      </div>`;
  }

  const prompts = withPrompts
    ? `<div class="quick-replies">${quickPrompts
        .map((p) => `<button class="quick-reply" type="button" data-prompt="${escapeHtml(p)}">${escapeHtml(p)}</button>`)
        .join("")}</div>`
    : "";

  return `
    <div class="message" data-id="${message.id}">
      ${nomiAvatar()}
      <div class="message__content">
        <div class="message__bubble"><p>${text}</p></div>
        <div class="message__meta">
          <span class="text-label-sm">${time}</span>
          ${actionsMarkup()}
        </div>
        ${prompts}
      </div>
    </div>`;
}

const typingMarkup = `
  <div class="typing" id="typing" aria-label="Nomi sedang mengetik">
    ${nomiAvatar("")}
    <div class="typing__bubble">
      <span class="typing__dot"></span><span class="typing__dot"></span><span class="typing__dot"></span>
    </div>
  </div>`;

/* ---------- Render ---------- */

/**
 * keepScroll: pertahankan posisi baca setelah pesan lama disisipkan di atas, bukan gulir ke bawah.
 * instant: langsung lompat ke bawah tanpa animasi (saat halaman pertama dibuka).
 */
function render({ notice, keepScroll = false, instant = false } = {}) {
  const parts = [];
  let lastDay = null;

  if (isLoadingOlder) {
    parts.push(`
      <div class="chat__notice">
        <span class="text-label-sm">${icon("history", "icon--xs")}Memuat pesan sebelumnya...</span>
      </div>`);
  }
  const lastIndex = messages.length - 1;

  messages.forEach((message, index) => {
    const day = toISODate(new Date(message.createdAt));
    if (day !== lastDay) {
      parts.push(separatorMarkup(day));
      lastDay = day;
    }
    const withPrompts = index === lastIndex && message.sender === "nomi" && !isWaiting;
    parts.push(messageMarkup(message, { withPrompts }));
  });

  if (notice) {
    parts.push(`
      <div class="chat__notice">
        <span class="text-label-md">${icon("spa", "icon--sm")}${escapeHtml(notice)}</span>
      </div>`);
  }
  if (isWaiting) parts.push(typingMarkup);

  const fromBottom = stream.scrollHeight - stream.scrollTop;
  stream.innerHTML = parts.join("");
  // scroll-behavior: smooth di CSS dimatikan sesaat agar lompatan posisi tidak terlihat.
  stream.style.scrollBehavior = keepScroll || instant ? "auto" : "";
  stream.scrollTop = keepScroll ? stream.scrollHeight - fromBottom : stream.scrollHeight;
}

/* ---------- Pesan lama saat menggulir ke atas ---------- */

async function loadOlder() {
  const oldest = messages.find((m) => m.id !== WELCOME_ID);
  if (!hasMore || isLoadingOlder || !oldest) return;

  isLoadingOlder = true;
  render({ keepScroll: true });
  let loaded = false;
  try {
    const older = await getOlderMessages(oldest.id);
    messages = [...older.messages, ...messages];
    hasMore = older.hasMore;
    loaded = true;
  } catch (err) {
    showToast(err.message || "Pesan sebelumnya gagal dimuat.", { type: "error" });
  } finally {
    isLoadingOlder = false;
    render({ keepScroll: true });
  }
  if (loaded) fillStream();
}

/** Bila pesan belum cukup untuk memunculkan scroll, muat pesan lama tanpa menunggu pengguna menggulir. */
function fillStream() {
  if (hasMore && stream.scrollHeight <= stream.clientHeight) loadOlder();
}

stream.addEventListener("scroll", () => {
  if (stream.scrollTop < 80) loadOlder();
});

/* ---------- Kirim pesan ---------- */

async function submitMessage(text) {
  const value = text.trim();
  if (!value || isWaiting) return;

  input.value = "";
  let sent;
  try {
    sent = await sendMessage(value);
  } catch (err) {
    input.value = value;
    showToast(err.message || "Pesan gagal dikirim. Coba lagi.", { type: "error" });
    return;
  }
  messages = messages.filter((m) => m.id !== WELCOME_ID);
  messages.push(sent);
  isWaiting = true;
  sendBtn.disabled = true;
  render();

  try {
    const reply = await getNomiReply();
    messages.push(reply);
  } catch (err) {
    showToast(err.message || "Nomi sedang tidak bisa membalas. Coba lagi sebentar.", { type: "error" });
  } finally {
    isWaiting = false;
    sendBtn.disabled = false;
    render();
    input.focus();
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  submitMessage(input.value);
});

/* ---------- Interaksi di dalam aliran pesan ---------- */

stream.addEventListener("click", async (e) => {
  const prompt = e.target.closest("[data-prompt]");
  if (prompt) {
    input.value = prompt.dataset.prompt;
    input.focus();
    return;
  }

  const more = e.target.closest(".message__more");
  if (more) {
    const actions = more.parentElement;
    const wasOpen = actions.classList.contains("is-open");
    stream.querySelectorAll(".message__actions.is-open").forEach((a) => a.classList.remove("is-open"));
    actions.classList.toggle("is-open", !wasOpen);
    return;
  }

  const del = e.target.closest('[data-action="delete"]');
  if (del) {
    const id = del.closest(".message").dataset.id;
    if (id !== WELCOME_ID) {
      try {
        await deleteMessage(id);
      } catch (err) {
        showToast(err.message || "Pesan gagal dihapus. Coba lagi.", { type: "error" });
        return;
      }
    }
    messages = messages.filter((m) => m.id !== id);
    render();
  }
});

/* ---------- Menu opsi ---------- */

const trigger = $("#options-trigger");
const menu = $("#options-menu");

function setMenu(open) {
  menu.classList.toggle("hidden", !open);
  trigger.setAttribute("aria-expanded", String(open));
}

trigger.addEventListener("click", (e) => {
  e.stopPropagation();
  setMenu(menu.classList.contains("hidden"));
});
document.addEventListener("click", (e) => {
  if (!menu.contains(e.target)) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

$("#btn-clear").addEventListener("click", async () => {
  setMenu(false);
  const cleared = await confirmDialog({
    icon: "delete_sweep",
    title: "Bersihkan Riwayat Obrolan?",
    subtitle: "Kembali ke lembaran yang tenang",
    message:
      "Seluruh pesan dengan Nomi akan dihapus dari layar ini untuk memberi ruang awal yang segar. Tindakan ini tidak dapat dibatalkan.",
    confirmText: "Bersihkan Riwayat",
    onConfirm: () =>
      clearMessages().catch((err) => {
        showToast(err.message || "Riwayat gagal dibersihkan. Coba lagi.", { type: "error" });
        throw err;
      }),
  });
  if (!cleared) return;
  messages = [];
  hasMore = false;
  render({ notice: "Riwayat chat telah dibersihkan. Memulai ruang obrolan baru dengan tenang." });
});

/* ---------- Latihan napas (Mode Tenang) ---------- */

const BREATH_STEPS = [
  { label: "Tarik Napas...", phase: "inhale" },
  { label: "Tahan Sejenak...", phase: "hold" },
  { label: "Hembuskan Perlahan...", phase: "exhale" },
  { label: "Rileks...", phase: "rest" },
];
/** Ajakan bersiap sebelum instruksi napas pertama, agar pengguna tidak langsung diminta menarik napas. */
const BREATH_PREPARE = { label: "Persiapkan dirimu tunggu instruksi dari Nomi", phase: "prepare" };
const BREATH_PREPARE_MS = 4000;
const BREATH_STEP_MS = 3000;
const breatheModal = $("#breathe-modal");
const breatheCircle = $("#breathe-circle");
const breatheText = $("#breathe-instruction");
let breatheTimer = null;
let breatheStartTimer = null;

function setBreathStep(step) {
  breatheText.textContent = step.label;
  breatheCircle.dataset.phase = step.phase;
}

function stopBreathing() {
  clearTimeout(breatheStartTimer);
  clearInterval(breatheTimer);
}

$("#btn-calm").addEventListener("click", () => {
  setMenu(false);
  stopBreathing();
  setBreathStep(BREATH_PREPARE);
  openModal(breatheModal);

  breatheStartTimer = setTimeout(() => {
    let index = 0;
    setBreathStep(BREATH_STEPS[index]);
    breatheTimer = setInterval(() => {
      index = (index + 1) % BREATH_STEPS.length;
      setBreathStep(BREATH_STEPS[index]);
    }, BREATH_STEP_MS);
  }, BREATH_PREPARE_MS);
});

breatheModal.addEventListener("modal:closed", stopBreathing);

/* ---------- Mulai ---------- */

async function init() {
  const [user, history, prompts] = await Promise.all([
    mountAppShell({ active: "chat" }),
    getMessages().catch((err) => {
      showToast(err.message || "Riwayat chat gagal dimuat.", { type: "error" });
      return { messages: [], hasMore: false };
    }),
    getQuickPrompts(),
  ]);
  messages = history.messages.length ? history.messages : [welcomeMessage(firstName(user.name))];
  hasMore = history.hasMore;
  quickPrompts = prompts;
  render({ instant: true });
  fillStream();
}

init();
