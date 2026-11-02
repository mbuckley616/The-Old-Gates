// The ship's patch and splice at a bench (Session 1519; `sailing.md` A, `survival-build.md` session 6, the skills sheet's Joinery
// perks). Her cabin is a bench, and a joiner's kit at her side while she is hove to. A patch is a plank and a pitch, +8 + Joinery/5
// hull after 8 s; a splice a spar and a pitch, +20 rig, at sea only with Field splice (25). Field work reaches 60% + 0.4% a Joinery
// point of the bar. Tight seams (50) +50%, Shipwright's hand (100) 4 s.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  // a coast: the first line out to sea with deep water past the shallows (as `shiphull`)
  let c = null;
  for (let a = 0; a < 6.28 && !c; a += .2) { const cx = Math.cos(a), cz = Math.sin(a);
    for (let d = 20; d < 1500; d += 4) { const x = px + cx * d, z = pz + cz * d; if (WORLD.worldH(x, z) > WORLD.SEA_Y - 1.4) continue;
      let deep = true; for (let k = 4; k <= 60; k += 4) if (WORLD.worldH(px + cx * (d + k), pz + cz * (d + k)) > -4) { deep = false; break; }
      if (deep) c = { cx, cz, x0: x, z0: z }; break; } }
  out.coast = !!c; if (!c) return out;
  const launch = (d, hull) => { for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
    worldState.ship = { cls: 'sloop', name: 'Test Gull', hull, rig: 100 }; WORLD.spawnShip(c.x0 + c.cx * d, c.z0 + c.cz * d, Math.atan2(c.cx, c.cz));
    const S = WORLD.ship; S.sailing = false; S.speed = 0; px = S.x + 2; pz = S.z; };
  const J = lv => { SKILLS.joinery = { lv, p: 0 }; };
  const work = kind => { const s = shipWorkStart(kind); if (!s.started) return s.why; tickShipWork(patchSecs() - .1); const mid = SHIPWORK ? 'working' : 'done'; tickShipWork(.2); return mid; };
  // ── the patch, at her side with a kit ──
  launch(40, 40); BAG.length = 0; J(25);
  out.noKit = shipWorkStart('patch').why; out.noKitBench = benchHere();
  bagAdd({ ...JOINER_ITEM }); out.here = shipWorkHere() && benchHere();
  out.noPlank = shipWorkStart('patch').why;
  bagAdd(benchItem('plank', 3)); bagAdd(survItem('pitch', 6));
  const p0 = SKILLS.joinery.p; out.w1 = work('patch'); out.h1 = shipBars().hull; out.use = SKILLS.joinery.p - p0;
  out.w2 = work('patch'); out.h2 = shipBars().hull; out.cap = fieldCap(shipBars().hullMax);
  out.w3 = work('patch'); out.h3 = shipBars().hull; bagAdd(benchItem('plank', 2)); out.capWhy = shipWorkStart('patch').why; out.left = { planks: plankCount(), pitch: pitchCount() };
  // ── walking off stops it, nothing spent ──
  worldState.ship.hull = 40; const pl0 = plankCount(); shipWorkStart('patch'); px += 3; tickShipWork(1); out.walked = { work: SHIPWORK, hull: shipBars().hull, planks: plankCount() === pl0 }; px -= 3;
  // ── sailing: no work ──
  WORLD.ship.sailing = true; out.sailingWhy = shipWorkStart('patch').why; WORLD.ship.sailing = false;
  // ── the page: two ship rows at her side, none away from her ──
  openBenchPage(); const ov = document.getElementById('benchui'); out.rowsShip = ov.querySelectorAll('#bn-list [data-k]').length; closeBenchPage();
  const sx = px; px += 40; openBenchPage(); out.rowsAway = ov.querySelectorAll('#bn-list [data-k]').length; closeBenchPage(); px = sx;
  // ── the splice: at sea only with Field splice ──
  out.atSea = shipAtSea(); worldState.ship.rig = 40; bagAdd(benchItem('spar', 3));
  J(24); out.sea24 = shipWorkStart('splice').why;
  J(25); out.s1 = work('splice'); out.rig1 = shipBars().rig;
  // ── S1561: a heartwood spar's splice: +40 rig, past the field cap to full; its row shown only with a heartwood spar or the perk ──
  { const rowsOf = () => { openBenchPage(); const k = [...document.querySelectorAll('#bn-list [data-k]')].map(d => d.dataset.k); closeBenchPage(); return k; };
    worldState.ship.rig = 70; out.capRig = fieldCap(100); out.plainAtCap = shipWorkStart('splice').why; worldState.ship.rig = 60; bagAdd(survItem('pitch', 2)); out.noHeart = shipWorkWhy('heartsplice');
    out.rowNo = rowsOf().includes('heartsplice'); bagAdd(benchItem('heartspar', 1)); out.rowYes = rowsOf().includes('heartsplice');
    const sp0 = bagCount(x => x.spar); J(24); out.heart24 = shipWorkStart('heartsplice').why; J(25);
    out.hw1 = work('heartsplice'); out.hwRig = shipBars().rig; out.hwLeft = { heart: bagCount(x => x.heartwood === 'spar'), spar: bagCount(x => x.spar) === sp0 };
    worldState.ship.rig = 85; bagAdd(benchItem('heartspar', 1)); work('heartsplice'); out.hwFull = shipBars().rig; bagAdd(benchItem('heartspar', 1)); out.hwSound = shipWorkWhy('heartsplice'); BAG.splice(0, BAG.length, ...BAG.filter(x => !x.heartwood)); }
  // ── Tight seams (50) and Shipwright's hand (100) ──
  worldState.ship.hull = 20; J(50); out.patch50 = patchAmt(); work('patch'); out.h50 = shipBars().hull;
  J(100); out.secs100 = patchSecs(); out.patch100 = patchAmt(); out.cap100 = fieldCap(100);
  // ── the cabin is a bench, kit or none ──
  BAG.length = 0; J(25); const lid0 = lid, h0 = currentHouse; lid = 'int_test'; currentHouse = { type: 'cabin', name: 'The Test Gull — cabin' };
  out.cabin = benchHere() && shipWorkHere(); bagAdd(benchItem('plank', 1)); bagAdd(survItem('pitch', 1)); worldState.ship.hull = 40;
  out.cabinWork = work('patch'); out.cabinHull = shipBars().hull; lid = lid0; currentHouse = h0;
  // ── S1732: her fittings built at her bench (the build sheet of #979 B, session 2), and the still and the galley in her hold ──
  { const lid1 = lid, h1 = currentHouse; lid = 'int_test'; currentHouse = { type: 'cabin', name: 'The Test Gull — cabin' };
    Object.assign(worldState.ship, { fit: [], stored: [], cargo: 0, hold: {} }); BAG.length = 0; bagAdd(benchItem('plank', 8));
    J(24); out.f24 = shipBenchWhy('bunks'); out.f24b = benchMake('fit_bunks').made;
    J(25); const cap0 = WORLD.holdCap(), xp0 = SKILLS.joinery.p, t0 = worldState.gameTimeAbsMinutes || 0; const r1 = benchMake('fit_bunks');
    out.f25 = { made: r1.made, fit: [...worldState.ship.fit], hold: cap0 - WORLD.holdCap(), xp: SKILLS.joinery.p - xp0, planks: plankCount(), mins: (worldState.gameTimeAbsMinutes || 0) - t0, said: r1.said };
    out.chart25 = shipBenchWhy('chart'); J(50); bagAdd(benchItem('plank', 4)); bagAdd(ingotItem(3, 1)); out.arms = benchMake('fit_arms').made && plankCount() === 0 && ingotCount(3) === 0;
    bagAdd(benchItem('plank', 8)); out.full = shipBenchWhy('chart'); out.fullLeft = plankCount();
    worldState.ship.fit = []; worldState.ship.stored = ['bunks']; out.stored = shipBenchWhy('bunks'); worldState.ship.stored = [];
    worldState.ship.hold = { iron: 3 }; worldState.ship.fit = ['still']; out.heavy = shipBenchWhy('bunks'); out.heavyLeft = plankCount(); worldState.ship.hold = {};
    openBenchPage(); out.fitRows = [...document.querySelectorAll('#bn-list [data-k]')].filter(d => /^fit_/.test(d.dataset.k)).length; closeBenchPage();
    const base = () => skillMult('alchemy') * (1 + .01 * attrEff('intelligence'));
    worldState.ship.fit = ['still']; out.still = +(alchStrength() / base()).toFixed(3); out.stillFire = atFire();
    worldState.ship.fit = ['galley']; out.stillOff = +(alchStrength() / base()).toFixed(3); out.galley = atFire(); bagAdd(survItem('fish', 1)); out.cook = cookAt('fish').made;
    currentHouse._fits = { galley: { x: px + 3, z: pz } }; out.galleyFar = atFire(); currentHouse._fits.galley = { x: px + 1.5, z: pz }; out.galleyNear = atFire();
    lid = lid1; currentHouse = h1; out.galleyOut = atFire(); worldState.ship.fit = []; }
  out.perks = ['joinery:25', 'joinery:50', 'joinery:75', 'joinery:100'].every(k => PERK_LIVE.has(k)); /* S1555: Bowyer is live since S1549 (#851 A) */
  return out;
});
console.log(JSON.stringify(r));
check('found a coast for her', r.coast, r);
check('without a kit there is no bench at her side', /hove to/.test(r.noKit) && !r.noKitBench, r.noKit);
check('with a kit, hove to beside her, you can work; a patch needs a plank', r.here && /plank/.test(r.noPlank), r.noPlank);
check('two patches at Joinery 25: 40 + 13 + 13 = 66, each after 8 s, Joinery +6', r.w1 === 'working' && r.h1 === 53 && r.h2 === 66 && r.use === 6, r);
check('the field cap at 25 is 70 of 100: the third patch stops there, the fourth is refused', r.cap === 70 && r.h3 === 70 && /yard/.test(r.capWhy) && r.left.planks === 2 && r.left.pitch === 3, r);
check('walking off stops the work with nothing spent', r.walked.work === null && r.walked.hull === 40 && r.walked.planks, r.walked);
check('under sail there is no work', /hove to/.test(r.sailingWhy), r.sailingWhy);
check('the bench\'s page shows the patch and the splice at her side, not away', r.rowsShip - r.rowsAway === 8 && r.rowsAway >= 5 /* S1732: and her six fittings */ /* S1555: Bowyer's two bows (S1549) are rows of their own: 9 and 7 */, { ship: r.rowsShip, away: r.rowsAway });
check('a splice at sea asks Field splice (25); at 25 the rig +20', (!r.atSea || /At sea/.test(r.sea24)) && r.rig1 === 60, { atSea: r.atSea, why: r.sea24, rig: r.rig1 });
check('Heartwood: a heartwood spar splices past the field cap (70 at 25): 60 → 100, a plain spar refused at 70; 85 → 100, then the rig is sound', r.capRig === 70 && /yard/.test(r.plainAtCap) && /heartwood spar/.test(r.noHeart) && (!r.atSea || /At sea/.test(r.heart24)) && r.hw1 === 'working' && r.hwRig === 100 && r.hwLeft.heart === 0 && r.hwLeft.spar && r.hwFull === 100 && /sound/.test(r.hwSound), r);
check('the heartwood splice\'s row is on the bench\'s page only with a heartwood spar in the bag (or the perk)', !r.rowNo && r.rowYes, [r.rowNo, r.rowYes]);
check('Tight seams: a patch at 50 is (8 + 10) × 1.5 = 27', r.patch50 === 27 && r.h50 === 47, r);
check('Shipwright\'s hand: 4 s at 100; field work to full', r.secs100 === 4 && r.patch100 === 42 && r.cap100 === 100, r);
check('her cabin is a bench, kit or none: a patch there', r.cabin && r.cabinHull === 53, r);
check('her bench\'s fittings: crew bunks ask Joinery 25 (refused at 24, nothing spent)', /Joinery 25 \(you have 24\)/.test(r.f24) && r.f24b === false, r.f24);
check('at 25 the bunks are built and fitted: 8 planks, 10 of the hold, Joinery +12, half an hour', r.f25.made && r.f25.fit.join() === 'bunks' && r.f25.hold === 10 && r.f25.xp === 12 && r.f25.planks === 0 && r.f25.mins === 30 && /built and fitted/.test(r.f25.said), r.f25);
check('the chart table asks Joinery 50; at 50 an arms rack is 4 planks and an iron ingot', /Joinery 50/.test(r.chart25) && r.arms, [r.chart25, r.arms]);
check('a sloop\'s two places full: the bench refuses and keeps the planks', /rooms are full/.test(r.full) && r.fullLeft === 8, [r.full, r.fullLeft]);
check('one the yard keeps for her, or a hold too full for its weight: refused', /yard keeps/.test(r.stored) && /clear the hold/.test(r.heavy) && r.heavyLeft === 8, [r.stored, r.heavy]);
check('the bench\'s page shows her six fittings at her side', r.fitRows === 6, r.fitRows);
check('her still in her hold: brewing ×1.10; it is no fire', r.still === 1.1 && r.stillFire === false && r.stillOff === 1, [r.still, r.stillOff]);
check('her galley in her hold is a fire: a fish cooks; once it has a spot, within 2 m of it; out of her hold, no fire', r.galley && r.cook && !r.galleyFar && r.galleyNear && !r.galleyOut, r);
check('Field splice, Tight seams, Bowyer and Shipwright\'s hand live', r.perks, r.perks);
// Session 1524 — the cabin's bench drawn: below deck the kit's joiner's bench stands against the west wall at its true height (0.85 m),
// in one mesh a material, its solid the bench's own footprint, clear of the bunk, the chart table, the chest and the sacks
/* S1555: the kit sloop's hold (her base below deck, #418 A) has no bench, as shipbase.js drew it; the bench below is a cutter's, whose cabin is still the old room */
/* S1558: the cutter's hold is hers now (her workbench is the bench, hullbakes); the old room's bench is checked on a caravel, whose base is still owed */
/* S1564: the caravel's hold is hers too (her workbench is the bench, hullbakes); the old room's bench is checked on a cog */
await page.evaluate(() => { const S = WORLD.ship, x = S.x, z = S.z, y = S.yaw; sc.remove(S.mesh); SHIP.mesh = null; worldState.ship.cls = 'cog'; WORLD.spawnShip(x, z, y); cabinUpdate(); goToInterior(CABIN.house); });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
/* S1732: the cog's hold is hers too since S1578 (cogBase), so no hull on the new look keeps the old room: her workbench is the bench, its solid
   the kit's own box (`hullbakes` checks the hold); the old room's mesh is checked only where a hull still has it */
const hold = await page.evaluate(() => { if (!isInterior() || currentHouse.type !== 'cabin' || !currentHouse._base) return null; const B = currentHouse._bench;
  const sol = B && INT_SOL.find(q => q.x0 <= B.x && q.x1 >= B.x && q.z0 <= B.z && q.z1 >= B.z && q.y1 > .5 && q.y1 < 1.3);
  return { B, sol: !!sol, top: sol && +sol.y1.toFixed(2), inRoom: !!B && B.x > 0 && B.x < currentHouse.intW && B.z > 0 && B.z < currentHouse.intD, bench: benchHere() }; });
if (hold) check(`below deck the cog's hold has her workbench as the bench, inside the room, a solid to ${hold.top} m (S1578's hold)`, !!hold.B && hold.sol && hold.inRoom && hold.bench, hold);
const cb = hold ? null : await page.evaluate(() => { if (!isInterior() || currentHouse.type !== 'cabin') return null;
  const B = currentHouse._bench; let g = null; interiorScene.traverse(o => { if (o.name === 'joiner bench') g = o; }); if (!B || !g) return { B, g: !!g };
  interiorScene.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(g), top = g.children.find(m => m.name === 'bench:wood');
  const sol = INT_SOL.find(q => q.x0 <= B.x && q.x1 >= B.x && q.z0 <= B.z && q.z1 >= B.z && Math.abs(q.y1 - .85) < .03);
  const over = sol ? INT_SOL.filter(q => q !== sol && q.y1 > .1 && q.x0 < sol.x1 - .01 && q.x1 > sol.x0 + .01 && q.z0 < sol.z1 - .01 && q.z1 > sol.z0 + .01).length : -1;
  return { x: +B.x.toFixed(2), z: +B.z.toFixed(2), draws: g.children.filter(m => m.isMesh).length, tris: B.tris, w: +(bb.max.z - bb.min.z).toFixed(2), d: +(bb.max.x - bb.min.x).toFixed(2), wall: +bb.min.x.toFixed(2), hi: +bb.max.y.toFixed(2),
    sol: !!sol, solTop: sol && +sol.y1.toFixed(2), over, inRoom: bb.max.z < currentHouse.intD && bb.min.z > 0, W: +currentHouse.intW.toFixed(2), D: +currentHouse.intD.toFixed(2), bench: benchHere() }; });
if (!hold) check(`below deck the cabin's joiner's bench stands at the west wall (${cb && cb.wall} m off it), ${cb && cb.w} m long and ${cb && cb.d} m deep, its top a solid at ${cb && cb.solTop} m, clear of the rest (${cb && cb.over} overlaps); ${cb && cb.tris} triangles in ${cb && cb.draws} draws (S1524)`,
  !!cb && cb.sol && cb.wall < .05 && cb.w > 1.45 && cb.w < 1.6 && cb.d > .8 && cb.d < .95 && cb.hi < 1.5 && cb.over === 0 && cb.inRoom && cb.draws <= 3 && cb.bench, cb);
// Session 1527 — E at the bench: within 1.6 m of it the prompt asks, and E opens the bench's page
const bx = await page.evaluate(() => { if (!isInterior() || !currentHouse._bench) return null; const B = currentHouse._bench; px = B.x + .9; pz = B.z; return { far: (px = B.x + 2.2, benchNear()), near: (px = B.x + .9, benchNear()) }; });
await g.frames(3);
const be = await page.evaluate(() => { const o = { prompt: document.getElementById('ipr').textContent }; interact(); o.open = benchOpen; if (benchOpen) closeBenchPage(); return o; });
check(`at the cabin's bench: "${be.prompt}", and E opens its page; 2.2 m off it is not near`, !!bx && bx.near && !bx.far && /work at the bench/.test(be.prompt) && be.open, { bx, be });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
