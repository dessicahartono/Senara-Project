import { mountSiteHeader } from "../components/site-header.js";
import { getRandomAffirmation } from "../services/affirmationService.js";
import { $, $$ } from "../utils/dom.js";

mountSiteHeader({ active: "home", variant: "landing" });

/* ---------- Slider ---------- */

const slider = $("#slider");
const track = $("#slider-track");
const slides = $$(".slide", track);
const dots = $$(".slider__dot");
const prevBtn = $("#btn-prev");
const nextBtn = $("#btn-next");
const SWIPE_THRESHOLD = 40;
const compactQuery = window.matchMedia("(max-width: 1023px)");

let current = 0;

function goTo(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  track.style.transform = `translateX(-${current * 100}%)`;

  slides.forEach((slide, i) => {
    const active = i === current;
    slide.setAttribute("aria-hidden", String(!active));
    // Link di slide tersembunyi tidak boleh bisa di-tab
    slide.querySelectorAll("a, button").forEach((el) => {
      el.tabIndex = active ? 0 : -1;
    });
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("is-active", i === current);
    dot.setAttribute("aria-current", i === current ? "true" : "false");
  });

  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;
  fitHeight();
}

/** Di layar kecil, tinggi slider mengikuti slide aktif agar tidak ada ruang kosong. */
function fitHeight() {
  slider.style.height = compactQuery.matches ? `${slides[current].offsetHeight}px` : "";
}

window.addEventListener("resize", fitHeight);

prevBtn.addEventListener("click", () => goTo(current - 1));
nextBtn.addEventListener("click", () => goTo(current + 1));
dots.forEach((dot) => dot.addEventListener("click", () => goTo(Number(dot.dataset.slide))));

// Panah keyboard (kecuali saat mengetik di input)
window.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea")) return;
  if (e.key === "ArrowLeft") goTo(current - 1);
  if (e.key === "ArrowRight") goTo(current + 1);
});

// Geser dengan jari atau drag mouse (Pointer Events mencakup sentuh, mouse, dan pen)
let dragStartX = null;
let dragStartY = 0;
let dragDiff = 0;
let didDrag = false;

slider.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragDiff = 0;
  didDrag = false;
});

slider.addEventListener("pointermove", (e) => {
  if (dragStartX === null) return;
  dragDiff = e.clientX - dragStartX;
  if (!didDrag) {
    // Abaikan gerakan vertikal (scroll halaman) dan getaran kecil
    if (Math.abs(dragDiff) < 8 || Math.abs(dragDiff) < Math.abs(e.clientY - dragStartY)) return;
    didDrag = true;
    slider.setPointerCapture(e.pointerId);
    track.style.transition = "none";
    slider.classList.add("is-dragging");
  }
  // Track ikut bergerak mengikuti jari/mouse
  track.style.transform = `translateX(calc(-${current * 100}% + ${dragDiff}px))`;
});

function endDrag() {
  if (dragStartX === null) return;
  dragStartX = null;
  if (!didDrag) return;
  track.style.transition = "";
  slider.classList.remove("is-dragging");
  goTo(Math.abs(dragDiff) > SWIPE_THRESHOLD ? current + (dragDiff < 0 ? 1 : -1) : current);
}

slider.addEventListener("pointerup", endDrag);
slider.addEventListener("pointercancel", endDrag);

// Jangan buka link kalau pengguna sebenarnya sedang menggeser
slider.addEventListener("click", (e) => {
  if (didDrag) {
    e.preventDefault();
    e.stopPropagation();
    didDrag = false;
  }
}, true);

// Cegah gambar/link ikut ter-drag bawaan browser
slider.addEventListener("dragstart", (e) => e.preventDefault());

// Geser dua jari ke kiri/kanan di touchpad
let wheelLocked = false;
slider.addEventListener("wheel", (e) => {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  e.preventDefault();
  if (wheelLocked || Math.abs(e.deltaX) < 20) return;
  wheelLocked = true;
  goTo(current + (e.deltaX > 0 ? 1 : -1));
  setTimeout(() => { wheelLocked = false; }, 700);
}, { passive: false });

/* ---------- Afirmasi ---------- */

const affirmationSlide = slides.indexOf($("#slide-afirmasi"));

async function loadAffirmation() {
  const text = $("#landing-affirmation");
  try {
    const affirmation = await getRandomAffirmation();
    text.textContent = `“${affirmation.text}”`;
  } catch {
    text.textContent = "Afirmasi belum bisa dimuat. Coba muat ulang halaman sebentar lagi.";
  }
  fitHeight();
}

/** Link "Afirmasi Harian" di header (index.html#afirmasi) langsung membuka slide afirmasi. */
function openSlideFromHash() {
  if (window.location.hash === "#afirmasi") goTo(affirmationSlide);
}

window.addEventListener("hashchange", openSlideFromHash);

goTo(0);
openSlideFromHash();
loadAffirmation();
