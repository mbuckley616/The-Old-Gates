// Session 517: the co-op rules' step 3, ids for what has none (CLAUDE.md, Michael's A on #119; backlog K). A door inside a
// building is <house id>:door:<n>, in the order the room hangs it (the dungeon's are <seed>:1:door:<n>, checked in dunseed).
// Every room of Dunmore is built twice: each door has the same id at the same spot both times, and no two doors share one.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const r = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const build = () => { const out = [];
    for (const h of S.houses) { if (h.type === 'castle') continue; WORLD.buildInteriorFor(h);
      (WORLD.intDoors || []).forEach((d, i) => out.push({ house: h.id, i, id: d.id, at: [+d.x.toFixed(3), +d.z.toFixed(3)] })); }
    return out; };
  const A = build(), B = build();
  return { n: A.length, houses: new Set(A.map(d => d.house)).size, named: A.filter(d => d.id === d.house + ':door:' + d.i).length,
    unique: new Set(A.map(d => d.id)).size, same: JSON.stringify(A) === JSON.stringify(B), sample: A.slice(0, 3).map(d => d.id) }; });
console.log('doors', JSON.stringify(r));
check(`every door in Dunmore's rooms is <house id>:door:<n> (${r.n} doors in ${r.houses} buildings: ${r.sample.join(', ')})`, r.n >= 15 && r.named === r.n, r);
check('no two doors share an id, and a room built again gives each door the same id at the same spot', r.unique === r.n && r.same, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
