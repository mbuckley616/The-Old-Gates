// A guard's blow before the yield (Session 1173, Michael's A on DECISION #456). A drawn guard offers the yield once you
// are under 30% health, checked between blows; on a new character (130) his light blow and then his heavy one (S1136,
// twice the damage) went 130 → ~75 → 0, so about one fight in four killed you with no offer (QA, S1158: minute 3 of the
// clock, 174 ticks). Now, until the offer is made, the blow that would cross the line stops just under it (38 of 130)
// and the next tick offers the yield. After *Fight on* his blows land in full. The guard here draws at each of the first
// 30 game minutes, so his heavy blows fall where each minute's key puts them.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

await page.evaluate(() => { forceTime(12); worldState.crime = {}; worldState.church = { notes: [] }; worldState.crimes = []; gold = 500; PHP = maxHP; updateHUD(); for (let i = 0; i < 240; i++) WORLD.tick(1 / 60, performance.now()); });

// one fight: a fine of 75, the guard draws at minute m, you stand 1.4 from him and take his blows until the offer or death
const fightAt = (m) => page.evaluate((m) => {
  const S = WORLD.settle.get('dunmore'); if (dlgOpen) closeDialog(); standDown(S); CR.yielded = false; worldState.crime = {}; /* no fine while the street settles, or a second guard halts you */
  for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); /* the stand-down: no guard drawn resets the offer */
  worldState.crime.dunmore = { bounty: 75, debt: 0 }; PHP = maxHP; PPOST.stagUntil = 0; worldState.gameTimeAbsMinutes = m + .5;
  const n = WORLD.guardsOf(S).find(n => n.g.visible && !n._retreated && !n._drawn); if (!n) return { none: true };
  const e = guardDraw(n, S); const dx = Math.sin(n.g.rotation.y), dz = Math.cos(n.g.rotation.y);
  px = e.x + dx * 1.4; pz = e.z + dz * 1.4; jumpY = 0; yaw = Math.atan2(dx, dz); blocking = false;
  const T0 = performance.now(); let i = 0; const hps = [PHP];
  for (; i < 60 * 120; i++) { const t = T0 + i * 1000 / 60; WORLD.tick(1 / 60, t); if (dlgOpen || PHP <= 0) break; tickZoneEnemies(1 / 60, t, ZONES.world.scene); if (PHP !== hps[hps.length - 1]) hps.push(PHP); }
  PPOST.stagUntil = 0;
  return { m, key: e.id, ticks: i, hp: PHP, hps, dlg: dlgOpen, who: dlgOpen ? document.getElementById('dlg-text').textContent.slice(0, 60) : '', offer: dlgOpen ? [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim().replace(/^\d+\.\s*/, '')) : [] };
}, m);

const runs = []; for (let m = 0; m < 30; m++) runs.push(await fightAt(m));
for (const r of runs) console.log('minute', r.m, r.key, 'ticks', r.ticks, 'hp', r.hps.join('→'), r.dlg ? 'offer' : 'NO OFFER', r.who, JSON.stringify(r.offer));
const line = await page.evaluate(() => Math.ceil(maxHP * .3) - 1); const max = await page.evaluate(() => maxHP);
const dead = runs.filter(r => r.hp <= 0), noOffer = runs.filter(r => !r.dlg);
const held = runs.filter(r => r.hps.includes(line));
console.log('line', line, 'of', max, 'dead', dead.length, 'no offer', noOffer.length, 'held at the line', held.length);
check(`over 30 drawn minutes a new character is never killed before the yield: every fight ends in the offer, alive (${runs.length - dead.length}/30)`, runs.length === 30 && !dead.length && !noOffer.length && runs.every(r => r.hp > 0 && r.hp < max * .3 && r.offer.some(c => /^Pay double/.test(c))), { dead, noOffer });
check(`the blow that crosses the line stops just under it, ${line} of ${max} (29%), in the fights where it would have gone further`, held.length > 0 && held.every(r => r.hp === line), held.map(r => r.hps));
const m3 = runs.find(r => r.m === 3);
check('minute 3, the fight that killed in CI (130 → ~75 → 0), now ends at the line with the offer', m3 && m3.dlg && m3.hp === line, m3);
const firsts = runs.filter(r => r.hps.length === 3).map(r => r.hps[1]);
check(`a blow that stays above the line lands in full: the light first blow takes 130 to 71–79 (${[...new Set(firsts)].sort().join(', ')})`, firsts.length > 0 && firsts.every(h => h > line && h >= max - 60 && h <= max - 50), firsts);

// the rule's edges, on the function itself
const edges = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); const e = ZONES.world.enemies.find(e => e._guard && !e.dead); const out = {}; const line = Math.ceil(maxHP * .3) - 1;
  CR.yielded = false; worldState.crime.dunmore = { bounty: 75 };
  PHP = 75; out.crossing = guardBlowCap(e, 110); PHP = 100; out.above = guardBlowCap(e, 20); PHP = 30; out.under = guardBlowCap(e, 50);
  CR.yielded = true; PHP = 75; out.fightOn = guardBlowCap(e, 110);
  CR.yielded = false; worldState.crime.dunmore = { bounty: 0, shut: true }; out.noFine = guardBlowCap(e, 110);
  worldState.crime.dunmore = { bounty: 75 }; out.notGuard = guardBlowCap({ name: 'Wolf' }, 110);
  out.line = line; if (dlgOpen) closeDialog(); standDown(S); PHP = maxHP; return out; });
console.log('edges', JSON.stringify(edges));
check('at 75 health a 110 blow is held to 75 − 38 = 37; at 100 a 20 blow lands whole', edges.crossing === 75 - edges.line && edges.above === 20, edges);
check('after Fight on (the offer made) the 110 blow lands whole, and so does one already under the line (no offer can be coming)', edges.fightOn === 110 && edges.under === 50, edges);
check('with no fine to offer terms on, and from anything not a drawn guard, the blow lands whole', edges.noFine === 110 && edges.notGuard === 110, edges);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
