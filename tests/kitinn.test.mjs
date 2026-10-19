// A Gatelander village's inn built from the kit on the new look (Session 1086; card F6, Michael's 1 A on DECISION #320: "the
// farmhouse as a village inn"). On ?look=new the inn of a Gatelands village is the kit's farmhouse on three bays (or two where three
// will not fit), 6.2 m deep with its front on the street line (tests/kitlots has the lots). Measured on the village's own meshes, as
// tests/kittown measures Dunmore's houses: its four walls stand on its solid, the door you use is the drawn door, its sign hangs
// clear of the wall in front of it, its smoke rises from a gable stack, it has its far copy, and the room inside is the inn's. A
// town's inn keeps the old builder's (the coaching inn is a piece of its own); on the old look the village is as it was.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));

const pick = () => { const nat = t => nationKeyOf(...cellOf(t.x, t.z)), d = siteAnywhere('dunmore');
  return allSites().filter(t => nat(t) === 'gatelands' && t.kind === 'village' && t.pad > 0).sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z))[0].id; };
const innOf = id => { const S = WORLD.settle.get(id), h = S.houses.find(h => h.siteId === id && h.type === 'inn'); return h ? { id: h.id, kit: h.kit, w: h.w, d: h.d, name: h.name } : null; };

const g0 = await boot(); await g0.intoWorld();
const vid = await g0.page.evaluate(pick);
check(`the nearest village of the Gatelands to Dunmore stands on the old look (${vid})`, await g0.settle(vid));
const old = await g0.page.evaluate(innOf, vid);
check(`on the old look its inn is the old builder's (${old && old.name}, ${old && old.w} by ${old && old.d} m)`, !!old && !old.kit && g0.errs.length === 0, { old, errs: g0.errs });
await g0.close();

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
check(`${vid} stands on the new look`, await g.settle(vid));
const inn = await page.evaluate(innOf, vid);
check(`its inn is the kit's farmhouse: ${inn && inn.kit && inn.kit.bays} bays, ${inn && inn.w} by ${inn && inn.d} m (the lot was ${inn && inn.kit && inn.kit.w0} by ${inn && inn.kit && inn.kit.d0})`, !!inn && !!inn.kit && inn.kit.kind === 'farmhouse' && inn.kit.inn && inn.d === 6.2 && [7.4, 10.5].includes(inn.w), inn);

const r = await page.evaluate(id => {
  const S = WORLD.settle.get(id); let kitG = null; S.group.traverse(x => { if (x.name === 'kit houses') kitG = x; });
  const h = S.houses.find(h => h.siteId === id && h.type === 'inn'), s = S.sol.find(q => q.hid === h.id);
  const meshes = kitG.children.filter(m => m.isMesh), M = PKIT.gl.mats(), paints = new Set(Object.keys(PKIT.gl.PAINTS).map(k => M['p:' + k]));
  WORLD.scene.updateMatrixWorld(true);
  const rc = new THREE.Raycaster(), org = new THREE.Vector3(), dir = new THREE.Vector3();
  const hit = (x, y, z, dx, dz, far, objs = meshes) => { org.set(x, y, z); dir.set(dx, 0, dz).normalize(); rc.set(org, dir); rc.far = far; return rc.intersectObjects(objs, false)[0] || null; };
  const nx = s.s, nz = s.c, ex = s.c, ez = -s.s, base = WORLD.worldH(s.cx, s.cz);
  /* the four faces at 0.5 m, off the middle (clear of the door): from 0.55 m out, toward the centre */
  const faces = [[nx, nz, s.rz, ex * 1.6, ez * 1.6], [-nx, -nz, s.rz, ex * 1.6, ez * 1.6], [ex, ez, s.rx, nx * .4, nz * .4], [-ex, -ez, s.rx, nx * .4, nz * .4]].map(([ax, az, half, ox, oz]) => {
    const x = s.cx + ax * (half + .55) + ox, z = s.cz + az * (half + .55) + oz, k = hit(x, base + .5, z, -ax, -az, 3); return k ? +(.55 - k.distance).toFixed(3) : null; });
  /* the door: from 1.5 m out, at 1.3 m, straight in */
  const fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw), dh = hit(h.doorX + fx * 1.5, WORLD.worldH(h.doorX, h.doorZ) + 1.3, h.doorZ + fz * 1.5, -fx, -fz, 3);
  /* the sign: its two painted faces, how far out from the door's wall and how high over the door's sill */
  const boards = []; S.group.traverse(m => { if (m.isMesh && m.userData.sign === h.name) boards.push(m); });
  const out = boards.map(b => +((b.position.x - h.doorX) * fx + (b.position.z - h.doorZ) * fz).toFixed(2)), up = boards.map(b => +(b.position.y - WORLD.worldH(h.doorX, h.doorZ)).toFixed(2));
  /* the smoke: a chimney of the town's within a gable's reach of the inn's ends */
  const ch = S.chimneys.filter(c => c.t === 'inn').map(c => { const u = (c.x - s.cx) * ex + (c.z - s.cz) * ez, v = (c.x - s.cx) * nx + (c.z - s.cz) * nz; return { u: +u.toFixed(2), v: +v.toFixed(2), y: +(c.y - base).toFixed(2) }; });
  /* nothing of the old builder on the lot */
  const others = []; S.group.traverse(m => { if (m.isMesh && m.parent !== kitG && m.name !== 'kit houses far' && !m.isSkinnedMesh) others.push(m); });
  const down = new THREE.Raycaster(); down.set(new THREE.Vector3(s.cx, base + 30, s.cz), new THREE.Vector3(0, -1, 0)); down.far = 29.5;
  return { faces, half: [s.rx, s.rz], door: dh ? +dh.distance.toFixed(2) : null, painted: !!(dh && paints.has(dh.object.material)), mat: dh ? Object.keys(M).find(k => M[k] === dh.object.material) || '?' : null,
    boards: boards.length, out, up, ch, under: down.intersectObjects(others, false).length, calls: kitG.children.length, tris: S.kitTris, far: !!S.kitLod, farTris: S.kitLod && S.kitLod.tris };
}, vid);
check(`its four walls stand on its solid, within the wall's thickness (each face ${r.faces.map(f => f == null ? '?' : -f).join(', ')} m inside it)`, r.faces.every(f => f != null && f <= .05 && f >= -.75), r);
check(`the door you use is the drawn door: its painted leaf (${r.mat}), ${r.door} m from a point 1.5 m out`, r.door != null && r.door >= 1.7 && r.door <= 2.3 && r.painted, r);
check(`its sign hangs in front of the wall: two faces ${r.out.join(', ')} m out from the door and ${r.up.join(', ')} m up`, r.boards === 2 && r.out.every(o => o > .8 && o < 1.6) && r.up.every(u => u > 2 && u < 2.9), r);
check(`its smoke rises from a gable stack (${JSON.stringify(r.ch)})`, r.ch.length === 1 && Math.abs(Math.abs(r.ch[0].u) - (r.half[0] - .15 - .36)) < .2 && Math.abs(r.ch[0].v) < .2 && r.ch[0].y > 7, r.ch);
check('the old builder\'s inn is gone from its lot', r.under === 0, r);
check(`the village's kit buildings are ${r.calls} draws (${r.tris} triangles), with a far copy of ${r.farTris}`, r.calls > 4 && r.calls <= 40 && r.far && r.farTris > 0, r);

// inside: the room is the inn's, the innkeeper keeps it and lets its rooms
const room = await page.evaluate(id => { const S = WORLD.settle.get(id), h = S.houses.find(h => h.siteId === id && h.type === 'inn');
  let sc = null, err = null, beds = 0; try { sc = WORLD.buildInteriorFor(h); beds = INT_BEDS.filter(b => b.owner === 'inn').length; } catch (e) { err = String(e && e.stack || e); }
  const topics = h.dlg ? (h.dlg.topics || []).map(t => t.label) : []; return { err, beds, kids: sc ? sc.children.length : 0, topics: topics.slice(0, 6), keeper: h.keeper }; }, vid);
check(`the room inside is built (${room.kids} pieces, ${room.beds} beds to let) and ${room.keeper} lets them`, !room.err && room.kids > 10 && room.beds > 0 && room.topics.some(t => /bed for the night/i.test(t)), room);

// a picture: the inn from its road at noon, 9 m out and a little to one side
await page.evaluate(id => { const S = WORLD.settle.get(id), h = S.houses.find(h => h.siteId === id && h.type === 'inn'), fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw), ex = Math.cos(h.exitYaw), ez = -Math.sin(h.exitYaw);
  forceTime(12); VM_SCENE.visible = false; px = h.doorX + fx * 9 + ex * 4; pz = h.doorZ + fz * 9 + ez * 4; py = WORLD.worldH(px, pz) + 1.65; yaw = Math.atan2(-(h.doorX - px), -(h.doorZ - pz)); pitch = .1; }, vid);
await g.frames(6);
fs.mkdirSync(path.join(here, '../docs/prototypes'), { recursive: true });
await page.screenshot({ path: path.join(here, '../docs/prototypes/kit-inn-ingame.png') });
console.log('  (picture: docs/prototypes/kit-inn-ingame.png)');
check('no errors on the new look', g.errs.length === 0, g.errs);
await g.close();
