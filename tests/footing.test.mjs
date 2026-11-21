// Ground that pushes back, session 1 (Session 2475; Michael's A on #1800, docs/design/ground-that-pushes-back.md): weather underfoot.
// footingAt(x, z): off a road, on soil, snow from cover 0.5 (the run ×0.9, a sprint's drain ×1.2), deep snow over 0.8 (×0.8, ×1.4, the
// roll ×0.85), mud while it rains and 120 game minutes after (360 after a storm), ×0.9, ×0.85 in heavy rain or a storm; Aurenne's mud
// only after a storm; the road, a stamp, rock and sand firm. A foe on the same ground goes at the same multiplier; the Mark's own
// ignore snow. Ice (Session 2476): a stop slides 1.2 m (1.8 from a sprint), the roll ×1.3. Hobnails (Session 2477) at a smith. Your run, drain and roll are driven through the game's own loop at fixed steps, the draw held off.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => {
  window._drive = (step, max, ms = 1000 / 60) => {
    const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; prevT = t;
    try { for (; n < max; n++) { if (step(n)) break; t += ms; loop(t); } }
    finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
    return n; };
  // weather by hand: the kind, the cover, the history; the cache read again
  window._wx = (type, cover, seen) => { WX.type = type; WX.next = type; WX.k = 1; WX.heavy = 0; WX.nextHeavy = null; WX.cover = cover;
    worldState.wxSeen = seen || {}; _foot.at = -1e9; };
  // a field: soil, off every road and stamp, flat enough, above the shore, not sand; the nearest to (x, z) on a 6 m spiral
  window._field = (x0, z0) => { for (let r = 20; r < 600; r += 6) for (let a = 0; a < 6.28; a += 6 / r) { const x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r;
      if (worldH(x, z) < FOOT.shore + 1) continue; const ri = roadInfo(x, z); if (ri && ri.d < ROAD_HALF + 4) continue; if (stampAt(x, z)) continue;
      let ok = true; for (const [dx, dz] of [[0, 0], [8, 0], [-8, 0], [0, 8], [0, -8], [5, 5], [-5, -5], [5, -5], [-5, 5]]) { if (slopeNormalY(x + dx, z + dz) < .9 || solidAt(x + dx, z + dz) || stampAt(x + dx, z + dz)) ok = false; }
      if (!ok || CLIMATE.sand[specBiome(x, z)]) continue; return [x, z]; } return null; };
});

// 1. the rules at a Gatelands field near the start
const home = await page.evaluate(() => [px, pz]);
const F = await page.evaluate(([x, z]) => _field(x, z), home);
check('a Gatelands field near the start is found', !!F, F);
await page.evaluate(([x, z]) => { px = x; pz = z; }, F); await g.cells();
const R = await page.evaluate(() => { const now = gameMinNow(), k = () => { const f = footingAt(px, pz); return f.k + ' ' + f.run; }, o = {};
  _wx('clear', 0); o.clear = k(); _wx('rain', 0); o.rain = k(); WX.heavy = 1; o.heavy = k(); _wx('storm', 0); o.storm = k();
  _wx('clear', 0, { rain: now - 100 }); o.after100 = k(); _wx('clear', 0, { rain: now - 130 }); o.after130 = k();
  _wx('clear', 0, { rain: now - 300, storm: now - 300 }); o.afterStorm300 = k(); _wx('clear', 0, { rain: now - 400, storm: now - 400 }); o.afterStorm400 = k();
  _wx('snow', .3); o.cover30 = k(); _wx('snow', .6); o.cover60 = k(); _wx('snow', .9); o.cover90 = k(); _wx('rain', .9); o.snowAndRain = k();
  o.isle = nationKeyOf(...cellOf(px, pz)); _wx('clear', 0); return o; });
console.log('rules', JSON.stringify(R));
check('the Gatelands: dry ground firm; rain mud ×0.9; heavy rain and a storm ×0.85', R.isle === 'gatelands' && R.clear === 'firm 1' && R.rain === 'mud 0.9' && R.heavy === 'mud 0.85' && R.storm === 'mud 0.85', R);
check('mud lasts 120 game minutes after the rain and 360 after a storm', R.after100 === 'mud 0.9' && R.after130 === 'firm 1' && R.afterStorm300 === 'mud 0.9' && R.afterStorm400 === 'firm 1', R);
check('snow: cover 0.3 (the north\'s floor) never slows; 0.6 snow ×0.9; 0.9 deep snow ×0.8; snow, not mud, when both', R.cover30 === 'firm 1' && R.cover60 === 'snow 0.9' && R.cover90 === 'deep 0.8' && R.snowAndRain === 'deep 0.8', R);

// 2. the road and the town are firm in a storm and in deep snow
const T = await page.evaluate(() => { const A = allSites(), t = A.filter(t => t.pad > 0 && (t.kind === 'town' || t.kind === 'village' || t.kind === 'city'))
    .sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0]; return [t.x, t.z, t.id]; });
await page.evaluate(([x, z]) => { px = x; pz = z; }, T); await g.cells();
const RT = await page.evaluate(() => { const o = {}; _wx('storm', 0); o.padStorm = footingAt(px, pz).k; _wx('snow', .95); o.padDeep = footingAt(px, pz).k;
  let road = null; for (const s of RSEG) { const x = (s.ax + s.bx) / 2, z = (s.az + s.bz) / 2; if (Math.hypot(x - px, z - pz) < 400 && !stampAt(x, z) && worldH(x, z) > FOOT.shore) { road = [x, z]; break; } }
  o.road = !!road; if (road) { _wx('storm', 0); o.roadStorm = footingAt(...road).k; _wx('snow', .95); o.roadDeep = footingAt(...road).k; }
  _wx('clear', 0); return o; });
check('a town\'s pad and a road are firm in a storm and in deep snow', RT.padStorm === 'firm' && RT.padDeep === 'firm' && RT.road && RT.roadStorm === 'firm' && RT.roadDeep === 'firm', { T, RT });

// 3. Aurenne: rain leaves no mud; a storm and the 360 minutes after it do (the island's rule, read where footingAt reads it)
const RA = await page.evaluate(() => { const now = gameMinNow(), k = () => footMudNow('aurenne'), o = {};
  _wx('rain', 0); o.rain = k(); WX.heavy = 1; o.heavy = k(); _wx('storm', 0); o.storm = k(); _wx('clear', 0, { storm: now - 200 }); o.after = k(); _wx('clear', 0, { rain: now - 10 }); o.afterRain = k();
  _wx('rain', 0); o.gl = footMudNow('gatelands'); _wx('clear', 0); return o; });
check('Aurenne: rain and heavy rain no mud; a storm heavy mud; 200 minutes after a storm mud; after rain none (the Gatelands mud)', RA.rain === 0 && RA.heavy === 0 && RA.storm === 2 && RA.after === 1 && RA.afterRain === 0 && RA.gl === 1, RA);

// 4. your run, a sprint's drain and the roll, through the loop, in the Gatelands field (the loop's ground held flat and clear for the
// measure, as aircap does; footingAt still reads the field's own)
await page.evaluate(([x, z]) => { px = x; pz = z; }, F); await g.cells();
const run = (type, cover, sprint) => page.evaluate(([type, cover, sprint]) => { const x0 = px, z0 = pz;
  for (const k in K) K[k] = false; ROLL = null; FALL.pend = null; PPOST.stagUntil = 0; ACTIVE_BUFFS.length = 0; SPELL_FX.haste = 0;
  SKILLS.athletics = { lv: 5, p: 0 }; ATTRS.swiftness = 0; onGround = true; velY = 0; jumpY = activeTerrainH(px, pz); yaw = 0.7; pitch = 0;
  const H0 = activeTerrainH(px, pz), _ath = activeTerrainH, _sol = currentZoneSolid; activeTerrainH = () => H0; currentZoneSolid = () => false; jumpY = H0;
  let a = null, b = null, sa = 0, sb = 0;
  _drive(i => { PHP = maxHP; WX.cover = cover; WX.type = type; if (!sprint) { stamina = maxStamina; staminaCD = 0; } else if (i === 0) { stamina = maxStamina; staminaCD = 0; }
    K['KeyW'] = true; K['ShiftLeft'] = sprint; if (i === 20) { a = [px, pz]; sa = stamina; } if (i === 80) { b = [px, pz]; sb = stamina; return true; } return false; }, 200);
  activeTerrainH = _ath; currentZoneSolid = _sol; for (const k in K) K[k] = false; const f = footHere(); const o = { v: +(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1).toFixed(3), drain: +(sa - sb).toFixed(3), foot: f.k, pill: footPill() };
  px = x0; pz = z0; return o; }, [type, cover, sprint]);
const W = { dry: await run('clear', 0, false), snow: await run('snow', .6, false), deep: await run('snow', .95, false) };
await page.evaluate(() => _wx('rain', 0)); W.mud = await run('rain', 0, false);
await page.evaluate(() => _wx('clear', 0)); W.sdry = await run('clear', 0, true); W.sdeep = await run('snow', .95, true);
await page.evaluate(() => _wx('rain', 0)); W.smud = await run('rain', 0, true); await page.evaluate(() => _wx('clear', 0));
console.log('runs', JSON.stringify(Object.fromEntries(Object.entries(W).map(([k, v]) => [k, [v.v, v.drain, v.foot]]))));
const near = (a, b, e = .02) => Math.abs(a - b) <= e;
check('the run: snow ×0.9, deep snow ×0.8, mud ×0.9 of the dry field\'s', W.dry.v > 3 && near(W.snow.v / W.dry.v, .9) && near(W.deep.v / W.dry.v, .8) && near(W.mud.v / W.dry.v, .9), W);
// the second's stamina is the drain less the regeneration the loop runs beside it, the same on any ground: so the extra is the drain's
// 0.4 and 0.2 of the dry second's gross (14 a second at Athletics 5), deep snow's twice mud's
const xd = W.sdeep.drain - W.sdry.drain, xm = W.smud.drain - W.sdry.drain;
check('a sprint\'s drain: deep snow costs 0.4 more of the drain, mud 0.2 (deep\'s extra twice mud\'s)', W.sdry.drain > 5 && xd > 4.5 && xd < 6 && near(xd / xm, 2, .05), { xd, xm, dry: W.sdry.drain });
check('the chip: none on dry ground; Deep snow and Mud by name', W.dry.pill === '' && /Deep snow/.test(W.deep.pill) && />Mud</.test(W.mud.pill) && />Snow</.test(W.snow.pill), { dry: W.dry.pill, deep: W.deep.pill });
const RL = await page.evaluate(() => { const o = {}; const roll = () => { ROLL = null; stamina = maxStamina; staminaCD = 0; onGround = true; PPOST.stagUntil = 0; startRoll(performance.now() / 1000, { KeyW: true }); const d = ROLL ? ROLL.dist : null; ROLL = null; return d; };
  _wx('clear', 0); o.dry = roll(); _wx('snow', .95); o.deep = roll(); _wx('snow', .6); o.snow = roll(); _wx('rain', 0); o.mud = roll(); _wx('clear', 0); return o; });
check('the roll: deep snow and mud ×0.85 as far; snow as now', RL.dry > 2 && near(RL.deep / RL.dry, .85, .001) && near(RL.mud / RL.dry, .85, .001) && RL.snow === RL.dry, RL);

// 5. a foe: the same multiplier through the same function; its chase slowed in deep snow; the Mark's own ignore snow, not mud
const FO = await page.evaluate(() => { const o = {}; _wx('snow', .95);
  const e = { name: 'Bandit', x: px, z: pz }, w = { name: 'Snow Wolf', x: px, z: pz }, t = { name: 'Frost Troll', x: px, z: pz };
  o.bandit = foeFootMult(e); o.wolf = foeFootMult(w); o.troll = foeFootMult(t);
  _wx('rain', 0); for (const f of [e, w]) f._footAt = null; o.banditMud = foeFootMult(e); o.wolfMud = foeFootMult(w);
  _wx('clear', 0); e._footAt = null; o.dry = foeFootMult(e); return o; });
check('a foe: deep snow ×0.8, mud ×0.9, dry 1; the Snow Wolf and the Frost Troll ignore snow, the wolf not mud', FO.bandit === .8 && FO.banditMud === .9 && FO.dry === 1 && FO.wolf === 1 && FO.troll === 1 && FO.wolfMud === .9, FO);
// a real chase: a foe of the world's 12 m off, alert, stepping through tickZoneEnemies; the ground under it dry, then deep
const CH = await page.evaluate(() => { const Z = ZONES.world.enemies; const e = Z.find(e => !e.dead && !e.wild && !e.isBoss && !/Archer|Slinger/.test(e.name || '') && e.spd > 0);
  if (!e) return null; const keep = Z.slice(); Z.length = 0; Z.push(e); const o = { name: e.name };
  const leg = (type, cover) => { _wx(type, cover); e._footAt = null; e.x = px + 12; e.z = pz; e.alert = true; e.telegraphT = 0; e.atkCd = 5; e._windup = null; e.locked = false;
    const x0 = e.x; for (let i = 0; i < 30; i++) { WX.cover = cover; PHP = maxHP; tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); } return x0 - e.x; };
  o.dry = leg('clear', 0); o.deep = leg('snow', .95); e.alert = false; e.angry = false; e.x = e.homeX = px + 400; e.z = e.homeZ = pz; Z.length = 0; Z.push(...keep); /* sent home, or it hunts the measures below */ _wx('clear', 0); return o; });
check('a foe\'s chase over the same 30 steps: deep snow ×0.8 of dry', !!CH && CH.dry > .3 && near(CH.deep / CH.dry, .8), CH);

// 6. ice (Session 2476): where it is, then the step through the loop with the ground held flat and the ice under you by hand
const IU = await page.evaluate(() => { const o = {}; onGround = true; started = true; jumpY = activeTerrainH(px, pz); o.field = iceUnderfoot();
  LAID = { kind: 'floe', word: 'sioc', x: px + 3, z: pz, r: 1.5, base: jumpY - .5, top: jumpY, solid: true, until: playClockS + 30, key: laidKey() };
  const x0 = px; px = x0 + 3; o.onFloe = iceUnderfoot(); jumpY += 1; o.above = iceUnderfoot(); jumpY -= 1; px = x0 + 5; o.offFloe = iceUnderfoot(); px = x0;
  LAID.kind = 'pillar'; px = x0 + 3; o.onPillar = iceUnderfoot(); px = x0; LAID = null;
  const L = lid; lid = 'dyn_test'; GATE_THINGS.push({ kind: 'pool', frozen: true, x: px, z: pz, R: 2 }); o.pool = iceUnderfoot(); GATE_THINGS[GATE_THINGS.length - 1].frozen = false; o.water = iceUnderfoot();
  GATE_THINGS.pop(); lid = L; o.rollMult = footRollMult(); return o; });
check('ice is under you on a Sioc floe (not above it or off it, not on a pillar) and on a gate\'s frozen pool (not its water)', !IU.field && IU.onFloe && !IU.above && !IU.offFloe && !IU.onPillar && IU.pool && !IU.water, IU);
const slide = (o) => page.evaluate((o) => { const _iu = iceUnderfoot; let a = null, b = null, v0 = 0, stopAt = null, prev = null, vEnter = 0;
  const H0 = activeTerrainH(px, pz), _ath = activeTerrainH, _sol = currentZoneSolid; activeTerrainH = () => H0; currentZoneSolid = () => false; jumpY = H0;
  for (const k in K) K[k] = false; ROLL = null; PPOST.stagUntil = 0; SKILLS.athletics = { lv: 5, p: 0 }; ATTRS.swiftness = 0; onGround = true; velY = 0; yaw = 0.7; pitch = 0; _wx('clear', 0);
  const x0 = px, z0 = pz, out = {};
  _drive(i => { PHP = maxHP; stamina = maxStamina; staminaCD = 0; SKILLS.athletics.p = 0; iceUnderfoot = i >= o.iceAt ? () => true : _iu; /* no skill rises mid-measure */
    if (prev && i > 1) { const v = Math.hypot(px - prev[0], pz - prev[1]) * 60; if (i === o.iceAt + 1) vEnter = v; if (i === o.stopAt - 1) v0 = v; }
    K['KeyW'] = i < o.stopAt; K['ShiftLeft'] = !!o.sprint && i < o.stopAt;
    if (i === o.stopAt) a = [px, pz];
    if (i > o.stopAt && prev && Math.hypot(px - prev[0], pz - prev[1]) < 1e-6) { b = [px, pz]; stopAt = i; return true; }
    prev = [px, pz]; return false; }, 400);
  iceUnderfoot = _iu; activeTerrainH = _ath; currentZoneSolid = _sol; for (const k in K) K[k] = false;
  out.v0 = +v0.toFixed(3); out.vEnter = +vEnter.toFixed(3); out.slide = b ? +Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(3) : null; out.frames = stopAt - o.stopAt; out.pill = ICE.on;
  px = x0; pz = z0; ICE.vx = ICE.vz = 0; ICE.on = false; return out; }, o);
const S = { dry: await slide({ iceAt: 999, stopAt: 60 }), run: await slide({ iceAt: 0, stopAt: 120 }), sprint: await slide({ iceAt: 0, stopAt: 120, sprint: true }), enter: await slide({ iceAt: 60, stopAt: 61 }) };
console.log('ice', JSON.stringify(S));
check('a stop on dry ground is at once; on ice from the run it slides 1.2 m, from a sprint 1.8 m (±0.08)', S.dry.slide != null && S.dry.slide < .01 && Math.abs(S.run.slide - 1.2) < .08 && Math.abs(S.sprint.slide - 1.8) < .08, S);
check('on ice the run builds to its full speed and you carry onto it the speed you came with', Math.abs(S.run.v0 - 3.83) < .05 && S.enter.vEnter > 3.6, S);
const RI = await page.evaluate(() => { const _iu = iceUnderfoot; ROLL = null; stamina = maxStamina; staminaCD = 0; onGround = true; PPOST.stagUntil = 0;
  iceUnderfoot = () => true; startRoll(performance.now() / 1000, { KeyW: true }); const d = ROLL ? ROLL.dist : null; ROLL = null; iceUnderfoot = _iu; return d; });
check('the roll on ice goes ×1.3 as far: 3.38 m light', Math.abs(RI - 3.38) < .01, RI);

// 7. hobnails (Session 2477): at a smith of the Gatelands (Hearthwick's) for 25 gold and an hour, drawn for 5; none at Aurenne's smith;
// nailed, the ice grips (20 m/s²), deep snow is only snow, and indoors a foe hears you at 4 m walking, 1.5 sneaking
const AUID = await page.evaluate(() => allSites().find(t => t.kind === 'town' && nationKeyOf(...cellOf(t.x, t.z)) === 'aurenne').id);
const HN = await page.evaluate(([au]) => { const o = {}, L = lid, H = currentHouse; EQ.feet = { name: 'Leather Boots', ico: '👢', def: 0, weight: 1 }; gold = 100;
  lid = 'int_test'; currentHouse = { type: 'weapon', siteId: 'hearthwick', name: 'Smithy' };
  o.here = hobnailHere(); openForgePage(); o.row = /Hobnails/.test(document.getElementById('fg-list').innerHTML); forgeSel = { k: 'n' }; forgeDraw(); o.panel = document.getElementById('fg-right').textContent;
  const m0 = gameMinNow(); forgeGo(false); o.said = document.getElementById('fg-said').textContent; o.mins = Math.round(gameMinNow() - m0); o.gold = gold; o.nailed = bootsNailed(); o.rowDraw = /Draw the nails/.test(document.getElementById('fg-list').innerHTML);
  _pStep = true; _sneaking = false; o.walk = hearingRadius(); _sneaking = true; o.sneak = hearingRadius(); _sneaking = false;
  closeForgePage(); lid = L; currentHouse = H; o.outWalk = hearingRadius();
  _wx('snow', .95); o.deepRun = footRunMult(); o.deepRoll = footRollMult(); o.acc = iceAcc();
  lid = 'int_test'; currentHouse = { type: 'weapon', siteId: 'hearthwick', name: 'Smithy' }; const r = hobnailGo(); o.drawn = r.done && !r.nailed && !bootsNailed(); o.gold2 = gold;
  o.walkBare = hearingRadius(); currentHouse = { type: 'weapon', siteId: au, name: 'Smithy' }; o.aurenne = hobnailHere(); o.aurenneGo = hobnailGo().why;
  lid = L; currentHouse = H; _pStep = false; _wx('clear', 0); o.accBare = iceAcc(); return o; }, [AUID]);
console.log('hobnails', JSON.stringify(HN));
check('a Gatelands smith nails your boots for 25 gold and an hour, on the forge page\'s own row; 5 gold draws them', HN.here && HN.row && HN.said === 'Your boots are nailed.' && HN.mins === 60 && HN.gold === 75 && HN.nailed && HN.rowDraw && HN.drawn && HN.gold2 === 70, HN);
check('Aurenne\'s smith nails nothing', !HN.aurenne && /No smith/.test(HN.aurenneGo || ''), HN);
check('nailed: the ice grips at 20 m/s² (6 bare); deep snow is only snow (×0.9, the roll whole)', HN.acc === 20 && HN.accBare === 6 && Math.abs(HN.deepRun - .9) < 1e-9 && HN.deepRoll === 1, HN);
check('nailed, indoors a foe hears you walk at 4 m and sneak at 1.5; bare 3; outdoors on soil the nails are quiet', HN.walk === 4 && HN.sneak === 1.5 && HN.walkBare === 3 && HN.outWalk <= 3, HN);
await page.evaluate(() => { EQ.feet.nails = true; });
const SN = await slide({ iceAt: 0, stopAt: 120 });
await page.evaluate(() => { delete EQ.feet.nails; });
check('nailed, a stop on ice from the run slides 0.37 m (±0.05)', Math.abs(SN.slide - .367) < .05, SN);

// 8. prints (Session 2482): mud takes them as snow does, dark earth, the step still sounding as bare ground; dry ground takes none;
// a mud print fades on its own clock, not with the snow's cover
await page.evaluate(([x, z]) => { px = x; pz = z; }, F); await g.cells();
const FPR = await page.evaluate(() => { const o = {}, x0 = px, z0 = pz; for (const m of FP.pool) m.visible = false; FP.last = null;
  const walk = n => { const r = []; for (let i = 0; i < n; i++) { px = x0 + i * .8; _foot.at = -1e9; r.push(fpWalk()); } px = x0; return r; };
  const shown = k => FP.pool.filter(m => m.visible && m.userData.kind === k).length;
  _wx('clear', 0); o.dry = walk(4); o.dryN = FP.pool.filter(m => m.visible).length;
  _wx('rain', 0); FP.last = null; o.mud = walk(4); o.mudN = shown('mud'); const m = FP.pool.find(m => m.visible && m.userData.kind === 'mud');
  o.col = m ? m.material.color.getHex() : null; tickFootprints(1); o.mudAfter1 = shown('mud');
  for (const m of FP.pool) m.visible = false; FP.last = null; _wx('snow', .6); o.snow = walk(4); o.snowN = shown('snow');
  for (const m of FP.pool) m.visible = false; FP.last = null; pz = z0; _wx('clear', 0); return o; });
console.log('prints', JSON.stringify(FPR));
check('rain on the field: a mud print a step, dark earth, and the step sounds as bare ground (false); dry ground none', FPR.mudN === 4 && FPR.mud.every(v => v === false) && FPR.col === 0x3a2e22 && FPR.dryN === 0 && FPR.dry.every(v => v === false), FPR);
check('a mud print outlasts a second with no snow cover; snow prints as before, and sound as snow', FPR.mudAfter1 === 4 && FPR.snowN === 4 && FPR.snow.every(v => v === true), FPR);

// 9. the nails shown and heard (Session 2483): the boots' card, the bag's tooltip and the worn slot say Hobnailed; nailed indoors a step
// plays the nailed step, outdoors the bare one, and bare boots indoors the bare one
const NS = await page.evaluate(() => { const o = {}, L = lid, H = currentHouse, b = { name: 'Leather Boots', ico: '👢', type: 'equip', slot: 'feet', def: 1, weight: 1, nails: true };
  o.desc = itemDesc(b); o.descBare = itemDesc(Object.assign({}, b, { nails: false }));
  BAG.push(b); showBagTooltip(BAG.length - 1, { clientX: 10, clientY: 10 }); o.tip = document.getElementById('bag-tooltip').innerHTML.includes('Hobnailed'); BAG.pop();
  const was = EQ.feet; EQ.feet = b; hoverEqSlot('feet'); o.slot = document.getElementById('eq-tooltip-stat').textContent;
  const heard = []; const sN = sndNailStep, sF = sndFootstep; sndNailStep = () => heard.push('nail'); sndFootstep = () => heard.push('bare');
  const step = () => { onGround = true; _stepT = 0; tickFootsteps(.5, true, false); };
  _wx('clear', 0); lid = 'int_test'; currentHouse = { type: 'weapon', siteId: 'hearthwick', name: 'Smithy' }; step(); lid = L; currentHouse = H; step();
  EQ.feet = Object.assign({}, b, { nails: false }); lid = 'int_test'; currentHouse = { type: 'weapon', siteId: 'hearthwick', name: 'Smithy' }; step(); lid = L; currentHouse = H;
  sndNailStep = sN; sndFootstep = sF; EQ.feet = was; o.heard = heard; return o; });
console.log('nails shown', JSON.stringify(NS));
check('the boots say Hobnailed on their card, the bag\'s tooltip and the worn slot; bare boots do not', /Hobnailed/.test(NS.desc) && !/Hobnailed/.test(NS.descBare) && NS.tip && /Hobnailed/.test(NS.slot), NS);
check('a step: nailed indoors the nailed step, nailed outdoors the bare one, bare boots indoors the bare one', NS.heard.join() === 'nail,bare,bare', NS);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
