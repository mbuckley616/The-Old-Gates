// Session 545: the look builder's ask (Session 541): the lair, the glade and the bandit camp in the mesh inspector need a
// geometry-only builder split out of 87-world-quests.js, as the tower and the shrine have. gladeGeoParts, lairGeoParts and
// campGeoParts build each place's look on the builder's own rolls, in the same order; buildGlade, buildLair and
// buildBanditCamp place their result in the world, and WORLD.poiPreview(kind, seed) builds it on a stage at the origin.
// Checked here: each preview builds, the same seed gives the same place, it touches nothing in the world, and a real
// site's look comes from the same function (its rock, its kit, its reeds and log, its trees).
// (Measured once, not kept as a check: 7 real sites, 3 glades, 3 lairs and a camp, built before and after the split
// give the same meshes, vertex positions, matrices, solids, platforms, herbs, foes and chest; colour jitter is Math.random.)
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const pv = await page.evaluate(() => {
  const world = () => ({ st: STAMPS.length, pl: ZONES.world.platforms.length, hb: ZONES.world.herbs.length, en: ZONES.world.enemies.length, co: ZONE_CORPSES.length, li: LSRC.length, se: SETTLE.size, sol: STATIC_SOL.length });
  const w0 = world(); const out = {};
  const sig = grp => { const a = []; grp.updateMatrixWorld(true); grp.traverse(o => { if (!o.geometry) return; const p = o.geometry.attributes.position; a.push(o.type + ':' + p.count + ':' + o.matrixWorld.elements.map(v => v.toFixed(3)).join(',') + ':' + [0, 1, 2, p.count * 3 - 1].map(i => p.array[i].toFixed(4)).join(',')); if (o.isInstancedMesh) a.push(Array.from(o.instanceMatrix.array.slice(12, 15)).map(v => v.toFixed(3)).join()); }); return a.join('|'); };
  for (const k of ['glade', 'lair', 'bcamp']) { const a = WORLD.poiPreview(k, 7), b = WORLD.poiPreview(k, 7), c = WORLD.poiPreview(k, 8);
    let tris = 0, meshes = 0; const box = new THREE.Box3().setFromObject(a);
    a.traverse(o => { if (o.geometry) { meshes++; const p = o.geometry; tris += (p.index ? p.index.count : p.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); } });
    out[k] = { meshes, tris: Math.round(tris), same: sig(a) === sig(b), other: sig(a) !== sig(c), size: box.getSize(new THREE.Vector3()).toArray().map(v => +v.toFixed(1)), centre: box.getCenter(new THREE.Vector3()).toArray().map(v => +v.toFixed(1)) }; }
  out.none = WORLD.poiPreview('tower', 7) === null && WORLD.poiPreview('city', 7) === null;
  const w1 = world(); out.world = { w0, w1, same: JSON.stringify(w0) === JSON.stringify(w1) };
  return out; });
console.log(JSON.stringify(pv));
for (const k of ['glade', 'lair', 'bcamp']) {
  const x = pv[k];
  check(`${k}: the preview builds (${x.meshes} meshes, ${x.tris} triangles, ${x.size.join(' × ')} about ${x.centre.join(',')})`, x.meshes >= 2 && x.tris > 1000 && Math.abs(x.centre[0]) < 15 && Math.abs(x.centre[2]) < 15, x);
  check(`${k}: the same seed builds the same place, another seed another`, x.same && x.other, x);
}
check('a kind with no preview (the tower and shrine have poiGeo; a town) gives null', pv.none, pv.none);
check('building the three previews touches nothing in the world: stamps, platforms, herbs, foes, chests, lights, places, solids', pv.world.same, pv.world);

// a real site's look is the geometry function's (built with the bake held off, so its pieces can be read back): its first draws (after a glade's pond) are the look's, so the same
// stream gives the same rock, kit or reeds, and the same trees, tents or bones in the same places
for (let k = 0; k < 40 && !(await page.evaluate(() => ['glade', 'lair', 'bcamp'].every(kind => SITES.some(t => t.kind === kind && t.pad > 0)))); k++) await page.waitForTimeout(1500); // the cells round you list their places as they load
const real = await page.evaluate(() => { const out = {}; const p0 = { x: px, z: pz };
  for (const kind of ['glade', 'lair', 'bcamp']) {
    const site = SITES.filter(t => t.kind === kind && t.pad > 0).sort((a, b) => Math.hypot(a.x - p0.x, a.z - p0.z) - Math.hypot(b.x - p0.x, b.z - p0.z))[0];
    if (!site) { out[kind] = { none: true }; continue; }
    if (SETTLE.has(site.id)) disposeSettlement(site.id); const bk = bakeSettlement; bakeSettlement = () => {}; let S; try { S = genSettlement(site); } finally { bakeSettlement = bk; } /* unbaked, so each piece can be read back */ const cx = site.x, cz = site.z, y = worldH(cx, cz);
    const r = rngFor(site.c * 31 + 7, site.r * 17 + 3); const meshes = []; S.group.traverse(o => { if (o.isMesh && o.geometry) meshes.push(o); });
    const P = g => Array.from(g.attributes.position.array.filter((_, i) => i % 97 === 0)).map(v => v.toFixed(4)).join();
    const hasGeo = geo => { const s = P(geo), n = geo.attributes.position.count; return meshes.some(m => m.geometry.attributes.position.count === n && P(m.geometry) === s && Math.abs(m.position.x - cx) < 1e-6 && Math.abs(m.position.z - cz) < 1e-6); };
    let res;
    if (kind === 'lair') { const lp = lairGeoParts(r, cx, cz, worldH); const bones = meshes.filter(m => m.geometry.type === 'BoxGeometry' && Math.abs(m.geometry.parameters.width - .12) < 1e-6);
      res = { rock: hasGeo(lp.rock), bones: lp.bones.length === bones.length && lp.bones.every((B, i) => Math.abs(bones[i].position.x - B.x) < 1e-6 && Math.abs(bones[i].position.z - B.z) < 1e-6 && Math.abs(bones[i].rotation.y - B.ry) < 1e-6) }; }
    else if (kind === 'bcamp') { const cp = campGeoParts(r, cx, cz, site.pad, worldH); const tents = meshes.filter(m => m.userData.noBake && m.geometry.attributes.position.count === cp.tents[0].geo.attributes.position.count);
      res = { kit: hasGeo(cp.kit), tents: cp.tents.length === tents.length && cp.tents.every((T, i) => Math.abs(tents[i].position.x - T.x) < 1e-6 && Math.abs(tents[i].position.z - T.z) < 1e-6 && Math.abs(tents[i].rotation.y - T.ry) < 1e-6) }; }
    else { const hiM = meshes.find(m => m.userData.lod === 'hi'); const y0 = hiM ? hiM.position.y : y; /* the builder read the height before its pond was stamped */ const pr = 11 + r() * 4; const gp = gladeGeoParts(r, cx, cz, y0, pr, site.pad, worldH); let im = null; S.group.traverse(o => { if (o.isInstancedMesh && o.count === 10 && o.geometry === PROTO.broadleaf) im = o; });
      const tr = im ? gp.trees.every((T, i) => { const e = im.instanceMatrix.array; return Math.abs(e[i * 16 + 12] - T.x) < 1e-3 && Math.abs(e[i * 16 + 14] - T.z) < 1e-3; }) : false;
      res = { reeds: hasGeo(gp.hi) || null, far: hasGeo(gp.lo) || null, trees: tr }; }
    disposeSettlement(site.id); out[kind] = { site: site.id, ...res }; }
  return out; });
console.log(JSON.stringify(real));
check(`a real lair (${real.lair.site}) is built from lairGeoParts: its rock heap and its eight bones`, real.lair.rock && real.lair.bones, real.lair);
check(`a real bandit camp (${real.bcamp.site}) is built from campGeoParts: its kit and its tents`, real.bcamp.kit && real.bcamp.tents, real.bcamp);
check(`a real glade (${real.glade.site}) is built from gladeGeoParts: its reeds and log, their distant copy, its ten trees`, real.glade.reeds && real.glade.far && real.glade.trees, real.glade);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
