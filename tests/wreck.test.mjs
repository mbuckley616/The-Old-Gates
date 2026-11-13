// The wreck and the world's chests on the kit (Session 259, H.5): a sea-floor wreck is a hull broken in two, open ribs
// on a keel with rotted planking, a stem, a snapped mast; the wreck's sea chest and the lairs' and bandit camps' hoards
// are S198's kit chest at the old box's size, their lids opening on the hinge. Session 2170 adds the whale fall on the open bed.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const geo = WORLD.wreckGeo((() => { let a = 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })()); geo.computeBoundingBox(); const b = geo.boundingBox;
  const out = { tris: geo.attributes.position.count / 3, colours: !!geo.attributes.color, box: [b.min.x, b.max.x, b.min.y, b.max.y, b.min.z, b.max.z].map(v => +v.toFixed(2)) };
  // a picture: the wreck on a sand floor, from the side and from above
  forceTime(12); const sc = WORLD.scene, cv = REN.domElement, bx = px + 500, bz = pz, y = WORLD.worldH(bx, bz) + 90, tmp = [];
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ color: 0xb8a878 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); tmp.push(floor);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })); m.position.set(bx, y, bz); tmp.push(m); tmp.forEach(o => sc.add(o));
  const cam = new THREE.PerspectiveCamera(45, cv.width / cv.height, .3, 300); const shots = [];
  for (const [cx, cy, cz] of [[11, 4, 6], [4, 13, -6]]) { cam.position.set(bx + cx, y + cy, bz + cz); cam.lookAt(bx, y + .6, bz); sc.updateMatrixWorld(true); const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f;
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); shots.push(o.toDataURL()); }
  tmp.forEach(o => sc.remove(o)); out.shots = shots; return out; });
r.shots.forEach((u, i) => fs.writeFileSync(`tests/out/wreck-${i}.png`, Buffer.from(u.split(',')[1], 'base64'))); delete r.shots;
console.log(JSON.stringify(r));
check('a wreck is one vertex-coloured mesh of 1.5–6k triangles', r.colours && r.tris > 1500 && r.tris < 6000, r);
check('it lies about where the old one did (within ±4 across with the mast, ±7 along) and low (under 3.2), sunk into the floor (below −.3)', r.box[0] > -4 && r.box[1] < 4 && r.box[4] > -7 && r.box[5] < 7 && r.box[3] < 3.2 && r.box[2] < -.3, r.box);
// a hoard in a lair or a bandit camp near the start: the kit chest survives the site's bake whole and opens on its hinge
// WORLD.SITES holds only the loaded cells' places, and since the rivers (Session 432) the start loads the home cell alone, which
// has no lair or bandit camp: take them from the cells around and load the chosen one's cell (Session 453).
const c = await page.evaluate(() => { const [hi, hj] = WORLD.cellOf(px, pz); const ring = []; for (let i = hi - 2; i <= hi + 2; i++) for (let j = hj - 2; j <= hj + 2; j++) { const c = WORLD.getCell(i, j); if (c && c.sites) ring.push(...c.sites); } const near = ring.filter(t => (t.kind === 'lair' || t.kind === 'bcamp') && t.pad > 0).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  for (const t0 of near.slice(0, 6)) { WORLD.loadCell(...WORLD.cellOf(t0.x, t0.z)); const t = WORLD.SITE[t0.id] || t0; let S = WORLD.settlements.get(t.id); if (!S) S = WORLD.genSettlement(t); if (!S || !S.chest) continue; const ch = S.chest;
    const inScene = !!ch.g.parent, meshes = []; ch.g.traverse(o => { if (o.isMesh) meshes.push(o); }); const before = ch.lid.rotation.x;
    try { openLoot(ch); } catch (e) { return { id: t.id, err: String(e) }; } const after = ch.lid.rotation.x; try { closeLoot(); } catch (e) { }
    ch.g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(ch.g);
    return { id: t.id, kind: t.kind, inScene, meshes: meshes.length, before, after: +after.toFixed(3), size: [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z].map(v => +v.toFixed(2)) }; }
  return null; });
console.log(JSON.stringify(c));
check('a lair or bandit camp near the start has its hoard', !!c && !c.err, c);
if (c && !c.err) { check('the hoard is the kit chest (body and lid), still in the scene after the site\'s bake', c.inScene && c.meshes === 2, c);
  check('it opens on its hinge', c.before === 0 && c.after < -.9, c); }
// Session 2170 — the whale fall (OG-125, card F11; PKIT.places.whale, undersea.js's whaleFall): about one chunk of open bed in 800 lays a
// whale's bones, the same spots when asked again; the nearest is built when its chunk loads, one draw, her bones on the drawn bed, and a
// chunk left and entered again takes the same built bones back rather than building them twice
const wf = await page.evaluate(() => { const N = Math.ceil(WORLD.SIZE * GRID / CHUNK), L = []; for (let cx = 0; cx < N; cx++) for (let cz = 0; cz < N; cz++) { if (hash01(cx, cz, 170) > WHALE_FALL_ODDS) continue; const d = whaleFallSpot(cx, cz); if (d) L.push({ cx, cz, ...d }); }
  const again = L.every(d => { const e = whaleFallSpot(d.cx, d.cz); return e && e.x === d.x && e.z === d.z && e.ry === d.ry; }), wrecks = L.filter(d => wreckSpot(d.cx, d.cz)).length;
  L.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); return { n: L.length, again, wrecks, near: L[0] }; });
check(`${wf.n} whale falls lie on the open bed (60 to 300), the same when asked again, none in a wreck's chunk`, wf.n >= 60 && wf.n <= 300 && wf.again && wf.wrecks === 0, wf);
if (wf.near) { const D = wf.near, key = `${D.cx},${D.cz}`;
  await page.evaluate(D => WORLD.enter(D.x - 14, D.z + 6, 0, 'test'), D);
  for (let k = 0; k < 30; k++) { await g.spin('clear', 20); if (await page.evaluate(k => !!(chunks.get(k) && chunks.get(k).whale), key)) break; }
  const w = await page.evaluate(k => { const ch = chunks.get(k); if (!ch || !ch.whale) return { none: true }; const W = ch.whale, M = W.M, co = Math.cos(W.ry), s_ = Math.sin(W.ry), Wd = (u, v) => [W.x + u * co + v * s_, W.z - u * s_ + v * co];
    const sink = M.spine.filter(v => !v.loose).map(v => v.y - v.r * .6 - (meshH(...Wd(v.x, v.z)) - W.y)), mesh = W.group.children[0];
    const out = { tris: W.tris, draws: W.draws, colours: !!mesh.geometry.attributes.color, len: M.length, gap: M.gap, bed: W.bed, inScene: !!(W.group.parent === ch.group && ch.group.parent), sinkMin: +Math.min(...sink).toFixed(3), sinkMax: +Math.max(...sink).toFixed(3) };
    const grp = W.group; dropChunk(k); out.gone = !grp.parent || !grp.parent.parent; buildChunk(...k.split(',').map(Number)); const c2 = chunks.get(k); out.same = !!(c2 && c2.whale && c2.whale.group === grp && grp.parent === c2.group); return out; }, key);
  console.log(JSON.stringify(w));
  check(`the nearest is built with her chunk, on a bed ${w.bed} m down: ${w.tris} triangles in ${w.draws} draw (under 20k, one draw, vertex-coloured), ${w.len} m long`, !w.none && w.inScene && w.draws === 1 && w.tris < 20000 && w.colours && w.len > 18 && w.len < 21, w);
  check(`her vertebrae lie on the drawn bed, 5 to 12 cm into it (${w.sinkMin}..${w.sinkMax}); the cage's gap ${w.gap && w.gap.clear} m wide and ${w.gap && w.gap.high} m high`, w.sinkMin > -.12 && w.sinkMax < -.05 && w.gap && w.gap.clear > .9 && w.gap.high > 1.5, w);
  check('her chunk dropped takes her out of the scene, and loaded again takes the same bones back', w.gone && w.same, w); }
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
