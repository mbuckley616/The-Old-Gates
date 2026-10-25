// Aurenne's courtyard house in the game (Session 1419; card F6, Michael's A on #318 and #329: 15 by 15 m, pantile sloping into the court;
// OG-115). On the new look an Aurennais town's or port's better quarter has one courtyard house (a city's two), PKIT.au.courtyard on the home
// lot nearest the heart where it stands on level ground, clear of roads, streets, plots, shops and kit lots; the homes it would stand on are
// let go. Measured on three towns of Aurenne: its solid is its lot, the walls stand inside it, the street door is straight ahead from the
// knock point, no other building's solid reaches into it, the ground under it is level to 0.2 m, it is within its triangles and draws, and
// the far copy covers it. A picture from the street at noon.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const towns = () => { anchoredPlaces(); return [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'aurenne').flatMap(c => c.sites).filter(s => ['town', 'port', 'city'].includes(s.kind)).slice(0, 3).map(s => s.id); };

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
let shot = null, found = 0;
for (const id of await page.evaluate(towns)) {
  if (!(await g.settle(id))) { check(`${id} stands`, false); continue; }
  const r = await page.evaluate(id => {
    const S = WORLD.settle.get(id), site = siteAnywhere(id), H = S.houses.filter(h => h.siteId === id && h.kit && h.kit.kind === 'aurcourt');
    let kitG = null; S.group.traverse(x => { if (x.name === 'kit houses') kitG = x; }); WORLD.scene.updateMatrixWorld(true);
    const far = S.group.children.find(m => m.name === 'kit houses far'), fb = far && new THREE.Box3().setFromObject(far);
    const rc = new THREE.Raycaster(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
    const inRect = (s, x, z, m) => { const ex = x - s.cx, ez = z - s.cz; return Math.abs(ex * s.c - ez * s.s) < s.rx + m && Math.abs(ex * s.s + ez * s.c) < s.rz + m; };
    return { kind: site.kind, n: H.length, homes: S.houses.filter(h => h.siteId === id && h.type === 'home').length, houses: H.map(h => {
      const s = S.sol.find(o => o.hid === h.id), meshes = []; kitG.traverse(m => { if (m.isMesh) meshes.push(m); });
      const ray = (x, y, z, dx, dz, far) => { O.set(x, y, z); Dv.set(dx, 0, dz).normalize(); rc.set(O, Dv); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
      /* its walls stand inside its solid: from 0.5 m outside the solid at the back and the two sides, 1.5 m up, at three places along each,
         the wall is met within 1.0 m (the solid's 0.15 margin, the plinth's 0.08 and the cornice's overhang) */
      const nx = s.s, nz = s.c, ex = s.c, ez = -s.s, base = WORLD.worldH(s.cx, s.cz) + 1.5, walls = [];
      for (const t of [-.6, 0, .6]) { walls.push(ray(s.cx - nx * (s.rz + .5) + ex * t * s.rx, base, s.cz - nz * (s.rz + .5) + ez * t * s.rx, nx, nz, 1.0));
        for (const sd of [-1, 1]) walls.push(ray(s.cx + sd * ex * (s.rx + .5) + nx * t * s.rz, base, s.cz + sd * ez * (s.rx + .5) + nz * t * s.rz, -sd * ex, -sd * ez, 1.0)); }
      const gy = WORLD.worldH(h.doorX, h.doorZ), fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw);
      O.set(h.doorX + fz * .1, gy + 1.2, h.doorZ - fx * .1); /* 0.1 m off the middle: the leaf's six boards meet there */ Dv.set(-fx, 0, -fz).normalize(); rc.set(O, Dv); rc.far = 3; const dh = rc.intersectObjects(meshes, false)[0];
      const door = dh ? { d: +dh.distance.toFixed(2), leaf: PKIT.au.mats().door.includes(dh.object.material) } : null;
      const others = S.sol.filter(o => o !== s && o.cx != null && Math.hypot(o.cx - s.cx, o.cz - s.cz) < 30 && [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]].some(([u, v]) => inRect(s, o.cx + u * o.rx * .95 * o.c + v * o.rz * .95 * (o.s || 0), o.cz - u * o.rx * .95 * (o.s || 0) + v * o.rz * .95 * o.c, -.2))).map(o => o.hid || o.bt);
      const ys = []; for (let u = -1; u <= 1; u += .5) for (let v = -1; v <= 1; v += .5) ys.push(WORLD.worldH(s.cx + u * (s.rx - .15) * s.c + v * (s.rz - .15) * s.s, s.cz - u * (s.rx - .15) * s.s + v * (s.rz - .15) * s.c));
      return { id: h.id, name: h.name, tris: h.kit.tris, calls: h.kit.calls, lot: [+(2 * s.rx).toFixed(2), +(2 * s.rz).toFixed(2)], walls: walls.every(Boolean), wallD: walls.map(w => w && +w.distance.toFixed(2)), door, others, level: +(Math.max(...ys) - Math.min(...ys)).toFixed(2),
        inFar: !!fb && fb.containsPoint(new THREE.Vector3(s.cx, WORLD.worldH(s.cx, s.cz) + 3, s.cz)), heart: +Math.hypot(s.cx - site.x, s.cz - site.z).toFixed(1), top: h.kit.top,
        knockClear: !S.sol.some(o => o.cx != null && inRect(o, h.exitX, h.exitZ, .3)), view: { x: h.exitX + fx * 9, z: h.exitZ + fz * 9, yaw: h.exitYaw + Math.PI } }; }) };
  }, id);
  console.log(`  ${id} (a ${r.kind}): ${r.n} courtyard house${r.n === 1 ? '' : 's'} among ${r.homes} homes`); found += r.n;
  check(`${id} has no more courtyard houses than its kind allows (${r.n})`, r.n <= (r.kind === 'city' ? 2 : 1), r);
  for (const h of r.houses) {
    check(`${h.name} (${h.id}, ${h.heart} m from the heart): ${h.tris && h.tris.toLocaleString()} triangles in ${h.calls} draws, two storeys and ${h.top} m to the cornice`, h.tris < 32000 && h.calls <= 16 && h.top > 7, h);
    check(`its solid is its lot (${h.lot && h.lot.join(' by ')} m) with its walls inside (${h.wallD && h.wallD.join(', ')} m), and no other building's solid reaches into it (${h.others && h.others.length})`, h.lot && Math.abs(h.lot[0] - 15.46) < .05 && Math.abs(h.lot[1] - 15.83) < .05 && h.walls && h.others.length === 0, h);
    check(`from the knock point (clear: ${h.knockClear}) the street door is straight ahead, ${h.door && h.door.d} m in`, h.knockClear && h.door && h.door.leaf && h.door.d < 1.2, h);
    check(`it stands on level ground (${h.level} m across its lot), and the far copy covers it`, h.level <= .3 && h.inFar, h);
    if (!shot) shot = h.view && { id, ...h.view };
  }
}
check(`the courtyard house stands in at least two of the three towns (${found}; one on a slope keeps its homes)`, found >= 2);
if (shot) {
  await g.settle(shot.id);
  await page.evaluate(v => { forceTime(12); VM_SCENE.visible = false; if (typeof TP !== 'undefined' && TP.on) TP.on = false; px = v.x; pz = v.z; yaw = v.yaw; pitch = .05; }, shot);
  await g.frames(8);
  fs.mkdirSync(path.join(here, '../docs/prototypes'), { recursive: true });
  await page.screenshot({ path: path.join(here, '../docs/prototypes/courtyard-street-ingame.png') }); console.log('  (picture: docs/prototypes/courtyard-street-ingame.png)');
}
check('no errors', g.errs.length === 0, g.errs.slice(0, 5));
await g.close();
