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
const SCN = C.scenes || {}; // photo viewer groups: { id: [{ src, date, place, scene }] }
const isTodo = s => !s || /待填写/.test(s);
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
$$(".lk-jianghu .c").forEach(c => { c.innerHTML = [...c.textContent].map(ch => `<span class="ch">${esc(ch)}</span>`).join(""); });
const paren = arr => arr && arr.length ? `<span class="paren"><b>(</b><span>${arr.map((t, i) => i ? esc(t) : `<i>${esc(t)}</i>`).join("<br>")}</span><b>)</b></span>` : "";
const hairIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); hairIO.unobserve(e.target); } }), { threshold: .35 });


/* ---------- HERO ---------- */
const H = C.hero;
$("#heroSub").textContent = H.subtitle;
const placeById = Object.fromEntries(C.places.map(p => [p.id, p]));
const stopPhotos = s => s.photos && s.photos.length ? s.photos : (s.photo ? [s.photo] : []);
const photoStops = C.stops.filter(s => stopPhotos(s).length && !s.tall && !s.photoNotes).map(s => ({ ...s, photo: stopPhotos(s)[0] }));
[["#behind1", photoStops[photoStops.length - 1]], ["#behind2", photoStops[photoStops.length - 2]]].forEach(([id, s]) => {
  const b = $(id); if (!s) { b.remove(); return; }
  b.append(photoBox(s.photo, null, false, "", true)); b.append(el("figcaption", "", esc(placeById[s.city].en)));
});
const start = new Date(C.startDate).getTime(), TARGET = 1461;
function tick() {
  let ms = Math.max(0, Date.now() - start);
  const d = Math.floor(ms / 864e5); ms -= d * 864e5;
  const h = Math.floor(ms / 36e5); ms -= h * 36e5;
  const m = Math.floor(ms / 6e4); ms -= m * 6e4;
  if (!MO.counting) $("#cDays").textContent = d.toLocaleString("en-US");
  $("#cH").textContent = pad2(h); $("#cM").textContent = pad2(m); $("#cS").textContent = pad2(Math.floor(ms / 1e3));
  $("#bar").style.transform = `scaleX(${Math.min(1, d / TARGET)})`;
}
tick(); setInterval(tick, 1000);

/* ---------- MUSIC ---------- */
const MU = C.music, audio = $("#song"), mini = $("#mini");
const songName = isTodo(MU.title) ? "Side A" : MU.title;
$("#playHint").textContent = (MU.prompt || "").replace(/^▶\s*/, "");
let playing = false, ctx = null, gain = null, fadeT = null;
function setMini() { $("#miniTxt").textContent = songName; mini.classList.toggle("on", playing); }
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
const toggle = () => playing ? pause() : play();
mini.addEventListener("click", toggle);
$("#playHint").addEventListener("click", play);
setMini();

/* ---------- THE RED LINE (one fine wine stroke: sound → meeting → time → place → future) ---------- */
// hero: starts at the player's sound wave (bottom right), passes behind 1461, leaves bottom-left toward 江湖
function layoutHeroLine() {
  const hero = $("#hero"), r = hero.getBoundingClientRect(), W = r.width, Hh = hero.offsetHeight, svgL = $("#rlHero");
  const m = mini.getBoundingClientRect(), t = $("#tag").getBoundingClientRect();
  const x0 = m.left - r.left + 4, y0 = Math.min(Hh - 24, m.top + m.height / 2); // the pill is fixed: at scroll 0 its viewport y is its y in the hero
  const cx = t.left - r.left + t.width / 2, cy = t.top - r.top + t.height * .42;
  svgL.setAttribute("viewBox", `0 0 ${W} ${Hh}`); svgL.style.height = Hh + "px";
  $("#rlHeroPath").setAttribute("d", `M${x0} ${y0} C ${x0 - 70} ${y0 - 6}, ${W + 30} ${cy + 150}, ${cx + 60} ${cy} S ${-50} ${cy + 120}, ${-4} ${Hh - 4}`);
}
layoutHeroLine(); addEventListener("resize", layoutHeroLine); addEventListener("load", layoutHeroLine);

/* ---------- JIANGHU ---------- */
const J = C.jianghu;
// a typographic collage of the real names only: 方 / 保护我方姐姐 / 晚来天欲雪 / 《天涯明月刀手游》
$("#jhSr").textContent = `《${J.game}》 [${J.guild}] ${J.him} · ${J.me}`;
$("#jhGame").textContent = `《${J.game}》`; $("#jhBig").textContent = J.me; $("#jhGuild").textContent = J.guild;
$("#jhHim").innerHTML = esc(J.him).replace(esc(J.me), `<em>${esc(J.me)}</em>`);
$("#jhQuiet").textContent = J.quiet ? `「${J.quiet}」` : ""; $("#jhSong").innerHTML = esc(J.quietSong || "").replace(":", '<span class="cl">:</span>');
$("#jhFrom").textContent = J.from; $("#jhTo").textContent = J.to;
(() => { // faint snow — 晚来天欲雪
  const cv = $("#snow"), g = cv.getContext("2d"), sec = $("#jianghu");
  Object.assign(cv.style, { position: "absolute", left: "0", top: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "0" }); let W, Hh, flakes = [], on = false, raf;
  const size = () => { const dpr = Math.min(2, devicePixelRatio || 1); W = sec.clientWidth; Hh = Math.min(sec.clientHeight, 1400); cv.width = W * dpr; cv.height = Hh * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const mk = y => ({ x: Math.random() * W, y: y ?? Math.random() * Hh, r: .6 + Math.random() * 1.6, v: .2 + Math.random() * .4, w: Math.random() * 6.28, a: .18 + Math.random() * .3 });
  const loop = () => { g.clearRect(0, 0, W, Hh); flakes.forEach(f => { f.y += f.v; f.w += .01; f.x += Math.sin(f.w) * .25; if (f.y > Hh + 4) Object.assign(f, mk(-4));
    g.beginPath(); g.arc(f.x, f.y, f.r, 0, 6.28); g.fillStyle = `rgba(150,140,130,${f.a})`; g.fill(); }); if (on) raf = requestAnimationFrame(loop); };
  if (reduced) return;  // no snow when reduced motion is requested
  size(); flakes = Array.from({ length: 38 }, () => mk()); addEventListener("resize", size);
  new IntersectionObserver(es => es.forEach(e => { on = e.isIntersecting; cancelAnimationFrame(raf); if (on) { size(); loop(); } })).observe(sec);
})();

/* ---------- HOTEL ---------- */
const HT = C.hotel;
$("#hLabel").textContent = "( " + HT.label + " )"; $("#scoreLab").textContent = HT.scoreLabel || "";
const ICON = {
  taxi: '<svg viewBox="0 0 64 64"><path d="M12 40 L16 30 Q17.5 26.5 21 26.5 L43 26.5 Q46.5 26.5 48 30 L52 40"/><path d="M8 40 H56 V48 H8 Z"/><circle cx="19" cy="48" r="4.5"/><circle cx="45" cy="48" r="4.5"/><path d="M27 26.5 V21.5 H37 V26.5"/></svg>',
  bell: '<svg viewBox="0 0 64 64"><path d="M14 44 C 14 31, 22 23.5, 32 23.5 C 42 23.5, 50 31, 50 44 Z"/><path d="M9 48.5 H55"/><path d="M32 23.5 V18.5"/><path d="M28.5 18 H35.5"/></svg>',
};
const card = (o, kind) => {
  const b = el("button", `hcard pola ${kind}`);
  b.innerHTML = `<i class="tape top ${kind === "right" ? "wine" : ""}"></i>${kind === "right" ? '<svg class="clip" viewBox="0 0 16 46"><path d="M5 40 V8 a4 4 0 0 1 8 0 V36 a6 6 0 0 1 -12 0 V12"/></svg>' : ""}<div class="ph">${ICON[kind === "wrong" ? "taxi" : "bell"]}</div>
    <div class="cap"><span class="nm">${esc(o.name)}</span><span class="en">${esc(o.en)}</span></div>`;
  return b;
};
const wrongC = card(HT.wrong, "wrong"), rightC = card(HT.right, "right");
$("#hotels").append(wrongC, rightC);
const xm = el("span", "mark xmark", MARK.x); wrongC.querySelector(".ph").append(xm);
const stamp = el("span", "stamp", esc(HT.stamp || "扣分")); wrongC.append(stamp);
const okr = el("span", "mark okring", MARK.circle); rightC.append(okr);
const qParts = (HT.quote.match(/[^，！。？]+[，！。？]?/g) || [HT.quote]);
$("#then").innerHTML = `<span class="qm o">“</span>${qParts.map((t, i) => `<span class="l l${i + 1}">${esc(t)}</span>`).join("")}<span class="qm c">”</span><span class="pen">${(HT.quoteEn || []).map(esc).join("<br>")}</span>`;
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
const fullVB = [-5, 0, M.w + 10, M.h];
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
// the story itself: photography first, each stop with a different treatment
(() => { const st = $("#story"); if (!st) return;
  const T = ["pair", "tall", "side-r", "bleed", "scans", "wide-l", "side-l", "bleed", "duo"]; let n = 0;
  S.forEach((s, i) => { if (firstOf[i] == null) return; const p = placeById[s.city], srcs = s.scans && s.scans.length ? s.scans : stopPhotos(s);
    const kind = s.scans ? "scans" : s.tall ? "tall" : srcs.length > 1 ? (n === 0 ? "pair" : "duo") : (/^(pair|duo|scans|tall)$/.test(T[n % T.length]) ? "side-r" : T[n % T.length]);
    n++;
    const e = el("article", "st st-" + kind + (s.highlight ? " hi" : ""));
    const ph = el("div", "st-ph");
    srcs.forEach((src, k) => { const f = el("div", "st-f st-f" + (k + 1) + (s.scans ? " raw" : ""), img(src, `${p.name}${s.note ? " · " + s.note : ""}`));
      f.dataset.vg = "route"; f.dataset.vi = firstOf[i] + k; f.setAttribute("role", "button"); f.tabIndex = 0; f.setAttribute("aria-label", `${p.name} · 放大`);
      if (k === 0 && s.scene && SCN[s.scene]) f.insertAdjacentHTML("beforeend", '<span class="cue-mark" aria-hidden="true">( … )</span>');
      ph.append(f); });
    const mem = isTodo(s.memory) ? "" : s.memory;
    e.append(ph, el("div", "st-tx", `<span class="st-no">${pad2(i + 1)}</span><h3><span>${esc(p.name)}</span><i>${esc(p.en)}</i></h3>` +
      (s.note ? `<span class="st-d">${esc(s.note)}</span>` : "") + (mem ? `<p>${esc(mem)}</p>` : "") + (s.song ? `<span class="st-song">${esc(s.song)}</span>` : "")));
    st.append(e); });
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
    if (list[0]) { tapC(ph, list[0], 0, notes[0]); if (s.scene && SCN[s.scene]) ph.insertAdjacentHTML("beforeend", '<span class="cue-mark" aria-hidden="true">( … )</span>'); }
    if (list.length > 1) ph.append(el("span", "ph-dots", list.map((_, j) => `<i class="${j ? "" : "on"}"></i>`).join("")));
    $("#sPhoto").replaceWith(ph);
  }
  const mem = txt(s.memory);
  $("#sMem").innerHTML = mem + (s.song ? `<span class="song">${esc(s.song)}</span>` : "");
  $("#sMem").hidden = !mem && !s.song;
  pc.querySelector(".card-seal")?.remove();
  if (s.seal) pc.querySelector(".pc-cap").append(el("span", "card-seal", sealSVG(s.seal, "cs" + cur, 26)));
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
strip.innerHTML = '<i class="sprk a"></i><i class="sprk b"></i><span class="edge">1461 &nbsp;▸ 1 &nbsp; 1A &nbsp; ▸ 2 &nbsp; 2A &nbsp; ▸ 3 &nbsp; 3A &nbsp; ▸ 4 &nbsp; 4A</span>';
C.chapters.forEach((c, ci) => {
  const ph = c.items.find(m => m.photo);
  const f = el("button", "fr", `${ph ? img(ph.photo) : ""}<span>${esc(c.year.replace(/^20/, "’"))}</span>`); f.setAttribute("aria-label", c.year);
  f.onclick = () => $("#yr" + ci).scrollIntoView({ behavior: "smooth" }); strip.append(f);
});
const list = $("#chapterList");
let frameNo = 1;
const SC = C.scenes || {};
const cue = '<span class="cue-mark" aria-hidden="true">( … )</span>';
// one group per roll for the photo viewer
C.chapters.forEach((c, ci) => {
  const y = el("article", "yr lay-" + (c.layout || "strip")); y.id = "yr" + ci;
  y.innerHTML = `<div class="yr-head"><div class="yr-num${c.year.length > 4 ? " long" : ""}">${esc(c.year).replace(/[–-]/, '<span class="dash">–</span>')}</div>
    <div class="yr-t"><small>Roll ${pad2(ci + 1)}</small>${txt(c.title)}</div></div>`;
  const gid = "roll" + ci, G = GROUPS[gid] = [];
  const add = (src, m) => { G.push({ src, date: isTodo(m.date) ? c.year : m.date, place: isTodo(m.title) ? "" : m.title, scene: m.scene }); return G.length - 1; };
  const tapPhoto = (box, src, m) => { if (!src) return box; const k = add(src, m); box.dataset.vg = gid; box.dataset.vi = k;
    box.setAttribute("role", "button"); box.tabIndex = 0; box.setAttribute("aria-label", (isTodo(m.title) ? c.year : m.title) + " · 放大");
    if (m.scene && SC[m.scene]) box.insertAdjacentHTML("beforeend", cue); return box; };
  const capHTML = m => { const d = txt(m.date), t = txt(m.title), x = txt(m.text);
    return (d ? `<span class="d">${d}</span>` : "") + (t ? `<span class="t">${t}</span>` : "") + (x ? `<span class="tx">${x}</span>` : ""); };
  const L = c.layout || "strip";
  if (L === "peak") {
    // the emotional peak: a loose composition of prints instead of a strip
    const pk = el("div", "peak");
    c.items.forEach((m, mi) => {
      const fig = el("figure", "pk pk" + (mi + 1) + (m.highlight ? " hi" : "") + (m.milestone ? " ms" : "") + (m.scans ? " pk-scans" : ""));
      if (m.milestone) fig.innerHTML = `<div class="ms-band"><span class="ms-k">Milestone</span><b>${esc(m.title)}</b><span class="ms-d">${esc(m.date)}</span>${m.text ? `<span class="ms-x">${esc(m.text)}</span>` : ""}</div>`;
      else if (m.scans) { const w = el("div", "pk-pair"); m.scans.forEach(src => { const f = el("div", "scan-ph", img(src, m.title)); tapPhoto(f, src, m); w.append(f); }); fig.append(w); }
      else { const ph = photoBox(m.photo, null, true, isTodo(m.title) ? c.year : m.title); tapPhoto(ph, m.photo, m);
        if (m.crop) { const im = ph.querySelector("img"); ph.classList.add("crop"); ph.style.aspectRatio = m.crop.ratio || ""; fig.classList.add("pk-crop");
          if (im) { im.style.objectPosition = m.crop.pos || "50% 50%"; im.style.transformOrigin = m.crop.pos || "50% 50%"; if (m.crop.zoom && m.crop.zoom !== 1) im.style.transform = `scale(${m.crop.zoom})`; } }
        fig.append(ph); }
      if (!m.milestone) { const cp = capHTML(m); if (cp) fig.append(el("figcaption", "", cp)); }
      pk.append(fig); frameNo++;
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
    if (fm) { const S0 = SC[fm.scene] || {}; const f = el("figure", "feature");
      const ph = el("div", "ph dark", img(fm.photo, fm.title)); ph.querySelector("img").style.objectPosition = S0.origin || "50% 50%"; tapPhoto(ph, fm.photo, fm); G.pop(); // same photo also sits in the strip; one viewer entry is enough
      f.append(ph, el("figcaption", "", `<span>${esc(fm.date)}</span><span>${esc(fm.title)}</span>`)); y.append(f); f._m = fm; y._feature = ph; } }
  const vr = el("div", "vroll"), vs = el("div", "vstrip", `<i class="sprk a"></i><i class="sprk b"></i><span class="edge">1461 · ROLL ${pad2(ci + 1)} · ${esc(c.year)}</span>`), caps = el("div", "caps");
  c.items.forEach((m, mi) => {
    const fr = el("div", "vfr" + (m.highlight ? " hi" : ""));
    if (m.milestone) { fr.classList.add("ms"); fr.append(el("div", "ph milestone", `<span class="ms-k">Milestone</span><b>${esc(m.title)}</b><span class="ms-d">${esc(m.date)}</span>`)); }
    else { const ph = photoBox(m.photo, null, true, isTodo(m.title) ? c.year : m.title); tapPhoto(ph, m.photo, m); fr.append(ph);
      if (y._feature && m.feature) y._feature.dataset.vi = ph.dataset.vi; }
    fr.insertAdjacentHTML("beforeend", `<span class="fno">▸ ${frameNo}&nbsp;&nbsp;${frameNo}A</span>`); frameNo++;
    vs.append(fr);
    caps.append(el("div", "cp", capHTML(m)));
  });
  vr.append(vs, caps); y.append(vr); list.append(y);
});
// time track: the red line runs down the margin between the years
list.insertAdjacentHTML("afterbegin", '<i class="track" id="track" aria-hidden="true"></i>');
const alignCaps = () => $$(".vroll").forEach(v => { const frs = v.querySelectorAll(".vfr"), cps = v.querySelectorAll(".cp"), top0 = v.getBoundingClientRect().top;
  frs.forEach((f, i) => { const r = f.getBoundingClientRect(); cps[i].style.height = r.height + 12 + "px"; if (i === 0) v.querySelector(".caps").style.paddingTop = (r.top - top0 - 6) + "px"; }); });
alignCaps(); addEventListener("resize", alignCaps); addEventListener("load", alignCaps);

/* ---------- FINALE ---------- */
const F = C.finale;
// the red line comes in from the top-left and runs off the right edge — the next chapter isn't drawn yet
function layoutFinaleLine() { const f = $("#finale"), W = f.clientWidth, env = $("#envelope"), Y = env.offsetTop + env.offsetHeight + 18;
  const sv2 = $("#rlFinale"); sv2.setAttribute("viewBox", `0 0 ${W} ${Y + 60}`); sv2.style.height = (Y + 60) + "px";
  $("#rlFinalePath").setAttribute("d", `M-4 4 C ${W * .25} 40, ${W * .02} ${Y * .55}, ${W * .3} ${Y * .72} S ${W * .8} ${Y + 30}, ${W + 40} ${Y - 10}`); }
layoutFinaleLine(); addEventListener("load", layoutFinaleLine); addEventListener("resize", layoutFinaleLine);
$("#years").innerHTML = ["2022", "2023", "2024", "2025", "2026"].map(y => `<span>${y}</span>`).join("");
$("#lcTitle").textContent = F.lockedTitle; $("#envTo").textContent = C.him; $("#fTL").innerHTML = paren(["For", C.him]); $("#fTR").innerHTML = paren(["From", F.signature]);
function sealSVG(text, id, size = 34) {
  let blob = ""; const N = 28;
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, r = 44 + Math.sin(i * 2.7) * 2.6 + Math.cos(i * 5.3) * 2.2 + (i % 4 === 0 ? 3 : 0); blob += (i ? "L" : "M") + (Math.cos(a) * r).toFixed(1) + " " + (Math.sin(a) * r).toFixed(1); }
  const crack = "M2 -52 L-3 -30 L5 -14 L-4 2 L6 18 L-2 34 L3 52";
  const inner = `<path d="${blob}Z" fill="url(#${id}G)"/><circle r="31" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.4"/><circle r="27" fill="none" stroke="rgba(255,255,255,.1)" stroke-width=".8"/>
    <text y="${size * .34}" text-anchor="middle" font-family="Cormorant,'Noto Serif SC',serif" font-style="italic" font-weight="500" font-size="${size}" fill="#4a1014" stroke="rgba(255,255,255,.14)" stroke-width=".6">${esc(text)}</text>
    <path d="M-36 -18 C -30 -34, -14 -40, 0 -40" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="3" stroke-linecap="round"/>`;
  return `<svg viewBox="-55 -55 110 110"><defs><radialGradient id="${id}G" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#b4434a"/><stop offset=".6" stop-color="#7a1f24"/><stop offset="1" stop-color="#4f1216"/></radialGradient>
    <clipPath id="${id}L"><path d="M-60 -60 L2 -60 ${crack.replace("M", "L")} L3 60 L-60 60Z"/></clipPath><clipPath id="${id}R"><path d="M60 -60 L2 -60 ${crack.replace("M", "L")} L3 60 L60 60Z"/></clipPath></defs>
    <g class="half h1" clip-path="url(#${id}L)">${inner}</g><g class="half h2" clip-path="url(#${id}R)">${inner}</g><path class="crack" d="${crack}" fill="none" stroke="#2a080a" stroke-width="1.5"/></svg>`;
}
$("#seal").innerHTML = sealSVG(F.seal || "4", "envSeal", 40);
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
$("#sig").innerHTML = isTodo(F.signature) ? txt(F.signature) : "— " + esc(F.signature);
const sp = $("#secPola"); sp.append(photoBox(F.photo, "photos/us.jpg", false, F.photoCaption)); const pcap = txt(F.photoCaption); if (pcap) sp.append(el("figcaption", "", pcap));
const STAR = '<svg viewBox="0 0 40 40"><path d="M20 2 L22.2 17.8 L38 20 L22.2 22.2 L20 38 L17.8 22.2 L2 20 L17.8 17.8 Z"/></svg>';
const SUN = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="7"/><path d="M20 4V9M20 31V36M4 20H9M31 20H36M8.7 8.7L12.2 12.2M27.8 27.8L31.3 31.3M31.3 8.7L27.8 12.2M12.2 27.8L8.7 31.3"/></svg>';
if (F.rings) $("#rings").innerHTML = F.rings.map((r, i) => `<div class="r"><span class="glyph">${i ? STAR : SUN}</span><b>${esc(r.name)}</b><span>${esc(r.is)}</span><small>${esc(r.item)}</small></div>`).join('<span class="x2">×</span>');
if (F.lyrics) $("#lyrics").innerHTML = `<h4>${esc(F.lyricTitle)}</h4>` + F.lyrics.map(([jp, cn]) => `<div class="ln"><span class="jp" lang="ja">${esc(jp)}</span><span class="cn">${esc(cn)}</span></div>`).join("") + `<span class="glyph end">${STAR}</span>`;
if (F.pair && F.pair.scans) $("#pair").innerHTML = F.pair.scans.map(src => `<figure class="scan"><i class="tape top"></i>${img(src, F.pair.caption || "")}</figure>`).join("") + (F.pair.caption ? `<p class="pair-cap">${esc(F.pair.caption)}</p>` : "");
const W8 = F.wedding, wp = $("#weddingPola");
if (W8) { wp.append(W8.photo ? photoBox(W8.photo) : el("div", "ph"));
  wp.append(el("figcaption", "", `${esc(W8.label)} · ${esc(W8.date)} · <em>${esc(W8.status)}</em>`)); }
// Freezer-Door style silhouette (traced from the 大理 shadows, filled with our photos)
if (F.silhouette) $("#silhouette").innerHTML = img(F.silhouette, `${C.him} & 我`) + (F.silhouetteCaption ? `<figcaption>${esc(F.silhouetteCaption)}</figcaption>` : "");
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
    if (!reduce && first) {
      html.classList.remove("motion-pending"); gsap.set(digits, { y: 0, yPercent: 110 }); gsap.set(dates, { autoAlpha: 0, y: 12 }); // same frame: no flash
      MO.counting = true; $("#cDays").textContent = "0";
      const o = { v: 0 }, out = $("#cDays");
      const heroTL = gsap.timeline({ paused: true })
        .to(digits, { yPercent: 0, duration: .78, ease: "expo.out", stagger: .04 }, 0)
        .to(dates, { autoAlpha: 1, y: 0, duration: .6, ease: "power2.out", stagger: .08 }, 1.2)
        .to(o, { v: days, duration: 1.6, ease: "power2.out", onUpdate: () => { out.textContent = Math.round(o.v).toLocaleString("en-US"); },
          onComplete: () => { MO.counting = false; tick(); } }, 1.7)
        .fromTo("#rlHeroPath", { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.8, ease: "power1.inOut" }, 3.3);
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
      const jt = gsap.timeline({ scrollTrigger: { trigger: ".lk-jianghu", start: "top 82%", once: true } })
        .fromTo(".lk-jianghu .ch", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .8, ease: "expo.out", stagger: .07 }, 0)
        .fromTo([".lk-jianghu .e"], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .6, ease: "power2.out" }, .9)
        .fromTo(["#jhA", "#jhB"], { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.4, ease: "power1.inOut" }, 1.4)
        .fromTo(".jh-route circle", { opacity: 0 }, { opacity: 1, duration: .4 }, 2.6);
      // rolls: one wipe on each roll's key frame as it enters, its words follow (no pinning, no scrub)
      $$(".yr").forEach(y => { const key = y.querySelector(".feature .ph, .pk.hi .ph, .cs-row, .vfr .ph"); if (!key) return;
        const words = y.querySelector(".feature figcaption") || y.querySelector(".pk.hi figcaption") || y.querySelector(".cs-caps") || y.querySelector(".caps .cp");
        const wt = gsap.timeline({ scrollTrigger: { trigger: key, start: "top 80%", once: true } })
          .fromTo(key, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: .6, ease: "power3.out", clearProps: "clipPath" }, 0);
        if (words) wt.fromTo(words, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .5, ease: "power2.out" }, .35); });
      draw(".taxi-line .rl-p", ".taxi-line");
      gsap.fromTo("#track", { scaleY: 0 }, { scaleY: 1, ease: "none", transformOrigin: "50% 0%", scrollTrigger: { trigger: "#chapterList", start: "top 70%", end: "bottom 70%", scrub: 0.6 } });
      draw("#rlFinalePath", "#finale");
      // the ending: the years pass one by one, then only NEXT / chapter stays
      const yrs = $$("#years span"), lk = $(".lk-finale");
      const ytl = gsap.timeline({ scrollTrigger: { trigger: ".fin-title", start: "top 72%", once: true } }).set(lk, { autoAlpha: 0 });
      yrs.forEach((s, i) => ytl.fromTo(s, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: .45, ease: "power1.out" }, i * .8).to(s, { autoAlpha: 0, duration: .4, ease: "power1.in" }, i * .8 + .5));
      ytl.to(lk, { autoAlpha: 1, duration: 1, ease: "power1.out" }, yrs.length * .8 + .1);
    }
    /* 3 · the seal breaks: one ~1.2s timeline, transforms + opacity only */
    const halves = $$("#seal .half"), flap = $(".env-flap"), letter = $(".env-letter");
    const seal = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } })
      .to(halves[0], { rotation: -7, x: -7, y: 3, svgOrigin: "0 0", duration: .45 }, 0)
      .to(halves[1], { rotation: 7, x: 7, y: 3, svgOrigin: "0 0", duration: .45 }, 0)
      .to([...halves, ...$$("#seal .crack")], { opacity: 0, y: 22, duration: .35, ease: "power1.in" }, .45)
      .to(flap, { rotationX: 180, duration: .6, ease: "power2.inOut" }, .3)
      .set(flap, { zIndex: 1 }, .6)
      .to(letter, { y: -40, duration: .5, ease: "power2.out" }, .7);
    MO.sealTL = done => { if (reduce) { seal.progress(1); done(); return; } seal.eventCallback("onComplete", () => setTimeout(done, 150)); seal.play(0); };
    MO.sealReset = () => { seal.pause(0); gsap.set(flap, { clearProps: "zIndex" }); };
    return () => { MO.counting = false; MO.finishString = null; };
  });
  const refresh = () => { try { layoutHeroLine(); layoutFinaleLine(); ScrollTrigger.refresh(); } catch (e) { motionOff(); } };
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
