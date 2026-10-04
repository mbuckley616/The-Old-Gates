// Session 481: a slain slime's split (backlog K step 1). The two Small Slimes fall where the slain slime's own stream puts
// them, and each is keyed by it, <slime's id>:s<k>, so it rolls its own fight. One gate entered twice stands in for two
// machines: the same slime, killed in each, splits to the same spots with the same ids. On the old code the spots were
// Math.random and the small slimes had no id.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const seeds = await page.evaluate(() => { const out = []; for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) { const c = WORLD.getCell(i, j); for (const e of (c && c.doors) || []) if (e && e.seed != null && !e.lair) out.push(e.seed); } return out; });
const split = (seed, stir) => page.evaluate(async ([seed, stir]) => { const wait = ms => new Promise(r => setTimeout(r, ms));
  for (let k = 0; k < stir; k++) Math.random();
  const d = WORLD.doorAnywhere(seed); if (!d) return null; const p = makePortalDef(d); const wp = (WORLD.dungeonPos || {})[seed]; if (wp) { p.x = wp.x; p.z = wp.z; px = wp.x; pz = wp.z + 3; } p.zone = 'world';
  goToDungeon(p); for (let k = 0; k < 40 && !(activeZoneId === 'dungeon' && ENEMIES.length); k++) await wait(500); await wait(800);
  const e = ENEMIES.find(f => !f.dead && f.baseType === 'Slime' && f.variant !== 'small' && f.floor === currentFloor);
  if (!e) return { seed, none: true };
  const n0 = ENEMIES.length; e.hp = 0; e.x = e.homeX; e.z = e.homeZ; killE(e);
  const kids = ENEMIES.slice(n0).map(k => [k.id || null, Math.round(k.x * 1000) / 1000, Math.round(k.z * 1000) / 1000, typeof k.rng === 'function']);
  return { seed, name: p.name, slime: e.id, kids }; }, [seed, stir]);
const leave = async () => { await page.evaluate(() => goToOW()); await page.waitForTimeout(4000); await g.hide(); };

let a = null, b = null;
for (const s of [519737, ...seeds.filter((_, i) => i % 37 === 0)]) { a = await split(s, 0); await leave(); if (a && !a.none) { b = await split(s, 211); await leave(); break; } }
console.log('split', JSON.stringify(a), JSON.stringify(b));
check(`a slime was found and slain twice in one gate (${a && a.name}, ${a && a.slime})`, a && b && !a.none && !b.none && a.slime === b.slime && a.kids.length === 2, { a, b });
check(`it splits to the same two spots on both (${a && a.kids.map(k => k[1] + ',' + k[2]).join(' ')} | ${b && b.kids.map(k => k[1] + ',' + k[2]).join(' ')})`, a && b && JSON.stringify(a.kids) === JSON.stringify(b.kids), { a, b });
check(`each small slime is keyed by it, <id>:s0 and <id>:s1, with a stream`, a && a.kids.every((k, i) => k[0] === `${a.slime}:s${i}` && k[3]), a);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
