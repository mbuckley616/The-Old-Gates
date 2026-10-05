// A feast day fills the square (Session 554; DECISION #132's rule, the feasts of Session 550): residents and villagers
// keep to the square, within 18 of its middle, and stay there through the evening until night.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { forceTime(12); const S = WORLD.settle.get('dunmore'); px = S.site.x + 20; pz = S.site.z + 20; });
await g.spin(null, 600); /* the residents come out within 70 units, two a tick */

const s = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); const at = (d, h) => { worldState.gameTimeAbsMinutes = d * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  const res = S.npcs.find(n => n.sched && n.sched.type === 'resident'), vil = S.npcs.find(n => n.sched && n.sched.type === 'villager');
  const sch = (n, d, h) => { at(d, h); const o = scheduleFor(n, h); return o.wander ? `wander ${o.r}` : o.hide ? 'hide' : o.go ? (o.thenHide ? 'go then hide' : 'go') : 'idle'; };
  return { res: !!res, vil: !!vil, padR: vil && vil.sched.padR, resPadR: res && res.sched.padR,
    resNoon: [sch(res, 21, 12), sch(res, 22, 12)], resEve: [sch(res, 21, 19), sch(res, 22, 19)], resNight: [sch(res, 21, 22), sch(res, 22, 22)],
    vilLate: [sch(vil, 21, 20.5), sch(vil, 22, 20.5)], vilNight: [sch(vil, 22, 21.5)] };
});
console.log(JSON.stringify(s));
const half = r => `wander ${Math.min(r, 18)}`;
check('a resident and a villager to watch', s.res && s.vil, s);
check('at noon on the feast they keep to the square, within 18 of its middle', s.resNoon[0] === `wander ${s.resPadR}` && s.resNoon[1] === half(s.resPadR), s.resNoon);
check('at seven in the evening a resident goes home or to the inn, but on the feast stays in the square', /^go/.test(s.resEve[0]) && s.resEve[1] === half(s.resPadR), s.resEve);
check('at half past eight a villager has gone in, but on the feast is still about', s.vilLate[0] === 'hide' && s.vilLate[1] === half(s.padR), s.vilLate);
check('night sends everyone in, feast or not', s.resNight.every(x => x === 'hide') && s.vilNight[0] === 'hide', { r: s.resNight, v: s.vilNight });

// in the street: the same evening hour, with the town's people ticking, an ordinary day and the feast
const count = [];
for (const d of [21, 22]) {
  await page.evaluate((d) => { worldState.gameTimeAbsMinutes = d * 1440 + 18.6 * 60; worldState.gameTimeMinutes = 18.6 * 60; const S = WORLD.settle.get('dunmore'); px = S.site.x + 30; pz = S.site.z + 30; }, d);
  await g.spin(null, 3600);
  count.push(await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), c = S.site; let near = 0, out = 0;
    for (const n of S.npcs) { if (!n.g.visible || n._retreated) continue; out++; if (Math.hypot(n.g.position.x - c.x, n.g.position.z - c.z) < 22) near++; }
    return { near, out, hour: +(worldState.gameTimeMinutes / 60).toFixed(2) }; }));
}
console.log(JSON.stringify(count));
// (the ordinary evening runs first and sends some indoors for good, so the two are compared by the share of those still out)
check('a minute into the evening, of those out, more are about the square on the feast', count[1].near >= count[0].near && count[1].near / count[1].out > count[0].near / count[0].out + .1, count);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
