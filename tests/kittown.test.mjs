// The Gatelands' houses built from the kit on the new look (Session 1072; card F6, Michael's C on DECISION #396). On ?look=new a
// Gatelander town's widened lots (Session 1071, tests/kitlots) carry the kit's plan on their bays at the lot's depth, merged into one
// mesh per material for the town. Measured on Dunmore's own meshes: the walls stand where the solids are (a ray at each face from
// 2 m out meets the house within the wall's thickness of its solid), the door you use is in the drawn doorway (a ray at it meets the
// leaf, painted or a shop door's glazing, set back past the wall's face), the town's kit houses are a few dozen draws, and the old builder's houses are gone from those
// lots. Their far copy (Session 1073) stands in for them from outside the town. Its two guild halls are the kit's (Session 1083),
// measured as the houses are, their name panels and banners painted once. On the old look Dunmore is as it was.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));

const g0 = await boot(); await g0.intoWorld(); await g0.settle('dunmore');
const o = await g0.page.evaluate(() => { const S = WORLD.settle.get('dunmore'); let kit = 0; S.group.traverse(x => { if (x.name === 'kit houses') kit++; }); return { kit, homes: S.houses.filter(h => h.siteId === 'dunmore' && h.kit).length }; });
check('on the old look Dunmore has no kit houses', o.kit === 0 && o.homes === 0 && g0.errs.length === 0, { ...o, errs: g0.errs });
await g0.close();

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
check('Dunmore stands on the new look', await g.settle('dunmore'));
const r = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); let kitG = null; S.group.traverse(x => { if (x.name === 'kit houses') kitG = x; });
  if (!kitG) return { none: true };
  const meshes = kitG.children.filter(m => m.isMesh), M = PKIT.gl.mats(), paints = new Set(Object.keys(PKIT.gl.PAINTS).map(k => M['p:' + k]));
  WORLD.scene.updateMatrixWorld(true);
  const rc = new THREE.Raycaster(), org = new THREE.Vector3(), dir = new THREE.Vector3();
  const hit = (x, y, z, dx, dz, far) => { org.set(x, y, z); dir.set(dx, 0, dz).normalize(); rc.set(org, dir); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
  const H = S.houses.filter(h => h.siteId === 'dunmore' && h.kit), out = [];
  for (const h of H) {
    const s = S.sol.find(q => q.hid === h.id); if (!s) { out.push({ id: h.id, nosol: true }); continue; }
    const nx = s.s, nz = s.c, ex = s.c, ez = -s.s, base = WORLD.worldH(s.cx, s.cz);
    /* the four faces at 0.5 m, a little off the middle (clear of a door in the middle bay): from 0.55 m out (inside the 0.6 m every lot keeps clear), toward the centre */
    const faces = [[nx, nz, s.rz, ex * .45, ez * .45], [-nx, -nz, s.rz, ex * .45, ez * .45], [ex, ez, s.rx, nx * .4, nz * .4], [-ex, -ez, s.rx, nx * .4, nz * .4]].map(([ax, az, half, ox, oz]) => {
      const x = s.cx + ax * (half + .55) + ox, z = s.cz + az * (half + .55) + oz, k = hit(x, base + .5, z, -ax, -az, 3); return k ? +(.55 - k.distance).toFixed(3) : null; });
    /* the door: from 1.5 m out, at 1.3 m, straight in */
    const fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw), dh = hit(h.doorX + fx * 1.5, WORLD.worldH(h.doorX, h.doorZ) + 1.3, h.doorZ + fz * 1.5, -fx, -fz, 3);
    out.push({ id: h.id, kind: h.kit.kind, bays: h.kit.bays, faces, door: dh ? +dh.distance.toFixed(2) : null, painted: !!(dh && (paints.has(dh.object.material) || (h.kit.kind === 'merchant' && (dh.object.material === M.frame || dh.object.material === M.glass)))), mat: dh ? Object.keys(M).find(k => M[k] === dh.object.material) || '?' : null });
  }
  /* nothing of the old builder on a kit lot: no other town mesh's bounds contain a kit lot's centre at 1 m */
  const others = []; S.group.traverse(m => { if (m.isMesh && m.parent !== kitG && m.name !== 'kit houses far' && !m.isSkinnedMesh) others.push(m); });
  const down = new THREE.Raycaster(); let under = 0;
  for (const h of H) { const s = S.sol.find(q => q.hid === h.id); if (!s) continue; down.set(new THREE.Vector3(s.cx, WORLD.worldH(s.cx, s.cz) + 30, s.cz), new THREE.Vector3(0, -1, 0)); down.far = 29.5; if (down.intersectObjects(others, false).length) under++; }
  return { n: H.length, calls: kitG.children.length, tris: S.kitTris, out, under };
});
check('Dunmore has its kit houses', !r.none && r.n > 30, r.none ? r : { n: r.n });
const halls = r.none ? [] : r.out.filter(h => h.kind === 'guildhall');
check(`both of Dunmore's guild halls are the kit's hall (${halls.map(h => h.id).join(', ')}), measured with its houses below`, halls.length === 2, r.none ? r : r.out.map(h => h.kind));
const bad = r.out.filter(h => h.nosol || h.faces.some(f => f == null || f > .05 || f < -.75));
check(`every kit house's four walls stand on its solid, within the wall's thickness (${r.n} houses; each face ${-Math.max(...r.out.flatMap(h => h.faces))} to ${-Math.min(...r.out.flatMap(h => h.faces))} m inside its solid)`, bad.length === 0, bad.slice(0, 5));
const badD = r.out.filter(h => h.door == null || h.door < 1.7 || h.door > 2.3 || !h.painted);
check(`the door you use is the drawn door: its painted leaf (a merchant's glazed), set back in the wall, ${Math.min(...r.out.map(h => h.door))} to ${Math.max(...r.out.map(h => h.door))} m from a point 1.5 m out`, badD.length === 0, badD.slice(0, 5));
check(`the town's kit houses are ${r.calls} draws (${r.tris} triangles)`, r.calls > 8 && r.calls <= 60, r);
check('the old builder\'s houses are gone from the kit lots', r.under === 0, { under: r.under });

// the far copy (Session 1073): a box and a roof for each house, one mesh; from outside the town it is drawn and the kit's houses are
// not, in the street the other way round; it covers the same ground and stands as high as the houses (less their chimneys)
const far = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), K = S.kitLod; if (!K) return { none: true };
  const box = o => { const b = new THREE.Box3().setFromObject(o); return { x0: b.min.x, x1: b.max.x, y1: b.max.y, z0: b.min.z, z1: b.max.z }; };
  K.hi.visible = true; K.lo.visible = true; const A = box(K.hi), B = box(K.lo);
  const at = (dx, dz) => { px = K.x + dx; pz = K.z + dz; py = WORLD.worldH(px, pz) + 1.65; CAM.position.set(px, py, pz); houseLod(); houseLod(); return { hi: K.hi.visible, lo: K.lo.visible }; };
  const out = at(K.r + 160, 0), inn = at(0, 0); return { r: Math.round(K.r), loTris: K.tris, hiTris: S.kitTris, A, B, out, inn }; });
check(`a far copy of ${far.loTris} triangles stands for the kit's ${far.hiTris}`, !far.none && far.loTris > 0 && far.loTris * 20 < far.hiTris, far);
const dB = far.none ? 9 : Math.max(...['x0', 'x1', 'z0', 'z1'].map(k => Math.abs(far.A[k] - far.B[k])));
check(`it covers the kit houses' ground within ${dB.toFixed(2)} m and their height within ${far.none ? '?' : Math.abs(far.A.y1 - far.B.y1).toFixed(2)} m`, !far.none && dB < .8 && Math.abs(far.A.y1 - far.B.y1) < 1.5, far.none ? far : { A: far.A, B: far.B });
check('from outside the town the far copy is drawn, in the town the kit\'s houses', !far.none && far.out.lo && !far.out.hi && far.inn.hi && !far.inn.lo, far);

// the shops' signs (Session 1074): one painted for each trade, shared by its shops, and none more when the town is built again
const sg = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), shops = S.houses.filter(h => h.siteId === 'dunmore' && h.kit && h.kit.kind === 'merchant'), trades = new Set(shops.map(h => h.type));
  const a = PKIT.signsMade(), p = PKIT.panelsMade(), calls = S.kitCalls; disposeSettlement('dunmore'); genSettlement(allSites().find(t => t.id === 'dunmore')); const T = WORLD.settle.get('dunmore');
  return { shops: shops.length, trades: trades.size, a, b: PKIT.signsMade(), p, p2: PKIT.panelsMade(), calls, calls2: T.kitCalls }; });
check(`${sg.shops} shops of ${sg.trades} trades paint ${sg.a} signs, and building the town again paints none (${sg.calls} draws, then ${sg.calls2})`, sg.shops > 3 && sg.a === sg.trades && sg.b === sg.a && sg.calls2 === sg.calls, sg);
check(`the two guild halls paint ${sg.p} name panels and banners, and none more when the town is built again`, sg.p === 4 && sg.p2 === sg.p, sg);

// a picture: a street of them at noon, from across it
const shot = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), H = S.houses.filter(h => h.siteId === 'dunmore' && h.kit && h.kit.kind !== 'cottage');
  const h = H.sort((a, b) => b.kit.bays - a.kit.bays)[Math.min(3, H.length - 1)], fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw);
  const ex = Math.cos(h.exitYaw), ez = -Math.sin(h.exitYaw); /* from the street, 4 m out and 10 m along, looking back along the row */
  forceTime(12); VM_SCENE.visible = false; px = h.doorX + fx * 4 + ex * 10; pz = h.doorZ + fz * 4 + ez * 10; py = WORLD.worldH(px, pz) + 1.65; const lx = h.doorX - px, lz = h.doorZ - pz; yaw = Math.atan2(-lx, -lz) + .25; pitch = .1; return h.id; });
await g.frames(6);
fs.mkdirSync(path.join(here, '../docs/prototypes'), { recursive: true });
await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-town-ingame.png') });
console.log(`  (picture from across ${shot}: docs/prototypes/kit-town-ingame.png)`);
// the Fighters' guild hall from its street, 14 m out and a little to one side
await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), h = S.houses.find(h => h.siteId === 'dunmore' && h.type === 'guild_f'), fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw), ex = Math.cos(h.exitYaw), ez = -Math.sin(h.exitYaw);
  px = h.doorX + fx * 14 + ex * 4; pz = h.doorZ + fz * 14 + ez * 4; py = WORLD.worldH(px, pz) + 1.65; yaw = Math.atan2(-(h.doorX - px), -(h.doorZ - pz)); pitch = .12; });
await g.frames(6);
await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-guildhall-ingame.png') });
// and from the fields, 170 m out, where the far copy stands in
await page.evaluate(() => { const K = WORLD.settle.get('dunmore').kitLod; px = K.x + K.r + 90; pz = K.z + 40; py = WORLD.worldH(px, pz) + 1.65; yaw = Math.atan2(-(K.x - px), -(K.z - pz)); pitch = -.02; });
await g.frames(6);
await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-town-far.png') });
check('no errors on the new look', g.errs.length === 0, g.errs);
await g.close();
