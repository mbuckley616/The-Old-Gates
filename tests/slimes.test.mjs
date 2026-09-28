// The dungeon's slimes and Fire Elemental on the kit (Session 222, Michael's answer B on Session 214: "as shown"): the
// slime a soft glassy blob with a dark heart and what it swallowed inside, two eyes, quivering; the elemental a figure of
// flame over a molten core, arms and clawed hands of fire and a crown of it, flickering.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
let found = null;
for (const seed of [5, 11, 17, 23, 31, 44, 52]) { await page.evaluate(() => { level = 6; }); await enterDungeon(page, { theme: 'elemental', seed });
  found = await page.evaluate(() => { const S = ENEMIES.find(x => !x.dead && x.floor === currentFloor && (x.baseType || x.name) === 'Slime' && x.variant !== 'small'), F = ENEMIES.find(x => !x.dead && x.floor === currentFloor && (x.baseType || x.name) === 'Fire Elemental'); return S && F ? { ok: true } : null; });
  if (found) break; }
check('an elemental dungeon holds a slime and a fire elemental', !!found, found);

const built = await page.evaluate(() => { const S = ENEMIES.find(x => !x.dead && x.floor === currentFloor && (x.baseType || x.name) === 'Slime' && x.variant !== 'small'), F = ENEMIES.find(x => !x.dead && x.floor === currentFloor && (x.baseType || x.name) === 'Fire Elemental');
  window._S = S; window._F = F; const boxes = e => { let n = 0; e.mesh.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry') n++; }); return n; };
  const b = S.limbs.body, c = F.limbs.body;
  return { slime: { kit: !!S.limbs.slime, verts: b.geometry.attributes.position.count, glass: b.material.transparent && b.material.opacity < .7, std: b.material.isMeshStandardMaterial, boxes: boxes(S), meshes: S.mesh.children.reduce((n, o) => n + (o.children ? o.children.length : 0), 0) },
    fire: { flames: F.limbs.flames.length, additive: F.limbs.flames.every(m => m.material.blending === THREE.AdditiveBlending && !m.material.depthWrite), core: '#' + c.material.emissive.getHexString(), boxes: boxes(F), light: !!F.limbs.bodyLight } }; });
check('the slime is a glassy blob on the kit, no box left', built.slime.kit && built.slime.verts > 500 && built.slime.glass && built.slime.std && built.slime.boxes === 0, built.slime);
check('the fire elemental is a figure of additive flame over a glowing core, no box left', built.fire.flames >= 40 && built.fire.additive && built.fire.core === '#ff4400' && built.fire.boxes === 0 && built.fire.light, built.fire);

// the wind-up flashes the core as it flashes every foe's body; afterwards the core eases back to its own glow
const flash = await page.evaluate(() => { const F = _F, m = F.limbs.body.material; telegraphPulse(F, 1); const hot = '#' + m.emissive.getHexString(); telegraphReset(F); const reset = '#' + m.emissive.getHexString(); return { hot, reset }; });
for (const e of ['_S', '_F']) await page.evaluate(e => { const x = window[e]; x.alert = true; x.hasCried = true; }, e);
const before = await page.evaluate(() => ({ sy: _S.limbs.body.scale.y, fy: _F.limbs.flames.map(m => m.scale.y) }));
await g.frames(12);
const after = await page.evaluate(() => ({ sy: _S.limbs.body.scale.y, fy: _F.limbs.flames.map(m => m.scale.y), core: '#' + _F.limbs.body.material.emissive.getHexString(), r: _F.limbs.body.material.emissive.r }));
const flick = after.fy.filter((y, i) => Math.abs(y - before.fy[i]) > 1e-3).length;
check('the wind-up flashes the core red and the reset clears it, as for every foe', flash.hot !== '#ff4400' && flash.reset === '#000000', flash);
check('in play the slime quivers, the flames flicker and the core glows again', Math.abs(after.sy - 1) > 1e-3 && flick > 20 && after.r > .5, { sy: after.sy, flick, core: after.core });

// the split (killE) calls buildEnemy, which lives inside buildDungeon and is not reachable from killE: a slime's death
// throws before the small slimes are made. Reported in Session 222 for the systems builder (combat), not fixed here.
// the photograph: a slime and a fire elemental by a lantern in the dungeon
const shot = await page.evaluate(() => { const ms = [], L = new THREE.PointLight(0xffb070, 1.2, 10);
  const open = (c, r) => r >= 0 && r < dR && c >= 0 && c < dC && dMap[r][c] > 0 && dMap[r][c] !== 2; let best = null;
  for (let r = 1; r < dR - 1; r++) for (let c = 1; c < dC - 1; c++) { if (!open(c, r)) continue; let n = 0; while (open(c, r - n - 1) && n < 8) n++; let w = 0; for (let k = 1; k <= 3; k++) w += open(c - 1, r - k) + open(c + 1, r - k); if (!best || n + w * .5 > best.s) best = { c, r, s: n + w * .5 }; }
  const cx = best.c, cz = best.r, y0 = ENEMIES.find(e => !e.dead).baseY;
  ENEMIES.forEach(e => { if (e.mesh) e.mesh.visible = false; }); if (typeof DUN_PEOPLE !== 'undefined') {}
  const put = (name, dx, dz, ry) => { const e = ENEMIES.find(x => !x.dead && x.name.includes(name) && !ms.includes(x)); if (!e) return; ms.push(e); e.mesh.visible = true; e.mesh.position.set(cx + dx, e.baseY, cz - 2.6 + dz); e.mesh.rotation.set(0, ry, 0); e.mesh.updateMatrixWorld(true); };
  put('Slime', -.8, .3, .3); put('Fire Elemental', .6, 0, -.2);
  px = cx; pz = cz; yaw = 0; CAM.position.set(cx, 1.2, cz); CAM.rotation.order = 'YXZ'; CAM.rotation.set(-.18, 0, 0); L.position.set(cx, 1.6, cz - .6); dScene.add(L);
  CAM.updateMatrixWorld(true); REN.render(dScene, CAM); const cv = REN.domElement, o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); dScene.remove(L); return o.toDataURL(); });
fs.writeFileSync('tests/out/slimes.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
