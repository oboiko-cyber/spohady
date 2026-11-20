/* Ізольований запуск одного p5-скетча. Нічого не стартує без явного кліку; відсутні медіа не підмінюються. */
(function () {
  const D = window.DIAG;
  const out = document.getElementById('report');
  const btn = document.getElementById('launch');
  const log = (m, cls) => { const li = document.createElement('li'); li.textContent = m; if (cls) li.className = cls; out.appendChild(li); };
  const P5 = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js';
  const P5S = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/addons/p5.sound.min.js';

  function load(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Не завантажено ' + src)); document.body.appendChild(s); });
  }
  async function exists(path) {
    try { const r = await fetch(encodeURI(path), { method: 'GET', cache: 'no-store' }); const ct = r.headers.get('content-type') || ''; return r.ok && !ct.includes('text/html'); }
    catch (e) { return false; }
  }
  async function inventory() {
    let blocked = false;
    for (const a of D.assets) {
      const ok = await exists(a.path);
      if (ok) log(`OK: ${a.path}`, 'ok');
      else if (a.required) { blocked = true; log(`BLOCKED: бракує авторського файла «${a.path}» (${a.note})`, 'bad'); }
      else log(`ОПЦІЙНО, відсутній: ${a.path} (${a.note})`, 'warn');
    }
    D.notes.forEach(n => log(n, 'warn'));
    btn.disabled = blocked;
    document.getElementById('status').textContent = blocked ? 'BLOCKED: missing author asset' : 'Готово до запуску за кліком';
  }
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      await load(P5);
      if (D.sound) await load(P5S);
      await load(D.sketch);
      new p5(); // глобальний режим p5 після пізнього завантаження
      log('Скетч запущено: ' + D.sketch, 'ok');
    } catch (e) { log('FAIL: ' + e.message, 'bad'); }
  });
  inventory();
})();
