/**
 * Percakapan dengan Nomi.
 * Sekarang: balasan contoh bergiliran. Nanti: Firestore (riwayat) + API/Cloud Function (balasan AI).
 */
import { getState, updateState, delay, makeId, staticData } from "./mockStore.js";

export async function getMessages() {
  await delay(250);
  return getState().chatMessages;
}

export async function getQuickPrompts() {
  return staticData.chatQuickPrompts;
}

/** Simpan pesan pengguna. Balasan Nomi diambil terpisah lewat getNomiReply(). */
export async function sendMessage(text) {
  await delay(150);
  const message = {
    id: makeId("msg"),
    sender: "user",
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  updateState((s) => {
    s.chatMessages.push(message);
  });
  return message;
}

export async function getNomiReply() {
  await delay(1400);
  const replies = staticData.nomiReplies;
  const userCount = getState().chatMessages.filter((m) => m.sender === "user").length;
  const reply = {
    id: makeId("msg"),
    sender: "nomi",
    text: replies[userCount % replies.length],
    createdAt: new Date().toISOString(),
  };
  updateState((s) => {
    s.chatMessages.push(reply);
  });
  return reply;
}

export async function deleteMessage(id) {
  await delay(150);
  updateState((s) => {
    s.chatMessages = s.chatMessages.filter((m) => m.id !== id);
  });
}

export async function clearMessages() {
  await delay(400);
  updateState((s) => {
    s.chatMessages = [];
  });
}
