/* Робоча адаптація Canvas 2D лісу з sources/zablukannia.original.html.
   Збережено: Tree, drawRabbit/drawAlterEgo/drawDroppedLantern, туман, світло/тінь, 5 повернень ліхтаря.
   Технічні адаптації: світові координати + камера, стабільний (seeded) ліс, природні стежки замість
   пунктирних, пауза за причинами, відсутні зовнішні (Gemini) запити. */
(function () {
  const MEM = (window.MEM = window.MEM || {});
  const { WORLD, START, PATHS } = MEM.world;

  const canvas = document.getElementById('artCanvas');
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cam = { x: 0, y: 0 };
  const pointer = { sx: 0, sy: 0, active: false };
  const keys = { x: 0, y: 0 };
  const state = { hold: false };
  let isMouseDown = false;

  const rabbit = {
    x: START.x, y: START.y, angle: 0, speed: 0.05, lanternFlicker: 0, earOffset: 0,
    lightLevel: 1.0, transformationProgress: 0, isTransformed: false
  };
  const MAX_STEP = 6.5; // технічна адаптація: обмеження швидкості у великому світі

  let reigniteCount = 0;
  const baseDecayRate = 0.0006;
  let currentDecayRate = baseDecayRate;
  const decayAcceleration = 1.35;
  const AWAKEN_THRESHOLD = 5;
  let isForestAwakened = false;
  let forestAwakenTransition = 0;
  let forestFireflies = [];

  const droppedLantern = { x: 0, y: 0, active: false, pickupRadius: 35 };
  const alterEgo = { x: START.x - 200, y: START.y - 200, angle: 0, orbitAngle: 0, active: false, opacity: 0, speed: 0.085 };

  const pauseReasons = new Set();
  let animationFrameId = null;
  let trees = [], paths = [], ambientFog = [], footstepParticles = [];
  let reigniteGlowAlpha = 0;
  let hasTriggeredTransformedWhisper = false;

  const listeners = {};
  const ticks = [];
  const layers = [];
  function emit(name, arg) { (listeners[name] || []).forEach(fn => fn(arg)); }

  // ---------- Аудіо (синтетичне, як в оригіналі; вимкнене до явної дії) ----------
  let audioCtx = null, isAudioPlaying = false, masterGain = null;
  function initAudio() {
    if (audioCtx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  function toggleAudio() {
    if (!audioCtx) { initAudio(); isAudioPlaying = true; }
    else if (audioCtx.state === 'suspended') { audioCtx.resume(); isAudioPlaying = true; }
    else if (audioCtx.state === 'running') { audioCtx.suspend(); isAudioPlaying = false; }
    return isAudioPlaying;
  }
  function blip(type, f0, f1, g0, dur) {
    if (!isAudioPlaying || !audioCtx) return;
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, audioCtx.currentTime);
    if (f1) osc.frequency.exponentialRampToValueAtTime(f1, audioCtx.currentTime + 0.4);
    gain.gain.setValueAtTime(g0, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain); gain.connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
  }

  // ---------- Генерація світу (детермінована) ----------
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Tree {
    constructor(x, y, scale, rand) {
      this.x = x; this.y = y; this.scale = scale; this.rand = rand;
      this.seed = rand() * 100;
      const depth = Math.floor(4 + rand() * 2);
      this.branches = this.buildBranch(0, 0, -Math.PI / 2, 70 * scale, depth);
    }
    buildBranch(x, y, angle, length, depth) {
      if (depth === 0) return [];
      const r = this.rand;
      const endX = x + Math.cos(angle) * length, endY = y + Math.sin(angle) * length;
      const out = [{ x1: x, y1: y, x2: endX, y2: endY, thickness: depth * 1.8 * this.scale, isTip: depth === 1 }];
      const numSplits = 2 + (r() < 0.3 ? 1 : 0);
      for (let i = 0; i < numSplits; i++) {
        const spread = 0.4 + r() * 0.3;
        const splitAngle = angle + (i % 2 === 0 ? spread : -spread) + (r() - 0.5) * 0.2;
        out.push(...this.buildBranch(endX, endY, splitAngle, length * (0.65 + r() * 0.2), depth - 1));
      }
      return out;
    }
    draw(ctx, rabbitX, rabbitY, lightPower) {
      const distToRabbit = Math.hypot(this.x - rabbitX, this.y - rabbitY);
      const maxLight = (380 + forestAwakenTransition * 300) * Math.max(0.2, lightPower);
      const lightAlpha = Math.max(0.05 + forestAwakenTransition * 0.35, 1 - distToRabbit / maxLight);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(reduceMotion ? 0 : Math.sin(Date.now() * 0.001 + this.seed) * (0.03 + forestAwakenTransition * 0.02));
      ctx.lineCap = 'round';
      for (const b of this.branches) {
        ctx.beginPath();
        ctx.lineWidth = b.thickness;
        if (forestAwakenTransition > 0) {
          ctx.strokeStyle = `rgba(${Math.round(18 + forestAwakenTransition * 34)}, ${Math.round(26 + forestAwakenTransition * 120)}, ${Math.round(38 + forestAwakenTransition * 70)}, ${lightAlpha})`;
        } else if (distToRabbit < 220 * lightPower) {
          ctx.strokeStyle = `rgba(35, 48, 68, ${lightAlpha})`;
        } else {
          ctx.strokeStyle = `rgba(14, 20, 30, ${lightAlpha * 0.8})`;
        }
        ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
        if (b.isTip && forestAwakenTransition > 0.1) {
          ctx.fillStyle = `rgba(167, 243, 208, ${lightAlpha * forestAwakenTransition * 0.7})`;
          ctx.beginPath(); ctx.arc(b.x2, b.y2, 3.5 * this.scale * forestAwakenTransition, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  // Природна звивиста стежка (замінює пунктирні випадкові LabyrinthPath); колір/логіка видимості — з оригіналу.
  class TrailPath {
    constructor(points) { this.points = points.map(p => ({ x: p[0], y: p[1] })); }
    draw(ctx, rabbitX, rabbitY, lightPower) {
      const p = this.points;
      let minDist = Infinity;
      for (const q of p) { const d = Math.hypot(q.x - rabbitX, q.y - rabbitY); if (d < minDist) minDist = d; }
      if (minDist > 1800) return;
      const trace = () => {
        ctx.beginPath();
        ctx.moveTo(p[0].x, p[0].y);
        for (let i = 1; i < p.length - 1; i++) {
          ctx.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2);
        }
        ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
      };
      const alpha = Math.max(0.07, Math.min(0.28 * lightPower, 1 - minDist / (380 * Math.max(0.3, lightPower))));
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      trace(); ctx.strokeStyle = `rgba(30, 41, 59, ${alpha * 0.9})`; ctx.lineWidth = 20; ctx.stroke();
      trace(); ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
    }
  }

  function pathSamples() {
    const s = [];
    for (const path of PATHS) for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = path[i], [x2, y2] = path[i + 1];
      const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 40);
      for (let k = 0; k <= n; k++) s.push([x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n]);
    }
    return s;
  }

  function initScene() {
    const rand = mulberry(20261107);
    trees = []; paths = []; ambientFog = []; forestFireflies = [];
    const samples = pathSamples();
    const spots = Object.values(MEM.world.SPOTS);
    const treeCount = Math.floor((WORLD.w * WORLD.h) / 15000);
    let guard = 0;
    while (trees.length < treeCount && guard++ < treeCount * 4) {
      const x = 30 + rand() * (WORLD.w - 60), y = 60 + rand() * (WORLD.h - 60);
      const sc = 0.6 + rand() * 0.8;
      if (samples.some(s => (s[0] - x) ** 2 + (s[1] - y) ** 2 < 3600)) continue;       // стежки лишаються чистими
      if (spots.some(s => (s.x - x) ** 2 + (s.y - y) ** 2 < 10000)) continue;          // знахідки не ховаємо
      trees.push(new Tree(x, y, sc, rand));
    }
    for (const pts of PATHS) paths.push(new TrailPath(pts));
    for (let i = 0; i < 90; i++) ambientFog.push({
      x: rand() * WORLD.w, y: rand() * WORLD.h, radius: 120 + rand() * 180, alpha: 0.02 + rand() * 0.04,
      vx: (rand() - 0.5) * 0.3, vy: (rand() - 0.5) * 0.2
    });
    for (let i = 0; i < 140; i++) forestFireflies.push({
      x: rand() * WORLD.w, y: rand() * WORLD.h, radius: 1.5 + rand() * 2.5,
      vx: (rand() - 0.5) * 0.8, vy: (rand() - 0.5) * 0.8, pulse: rand() * Math.PI * 2
    });
  }

  function lerpColor(c1, c2, f) {
    const r = c1.map((c, i) => Math.round(c + f * (c2[i] - c)));
    return `rgb(${r[0]}, ${r[1]}, ${r[2]})`;
  }

  // ---------- Персонажі (без змін відносно оригіналу) ----------
  function drawRabbit(ctx, r) {
    ctx.save();
    ctx.translate(r.x, r.y);
    const isFacingLeft = Math.cos(r.angle) < 0;
    const t = r.transformationProgress;
    const flicker = (Math.sin(Date.now() * 0.01) * 8 + (Math.random() - 0.5) * 4) * r.lightLevel;
    const lanternRadius = Math.max(20, (260 + flicker) * r.lightLevel);
    if (t < 0.8) {
      const g = ctx.createRadialGradient(0, 0, 5, 0, 0, lanternRadius);
      g.addColorStop(0, `rgba(254, 243, 199, ${0.45 * r.lightLevel * (1 - t)})`);
      g.addColorStop(0.3, `rgba(251, 191, 36, ${0.15 * r.lightLevel * (1 - t)})`);
      g.addColorStop(0.7, `rgba(56, 189, 248, ${0.04 * r.lightLevel * (1 - t)})`);
      g.addColorStop(1, 'rgba(7, 9, 14, 0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, lanternRadius, 0, Math.PI * 2); ctx.fill();
    } else {
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 50);
      g.addColorStop(0, `rgba(15, 23, 42, ${0.8 * t})`);
      g.addColorStop(0.6, `rgba(30, 27, 75, ${0.5 * t})`);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill();
    }
    ctx.scale(isFacingLeft ? -1 : 1, 1);
    const breath = Math.sin(Date.now() * 0.005) * 0.8;
    const tailColor = lerpColor([248, 250, 252], [9, 13, 22], t);
    const bodyColor = lerpColor([226, 232, 240], [9, 13, 22], t);
    const headColor = lerpColor([241, 245, 249], [9, 13, 22], t);
    ctx.fillStyle = tailColor; ctx.beginPath(); ctx.arc(-14, 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bodyColor; ctx.beginPath(); ctx.ellipse(-2, 4, 12, 10 + breath, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = headColor; ctx.beginPath(); ctx.arc(6, -6, 8, 0, Math.PI * 2); ctx.fill();
    const earSway = Math.sin(Date.now() * 0.008) * 0.1;
    ctx.fillStyle = bodyColor;
    ctx.beginPath(); ctx.ellipse(3, -18, 3, 9, -0.2 + earSway, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, -17, 2.8, 8, 0.1 + earSway, 0, Math.PI * 2); ctx.fill();
    if (t < 0.5) {
      ctx.fillStyle = `rgba(251, 207, 232, ${1 - t * 2})`;
      ctx.beginPath(); ctx.arc(3, -18, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    if (t > 0.3) {
      ctx.fillStyle = '#38bdf8'; ctx.shadowColor = '#0284c7'; ctx.shadowBlur = 8 * t;
      ctx.beginPath(); ctx.arc(9, -7, 1.6, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(9, -7, 1.3, 0, Math.PI * 2); ctx.fill();
    }
    if (t < 0.9) {
      ctx.save();
      ctx.globalAlpha = 1 - t;
      const lx = 16, ly = 2;
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(lx, ly - 4); ctx.stroke();
      ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx, ly - 4); ctx.lineTo(lx, ly); ctx.stroke();
      ctx.fillStyle = r.lightLevel > 0.3 ? '#fbbf24' : '#78350f';
      ctx.beginPath(); ctx.arc(lx, ly + 3, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, r.lightLevel)})`;
      ctx.beginPath(); ctx.arc(lx, ly + 3, 1.8 * r.lightLevel, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawAlterEgo(ctx, ego) {
    if (ego.opacity <= 0.01) return;
    ctx.save();
    ctx.translate(ego.x, ego.y);
    ctx.globalAlpha = ego.opacity;
    const isFacingLeft = Math.cos(ego.angle) < 0;
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 45);
    g.addColorStop(0, 'rgba(15, 23, 42, 0.9)'); g.addColorStop(0.6, 'rgba(30, 27, 75, 0.4)'); g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI * 2); ctx.fill();
    ctx.scale(isFacingLeft ? -1 : 1, 1);
    ctx.fillStyle = '#090d16';
    ctx.beginPath(); ctx.arc(-14, 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-2, 4, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -6, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3, -18, 3, 9, -0.2, 0, Math.PI * 2); ctx.ellipse(8, -17, 2.8, 8, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#38bdf8'; ctx.shadowColor = '#0284c7'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(8, -7, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawDroppedLantern(ctx, l) {
    if (!l.active) return;
    ctx.save();
    ctx.translate(l.x, l.y);
    const pulse = Math.sin(Date.now() * 0.005) * 4;
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 35 + pulse);
    g.addColorStop(0, 'rgba(251, 191, 36, 0.6)'); g.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)'); g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 35 + pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#78350f'; ctx.fillRect(-3, -2, 6, 8);
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(0, 1, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function dropLanternInWoods() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 280 + Math.random() * 260;
    droppedLantern.x = Math.max(80, Math.min(WORLD.w - 80, rabbit.x + Math.cos(angle) * distance));
    droppedLantern.y = Math.max(80, Math.min(WORLD.h - 80, rabbit.y + Math.sin(angle) * distance));
    droppedLantern.active = true;
  }

  function reigniteLight(fromDroppedLantern = false) {
    if (rabbit.isTransformed && !fromDroppedLantern) return;
    rabbit.lightLevel = 1.0;
    rabbit.isTransformed = false;
    droppedLantern.active = false;
    reigniteGlowAlpha = 1.0;
    if (fromDroppedLantern) {
      reigniteCount++;
      currentDecayRate = baseDecayRate * Math.pow(decayAcceleration, reigniteCount);
      if (reigniteCount >= AWAKEN_THRESHOLD) { isForestAwakened = true; emit('whisper', 'awakened'); }
      else emit('whisper', 'reignite');
    }
    blip('triangle', 329.63, 659.25, 0.25, 1.2);
  }

  // ---------- Камера ----------
  function updateCamera(snap) {
    let tx = rabbit.x - width / 2, ty = rabbit.y - height / 2;
    tx = width >= WORLD.w ? (WORLD.w - width) / 2 : Math.max(0, Math.min(WORLD.w - width, tx));
    ty = height >= WORLD.h ? (WORLD.h - height) / 2 : Math.max(0, Math.min(WORLD.h - height, ty));
    const k = snap ? 1 : 0.09;
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
  }

  // ---------- Головний цикл ----------
  function animate() {
    animationFrameId = null;
    if (pauseReasons.size) return;

    if (isForestAwakened) forestAwakenTransition = Math.min(1.0, forestAwakenTransition + 0.008);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(${Math.round(7 + forestAwakenTransition * 15)}, ${Math.round(9 + forestAwakenTransition * 35)}, ${Math.round(14 + forestAwakenTransition * 30)}, 0.25)`;
    ctx.fillRect(0, 0, width, height);

    // світло / тінь (логіка оригіналу)
    if (!isForestAwakened) {
      if (!rabbit.isTransformed) {
        if (!isMouseDown) rabbit.lightLevel = Math.max(0.0, rabbit.lightLevel - currentDecayRate);
        if (rabbit.lightLevel <= 0) {
          rabbit.isTransformed = true;
          dropLanternInWoods();
          emit('whisper', 'transformed');
        }
      } else {
        rabbit.lightLevel = 0;
        if (droppedLantern.active && Math.hypot(rabbit.x - droppedLantern.x, rabbit.y - droppedLantern.y) < droppedLantern.pickupRadius) {
          reigniteLight(true);
        }
      }
    } else {
      rabbit.lightLevel = 1.0; rabbit.isTransformed = false; droppedLantern.active = false;
    }

    if (rabbit.lightLevel <= 0.05) {
      rabbit.transformationProgress = Math.min(1.0, rabbit.transformationProgress + 0.03);
      if (!hasTriggeredTransformedWhisper) { hasTriggeredTransformedWhisper = true; }
    } else {
      rabbit.transformationProgress = Math.max(0.0, rabbit.transformationProgress - 0.05);
      hasTriggeredTransformedWhisper = false;
    }

    // рух: курсор/дотик/стрілки задають напрямок; екран -> світ через камеру
    let tx = null, ty = null;
    if (keys.x || keys.y) { tx = rabbit.x + keys.x * 160; ty = rabbit.y + keys.y * 160; state.hold = false; }
    else if (pointer.active) { tx = pointer.sx + cam.x; ty = pointer.sy + cam.y; }
    if (tx !== null && !state.hold) {
      const dx = tx - rabbit.x, dy = ty - rabbit.y, dist = Math.hypot(dx, dy);
      if (dist > 5) {
        let sx = dx * rabbit.speed, sy = dy * rabbit.speed;
        const m = Math.hypot(sx, sy);
        if (m > MAX_STEP) { sx *= MAX_STEP / m; sy *= MAX_STEP / m; }
        rabbit.x = Math.max(30, Math.min(WORLD.w - 30, rabbit.x + sx));
        rabbit.y = Math.max(40, Math.min(WORLD.h - 30, rabbit.y + sy));
        rabbit.angle = Math.atan2(dy, dx);
        if (Math.random() < 0.3) footstepParticles.push({
          x: rabbit.x + (Math.random() - 0.5) * 8, y: rabbit.y + 8 + (Math.random() - 0.5) * 4,
          alpha: 0.6 * Math.max(0.2, rabbit.lightLevel), radius: 1.2 + Math.random() * 1.5,
          isDark: rabbit.transformationProgress > 0.5
        });
      }
    }
    updateCamera(false);

    if (!isForestAwakened && rabbit.lightLevel < 0.65 && rabbit.transformationProgress < 0.8) {
      alterEgo.active = true; alterEgo.opacity = Math.min(0.95, alterEgo.opacity + 0.03);
    } else { alterEgo.active = false; alterEgo.opacity = Math.max(0, alterEgo.opacity - 0.05); }
    if (alterEgo.opacity > 0) {
      alterEgo.orbitAngle += 0.05;
      const rad = 28 + Math.sin(Date.now() * 0.006) * 15;
      const tex = rabbit.x + Math.cos(alterEgo.orbitAngle) * rad, tey = rabbit.y + Math.sin(alterEgo.orbitAngle) * rad;
      const ex = tex - alterEgo.x, ey = tey - alterEgo.y;
      alterEgo.x += ex * alterEgo.speed; alterEgo.y += ey * alterEgo.speed; alterEgo.angle = Math.atan2(ey, ex);
    }

    for (const t of ticks) t();

    // ---- світ (з камерою) ----
    const cx = Math.round(cam.x), cy = Math.round(cam.y);
    ctx.save();
    ctx.translate(-cx, -cy);

    if (reigniteGlowAlpha > 0.001) {
      const fg = ctx.createRadialGradient(rabbit.x, rabbit.y, 10, rabbit.x, rabbit.y, Math.max(width, height) * 0.8);
      fg.addColorStop(0, `rgba(254, 243, 199, ${reigniteGlowAlpha * 0.45})`);
      fg.addColorStop(0.4, `rgba(251, 191, 36, ${reigniteGlowAlpha * 0.2})`);
      fg.addColorStop(1, 'rgba(7, 9, 14, 0)');
      ctx.fillStyle = fg; ctx.fillRect(cx, cy, width, height);
      reigniteGlowAlpha *= 0.92;
    }

    for (const fog of ambientFog) {
      fog.x += fog.vx; fog.y += fog.vy;
      if (fog.x < -fog.radius) fog.x = WORLD.w + fog.radius;
      if (fog.x > WORLD.w + fog.radius) fog.x = -fog.radius;
      if (fog.y < -fog.radius) fog.y = WORLD.h + fog.radius;
      if (fog.y > WORLD.h + fog.radius) fog.y = -fog.radius;
      if (fog.x + fog.radius < cx || fog.x - fog.radius > cx + width || fog.y + fog.radius < cy || fog.y - fog.radius > cy + height) continue;
      const g = ctx.createRadialGradient(fog.x, fog.y, 0, fog.x, fog.y, fog.radius);
      g.addColorStop(0, `rgba(${Math.round(30 + forestAwakenTransition * 30)}, ${Math.round(41 + forestAwakenTransition * 80)}, ${Math.round(59 + forestAwakenTransition * 40)}, ${fog.alpha + forestAwakenTransition * 0.04})`);
      g.addColorStop(1, 'rgba(7, 9, 14, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(fog.x - fog.radius, fog.y - fog.radius, fog.radius * 2, fog.radius * 2);
    }

    if (forestAwakenTransition > 0.05) {
      for (const ff of forestFireflies) {
        ff.x += ff.vx; ff.y += ff.vy; ff.pulse += 0.04;
        if (ff.x < 0) ff.x = WORLD.w; if (ff.x > WORLD.w) ff.x = 0;
        if (ff.y < 0) ff.y = WORLD.h; if (ff.y > WORLD.h) ff.y = 0;
        if (ff.x < cx - 20 || ff.x > cx + width + 20 || ff.y < cy - 20 || ff.y > cy + height + 20) continue;
        ctx.fillStyle = `rgba(253, 224, 71, ${(0.3 + Math.sin(ff.pulse) * 0.3) * forestAwakenTransition})`;
        ctx.shadowColor = '#fde047'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(ff.x, ff.y, ff.radius, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const lp = Math.max(0.15, rabbit.lightLevel);
    for (const p of paths) p.draw(ctx, rabbit.x, rabbit.y, lp);
    for (const tree of trees) {
      if (tree.x < cx - 260 || tree.x > cx + width + 260 || tree.y < cy - 40 || tree.y > cy + height + 340) continue;
      tree.draw(ctx, rabbit.x, rabbit.y, lp);
    }

    for (const layer of layers) layer(ctx, cam, width, height, rabbit);
    drawDroppedLantern(ctx, droppedLantern);

    for (let i = footstepParticles.length - 1; i >= 0; i--) {
      const fp = footstepParticles[i];
      fp.alpha -= 0.005;
      if (fp.alpha <= 0) { footstepParticles.splice(i, 1); continue; }
      ctx.fillStyle = fp.isDark ? `rgba(56, 189, 248, ${fp.alpha})` : `rgba(251, 191, 36, ${fp.alpha})`;
      ctx.beginPath(); ctx.arc(fp.x, fp.y, fp.radius, 0, Math.PI * 2); ctx.fill();
    }

    drawAlterEgo(ctx, alterEgo);
    drawRabbit(ctx, rabbit);
    ctx.restore();

    animationFrameId = requestAnimationFrame(animate);
  }

  function ensureLoop() { if (!animationFrameId && !pauseReasons.size) animationFrameId = requestAnimationFrame(animate); }
  function pause(reason = 'modal') {
    pauseReasons.add(reason);
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
  }
  function resume(reason = 'modal') { pauseReasons.delete(reason); ensureLoop(); } // не дублює requestAnimationFrame

  // ---------- Ввід ----------
  const UI_SEL = 'button, a, input, [role="dialog"], .modal-backdrop, .hud-panel';
  const overUI = e => e.target && e.target.closest && e.target.closest(UI_SEL);
  const dialogOpen = () => pauseReasons.size > 0;

  window.addEventListener('keydown', e => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (dialogOpen() || tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space') {
      // Пробіл активує кнопку лише при клавіатурному фокусі; після кліку мишкою він розпалює ліхтарик
      if (tag === 'BUTTON' && document.activeElement.matches(':focus-visible')) return;
      e.preventDefault();
      if (!rabbit.isTransformed) reigniteLight(false);
      return;
    }
    const map = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] };
    if (map[e.code]) { e.preventDefault(); keys.x = map[e.code][0] || keys.x; keys.y = map[e.code][1] || keys.y; }
  });
  window.addEventListener('keyup', e => {
    if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) keys.x = 0;
    if (['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS'].includes(e.code)) keys.y = 0;
  });
  window.addEventListener('mousedown', e => {
    if (overUI(e) || dialogOpen()) return;
    isMouseDown = true;
    if (!rabbit.isTransformed) reigniteGlowAlpha = Math.min(1.0, reigniteGlowAlpha + 0.25);
    blip('sine', 440 + Math.random() * 220, 0, 0.1, 1.5);
  });
  window.addEventListener('mouseup', () => { isMouseDown = false; });
  window.addEventListener('touchstart', e => {
    if (overUI(e) || dialogOpen()) return;
    isMouseDown = true;
    if (e.touches.length) { pointer.sx = e.touches[0].clientX; pointer.sy = e.touches[0].clientY; pointer.active = true; }
  }, { passive: true });
  window.addEventListener('touchend', () => { isMouseDown = false; });
  window.addEventListener('touchcancel', () => { isMouseDown = false; });
  window.addEventListener('mousemove', e => {
    if (overUI(e) || dialogOpen()) return; // кліки/рух у меню й модалках не керують зайченям
    pointer.sx = e.clientX; pointer.sy = e.clientY; pointer.active = true;
  });
  window.addEventListener('touchmove', e => {
    if (dialogOpen() || overUI(e) || !e.touches.length) return;
    pointer.sx = e.touches[0].clientX; pointer.sy = e.touches[0].clientY; pointer.active = true;
  }, { passive: true });
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    updateCamera(true); // світ не перегенеровується: позиції знахідок стабільні
  });

  function reset() {
    Object.assign(rabbit, { x: START.x, y: START.y, angle: 0, lightLevel: 1.0, transformationProgress: 0, isTransformed: false });
    reigniteCount = 0; currentDecayRate = baseDecayRate; isForestAwakened = false; forestAwakenTransition = 0;
    droppedLantern.active = false; reigniteGlowAlpha = 0; footstepParticles = [];
    Object.assign(alterEgo, { x: START.x - 200, y: START.y - 200, opacity: 0, active: false });
    pointer.active = false; keys.x = keys.y = 0; state.hold = false; isMouseDown = false;
    updateCamera(true);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#07090e'; ctx.fillRect(0, 0, width, height);
  }

  MEM.forest = {
    rabbit, state, droppedLantern, reduceMotion,
    start() { initScene(); updateCamera(true); ensureLoop(); },
    pause, resume, reset, toggleAudio,
    isPaused: () => pauseReasons.size > 0,
    isAudioOn: () => isAudioPlaying,
    getStatus: () => ({
      lightLevel: rabbit.lightLevel, isTransformed: rabbit.isTransformed, isForestAwakened,
      reigniteCount, threshold: AWAKEN_THRESHOLD, lanternActive: droppedLantern.active
    }),
    on(name, fn) { (listeners[name] = listeners[name] || []).push(fn); },
    addTick(fn) { ticks.push(fn); },
    addDrawLayer(fn) { layers.push(fn); },
    pointerWorld: () => ({ x: pointer.sx + cam.x, y: pointer.sy + cam.y }),
    pointerSnapshot: () => ({ x: pointer.sx, y: pointer.sy }),
    pointerMovedFrom: a => (a ? Math.hypot(pointer.sx - a.x, pointer.sy - a.y) : 0),
    camera: cam,
    // тестовий хук: поставити зайченя поруч зі знахідкою (не змінює світло)
    placeRabbit(x, y) { rabbit.x = x; rabbit.y = y; updateCamera(true); }
  };
})();
