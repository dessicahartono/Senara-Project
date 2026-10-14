/**
 * Percakapan dengan Nomi lewat endpoint PHP. Balasan Nomi dibuat oleh Gemini di backend.
 */

import { ACTIONS } from "../config.js";

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
  const { messages, hasMore } = await request(`${ACTIONS}chat.php`);
  return { messages, hasMore };
}

/** Pesan-pesan sebelum pesan beforeId, untuk dimuat saat pengguna menggulir ke atas. */
export async function getOlderMessages(beforeId) {
  const { messages, hasMore } = await request(`${ACTIONS}chat.php?before=${encodeURIComponent(beforeId)}`);
  return { messages, hasMore };
}

/** Simpan pesan pengguna. Balasan Nomi diambil terpisah lewat getNomiReply(). */
export async function sendMessage(text) {
  const { message } = await post(`${ACTIONS}chat.php`, { text: text.trim() });
  return message;
}

export async function getNomiReply() {
  const { message } = await post(`${ACTIONS}nomi_reply.php`, {});
  return message;
}

export async function deleteMessage(id) {
  await request(`${ACTIONS}chat.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function clearMessages() {
  await request(`${ACTIONS}chat.php?all=1`, { method: "DELETE" });
}
