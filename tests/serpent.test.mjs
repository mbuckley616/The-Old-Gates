// The sea serpent (Session 2651; the sea that pushes back, session 4: Michael's B on #1925 and B on #2012, 11 m/s;
// `docs/design/the-sea-that-pushes-back-build.md`). The roll is 1 in 250 per chunk-hour key, ×2 in a storm's sea, ×0.5 with its skull;
// it never rises by a black sail or within 20 game hours of its last rise. Risen, it swims at 11 m/s and never over a bed shallower than
// 4 m; within 25 m it tells for 2.5 s and strikes a 9 m circle where she would be 1.0 s into the tell: 15 hull on a still ship, nothing on
// a ship holding her course at 7 m/s. Up 60 s, down 90, up once more if she is near, then gone. Ticked at fixed 1/60 steps in one evaluate.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const roll = await page.evaluate(() => { let n = 0; for (let i = 0; i < 100; i++) for (let j = 0; j < 100; j++) if (serpentRolls(i, j, 3, 14, 1 / 250)) n++;
  let k = 0; for (let i = 0; i < 100; i++) for (let j = 0; j < 100; j++) if (serpentRolls(i, j, 3, 14, 2 / 250)) k++;
  return { n, k, same: serpentRolls(7, 9, 4, 10, .5) === serpentRolls(7, 9, 4, 10, .5) }; });
check(`the roll: ${roll.n} rises in 10,000 keys at 1 in 250 (40 ±15%), ${roll.k} at ×2; one key gives one answer`, roll.n >= 34 && roll.n <= 46 && roll.k >= 68 && roll.k <= 92 && roll.same, roll);

// an open-water spot with a straight 400 m run of deep water ahead, far from any port
const spot = await page.evaluate(() => { const ports = allPorts(); const o = { tried: 0, open: 0 };
  for (const P of ports) for (let r = 600; r <= 3000; r += 300) for (let q = 0; q < 16; q++) { const x = P.x + Math.cos(q * Math.PI / 8) * r, z = P.z + Math.sin(q * Math.PI / 8) * r; o.tried++;
    if (!openWater(x, z)) continue; o.open++; if (ports.some(t => Math.hypot(t.x - x, t.z - z) < 400)) continue;
    for (let a = 0; a < 8; a++) { const yaw = a * Math.PI / 4, fx = -Math.sin(yaw), fz = -Math.cos(yaw); let ok = true;
      for (let d = -120; d <= 400 && ok; d += 10) if (!(worldH(x + fx * d, z + fz * d) < -6)) ok = false;
      if (ok) return { x, z, yaw }; } }
  console.log('no spot', JSON.stringify(o));
  return null; });
check('an open-water spot with 400 m of deep water ahead', !!spot, spot);

const res = await page.evaluate(async (at) => { const o = {}; const S = WORLD.ship; WORLD.wx.type = 'clear'; WORLD.wx.next = 'clear'; WORLD.wx.k = 1;
  WORLD.spawnShip(at.x, at.z, at.yaw); S.x = at.x; S.z = at.z; S.yaw = at.yaw; S.sailing = true; S.speed = 0; worldState.ship.hull = 100; worldState.ship.cls = 'sloop'; px = S.x; pz = S.z;
  for (const c in HELD_KEYS) HELD_KEYS[c] = false;
  const hull = () => shipBars().hull, step = (n, v) => { for (let i = 0; i < n; i++) { if (v) { S.x += -Math.sin(S.yaw) * v / 60; S.z += -Math.cos(S.yaw) * v / 60; S.speed = v; } else S.speed = 0; px = S.x; pz = S.z; serpentTick(1 / 60); } };
  // the bars and the odds
  SERP.last = -1e9; serpDrop(); o.bar0 = serpentBar(S.x, S.z); o.odds = serpentOdds(S.x, S.z); o.uisce = serpUisceNear(S.x, S.z);
  WORLD.wx.type = 'storm'; WORLD.wx.next = 'storm'; o.storm = serpentOdds(S.x, S.z); WORLD.wx.type = 'clear'; WORLD.wx.next = 'clear';
  OTHER.push({ kind: 'pirate', x: S.x + 100, z: S.z, dead: false }); o.barBlack = serpentBar(S.x, S.z); OTHER.pop();
  // the hook: the sailing tick asks for her chunk
  SERP.chunk = null; WORLD.tick(1 / 60, performance.now()); o.hooked = SERP.chunk === Math.floor(S.x / CHUNK) + ',' + Math.floor(S.z / CHUNK); S.x = at.x; S.z = at.z; S.speed = 0;
  // a still ship: it rises, swims at 11, tells, strikes for 15
  serpDrop(); SERP.last = -1e9; o.rose = serpentRise(null, false); const O = SERP.on; o.d0 = Math.hypot(O.x - S.x, O.z - S.z); o.barRest = serpentBar(S.x, S.z);
  const x0 = O.x, z0 = O.z; step(60); o.speed = Math.hypot(O.x - x0, O.z - z0);
  let deep = true; const h0 = hull(); let t = 0; while (!(O.tells >= 1 && !O.tell) && t < 1800) { step(1); t++; if (!(worldH(O.x, O.z) < SEA_Y - 4)) deep = false; }
  o.stillHit = h0 - hull(); o.tellAt = t; o.strikes = O.strikes;
  // a ship holding her course at 7 m/s
  worldState.ship.hull = 100; const h1 = hull(), n1 = O.tells; t = 0; while (!(O.tells >= n1 + 1 && !O.tell) && t < 1500) { step(1, 7); t++; } o.runHit = h1 - hull(); o.runTells = O.tells - n1;
  // up 60 s, then down 90 with her near: a second rise; then down again and gone
  S.speed = 0; let g = 0; while (SERP.on && SERP.on.phase === 'up' && g < 60 * 70) { step(1); g++; } o.upFor = (O.t, g); o.down = SERP.on && SERP.on.phase === 'down'; o.hidden = !SERP.g.visible;
  step(90 * 60 + 2); o.rises = SERP.on && SERP.on.rises; o.up2 = SERP.on && SERP.on.phase === 'up';
  step(64 * 60); step(91 * 60); o.gone = !SERP.on; /* S2656 — 60 s up, a tell in flight may hold the dive 2.5 s */
  return o; }, spot);
console.log('  serpent:', JSON.stringify(res));
check(`it may rise in open water far from a port, at 1 in 250 (×3 here by an Uisce gate: ${res.uisce}); a storm doubles it; a black sail within 140 m bars it`, res.bar0 === null && Math.abs(res.odds - (res.uisce ? 3 : 1) / 250) < 1e-9 && Math.abs(res.storm - 2 * res.odds) < 1e-9 && res.barBlack === 'black sail', res);
check('the sailing tick rolls for the chunk she is in', res.hooked, res);
check('it rises 60 to 90 m off her, and not again within 20 hours', res.rose && res.d0 >= 59 && res.d0 <= 91 && res.barRest === 'rest', res);
check(`it swims at 11 m/s (${res.speed.toFixed(2)} m in a second)`, Math.abs(res.speed - 11) < .05, res);
check('a tell then a strike on a still ship costs 15 hull', res.stillHit === 15 && res.strikes === 1, res);
check('a ship holding her course at 7 m/s is clear of the strike', res.runTells >= 1 && res.runHit === 0, res);
check('up, then down; near her it rises once more, and after the second dive it is gone', res.down && res.hidden && res.rises === 2 && res.up2 && res.gone, res);

// the shallows: led toward a bed shallower than 4 m, it turns along the line and never crosses it
const shoal = await page.evaluate(() => { const ports = allPorts();
  for (const P of ports) for (let r = 200; r <= 1500; r += 100) for (let q = 0; q < 16; q++) { const x = P.x + Math.cos(q * Math.PI / 8) * r, z = P.z + Math.sin(q * Math.PI / 8) * r; if (!(worldH(x, z) < -6)) continue;
    for (let a = 0; a < 8; a++) { const ux = Math.cos(a * Math.PI / 4), uz = Math.sin(a * Math.PI / 4); let sh = null;
      for (let d = 10; d <= 120 && !sh; d += 5) { const h = worldH(x + ux * d, z + uz * d); if (h > -4 && h < -1) sh = { x: x + ux * d, z: z + uz * d }; }
      if (!sh) continue; const O = { x, z, yaw: 0 }; let ok = true, minD = 1e9;
      for (let i = 0; i < 60 * 20; i++) { serpStep(O, sh.x + ux * 30, sh.z + uz * 30, 1 / 60); if (!(worldH(O.x, O.z) < SEA_Y - 4)) ok = false; minD = Math.min(minD, Math.hypot(O.x - sh.x, O.z - sh.z)); }
      return { ok, minD: +minD.toFixed(1), from: [Math.round(x), Math.round(z)] }; } }
  return null; });
check('led at the shallows it never crosses the 4 m line', shoal && shoal.ok, shoal);
// S2656 — session 5: the coil, its health, the ballista, arrows and spells at its head
const fight = await page.evaluate((at) => { const o = {}; const S = WORLD.ship; WORLD.spawnShip(at.x, at.z, at.yaw); S.x = at.x; S.z = at.z; S.yaw = at.yaw; S.sailing = true; S.speed = 0;
  worldState.ship.hull = 100; worldState.ship.rig = 100; px = S.x; pz = S.z; for (const c in HELD_KEYS) HELD_KEYS[c] = false;
  const step = (n, v) => { for (let i = 0; i < n; i++) { S.speed = v || 0; px = S.x; pz = S.z; serpentTick(1 / 60); } };
  // the coil: alongside her at 2 m/s, no tell in hand
  serpDrop(); SERP.last = -1e9; serpentRise(null, false); const O = SERP.on; o.hp0 = O.hp;
  O.x = S.x + Math.cos(S.yaw) * 13; O.z = S.z - Math.sin(S.yaw) * 13; O.cd = 99; const r0 = shipBars().rig;
  step(1, 2); o.coiled = !!O.coil; o.held = serpentHolds() && S.speed === 0; let t = 1; while (O.coil && t < 600) { step(1, 2); t++; }
  o.coilS = +(t / 60).toFixed(2); o.coilRig = r0 - shipBars().rig; o.cdAfter = +O.coilCd.toFixed(2); step(60, 2); o.noRecoil = !O.coil;
  // a hit of 29 leaves the coil; one of 30 breaks it
  O.coilCd = 0; step(1, 0); o.coiled2 = !!O.coil; serpentHit(29, 'Test'); o.after29 = !!O.coil; serpentHit(30, 'Test'); o.after30 = !!O.coil; o.hpHits = O.hp;
  // the ballista lays on its head ahead of her bow; a bolt is 40, a fire bolt 60
  O.hp = 400; O.coilCd = 99; O.cd = 99; const fx = -Math.sin(S.yaw), fz = -Math.cos(S.yaw); O.x = S.x + fx * 45; O.z = S.z + fz * 45; O.yaw = Math.atan2(-fx, -fz); O.phase = 'up';
  gold = 2000; if (!shipFitted('ballista')) fitShip('ballista'); worldState.ship.hold.bolts = 20; BOLTS.t = -1e9; ballistaFireMode(false);
  const hd = serpHead(); o.headD = +Math.hypot(hd.x - S.x, hd.z - S.z).toFixed(1); o.bears = ballistaBears() === SERP_MARK;
  const land = () => { for (const f of BOLTS.fly) f.t0 -= 30; tickBolts(0); };
  o.fire1 = fireBallista(); land(); o.hpBolt = O.hp;
  BOLTS.t = -1e9; ballistaFireMode(true); bagAdd(Object.assign({}, SURV_ITEMS.pitch, { qty: 2 })); o.fire2 = fireBallista(); land(); o.hpFire = O.hp; ballistaFireMode(false);
  const ox = O.x, oz = O.z; O.x = S.x - fz * 45; O.z = S.z + fx * 45; o.bearsAside = ballistaBears() === SERP_MARK; O.x = ox; O.z = oz;
  O.phase = 'down'; o.bearsDown = ballistaBears() === SERP_MARK; o.downHit = serpentHit(40, 'Test'); O.phase = 'up';
  // an arrow at its head: its own damage; one that flies wide strikes nothing
  const h = serpHead(), fb = (dx, u) => ({ position: { x: h.x + dx, y: SEA_Y + 1, z: h.z }, userData: u });
  const hp1 = O.hp; o.arrow = serpentTakes(fb(0, { isArrow: true, arrowDmg: 25, wType: 'pierce' })); o.arrowDmg = hp1 - O.hp; o.arrowWide = serpentTakes(fb(6, { isArrow: true, arrowDmg: 25 }));
  // spells: Tine ×1.5 and Uisce ×0.5 against the same roll on a foe of no resist
  const one = sch => SPELLS.find(s => s.school === sch && !s.status && !s.heal && spellMag(s, 1) > 0);
  O.rng = () => 0; const plain = { resist: {}, def: 0, rng: () => 0 };
  for (const sch of ['tine', 'uisce', 'gaoth']) { const sp = one(sch); if (!sp) { o[sch] = null; continue; } const base = applySpellDamage(plain, sp, 1).dmg, b = O.hp;
    serpentTakes(fb(0, { spell: sp, tier: 1 })); o[sch] = { id: sp.id, base, dealt: b - O.hp }; } delete O.rng;
  serpDrop(); return o; }, spot);
console.log('  fight:', JSON.stringify(fight));
check(`it coils her alongside at 2 m/s: held at no way for ${fight.coilS} s (6), ${fight.coilRig} rig (18), and not again within 10 s`, fight.coiled && fight.held && Math.abs(fight.coilS - 6) < .05 && fight.coilRig === 18 && fight.cdAfter === 10 && fight.noRecoil, fight);
check('a hit of 29 to its head leaves the coil; one of 30 breaks it', fight.coiled2 && fight.after29 && !fight.after30, fight);
check(`it has 400 health; the ballista lays on its head ${fight.headD} m off her bow: a bolt takes 40, a fire bolt 60`, fight.hp0 === 400 && fight.bears && fight.fire1 === true && fight.hpBolt === 360 && fight.fire2 === true && fight.hpFire === 300, fight);
check('the ballista does not bear on its head out of her arc, nor on it while it is down, and a hit while down does nothing', !fight.bearsAside && !fight.bearsDown && fight.downHit === null, fight);
check('an arrow at its head deals its own damage; one 6 m wide strikes nothing', fight.arrow && fight.arrowDmg === 25 && !fight.arrowWide, fight);
const near = (a, b) => Math.abs(a - b) <= 1;
check('a spell at its head deals its own damage: Tine ×1.5, Uisce ×0.5, Gaoth ×1', fight.tine && fight.uisce && fight.gaoth && near(fight.tine.dealt, fight.tine.base * 1.5) && near(fight.uisce.dealt, fight.uisce.base * .5) && fight.gaoth.dealt === fight.gaoth.base, fight);
// S2657 — session 6, slain: three scales and the skull (once), the count; the skull at her bow halves the roll; the scale is brewed, not eaten
const slain = await page.evaluate((at) => { const o = {}; const S = WORLD.ship; WORLD.spawnShip(at.x, at.z, at.yaw); S.x = at.x; S.z = at.z; S.sailing = true; px = S.x; pz = S.z;
  BAG.length = 0; worldState.stats = worldState.stats || {}; const n0 = worldState.stats.serpentsSlain || 0; if (worldState.ship.heads) worldState.ship.heads = worldState.ship.heads.filter(k => k !== 'serpent');
  const scales = () => BAG.filter(b => b && b.name === 'Serpent Scale').reduce((a, b) => a + (b.qty || 1), 0), skulls = () => BAG.filter(b => b && b.figurehead === 'serpent').length;
  serpDrop(); SERP.last = -1e9; serpentRise(null, false); SERP.on.hp = 40; o.hit = serpentHit(40, 'Test'); o.gone = !SERP.on && !SERP.g;
  o.scales = scales(); o.skulls = skulls(); o.count = (worldState.stats.serpentsSlain || 0) - n0;
  serpentRise(null, true); SERP.on.hp = 60; serpentHit(60, 'Test'); o.scales2 = scales(); o.skulls2 = skulls(); o.count2 = (worldState.stats.serpentsSlain || 0) - n0;
  worldState.ship.head = null; const p0 = serpentOdds(S.x, S.z); o.fit = fitHead('serpent'); o.head = shipHead(); o.half = +(serpentOdds(S.x, S.z) / p0).toFixed(3); o.name = headName('serpent'); worldState.ship.head = null;
  const sc = BAG.find(b => b && b.name === 'Serpent Scale'); o.key = herbKeyOf({ name: 'Serpent Scale', type: 'herb' }); o.weight = sc.weight; o.price = sc.buyPrice;
  const q0 = sc.qty; useHerb(BAG.indexOf(sc)); o.notEaten = sc.qty === q0;
  worldState.herbsKnown = { fx: {}, none: {} }; o.unfound = brewUnfound().some(u => u.k === 'serpentscale' && u.name === 'Serpent Scale' && u.known === 0);
  bagAdd({ ...MORTAR_ITEM }); bagAdd({ ...HERB_DEF.kelp.item, qty: 2, _typeKey: 'kelp' }); const r = brewHerbs(['serpentscale', 'kelp']);
  o.brewed = r.made; o.learnt = r.learnt.filter(x => x.startsWith('serpentscale:')).sort(); o.potion = r.item && r.item.name;
  BAG.length = 0; return o; }, spot);
console.log('  slain:', JSON.stringify(slain));
check('slain at 0: it is gone, three Serpent Scales and the Serpent’s Skull in the bag, one counted', slain.hit && slain.gone && slain.scales === 3 && slain.skulls === 1 && slain.count === 1, slain);
check('slain again: three more scales, no second skull', slain.scales2 === 6 && slain.skulls2 === 1 && slain.count2 === 2, slain);
check('the Serpent’s Skull fits at her bow and halves the roll', slain.fit === true && slain.head === 'serpent' && slain.half === .5 && slain.name === 'the Serpent’s Skull', slain);
check('the scale: weight 0.5, 120 gold, known by its name after a reload, never eaten, all four effects unknown until brewed', slain.key === 'serpentscale' && slain.weight === .5 && slain.price === 120 && slain.notEaten && slain.unfound, slain);
check('brewed with kelp it gives up Water Breathing and Slow', slain.brewed && slain.learnt.join() === 'serpentscale:slow,serpentscale:waterBreathing', slain);
// S2662 — session 6, driven off (Michael's A on #2039): judged when a rise ends; at 200 or less it does not rise again and leaves one scale
// floating 60 s, taken by her hull within 8 m or a swimmer within 2 m; ten bolts slay it, five drive it off
const driven = await page.evaluate((at) => { const o = {}; const S = WORLD.ship; WORLD.spawnShip(at.x, at.z, at.yaw); S.x = at.x; S.z = at.z; S.yaw = at.yaw; S.sailing = true; S.speed = 0;
  px = S.x; pz = S.z; BAG.length = 0; worldState.stats = worldState.stats || {}; const d0 = worldState.stats.serpentsDriven || 0, s0 = worldState.stats.serpentsSlain || 0;
  const scales = () => BAG.filter(b => b && b.name === 'Serpent Scale').reduce((a, b) => a + (b.qty || 1), 0);
  const far = () => { S.x = at.x + 2000; S.z = at.z; };
  const rise = (hp) => { serpDrop(); serpScaleDrop(); S.x = at.x; S.z = at.z; SERP.last = -1e9; serpentRise(null, false); const O = SERP.on; O.hp = hp; O.cd = 99; O.coilCd = 99; O.t = SERP_UP - 1 / 60; O.tell = null; return O; };
  const step = (n) => { for (let i = 0; i < n; i++) serpentTick(1 / 60); };
  // five bolts: 200; the rise ends, it is driven off; the scale floats where it went down for 60 s, then is gone
  let O = rise(400); O.coilCd = 99; for (let i = 0; i < 5; i++) serpentHit(SERP_BOLT, 'Test'); o.hp5 = O.hp; const ox = O.x, oz = O.z; far(); step(1);
  o.drivenGone = !SERP.on && !SERP.g; o.float = !!SERP.fl && Math.hypot(SERP.fl.x - ox, SERP.fl.z - oz) < .5; o.count = (worldState.stats.serpentsDriven || 0) - d0;
  step(60 * 59); o.at59 = !!SERP.fl; step(60 * 2); o.at61 = !!SERP.fl; step(60 * 120); o.noRise = !SERP.on; o.bag0 = scales();
  // at 201 it dives as before and may rise again
  O = rise(201); far(); step(1); o.dive201 = !!SERP.on && SERP.on.phase === 'down' && !SERP.fl;
  // at 200 on the second rise: driven off; her hull 7.9 m off takes it, 8.5 m does not
  O = rise(200); far(); step(1); const F = SERP.fl; S.x = F.x + 8.5; S.z = F.z; step(1); o.at85 = !!SERP.fl && scales() === 0; S.x = F.x + 7.9; step(1); o.at79 = !SERP.fl && scales() === 1;
  // a swimmer within 2 m takes it; at 2.5 m not
  BAG.length = 0; O = rise(150); far(); step(1); const G = SERP.fl; const sw = isSwimming; window.isSwimming = () => true; S.sailing = false;
  px = G.x + 2.5; pz = G.z; step(1); o.sw25 = !!SERP.fl; px = G.x + 1.9; step(1); o.sw19 = !SERP.fl && scales() === 1; window.isSwimming = sw; S.sailing = true;
  // ten bolts slay it before the rise ends
  BAG.length = 0; O = rise(400); O.t = 0; for (let i = 0; i < 10; i++) serpentHit(SERP_BOLT, 'Test'); o.slain10 = !SERP.on && !SERP.fl && scales() === 3 && (worldState.stats.serpentsSlain || 0) - s0 === 1;
  o.counted = (worldState.stats.serpentsDriven || 0) - d0; serpDrop(); serpScaleDrop(); BAG.length = 0; return o; }, spot);
console.log('  driven:', JSON.stringify(driven));
check('five bolts leave it at 200; when the rise ends it is driven off, gone, one scale floating where it went down, counted once', driven.hp5 === 200 && driven.drivenGone && driven.float && driven.count === 1, driven);
check('the scale floats 60 s and is then lost; the serpent does not rise again', driven.at59 && !driven.at61 && driven.noRise && driven.bag0 === 0, driven);
check('at 201 when the rise ends it dives as before, no scale', driven.dive201, driven);
check('her hull takes the scale within 8 m (7.9), not at 8.5', driven.at85 && driven.at79, driven);
check('a swimmer takes it within 2 m (1.9), not at 2.5', driven.sw25 && driven.sw19, driven);
check('ten bolts slay it in one rise: three scales, none floating; three drives counted', driven.slain10 && driven.counted === 3, driven);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
