// Spells as keys, and secrets: the seals (Session 2403; Michael's B on #1678, docs/design/spells-as-keys-build.md, session 1). A gate's
// seals are laid on its own stream after its braziers, webs and pools: one a gate, two in a massive gate, the gate's own school first,
// each in a side room with one mouth and no web or pool, never where closing it cuts off anything you could reach. 40 gates of every
// size built twice, pure; then a real gate with a shut seal walked into, its mouth rock until openSecret opens it for good.
// (gatesave holds a seal opened across a save and a reload.) Session 2405: the six keys, each seal rebuilt in turn at the same mouth
// and opened by its word through the game's own calls (the gallery by the loop: an updraft, a jump and the mantle), and the chest.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const pure = await page.evaluate(() => { const out = { rows: [], bad: [] };
  const sizes = ['tiny', 'small', 'medium', 'large', 'massive'];
  // an independent walk: with every seal's room and mouth shut, the entry still reaches floor one's stair (or the ring), and floor
  // two's stair hall still reaches the ring
  const walk = (gen, fl, from, to, shut) => { const M = fl === 2 ? gen.map2 : gen.map, W = gen.W, H = gen.H, seen = new Set(), q = [];
    const ok = (c, y) => y >= 0 && c >= 0 && y < H && c < W && M[y][c] > 0 && !shut.has(fl + ':' + (y * W + c));
    for (const [c, y] of from) if (ok(c, y)) { seen.add(y * W + c); q.push([c, y]); }
    for (let i = 0; i < q.length; i++) { const [c, y] = q[i]; if (to(c, y)) return true;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + a, ny = y + b, k = ny * W + nc; if (!ok(nc, ny) || seen.has(k)) continue; seen.add(k); q.push([nc, ny]); } }
    return false; };
  for (let i = 0; i < 40; i++) { const size = sizes[i % 5], seed = 1000 + i * 7919, school = SECRET_SCHOOLS[i % 6];
    const one = () => { const gen = makeGate(size, seed); gateThings(gen, seed); gateSecrets(gen, seed, size, school); return gen; };
    const a = one(), b = one(), key = s => JSON.stringify(s.map(q => [q.id, q.school, q.floor, q.c, q.r, q.room]));
    const S = a.secrets, shut = new Set(); S.forEach(q => q.cells.forEach(k => shut.add(q.floor + ':' + k)));
    const ring = a.spaces[a.ring], rf = ring.floor || 1, d = ring.dais, rc = d ? Math.round((d.x0 + d.x1) / 2) : ring.x, rr = d ? Math.round((d.z0 + d.z1) / 2) : ring.y;
    const atRing = (c, y) => Math.abs(c - rc) <= 1 && Math.abs(y - rr) <= 1;
    let path;
    if (rf === 1) path = walk(a, 1, [[a.entC, a.entR]], atRing, shut);
    else { const hid = a.hall.id, hall2 = []; for (let y = 0; y < a.H; y++) for (let c = 0; c < a.W; c++) if (a.cellSpace2[y][c] === hid) hall2.push([c, y]);
      path = walk(a, 1, [[a.entC, a.entR]], (c, y) => a.cellSpace[y][c] === hid, shut) && walk(a, 2, hall2, atRing, shut); }
    const things = new Set((a.things || []).filter(t => t.room).map(t => t.floor + ':' + t.room.x + ',' + t.room.y));
    const seals = S.filter(q => q.kind === 'seal'), mech = S.filter(q => q.kind !== 'seal'), sp = ty => (a.spaces || []).some(x => x && (x.floor || 1) === ty[0] && x.type === ty[1]);
    const rooms = new Set(S.map(q => q.floor + ':' + q.room.x + ',' + q.room.y));
    const row = { size, seed, n: seals.length, max: SECRET_SEAL_N[size], all: S.length, maxAll: SECRET_N[size], same: key(S) === key(b.secrets), first: S[0] ? S[0].school : null, school,
      ids: S.every((q, k) => q.id === seed + ':' + q.floor + ':secret' + k), path, free: S.every(q => !things.has(q.floor + ':' + q.room.x + ',' + q.room.y)),
      two: seals.length < 2 || seals[1].school !== seals[0].school, order: S.every((q, k) => (k < seals.length) === (q.kind === 'seal')),
      kinds: mech.map(q => q.kind), mechOk: mech.every(q => SECRET_MECH.includes(q.kind) && (q.kind !== 'lift' || sp([q.floor, 'chasm'])) && (q.kind !== 'sluice' || sp([q.floor, 'flooded'])))
        && ['turn', 'plates'].every(k => mech.filter(q => q.kind === k).length <= 1) && rooms.size === S.length };
    const bq = a.barricade; row.bar = !!bq; row.barOk = !bq || (bq.id === seed + ':' + bq.floor + ':barricade' && !rooms.has(bq.floor + ':' + bq.room.x + ',' + bq.room.y) && !things.has(bq.floor + ':' + bq.room.x + ',' + bq.room.y)
      && (bq.floor === 2 ? a.map2 : a.map)[bq.r][bq.c] === 1 && JSON.stringify(bq) === JSON.stringify(b.barricade) && bq.scene >= 0 && bq.scene < 6);
    out.rows.push(row); if (!(row.same && row.n <= row.max && row.all <= row.maxAll && (!row.n || row.first === school) && row.ids && row.path && row.free && row.two && row.order && row.mechOk)) out.bad.push(row); }
  return out; });
const R = pure.rows, full = R.filter(r => r.n === r.max).length, none = R.filter(r => !r.n).length;
console.log('pure', JSON.stringify(R.map(r => r.size[0] + r.n + (r.first || '-'))), 'bad', JSON.stringify(pure.bad));
check(`40 gates built twice lay the same seals, ids <seed>:<floor>:secret<n> (${R.filter(r => r.same && r.ids).length} of 40)`, R.every(r => r.same && r.ids), pure.bad);
check(`the table's count or fewer: one a gate, two in a massive one (${full} full, ${none} with none)`, R.every(r => r.n <= r.max) && full >= 30, R.map(r => r.size + ' ' + r.n));
check(`the first seal is the gate's own school, a massive gate's second another (${R.filter(r => r.n && r.first === r.school && r.two).length} of ${R.filter(r => r.n).length})`, R.every(r => !r.n || (r.first === r.school && r.two)), pure.bad);
check(`no secret takes a web's or a pool's room, and with every secret shut the entry still reaches the ring (${R.filter(r => r.path && r.free).length} of 40)`, R.every(r => r.path && r.free), pure.bad);
// S2411 — the barricade: one gate in four, on its own stream, a bare mouth of a room no secret, web or pool holds
const bars = R.filter(r => r.bar).length;
check(`a barricade in about one gate in four (${bars} of 40), across a bare mouth of a room nothing else holds, the same on both builds`, R.every(r => r.barOk) && bars >= 4 && bars <= 18, R.filter(r => !r.barOk));
// S2409 — the mechanisms after the seals: two secrets in a medium gate, three in a large, four in a massive, each kind where it can stand
const kindsSeen = R.flatMap(r => r.kinds), mechFull = R.filter(r => r.all === r.maxAll).length;
check(`after the seals the mechanisms, to the table's count (${mechFull} of 40 full; kinds ${JSON.stringify([...new Set(kindsSeen)].sort())}): the lift by a chasm, the sluice by a flooded hall, the turning chamber and the plates once, one room each`,
  R.every(r => r.all <= r.maxAll && r.order && r.mechOk) && mechFull >= 24 && kindsSeen.includes('slide') && kindsSeen.length >= 16, R.filter(r => !(r.order && r.mechOk)));

// a real gate of the world with a shut seal (the stone leaf, the fallen block or the dark wall), walked into
const pick = await page.evaluate(() => { for (const p of PORTALS) { if (!p || p.seed == null || p.zone !== 'world' || p.lair || p.tutorial) continue;
    let gen; try { const w = WORLD_DUNGEONS.find(e => e.seed === p.seed) || {}; gen = makeGate(p.size, p.seed, w.floors, w.cond); if (clochBlockDue(p)) gateBlock(gen, p.seed); gateThings(gen, p.seed); gateSecrets(gen, p.seed, p.size, gateOrbSchool(p)); } catch (e) { continue; }
    const s = gen.secrets.find(q => SECRET_SEAL_SHUT[q.school] && q.floor === 1); if (s) { window._sealP = p; return { seed: p.seed, size: p.size, id: s.id, school: s.school }; } }
  return null; });
console.log('pick', JSON.stringify(pick));
check('a gate of the world has a shut seal', !!pick, pick);
if (pick) {
  await page.evaluate(() => { const p = window._sealP; px = p.x; pz = p.z + 3; goToDungeon(p); });
  await page.waitForFunction((s) => String(lid).startsWith('dyn_') && currentPortal && currentPortal.seed === s && document.getElementById('fd').style.opacity === '0', pick.seed, { timeout: 120000, polling: 200 });
  await g.hide();
  const run = await page.evaluate((id) => { const q = GATE_SECRETS.find(s => s.id === id); if (!q) return { found: false, list: GATE_SECRETS.map(s => s.id) };
    const S = q.solid, cx = (S.x0 + S.x1) / 2, cz = (S.z0 + S.z1) / 2, fl0 = currentFloor; currentFloor = q.floor;
    const shut = dSolid(cx, cz), first = openSecret(id), open = !dSolid(cx, cz), again = openSecret(id); currentFloor = fl0;
    const R = worldState.gateSecrets && worldState.gateSecrets[currentPortal.seed];
    return { found: true, shut, first, open, again, shown: q.shut.visible, rec: R && R.o.slice(), n: q.n }; }, pick.id);
  console.log('run', JSON.stringify(run));
  // S2423 — every kind is laid now (the sheet's session 5): each secret the gate draws is built
  const laid = await page.evaluate(() => ({ drawn: GATE_SECRETS_GEN.secrets.map(s => s.kind), built: GATE_SECRETS.filter(s => s.kind !== 'barricade').map(s => s.kind), every: Object.keys(SECRET_BUILT).sort().join() }));
  check(`every secret the gate draws is laid (${laid.built.join(', ')}), every kind built (${laid.every})`, laid.built.join() === laid.drawn.join() && laid.every === 'lift,plates,seal,slide,sluice,stair,turn', laid);
  check(`in the gate its mouth is rock until opened (${pick.school}, ${pick.id})`, run.found && run.shut, run);
  check('openSecret opens it for good: the rock gone, kept in the world\'s record, and a second call does nothing', run.first && run.open && !run.again && !run.shown && JSON.stringify(run.rec) === JSON.stringify([run.n]), run);
}
// S2405 — the six keys (the sheet's session 2). The same mouth rebuilt as each school's seal in turn, each opened by its own key
// through the game's calls; the play clock moved by hand, the gallery climbed through the loop.
await page.evaluate(() => {
  window._drive = (step, max, ms = 1000 / 60) => { const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; prevT = t; try { for (; n < max; n++) { if (step(n)) break; t += ms; loop(t); } } finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; } return n; };
  window._reset = (x, z, y, yw) => { for (const k in K) K[k] = false; PHP = maxHP; stamina = maxStamina; staminaCD = 0; ROLL = null; FALL.pend = null; FALL.top = null; dead = false; PPOST.stagUntil = 0;
    MANTLE.t0 = null; px = x; pz = z; jumpY = y; velY = 0; onGround = true; yaw = yw; pitch = 0; SKILLS.acrobatics = { lv: 5, p: 0 }; };
});
const K6 = pick ? await page.evaluate((id) => {
  const gen = GATE_SECRETS_GEN, base = gen.secrets.find(s => s.id === id), out = {};
  const clear = () => { for (const r of GATE_SECRETS) { if (r.group.parent) r.group.parent.remove(r.group);
      for (const b of r.braziers || []) { b.group.parent && b.group.parent.remove(b.group); gtBrazierCold(b); GATE_THINGS.splice(GATE_THINGS.indexOf(b), 1); const i = DUNGEON_COLUMNS.findIndex(c => c.brazier === b.id); if (i >= 0) DUNGEON_COLUMNS.splice(i, 1); }
      if (r.thing) GATE_THINGS.splice(GATE_THINGS.indexOf(r.thing), 1);
      if (r.chest) { r.chest.mesh.parent && r.chest.mesh.parent.remove(r.chest.mesh); const i = CHESTS.indexOf(r.chest); if (i >= 0) CHESTS.splice(i, 1); } }
    for (let i = FOOTHOLDS.length - 1; i >= 0; i--) if (FOOTHOLDS[i].secret) FOOTHOLDS.splice(i, 1);
    for (let i = DUNGEON_PROPS.length - 1; i >= 0; i--) if (DUNGEON_PROPS[i].secret) DUNGEON_PROPS.splice(i, 1);
    if (worldState.gateSecrets) delete worldState.gateSecrets[currentPortal.seed]; laidEnd(); };
  const build = sc => { clear(); gen.secrets = [Object.assign({}, base, { school: sc })]; gateSecretsBuild(gen, currentPortal); currentFloor = 1; return GATE_SECRETS[0]; };
  const ox = dAt(base.c - base.dc), oz = dAt(base.r - base.dr), mx = dAt(base.c) - base.dc, mz = dAt(base.r) - base.dr;
  const yawTo = (x, z) => Math.atan2(-(x - px), -(z - pz)), mid = r => [(r.solid.x0 + r.solid.x1) / 2, (r.solid.z0 + r.solid.z1) / 2];
  { const r = build('tine'), [b0, b1] = r.braziers, o = {}, [sx, sz] = mid(r);
    o.apart = +Math.hypot(b0.x - b1.x, b0.z - b1.z).toFixed(2); o.shut = dSolid(sx, sz);
    _reset(b0.x - base.dc * 1.2, b0.z - base.dr * 1.2, 0, 0); yaw = yawTo(b0.x, b0.z); o.found = touchGateThing('caor') === b0;
    touchThing('caor', b0); gateSecretsTick(); o.lit = b0.lit; playClockS += 21; gateSecretsTick(); o.cold = !b0.lit && !r.opened;
    touchThing('caor', b0); gateSecretsTick(); playClockS += 8; touchThing('caor', b1); gateSecretsTick(); o.open = r.opened && !dSolid(sx, sz);
    playClockS += 30; gateSecretsTick(); o.stay = b0.lit && b1.lit; out.tine = o; }
  { const r = build('uisce'), A = r.area, o = {}, ch = r.chest, L = FOOTHOLDS.find(f => f.secret === r.id), lx = (L.x0 + L.x1) / 2, lz = (L.z0 + L.z1) / 2;
    _reset((A.x0 + A.x1) / 2, (A.z0 + A.z1) / 2, 0, 0); for (let i = 0; i < 4; i++) { gateSecretsTick(); playClockS += .5; } gateSecretsTick(); o.lost = +((maxHP - PHP) / maxHP * 100).toFixed(1);
    jumpY = 0; o.low = dBlkP(lx, lz); jumpY = L.y; o.high = !dBlkP(lx, lz) && mantleClear(lx, lz, L.y); jumpY = 0; o.ledge = +(L.y - r.y).toFixed(2); o.chestOn = +(ch.standY - r.y).toFixed(2); o.chest = CHESTS.includes(ch) && !lookingAt(ch);
    _reset(mx + base.dc * .8, mz + base.dr * .8, 0, 0); yaw = yawTo(px + base.dc, pz + base.dr); const w = touchGateThing('sioc'); o.found = w === r.thing; if (w) touchThing('sioc', w); o.open = r.opened && r.thing.frozen;
    _reset((A.x0 + A.x1) / 2, (A.z0 + A.z1) / 2, 0, 0); for (let i = 0; i < 4; i++) { gateSecretsTick(); playClockS += .5; } o.after = maxHP - PHP; out.uisce = o; }
  { const r = build('cloch'), o = {}; _reset(mx, mz, 0, 0); let said = 0; const sm = showMsg; showMsg = (...a) => { if (a[0] === 'The stone does not answer that word.') said++; return sm(...a); };
    try { o.wrong = !!secretTouched('caor') && !!secretTouched('tine'); } finally { showMsg = sm; } o.said = said; o.once = said === 1;
    o.lay = layWord('cloch_ghear', null, r.kx - base.dc * 1.0, r.kz - base.dr * 1.0).ok; o.open = r.opened && !DUNGEON_PROPS.includes(r.solid); out.cloch = o; }
  { const r = build('scath'), o = {}; _reset(ox, oz, 0, 0); gateSecretsTick(); o.rock = DUNGEON_PROPS.includes(r.solid);
    SPELL_FX.nighteye = performance.now() + 60000; gateSecretsTick(); o.draught = DUNGEON_PROPS.includes(r.solid);
    _oicheUntil = SPELL_FX.nighteye; gateSecretsTick(); o.seen = !DUNGEON_PROPS.includes(r.solid); _oicheUntil = 0; gateSecretsTick(); o.back = DUNGEON_PROPS.includes(r.solid);
    _oicheUntil = SPELL_FX.nighteye; gateSecretsTick(); px = dAt(base.c); pz = dAt(base.r); gateSecretsTick(); _oicheUntil = 0; SPELL_FX.nighteye = 0; gateSecretsTick();
    o.open = r.opened && !DUNGEON_PROPS.includes(r.solid); out.scath = o; }
  { const r = build('solas'), o = {}; _reset(ox, oz, 0, 0); o.hidden = !CHESTS.includes(r.chest);
    o.lay = layWord('solas_gheal', null, r.kx - base.dc * 1.5, r.kz - base.dr * 1.5).ok; gateSecretsTick(); playClockS += 1.5; gateSecretsTick(); o.early = r.opened;
    playClockS += 1.6; gateSecretsTick(); o.open = r.opened && CHESTS.includes(r.chest); out.solas = o; }
  { const G0 = build('gaoth').gallery, far = base.dc ? (base.dc > 0 ? G0.x1 : G0.x0) : (base.dr > 0 ? G0.z1 : G0.z0);
    const ux = base.dc ? far - base.dc * 1.3 : (G0.x0 + G0.x1) / 2, uz = base.dc ? (G0.z0 + G0.z1) / 2 : far - base.dr * 1.3, face = Math.atan2(base.dc, base.dr) + Math.PI;
    const climb = draft => { const r = build('gaoth'); _reset(ux - base.dc * 2, uz - base.dr * 2, 0, 0); const lay = draft ? layWord('sideen', null, ux, uz).ok : true;
      _reset(ux, uz, 0, face); let top = 0; _drive(i => { K['KeyW'] = i > 3 && velY < .5; K['Space'] = i === 0; top = Math.max(top, jumpY); return i > 10 && onGround && !mantling(); }, 240);
      for (const k in K) K[k] = false; return { r, lay, top: +top.toFixed(4), y: +jumpY.toFixed(2), open: r.opened }; };
    const bare = climb(false), up = climb(true), r = up.r, o = { gallery: +(G0.y).toFixed(2), bare: { top: bare.top, y: bare.y, open: bare.open }, up: { lay: up.lay, top: up.top, y: up.y, open: up.open } };
    if (r.opened) { const ch = r.chest; o.look = Math.abs(jumpY - ch.standY) <= 1.2; const n0 = ch.items.length, again = JSON.stringify(rollContainerLoot('chest', currentPortal.diffScale, currentPortal.theme, undefined, ch.id, Math.min(4, dungeonTier(currentPortal, 1) + 1)).map(i => i.name));
      o.same = again === JSON.stringify(ch.items.map(i => i.name)); takeSecret(r.id); const R = worldState.gateSecrets[currentPortal.seed]; o.kept = R.t[r.n] === ch.items; if (ch.items.length) takeLootItem(0);
      o.n0 = n0; o.left = R.t[r.n].length; closeLoot(); }
    out.gaoth = o; }
  // S2409 — the sliding wall at the same mouth: rock, its pale stone, the flames' lean within 4 m, the draught within 2 m, the dust, E on the stone
  { clear(); gen.secrets = [Object.assign({}, base, { kind: 'slide', school: null })]; gateSecretsBuild(gen, currentPortal); currentFloor = 1; const r = GATE_SECRETS[0], o = {}, [sx, sz] = mid(r);
    o.shut = dSolid(sx, sz); const wc = r.mat.color, pc = r.paleMat.color; o.pale = +(pc.r / wc.r).toFixed(4); o.paleOk = Math.abs(pc.r / wc.r - 1.15) < 1e-3 && Math.abs(pc.g / wc.g - 1.15) < 1e-3 && r.paleMat.map === r.mat.map;
    { const sh = dScene.children.find(q => q.userData && q.userData.dunShell === 'walls'), C = r.shut.geometry.attributes.color, SC = r.stone.mesh.geometry.attributes.color, SW = sh.geometry.attributes.color; let t = 0; for (let i = 0; i < SW.count; i++) t += SW.getX(i); /* S2445: the shell's material draws by vertex colour; a box without them drew black */
      o.tint = C ? +C.getX(0).toFixed(3) : 0; o.shellTint = +(t / SW.count).toFixed(3); o.tintOk = !!(C && SC && r.shut.material.vertexColors && C.getX(0) > .3 && Math.abs(C.getX(0) - t / SW.count) < .35); }
    { /* S2458: the courses run on across the slab. The shell's vertices on the wall's plane within a turn (1.6 m) of either edge of the slab, against the slab's own uv
         at the same place on its face (the turn's fraction, u along the wall and v up it); the old corner-laid uv beside it for the record */
      const sh = dScene.children.find(q => q.userData && q.userData.dunShell === 'walls'), P = sh.geometry.attributes.position, U = sh.geometry.attributes.uv, q = sh.scale, so = sh.position;
      const L = r.look, nX = !!base.dc, at = nX ? r.kx - base.dc * .25 : r.kz - base.dr * .25, mid0 = nX ? r.kz : r.kx, half = DCELL / 2, fr = w => { w = ((w % 1) + 1) % 1; return Math.min(w, 1 - w); };
      const slabUV = (a, y) => [a / L.tex + L.ph[0], y / L.tex + L.ph[1]], du = [], dv = [], old = [];
      for (let i = 0; i < P.count - 1; i++) { const vx = P.getX(i) * q.x + so.x, vy = P.getY(i) * q.y + so.y, vz = P.getZ(i) * q.z + so.z, n = nX ? vx : vz, a = nX ? vz : vx;
        const wx = P.getX(i + 1) * q.x + so.x, wz = P.getZ(i + 1) * q.z + so.z, aj = nX ? wz : wx, nj = nX ? wx : wz;
        if (Math.abs(n - at) > .35 || Math.abs(aj - a) < .1 || Math.abs(aj - a) < 3 * Math.abs(nj - n)) continue;
        const e = Math.abs(a - mid0) - half; if (e < -.05 || e > 1.6 || vy < r.y - .05 || vy > r.y + r.slideH + .05) continue;
        const [su, sv] = slabUV(a, vy); du.push(fr(U.getX(i) - su)); dv.push(fr(U.getY(i) - sv)); old.push(fr(U.getX(i) - (a - mid0) / L.tex)); }
      const med = A => A.length ? +[...A].sort((x, y) => x - y)[A.length >> 1].toFixed(3) : 1;
      const face = r.shut.geometry.attributes.uv, FP = r.shut.geometry.attributes.position, FN = r.shut.geometry.attributes.normal; let selfOk = true;
      for (let i = 0; i < FP.count; i++) { if (Math.abs(nX ? FN.getX(i) : FN.getZ(i)) < .5) continue; const a = (nX ? FP.getZ(i) : FP.getX(i)) + mid0, y = FP.getY(i) + r.shut.position.y, [su, sv] = slabUV(a, y);
        if (fr(face.getX(i) - su) > 1e-3 || fr(face.getY(i) - sv) > 1e-3) selfOk = false; }
      o.courses = { n: du.length, phN: L.phN, ph: L.ph.map(x => +x.toFixed(3)), du: med(du), dv: med(dv), oldU: med(old), selfOk }; }
    const st = r.stone, ux = Math.sign(st.x - r.kx), uz = Math.sign(st.z - r.kz), mk = d => { const m = new THREE.Mesh(new THREE.SphereGeometry(.05, 5, 4), new THREE.MeshBasicMaterial()); m.position.set(r.kx + ux * d, 2, r.kz + uz * d); dScene.add(m);
      const T = { l: new THREE.PointLight(0xff8833, 0, 1), fl: m, ph: 0 }; TORCHES.push(T); return T; };
    const near = mk(2.5), far = mk(6); r.flames = null; _reset(st.x + ux * 1.0, st.z + uz * 1.0, 0, 0); o.air1 = +slideTick(r, true).toFixed(2);
    const tip = T => { const v = new THREE.Vector3(0, 1, 0).applyEuler(T.fl.rotation); return +(v.x * -ux + v.z * -uz).toFixed(3); };
    o.lean = tip(near); o.leanFar = tip(far); o.dust = r.dust && (() => { const a = r.dust.pts.geometry.attributes.position; let mx = 0; for (let i = 0; i < a.count; i++) mx = Math.max(mx, Math.abs((a.getX(i) - r.kx) * ux + (a.getZ(i) - r.kz) * uz)); return +mx.toFixed(2); })();
    px = st.x + ux * 3; pz = st.z + uz * 3; o.air3 = slideTick(r, true);
    _reset(st.x + ux * 1.1, st.z + uz * 1.1, 0, yawTo(st.x, st.z)); _drive(i => i >= 1, 3); pitch = Math.atan2(st.y - CAM.position.y, 1.1); _drive(i => i >= 1, 3);
    o.prompt = document.getElementById('ipr').textContent; o.aimed = slideStoneNear() === r; pitch = .6; _drive(i => i >= 1, 3); o.offAim = !slideStoneNear(); pitch = Math.atan2(st.y - CAM.position.y, 1.1); _drive(i => i >= 1, 3);
    interact(); o.open = r.opened && !dSolid(sx, sz); gateSecretsTick(); o.sliding = r.shut.visible; playClockS += 1.3; gateSecretsTick(); o.gone = !r.shut.visible; o.leanAfter = tip(near);
    const R = worldState.gateSecrets[currentPortal.seed]; o.kept = R.o.includes(r.n);
    o.tier = JSON.stringify(rollContainerLoot('chest', currentPortal.diffScale, currentPortal.theme, undefined, r.chest.id, Math.min(4, dungeonTier(currentPortal, 1))).map(i => i.name)) === JSON.stringify(r.chest.items.map(i => i.name));
    for (const T of [near, far]) { dScene.remove(T.fl); TORCHES.splice(TORCHES.indexOf(T), 1); } pitch = 0; out.slide = o; }
  // S2416 — the stair under the floor in the same room: the hollow step on the slab, Cloch Ghéar laid on it, or 20 s of the pick (loud);
  // then down the steps to the cellar 3 m under the room through the loop, the mouth a wall under the floor, and up again
  { const one = () => { clear(); gen.secrets = [Object.assign({}, base, { kind: 'stair', school: null })]; gateSecretsBuild(gen, currentPortal); currentFloor = 1; return GATE_SECRETS[0]; };
    let r = one(); const o = {}, ux = base.dc, uz = base.dr, H = DCELL / 2, h = r.hole;
    o.hidden = !CHESTS.includes(r.chest) && r.shut.visible; _reset(r.kx, r.kz, 0, 0); o.hollow = stairHollowHere();
    _reset(r.kx + uz * 2 * DCELL, r.kz + ux * 2 * DCELL, 0, 0); o.notFar = !stairHollowHere(); o.base0 = dPitBase(r.kx, r.kz, 0);
    _reset(r.kx - ux * 2, r.kz - uz * 2, 0, 0); o.lay = layWord('cloch_ghear', null, r.kx, r.kz).ok; o.clochOpen = r.opened && !r.shut.visible && CHESTS.includes(r.chest); laidEnd();
    o.cut = r.cutN; const live = () => { const v = new THREE.Vector3(); let n = 0; for (const m of dScene.children) { if (!m.isMesh || !m.userData || m.userData.dunShell !== 'floor' || !m.geometry.index) continue; m.updateMatrixWorld(true); const P = m.geometry.attributes.position, a = m.geometry.index.array;
      for (let k = 0; k < a.length; k += 3) { if (a[k] === a[k + 1] && a[k] === a[k + 2]) continue; let sx = 0, sz = 0; for (let q = 0; q < 3; q++) { v.fromBufferAttribute(P, a[k + q]).applyMatrix4(m.matrixWorld); sx += v.x / 3; sz += v.z / 3; } if (inArea(h, sx, sz, -.01)) n++; } } return n; }; o.left = live();
    // S2425 — a foe's step (dSlide) toward the hole: across it while the slab is shut, stopped at its edge once it is open
    const foeWalk = (r) => { let x = r.kx - ux * (H + 1), z = r.kz - uz * (H + 1), inHole = false; for (let i = 0; i < 70; i++) { [x, z] = dSlide(x, z, ux * .1, uz * .1); if (inArea(r.hole, x, z)) inHole = true; } return { inHole, gap: +(((ux ? x : z) - nearE0(r)) * (ux || uz)).toFixed(2) }; };
    const nearE0 = (r) => ux ? (ux > 0 ? r.hole.x0 : r.hole.x1) : (uz > 0 ? r.hole.z0 : r.hole.z1);
    r = one(); o.foeShut = foeWalk(r);
    r = one(); const fake = [{ x: r.kx + 10, z: r.kz, floor: 1, alert: false, dead: false }, { x: r.kx + 40, z: r.kz, floor: 1, alert: false, dead: false }]; ENEMIES.push(...fake);
    if (!BAG.some(b => b && b.tool === 'pick')) BAG.push({ ...PICK_ITEM }); _reset(r.kx - ux * .9, r.kz - uz * .9, 0, 0);
    o.near = stairSlabNear() === r; interact(); o.working = STAIR_PRY && STAIR_PRY.rec === r; o.alert = [fake[0].alert, fake[1].alert];
    for (let i = 0; i < 20; i++) { playClockS += .5; gateSecretsTick(); } o.ten = +r.pry.toFixed(2); o.tenShut = !r.opened;
    interact(); o.stopped = !STAIR_PRY; playClockS += 30; gateSecretsTick(); o.kept = +r.pry.toFixed(2);
    interact(); for (let i = 0; i < 21; i++) { playClockS += .5; gateSecretsTick(); } o.open = r.opened && !r.shut.visible && CHESTS.includes(r.chest) && !STAIR_PRY;
    ENEMIES.splice(ENEMIES.indexOf(fake[0]), 2); o.leftPick = live(); o.steps = FOOTHOLDS.filter(f => f.secret === r.id).length;
    o.rec = worldState.gateSecrets[currentPortal.seed].o.includes(r.n);
    o.tier = JSON.stringify(rollContainerLoot('chest', currentPortal.diffScale, currentPortal.theme, undefined, r.chest.id, Math.min(4, dungeonTier(currentPortal, 1))).map(i => i.name)) === JSON.stringify(r.chest.items.map(i => i.name));
    // down: from the room short of the hole, walking on through it
    const u = ux || uz, along = () => ux ? px : pz, farE = ux ? (ux > 0 ? h.x1 : h.x0) : (uz > 0 ? h.z1 : h.z0), nearE = ux ? (ux > 0 ? h.x0 : h.x1) : (uz > 0 ? h.z0 : h.z1);
    _reset(r.kx - ux * (H + .5), r.kz - uz * (H + .5), 0, 0); yaw = yawTo(px + ux, pz + uz); K.KeyW = true;
    _drive(() => jumpY < -2.95 && (along() - farE) * u > .4, 400); K.KeyW = false;
    o.down = { y: +jumpY.toFixed(2), past: (along() - farE) * u };
    // the mouth's edge: a wall under the floor, open over it
    const sx0 = px, sz0 = pz, sy0 = jumpY, ex = dAt(base.c) + ux * H - ux * .25, ez = dAt(base.r) + uz * H - uz * .25; jumpY = -3; o.wallBelow = dBlkP(ex, ez); jumpY = 0; o.openAbove = !dBlkP(ex, ez); jumpY = sy0;
    // up: back the way you came
    yaw = yawTo(px - ux, pz - uz); K.KeyW = true; _drive(() => jumpY > -.05 && (along() - nearE) * u < -.3, 400); K.KeyW = false;
    o.up = +jumpY.toFixed(2); o.foeOpen = foeWalk(r); { const [ox, oz] = dSlide(r.kx, r.kz, -ux * .2, -uz * .2); o.foeOff = Math.hypot(ox - r.kx, oz - r.kz) > .19; }
    o.errs = 0; clear(); out.stair = o; }
  // S2417 — the sluice at the same mouth: the grate and the water, the wheel held 8 s (let go, the turn is kept), or Tonn laid on the grate;
  // the water drains in 10 s and then the grate rises
  { const one = () => { clear(); gen.secrets = [Object.assign({}, base, { kind: 'sluice', school: null })]; gateSecretsBuild(gen, currentPortal); currentFloor = 1; return GATE_SECRETS[0]; };
    let r = one(); const o = {}, ux = base.dc, uz = base.dr, W = r.wheel, gs = r.grateSolid, gx = (gs.x0 + gs.x1) / 2, gz = (gs.z0 + gs.z1) / 2;
    o.shut = dSolid(gx, gz) && r.water.visible && +(r.water.position.y - r.y).toFixed(2) === .8 && !CHESTS.includes(r.chest) && r.chest.mesh.visible;
    _reset(W.x - ux * 1.0, W.z - uz * 1.0, 0, 0); yaw = yawTo(W.x, W.z); _drive(i => i >= 1, 3); pitch = Math.atan2(W.y - CAM.position.y, 1.0); _drive(i => i >= 1, 3);
    o.prompt = document.getElementById('ipr').textContent; o.aimed = sluiceWheelNear() === r;
    interact(); K.KeyE = true; for (let i = 0; i < 8; i++) { playClockS += .5; gateSecretsTick(); } o.four = +W.turned.toFixed(2);
    K.KeyE = false; playClockS += .5; gateSecretsTick(); o.letGo = !SLUICE_TURN && +W.turned.toFixed(2) === o.four; playClockS += 20; gateSecretsTick(); o.kept = +W.turned.toFixed(2);
    interact(); K.KeyE = true; for (let i = 0; i < 9; i++) { playClockS += .5; gateSecretsTick(); } K.KeyE = false; o.open = r.opened; o.rec = worldState.gateSecrets[currentPortal.seed].o.includes(r.n);
    o.stillShut = dSolid(gx, gz) && r.water.visible; playClockS += 5; gateSecretsTick(); o.half = +(r.water.position.y - r.y).toFixed(2);
    playClockS += 5.1; gateSecretsTick(); o.drained = !r.water.visible && !dSolid(gx, gz); playClockS += 1.6; gateSecretsTick(); o.risen = !r.grate.visible;
    o.chest = CHESTS.includes(r.chest);
    o.tier = JSON.stringify(rollContainerLoot('chest', currentPortal.diffScale, currentPortal.theme, undefined, r.chest.id, Math.min(4, dungeonTier(currentPortal, 1))).map(i => i.name)) === JSON.stringify(r.chest.items.map(i => i.name));
    r = one(); pitch = 0; _reset(r.kx - ux * 6, r.kz - uz * 6, 0, 0); o.far = layWord('tonn', null, r.kx - ux * 4, r.kz - uz * 4).ok === true || r.opened;
    o.tonn = layWord('tonn', null, r.kx - ux * 1.2, r.kz - uz * 1.2).ok && r.opened && r.drainAt != null; laidEnd(); clear(); out.sluice = o; }
  // S2411 — the barricade at the same mouth: three blows of doBash, or Caor touched; its chest at the floor's tier, kept
  { const one = () => { clear(); for (let i = GATE_THINGS.length - 1; i >= 0; i--) if (GATE_THINGS[i].kind === 'barricade') GATE_THINGS.splice(i, 1);
      gen.secrets = []; gen.barricade = Object.assign({}, base, { kind: 'barricade', n: 'b', id: currentPortal.seed + ':1:barricade', school: null, scene: 0 }); gateSecretsBuild(gen, currentPortal); currentFloor = 1;
      return GATE_SECRETS.find(q => q.kind === 'barricade'); };
    const o = {}; let r = one(); const [sx, sz] = mid(r); o.shut = dSolid(sx, sz);
    const bash = () => { atkCd = 0; stamina = maxStamina; doBash(); };
    _reset(ox, oz, 0, 0); yaw = yawTo(r.kx, r.kz); bash(); o.far = r.blows; /* a cell and more off: out of the bash's reach */
    _reset(r.kx - base.dc * .75, r.kz - base.dr * .75, 0, 0); yaw = yawTo(r.kx, r.kz) + Math.PI; bash(); o.behind = r.blows; yaw = yawTo(r.kx, r.kz);
    bash(); bash(); o.two = r.blows; o.twoShut = !r.opened && dSolid(sx, sz); bash(); o.three = r.opened && !dSolid(sx, sz) && !r.shut.visible;
    const R = worldState.gateSecrets[currentPortal.seed]; o.kept = R.o.includes('b');
    o.tier = JSON.stringify(rollContainerLoot('chest', currentPortal.diffScale, currentPortal.theme, undefined, r.chest.id, Math.min(4, dungeonTier(currentPortal, 1))).map(i => i.name)) === JSON.stringify(r.chest.items.map(i => i.name));
    const n0 = r.chest.items.length; takeSecret(r.id); if (r.chest.items.length) takeLootItem(0); o.left = [n0, R.t.b && R.t.b.length]; closeLoot();
    r = one(); _reset(r.kx - base.dc * 1.2, r.kz - base.dr * 1.2, 0, 0); yaw = yawTo(r.kx, r.kz); const t = touchGateThing('caor'); o.found = !!t && t.kind === 'barricade';
    o.burn = !!t && touchThing('caor', t) && r.opened && !dSolid(sx, sz); o.notThing = !GATE_THINGS.includes(r.planks);
    for (let i = GATE_THINGS.length - 1; i >= 0; i--) if (GATE_THINGS[i].kind === 'barricade') GATE_THINGS.splice(i, 1); gen.barricade = null; out.bar = o; }
  clear(); return out; }, pick.id) : null;
console.log('keys', JSON.stringify(K6));
if (K6) {
  const T = K6.tine, U = K6.uisce, C = K6.cloch, S = K6.scath, L = K6.solas, G = K6.gaoth;
  check(`Tine: Caor on one brazier lights it and 20 s later it is cold again; both within 20 s and the leaf opens, the pair lit for good (${T.apart} m apart)`, T.shut && T.found && T.lit && T.cold && T.open && T.stay, T);
  check(`Uisce: the black water takes ${U.lost}% of health in 2 s (5 a second), Sioc touched freezes it and it takes none; the ledge ${U.ledge} m over it is a wall below and a mantle's top above, the chest on it out of reach from the water`, Math.abs(U.lost - 10) < .8 && U.found && U.open && U.after === 0 && U.low && U.high && U.ledge === 1.5 && U.chestOn === 1.5 && U.chest, U);
  check('Cloch: a wrong word at the block says so once; Cloch Ghéar laid at it opens it', C.wrong && C.once && C.lay && C.open, C);
  check('Scáth: the dark wall is rock without the word, and with the Night Eye draught; Oíche worn shows the doorway, unworn it is rock again; walked through, it stays one', S.rock && S.draught && S.seen && S.back && S.open, S);
  check('Solas: Solas-Gheal laid by the pillar opens the niche after 3 s, not before, and its chest appears', L.hidden && L.lay && !L.early && L.open, L);
  check(`Gaoth: the gallery at ${G.gallery} m is out of a plain jump's reach (${G.bare.top} m) and reached from Séideán's updraft (${G.up.top} m and the mantle)`, !G.bare.open && G.bare.y < 1 && G.up.lay && G.up.open && G.up.y === G.gallery, G);
  check(`a seal's chest is rolled on its own key, a tier up; opened, what is left is the world's (${G.n0} in it, ${G.left} left)`, G.look && G.same && G.kept && G.left === G.n0 - 1, G);
  const W = K6.slide;
  check(`the sliding wall: rock in the shell's own colour (${W.tint} against the walls' ${W.shellTint}), one stone 15% paler (×${W.pale}), a flame 2.5 m off leans toward it (${W.lean}) and one 6 m off does not (${W.leanFar}), dust within ${W.dust} m of it, the air heard at 1 m (${W.air1}) and not at 3`, W.shut && W.paleOk && W.tintOk && W.lean > .25 && W.leanFar === 0 && W.dust <= 1.2 && W.air1 > 0 && W.air3 === 0, W);
  check(`the slab's courses run on from the wall either side: ${W.courses.n} of the shell's points on its plane within 1.6 m of its edges, u off by ${W.courses.du} and v by ${W.courses.dv} of a turn (the slab's old corner-laid u ${W.courses.oldU})`, W.courses.n >= 8 && W.courses.selfOk && W.courses.du < .06 && W.courses.dv < .06, W.courses);
  check(`E on the pale stone, aimed at (${W.prompt}), opens it: it slides away in 1.2 s, kept in the world's record, the flames upright again, its chest at the floor's own tier`, W.aimed && W.offAim && /pale stone/.test(W.prompt) && W.open && W.sliding && W.gone && W.kept && W.leanAfter === 0 && W.tier, W);
}
if (K6) { const T = K6.stair;
  check(`the stair under the floor: the slab's step is hollow (${T.hollow}) and two cells off it is not; shut, the ground over it is the floor (${T.base0}) and its chest hidden; Cloch Ghéar laid on it lifts it, and the floor's cell is cut (${T.cut} triangles, ${T.left} left)`, T.hidden && T.hollow && T.notFar && T.base0 === 0 && T.lay && T.clochOpen && T.cut >= 2 && T.left === 0, T);
  check(`the pick: E sets to it, and a foe 10 m off comes and one 40 m off does not; ${T.ten} s of 20 and still shut; E stops it and the work is kept (${T.kept}); 20 s in all opens it (the floor's cell cut, ${T.leftPick} triangles left over it; ${T.steps} steps), kept, its chest at the floor's tier`, T.near && T.working && T.alert[0] && !T.alert[1] && Math.abs(T.ten - 10) < .01 && T.tenShut && T.stopped && T.kept === T.ten && T.open && T.leftPick === 0 && T.steps === 11 && T.rec && T.tier, T);
  check(`a foe's step: across the slab while it is shut (${T.foeShut.inHole}), stopped ${T.foeOpen.gap} m short of the hole once it is open (${T.foeOpen.inHole}); one over it when it opens is not held there (${T.foeOff})`, T.foeShut.inHole && !T.foeOpen.inHole && T.foeOpen.gap <= -.25 && T.foeOpen.gap > -.6 && T.foeOff, { shut: T.foeShut, open: T.foeOpen, off: T.foeOff });
  check(`walked down the steps to the cellar (${T.down.y} m, ${T.down.past.toFixed(2)} m past the stair), the mouth a wall under the floor and open over it, and walked up again (${T.up} m)`, T.down.y <= -2.95 && T.down.past > 0 && T.wallBelow && T.openAbove && T.up > -.05, T); }
if (K6) { const U = K6.sluice;
  check(`the sluice: a grate across the mouth, 0.8 m of water behind it, its chest seen and out of reach; the wheel aimed at (${U.prompt})`, U.shut && U.aimed && /turn the wheel/.test(U.prompt), U);
  check(`the wheel turns only while E is held: ${U.four} s, let go and kept (${U.kept} after 20 s), 8 s in all opens it, kept in the world's record; a Tonn laid 4 m off does nothing, one on the grate opens it`, U.four === 4 && U.letGo && U.kept === 4 && U.open && U.rec && !U.far && U.tonn, U);
  check(`the water drains in 10 s (${U.half} m at 5 s) behind a grate still shut, then the grate rises and the chest, at the floor's tier, is yours`, U.stillShut && U.half > .3 && U.half < .5 && U.drained && U.risen && U.chest && U.tier, U); }
if (K6) { const B = K6.bar;
  check(`the barricade: rock to the bash out of reach (${B.far}) or behind you (${B.behind}), two blows crack it and the third breaks it, kept; its chest at the floor's tier (${B.left[0]} in it, ${B.left[1]} left)`, B.shut && B.far === 0 && B.behind === 0 && B.two === 2 && B.twoShut && B.three && B.kept && B.tier && B.left[1] === B.left[0] - 1, B);
  check('Caor touched at the barricade burns it away', B.found && B.burn && B.notThing, B); }
// S2418 — the lift, in a real gate with a chasm (the medium gate at seed 428, steady, its lift on floor one): the lever held 6 s (let go,
// what is wound is kept), the second bridge lowered in 4 s and walked onto over the chasm's air; then Séideán's bolt into the vane
const liftP = await page.evaluate(() => { const p = PORTALS.find(q => q && q.seed === 428 && q.zone === 'world'); if (!p) return null; px = p.x; pz = p.z + 3; goToDungeon(p); return true; });
if (liftP) {
  await page.waitForFunction(() => String(lid).startsWith('dyn_') && currentPortal && currentPortal.seed === 428 && document.getElementById('fd').style.opacity === '0', null, { timeout: 120000, polling: 200 });
  await g.hide();
  const L = await page.evaluate(() => { const o = {}, yawTo = (x, z) => Math.atan2(-(x - px), -(z - pz)); let r = GATE_SECRETS.find(q => q.kind === 'lift'); o.found = !!r && !!r.bridge; if (!o.found) return o;
    currentFloor = r.floor; const B = r.bridge, bx = (B.x0 + B.x1) / 2, bz = (B.z0 + B.z1) / 2, ground = (x, z) => footholdY(x, z, r.y, dPitBase(x, z, r.y));
    o.hang = B.h; o.air = dAirAt(bx, bz); o.pitBefore = ground(bx, bz) < r.y - 20; o.noChest = !r.chest;
    const Lv = r.lever, cx = (r.area.x0 + r.area.x1) / 2, cz = (r.area.z0 + r.area.z1) / 2, dl = Math.hypot(cx - Lv.x, cz - Lv.z) || 1; _reset(Lv.x + (cx - Lv.x) / dl * 1.1, Lv.z + (cz - Lv.z) / dl * 1.1, r.y, 0);
    yaw = yawTo(Lv.x, Lv.z); _drive(i => i >= 1, 3); pitch = Math.atan2(Lv.y - CAM.position.y, Math.hypot(Lv.x - px, Lv.z - pz)); _drive(i => i >= 1, 3);
    o.prompt = document.getElementById('ipr').textContent; o.aimed = liftLeverNear() === r;
    interact(); K.KeyE = true; for (let i = 0; i < 6; i++) { playClockS += .5; gateSecretsTick(); } K.KeyE = false; playClockS += .5; gateSecretsTick(); o.three = +Lv.wound.toFixed(2); o.letGo = !LIFT_HOLD;
    playClockS += 10; gateSecretsTick(); o.kept = +Lv.wound.toFixed(2);
    interact(); K.KeyE = true; for (let i = 0; i < 7; i++) { playClockS += .5; gateSecretsTick(); } K.KeyE = false; o.open = r.opened; o.rec = worldState.gateSecrets[currentPortal.seed].o.includes(r.n);
    playClockS += 2; gateSecretsTick(); o.mid = +B.h.toFixed(2); o.notYet = !FOOTHOLDS.includes(B.hold); playClockS += 2.1; gateSecretsTick(); o.down = B.h; o.hold = FOOTHOLDS.includes(B.hold); o.groundAfter = +(ground(bx, bz) - r.y).toFixed(2);
    // walked onto it from its first end: 12 m along, over the chasm's air, the feet at the deck's height
    const ax = (B.x1 - B.x0) > (B.z1 - B.z0), sx = ax ? (B.x0 + .2) : bx, sz = ax ? bz : (B.z0 + .2), end = ax ? [B.x0 - 1.5, bz] : [bx, B.z0 - 1.5];
    const startEnd = ground(end[0], end[1]) === r.y ? 0 : 1; const fx = startEnd ? (ax ? B.x1 - .2 : bx) : sx, fz = startEnd ? (ax ? bz : B.z1 - .2) : sz, dir = startEnd ? -1 : 1;
    _reset(fx, fz, r.y, 0); yaw = yawTo(px + (ax ? dir : 0), pz + (ax ? 0 : dir)); pitch = 0; K.KeyW = true; let minY = 9, over = 0;
    _drive(() => { minY = Math.min(minY, jumpY); if (dAirAt(px, pz)) over++; return Math.hypot(px - fx, pz - fz) > 12; }, 600); K.KeyW = false;
    o.walk = { far: +Math.hypot(px - fx, pz - fz).toFixed(1), minY: +(minY - r.y).toFixed(2), over };
    // the vane, the lift rebuilt shut
    for (const q of GATE_SECRETS) if (q.group.parent) q.group.parent.remove(q.group);
    for (let i = FOOTHOLDS.length - 1; i >= 0; i--) if (FOOTHOLDS[i].secret) FOOTHOLDS.splice(i, 1);
    for (let i = DUNGEON_PROPS.length - 1; i >= 0; i--) if (DUNGEON_PROPS[i].secret) DUNGEON_PROPS.splice(i, 1);
    for (const q of GATE_SECRETS) if (q.chest) { const i = CHESTS.indexOf(q.chest); if (i >= 0) CHESTS.splice(i, 1); if (q.chest.mesh.parent) q.chest.mesh.parent.remove(q.chest.mesh); }
    delete worldState.gateSecrets[currentPortal.seed]; gateSecretsBuild(GATE_SECRETS_GEN, currentPortal); r = GATE_SECRETS.find(q => q.kind === 'lift'); const V = r.vane;
    const bolt = id => ({ userData: { spell: { id } }, position: new THREE.Vector3(V.x + .3, V.y + .1, V.z) });
    o.caor = liftVaneHit(bolt('caor')); o.wide = liftVaneHit({ userData: { spell: { id: 'sideen' } }, position: new THREE.Vector3(V.x + 1.5, V.y, V.z) });
    o.vane = liftVaneHit(bolt('sideen')); gateSecretsTick(); o.notAtOnce = !r.opened; playClockS += 1; gateSecretsTick(); o.vaneOpen = r.opened; playClockS += 4.1; gateSecretsTick(); o.vaneDown = r.bridge.h === 0;
    return o; });
  console.log('lift', JSON.stringify(L));
  check(`the lift: in its room a chain into a pan, a lever and a vane, no chest; its bridge hangs ${L.hang} m over the chasm, whose air is a pit under it; the lever aimed at (${L.prompt})`, L.found && L.hang === 8 && L.air && L.pitBefore && L.noChest && L.aimed && /wind the lever/.test(L.prompt), L);
  check(`the lever winds only while E is held: ${L.three} s, let go and kept (${L.kept}), 6 s in all lets the bridge down, kept in the world's record; ${L.mid} m up at 2 s, down at 4 and a floor over the air (${L.groundAfter})`, L.three === 3 && L.letGo && L.kept === 3 && L.open && L.rec && L.mid > 0 && L.mid < 8 && L.notYet && L.down === 0 && L.hold && L.groundAfter === 0, L);
  check(`walked onto the bridge ${L.walk && L.walk.far} m from its end over the chasm's air (${L.walk && L.walk.over} frames), the feet never below the deck (${L.walk && L.walk.minY})`, L.walk && L.walk.far >= 12 && L.walk.over > 30 && L.walk.minY > -.05, L.walk);
  check('Séideán sent into the vane lets the bridge down after 1 s spinning; another word, or a bolt 1.5 m off, does nothing', !L.caor && !L.wide && L.vane && L.notAtOnce && L.vaneOpen && L.vaneDown, L);
}
// S2470 — the shortcut back (Michael's B on #1774): in a large or massive gate the last mechanism slot is a sliding wall through one
// wall cell, from a cell as deep as the ring to one at most half as deep, where one fits (7 of 200 when asked); opened from the deep side
const CUT = await page.evaluate(() => { const out = { n: 0, fit: [], bad: [] };
  for (let i = 0; i < 200; i++) { const size = i % 2 ? 'massive' : 'large', seed = 3000 + 7919 * i; out.n++;
    const one = () => { const gen = makeGate(size, seed); gateThings(gen, seed); gateSecrets(gen, seed, size, SECRET_SCHOOLS[i % 6]); return gen; };
    const a = one(), b = one(), sc = a.secrets.find(q => q.shortcut); if (!sc) continue;
    const raw = makeGate(size, seed), M = sc.floor === 2 ? raw.map2 : raw.map, w = [sc.c + sc.dc, sc.r + sc.dr], bb = [sc.c + 2 * sc.dc, sc.r + 2 * sc.dr];
    const ok = JSON.stringify(a.secrets) === JSON.stringify(b.secrets) && a.secrets.indexOf(sc) === a.secrets.length - 1 && sc.id === seed + ':' + sc.floor + ':secret' + sc.n
      && M[w[1]][w[0]] === 0 && M[sc.r][sc.c] === 1 && M[bb[1]][bb[0]] === 1 && (sc.floor === 2 ? a.map2 : a.map)[w[1]][w[0]] === 1 && sc.save >= 30;
    out.fit.push([seed, size[0], sc.save]); if (!ok) out.bad.push(seed); }
  return out; });
console.log('shortcuts', JSON.stringify(CUT));
check(`the shortcut back fits ${CUT.fit.length} of ${CUT.n} large and massive gates, the last slot, through one wall cell of rock, saving ${Math.min(...CUT.fit.map(f => f[2]))} to ${Math.max(...CUT.fit.map(f => f[2]))} cells; the same twice`, CUT.fit.length >= 3 && CUT.fit.length <= 15 && !CUT.bad.length, CUT);
const cutP = await page.evaluate(() => { const t = PORTALS.find(q => q && q.zone === 'world' && q.size === 'large' && !q.lair && !q.tutorial && q.seed != null); if (!t) return null;
  const p = Object.assign({}, t, { seed: 82190, size: 'large' }); px = p.x; pz = p.z + 3; if (worldState.gateSecrets) delete worldState.gateSecrets[82190]; goToDungeon(p); return true; });
if (cutP) {
  await page.waitForFunction(() => String(lid).startsWith('dyn_') && currentPortal && currentPortal.seed === 82190 && document.getElementById('fd').style.opacity === '0', null, { timeout: 120000, polling: 200 });
  await g.hide();
  const C = await page.evaluate(() => { const o = { cell: DCELL }, r = GATE_SECRETS.find(q => q.shortcut); o.found = !!r; if (!r) return o; currentFloor = r.floor;
    const yawFT = (fx, fz, tx, tz) => Math.atan2(-(tx - fx), -(tz - fz)), d = [r.sdc, r.sdr], ax = dAt(r.c), az = dAt(r.r), wx = ax + d[0] * DCELL, wz = az + d[1] * DCELL, bx = wx + d[0] * DCELL, bz = wz + d[1] * DCELL;
    o.shut = DUNGEON_PROPS.includes(r.solid) && !r.chest && !!r.back && dMap[dCellOf(wz)][dCellOf(wx)] === 1;
    const walk = (fx, fz, tx, tz) => { _reset(fx, fz, r.y, yawFT(fx, fz, tx, tz)); K.KeyW = true; _drive(() => Math.hypot(px - fx, pz - fz) > 2 * DCELL, 240); K.KeyW = false; return +Math.hypot(px - fx, pz - fz).toFixed(2); };
    o.blockedA = walk(ax, az, wx, wz); o.blockedB = walk(bx, bz, wx, wz);
    // from the shallow side, at the far slab, aimed at the wall: nothing offered; from the deep side, at the pale stone: offered
    const st = r.stone, sbx = bx - d[0] * (DCELL / 2 - .9), sbz = bz - d[1] * (DCELL / 2 - .9); _reset(sbx, sbz, r.y, yawFT(sbx, sbz, wx, wz)); _drive(i => i >= 1, 3); o.fromB = !slideStoneNear();
    _reset(st.x - d[0] * 1.0, st.z - d[1] * 1.0, r.y, yawFT(st.x - d[0], st.z - d[1], st.x, st.z)); _drive(i => i >= 1, 3); pitch = Math.atan2(st.y - CAM.position.y, 1.0); _drive(i => i >= 1, 3);
    o.fromA = slideStoneNear() === r; interact(); for (let i = 0; i < 4; i++) { playClockS += .5; gateSecretsTick(); }
    o.open = r.opened && !r.shut.visible && !DUNGEON_PROPS.includes(r.solid) && worldState.gateSecrets[82190].o.includes(r.n); pitch = 0;
    o.through = walk(ax, az, bx, bz); return o; });
  console.log('shortcut', JSON.stringify(C));
  check('the shortcut is laid in seed 82190 (large): its wall cell open in the map but solid, a slab flush with each wall, no chest', C.found && C.shut, C);
  check(`shut, it stops you from either side (${C.blockedA} m and ${C.blockedB} m walked)`, C.blockedA < C.cell && C.blockedB < C.cell, C);
  check('from the shallow side it is plain wall; from the deep side the pale stone opens it, kept in the world\'s record', C.fromB && C.fromA && C.open, C);
  check(`open, you walk through the wall from the deep side to the shallow (${C.through} m)`, C.through >= 2 * C.cell - .1, C);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
