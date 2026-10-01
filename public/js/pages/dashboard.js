import { mountAppShell } from "../components/app-shell.js";
import { showToast } from "../components/toast.js";
import { getRandomAffirmation } from "../services/affirmationService.js";
import { getStreak } from "../services/journalService.js";
import { $, icon, escapeHtml } from "../utils/dom.js";
import { formatDateLong, formatWeekdayShort, firstName } from "../utils/format.js";

const shareBtn = $("#btn-share-affirmation");
let affirmation = null;

async function init() {
  const [user, randomAffirmation, streak] = await Promise.all([
    mountAppShell({ active: "dashboard" }),
    // Afirmasi yang gagal dimuat tidak boleh menghalangi bagian dashboard lainnya
    getRandomAffirmation().catch(() => null),
    getStreak(),
  ]);

  $("#greeting-title").textContent = `Hi, ${firstName(user.name)}!`;
  $("#today-date").textContent = formatDateLong(new Date());

  affirmation = randomAffirmation;
  if (affirmation) {
    $("#affirmation-text").textContent = `« ${affirmation.text} »`;
  } else {
    $("#affirmation-text").textContent = "Afirmasi belum bisa dimuat. Coba muat ulang halaman sebentar lagi.";
    shareBtn.disabled = true;
  }

  renderStreak(streak);
}

function renderStreak({ count, lastDays }) {
  $("#streak-count").textContent = count;

  $("#streak-labels").innerHTML = lastDays
    .map((day) => `<span>${escapeHtml(formatWeekdayShort(day.date))}</span>`)
    .join("");

  $("#streak-days").innerHTML = lastDays
    .map((day) => {
      if (day.done) {
        return `<div class="streak__day streak__day--done" title="Sudah refleksi">${icon("check", "icon--md")}</div>`;
      }
      if (day.isToday) {
        return `<div class="streak__day streak__day--today" title="Belum refleksi hari ini">${icon("close", "icon--md")}</div>`;
      }
      return `<div class="streak__day" title="Terlewat">${icon("remove", "icon--md")}</div>`;
    })
    .join("");
}

shareBtn.addEventListener("click", async () => {
  const text = `« ${affirmation.text} »`;
  if (navigator.share) {
    navigator.share({ title: "Afirmasi Untukmu dari Senara", text }).catch(() => {});
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    const original = shareBtn.innerHTML;
    shareBtn.innerHTML = `${icon("done", "icon--md")}<span>Tautan Disalin</span>`;
    setTimeout(() => {
      shareBtn.innerHTML = original;
    }, 2000);
  } catch {
    showToast("Tidak bisa menyalin afirmasi.", { type: "error" });
  }
});

init();
