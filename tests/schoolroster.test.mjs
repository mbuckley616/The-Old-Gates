// The gates by school, the rosters (Session 763; Michael's A on DECISION #252): each school's gate holds the canon's table
// (lore_canon Part II §9a) with a level-one foe kept in each. Goblins, kobolds and Shieldbearers only in occupied gates.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const WANT = {
  undead: { Skeleton: 4, Phantom: 1, Wraith: 1 },
  elemental: { 'Fire Elemental': 2, Slime: 2, Golem: 1, 'Cave Troll': 1 },
  deep: { Slime: 3, Skeleton: 1, 'Cave Troll': 1, Mimic: 1 },
  ruins: { Golem: 2, Gargoyle: 1, 'Cave Troll': 1, Skeleton: 2 },
  haunted: { Phantom: 2, Wraith: 1, Mimic: 1, Skeleton: 2 },
};
// the levels from which each foe joins (EM, 56-dungeon-build.js, private to the dungeon's build)
const LV = { Skeleton: 1, Goblin: 1, Slime: 1, 'Cave Troll': 2, Golem: 3, Phantom: 3, 'Fire Elemental': 3, Gargoyle: 4, Mimic: 4, Wraith: 5 };
const T = await page.evaluate((LV) => { const o = {}; for (const k of ['undead', 'elemental', 'deep', 'ruins', 'haunted']) { const c = {}; THEME_DEF[k].enemies.forEach(n => c[n] = (c[n] || 0) + 1); o[k] = { c, lv: Object.fromEntries(THEME_DEF[k].enemies.map(n => [n, LV[n] || 9])) }; } return o; }, LV);
console.log(JSON.stringify(T));
for (const k of Object.keys(WANT)) {
  const c = T[k].c, same = Object.keys(WANT[k]).length === Object.keys(c).length && Object.entries(WANT[k]).every(([n, v]) => c[n] === v);
  check(`${k}'s roster is the table: ${Object.entries(WANT[k]).map(([n, v]) => v > 1 ? n + ' ×' + v : n).join(', ')}`, same, c);
  check(`${k}'s roster holds a level-one foe`, Object.values(T[k].lv).some(l => l <= 1), T[k].lv);
}
check('no school\'s roster holds a goblin, a kobold or a Shieldbearer', Object.values(T).every(t => !Object.keys(t.c).some(n => /Goblin|Kobold|Shieldbearer/.test(n))));

// inside: each school's gate at level 1 and at level 6
const seen = {};
for (const lv of [1, 6]) for (const theme of Object.keys(WANT)) for (const seed of [11, 23]) {
  await page.evaluate((lv) => { level = lv; }, lv);
  await enterDungeon(page, { theme, seed });
  const foes = await page.evaluate(() => [...new Set(ENEMIES.map(e => e.baseType || e.name))]);
  const k = theme + '@' + lv; seen[k] = [...new Set([...(seen[k] || []), ...foes])];
}
console.log(JSON.stringify(seen));
// S1933 — a failing or catastrophic gate (seed 23 is catastrophic) may hold its school's corrupted animal in one slot (below)
const CORRUPT = { deep: 'Frost Wraith Bear', ruins: 'Blight Boar', haunted: 'Stag of Shadows' };
const ok = (k) => { const [th] = k.split('@'); return seen[k].length > 0 && seen[k].every(n => WANT[th][n] || (n === 'Small Slime' && WANT[th].Slime) || n === CORRUPT[th]); };
check('at level 1 every school\'s gate holds foes, and only from its table', Object.keys(seen).filter(k => k.endsWith('@1')).every(ok), seen);
check('at level 6 the same, and each shows more than one kind of its table', Object.keys(seen).filter(k => k.endsWith('@6')).every(k => ok(k) && seen[k].filter(n => n !== 'Small Slime').length >= 2), seen);
check('Cloch\'s (ruins) gate at level 6 meets its stone: a Golem or a Gargoyle', seen['ruins@6'].some(n => n === 'Golem' || n === 'Gargoyle'), seen['ruins@6']);

// Session 1933 (Michael's B on #1201): a failing or catastrophic gate of Uisce, Cloch or Scáth gives one roster slot to its corrupted animal
// (OG-088): the Frost Wraith Bear for Uisce's first Slime, the Blight Boar for Cloch's first Skeleton, the Stag of Shadows for Scáth's first
// Skeleton. A steady gate keeps its roster. Each on its kin's driver, wearing the kit's plan, at its kin's numbers and its school's resistance
const conds = await page.evaluate(() => { const o = { steady: null, failing: null }; for (let s = 11; s < 400 && !(o.steady && o.failing); s++) { const c = gateCondRoll(s);
  if (o[c] === null && !WORLD_DUNGEONS.some(e => e.seed === s) && gateSchool({ seed: s, theme: 'ruins' }) !== 'gaoth') o[c] = s; } return o; }); /* S2115 — a Gaoth seed holds Gaoth's roster */
const Wst = await page.evaluate(() => { const r = getCell(HOME_I, HOME_J).regions.find(r => r.id === 'wastes'); return r ? { x: r.x, z: r.z } : null; });
const CR = {};
for (const theme of Object.keys(CORRUPT)) for (const cond of ['steady', 'failing']) for (const deep of [false, true]) {
  await enterDungeon(page, Object.assign({ theme, seed: conds[cond], size: 'medium' }, deep && Wst ? Wst : {}));
  CR[theme + ':' + cond + (deep ? ':deep' : '')] = await page.evaluate((want) => { const c = ENEMIES.filter(e => e.corrupt), kin = { 'Frost Wraith Bear': 'Cave Bear', 'Blight Boar': 'Boar', 'Stag of Shadows': 'Elderstag' };
    const plain = ENEMIES.find(e => !e.corrupt && e.baseType === 'Skeleton' && !e.variant);
    const e0 = c[0], r0 = e0 && e0.limbs.wolf, t0 = performance.now(); /* the camera beside the first, the ticks a second apart (the kit builds one body at a time) */
    if (r0) for (let i = 0; i < 3000 && !r0.hc && !r0.hcFail && performance.now() - t0 < 60000; i++) { CAM.position.set(e0.mesh.position.x + 2, 1.6, e0.mesh.position.z); e0.mesh.visible = true; tickCreatures(1 / 60, 3e6 + i * 1000); }
    return { cond: _lastGen.cond, tier: ENEMIES[0] && ENEMIES[0].tier, n: ENEMIES.length, k: c.length, names: [...new Set(c.map(e => e.name))],
      drv: c.every(e => e.limbs.wolf && e.limbs.wolf.name === kin[want] && e.limbs.wolf.hcKind === want), kit: c.filter(e => e.limbs.wolf && e.limbs.wolf.hc).map(e => e.limbs.wolf.hc.C.g.plan), src: HC.PLANS['game:' + want] && HC.PLANS['game:' + want].src,
      res: c[0] && c[0].resist, hp: c[0] && c[0].maxHp, skel: plain && plain.maxHp, fam: c[0] && foeFamily(c[0]),
      meat: c[0] ? bodyMeat(c[0], [], 'x').length : null }; }, CORRUPT[theme]); }
console.log(JSON.stringify(CR));
check('a steady gate holds no corrupted animal, shallow or deep', Object.entries(CR).filter(([k]) => k.includes(':steady')).every(([, r]) => r.cond === 'steady' && r.k === 0), CR);
check('a failing Cloch gate on tier 1 holds Blight Boars (the Boar\'s least tier is 1); the bear and the stag wait for tier 2',
  CR['ruins:failing'].k > 0 && CR['ruins:failing'].tier === 1 && CR['deep:failing'].k === 0 && CR['haunted:failing'].k === 0, CR);
check('deeper (the Wastes, tier 2+), a failing gate of each school holds its own: the Frost Wraith Bear, the Blight Boar, the Stag of Shadows',
  Object.keys(CORRUPT).every(t => { const r = CR[t + ':failing:deep']; return r.cond === 'failing' && r.tier >= 2 && r.k > 0 && r.names.join() === CORRUPT[t]; }), CR);
check('each runs on its kin\'s driver (the Cave Bear\'s, the Boar\'s, the Elderstag\'s) and the kit dresses it in its corrupted plan',
  Object.entries(CR).filter(([, r]) => r.k).every(([, r]) => r.drv && r.kit.length > 0 && r.kit.every(p => p === 'game:' + r.names[0]) && /OG-088/.test(r.src || '')), CR);
check('its school resists it ×0.7 (uisce, cloch, scáth), it fights as a beast or a brute, and it gives no meat',
  CR['deep:failing:deep'].res.uisce === .7 && CR['ruins:failing'].res.cloch === .7 && CR['haunted:failing:deep'].res.scath === .7
  && CR['deep:failing:deep'].fam === 'brute' && CR['haunted:failing:deep'].fam === 'beast' && Object.values(CR).filter(r => r.k).every(r => r.meat === 0), CR);

// Session 2115 (Michael's C on #1424, its first part): one old gate in six is Gaoth's by its seed, and holds Gaoth's roster whatever theme it
// drew: the Gale Wisp in the Skeleton's two slots, Gargoyles and Phantoms. The wisp has the Skeleton's numbers at the floor's tier, the Shore
// Wisp's light and resists, Gaoth's words at ×0.7, and a blow that lands shoves you 1 m
const gs = await page.evaluate(() => { const o = []; for (let s = 11; s < 400 && o.length < 2; s++) if (!WORLD_DUNGEONS.some(e => e.seed === s) && gateSchool({ seed: s, theme: 'undead' }) === 'gaoth') o.push(s); return o; });
const GA = {};
for (const seed of gs) for (const deep of [false, true]) {
  await enterDungeon(page, Object.assign({ theme: 'undead', seed, size: 'medium' }, deep && Wst ? Wst : {}));
  GA[seed + (deep ? ':deep' : '')] = await page.evaluate(() => { const w = ENEMIES.filter(e => e.baseType === 'Gale Wisp'), w0 = w.find(e => !e.variant) || w[0];
    let shove = null;
    if (w0) { const hp0 = PHP; PHP = 9999; let spot = null;
      for (let r = 0; r < dMap.length && !spot; r++) for (let c = 0; c < dMap[0].length && !spot; c++) { if (dMap[r][c] !== 1) continue; const x = dAt(c), z = dAt(r);
        let free = true; for (let t = -1; t <= 1.6 && free; t += .1) if (dBlkP(x + t, z)) free = false; if (free) spot = [x, z]; }
      if (spot) { const e = w0, ex = e.x, ez = e.z; px = spot[0]; pz = spot[1]; e.x = px - .8; e.z = pz; blocking = false; lastBlockAttemptT = -99;
        const before = PHP, x0 = px; executeStrike(e, 10, performance.now() + 1e7); shove = { moved: +(px - x0).toFixed(3), took: before - PHP, dz: +(pz - spot[1]).toFixed(3) }; e.x = ex; e.z = ez; }
      PHP = hp0; }
    return { tier: ENEMIES[0] && ENEMIES[0].tier, names: [...new Set(ENEMIES.map(e => e.baseType || e.name))], n: w.length,
      hp: w0 && w0.maxHp, res: w0 && w0.resist, fam: w0 && foeFamily(w0), hover: !!(w0 && w0.mesh._hover), glows: w0 ? w0.mesh.children.filter(c => c.material && c.material.blending === THREE.AdditiveBlending).length : 0,
      shove }; });
}
await enterDungeon(page, { theme: 'undead', seed: 11, size: 'medium' });
const skel = await page.evaluate(() => { const s = ENEMIES.find(e => e.baseType === 'Skeleton' && !e.variant); return s ? { hp: s.maxHp, tier: s.tier } : null; });
console.log(JSON.stringify({ gs, GA, skel }));
const gaw = Object.values(GA);
check('two Gaoth seeds found, and their gates hold only Gaoth\'s roster (the Gale Wisp, Gargoyles, Phantoms; S2116, a failing one\'s dusk eagle), the wisp in every one', gs.length === 2 && gaw.length === 4 && gaw.every(r => r.n > 0 && r.names.every(n => n === 'Gale Wisp' || n === 'Gargoyle' || n === 'Phantom' || n === 'Dusk Eagle')), GA);
check('deeper (the Wastes, tier 2+), a Gaoth gate shows more than the wisp', Object.entries(GA).filter(([k]) => k.endsWith(':deep')).some(([, r]) => r.tier >= 2 && r.names.length >= 2), GA);
check('the wisp has the Skeleton\'s health at the same tier, the Shore Wisp\'s resists and Gaoth\'s ×0.7', gaw.every(r => r.res.gaoth === .7 && r.res.pierce === .4 && r.res.blunt === .4) && skel && Object.entries(GA).filter(([k, r]) => !k.endsWith(':deep') && r.tier === skel.tier).every(([, r]) => r.hp === skel.hp), { GA, skel });
check('it fights as the coast\'s wisp (the spider\'s row) and is drawn as its light: hovering, its haloes additive', gaw.every(r => r.fam === 'spider' && r.hover && r.glows >= 8), GA);
check('its blow that lands takes health and shoves you 1 m straight away from it', gaw.every(r => r.shove && r.shove.took > 0 && Math.abs(r.shove.moved - 1) < .02 && Math.abs(r.shove.dz) < .02), gaw.map(r => r.shove));

// Session 2116 (the same decision's second part): a failing or catastrophic Gaoth gate, from tier 2, gives its first wisp's slot to the dusk
// eagle. It circles 4–6 m up out of a blade's reach, hangs for a 0.9 s tell, dives at where you stood when the tell ended, and lingers 1 m up
// where a blade reaches it. Its numbers are the Dire Wolf's at the floor's tier, Gaoth ×0.7
const gc = await page.evaluate(() => { const o = { steady: null, failing: null }; for (let s = 11; s < 2000 && !(o.steady && o.failing); s++) { if (WORLD_DUNGEONS.some(e => e.seed === s) || gateSchool({ seed: s, theme: 'undead' }) !== 'gaoth') continue;
  const c = gateCondRoll(s), k = c === 'catastrophic' ? 'failing' : c; if (o[k] === null) o[k] = s; } return o; });
const EA = {};
for (const [cond, seed] of Object.entries(gc)) for (const deep of [false, true]) {
  await enterDungeon(page, Object.assign({ theme: 'undead', seed, size: 'medium' }, deep && Wst ? Wst : {}));
  EA[cond + (deep ? ':deep' : '')] = await page.evaluate(() => { const ea = ENEMIES.filter(e => e.baseType === 'Dusk Eagle'), e = ea[0];
    const out = { cond: _lastGen.cond, tier: ENEMIES[0] && ENEMIES[0].tier, n: ea.length, names: [...new Set(ENEMIES.map(x => x.baseType))] };
    if (!e) return out;
    out.hp = e.maxHp; out.res = e.resist; out.fam = foeFamily(e);
    let spot = null; for (let r = 0; r < dMap.length && !spot; r++) for (let c = 0; c < dMap[0].length && !spot; c++) { if (dMap[r][c] !== 1) continue; const x = dAt(c), z = dAt(r);
      let free = true; for (let a = 0; a < 16 && free; a++) for (let t = .5; t <= 5 && free; t += .5) if (dBlkP(x + Math.sin(a / 16 * 6.283) * t, z + Math.cos(a / 16 * 6.283) * t)) free = false; if (free) spot = [x, z]; }
    if (!spot) return out;
    ENEMIES.forEach(o => { if (o !== e) { o.dead = true; } });
    px = spot[0]; pz = spot[1]; blocking = false; lastBlockAttemptT = -99; PHP = 9999; e.x = px + 3; e.z = pz; e.homeX = e.x; e.homeZ = e.z;
    const T = () => ({ x: px, z: pz }), step = () => eagleTick(e, 1 / 60, T(), Math.hypot(px - e.x, pz - e.z));
    let i = 0; const ys = []; for (; i < 100; i++) { step(); ys.push(e.mesh.position.y - e.baseY); }
    out.circle = { y: +(ys[ys.length - 1]).toFixed(2), aloft: e.aloft, blade: strikeCandidate(e), alert: e.alert, mode: e.flier.mode };
    let tell = 0; for (i = 0; i < 900 && e.flier.mode !== 'tell'; i++) step(); for (i = 0; i < 300 && e.flier.mode === 'tell'; i++) { step(); tell++; }
    const hp0 = PHP; let low = null; for (i = 0; i < 200 && e.flier.mode !== 'low'; i++) step();
    low = { y: +(e.mesh.position.y - e.baseY).toFixed(2), blade: strikeCandidate(e), took: hp0 - PHP };
    for (i = 0; i < 600 && e.flier.mode !== 'circle'; i++) step(); const back = { mode: e.flier.mode, y: +(e.mesh.position.y - e.baseY).toFixed(2) };
    for (i = 0; i < 900 && e.flier.mode !== 'tell'; i++) step(); for (i = 0; i < 300 && e.flier.mode === 'tell'; i++) step();
    const sx = px, sz = pz, ax = e.x - px, az = e.z - pz, al = Math.hypot(ax, az) || 1; px = sx - az / al * 2.5; pz = sz + ax / al * 2.5; if (dBlkP(px, pz)) { px = sx + az / al * 2.5; pz = sz - ax / al * 2.5; }
    const hp1 = PHP; for (i = 0; i < 200 && e.flier.mode !== 'low'; i++) step(); const aside = { took: hp1 - PHP, d: +Math.hypot(px - e.x, pz - e.z).toFixed(2) };
    out.fly = { tell, low, back, aside }; PHP = 100; return out; });
}
console.log(JSON.stringify({ gc, EA }));
check('the dusk eagle comes only to a failing Gaoth gate from tier 2; a steady one, or one at tier 1, has none', EA['failing:deep'] && EA['failing:deep'].tier >= 2 && EA['failing:deep'].n >= 1 && EA['failing'].n === 0 && EA['steady'].n === 0 && EA['steady:deep'].n === 0, EA);
const F = EA['failing:deep'] || {};
check('it has the Dire Wolf\'s resists with Gaoth ×0.7, and fights as a beast', F.res && F.res.gaoth === .7 && F.res.tine === 1.2 && F.fam === 'beast' && F.hp > 0, F);
check('it circles 2.2 to 6 m up, aloft, out of a blade\'s reach', F.circle && F.circle.y >= 2.2 && F.circle.y <= 6 && F.circle.aloft && !F.circle.blade, F.circle);
check('it hangs for its tell, 0.9 s (54 ticks, ±2)', F.fly && Math.abs(F.fly.tell - 54) <= 2, F.fly);
check('it dives on where you stand and strikes; at the dive\'s foot, 1 m up, a blade reaches it', F.fly && F.fly.low.took > 0 && F.fly.low.y <= 1.05 && F.fly.low.blade, F.fly && F.fly.low);
check('it climbs back and circles again', F.fly && F.fly.back.mode === 'circle' && F.fly.back.y >= 2.2, F.fly && F.fly.back);
check('stepping 2.5 m aside as the tell ends, the dive strikes air', F.fly && F.fly.aside.took === 0 && F.fly.aside.d > 1.6, F.fly && F.fly.aside);

// Session 2118 (the bodies builder's half): the eagle wears the kit's duskeagle near, the stand-in far, and its gait is its flight: it soars
// as it circles, stoops on the dive (the wings half closed) and strikes at its foot (the wings up, the feet forward)
let BD = null;
if (gc.failing) { await enterDungeon(page, Object.assign({ theme: 'undead', seed: gc.failing, size: 'medium' }, Wst || {}));
  BD = await page.evaluate(() => { const e = ENEMIES.find(x => x.baseType === 'Dusk Eagle'), rig = e && e.limbs && e.limbs.bird; if (!rig) return { rig: false };
    ENEMIES.forEach(o => { if (o !== e) o.dead = true; }); px = e.x - 6; pz = e.z; PHP = 9999; blocking = false;
    CAM.position.set(e.x - 6, e.baseY + 1.65, e.z); CAM.updateMatrixWorld(true);
    let k = 0; HBODY.last = -1e9; while (!rig.hc && !rig.hcFail && k++ < 400) hcTick(2e6 + k * (HBODY.gap + 1));
    if (!rig.hc) return { rig: true, built: false, fail: !!rig.hcFail };
    const H = rig.hc, C = H.C, kb = new THREE.Box3(), inv = new THREE.Matrix4(); C.gait = 'stand'; HC.pose(C, 0); rig.root.updateMatrixWorld(true); inv.copy(rig.root.matrixWorld).invert();
    for (const m of C.meshes) { m.geometry.computeBoundingBox(); kb.union(m.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld))); }
    const len = +(kb.max.z - kb.min.z).toFixed(2), T = () => ({ x: px, z: pz }), seen = {}, wing = {};
    const w0 = C.byName[C.B.wings[0].arm[0]];
    const look = () => { e.mesh.updateMatrixWorld(true); rig.t = performance.now() / 1000 - 1 / 60; hcBirdPose(rig); seen[e.flier.mode] = C.gait; wing[C.gait] = wing[C.gait] || w0.quaternion.toArray().map(v => +v.toFixed(3)); };
    for (let i = 0; i < 2400 && Object.keys(seen).length < 5; i++) { eagleTick(e, 1 / 60, T(), Math.hypot(px - e.x, pz - e.z)); look(); }
    const q = (a, b) => a && b ? +Math.max(...a.map((v, i) => Math.abs(v - b[i]))).toFixed(3) : 0;
    const near = { L: H.L, kit: H.W.visible, stand: rig.mesh.visible };
    /* S2120 — the wind-up's red on the stand-in reaches the kit's hide */ const sm = enemyBodyMesh(e).material; sm.emissive.setHex(0xff2000); hcBirdPose(rig); const lit = H.hide.every(o => [].concat(o.material).some(x => x.emissive && x.emissive.getHex() === 0xff2000)); sm.emissive.setHex(0); hcBirdPose(rig); near.flash = lit && H.hide.every(o => [].concat(o.material).every(x => !x.emissive || x.emissive.getHex() === 0));
    CAM.position.set(e.x - 80, e.baseY + 1.65, e.z); CAM.updateMatrixWorld(true); hcTick(3e6); const far = { L: H.L, kit: H.W.visible, stand: rig.mesh.visible };
    return { rig: true, built: true, plan: C.plan.name, len, tris: C.stats && C.stats.tris, seen, moved: { stoop: q(wing.soar, wing.stoop), strike: q(wing.soar, wing.strike) }, near, far }; }); }
console.log(JSON.stringify(BD));
check('the dusk eagle wears the kit\'s duskeagle, 1.43 m beak to tail (±0.1)', BD && BD.built && BD.plan === 'Dusk Eagle' && Math.abs(BD.len - 1.43) < .1, BD);
check('its gait is its flight: it soars circling and hanging, stoops on the dive and strikes at its foot', BD && BD.seen && BD.seen.circle === 'soar' && BD.seen.tell === 'soar' && BD.seen.dive === 'stoop' && BD.seen.low === 'strike' && BD.seen.climb === 'soar', BD && BD.seen);
check('the stoop and the strike turn its wing from the soar\'s', BD && BD.moved && BD.moved.stoop > .05 && BD.moved.strike > .05, BD && BD.moved);
check('a flash on its body (the wind-up\'s red) lights the kit\'s hide, and goes out with it (S2120)', BD && BD.near && BD.near.flash, BD && BD.near);
check('near, the kit\'s body shows; far, the stand-in', BD && BD.near && BD.near.kit && !BD.near.stand && BD.far.L === 2 && !BD.far.kit && BD.far.stand, BD && [BD.near, BD.far]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
