// Session 543: the co-op rules' last unkeyed foes (backlog K, step 1): the legacy zones' foes and the Faolchú's lessers.
// A legacy zone's foe is <zone>:foe:<group>:<i>, the group's index in the zone's config (so a time-of-day filter or a
// respawn that leaves out a respawn:false group moves no other foe's id); the extra spots a spawn density over 1 adds,
// and every variant, come from that id, not Math.random. A lesser Faolchú is the boss's id and its count.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const built = await page.evaluate(() => { if (!ZONES.bealach_south) buildBealachSouth(); const z = ZONES.bealach_south;
  const ids = z.enemies.filter(e => e && !e.isBoss).map(e => e.id);
  return { n: ids.length, ids, keyed: z.enemies.filter(e => e && !e.isBoss).every(e => typeof e.id === 'string' && typeof e.rng === 'function'), groups: z._cfg.enemies.map(gr => gr.name + '×' + (gr.pos || []).length) }; });
console.log('built', JSON.stringify(built));
check(`Bealach South's ${built.n} foes each have an id of zone, group and count, and their own stream`, built.n > 0 && built.keyed && built.ids.every(id => /^bealach_south:foe:\d+:\d+$/.test(id)) && new Set(built.ids).size === built.n, built);

// respawned twice (the spawn density gives 1.5 a spot, so extras), Math.random fixed at 0.1 and then at 0.9: the same ids, spots and variants
const re = await page.evaluate(() => { const sdm = spawnDensityMultiplier, mr = Math.random; const runs = [];
  try { 
    for (const r of [.1, .9]) { Math.random = () => r; respawnZoneEnemies('bealach_south'); Math.random = mr;
      runs.push(ZONES.bealach_south.enemies.filter(e => e && !e.isBoss && !e._noRespawn).map(e => ({ id: e.id, x: +e.x.toFixed(3), z: +e.z.toFixed(3), v: e.name }))); } }
  finally { Math.random = mr; spawnDensityMultiplier = sdm; }
  const base = {}; for (const gr of ZONES.bealach_south._cfg.enemies) (gr.pos || []).forEach(p => { base[p[0] + ',' + p[1]] = 1; });
  const extras = runs[0].filter(f => !base[f.x + ',' + f.z]);
  return { a: runs[0], same: JSON.stringify(runs[0]) === JSON.stringify(runs[1]), extras: extras.length, n: runs[0].length, unique: new Set(runs[0].map(f => f.id)).size,
    variants: [...new Set(runs[0].map(f => f.v))] }; });
console.log('respawn', JSON.stringify({ same: re.same, n: re.n, extras: re.extras, unique: re.unique, variants: re.variants }));
check(`respawned at density 1.5: ${re.n} foes, ${re.extras} on extra spots, every id unique`, re.n === built.n && re.extras > 0 && re.unique === re.n, re);
check('with Math.random at 0.1 and then at 0.9, the respawn gives the same ids, spots and variants', re.same, re.a);

// the Faolchú's lessers: the boss's id and the count of its adds
const les = await page.evaluate(() => { const boss = keyFoe({ x: px + 6, z: pz, dead: false, isBoss: true, mesh: null }, 'ashenmoor:faolchu');
  const a = spawnLesserFaolchu(boss), b = spawnLesserFaolchu(boss); const out = { a: a && a.id, b: b && b.id, rng: !!(a && typeof a.rng === 'function'), spot: a && [+(a.x - boss.x).toFixed(2), +(a.z - boss.z).toFixed(2)] };
  despawnLesserFaolchus(); return out; });
console.log('lessers', JSON.stringify(les));
check(`a lesser Faolchú is the boss's id and its count (${les.a}, ${les.b}), with its own stream`, les.a === 'ashenmoor:faolchu:lesser:1' && les.b === 'ashenmoor:faolchu:lesser:2' && les.rng, les);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
