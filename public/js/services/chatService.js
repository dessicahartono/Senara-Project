/**
 * Percakapan dengan Nomi lewat endpoint PHP. Balasan Nomi dibuat oleh Gemini di backend.
 */

/** Pertanyaan cepat di bawah balasan Nomi terakhir. */
const QUICK_PROMPTS = ["Tenggat waktu pekerjaan", "Rasa cemas berlebih", "Hanya ingin didengar"];

async function request(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...options });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    const error = new Error(result.message || "Permintaan gagal. Coba lagi beberapa saat lagi.");
    error.status = response.status;
    throw error;
  }
  return result;
}

function post(url, fields) {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => body.append(key, value));
  return request(url, { method: "POST", body });
}

/** Pesan 3 hari terakhir (minimal 20), urut dari yang terlama. hasMore: masih ada pesan yang lebih lama. */
export async function getMessages() {
  const { messages, hasMore } = await request("actions/chat.php");
  return { messages, hasMore };
}

/** Pesan-pesan sebelum pesan beforeId, untuk dimuat saat pengguna menggulir ke atas. */
export async function getOlderMessages(beforeId) {
  const { messages, hasMore } = await request(`actions/chat.php?before=${encodeURIComponent(beforeId)}`);
  return { messages, hasMore };
}

export async function getQuickPrompts() {
  return QUICK_PROMPTS;
}

/** Simpan pesan pengguna. Balasan Nomi diambil terpisah lewat getNomiReply(). */
export async function sendMessage(text) {
  const { message } = await post("actions/chat.php", { text: text.trim() });
  return message;
}

export async function getNomiReply() {
  const { message } = await post("actions/nomi_reply.php", {});
  return message;
}

export async function deleteMessage(id) {
  await post("actions/delete_chat.php", { id });
}

export async function clearMessages() {
  await post("actions/delete_chat.php", { all: "1" });
}
