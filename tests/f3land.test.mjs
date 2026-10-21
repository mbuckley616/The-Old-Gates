// Card F3, the land in the new look (Sessions 1180–1184, js/89-world-land.js): booted on three.js 0.170, the world's chunks are
// shaded by the land's own material, which paints fields, hedgerows, rock and the woods from afar over groundColor's vertex
// colour; every chunk carries a per-vertex mask that keeps the fields off roads and out of site stamps; the sky is a gradient
// dome that follows the clock; the world's frame is tone-mapped (ACES) and graded, and rooms are not. The console stays clean
// (a shader that fails to compile says so there). Draw calls at Dunmore at noon are logged against v2-scope.md §5's budget (docs/qa/budget.md does not exist yet).
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
await page.evaluate(() => forceTime(12));
await g.spin(null, 60); await g.frames(3);

const m = await page.evaluate(() => {
  const ch = [...WORLD.scene.children].filter(o => o.isGroup && o.children[0] && o.children[0].isMesh && o.children[0].geometry.attributes.aMask);
  const terr = ch.map(o => o.children[0]);
  const prog = REN.info.programs.find(p => p.cacheKey && p.cacheKey.includes('og-land-terrain'));
  // roads and stamps: no field on any vertex inside a road's half-width or a stamp's core
  let onRoad = 0, roadField = 0, inStamp = 0, stampField = 0, field = 0, verts = 0;
  for (const t of terr) { const pa = t.geometry.attributes.position, mk = t.geometry.attributes.aMask;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) + t.position.x, z = pa.getZ(i) + t.position.z; verts++;
      const ri = roadInfo(x, z), st = stampAt(x, z), f = mk.getZ(i); if (f > .05) field++;
      if (ri && ri.d < ROAD_HALF) { onRoad++; if (f > 0) roadField++; }
      if (st) { inStamp++; if (f > 0 || mk.getX(i) !== 1) stampField++; } } }
  return { on: LAND.on, chunks: ch.length, allLand: terr.every(t => t.material === LAND.mat), prog: !!prog, oldDome: skyDome.visible, dome: !!(LAND.sky && LAND.sky.parent === WORLD.scene && LAND.sky.visible),
    verts, field, onRoad, roadField, inStamp, stampField };
});
check('the new look\'s chunks are drawn by the land material, its program compiled', m.on && m.chunks >= 20 && m.allLand && m.prog, m);
check('fields are laid on the open country and never on a road or in a site\'s stamp', m.field > 0 && m.onRoad > 0 && m.roadField === 0 && m.inStamp > 0 && m.stampField === 0, m);
check('the gradient dome replaces the old sky dome', m.dome && !m.oldDome, m);

// the sky follows the clock: zenith brightest at noon, a warm horizon at dawn and at the golden hour (17.5; on the game's clock the
// sun is down by 18.5, so 20h is already night), dark at midnight. In clear weather: an overcast greys the zenith toward .5 by
// design, and the first run of this suite drew a sky that had clouded over (midnight's zenith .131 here, .185 on CI)
const sky = {};
for (const h of [6, 12, 17.5, 20, 0]) {
  sky[h] = await page.evaluate(h => { forceTime(h); const wx = WORLD.wx; wx.type = wx.next = 'clear'; wx.k = 1; for (let i = 0; i < 240; i++) WORLD.tick(1 / 60, performance.now()); const U = LAND.skyMat.uniforms;
    const L = c => +(.2126 * c.r + .7152 * c.g + .0722 * c.b).toFixed(3);
    return { zen: L(U.uZen.value), hor: L(U.uHor.value), warm: +(U.uHor.value.r / Math.max(.01, U.uHor.value.b)).toFixed(2), sunY: +U.uSun.value.y.toFixed(2) }; }, h);
}
check('the sky follows forceTime: noon\'s zenith brighter than 17.5h\'s, 17.5h\'s than midnight\'s, and 20h and midnight are night', sky[12].zen > sky[17.5].zen && sky[17.5].zen > sky[0].zen && sky[0].zen < .12 && sky[20].zen < .12, sky);
check('the sun rides the dome: up at noon, down at midnight', sky[12].sunY > .9 && sky[0].sunY < -.9, sky);
check('the horizon warms at sunrise and at the golden hour and is cooler at noon', sky[6].warm > sky[12].warm && sky[17.5].warm > sky[12].warm, sky);

// Session 1181: grass and wildflowers, streamed with the chunks. Out in the open country west of Dunmore, the chunks in the quality
// level's ring of the player's own grow instanced blades (a chunk a frame), none on a road, in a stamp or under the sea; the three
// levels change the counts, the sun's shadow map and the clouds, which are one instanced mesh, one draw call.
const field = await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); let best = null;
  for (let r = 60; r < 400 && !best; r += 20) for (let a = 0; a < 24; a++) { const x = t.x + Math.cos(a / 24 * 6.283) * r, z = t.z + Math.sin(a / 24 * 6.283) * r; const ri = roadInfo(x, z);
    if (stampAt(x, z) || (ri && ri.d < 20) || worldH(x, z) < 6) continue; best = { x: Math.round(x), z: Math.round(z) }; break; }
  px = best.x; pz = best.z; forceTime(11); for (let i = 0; i < 240; i++) WORLD.tick(1 / 60, performance.now()); return best; });
const grass = () => page.evaluate(() => { const cx = Math.floor(px / CHUNK), cz = Math.floor(pz / CHUNK), Q = landQ(); let chunksG = 0, blades = 0, flowers = 0, most = 0, ringN = 0, bad = 0, checked = 0;
  const M = new THREE.Matrix4(), v = new THREE.Vector3();
  for (const ch of chunks.values()) { const inRing = Math.abs(ch.cx - cx) <= Q.ring && Math.abs(ch.cz - cz) <= Q.ring; if (inRing) ringN++; const G = ch.landGrass; if (!G) continue; chunksG++;
    blades += G.grass.count; most = Math.max(most, G.grass.count); flowers += G.flowers ? G.flowers.count : 0;
    for (let i = 0; i < G.grass.count; i += 13) { G.grass.getMatrixAt(i, M); v.setFromMatrixPosition(M); const x = v.x + ch.cx * CHUNK, z = v.z + ch.cz * CHUNK; checked++;
      const ri = roadInfo(x, z); if ((ri && ri.d < ROAD_HALF) || stampAt(x, z) || v.y < SEA_Y) bad++; } }
  const f0 = LAND_BLOOM.frames; REN.render(scene, CAM); const bloom = LAND_BLOOM.frames - f0, calls = REN.info.render.calls;
  return { level: Q.name, cap: Q.grass, chunksG, ringN, blades, most, flowers, bad, checked, shadow: sun.shadow.mapSize.x, puffs: LAND.clouds ? LAND.clouds.count : 0, cloudMeshes: LAND.clouds ? 1 : 0, bloom, calls,
    row: settingRows().some(r => r.k === 'quality') }; });
const setQ = q => page.evaluate(q => { const row = settingRows().find(r => r.k === 'quality'); settingSet(row, q); for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now()); }, q);
const mid = await grass();
check('grass grows in every chunk of the middle level\'s ring, within its count, with wildflowers among it', mid.level === 'Middle' && mid.chunksG === mid.ringN && mid.ringN >= 4 && mid.blades > 2000 && mid.most <= mid.cap && mid.flowers > 0, { field, ...mid });
check('no blade stands on a road, in a site\'s stamp or under the sea', mid.checked > 100 && mid.bad === 0, mid);
check('the clouds are one instanced mesh of puffs (one draw call), and the settings sheet has the Quality row', mid.cloudMeshes === 1 && mid.puffs > 200 && mid.row, mid);
await setQ(2); const hi = await grass();
await setQ(0); const lo = await grass();
await setQ(1); const back = await grass();
check('the three levels change what the land spends: grass, the shadow map and the clouds', lo.blades === 0 && lo.puffs === 0 && lo.shadow === 1024 && mid.shadow === 2048 && hi.shadow === 4096 && hi.blades > mid.blades * 1.5 && hi.puffs > mid.puffs, { lo, mid, hi });
// Session 1184: a chunk whose ground changes after its grass grew (a stamp arriving flattens it, snow settles or melts) loses its
// grass and grows it again on the new ground: none left floating over a flattened pad, none standing on settled snow
const regrow = await page.evaluate(() => { const ch = [...chunks.values()].filter(c => c.landGrass).sort((a, b) => b.landGrass.grass.count - a.landGrass.grass.count)[0];
  const n0 = ch.landGrass.grass.count; const tick = () => { for (let i = 0; i < 12; i++) WORLD.tick(1 / 60, performance.now()); };
  refreshChunkTerrain(ch); const goneR = ch.landGrass === null; tick(); const n1 = ch.landGrass ? ch.landGrass.grass.count : -1;
  const keep = WORLD.wx.cover; WORLD.wx.cover = 1; recolourChunk(ch); const goneS = ch.landGrass === null; tick(); const nSnow = ch.landGrass ? ch.landGrass.grass.count : -1;
  WORLD.wx.cover = keep; recolourChunk(ch); tick(); const n2 = ch.landGrass ? ch.landGrass.grass.count : -1;
  return { n0, goneR, n1, goneS, nSnow, n2 }; });
check('new ground drops a chunk\'s grass and it grows again (the same blades); under settled snow far fewer; after the thaw all of it', regrow.goneR && regrow.n1 === regrow.n0 && regrow.goneS && regrow.nSnow >= 0 && regrow.nSnow < regrow.n0 * .3 && regrow.n2 === regrow.n0, regrow);
// Session 1183: bloom, the world's frame through a render target at Middle and High (a bright pass, the blur, the composite with
// ACES, the grade and the vignette), the direct path at Low; REN.info still counts the whole frame
check('bloom runs at Middle and High, not at Low, and the frame\'s draw calls are still counted whole', mid.bloom === 1 && hi.bloom === 1 && lo.bloom === 0 && mid.calls > 50, { lo: [lo.bloom, lo.calls], mid: [mid.bloom, mid.calls], hi: [hi.bloom, hi.calls] });
check('back at the middle level, the same grass grows again (a chunk\'s blades come from a stream seeded by the chunk)', back.blades === mid.blades && back.flowers === mid.flowers, { mid: mid.blades, back: back.blades });

// Session 1182: trees from leaf cards. The scatter decides every tree as before and the new look only draws it: build each loaded
// chunk's scatter again with the land off (the old look's meshes) and compare, species by species, every tree's matrix and colour,
// and the chunk's colliders and tree points. The leafy kinds and the conifers are the land's (one instanced mesh a species, a
// draw call each, as before); dead trees, scrub and mushrooms keep their old shapes.
const trees = await page.evaluate(() => {
  const out = { chunks: 0, land: 0, landMeshes: 0, kinds: {}, moved: 0, tint: 0, sol: 0, pts: 0, oldKinds: 0 };
  const M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), c1 = new THREE.Color(), c2 = new THREE.Color();
  for (const ch of chunks.values()) { if (out.chunks >= 25) break; out.chunks++;
    const g = new THREE.Group(), sol = []; LAND.on = false; try { scatterChunk(ch.cx, ch.cz, g, sol); } finally { LAND.on = true; }
    const pts = _treePts.slice();
    const mine = {}; ch.group.children.forEach(o => { if (o.isInstancedMesh && o.userData.scatter) mine[o.userData.scatter] = o; });
    for (const o of g.children) { if (!o.isInstancedMesh || !o.userData.scatter) continue; const sp = o.userData.scatter, m = mine[sp];
      if (!LAND_TREE_KIT[sp]) continue; out.kinds[sp] = (out.kinds[sp] || 0) + o.count;
      if (!m || !m.userData.landTree || m.count !== o.count) { out.moved += o.count; continue; } out.landMeshes++; out.land += m.count;
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M); m.getMatrixAt(i, M2); for (let k = 0; k < 16; k++) if (Math.abs(M.elements[k] - M2.elements[k]) > 1e-4) { out.moved++; break; }
        o.getColorAt(i, c1); m.getColorAt(i, c2); if (sp !== 'snowpine' && (Math.abs(c1.r - c2.r) + Math.abs(c1.g - c2.g) + Math.abs(c1.b - c2.b)) > 1e-4) out.tint++; } }
    if (Object.values(mine).some(o => !o.userData.landTree && LAND_TREE_KIT[o.userData.scatter])) out.oldKinds++;
    // colliders: every one the scatter made for this chunk is in the chunk's own list (later stamps may have taken some away)
    for (const s of sol) if (!ch.sol.some(t => Math.abs(t.cx - s.cx) < 1e-6 && Math.abs(t.cz - s.cz) < 1e-6 && Math.abs(t.rx - s.rx) < 1e-6)) out.sol++;
    for (let i = 0; i < ch.treePts.length; i += 2) { let hit = false; for (let k = 0; k < pts.length; k += 2) if (pts[k] === ch.treePts[i] && pts[k + 1] === ch.treePts[i + 1]) { hit = true; break; } if (!hit) out.pts++; }
    g.traverse(o => { if (o.isInstancedMesh) { o.geometry.dispose(); o.dispose(); } }); }
  return out; });
check('every leafy tree and conifer stands where the old look puts it, at its size, turn and tint, drawn from leaf cards', trees.land > 50 && trees.moved === 0 && trees.tint === 0 && trees.oldKinds === 0, trees);
check('the trees keep their colliders and tree points', trees.sol === 0 && trees.pts === 0, trees);

// the post: the world's frame is tone-mapped and graded, and the renderer is left as it was after it
const post = await page.evaluate(() => { forceTime(12); for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
  let during = null; const sc = WORLD.scene, ob = sc.onBeforeRender; sc.onBeforeRender = (...a) => { ob(...a); during = REN.toneMapping; };
  REN.render(scene, CAM); sc.onBeforeRender = ob;
  return { during, after: REN.toneMapping, aces: THREE.ACESFilmicToneMapping, graded: THREE.ShaderChunk.tonemapping_fragment.includes('og-grade'), calls: REN.info.render.calls, tris: REN.info.render.triangles }; });
check('the world renders with ACES and the grade, and the renderer goes back to no tone mapping after it', post.during === post.aces && post.after === 0 && post.graded, post);
// Dunmore at noon, from the street: v2-scope.md §5's budget line, logged
const d = await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 4; yaw = 0; pitch = 0; for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.rotation.set(0, 0, 0); CAM.updateMatrixWorld(true);
  const t0 = performance.now(); REN.render(scene, CAM); const ms = performance.now() - t0; return { calls: REN.info.render.calls, tris: REN.info.render.triangles, ms: Math.round(ms) }; });
console.log('  budget: Dunmore at noon, the new land:', JSON.stringify(d));
check('Dunmore at noon stays under the budget\'s 1,000 draw calls', d.calls > 50 && d.calls < 1000, d);

// a room is tone-mapped too (Session 1257, the critic's s782: a lamp near a keeper clipped skin and cloth to white), and the
// renderer goes back to no tone mapping after it, for the hands
const room = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'inn') || S.houses[0]; px = h.exitX; pz = h.exitZ; goToInterior(h); return h.type; });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
const rm = await page.evaluate(() => { let tm = -1; const sc = scene, ob = sc.onBeforeRender; sc.onBeforeRender = (...a) => { ob && ob(...a); tm = REN.toneMapping; }; REN.render(scene, CAM); sc.onBeforeRender = ob;
  return { inside: isInterior(), tm, after: REN.toneMapping, neutral: THREE.NeutralToneMapping, ex: REN.toneMappingExposure }; });
check('indoors the frame is tone-mapped (the neutral curve, which keeps the firelight\'s hue), and the renderer goes back to no tone mapping after it', rm.inside && rm.tm === rm.neutral && rm.after === 0, { room, ...rm });

const errs = g.logs.filter(l => /error/i.test(l) && !/favicon|net::|Failed to load resource/.test(l));
check('no shader or page errors', g.errs.length === 0 && errs.length === 0, { errs: g.errs.slice(0, 3), logs: errs.slice(0, 3) });
await g.close();
