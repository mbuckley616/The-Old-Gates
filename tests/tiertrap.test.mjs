// Enemies by place, the traps and the fire (Session 1061; the designer's sheet on Michael's A on #373): a spike, a swinging blade and
// a wyrm's fire take the tier's level of the floor you stand on, not yours. A spike lands 8–15 on a tier-1 floor and 16–23 on a
// tier-3 one, before armour, the same at level 1 and level 30, and the same spike rolls the same. Session 1111: a revealed mimic's
// pounce too, 14 + the tier's level on its multiplier (it read your level).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const home = getCell(HOME_I, HOME_J).regions, C = home.find(q => q.id === 'coastal'), W = home.find(q => q.id === 'wastes');
  const keep = { z: activeZoneId, p: currentPortal, f: currentFloor, L: level }, out = {};
  try {
    for (const [name, R] of [['t1', C], ['t3', W]]) for (const L of [1, 30]) {
      activeZoneId = 'dungeon'; currentPortal = { zone: 'world', x: R.x, z: R.z, seed: 4242 }; currentFloor = 1; level = L;
      const spikes = []; for (let i = 0; i < 400; i++) spikes.push(spikeTrapRaw({ id: 'tiertrap:' + i }));
      out[name + '/' + L] = { tier: tierHere(), lo: Math.min(...spikes), hi: Math.max(...spikes), sum: spikes.reduce((a, b) => a + b, 0), blade: bladeTrapRaw(), fire: +wyrmFireRaw().toFixed(2), pounce: mimicPounceRaw({ dmgMult: 1 }), pounceOwn: mimicPounceRaw({ tier: 2, dmgMult: 1.5 }) }; }
    currentPortal = { zone: 'world', x: C.x, z: C.z, seed: 4242 }; currentFloor = 2; level = 1; out.t1floor2 = { tier: tierHere(), blade: bladeTrapRaw() };
  } finally { activeZoneId = keep.z; currentPortal = keep.p; currentFloor = keep.f; level = keep.L; }
  return out; });
console.log(JSON.stringify(r));
const a = r['t1/1'], b = r['t1/30'], c = r['t3/1'], d = r['t3/30'];
check(`a spike on a tier-1 floor lands ${a.lo}–${a.hi} before armour (the sheet's 8–15)`, a.tier === 1 && a.lo === 8 && a.hi === 15, a);
check(`a spike on a tier-3 floor lands ${c.lo}–${c.hi} (the sheet's 16–23)`, c.tier === 3 && c.lo === 16 && c.hi === 23, c);
check('the same spikes roll the same at level 30 as at level 1, on both floors', JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(c) === JSON.stringify(d), { a, b, c, d });
check(`a swinging blade lands ${a.blade} on tier 1 and ${c.blade} on tier 3 (10 + 1.2 × the tier's level)`, a.blade === 11 && c.blade === 23, { a: a.blade, c: c.blade });
check(`a wyrm's fire is ${a.fire} at tier 1 and ${c.fire} at tier 3 (18 + 1.4 × the tier's level)`, Math.abs(a.fire - 19.4) < .01 && Math.abs(c.fire - 33.4) < .01, { a: a.fire, c: c.fire });
check(`a mimic's pounce is ${a.pounce} at tier 1 and ${c.pounce} at tier 3 (14 + the tier's level), the same at level 30`, a.pounce === 15 && c.pounce === 25 && b.pounce === 15 && d.pounce === 25, { a: a.pounce, b: b.pounce, c: c.pounce, d: d.pounce });
check('a mimic built at tier 2 pounces at its own tier, on its multiplier: (14 + 6) × 1.5 = 30', a.pounceOwn === 30 && d.pounceOwn === 30, { a: a.pounceOwn, d: d.pounceOwn });
check('floor 2 of a tier-1 door is tier 2: the blade lands 17', r.t1floor2.tier === 2 && r.t1floor2.blade === 17, r.t1floor2);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
