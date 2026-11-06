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
  if (o[c] === null && !WORLD_DUNGEONS.some(e => e.seed === s)) o[c] = s; } return o; });
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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
