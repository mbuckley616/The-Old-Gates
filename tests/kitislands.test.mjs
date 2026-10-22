// The Mark's halls built from the kit on the new look (Session 1280; card F6, Michael's C on DECISION #277 and A on #285). On ?look=new
// a Markish settlement's homes and shops are the kit's halls (PKIT.mk.hall), gable to the street, roofed by PKIT.mk.lot: two in three
// dark shingle, one in three dry turf. Measured on a Markish town's own meshes: the side and back walls stand where the solid is, the
// door you knock at is the steps' foot with the drawn door straight ahead up them, the halls are a few dozen draws, the old builder's
// houses are gone from those lots, the far copy stands for them from outside the town, and the town takes no longer to build than
// its old houses did. On the old look the town is as it was.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const pickTown = () => { anchoredPlaces(); const S = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites); return (S.find(s => s.kind === 'town') || {}).id; };

const g0 = await boot({ look: 'old' }); await g0.intoWorld(); const id0 = await g0.page.evaluate(pickTown); await g0.settle(id0);
const o = await g0.page.evaluate(id => { const S = WORLD.settle.get(id); let kit = 0; S.group.traverse(x => { if (x.name === 'kit houses') kit++; }); return { kit, halls: S.houses.filter(h => h.siteId === id && h.kit).length }; }, id0);
check(`on the old look ${id0} has no kit halls`, o.kit === 0 && o.halls === 0 && g0.errs.length === 0, { ...o, errs: g0.errs });
await g0.close();

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const id = await page.evaluate(pickTown);
check(`a Markish town (${id}) stands on the new look`, !!id && await g.settle(id));
const r = await page.evaluate((id) => {
  const S = WORLD.settle.get(id); let kitG = null; S.group.traverse(x => { if (x.name === 'kit houses') kitG = x; });
  if (!kitG) return { none: true };
  const meshes = kitG.children.filter(m => m.isMesh), M = PKIT.mk.mats();
  WORLD.scene.updateMatrixWorld(true);
  const rc = new THREE.Raycaster(), org = new THREE.Vector3(), dir = new THREE.Vector3();
  const hit = (x, y, z, dx, dz, far) => { org.set(x, y, z); dir.set(dx, 0, dz).normalize(); rc.set(org, dir); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
  const H = S.houses.filter(h => h.siteId === id && h.kit), out = [];
  for (const h of H) {
    const s = S.sol.find(q => q.hid === h.id); if (!s) { out.push({ id: h.id, nosol: true }); continue; }
    const k = h.kit, nx = s.s, nz = s.c, ex = s.c, ez = -s.s, base = WORLD.worldH(s.cx, s.cz), hz = (s.rz - .15) - k.o.d / 2 - k.stoop;
    /* the back and the two sides at 1.4 m over the ground (the walls stand on a footing 0.8 high), from 0.55 m out, toward the hall */
    /* (the back a little off its middle; the sides 0.7 m in front of the hall's middle, between two windows' shutters or clear of one) */
    const faces = [[-nx, -nz, s.rz, ex * .4, ez * .4], [ex, ez, s.rx, nx * (hz + .7), nz * (hz + .7)], [-ex, -ez, s.rx, nx * (hz + .7), nz * (hz + .7)]].map(([ax, az, half, ox, oz]) => {
      const x = s.cx + ax * (half + .55) + ox, z = s.cz + az * (half + .55) + oz, q = hit(x, base + 1.4, z, -ax, -az, 3); return q ? +(.55 - q.distance).toFixed(3) : null; });
    /* the door: from 1.5 m before the steps' foot, at 1.6 m over the ground, straight in: up the steps (and under the porch) to the leaf */
    const fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw), dh = hit(h.doorX + fx * 1.5, WORLD.worldH(h.doorX, h.doorZ) + 1.6, h.doorZ + fz * 1.5, -fx, -fz, 8);
    out.push({ mat: dh ? (Object.entries(M).find(([k, v]) => v === dh.object.material) || ['?'])[0] : null, at: dh ? +dh.distance.toFixed(2) : null, id: h.id, roof: k.o.roof, porch: k.o.porch, stoop: k.stoop, w: k.o.w, d: k.o.d, faces, door: dh ? +(dh.distance - 1.5 - .15 - k.stoop).toFixed(2) : null, leaf: !!(dh && dh.object.material === M.door) });
  }
  const others = []; S.group.traverse(m => { if (m.isMesh && m.parent !== kitG && m.name !== 'kit houses far' && !m.isSkinnedMesh) others.push(m); });
  const down = new THREE.Raycaster(); let under = 0;
  for (const h of H) { const s = S.sol.find(q => q.hid === h.id); if (!s) continue; down.set(new THREE.Vector3(s.cx, WORLD.worldH(s.cx, s.cz) + 30, s.cz), new THREE.Vector3(0, -1, 0)); down.far = 29.5; if (down.intersectObjects(others, false).length) under++; }
  return { n: H.length, all: S.houses.filter(h => h.siteId === id).length, calls: kitG.children.length, tris: S.kitTris, out, under };
}, id);
check(`${id} has its kit halls`, !r.none && r.n > 20, r.none ? r : { n: r.n, all: r.all });
const turf = r.none ? 0 : r.out.filter(h => h.roof === 'turf').length;
check(`one hall in three or so is turf, the rest shingle (${turf} of ${r.n})`, !r.none && turf >= r.n * .2 && turf <= r.n * .45, { turf, n: r.n });
check(`every hall is 5.6 m wide or more and 6.5 m deep or more (${Math.min(...r.out.map(h => h.w))} to ${Math.max(...r.out.map(h => h.w))} by ${Math.min(...r.out.map(h => h.d))} to ${Math.max(...r.out.map(h => h.d))} m)`, r.out.every(h => h.w >= 5.6 - 1e-6 && h.d >= 6.5 - 1e-6), r.out.filter(h => h.w < 5.6 || h.d < 6.5).slice(0, 5));
const bad = r.out.filter(h => h.nosol || h.faces.some(f => f == null || f > .05 || f < -.45));
check(`every hall's back and sides stand on its solid, within the footing and the wall (${r.n} halls; each face ${-Math.max(...r.out.flatMap(h => h.faces))} to ${-Math.min(...r.out.flatMap(h => h.faces))} m inside)`, bad.length === 0, bad.slice(0, 5));
const badD = r.out.filter(h => h.door == null || Math.abs(h.door) > .25 || !h.leaf);
check(`the door you knock at is the steps' foot, the drawn door up them (the leaf ${Math.min(...r.out.map(h => h.door))} to ${Math.max(...r.out.map(h => h.door))} m from the hall's front)`, badD.length === 0, badD.slice(0, 5));
check(`the town's halls are ${r.calls} draws (${r.tris} triangles)`, r.calls > 6 && r.calls <= 30, r.none ? r : { calls: r.calls, tris: r.tris });
check('the old builder\'s houses are gone from the hall lots', r.under === 0, { under: r.under });

const far = await page.evaluate((id) => { const S = WORLD.settle.get(id), K = S.kitLod; if (!K) return { none: true };
  const box = o => { const b = new THREE.Box3().setFromObject(o); return { x0: b.min.x, x1: b.max.x, y1: b.max.y, z0: b.min.z, z1: b.max.z }; };
  K.hi.visible = true; K.lo.visible = true; const A = box(K.hi), B = box(K.lo);
  const at = (dx, dz) => { px = K.x + dx; pz = K.z + dz; py = WORLD.worldH(px, pz) + 1.65; CAM.position.set(px, py, pz); houseLod(); houseLod(); return { hi: K.hi.visible, lo: K.lo.visible }; };
  const out = at(K.r + 160, 0), inn = at(0, 0); return { loTris: K.tris, hiTris: S.kitTris, A, B, out, inn }; }, id);
check(`a far copy of ${far.loTris} triangles stands for the halls' ${far.hiTris}`, !far.none && far.loTris > 0 && far.loTris * 20 < far.hiTris, far);
const dB = far.none ? 9 : Math.max(...['x0', 'x1', 'z0', 'z1'].map(k => Math.abs(far.A[k] - far.B[k])));
check(`it covers the halls' ground within ${dB.toFixed(2)} m and their height within ${far.none ? '?' : Math.abs(far.A.y1 - far.B.y1).toFixed(2)} m`, !far.none && dB < 3.5 && Math.abs(far.A.y1 - far.B.y1) < 1.5, far.none ? far : { A: far.A, B: far.B });
check('from outside the town the far copy is drawn, in the town the halls', !far.none && far.out.lo && !far.out.hi && far.inn.hi && !far.inn.lo, far);

// the time to build the town again, with its halls and with the old houses (window.OG_KIT_TOWNS=false), best of three each
const t = await page.evaluate((id) => { const site = allSites().find(s => s.id === id), run = () => { const t0 = performance.now(); disposeSettlement(id); genSettlement(site); return performance.now() - t0; };
  const kit = Math.min(run(), run(), run()); window.OG_KIT_TOWNS = false; const old = Math.min(run(), run(), run()); window.OG_KIT_TOWNS = true; run(); return { kit: Math.round(kit), old: Math.round(old) }; }, id);
check(`building the town takes ${t.kit} ms with its halls, ${t.old} ms with the old houses`, t.kit < t.old * 1.6 + 150, t);

const shot = await page.evaluate((id) => { const S = WORLD.settle.get(id), H = S.houses.filter(h => h.siteId === id && h.kit).sort((a, b) => b.kit.o.d - a.kit.o.d);
  const h = H[Math.min(4, H.length - 1)], fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw), ex = Math.cos(h.exitYaw), ez = -Math.sin(h.exitYaw);
  forceTime(12); VM_SCENE.visible = false; px = h.doorX + fx * 5 + ex * 9; pz = h.doorZ + fz * 5 + ez * 9; py = WORLD.worldH(px, pz) + 1.65; const lx = h.doorX - px, lz = h.doorZ - pz; yaw = Math.atan2(-lx, -lz) + .3; pitch = .12; return h.id; }, id);
await g.frames(6);
fs.mkdirSync(path.join(here, '../docs/prototypes'), { recursive: true });
await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-mark-ingame.png') });
console.log(`  (picture along the street from ${shot}: docs/prototypes/kit-mark-ingame.png)`);
check('no errors', g.errs.length === 0, g.errs.slice(0, 5));
await g.close();
