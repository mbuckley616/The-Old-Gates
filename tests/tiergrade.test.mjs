// Enemies by place, the grade and the floor (Session 1058; the designer's sheet on Michael's A on #373). A dungeon's grade is its
// door's tier's, read once at the door: tier 1 Very Easy, 2 Normal, 3 Hard, 4 Very Hard, a lair one above and a wyrm two, the same
// at level 1 and level 20. Floor 2 steps once, by its tier's +1: a Skeleton's health ×1.75, its blow ×2.09 and its pace ×1.0 of
// floor 1's (the old ×1.5, ×1.5 and ×1.1 went).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const t = await page.evaluate(() => {
  const home = getCell(HOME_I, HOME_J).regions, at = id => home.find(r => r.id === id), C = at('coastal'), D = at('deepwood'), L0 = level;
  const def = (r, seed, lair) => makePortalDef({ x: r.x, z: r.z, zone: 'world', seed, theme: 'undead', size: 'medium', lair });
  const out = {};
  for (const L of [1, 20]) { level = L;
    const crypt = def(C, 9101), lair = def(D, 9102, { place: 'Test', boss: 'Cave Bear' }), wyrm = def(C, 9103, { place: 'Test', boss: 'Wyrm', dragon: true });
    out[L] = { crypt: crypt.diff, lair: lair.diff, wyrm: wyrm.diff, tiers: [dungeonTier(crypt, 1), dungeonTier(lair, 1), dungeonTier(wyrm, 1)], label: crypt.diffScale.label }; }
  level = L0; return { out, C: { x: C.x, z: C.z } }; });
console.log(JSON.stringify(t.out));
check('a tier-1 crypt is Very Easy, a tier-2 lair Hard, a tier-1 wyrm\'s cavern Normal', t.out[1].tiers.join() === '1,2,1' && t.out[1].crypt === 'veryeasy' && t.out[1].lair === 'hard' && t.out[1].wyrm === 'normal', t.out[1]);
check('the same grades at level 20 as at level 1', JSON.stringify(t.out[1]) === JSON.stringify(t.out[20]), t.out);

// the floor: a tier-1 door at the coast's centre, entered at level 1 and at level 20
async function enter(lv) {
  await page.evaluate(([lv, C]) => { level = lv;
    goToDungeon(makePortalDef({ x: C.x, z: C.z, zone: 'world', seed: 7311, size: 'massive', theme: 'undead' })); /* S1293 — only a massive gate has a floor two now */ }, [lv, t.C]);
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon' && ENEMIES.length > 0)) break; }
  await g.frames(4);
  const r = await page.evaluate(() => { const plain = ENEMIES.filter(e => e.name === 'Skeleton' && !e.variant);
    const f = n => plain.filter(e => (e.floor || 1) === n).map(e => ({ hp: e.maxHp, m: +e.dmgMult.toFixed(4), s: +e.spd.toFixed(4), t: e.tier }));
    return { f1: f(1), f2: f(2), grade: currentPortal.diff, all: ENEMIES.map(e => [e.name, e.floor || 1, e.maxHp, +(e.dmgMult || 0).toFixed(3)]),
      want: { hp: Math.max(1, Math.round(35 * DIFF_SCALE.veryeasy.hp * enemyHpScale(2))), hp1: Math.max(1, Math.round(35 * DIFF_SCALE.veryeasy.hp * enemyHpScale(1))), dmg: +(enemyDmgScale(2) / enemyDmgScale(1)).toFixed(4) } }; });
  await page.evaluate(() => { goToOW(); });
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId !== 'dungeon')) break; }
  await g.frames(4);
  return r;
}
const a = await enter(1), b = await enter(20);
console.log(JSON.stringify({ a: { f1: a.f1.slice(0, 2), f2: a.f2.slice(0, 2), grade: a.grade, want: a.want }, n: a.all.length }));
const s1 = a.f1[0], s2 = a.f2[0];
check('the door is Very Easy, and plain Skeletons stand on both floors, tier 1 above and tier 2 below', a.grade === 'veryeasy' && !!s1 && !!s2 && s1.t === 1 && s2.t === 2, { grade: a.grade, s1, s2 });
check(`floor 2's Skeleton has ×1.75 floor 1's health (${s2 && s2.hp} against ${s1 && s1.hp}, to the rounding)`, !!s1 && !!s2 && s1.hp === a.want.hp1 && s2.hp === a.want.hp && Math.abs(s2.hp / s1.hp - 1.75) < .04, { s1, s2, want: a.want });
check(`its blow ×${a.want.dmg} (the sheet's 2.09) and its pace ×1.0: no ×1.5 or ×1.1 left`, !!s1 && !!s2 && Math.abs(s2.m / s1.m - a.want.dmg) < .001 && Math.abs(a.want.dmg - 2.09) < .01 && s2.s === s1.s, { s1, s2 });
check('every foe on both floors is the same at level 20 as at level 1: the roster is the floor\'s tier\'s (S1059)', JSON.stringify(a.all) === JSON.stringify(b.all), a.all.map((x, i) => [x, b.all[i]]).filter(([x, y]) => JSON.stringify(x) !== JSON.stringify(y)));
check('a tier-1 floor holds no Wraith, Gargoyle or Mimic (their least tier is 2)', a.all.filter(x => x[1] === 1).every(x => !['Wraith', 'Gargoyle', 'Mimic'].includes(x[0])), a.all.filter(x => x[1] === 1).map(x => x[0]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
