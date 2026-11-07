// Damage numbers (Session 761, Michael's A on DECISION #198, the concept artist's docs/prototypes/hud/ on auto/concept): a blow you
// land rises as a number at the struck foe's head, its kind in its colour, and is gone in 0.9 s; the bottom centre no longer says
// *Hit Bandit for 21!* or *Swing!*. Played with real swings through the loop's own tick at fixed 1/60 (the draw held off, as
// `captainguard` does): a Bandit in Dunmore's street at noon, then a foe in a gate.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
await page.evaluate(() => { window._drive = (step, max) => {
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(), n = 0;
  try { for (; n < max; n++) { if (step()) break; t += 1000 / 60; loop(t); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  return n; };
  window._msgs = []; const _m = showMsg; showMsg = function (tx) { window._msgs.push(String(tx)); return _m.apply(this, arguments); };
  // one real swing at e: the attack on the click, resolved when the loop's swing crosses its impact point
  window._swing = (e, keep) => { const face = () => { yaw = Math.atan2(-(e.x - px), -(e.z - pz)); pitch = -.05; };
    keep(); face(); atkCd = 0; attack(false); let n = 0; _drive(() => { keep(); face(); return ++n > 3 && (!_pendingStrike || _pendingStrike.fired); }, 120); };
  window._nums = () => [...document.querySelectorAll('#dmgnums .dn')].map(el => ({ cls: el.className, text: el.firstChild ? el.firstChild.textContent : '',
    word: (el.querySelector('.sm') || {}).textContent || '', left0: el.getBoundingClientRect().left, right0: el.getBoundingClientRect().right, shown: el.style.display !== 'none', x: parseFloat(el.style.left), y: parseFloat(el.style.top), col: getComputedStyle(el).color })); });

// 1. the kinds, from the strike's own info
const kinds = await page.evaluate(() => { const e = { name: 'X', def: 2 }, k = (i, o) => { const r = dmgNumKind(i, e, o); return r.kind + '/' + r.word; };
  return { plain: k({ resistMult: 1 }), weak: k({ resistMult: 1.4 }), very: k({ resistMult: 1.5 }), res: k({ resistMult: .5 }), back: k({ resistMult: 1, backstab: true }),
    rip: k({ resistMult: 1, crit: true, riposte: true }), fin: k({ resistMult: 1, crit: true, finisher: true, backstab: true }), luck: k({ resistMult: 1, crit: true, lucky: true }),
    stag: k({ resistMult: 1, crit: true }), guard: k({ resistMult: 1.4 }, { guarded: true }), pierce: k({ resistMult: 1, defPierced: true }), power: k({ resistMult: 1 }, { power: true }) }; });
check('the kinds: plain, weak, resisted, from behind, critical (finisher, riposte, lucky, staggered), guarded', kinds.plain === '/' && kinds.weak === 'weak/weak' && kinds.very === 'weak/very weak'
  && kinds.res === 'res/resisted' && kinds.back === 'back/from behind' && kinds.rip === 'crit/riposte' && kinds.fin === 'crit/finisher' && kinds.luck === 'crit/lucky'
  && kinds.stag === 'crit/staggered' && kinds.guard === 'res/guarded' && kinds.pierce === '/armour pierced' && kinds.power === '/power', kinds);

// 2. a real swing at a Bandit in the street: one number at its head, the damage it took, and no line at the bottom
const street = await page.evaluate(() => {
  forceTime(12); PHP = maxHP; dead = false; PPOST.stagUntil = 0; thirdPerson = false;
  EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3, atk: [8, 12] }; buildViewmodel();
  const t = WORLD.siteAnywhere('dunmore'); let S = null;
  const clear = (x, z) => !WORLD.solidAt(x, z) && WORLD.worldH(x, z) > 0;
  for (let rr = 4; rr < 60 && !S; rr += 1) for (let a = 0; a < 32 && !S; a++) { const x = t.x + Math.cos(a / 32 * Math.PI * 2) * rr, z = t.z + Math.sin(a / 32 * Math.PI * 2) * rr; let ok = true;
    for (let k = 0; k < 16 && ok; k++) for (const d of [1, 2, 3]) if (!clear(x + Math.cos(k / 16 * Math.PI * 2) * d, z + Math.sin(k / 16 * Math.PI * 2) * d)) { ok = false; break; } if (ok) S = { x, z }; }
  if (!S) return { noSpot: true };
  px = S.x; pz = S.z + 1.3;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], S.x, S.z, 'Bandit', null)); e.alert = true; ZONES.world.enemies.push(e); e.hp = e.maxHp = 1000; e.def = 0;
  const keep = () => { PHP = maxHP; dead = false; PPOST.stagUntil = 0; stamina = maxStamina; e.telegraphT = 0; };
  const out = {}; let lastDmg = null; const _a = applyMeleeDamage;
  applyMeleeDamage = function (who) { const r = _a.apply(this, arguments); if (who === e) lastDmg = r.dmg; return r; };
  try {
    window._msgs.length = 0; DMG_NUMS.length = 0; document.getElementById('dmgnums').textContent = '';
    const hp0 = e.hp; _swing(e, keep); out.took = hp0 - e.hp; out.dmg = lastDmg; out.nums = _nums(); out.msgs = window._msgs.slice();
    // where its head is on the screen now, against where the number stands
    const v = new THREE.Vector3(); e.hpFg.getWorldPosition(v); v.project(CAM); const r = REN.domElement.getBoundingClientRect();
    out.head = { x: r.left + (v.x * .5 + .5) * r.width, y: r.top + (-v.y * .5 + .5) * r.height }; out.screen = { w: r.width, h: r.height };
    const d = DMG_NUMS[DMG_NUMS.length - 1]; out.age = d ? +((performance.now() - d.t0) / 1000).toFixed(2) : null;
    // the rise and the fade, read at set ages (the number's clock is the page's, so its ages are set, not waited for)
    if (d) { placeDmgNum(d, d.t0); out.y0 = d.y; out.o0 = +d.el.style.opacity; placeDmgNum(d, d.t0 + 450); out.y45 = d.y; out.o45 = +d.el.style.opacity;
      placeDmgNum(d, d.t0 + 800); out.o80 = +d.el.style.opacity; out.y80 = d.y;
      const pn = performance.now; performance.now = () => d.t0 + 950; try { tickDmgNums(); } finally { performance.now = pn; } out.after = _nums().length; out.left = DMG_NUMS.length; }
    // a miss: nothing at all, no *Swing!*
    window._msgs.length = 0; px = S.x + 6; pz = S.z + 6; const face = yaw; atkCd = 0; attack(false); let n = 0;
    _drive(() => { keep(); yaw = face + Math.PI; return ++n > 3 && (!_pendingStrike || _pendingStrike.fired); }, 120); out.missMsgs = window._msgs.slice(); out.missNums = _nums().length;
    // a rune's rider: Flames on the blade, a second number beside the first, in the fire's colour
    px = S.x; pz = S.z + 1.3; EQ.weapon.enchant = WEAPON_ENCHANTS.find(w => w.id === 'fire'); window._msgs.length = 0; DMG_NUMS.length = 0; document.getElementById('dmgnums').textContent = '';
    _swing(e, keep); out.fire = _nums(); out.fireDmg = lastDmg; out.fireMsgs = window._msgs.slice(); delete EQ.weapon.enchant;
    // from behind: a backstab rises as one
    DMG_NUMS.length = 0; document.getElementById('dmgnums').textContent = ''; e.combatYaw = 0; e.alert = false; e.ry = 0; if (e.mesh) e.mesh.rotation.y = 0;
    out.behindTest = typeof isPlayerBehind === 'function';
    // a fresh foe for it (S963): the three blows before it drain its posture (the resolver's row and the chain's third ×1.5), and how
    // much the regen gives back between them is the runner's wall clock; a broken guard is a crit, whose word wins over *from behind*
    if (typeof e.maxPosture === 'number') e.posture = e.maxPosture; e._finUntil = 0; staggered = staggered.filter(s => s.e !== e); CHAIN.n = 0;
    // behind it, facing it
    px = e.x - Math.sin(0) * 1.3; pz = e.z - Math.cos(0) * 1.3; const k2 = () => { keep(); e.alert = false; e.combatYaw = 0; };
    out.isBehind = isPlayerBehind(e); _swing(e, k2); out.back = _nums();
    // a foe behind the camera: its number is not drawn
    DMG_NUMS.length = 0; document.getElementById('dmgnums').textContent = ''; yaw = Math.atan2(e.x - px, e.z - pz); CAM.rotation.y = yaw; CAM.updateMatrixWorld(true);
    dmgNum(e, 7, { resistMult: 1 }); out.behindCam = _nums();
  } finally { applyMeleeDamage = _a; e.dead = true; WORLD.scene.remove(e.mesh); ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1); }
  return out; });
if (street.noSpot) check('a clear spot in Dunmore', false, street);
const n0 = street.nums && street.nums[0];
check('a real swing at a Bandit raises one number, the damage it took', street.took > 0 && street.nums.length === 1 && n0.text === String(street.took) && street.dmg === street.took, street);
check('the number stands on its head on the screen (within 40 px across, and no more than 30 above it)', n0 && n0.shown && Math.abs(n0.x - street.head.x) < 40 && n0.y <= street.head.y + 2 && n0.y > street.head.y - 30, { n0, head: street.head });
check('a plain blow is plain: no kind, no word, the paper colour', n0 && n0.cls === 'dn' && n0.word === '' && n0.col === 'rgb(246, 236, 212)', n0);
check('the bottom centre says nothing of the blow', street.msgs.every(m => !/Hit |for \d|Swing!/.test(m)), street.msgs);
check('it rises 40 px over its 0.9 s and fades from halfway', Math.abs((street.y0 - street.y45) - 20) < 1 && street.o0 === 1 && street.o45 > .85 && street.o80 > 0 && street.o80 < .4 && Math.abs((street.y0 - street.y80) - 35.6) < 1, street);
check('and is gone at 0.95 s, its element removed', street.after === 0 && street.left === 0, street);
check('a miss says nothing (*Swing!* is gone) and raises no number', street.missMsgs.every(m => !/Swing!/.test(m)) && street.missNums === 0, street);
const f0 = street.fire && street.fire[0], f1 = street.fire && street.fire[1];
check('Flames: the blow, then *+N 🔥* in the fire\'s colour beside it, a quarter of the blow', street.fire.length === 2 && f1.cls === 'dn fire' && f1.text === `+${Math.floor(street.fireDmg * .25)} 🔥`
  && f1.col === 'rgb(255, 154, 60)' && f1.y < f0.y && f1.left0 >= f0.right0 && street.fireMsgs.every(m => !/Fire \+/.test(m)), street.fire);
check('from behind: the number in its colour with *from behind* under it', street.isBehind && street.back.length >= 1 && street.back[0].cls === 'dn back' && street.back[0].word === 'from behind', street.back);
check('a foe behind the camera has its number hidden', street.behindCam.length === 1 && !street.behindCam[0].shown, street.behindCam);

// a picture for the eye (docs/prototypes/dmgnums-street.png): a Bandit in the street struck by a riposte with Flames on the blade,
// the numbers held at their first frame (their clock set ahead) while the frame is drawn
if (!street.noSpot) {
  await page.evaluate(() => { const S = { x: px, z: pz - 2.2 }; const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], S.x, S.z, 'Bandit', null)); e.alert = false; e.locked = false; ZONES.world.enemies.push(e); window._picFoe = e;
    e.mesh.rotation.y = Math.atan2(px - e.x, pz - e.z); yaw = Math.atan2(-(e.x - px), -(e.z - pz)); pitch = -.02; thirdPerson = false;
    DMG_NUMS.length = 0; document.getElementById('dmgnums').textContent = ''; });
  await g.frames(3);
  const pic = await page.evaluate(() => { const e = window._picFoe; const a = dmgNum(e, 33, { resistMult: 1, crit: true, riposte: true }), b = dmgNumRider(e, { amt: 8, id: 'fire', ico: '🔥' });
    for (const d of [a, b]) d.t0 = performance.now() + 1e5; tickDmgNums(); const ra = a.el.getBoundingClientRect(), rb = b.el.getBoundingClientRect();
    return { crit: a.el.className, rider: b.el.className, critRight: ra.right, riderLeft: rb.left, shown: a.onScreen && b.onScreen }; });
  await g.frames(2);
  await page.screenshot({ path: 'docs/prototypes/dmgnums-street.png', timeout: 120000 });
  check('a riposte rises large in red with its word, and Flames\' rider stands clear of it to the right', pic.crit === 'dn crit' && pic.rider === 'dn fire' && pic.shown && pic.riderLeft >= pic.critRight, pic);
  await page.evaluate(() => { const e = window._picFoe; e.dead = true; WORLD.scene.remove(e.mesh); ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1); DMG_NUMS.forEach(d => d.el.remove()); DMG_NUMS.length = 0; });
}

// S1960 — a swing at the open world's solids (owed by S1952): a house's wall in Dunmore throws stone, a gate's leaf and a tree their
// wood, a lamp nothing; a house in the Mark is timber
const ow = await page.evaluate(() => { const w0 = EQ.weapon, p0 = [px, pz, jumpY, fwdX, fwdZ]; EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3, atk: [8, 12] };
  const reach = weaponAttack(EQ.weapon).reach, S = [...SETTLE.values()].find(S => S.site.name === 'Dunmore') || [...SETTLE.values()][0];
  const at = s => { const c = s.c !== undefined ? s.c : 1, sn = s.c !== undefined ? s.s : 0, lz = s.rz + .4; px = s.cx + lz * sn; pz = s.cz + lz * c; jumpY = worldH(px, pz);
    const L = Math.hypot(s.cx - px, s.cz - pz); fwdX = (s.cx - px) / L; fwdZ = (s.cz - pz) / L; const B = impactWallAhead(reach);
    return B ? { surf: B.surface, toward: +(-(B.n.x * fwdX + B.n.z * fwdZ)).toFixed(2), d: +Math.hypot(B.at.x - px, B.at.z - pz).toFixed(2) } : null; };
  let tree = null; for (const ch of chunks.values()) for (const s of ch.sol) if (!tree && s.tid != null && s.rx > .2) tree = s;
  const leaf = S.sol.find(s => s.bt === 'gate' && !s.jamb), house = S.sol.find(s => s.hid != null), lamp = S.sol.find(s => s.rx === .12);
  let mark = null; for (let i = 0; i < 12 && !mark; i++) for (let j = 0; j < 12 && !mark; j++) if (nationOf(i, j).people === 'markman') mark = { site: { x: (i + .5) * WORLD.SIZE, z: (j + .5) * WORLD.SIZE } };
  const out = { house: house && at(house), leaf: leaf && at(leaf), tree: tree && at(tree), lamp: lamp ? at(lamp) : 'none', markHouse: mark && impactWorldSurface({ hid: 'x', bt: 'home' }, mark) };
  [px, pz, jumpY, fwdX, fwdZ] = p0; EQ.weapon = w0; IMPACT.list.forEach(impactDrop); IMPACT.list.length = 0; return out; });
check(`a swing at the open world: a house's wall throws stone, a gate's leaf and a tree wood, a lamp nothing; a Mark house is timber (${ow.house && ow.house.surf}, ${ow.leaf && ow.leaf.surf}, ${ow.tree && ow.tree.surf}, ${ow.markHouse})`,
  ow.house && ow.house.surf === 'stone' && ow.house.toward > .9 && ow.leaf && ow.leaf.surf === 'wood' && ow.tree && ow.tree.surf === 'wood' && ow.lamp === null && ow.markHouse === 'wood', ow);

// 3. in a gate: a foe on the floor, a real swing, the number at its head in the dungeon's camera
await enterDungeon(page, { theme: 'ruins', seed: 23, interior: 'cave', size: 'medium' });
const gate = await page.evaluate(() => {
  const e = ENEMIES.find(x => !x.dead && x.floor === currentFloor && x.hpFg && !x.disguise && !x.isBoss); if (!e) return { none: true };
  ENEMIES.forEach(x => { if (x !== e) x.dead = true; }); e.hp = e.maxHp = 1000; e.def = 0; e.resist = {};
  px = e.x; pz = e.z + 1.1; jumpY = 0; EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3, atk: [8, 12] }; buildViewmodel();
  const keep = () => { PHP = maxHP; dead = false; PPOST.stagUntil = 0; stamina = maxStamina; e.telegraphT = 0; e.x = px; e.z = pz - 1.1; };
  window._msgs.length = 0; DMG_NUMS.length = 0; document.getElementById('dmgnums').textContent = '';
  const hp0 = e.hp; _swing(e, keep);
  const v = new THREE.Vector3(); e.hpFg.getWorldPosition(v); v.project(CAM); const r = REN.domElement.getBoundingClientRect();
  const B = IMPACT.list[IMPACT.list.length - 1], imp = { surf: IMPACT.last && IMPACT.last.surface, want: impactSurface(e, {}), inGate: !!B && B.g.parent === dScene, counts: IMPACT.last && IMPACT.last.counts, hold: IMPACT.hold.pending || performance.now() < IMPACT.hold.until };
  return { name: e.name, took: hp0 - e.hp, nums: _nums(), msgs: window._msgs.slice(), imp, head: { x: r.left + (v.x * .5 + .5) * r.width, y: r.top + (-v.y * .5 + .5) * r.height } }; });
const d0 = gate.nums && gate.nums[0];
check(`in a gate, a swing at a ${gate.name} raises its number at its head, and no line`, !gate.none && gate.took > 0 && gate.nums.length === 1 && d0.text === String(gate.took) && d0.shown
  && Math.abs(d0.x - gate.head.x) < 40 && Math.abs(d0.y - gate.head.y) < 60 && gate.msgs.every(m => !/Hit |for \d|Swing!/.test(m)), gate);
// S1949 — impact by surface (#1239 B): the swing threw its surface's burst in the gate, and the 50 ms hold lets the picture go
const held = await page.evaluate(async () => { const a = impactHeld(); await new Promise(r => setTimeout(r, 120)); return { a, b: impactHeld() }; });
check(`the blow on the ${gate.name} threw its surface's burst (${gate.imp && gate.imp.surf}) in the gate, and the 50 ms hold let the picture go`, !gate.none && gate.imp.surf === gate.imp.want && (gate.imp.surf === null || gate.imp.inGate) && gate.imp.hold && held.b === false, { imp: gate.imp, held });
// S1952 — a swing into the gate's rock with no foe in reach throws the stone's burst off the wall's face, its normal toward you
const wall = await page.evaluate(() => { const map = activeMap(), w0 = EQ.weapon; EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3, atk: [8, 12] };
  for (let r = 1; r < dR - 1; r++) for (let c = 1; c < dC - 1; c++) if (map[r][c] === 1 && map[r - 1][c] === 0 && !dSolid(dAt(c), dAt(r))) {
    px = dAt(c); pz = dAt(r); jumpY = 0; fwdX = 0; fwdZ = -1; let d = 0; while (d < 20 && !dSolid(px, pz - d - .35)) d += .05; pz -= d;
    const B = impactWallAhead(weaponAttack(EQ.weapon).reach); EQ.weapon = w0; return { surf: B && B.surface, nz: B && +B.n.z.toFixed(2), inGate: !!B && B.g.parent === dScene }; }
  EQ.weapon = w0; return { none: true }; });
check(`a swing at the gate's rock throws its stone off the wall's face (${wall.surf}, normal ${wall.nz})`, wall.surf === 'stone' && wall.nz > .9 && wall.inGate, wall);
// S1951 — a foe's blow on you: a shield throws its wood at your arm, 0.6 m out toward the foe; a light chest throws nothing
const you = await page.evaluate(() => { const e = { x: px - Math.sin(yaw) * 1.2, z: pz - Math.cos(yaw) * 1.2, name: 'Bandit' }, sh0 = EQ.offhand, ch0 = EQ.chest;
  EQ.offhand = makeItem(2, ARMOR_TYPES.find(t => t.type === 'Buckler'), null, true); const B = impactOnYou(e, 'block');
  EQ.chest = makeItem(2, lineType('light', 'chest'), null, true); const L = impactOnYou(e, 'hit'); EQ.offhand = sh0; EQ.chest = ch0;
  return { surf: B && B.surface, d: B && +Math.hypot(B.at.x - px, B.at.z - pz).toFixed(2), light: L && L.surface }; });
check(`a foe's blow on your shield throws its wood at your arm (${you.surf}, ${you.d} m out), and on a light chest nothing`, you.surf === 'wood' && Math.abs(you.d - .6) < .02 && you.light == null, you);
// S1955 — bone and fur (owed by S1949): a Skeleton throws bone, a beast in a coat its hair (tufts that drift, in the coat's colour)
const fb = await page.evaluate(() => { const S = n => impactSurface({ baseType: n }, {}); const surf = Object.fromEntries(['Skeleton', 'Wolf', 'Snow Wolf', 'Cave Bear', 'Boar', 'Bandit', 'Golem', 'Deserter'].map(n => [n, S(n)]));
  const e = { x: px - Math.sin(yaw) * 1.2, z: pz - Math.cos(yaw) * 1.2, baseType: 'Snow Wolf' }, B = impactAt(e, { hold: false }), T = B && B.bits.find(b => b.kind === 'tuft'), c = new THREE.Color();
  if (T) T.im.getColorAt(0, c); return { surf, counts: B && B.counts, coat: +c.r.toFixed(2) }; });
check(`a Skeleton throws bone and a wolf, a bear and a boar their fur; a Snow Wolf's tufts are pale (${fb.coat})`, fb.surf.Skeleton === 'bone' && ['Wolf', 'Snow Wolf', 'Cave Bear', 'Boar'].every(n => fb.surf[n] === 'fur')
  && fb.surf.Bandit === 'flesh' && fb.surf.Golem === 'stone' && fb.surf.Deserter === 'steel' && fb.counts && fb.counts.tuft === 10 && fb.counts.drop === 5 && fb.coat > .6, fb);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
