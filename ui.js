/* Інтерфейс: мова UA/EN, модальні стани (FOREST -> EXPLICATION -> ARTWORK_PLACEHOLDER), «Про виставку»,
   локальний демо-помічник, добровільне завершення. Без localStorage, без мережевих запитів до ШІ. */
(function () {
  const MEM = (window.MEM = window.MEM || {});
  const $ = id => document.getElementById(id);
  const forest = MEM.forest;
  const A = MEM.artifacts;

  const UI = {
    uk: {
      talk: 'Поговорити з Лісом', about: 'Про виставку', aboutForest: 'Про ліс', dismiss: 'Закрити підказку', end: 'Завершити мандрівку',
      whisperTag: 'Локальні підказки · демонстраційний режим (не ШІ)',
      examine: 'Оглянути', viewArtwork: 'До твору', keepReading: 'Ще читаю', returnForest: 'Повернутися до лісу',
      artworkSoon: 'Твір буде додано', backText: 'Повернутися до тексту', close: 'Закрити',
      keepMsg: 'Текст залишається відкритим. Читайте скільки потрібно.',
      audioOn: 'Звук: Увімк', audioOff: 'Звук: Вимк',
      chatDemo: 'ДЕМОНСТРАЦІЙНИЙ РЕЖИМ: це готові локальні підказки, а не Gemini і не ШІ. Це не психологічна допомога. Жодних запитів у мережу не надсилається.',
      chatPick: 'Оберіть тему підказки:',
      chatIntro: 'Я лише локальна підказка. Оберіть тему нижче.',
      topics: { move: 'Рух', shadow: 'Тінь', pause: 'Пауза', back: 'Повернення' },
      answers: {
        move: 'Ведіть курсор, палець або стрілки: зайченя йде в той бік. Поруч із предметом воно зупиняється саме.',
        shadow: 'Коли світло згасає, зайченя стає тінню й шукає впущений ліхтарик. Пробіл розпалює світло лише поки воно ще не згасло.',
        pause: 'Поки відкрите вікно з текстом чи твором, ліс стоїть на паузі: світло не згасає, зайченя не рухається.',
        back: 'Закрийте вікно — і ліс продовжиться з того самого місця. До будь-якої знахідки можна повертатися скільки завгодно.'
      },
      light: 'Світло свідомості', lightCount: n => `Світло свідомості (Знайдено ліхтарів: ${n}/5)`,
      lightShadow: 'Тінь поглинула свідомість', lightAwake: 'Ліс Оживив Свідомість ✨',
      shadowMsg: 'Знайдіть загаслий ліхтарик у темряві...',
      instMain: 'Ведіть курсор / палець / стрілки: ведіть зайченя з ліхтариком',
      instSub: 'Утримуйте мишку: затримуйте виснаження світла',
      instSpace: 'Пробіл [SPACE]: розпалити ліхтарик (лише у стані світла)',
      instShadowMain: 'Ви перебуваєте в стані Тіні (Альтер-его)',
      instShadowSub: 'Шукайте слабке сяйво загубленого ліхтарика серед хащів!',
      whisperDefault: 'Темрява лише чекає, поки ти засумніваєшся у власному світлі...',
      whispers: {
        transformed: ['Тінь — це інша сторона тебе. Вона знає, де лежить ліхтарик.'],
        reignite: ['Світло повернулося. Ліс пам’ятає, де ти був.', 'Ще один ліхтарик знайдено.'],
        awakened: ['Ліс ожив. Тепер він світиться разом із тобою.'],
        darkness: ['Коріння не боїться темряви.', 'Світло стає слабшим — зупинись і прислухайся.']
      },
      endTitle: 'Завершити мандрівку?',
      endSummary: (n, t) => `Ви оглянули знахідок: ${n} із ${t}. Завершити можна будь-коли, не оглядаючи все.`,
      startAgain: 'Почати нову мандрівку',
      aboutHead: 'Про виставку',
      curators: 'Авторки кураторської концепції', worksAuthors: 'Автори й авторки робіт',
      finalNote: 'Ми створили «Спогади» як студентську виставку і сподіваємося, що цей ліс залишатиметься відкритим надовго. Та ми не знаємо, чи знайдете ви його через п’ять років. Можливо, він буде тут і далі. Можливо, загубиться серед оновлень і зниклих посилань. А можливо, одного дня його просто з’їсть штучний інтелект. І тоді залишиться питання: що ви пам’ятатимете про цю мандрівку?',
      forestCredit: (t, a) => `Ліс — «${t}», ${a}`,
      loadError: 'Не вдалося завантажити content/*.json. Запустіть сайт через локальний сервер: python3 -m http.server 8000',
      aria: 'Ліс'
    },
    en: {
      talk: 'Talk to the Forest', about: 'About', aboutForest: 'About the forest', dismiss: 'Dismiss hint', end: 'End journey',
      whisperTag: 'Local hints · demo mode (not AI)',
      examine: 'Examine', viewArtwork: 'View artwork', keepReading: 'Keep reading', returnForest: 'Return to forest',
      artworkSoon: 'Artwork will be added', backText: 'Back to text', close: 'Close',
      keepMsg: 'The text stays open. Read as long as you need.',
      audioOn: 'Sound: On', audioOff: 'Sound: Off',
      chatDemo: 'DEMO MODE: these are prepared local hints, not Gemini and not AI. This is not psychological support. No network requests are made.',
      chatPick: 'Choose a hint topic:',
      chatIntro: 'I am only a local hint. Choose a topic below.',
      topics: { move: 'Movement', shadow: 'Shadow', pause: 'Pause', back: 'Returning' },
      answers: {
        move: 'Move the cursor, your finger or the arrow keys: the rabbit walks that way. It stops by itself near an object.',
        shadow: 'When the light fades, the rabbit becomes a shadow and looks for the dropped lantern. Space relights it only while it has not yet gone out.',
        pause: 'While a text or artwork window is open, the forest is paused: the light does not fade and the rabbit does not move.',
        back: 'Close the window and the forest continues from the same place. You can return to any find as often as you like.'
      },
      light: 'Light of consciousness', lightCount: n => `Light of consciousness (Lanterns found: ${n}/5)`,
      lightShadow: 'The shadow has taken over', lightAwake: 'The forest has awakened consciousness ✨',
      shadowMsg: 'Find the extinguished lantern in the dark...',
      instMain: 'Move the cursor / finger / arrow keys: guide the rabbit with its lantern',
      instSub: 'Hold the mouse: slow the fading of the light',
      instSpace: 'Space: relight the lantern (only while in the light)',
      instShadowMain: 'You are in the Shadow state (Alter ego)',
      instShadowSub: 'Look for the faint glow of the lost lantern among the thickets!',
      whisperDefault: 'Darkness only waits for you to doubt your own light...',
      whispers: {
        transformed: ['The shadow is another side of you. It knows where the lantern lies.'],
        reignite: ['The light is back. The forest remembers where you have been.', 'Another lantern found.'],
        awakened: ['The forest is awake. It now glows together with you.'],
        darkness: ['Roots do not fear the dark.', 'The light grows weaker: stop and listen.']
      },
      endTitle: 'End your journey?',
      endSummary: (n, t) => `You have examined ${n} of ${t} finds. You may end at any time without examining everything.`,
      startAgain: 'Start a new journey',
      aboutHead: 'About the exhibition',
      curators: 'Curators of the exhibition concept', worksAuthors: 'Authors of the works',
      finalNote: 'We created “Memories” as a student exhibition, and we hope this forest will stay open for a long time. But we do not know whether you will still find it five years from now. Perhaps it will still be here. Perhaps it will get lost among updates and vanished links. Or perhaps one day artificial intelligence will simply devour it. And then a question will remain: what will you remember about this journey?',
      forestCredit: (t, a) => `Forest — “${t}”, ${a}`,
      loadError: 'Could not load content/*.json. Run the site through a local server: python3 -m http.server 8000',
      aria: 'Forest'
    }
  };

  let lang = 'uk';
  let works = [], exhibition = null, zab = null;
  let nearWork = null, currentWork = null;
  let modal = null, opener = null, uiState = 'FOREST';
  MEM.getLang = () => lang;
  const t = () => UI[lang];

  // ---------- мова ----------
  function applyStatic() {
    document.documentElement.lang = lang === 'uk' ? 'uk' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t()[el.dataset.i18n]; });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t()[el.dataset.i18nAria]));
    $('langUk').setAttribute('aria-pressed', String(lang === 'uk'));
    $('langEn').setAttribute('aria-pressed', String(lang === 'en'));
    $('audioText').textContent = forest.isAudioOn() ? t().audioOn : t().audioOff;
    $('appTitle').textContent = exhibition ? exhibition.exhibitionTitle[lang] : (lang === 'uk' ? 'Спогади' : 'Memories');
    $('appSubtitle').textContent = exhibition ? exhibition.subtitle[lang] : '';
    document.title = $('appTitle').textContent;
    $('forestCredit').textContent = zab ? t().forestCredit(zab.title[lang], zab.author[lang]) : '';
    $('artCanvas').setAttribute('aria-label', t().aria);
    $('lightStatusLabel').dataset.key = '';
    lightKey = '';
    refreshLight();
    if (nearWork) { $('encounterPhrase').textContent = nearWork.rabbitPhrase[lang]; $('encounterTitle').textContent = nearWork.title[lang]; }
    if (!whisperSet) $('whisperText').textContent = t().whisperDefault;
    renderChatTopics();
    if (modal === 'aboutModal') renderAbout();
    if (modal === 'explicationModal' && currentWork) renderExplication();
    if (modal === 'artworkModal' && currentWork) renderArtwork();
    if (modal === 'endModal') renderEnd();
  }
  function setLang(l) { lang = l; applyStatic(); }

  // ---------- стан світла / тіні (лише відображення) ----------
  let lightKey = '', whisperSet = false;
  function refreshLight() {
    const s = forest.getStatus();
    const bar = Math.floor(s.lightLevel * 100) + '%';
    if ($('lightBar').style.width !== bar) $('lightBar').style.width = bar;
    const shadow = s.lightLevel <= 0.05;
    const key = [lang, s.isForestAwakened, shadow, s.reigniteCount, s.isTransformed, s.lanternActive].join('|');
    if (key === lightKey) return;
    lightKey = key;
    const lab = $('lightStatusLabel');
    if (shadow) { lab.textContent = t().lightShadow; lab.className = 'shadow'; }
    else if (s.isForestAwakened) { lab.textContent = t().lightAwake; lab.className = 'awake'; }
    else { lab.textContent = s.reigniteCount > 0 ? t().lightCount(s.reigniteCount) : t().light; lab.className = ''; }
    $('shadowStatusMsg').textContent = t().shadowMsg;
    $('shadowStatusMsg').classList.toggle('on', s.isTransformed && s.lanternActive);
    const sh = s.isTransformed;
    $('instructionMain').textContent = sh ? t().instShadowMain : t().instMain;
    $('instructionSub').textContent = sh ? t().instShadowSub : t().instSub;
    $('instructionSpace').textContent = t().instSpace;
  }

  // Локальні підказки замість Gemini (жодного fetch).
  function whisper(reason) {
    const list = t().whispers[reason] || [];
    if (!list.length) return;
    whisperSet = true;
    $('whisperText').textContent = '“' + list[Math.floor(Math.random() * list.length)] + '”';
  }
  let lastDark = 0;
  setInterval(() => {
    if (forest.isPaused()) return;
    const s = forest.getStatus();
    if (s.lightLevel < 0.25 && !s.isTransformed && Date.now() - lastDark > 20000) { lastDark = Date.now(); whisper('darkness'); }
  }, 3000);

  // ---------- модальні вікна ----------
  const STATE_OF = { explicationModal: 'EXPLICATION', artworkModal: 'ARTWORK_PLACEHOLDER', aboutModal: 'ABOUT', chatModal: 'CHAT', endModal: 'END' };
  const FOCUS_FIRST = { explicationModal: 'viewArtworkBtn', artworkModal: 'backTextBtn', aboutModal: 'aboutCloseBtn', chatModal: 'chatCloseBtn', endModal: 'restartBtn' };

  function openModal(id, from) {
    if (modal) $(modal).hidden = true;
    else {
      opener = from || document.activeElement;
      forest.pause('modal');
      $('app').inert = true;
    }
    modal = id; uiState = STATE_OF[id];
    $(id).hidden = false;
    const fb = $(FOCUS_FIRST[id]); (fb.hidden ? $('expReturnBtn') : fb).focus();
  }
  function closeModal() {
    if (!modal) return;
    $(modal).hidden = true; stopEmbed();
    modal = null; uiState = 'FOREST';
    $('app').inert = false;
    A.reholdAfterModal();          // зайченя лишається на місці: без стрибка до курсора
    forest.resume('modal');        // один цикл requestAnimationFrame
    if (opener && document.contains(opener) && !opener.closest('[hidden]')) opener.focus();
    opener = null;
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal) { e.preventDefault(); closeModal(); return; }
    if (e.key === 'Escape' && !modal && !$('encounter').hidden) { A.dismiss(); return; }
    if (e.key === 'Tab' && modal) {
      const f = [...$(modal).querySelectorAll('button, [tabindex="0"]')].filter(x => !x.hidden && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (!$(modal).contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.key === 'Enter' && !modal && !$('encounter').hidden && document.activeElement === document.body) {
      e.preventDefault(); examine();
    }
  });

  // ---------- зустріч ----------
  A.onNear(w => {
    nearWork = w;
    $('encounter').hidden = !w;
    if (w) { $('encounterPhrase').textContent = w.rabbitPhrase[lang]; $('encounterTitle').textContent = w.title[lang]; }
  });

  function examine() {
    if (!nearWork) return;
    currentWork = nearWork;
    A.markVisited(currentWork.id);
    renderExplication();
    openModal('explicationModal', $('examineBtn'));
  }
  function authorLine(w) { return w.author[lang]; }
  function renderExplication() {
    const w = currentWork;
    $('expType').textContent = w.artifact ? w.artifact[lang] : '';
    $('expTitle').textContent = w.title[lang];
    $('expAuthor').textContent = authorLine(w);
    $('expBody').replaceChildren(...w.explication[lang].split(/\n\s*\n/).map(p => Object.assign(document.createElement('p'), { textContent: p })));
    $('expHint').textContent = '';
    $('viewArtworkBtn').hidden = !!w.isEnvironment;
  }
  const EMBED = { meninas: 'assets/p5/meninas.html', telephone: 'assets/p5/telephone.html', freed_time: 'assets/p5/freed_time/index.html?v=3' }; // vtrchannia, resononsense: без авторських файлів нічого не відтворюють — заглушка
  function stopEmbed() { $('artGallery').querySelectorAll('video').forEach(v => v.pause()); $('artGallery').replaceChildren(); }
  function renderArtwork() {
    const w = currentWork;
    $('artType').textContent = w.artifact[lang];
    $('artTitle').textContent = w.title[lang];
    $('artAuthor').textContent = authorLine(w);
    const gal = $('artGallery'); gal.replaceChildren(); gal.hidden = true; $('artPlaceholder').hidden = false;
    // Локальні файли: assets/artworks/<id>.jpg або <id>_1..5.jpg (Чуже село — 5 фото). Немає файлу — лишається заглушка.
    const files = w.id === 'village' ? [1, 2, 3, 4, 5].map(n => `village_${n}.jpg`) : (w.id === 'frame_weight' || w.id === 'convenient_self') ? [w.id + '.jpg'] : [];
    if (w.id === 'shadows') { // відео: assets/artworks/<id>.mp4 або .webm; без автозапуску
      const v = document.createElement('video');
      v.className = 'art-video'; v.controls = true; v.preload = 'metadata'; v.playsInline = true; v.setAttribute('aria-label', w.title[lang]);
      ['mp4', 'webm'].forEach(ext => { const so = document.createElement('source'); so.src = `assets/artworks/${w.id}.${ext}`; so.type = 'video/' + ext; v.appendChild(so); });
      v.addEventListener('loadedmetadata', () => { gal.hidden = false; $('artPlaceholder').hidden = true; });
      v.lastChild.addEventListener('error', () => v.remove()); // файлу немає: лишається заглушка
      gal.appendChild(v);
    }
    if (EMBED[w.id]) { // p5-робота в ізольованому iframe; стартує лише за кліком усередині (камера/звук — тільки після згоди)
      const fr = document.createElement('iframe');
      fr.className = 'art-embed'; fr.title = w.title[lang]; fr.src = EMBED[w.id];
      if (w.id === 'meninas') fr.allow = 'camera';
      gal.appendChild(fr); gal.hidden = false; $('artPlaceholder').hidden = true;
    }
    files.forEach((f, i) => {
      const img = document.createElement('img');
      img.className = 'art-img'; img.alt = `${w.title[lang]} (${i + 1}/${files.length})`;
      img.onload = () => { gal.hidden = false; $('artPlaceholder').hidden = true; };
      const exts = ['jpg', 'jpeg', 'png', 'webp']; let k = 0; const base = f.replace(/\.jpg$/, '');
      img.onerror = () => { k++; if (k < exts.length) img.src = `assets/artworks/${base}.${exts[k]}`; else img.remove(); };
      img.src = `assets/artworks/${base}.${exts[0]}`;
      gal.appendChild(img);
    });
  }
  function renderAbout() {
    const e = exhibition;
    $('aboutTitle').textContent = e.exhibitionTitle[lang];
    $('aboutSub').textContent = e.subtitle[lang];
    const mk = (tag, text, cls) => Object.assign(document.createElement(tag), { textContent: text, className: cls || '' });
    const works10 = works.map(w => { const p = mk('p'); p.append(w.title[lang] + ' — '); p.append(mk('span', w.author[lang], 'author')); return p; });
    const nodes = [
      mk('p', e.academicCredit[lang]),
      mk('h3', t().curators), mk('p', e.curators[lang]),
      ...e.description[lang].split(/\n\s*\n/).map(p => mk('p', p)),
      mk('h3', t().worksAuthors), ...works10
    ];
    if (t().finalNote) nodes.push(mk('p', t().finalNote)); // EN: чекає редакторського погодження
    $('aboutBody').replaceChildren(...nodes);
  }
  function renderEnd() { $('endSummary').textContent = t().endSummary(A.visitedCount(), A.count()); }

  // ---------- локальний помічник ----------
  function chatAdd(cls, text) {
    const d = Object.assign(document.createElement('div'), { className: cls, textContent: text });
    $('chatLog').appendChild(d); $('chatLog').scrollTop = $('chatLog').scrollHeight;
  }
  function renderChatTopics() {
    $('chatTopics').replaceChildren(...Object.keys(t().topics).map(k => {
      const b = Object.assign(document.createElement('button'), { type: 'button', textContent: t().topics[k] });
      b.addEventListener('click', () => { chatAdd('me', t().topics[k]); chatAdd('forest', t().answers[k]); });
      return b;
    }));
  }

  // ---------- кнопки ----------
  $('langUk').addEventListener('click', () => setLang('uk'));
  $('langEn').addEventListener('click', () => setLang('en'));
  $('audioBtn').addEventListener('click', () => { forest.toggleAudio(); $('audioText').textContent = forest.isAudioOn() ? t().audioOn : t().audioOff; });
  $('examineBtn').addEventListener('click', examine);
  $('viewArtworkBtn').addEventListener('click', () => { renderArtwork(); openModal('artworkModal'); });
  $('backTextBtn').addEventListener('click', () => { stopEmbed(); renderExplication(); openModal('explicationModal'); });
  ['expReturnBtn', 'artReturnBtn', 'aboutCloseBtn', 'chatCloseBtn', 'endReturnBtn'].forEach(id => $(id).addEventListener('click', closeModal));
  $('aboutBtn').addEventListener('click', e => { renderAbout(); openModal('aboutModal', e.currentTarget); });
  $('forestBtn').addEventListener('click', e => {
    const z = works.find(x => x.id === 'zablukannia'); if (!z) return;
    currentWork = z; renderExplication(); openModal('explicationModal', e.currentTarget);
  });
  $('dismissBtn').addEventListener('click', () => A.dismiss());
  $('chatBtn').addEventListener('click', e => {
    if (!$('chatLog').children.length) chatAdd('forest', t().chatIntro);
    openModal('chatModal', e.currentTarget);
  });
  $('endBtn').addEventListener('click', e => { renderEnd(); openModal('endModal', e.currentTarget); });
  $('restartBtn').addEventListener('click', () => {
    forest.reset(); A.reset(); currentWork = null; nearWork = null;
    $('chatLog').replaceChildren(); whisperSet = false;
    $('whisperText').textContent = t().whisperDefault;
    lightKey = ''; refreshLight();
    closeModal();
  });
  // клік по бекдропу закриває лише довідкові вікна
  ['aboutModal', 'chatModal', 'endModal'].forEach(id => $(id).addEventListener('click', e => { if (e.target === $(id)) closeModal(); }));

  // Esc усередині p5-твору «Вивільнений час» просить закрити вікно
  window.addEventListener('message', e => { if (e.data && e.data.type === 'SPOHADY_CLOSE_ARTWORK' && modal === 'artworkModal') closeModal(); });

  // ---------- запуск ----------
  forest.on('whisper', whisper);
  forest.addTick(refreshLight);

  async function boot() {
    forest.start();
    try {
      const [w, ex] = await Promise.all([
        fetch('content/works.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch('content/exhibition.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      ]);
      works = w; exhibition = ex; zab = works.find(x => x.id === 'zablukannia');
      A.init(forest, works);
    } catch (err) {
      $('loadError').textContent = t().loadError; $('loadError').hidden = false;
    }
    applyStatic();
  }

  MEM.ui = {
    getState: () => uiState,
    works: () => works,
    UI,
    // самоперевірка: у обох мовах однакові ключі та всі data-i18n мають текст
    checkI18n() {
      const miss = [];
      for (const k of Object.keys(UI.uk)) if (!(k in UI.en)) miss.push('en:' + k);
      for (const k of Object.keys(UI.en)) if (!(k in UI.uk)) miss.push('uk:' + k);
      document.querySelectorAll('[data-i18n]').forEach(el => { if (!(el.dataset.i18n in UI.uk) || !(el.dataset.i18n in UI.en)) miss.push('dom:' + el.dataset.i18n); });
      works.filter(x => !x.isEnvironment).forEach(x => ['title', 'author', 'artifact', 'rabbitPhrase', 'explication'].forEach(f => {
        ['uk', 'en'].forEach(l => { if (!x[f] || !x[f][l]) miss.push(`${x.id}.${f}.${l}`); });
      }));
      return miss;
    }
  };
  boot();
})();
