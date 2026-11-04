const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 1. Dynamic brand: large in the home hero, docks into the corner as soon as scrolling starts,
//    with its phrase beside it. Every other page has no hero, so it stays docked.
const heroAnchor = document.querySelector(".hero-wordmark img");
const dynamicBrand = document.getElementById("dynamic-brand");
const drawerTrigger = document.getElementById("drawer-trigger");
const brandPhrase = document.getElementById("brand-phrase");

const geo = { x: 0, y: 0, dockX: 16, dockY: 20, dockScale: 1 };
let isDocked = null;
let drawerOpen = false;

function dockHeight() {
  const w = window.innerWidth;
  if (w < 768) return 26;
  if (w >= 2000) return 42;
  if (w >= 1600) return 38;
  return 32;
}

function measurePositions() {
  const ratio = 1841.23 / 244.4; // The wordmark's own shape
  const dockH = dockHeight();
  const rect = heroAnchor ? heroAnchor.getBoundingClientRect() : null;
  const fullW = rect ? rect.width : dockH * ratio;
  dynamicBrand.style.width = `${fullW}px`;

  geo.x = rect ? rect.left : 0;
  geo.y = rect ? rect.top + (window.scrollY || 0) : 0;
  geo.dockScale = (dockH * ratio) / fullW;

  // Dock vertically centred on the button, in from the left by the margin it keeps on the right
  const cta = drawerTrigger.getBoundingClientRect();
  geo.dockX = root.clientWidth - cta.right;
  geo.dockY = cta.top + cta.height / 2 - dockH / 2;

  // The phrase starts a word space past the docked wordmark, centred on it
  const size = Math.round(dockH * 0.42);
  brandPhrase.style.setProperty("--phrase-size", `${size}px`);
  brandPhrase.style.setProperty("--phrase-x", `${geo.dockX + dockH * ratio + size}px`);
  brandPhrase.style.setProperty("--phrase-y", `${geo.dockY + dockH / 2 - (size * 1.3) / 2}px`);
}

function applyBrand(animate) {
  const docked = !heroAnchor || (window.scrollY || 0) > 4 || drawerOpen;
  if (docked === isDocked && animate) return;
  isDocked = docked;

  if (!animate) dynamicBrand.classList.add("no-transition");
  dynamicBrand.style.transform = docked
    ? `translate3d(${geo.dockX}px, ${geo.dockY}px, 0) scale(${geo.dockScale})`
    : `translate3d(${geo.x}px, ${geo.y}px, 0) scale(1)`;
  dynamicBrand.classList.toggle("is-docked", docked);
  root.classList.toggle("brand-docked", docked);

  if (!animate) {
    void dynamicBrand.offsetWidth;
    dynamicBrand.classList.remove("no-transition");
  }
}

function remeasure() {
  measurePositions();
  applyBrand(false);
}

remeasure();

// Takes over from the load-in in place, so the swap can't be seen
function showBrand() {
  dynamicBrand.classList.add("no-transition");
  dynamicBrand.classList.add("is-ready");
  void dynamicBrand.offsetWidth;
  dynamicBrand.classList.remove("no-transition");
}
if (root.classList.contains("has-intro")) document.addEventListener("hero-intro:done", showBrand, { once: true });
else showBrand();

window.addEventListener("scroll", () => applyBrand(true), { passive: true });
window.addEventListener("resize", remeasure);

// Already on the home page: the brand goes back to the top rather than reloading
dynamicBrand.addEventListener("click", event => {
  if (heroAnchor && window.scrollY > 4) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }
});

// 2. Top-down drawer. Everything behind it is inert while it's open.
const drawer = document.getElementById("site-drawer");
const drawerBackdrop = document.getElementById("drawer-backdrop");
const behindDrawer = document.querySelectorAll("main, footer");

function openDrawer() {
  drawer.hidden = false;
  drawerOpen = true;
  applyBrand(true);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    drawer.classList.add("is-open");
    root.classList.add("drawer-open");
  }));
  behindDrawer.forEach(el => { el.inert = true; });
  drawerTrigger.setAttribute("aria-expanded", "true");
  // On phones the keyboard would cover the links, so only wider screens go straight to the form
  if (window.innerWidth > 1080) {
    setTimeout(() => {
      const first = drawer.querySelector("input");
      if (drawerOpen && first) first.focus({ preventScroll: true });
    }, 350);
  }
}

function closeDrawer() {
  if (!drawerOpen) return;
  drawer.classList.remove("is-open");
  root.classList.remove("drawer-open");
  drawerOpen = false;
  behindDrawer.forEach(el => { el.inert = false; });
  drawerTrigger.setAttribute("aria-expanded", "false");
  drawerTrigger.focus({ preventScroll: true });
  setTimeout(() => {
    if (!drawer.classList.contains("is-open")) drawer.hidden = true;
    applyBrand(true);
  }, 450);
}

drawerTrigger.addEventListener("click", () => (drawerOpen ? closeDrawer() : openDrawer()));
drawerBackdrop.addEventListener("click", closeDrawer);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeDrawer();
});

// 10. The phrase beside the docked brand: every few seconds the next rolls up as the last rolls
//     out. It only moves on while it's showing, so it never changes out of sight.
const phrases = JSON.parse(brandPhrase.dataset.phrases);
let phraseIndex = 0;
if (!reducedMotion) {
  setInterval(() => {
    if (!root.classList.contains("brand-docked") || document.hidden) return;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    brandPhrase.querySelectorAll(".phrase-word").forEach(old => {
      old.className = "phrase-word is-out";
      setTimeout(() => old.remove(), 450);
    });
    const word = document.createElement("span");
    word.className = "phrase-word is-in";
    word.textContent = phrases[phraseIndex];
    brandPhrase.append(word);
  }, 2800);
}

// Respect reduced motion on the home page video
const video = document.querySelector("[data-hero-video]");
if (video && reducedMotion) {
  video.removeAttribute("autoplay");
  video.pause();
}

// Contact forms: open the visitor's email app with the message filled in
document.querySelectorAll("[data-contact-form]").forEach(form => {
  form.addEventListener("submit", event => {
    event.preventDefault();
    const f = new FormData(form);
    const name = f.get("name") || `${f.get("first")} ${f.get("last")}`;
    const lines = [f.get("message"), "", `Name: ${name}`, `Email: ${f.get("email")}`];
    if (f.get("business")) lines.push(`Business: ${f.get("business")}`);
    if (f.get("website")) lines.push(`Website: ${f.get("website")}`);
    const subject = `${f.get("reason")} enquiry from ${name}`;
    window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  });
});
