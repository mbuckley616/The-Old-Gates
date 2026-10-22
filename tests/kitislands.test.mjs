// The Mark's and Aurenne's houses built from the kit on the new look (card F6). Session 1280 (Michael's C on #277, A on #285): a Markish
// settlement's homes and shops are the kit's halls (PKIT.mk.hall), gable to the street on their steps, roofed by PKIT.mk.lot (two in three
// dark shingle, one in three dry turf). Session 1281 (Michael's B on #259): an Aurennais settlement's are the kit's houses (PKIT.au.house)
// by PKIT.au.lot (two in three flat behind a parapet, one in three Roman under pantile). Measured on the first town of each island, on its
// own meshes: the back and the sides stand where the solid is, the door you knock at is the lot's front with the drawn door straight
// ahead, the houses are a few dozen draws, the old builder's houses are gone from those lots, the far copy stands for them from outside
// the town, and the town takes no more than 1.2 s longer to build than with its old houses (Dunmore's kit costs it 1.0 s). On the old look the towns are as they were.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const ISLES = [['mark', 'markhall', 'mk'], ['aurenne', 'aurhouse', 'au']];
const pickTown = nk => { anchoredPlaces(); const S = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === nk).flatMap(c => c.sites); return (S.find(s => s.kind === 'town') || {}).id; };

const g0 = await boot({ look: 'old' }); await g0.intoWorld();
for (const [nk] of ISLES) { const id0 = await g0.page.evaluate(pickTown, nk); await g0.settle(id0);
  const o = await g0.page.evaluate(id => { const S = WORLD.settle.get(id); let kit = 0; S.group.traverse(x => { if (x.name === 'kit houses') kit++; }); return { kit, n: S.houses.filter(h => h.siteId === id && h.kit).length }; }, id0);
  check(`on the old look ${nk}'s ${id0} has no kit houses`, o.kit === 0 && o.n === 0 && g0.errs.length === 0, { ...o, errs: g0.errs }); }
await g0.close();

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
for (const [nk, kind, pk] of ISLES) {
  const id = await page.evaluate(pickTown, nk);
  check(`a town of ${nk} (${id}) stands on the new look`, !!id && await g.settle(id));
  const r = await page.evaluate(([id, kind, pk]) => {
    const S = WORLD.settle.get(id); let kitG = null; S.group.traverse(x => { if (x.name === 'kit houses') kitG = x; });
    if (!kitG) return { none: true };
    const meshes = kitG.children.filter(m => m.isMesh), M = PKIT[pk].mats(), leaves = new Set(pk === 'mk' ? [M.door] : []);
    /* Aurenne's door paints are made by the house as it needs them (door:0 to door:4): build one of each to learn them */
    if (pk === 'au') for (let k = 0; k < PKIT.au.AUR.doors.length; k++) PKIT.au.house({ kind: 'flat', w: 7, d: 6, two: false, door: k }, PKIT.stream('leaf' + k)).group.traverse(m => { if (m.isMesh && /^door/.test(m.name)) leaves.add(m.material); });
    WORLD.scene.updateMatrixWorld(true);
    const rc = new THREE.Raycaster(), org = new THREE.Vector3(), dir = new THREE.Vector3();
    const hit = (x, y, z, dx, dz, far) => { org.set(x, y, z); dir.set(dx, 0, dz).normalize(); rc.set(org, dir); rc.far = far; return rc.intersectObjects(meshes, false)[0] || null; };
    const H = S.houses.filter(h => h.siteId === id && h.kit), out = [];
    for (const h of H) {
      const s = S.sol.find(q => q.hid === h.id); if (!s) { out.push({ id: h.id, nosol: true }); continue; }
      const k = h.kit, E = k.ext, nx = s.s, nz = s.c, ex = s.c, ez = -s.s, base = WORLD.worldH(s.cx, s.cz), hz = (s.rz - .15) - k.o.d / 2 - E[1];
      /* the back and the two sides 0.4 m over the ground (the footing, the plinth or a stair's foot), from 0.55 m out, toward the house:
         the back a little off its middle, the sides 0.7 m in front of the house's middle */
      const faces = [[-nx, -nz, s.rz, ex * .4, ez * .4], [ex, ez, s.rx, nx * (hz + .7), nz * (hz + .7)], [-ex, -ez, s.rx, nx * (hz + .7), nz * (hz + .7)]].map(([ax, az, half, ox, oz]) => {
        const x = s.cx + ax * (half + .55) + ox, z = s.cz + az * (half + .55) + oz, q = hit(x, base + .4, z, -ax, -az, 3); return q ? +(.55 - q.distance).toFixed(3) : null; });
      /* the door: from 1.5 m before the lot's front, 0.3 m aside of the door's middle (clear of an arcade's column), at 1.3 m over the
         ground (1.6 for a hall, up its steps), straight in: past the steps, the porch, the pot or the arcade, to the leaf */
      const fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw), sx = -fz * .3, sz = fx * .3, dh = hit(h.doorX + fx * 1.5 + sx, WORLD.worldH(h.doorX, h.doorZ) + (kind === 'markhall' ? 1.6 : 1.3), h.doorZ + fz * 1.5 + sz, -fx, -fz, 8);
      out.push({ id: h.id, roof: k.o.roof || k.o.kind, w: k.o.w, d: k.o.d, ext: E, faces, door: dh ? +(dh.distance - 1.5 - .15 - E[1]).toFixed(2) : null, leaf: !!(dh && leaves.has(dh.object.material)) });
    }
    const others = []; S.group.traverse(m => { if (m.isMesh && m.parent !== kitG && m.name !== 'kit houses far' && !m.isSkinnedMesh) others.push(m); });
    const down = new THREE.Raycaster(); let under = 0;
    for (const h of H) { const s = S.sol.find(q => q.hid === h.id); if (!s) continue; down.set(new THREE.Vector3(s.cx, WORLD.worldH(s.cx, s.cz) + 30, s.cz), new THREE.Vector3(0, -1, 0)); down.far = 29.5; if (down.intersectObjects(others, false).length) under++; }
    return { n: H.length, kinds: [...new Set(H.map(h => h.kit.kind))], all: S.houses.filter(h => h.siteId === id).length, calls: kitG.children.length, tris: S.kitTris, out, under };
  }, [id, kind, pk]);
  check(`${id} has its kit houses, all of the island's kind`, !r.none && r.n > 15 && r.kinds.length === 1 && r.kinds[0] === kind, r.none ? r : { n: r.n, all: r.all, kinds: r.kinds });
  if (r.none) continue;
  const minor = r.out.filter(h => h.roof === (kind === 'markhall' ? 'turf' : 'tile')).length;
  check(`one in three or so is ${kind === 'markhall' ? 'turf' : 'Roman'} (${minor} of ${r.n})`, minor >= r.n * .2 && minor <= r.n * .5, { minor, n: r.n });
  const W0 = kind === 'markhall' ? 5.6 : 5.4, D0 = kind === 'markhall' ? 6.5 : 5;
  check(`every house is ${W0} m wide or more and ${D0} m deep or more (${Math.min(...r.out.map(h => h.w))} to ${Math.max(...r.out.map(h => h.w))} by ${Math.min(...r.out.map(h => h.d))} to ${Math.max(...r.out.map(h => h.d))} m)`, r.out.every(h => h.w >= W0 - 1e-6 && h.d >= D0 - 1e-6), r.out.filter(h => h.w < W0 || h.d < D0).slice(0, 5));
  const bad = r.out.filter(h => h.nosol || h.faces.some(f => f == null || f > .05 || f < -.45));
  check(`every house's back and sides stand on its solid (${r.n} houses; each face ${-Math.max(...r.out.flatMap(h => h.faces))} to ${-Math.min(...r.out.flatMap(h => h.faces))} m inside)`, bad.length === 0, bad.slice(0, 5));
  const badD = r.out.filter(h => h.door == null || h.door < -.05 || h.door > .45 || !h.leaf);
  check(`the door you knock at is the lot's front, the drawn door straight ahead (the leaf ${Math.min(...r.out.map(h => h.door))} to ${Math.max(...r.out.map(h => h.door))} m behind the house's front)`, badD.length === 0, badD.slice(0, 5));
  check(`the town's kit houses are ${r.calls} draws (${r.tris} triangles)`, r.calls > 6 && r.calls <= 45, { calls: r.calls, tris: r.tris });
  check('the old builder\'s houses are gone from the kit lots', r.under === 0, { under: r.under });

  const far = await page.evaluate((id) => { const S = WORLD.settle.get(id), K = S.kitLod; if (!K) return { none: true };
    const box = o => { const b = new THREE.Box3().setFromObject(o); return { x0: b.min.x, x1: b.max.x, y1: b.max.y, z0: b.min.z, z1: b.max.z }; };
    K.hi.visible = true; K.lo.visible = true; const A = box(K.hi), B = box(K.lo);
    const at = (dx, dz) => { px = K.x + dx; pz = K.z + dz; py = WORLD.worldH(px, pz) + 1.65; CAM.position.set(px, py, pz); houseLod(); houseLod(); return { hi: K.hi.visible, lo: K.lo.visible }; };
    const out = at(K.r + 160, 0), inn = at(0, 0); return { loTris: K.tris, hiTris: S.kitTris, A, B, out, inn }; }, id);
  check(`a far copy of ${far.loTris} triangles stands for the houses' ${far.hiTris}`, !far.none && far.loTris > 0 && far.loTris * 20 < far.hiTris, far);
  const dB = far.none ? 9 : Math.max(...['x0', 'x1', 'z0', 'z1'].map(k => Math.abs(far.A[k] - far.B[k])));
  check(`it covers their ground within ${dB.toFixed(2)} m and their height within ${far.none ? '?' : Math.abs(far.A.y1 - far.B.y1).toFixed(2)} m`, !far.none && dB < 3.5 && Math.abs(far.A.y1 - far.B.y1) < 1.6, far.none ? far : { A: far.A, B: far.B });
  check('from outside the town the far copy is drawn, in the town the houses', !far.none && far.out.lo && !far.out.hi && far.inn.hi && !far.inn.lo, far);

  // the time to build the town again, with its kit houses and with the old houses (window.OG_KIT_TOWNS=false), best of three each
  const t = await page.evaluate((id) => { const site = allSites().find(s => s.id === id), run = () => { const t0 = performance.now(); disposeSettlement(id); genSettlement(site); return performance.now() - t0; };
    const kit = Math.min(run(), run(), run()); window.OG_KIT_TOWNS = false; const old = Math.min(run(), run(), run()); window.OG_KIT_TOWNS = true; run(); return { kit: Math.round(kit), old: Math.round(old) }; }, id);
  check(`building the town takes ${t.kit} ms with its kit houses, ${t.old} ms with the old houses (no more than 1.2 s over, as Dunmore's kit costs it)`, t.kit < t.old + 1200, t);

  const shot = await page.evaluate(([id, kind]) => { const S = WORLD.settle.get(id), H = S.houses.filter(h => h.siteId === id && h.kit).sort((a, b) => b.kit.o.d - a.kit.o.d);
    const h = H[Math.min(4, H.length - 1)], fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw), ex = Math.cos(h.exitYaw), ez = -Math.sin(h.exitYaw);
    forceTime(12); VM_SCENE.visible = false; px = h.doorX + fx * 5 + ex * 9; pz = h.doorZ + fz * 5 + ez * 9; py = WORLD.worldH(px, pz) + 1.65; const lx = h.doorX - px, lz = h.doorZ - pz; yaw = Math.atan2(-lx, -lz) + .3; pitch = .12; return h.id; }, [id, kind]);
  await g.frames(6);
  fs.mkdirSync(path.join(here, '../docs/prototypes'), { recursive: true });
  await page.screenshot({ path: path.join(here, `../docs/prototypes/kit-${nk}-ingame.png`) });
  console.log(`  (picture along the street from ${shot}: docs/prototypes/kit-${nk}-ingame.png)`);
}
check('no errors', g.errs.length === 0, g.errs.slice(0, 5));
await g.close();
