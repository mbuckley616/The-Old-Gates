// The town gate itself (Session 275, H.5; Michael's A on the Session 273 prototype): where a road crosses a walled town's
// ring, the gap between the gate towers is a gateway. Stone tiers an arch of voussoirs with a wall-walk and merlons over it,
// the palisade and fence a braced timber lintel on posts; in both, two plank leaves stand open against the inside. The
// road through stays open; the jambs and the leaves are solid.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const geo = await page.evaluate(() => { const C = x => new THREE.Color(x), rng = s => { let a = s; return () => ((a = (a * 16807) % 2147483647) / 2147483647); };
  const tiers = { fence: [1.15, .3, 0x5a4a30, 0x4a3a22, 4.0], logs: [3.2, .5, 0x5a4222, 0x4a3418, 5.2], stone: [4.6, 1.3, 0x8a8478, 0x7a7468, 4.3], dressed: [5.6, 1.5, 0xbfb6a6, 0xd6cfc0, 4.0] }, out = {};
  for (const [k, [H, d, w, c, inner]] of Object.entries(tiers)) { const gg = WORLD.townGateGeo(k, inner, H, d, C(w), C(c), rng(5)); gg.computeBoundingBox(); const bb = gg.boundingBox;
    // the lowest point of the opening over the road's width (2.6 either side of the middle): nothing in the gate's own plane below it
    const p = gg.attributes.position; let clear = 99; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (Math.abs(x) < 2.6 && Math.abs(z) < d / 2 + .12 && y > 0) clear = Math.min(clear, y); }
    out[k] = { tris: p.count / 3, loTris: gg.userData.lo ? gg.userData.lo.attributes.position.count / 3 : 0, leaves: gg.userData.leaves.length, top: +bb.max.y.toFixed(2), clear: +clear.toFixed(2), inward: +bb.max.z.toFixed(2) }; }
  return out; });
console.log(JSON.stringify(geo));
check('every tier builds a gate with a distant copy and two leaves', Object.values(geo).every(t => t.tris > 200 && t.loTris > 0 && t.leaves === 2), geo);
check('a gate is under 3k triangles', Object.values(geo).every(t => t.tris < 3000), Object.fromEntries(Object.entries(geo).map(([k, t]) => [k, t.tris])));
check('the stone arch and the timber lintel leave the road clear to 3.4 (a coach\'s roof)', Object.values(geo).every(t => t.clear > 3.4), geo);
check('the leaves stand open into the town (+z), about their width in', Object.values(geo).every(t => t.inward > 3), geo);
check('the stone gate stands over its wall (a wall-walk at 5.8), under its towers\' tops (7)', geo.stone.top > 5.6 && geo.stone.top < 7.2, geo.stone);
// the walled towns near the start: each crossing has a gate, the road through it is open, the jambs and leaves solid
const town = await page.evaluate(() => { const found = []; for (const t of WORLD.SITES) { if (!t.pad || !['town', 'city', 'village', 'port', 'outpost'].includes(t.kind)) continue; if (Math.hypot(t.x - px, t.z - pz) > 1500) continue;
    let S = WORLD.settlements.get(t.id); if (!S) S = WORLD.genSettlement(t); if (!S || !S._gates || !S._gates.length || !S.sol.some(q => q.bt === 'wall')) continue; found.push({ t, S }); if (found.length >= 3) break; }
  const out = [];
  for (const { t, S } of found) { const gates = S._gates.length, open = S._gates.filter(q => q.open).length, gsol = S.sol.filter(q => q.bt === 'gate').length; let blocked = 0, probes = 0, leafInHouse = 0;
    for (const gt of S._gates) { const sg = WORLD.roadInfo(gt.x, gt.z).seg, ax = sg.bx - sg.ax, az = sg.bz - sg.az, L = Math.hypot(ax, az) || 1, rx = ax / L, rz = az / L;
      // across the ring along the road through the gate, and 1.5 either side of the road's middle
      for (let k = -8; k <= 8; k++) for (const o of [-1.5, 0, 1.5]) { const x = gt.x + rx * k * .5 - rz * o, z = gt.z + rz * k * .5 + rx * o; probes++; if (WORLD.solidAt(x, z)) blocked++; } }
    for (const lf of S.sol.filter(q => q.bt === 'gate' && q.rx > 1)) for (const h of S.sol) { if (h.bt === 'gate' || h.bt === 'wall' || h.c !== undefined) continue; if (Math.abs(lf.cx - h.cx) < h.rx && Math.abs(lf.cz - h.cz) < h.rz) leafInHouse++; }
    // the first gate's tier and place, kept here: the world may unload a town it did not need before the next step (it did on CI)
    const g0 = S._gates[0]; out.push({ id: t.id, gates, open, gsol, probes, blocked, leafInHouse, first: { tier: g0.tier, gx: g0.x, gz: g0.z, tx: t.x, tz: t.z } }); }
  return out; });
console.log(JSON.stringify(town));
check('walled towns near the start are found', town.length > 0, town);
check('each gate adds its two jambs and two leaves to the town\'s colliders (a crossing where a second road meets the first at the ring stays open)', town.every(t => t.gsol === (t.gates - t.open) * 4) && town.some(t => t.gsol > 0), town);
check('the road through every gate is open (no collider within 1.5 of its middle for 4 either side of the wall)', town.every(t => t.blocked === 0), town);
check('no leaf stands inside a house', town.every(t => t.leafInHouse === 0), town);
// pictures: a stone gate and a timber one from the road outside at noon, with the town and its ground loaded
const byTier = {}; for (const t of town) { const k = t.first.tier, f = k === 'stone' || k === 'dressed' ? 'stone' : 'timber'; if (!byTier[f]) byTier[f] = { id: t.id, ...t.first }; }
if (!byTier.stone) { const far = await page.evaluate(() => { const c = WORLD.SITES.filter(t => t.pad && ['town', 'city', 'port'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  for (const t of c.slice(0, 16)) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); if (S && S._gates && S._gates.length && S._gates[0].tier && S._gates[0].tier !== 'fence' && S._gates[0].tier !== 'logs') return { id: t.id, tier: S._gates[0].tier, gx: S._gates[0].x, gz: S._gates[0].z, tx: t.x, tz: t.z }; } return null; });
  if (far) byTier.stone = far; }
console.log(JSON.stringify(byTier));
const shots = [];
for (const { id, tier, gx, gz, tx, tz } of Object.values(byTier)) {
  const L = Math.hypot(gx - tx, gz - tz), at = { x: gx + (gx - tx) / L * 18, z: gz + (gz - tz) / L * 18 };
  await page.evaluate(a => goToZone('world', a.x, a.z, 0, 'x'), at); await page.waitForTimeout(9000); await g.hide();
  const shot = await page.evaluate(id => { for (let k = 0; k < 900 && !WORLD.settlements.has(id); k++) { WORLD.tick(1 / 60, performance.now()); while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } }
    const S = WORLD.settlements.get(id); if (!S) return null; const t = S.site, gt = S._gates[0]; const ax = gt.x - t.x, az = gt.z - t.z, L = Math.hypot(ax, az), rx = ax / L, rz = az / L;
    forceTime(12); const cv = REN.domElement, cam = new THREE.PerspectiveCamera(50, cv.width / cv.height, .3, 600); const cx = gt.x + rx * 16 - rz * 5, cz = gt.z + rz * 16 + rx * 5;
    cam.position.set(cx, WORLD.worldH(cx, cz) + 2.6, cz); cam.lookAt(gt.x, WORLD.worldH(gt.x, gt.z) + 3, gt.z); const saved = CAM.position.clone(); CAM.position.copy(cam.position);
    for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true); const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f;
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); CAM.position.copy(saved); return o.toDataURL(); }, id);
  if (shot) { fs.writeFileSync(`tests/out/towngate-${tier}.png`, Buffer.from(shot.split(',')[1], 'base64')); shots.push(tier); } }
console.log('pictures', shots);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
