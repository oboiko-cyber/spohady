/* Світ, стежки, 9 знахідок-заглушок та логіка зустрічі (близькість -> «Оглянути»).
   Координати — світові й фіксовані (не залежать від розміру вікна). */
(function () {
  const MEM = (window.MEM = window.MEM || {});

  const WORLD = { w: 3600, h: 2100 };
  const START = { x: 1800, y: 1000 };

  // Три основні стежки від розвилки (START) + гілки. Порядку огляду вони не задають.
  const PATHS = [
    [[1800,1000],[1560,1090],[1400,1010],[1180,930],[1000,900],[760,980],[520,880],[300,800]], // захід
    [[1000,900],[960,700],[820,520],[600,350]],                                                  // гілка на північ
    [[1400,1010],[1330,1250],[1180,1450],[800,1650]],                                            // гілка на південь
    [[1800,1000],[2030,930],[2250,960],[2600,1050],[2800,930],[3000,850],[3300,1000]],           // схід
    [[2600,1050],[2700,1300],[2900,1560],[3100,1700]],                                           // гілка на південь
    [[1800,1000],[1730,800],[1750,600],[1900,420],[1900,300]],                                   // північ
    [[1800,1000],[1780,1250],[1700,1450],[1900,1750]]                                            // південь
  ];

  const SPOTS = {
    meninas: { x: 1900, y: 300 },
    vtrchannia: { x: 1000, y: 900 },
    resononsense: { x: 300, y: 800 },
    village: { x: 800, y: 1650 },
    freed_time: { x: 600, y: 350 },
    frame_weight: { x: 3100, y: 1700 },
    convenient_self: { x: 1900, y: 1750 },
    telephone: { x: 3000, y: 850 },
    shadows: { x: 3300, y: 1000 }
  };

  MEM.world = { WORLD, START, PATHS, SPOTS };

  const ENTER_R = 70, LEAVE_R = 265, RELEASE_PX = 90;
  let forest = null, items = [], nearId = null, dismissed = null, anchor = null, onNear = () => {};
  const visited = new Set();

  function lang() { return MEM.getLang ? MEM.getLang() : 'uk'; }

  // Прості білі контурні піктограми (Canvas 2D), без зображень.
  function drawIcon(ctx, id, warm) {
    const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.stroke(); };
    ctx.beginPath();
    switch (id) {
      case 'meninas': rr(-13, -10, 26, 20, 1); rr(-9, -6, 18, 12, 0); ctx.beginPath(); ctx.moveTo(-9, 6); ctx.lineTo(-3, -1); ctx.lineTo(1, 3); ctx.lineTo(5, -2); ctx.lineTo(9, 6); ctx.stroke(); break;
      case 'vtrchannia': rr(-10, -13, 20, 26, 1); rr(-7, -10, 14, 14, 0); ctx.beginPath(); ctx.arc(0, -5, 2.5, 0, 6.3); ctx.moveTo(-5, 3); ctx.quadraticCurveTo(0, -2, 5, 3); ctx.moveTo(-6, 8); ctx.lineTo(6, 8); ctx.stroke(); break;
      case 'resononsense': ctx.moveTo(-13, -4); ctx.bezierCurveTo(-12, -13, 2, -12, 8, -9); ctx.bezierCurveTo(15, -4, 12, 9, 3, 11); ctx.bezierCurveTo(-6, 13, -14, 6, -13, -4); ctx.moveTo(-8, -1); ctx.quadraticCurveTo(-3, -5, 2, -1); ctx.quadraticCurveTo(7, 3, 10, 0); ctx.moveTo(-7, 5); ctx.quadraticCurveTo(-2, 2, 3, 6); ctx.stroke(); break;
      case 'village': ctx.moveTo(-16, -2); ctx.lineTo(0, -15); ctx.lineTo(16, -2); ctx.moveTo(-12, -2); ctx.lineTo(-12, 12); ctx.lineTo(12, 12); ctx.lineTo(12, -2); ctx.moveTo(-8, 12); ctx.lineTo(-8, 4); ctx.lineTo(-2, 4); ctx.lineTo(-2, 12); ctx.stroke();
        ctx.fillStyle = warm ? 'rgba(253,224,71,.95)' : 'rgba(253,224,71,.7)'; ctx.fillRect(3, 3, 6, 5); ctx.strokeRect(3, 3, 6, 5); break;
      case 'freed_time': rr(-11, -10, 22, 14, 1); ctx.beginPath(); ctx.moveTo(-15, 9); ctx.lineTo(-11, 4); ctx.lineTo(11, 4); ctx.lineTo(15, 9); ctx.closePath(); ctx.stroke(); break;
      case 'frame_weight': ctx.moveTo(-14, -8); ctx.bezierCurveTo(-6, -12, -4, -2, 2, -3); ctx.bezierCurveTo(8, -4, 9, 3, 14, 1); ctx.moveTo(-14, 2); ctx.bezierCurveTo(-6, -2, -4, 8, 2, 7); ctx.bezierCurveTo(8, 6, 9, 12, 14, 10); ctx.stroke();
        ctx.beginPath(); ctx.arc(-6, 10, 2, 0, 6.3); ctx.arc(8, -10, 1.6, 0, 6.3); ctx.stroke(); break;
      case 'convenient_self': ctx.moveTo(-11, -8); ctx.quadraticCurveTo(0, -15, 11, -8); ctx.quadraticCurveTo(12, 8, 0, 14); ctx.quadraticCurveTo(-12, 8, -11, -8); ctx.moveTo(-7, -3); ctx.quadraticCurveTo(-4, -6, -1, -3); ctx.moveTo(1, -3); ctx.quadraticCurveTo(4, -6, 7, -3); ctx.moveTo(-4, 5); ctx.quadraticCurveTo(0, 8, 4, 5); ctx.stroke(); break;
      case 'telephone': rr(-7, -13, 14, 26, 4); ctx.beginPath(); ctx.arc(0, -6, 3, 0, 6.3); ctx.moveTo(-3, 1); ctx.lineTo(3, 1); ctx.moveTo(-3, 4); ctx.lineTo(3, 4); ctx.moveTo(3, 9); ctx.arc(0, 9, 2, 0, 6.3); ctx.stroke(); break;
      case 'shadows': ctx.moveTo(-13, 12); ctx.lineTo(-13, -4); ctx.lineTo(-13, -9); ctx.lineTo(-9, -9); ctx.lineTo(-9, -5); ctx.lineTo(-5, -5); ctx.lineTo(-5, -11); ctx.lineTo(-1, -11); ctx.lineTo(-1, -7); ctx.lineTo(1, -7); ctx.lineTo(1, -11); ctx.lineTo(5, -11); ctx.lineTo(5, -5); ctx.lineTo(9, -5); ctx.lineTo(9, -9); ctx.lineTo(13, -9); ctx.lineTo(13, 12); ctx.closePath(); ctx.moveTo(-4, 12); ctx.lineTo(-4, 3); ctx.quadraticCurveTo(0, -2, 4, 3); ctx.lineTo(4, 12); ctx.stroke(); break;
      default: ctx.arc(0, 0, 10, 0, 6.3); ctx.stroke();
    }
  }

  function drawMarkers(ctx, cam, vw, vh, rabbit) {
    const t = Date.now();
    const pw = forest.pointerWorld();
    ctx.save();
    ctx.textAlign = 'center';
    for (const a of items) {
      if (a.x < cam.x - 120 || a.x > cam.x + vw + 120 || a.y < cam.y - 120 || a.y > cam.y + vh + 120) continue;
      const d = Math.hypot(a.x - rabbit.x, a.y - rabbit.y);
      const vis = Math.max(0.6, Math.min(1, 1 - d / 700));
      const pulse = forest.reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.003 + a.phase);
      const seen = visited.has(a.id), active = nearId === a.id;
      const g = ctx.createRadialGradient(a.x, a.y, 2, a.x, a.y, 44 + pulse * 6);
      g.addColorStop(0, `rgba(255,248,225,${(active ? 0.34 : 0.22) * vis})`);
      g.addColorStop(1, 'rgba(7,9,14,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(a.x, a.y, 52, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = `rgba(255,255,255,${0.95 * vis})`;
      ctx.shadowColor = 'rgba(254,243,199,.8)'; ctx.shadowBlur = 6;
      drawIcon(ctx, a.id, true);
      ctx.restore();
      if (seen) { ctx.fillStyle = 'rgba(167,243,208,.9)'; ctx.beginPath(); ctx.arc(a.x + 17, a.y - 17, 3, 0, Math.PI * 2); ctx.fill(); }
      const hovered = Math.hypot(a.x - pw.x, a.y - pw.y) < 38;
      if (hovered || active) {
        ctx.font = '16px "Cormorant Garamond", Georgia, serif';
        ctx.fillStyle = 'rgba(254,243,199,0.95)';
        ctx.fillText(a.work.title[lang()], a.x, a.y - 30);
      }
    }
    ctx.restore();
  }

  // Підказка не зникає сама: лише × / Escape, огляд або підхід до іншої знахідки.
  function tick() {
    const r = forest.rabbit, st = forest.state;
    if (nearId && st.hold && forest.pointerMovedFrom(anchor) > RELEASE_PX) st.hold = false;
    if (dismissed) {
      const d = items.find(i => i.id === dismissed);
      if (Math.hypot(d.x - r.x, d.y - r.y) > LEAVE_R) dismissed = null;
    }
    for (const a of items) {
      if (a.id !== nearId && a.id !== dismissed && Math.hypot(a.x - r.x, a.y - r.y) < ENTER_R) {
        nearId = a.id; st.hold = true; anchor = forest.pointerSnapshot();
        onNear(a.work);
        break;
      }
    }
  }

  MEM.artifacts = {
    init(f, works) {
      forest = f;
      items = works.filter(w => !w.isEnvironment && SPOTS[w.id]).map((w, i) => ({
        id: w.id, work: w, x: SPOTS[w.id].x, y: SPOTS[w.id].y, phase: i * 1.7
      }));
      forest.addDrawLayer(drawMarkers);
      forest.addTick(tick);
    },
    count() { return items.length; },
    onNear(fn) { onNear = fn; },
    markVisited(id) { visited.add(id); },
    visitedCount() { return visited.size; },
    // Після закриття модалки: зайченя лишається на місці, доки курсор не зсунеться (без стрибка).
    reholdAfterModal() {
      if (nearId) { forest.state.hold = true; anchor = forest.pointerSnapshot(); }
    },
    dismiss() { if (nearId) { dismissed = nearId; nearId = null; forest.state.hold = false; onNear(null); } },
    reset() { visited.clear(); nearId = null; dismissed = null; anchor = null; onNear(null); },
    ids() { return items.map(i => i.id); },
    pos(id) { const a = items.find(i => i.id === id); return a && { x: a.x, y: a.y }; }
  };
})();
