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
    const row = { size, seed, n: S.length, max: SECRET_SEAL_N[size], same: key(S) === key(b.secrets), first: S[0] ? S[0].school : null, school,
      ids: S.every((q, k) => q.id === seed + ':' + q.floor + ':secret' + k), path, free: S.every(q => !things.has(q.floor + ':' + q.room.x + ',' + q.room.y)),
      two: S.length < 2 || S[1].school !== S[0].school };
    out.rows.push(row); if (!(row.same && row.n <= row.max && (!row.n || row.first === school) && row.ids && row.path && row.free && row.two)) out.bad.push(row); }
  return out; });
const R = pure.rows, full = R.filter(r => r.n === r.max).length, none = R.filter(r => !r.n).length;
console.log('pure', JSON.stringify(R.map(r => r.size[0] + r.n + (r.first || '-'))), 'bad', JSON.stringify(pure.bad));
check(`40 gates built twice lay the same seals, ids <seed>:<floor>:secret<n> (${R.filter(r => r.same && r.ids).length} of 40)`, R.every(r => r.same && r.ids), pure.bad);
check(`the table's count or fewer: one a gate, two in a massive one (${full} full, ${none} with none)`, R.every(r => r.n <= r.max) && full >= 30, R.map(r => r.size + ' ' + r.n));
check(`the first seal is the gate's own school, a massive gate's second another (${R.filter(r => r.n && r.first === r.school && r.two).length} of ${R.filter(r => r.n).length})`, R.every(r => !r.n || (r.first === r.school && r.two)), pure.bad);
check(`no seal takes a web's or a pool's room, and with every seal shut the entry still reaches the ring (${R.filter(r => r.path && r.free).length} of 40)`, R.every(r => r.path && r.free), pure.bad);

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
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
