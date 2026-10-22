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
$("#vTitle").textContent = isTodo(MU.title) ? "" : MU.title;
$("#playTagText").textContent = MU.prompt;
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
  playing = true; audio.dataset.started = 1; document.body.classList.add("playing"); $("#playTag").classList.add("gone"); setMini();
  fadeTo(MU.volume ?? .7, 2600);
  if (p && p.catch) p.catch(() => { playing = false; document.body.classList.remove("playing"); setMini(); });
}
function pause() { playing = false; document.body.classList.remove("playing"); setMini(); fadeTo(0, 600, () => { if (!playing) audio.pause(); }); }
const toggle = () => playing ? pause() : play();
$("#vinyl").addEventListener("click", toggle);
$("#vinyl").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
$("#playTag").addEventListener("click", play);
mini.addEventListener("click", toggle);
setMini();
new IntersectionObserver(es => es.forEach(e => mini.classList.toggle("show", !e.isIntersecting))).observe($(".record-spot"));

/* ---------- JIANGHU ---------- */
const J = C.jianghu;
$("#jhTL").textContent = `( ${J.game} )`;
$("#chat").innerHTML = `<span class="ch">[${esc(J.guild)}]</span><span class="nm">${esc(J.him)}</span><span class="sep">·</span><span class="nm2">${esc(J.me)}</span>`;
$("#jhQuiet").textContent = J.quiet ? `「${J.quiet}」` : ""; $("#jhSong").textContent = J.quietSong || "";
$("#jhFrom").textContent = J.from; $("#jhTo").textContent = J.to;
(() => { // faint snow — 晚来天欲雪
  const cv = $("#snow"), g = cv.getContext("2d"), sec = $("#jianghu"); let W, Hh, flakes = [], on = false, raf;
  const size = () => { const r = sec.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); W = r.width; Hh = r.height; cv.width = W * dpr; cv.height = Hh * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
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
const qParts = HT.quote.split(/(?<=[，！。？])/).filter(Boolean);
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
  g.addEventListener("click", () => openStop(i));
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
S.forEach((s, i) => { const b = el("button", s.highlight ? "hi" : "", `<small>${pad2(i + 1)}</small>${esc(placeById[s.city].name)}`); b.onclick = () => openStop(i); $("#chips").append(b); });

let cur = 0; const pc = $(".pola-card");
function openStop(i) {
  cur = (i + S.length) % S.length; const s = S[cur], p = placeById[s.city];
  pinEls.forEach((e, j) => e.g.classList.toggle("on", j === cur));
  $("#sIdx").innerHTML = `<b>${pad2(cur + 1)}</b> / ${S.length}<span>${esc(p.country)}${s.note ? " · " + esc(s.note) : ""}</span>`;
  $("#sName").textContent = p.name; $("#sEn").textContent = p.en;
  pc.classList.toggle("scan-mode", !!(s.scans && s.scans.length));
  if (s.scans && s.scans.length) { const sc = el("div", "scans"); sc.id = "sPhoto";
    s.scans.forEach(src => sc.append(el("figure", "scan", `<i class="tape top"></i>${img(src, `${p.name} · ${s.scansDate || ""}`)}`)));
    if (s.scansDate) sc.append(el("span", "scan-date", esc(s.scansDate)));
    $("#sPhoto").replaceWith(sc);
  } else {
    const list = stopPhotos(s);
    const ph = photoBox(list[0], `photos/${s.city}.jpg`, false, p.name); ph.id = "sPhoto"; if (s.tall) ph.classList.add("tall");
    const notes = s.photoNotes || [], nt = el("span", "ph-date", notes[0] ? esc(notes[0]) : ""); if (notes.length) ph.append(nt);
    if (list.length > 1) { let k = 0; const dots = el("span", "ph-dots", list.map((_, j) => `<i class="${j ? "" : "on"}"></i>`).join("")); ph.append(dots);
      const next = () => { k = (k + 1) % list.length; const im = ph.querySelector("img"), [w, h] = SIZES[list[k]] || [1200, 1600]; im.src = list[k]; im.width = w; im.height = h;
        nt.innerHTML = notes[k] ? esc(notes[k]) : ""; dots.querySelectorAll("i").forEach((d, j) => d.classList.toggle("on", j === k)); };
      Object.assign(ph, { tabIndex: 0 }); ph.setAttribute("role", "button"); ph.setAttribute("aria-label", `${p.name}，下一张照片`);
      ph.addEventListener("click", next); ph.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(); } }); }
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
C.chapters.forEach((c, ci) => {
  const y = el("article", "yr"); y.id = "yr" + ci;
  y.innerHTML = `<div class="yr-head"><div class="yr-num${c.year.length > 4 ? " long" : ""}">${esc(c.year).replace(/[–-]/, '<span class="dash">–</span>')}</div>
    <div class="yr-t"><small>Roll ${pad2(ci + 1)}</small>${txt(c.title)}</div></div>`;
  const vr = el("div", "vroll"), vs = el("div", "vstrip", `<i class="sprk a"></i><i class="sprk b"></i><span class="edge">1461 · ROLL ${pad2(ci + 1)} · ${esc(c.year)}</span>`), caps = el("div", "caps");
  c.items.forEach((m, mi) => {
    const fr = el("div", "vfr" + (m.highlight ? " hi" : ""));
    if (m.milestone) { fr.classList.add("ms"); fr.append(el("div", "ph milestone", `<span class="ms-k">Milestone</span><b>${esc(m.title)}</b><span class="ms-d">${esc(m.date)}</span>`)); }
    else fr.append(photoBox(m.photo, `photos/${c.year}-${mi + 1}.jpg`, true, isTodo(m.title) ? c.year : m.title));
    fr.insertAdjacentHTML("beforeend", `<span class="fno">▸ ${frameNo}&nbsp;&nbsp;${frameNo}A</span>`); frameNo++;
    vs.append(fr);
    const d = txt(m.date), t = txt(m.title), x = txt(m.text);
    caps.append(el("div", "cp", (d ? `<span class="d">${d}</span>` : "") + (t ? `<span class="t">${t}</span>` : "") + (x ? `<span class="tx">${x}</span>` : "")));
  });
  vr.append(vs, caps); y.append(vr); list.append(y);
});
const alignCaps = () => $$(".vroll").forEach(v => { const frs = v.querySelectorAll(".vfr"), cps = v.querySelectorAll(".cp"), top0 = v.getBoundingClientRect().top;
  frs.forEach((f, i) => { const r = f.getBoundingClientRect(); cps[i].style.height = r.height + 12 + "px"; if (i === 0) v.querySelector(".caps").style.paddingTop = (r.top - top0 - 6) + "px"; }); });
alignCaps(); addEventListener("resize", alignCaps); addEventListener("load", alignCaps);

/* ---------- FINALE ---------- */
const F = C.finale;
$("#lcTitle").textContent = F.lockedTitle; $("#lcHint").textContent = F.lockedHint || ""; $("#envTo").textContent = C.him; $("#fTL").innerHTML = paren(["For", C.him]); $("#fTR").innerHTML = paren(["From", F.signature]);
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
for (let i = 0; i < 4; i++) dotsEl.append(el("span"));
let code = "";
const dots = [...dotsEl.children];
["1", "2", "3", "4", "5", "6", "7", "8", "9", "清除", "0", "删除"].forEach(k => {
  const b = el("button", isNaN(k) ? "fn" : "", k);
  b.onclick = () => {
    if (k === "清除") code = ""; else if (k === "删除") code = code.slice(0, -1); else if (code.length < 4) code += k;
    dots.forEach((d, j) => d.classList.toggle("f", j < code.length));
    if (code.length === 4) setTimeout(check, 200);
  };
  $("#pad").append(b);
});
function check() {
  if (code === String(F.code)) { unlock(); return; }
  dotsEl.classList.add("bad"); if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
  setTimeout(() => { dotsEl.classList.remove("bad"); code = ""; dots.forEach(x => x.classList.remove("f")); }, 650);
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
    s.scrollTop = 0; $("#secretClose").focus({ preventScroll: true }); setTimeout(() => s.classList.add("dev"), 60); };
  $("#envelope").classList.add("open");
  if (MO.sealTL) MO.sealTL(openPage); else setTimeout(openPage, 300);
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

/* ---------- MOTION (GSAP, self-hosted in vendor/) ----------
   Three moments only, each plays on its own:
   1. the 1461 counter counts up once   2. the red string draws itself (scroll-scrubbed)   3. the wax seal breaks on 1030
   Reduced motion → every moment jumps straight to its final state. */
if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
  const mm = gsap.matchMedia();
  const promiseEls = [promisePath, promiseLbl];
  mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, ctx => {
    const { reduce } = ctx.conditions;
    /* 1 · counter: once, on first view; tabular figures keep the width still */
    const days = Math.floor(Math.max(0, Date.now() - start) / 864e5);
    if (!reduce) {
      MO.counting = true;
      const o = { v: 0 }, out = $("#cDays");
      gsap.to(o, { v: days, duration: 1.8, ease: "power2.out", delay: .3,
        onUpdate: () => { out.textContent = Math.round(o.v).toLocaleString("en-US"); },
        onComplete: () => { MO.counting = false; tick(); } });
    }
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
  addEventListener("load", () => ScrollTrigger.refresh());
}
})();
