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
  const ashRatio = 582.4 / 244.4; // Just the ASH box, which is all that docks
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

  // The phrase starts a word space past the docked ASH box, centred on it
  const size = Math.round(dockH * 0.42);
  brandPhrase.style.setProperty("--phrase-size", `${size}px`);
  brandPhrase.style.setProperty("--phrase-x", `${geo.dockX + dockH * ashRatio + size}px`);
  brandPhrase.style.setProperty("--phrase-y", `${geo.dockY + dockH / 2 - (size * 1.3) / 2}px`);

  // Room up to the button, less a word space; too little on very narrow phones, so it hides
  const room = cta.left - (geo.dockX + dockH * ashRatio + size) - size;
  brandPhrase.style.setProperty("--phrase-max", `${Math.floor(room)}px`);
  brandPhrase.classList.toggle("is-cramped", room < 90);
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

  // MURRELL glitches out as the box docks, and back in as it returns to the hero.
  // Not on load, so pages that start docked just show the box.
  dynamicBrand.classList.remove("murrell-out", "murrell-in");
  if (animate) {
    void dynamicBrand.offsetWidth; // Restart the animation if it was mid-play
    dynamicBrand.classList.add(docked ? "murrell-out" : "murrell-in");
  }

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
  document.dispatchEvent(new Event("drawer:open"));
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

// The drawer form is the site's contact form: any #contact link opens it (the old /contact/
// page redirects to /#contact). A link with data-reason picks that reason in the form.
function openContact(reason) {
  const select = drawer.querySelector('select[name="reason"]');
  if (reason && select) select.value = reason;
  if (!drawerOpen) openDrawer();
  else drawer.querySelector("input")?.focus({ preventScroll: true });
}

document.addEventListener("click", event => {
  const link = event.target.closest('a[href="#contact"]');
  if (!link) return;
  event.preventDefault();
  openContact(link.dataset.reason);
});

if (location.hash === "#contact") {
  history.replaceState(null, "", location.pathname + location.search);
  openContact();
}

// 10. The phrase beside the docked brand: every few seconds the next rolls up as the last rolls
//     out. It only moves on while it's showing, so it never changes out of sight.
const phrases = JSON.parse(brandPhrase.dataset.phrases);
let phraseIndex = 0;

// On narrow phones the longer phrases don't fit beside the brand, so those are skipped
const phraseProbe = document.createElement("span");
phraseProbe.setAttribute("aria-hidden", "true");
phraseProbe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap";
brandPhrase.append(phraseProbe);
const phraseFits = text => {
  phraseProbe.textContent = text;
  const room = parseFloat(getComputedStyle(brandPhrase).maxWidth); // "none" → NaN → fits
  return !(phraseProbe.offsetWidth > room);
};

// The first phrase is in the page already; swap it if it doesn't fit
function fitFirstPhrase() {
  const current = brandPhrase.querySelector(".phrase-word:not(.is-out)");
  if (!current || phraseFits(phrases[phraseIndex])) return;
  const fits = phrases.findIndex(phraseFits);
  if (fits < 0) return;
  phraseIndex = fits;
  current.textContent = phrases[fits];
}
fitFirstPhrase();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFirstPhrase);
window.addEventListener("resize", fitFirstPhrase);

if (!reducedMotion) {
  setInterval(() => {
    if (!root.classList.contains("brand-docked") || document.hidden) return;
    let next = phraseIndex;
    for (let i = 0; i < phrases.length; i++) {
      next = (next + 1) % phrases.length;
      if (phraseFits(phrases[next])) break;
    }
    if (next === phraseIndex) return;
    phraseIndex = next;
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

// Elements that animate in the first time they're reached
const seenObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    entry.target.classList.add("is-seen");
    seenObserver.unobserve(entry.target);
  }
}), { threshold: 0.25 });
document.querySelectorAll("[data-seen]").forEach(el => seenObserver.observe(el));

// Posters: one with more words than the screen has room for mustn't get covered before it's read
const posters = document.querySelectorAll(".poster");
function fitPosters() {
  posters.forEach(poster => {
    const inner = poster.firstElementChild.offsetHeight;
    const style = getComputedStyle(poster);
    const room = window.innerHeight - parseFloat(style.top || 0) - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    poster.classList.toggle("is-tall", inner > room);
  });
}
if (posters.length) {
  fitPosters();
  window.addEventListener("resize", fitPosters);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPosters);
}

// Contact form (in the drawer): sent to /api/contact (functions/api/contact.js), which checks
// Cloudflare Turnstile and emails Ash through Resend. Turnstile loads when the drawer first opens.
const turnstileKey = document.querySelector('meta[name="turnstile-site-key"]')?.content;
let turnstileReady = null;

function loadTurnstile() {
  if (!turnstileReady) {
    turnstileReady = new Promise((resolve, reject) => {
      window.onTurnstileLoad = () => resolve(window.turnstile);
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";
      script.async = true;
      script.onerror = reject;
      document.head.append(script);
    });
  }
  return turnstileReady;
}

function renderTurnstile(form) {
  if (form.dataset.widgetId || !turnstileKey) return Promise.resolve();
  const slot = form.querySelector("[data-turnstile]");
  return loadTurnstile().then(turnstile => {
    if (form.dataset.widgetId) return;
    form.dataset.widgetId = turnstile.render(slot, {
      sitekey: turnstileKey,
      theme: form.dataset.turnstileTheme || "auto",
      appearance: "interaction-only", // Hidden unless Cloudflare needs the visitor to click
      size: "flexible", // If it does show, it fills the form's width like the fields
      // Its slot only takes up room in the form while it's asking for a click
      "before-interactive-callback": () => slot.classList.add("is-visible"),
      "after-interactive-callback": () => slot.classList.remove("is-visible"),
      action: "contact",
    });
  });
}

document.querySelectorAll("[data-contact-form]").forEach(form => {
  const status = form.querySelector(".form-status");
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button.textContent;

  const setStatus = (text, kind) => {
    status.textContent = text;
    status.dataset.kind = kind || "";
  };

  document.addEventListener("drawer:open", () => renderTurnstile(form).catch(() => {}));
  if (drawerOpen) renderTurnstile(form).catch(() => {}); // Opened by #contact before this ran

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (button.disabled) return;

    try {
      await renderTurnstile(form);
    } catch {
      setStatus("The security check couldn't load. Please refresh the page or email directly.", "error");
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    if (!data["cf-turnstile-response"]) {
      setStatus("Just a moment, the security check is still finishing. Then press Submit again.", "error");
      return;
    }

    button.disabled = true;
    button.textContent = "Sending…";
    setStatus("");

    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.ok) throw new Error(result.error || "Your message couldn't be sent just now.");
      form.reset();
      setStatus("Thanks, your message is on its way. I'll be in touch soon.", "success");
    } catch (error) {
      setStatus(`${error.message} You can also email me directly.`, "error");
    } finally {
      button.disabled = false;
      button.textContent = buttonLabel;
      // Each token works once, so get a fresh one for the next send
      if (window.turnstile && form.dataset.widgetId) window.turnstile.reset(form.dataset.widgetId);
    }
  });
});

// 11. Home photography carousel. The track scrolls natively; the arrows move it about a
//     screen's worth at a time and grey out at either end. Without JavaScript they stay hidden.
document.querySelectorAll("[data-carousel]").forEach(track => {
  const controls = track.closest("section").querySelector("[data-carousel-controls]");
  if (!controls) return;
  const prev = controls.querySelector("[data-carousel-prev]");
  const next = controls.querySelector("[data-carousel-next]");
  controls.hidden = false;

  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
  };
  // One photo at a time: to the next slide whose start is past the current one, or back one
  const slides = [...track.children];
  const go = dir => {
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const starts = slides.map(slide => slide.offsetLeft - track.offsetLeft - pad);
    const here = track.scrollLeft;
    const target = dir > 0
      ? starts.find(x => x > here + 4)
      : [...starts].reverse().find(x => x < here - 4);
    if (target !== undefined) track.scrollTo({ left: target, behavior: reducedMotion ? "auto" : "smooth" });
  };

  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  track.querySelectorAll("img").forEach(img => img.addEventListener("load", update));
  update();
});
