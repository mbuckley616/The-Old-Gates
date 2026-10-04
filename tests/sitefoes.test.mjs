// Session 479: the co-op rules' ids and streams (backlog K steps 1 and 3) for the foes that belong to a place: a site's own
// beasts and bands (`siteCreatures`: lairs, bandit camps) are <site>:foe:<index>, a siege camp's or a garrison's soldiers
// are <town>:<siege|occupied>:<index>, each with its own stream; a site's beast draws its variant from its id. On the old
// code none of them had an id.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
const tick = (n) => page.evaluate((n) => { for (let i = 0; i < n; i++) { WORLD.tick(1 / 60, performance.now()); tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); } }, n);
const band = (tag) => page.evaluate((tag) => ZONES.world.enemies.filter(e => e._siege === 'dunmore' && !e.dead && e.mesh && e.mesh.parent).map(e => ({ id: e.id || null, rng: typeof e.rng === 'function', name: e.name })), tag);

// the siege camp, then the garrison
await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z; PHP = maxHP; const st = WORLD.TS(t); st.flags.besieged = worldState.gameTimeAbsMinutes || 0; st.siegeBy = 'mark'; st.siegeDay = 0; });
await tick(120);
const siege = await band();
await page.evaluate(() => { const st = WORLD.TS(WORLD.siteAnywhere('dunmore')); delete st.flags.besieged; delete st.siegeBy; st.flags.occupied = worldState.gameTimeAbsMinutes || 0; st.occupier = 'mark'; });
await tick(120);
const garrison = await band();
await page.evaluate(() => { const st = WORLD.TS(WORLD.siteAnywhere('dunmore')); delete st.flags.occupied; delete st.occupier; });
await tick(30);
console.log('siege', JSON.stringify(siege), '\ngarrison', JSON.stringify(garrison));
const idsOf = (L, re) => L.length > 0 && L.every(e => re.test(e.id || '') && e.rng) && new Set(L.map(e => e.id)).size === L.length;
check(`the siege camp's ${siege.length} soldiers are dunmore:siege:<k>, one id each, with a stream (${siege.map(e => e.id).join(' ')})`, idsOf(siege, /^dunmore:siege:\d+$/), siege);
check(`the garrison's ${garrison.length} are dunmore:<kind>:<k>, not the camp's (${garrison.map(e => e.id).join(' ')})`, idsOf(garrison, /^dunmore:[a-z]+:\d+$/) && garrison.every(e => !/:siege:/.test(e.id)), garrison);

// a bandit camp or a lair: the nearest, its cell loaded, you at its edge until its creatures stand
const site = await page.evaluate(() => { const [hi, hj] = WORLD.cellOf ? WORLD.cellOf(px, pz) : [0, 0];
  let best = null, bd = 1e9; for (let i = hi - 4; i <= hi + 4; i++) for (let j = hj - 4; j <= hj + 4; j++) { const c = WORLD.getCell(i, j); for (const t of (c && c.sites) || []) { if (!/^(bcamp|lair)$/.test(t.kind) || !(t.pad > 0)) continue; const d = Math.hypot(t.x - px, t.z - pz); if (d < bd) { bd = d; best = t; } } }
  if (!best) return null; px = best.x + (best.pad || 30) + 6; pz = best.z; return { id: best.id, kind: best.kind, name: best.name, d: Math.round(bd) }; });
let foes = [];
for (let k = 0; k < 20 && site; k++) { await g.spin(null, 30); foes = await page.evaluate((id) => ZONES.world.enemies.filter(e => e._site === id).map(e => ({ id: e.id || null, rng: typeof e.rng === 'function', name: e.name, variant: e.variant || '' })), site.id); if (foes.length) break; }
console.log('site', JSON.stringify(site), JSON.stringify(foes));
const re = site ? new RegExp('^' + site.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':foe:\\d+$') : /x^/;
check(`${site && site.name} (${site && site.kind}, ${site && site.d} units off): its ${foes.length} creatures are <site>:foe:<index>, one id each, with a stream`, idsOf(foes, re), { site, foes });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
