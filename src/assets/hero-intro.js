// Home hero load-in. The ASH box slides in from the left with a motion smear, then MURRELL
// glitches in: bands of the word thrown sideways, with the colours splitting from it. It settles
// exactly on the real wordmark, which then takes over. No dependencies.
//
// The shapes and their colours come from the wordmark file, so this always matches the logo.
// While it plays, <html> has .has-intro. At the end that goes and hero-intro:done fires, and
// site.js shows the dynamic brand in its place. With reduced motion it doesn't play at all.
(() => {
  const SPLIT_LEFT = '#cc5500';  // Burnt orange
  const SPLIT_RIGHT = '#de9e3b'; // Burnt yellow

  // Timeline, in ms from the first frame
  const SLIDE_END = 480;
  const GLITCH_START = 380;
  const GLITCH_END = 1240;
  const GLITCH_STEP = 42; // How long each glitch pattern holds
  const BANDS = 11;

  const img = document.querySelector('.hero-wordmark img');
  const hero = document.querySelector('.hero');
  if (!img || !hero || !window.Path2D) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;
  root.classList.add('has-intro');

  const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
  // Progress (0–1) of t through [a, b]
  const span = (t, a, b) => clamp01((t - a) / (b - a));
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const easeExpo = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
  // Repeatable noise, so each glitch step is a fixed pattern
  const rnd = (a, b) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };

  const SKIP_EVENTS = ['click', 'keydown', 'wheel', 'touchmove'];
  let canvas = null, frame = 0, done = false;

  function finish() {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame);
    SKIP_EVENTS.forEach((e) => window.removeEventListener(e, finish));
    root.classList.remove('has-intro');
    document.dispatchEvent(new Event('hero-intro:done'));
    if (canvas) canvas.remove();
  }

  // Never hold the wordmark back for long, whatever happens below
  setTimeout(finish, GLITCH_END + 2000);

  function parse(text) {
    const svg = new DOMParser().parseFromString(text, 'image/svg+xml');
    const [vx, vy, vw] = svg.documentElement.getAttribute('viewBox').trim().split(/\s+/).map(Number);
    const rect = svg.querySelector('rect');
    const [ash, murrell] = svg.querySelectorAll('path');
    const num = (name) => Number(rect.getAttribute(name));
    const box = { x: num('x'), y: num('y'), w: num('width'), h: num('height') };

    const boxPath = new Path2D();
    if (boxPath.roundRect) boxPath.roundRect(box.x, box.y, box.w, box.h, num('rx'));
    else boxPath.rect(box.x, box.y, box.w, box.h);

    const shift = /translate\(\s*(-?[\d.]+)/.exec(murrell.getAttribute('transform') || '');
    return {
      vx, vy, vw, box, boxPath,
      boxFill: rect.getAttribute('fill'),
      ash: new Path2D(ash.getAttribute('d')),
      ashFill: ash.getAttribute('fill'),
      murrell: new Path2D(murrell.getAttribute('d')),
      murrellFill: murrell.getAttribute('fill'),
      murrellX: shift ? Number(shift[1]) : 0,
    };
  }

  function play(mark) {
    if (done) return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none';
    hero.appendChild(canvas);
    const c = canvas.getContext('2d');
    let g = null;

    // Everything is drawn in the wordmark's own units; this maps them onto the screen
    function measure() {
      const h = hero.getBoundingClientRect();
      const m = img.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(h.width * dpr), ht = Math.round(h.height * dpr);
      if (canvas.width !== w || canvas.height !== ht) {
        canvas.width = w;
        canvas.height = ht;
      }
      const scale = m.width / mark.vw;
      g = {
        dpr, scale,
        left: m.left - h.left,
        top: m.top - h.top,
        // Enough travel to start fully off the left edge
        offscreen: (m.left - h.left) / scale + mark.box.x + mark.box.w + 40,
        reach: h.width / scale,
      };
    }

    function toWordmark() {
      const s = g.dpr * g.scale;
      c.setTransform(s, 0, 0, s, g.dpr * g.left - mark.vx * s, g.dpr * g.top - mark.vy * s);
    }

    function drawBox(x, alpha) {
      c.save();
      c.translate(x, 0);
      c.globalAlpha = alpha;
      c.fillStyle = mark.boxFill;
      c.fill(mark.boxPath);
      c.fillStyle = mark.ashFill;
      c.fill(mark.ash);
      c.restore();
    }

    // The box, smeared along dx by drawing it again and again down its path: motion blur
    function slideBox(x, dx) {
      const moved = Math.abs(dx);
      if (moved < 1) return drawBox(x, 1);
      const n = Math.min(26, 6 + Math.round(moved / 14));
      const trail = Math.min(1, 2.4 / n + 0.03);
      for (let i = 0; i < n; i++) drawBox(x - dx * (i / (n - 1)), trail);
      drawBox(x, 0.85);
    }

    function drawMurrell(x, color, alpha) {
      c.save();
      c.translate(x + mark.murrellX, 0);
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.fill(mark.murrell);
      c.restore();
    }

    function glitchMurrell(t) {
      if (t < GLITCH_START) return;
      if (t >= GLITCH_END) return drawMurrell(0, mark.murrellFill, 1);

      const p = span(t, GLITCH_START, GLITCH_END);
      const calm = 1 - easeOut(p); // The throw and the split die down as it settles
      const step = Math.floor(t / GLITCH_STEP);
      const top = mark.box.y, bandH = mark.box.h / BANDS;
      const split = 3 + 20 * calm;

      for (let i = 0; i < BANDS; i++) {
        if (rnd(i + 0.5, step * 1.3) > 0.3 + p) continue; // More of the word holds as it goes
        const throwBy = (rnd(i, step) - 0.5) * mark.vw * 0.12 * (rnd(step, i) > 0.42 ? 1 : 0.08) * calm;
        c.save();
        c.beginPath();
        c.rect(mark.vx - g.reach, top + i * bandH, g.reach * 3, bandH + 0.5);
        c.clip();
        c.globalCompositeOperation = 'lighter';
        drawMurrell(throwBy - split, SPLIT_LEFT, 1);
        drawMurrell(throwBy + split, SPLIT_RIGHT, 1);
        c.globalCompositeOperation = 'source-over';
        drawMurrell(throwBy, mark.murrellFill, 0.82 + 0.18 * p);
        c.restore();
      }
    }

    let start = 0;
    function tick(now) {
      if (done) return;
      frame = requestAnimationFrame(tick);
      if (!start) start = now;
      const t = now - start;

      measure();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, canvas.width, canvas.height);
      toWordmark();

      const rest = 1 - easeExpo(span(t, 0, SLIDE_END));
      slideBox(-rest * g.offscreen, rest * mark.vw * 0.34);
      glitchMurrell(t);

      if (t >= GLITCH_END) finish();
    }
    frame = requestAnimationFrame(tick);

    // Skip to the finished hero. Wait a beat, so the click that loaded the page doesn't end it.
    setTimeout(() => {
      if (!done) SKIP_EVENTS.forEach((e) => window.addEventListener(e, finish, { passive: true }));
    }, 250);
  }

  fetch(img.currentSrc || img.src)
    .then((response) => {
      if (!response.ok) throw new Error('Wordmark not available');
      return response.text();
    })
    .then((text) => play(parse(text)))
    .catch(finish);
})();
