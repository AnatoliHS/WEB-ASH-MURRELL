// Home page About section: plays like a podcast episode, with Ash's lines as the captions, a
// waveform to scrub, and chapters. There's no audio yet. It only runs while it's on screen, holds
// still while a caption's link has keyboard focus, and doesn't start itself with reduced motion.
(() => {
  const CHAPTER_SECONDS = 8;
  const BAR_COUNT = 96;

  const episode = document.querySelector("[data-episode]");
  if (!episode) return;

  const stage = episode.querySelector("[data-ep-stage]");
  const captions = Array.from(episode.querySelectorAll("[data-ep-cap]"));
  const chapters = Array.from(episode.querySelectorAll("[data-ep-chapter]"));
  const bars = episode.querySelector("[data-ep-bars]");
  const playButton = episode.querySelector("[data-ep-play]");
  const playIcon = episode.querySelector("[data-ep-icon]");
  const timeLabel = episode.querySelector("[data-ep-time]");
  const total = CHAPTER_SECONDS * captions.length;
  const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
  const clock = (s) => `00:${String(Math.floor(s)).padStart(2, "0")}`;

  // A waveform that looks like speech: repeatable noise, swelling and falling in phrases
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement("i");
    const n = Math.sin(i * 12.9898) * 43758.5453;
    const noise = n - Math.floor(n);
    const phrase = 0.35 + 0.65 * Math.abs(Math.sin((i / BAR_COUNT) * Math.PI * captions.length * 1.5));
    bar.style.height = `${Math.round(14 + 86 * noise * phrase)}%`;
    bars.append(bar);
  }
  const barEls = Array.from(bars.children);

  let time = 0, playing = false, onScreen = false, held = false, lastFrame = 0, shown = -1;

  function draw() {
    const index = Math.min(captions.length - 1, Math.floor(time / CHAPTER_SECONDS));
    if (index !== shown) {
      shown = index;
      captions.forEach((caption, i) => {
        caption.classList.toggle("is-on", i === index);
        // Links in a caption that isn't showing can't be reached by keyboard
        caption.querySelectorAll("a").forEach((a) => {
          if (i === index) a.removeAttribute("tabindex");
          else a.setAttribute("tabindex", "-1");
        });
      });
      chapters.forEach((chapter, i) => {
        if (i === index) chapter.setAttribute("aria-current", "true");
        else chapter.removeAttribute("aria-current");
      });
      bars.setAttribute("aria-valuetext", chapters[index].textContent);
    }
    const at = (time / total) * BAR_COUNT;
    barEls.forEach((bar, i) => {
      bar.classList.toggle("is-done", i < at);
      bar.classList.toggle("is-now", i === Math.floor(at));
    });
    bars.setAttribute("aria-valuenow", String(Math.round((time / total) * 100)));
    timeLabel.textContent = `${clock(time)} / ${clock(total)}`;
  }

  function setPlaying(on) {
    playing = on;
    episode.classList.toggle("is-playing", on);
    playButton.setAttribute("aria-label", on ? "Pause" : "Play");
    playIcon.setAttribute("d", on ? "M4 2h4v14H4zM10 2h4v14h-4z" : "M5 2l11 7-11 7z");
  }

  function tick(now) {
    const delta = Math.min(0.1, (now - lastFrame) / 1000 || 0);
    lastFrame = now;
    if (playing && onScreen && !held) {
      time += delta;
      if (time >= total) time = 0;
      draw();
    }
    requestAnimationFrame(tick);
  }

  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; }, { threshold: 0.35 }).observe(episode);

  // Hold while a keyboard user is on a link in a caption, so it can't disappear from under them
  stage.addEventListener("focusin", () => { held = true; });
  stage.addEventListener("focusout", () => { held = false; });

  playButton.addEventListener("click", () => setPlaying(!playing));
  chapters.forEach((chapter, i) => chapter.addEventListener("click", () => {
    time = i * CHAPTER_SECONDS;
    draw();
  }));

  // Scrub by click, drag or arrow keys
  function scrub(event) {
    const r = bars.getBoundingClientRect();
    time = clamp01((event.clientX - r.left) / r.width) * (total - 0.01);
    draw();
  }
  bars.addEventListener("pointerdown", (event) => {
    scrub(event);
    bars.setPointerCapture(event.pointerId);
    bars.addEventListener("pointermove", scrub);
  });
  const endScrub = () => bars.removeEventListener("pointermove", scrub);
  bars.addEventListener("pointerup", endScrub);
  bars.addEventListener("pointercancel", endScrub);
  bars.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") time = Math.min(total - 0.01, time + 2);
    else if (event.key === "ArrowLeft") time = Math.max(0, time - 2);
    else return;
    event.preventDefault();
    draw();
  });

  setPlaying(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  draw();
  requestAnimationFrame(tick);
})();
