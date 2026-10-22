(() => {
"use strict";
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
const SCN = C.scenes || {}; // photo viewer groups: { id: [{ src, date, place, scene }] }
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
const start = new Date(C.startDate).getTime(), TARGET = 1461;
function tick() {
  let ms = Math.max(0, Date.now() - start);
  const d = Math.floor(ms / 864e5); ms -= d * 864e5;
  const h = Math.floor(ms / 36e5); ms -= h * 36e5;
  const m = Math.floor(ms / 6e4); ms -= m * 6e4;
  if (!MO.counting) $("#cDays").textContent = d.toLocaleString("en-US");
  $("#cH").textContent = pad2(h); $("#cM").textContent = pad2(m); $("#cS").textContent = pad2(Math.floor(ms / 1e3));
}
tick(); setInterval(tick, 1000);

/* ---------- MUSIC ---------- */
const MU = C.music, audio = $("#song"), mini = $("#mini");
const songName = isTodo(MU.title) ? "Side A" : MU.title;
$("#playHint").textContent = (MU.prompt || "").replace(/^▶\s*/, "");
let playing = false, ctx = null, gain = null, fadeT = null;
function setMini() { $("#miniTxt").textContent = songName; mini.classList.toggle("on", playing); const cv = $("#jhCover"); if (cv) cv.classList.toggle("on", playing); }
function fadeTo(v, dur, done) {
  clearInterval(fadeT);
  if (gain) { const t = ctx.currentTime; gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(v, t + dur / 1000); if (done) setTimeout(done, dur); return; }
  const from = audio.volume, t0 = performance.now();
  fadeT = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / dur); audio.volume = from + (v - from) * k; if (k >= 1) { clearInterval(fadeT); done && done(); } }, 40);
}
function play() {
  if (!audio.src) audio.src = MU.src;
  if (!ctx && location.protocol.startsWith("http") && (window.AudioContext || window.webkitAudioContext)) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); const src = ctx.createMediaElementSource(audio); gain = ctx.createGain(); gain.gain.value = 0; src.connect(gain).connect(ctx.destination); } catch (e) { ctx = null; gain = null; }
  }
  if (ctx && ctx.state === "suspended") ctx.resume();
  if (!gain) audio.volume = 0;
  const p = audio.play();
  playing = true; audio.dataset.started = 1; document.body.classList.add("playing"); setMini();
  fadeTo(MU.volume ?? .7, 2600);
  if (p && p.catch) p.catch(() => { playing = false; document.body.classList.remove("playing"); setMini(); });
}
function pause() { playing = false; document.body.classList.remove("playing"); setMini(); fadeTo(0, 600, () => { if (!playing) audio.pause(); }); }
// the player rests as a small record; a tap opens it to show the song for a moment, then it folds back
let miniT = 0; const peek = () => { mini.classList.add("open"); clearTimeout(miniT); miniT = setTimeout(() => mini.classList.remove("open"), 2600); };
const toggle = () => { playing ? pause() : play(); peek(); };
mini.addEventListener("click", toggle);
$("#playHint").addEventListener("click", () => { playing ? pause() : play(); });
// 江湖: the cover of the song he shared is a quiet play / pause for the music on this page
$("#jhCover").addEventListener("click", () => { playing ? pause() : play(); peek(); });
setMini();
// the player is visible from the first screen on (the hint in the hero plays too)
requestAnimationFrame(() => mini.classList.add("show"));
// keep the chip off the words: if text, a photo or a button sits under its resting spot, it tucks into the edge
{ const MEDIA = /^(IMG|BUTTON|A|VIDEO|CANVAS|svg|INPUT)$/;
  const hero = $("#hero");
  const under = () => { if (!mini.classList.contains("show")) return false;
    // on the first screen it always stays out in full (the hero is laid out to keep that corner clear)
    if (hero && hero.getBoundingClientRect().bottom > innerHeight * .5) return false;
    // test the full (unfolded) footprint, so folding to the record alone never flips it back
    const R = mini.offsetLeft + mini.offsetWidth + 6, L = R - 175, B = mini.offsetTop + mini.offsetHeight + 6, T = B - 50;
    const hit = q => q.width && q.left < R && q.right > L && q.top < B && q.bottom > T;
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
  let raf = 0; const check = () => { raf = 0; mini.classList.toggle("tuck", under()); };
  const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
  addEventListener("scroll", queue, { passive: true }); addEventListener("resize", queue);
  // things also slide in after the scroll stops (GSAP reveals), so look again every so often while it is visible
  setInterval(() => { if (mini.classList.contains("show") && !document.hidden) queue(); }, 600);
  new MutationObserver(queue).observe(mini, { attributes: true, attributeFilter: ["class"] }); }


/* ---------- THE DATE: 29 · 30 · 31, the 30th circled ---------- */
{ const K = C.calendar || {}, day = new Date(K.date || "2026-10-30T00:00:00+08:00");
  $("#calScript").textContent = K.script || "";
  $("#calSince").textContent = K.since || "";
  $("#calLine").textContent = day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Shanghai" });
  if (K.print) { const f = $("#calPrint"); f.innerHTML = img(K.print, "") + `<figcaption>${(K.printCaption || []).map((t, i) => `<span class="${i ? "c" : "d"}">${esc(t)}</span>`).join("")}</figcaption>`; }
  else $("#calPrint").remove();
  // (the taped "days to go" card is gone: she shows him the site on 10.30 itself)
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
  b.innerHTML = `<span class="key-n"><span class="nm">${esc(o.name)}</span></span><i class="key-rule"></i><span class="en">${esc(o.en)}</span>`;
  return b;
};
const wrongC = card(HT.wrong, "wrong"), rightC = card(HT.right, "right");
$("#hotels").append(wrongC, rightC);
const xm = el("span", "mark strike", '<svg viewBox="0 0 100 10" preserveAspectRatio="none"><path pathLength="1" d="M0 6 L100 4"/></svg>'); wrongC.querySelector(".key-n").append(xm); hairIO.observe(xm);
const stamp = el("span", "stamp", esc(HT.stamp || "扣分")); wrongC.append(stamp);
const okr = el("span", "mark okring", MARK.circle); rightC.append(okr);
const qParts = (HT.quote.match(/[^，！。？]+[，！。？]?/g) || [HT.quote]);
$("#then").innerHTML = `<span class="qm o">“</span>${qParts.map((t, i) => `<span class="l l${i + 1}">${esc(t)}</span>`).join("")}<span class="qm c">”</span><span class="pen">${(HT.quoteEn || []).map(esc).join("<br>")}</span>`;
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
  redraw(xm); stamp.classList.remove("go"); void stamp.offsetWidth; stamp.classList.add("go");
  if (score > 0) { setScore(score - 20); float(wrongC, "−20"); }
  $("#then").classList.add("show");
});
rightC.addEventListener("click", () => {
  redraw(okr);
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
const seen = {};
const pos = S.map(s => { const p = placeById[s.city]; const [x, y] = proj(p.lon, p.lat); const n = seen[s.city] = (seen[s.city] || 0) + 1; return { x, y, rep: n - 1 }; });
const stringPath = sv("path", { class: "string draw" });
const promisePath = sv("path", { class: "promise" });
const promiseLbl = sv("text", { class: "promise-lbl", "text-anchor": "middle" }); promiseLbl.textContent = C.promise ? C.promise.label : "";
svg.append(stringPath, promisePath, promiseLbl);
const pinEls = [], lblEls = {};
S.forEach((s, i) => {
  const g = sv("g", { class: "pin" + (s.highlight ? " hi" : ""), tabindex: 0, role: "button", "aria-label": `${pad2(i + 1)} ${placeById[s.city].name}` });
  const hit = sv("circle", { class: "hit" }), sh = sv("ellipse", { class: "sh" }), ring = sv("circle", { class: "ring" }), hd = sv("circle", { class: "hd", fill: "url(#pinG)" }), hl = sv("circle", { class: "hl" });
  const num = sv("text", { class: "num" }); num.textContent = pad2(i + 1);
  g.append(hit, sh, ring, hd, hl, num); svg.append(g);
  g.addEventListener("click", () => openPlace(i, g));
  g.addEventListener("keydown", e => { if (e.key === "Enter") openStop(i); });
  pinEls.push({ g, hit, sh, ring, hd, hl, num });
  if (!lblEls[s.city]) { const t = sv("text", { class: "plbl" }); t.textContent = placeById[s.city].name; svg.append(t); lblEls[s.city] = t; }
});
function layoutMap(z) {
  const pxPerUnit = (svg.getBoundingClientRect().width || 360) / (z * M.w), hitR = Math.max(6.6 * z * 1.4, 22 / pxPerUnit);
  const P = pos.map(p => p.rep ? { x: p.x + 11 * z * p.rep, y: p.y - 9 * z * p.rep } : p);
  let d = `M${P[0].x} ${P[0].y}`;
  for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], L = Math.hypot(b.x - a.x, b.y - a.y); d += ` Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + L * .12} ${b.x} ${b.y}`; }
  stringPath.setAttribute("d", d);
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
  Object.entries(lblEls).forEach(([id, t]) => { const p = placeById[id], [x, y] = proj(p.lon, p.lat), [dx, dy, an] = LBL[id] || [9, 3, "start"];
    t.setAttribute("x", x + dx * z); t.setAttribute("y", y + dy * z); t.setAttribute("text-anchor", an); t.setAttribute("font-size", 11.5 * z); t.style.strokeWidth = 3.2 * z; });
}
// on a phone the map gets a tighter, taller frame around the route (it runs near full width)
const fullVB = innerWidth < 900 ? [4, 30, 416, 430] : [5, 0, M.w - 10, M.h];
svg.style.aspectRatio = `${fullVB[2]} / ${fullVB[3]}`;
function box(l0, a1, l1, a0) { const [x0, y0] = proj(l0, a1), [x1, y1] = proj(l1, a0); const w = x1 - x0, h = y1 - y0, s = Math.max(w, h); return [x0 + (w - s) / 2, y0 + (h - s) / 2, s, s]; }
const regions = { all: fullVB, yrd: box(117.6, 32.6, 123.6, 28.4), prd: box(111.6, 24.8, 116.4, 21), ne: box(124, 41, 142, 30) };
let vb = fullVB.slice();
const applyVB = v => { svg.setAttribute("viewBox", v.join(" ")); layoutMap(v[2] / M.w); };
function animVB(to) { const from = vb.slice(), t0 = performance.now(), Dur = 800;
  const st = t => { let k = Math.min(1, (t - t0) / Dur); k = k < .5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2; vb = from.map((f, i) => f + (to[i] - f) * k); applyVB(vb); if (k < 1) requestAnimationFrame(st); };
  requestAnimationFrame(st); }
applyVB(vb);
$("#zoom").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; MO.finishString && MO.finishString(); $("#zoom .on").classList.remove("on"); b.classList.add("on"); animVB(regions[b.dataset.z]); });
S.forEach((s, i) => { const b = el("button", s.highlight ? "hi" : "", `<small>${pad2(i + 1)}</small>${esc(placeById[s.city].name)}`); b.onclick = () => openPlace(i, b); $("#chips").append(b); });

let cur = 0; const pc = $(".pola-card");
/* ---------- TRAVEL: the map is the navigation layer of a photo story ---------- */
// one gallery for the whole route: swiping walks from stop to stop
const ROUTE = GROUPS.route = [], firstOf = {};
S.forEach((s, i) => { const p = placeById[s.city], srcs = s.scans && s.scans.length ? s.scans : stopPhotos(s), notes = s.photoNotes || [];
  srcs.forEach((src, k) => { if (k === 0) firstOf[i] = ROUTE.length;
    ROUTE.push({ src, place: `${pad2(i + 1)} ${p.name}`, date: notes[k] || s.scansDate || s.note || "", caption: k === 0 && !isTodo(s.memory) ? s.memory : "", scene: srcs.length === 1 || k === 0 ? s.scene : null }); }); });
function openPlace(i, from) { pinEls.forEach((e, j) => e.g.classList.toggle("on", j === i));
  if (firstOf[i] != null) openViewer("route", firstOf[i], from); else openStop(i); }
/* ---------- PLACE BOARDS: the photos of one place gathered on one scrapbook board ---------- */
// each board: the place in English + numerals, the Chinese name smaller, then the prints (numbered) on lined sheets
// held by one real object (binder clip / gold pin / tape / wax seal), then the real lines, numbered to match.
// every line is the site's own text: a print's date / title / words come from its entry in the rolls (or its map stop).
const LINE = {};
C.chapters.forEach(c => { let prev = null;
  c.items.forEach(m => { const own = !(isTodo(m.title) && isTodo(m.date) && isTodo(m.text));
    const ln = own ? { date: isTodo(m.date) ? "" : m.date, title: isTodo(m.title) ? "" : m.title, text: isTodo(m.text) ? "" : m.text, milestone: !!m.milestone } : prev;
    [m.photo, ...(m.scans || [])].filter(Boolean).forEach((src, k) => { LINE[src] = { ...(ln || { date: c.year, title: "", text: "" }), scene: m.scene, same: !own || k > 0, key: ln }; });
    if (m.milestone) LINE["milestone"] = { ...ln };
    if (own && !m.milestone) prev = ln; }); });
S.forEach(s => stopPhotos(s).forEach((src, k) => { if (!LINE[src]) LINE[src] = { date: (s.photoNotes || [])[k] || s.note || "", title: placeById[s.city].name, text: "" }; }));
// layouts (units = % of the board width): prints [x, y, w, rotate, border], lined sheets [x, y, w, h, rotate], the board height
const LAY = {
  chongqing: { h: 130, sheets: [[30, 2, 66, 70, 1.6], [0, 72, 72, 56, -1.2]],
    p: [[4, 8, 50, -2.5, "r"], [56, 13, 40, 2.5, "w"], [5, 76, 34, 2, "w"], [37, 73, 30, -2, "w"], [66, 71, 32, 3, "r"]] },
  beijing: { h: 92, sheets: [[8, 2, 70, 84, -1.4]], p: [[3, 10, 52, -2.5, "r"], [58, 3, 38, 3, "w"]] },
  hangzhou: { h: 176, sheets: [[0, 0, 100, 52, 0], [20, 98, 78, 74, 1.2]],
    p: [[2, 5, 31, -1, "w"], [34.5, 5, 31, .8, "w"], [3, 58, 27, -3, "w"], [67, 5, 31, -.6, "w"], [32, 54, 36, 2, "r"], [67, 59, 31, -2, "w"], [5, 116, 33, -1.5, "w"], [40, 110, 33, 2, "r"], [74, 110, 24, -3, "s"], [72, 140, 24, 3, "s"]] },
  dali: { h: 112, sheets: [[2, 4, 62, 74, -1.6]], p: [[5, 9, 52, -3, "w"], [26, 66, 70, 1.8, "r"]] },
  kk: { h: 88, sheets: [[30, 0, 64, 84, 1.4]], p: [[4, 7, 49, -2, "r"], [48, 14, 47, 2.5, "w"]] },
};
const bLines = (list) => `<ol class="bd-lines">${list.map(l => `<li><span class="n">${l.n}</span><span class="ln">${l.d ? `<span class="d">${esc(l.d)}</span>` : ""}${l.k ? `<span class="k">${esc(l.k)}</span>` : ""}${l.t ? `<span class="t">${l.t.split(" · ").map(w => `<span class="nw">${esc(w)}</span>`).join(" · ")}</span>` : ""}${l.x ? `<span class="bx">${nobr(l.x)}</span>` : ""}</span></li>`).join("")}</ol>`;
(() => { const host = $("#story"); if (!host || !C.boards) return; host.id = "boards"; host.className = "boards";
  const stopsOf = city => S.map((s, i) => ({ s, i })).filter(o => o.s.city === city);
  const mems = cities => { const out = [];
    cities.forEach(city => stopsOf(city).forEach(({ s }) => { if (!isTodo(s.memory) && s.memory !== (C.hotel && C.hotel.quote)) out.push({ m: s.memory, city }); if (s.song) out.push({ song: s.song }); }));
    return out; };   // 重庆's memory is the Marriott line, told in full in chapter 02
  const printEl = (src, n, slot, gid, vi, alt) => { const [x, y, w, r, b] = slot, [iw, ih] = SIZES[src] || [3, 4];
    const f = el("figure", `bp bp-${b}`); f.style.cssText = `--x:${x};--y:${y};--w:${w};--r:${r}deg;z-index:${2 + (b === "r" ? 1 : 0)}`;
    f.innerHTML = `<div class="bp-ph" style="aspect-ratio:${iw}/${ih}">${img(src, alt)}</div><span class="bp-n">${pad2(n)}</span>`;
    f.dataset.vg = gid; f.dataset.vi = vi; f.setAttribute("role", "button"); f.tabIndex = 0; f.setAttribute("aria-label", alt + " · 放大"); return f; };
  C.boards.forEach((b, bi) => {
    const cities = b.strip ? b.cities : [b.city], gid = "board" + bi, G = GROUPS[gid] = [];
    const bd = el("article", "bd" + (b.strip ? " bd-strip" : " bd-" + b.city));
    // the real lines, in print order; prints that continue the same entry share its line
    const lines = []; let lastKey = null;
    const memText = mems(cities).filter(m => m.m).map(m => m.m);
    b.photos.forEach((src, k) => { const L = LINE[src] || {}, n = pad2(k + 1);
      const covered = L.text && memText.some(m => m.includes(L.text));   // said in full in the place's own words below
      G.push({ src, place: L.title || (placeById[cities[0]] || {}).name || "", date: L.date || "", caption: covered ? "" : L.text || "", scene: L.scene });
      if (L.key && L.key === lastKey && lines.length) { lines[lines.length - 1].n += " · " + n; return; }
      lastKey = L.key || null; lines.push({ n, key: L.key, d: L.date, t: L.title, x: covered ? "" : L.text }); });
    (b.lines || []).forEach(src => { const L = src === "milestone" ? LINE.milestone : LINE[src]; if (!L || (L.key && lines.some(l => l.key === L.key))) return;
      const covered = L.text && memText.some(m => m.includes(L.text));
      const at = lines.findIndex(l => l.d && L.date && l.d > L.date), row = { n: "—", d: L.date, k: L.milestone ? "Milestone" : "", t: L.title, x: covered ? "" : L.text };
      at < 0 ? lines.push(row) : lines.splice(at, 0, row); });
    if (b.strip) {
      const row = el("div", "bs-row");
      b.photos.forEach((src, k) => { const city = cities[k], p = placeById[city], L = LINE[src] || {};
        const col = el("div", "bs-col"); col.append(printEl(src, k + 1, [0, 0, 100, 0, "w"], gid, k, p.name));
        col.insertAdjacentHTML("beforeend", `<p class="bs-en">${esc(p.en)}</p><p class="bs-cn">${esc(p.name)}</p>`); row.append(col); });
      row.insertAdjacentHTML("afterbegin", '<img class="tape-img bs-tape" src="assets/tape.webp" width="360" height="90" alt="" loading="lazy">');
      bd.append(row);
    } else {
      const p = placeById[b.city], st = stopsOf(b.city), L = LAY[b.city];
      const tag = (p.home || st.map(o => o.s.note).find(nt => nt && !/\d/.test(nt) && !b.photos.some(src => (LINE[src] || {}).date === nt)) || "");
      bd.append(el("header", "bd-h", `<span class="bd-no">${st.map(o => pad2(o.i + 1)).join(" · ")}</span><h3 class="bd-en"><span class="nw">${esc(p.en)}</span> <b>${esc(b.years || "")}</b></h3><p class="bd-cn">${esc(p.name)}${tag ? ` · ${esc(tag)}` : ""}</p><span class="bd-geo">${geo(p)}</span>`));
      const box = el("div", "bd-c"), stage = el("div", "bd-stage"); stage.style.setProperty("--h", L.h); box.append(stage);
      L.sheets.forEach(([x, y, w, h, r]) => { const s = el("i", "bd-sheet"); s.style.cssText = `--x:${x};--y:${y};--w:${w};--hh:${h};--r:${r}deg`; stage.append(s); });
      const prints = b.photos.map((src, k) => { const f = printEl(src, k + 1, L.p[k], gid, k, ((LINE[src] || {}).title || p.name)); stage.append(f); return f; });
      // one real object per board
      const lead = prints[b.deco === "seal" ? 1 : b.deco === "pin" ? 4 : 1] || prints[0], [x, y, w] = L.p[prints.indexOf(lead)];
      if (b.deco === "clip") { const c = el("img", "bd-clip"); Object.assign(c, { src: "assets/clip.webp", width: 120, height: 225, alt: "", loading: "lazy" }); c.style.cssText = `--x:${x + 6};--y:${y - 13}`; stage.append(c); }
      if (b.deco === "pin") { const c = el("i", "bd-pin"); c.style.cssText = `--x:${x + w / 2 - 2.2};--y:${y - 1}`; stage.append(c); }
      if (b.deco === "tape") { const c = el("img", "tape-img bd-tape"); Object.assign(c, { src: "assets/tape.webp", width: 360, height: 90, alt: "", loading: "lazy" }); c.style.cssText = `--x:${x + w - 14};--y:${y - 3}`; stage.append(c); }
      if (b.deco === "seal") { const sv = st.map(o => o.s.seal).find(Boolean); const c = el("span", "bd-seal", `<img src="assets/seal.webp" width="200" height="198" alt="" loading="lazy"><span class="seal-t">${esc(sv || "")}</span>`); const [iw, ih] = SIZES[b.photos[prints.indexOf(lead)]] || [3, 4]; c.style.cssText = `--x:${x + w - 12};--y:${y + (w - 4.8) * ih / iw - 4}`; stage.append(c); }
      bd.append(box);
    }
    if (b.strip) b.photos.forEach((src, k) => { const p = placeById[cities[k]]; if (!lines[k]) return; if (!lines[k].t) lines[k].t = p.name; });
    bd.insertAdjacentHTML("beforeend", bLines(lines));
    const ms = mems(cities); if (ms.length) bd.append(el("div", "bd-words", ms.map(m => m.m ? `<p>${b.strip ? `<small>${esc(placeById[m.city].en)}</small>` : ""}${nobr(m.m)}</p>` : `<span class="bd-song">${esc(m.song)}</span>`).join("")));
    host.append(bd);
  });
  // the stops with no photo of their own yet: named once, in route order
  const boarded = new Set(C.boards.flatMap(b => b.strip ? b.cities : [b.city]));
  const rest = S.map((s, i) => ({ s, i })).filter(o => !boarded.has(o.s.city));
  if (rest.length) host.append(el("p", "bd-rest", rest.map(({ s, i }) => { const p = placeById[s.city];
    return `<span class="nw"><small>${pad2(i + 1)}</small> ${esc(p.en)} <i>${esc(p.name)}</i>${s.note ? ` <em>${esc(s.note)}</em>` : ""}</span>`; }).join(" ")));
})();
function openStop(i) {
  cur = (i + S.length) % S.length; const s = S[cur], p = placeById[s.city];
  pinEls.forEach((e, j) => e.g.classList.toggle("on", j === cur));
  $("#sIdx").innerHTML = `<b>${pad2(cur + 1)}</b> / ${S.length}<span>${esc(p.country)}${s.note ? " · " + esc(s.note) : ""}</span>`;
  $("#sName").textContent = p.name; $("#sEn").textContent = p.en;
  pc.classList.toggle("scan-mode", !!(s.scans && s.scans.length));
  const gid = "stop" + cur, G = GROUPS[gid] = [], note0 = s.note || "";
  const tapC = (box, src, k, date) => { G[k] = { src, place: p.name, date: date || note0, scene: k === 0 ? s.scene : null }; box.dataset.vg = gid; box.dataset.vi = k;
    box.setAttribute("role", "button"); box.tabIndex = 0; box.setAttribute("aria-label", p.name + " · 放大"); };
  if (s.scans && s.scans.length) { const sc = el("div", "scans"); sc.id = "sPhoto";
    s.scans.forEach((src, k) => { const f = el("figure", "scan", `<i class="tape top"></i>${img(src, `${p.name} · ${s.scansDate || ""}`)}`); tapC(f, src, k, s.scansDate); sc.append(f); });
    if (s.scansDate) sc.append(el("span", "scan-date", esc(s.scansDate)));
    $("#sPhoto").replaceWith(sc);
  } else {
    const list = stopPhotos(s);
    const ph = photoBox(list[0], `photos/${s.city}.jpg`, false, p.name); ph.id = "sPhoto"; if (s.tall) ph.classList.add("tall");
    const notes = s.photoNotes || [], nt = el("span", "ph-date", notes[0] ? esc(notes[0]) : ""); if (notes.length) ph.append(nt);
    list.forEach((src, k) => { G[k] = { src, place: p.name, date: notes[k] || note0, scene: list.length === 1 ? s.scene : null }; });
    if (list[0]) { tapC(ph, list[0], 0, notes[0]); if (s.scene && SCN[s.scene]) ph.insertAdjacentHTML("beforeend", '<span class="cue-mark" aria-hidden="true"></span>'); }
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
// two more lengths of film lie under this one, slightly askew (the stack of four years)
strip.parentNode.insertAdjacentHTML("afterbegin", '<i class="film-ghost g1" aria-hidden="true"><i class="sprk a"></i><i class="sprk b"></i></i><i class="film-ghost g2" aria-hidden="true"><i class="sprk a"></i><i class="sprk b"></i></i>');
// the strip slides out of the canister once it comes into view
if ("IntersectionObserver" in window && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
  strip.classList.add("pull"); const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { strip.classList.add("in"); io.disconnect(); } }), { threshold: .35 }); io.observe(strip.parentNode); }

C.chapters.forEach((c, ci) => {
  const ph = c.items.find(m => m.photo);
  const f = el("button", "fr", `<i class="fr-code" aria-hidden="true">▸ ${ci * 2 + 1}&nbsp;&nbsp;${ci * 2 + 1}A</i><i class="fr-ph">${c.thumb || ph ? img(c.thumb || ph.photo) : ""}</i><span>${esc(c.year)}</span>`); f.setAttribute("aria-label", c.year);
  f.onclick = () => openPop(ci); strip.append(f);
});
// tap a roll: that year comes up as one print with one line (swipe sideways for the next year, down or tap to close)
const YR = C.chapters.map(c => ({ year: c.year, ...(c.pop || {}) })).filter(y => y.photo);
$("#chapterList")?.remove();
let ypEl = null, ypI = 0;
function ypDOM() { if (ypEl) return ypEl;
  const v = el("div", "ypop"); v.setAttribute("role", "dialog"); v.setAttribute("aria-modal", "true"); v.setAttribute("aria-label", "Rolls");
  v.innerHTML = `<div class="yp-bg"></div><div class="yp-card"><nav class="yp-tabs">${YR.map((y, i) => `<button type="button" data-yi="${i}">${esc(y.year).replace(/[–-]/, "–")}</button>`).join("")}</nav>
    <figure class="yp-print"><div class="yp-ph"></div><i class="sprk a" aria-hidden="true"></i><i class="sprk b" aria-hidden="true"></i><span class="edge" aria-hidden="true"></span></figure>
    <div class="yp-cap"><b class="yp-d"></b><span class="yp-en"></span><span class="yp-cn"></span></div></div>
    <button class="x yp-x" type="button" aria-label="关闭"><i></i></button>`;
  document.body.append(v); ypEl = v;
  v.addEventListener("click", e => { const t = e.target.closest("[data-yi]"); if (t) { showYear(+t.dataset.yi); return; } closePop(); });
  let sx = 0, sy = 0;
  v.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  v.addEventListener("touchend", e => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); showYear((ypI + (dx < 0 ? 1 : -1) + YR.length) % YR.length); }
    else if (dy > 70) { e.preventDefault(); closePop(); } });
  return v; }
function showYear(i) { const v = ypDOM(), y = YR[i]; ypI = i;
  v.querySelectorAll("[data-yi]").forEach(b => b.classList.toggle("on", +b.dataset.yi === i));
  const ph = v.querySelector(".yp-ph"); ph.innerHTML = img(y.photo, `${y.year} · ${y.cn || ""}`, true); const [w0, h0] = SIZES[y.photo] || [4, 5]; ph.style.aspectRatio = w0 > h0 ? `${w0}/${h0}` : "4/5";   // portrait frames are all 4:5 (cover)
  v.querySelector(".edge").innerHTML = `1461 · ROLL ${pad2(C.chapters.findIndex(c => c.year === y.year) + 1)} · ${esc(y.year)}`;
  v.querySelector(".yp-d").textContent = y.date || y.year; v.querySelector(".yp-en").textContent = y.en || ""; v.querySelector(".yp-cn").innerHTML = y.cn ? nobr(y.cn) : "";
  v.classList.remove("swap"); void v.offsetWidth; v.classList.add("swap");
  $$("#stripH .fr").forEach((f, k) => f.classList.toggle("on", k === i)); }
function openPop(ci) { const i = Math.max(0, YR.findIndex(y => y.year === C.chapters[ci].year)); const v = ypDOM(); showYear(i);
  v.classList.add("open"); document.body.style.overflow = "hidden"; requestAnimationFrame(() => v.classList.add("in")); }
function closePop() { if (!ypEl) return; ypEl.classList.remove("in", "open"); document.body.style.overflow = ""; $$("#stripH .fr").forEach(f => f.classList.remove("on")); }
addEventListener("keydown", e => { if (e.key === "Escape" && ypEl && ypEl.classList.contains("open")) closePop(); });
// time track: the red line runs down the margin between the years


/* ---------- FINALE ---------- */
const F = C.finale;
$("#years").innerHTML = ["2022", "2023", "2024", "2025", "2026"].map(y => `<span>${y}</span>`).join("");
$("#lcTitle").textContent = F.lockedTitle; $("#envTo").textContent = C.him; $("#fTL").innerHTML = paren(["For", C.him]); $("#fTR").innerHTML = paren(["From", F.signature]);
// the real seal, lifted off the envelope photograph; two halves along a crack so it can break
const CRACK_L = "polygon(0 0, 52% 0, 47% 18%, 54% 34%, 46% 52%, 55% 68%, 48% 84%, 53% 100%, 0 100%)";
const CRACK_R = "polygon(52% 0, 100% 0, 100% 100%, 53% 100%, 48% 84%, 55% 68%, 46% 52%, 54% 34%, 47% 18%)";
function sealHTML(text) { const face = `<img src="assets/seal.webp" width="200" height="198" alt=""><span class="seal-t">${esc(text)}</span>`;
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
    if (code.length === LEN) { checking = true; setTimeout(check, 200); }
  };
  $("#pad").append(b);
});
function check() {
  if (code === String(F.code)) { checking = false; unlock(); return; }
  dotsEl.classList.add("bad"); if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
  setTimeout(() => { dotsEl.classList.remove("bad"); code = ""; checking = false; dots.forEach(x => x.classList.remove("f")); }, 650);
}

/* hidden page */
$("#letterTitle").textContent = F.letterTitle;
$("#letter").innerHTML = F.letter.map((p, i) => {
  if (i === F.letter.length - 1 && p.trim() === F.closing.trim()) return `<p class="close-line">${esc(p)}</p>`;
  const t = txt(p); return t ? `<p class="${i === 0 && /[:：]$/.test(p) ? "salute" : ""}">${t}</p>` : "";
}).join("");
$("#sig").innerHTML = isTodo(F.signature) ? txt(F.signature) : `<span class="script">${esc(F.signature)}</span>`;
const sp = $("#secPola"); if (sp) sp.append(photoBox(F.photo, "photos/us.jpg", false, F.photoCaption)); const pcap = txt(F.photoCaption); if (pcap) sp.append(el("figcaption", "", pcap));
const STAR = '<svg viewBox="0 0 40 40"><path d="M20 2 L22.2 17.8 L38 20 L22.2 22.2 L20 38 L17.8 22.2 L2 20 L17.8 17.8 Z"/></svg>';
const SUN = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="7"/><path d="M20 4V9M20 31V36M4 20H9M31 20H36M8.7 8.7L12.2 12.2M27.8 27.8L31.3 31.3M31.3 8.7L27.8 12.2M12.2 27.8L8.7 31.3"/></svg>';
if (F.rings) $("#rings").innerHTML = F.rings.map((r, i) => `<div class="r"><b>${esc(r.name)}</b><span>${esc(r.is)}</span><small>${esc(r.item)}</small></div>`).join('<span class="x2">×</span>');
if (F.lyrics) $("#lyrics").innerHTML = `<h4>${esc(F.lyricTitle)}</h4>` + F.lyrics.map(([jp, cn]) => `<div class="ln"><span class="jp" lang="ja">${esc(jp)}</span><span class="cn">${esc(cn)}</span></div>`).join("") ;
if (F.pair && F.pair.scans) $("#pair").innerHTML = F.pair.scans.map(src => `<figure class="scan"><i class="tape top"></i>${img(src, F.pair.caption || "")}</figure>`).join("") + (F.pair.caption ? `<p class="pair-cap">${esc(F.pair.caption)}</p>` : "");
const W8 = F.wedding, wp = $("#weddingPola");
if (W8) { wp.append(W8.photo ? photoBox(W8.photo) : el("div", "ph"));
  wp.append(el("figcaption", "", `${esc(W8.label)} · ${esc(W8.date)} · <em>${esc(W8.status)}</em>`)); }
// Freezer-Door style silhouette (traced from the 大理 shadows, filled with our photos)
if (F.silhouette) $("#silhouette").innerHTML = img(F.silhouette, `${C.him} & 我`) + (F.silhouetteCaption ? `<figcaption>${esc(F.silhouetteCaption)}</figcaption>` : "");
/* ---------- THE RECORD: after the passcode, one vinyl (Polaris · Aimer) with the four years round its rim ---------- */
// a View-Master ring of 14 frames on a slowly turning record; the viewer window above shows one frame large.
// it moves on every few seconds; tap the window or the record for the next, tap a small frame to go to it.
// (there is no Polaris audio on the site, so the record turns on its own; the music player stays Oxygen Boy.)
(() => { const host = $("#reel"), R = C.reel; if (!host || !R) return;
  const list = (R[R.set] || R.recap || []).filter(f => f.photo), N = list.length; if (!N) return;
  const span = `${(C.startDate || "").slice(0, 10).replace(/-/g, ".")} – ${((C.calendar || {}).date || "").slice(0, 10).replace(/-/g, ".")}`;
  const G = GROUPS.reel = list.map(f => ({ src: f.photo, date: f.date, place: f.en }));
  host.innerHTML = `<figure class="vm-win" role="button" tabindex="0" aria-label="next"><div class="vm-ph"></div><figcaption class="vm-cap"><span class="vm-n"></span><span class="vm-d"></span><span class="vm-p"></span></figcaption></figure>
    <div class="vm-disc-wrap"><div class="vm-disc" role="group" aria-label="${esc(H.title || "")}">
      <i class="vm-grooves"></i><i class="vm-sheen"></i>
      ${list.map((f, k) => { const a = k * 360 / N;
        return `<button class="vm-slot" type="button" data-k="${k}" style="--a:${a}deg" aria-label="${pad2(k + 1)} ${esc(f.date)} ${esc(f.en)}"><span class="vm-f">${img(f.photo, `${f.date} ${f.en}`)}</span></button>
          <span class="vm-lb" style="--a:${a}deg"><b>${k + 1}</b><span>${esc(f.date)}</span><span>${esc(f.en)}</span></span>`; }).join("")}
      <div class="vm-label"><span class="vm-song"><i>Polaris</i> · Aimer</span><b class="vm-title">${esc(H.title || "").replace(/\s+(WITH\b)/i, "</b><b class=\"vm-title t2\">$1")}</b><span class="vm-span">${esc(span)}</span><i class="vm-hole"></i></div>
    </div></div>`;
  const disc = host.querySelector(".vm-disc"), ph = host.querySelector(".vm-ph");
  let k = 0, turn = 0, timer = 0, idle = 0;
  const show = (j, dir = 1) => { const prev = k; k = (j + N) % N;
    let d = k - prev; if (dir > 0 && d <= 0) d += N; if (dir < 0 && d >= 0) d -= N; if (j === prev) d = 0; turn += d;
    const f = list[k]; ph.innerHTML = img(f.photo, `${f.date} ${f.en}`, true);
    host.querySelector(".vm-n").textContent = k + 1; host.querySelector(".vm-d").textContent = f.date; host.querySelector(".vm-p").textContent = f.en;
    host.querySelectorAll(".vm-slot").forEach(s => s.classList.toggle("on", +s.dataset.k === k));
    ph.classList.remove("in"); void ph.offsetWidth; ph.classList.add("in"); };
  const auto = () => { clearInterval(timer); if (reduced) return; timer = setInterval(() => { if ($("#secret").classList.contains("open") && Date.now() > idle) show(k + 1); }, 3800); };
  const user = j => { idle = Date.now() + 7000; show(j, j === k + 1 || j === 0 && k === N - 1 ? 1 : (j - k + N) % N <= N / 2 ? 1 : -1); };
  host.addEventListener("click", e => { const s = e.target.closest(".vm-slot"); if (s) { user(+s.dataset.k); return; } if (e.target.closest(".vm-win, .vm-disc")) user(k + 1); });
  host.querySelector(".vm-win").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); user(k + 1); } });
  let sx = 0; host.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
  host.addEventListener("touchend", e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) { e.preventDefault(); user(k + (dx < 0 ? 1 : -1)); } });
  show(0); auto();
})();
function unlock() {
  const openPage = () => { const s = $("#secret"); s.classList.add("open"); s.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
    s.scrollTop = 0; s.focus({ preventScroll: true }); s.classList.add("dev"); };
  $("#envelope").classList.add("open");
  if (MO.sealTL) (() => { try { MO.sealTL(openPage); } catch (e) { motionOff(); openPage(); } })(); else setTimeout(openPage, 300);
}
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

/* ---------- PHOTO VIEWER (one system for every photo; 冰箱花 / 大理 add a scene on top) ----------
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
function fitRect(src) { const [w, h] = SIZES[src] || [1200, 1600], vw = innerWidth, vh = innerHeight, k = Math.min(vw * .9 / w, vh * .7 / h);
  const fw = w * k, fh = h * k; return { left: (vw - fw) / 2, top: (vh - fh) / 2 - vh * .02, width: fw, height: fh, cover: Math.max(vw / fw, vh / fh) }; }
function flipFrom(o, f) { const s = Math.max(o.width / f.width, o.height / f.height);
  return `translate(${o.left + o.width / 2 - (f.left + f.width / 2)}px, ${o.top + o.height / 2 - (f.top + f.height / 2)}px) scale(${s})`; }
function fillViewer(item, f) { const v = V.el, im = v.querySelector(".v-img");
  im.src = item.src; Object.assign(im.style, { left: f.left + "px", top: f.top + "px", width: f.width + "px", height: f.height + "px", transformOrigin: "50% 50%" });
  v.querySelector(".v-place").textContent = item.place || ""; v.querySelector(".v-date").textContent = item.date || "";
  v.querySelector(".v-count").textContent = V.g.length > 1 ? `${V.i + 1} / ${V.g.length}` : "";
  v.querySelector(".v-cap").textContent = item.caption || "";
  const S = item.scene && SCN[item.scene]; v.classList.remove("scene", "scene-run");
  v.querySelector(".v-l1").textContent = S ? S.lines[0] || "" : ""; v.querySelector(".v-l2").textContent = S ? S.lines[1] || "" : "";
  return S; }
function runScene(S, f) { const v = V.el, im = v.querySelector(".v-img"); v.classList.add("scene");
  if (reduced) { v.classList.add("scene-run"); return; }
  im.style.transformOrigin = S.origin || "50% 50%";
  requestAnimationFrame(() => { v.classList.add("scene-run"); im.style.transition = "transform 7s cubic-bezier(.35,0,.2,1)"; im.style.transform = `scale(${(f.cover * (S.zoom || 1.4)).toFixed(3)})`; }); }
function openViewer(gid, i, box) {
  const g = GROUPS[gid]; if (!g || !g[i] || V.busy) return; const v = viewerDOM(), im = v.querySelector(".v-img");
  V.g = g; V.i = +i; V.from = box; V.gid = gid; const item = g[V.i], f = fitRect(item.src), S = fillViewer(item, f);
  const o = (box.querySelector("img") || box).getBoundingClientRect();
  im.style.transition = "none"; im.style.transform = reduced ? "none" : flipFrom(o, f); im.style.opacity = reduced ? "1" : ".4";
  v.classList.add("open"); document.body.style.overflow = "hidden"; V.lastFocus = document.activeElement;
  requestAnimationFrame(() => requestAnimationFrame(() => { im.style.transition = "transform .55s cubic-bezier(.2,.8,.2,1), opacity .35s"; im.style.transform = "none"; im.style.opacity = "1"; v.classList.add("in");
    v.focus({ preventScroll: true }); }));
  if (S) setTimeout(() => { if (V.g === g && V.i === +i && v.classList.contains("open")) runScene(S, f); }, reduced ? 0 : 650);
}
function step(d) { if (!V.g || V.g.length < 2) return; const v = V.el, im = v.querySelector(".v-img");
  V.i = (V.i + d + V.g.length) % V.g.length; const item = V.g[V.i], f = fitRect(item.src);
  im.style.transition = "opacity .2s, transform .2s"; im.style.opacity = "0"; im.style.transform = `translateX(${-d * 40}px)`;
  setTimeout(() => { const S = fillViewer(item, f); im.style.transition = "none"; im.style.transform = `translateX(${d * 40}px)`;
    requestAnimationFrame(() => requestAnimationFrame(() => { im.style.transition = "opacity .3s, transform .35s cubic-bezier(.2,.8,.2,1)"; im.style.opacity = "1"; im.style.transform = "none"; }));
    V.from = document.querySelector(`[data-vg="${V.gid}"][data-vi="${V.i}"]`) || V.from;
    if (S) setTimeout(() => runScene(S, f), 450); }, 200); }
function closeViewer() { const v = V.el; if (!v || !v.classList.contains("open") || V.busy) return; V.busy = true;
  const im = v.querySelector(".v-img"), item = V.g[V.i], f = fitRect(item.src), box = V.from && V.from.isConnected ? (V.from.querySelector("img") || V.from) : null;
  const o = box && box.getBoundingClientRect(), onScreen = o && o.bottom > 0 && o.top < innerHeight;
  v.classList.remove("in", "scene-run");
  im.style.transition = "transform .45s cubic-bezier(.4,0,.2,1), opacity .45s";
  im.style.transform = onScreen && !reduced ? flipFrom(o, f) : "scale(.96)"; im.style.opacity = onScreen ? ".6" : "0";
  setTimeout(() => { v.classList.remove("open", "scene"); im.removeAttribute("src"); document.body.style.overflow = ""; V.busy = false;
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
  document.documentElement.classList.remove("js-motion", "motion-pending"); try { tick(); } catch (e) {} };
function initMotion() { if (!(window.gsap && window.ScrollTrigger && window.DrawSVGPlugin)) { document.documentElement.classList.remove("motion-pending"); return; } try {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
  document.documentElement.classList.add("js-motion");
  mm = gsap.matchMedia();
  const promiseEls = [promisePath, promiseLbl];
  mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, ctx => {
    const { reduce } = ctx.conditions;
    /* 1 · hero: 1461 rises through its mask, then the dates, then the small live counter counts up, then the red line leaves the player */
    const days = Math.floor(Math.max(0, Date.now() - start) / 864e5), first = performance.now() < 2600;
    const html = document.documentElement, digits = $$(".hero-num .d"), dates = $$(".hero-dates > *");
    if (!reduce && first) { MO.heroPending = true;
      html.classList.remove("motion-pending"); gsap.set(digits, { y: 0, yPercent: 110 }); gsap.set(dates, { autoAlpha: 0, y: 12 }); // same frame: no flash
      MO.counting = true; $("#cDays").textContent = "0";
      const o = { v: 0 }, out = $("#cDays");
      const heroTL = gsap.timeline({ paused: true })
        .to(digits, { yPercent: 0, duration: .78, ease: "expo.out", stagger: .04 }, 0)
        .to(dates, { autoAlpha: 1, y: 0, duration: .6, ease: "power2.out", stagger: .08 }, 1.2)
        .to(o, { v: days, duration: 1.6, ease: "power2.out", onUpdate: () => { out.textContent = Math.round(o.v).toLocaleString("en-US"); },
          onComplete: () => { MO.counting = false; tick(); } }, 1.7)
      const go = () => heroTL.play();
      Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1200))]).then(go, go);
    } else html.classList.remove("motion-pending");
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
      // rolls: one wipe on each roll's key frame as it enters, its words follow (no pinning, no scrub)
      $$(".yr").forEach(y => { const key = y.querySelector(".feature .ph, .ev.hi .ph, .cs-row, .vfr .ph"); if (!key) return;
        const words = y.querySelector(".feature figcaption") || y.querySelector(".ev.hi .ev-h") || y.querySelector(".cs-caps") || y.querySelector(".vfr .cp");
        const wt = gsap.timeline({ scrollTrigger: { trigger: key, start: "top 80%", once: true } })
          .fromTo(key, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: .6, ease: "power3.out", clearProps: "clipPath" }, 0);
        if (words) wt.fromTo(words, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .5, ease: "power2.out" }, .35); });
      // the ending: the years pass one by one, then only NEXT / chapter stays
      const yrs = $$("#years span"), lk = $(".lk-finale");
      const ytl = gsap.timeline({ scrollTrigger: { trigger: ".fin-title", start: "top 72%", once: true } }).set(lk, { autoAlpha: 0 });
      yrs.forEach((s, i) => ytl.fromTo(s, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: .45, ease: "power1.out" }, i * .8).to(s, { autoAlpha: 0, duration: .4, ease: "power1.in" }, i * .8 + .5));
      ytl.to(lk, { autoAlpha: 1, duration: 1, ease: "power1.out" }, yrs.length * .8 + .1);
    }
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
  const refresh = () => { try { ScrollTrigger.refresh(); spineSoon(80); } catch (e) { motionOff(); } };
  addEventListener("load", refresh); if (document.fonts) document.fonts.ready.then(refresh);
} catch (e) { motionOff(); } }
// GSAP is optional: the page is complete without it. Load it after the content is on screen;
// if it hasn't arrived within 2.5s (slow network), skip the motion entirely.
(() => { const V = (document.querySelector('script[src^="app.js"]') || {}).src || "", q = (V.split("?")[1] || "");
  const files = ["vendor/gsap.min.js", "vendor/ScrollTrigger.min.js", "vendor/DrawSVGPlugin.min.js"]; let late = false;
  const unhide = () => document.documentElement.classList.remove("motion-pending");
  const giveUp = setTimeout(() => { late = true; unhide(); }, 2500);
  const next = i => { if (i === files.length) { clearTimeout(giveUp); if (!late) initMotion(); return; }
    const sc = document.createElement("script"); sc.src = files[i] + (q ? "?" + q : ""); sc.async = false;
    sc.onload = () => next(i + 1); sc.onerror = () => { clearTimeout(giveUp); unhide(); }; document.head.appendChild(sc); };
  next(0); })();
// safety net: if the counter is still running after 2.5s, show the real number
setTimeout(() => { if (MO.counting) { MO.counting = false; tick(); } }, 8000);
addEventListener("error", () => motionOff());
})();
