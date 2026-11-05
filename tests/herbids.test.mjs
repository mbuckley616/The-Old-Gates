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
  const re = /^(-?\d+,-?\d+:(herb|verge|hot|seabed):\d+|[^:]+:herb:\d+|\d+:gp:\d+)$/; /* S1886 — a gate's plant is <seed>:gp:<i> */
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
// S1886 — the plants that mark a gate (Michael's B on #1164): a ring of its condition's plant round each old gate, keyed <seed>:gp:<i>
// from the seed alone; the Greenmeadow (ordinary herbs ×1.3 within 60 m of a failing or catastrophic gate); the plant read by what it looks
// like until a pick and an entry within the hour teach it, then by its name, the gate's condition and school
const GP = await page.evaluate(() => {
  const out = { conds: {} }, H = ZONES.world.herbs, [ci, cj] = cellOf(px, pz), found = {};
  for (let r = 0; r <= 3 && Object.keys(found).length < 3; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const c = getCell(ci + di, cj + dj); if (!c || !c.doors) continue;
    for (const e of c.doors) if (gateHerbDoor(e)) { const k = gateHerbCond(e); if (!found[k]) found[k] = e; } }
  const spawnAt = (e) => { const R = gateRing(e), [ex, ez] = [R.x, R.z], chunks = new Set(R.pts.map(p => Math.floor(p.at[0] / CHUNK) + ',' + Math.floor(p.at[1] / CHUNK))), recs = [];
    for (const k of chunks) { const [cx, cz] = k.split(',').map(Number), n0 = H.length, ch = { cx, cz, herbs: [{ id: 'probe', x: ex + 10, z: ez + 10, type: 'firemoss' }, { id: 'far', x: ex + 200, z: ez, type: 'firemoss' }] };
      spawnGateHerbs(ch); H.splice(n0); recs.push(...ch.herbs.filter(h => h.gate && h.gate.seed === e.seed)); if (!out.meadow) out.meadow = {}; out.meadow[gateHerbCond(e)] = [ch.herbs[0].gm || 1, ch.herbs[1].gm || 1]; }
    return { R, recs }; };
  for (const cond in found) { const e = found[cond], A = spawnAt(e), B = spawnAt(e), d = A.recs.map(h => Math.hypot(h.x - A.R.x, h.z - A.R.z));
    out.conds[cond] = { seed: e.seed, n: A.R.pts.length, recs: A.recs.length, ids: A.recs.every(h => new RegExp('^' + e.seed + ':gp:\\d+$').test(h.id)), unique: new Set(A.recs.map(h => h.id)).size,
      home: e.zone !== 'gen', type: [...new Set(A.recs.map(h => h.type))], school: A.recs[0] && A.recs[0].gate.school, want: gateSchool(e), dMin: Math.min(...d), dMax: Math.max(...d),
      same: JSON.stringify(A.recs.map(h => [h.id, h.x, h.z])) === JSON.stringify(B.recs.map(h => [h.id, h.x, h.z])), rec: A.recs[0] }; }
  // the prompt, the pick, the entry within the hour
  const any = Object.values(out.conds)[0], h = any && any.rec; out.rec = !!h;
  if (h) { const K = herbsKnown(), keepR = K.read, keepP = K.gatePick; delete K.read; delete K.gatePick;
    out.unread = herbPromptName(h); out.n0 = BAG.length; harvestHerb(h); out.bag = BAG.length > out.n0 ? BAG[BAG.length - 1].name : null; if (out.bag) BAG.pop();
    out.pick = K.gatePick && K.gatePick.seed === h.gate.seed; out.other = gateReadOnEnter({ seed: h.gate.seed + 1 });
    const t0 = worldState.gameTimeAbsMinutes; worldState.gameTimeAbsMinutes = (t0 || 0) + 61; out.late = gateReadOnEnter({ seed: h.gate.seed }); worldState.gameTimeAbsMinutes = t0;
    out.inTime = gateReadOnEnter({ seed: h.gate.seed }); out.read = herbPromptName(h); gateHerbPicked(h); out.again = gateReadOnEnter({ seed: h.gate.seed });
    K.read = keepR; K.gatePick = keepP; if (!keepR) delete K.read; if (!keepP) delete K.gatePick; }
  let gl = 0; for (let i = 0; i < 3000; i++) { const it = randomLootHerb(); if (it && /Lichenbloom|Gatelotus|Gate Resin/.test(it.name)) gl++; } out.loot = gl;
  out.fx = ['lichenbloom', 'gatelotus', 'gateresin'].map(k => [k, HERB_DEF[k] && HERB_DEF[k].zone, (HERB_FX[k] || []).some(f => f === 'nightEye' || f === 'featherfall')]);
  return out; });
console.log('gateplants', JSON.stringify(GP));
const PL = { steady: 'lichenbloom', failing: 'gatelotus', catastrophic: 'gateresin' };
const cs = Object.entries(GP.conds);
check(`each old gate keeps 6 to 10 of its condition's plant in a ring, 20 to 80 m out (Gate Resin to 120), keyed <seed>:gp:<i>: ${cs.map(([k, c]) => `${k} #${c.seed} ${c.recs} ${c.type} ${c.dMin.toFixed(0)}–${c.dMax.toFixed(0)} m`).join('; ')}`,
  cs.length >= 2 && cs.every(([k, c]) => c.recs === c.n && c.n >= 6 && c.n <= 10 && c.ids && c.unique === c.n && c.type.length === 1 && c.type[0] === PL[k] && c.dMin >= 20 && c.dMax <= (k === 'catastrophic' ? 120 : 80) + .01), GP.conds);
check('the ring is laid from the seed alone: placed twice, the same ids at the same spots; each plant carries its gate\'s school', cs.every(([k, c]) => c.same && c.school === c.want), GP.conds);
check(`the Greenmeadow: an ordinary herb 14 m from a failing or catastrophic gate stands ×1.3, from a steady one ×1; one 200 m off ×1 (${JSON.stringify(GP.meadow)})`,
  Object.entries(GP.meadow).every(([k, v]) => v[0] === (k === 'steady' ? 1 : 1.3) && v[1] === 1), GP.meadow);
check(`unread, the plant is what it looks like ("${GP.unread}"); picked, it is in the bag (${GP.bag}) and remembered; another gate or an entry after the hour teaches nothing`, GP.rec && !/gate of/.test(GP.unread) && !!GP.bag && GP.pick && !GP.other && !GP.late, GP);
check(`entered within the hour, its gate teaches it: "${GP.read}"; once only`, GP.inTime && /gate of/.test(GP.read) && !GP.again, GP);
check(`no barrel or corpse draws a gate's plant (${GP.loot} of 3,000); each is zone 'gate' and carries Night Eye or Featherfall`, GP.loot === 0 && GP.fx.every(f => f[1] === 'gate' && f[2]), GP.fx);
// S1887 — what reading gives: once a gate's condition's plant is read, its map entry and card say the condition and school; nothing before
const ML = await page.evaluate(() => { const K = herbsKnown(), keep = K.read, all = [];
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const [ci, cj] = cellOf(px, pz); all.push(...mapEntries(getCell(ci + di, cj + dj)).filter(o => /^door_/.test(o.id))); }
  const gates = all.filter(o => { const e = doorAnywhere(+o.id.slice(5)); return e && gateHerbDoor(e); }).map(o => { const e = doorAnywhere(+o.id.slice(5)); return { id: o.id, cond: gateHerbCond(e), school: SCHOOL_DEF[gateSchool(e)].name }; });
  const fail = gates.find(x => x.cond === 'failing'), other = gates.find(x => x.cond !== 'failing'), sub = id => { for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const [ci, cj] = cellOf(px, pz); const o = mapEntries(getCell(ci + di, cj + dj)).find(o => o.id === id); if (o) return o.sub; } return null; };
  delete K.read; const before = fail && sub(fail.id); K.read = { gatelotus: 1 }; const after = fail && sub(fail.id), otherAfter = other && sub(other.id);
  K.read = keep; if (!keep) delete K.read; return { n: gates.length, fail, other, before, after, otherAfter }; });
console.log('mapline', JSON.stringify(ML));
check(`a gate's map entry says nothing of its state until its plant is read ("${ML.before}"); then "${ML.after}"; a gate of another condition still says nothing ("${ML.otherAfter}")`,
  !!ML.fail && !/failing/.test(ML.before) && ML.after === ML.before + ` · failing, of ${ML.fail.school}` && !!ML.other && !/(steady|catastrophic|failing), of/.test(ML.otherAfter), ML);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
