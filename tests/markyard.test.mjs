// The Mark's training yard (Session 1657; arenas-build.md session 2, Michael's B on #914): every Markish town or city with a Fighters'
// Guild hall has a yard (PKIT.mk.yard) on the new look: a 5 m rope ring on trodden earth, the staff rack and a bench. Its place is the
// first clear one behind the hall, else outside the walls on the hall's side: clear of every road, lot and solid, on ground that falls
// under 1.6 m across it, with no tree left in it. The rack and the bench are solid; the ring is open. It costs the town's kit no more
// than two draws (the rope and the earth; the stakes, rack and bench are the halls' own wood).
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const id = await page.evaluate(() => { anchoredPlaces(); const S = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites); return (S.find(s => s.kind === 'town') || {}).id; });
check(`a Markish town (${id}) stands`, !!id && await g.settle(id));
const r = await page.evaluate(id => {
  const S = WORLD.settle.get(id), hall = S.houses.find(h => h.type === 'guild_f'), Y = (S.yards || [])[0]; if (!Y) return { none: true, hall: !!hall };
  let lo = 1e9, hi = -1e9; for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; for (const f of [0, .5, 1]) { const y = worldH(Y.x + Math.cos(a) * 6 * f, Y.z + Math.sin(a) * 6 * f); lo = Math.min(lo, y); hi = Math.max(hi, y); } }
  let road = 1e9; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, ri = roadInfo(Y.x + Math.cos(a) * 6, Y.z + Math.sin(a) * 6); if (ri) road = Math.min(road, ri.d - ROAD_HALF); }
  let ringOpen = true; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; for (const f of [0, .4, .8]) if (solidAt(Y.x + Math.cos(a) * 5 * f, Y.z + Math.sin(a) * 5 * f)) ringOpen = false; }
  let trees = 0; const m = new THREE.Matrix4(), v = new THREE.Vector3();
  for (const ch of chunks.values()) for (const o of ch.group.children) { if (!o.isInstancedMesh || !o.userData.scatter) continue; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); v.setFromMatrixPosition(m); if (Math.hypot(v.x - Y.x, v.z - Y.z) < 5.8) trees++; } }
  let kitG = null; S.group.traverse(x => { if (x.name === 'kit houses') kitG = x; });
  const T = PKIT.mk.yard(), mats = new Set(); T.group.children.forEach(c => mats.add(c.material)); const M = PKIT.mk.mats(), own = [M.beam, M.carve, M.wall[1], M.wall[2]];
  return { hall: !!hall, n: S.yards.length, out: Y.out, r: Y.r, tris: Y.tris, draws: Y.draws, fall: +(hi - lo).toFixed(2), road: +road.toFixed(1), rackSolid: solidAt(Y.rack.x + (Y.rack.x - Y.x) / 5.1 * .9, Y.rack.z + (Y.rack.z - Y.z) / 5.1 * .9), ringOpen, trees,
    inKit: !!kitG && kitG.children.length > 0, newMats: [...mats].filter(x => !own.includes(x)).length, prompt: typeof yardRackPrompt === 'function' };
}, id);
console.log(JSON.stringify(r));
check(`${id}'s Fighters' Guild has its yard: a ${r.r} m ring, ${r.tris} triangles${r.out ? ', outside the walls on the hall\'s side' : ', behind the hall'}`, r.hall && r.n === 1 && r.r === 5 && r.tris < 2500, r);
check(`its ground falls ${r.fall} m across it, ${r.road > 1e8 ? 'no road near it' : 'the nearest road ' + r.road + ' m off its edge'}, no tree in it (${r.trees})`, r.fall < 1.6 && r.road >= 1.4 && r.trees === 0, r);
check('the rack is solid and the ring is open', r.rackSolid && r.ringOpen, r);
check(`it adds at most two materials to the town's kit (${r.newMats}: the rope and the earth)`, r.inKit && r.newMats <= 2, r);
check('no errors', g.errs.length === 0, g.errs);
await g.close();
