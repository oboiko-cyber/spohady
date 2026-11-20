/*
  ЗІПСОВАНИЙ ТЕЛЕФОН. СТО ПОКОЛІНЬ
  Прототип аудіовізуального твору для editor.p5js.org

  Три вертикальні екрани: «Місце», «Обличчя», «Голос».
  100 поколінь приблизно по 5 секунд (цикл ≈ 8,5 хв).
  Кожне покоління — копія, зроблена тільки з ОПИСУ попереднього:
  рідкісні деталі зникають першими, а наприкінці лишається гладке, «ідеальне» й нічиє.
  Після 100-го покоління — темрява й тиша, на мить оригінали, і все спочатку.
  Кожен новий цикл трохи інакший: деталі зникають у дещо різному порядку.

  ЧЕСНА ПОЗНАЧКА. У цьому прототипі і «оригінали», і всі покоління змодельовано
  кодом (p5.js + Web Audio). В інсталяції оригінали — справжні фото й запис
  (з письмовою згодою людей), а проміжні покоління генерують нейромережі.

  Керування:  клік / дотик — почати (вмикає звук)
              → / ←  — наступне / попереднє покоління
              S — швидкий перегляд ×10    M — звук    F — на весь екран
              телефон вертикально: дотик — наступний екран (або поверніть телефон)

  Важливо для editor.p5js.org: кожен цикл for/while тут стоїть у фігурних дужках { }.
  Захист від нескінченних циклів у редакторі ламається на вкладених циклах без дужок
  (помилка «_LP17 is not defined»). Якщо будете правити код, не прибирайте дужки.

  Справжній голос: завантажте в редактор аудіофайл golos.mp3
  (стрілка «>» зліва → Sketch Files → «+» → Upload file). Скетч сам підхопить його
  замість синтезованого голосу. Тоді перепишіть STORY і HEARD нижче під свій запис.
*/

// ======================= НАЛАШТУВАННЯ =======================
const GEN_TOTAL = 100;   // скільки поколінь
const GEN_MS = 5000;     // тривалість одного покоління, мс
const FAST_MS = 500;     // у швидкому режимі (клавіша S)
const ORIG_MS = 3500;    // скільки на початку циклу видно оригінали
const DARK_MS = 4000;    // темрява і тиша після 100-го покоління
const VOICE_FILE = (typeof window !== 'undefined' && window.ZP_NO_VOICE_FILE) ? null : 'golos.mp3';

// ======================= ТЕКСТИ =======================
// Оригінал історії (говір). Те, що «чує» ШІ, — у HEARD.
const STORY = 'Ото ж, дитино, як я ше мала була, ми з дівками бігали на Ірпінь по воду. Вода холоднюща — аж зуби ломило. А мій старий, ше парубком, сидів на вербі та й свистав, шоб нас перелякать. Я з переляку відро впустила, і воно попливло аж до млина. Мати мене так вичитувала — ой лишенько! А він те відро на другий день приніс. Отак ми й зійшлися.';

// [останнє покоління, на якому діє текст, текст]
const HEARD = [
  [3, 'Ото ж, дитино, як я ще мала була, ми з дівками бігали на Ірпінь по воду. Вода холодна — аж зуби ломило. А мій старий, ще парубком, сидів на вербі та й свистав, щоб нас перелякати. Я з переляку відро впустила, і воно попливло аж до млина. Мати мене так вичитувала — ой лишенько! А він те відро на другий день приніс. Отак ми й зійшлися.'],
  [8, 'Ото ж, дитино, коли я ще була мала, ми з дівчатами бігали на Ірпінь по воду. Вода була холодна, аж зуби боліли. А мій чоловік, ще молодим хлопцем, сидів на вербі та свистів, щоб нас налякати. Я з переляку впустила відро, і воно попливло до млина. Мама мене дуже сварила. А він те відро на другий день приніс. Так ми й познайомилися.'],
  [15, 'Коли я була маленькою, ми з дівчатами ходили на річку по воду. Вода була дуже холодна. Мій чоловік тоді був молодим хлопцем, сидів на дереві й свистів, щоб нас налякати. Я впустила відро, і воно попливло. Мама мене сварила. А він потім приніс відро. Так ми й познайомилися.'],
  [24, 'Коли я була маленькою, ми ходили на річку по воду. Вода була холодна. Один хлопець свистів, щоб нас налякати. Я впустила відро. Потім він його приніс. Так ми познайомилися.'],
  [34, 'Коли я була маленькою, ми ходили до річки. Там я зустріла хлопця. Він мені допоміг. Так ми познайомилися.'],
  [45, 'Коли я була молодою, я зустріла хлопця біля річки. Так почалася наша історія кохання.'],
  [55, 'Це історія про кохання, річку і дитинство.'],
  [63, 'Це красива історія кохання.'],
  [70, 'Це красива історія кохання. A beautiful love story.'],
  [78, 'A beautiful love story.'],
  [85, 'A beautiful story.'],
  [91, 'Beautiful.'],
  [96, 'ммм… beautiful… ммм'],
  [100, 'ммммммммммммммммммммм'],
];

// Опис звуку, який пише нейромережа: [останнє покоління, текст]
const VOICE_HEADS = [
  [7, 'Запис: літня жінка розповідає історію поліським говором. Чути вітер.'],
  [20, 'Літня жінка розповідає історію про річку.'],
  [40, 'Жінка розповідає історію кохання.'],
  [60, 'Спокійний жіночий голос, історія кохання.'],
  [78, 'Спокійний голос.'],
  [92, 'Рівний звук.'],
  [100, 'Гул.'],
];

// Деталі зображень. st: [ключ для малювання, фраза в описі]; ends: покоління, на якому деталь
// переходить у наступний стан (± jit випадково в кожному циклі). Якщо станів стільки ж,
// скільки ends, — після останнього деталь зникає. Рідкісне зникає першим.
const PLACE_TRAITS = [
  { id: 'wall', ends: [9, 30, 76], jit: [3, 6, 6], st: [
    ['peeling', 'облуплена стіна, з-під тиньку видно цеглу'], ['old', 'стара жовта стіна'],
    ['clean', 'світла чиста стіна'], ['clean', '']] },
  { id: 'door', ends: [12, 40, 70, 90], jit: [3, 6, 6, 4], st: [
    ['green', 'зелені дерев’яні двері з латкою'], ['wood', 'дерев’яні двері'], ['plain', 'двері'], ['ghost', '']] },
  { id: 'sign', ends: [4, 17, 50, 68], jit: [1, 4, 7, 6], st: [
    ['hand', 'на дверях рукописна вивіска «Ремонт взуття, стукайте у вікно»'],
    ['typed', 'над дверима вивіска «Ремонт взуття»'], ['en', 'над дверима вивіска «COFFEE»'],
    ['blank', 'над дверима порожня вивіска']] },
  { id: 'window', ends: [7, 46, 86], jit: [2, 6, 5], st: [
    ['geranium', 'у вікні герань і мереживна фіранка'], ['plain', 'вікно'], ['ghost', '']] },
  { id: 'vine', ends: [14], jit: [4], st: [['vine', 'над входом виноград']] },
  { id: 'laundry', ends: [6, 22], jit: [2, 5], st: [
    ['shirt', 'мотузка з білизною, на ній вишита сорочка'], ['plain', 'мотузка з білизною']] },
  { id: 'cat', ends: [8, 31, 45], jit: [2, 5, 4], st: [
    ['red', 'рудий кіт спить на сходах'], ['gray', 'кіт на сходах'],
    ['hare', 'на сходах сидить заєць з різнокольоровим хвостом']] },
  { id: 'plants', ends: [10, 36, 82], jit: [3, 6, 5], st: [
    ['buckets', 'чорнобривці в старих відрах'], ['pots', 'квіти в горщиках'], ['twins', 'два однакові вазони']] },
  { id: 'light', ends: [20, 90], jit: [5, 4], st: [
    ['evening', 'тепле вечірнє світло, довгі тіні'], ['golden', 'м’яке золоте світло'], ['golden', '']] },
];
const PLACE_HEADS = { ends: [12, 35, 60, 80, 94], jit: [3, 5, 5, 4, 2], st: [
  'Старе подвір’я у приватному секторі.', 'Старе подвір’я.', 'Затишне подвір’я.',
  'Затишне місце.', 'Гарне місце.', 'Гарне.'] };

const FACE_TRAITS = [
  { id: 'hair', ends: [7, 20, 42, 72], jit: [2, 4, 6, 6], st: [
    ['redcurly', 'руде кучеряве волосся'], ['red', 'руде волосся'], ['auburn', 'каштанове волосся'],
    ['dark', 'гладке темне волосся'], ['dark', '']] },
  { id: 'freckles', ends: [5, 15], jit: [1, 4], st: [
    ['many', 'густе ластовиння на щоках і носі'], ['few', 'трохи ластовиння']] },
  { id: 'eyes', ends: [18, 60], jit: [4, 6], st: [['green', 'зелені очі'], ['brown', 'карі очі'], ['brown', '']] },
  { id: 'glasses', ends: [11, 26], jit: [3, 5], st: [['wire', 'старі окуляри в тонкій оправі'], ['modern', 'окуляри']] },
  { id: 'scar', ends: [4], jit: [1], st: [['scar', 'шрам на брові']] },
  { id: 'mole', ends: [6], jit: [2], st: [['mole', 'родимка над губою']] },
  { id: 'ears', ends: [9], jit: [3], st: [['big', 'вуха, що стирчать']] },
  { id: 'smile', ends: [10, 34, 80], jit: [3, 6, 5], st: [
    ['crooked', 'крива усмішка на один бік'], ['smile', 'усмішка'], ['soft', 'легка усмішка'], ['soft', '']] },
  { id: 'skin', ends: [8, 30, 85], jit: [2, 6, 5], st: [
    ['weathered', 'обвітрена шкіра, зморшки біля очей'], ['smooth', 'гладка шкіра'],
    ['perfect', 'ідеальна шкіра'], ['perfect', '']] },
];
const FACE_HEADS = { ends: [12, 35, 62, 82, 94], jit: [3, 5, 5, 4, 2], st: [
  'Портрет чоловіка років п’ятдесяти.', 'Портрет чоловіка.', 'Портрет усміхненого чоловіка.',
  'Усміхнена людина.', 'Людина.', 'Обличчя.'] };

// ======================= ГЕОМЕТРІЯ, ШРИФТИ, КОЛЬОРИ =======================
const PW = 360, PH = 640;               // внутрішній розмір екрана (9:16)
const IW = 360, IH = 420, IMG_Y = 36;   // зона зображення
const CAP_Y = IMG_Y + IH + 14;          // зона опису
const DENS = 2;                         // щільність пікселів буферів

const F_HAND = 'Caveat, "Segoe Print", "Comic Sans MS", cursive';
const F_MONO = '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace';
const F_SANS = '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif';
const F_SERIF = '"PT Serif", Georgia, "Times New Roman", serif';

const C = { ink: [233, 226, 210], dim: [139, 133, 119], faint: [74, 70, 63], accent: [224, 164, 88] };

function hx(s) { return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; }
const PL = {
  wallOchre: hx('d4ae5c'), wallOld: hx('d9b96e'), wallClean: hx('e6d3ad'), wallA: hx('efdcc2'),
  brick: hx('9a4c37'), mortar: hx('c9b59a'), ground: hx('6b6052'), groundA: hx('dcc6aa'),
  doorG: hx('3d6a4b'), doorW: hx('7b5536'), doorP: hx('b7997a'), doorA: hx('dcc4a5'),
  frame: hx('c7d5da'), glass: hx('2c3a44'), glassA: hx('cdbfae'),
  card: hx('e7dcc2'), pen: hx('23397a'), board: hx('2e3a35'), boardA: hx('d8c3a5'),
  leaf: hx('4f7a3a'), leaf2: hx('6c9a45'), grape: hx('3b2a4a'), stem: hx('5a4630'),
  cat: hx('d27a33'), catDark: hx('a3531c'), gray: hx('8b8a88'), hare: hx('9a8a76'),
  bucket: hx('8e969b'), marigold: hx('f0a12a'), marigold2: hx('e0761c'), pot: hx('b5643d'), bush: hx('5f8c48'),
  shirt: hx('f3f0e8'), stitch: hx('b8262f'), stitch2: hx('1e1e1e'), towel: hx('3f6fa8'), objA: hx('d9c0a0'),
};

// ======================= УТИЛІТИ =======================
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function rr(R, a, b) { return a + (b - a) * R(); }
function lp(a, b, t) { return a + (b - a) * t; }
function lpC(a, b, t) { return [lp(a[0], b[0], t), lp(a[1], b[1], t), lp(a[2], b[2], t)]; }
function lighten(c, k) { return lpC(c, [255, 255, 255], k); }
function darken(c, k) { return lpC(c, [0, 0, 0], k); }
function css(c, a = 1) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a.toFixed(3) + ')'; }
function sstep(e0, e1, x) { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
function nf3(n) { return String(n).padStart(3, '0'); }
function F(g, c, a = 255) { g.fill(c[0], c[1], c[2], a); }
function ST(g, c, a, w) { g.stroke(c[0], c[1], c[2], a); g.strokeWeight(w); }

function blobPts(cx, cy, rx, ry, R, wob = 0.25, n = 26) {
  const p1 = R() * 6.28, p2 = R() * 6.28, p3 = R() * 6.28, pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const k = 1 + wob * (0.5 * Math.sin(a * 2 + p1) + 0.3 * Math.sin(a * 3 + p2) + 0.2 * Math.sin(a * 5 + p3));
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
}
function drawPts(g, pts, close = true) {
  g.beginShape(); for (const p of pts) g.vertex(p[0], p[1]); close ? g.endShape(CLOSE) : g.endShape();
}
function toPath(pts) { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; }
function blob(g, cx, cy, rx, ry, R, wob, n) { drawPts(g, blobPts(cx, cy, rx, ry, R, wob, n)); }
function catmull(pts, n) {   // плавна крива через точки
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function vgrad(ctx, x, y, w, h, c1, c2, a1 = 1, a2 = 1) {
  ctx.save(); const gr = ctx.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, css(c1, a1)); gr.addColorStop(1, css(c2, a2)); ctx.fillStyle = gr; ctx.fillRect(x, y, w, h); ctx.restore();
}
function hgrad(ctx, x, y, w, h, c1, a1, c2, a2) {
  ctx.save(); const gr = ctx.createLinearGradient(x, 0, x + w, 0);
  gr.addColorStop(0, css(c1, a1)); gr.addColorStop(1, css(c2, a2)); ctx.fillStyle = gr; ctx.fillRect(x, y, w, h); ctx.restore();
}
function radial(ctx, x, y, r, c, a, clipPath) {
  ctx.save(); if (clipPath) ctx.clip(clipPath);
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, css(c, a)); gr.addColorStop(1, css(c, 0)); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function rtext(ctx, s, x, y, font, color, align = 'left', base = 'alphabetic') {
  ctx.save(); ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(s, x, y); ctx.restore();
}
function handText(ctx, str, x, y, size, R, jit, color, maxW) {
  ctx.save(); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  if (maxW) { ctx.font = '500 ' + size + 'px ' + F_HAND; const tw = ctx.measureText(str).width; if (tw > maxW) size *= maxW / tw; }
  let cx = x;
  for (const ch of str) {
    ctx.font = '500 ' + size + 'px ' + F_HAND;
    const w = ctx.measureText(ch).width;
    ctx.save(); ctx.translate(cx, y + (R() - 0.5) * 2.4 * jit); ctx.rotate((R() - 0.5) * 0.24 * jit);
    ctx.font = '500 ' + (size * (1 + (R() - 0.5) * 0.16 * jit)).toFixed(2) + 'px ' + F_HAND;
    ctx.fillText(ch, 0, 0); ctx.restore();
    cx += w * (0.97 + (R() - 0.5) * 0.1 * jit);
  }
  ctx.restore();
}

// Розмиття через зменшення-збільшення (працює всюди, зокрема в Safari)
let _tA = null, _tB = null, _tC = null;
function softBlur(g, px) {
  if (px < 0.35) return;
  const c = g.elt || g.canvas, W = c.width, H = c.height;
  const k = 1 + px * DENS * 0.6;
  const w = Math.max(2, Math.round(W / k)), h = Math.max(2, Math.round(H / k));
  if (!_tA) { _tA = document.createElement('canvas'); _tB = document.createElement('canvas'); }
  _tA.width = w; _tA.height = h;
  const a = _tA.getContext('2d'); a.imageSmoothingEnabled = true; a.imageSmoothingQuality = 'high';
  a.drawImage(c, 0, 0, w, h);
  const w2 = Math.min(W, w * 2), h2 = Math.min(H, h * 2);
  _tB.width = w2; _tB.height = h2;
  const b = _tB.getContext('2d'); b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high';
  b.drawImage(_tA, 0, 0, w2, h2);
  const ctx = g.drawingContext; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(_tB, 0, 0, W, H); ctx.restore();
}
// Ліва половина дзеркально лягає на праву: так «середнє» обличчя/місце стає симетричним
function mirrorHalf(g, alpha) {
  if (alpha < 0.01) return;
  const c = g.elt || g.canvas, W = c.width, H = c.height, hw = Math.floor(W / 2);
  if (!_tC) _tC = document.createElement('canvas');
  _tC.width = hw; _tC.height = H;
  const m = _tC.getContext('2d');
  m.save(); m.clearRect(0, 0, hw, H); m.translate(hw, 0); m.scale(-1, 1); m.drawImage(c, 0, 0, hw, H, 0, 0, hw, H); m.restore();
  m.save(); m.globalCompositeOperation = 'destination-in';
  const gr = m.createLinearGradient(0, 0, W * 0.08, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  m.fillStyle = gr; m.fillRect(0, 0, hw, H); m.restore();
  const ctx = g.drawingContext; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha;
  ctx.drawImage(_tC, W - hw, 0); ctx.restore();
}

// ======================= СТАН =======================
let phase = 'idle', gen = 0, phaseT0 = 0, fast = false, muted = false;
let cycleSeed = 1, sched = null, curStates = null;
const bufs = {};
let fadeT0 = 0, capT0 = 0, viewIdx = 0, lastPress = -1000, fontsReady = false, grainPat = null;
const voiceView = { text: '', marks: null, t0: 0, prevText: '', prevMarks: null, head: null };
const wrapCache = new Map();
const AU = { g: null };

// ======================= p5 =======================
function stageSize() {   // на сторінці-артефакті полотно займає блок #zp-stage, у редакторі p5 — усе вікно
  const el = document.getElementById('zp-stage');
  return el ? [el.clientWidth, el.clientHeight] : [windowWidth, windowHeight];
}
function setup() {
  const sz = stageSize(), cnv = createCanvas(sz[0], sz[1]);
  if (document.getElementById('zp-stage')) cnv.parent('zp-stage');
  injectFonts();
  for (const k of ['place', 'face']) {
    const a = createGraphics(IW, IH), b = createGraphics(IW, IH);
    a.pixelDensity(DENS); b.pixelDensity(DENS);
    bufs[k] = { cur: a, prev: b };
  }
  newCycle();
  enterGen(0);
}

function draw() {
  const now = millis();
  tickPhase(now);
  background(4);
  if (phase === 'idle') { drawIdle(now); return; }
  const L = computeLayout();
  const bright = screenBrightness(now);
  const frac = phase === 'gen' ? Math.min(1, (now - phaseT0) / genMs()) : 0;
  if (L.portrait) {
    drawPanel(viewIdx, L.rects[0], L.s, now, frac, bright);
    drawPortraitChrome();
  } else {
    for (let i = 0; i < 3; i++) drawPanel(i, L.rects[i], L.s, now, frac, bright);
    drawWallLabels(L);
  }
  audioUpdate(now, frac);
}

function windowResized() { const sz = stageSize(); resizeCanvas(sz[0], sz[1]); }

function mousePressed(e) {
  if (e && e.target && e.target.closest && e.target.closest('[data-zp-ui]')) return;
  const t = millis(); if (t - lastPress < 350) return false; lastPress = t;
  if (phase === 'idle') { zpStart(); return false; }
  if (computeLayout().portrait) viewIdx = (viewIdx + 1) % 3;
  return false;
}

function keyPressed(e) {
  const ae = document.activeElement;
  if (ae && ae.closest && ae.closest('[data-zp-ui]')) return;
  const k = key, code = (e && e.code) || '';
  if (phase === 'idle' && (k === ' ' || k === 'Enter')) { zpStart(); return false; }
  if (k === 'ArrowRight') { zpSetGen(phase === 'idle' || phase === 'orig' ? 1 : gen + 1); return false; }
  if (k === 'ArrowLeft') { zpSetGen(gen - 1); return false; }
  if (code === 'KeyS' || k === 's' || k === 'S') { zpToggleFast(); return false; }
  if (code === 'KeyM' || k === 'm' || k === 'M') { zpToggleMute(); return false; }
  if (code === 'KeyF' || k === 'f' || k === 'F') { fullscreen(!fullscreen()); return false; }
}

// --- функції для керування ззовні (кнопки на сторінці) ---
function zpStart() {
  audioInit();
  if (phase !== 'idle') return;
  phase = 'orig'; phaseT0 = millis(); enterGen(0);
}
function zpSetGen(n) {
  audioInit();
  n = Math.max(0, Math.min(GEN_TOTAL, n | 0));
  phaseT0 = millis();
  if (n === 0) { phase = 'orig'; enterGen(0); } else { phase = 'gen'; enterGen(n); }
}
function zpToggleFast() { fast = !fast; return fast; }
function zpToggleMute() { muted = !muted; return muted; }
function zpState() { return { phase: phase, gen: gen, fast: fast, muted: muted }; }

// ======================= ЧАС І ПОКОЛІННЯ =======================
function genMs() { return fast ? FAST_MS : GEN_MS; }
function origMs() { return fast ? 1200 : ORIG_MS; }
function darkMs() { return fast ? 1200 : DARK_MS; }
function fadeMs() { return fast ? 180 : 1100; }

function tickPhase(now) {
  if (phase === 'idle') return;
  const el = now - phaseT0;
  if (phase === 'orig' && el > origMs()) { phase = 'gen'; phaseT0 = now; enterGen(1); }
  else if (phase === 'gen' && el > genMs()) {
    if (gen >= GEN_TOTAL) { phase = 'dark'; phaseT0 = now; }
    else { phaseT0 = now; enterGen(gen + 1); }
  } else if (phase === 'dark' && el > darkMs()) {
    newCycle(); phase = 'orig'; phaseT0 = now; enterGen(0);
  }
}
function screenBrightness(now) {
  const el = now - phaseT0;
  if (phase === 'orig') return sstep(0, 450, el);
  if (phase === 'dark') return 1 - sstep(0, fast ? 500 : 1500, el);
  return 1;
}

function newCycle() {
  cycleSeed = (Math.random() * 1e9) | 0;
  const R = mulberry32(cycleSeed);
  sched = {
    place: PLACE_TRAITS.map(t => jitterEnds(t, R)), face: FACE_TRAITS.map(t => jitterEnds(t, R)),
    placeHead: jitterEnds(PLACE_HEADS, R), faceHead: jitterEnds(FACE_HEADS, R),
  };
}
function jitterEnds(t, R) {
  const out = []; let last = 0;
  t.ends.forEach((e, i) => { let v = Math.round(e + (R() * 2 - 1) * (t.jit[i] || 0)); v = Math.max(v, last + 1, 1); out.push(v); last = v; });
  return out;
}
function stateAt(list, ends, g) { let i = 0; while (i < ends.length && g >= ends[i]) i++; return i < list.length ? list[i] : null; }
function statesFor(traits, endsArr, heads, headEnds, g) {
  const S = { orig: g === 0 }, phrases = [];
  traits.forEach((t, k) => {
    const st = g === 0 ? t.st[0] : stateAt(t.st, endsArr[k], g);
    S[t.id] = st ? st[0] : null;
    if (st && st[1]) phrases.push(st[1]);
  });
  let cap = stateAt(heads.st, headEnds, g);
  if (phrases.length) { const body = phrases.join('; '); cap += ' ' + body.charAt(0).toUpperCase() + body.slice(1) + '.'; }
  S.caption = cap;
  return S;
}

function enterGen(g) {
  gen = g;
  const h = g / GEN_TOTAL;
  curStates = {
    place: statesFor(PLACE_TRAITS, sched.place, PLACE_HEADS, sched.placeHead, g),
    face: statesFor(FACE_TRAITS, sched.face, FACE_HEADS, sched.faceHead, g),
  };
  for (const k of ['place', 'face']) { const b = bufs[k], t = b.prev; b.prev = b.cur; b.cur = t; }
  renderPlace(bufs.place.cur, curStates.place, h, cycleSeed * 7 + g * 101 + 1);
  renderFace(bufs.face.cur, curStates.face, h, cycleSeed * 13 + g * 211 + 2);
  fadeT0 = capT0 = millis();
  const v = heardAt(g);
  if (v.text !== voiceView.text) {
    voiceView.prevText = voiceView.text; voiceView.prevMarks = voiceView.marks;
    voiceView.text = v.text; voiceView.marks = v.marks; voiceView.t0 = millis();
  }
  voiceView.head = voiceHeadAt(g);
  if (g === 0 && phase !== 'idle') restartVoiceFile();
}
function rerenderCurrent() {
  const h = gen / GEN_TOTAL;
  renderPlace(bufs.place.cur, curStates.place, h, cycleSeed * 7 + gen * 101 + 1);
  renderFace(bufs.face.cur, curStates.face, h, cycleSeed * 13 + gen * 211 + 2);
}

function normW(w) { return w.toLowerCase().replace(/[«»"“”„.,!?:;…—–()-]/g, ''); }
function diffMarks(a, b) {
  const set = new Set(a.split(/\s+/).map(normW));
  return b.split(/\s+/).map(w => { const n = normW(w); return n.length > 0 && !set.has(n); });
}
function heardAt(g) {
  if (g === 0) return { text: STORY, marks: null };
  let i = HEARD.findIndex(x => g <= x[0]); if (i < 0) i = HEARD.length - 1;
  const prev = i === 0 ? STORY : HEARD[i - 1][1];
  return { text: HEARD[i][1], marks: diffMarks(prev, HEARD[i][1]) };
}
function voiceHeadAt(g) {
  if (g === 0) return null;
  const x = VOICE_HEADS.find(v => g <= v[0]); return x ? x[1] : VOICE_HEADS[VOICE_HEADS.length - 1][1];
}

// ======================= ШРИФТИ =======================
function injectFonts() {
  if (!document.querySelector('link[data-zp-fonts]')) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-zp-fonts', '1');
    l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap';
    document.head.appendChild(l);
  }
  const done = () => { if (!fontsReady) { fontsReady = true; wrapCache.clear(); if (curStates) rerenderCurrent(); } };
  if (document.fonts && document.fonts.load) {
    const sample = 'Ремонт взуття їжак ABC';
    Promise.all(['500 20px Caveat', '400 12px "IBM Plex Mono"', '400 12px "IBM Plex Sans"', '600 12px "IBM Plex Sans"',
      '400 16px "PT Serif"', '700 16px "PT Serif"', 'italic 400 16px "PT Serif"'].map(f => document.fonts.load(f, sample)))
      .then(done, done);
    setTimeout(done, 4000);
  } else fontsReady = true;
}

// ======================= МАЛЮВАННЯ: МІСЦЕ =======================
function renderPlace(g, S, h, seed) {
  const R = mulberry32(seed), ctx = g.drawingContext;
  const sym = sstep(0.22, 0.85, h), flat = sstep(0.04, 0.85, h), pull = Math.pow(h, 0.9);
  const P = (c, a) => lpC(c, a, pull), PO = (c) => lpC(c, PL.objA, Math.pow(pull, 1.15));
  const GY = 335, jit = S.orig ? 1 : lp(0.55, 0.15, h);
  const dc = lp(170, 180, sym), DW = lp(84, 92, h), DT = 150, DB = GY - 5;
  g.push(); g.clear(); g.noStroke();

  // --- стіна
  const wallBase = S.wall === 'peeling' ? PL.wallOchre : S.wall === 'old' ? PL.wallOld : PL.wallClean;
  const wc = P(wallBase, PL.wallA);
  vgrad(ctx, 0, 0, IW, GY, lighten(wc, 0.05 + 0.14 * h), darken(wc, 0.12 - 0.08 * h));
  if (S.wall === 'peeling') {
    for (let i = 0; i < 6; i++) {
      const cx = rr(R, 14, 346), cy = rr(R, 18, GY - 40), rx = rr(R, 18, 44) * (1 - 0.3 * flat), ry = rx * rr(R, 0.5, 0.85);
      const pts = blobPts(cx, cy, rx, ry, R, 0.38, 30);
      g.push(); ctx.save(); ctx.clip(toPath(pts));
      F(g, P(PL.mortar, PL.wallA)); g.rect(cx - rx * 2, cy - ry * 2, rx * 4, ry * 4);
      const bc = P(PL.brick, PL.wallA);
      for (let y = Math.floor((cy - ry * 2) / 10) * 10; y < cy + ry * 2; y += 10) {
        const off = (Math.floor(y / 10) % 2) * 12;
        for (let x = Math.floor((cx - rx * 2) / 24) * 24 - off; x < cx + rx * 2; x += 24) {
          F(g, lpC(bc, darken(bc, 0.35), R())); g.rect(x + 1, y + 1, 22, 8);
        }
      }
      ctx.restore(); g.pop();
      g.push(); g.noFill(); ST(g, darken(wc, 0.3), 150 * (1 - flat), 1.1); drawPts(g, pts); g.pop();
    }
  }
  const nSt = Math.round((S.wall === 'peeling' ? 16 : S.wall === 'old' ? 9 : 0) * (1 - flat));
  for (let i = 0; i < nSt; i++) { F(g, darken(wc, rr(R, 0.1, 0.3)), rr(R, 10, 28)); blob(g, rr(R, 0, IW), rr(R, 0, GY), rr(R, 10, 40), rr(R, 6, 30), R, 0.4, 20); }
  const nSp = Math.round((S.wall === 'clean' ? 150 : 520) * (1 - flat));
  for (let i = 0; i < nSp; i++) { F(g, R() < 0.5 ? darken(wc, 0.22) : lighten(wc, 0.25), 70); g.rect(rr(R, 0, IW), rr(R, 0, GY), 1.3, 1.3); }
  if (S.wall === 'peeling') {
    g.push(); g.noFill(); ST(g, darken(wc, 0.45), 210 * (1 - flat), 1); g.beginShape();
    let x = rr(R, 255, 320), y = 0; for (let i = 0; i < 13; i++) { g.vertex(x, y); x += rr(R, -8, 8); y += rr(R, 6, 13); }
    g.endShape(); g.pop();
  }

  // --- земля
  const gc = P(PL.ground, PL.groundA);
  vgrad(ctx, 0, GY, IW, IH - GY, darken(gc, 0.06), lighten(gc, 0.1));
  F(g, darken(wc, 0.4), 110 * (1 - 0.6 * flat)); g.rect(0, GY - 3, IW, 4);
  if (flat < 0.95) {
    g.push(); g.noFill();
    for (let i = 0; i < 6; i++) {
      ST(g, darken(gc, 0.35), 150 * (1 - flat), 1); g.beginShape();
      let x = rr(R, 0, IW), y = rr(R, GY + 12, IH); for (let k = 0; k < 6; k++) { g.vertex(x, y); x += rr(R, -14, 14); y += rr(R, -4, 6); }
      g.endShape();
    }
    for (let x = 4; x < IW; x += rr(R, 5, 16)) {
      if (R() < 0.45 * (1 - flat)) {
        ST(g, P(PL.leaf2, PL.groundA), 220, 1.2);
        for (let k = 0; k < 3; k++) g.line(x, GY + 2, x + rr(R, -5, 5), GY - rr(R, 4, 13));
      }
    }
    g.pop();
  }

  // --- виноград над входом
  if (S.vine) {
    g.push(); g.noFill(); ST(g, P(PL.stem, PL.wallA), 255, 2.4);
    g.beginShape(); g.vertex(dc - DW / 2 - 24, GY); g.vertex(dc - DW / 2 - 20, DT + 40); g.vertex(dc - DW / 2 - 14, DT - 4); g.endShape();
    g.noStroke();
    for (let a = Math.PI * 1.02; a < Math.PI * 1.98; a += 0.11) {
      const lx = dc + Math.cos(a) * (DW / 2 + 26), ly = DT + 4 + Math.sin(a) * 42;
      for (let k = 0; k < 2; k++) { F(g, P(R() < 0.5 ? PL.leaf : PL.leaf2, PL.wallA)); blob(g, lx + rr(R, -7, 7), ly + rr(R, -6, 6), rr(R, 6, 10), rr(R, 5, 8), R, 0.3, 12); }
    }
    for (const gx of [-26, 4, 30]) { for (let k = 0; k < 9; k++) { F(g, P(PL.grape, PL.wallA)); g.circle(dc + gx + rr(R, -5, 5), DT - 22 + k * 2.2 + rr(R, -2, 2), 5); } }
    g.pop();
  }

  // --- двері і сходи
  if (S.door) {
    const dBase = S.door === 'green' ? PL.doorG : S.door === 'wood' ? PL.doorW : S.door === 'plain' ? PL.doorP : PL.doorA;
    const da = S.door === 'ghost' ? 0.35 : 1, doorC = P(dBase, PL.doorA);
    const rad = lp(1, DW / 2, sstep(0.45, 0.8, h));
    F(g, P(hx('9a948b'), PL.groundA), 255 * da); g.rect(dc - DW / 2 - 16, GY - 4, DW + 32, 10, lp(0, 4, h));
    F(g, P(hx('85807a'), PL.groundA), 255 * da); g.rect(dc - DW / 2 - 26, GY + 6, DW + 52, 10, lp(0, 4, h));
    F(g, darken(doorC, 0.3), 255 * da); g.rect(dc - DW / 2 - 5, DT - 5, DW + 10, DB - DT + 5, rad + 4, rad + 4, 0, 0);
    F(g, doorC, 255 * da); g.rect(dc - DW / 2, DT, DW, DB - DT, rad, rad, 0, 0);
    if (S.door === 'green' || S.door === 'wood') {
      g.push(); ST(g, darken(doorC, 0.28), 170, 1);
      for (let x = dc - DW / 2 + 12; x < dc + DW / 2 - 2; x += 12) g.line(x, DT + 3, x, DB - 2);
      g.pop(); g.noStroke();
      if (S.door === 'green') {
        for (let i = 0; i < 16; i++) { F(g, lighten(doorC, 0.3), 70); g.rect(rr(R, dc - DW / 2, dc + DW / 2 - 9), rr(R, DT, DB - 6), rr(R, 3, 10), rr(R, 2, 5)); }
        g.push(); g.translate(dc + 6, DB - 62); g.rotate(-0.06 * jit);
        F(g, P(hx('8a6a45'), PL.doorA)); g.rect(0, 0, 30, 22);
        F(g, hx('2a2a2a')); for (const q of [[3, 3], [27, 3], [3, 19], [27, 19]]) g.circle(q[0], q[1], 2.2);
        g.pop();
      }
      F(g, hx('2a2a2a')); g.circle(dc + DW / 2 - 12, DT + (DB - DT) * 0.55, 6);
    }
  }

  // --- вивіска
  if (S.sign === 'hand' && S.door) {
    g.push(); g.translate(dc - 34, DT + 46); g.rotate(-0.07 * (0.4 + 0.6 * jit));
    F(g, P(PL.card, PL.wallA)); g.rect(0, 0, 74, 52);
    F(g, [238, 233, 205], 160); g.rect(-5, -3, 16, 7); g.rect(63, -3, 16, 7);
    const pen = css(P(PL.pen, PL.objA), 0.95);
    handText(ctx, 'Ремонт', 7, 18, 17, R, jit, pen, 60);
    handText(ctx, 'взуття', 10, 33, 17, R, jit, pen, 60);
    handText(ctx, '← стукайте у вікно', 4, 47, 10, R, jit, pen, 64);
    g.pop();
  }
  if (S.sign === 'typed' || S.sign === 'en' || S.sign === 'blank') {
    const bw = DW + 44, by = DT - 38;
    F(g, P(S.sign === 'en' ? hx('1f1f1f') : PL.board, PL.boardA)); g.rect(dc - bw / 2, by, bw, 27, lp(1, 9, h));
    const tc = css(lpC([246, 240, 228], PL.boardA, pull * 0.55));
    if (S.sign === 'typed') rtext(ctx, 'РЕМОНТ ВЗУТТЯ', dc, by + 18.5, '600 12.5px ' + F_SANS, tc, 'center');
    if (S.sign === 'en') rtext(ctx, 'C O F F E E', dc, by + 19, '700 15px ' + F_SERIF, tc, 'center');
  }

  // --- вікно
  if (S.window) {
    const wa = S.window === 'ghost' ? 0.35 : 1, wx = lp(34, 40, sym), wy = 140, ww = 76, wh = 86;
    const fr = P(PL.frame, PL.wallA);
    F(g, fr, 255 * wa); g.rect(wx - 5, wy - 5, ww + 10, wh + 10, lp(0, 8, h));
    F(g, P(PL.glass, PL.glassA), 255 * wa); g.rect(wx, wy, ww, wh, lp(0, 5, h));
    F(g, [255, 255, 255], 26 * wa); g.beginShape(); g.vertex(wx + 8, wy); g.vertex(wx + 30, wy); g.vertex(wx + 6, wy + wh); g.vertex(wx, wy + wh); g.vertex(wx, wy + 18); g.endShape(CLOSE);
    if (S.window === 'geranium') {
      F(g, [236, 232, 220], 165); g.rect(wx, wy, ww, wh * 0.66);
      F(g, [255, 255, 255], 120);
      for (let y = wy + 5; y < wy + wh * 0.66 - 3; y += 7) { for (let x = wx + 4 + ((y / 7) % 2) * 3; x < wx + ww - 2; x += 7) { g.circle(x, y, 3); } }
      F(g, PL.pot); g.rect(wx + ww / 2 - 10, wy + wh - 16, 20, 14);
      for (let k = 0; k < 9; k++) { F(g, PL.leaf); g.circle(wx + ww / 2 + rr(R, -16, 16), wy + wh - 20 + rr(R, -8, 4), rr(R, 6, 9)); }
      for (let k = 0; k < 16; k++) { F(g, k % 3 ? hx('c8323c') : hx('e2525a')); g.circle(wx + ww / 2 + rr(R, -17, 17), wy + wh - 30 + rr(R, -10, 5), rr(R, 3.5, 6.5)); }
    }
    if (S.window !== 'ghost') { F(g, fr, 255 * wa); g.rect(wx + ww / 2 - 2, wy, 4, wh); g.rect(wx, wy + wh * 0.38, ww, 4); }
    F(g, P(hx('bcb3a3'), PL.wallA), 255 * wa); g.rect(wx - 9, wy + wh + 5, ww + 18, 6);
  }

  // --- мотузка з білизною
  if (S.laundry) {
    const ly = x => lp(56, 70, x / IW) + 18 * Math.sin(Math.PI * x / IW);
    g.push(); g.noFill(); ST(g, P(hx('3a3a3a'), PL.wallA), 210, 1);
    g.beginShape(); for (let x = 0; x <= IW; x += 12) g.vertex(x, ly(x)); g.endShape(); g.pop();
    if (S.laundry === 'shirt') {
      g.push(); g.translate(78, ly(78) - 1); g.rotate(-0.04 * jit);
      const pts = [[-14, 0], [14, 0], [30, 8], [37, 30], [27, 34], [20, 18], [20, 56], [-20, 56], [-20, 18], [-27, 34], [-37, 30], [-30, 8]];
      F(g, P(PL.shirt, PL.objA)); drawPts(g, pts);
      const st = P(PL.stitch, PL.objA), st2 = P(PL.stitch2, PL.objA);
      g.push(); g.strokeWeight(1);
      for (let y = 5; y < 46; y += 4) {
        for (let x = -6; x <= 6; x += 4) {
          const c = ((x + y) / 4) % 3 === 0 ? st2 : st; g.stroke(c[0], c[1], c[2], 230);
          g.line(x - 1.4, y - 1.4, x + 1.4, y + 1.4); g.line(x + 1.4, y - 1.4, x - 1.4, y + 1.4);
        }
      }
      for (const sx of [-31, 31]) { for (let k = -1; k <= 1; k++) { g.stroke(st[0], st[1], st[2], 230); g.line(sx + k * 3 - 1.2, 28, sx + k * 3 + 1.2, 31); } }
      g.pop(); g.pop();
      F(g, P(PL.towel, PL.objA)); g.push(); g.translate(244, ly(244)); g.rotate(0.03 * jit); g.rect(-14, 0, 28, 44);
      F(g, lighten(P(PL.towel, PL.objA), 0.4)); g.rect(-14, 34, 28, 3); g.pop();
      F(g, P(hx('7a4e8a'), PL.objA)); g.rect(296, ly(296), 8, 18, 0, 0, 4, 4); g.rect(308, ly(308), 8, 18, 0, 0, 4, 4);
    } else {
      F(g, P(PL.shirt, PL.objA)); g.rect(62, ly(70), 34, 40); g.rect(232, ly(244), 30, 42);
    }
    F(g, P(hx('a0864f'), PL.objA)); for (const x of [64, 92, 232, 256]) g.rect(x, ly(x) - 3, 3, 7);
  }

  // --- кіт / заєць
  if (S.cat && S.door) {
    const cx = dc - DW / 2 - 46, cy = GY + 4;
    if (S.cat === 'red') {
      const c = P(PL.cat, PL.objA), cd = P(PL.catDark, PL.objA);
      F(g, c); g.ellipse(cx, cy - 10, 50, 24); g.circle(cx + 20, cy - 14, 22);
      g.triangle(cx + 12, cy - 21, cx + 15, cy - 31, cx + 20, cy - 23); g.triangle(cx + 22, cy - 23, cx + 28, cy - 31, cx + 29, cy - 20);
      g.push(); g.noFill(); ST(g, cd, 230, 2);
      for (let k = -2; k <= 1; k++) g.arc(cx + k * 9, cy - 10, 12, 18, Math.PI * 1.15, Math.PI * 1.75);
      ST(g, c, 255, 6); g.arc(cx - 2, cy - 4, 48, 14, 0.15, Math.PI * 0.9);
      ST(g, darken(c, 0.5), 220, 1.2); g.line(cx + 15, cy - 14, cx + 19, cy - 13); g.line(cx + 23, cy - 13, cx + 27, cy - 14);
      g.pop();
    } else if (S.cat === 'gray') {
      const c = P(PL.gray, PL.objA);
      F(g, c); g.ellipse(cx, cy - 18, 30, 34); g.circle(cx, cy - 40, 22);
      g.triangle(cx - 10, cy - 46, cx - 7, cy - 58, cx - 2, cy - 49); g.triangle(cx + 2, cy - 49, cx + 7, cy - 58, cx + 10, cy - 46);
      g.push(); g.noFill(); ST(g, c, 255, 4); g.arc(cx + 14, cy - 8, 22, 18, -1.2, 1.3); g.pop();
    } else if (S.cat === 'hare') {
      const c = P(PL.hare, PL.objA);
      F(g, c); g.ellipse(cx, cy - 15, 38, 28); g.circle(cx + 15, cy - 30, 20);
      g.push(); g.translate(cx + 12, cy - 40); g.rotate(-0.25); g.ellipse(0, -14, 7, 26); g.pop();
      g.push(); g.translate(cx + 19, cy - 39); g.rotate(0.15); g.ellipse(0, -14, 7, 26); g.pop();
      const rb = ['e8453c', 'f19a2e', 'f4d23a', '5bb35a', '3f7fd6', '8a52c4'];
      rb.forEach((col, i) => { F(g, P(hx(col), PL.objA)); g.circle(cx - 20, cy - 16, 16 - i * 2.5); });
    }
  }

  // --- квіти
  if (S.plants === 'buckets') {
    for (const b of [[268, 22, 30, -0.03], [298, 27, 36, 0.02], [331, 19, 24, -0.1]]) {
      g.push(); g.translate(b[0], GY + 9); g.rotate(b[3] * jit);
      for (let k = 0; k < 6; k++) { g.push(); ST(g, P(PL.leaf, PL.objA), 255, 1.3); g.line(rr(R, -6, 6), -b[2], rr(R, -10, 10), -b[2] - rr(R, 10, 24)); g.pop(); }
      for (let k = 0; k < 9; k++) { F(g, P(R() < 0.5 ? PL.marigold : PL.marigold2, PL.objA)); g.circle(rr(R, -b[1] / 2, b[1] / 2), -b[2] - rr(R, 12, 28), rr(R, 5, 8)); }
      const bc = P(PL.bucket, PL.objA);
      F(g, bc); g.beginShape(); g.vertex(-b[1] / 2, -b[2]); g.vertex(b[1] / 2, -b[2]); g.vertex(b[1] * 0.4, 0); g.vertex(-b[1] * 0.4, 0); g.endShape(CLOSE);
      F(g, lighten(bc, 0.25)); g.rect(-b[1] / 2 + 3, -b[2] + 3, 3, b[2] - 6);
      F(g, darken(bc, 0.2)); g.rect(-b[1] / 2, -b[2] - 1, b[1], 3);
      g.pop();
    }
  } else if (S.plants === 'pots' || S.plants === 'twins') {
    const twins = S.plants === 'twins';
    const list = twins ? [[dc - DW / 2 - 34, 24, 26], [dc + DW / 2 + 34, 24, 26]] : [[276, 22, 24], [316, 30, 30]];
    for (const p of list) {
      const pc = P(PL.pot, PL.objA), bc = P(PL.bush, PL.objA);
      F(g, bc);
      if (twins) g.circle(p[0], GY - p[2] - 14, 34);
      else { for (let k = 0; k < 7; k++) { g.circle(p[0] + rr(R, -10, 10), GY - p[2] - rr(R, 6, 22), rr(R, 12, 20)); } }
      F(g, pc); g.beginShape(); g.vertex(p[0] - p[1] / 2, GY - p[2]); g.vertex(p[0] + p[1] / 2, GY - p[2]); g.vertex(p[0] + p[1] * 0.38, GY + 6); g.vertex(p[0] - p[1] * 0.38, GY + 6); g.endShape(CLOSE);
      F(g, darken(pc, 0.15)); g.rect(p[0] - p[1] / 2 - 2, GY - p[2] - 2, p[1] + 4, 5, 2);
    }
  }

  // --- світло
  if (S.light === 'evening') {
    hgrad(ctx, 0, 0, IW, GY, [255, 170, 90], 0, [255, 160, 80], 0.24);
    F(g, [30, 32, 70], 48 * (1 - h)); g.beginShape(); g.vertex(0, 0); g.vertex(92, 0); g.vertex(IW, 214); g.vertex(IW, 300); g.vertex(0, 72); g.endShape(CLOSE);
  } else {
    radial(ctx, IW * 0.5, 40, 380, [255, 214, 160], 0.16 + 0.32 * h);
  }
  // віньєтка, як у фото
  ctx.save(); const vg = ctx.createRadialGradient(IW / 2, IH / 2, IW * 0.3, IW / 2, IH / 2, IW * 0.82);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,' + (0.32 - 0.22 * h).toFixed(3) + ')'); ctx.fillStyle = vg; ctx.fillRect(0, 0, IW, IH); ctx.restore();

  mirrorHalf(g, sym * 0.9);
  softBlur(g, 7 * Math.pow(h, 1.6));
  const col = sstep(0.82, 1.0, h);
  if (col > 0) {
    ctx.save(); ctx.globalAlpha = col * 0.82;
    const gr = ctx.createLinearGradient(0, 0, 0, IH); gr.addColorStop(0, '#f3e2cb'); gr.addColorStop(0.7, '#ecd5bb'); gr.addColorStop(1, '#e0c6ae');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, IW, IH); ctx.restore();
    radial(ctx, IW * 0.5, IH * 0.35, 300, [255, 236, 205], 0.5 * col);
  }
  g.pop();
}

// ======================= МАЛЮВАННЯ: ОБЛИЧЧЯ =======================
function renderFace(g, S, h, seed) {
  const R = mulberry32(seed), ctx = g.drawingContext;
  const sym = sstep(0.12, 0.75, h), flat = sstep(0.04, 0.85, h), pull = Math.pow(h, 0.9), fade = sstep(0.78, 1, h);
  const P = (c, a) => lpC(c, a, pull), asym = 1 - sym, fa = 255 * (1 - 0.92 * fade);
  g.push(); g.clear(); g.noStroke();

  // --- фон
  vgrad(ctx, 0, 0, IW, IH, P(hx('76858c'), hx('f3dcc6')), P(hx('59666c'), hx('cdb8d4')));
  for (let i = 0; i < Math.round(40 * (1 - flat)); i++) { F(g, R() < 0.5 ? [255, 255, 255] : [0, 0, 0], rr(R, 5, 14)); blob(g, rr(R, 0, IW), rr(R, 0, IH), rr(R, 10, 40), rr(R, 10, 40), R, 0.4, 16); }

  const cx = lp(186, 180, sym), cy = 186, HW = lp(150, 146, h), HH = lp(186, 194, h);
  const skinBase = S.skin === 'weathered' ? hx('d39a77') : S.skin === 'smooth' ? hx('ddb092') : hx('e8c3a6');
  const skin = P(skinBase, hx('f0d2bb'));

  // --- плечі
  const jac = P(hx('3e4a35'), hx('c8b3c2'));
  F(g, darken(skin, 0.14)); g.rect(cx - 32, cy + 58, 64, 70, 12);
  F(g, jac); g.ellipse(cx, IH + 30, 368, 300);
  if (flat < 0.9) {
    F(g, darken(jac, 0.25), 255 * (1 - flat));
    g.triangle(cx - 36, IH - 124, cx - 4, IH - 66, cx - 70, IH - 98); g.triangle(cx + 36, IH - 124, cx + 4, IH - 66, cx + 70, IH - 98);
  }

  // --- вуха
  const big = S.ears === 'big', ew = big ? 26 : 18, eh = big ? 40 : 32, ex = HW / 2 + (big ? 6 : 1);
  for (const sgn of [-1, 1]) {
    g.push(); g.translate(cx + sgn * ex, cy + 6 + (sgn > 0 ? asym * 3 : 0)); g.rotate(sgn * (big ? 0.3 : 0.08));
    F(g, darken(skin, 0.06)); g.ellipse(0, 0, ew, eh); F(g, darken(skin, 0.2), 160); g.ellipse(sgn * 2, 0, ew * 0.45, eh * 0.55); g.pop();
  }

  // --- голова
  const hp = [], p1 = R() * 6.28, p2 = R() * 6.28;
  for (let i = 0; i < 64; i++) {
    const a = i / 64 * Math.PI * 2, s = Math.sin(a);
    let x = Math.cos(a) * HW / 2, y = s * HH / 2;
    if (s > 0) x *= 1 - 0.2 * s * s;
    const k = 1 + asym * (0.035 * Math.sin(2 * a + p1) + 0.02 * Math.sin(3 * a + p2));
    hp.push([cx + x * k, cy + y * k]);
  }
  const headPath = toPath(hp);
  F(g, skin); drawPts(g, hp);
  ctx.save(); ctx.clip(headPath);
  const sh = ctx.createRadialGradient(cx + 22 * asym, cy - 34, 10, cx, cy, HW * 0.75);
  sh.addColorStop(0, css(lighten(skin, 0.12), 0.9)); sh.addColorStop(1, css(darken(skin, 0.18 - 0.1 * h), 0.9));
  ctx.fillStyle = sh; ctx.fillRect(cx - HW, cy - HH, HW * 2, HH * 2); ctx.restore();
  if (S.skin === 'weathered') {
    for (const sgn of [-1, 1]) radial(ctx, cx + sgn * 40, cy + 22, 34, [205, 90, 80], 0.32, headPath);
    g.push(); ctx.save(); ctx.clip(headPath);
    for (let i = 0; i < 360; i++) { const a = rr(R, 0.15, Math.PI - 0.15); F(g, darken(skin, 0.45), 55); g.rect(cx + Math.cos(a) * rr(R, 30, HW / 2), cy + 30 + Math.sin(a) * rr(R, 14, HH / 2 - 26), 1.1, 1.1); }
    ctx.restore(); g.pop();
    g.push(); g.noFill(); ST(g, darken(skin, 0.3), 120, 1.1);
    for (let k = 0; k < 3; k++) g.arc(cx, cy - 46 + k * 7, 70 - k * 8, 10, Math.PI * 1.15, Math.PI * 1.85);
    g.pop();
  }

  // --- волосся
  const hairBase = { redcurly: 'b4502a', red: 'b85d30', auburn: '7b4128', dark: '3a2a22' }[S.hair] || '6a5040';
  const hc = P(hx(hairBase), hx('c9a88c'));
  if (S.hair === 'redcurly') {
    for (let i = 0; i < 90; i++) {
      const a = rr(R, Math.PI * 0.9, Math.PI * 2.1), rad = rr(R, 0.92, 1.12);
      const x = cx + Math.cos(a) * (HW / 2 + 2) * rad, y = cy - 16 + Math.sin(a) * (HH / 2 + 2) * rad;
      if (Math.sin(a) > -0.12) continue;
      const r = rr(R, 11, 18); F(g, darken(hc, rr(R, 0.05, 0.3))); g.circle(x, y, r * 2);
      F(g, lighten(hc, rr(R, 0.05, 0.2)), 200); g.circle(x - r * 0.25, y - r * 0.25, r);
    }
    for (let i = 0; i < 9; i++) { F(g, lighten(hc, 0.08)); g.circle(cx + rr(R, -48, 48), cy - HH / 2 + rr(R, 16, 30), rr(R, 14, 22)); }
  } else if (S.hair) {
    const cap = [], neat = S.hair === 'dark';
    for (let i = 0; i <= 44; i++) {
      const a = lp(Math.PI * 0.93, Math.PI * 2.07, i / 44), s = Math.sin(a);
      cap.push([cx + Math.cos(a) * HW * 0.55, cy - 12 + s * HH * (s < 0 ? 0.6 : 0.5)]);
    }
    // лінія росту волосся: у рудого — чубчик набік, у «середнього» — рівна дуга
    const hl = neat ? [[0.48, -0.15], [0.26, -0.29], [0, -0.32], [-0.26, -0.29], [-0.48, -0.15]]
      : [[0.48, -0.13], [0.24, -0.33], [-0.04, -0.31], [-0.28, -0.22], [-0.48, -0.08]];
    catmull(hl, 6).forEach(p => cap.push([cx + p[0] * HW, cy + p[1] * HH]));
    const capPath = toPath(cap);
    F(g, hc); drawPts(g, cap);
    ctx.save(); ctx.clip(capPath);
    const hg = ctx.createLinearGradient(0, cy - HH * 0.7, 0, cy - HH * 0.05);
    hg.addColorStop(0, css(lighten(hc, 0.14), 0.9)); hg.addColorStop(1, css(darken(hc, 0.28), 0.9));
    ctx.fillStyle = hg; ctx.fillRect(cx - HW, cy - HH, HW * 2, HH * 1.2); ctx.restore();
    g.push(); g.noFill(); ST(g, lighten(hc, 0.22), 150 * (1 - 0.7 * flat), 1.1);
    if (neat) { g.line(cx + HW * 0.17, cy - HH * 0.62, cx + HW * 0.11, cy - HH * 0.3); }
    else {
      for (let k = 0; k < 16; k++) {
        const x0 = cx + rr(R, -HW * 0.42, HW * 0.42), y0 = cy - HH * rr(R, 0.5, 0.62);
        g.beginShape(); g.vertex(x0, y0); g.vertex(x0 - rr(R, 6, 16), y0 + HH * 0.14); g.vertex(x0 - rr(R, 14, 28), y0 + HH * 0.26); g.endShape();
      }
    }
    g.pop();
    radial(ctx, cx + 10, cy - HH * 0.42, 40, [255, 255, 255], 0.16 * sstep(0.2, 0.7, h));
  }

  // --- брови
  const browC = P(S.hair === 'redcurly' || S.hair === 'red' ? hx('9b4a26') : darken(hx(hairBase), 0.1), hx('b49a86'));
  const eyeY = cy - 6, eDX = lp(33, 34, sym);
  for (const sgn of [-1, 1]) {
    const bx = cx + sgn * eDX, rise = sgn < 0 ? lp(8, 6, sym) : lp(4, 6, sym), by = eyeY - 17 - (sgn < 0 ? 3 * asym : 0);
    const scar = S.scar && sgn > 0;
    for (let i = 0; i < 16; i++) {
      const t = i / 15; if (scar && t > 0.42 && t < 0.6) continue;
      const x = bx + sgn * lp(-18, 20, t), y = by - Math.sin(t * Math.PI) * rise + t * 2;
      F(g, browC, fa); g.circle(x, y, lp(lp(7, 4, flat), 2.5, t));
    }
    if (scar) { g.push(); ST(g, lighten(skin, 0.35), fa, 1.8); g.line(bx + 1, by - 12, bx + 6, by + 8); g.pop(); }
  }

  // --- очі
  const eW = lp(28, 36, sstep(0.2, 0.8, h)), eH = lp(12, 16, sstep(0.2, 0.8, h));
  const iris = P(S.eyes === 'green' ? hx('5d7d3a') : hx('5b3a26'), hx('6d5444'));
  for (const sgn of [-1, 1]) {
    const x = cx + sgn * eDX, y = eyeY - (sgn < 0 ? 3 * asym : 0), sc = sgn > 0 ? 1 - 0.08 * asym : 1;
    F(g, hx('efe8de'), fa); g.ellipse(x, y, eW * sc, eH * sc);
    F(g, iris, fa); g.circle(x + sgn * 0.5, y, eH * 0.95 * sc);
    F(g, [20, 15, 12], fa); g.circle(x + sgn * 0.5, y, eH * 0.42 * sc);
    F(g, [255, 255, 255], fa * 0.9); g.circle(x + 2.5, y - 2.5, 2.6 + 1.6 * h);
    g.push(); g.noFill(); ST(g, darken(skin, 0.55), fa, 1.7); g.arc(x, y, eW * sc, eH * 1.15 * sc, Math.PI * 1.02, Math.PI * 1.98); g.pop();
    if (S.skin === 'weathered') {
      g.push(); g.noFill(); ST(g, darken(skin, 0.32), 130, 1);
      for (let k = -1; k <= 1; k++) g.line(x + sgn * (eW / 2 + 3), y + k * 3, x + sgn * (eW / 2 + 11), y + k * 6);
      g.arc(x, y + 7, eW * 0.9, 8, 0.2, Math.PI - 0.2); g.pop();
    }
  }

  // --- ніс
  const bend = 5 * asym;
  g.push(); g.noFill(); ST(g, darken(skin, 0.28), fa * lp(0.7, 0.35, flat), 1.6);
  g.beginShape(); g.vertex(cx - 4, eyeY + 4); g.vertex(cx - 5 + bend * 0.5, cy + 14); g.vertex(cx - 7 + bend, cy + 30); g.endShape();
  ST(g, darken(skin, 0.35), fa * 0.8, 1.6); g.arc(cx - 9 + bend, cy + 34, 10, 8, Math.PI * 0.6, Math.PI * 1.5); g.arc(cx + 9 + bend, cy + 34, 10, 8, Math.PI * 1.5, Math.PI * 2.4);
  g.pop();
  radial(ctx, cx + bend, cy + 28, 16, [255, 255, 255], 0.2 * sstep(0.25, 0.75, h));
  if (S.skin === 'weathered') {
    g.push(); g.noFill(); ST(g, darken(skin, 0.3), 115, 1.3);
    for (const sgn of [-1, 1]) { g.beginShape(); g.vertex(cx + sgn * 15, cy + 31); g.vertex(cx + sgn * 25, cy + 43); g.vertex(cx + sgn * 30, cy + 59); g.endShape(); }
    g.pop();
  }

  // --- рот
  const my = cy + 56, lipC = P(hx('b16a5c'), hx('d79c8e'));
  let mouth;
  if (S.smile === 'crooked') mouth = [[-25, 3], [-12, 6], [0, 6], [12, 2], [25, -8]];
  else if (S.smile === 'smile') mouth = [[-24, -4], [-12, 3], [0, 5], [12, 3], [24, -4]];
  else mouth = [[-18, -2], [-9, 1.5], [0, 2.5], [9, 1.5], [18, -2]];
  F(g, lighten(lipC, 0.1), fa); g.beginShape(); mouth.forEach(p => g.vertex(cx + p[0], my + p[1])); for (let i = mouth.length - 2; i > 0; i--) g.vertex(cx + mouth[i][0] * 0.8, my + mouth[i][1] + 6); g.endShape(CLOSE);
  g.push(); g.noFill(); ST(g, darken(lipC, 0.35), fa, 2.2); g.beginShape(); mouth.forEach(p => g.vertex(cx + p[0], my + p[1])); g.endShape(); g.pop();

  // --- родимка, ластовиння
  if (S.mole) { F(g, hx('4a2c20'), fa); g.circle(cx + 21, my - 14, 5); }
  if (S.freckles) {
    const n = S.freckles === 'many' ? 130 : 34, fc = hx('9e5a3a');
    for (let i = 0; i < n; i++) {
      const zone = R(); let x, y;
      if (zone < 0.42) { x = cx - 36 + rr(R, -30, 30); y = cy + 16 + rr(R, -18, 18); }
      else if (zone < 0.84) { x = cx + 36 + rr(R, -30, 30); y = cy + 16 + rr(R, -18, 18); }
      else { x = cx + rr(R, -12, 12); y = cy + rr(R, 0, 24); }
      F(g, fc, (S.freckles === 'many' ? 150 : 90) * (1 - fade)); g.circle(x, y, rr(R, 1.6, 3.4));
    }
  }

  // --- окуляри
  if (S.glasses === 'wire') {
    g.push(); g.noFill(); g.translate(cx, eyeY); g.rotate(0.04 * asym); ST(g, hx('7a7268'), 235, 1.4);
    g.circle(-eDX, 0, 42); g.circle(eDX, 0, 42); g.arc(0, 2, eDX * 2 - 42, 12, Math.PI * 1.1, Math.PI * 1.9);
    g.line(-eDX - 21, -2, -HW / 2, -6); g.line(eDX + 21, -2, HW / 2, -6); g.pop();
  } else if (S.glasses === 'modern') {
    g.push(); g.noFill(); ST(g, P(hx('1e1e1e'), hx('8a7a70')), 240, 3);
    g.rect(cx - eDX - 23, eyeY - 14, 46, 28, 7); g.rect(cx + eDX - 23, eyeY - 14, 46, 28, 7); g.line(cx - eDX + 23, eyeY - 4, cx + eDX - 23, eyeY - 4); g.pop();
  }
  radial(ctx, cx - 6, cy - 50, 34, [255, 255, 255], 0.22 * sstep(0.25, 0.75, h), headPath);

  mirrorHalf(g, sym * 0.85);
  softBlur(g, 7 * Math.pow(h, 1.6));
  if (fade > 0) {
    ctx.save(); ctx.globalAlpha = fade * 0.75;
    const gr = ctx.createLinearGradient(0, 0, 0, IH); gr.addColorStop(0, '#f4ddc8'); gr.addColorStop(1, '#d6c2d6');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, IW, IH);
    const eg = ctx.createRadialGradient(cx - 10, cy - 30, 10, cx, cy, HW * 0.8);
    eg.addColorStop(0, '#f8e2d0'); eg.addColorStop(1, 'rgba(232,196,170,0)');
    ctx.globalAlpha = fade * 0.6; ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(cx, cy + 6, HW * 0.55, HH * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  g.pop();
}

// ======================= РОЗКЛАДКА І ЕКРАНИ =======================
function computeLayout() {
  const W = width, H = height;
  if (W < H * 0.95 && W < 760) {
    let ph = H - 60 - 64, pw = ph * 9 / 16;
    if (pw > W - 20) { pw = W - 20; ph = pw * 16 / 9; }
    return { portrait: true, s: pw / PW, rects: [{ x: (W - pw) / 2, y: 60 + (H - 124 - ph) / 2, w: pw, h: ph }] };
  }
  const labelH = Math.max(34, H * 0.07);
  let ph = H * 0.82 - labelH, pw = ph * 9 / 16, gap = pw * 0.12;
  const total = pw * 3 + gap * 2;
  if (total > W * 0.94) { const k = W * 0.94 / total; ph *= k; pw *= k; gap *= k; }
  const x0 = (W - (pw * 3 + gap * 2)) / 2, y0 = Math.max(10, (H - ph - labelH) / 2 - H * 0.02);
  return { portrait: false, s: pw / PW, rects: [0, 1, 2].map(i => ({ x: x0 + i * (pw + gap), y: y0, w: pw, h: ph })) };
}

function drawPanel(i, r, s, now, frac, bright) {
  const ctx = drawingContext;
  // світло від екрана на стіні
  ctx.save(); const spill = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, r.w * 0.2, r.x + r.w / 2, r.y + r.h / 2, r.h * 0.85);
  spill.addColorStop(0, 'rgba(240,215,180,' + (0.06 * bright).toFixed(3) + ')'); spill.addColorStop(1, 'rgba(240,215,180,0)');
  ctx.fillStyle = spill; ctx.fillRect(r.x - r.h, r.y - r.h * 0.4, r.w + r.h * 2, r.h * 1.8); ctx.restore();

  push(); translate(r.x, r.y); scale(s);
  noStroke(); fill(10); rect(0, 0, PW, PH);
  const isOrig = gen === 0;
  rtext(ctx, isOrig ? 'ОРИГІНАЛ' : 'ПОКОЛІННЯ', 14, 24, '500 10.5px ' + F_MONO, css(isOrig ? C.accent : C.dim));
  if (!isOrig) rtext(ctx, nf3(gen) + ' / ' + GEN_TOTAL, PW - 14, 24, '500 12.5px ' + F_MONO, css(C.ink), 'right');

  if (i < 2) {
    const b = bufs[i === 0 ? 'place' : 'face'], a = sstep(0, fadeMs(), now - fadeT0), z = 1 + 0.025 * frac;
    push(); ctx.beginPath(); ctx.rect(0, IMG_Y, IW, IH); ctx.clip();
    translate(IW / 2, IMG_Y + IH / 2); scale(z); translate(-IW / 2, -IMG_Y - IH / 2);
    if (a < 1) image(b.prev, 0, IMG_Y, IW, IH);
    ctx.globalAlpha = a; image(b.cur, 0, IMG_Y, IW, IH); ctx.globalAlpha = 1;
    pop();
    drawGrain(ctx, 0.13 * Math.pow(1 - gen / GEN_TOTAL, 1.6));
  } else drawVoicePanel(ctx, now);

  drawCaption(ctx, i, now);
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, PW - 1, PH - 1); ctx.restore();
  if (bright < 0.999) { fill(0, (1 - bright) * 255); rect(-1, -1, PW + 2, PH + 2); }
  pop();
}

function drawGrain(ctx, a) {
  if (a < 0.005) return;
  if (!grainPat) {
    const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d'), id = x.createImageData(160, 160);
    for (let k = 0; k < id.data.length; k += 4) { const v = Math.random() * 255; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255; }
    x.putImageData(id, 0, 0); grainPat = ctx.createPattern(c, 'repeat');
  }
  const ox = Math.random() * 160, oy = Math.random() * 160;
  ctx.save(); ctx.beginPath(); ctx.rect(0, IMG_Y, IW, IH); ctx.clip();
  ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay'; ctx.translate(-ox, -oy);
  ctx.fillStyle = grainPat; ctx.fillRect(ox, IMG_Y + oy, IW, IH); ctx.restore();
}

function fitText(ctx, txt, fam, weight, w, h, maxS, minS, lh) {
  const key = txt + '|' + fam + '|' + weight + '|' + w + '|' + h + '|' + maxS;
  if (wrapCache.has(key)) return wrapCache.get(key);
  let res = null;
  for (let s = maxS; s >= minS; s -= 0.5) {
    const font = weight + ' ' + s + 'px ' + fam, lines = wrapLines(ctx, txt, font, w);
    res = { font: font, lines: lines, lead: s * lh };
    if (lines.length * s * lh <= h) break;
  }
  if (wrapCache.size > 300) wrapCache.clear();
  if (fontsReady) wrapCache.set(key, res);
  return res;
}
function wrapLines(ctx, txt, font, w) {
  ctx.save(); ctx.font = font;
  const words = txt.split(/\s+/), lines = []; let line = '';
  for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > w && line) { lines.push(line); line = wd; } else line = t; }
  if (line) lines.push(line); ctx.restore(); return lines;
}

function drawCaption(ctx, i, now) {
  const y0 = CAP_Y;
  ctx.save(); ctx.fillStyle = css(C.faint); ctx.fillRect(14, y0, PW - 28, 1); ctx.restore();
  if (gen === 0) { rtext(ctx, 'опису ще немає — це оригінал', 14, y0 + 20, '400 10.5px ' + F_MONO, css(C.dim)); return; }
  const txt = i === 0 ? curStates.place.caption : i === 1 ? curStates.face.caption : voiceView.head;
  rtext(ctx, 'опис, який написала нейромережа:', 14, y0 + 20, '400 10.5px ' + F_MONO, css(C.dim));
  const bx = 14, by = y0 + 32, bw = PW - 28, bh = PH - by - 12;
  const fit = fitText(ctx, txt, F_SANS, '400', bw, bh, 14.5, 9.5, 1.38);
  const revealMs = fast ? 220 : Math.min(2400, 300 + txt.length * 8);
  let budget = Math.floor(txt.length * Math.min(1, (now - capT0) / revealMs));
  const typing = budget < txt.length;
  ctx.save(); ctx.font = fit.font; ctx.fillStyle = css(C.ink, 0.92); ctx.textBaseline = 'top';
  let lx = bx, ly = by;
  for (let li = 0; li < fit.lines.length && budget > 0; li++) {
    const part = fit.lines[li].slice(0, budget); budget -= fit.lines[li].length + 1;
    ly = by + li * fit.lead; ctx.fillText(part, bx, ly); lx = bx + ctx.measureText(part).width;
  }
  if (typing && Math.floor(now / 260) % 2 === 0) { ctx.fillStyle = css(C.accent); ctx.fillRect(lx + 2, ly + 1, 6, fit.lead * 0.72); }
  ctx.restore();
}

function drawVoicePanel(ctx, now) {
  ctx.save(); const bg = ctx.createLinearGradient(0, IMG_Y, 0, IMG_Y + IH); bg.addColorStop(0, '#12110f'); bg.addColorStop(1, '#0b0b0a');
  ctx.fillStyle = bg; ctx.fillRect(0, IMG_Y, IW, IH); ctx.restore();
  drawWave(ctx);
  rtext(ctx, gen === 0 ? 'оригінальний запис: бабуся розповідає своїм говором' : 'так запис «почула» нейромережа:', 18, IMG_Y + 140, '400 10px ' + F_MONO, css(C.dim));
  const box = { x: 18, y: IMG_Y + 154, w: IW - 36, h: IH - 154 - 14 };
  const a = sstep(0, fadeMs(), now - voiceView.t0), rev = Math.min(1, (now - voiceView.t0) / (fast ? 250 : 1800));
  if (a < 1 && voiceView.prevText) drawWords(ctx, voiceView.prevText, voiceView.prevMarks, box, 1 - a, 1);
  drawWords(ctx, voiceView.text, voiceView.marks, box, a, rev);
}
function drawWords(ctx, text, marks, box, alpha, reveal) {
  if (alpha <= 0.01 || !text) return;
  const fit = fitText(ctx, text, F_SERIF, '400', box.w, box.h, 18, 11, 1.42);
  const nShow = Math.ceil(text.split(/\s+/).length * reveal);
  ctx.save(); ctx.font = fit.font; ctx.textBaseline = 'top';
  const sp = ctx.measureText(' ').width; let wi = 0;
  for (let li = 0; li < fit.lines.length; li++) {
    let x = box.x; const y = box.y + li * fit.lead;
    for (const w of fit.lines[li].split(' ')) {
      if (wi >= nShow) break;
      const m = marks && marks[wi];
      ctx.fillStyle = css(m ? C.accent : C.ink, alpha * (m ? 1 : 0.92));
      ctx.fillText(w, x, y); x += ctx.measureText(w).width + sp; wi++;
    }
  }
  ctx.restore();
}
function drawWave(ctx) {
  const y0 = IMG_Y + 68, amp = 48, G = AU.g; let data = null;
  if (G && G.analyser) { G.analyser.getFloatTimeDomainData(G.wave); data = G.wave; }
  ctx.save(); ctx.fillStyle = css(C.faint); ctx.fillRect(18, y0, IW - 36, 0.7);
  ctx.strokeStyle = css(C.ink, 0.85); ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.beginPath();
  const N = 180;
  for (let k = 0; k < N; k++) {
    const x = 18 + (IW - 36) * k / (N - 1);
    const v = data ? data[Math.floor(k / N * 1024)] : 0;
    const y = y0 + Math.max(-1, Math.min(1, v * 2.4)) * amp;
    if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke(); ctx.restore();
}

function drawWallLabels(L) {
  const ctx = drawingContext, fs = Math.max(10, Math.min(14, 17 * L.s));
  ['МІСЦЕ', 'ОБЛИЧЧЯ', 'ГОЛОС'].forEach((t, i) => { const r = L.rects[i]; rtext(ctx, t, r.x + r.w / 2, r.y + r.h + fs * 2.1, '500 ' + fs + 'px ' + F_MONO, css(C.dim), 'center'); });
  const ts = Math.max(10, Math.min(13, height * 0.016));
  rtext(ctx, 'Зіпсований телефон. Сто поколінь', 16, height - 18 - ts * 1.4, 'italic 400 ' + (ts + 1) + 'px ' + F_SERIF, css(C.dim));
  rtext(ctx, 'прототип: оригінали й покоління змодельовано кодом' + (fast ? '  ·  швидкий перегляд ×10' : '') + (muted ? '  ·  звук вимкнено' : ''), 16, height - 14, '400 ' + (ts - 1) + 'px ' + F_MONO, css(C.faint));
}
function drawPortraitChrome() {
  const ctx = drawingContext, names = ['МІСЦЕ', 'ОБЛИЧЧЯ', 'ГОЛОС'];
  names.forEach((t, i) => rtext(ctx, t, width * (i + 1) / 4, 34, '500 12px ' + F_MONO, css(i === viewIdx ? C.ink : C.faint), 'center'));
  ctx.save(); ctx.fillStyle = css(C.accent); ctx.fillRect(width * (viewIdx + 1) / 4 - 16, 43, 32, 1.5); ctx.restore();
  rtext(ctx, 'дотик — наступний екран', width / 2, height - 34, '400 10.5px ' + F_MONO, css(C.dim), 'center');
  rtext(ctx, 'поверніть телефон, щоб бачити всі три', width / 2, height - 18, '400 10.5px ' + F_MONO, css(C.faint), 'center');
}
function drawIdle(now) {
  const ctx = drawingContext, cx = width / 2, cy = height / 2;
  const k = Math.max(0.8, Math.min(1.2, Math.min(width / 640, height / 600)));
  rtext(ctx, 'ЗІПСОВАНИЙ ТЕЛЕФОН', cx, cy - 78 * k, '700 ' + (34 * k).toFixed(1) + 'px ' + F_SERIF, css(C.ink), 'center');
  rtext(ctx, 'Сто поколінь', cx, cy - 44 * k, 'italic 400 ' + (22 * k).toFixed(1) + 'px ' + F_SERIF, css(C.dim), 'center');
  const msg = 'Коли штучний інтелект вчиться на власних копіях, він поступово забуває все особливе, і світ стає однаковим.';
  const fs = (15 * k).toFixed(1), fit = fitText(ctx, msg, F_SANS, '400', Math.min(520, width - 48), 200, +fs, +fs, 1.45);
  fit.lines.forEach((l, i) => rtext(ctx, l, cx, cy - 6 * k + i * fit.lead, fit.font, css(C.ink, 0.85), 'center'));
  const a = 0.65 + 0.3 * Math.sin(now / 420), ty = cy + Math.max(96 * k, fit.lines.length * fit.lead + 40);
  rtext(ctx, 'торкніться, щоб почати  ·  увімкнеться звук', cx, ty, '500 ' + (12 * k).toFixed(1) + 'px ' + F_MONO, css(C.accent, a), 'center');
  rtext(ctx, '3 екрани  ·  100 поколінь по 5 с  ·  ≈ 8,5 хв', cx, height - 22, '400 11px ' + F_MONO, css(C.faint), 'center');
}

// ======================= ЗВУК =======================
// Голос проходить через «кімнату»: з кожним поколінням резонанси сильнішають (як у
// Елвіна Люсьє, «I Am Sitting in a Room»), склади зливаються, і лишається рівний гул.
const ROOM_HZ = [123.5, 185, 247, 330, 494];
const VOWELS = [[900, 1500, 2800], [600, 1000, 2700], [380, 900, 2600], [600, 2100, 2900], [450, 1900, 2800], [330, 2600, 3200]];
const CONVERGE = [247, 494, 988];

function audioInit() {
  if (AU.g) { resumeAudio(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  let ac; try { ac = new AC(); } catch (err) { return; }
  AU.g = buildAudio(ac, mulberry32(4242));
  if (VOICE_FILE) loadVoiceFile(AU.g);
  resumeAudio();
  ['touchend', 'click', 'keydown'].forEach(ev => window.addEventListener(ev, resumeAudio, { passive: true }));
}
function resumeAudio() { const G = AU.g; if (G && G.ac.state === 'suspended' && G.ac.resume) G.ac.resume().catch(() => {}); }

function buildAudio(ac, R) {
  const G = { ac: ac, fileOn: false };
  G.out = ac.createGain(); G.out.gain.value = muted ? 0 : 1; G.out.connect(ac.destination);
  G.analyser = ac.createAnalyser(); G.analyser.fftSize = 2048; G.wave = new Float32Array(2048); G.analyser.connect(G.out);
  G.phaseGain = ac.createGain(); G.phaseGain.gain.value = 0; G.phaseGain.connect(G.analyser);
  G.bus = ac.createGain();
  let node = G.bus;
  G.peaks = ROOM_HZ.map(f => { const p = ac.createBiquadFilter(); p.type = 'peaking'; p.frequency.value = f; p.Q.value = 2; p.gain.value = 0; node.connect(p); node = p; return p; });
  G.lp = ac.createBiquadFilter(); G.lp.type = 'lowpass'; G.lp.frequency.value = 9000; node.connect(G.lp);
  G.dry = ac.createGain(); G.dry.gain.value = 0.9; G.lp.connect(G.dry); G.dry.connect(G.phaseGain);
  G.verb = ac.createConvolver(); G.verb.buffer = makeImpulse(ac, 3.0, 2.4, R);
  G.wet = ac.createGain(); G.wet.gain.value = 0.08; G.lp.connect(G.verb); G.verb.connect(G.wet); G.wet.connect(G.phaseGain);
  G.drone = ac.createGain(); G.drone.gain.value = 0; G.drone.connect(G.phaseGain); G.drone.connect(G.verb);
  ROOM_HZ.forEach((f, i) => {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * (1 + (i % 2 ? 0.0015 : -0.0015));
    const gg = ac.createGain(); gg.gain.value = [1, 0.75, 0.6, 0.4, 0.22][i]; o.connect(gg); gg.connect(G.drone); o.start();
  });
  // синтезований «голос»: пилка через три форманти + дихання + приголосні
  const V = { R: R, next: 0, syl: 0, words: 0, base: 205, phraseT: 0 };
  V.osc = ac.createOscillator(); V.osc.type = 'sawtooth'; V.osc.frequency.value = 205;
  V.vib = ac.createOscillator(); V.vib.frequency.value = 5.3; V.vibAmt = ac.createGain(); V.vibAmt.gain.value = 3;
  V.vib.connect(V.vibAmt); V.vibAmt.connect(V.osc.frequency);
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = R() * 2 - 1;
  V.noise = ac.createBufferSource(); V.noise.buffer = nb; V.noise.loop = true;
  V.src = ac.createGain();
  const og = ac.createGain(); og.gain.value = 0.55; V.osc.connect(og); og.connect(V.src);
  V.breath = ac.createGain(); V.breath.gain.value = 0.06; V.noise.connect(V.breath); V.breath.connect(V.src);
  V.env = ac.createGain(); V.env.gain.value = 0;
  V.form = [0, 1, 2].map(i => {
    const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = VOWELS[0][i]; b.Q.value = [7, 9, 11][i];
    const gg = ac.createGain(); gg.gain.value = [2.4, 1.6, 0.7][i]; V.src.connect(b); b.connect(gg); gg.connect(V.env); return b;
  });
  V.hiss = ac.createBiquadFilter(); V.hiss.type = 'highpass'; V.hiss.frequency.value = 3800;
  V.cons = ac.createGain(); V.cons.gain.value = 0; V.noise.connect(V.hiss); V.hiss.connect(V.cons);
  V.out = ac.createGain(); V.out.gain.value = 1; V.env.connect(V.out); V.cons.connect(V.out); V.out.connect(G.bus);
  V.osc.start(); V.vib.start(); V.noise.start();
  G.V = V;
  return G;
}
function makeImpulse(ac, sec, decay, R) {
  const len = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (R() * 2 - 1) * Math.pow(1 - i / len, decay); }
  return b;
}
function loadVoiceFile(G) {
  if (!window.fetch) return;
  fetch(VOICE_FILE).then(r => { if (!r.ok) throw new Error('no file'); return r.arrayBuffer(); })
    .then(buf => new Promise((res, rej) => G.ac.decodeAudioData(buf, res, rej)))
    .then(audio => { G.fileBuf = audio; G.fileGain = G.ac.createGain(); G.fileGain.gain.value = 0; G.fileGain.connect(G.bus); G.fileOn = true; restartVoiceFile(); })
    .catch(() => {});
}
function restartVoiceFile() {
  const G = AU.g; if (!G || !G.fileOn) return;
  try { if (G.fileSrc) G.fileSrc.stop(); } catch (e) {}
  const s = G.ac.createBufferSource(); s.buffer = G.fileBuf; s.loop = true; s.connect(G.fileGain); s.start(); G.fileSrc = s;
}

// d: 0 — оригінал, 1 — сотий «перезапис»; level: гучність фази
function audioParams(G, d, level, t) {
  const tc = 0.4, pk = 22 * Math.pow(d, 1.25), voiceLvl = 1 - 0.8 * sstep(0.8, 1, d);
  G.peaks.forEach(p => { p.gain.setTargetAtTime(pk, t, tc); p.Q.setTargetAtTime(2 + 30 * Math.pow(d, 1.5), t, tc); });
  G.lp.frequency.setTargetAtTime(700 + 8300 * Math.pow(1 - d, 2), t, tc);
  G.dry.gain.setTargetAtTime(0.9 * Math.pow(10, -pk * 0.85 / 20), t, tc);
  G.wet.gain.setTargetAtTime(0.08 + 0.4 * d, t, tc);
  G.drone.gain.setTargetAtTime(0.085 * sstep(0.3, 1, d), t, tc);
  G.V.out.gain.setTargetAtTime(G.fileOn ? 0 : voiceLvl, t, tc);
  if (G.fileGain) G.fileGain.gain.setTargetAtTime(voiceLvl, t, tc);
  G.V.breath.gain.setTargetAtTime(0.06 * (1 - d), t, tc);
  G.V.vibAmt.gain.setTargetAtTime(3 * (1 - d), t, tc);
  G.phaseGain.gain.setTargetAtTime(level, t, level > 0.01 ? 0.25 : 0.45);
}
function voiceSchedule(G, d, until) {
  const V = G.V, R = V.R, k = Math.pow(d, 0.8);
  if (V.next < G.ac.currentTime) V.next = G.ac.currentTime + 0.02;
  while (V.next < until) {
    let t = V.next;
    if (V.words <= 0) {
      V.words = 3 + Math.floor(R() * 6);
      V.env.gain.setTargetAtTime(lp(0, 0.85, k), t, 0.06);
      t += (0.35 + R() * 0.7) * Math.pow(1 - d, 1.5);
      V.base = lp(205, 185, d) * (1 + (R() * 0.12 - 0.04) * (1 - d)); V.phraseT = t;
    }
    if (V.syl <= 0) { V.syl = 1 + Math.floor(R() * 3); V.words--; t += (0.03 + R() * 0.09) * (1 - d); }
    const dur = (0.11 + R() * 0.15) * (1 + 1.6 * d), vw = VOWELS[Math.floor(R() * VOWELS.length)];
    V.form.forEach((b, i) => b.frequency.setTargetAtTime(lp(vw[i], CONVERGE[i], k), t, 0.02 + 0.25 * d));
    V.env.gain.setTargetAtTime((0.65 + R() * 0.35) * lp(1, 0.85, d), t, 0.012 + 0.1 * d);
    V.env.gain.setTargetAtTime(lp(0.06, 0.85, k), t + dur * 0.62, 0.03 + 0.12 * d);
    if (R() < 0.55 * (1 - d)) { V.cons.gain.setTargetAtTime(0.35 * Math.pow(1 - d, 2), t, 0.004); V.cons.gain.setTargetAtTime(0, t + 0.03, 0.012); }
    const decl = 1 - 0.08 * (1 - d) * Math.min(1, (t - V.phraseT) / 2);
    V.osc.frequency.setTargetAtTime(V.base * decl * (1 + (R() - 0.5) * 0.06 * (1 - d)), t, 0.04 + 0.3 * d);
    V.syl--; V.next = t + dur;
  }
}
let lastParamT = -1000;
function audioUpdate(now, frac) {
  const G = AU.g; if (!G) return;
  let d = 0, level = 0;
  if (phase === 'orig') level = 0.9;
  else if (phase === 'gen') { d = Math.min(1, (gen - 1 + frac) / (GEN_TOTAL - 1)); level = 0.9; }
  else if (phase === 'dark') d = (now - phaseT0) < darkMs() * 0.5 ? 1 : 0;
  const t = G.ac.currentTime;
  if (now - lastParamT > 100) { lastParamT = now; audioParams(G, d, level, t); G.out.gain.setTargetAtTime(muted ? 0 : 1, t, 0.1); }
  voiceSchedule(G, d, t + 0.15);
}
