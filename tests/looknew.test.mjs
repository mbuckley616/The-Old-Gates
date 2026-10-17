// The renderer's switch (Session 822, card F1 of docs/design/visual-foundation.md): `?look=new` boots the same game on three.js
// 0.170 (vendor/three.r170.min.js, made by scripts/three_bundle.py), with js/05-compat.js putting back r128's colour and light.
// Booted on the new look, this walks the game's main scenes: the world, Dunmore with townsfolk whose skinned meshes move, a room
// inside, a gate's floor, a blow that lands, the sun's shadows; and the console stays clean throughout. The old look's own
// suites are every other suite, unchanged.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot({ look: 'new' }); const { page } = g;

const v = await page.evaluate(() => ({ rev: THREE.REVISION, look: OG_LOOK, legacy: THREE_LEGACY, cm: THREE.ColorManagement.enabled, out: REN.outputColorSpace,
  three: [...document.scripts].filter(s => /three/.test(s.src)).map(s => s.src.split('/').pop()),
  skinned: !('skinning' in PEOPLE_MAT), decay: new THREE.PointLight(0xffffff, 1, 5).decay,
  /* reported, not asserted: whether the browser's look-ahead fetched the inert r128 file anyway (it never runs) */ r128Fetched: performance.getEntriesByType('resource').some(r => /three\.min\.js/.test(r.name)) }));
check('three.js 0.170 is the one three.js on the page, and the compat layer is on', v.rev === '170' && v.look === 'new' && !v.legacy && v.three.length === 1 && v.three[0] === 'three.r170.min.js', v);
check('r128\'s colour and lights are put back: colour management off, linear output, point lights decay 1', v.cm === false && v.out === 'srgb-linear' && v.decay === 1 && v.skinned, v);

await g.intoWorld();
const w = await page.evaluate(() => ({ zone: activeZoneId, chunks: WORLD.loadedChunks ? WORLD.loadedChunks() : null, kids: WORLD.scene.children.length, shadows: REN.shadowMap.enabled }));
check('the world loads', w.zone === 'world' && w.kids > 20 && w.shadows, w);

await g.settle('dunmore');
await page.evaluate(() => forceTime(12));
await g.spin(null, 30);
// townsfolk: their bone matrices change between frames as tickPeople walks them
const p = await page.evaluate(() => {
  const rigs = [...PEOPLE_RIGS].filter(r => r.mesh && r.mesh.isSkinnedMesh && r.mesh.skeleton && r.root.parent && r.root.visible && Math.hypot(r.root.position.x - px, r.root.position.z - pz) < 60);
  const snap = () => rigs.map(r => { r.mesh.skeleton.update(); return Array.from(r.mesh.skeleton.boneMatrices.slice(0, 16 * 8)); });
  const a = snap(); let T = performance.now(); for (let i = 0; i < 40; i++) { T += 1000 / 60; WORLD.tick(1 / 60, T); tickPeople(1 / 60, T); } const b = snap();
  let moved = 0; a.forEach((m, i) => { let d = 0; for (let k = 0; k < m.length; k++) d = Math.max(d, Math.abs(m[k] - b[i][k])); if (d > 1e-4) moved++; });
  REN.render(scene, CAM);
  return { rigs: rigs.length, moved, calls: REN.info.render.calls, tris: REN.info.render.triangles };
});
check('Dunmore\'s townsfolk are skinned meshes that animate (their bone matrices change between frames)', p.rigs >= 5 && p.moved >= 3, p);
check('the town draws', p.calls > 50 && p.tris > 10000, p);
// S879 (F2a; the critic, 14 Oct): a townsperson must also be drawn, not only animated. On 0.170 a SkinnedMesh's own bounding sphere
// came out in world coordinates and was moved again by the frustum test, so every body was culled. Stand 4 m off the nearest one,
// look at it, and count the draw calls with it shown and hidden.
const seen = await page.evaluate(() => {
  const rigs = [...PEOPLE_RIGS].filter(r => r.mesh && r.mesh.isSkinnedMesh && r.root.parent && r.root.visible);
  rigs.sort((a, b) => Math.hypot(a.root.position.x - px, a.root.position.z - pz) - Math.hypot(b.root.position.x - px, b.root.position.z - pz));
  const r = rigs[0]; if (!r) return { none: true }; const q = r.root.position;
  const ox = px, oz = pz; px = q.x + 4; pz = q.z; lookAtPt(q.x, q.y + .8, q.z);
  const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(CAM.projectionMatrix, CAM.matrixWorldInverse));
  const inFrustum = fr.intersectsObject(r.mesh);
  const calls = () => { REN.render(scene, CAM); return REN.info.render.calls; };
  const on = calls(); r.mesh.visible = false; const off = calls(); r.mesh.visible = true; px = ox; pz = oz;
  return { inFrustum, on, off, sphere: r.mesh.boundingSphere && +r.mesh.boundingSphere.center.length().toFixed(2) };
});
check('a townsperson in view is drawn on the new look (inside the frustum, and one more draw call than with it hidden)', seen.inFrustum && seen.on > seen.off && seen.sphere < 5, seen);

// a shadow: the sun's map is drawn, and a lit spot beside a house is brighter than its shadow
const sh = await page.evaluate(() => { const L = []; WORLD.scene.traverse(o => { if (o.isDirectionalLight && o.castShadow) L.push(o); });
  const s = L[0] && L[0].shadow; return { lights: L.length, map: !!(s && s.map), size: s && s.mapSize.x }; });
check('the sun casts shadows into a shadow map', sh.lights >= 1 && sh.map, sh);

// a blow that lands: a Bandit in the street, one real swing through the loop's own tick
const hit = await page.evaluate(() => {
  forceTime(12); PHP = maxHP; dead = false; PPOST.stagUntil = 0; thirdPerson = false;
  EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3, atk: [8, 12] }; buildViewmodel();
  const t = WORLD.siteAnywhere('dunmore'); let S = null; const clear = (x, z) => !WORLD.solidAt(x, z) && WORLD.worldH(x, z) > 0;
  for (let rr = 4; rr < 60 && !S; rr += 1) for (let a = 0; a < 32 && !S; a++) { const x = t.x + Math.cos(a / 32 * Math.PI * 2) * rr, z = t.z + Math.sin(a / 32 * Math.PI * 2) * rr; let ok = true;
    for (let k = 0; k < 16 && ok; k++) for (const d of [1, 2, 3]) if (!clear(x + Math.cos(k / 16 * Math.PI * 2) * d, z + Math.sin(k / 16 * Math.PI * 2) * d)) { ok = false; break; } if (ok) S = { x, z }; }
  if (!S) return { noSpot: true };
  px = S.x; pz = S.z + 1.3;
  const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], S.x, S.z, 'Bandit', null)); e.alert = true; ZONES.world.enemies.push(e); e.hp = e.maxHp = 1000; e.def = 0;
  const keep = () => { PHP = maxHP; dead = false; PPOST.stagUntil = 0; stamina = maxStamina; e.telegraphT = 0; };
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  const hp0 = e.hp; let t0 = performance.now();
  try { const face = () => { yaw = Math.atan2(-(e.x - px), -(e.z - pz)); pitch = -.05; }; keep(); face(); atkCd = 0; attack(false);
    for (let n = 0; n < 120; n++) { keep(); face(); if (n > 3 && (!_pendingStrike || _pendingStrike.fired)) break; t0 += 1000 / 60; loop(t0); } }
  finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  const took = hp0 - e.hp; e.hp = 0; killZoneEnemy(e, WORLD.scene, ''); return { took };
});
check('a fight: a real swing lands on a Bandit and takes its health', hit.took > 0, hit);

// a room inside: the first house in Dunmore with a door, entered through goToInterior
const room = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S && S.houses.find(x => x.type === 'inn') || S.houses[0];
  px = h.exitX; pz = h.exitZ; goToInterior(h); return h.type; });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
await g.spin(null, 10); await g.frames(3);
const ri = await page.evaluate(() => { REN.render(scene, CAM); return { inside: isInterior(), calls: REN.info.render.calls, tris: REN.info.render.triangles }; });
check('a room inside builds and draws', ri.inside && ri.calls > 10, { room, ...ri });
await page.evaluate(() => { try { exitInterior(); } catch (e) {} });
await page.waitForTimeout(1500);

// a gate's floor
const cam = await enterDungeon(page, { theme: 'ruins', seed: 11 });
const d = await page.evaluate(() => { let shell = 0, foes = ENEMIES.length; dScene.traverse(o => { if (o.userData && o.userData.dunShell) shell++; });
  REN.render(dScene, CAM); return { zone: activeZoneId, shell, foes, calls: REN.info.render.calls }; });
Object.assign(d, cam);
check('a dungeon floor builds and draws, its foes in it', d.zone === 'dungeon' && d.shell > 3 && d.foes > 0 && d.calls > 10, d);

// a few real frames of the game's own loop, then the console
await g.frames(5);
const bad = g.logs.filter(l => !/GPU stall due to ReadPixels|GL Driver Message|Automatic fallback to software WebGL/.test(l));
check('no page errors and no console errors or warnings on the new look', g.errs.length === 0 && bad.length === 0, { errs: g.errs, logs: bad.slice(0, 10) });
await g.close();
