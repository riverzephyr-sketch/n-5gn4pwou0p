(() => {
"use strict";
// the ending's passcode: after two wrong tries in a row this one line fades in above the dots (Helios writes it; one line to change)
const HINT_TEXT = "这都不知道？？？";
const C = window.CONTENT, M = window.MAP_DATA;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const el = (t, cls, html) => { const e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const pad2 = n => String(n).padStart(2, "0");
const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const SHOW = !!C.showTodo;
const MO = {}; // hooks shared with the motion block below
const GROUPS = {};
// photos already placed on the main page (hero + the four rolls). anything else reuses none of them.
const USED = new Set([C.hero && C.hero.print, ...C.chapters.flatMap(c => c.items.flatMap(m => [m.photo, ...(m.scans || [])]))].filter(Boolean));
const isTodo = s => !s || /待填写/.test(s);
// no single-character last line: the last two characters (plus any closing punctuation) never split, e.g. 他的 / 生日
const nobr = s => { s = String(s); const m = s.match(/[^\s。，、！？」』）.,!?]{2}[。，、！？」』）.,!?]*$/u); return m ? esc(s.slice(0, m.index)) + `<span class="nw">${esc(m[0])}</span>` : esc(s); };
// placeholder text: hidden unless showTodo
const txt = s => isTodo(s) ? (SHOW ? '<span class="todo">待填写</span>' : "") : esc(s);
if (SHOW) document.body.classList.add("show-todo");

/* ---------- fine-line marks (only two: a hairline X and a thin circle) ---------- */
const MARK = {
  x: '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path pathLength="1" d="M8 8 L92 92"/><path pathLength="1" d="M92 8 L8 92" style="transition-delay:.25s"/></svg>',
  circle: '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><ellipse pathLength="1" cx="50" cy="50" rx="48" ry="48" transform="rotate(-100 50 50)"/></svg>',
};
const redraw = e => { e.classList.remove("in"); void e.getBoundingClientRect(); requestAnimationFrame(() => requestAnimationFrame(() => e.classList.add("in"))); };
const screenLen = p => { try { const m = p.getScreenCTM(), L = p.getTotalLength(), n = 24; if (!m || !L) return 0; let s = 0, prev = null;
  for (let i = 0; i <= n; i++) { const q = p.getPointAtLength(L * i / n).matrixTransform(m); if (prev) s += Math.hypot(q.x - prev.x, q.y - prev.y); prev = q; } return Math.ceil(s * 1.08) + 2; } catch (e) { return 0; } };

const SIZES = window.PHOTO_SIZES || {};
// <img> with intrinsic size (no layout shift), lazy unless told otherwise, alt from context
const img = (src, alt = "", eager = false) => { const [w, h] = SIZES[src] || [1200, 1600];
  return `<img src="${src}" width="${w}" height="${h}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`; };
// a sheet of perforated postage stamps held by a binder clip (the envelope screen's stamp sheet, reused in two more places).
// cells: [{ src, pos, zoom } | { note: [lines] }]; cols: stamps per row
const stampSheet = (cells, cols, cls = "") => `<figure class="stampsheet ${cls}" style="--cols:${cols}"><div class="ss-grid">${cells.map(c => c.src
    ? `<div class="pstamp"><div class="pstamp-in">${img(c.src, c.alt || "")}</div></div>`.replace("<img ", `<img style="object-position:${c.pos || "50% 50%"};${c.zoom ? `transform:scale(${c.zoom})` : ""}" `)
    : `<div class="pstamp note"><div class="pstamp-in">${c.note.map(t => `<span>${esc(t)}</span>`).join("")}</div></div>`).join("")}</div><img class="ss-clip" src="assets/clip.webp" width="120" height="225" alt="" loading="lazy"></figure>`;
const photoBox = (src, hint, dark, alt = "", eager = false) => {
  const d = el("div", "ph" + (src ? "" : " empty") + (dark ? " dark" : ""));
  d.innerHTML = src ? img(src, alt, eager) : (SHOW && hint ? `<code>${hint}</code>` : "");
  return d;
};
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- TYPE LOCKUPS (CN + EN) ---------- */
const lines = (arr, cls) => (arr || []).map((t, i) => `<span class="${cls} ${cls}${i + 1}">${esc(t)}</span>`).join("");
$$("[data-lk]").forEach(e => { const t = C.titles[e.dataset.lk]; if (!t) return;
  e.insertAdjacentHTML("beforeend", `${lines(t.cn, "c")}<span class="en">${lines(t.en, "e")}</span>`); });
// English + numerals are the display layer; the Chinese title sits under it, smaller and lighter
// the ending keeps its original lockup ("下一章 / NEXT / chapter")
const OLD_LK = { finale: 1 };
const CHAPTER = { jianghu: 1, hotel: 2, chapters: 3, map: 4 };
$$("[data-lk]").forEach(e => { const k = e.dataset.lk, n = CHAPTER[k];
  if (n) e.insertAdjacentHTML("afterbegin", `<span class="kick">Chapter ${pad2(n)}</span>`);
  if (OLD_LK[k]) { e.classList.add("lk-old"); return; }
  if (k !== "jianghu") { e.classList.add("lk-en"); const cs = [...e.querySelectorAll(":scope > .c")];
    if (cs.length) { const row = el("span", "cn-row"); cs[0].before(row); row.append(...cs); } } });
$$(".lk-jianghu .c").forEach(c => { c.innerHTML = [...c.textContent].map(ch => `<span class="ch">${esc(ch)}</span>`).join(""); });
const paren = arr => arr && arr.length ? `<span class="paren"><b>(</b><span>${arr.map((t, i) => i ? esc(t) : `<i>${esc(t)}</i>`).join("<br>")}</span><b>)</b></span>` : "";
const hairIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); hairIO.unobserve(e.target); } }), { threshold: .35 });


/* ---------- HERO ---------- */
const H = C.hero;
$("#heroSub").textContent = H.subtitle;
const placeById = Object.fromEntries(C.places.map(p => [p.id, p]));
const dms = (v, pos, neg) => { const a = Math.abs(v), d = Math.floor(a), m = Math.round((a - d) * 60); return `${v >= 0 ? pos : neg} ${d}°${pad2(m === 60 ? 59 : m)}′`; };
const geo = p => p && p.lat != null ? `${dms(p.lat, "N", "S")} · ${dms(p.lon, "E", "W")}` : "";
const stopPhotos = s => s.photos && s.photos.length ? s.photos : (s.photo ? [s.photo] : []);
const photoStops = C.stops.filter(s => stopPhotos(s).length && !s.tall && !s.photoNotes).map(s => ({ ...s, photo: stopPhotos(s)[0] }));
if (H.print) $("#heroPrint").innerHTML = img(H.print, "", true); else $("#heroPrint").remove();
$("#heroVol").textContent = H.vol || "";

/* ---------- the page always opens at its top (WeChat / WebKit may restore an old scroll offset on reopen) ---------- */
if (!location.hash) { try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
  let touched = false; const mark = () => { touched = true; };
  ["touchstart", "wheel", "keydown", "mousedown"].forEach(t => addEventListener(t, mark, { once: true, passive: true }));
  const toTop = () => { if (!touched && !document.documentElement.classList.contains("secret-open") && scrollY > 0) scrollTo(0, 0); };
  toTop(); addEventListener("load", toTop); addEventListener("pageshow", toTop); [300, 900, 1800].forEach(t => setTimeout(toTop, t)); }
/* ---------- LOADER (first visit): the hero print develops on the paper, then glides into its place ---------- */
(() => { const html = document.documentElement; if (!html.classList.contains("ld-show")) return;
  const ld = $("#ld"), pr = $("#heroPrint"), real = pr && pr.querySelector("img");
  let ended = false;
  const end = () => { if (ended) return; ended = true; clearTimeout(window.__ldKill);
    html.classList.remove("ld", "ld-fly"); if (pr) { pr.style.transform = ""; pr.style.zIndex = ""; }
    if (ld) ld.style.opacity = 0; setTimeout(() => { html.classList.remove("ld-show"); }, 900); window.__ldDone && window.__ldDone(); };
  try {
    clearTimeout(window.__ldKill); window.__ldKill = setTimeout(end, 9000);   // never longer than that, whatever happens
    if (!pr || !real || !ld) return end();
    scrollTo(0, 0);
    const MIN = 1200, MAX = 8000, DEV = 1500;
    const m = (getComputedStyle(pr).transform.match(/matrix\(([^)]+)\)/) || [0, "1,0"])[1].split(",").map(Number);
    const ang = +(Math.atan2(m[1], m[0]) * 180 / Math.PI).toFixed(3);   // the hero's own tilt, read from its CSS
    pr.style.transform = "none"; const b = pr.getBoundingClientRect(); pr.style.transform = "";
    const dx = innerWidth / 2 - (b.left + b.width / 2), dy = innerHeight * .47 - (b.top + b.height / 2);
    let pale, haze, dev;
    if (!reduced) {
      pr.style.transform = `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) rotate(-1.6deg)`;
      dev = document.createElement("div"); dev.className = "ld-dev"; dev.setAttribute("aria-hidden", "true");
      dev.innerHTML = `<img src="${real.getAttribute("src")}" alt=""><i></i>`; pr.appendChild(dev);
      pale = dev.querySelector("img"); haze = dev.querySelector("i");
    }
    const waitImg = el => !el ? 0 : el.complete ? (el.decode ? el.decode().catch(() => {}) : 0) : new Promise(r => { el.addEventListener("load", r, { once: true }); el.addEventListener("error", r, { once: true }); });
    const t0 = performance.now(); let ready = false;
    Promise.race([Promise.all([document.fonts ? document.fonts.ready : 0, waitImg(real), waitImg($("#tag img"))]), new Promise(r => setTimeout(r, MAX))])
      .then(() => { ready = true; }, () => { ready = true; });
    if (reduced) {   // a plain crossfade: the print is already in its place, the paper lifts
      const go = () => { if (!ready || performance.now() - t0 < MIN) return setTimeout(go, 60); end(); };
      return go();
    }
    const clamp = v => Math.max(0, Math.min(1, v)), sm = (a, c, x) => { const t = clamp((x - a) / (c - a)); return t * t * (3 - 2 * t); };
    let p = 0, last = t0;
    const fly = () => { try {
      if (ended) return;
      dev.remove(); pr.style.zIndex = 8; html.classList.add("ld-fly"); void pr.offsetWidth;
      pr.style.transform = `translate(0px,0px) rotate(${ang}deg)`;   // = its CSS rotate: the landing is the same pixels
      setTimeout(() => { ld.style.opacity = 0; html.classList.remove("ld"); }, 180);
      pr.addEventListener("transitionend", e => { if (e.propertyName === "transform") end(); });
      setTimeout(end, 1150);
    } catch (e) { end(); } };
    const frame = now => { try {
      if (ended) return;
      p = Math.min(ready ? 1 : .3, p + Math.max(0, now - last) / DEV); last = now;   // holds half-developed until the photo itself has loaded
      haze.style.opacity = (1 - sm(.02, .6, p)).toFixed(3);
      pale.style.opacity = (1 - sm(.32, 1, p)).toFixed(3);
      if (p < 1 || now - t0 < MIN) return requestAnimationFrame(frame);
      setTimeout(fly, 260);
    } catch (e) { end(); } };
    requestAnimationFrame(frame);
  } catch (e) { end(); }
})();
const start = new Date(C.startDate).getTime(), TARGET = 1461;
// before the day itself (2026.10.30, Beijing time) the small counter counts down to it ("还有 3 天 06时31分20秒");
// from that midnight on it is the plain count since 2022.10.30 (1461 on the day)
const ANNIV = new Date("2026-10-30T00:00:00+08:00").getTime();
const counterNow = () => { const now = Date.now(), ahead = now < ANNIV; let ms = ahead ? ANNIV - now : Math.max(0, now - start);
  const d = Math.floor(ms / 864e5); ms -= d * 864e5; const h = Math.floor(ms / 36e5); ms -= h * 36e5; const m = Math.floor(ms / 6e4); ms -= m * 6e4;
  return { ahead, d, h, m, s: Math.floor(ms / 1e3) }; };
function tick() {
  const c = counterNow(), tc = $("#tCount");
  tc.classList.toggle("ahead", c.ahead); $("#cPre").hidden = !c.ahead;
  tc.classList.toggle("no-days", c.ahead && c.d === 0);   // the last day: only the hours are left
  if (!MO.counting) $("#cDays").textContent = c.d.toLocaleString("en-US");
  $("#cH").textContent = pad2(c.h); $("#cM").textContent = pad2(c.m); $("#cS").textContent = pad2(c.s);
}
tick(); setInterval(tick, 1000);
/* ---------- SCROLL CUE (hero): comes in once the intro has settled, leaves for good after a little scroll ---------- */
const scue = (() => { const el = $("#scue"); if (!el) return () => {};
  let done = false; const gone = () => { if (done) return; done = true; el.classList.add("gone"); removeEventListener("scroll", onS); };
  const onS = () => { if (scrollY > 24) gone(); };
  addEventListener("scroll", onS, { passive: true });
  const show = () => { if (done) return; if (scrollY > 24) return gone(); el.classList.add("in"); };
  setTimeout(show, 9000);   // safety: if the intro never runs, it still comes in
  return show; })();

/* ---------- MUSIC ---------- */
const MU = C.music, mini = $("#mini");
let audio = $("#song");
const WX = /MicroMessenger/i.test(navigator.userAgent || "");
audio.setAttribute("playsinline", "");
audio.setAttribute("webkit-playsinline", "true");
audio.preload = "none";   // the song (3.8 MB) waits: the first screen loads first
addEventListener("load", () => setTimeout(() => { if (audio.preload === "none") audio.preload = "auto"; }, 4000), { once: true });
if (MU.src) audio.src = MU.src;
// two versions take turns: when one ends the other starts on the same element (its gain and the tap that unlocked it carry over)
const PL = (MU.playlist || []).filter(Boolean); let plI = 0;
if (PL.length > 1) { audio.loop = false; audio.removeAttribute("loop"); const song = audio;
  song.addEventListener("ended", () => { if (song.dataset.track === "finale") return; plI = (plI + 1) % PL.length; song.src = PL[plI]; if (playing && audio === song) song.play().catch(() => {}); }); }
let songName = isTodo(MU.title) ? "Side A" : MU.title;
const promptZh = (MU.prompt || "").replace(/^▶\s*/, "");
// until the first tap the label beside the record says what it does (and her line, small, under it); after that it is the song title
let fresh = true;
let playing = false, ctx = null, gain = null, fadeT = null;
function setMini() { const t = $("#miniTxt");
  if (fresh) t.innerHTML = `<span class="mt-en">Tap to play ▸</span>${promptZh ? `<span class="mt-zh">${esc(promptZh)}</span>` : ""}`;
  else if (!playing && audio.dataset.blocked) t.innerHTML = `<span class="mt-en">Tap to play ▸</span><span class="mt-zh">${esc(songName)}</span>`;   // the browser refused to start it: wait quietly for a tap
  else t.textContent = songName; mini.classList.toggle("on", playing);
  // the ending covers the page (and the chip): if its song was refused, the chip comes up over it so one tap starts it
  mini.classList.toggle("up", !playing && audio.dataset.track === "finale" && !!audio.dataset.blocked); }
// a fade on one element (iOS ignores element.volume, so over http the level goes through a Web Audio gain)
function fadeEl(a, g, v, dur, done, own) {
  if (g) { const t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(v, t + dur / 1000); if (done) setTimeout(done, dur); return; }
  const from = a.volume, t0 = performance.now();
  const id = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / dur); a.volume = from + (v - from) * k; if (k >= 1) { clearInterval(id); done && done(); } }, 40);
  if (own) fadeT = id;
}
function fadeTo(v, dur, done) { clearInterval(fadeT); fadeEl(audio, gain, v, dur, done, true); }
// one gain per <audio>, all on one context (created inside a tap)
const GAINS = new Map();
function graph(a) {
  if (WX) return null;   // WeChat goes silent once the element is pulled into Web Audio
  if (!ctx && location.protocol.startsWith("http") && (window.AudioContext || window.webkitAudioContext)) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } }
  if (ctx && !GAINS.has(a)) { try { const src = ctx.createMediaElementSource(a), g = ctx.createGain(); g.gain.value = 0; src.connect(g).connect(ctx.destination); GAINS.set(a, g); } catch (e) { GAINS.set(a, null); } }
  return (ctx && GAINS.get(a)) || null;
}
function play() {
  if (fresh) { fresh = false; mini.classList.remove("fresh"); }
  if (!audio.src) audio.src = MU.src;
  gain = graph(audio);
  if (ctx && ctx.state === "suspended") ctx.resume();
  const target = audio === $("#song") ? (MU.volume ?? .7) : (FM.volume ?? .7);
  if (!gain) audio.volume = WX ? target : 0;   // a volume of 0 latches mute inside WeChat
  const p = audio.play();
  playing = true; audio.dataset.started = 1; document.body.classList.add("playing"); setMini();
  if (!WX) fadeTo(target, 2600);
  delete audio.dataset.blocked; const me = audio;
  const fail = () => { if (audio !== me) return; playing = false; me.dataset.blocked = 1; document.body.classList.remove("playing"); try { me.pause(); } catch (e) {} setMini(); };
  if (p && p.catch) p.catch(fail);
  const again = () => { if (audio !== me) return; me.play().then(() => { delete me.dataset.blocked; playing = true; document.body.classList.add("playing"); setMini(); }).catch(fail); };
  if (WX && window.WeixinJSBridge && WeixinJSBridge.invoke) { try { WeixinJSBridge.invoke("getNetworkType", {}, again); } catch (e) {} }
  else if (WX) document.addEventListener("WeixinJSBridgeReady", () => { try { WeixinJSBridge.invoke("getNetworkType", {}, again); } catch (e) {} }, { once: true });
  const t0 = me.currentTime || 0;
  setTimeout(() => { if (audio !== me || !playing) return; if (!me.paused && (me.currentTime > t0 + 0.02 || me.readyState >= 2)) return; fail(); }, 2200);
}
function pause() { playing = false; document.body.classList.remove("playing"); setMini(); fadeTo(0, 600, () => { if (!playing) audio.pause(); }); }
// the ending's song: when the passcode is accepted the music always becomes Aimer「ポラリス」, whatever was on before (or nothing).
// called synchronously inside the tap that completes the code (a user gesture, so iOS / WeChat let play() through).
const FM = (C.finale && C.finale.music) || {};
function toFinaleSong() {
  if (!FM.src) return false;                    // no Polaris file in audio/ yet: the music is left as it is
  if (audio.dataset.track === "finale") { if (!playing) play(); return true; }
  const old = audio, oldGain = gain, wasOn = playing && !old.paused;
  // the current track fades out and stops (a second element, so the new one can start inside this same tap)
  if (wasOn) { clearInterval(fadeT); fadeEl(old, oldGain, 0, 900, () => { old.pause(); }); } else old.pause();
  const a = new Audio(); a.loop = true; a.preload = "auto"; a.setAttribute("playsinline", ""); a.dataset.track = "finale"; a.src = FM.src;
  audio = a; songName = [FM.title, FM.artist].filter(Boolean).join(" · ") || "Polaris"; fresh = false; mini.classList.remove("fresh");
  play();
  // if WebKit still refuses, WeChat's bridge usually lets media start once it is ready; otherwise the chip quietly waits for a tap
  const retry = () => { if (!playing && audio === a) a.play().then(() => { delete a.dataset.blocked; playing = true; document.body.classList.add("playing"); setMini(); fadeTo(FM.volume ?? .7, 2600); }).catch(() => {}); };
  if (window.WeixinJSBridge && WeixinJSBridge.invoke) setTimeout(() => { try { WeixinJSBridge.invoke("getNetworkType", {}, retry); } catch (e) {} }, 60);
  else document.addEventListener("WeixinJSBridgeReady", retry, { once: true });
  mini.classList.add("show"); peek();
  return true;
}
// the player rests as a small record; a tap opens it to show the song for a moment, then it folds back
let miniT = 0; const peek = () => { mini.classList.add("open"); clearTimeout(miniT); miniT = setTimeout(() => mini.classList.remove("open"), 2600); };
const toggle = () => { playing ? pause() : play(); peek(); };
mini.addEventListener("click", toggle);
// 江湖: the cover of the song he shared is a quiet play / pause for the music on this page
setMini();
// the player is visible from the first screen on
requestAnimationFrame(() => mini.classList.add("show"));
// keep the chip off the words: if text, a photo or a button sits under its resting spot, it tucks into the edge
{ const MEDIA = /^(IMG|BUTTON|A|VIDEO|CANVAS|svg|INPUT)$/, CTRL = "button:not(#mini),a[href],input,[role=button],#envelope";
  const hero = $("#hero");
  const under = () => { if (!mini.classList.contains("show")) return false;
    // on the first screen it always stays out in full (the hero is laid out to keep that corner clear)
    if (hero && hero.getBoundingClientRect().bottom >= innerHeight - 4) return false;
    // test the full (unfolded) footprint, so folding to the record alone never flips it back
    const R = mini.offsetLeft + mini.offsetWidth + 6, L = R - 175, B = mini.offsetTop + mini.offsetHeight + 6, T = B - 50;
    const hit = q => q.width && q.left < R && q.right > L && q.top < B && q.bottom > T;
    // anything tappable under it (map stops, keypad, key cards, the cover…): checked by its box, not by sample points
    let u = 0;
    for (const e of document.querySelectorAll(CTRL)) { const q = e.getBoundingClientRect(); if (!hit(q) || e.closest(".secret,.viewer,.sheet")) continue;
      const cs = getComputedStyle(e); if (cs.visibility === "hidden") continue;
      // right under the record itself: the record steps aside for a moment so the control stays tappable
      if (q.left < R && q.right > R - 52 && q.top < B && q.bottom > B - 50) return 2;
      u = 1; }
    if (u) return 1;
    const seen = new Set();
    const pts = []; for (const fx of [.05, .28, .5, .72, .95]) for (const fy of [.05, .28, .5, .72, .95]) pts.push([L + (R - L) * fx, T + (B - T) * fy]);
    for (const [x, y] of pts) {
      if (!document.elementsFromPoint) break;
      for (const e of document.elementsFromPoint(x, y)) { if (e === mini || mini.contains(e) || seen.has(e)) continue; seen.add(e);
        const cs = getComputedStyle(e); if (cs.visibility === "hidden" || +cs.opacity < .1) continue;
        if (MEDIA.test(e.tagName)) return true;
        for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { const rg = document.createRange(); rg.selectNodeContents(n);
          for (const q of rg.getClientRects()) if (hit(q)) return true; } } }
    return false; };
  let raf = 0; const check = () => { raf = 0; const u = under(); mini.classList.toggle("tuck", !!u); mini.classList.toggle("yield", u === 2); };
  const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
  addEventListener("scroll", queue, { passive: true }); addEventListener("resize", queue);
  // things also slide in after the scroll stops (GSAP reveals), so look again every so often while it is visible
  setInterval(() => { if (mini.classList.contains("show") && !document.hidden) queue(); }, 600);
  new MutationObserver(queue).observe(mini, { attributes: true, attributeFilter: ["class"] }); }


/* ---------- THE DATE: 29 · 30 · 31, the 30th circled ---------- */
{ const K = C.calendar || {}, day = new Date(K.date || "2026-10-30T00:00:00+08:00");
  $("#calScript").textContent = K.script || "";
  const cap = c => `<figcaption>${(c || []).map((t, i) => `<span class="${i ? "c" : "d"}">${esc(t)}</span>`).join("")}</figcaption>`;
  const P = K.pages && K.pages.length ? K.pages : null;
  if (!P) { $("#calSince").textContent = K.since || "";
    $("#calLine").textContent = day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Shanghai" });
    if (K.print) $("#calPrint").innerHTML = img(K.print, "") + cap(K.printCaption); else $("#calPrint").remove(); }
  else {
    // one page per anniversary: the weekdays over 29 · 30 · 31, the year under OCT, the line and the print turn together.
    // it turns by itself once (~2.8s a page) and rests on the last; tap the calendar or a dot to step. reduced motion: the last page, still.
    const sec = $("#calendar"), strip = $("#calStrip"), wds = $$("#calStrip .wd"), pr = $("#calPrint"), line = $("#calLine");
    const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dots = el("p", "cal-dots"); dots.setAttribute("aria-label", "Anniversaries"); line.after(dots);
    P.forEach((pg, k) => { const b = el("button", "", "<i></i>"); b.type = "button"; b.setAttribute("aria-label", pg.date.slice(0, 4)); b.onclick = e => { e.stopPropagation(); stop(); go(k); }; dots.append(b); });
    P.forEach(pg => { if (pg.print) { const im = new Image(); im.src = pg.print; } });   // the photo is ready before its page turns
    let cur = -1, timer = 0, swapT = 0;
    const paint = k => { const pg = P[k], [y, m, d] = pg.date.split("-").map(Number), base = new Date(Date.UTC(y, m - 1, d));
      wds.forEach((w, j) => { (w.querySelector(".wt") || w).textContent = WD[(base.getUTCDay() + j - 1 + 7) % 7]; });   // only the word; the rule under it stays put
      $("#calSince").textContent = `${y}.${pad2(m)}.${pad2(d)}`;
      line.textContent = `${WD[base.getUTCDay()]}, October ${d}, ${y}`;
      strip.setAttribute("aria-label", `${y}.${pad2(m)}.${pad2(d)}`);
      pr.classList.toggle("undev", !pg.print);
      pr.innerHTML = (pg.print ? img(pg.print, "", true) : '<div class="haze" aria-hidden="true"></div>') + cap(pg.caption);
      [...dots.children].forEach((b, j) => b.setAttribute("aria-pressed", j === k ? "true" : "false")); };
    const go = k => { k = (k + P.length) % P.length; if (k === cur) return; const first = cur < 0; cur = k;
      if (first || reduced) { paint(k); return; }
      clearTimeout(swapT); sec.classList.add("cal-out"); swapT = setTimeout(() => { paint(k); sec.classList.remove("cal-out"); }, 260); };
    const stop = () => { clearInterval(timer); timer = 0; };
    if (reduced) go(P.length - 1);
    else { go(0);
      if ("IntersectionObserver" in window) { const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.disconnect();
          timer = setInterval(() => { if (cur >= P.length - 1) return stop(); go(cur + 1); if (cur >= P.length - 1) stop(); }, 2800); }), { threshold: .45 });
        io.observe($(".cal-beat")); }
      else go(P.length - 1); }
    $(".cal-beat").addEventListener("click", () => { stop(); go(cur + 1); });
  }
  hairIO.observe($(".cal-ring")); }

/* ---------- THE RED LINE: built once the page is laid out (see SPINE below) ---------- */

/* ---------- JIANGHU ---------- */
const J = C.jianghu;
// a typographic collage of the real names only: 方 / 保护我方姐姐 / 晚来天欲雪 / 《天涯明月刀手游》
$("#jhSr").textContent = `《${J.game}》 ${J.guild} · ${J.me} · ${J.him} · ${J.himWechat || ""} · ${J.quietSong} · ${J.meWechat || ""}：${J.quiet}`;
$("#jhGame").textContent = `《${J.game}》`; $("#jhGuild").textContent = J.guild; $("#jhMe").textContent = J.me; $("#jhHim").textContent = J.him;
{ const at = $("#aimer"); (J.aimerTitles || []).forEach((t, i) => at.append(el("li", "at at" + (i + 1) + (t === "Polaris" ? " hi" : "") + (/[\u3040-\u30ff\u4e00-\u9fff]/.test(t) ? " jp" : ""), esc(t)))); }
$("#jhWho").textContent = J.himWechat || ""; $("#jhMeW").textContent = J.meWechat || ""; $("#jhQuiet").textContent = J.quiet || "";
// the shared song: "Artist · Title" (the colon in Ref:rain kept legible)
{ const sp = (J.quietSong || "").split(/\s*·\s*/), artist = sp.length > 1 ? sp[0] : "", title = sp.length > 1 ? sp.slice(1).join(" · ") : sp[0];
  $("#jhTitle").innerHTML = esc(title).replace(":", '<span class="cl">:</span>'); $("#jhArtist").textContent = artist; }
// 北京 → 重庆: the trip that turned the game into the world
{ const byName = n => C.places.find(p => p.name === n) || {};
  $("#jhFrom").textContent = J.from; $("#jhTo").textContent = J.to; $("#jhFromEn").textContent = byName(J.from).en || ""; $("#jhToEn").textContent = byName(J.to).en || ""; }
// the wardrobe: their couple outfits in the game, as a stop-motion. ~1s per outfit, a hard cut (no crossfade:
// the pose is the same in every frame, so a cut reads as the clothes changing; a fade would ghost two outfits together).
// swipe / drag / ← → flips by hand and pauses the auto-play for a while. reduced motion: frame 1, by hand only.
(() => { const WD = J.wardrobe, fig = $("#wardrobe"); if (!WD || !WD.count || !fig) return;
  const N = WD.count, pre = "m", st = $("#wdStack"), out = $("#wdN");
  const src = i => `${WD.dir}/${pre}${pad2(i + 1)}.webp`, ims = [], ready = [];
  fig.hidden = false; fig.tabIndex = 0; fig.setAttribute("role", "img"); fig.setAttribute("aria-label", `《${J.game}》 · ${N}`);
  let cur = 0, timer = 0, holdT = 0, visible = false, held = false;
  const show = i => { i = (i + N) % N; if (!ready[i]) return false; if (ims[cur]) ims[cur].classList.remove("on"); cur = i; ims[cur].classList.add("on");
    out.textContent = `${pad2(cur + 1)} / ${pad2(N)}`; return true; };
  const next = () => { for (let k = 1; k <= N; k++) if (ready[(cur + k) % N]) { show(cur + k); return; } };
  for (let i = 0; i < N; i++) { const im = new Image(); im.alt = ""; im.decoding = "async"; im.draggable = false; ims.push(im); st.append(im); }
  const load = i => new Promise(r => { const im = ims[i]; if (ready[i]) return r(); im.onload = () => { ready[i] = true; (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(r); }; im.onerror = r; im.src = src(i); });
  let started = false; const start = () => { if (started) return; started = true;
    load(0).then(() => { show(0); let i = 1; const go = () => { if (i < N) load(i++).then(go); }; go(); }); };
  const play = () => { clearInterval(timer); if (reduced || held || !visible) return; timer = setInterval(next, 1000); };
  const hold = () => { held = true; clearInterval(timer); clearTimeout(holdT); holdT = setTimeout(() => { held = false; play(); }, 4000); };
  out.textContent = `01 / ${pad2(N)}`;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) start(); }), { rootMargin: "600px 0px" }).observe(fig);
    new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; play(); }), { threshold: .4 }).observe(fig);
  } else { start(); visible = true; play(); }
  // drag to flip: every ~26px of horizontal travel is one outfit
  let px = null, acc = 0;
  fig.addEventListener("pointerdown", e => { px = e.clientX; acc = 0; hold(); });
  fig.addEventListener("pointermove", e => { if (px === null) return; acc += e.clientX - px; px = e.clientX;
    while (Math.abs(acc) >= 26) { show(cur + (acc < 0 ? 1 : -1)); acc += acc < 0 ? 26 : -26; } });
  const up = () => { px = null; }; fig.addEventListener("pointerup", up); fig.addEventListener("pointercancel", up); fig.addEventListener("pointerleave", up);
  fig.addEventListener("keydown", e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); hold(); show(cur + (e.key === "ArrowRight" ? 1 : -1)); } });
})();
(() => { // faint snow — 晚来天欲雪
  const cv = $("#snow"), g = cv.getContext("2d"), sec = $("#jianghu");
  Object.assign(cv.style, { position: "absolute", left: "0", top: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "0" }); let W, Hh, flakes = [], on = false, raf;
  const size = () => { const dpr = Math.min(2, devicePixelRatio || 1); W = sec.clientWidth; Hh = Math.min(sec.clientHeight, 1400); cv.width = W * dpr; cv.height = Hh * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const mk = y => ({ x: Math.random() * W, y: y ?? Math.random() * Hh, r: .6 + Math.random() * 1.6, v: .2 + Math.random() * .4, w: Math.random() * 6.28, a: .18 + Math.random() * .3 });
  const loop = () => { g.clearRect(0, 0, W, Hh); flakes.forEach(f => { f.y += f.v; f.w += .01; f.x += Math.sin(f.w) * .25; if (f.y > Hh + 4) Object.assign(f, mk(-4));
    g.beginPath(); g.arc(f.x, f.y, f.r, 0, 6.28); g.fillStyle = `rgba(120,108,98,${f.a * .45})`; g.fill(); }); if (on) raf = requestAnimationFrame(loop); };
  if (reduced) return;  // no snow when reduced motion is requested
  size(); flakes = Array.from({ length: 22 }, () => mk()); addEventListener("resize", size);
  new IntersectionObserver(es => es.forEach(e => { on = e.isIntersecting; cancelAnimationFrame(raf); if (on) { size(); loop(); } })).observe(sec);
})();

/* ---------- HOTEL ---------- */
const HT = C.hotel;
$("#hLabel").textContent = "( " + HT.label + " )"; $("#scoreLab").textContent = HT.scoreLabel || "";
// two hotel key cards, type only: the wrong one gets a fine red strike, the right one is the wine-red card
const card = (o, kind) => {
  const b = el("button", `hcard key ${kind}`);
  b.innerHTML = `<span class="key-n"><span class="nm">${esc(o.name)}</span></span><i class="key-rule"></i><i class="key-logo" role="img" aria-label="${esc(o.en)}"></i>`;
  return b;
};
const wrongC = card(HT.wrong, "wrong"), rightC = card(HT.right, "right");
$("#hotels").append(wrongC, rightC);
const stamp = el("span", "stamp", esc(HT.stamp || "扣分")); wrongC.append(stamp);
const qParts = HT.quoteLines || (HT.quote.match(/[^，！。？]+[，！。？]?/g) || [HT.quote]);
const qRed = HT.quoteRed || qParts[3];
$("#then").innerHTML = `<span class="qm o">“</span>${qParts.map((t, i) => `<span class="l l${i + 1}${t === qRed ? " red" : ""}">${esc(t)}</span>`).join("")}<span class="qm c">”</span><span class="pen">${(HT.quoteEn || []).map(esc).join("<br>")}</span>`;
// the quote shows as it comes into view (not hidden behind a tap)
{ const th = $("#then"); if ("IntersectionObserver" in window) { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { th.classList.add("show"); io.disconnect(); } }), { threshold: .2 }); io.observe(th); } else th.classList.add("show"); }
let score = HT.startScore; const hist = [];
const scoreWrap = $("#score").parentElement;
function setScore(v) {
  hist.push(score); score = Math.max(0, v);
  $("#score").textContent = score;
  $("#scoreHist").innerHTML = hist.slice(-3).map(n => `<s>${n}</s>`).join("");
  scoreWrap.classList.remove("hit"); void scoreWrap.offsetWidth; scoreWrap.classList.add("hit");
}
function float(c, t) { const f = el("span", "minus", t); c.append(f); setTimeout(() => f.remove(), 1300); }
wrongC.addEventListener("click", () => {
  if (navigator.vibrate) navigator.vibrate(40);
  stamp.classList.remove("go"); void stamp.offsetWidth; stamp.classList.add("go");
  if (score > 0) { setScore(score - 20); float(wrongC, "−20"); }
  $("#then").classList.add("show");
});
rightC.addEventListener("click", () => {
  if (score < HT.startScore) { setScore(score + 1); float(rightC, "+1"); }
});

/* ---------- MAP ---------- */
const S = C.stops, NS = "http://www.w3.org/2000/svg";
const countries = [...new Set(C.places.map(p => p.country))];
$("#stats").innerHTML = [[C.places.length, "Cities", "城市"], [countries.length, "Countries", "国家"], [S.length, "Stops", "站"]]
  .map(([n, en, zh]) => `<div><b>${n}</b><span>${en}<small>${zh}</small></span></div>`).join("");
const proj = (lon, lat) => [(lon - M.lon0) * M.k * M.s, (M.lat1 - lat) * M.s];
const svg = $("#mapSvg");
const sv = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
svg.innerHTML = `<defs><radialGradient id="pinG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c4545a"/><stop offset=".6" stop-color="#8e2a30"/><stop offset="1" stop-color="#5e161b"/></radialGradient></defs>`;
let gr = "";
for (let lon = 95; lon <= 145; lon += 5) { const [x] = proj(lon, 0); gr += `M${x} 0V${M.h}`; }
for (let lat = 0; lat <= 50; lat += 5) { const [, y] = proj(0, lat); gr += `M0 ${y}H${M.w}`; }
svg.append(sv("path", { d: gr, class: "grat" }), sv("path", { d: M.land, class: "land" }));
const LBL = { hangzhou: [-9, 4, "end"], jiaxing: [9, 9, "start"], shanghai: [9, -2, "start"], shenzhen: [9, 8, "start"], dongguan: [-9, -2, "end"],
  chongqing: [9, 10, "start"], chengdu: [-9, -3, "end"], wuning: [9, 3, "start"], dali: [-10, 14, "end"], tokyo: [-9, -6, "end"], fukuoka: [-9, 10, "end"], seoul: [-9, -4, "end"], beijing: [9, 3, "start"], kk: [9, 3, "start"], krabi: [9, 3, "start"] };
let farMode = true, curRegion = "all", focusBox = null;
const LBL_FAR = { hangzhou: [-13, -13, "end"], shanghai: [7, -17, "start"], jiaxing: [21, 17, "start"], wuning: [0, 21, "middle"] };
const leadEls = {};
const seen = {};
const pos = S.map(s => { const p = placeById[s.city]; const [x, y] = proj(p.lon, p.lat); const n = seen[s.city] = (seen[s.city] || 0) + 1; return { x, y, rep: n - 1 }; });
const stringPath = sv("path", { class: "string draw" });
const promisePath = sv("path", { class: "promise" });
const promiseLbl = sv("text", { class: "promise-lbl", "text-anchor": "middle" }); promiseLbl.textContent = C.promise ? C.promise.label : "";
// zoomed into a region, only the legs of the route that start and end inside it are drawn (the others would cross the
// whole frame as long straight lines to cities off the edge)
const stringLocal = sv("path", { class: "string-local", "aria-hidden": "true" });
svg.append(stringPath, stringLocal, promisePath, promiseLbl);
const pinEls = [], lblEls = {};
S.forEach((s, i) => {
  const g = sv("g", { class: "pin" + (s.highlight ? " hi" : ""), tabindex: 0, role: "button", "aria-label": `${pad2(i + 1)} ${placeById[s.city].name}` });
  const hit = sv("circle", { class: "hit" }), sh = sv("ellipse", { class: "sh" }), ring = sv("circle", { class: "ring" }), hd = sv("circle", { class: "hd", fill: "url(#pinG)" }), hl = sv("circle", { class: "hl" });
  const num = sv("text", { class: "num" }); num.textContent = pad2(i + 1);
  g.append(hit, sh, ring, hd, hl, num); svg.append(g);
  g.addEventListener("click", () => focusCity(i));
  g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusCity(i); } });
  pinEls.push({ g, hit, sh, ring, hd, hl, num });
  if (!leadEls[s.city] && LBL_FAR[s.city]) { const ld = sv("path", { class: "lead", "aria-hidden": "true" }); svg.insertBefore(ld, svg.querySelector(".pin")); leadEls[s.city] = ld; }
  if (!lblEls[s.city]) { const t = sv("text", { class: "plbl" }); t.textContent = placeById[s.city].name; svg.append(t); lblEls[s.city] = t; }
});
function layoutMap(z) {
  const pxPerUnit = (svg.getBoundingClientRect().width || 360) / (z * M.w), hitR = Math.max(6.6 * z * 1.4, 22 / pxPerUnit);
  const P = pos.map(p => p.rep ? { x: p.x + 11 * z * p.rep, y: p.y - 9 * z * p.rep } : p);
  let d = `M${P[0].x} ${P[0].y}`;
  for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], L = Math.hypot(b.x - a.x, b.y - a.y); d += ` Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + L * .12} ${b.x} ${b.y}`; }
  stringPath.setAttribute("d", d);
  stringLocal.setAttribute("d", "");   // regional views keep the pins only; the whole route is drawn on 全图
  // the red string keeps its hairline weight on screen when the map zooms in (it used to thicken with the zoom)
  const zk = z / (fullVB[2] / M.w); stringPath.style.strokeWidth = .9 * zk; stringLocal.style.strokeWidth = .9 * zk; promisePath.style.strokeWidth = .7 * zk;
  if (C.promise) { const a = P[C.promise.from - 1], b = P[C.promise.to - 1], r = 34 * z;
    promisePath.setAttribute("d", `M${a.x} ${a.y} C ${a.x - r * 1.6} ${a.y + r * .9}, ${a.x - r * 1.4} ${a.y - r * 1.6}, ${b.x} ${b.y}`);
    promiseLbl.setAttribute("x", a.x - r * 1.3); promiseLbl.setAttribute("y", a.y - r * .2); promiseLbl.setAttribute("font-size", 11 * z); }
  pinEls.forEach((e, i) => { const { x, y } = P[i], r = 6.6 * z;
    e.hit.setAttribute("cx", x); e.hit.setAttribute("cy", y); e.hit.setAttribute("r", hitR);
    e.sh.setAttribute("cx", x + 1.4 * z); e.sh.setAttribute("cy", y + 2.2 * z); e.sh.setAttribute("rx", r); e.sh.setAttribute("ry", r * .8);
    e.hl.setAttribute("cx", x - r * .35); e.hl.setAttribute("cy", y - r * .4); e.hl.setAttribute("r", r * .22);
    e.hd.setAttribute("cx", x); e.hd.setAttribute("cy", y); e.hd.setAttribute("r", r);
    e.ring.setAttribute("cx", x); e.ring.setAttribute("cy", y); e.ring.setAttribute("r", r * 1.6);
    e.num.setAttribute("x", x); e.num.setAttribute("y", y + .4 * z); e.num.setAttribute("font-size", 7.4 * z); });
  // in the full view the east-China cluster (杭州 · 嘉兴 · 上海, with 武宁西海 just west) is too tight for labels beside the pins:
  // those four sit a little way off, each tied to its pin by a fine leader line. zoomed in, they go back beside their pins.
  const far = farMode;
  Object.entries(lblEls).forEach(([id, t]) => { const p = placeById[id], [x, y] = proj(p.lon, p.lat), [dx, dy, an] = (far && LBL_FAR[id]) || LBL[id] || [9, 3, "start"];
    const lx = x + dx * z, ly = y + dy * z;
    t.setAttribute("x", lx); t.setAttribute("y", ly); t.setAttribute("text-anchor", an); t.setAttribute("font-size", 11.5 * z); t.style.strokeWidth = 3.2 * z;
    const ld = leadEls[id]; if (!ld) return;
    if (far && LBL_FAR[id]) { const tx = lx + (an === "end" ? 1.5 : an === "start" ? -1.5 : 0) * z, ty = ly - (dy < 0 ? -1.5 : 9.5) * z, L = Math.hypot(tx - x, ty - y) || 1, r = 6.6 * z * 1.15;
      ld.setAttribute("d", `M${x + (tx - x) / L * r} ${y + (ty - y) / L * r}L${tx} ${ty}`); ld.style.strokeWidth = .75 * z; ld.style.display = ""; }
    else ld.style.display = "none"; });
}
// on a phone the map gets a tighter, taller frame around the route (it runs near full width)
const fullVB = innerWidth < 900 ? [4, 30, 416, 430] : [5, 0, M.w - 10, M.h];
svg.style.aspectRatio = `${fullVB[2]} / ${fullVB[3]}`;
function box(l0, a1, l1, a0) { const [x0, y0] = proj(l0, a1), [x1, y1] = proj(l1, a0); const w = x1 - x0, h = y1 - y0, s = Math.max(w, h); return [x0 + (w - s) / 2, y0 + (h - s) / 2, s, s]; }
// 全图 / 国内 / 日韩 / 东南亚: every stop sits in one of the three groups (a square frame, kept on the map sheet)
const onSheet = b => [b[0], Math.max(0, Math.min(M.h - b[3], b[1])), b[2], b[3]];
const regions = { all: fullVB, cn: box(98.4, 41.6, 123.6, 21.2), ne: box(124, 41, 142, 30), sea: onSheet(box(96.8, 13, 117.6, 2)) };
const FOCUS_SIDE = box(117.6, 32.6, 123.6, 28.4)[2];   // the one fixed zoom a tapped city glides to
const REGION_OF = { "中国": "cn", "日本": "ne", "韩国": "ne", "泰国": "sea", "马来西亚": "sea" };
let vb = fullVB.slice();
const applyVB = v => { svg.setAttribute("viewBox", v.join(" ")); layoutMap(v[2] / M.w); };
let vbRun = 0;
function animVB(to, far) { const run = ++vbRun, from = vb.slice(), t0 = performance.now(), Dur = 900;
  if (reduced) { vb = to.slice(); farMode = far; applyVB(vb); return; }
  svg.classList.add("lbl-out");
  const st = t => { if (run !== vbRun) return; let k = Math.min(1, (t - t0) / Dur); k = k < .5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2; vb = from.map((f, i) => f + (to[i] - f) * k); applyVB(vb);
    if (k < 1) requestAnimationFrame(st); else { farMode = far; applyVB(vb); svg.classList.remove("lbl-out"); } };
  requestAnimationFrame(st); }
applyVB(vb);
function setRegion(key) { if (!regions[key]) return; MO.finishString && MO.finishString(); curRegion = key; focusBox = null;
  $$("#zoom button").forEach(b => b.classList.toggle("on", b.dataset.z === key)); svg.classList.toggle("zoomed", key !== "all");
  animVB(regions[key], key === "all" || key === "cn"); }
// the region a city sits in (its tab), or the full map
const regionOf = id => REGION_OF[placeById[id].country] || "all";
$("#zoom").addEventListener("click", e => { const b = e.target.closest("button"); if (b) setRegion(b.dataset.z); });
S.forEach((s, i) => { const b = el("button", s.highlight ? "hi" : "", `<small>${pad2(i + 1)}</small>${esc(placeById[s.city].name)}`); b.type = "button"; b.setAttribute("aria-controls", "st" + i); b.setAttribute("aria-pressed", i === 0 ? "true" : "false"); b.onclick = () => focusCity(i); $("#chips").append(b); });
// a pin and a list row do exactly the same: the card shows, the row is selected, the map glides to centre that city
// at one fixed zoom (even when it is already in view), and its pin pulses once
function focusCity(i) { const s = S[i]; if (!s) return; openPlace(i); MO.finishString && MO.finishString();
  const p = placeById[s.city], [cx, cy] = proj(p.lon, p.lat), side = FOCUS_SIDE;
  const x = Math.max(0, Math.min(M.w - side, cx - side / 2)), y = Math.max(0, Math.min(M.h - side, cy - side / 2));
  curRegion = regionOf(s.city); focusBox = [x, y, side, side];
  $$("#zoom button").forEach(b => b.classList.toggle("on", curRegion !== "all" && b.dataset.z === curRegion));
  svg.classList.add("zoomed"); animVB(focusBox, false); ping(i); }
const ping = i => { const g = pinEls[i] && pinEls[i].g; if (!g || reduced) return; g.classList.remove("ping"); void g.getBoundingClientRect(); g.classList.add("ping"); setTimeout(() => g.classList.remove("ping"), 1300); };

let cur = 0; const pc = $(".pola-card");
/* ---------- TRAVEL: the map is the navigation layer of a photo story ---------- */
// one gallery for the whole route: swiping walks from stop to stop
const ROUTE = GROUPS.route = [], firstOf = {};
S.forEach((s, i) => { const p = placeById[s.city], srcs = s.scans && s.scans.length ? s.scans : stopPhotos(s), notes = s.photoNotes || [];
  srcs.forEach((src, k) => { if (k === 0) firstOf[i] = ROUTE.length;
    ROUTE.push({ src, place: `${pad2(i + 1)} ${p.name}`, date: "", caption: k === 0 && !isTodo(s.memory) ? s.memory : "" }); }); });
// a pin or a chip picks the place: only its card stays below the map, the others take no room. the first stop to begin with.
// (the photos in the card still open the viewer.) a short fade on the switch, instant with reduced motion; the page never scrolls by itself.
let curPlace = -1;
function openPlace(i, from) { const st = $$("#story .st"); if (!st[i]) return;
  pinEls.forEach((e, j) => e.g.classList.toggle("on", j === i));
  $$("#chips button").forEach((b, j) => b.setAttribute("aria-pressed", j === i ? "true" : "false"));
  if (i === curPlace) return; const byHand = curPlace >= 0; curPlace = i;
  st.forEach((e, j) => { e.hidden = j !== i; e.classList.remove("rt-in"); });
  if (byHand && !reduced) { void st[i].offsetWidth; st[i].classList.add("rt-in"); }
  if (window.ScrollTrigger) requestAnimationFrame(() => { try { ScrollTrigger.refresh(); } catch (e) {} }); }
// the story itself: every stop of the route, in order, in three tiers.
// each photo appears once on the site: a photo already told in the rolls (or the hero) is not repeated here,
// that stop is set in type instead (city in caps, coordinates, date, its own words).
// the place card: only the city (name + coordinates) and every photo we have of it, laid out as one editorial page —
// big and small prints, a little off the grid. a paragraph of the city's own words can follow later (places[].copy).
// the 2023 roll's own photos (r23-*) are shown only inside that roll: never on the map or anywhere else
const ROLL_ONLY = /^photos\/(r23-|n1\.webp|chongqing-2nd\.webp|m0\.webp|dali-first-shadows\.webp|n3\.webp)/;   // + the older files of the same shots
const cityPhotos = id => { const out = [], got = new Set(), add = (src, date) => { if (!src || got.has(src) || /hangzhou-(ears|eyes)/.test(src) || ROLL_ONLY.test(src)) return; got.add(src); out.push({ src, date }); };
  if (placeById[id].photos) { placeById[id].photos.forEach(src => add(src, "")); return out; }   // a city with its own set: exactly these, in this order
  S.forEach(s => { if (s.city !== id) return; (s.scans && s.scans.length ? s.scans : stopPhotos(s)).forEach((src, k) => add(src, (s.photoNotes && s.photoNotes[k]) || s.note || "")); });
  (C.mapPhotos || []).forEach(m => { if (m.city === id) add(m.photo, m.date); });   // the photos the 2023 roll used to bring here (same place, same order)
  C.chapters.forEach(c => c.items.forEach(m => { if (m.city === id) [m.photo, ...(m.scans || [])].forEach(src => add(src, isTodo(m.date) ? c.year : m.date)); }));
  (placeById[id].extra || []).forEach(src => add(src, ""));
  return out; };
// collage rhythm: rows of one or two prints; [width %, left %, drop % (of the width), tilt°]
const COL_ROWS = [[[60, 0, 0, -.8], [34, 5, 18, 1.3]], [[40, 7, 9, 1], [47, 5, 0, -.6]], [[72, 20, 0, .5]], [[33, 0, 14, -1.2], [57, 9, 0, .7]]];
const name2id = n => (Object.values(placeById).find(p => p.name === n) || {}).id;
const COL_ONE = [[[84, 8, 0, -.5]]], COL_LAST = [[68, 15, 0, .6]];
// a city with many photos: a photo wall — rows of polaroids pegged to a sagging twine, three to a line
const WALL_F = { 3: [.18, .5, .82], 2: [.32, .68], 1: [.5] }, WALL_TILT = [-3, 1.8, -1.2, 2.6, -2.2, 1, 3, -1.6, -.6, 2.2, -2.8, 1.4];
function wallHTML(list, gid, name) {
  let out = "", k = 0, r = 0;
  while (k < list.length) { const n = Math.min(3, list.length - k), sag = 26 + (r % 3) * 5, y0 = r % 2 ? 6 : 3, y1 = r % 2 ? 3 : 6;
    const yAt = t => (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * (y0 + sag) + t * t * y1;
    out += `<div class="w-row"><svg class="w-str" viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true"><path d="M-2 ${y0} Q50 ${y0 + sag} 102 ${y1}"/></svg>` +
      WALL_F[n].map((f, j) => { const ph = list[k + j], vi = k + j, tilt = WALL_TILT[vi % WALL_TILT.length];
        return `<figure class="w-f" style="left:${f * 100}%;top:${yAt(f).toFixed(2)}%;--r:${tilt}deg" data-vg="${gid}" data-vi="${vi}" role="button" tabindex="0" aria-label="${esc(name)} · 放大"><span class="w-pin" aria-hidden="true"></span><span class="w-ph">${img(ph.src, name)}</span></figure>`; }).join("") + `</div>`;
    k += n; r++; }
  return `<div class="wall">${out}</div>`;
}
// or a taped wall: photos at their own proportions in three loose columns, a strip or two of tape holding each one
const TAPE = [["t", -6], ["tl", -38, "tr", 36], ["t", 4], ["tr", 32], ["t", -3], ["tl", -34], ["t", 7], ["tl", -40, "tr", 40]];
function tapeHTML(list, gid, name) {
  const cols = [[], [], []], h = [0, 0, 0];
  list.forEach((ph, vi) => { const [iw, ih] = SIZES[ph.src] || [1200, 1600], c = h.indexOf(Math.min(...h)), sc = [1, .9, .96, .86, 1, .92][vi % 6];
    cols[c].push([ph, vi, sc]); h[c] += ih / iw * sc + .12; });
  const fig = ([ph, vi, sc]) => { const t = TAPE[vi % TAPE.length], tilt = [-1.2, .8, -.5, 1.4, -.9, .4, 1, -1.5][vi % 8], white = false;
    const tapes = []; for (let i = 0; i < t.length; i += 2) tapes.push(`<span class="tp tp-${t[i]}" style="--a:${t[i + 1]}deg" aria-hidden="true"></span>`);
    return `<figure class="tw-f${white ? " white" : ""}" style="width:${sc * 100}%;margin-left:${vi % 2 ? 100 - sc * 100 : 0}%;--r:${tilt}deg" data-vg="${gid}" data-vi="${vi}" role="button" tabindex="0" aria-label="${esc(name)} · 放大">${tapes.join("")}${img(ph.src, name)}</figure>`; };
  return `<div class="tapewall">${cols.map(c => `<div class="tw-col">${c.map(fig).join("")}</div>`).join("")}</div>`;
}
function collageHTML(list, gid, name) {
  const rows = []; let k = 0, r = 0;
  if (list.length > 6) return (placeById[name2id(name)] || {}).wall === "tape" ? tapeHTML(list, gid, name) : wallHTML(list, gid, name);
  if (list.length === 1) rows.push(COL_ONE[0].map(t => [t, list[0], 0]));
  else while (k < list.length) { let tpl = COL_ROWS[r % COL_ROWS.length]; if (list.length - k === 1 && tpl.length > 1) tpl = COL_LAST;
    rows.push(tpl.map((t, j) => [t, list[k + j], k + j]).filter(x => x[1])); k += tpl.length; r++; }
  return rowsHTML(rows, gid, name);
}
function rowsHTML(rows, gid, name) {
  return rows.map(row => `<div class="cl-row">${row.map(([[w, ml, mt, rot], ph, vi]) => { const [iw, ih] = SIZES[ph.src] || [1200, 1600], tall = ih / iw > 1.6;
    return `<figure class="cl-f" style="width:${tall ? w * .62 : w}%;margin-left:${ml}%;margin-top:${mt}%;--r:${rot}deg" data-vg="${gid}" data-vi="${vi}" role="button" tabindex="0" aria-label="${esc(name)} · 放大">${img(ph.src, name)}</figure>`; }).join("")}</div>`).join("");
}
(() => { const st = $("#story"); if (!st) return;
  S.forEach((s, i) => { const p = placeById[s.city], list = cityPhotos(s.city), gid = "city-" + s.city;
    GROUPS[gid] = list.map(ph => ({ src: ph.src, place: p.name, date: geo(ph.geo || p) }));   // map photos: the place and its coordinates, no date and no caption
    const e = el("article", "st city" + (list.length ? "" : " type-only"));
    e.innerHTML = `<header class="city-h"><h3><span class="cn">${esc(p.name)}</span><i>${esc(p.en)}</i></h3><span class="st-geo">${geo(p)}</span></header>` +
      (list.length ? `<div class="collage">${collageHTML(list, gid, p.name)}</div>` : "") +
      (p.copy && !isTodo(p.copy) ? `<p class="city-copy">${nobr(p.copy)}</p>` : "");
    e.id = "st" + i; st.append(e); });
  st.classList.add("tabs"); openPlace(0);
})();
function openStop(i) {
  cur = (i + S.length) % S.length; const s = S[cur], p = placeById[s.city];
  pinEls.forEach((e, j) => e.g.classList.toggle("on", j === cur));
  $("#sIdx").innerHTML = `<b>${pad2(cur + 1)}</b> / ${S.length}<span>${esc(p.country)}</span>`;
  $("#sName").textContent = p.name; $("#sEn").textContent = p.en;
  pc.classList.toggle("scan-mode", !!(s.scans && s.scans.length));
  const gid = "stop" + cur, G = GROUPS[gid] = [], note0 = s.note || "";
  const tapC = (box, src, k, date) => { G[k] = { src, place: p.name, date: date || note0 }; box.dataset.vg = gid; box.dataset.vi = k;
    box.setAttribute("role", "button"); box.tabIndex = 0; box.setAttribute("aria-label", p.name + " · 放大"); };
  if (s.scans && s.scans.length) { const sc = el("div", "scans"); sc.id = "sPhoto";
    s.scans.forEach((src, k) => { const f = el("figure", "scan", `<i class="tape top"></i>${img(src, `${p.name} · ${s.scansDate || ""}`)}`); tapC(f, src, k, s.scansDate); sc.append(f); });
    $("#sPhoto").replaceWith(sc);
  } else {
    const list = stopPhotos(s);
    const ph = photoBox(list[0], `photos/${s.city}.jpg`, false, p.name); ph.id = "sPhoto"; if (s.tall) ph.classList.add("tall");
    const notes = s.photoNotes || [], nt = null;
    list.forEach((src, k) => { G[k] = { src, place: p.name, date: notes[k] || note0 }; });
    if (list[0]) tapC(ph, list[0], 0, notes[0]);
    if (list.length > 1) ph.append(el("span", "ph-dots", list.map((_, j) => `<i class="${j ? "" : "on"}"></i>`).join("")));
    $("#sPhoto").replaceWith(ph);
  }
  const mem = txt(s.memory);
  $("#sMem").innerHTML = mem + (s.song ? `<span class="song">${esc(s.song)}</span>` : "");
  $("#sMem").hidden = !mem && !s.song;
  pc.querySelector(".card-seal")?.remove();
  if (s.seal) pc.querySelector(".pc-cap").append(el("span", "card-seal seal", sealHTML(s.seal)));
  $("#sheet").classList.add("open"); $("#sheet").setAttribute("aria-hidden", "false");
}
addEventListener("keydown", e => { if (e.key !== "Escape") return; if ($("#sheet").classList.contains("open")) closeSheet(); else if ($("#secret").classList.contains("open")) $("#secretClose").click(); });
const closeSheet = () => { $("#sheet").classList.remove("open"); $("#sheet").setAttribute("aria-hidden", "true"); pinEls.forEach(e => e.g.classList.remove("on")); };
$("#sheet").addEventListener("click", e => { if (e.target.closest("[data-close]")) closeSheet(); });
$("#sPrev").onclick = () => openStop(cur - 1); $("#sNext").onclick = () => openStop(cur + 1);
let tx = null;
pc.addEventListener("touchstart", e => tx = [e.touches[0].clientX, e.touches[0].clientY], { passive: true });
pc.addEventListener("touchend", e => { if (!tx) return; const dx = e.changedTouches[0].clientX - tx[0], dy = e.changedTouches[0].clientY - tx[1];
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) openStop(cur + (dx < 0 ? 1 : -1)); else if (dy > 80) closeSheet(); tx = null; });

/* ---------- CHAPTERS ---------- */
$("#can1").textContent = H.canister[0]; $("#can2").textContent = H.canister[1];
const strip = $("#stripH");
// the leader: sprocket holes along both edges and the edge print, like the end of a real roll pulled from its canister
strip.innerHTML = '<i class="sprk a" aria-hidden="true"></i><i class="sprk b" aria-hidden="true"></i><span class="edge" aria-hidden="true">1461 &nbsp;▸ 1 &nbsp;1A &nbsp;▸ 2 &nbsp;2A &nbsp;▸ 3 &nbsp;3A &nbsp;▸ 4 &nbsp;4A</span>';
// the strip slides out of the canister once it comes into view
if ("IntersectionObserver" in window && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
  strip.classList.add("pull"); const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { strip.classList.add("in"); io.disconnect(); } }), { threshold: .35 }); io.observe(strip.parentNode); }

C.chapters.forEach((c, ci) => {
  const ph = c.items.find(m => m.photo);
  const f = el("button", "fr", `<i class="fr-ph">${c.thumb || ph ? img(c.thumb || ph.photo) : ""}</i><span>${esc(c.year)}</span>`); f.setAttribute("aria-label", c.year);
  f.type = "button"; f.setAttribute("aria-controls", "yr" + ci); f.setAttribute("aria-pressed", ci === 0 ? "true" : "false");
  f.onclick = () => selectRoll(ci, true); strip.append(f);
});
const list = $("#chapterList");
// a negative frame: the print sits in a strip of film with sprocket holes down both sides and the edge print
const filmFrame = (ph, ci, year) => { const f = el("div", "neg"); f.append(ph);
  f.insertAdjacentHTML("beforeend", `<i class="sprk a" aria-hidden="true"></i><i class="sprk b" aria-hidden="true"></i><span class="edge" aria-hidden="true">1461 · ROLL ${pad2(ci + 1)} · ${esc(year)} &nbsp;▸ ${frameNo}</span>`); return f; };
let frameNo = 1;
// one group per roll for the photo viewer
// items that are only placeholders (no photo, no words yet) stay out of the page unless showTodo
const realItem = m => SHOW || m.milestone || m.photo || m.scans || !isTodo(m.title) || !isTodo(m.text);
C.chapters.forEach((c0, ci) => { const c = { ...c0, items: c0.items.filter(realItem) };
  const y = el("article", "yr lay-strip"); y.id = "yr" + ci;
  y.innerHTML = `<div class="yr-head"><div class="yr-num${c.year.length > 4 ? " long" : ""}">${esc(c.year).replace(/[–-]/, '<span class="dash">–</span>')}</div>
    <div class="yr-t"><small>Roll ${pad2(ci + 1)}</small>${txt(c.title)}</div></div>`;
  const gid = "roll" + ci, G = GROUPS[gid] = [];
  // every photo of a roll opens full-screen with its date · place and one line of its story (a placeholder until written)
  const add = (src, m) => { const own = !isTodo(m.text) && m.text; G.push({ src, date: isTodo(m.date) ? c.year : m.date, place: isTodo(m.title) ? "" : m.title,
    full: true, caption: own || (m.dateOnly ? "" : "占位文案：这张照片的故事，之后写在这里。"), capPH: !own && !m.dateOnly }); return G.length - 1; };
  const tapPhoto = (box, src, m) => { if (!src) return box; const k = add(src, m); box.dataset.vg = gid; box.dataset.vi = k;
    box.setAttribute("role", "button"); box.tabIndex = 0; box.setAttribute("aria-label", (isTodo(m.title) ? c.year : m.title) + " · 放大");
    return box; };
  const capHTML = m => { const d = txt(m.date), t = txt(m.title), x = isTodo(m.text) ? txt(m.text) : nobr(m.text);
    return (d ? `<span class="d">${d}</span>` : "") + (t ? `<span class="t">${t.split(" · ").map(w => `<span class="nw">${w}</span>`).join(" · ")}</span>` : "") + (x ? `<span class="tx">${x}</span>` : ""); };
  // every roll is a vertical strip of film (the original rolls); layout values in content.js are kept but no longer change the form
  const L = "strip";
  if (L === "peak") {
    // the emotional peak as a sequence of events, one module each: date → place → line → photo.
    // photo sizes come from a small system, not per photo: L = full width 3:2 · P = full width 4:5 (highlight) · S = 64% 4:5 · pair = real prints.
    // an item without any caption of its own is the same event continuing (e.g. a second photo of the same trip).
    const pk = el("div", "peak events"); let last = null;
    c.items.forEach(m => {
      const cap = m.milestone ? "" : capHTML(m), cont = !m.milestone && !cap && last;
      const ev = cont ? last : el("article", "ev" + (m.highlight ? " hi" : "") + (m.milestone ? " ms" : ""));
      if (!cont) { if (m.milestone) ev.innerHTML = `<header class="ev-h"><span class="d">${esc(m.date)}</span><span class="ms-k">Milestone</span><span class="t">${nobr(m.title)}</span>${m.text ? `<span class="tx">${nobr(m.text)}</span>` : ""}</header>`;
        else if (cap) ev.append(el("header", "ev-h", cap)); }
      if (m.scans) { const w = el("div", "ev-ph ev-pair"); m.scans.forEach(src => { const f = el("div", "scan-ph", img(src, m.title)); tapPhoto(f, src, m); w.append(f); }); ev.append(w); }
      else if (m.photo) { const r = (m.crop && m.crop.ratio) || "4/5", size = /^3\/2$/.test(r) ? "L" : (m.highlight ? "P" : "S");
        const ph = photoBox(m.photo, null, true, isTodo(m.title) ? c.year : m.title); tapPhoto(ph, m.photo, m); ph.style.aspectRatio = size === "L" ? "3/2" : "4/5";
        const im = ph.querySelector("img"); if (im && m.crop) { im.style.objectPosition = m.crop.pos || "50% 50%"; im.style.transformOrigin = m.crop.pos || "50% 50%"; if (m.crop.zoom && m.crop.zoom !== 1) im.style.transform = `scale(${m.crop.zoom})`; }
        const f = el("div", `ev-ph ev-${size}${cont ? " ev-more" : ""}`); f.append(ph); ev.append(f); }
      if (!cont) { pk.append(ev); last = m.milestone ? null : ev; }
      frameNo++;
    });
    y.append(pk); list.append(y); return;
  }
  if (L === "contact") {
    // a horizontal contact sheet: frames stagger like a printed proof
    const cs = el("div", "contact", `<i class="sprk t"></i><i class="sprk b"></i><span class="edge">1461 · ROLL ${pad2(ci + 1)} · ${esc(c.year)}</span>`), row = el("div", "cs-row"), caps = el("div", "cs-caps");
    c.items.forEach(m => { const fr = el("div", "cfr"); const ph = photoBox(m.photo, null, true, isTodo(m.title) ? c.year : m.title); tapPhoto(ph, m.photo, m); fr.append(ph);
      fr.insertAdjacentHTML("beforeend", `<span class="fno">▸ ${frameNo}</span>`); frameNo++; row.append(fr);
      const cp = capHTML(m); caps.append(el("div", "cp", cp)); });
    cs.append(row); y.append(cs); if (caps.textContent.trim()) y.append(caps); list.append(y); return;
  }
  if (L === "feature") { const fm = c.items.find(m => m.feature && m.photo);
    if (fm) { const f = el("figure", "feature");
      const ph = el("div", "ph dark", img(fm.photo, fm.title)); ph.querySelector("img").style.objectPosition = "50% 50%"; tapPhoto(ph, fm.photo, fm); G.pop(); // same photo also sits in the strip; one viewer entry is enough
      f.append(filmFrame(ph, ci, c.year), el("figcaption", "", `<span class="d">${esc(fm.date)}</span>`)); y.append(f); f._m = fm; y._feature = ph; } }
  // the roll as a vertical strip of film: sprocket holes down both edges, edge print, frames in order;
  // the words sit in their own column beside it, each one level with its frame
  const IDX = CSS.supports && CSS.supports("grid-template-rows", "subgrid");
  const vr = el("div", "vroll"), vs = el("div", "vstrip", `<i class="sprk a" aria-hidden="true"></i><i class="sprk b" aria-hidden="true"></i><span class="edge" aria-hidden="true">1461 · ROLL ${pad2(ci + 1)} · ${esc(c.year)}</span>`), caps = el("div", "caps");
  c.items.forEach(m => {
    const fr = el("div", "vfr");
    if (m.milestone) { fr.classList.add("ms"); fr.append(el("div", "ph milestone", `<span class="ms-k">Milestone</span><b>${nobr(m.title)}</b><span class="ms-d">${esc(m.date)}</span>`)); }
    else if (m.scans && m.scans.length) { const ph = el("div", "ph scans2"); m.scans.forEach(src => { const s1 = el("div", "sc", img(src, m.title)); tapPhoto(s1, src, m); ph.append(s1); }); fr.append(ph); }
    else { const ph = photoBox(m.photo, null, true, isTodo(m.title) ? c.year : m.title); tapPhoto(ph, m.photo, m);
      // every frame is cut to its photo's own proportions (portrait stays portrait, a wide shot stays wide): nothing is cropped
      const [pw, phh] = SIZES[m.photo] || [4, 5]; ph.style.aspectRatio = `${pw} / ${phh}`; if (pw > phh) fr.classList.add("land");
      const im = ph.querySelector("img"); if (im && m.crop && m.crop.pos) im.style.objectPosition = m.crop.pos;
      if (im && m.crop && m.crop.fit === "contain") { ph.classList.add("fit"); im.style.objectFit = "contain"; }   // letterbox (e.g. a phone screenshot) instead of cropping
      fr.append(ph); }
    fr.insertAdjacentHTML("beforeend", `<span class="fno" aria-hidden="true">▸ ${frameNo}&nbsp;&nbsp;${frameNo}A</span>`); frameNo++;
    vs.append(fr);
    const d = txt(m.date), n = vs.querySelectorAll(".vfr").length;
    // [index] 2023 first: a small "01" over the date, the pair centred on its own frame (same grid row, see style.css)
    caps.append(el("div", "cp" + (m.milestone ? " cp-ms" : ""), (IDX && d ? `<span class="ix">${pad2(n)}</span><span class="sl" aria-hidden="true">/</span>` : "") + (d ? `<span class="d">${d}</span>` : "")));   // the date only; the words are in the photo
  });
  if (IDX) { vr.classList.add("idx"); vr.style.setProperty("--n", c.items.length); }
  vr.append(vs, caps); y.append(vr); list.append(y);
});
// the strip picks the year: only that roll is on the page, the others take no room. 2023 first.
// the switch is a short fade (opacity + a few px); reduced motion swaps at once. the page never scrolls by itself.
const ROLLS = [...list.querySelectorAll(".yr")], FRS = [...strip.querySelectorAll(".fr")];
let curRoll = 0; list.classList.add("tabs");
// photos in the rolls load before they are needed: the open roll as the section nears, the other years right after
(() => { const warm = y => y && y.querySelectorAll('img[loading="lazy"]').forEach(im => { im.loading = "eager"; });
  const go = () => { warm(ROLLS[curRoll]); let k = 0; const next = () => { if (k >= ROLLS.length) return; warm(ROLLS[k++]); setTimeout(next, 700); }; setTimeout(next, 900); };
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); go(); } }), { rootMargin: "1600px 0px" }); io.observe(list); }
  else go(); })();
function selectRoll(i, byHand) { if (!ROLLS[i] || (byHand && i === curRoll)) return; curRoll = i;
  FRS.forEach((f, k) => f.setAttribute("aria-pressed", k === i ? "true" : "false"));
  ROLLS.forEach((y, k) => { y.hidden = k !== i; y.classList.remove("rt-in"); });
  const y = ROLLS[i]; alignCaps();
  // a hidden roll never plays its entrance again: it is simply there
  if (window.gsap) y.querySelectorAll(".yr-num, .yr-t, .vfr .ph, .cp").forEach(e => gsap.set(e, { clearProps: "transform,opacity,visibility" }));
}
ROLLS.forEach((y, k) => { y.hidden = k !== 0; });
// keep each caption level with its frame
const alignCaps = () => $$(".vroll:not(.idx)").forEach(v => { const frs = v.querySelectorAll(".vfr"), cps = v.querySelectorAll(".cp"), top0 = v.getBoundingClientRect().top;
  frs.forEach((f, i) => { const r = f.getBoundingClientRect(); if (!cps[i]) return; cps[i].style.minHeight = r.height + 8 + "px"; if (i === 0) v.querySelector(".caps").style.paddingTop = (r.top - top0) + "px"; }); });
alignCaps(); addEventListener("resize", alignCaps); addEventListener("load", alignCaps); setTimeout(alignCaps, 1200);
if (document.fonts) document.fonts.ready.then(alignCaps);
// time track: the red line runs down the margin between the years


/* ---------- FINALE ---------- */
const F = C.finale;
$("#years").innerHTML = ["2022", "2023", "2024", "2025", "2026"].map(y => `<span>${y}</span>`).join("");
$("#lcTitle").textContent = F.lockedTitle; $("#envTo").textContent = C.him; $("#fTL").innerHTML = paren(["For", C.him]); $("#fTR").innerHTML = paren(["From", F.signature]);
// the real seal, lifted off the envelope photograph; two halves along a crack so it can break
const CRACK_L = "polygon(0 0, 52% 0, 47% 18%, 54% 34%, 46% 52%, 55% 68%, 48% 84%, 53% 100%, 0 100%)";
const CRACK_R = "polygon(52% 0, 100% 0, 100% 100%, 53% 100%, 48% 84%, 55% 68%, 46% 52%, 54% 34%, 47% 18%)";
// baked seals: the numeral is pressed into the wax in the image itself; any other text falls back to img + span
const SEAL_BAKED = { "4": "assets/seal-4.webp?v=2", "6.22": "assets/seal-622.webp?v=2" };
function sealHTML(text) { const baked = SEAL_BAKED[String(text)];
  const face = baked ? `<img src="${baked}" width="720" height="713" alt="" decoding="async">` : `<img src="assets/seal.webp" width="200" height="198" alt=""><span class="seal-t">${esc(text)}</span>`;
  return `<span class="half h1" style="clip-path:${CRACK_L};-webkit-clip-path:${CRACK_L}">${face}</span><span class="half h2" style="clip-path:${CRACK_R};-webkit-clip-path:${CRACK_R}">${face}</span>`; }
$("#seal").innerHTML = sealHTML(F.seal || "4");
if ($("#closing")) $("#closing").innerHTML = `<span>${esc(F.closing).replace(" in every", "<br>in every")}</span><b class="script">${esc(F.signature)}</b>`;
const dotsEl = $("#dots");
const LEN = String(F.code).length; // number of digits = length of finale.code
for (let i = 0; i < LEN; i++) dotsEl.append(el("span"));
let code = "", checking = false;
const dots = [...dotsEl.children];
["1", "2", "3", "4", "5", "6", "7", "8", "9", "清除", "0", "删除"].forEach(k => {
  const b = el("button", isNaN(k) ? "fn" : "", k);
  b.onclick = () => { if (checking) return;
    if (k === "清除") code = ""; else if (k === "删除") code = code.slice(0, -1); else if (code.length < LEN) code += k;
    dots.forEach((d, j) => d.classList.toggle("f", j < code.length));
    if (code.length === LEN) { checking = true; if (code === String(F.code)) toFinaleSong(); setTimeout(check, 200); }
  };
  $("#pad").append(b);
});
let wrongTries = 0; const hintEl = $("#passHint"); if (hintEl) hintEl.textContent = HINT_TEXT;
function check() {
  if (code === String(F.code)) { checking = false; wrongTries = 0; unlock(); return; }
  if (++wrongTries >= 2 && hintEl && HINT_TEXT) hintEl.classList.add("on");
  dotsEl.classList.add("bad"); if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
  setTimeout(() => { dotsEl.classList.remove("bad"); code = ""; checking = false; dots.forEach(x => x.classList.remove("f")); }, 650);
}

/* hidden page */
$("#letterTitle").textContent = F.letterTitle;
const nobr3 = s => { s = String(s); const m = s.match(/(?:[^\s。，、！？」』）：；.,!?][。，、！？」』）：；.,!?]*){2}$/u); return m ? esc(s.slice(0, m.index)) + `<span class="nw">${esc(m[0])}</span>` : esc(s); };
$("#letter").innerHTML = F.letter.map((p, i) => {
  if (i === F.letter.length - 1 && p.trim() === F.closing.trim()) { const w = p.trim().split(/\s+/), k = Math.max(0, w.length - 2); return `<p class="close-line">${esc(w.slice(0, k).join(" "))} <span class="nw">${esc(w.slice(k).join(" "))}</span></p>`; }
  const t = isTodo(p) ? txt(p) : nobr3(p); return t ? `<p class="${i === 0 && /[:：]$/.test(p) ? "salute" : ""}">${t}</p>` : "";
}).join("");
$("#sig").innerHTML = isTodo(F.signature) ? txt(F.signature) : `<span class="script">${esc(F.signature)}</span>`;
// Aimer《Polaris》: one record, a ring of our photos round its rim, turning slowly (transform only).
// no words on it but the label; it turns only while the private page is open and the record is on screen; reduced motion: still.
(() => { const host = $("#record"), list = (F.record || []).filter(Boolean), N = list.length; if (!host || !N) return;
  // printed straight onto the reel paper, like a real View-Master reel: ▲ + REEL ONE, a hand-lettered title, a small printed block,
  // and a numeral under each window (radial, so it turns with its photo). all one SVG, so it stays crisp and rotates with the disc.
  const nums = list.map((_, k) => `<text class="vm-n" transform="rotate(${k * 360 / N}) translate(0 -23.9)" dy=".36em">${k + 1}</text>`).join("");
  const print = `<svg class="vm-print" viewBox="-50 -50 100 100" aria-hidden="true">
      <defs><path id="vmArc" d="M-15.9 0A15.9 15.9 0 0 1 15.9 0"/></defs>
      <circle class="vm-ring" r="26.2"/><circle class="vm-ring2" r="21.6"/>${nums}
      <path class="vm-tri" d="M0 -20.6L.85 -19.15H-.85Z"/>
      <text class="vm-arc"><textPath href="#vmArc" startOffset="50%">REEL ONE</textPath></text>
      <text class="vm-song" x=".35" y="-5.2" lang="ja">ポラリス</text>
      <circle class="vm-ring3" r="3.4"/>
      <text class="vm-side" y="7.4">SIDE A</text>
      <text class="vm-sm" y="10.6">SUMMER &amp; HELIOS</text>
      <text class="vm-sm" y="13.3">2022.10.30 – 2026.10.30</text></svg>`;
  host.innerHTML = `<div class="vm-disc" role="img" aria-label="ポラリス" lang="ja">${print}
    ${list.map((src, k) => `<span class="vm-slot" style="--a:${k * 360 / N}deg"><span class="vm-f">${img(src, "")}</span></span><i class="vm-notch" style="--a:${(k + .5) * 360 / N}deg"></i>`).join("")}
    <i class="vm-hole"></i></div>`;
  const disc = host.firstElementChild; let seen = false, hold = 0;
  const resetDisc = () => {
    clearTimeout(hold); disc.classList.remove("spin");
    disc.style.animation = "none"; void disc.offsetWidth; disc.style.animation = "";
    const on = () => seen && $("#secret").classList.contains("open") && !document.hidden;
    if (!on() || reduced) return;
    hold = setTimeout(() => { if (on()) disc.classList.add("spin"); }, 1100);   // upright long enough to read ポラリス, then it turns
  };
  if ("IntersectionObserver" in window) new IntersectionObserver(es => es.forEach(e => { const now = e.isIntersecting; if (now === seen) return; seen = now; if (now) resetDisc(); else { clearTimeout(hold); disc.classList.remove("spin"); } }), { root: $("#secret"), threshold: .2 }).observe(host);
  else { seen = true; resetDisc(); }
  new MutationObserver(() => { if ($("#secret").classList.contains("open")) { if (seen) resetDisc(); } else { clearTimeout(hold); disc.classList.remove("spin"); } }).observe($("#secret"), { attributes: true, attributeFilter: ["class"] });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { clearTimeout(hold); disc.classList.remove("spin"); } else if (seen) resetDisc(); }); })();
// above the reel: Aimer's note on 「ポラリス」, verbatim; each line is a few phrases that only decide where a narrow screen may wrap
if (F.reelNotes && $("#reelNotes")) { let lang = "ja";
  $("#reelNotes").innerHTML = F.reelNotes.map((ln, i) => { if (!ln) return '<i class="rn-gap"></i>';
    const t = ln.flat().join(""); if (/[大家无独正因]/.test(t[0])) lang = "zh-CN"; const cls = i < 2 ? "rn-h" : /^\(/.test(t) ? "rn-src" : "rn-l";
    return `<p class="${cls}" lang="${lang}">${ln.flat().map(ph => `<span>${esc(ph)}</span>`).join("")}</p>`; }).join(""); }
// the private page opens on a cover: the title, the silhouette of film, one line, a small imprint
if (F.cover && $("#cover")) { const cv = F.cover;
  $("#coverT").innerHTML = cv.title.map(esc).join("<br>"); $("#coverA").textContent = cv.author || "";
  $("#coverQ").textContent = cv.quote ? "“" + cv.quote.replace(/ (\S+) (\S+) (\S+)$/, "\u00a0$1\u00a0$2\u00a0$3").replace(/^\u00a0/, " ") + "”" : "";   $("#coverBy").textContent = cv.by || ""; $("#coverI").textContent = cv.imprint || ""; }   // the last words stay together (no one-word last line)
const STAR = '<svg viewBox="0 0 40 40"><path d="M20 2 L22.2 17.8 L38 20 L22.2 22.2 L20 38 L17.8 22.2 L2 20 L17.8 17.8 Z"/></svg>';
const SUN = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="7"/><path d="M20 4V9M20 31V36M4 20H9M31 20H36M8.7 8.7L12.2 12.2M27.8 27.8L31.3 31.3M31.3 8.7L27.8 12.2M12.2 27.8L8.7 31.3"/></svg>';
if (F.rings && $("#rings")) $("#rings").innerHTML = F.rings.map((r, i) => `<div class="r"><b>${esc(r.name)}</b><span>${esc(r.is)}</span><small>${esc(r.item)}</small></div>`).join('<span class="x2">×</span>');
if (F.lyrics) $("#lyrics").innerHTML = `<h4>${esc(F.lyricTitle)}</h4>` + F.lyrics.map(([jp, cn]) => `<div class="ln"><span class="jp" lang="ja">${esc(jp)}</span><span class="cn">${esc(cn)}</span></div>`).join("") ;
if (F.pair && F.pair.scans) $("#pair").innerHTML = F.pair.scans.map(src => `<figure class="scan"><i class="tape top"></i>${img(src, F.pair.caption || "")}</figure>`).join("") + (F.pair.caption ? `<p class="pair-cap">${esc(F.pair.caption)}</p>` : "");
const W8 = F.wedding, wp = $("#weddingPola");
if (W8 && (W8.photo || W8.label)) { wp.append(W8.photo ? photoBox(W8.photo) : el("div", "ph"));
  wp.append(el("figcaption", "", [esc(W8.label), esc(W8.date), W8.status ? `<em>${esc(W8.status)}</em>` : ""].filter(Boolean).join(" · "))); }
else if (wp) wp.remove();
// Freezer-Door style silhouette (traced from the 大理 shadows, filled with our photos)
if (F.silhouette) $("#silhouette").innerHTML = img(F.silhouette, `${C.him} & 我`) + (F.silhouetteCaption ? `<figcaption>${esc(F.silhouetteCaption)}</figcaption>` : "");
function unlock() {
  const openPage = () => { const s = $("#secret"); s.classList.add("open"); s.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
    s.scrollTop = 0; s.focus({ preventScroll: true }); s.classList.add("dev");
    if (window.ScrollTrigger) requestAnimationFrame(() => { try { ScrollTrigger.refresh(); } catch (e) {} }); };
  $("#envelope").classList.add("open");
  if (MO.sealTL) (() => { try { MO.sealTL(openPage); } catch (e) { motionOff(); openPage(); } })(); else setTimeout(openPage, 300);
}
{ const env = $("#envelope"), sealEl = $("#seal");
  env.setAttribute("role", "button"); env.tabIndex = 0; env.setAttribute("aria-label", "信封 · 输入密码");
  const lift = () => { if (env.classList.contains("open")) return;
    sealEl.classList.remove("lift"); void sealEl.offsetWidth; sealEl.classList.add("lift"); setTimeout(() => sealEl.classList.remove("lift"), 700);
    const pad = $("#pad"), r = pad.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) $(".lock").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }); };
  env.addEventListener("click", lift); env.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); lift(); } }); }
$("#secretClose").onclick = () => { const s = $("#secret"); s.setAttribute("aria-hidden", "true"); s.classList.remove("open", "dev"); document.body.style.overflow = ""; $("#envelope").classList.remove("open"); MO.sealReset && MO.sealReset(); code = ""; dots.forEach(x => x.classList.remove("f")); };

$("#heart").addEventListener("click", e => {
  const hl = $("#heartLine"), b = e.currentTarget;
  if (!hl.children.length) hl.innerHTML = F.heartLine.split(" ").map((w, i) => `<span style="animation-delay:${i * .09}s">${esc(w)}</span>`).join(" ");
  b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
  const r = b.getBoundingClientRect();
  if (!reduced) for (let i = 0; i < 12; i++) {
    const s = el("span", "spark"), a = Math.random() * Math.PI * 2, dist = 50 + Math.random() * 90;
    s.style.left = r.left + r.width / 2 + "px"; s.style.top = r.top + r.height / 2 + "px";
    s.style.setProperty("--dx", Math.cos(a) * dist + "px"); s.style.setProperty("--dy", Math.sin(a) * dist - 30 + "px");
    document.body.append(s); setTimeout(() => s.remove(), 1500);
  }
});

/* ---------- PHOTO VIEWER (one system for every photo, no special ones) ----------
   Opens FLIP-style from the tapped photo (transform + opacity only). Tap or swipe down closes, swipe left/right moves through the roll. */
const V = { el: null, g: null, i: 0, from: null, busy: false };
function viewerDOM() {
  if (V.el) return V.el;
  const v = el("div", "viewer"); v.setAttribute("role", "dialog"); v.setAttribute("aria-modal", "true"); v.setAttribute("aria-label", "照片"); v.tabIndex = -1;
  v.innerHTML = `<div class="v-bg"></div><img class="v-img" alt=""><div class="v-shade"></div>
    <span class="v-place"></span><span class="v-date"></span><span class="v-count"></span><p class="v-cap"></p><div class="v-lines"><p class="v-l1"></p><p class="v-l2"></p></div>
    <button class="x v-x" aria-label="关闭"><i></i></button>`;
  document.body.append(v); V.el = v;
  let sx = 0, sy = 0, st = 0, moved = false;
  v.addEventListener("touchstart", e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); moved = false; }, { passive: true });
  v.addEventListener("touchmove", e => { const t = e.touches[0]; if (Math.abs(t.clientX - sx) > 10 || Math.abs(t.clientY - sy) > 10) moved = true; }, { passive: true });
  v.addEventListener("touchend", e => { const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); step(dx < 0 ? 1 : -1); }
    else if (dy > 70 || !moved) { e.preventDefault(); closeViewer(); } });
  v.addEventListener("click", e => { if (!("ontouchstart" in window)) closeViewer(); });
  return v;
}
addEventListener("resize", () => { const v = V.el; if (!v || !v.classList.contains("open") || !V.g) return; const f = fitRect(V.g[V.i]), im = v.querySelector(".v-img");
  Object.assign(im.style, { left: f.left + "px", top: f.top + "px", width: f.width + "px", height: f.height + "px" }); });
function fitRect(item) { const [w, h] = SIZES[item.src] || [1200, 1600], box = V.el || document.documentElement;
  const vw = box.clientWidth || innerWidth, vh = box.clientHeight || innerHeight;   // the viewer's real box (not 100vw)
  // a wide (landscape) roll photo opens whole: full width, centred on the dark backdrop, kept clear of the words at the foot
  if (item.full && w > h) { const fw = Math.min(vw, vh * .62 * w / h), fh = fw * h / w, top = Math.max(0, Math.min((vh - fh) / 2, vh - 190 - fh));
    return { left: (vw - fw) / 2, top, width: fw, height: fh, cover: 1 }; }
  if (item.full) return { left: 0, top: 0, width: vw, height: vh, cover: 1 };   // full-bleed: exactly the screen, cropped by object-fit
  const k = Math.min(vw * .9 / w, vh * .7 / h);
  const fw = w * k, fh = h * k; return { left: (vw - fw) / 2, top: (vh - fh) / 2 - vh * .02, width: fw, height: fh, cover: Math.max(vw / fw, vh / fh) }; }
function flipFrom(o, f) { const s = Math.max(o.width / f.width, o.height / f.height);
  return `translate(${o.left + o.width / 2 - (f.left + f.width / 2)}px, ${o.top + o.height / 2 - (f.top + f.height / 2)}px) scale(${s})`; }
function fillViewer(item, f) { const v = V.el, im = v.querySelector(".v-img");
  im.src = item.src; Object.assign(im.style, { left: f.left + "px", top: f.top + "px", width: f.width + "px", height: f.height + "px", transformOrigin: "50% 50%" });
  v.querySelector(".v-place").textContent = item.place || ""; v.querySelector(".v-date").textContent = item.date || "";
  v.querySelector(".v-count").textContent = V.g.length > 1 ? `${V.i + 1} / ${V.g.length}` : "";
  v.querySelector(".v-cap").textContent = item.caption || "";
  // a roll photo's words are said once, at the foot (date · place, then its one line)
  const full = !!item.full; v.classList.toggle("full", full); v.classList.toggle("cap-ph", full && !!item.capPH);
  if (full) v.querySelector(".v-cap").textContent = "";
  v.querySelector(".v-l1").textContent = full ? [item.date, item.place].filter(Boolean).join(" · ") : "";
  v.querySelector(".v-l2").textContent = full ? item.caption || "" : ""; }
function openViewer(gid, i, box) {
  const g = GROUPS[gid]; if (!g || !g[i] || V.busy) return; const v = viewerDOM(), im = v.querySelector(".v-img");
  V.g = g; V.i = +i; V.from = box; V.gid = gid; const item = g[V.i], f = fitRect(item); fillViewer(item, f);
  const o = (box.querySelector("img") || box).getBoundingClientRect();
  im.style.transition = "none"; im.style.transform = reduced ? "none" : flipFrom(o, f); im.style.opacity = reduced ? "1" : ".4";
  v.classList.add("open"); document.body.style.overflow = "hidden"; V.lastFocus = document.activeElement;
  requestAnimationFrame(() => requestAnimationFrame(() => { im.style.transition = "transform .55s cubic-bezier(.2,.8,.2,1), opacity .35s"; im.style.transform = "none"; im.style.opacity = "1"; v.classList.add("in", "full-in");
    v.focus({ preventScroll: true }); }));
}
function step(d) { if (!V.g || V.g.length < 2) return; const v = V.el, im = v.querySelector(".v-img");
  V.i = (V.i + d + V.g.length) % V.g.length; const item = V.g[V.i], f = fitRect(item);
  im.style.transition = "opacity .2s, transform .2s"; im.style.opacity = "0"; im.style.transform = `translateX(${-d * 40}px)`;
  setTimeout(() => { fillViewer(item, f); im.style.transition = "none"; im.style.transform = `translateX(${d * 40}px)`;
    requestAnimationFrame(() => requestAnimationFrame(() => { im.style.transition = "opacity .3s, transform .35s cubic-bezier(.2,.8,.2,1)"; im.style.opacity = "1"; im.style.transform = "none"; }));
    V.from = document.querySelector(`[data-vg="${V.gid}"][data-vi="${V.i}"]`) || V.from; }, 200); }
function closeViewer() { const v = V.el; if (!v || !v.classList.contains("open") || V.busy) return; V.busy = true;
  const im = v.querySelector(".v-img"), item = V.g[V.i], f = fitRect(item), box = V.from && V.from.isConnected ? (V.from.querySelector("img") || V.from) : null;
  const o = box && box.getBoundingClientRect(), onScreen = o && o.bottom > 0 && o.top < innerHeight;
  v.classList.remove("in", "full-in");
  im.style.transition = "transform .45s cubic-bezier(.4,0,.2,1), opacity .45s";
  im.style.transform = onScreen && !reduced ? flipFrom(o, f) : "scale(.96)"; im.style.opacity = onScreen ? ".6" : "0";
  setTimeout(() => { v.classList.remove("open"); im.removeAttribute("src"); document.body.style.overflow = ""; V.busy = false;
    if (V.lastFocus && V.lastFocus.focus) V.lastFocus.focus({ preventScroll: true }); }, reduced ? 0 : 460); }
document.addEventListener("click", e => { const b = e.target.closest("[data-vg]"); if (!b || (V.el && V.el.contains(b))) return; e.stopPropagation(); openViewer(b.dataset.vg, b.dataset.vi, b); }, true);
document.addEventListener("keydown", e => { if (V.el && V.el.classList.contains("open")) { if (e.key === "Escape") { e.stopImmediatePropagation(); closeViewer(); } else if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1); return; }
  const b = e.target.closest && e.target.closest("[data-vg]"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openViewer(b.dataset.vg, b.dataset.vi, b); } }, true);

const SP = { svgs: [] }; const spineSoon = () => {};

/* ---------- MOTION (GSAP, self-hosted in vendor/) ----------
   Three moments only, each plays on its own:
   1. the 1461 counter counts up once   2. the red string draws itself (scroll-scrubbed)   3. the wax seal breaks on the right passcode
   Reduced motion → every moment jumps straight to its final state. */
let mm = null;
const motionOff = () => { try { mm && mm.revert(); } catch (e) {} mm = null; MO.counting = false; MO.sealTL = null; MO.finishString = null;
  document.documentElement.classList.remove("js-motion", "motion-pending", "tag-wait"); try { tick(); } catch (e) {} };
function initMotion() { if (!(window.gsap && window.ScrollTrigger && window.DrawSVGPlugin)) { document.documentElement.classList.remove("motion-pending"); const drop = () => { document.documentElement.classList.add("tag-fade"); document.documentElement.classList.remove("tag-wait"); }; if (window.LOADER) window.LOADER.then(drop, drop); else drop(); setTimeout(scue, 1500); return; } try {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
  document.documentElement.classList.add("js-motion");
  // v60 · the wine cover slides up and away; 江湖 is held still underneath until the cover has gone (native scroll, no smoothing)
  if (!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) { const hero = $("#hero"), sheet = $("#jianghu");
    if (hero && sheet) { const html = document.documentElement, shade = document.createElement("div"); shade.id = "coverShade"; shade.setAttribute("aria-hidden", "true"); document.body.append(shade);
      const fit = () => { const hh = hero.offsetHeight; sheet.style.setProperty("--hh", hh + "px"); shade.style.top = (hero.offsetTop + hh - 2) + "px"; return hh; };
      // in-app browsers can report a short 100svh on a first load (toolbars): the cover is never shorter than the screen really is
      let vh0 = 0; const setVh = () => { const v = Math.max(innerHeight, html.clientHeight); if (v > vh0 && scrollY < 40) { vh0 = v; html.style.setProperty("--vh", v + "px"); return true; } return false; };
      setVh(); html.classList.add("reveal"); fit();
      const recheck = () => { if (setVh()) ScrollTrigger.refresh(); };
      addEventListener("resize", recheck); addEventListener("load", recheck); [300, 1200, 3000].forEach(t => setTimeout(recheck, t));
      if (window.LOADER) window.LOADER.then(() => setTimeout(() => { recheck(); ScrollTrigger.refresh(); }, 950));
      ScrollTrigger.create({ trigger: sheet, start: "top top", end: () => "+=" + hero.offsetHeight, pin: true, pinSpacing: true, refreshPriority: 10, onRefreshInit: fit });
      ScrollTrigger.sort(); } }
  mm = gsap.matchMedia();
  const promiseEls = [promisePath, promiseLbl];
  mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, ctx => {
    const { reduce } = ctx.conditions;
    /* 1 · hero: 1461 rises through its mask, then the dates, then the small live counter counts up, then the red line leaves the player */
    const days = counterNow().d, first = !!window.LOADER || performance.now() < 2600;
    const html = document.documentElement, digits = $$(".hero-num .d"), dates = $$(".hero-dates > *");
    if (!reduce && first) { MO.heroPending = true;
      const tagEl = $("#tag"), printEl = window.LOADER ? null : $("#heroPrint"); // [loader] the print arrives with the loader
      html.classList.remove("motion-pending"); gsap.set(digits, { y: 0, yPercent: 110 }); gsap.set(dates, { autoAlpha: 0, y: 12 }); // same frame: no flash
      gsap.set(tagEl, { autoAlpha: 0, y: -18, rotation: -2.2 }); if (printEl) gsap.set(printEl, { autoAlpha: 0, y: 10 });
      MO.counting = true; $("#cDays").textContent = "0";
      const o = { v: 0 }, out = $("#cDays");
      // the tag falls a little way on its ribbon and settles (one move, no swinging); 1461 rises as it lands; the print follows
      const heroTL = gsap.timeline({ paused: true })
        .to(tagEl, { autoAlpha: 1, duration: .9, ease: "power1.out" }, 0)
        .to(tagEl, { y: 0, rotation: -1.4, duration: 1.15, ease: "power2.out", clearProps: "transform" }, 0)
        .to(digits, { yPercent: 0, duration: .78, ease: "expo.out", stagger: .04 }, .45)
        .to(printEl || {}, { autoAlpha: 1, y: 0, duration: .9, ease: "power2.out", clearProps: "transform,opacity,visibility" }, .7)
        .to(dates, { autoAlpha: 1, y: 0, duration: .6, ease: "power2.out", stagger: .08 }, 1.35)
        .to(o, { v: days, duration: 1.6, ease: "power2.out", onUpdate: () => { out.textContent = Math.round(o.v).toLocaleString("en-US"); },
          onComplete: () => { MO.counting = false; tick(); } }, 1.85)
        .call(() => scue(), null, 3.25)   // the counter has nearly settled: the scroll cue comes in
      const go = () => { html.classList.remove("tag-wait"); heroTL.play(); };
      if (window.LOADER) window.LOADER.then(go, go); // [loader] the tag falls once the print has landed
      else Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1200))]).then(go, go);
    } else { html.classList.add("tag-fade"); html.classList.remove("motion-pending", "tag-wait"); (window.LOADER || Promise.resolve()).then(() => setTimeout(scue, 900)); }
    /* 2 · red string + pins in route order, scrubbed lightly with scroll */
    const pins = pinEls.map(e => e.g);
    if (reduce) { gsap.set(pins, { opacity: 1, y: 0 }); gsap.set(promiseEls, { opacity: 1 }); }
    else {
      const N = pins.length, tl = gsap.timeline({ defaults: { ease: "none" },
        scrollTrigger: { trigger: svg, start: "top 75%", end: "bottom 60%", scrub: 0.6, once: true,
          onLeave: () => finish() } });
      tl.fromTo(stringPath, { drawSVG: "0%" }, { drawSVG: "100%", duration: N - 1 }, 0);
      pins.forEach((g, i) => tl.fromTo(g, { opacity: 0, y: -5 }, { opacity: 1, y: 0, duration: .6, ease: "power2.out" }, Math.max(0, i - .3)));
      if (C.promise) tl.fromTo(promiseEls, { opacity: 0 }, { opacity: 1, duration: .8 }, C.promise.to - 1);
      // once drawn (or when the map is zoomed), hand the string back to plain SVG so zoom re-layout works
      const finish = () => { if (!tl.scrollTrigger) return; tl.scrollTrigger.kill(); tl.progress(1);
        gsap.set(stringPath, { clearProps: "strokeDasharray,strokeDashoffset" }); };
      MO.finishString = finish;
    }
    /* the red line: drawn on at a few nodes only; without GSAP it's simply there */
    if (!reduce) {
      const draw = (paths, trig, extra) => { const tl = gsap.timeline({ scrollTrigger: { trigger: trig, start: "top 78%", once: true } });
        tl.fromTo(paths, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.5, ease: "power1.inOut" }, 0); if (extra) extra(tl); return tl; };
      // 江湖: the title arrives character by character, then the English and the corner label, then the two lines meet — and it stays still
      const jt = gsap.timeline({ scrollTrigger: { trigger: "#slip", start: "top 82%", once: true } })
        .fromTo("#slip", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: "power2.out" }, 0)
        .fromTo(".lk-jianghu .ch", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .7, ease: "power2.out", stagger: .06 }, .8)
        .fromTo(".lk-jianghu .e", { autoAlpha: 0 }, { autoAlpha: 1, duration: .8, ease: "power1.out" }, 1.3);
      // rolls: the year and its roll label arrive first; then, frame by frame as they reach the screen, each photo develops
      // inside its frame (opacity + a few px) and its words follow. the film strip itself never moves. once only, no scrub, no pin.
      $$(".yr").filter(y => !y.hidden).forEach(y => { const head = y.querySelectorAll(".yr-num, .yr-t");
        gsap.fromTo(head, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .8, ease: "power3.out", stagger: .08, clearProps: "transform",
          scrollTrigger: { trigger: y, start: "top 86%", once: true } });
        const frs = [...y.querySelectorAll(".vfr")], cps = [...y.querySelectorAll(".cp")];
        frs.forEach((f, i) => { const ph = f.querySelector(".ph"), cp = cps[i]; if (!ph) return;
          const t = gsap.timeline({ scrollTrigger: { trigger: f, start: "top 90%", once: true } })
            .fromTo(ph, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .7, ease: "power2.out", clearProps: "transform,opacity,visibility" }, 0);
          if (cp) t.fromTo(cp, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .6, ease: "power2.out", clearProps: "transform,opacity,visibility" }, .18); }); });
      // the ending: the years pass one by one, then only NEXT / chapter stays
      const yrs = $$("#years span"), lk = $(".lk-finale");
      const ytl = gsap.timeline({ scrollTrigger: { trigger: ".fin-title", start: "top 72%", once: true } }).set(lk, { autoAlpha: 0 });
      yrs.forEach((s, i) => ytl.fromTo(s, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: .45, ease: "power1.out" }, i * .8).to(s, { autoAlpha: 0, duration: .4, ease: "power1.in" }, i * .8 + .5));
      ytl.to(lk, { autoAlpha: 1, duration: 1, ease: "power1.out" }, yrs.length * .8 + .1);
    }
    /* the private page: its blocks flow into one another as it scrolls (scroll-linked; transform + opacity only) */
    if (!reduce) { const sx = $("#secret");
      ["#cover", "#pair", "#reelNotes", "#record", "#lyrics", "#weddingPola", "#secret .letter-card"].forEach(sel => { const e = $(sel); if (!e) return;
        gsap.fromTo(e, { autoAlpha: 0, y: 48 }, { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { trigger: e, scroller: sx, start: "top 98%", end: "top 80%", scrub: .5 } }); });
      // the film silhouette drifts a little inside its cover, the pair of prints a little against it
      if ($("#silhouette img")) gsap.fromTo("#silhouette img", { y: 16 }, { y: -16, ease: "none", scrollTrigger: { trigger: "#cover", scroller: sx, start: "top bottom", end: "bottom top", scrub: .5 } });
      $$("#pair .scan").forEach((e, k) => gsap.fromTo(e, { yPercent: k ? 10 : 4 }, { yPercent: k ? -6 : -2, ease: "none", scrollTrigger: { trigger: "#pair", scroller: sx, start: "top bottom", end: "bottom top", scrub: .5 } })); }
    /* the keypad: its keys come up softly, row by row, the first time it reaches the screen */
    if (!reduce) gsap.fromTo("#pad button", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .5, ease: "power2.out", stagger: .035, clearProps: "transform,opacity,visibility",
      scrollTrigger: { trigger: "#pad", start: "top 92%", once: true } });
    /* 3 · the seal breaks: one ~1.2s timeline, transforms + opacity only */
    const halves = $$("#seal .half"), shut = $(".env-shut"), letter = $(".env-letter");
    const seal = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } })
      .set(shut, { autoAlpha: 0 }, 0)
      .to(halves[0], { rotation: -9, x: -9, y: 4, duration: .5 }, .05)
      .to(halves[1], { rotation: 9, x: 9, y: 4, duration: .5 }, .05)
      .to(halves, { autoAlpha: 0, y: 26, duration: .4, ease: "power1.in" }, .55)
      .fromTo(letter, { y: 0 }, { y: -46, duration: .7, ease: "power2.out" }, .7);
    MO.sealTL = done => { if (reduce) { seal.progress(1); done(); return; } seal.eventCallback("onComplete", () => setTimeout(done, 150)); seal.play(0); };
    MO.sealReset = () => { seal.pause(0); gsap.set([shut, ...halves, letter], { clearProps: "all" }); };
    return () => { MO.counting = false; MO.finishString = null; };
  });
  const refresh = () => { try { ScrollTrigger.refresh(); spineSoon(80); } catch (e) {} };
  addEventListener("load", refresh); if (document.fonts) document.fonts.ready.then(refresh);
} catch (e) { motionOff(); } }
// GSAP is optional: the page is complete without it. Load it after the content is on screen;
// if it hasn't arrived within 2.5s (slow network), skip the motion entirely.
(() => { const V = (document.querySelector('script[src^="app.js"]') || {}).src || "", q = (V.split("?")[1] || "");
  const files = ["vendor/gsap.min.js", "vendor/ScrollTrigger.min.js", "vendor/DrawSVGPlugin.min.js"]; let late = false;
  const unhide = () => { document.documentElement.classList.remove("motion-pending"); const drop = () => { document.documentElement.classList.add("tag-fade"); document.documentElement.classList.remove("tag-wait"); }; if (window.LOADER) window.LOADER.then(drop, drop); else drop(); };
  const giveUp = setTimeout(() => { late = true; unhide(); }, 6000);
  const next = i => { if (i === files.length) { clearTimeout(giveUp); if (!late) initMotion(); return; }
    const sc = document.createElement("script"); sc.src = files[i] + (q ? "?" + q : ""); sc.async = false;
    sc.onload = () => next(i + 1); sc.onerror = () => { clearTimeout(giveUp); unhide(); }; document.head.appendChild(sc); };
  next(0); })();
// safety net: if the counter is still running after 2.5s, show the real number
setTimeout(() => { if (MO.counting) { MO.counting = false; tick(); } }, 8000);
})();
