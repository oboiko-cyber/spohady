// Робоча копія: помічники box/line перейменовано на uiBox/uiLine, бо p5 має власні box()/line() і перезаписує їх.
/*
  ВИВІЛЬНЕНИЙ ЧАС — інтерактивний твір для p5.js Web Editor.
  Авторський задум: Орина Бойко. Програмна реалізація: прототип для виставки «Спогади».
  Усе намальовано в одному canvas. Немає реального Slack, файлів, мережевих API чи збору даних.
  Скопіюйте цей файл у sketch.js в https://editor.p5js.org/.
  Працює без зображень і без додаткової звукової бібліотеки.
  Керування: перетягніть віртуальний файл у пунктирну зону; натисніть «Здати завдання».
  Альтернатива: клікніть файл, потім зону завантаження. M — звук, R — рестарт, Esc — вихід.
*/

const ART_W = 1280;
const ART_H = 760;
const COLORS = {
  purple: '#361537', sidebar: '#301532', sidebarLight: '#4d2750',
  purpleLight: '#613963', bg: '#f8f8fa', white: '#ffffff',
  ink: '#232129', gray: '#73727e', faint: '#b1afbb', border: '#e8e6ed',
  blue: '#1769aa', blueBg: '#eaf4ff', green: '#08785c', red: '#b63b44',
  orange: '#ec9d30', lightRed: '#fff0f0', violet: '#f2edf8'
};

const TASKS = [
  {
    name: 'Підготувати короткий звіт',
    details: 'ЗРОБІТЬ звіт за тиждень. Терміново. Здайте готовий файл сюди.',
    file: 'Звіт_за_тиждень_AI.docx',
    output: 'Звіт підготовлено: 6 сторінок, таблиця й висновки.',
    sender: 'Олена · керівниця', channel: '@олена', wait: 3300
  },
  {
    name: 'Оновити таблицю витрат',
    details: 'ПЕРЕВІРТЕ витрати та НАДІШЛІТЬ таблицю негайно. Не затримуйте.',
    file: 'Витрати_Q4_AI.xlsx',
    output: 'Таблицю оновлено: 42 рядки, формули перевірено.',
    sender: '#завдання', channel: '#завдання', wait: 3700
  }
];

const ORDERS = [
  ['@олена', 'ДЕ ЗВІТ? Надішліть його зараз.'],
  ['#терміново', 'НОВА ЗАДАЧА. Підготуйте презентацію до кінця години.'],
  ['@олена', 'ПЕРЕРОБІТЬ таблицю. Попередня версія більше не підходить.'],
  ['#завдання', 'ДОДАЙТЕ прогноз. Потрібно було ще вчора.'],
  ['@олена', 'НЕ ЧЕКАЙТЕ відповіді. Робіть наступне.'],
  ['#терміново', 'ЗРОБІТЬ три варіанти листа. Один — терміново.'],
  ['@олена', 'ПЕРЕВІРТЕ всі цифри. Чекаю за п’ять хвилин.'],
  ['#завдання', 'ЗАПОВНІТЬ нову форму. Без затримок.'],
  ['@олена', 'ВИ Ж ЗВІЛЬНИЛИ ЧАС? Тоді візьміть ще одну задачу.'],
  ['#терміново', 'ДЕДЛАЙН ЗМІНЕНО. Виконайте прямо зараз.'],
  ['#завдання', 'ПІДГОТУЙТЕ підсумок зустрічі та надішліть команді.'],
  ['@олена', 'ЧОМУ НЕ ВІДПОВІДАЄТЕ? Підтвердіть отримання.'],
  ['#терміново', 'ТЕРМІНОВО: виправте файл, який ви щойно надіслали.'],
  ['#завдання', 'ДОДАЙТЕ графіки. Переконайтесь, що все актуально.'],
  ['@олена', 'ВИКОНАЙТЕ наступне. Це займе лише п’ять хвилин.'],
  ['#терміново', 'НЕГАЙНО ЗАВЕРШІТЬ попередні завдання.']
];

let app, zones, graphics, pointer, drag, scaleUI, offsetX, offsetY;
let audioContext = null, soundEnabled = true;

function resetArtwork() {
  app = {
    stage: 'intro',
    currentTask: 0, finished: 0, aiReady: false, aiStart: 0,
    selectedFile: false, attached: false, hint: '', hintUntil: 0,
    readyForNextAt: 0, sentAt: 0, secondDoneAt: 0,
    messages: [], filter: 'Усі',
    avalancheStart: 0, nextAlertAt: 0, alertCount: 0,
    popups: [], frozenSubmit: false,
    clockSeconds: 9 * 3600, lastClockAt: 0,
    readScroll: 0, autoScroll: true, paused: false
  };
  zones = [];
  drag = null;
  pointer = { x: -500, y: -500, down: false };
  if (audioContext && audioContext.state === 'running') {
    // Попередній звуковий контекст використовується повторно.
  }
  addMessage('system', 'Сьогодні звичайний робочий день. ШІ обіцяє звільнити ваш час.', 'Усі');
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.elt.style.display = 'block';
  pixelDensity(1);
  document.body.style.margin = '0';
  document.body.style.backgroundColor = '#1b1320';
  document.body.style.overflow = 'hidden';
  resetArtwork();
}

function draw() {
  const now = millis();
  const dt = Math.min(0.1, Math.max(0, deltaTime / 1000));
  updateArtwork(now, dt);
  const ctx = drawingContext;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#1b1320';
  ctx.fillRect(0, 0, width, height);
  scaleUI = Math.min(width / ART_W, height / ART_H);
  offsetX = (width - ART_W * scaleUI) / 2;
  offsetY = (height - ART_H * scaleUI) / 2;
  zones = [];
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scaleUI, scaleUI);
  graphics = ctx;
  drawWorkspace(now);
  if (drag) drawDragging();
  if (app.stage === 'intro') drawIntro();
  if (app.paused) drawExitOverlay();
  ctx.restore();
  // Опис для допоміжних технологій задається один раз, якщо доступний.
}

function updateArtwork(now, dt) {
  if (!app || app.stage === 'intro' || app.paused) return;
  const age = app.stage === 'avalanche' ? (now - app.avalancheStart) / 1000 : 0;
  const speed = app.stage === 'avalanche' ? Math.min(660, 35 + age * 8) : 1;
  app.clockSeconds += dt * speed;
  if (app.stage === 'work') {
    const task = TASKS[app.currentTask];
    if (!app.aiReady && now - app.aiStart >= task.wait) {
      app.aiReady = true;
      addMessage('ai', `Готово. ${task.output} Заберіть файл у панелі праворуч.`, '@ші-помічник');
      cue('success');
    }
  } else if (app.stage === 'sending' && now - app.sentAt > 1050) {
    app.finished += 1;
    app.attached = false;
    app.selectedFile = false;
    app.hint = '';
    addMessage('system', `✓ Завдання ${app.finished} з 2 успішно здано.`, 'Усі');
    cue('success');
    if (app.finished < 2) {
      app.stage = 'between';
      app.readyForNextAt = now + 1200;
    } else {
      app.stage = 'pre-avalanche';
      app.secondDoneAt = now;
      addMessage('boss', 'ШВИДКО ВПОРАЛИСЯ. Отже, у вас є вільний час. ПРИСТУПАЙТЕ до нових завдань.', '@олена');
    }
  } else if (app.stage === 'between' && now >= app.readyForNextAt) {
    beginTask(1, now);
  } else if (app.stage === 'pre-avalanche' && now - app.secondDoneAt > 2300) {
    beginAvalanche(now);
  } else if (app.stage === 'avalanche') {
    let guard = 0;
    while (now >= app.nextAlertAt && guard < 5) {
      spawnAlert(now);
      guard++;
    }
    app.popups = app.popups.filter(p => now - p.at < 19000).slice(-26);
  }
}

function beginTask(i, now) {
  app.stage = 'work';
  app.currentTask = i;
  app.aiReady = false;
  app.aiStart = now;
  app.attached = false;
  app.selectedFile = false;
  const task = TASKS[i];
  addMessage('boss', task.details, task.channel);
  addMessage('ai', 'ШІ-помічник: аналізую завдання…', '@ші-помічник');
  app.autoScroll = true;
  cue('ping');
}

function startArtwork() {
  if (app.stage !== 'intro') return;
  initAudio();
  beginTask(0, millis());
}

function beginAvalanche(now) {
  app.stage = 'avalanche';
  app.avalancheStart = now;
  app.nextAlertAt = now;
  app.alertCount = 0;
  app.attached = false;
  app.selectedFile = false;
  app.filter = 'Усі';
  addMessage('boss', 'НЕ ЗУПИНЯЙТЕСЯ. Нові доручення вже надіслано.', '#терміново');
  cue('alarm');
}

function spawnAlert(now) {
  const [channel, message] = ORDERS[app.alertCount % ORDERS.length];
  app.alertCount++;
  addMessage('boss', message, channel);
  const seed = app.alertCount;
  const x = 255 + ((seed * 197) % 650);
  const y = 140 + ((seed * 113) % 490);
  app.popups.push({ channel, message, x, y, at: now, id: seed });
  const seconds = (now - app.avalancheStart) / 1000;
  const interval = Math.max(440, 2400 - seconds * 29);
  app.nextAlertAt = now + interval;
  app.autoScroll = true;
  cue(app.alertCount % 3 === 0 ? 'alarm' : 'ping');
}

function addMessage(type, body, channel) {
  app.messages.push({ type, body, channel, id: app.messages.length + 1 });
  if (app.messages.length > 110) app.messages.shift();
  app.autoScroll = true;
}

// -----------------------------------------------------------------------------
// КАНВА ТА КОМПОНЕНТИ
// -----------------------------------------------------------------------------
function uiBox(x, y, w, h, r, fill, stroke = null, sw = 1) {
  const c = graphics;
  c.beginPath();
  const q = Math.min(r, w / 2, h / 2);
  c.moveTo(x + q, y);
  c.lineTo(x + w - q, y); c.quadraticCurveTo(x + w, y, x + w, y + q);
  c.lineTo(x + w, y + h - q); c.quadraticCurveTo(x + w, y + h, x + w - q, y + h);
  c.lineTo(x + q, y + h); c.quadraticCurveTo(x, y + h, x, y + h - q);
  c.lineTo(x, y + q); c.quadraticCurveTo(x, y, x + q, y);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw; c.stroke(); }
}
function label(s, x, y, size = 14, color = COLORS.ink, weight = 400, font = 'Arial, sans-serif', maxWidth = undefined) {
  const c = graphics;
  c.font = `${weight} ${size}px ${font || 'Arial, sans-serif'}`;
  c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillStyle = color;
  if (maxWidth) c.fillText(String(s), x, y, maxWidth);
  else c.fillText(String(s), x, y);
}
function textLines(s, maxWidth, size = 14, weight = 400) {
  const c = graphics;
  c.font = `${weight} ${size}px Arial, sans-serif`;
  const lines = [];
  for (const paragraph of String(s).split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const attempt = line ? `${line} ${word}` : word;
      if (c.measureText(attempt).width > maxWidth && line) {
        lines.push(line); line = word;
      } else line = attempt;
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [''];
}
function paragraphs(s, x, y, w, fs = 14, color = COLORS.ink, leading = 20, limit = 99, weight = 400) {
  const lines = textLines(s, w, fs, weight).slice(0, limit);
  lines.forEach((line, i) => label(line, x, y + i * leading, fs, color, weight));
  return lines.length * leading;
}
function uiLine(x1, y1, x2, y2, color, width = 1) {
  const c = graphics; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2);
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function button(title, x, y, w, h, fn, opts = {}) {
  const over = pointer.x >= x && pointer.x <= x + w && pointer.y >= y && pointer.y <= y + h;
  uiBox(x, y, w, h, opts.r || 8, opts.bg || (over ? '#12609a' : COLORS.blue), opts.stroke || null);
  const c = graphics; c.font = `${opts.weight || 600} ${opts.fs || 14}px Arial, sans-serif`;
  const tw = c.measureText(title).width;
  label(title, x + (w - tw) / 2, y + h / 2 + (opts.fs || 14) * 0.35, opts.fs || 14, opts.fg || COLORS.white, opts.weight || 600);
  if (fn) hotspot(x, y, w, h, fn);
}
function hotspot(x, y, w, h, fn, id = '') { zones.push({ x, y, w, h, fn, id }); }
function clockFormat() {
  const sec = Math.floor(app.clockSeconds) % 86400;
  const hh = String(Math.floor(sec / 3600)).padStart(2, '0');
  const mm = String(Math.floor(sec / 60) % 60).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
function drawWorkspace(now) {
  const c = graphics;
  c.fillStyle = COLORS.bg; c.fillRect(0, 0, ART_W, ART_H);
  drawTopbar(now);
  drawSidebar();
  drawMessagePane();
  drawRightPane(now);
  drawComposer(now);
  if (app.stage === 'avalanche') drawAvalanche(now);
}
function drawTopbar(now) {
  const c = graphics;
  c.fillStyle = COLORS.purple; c.fillRect(0, 0, ART_W, 58);
  label('◈', 20, 37, 27, '#fff', 600);
  label('workplace', 55, 37, 20, '#fff', 700);
  uiBox(310, 12, 600, 34, 7, '#59375a');
  label('⌕  Пошук у повідомленнях, файлах і каналах', 326, 34, 13, '#d8ccda');
  const acceleration = app.stage === 'avalanche' ? Math.min(660, 35 + (now - app.avalancheStart) / 1000 * 8) : 1;
  const alarm = app.stage === 'avalanche';
  uiBox(985, 9, 184, 40, 8, alarm ? '#8b243c' : '#59375a', alarm ? '#fa8794' : '#715375', 1);
  label(`◷  ${clockFormat()}`, 996, 36, 20, '#fff', 700);
  if (alarm) label(`×${Math.floor(acceleration)}`, 1118, 35, 14, '#ffd1cc', 700);
  button(soundEnabled ? '♪ Увімк.' : '♪ Вимк.', 1200, 12, 72, 32, toggleSound, { bg:'#6b456d', fs:11, r:6 });
}
function drawSidebar() {
  const c = graphics;
  c.fillStyle = COLORS.sidebar; c.fillRect(0, 58, 220, ART_H - 58);
  label('◉  Команда / відділ', 18, 93, 16, '#fff', 700);
  label('Робоча область', 20, 119, 12, '#c5b3c9');
  uiLine(15, 133, 202, 133, '#644267');
  const nav = [
    ['Усі', '▣   Усі повідомлення', 157],
    ['#завдання', '#   завдання', 217],
    ['#терміново', '#   терміново', 256],
    ['@олена', '●  Олена · керівниця', 342],
    ['@ші-помічник', '✦  ШІ-помічник', 381]
  ];
  label('КАНАЛИ', 18, 198, 12, '#c7b7ca', 700);
  label('ПРЯМІ ПОВІДОМЛЕННЯ', 18, 322, 11, '#c7b7ca', 700);
  for (const [id, txt, y] of nav) {
    if (app.filter === id) uiBox(10, y - 23, 200, 31, 6, COLORS.sidebarLight);
    label(txt, 20, y - 2, 13, '#f5eefa', app.filter === id ? 700 : 400);
    hotspot(10, y - 25, 198, 34, () => {app.filter=id; app.autoScroll=true;});
  }
  if (app.stage === 'avalanche') {
    uiBox(178, 233, 27, 18, 8, '#d94957');
    label(String(Math.min(99,app.alertCount)), 183, 247, 11, '#fff', 700);
  }
  uiLine(15, 704, 202, 704, '#624264');
  label('●  Ви  ·  на роботі', 20, 729, 12, '#e9dfe9', 500);
  label('Статус: доступна', 20, 746, 10, '#bbaac0');
}
function drawMessagePane() {
  const c=graphics;
  c.fillStyle = COLORS.white; c.fillRect(220, 58, 745, ART_H-58);
  label('Усі повідомлення', 247, 94, 20, COLORS.ink, 700);
  label('Поточний робочий день · повідомлення команди', 247, 113, 12, COLORS.gray);
  uiLine(220, 124, 965, 124, COLORS.border);
  c.save();
  c.beginPath(); c.rect(221, 125, 744, 420); c.clip();
  const visible = app.messages.filter(m => app.filter === 'Усі' || m.channel === app.filter || m.type === 'system');
  const layout = visible.map(m => {
    const size = m.type === 'system' ? 12.5 : 14;
    let body = m.body;
    if (m.type === 'ai' && m.body.startsWith('ШІ-помічник: аналізую') &&
        app.stage === 'work' && !app.aiReady &&
        m === app.messages[app.messages.length - 1]) {
      const progress = Math.min(4, Math.floor((millis() - app.aiStart) / TASKS[app.currentTask].wait * 4));
      const dots = '.'.repeat(1 + Math.floor(millis() / 430) % 3);
      body = `ШІ друкує${dots}  ${'▰'.repeat(progress)}${'▱'.repeat(4-progress)}`;
    }
    const wrap=textLines(body, 620, size);
    return {...m, lines:wrap, height: (m.type==='system' ? 12 : 29) + wrap.length * 19 + 14};
  });
  const totalHeight=layout.reduce((sum,m)=>sum+m.height,0);
  const viewport=406;
  if (app.autoScroll) { app.readScroll=Math.max(0,totalHeight-viewport); app.autoScroll=false; }
  const maxScroll=Math.max(0,totalHeight-viewport);
  app.readScroll=Math.max(0,Math.min(maxScroll,app.readScroll));
  let yy=147-app.readScroll;
  for (const m of layout) {
    if (yy+m.height >= 126 && yy < 550) {
      if (m.type==='system') {
        uiBox(247, yy-17, 675, m.height-1, 5, '#f4f5f7');
        m.lines.forEach((s,j)=>label(s,260,yy+5+j*19,12.5,'#666571'));
      } else {
        const isAI=m.type==='ai';
        const isBoss=m.type==='boss';
        uiBox(247,yy-12,33,33,7,isAI?'#e6e2ff':isBoss?'#eaddf0':'#e6edf3');
        label(isAI?'✦':isBoss?'О':'•',isAI?255:258,yy+11,16,isAI?'#6448af':isBoss?'#623165':'#477492',700);
        const uname = isAI?'ШІ-помічник':m.channel==='@олена'?'Олена · керівниця':m.channel;
        label(uname,289,yy,13.2,COLORS.ink,700);
        label(m.channel==='@олена'?'особисте повідомлення':m.channel, 289,yy+17,10.5,COLORS.gray);
        m.lines.forEach((s,j)=>label(s,289,yy+39+j*19,14,COLORS.ink,400));
      }
    }
    yy+=m.height;
  }
  c.restore();
  if (maxScroll>1) {
    const y=131+(app.readScroll/maxScroll)*Math.max(0,390-(406/totalHeight)*390);
    uiBox(957,y,4,Math.max(40,(406/totalHeight)*390),2,'#c8c6d0');
  }
}
function drawRightPane(now) {
  const c=graphics;
  c.fillStyle = '#fcfbfd'; c.fillRect(965,58,315,ART_H-58);
  uiLine(965,58,965,ART_H,COLORS.border);
  label('Активне завдання',989,91,17,COLORS.ink,700);
  uiLine(982,106,1264,106,COLORS.border);
  const avalanche=app.stage==='avalanche';
  const task=TASKS[Math.min(app.currentTask,1)];
  if (app.stage==='intro') {
    label('Завдання з’явиться після початку.',990,150,13,COLORS.gray);
    return;
  }
  if (!avalanche && app.stage !== 'pre-avalanche') {
    uiBox(984,126,278,115,10,'#fff','#e3dce8');
    label(`Завдання ${app.currentTask+1} із 2`,1000,148,12,COLORS.green,700);
    paragraphs(task.name,1000,177,245,16,COLORS.ink,20,2,700);
    paragraphs(task.details,1000,207,244,12.1,COLORS.gray,16,2);
  } else {
    uiBox(984,126,278,135,10,'#fff1f1','#f6b5bd');
    label('● НОВІ ЗАВДАННЯ',1000,151,12,COLORS.red,700);
    label(`${app.alertCount} отримано`,1000,184,25,COLORS.red,700);
    paragraphs('ПІДГОТУЙТЕ новий файл і НАДІШЛІТЬ його. Негайно.',1000,213,248,12.3,COLORS.ink,18,2);
  }
  label('ШІ-ПОМІЧНИК  ·  ФАЙЛИ',990,287,12,COLORS.gray,700);
  const aiIsWorking=app.stage==='work'&&!app.aiReady;
  uiBox(985,304,279,150,10,COLORS.white,COLORS.border);
  if (aiIsWorking) {
    const progress=Math.min(1,(now-app.aiStart)/(TASKS[app.currentTask].wait));
    label('✦  ШІ опрацьовує завдання…',1001,330,13,COLORS.purpleLight,700);
    uiBox(1001,351,245,7,4,'#e9e7ee');
    uiBox(1001,351,245*progress,7,4,'#9071bc');
    label('Аналізую → створюю файл → перевіряю',1001,381,11,COLORS.gray);
    label('Після завершення перетягніть файл ↓',1001,408,11,COLORS.gray);
  } else if (app.stage==='work'||avalanche||app.stage==='sending') {
    const name=avalanche?'Відповідь_на_запит_03.docx':task.file;
    uiBox(997,321,254,82,8,app.selectedFile?'#eef4ff':'#f6f4f8',app.selectedFile?'#85b3e0':'#e4e0e8');
    label('▤',1009,356,29,COLORS.blue,700);
    label(name,1044,344,11,COLORS.ink,600,null,194);
    label(app.selectedFile?'Вибрано · натисніть зону зліва':'Перетягніть цей файл →',1044,365,11,COLORS.gray);
    label('Файл створено штучним інтелектом',1002,427,10.6,COLORS.gray);
    hotspot(997,321,254,82,()=>{drag={startX:pointer.x,startY:pointer.y,x:pointer.x,y:pointer.y,hasMoved:false};},'file');
  } else {
    label('✓ Два файли успішно здано.',1001,344,13,COLORS.green,600);
  }
  uiLine(985,481,1261,481,COLORS.border);
  label('ПРОДУКТИВНІСТЬ',991,506,11,COLORS.gray,700);
  label(`Здано: ${app.finished} / 2`,990,538,20,COLORS.ink,700);
  if (avalanche) {
    label('Нових доручень:',990,583,13,COLORS.gray);
    label(String(app.alertCount),990,632,47,COLORS.red,800);
    label('Заощаджений час уже зайнято.',991,667,12,COLORS.red,700);
  } else {
    label('Швидше = більше вільного часу?',990,570,12,COLORS.gray);
  }
  label('M — звук     R — почати спочатку',991,739,11,COLORS.gray);
}
function drawComposer(now) {
  const c=graphics;
  c.fillStyle = '#fff'; c.fillRect(220,545,745,215);
  uiLine(220,545,965,545,COLORS.border);
  const zoneX=246,zoneY=578,zoneW=692,zoneH=91;
  const over=pointer.x>zoneX&&pointer.x<zoneX+zoneW&&pointer.y>zoneY&&pointer.y<zoneY+zoneH;
  c.save(); c.setLineDash([8,5]);
  uiBox(zoneX,zoneY,zoneW,zoneH,9,app.attached?'#eaf6f0':over?'#eff5ff':'#faf9fc',app.attached?'#58a587':over?'#6fa3e9':'#b7adbd',2);
  c.restore();
  if (app.attached) {
    label('✓  Файл прикріплено',268,611,17,COLORS.green,700);
    const name=app.stage==='avalanche'?'Відповідь_на_запит_03.docx':TASKS[app.currentTask].file;
    label(name,268,641,13,COLORS.gray);
  } else {
    label('⇩  Перетягніть сюди готовий файл',268,611,17,COLORS.ink,600);
    label('Або виберіть файл у правій панелі й натисніть сюди',268,640,12,COLORS.gray);
  }
  hotspot(zoneX,zoneY,zoneW,zoneH,()=>{
    if (app.selectedFile) attachFile();
    else flashHint('Спочатку виберіть файл у правій панелі.');
  },'drop');
  const actionLabel=app.frozenSubmit?'◌  Надсилання…':app.stage==='sending'?'◌  Надсилання…':'Здати завдання';
  const actionColor=app.frozenSubmit||app.stage==='sending'?'#7a6c8c':COLORS.green;
  button(actionLabel,724,691,214,50,submitTask,{bg:actionColor,fs:17,r:9});
  if (app.stage==='avalanche'&&app.frozenSubmit) {
    label('Система обробляє запит…',247,718,14,COLORS.red,700);
  } else if (app.hint && now<app.hintUntil) {
    label(app.hint,247,719,13,COLORS.red,600);
  } else {
    label(app.stage==='avalanche'?'Невиконані завдання продовжують надходити.':'Після завершення ШІ перетягніть файл і здайте його.',247,716,12,COLORS.gray);
  }
}
function drawAvalanche(now) {
  const c=graphics;
  const age=(now-app.avalancheStart)/1000;
  const intensity=Math.min(0.22,age/170*0.22);
  c.fillStyle=`rgba(105, 14, 25, ${intensity.toFixed(3)})`;
  c.fillRect(220,58,1060,702);
  const popups=app.popups.slice(-Math.min(19,5+Math.floor(age/9)));
  popups.forEach(p=>{
    const elapsed=now-p.at;
    const alpha=Math.min(0.97,Math.max(0,elapsed/300))*Math.min(1,(19000-elapsed)/1300);
    if(alpha<=0) return;
    c.save(); c.globalAlpha=alpha;
    c.shadowColor='rgba(50, 12, 30, 0.33)'; c.shadowBlur=16;
    uiBox(p.x,p.y,293,84,10,'#fff7f7','#eebfc5');
    c.shadowBlur=0;
    uiBox(p.x+10,p.y+10,7,7,4,COLORS.red);
    label(p.channel+' · НОВЕ ЗАВДАННЯ',p.x+27,p.y+19,11,COLORS.red,700);
    paragraphs(p.message,p.x+13,p.y+43,268,12.5,COLORS.ink,17,2,600);
    c.restore();
  });
  // Кнопка лишається доступною; повідомлення візуально загромаджують екран.
  if (age>40) {
    uiBox(259,115,560,42,8,`rgba(127, 20, 38, ${0.80})`);
    label('Час заощаджено. Але він більше не ваш.',274,142,18,'#fff',700);
  }
}
function drawDragging() {
  const c=graphics; c.save(); c.globalAlpha=.86;
  c.shadowColor='rgba(0,0,0,.3)'; c.shadowBlur=12;
  uiBox(pointer.x-110,pointer.y-25,235,57,8,'#fff','#8bb0d5');
  c.shadowBlur=0;
  label('▤  AI-файл · перетягніть',pointer.x-93,pointer.y+8,13,COLORS.blue,700);
  c.restore();
}
function drawIntro() {
  const c=graphics;
  c.fillStyle='rgba(20,13,27,.87)'; c.fillRect(0,0,ART_W,ART_H);
  uiBox(316,124,648,510,18,'#fff');
  label('ВИВІЛЬНЕНИЙ ЧАС',370,210,34,COLORS.purple,700);
  label('Інтерактивна робоча зміна',372,241,18,COLORS.gray);
  uiLine(370,268,910,268,COLORS.border);
  paragraphs('Штучний інтелект допоможе вам швидко виконати два завдання. Перетягніть готові файли у робочий чат і натисніть «Здати завдання».',372,306,526,18,COLORS.ink,27,4);
  paragraphs('Що трапиться з часом, який ви заощадили?',372,398,526,20,COLORS.purple,28,2,700);
  label('Звук: повідомлення, клацання й наростання напруження.',372,464,14,COLORS.gray);
  label('Усі файли та повідомлення вигадані. Дані не надсилаються.',372,492,12,COLORS.gray);
  button('Почати робочий день',391,539,498,56,startArtwork,{bg:COLORS.green,fs:18,r:10});
}
function drawExitOverlay() {
  const c=graphics;
  c.fillStyle='rgba(25,13,29,.86)'; c.fillRect(0,0,ART_W,ART_H);
  uiBox(360,216,560,317,15,'#fff');
  label('Ви зупинили робочий день',403,286,26,COLORS.purple,700);
  paragraphs('Завдання продовжуватимуть надходити, навіть коли ви підете.',403,337,470,17,COLORS.ink,26,3);
  button('Повернутись до роботи',403,433,226,52,()=>{app.paused=false;},{bg:COLORS.purpleLight,fs:14});
  button('Почати знову',649,433,225,52,()=>{resetArtwork();},{bg:COLORS.green,fs:15});
}
// -----------------------------------------------------------------------------
// ІНТЕРАКТИВНІ ДІЇ
// -----------------------------------------------------------------------------
function attachFile() {
  if (!(app.stage==='work'||app.stage==='avalanche')) return;
  if (app.stage==='work'&&!app.aiReady) return flashHint('ШІ ще готує файл.');
  app.attached=true; app.selectedFile=false;
  flashHint('Файл прикріплено. Тепер натисніть «Здати завдання».');
  cue('click');
}
function flashHint(s) {app.hint=s;app.hintUntil=millis()+4000;}
function submitTask() {
  if (app.stage==='avalanche') {
    app.frozenSubmit=true; // Навмисно ніколи не переходить у «Надіслано».
    cue('alarm');
    return;
  }
  if (app.stage==='sending') return;
  if (app.stage!=='work') return flashHint('Зачекайте, доки завдання стане доступним.');
  if (!app.attached) return flashHint('Потрібно перетягнути файл із правої панелі.');
  app.stage='sending';
  app.sentAt=millis();
  cue('click');
}
function mappedPoint(px,py) {return {x:(px-offsetX)/scaleUI,y:(py-offsetY)/scaleUI};}
function handlePointerDown(px,py) {
  const p=mappedPoint(px,py);pointer.x=p.x;pointer.y=p.y;pointer.down=true;
  if (drag) return;
  if (app.stage === 'intro') {
    const start = zones.find(z => z.y === 539 && z.x === 391);
    if (start && p.x >= start.x && p.x <= start.x+start.w && p.y >= start.y && p.y <= start.y+start.h) start.fn();
    return;
  }
  if (app.paused) {
    const overlayActions = zones.filter(z => z.y === 433);
    for (const z of overlayActions) if(p.x>=z.x&&p.x<=z.x+z.w&&p.y>=z.y&&p.y<=z.y+z.h){z.fn();return;}
    return;
  }
  for(let i=zones.length-1;i>=0;i--){
    const z=zones[i];
    if(p.x>=z.x&&p.x<=z.x+z.w&&p.y>=z.y&&p.y<=z.y+z.h){
      z.fn();return;
    }
  }
}
function handlePointerMove(px,py) {
  const p=mappedPoint(px,py);pointer.x=p.x;pointer.y=p.y;
  if(drag){drag.x=p.x;drag.y=p.y;if(Math.hypot(p.x-drag.startX,p.y-drag.startY)>9)drag.hasMoved=true;}
}
function handlePointerUp(px,py) {
  const p=mappedPoint(px,py);pointer.x=p.x;pointer.y=p.y;pointer.down=false;
  if(!drag)return;
  const inside=p.x>=246&&p.x<=938&&p.y>=578&&p.y<=669;
  if(inside)attachFile();
  else if(!drag.hasMoved)app.selectedFile=true;
  drag=null;
}
function mousePressed(){handlePointerDown(mouseX,mouseY);return false;}
function mouseDragged(){handlePointerMove(mouseX,mouseY);return false;}
function mouseMoved(){handlePointerMove(mouseX,mouseY);}
function mouseReleased(){handlePointerUp(mouseX,mouseY);return false;}
function touchStarted(){if(touches.length)handlePointerDown(touches[0].x,touches[0].y);return false;}
function touchMoved(){if(touches.length)handlePointerMove(touches[0].x,touches[0].y);return false;}
function touchEnded(){handlePointerUp(pointer.x*scaleUI+offsetX,pointer.y*scaleUI+offsetY);return false;}
function mouseWheel(e){
  const p=mappedPoint(mouseX,mouseY);
  if(p.x>220&&p.x<965&&p.y>125&&p.y<545){app.readScroll+=e.delta;app.autoScroll=false;return false;}
}
function keyPressed(){
  if(key==='m'||key==='M')toggleSound();
  if(key==='r'||key==='R')resetArtwork();
  if(keyCode===ESCAPE){
    if(window.parent&&window.parent!==window){
      window.parent.postMessage({type:'SPOHADY_CLOSE_ARTWORK',work:'vyvilnenyi-chas'},'*');
    }
    app.paused=!app.paused;
  }
}
function windowResized(){resizeCanvas(windowWidth,windowHeight);}
// -----------------------------------------------------------------------------
// ЗВУК: Web Audio API, без зовнішніх файлів / p5.sound
// -----------------------------------------------------------------------------
function initAudio(){
  try{
    if(!audioContext)audioContext=new (window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  }catch(e){soundEnabled=false;}
}
function toggleSound(){
  soundEnabled=!soundEnabled;
  if(soundEnabled)initAudio();
}
function cue(type){
  if(!soundEnabled)return;
  initAudio();
  const ac=audioContext;if(!ac||ac.state!=='running')return;
  const t0=ac.currentTime;
  const frequencies=type==='alarm'?[650,540]:type==='success'?[510,700]:type==='click'?[420]:[840,680];
  frequencies.forEach((frequency,i)=>{
    const o=ac.createOscillator(),g=ac.createGain(),when=t0+i*.11;
    o.type=type==='alarm'?'sawtooth':'sine';o.frequency.setValueAtTime(frequency,when);
    g.gain.setValueAtTime(.0001,when);
    g.gain.exponentialRampToValueAtTime(type==='alarm'?.014:.037,when+.009);
    g.gain.exponentialRampToValueAtTime(.0001,when+.09);
    o.connect(g);g.connect(ac.destination);o.start(when);o.stop(when+.1);
  });
}
