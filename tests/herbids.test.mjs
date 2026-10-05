// Session 514: the co-op rules' step 3, ids for what has none (CLAUDE.md, Michael's A on #119; backlog K). A herb in the open world
// is <chunk>:herb|verge|hot:<i> (the placing try that put it), a sea-bed herb <chunk>:seabed:<i>, a glade's ring <site>:herb:<i>.
// The try, not a running count: whether a spot is taken reads the solids and roads loaded at that moment, which one machine can
// have and another not yet, and a count would then shift every later herb's id. One chunk's herbs are placed twice, the second
// time with a box set down on one herb's spot: that herb is refused, every other keeps its id, its place and its kind, and the
// chunk's next try fills its count under that try's own id. Session 533: placed a third time with no town built, nothing changes
// (a herb's kind read the towns built so far, and CI, which had not built Dunmore when the chunk loaded, saw other kinds).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.spin(null, 240);

const all = await page.evaluate(() => { const H = ZONES.world.herbs; const ids = H.map(h => h.id);
  const re = /^(-?\d+,-?\d+:(herb|verge|hot|seabed):\d+|[^:]+:herb:\d+)$/;
  return { n: H.length, withId: ids.filter(id => typeof id === 'string').length, unique: new Set(ids).size, shaped: ids.filter(id => re.test(id)).length,
    kinds: [...new Set(ids.map(id => String(id).split(':').slice(-2, -1)[0]))], sample: ids.slice(0, 4) }; });
console.log('herbs', JSON.stringify(all));
check(`every herb in the loaded world has an id of its place and try, one each (${all.n} herbs; ${all.kinds.join('/')})`, all.n > 20 && all.withId === all.n && all.unique === all.n && all.shaped === all.n, all);

const twice = await page.evaluate(() => { const H = ZONES.world.herbs; const byChunk = {};
  for (const h of H) { const m = /^(-?\d+),(-?\d+):herb:\d+$/.exec(h.id || ''); if (m) (byChunk[m[1] + ',' + m[2]] = byChunk[m[1] + ',' + m[2]] || []).push(h); }
  const key = Object.keys(byChunk).sort((a, b) => byChunk[b].length - byChunk[a].length)[0]; if (!key) return { none: true };
  const [cx, cz] = key.split(',').map(Number); const live = {}; for (const h of H) if ((h.id || '').startsWith(key + ':')) live[h.id] = [+h.x.toFixed(3), +h.z.toFixed(3), h.type];
  const place = (treePts) => { const n0 = H.length, m0 = HERB_IMS.length, ch = { cx, cz, herbs: [], group: new THREE.Group(), treePts }; spawnChunkHerbs(ch); H.splice(n0); HERB_IMS.splice(m0); const out = {}; for (const h of ch.herbs) out[h.id] = [+h.x.toFixed(3), +h.z.toFixed(3), h.type]; return out; };
  const A = place(); const first = byChunk[key][0]; const box = { cx: first.x, cz: first.z, rx: .3, rz: .3 }; WORLD.STATIC_SOL.push(box);
  const B = place(); WORLD.STATIC_SOL.splice(WORLD.STATIC_SOL.indexOf(box), 1);
  const dense = []; for (let x = 0; x < 64; x += 2) for (let z = 0; z < 64; z += 2) dense.push(cx * 64 + x, cz * 64 + z); const D = place(dense); /* S533 — a chunk whose trees were all planted */
  const treeSame = Object.keys(A).filter(id => JSON.stringify(A[id]) === JSON.stringify(D[id])).length;
  const kept0 = [...SETTLE.entries()]; SETTLE.clear(); const C = place(); for (const [k, v] of kept0) SETTLE.set(k, v); /* S533 — as if no town had been built yet */
  const shared = Object.keys(A).filter(id => id in C), unbuilt = shared.filter(id => JSON.stringify(A[id]) === JSON.stringify(C[id])).length, towns = kept0.length, diff = shared.filter(id => JSON.stringify(A[id]) !== JSON.stringify(C[id])).map(id => [id, A[id][2], C[id][2]]);
  const aIds = Object.keys(A), bIds = Object.keys(B); const kept = bIds.filter(id => JSON.stringify(A[id]) === JSON.stringify(B[id])).length;
  const common = aIds.filter(id => id in live), asLive = common.filter(id => JSON.stringify(A[id]) === JSON.stringify(live[id])).length;
  return { chunk: key, live: Object.keys(live).length, a: aIds.length, b: bIds.length, asLive, common: common.length, refused: first.id, refusedGone: !(first.id in B), kept, inBoth: bIds.filter(id => id in A).length, added: bIds.filter(id => !(id in A)), unbuilt, towns, shared: shared.length, diff, treeSame }; });
console.log('twice', JSON.stringify(twice));
check(`placed again, chunk ${twice.chunk}'s herbs come back under the same ids, each where the world has it (${twice.asLive} of ${twice.common} shared; ${twice.a} now, ${twice.live} at load)`, !twice.none && twice.a > 3 && twice.common >= twice.live - 2 && twice.asLive === twice.common, twice);
check(`with ${twice.refused}'s spot taken by a solid it is refused; the other ${twice.inBoth} keep their ids, places and kinds, and a later try fills the gap under its own id (${twice.added.join(', ') || 'none'})`, !twice.none && twice.refusedGone && twice.inBoth === twice.a - 1 && twice.kept === twice.inBoth && twice.added.length <= 1 && twice.added.every(id => /:(herb|verge|hot):\d+$/.test(id)), twice);

check(`with no town built (${twice.towns} taken out), every herb placed both times has the same spot and kind (${twice.unbuilt} of ${twice.shared}; S533)`, !twice.none && twice.towns > 0 && twice.shared >= twice.a - 2 && twice.unbuilt === twice.shared, twice);
check(`a chunk that planted a tree on every spot gives every herb the same kind (${twice.treeSame} of ${twice.a}; S533: the kind read the trees planted so far)`, !twice.none && twice.treeSame === twice.a, twice);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
