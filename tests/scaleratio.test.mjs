// The scale's ratios (card F2a, Sessions 880 to 882; docs/design/visual-foundation.md §1): one unit is one metre, and everything is
// measured against a 1.8 m person. On built meshes, in a town of each of the three islands: a house door's height is 1.1 to 1.25 of
// the person, a storey 1.45 to 1.7, and the eye (1.65) stands 0.75 to 0.85 of the door's height. The doors and the walls are found
// by casting rays at the town's own baked meshes: straight at the middle of each door from a metre out, the leaf stands proud of its
// surround and the surround of the wall, so the height where the hit moves back is the leaf's top; along the wall beside it, where
// the ray stops meeting the wall plane is the eaves. The townsfolk are measured too, at their people's statures.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const S = await page.evaluate(() => ({ SCALE }));
const P = S.SCALE.PERSON;
check('SCALE is the one table: a 1.8 m person, the eye at 1.65 standing and 1.1 crouched, a door 2.0 to 2.2, a storey 2.6 to 3.0',
  P === 1.8 && EYE_OK(S.SCALE) && S.SCALE.DOOR_H >= 2 && S.SCALE.DOOR_H <= 2.2 && S.SCALE.STOREY_MIN >= 2.6 && S.SCALE.STOREY_MAX <= 3, S.SCALE);
function EYE_OK(s) { return s.EYE_STAND === 1.65 && s.EYE_CROUCH === 1.1; }
check('the player\'s eye is SCALE\'s', await page.evaluate(() => EYE_STAND === 1.65 && EYE_CROUCH === 1.1));

// a town of each island: Dunmore (the Gatelands), then the nearest town of the Mark and of Aurenne
const towns = await page.evaluate(() => { const nat = t => nationKeyOf(...cellOf(t.x, t.z)); const ALL = allSites().filter(t => t.kind === 'town' || t.kind === 'city');
  const d = siteAnywhere('dunmore'); const near = n => ALL.filter(t => nat(t) === n).sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z))[0];
  return [{ id: 'dunmore', nat: nat(d) }, ...['mark', 'aurenne'].map(n => { const t = near(n); return t ? { id: t.id, nat: n } : null; }).filter(Boolean)]; });
check('a town on each of the three islands', towns.length === 3, towns);

const measure = () => page.evaluate(() => {
  const id = window._tid, Sx = WORLD.settle.get(id); if (!Sx) return { none: true };
  const meshes = []; Sx.group.traverse(o => { if (o.isMesh && o.visible && !o.isSkinnedMesh && o.geometry && o.geometry.attributes.position) meshes.push(o); }); /* the town's own meshes */
  WORLD.scene.updateMatrixWorld(true);
  // S1217: each door's rays meet only the meshes that come within 4 m of it (the whole town's took over 15 minutes on the kit's houses)
  const reach = meshes.map(m => { if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); const c = m.geometry.boundingSphere.center.clone().applyMatrix4(m.matrixWorld);
    return { m, x: c.x, z: c.z, r: m.geometry.boundingSphere.radius * m.matrixWorld.getMaxScaleOnAxis() }; });
  let near = meshes;
  const rc = new THREE.Raycaster(); const dir = new THREE.Vector3(), org = new THREE.Vector3();
  const hitOf = (x, y, z, dx, dz) => { org.set(x, y, z); dir.set(dx, 0, dz).normalize(); rc.set(org, dir); rc.far = 3; return rc.intersectObjects(near, false); };
  const hitAt = (x, y, z, dx, dz) => { const h = hitOf(x, y, z, dx, dz)[0]; return h ? h.distance : null; };
  // the kit's houses (S1217): their meshes are one per material, so a hit says what it met. The leaf is its paint (the raised panels
  // too, 3 cm proud of it, and its iron); a glazed door's glass and its thin bars belong to it; a rail of 6.5 cm or more (the fanlight's
  // spring bar, the shop door's transom) is the leaf's head; anything else (the dressing, the wall, the room behind) or nothing ends it.
  // The step before the door is passed through on the way down, to the leaf's foot.
  // (A farmhouse's transom door would read to its transom's head, its rail as thin as a glazed door's: no town has one, villages do.)
  const KEY = new Map(); if (typeof PKIT !== 'undefined') { const M = PKIT.gl.mats(); for (const k in M) KEY.set(M[k], k);
    /* S1310 — and Aurenne's house (PKIT.au, Session 1287): a leaf of one of its door colours with its iron, in a dressed stone surround */
    if (PKIT.au) { const A = PKIT.au.mats(); A.door.forEach((m, i) => KEY.set(m, 'p:au' + i)); if (!KEY.has(A.iron)) KEY.set(A.iron, 'iron'); if (!KEY.has(A.stone)) KEY.set(A.stone, 'dress'); } }
  // and a kit house's rays meet only its own building (the town's baked meshes cost every ray a pass over the whole town)
  let kitG = null; Sx.group.traverse(o => { if (o.name === 'kit houses') kitG = o; });
  const ownKit = b => { if (!kitG) return null; const v = new THREE.Vector3(); let best = null, bd = 1e9;
    for (const c of kitG.children) { c.getWorldPosition(v); const d = Math.hypot(v.x - b.cx, v.z - b.cz); if (d < bd) { bd = d; best = c; } }
    if (!best || bd > 1) return null; const ms = []; best.traverse(o => { if (o.isMesh && o.visible) ms.push(o); }); return ms; };
  const kind = h => { if (!h) return 'end'; const k = KEY.get(h.object.material); if (k == null) return 'end';
    return k.startsWith('p:') || k === 'iron' ? 'leaf' : k === 'glass' || k === 'lit' ? 'glass' : k === 'frame' ? 'frame' : k === 'dress' ? 'dress' : 'end'; };
  // (2 cm a step while the ray stays on the leaf or its glass; back to the last such step and 5 mm a step through anything else)
  const kitRun = (ox, oz, nx, nz, base) => { const at = y => hitOf(ox, base + y, oz, -nx, -nz);
    if (kind(at(.6)[0]) !== 'leaf') return null;
    let t = .6, rail = null, fine = false;
    for (let y = .62; y < 5;) { const c = kind(at(y)[0]), ok = c === 'leaf' || c === 'glass';
      if (!fine && !ok) { fine = true; y = t + .005; continue; }
      if (c === 'frame') { if (rail == null) rail = y; if (y - rail >= .065) { t = rail; break; } y += .005; continue; }
      if (!ok) { if (rail != null) t = rail; break; }
      rail = null; t = y; fine = false; y += .02; }
    const footAt = y => { const c = kind(at(y).find(q => !(kind(q) === 'dress' && q.point.y < base + .3))); return c === 'leaf' || c === 'glass' || c === 'frame'; };
    let f = .6; fine = false; for (let y = .58; y > -1;) { if (footAt(y)) { f = y; y -= fine ? .005 : .02; continue; } if (fine) break; fine = true; y = f - .005; }
    return { f, t }; };
  const clipped = [], va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  const clipNear = (ms, dx, dz, nx, nz) => { const qx = [dx + nx * 1.1, dx - nx * 2.1], qz = [dz + nz * 1.1, dz - nz * 2.1], pad = .25;
    const x0 = Math.min(...qx) - pad, x1 = Math.max(...qx) + pad, z0 = Math.min(...qz) - pad, z1 = Math.max(...qz) + pad, res = [];
    for (const m of ms) { if (m.isInstancedMesh || Array.isArray(m.material)) { res.push(m); continue; }
      const p = m.geometry.attributes.position, ix = m.geometry.index, n = ix ? ix.count : p.count, keep = [];
      for (let i = 0; i < n; i += 3) { const ia = ix ? ix.getX(i) : i, ib = ix ? ix.getX(i + 1) : i + 1, ic = ix ? ix.getX(i + 2) : i + 2;
        va.fromBufferAttribute(p, ia).applyMatrix4(m.matrixWorld); vb.fromBufferAttribute(p, ib).applyMatrix4(m.matrixWorld); vc.fromBufferAttribute(p, ic).applyMatrix4(m.matrixWorld);
        if (Math.max(va.x, vb.x, vc.x) < x0 || Math.min(va.x, vb.x, vc.x) > x1 || Math.max(va.z, vb.z, vc.z) < z0 || Math.min(va.z, vb.z, vc.z) > z1) continue;
        keep.push(va.x, va.y, va.z, vb.x, vb.y, vb.z, vc.x, vc.y, vc.z); }
      if (!keep.length) continue; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3));
      const c = new THREE.Mesh(geo, m.material); c.updateMatrixWorld(true); clipped.push(c); res.push(c); }
    return res; };
  const out = [];
  for (const h of Sx.houses) {
    if (!(h.type === 'home' || h.type === 'inn' || h.type === 'misc' || h.type === 'potion' || h.type === 'weapon' || h.type === 'armor' || h.type === 'barber')) continue;
    // the house's own footprint (S1217: the first one with a house id within 8 m was a neighbour's for 7 of Dunmore's kit houses), and
    // the normal of its front: the lot's facing, toward the door (a kit house's door stands in a bay, off the middle of its front)
    const b = Sx.sol.find(s => s.hid === h.id) || Sx.sol.find(s => s.hid && Math.hypot(s.cx - h.doorX, s.cz - h.doorZ) < 8); if (!b) continue;
    let nx = h.doorX - b.cx, nz = h.doorZ - b.cz; if (b.c != null) { const sg = Math.sign(nx * b.s + nz * b.c) || 1; nx = b.s * sg; nz = b.c * sg; }
    { const L = Math.hypot(nx, nz) || 1; nx /= L; nz /= L; }
    near = (h.kit && ownKit(b)) || reach.filter(q => Math.hypot(q.x - h.doorX, q.z - h.doorZ) < q.r + 4).map(q => q.m);
    // S1469: only the triangles a door's rays can cross (from 1 m out to 2 m in, 0.2 m to either side), in world space with their own
    // materials, so each ray tests hundreds of triangles, not a whole house's merged meshes (Dunmore's 56 doors took 284 s, over CI's 900)
    near = clipNear(near, h.doorX, h.doorZ, nx, nz);
    // the leaf: the flat face met straight on at the door's middle, 1.3 over the ground; then down and up from there while the
    // ray still meets that face (within 6 mm), to the leaf's foot and its head
    // (12 cm to either side of the middle, clear of the planks' battens; the strap hinges cross one side, so the longer run counts)
    const base = WORLD.worldH(h.doorX, h.doorZ), sx = -nz, sz = nx; let best = null;
    for (const off of [.12, -.12]) { const ox = h.doorX + nx * 1.0 + sx * off, oz = h.doorZ + nz * 1.0 + sz * off;
      if (h.kit) { const k = kitRun(ox, oz, nx, nz, base); if (k && (!best || k.t - k.f > best.t - best.f)) best = { ...k, ox, oz }; continue; }
      const dm = hitAt(ox, base + 1.3, oz, -nx, -nz); if (dm == null) continue;
      let f = 1.3, t = 1.3; for (let y = 1.3; y > -1; y -= .005) { const d = hitAt(ox, base + y, oz, -nx, -nz); if (d == null || Math.abs(d - dm) > .006) break; f = y; }
      for (let y = 1.3; y < 5; y += .005) { const d = hitAt(ox, base + y, oz, -nx, -nz); if (d == null || Math.abs(d - dm) > .006) break; t = y; }
      if (!best || t - f > best.t - best.f) best = { f, t, dm, ox, oz }; }
    if (!best) continue; const foot = best.f, top = best.t;
    out.push({ id: h.id, type: h.type, kit: h.kit ? h.kit.kind : null, two: !!h.two, storeys: h.storeys || 1, style: h.style, leafTop: top, foot, wallH: h.wallH || null });
  }
  for (const c of clipped) c.geometry.dispose();
  return { n: out.length, houses: out };
});

const all = [];
for (const t of towns) {
  await g.settle(t.id);
  await page.evaluate(id => { window._tid = id; forceTime(12); for (let i = 0; i < 60; i++) WORLD.tick(1 / 60, performance.now()); }, t.id);
  const m = await measure();
  const H = (m.houses || []).filter(h => h.leafTop != null && h.foot != null);
  const doors = H.map(h => +(h.leafTop - h.foot).toFixed(2));
  const storeys = H.filter(h => h.wallH != null).map(h => +(h.wallH / h.storeys).toFixed(2)); const odd = H.filter(h => { const d = h.leafTop - h.foot; return d / P < 1.1 || d / P > 1.25; }).map(h => h.id + ':' + h.type + ':' + (h.leafTop - h.foot).toFixed(2));
  const r = { town: t.id, nat: t.nat, houses: H.length, doors: [Math.min(...doors), Math.max(...doors)], storeys: [Math.min(...storeys), Math.max(...storeys)] };
  console.log(JSON.stringify(r));
  check(`${t.id} (${t.nat}): every house door is 1.1 to 1.25 of a 1.8 m person (${H.length} doors measured)`, H.length >= 4 && !odd.length, { ...r, odd });
  check(`${t.id}: the eye at 1.65 stands .75 to .85 of every door's height`, doors.every(d => 1.65 / d >= .75 && 1.65 / d <= .85), doors);
  check(`${t.id}: every storey (the wall's height over its storeys, as the builder made it) is 1.45 to 1.7 of the person`, storeys.length >= 4 && storeys.every(s => s / P >= 1.45 && s / P <= 1.7), storeys);
  all.push(r);
}
const ppl = await page.evaluate(() => { const out = {}; for (const r of PEOPLE_RIGS) { if (!r.g || r.g.child || r.foe || !r.root.parent) continue; const k = r.g.people + (r.g.female ? '/f' : '/m');
  const h = +(r.root.scale.y / PW.BODY * SCALE.PERSON_MODEL).toFixed(2); (out[k] = out[k] || []).push(h); } for (const k in out) out[k] = [Math.min(...out[k]), Math.max(...out[k]), out[k].length]; return out; });
check('the townsfolk stand 1.45 to 2.0 m (Michael\'s ranges on #276, with the genome\'s spread)', Object.values(ppl).every(([a, b]) => a >= 1.4 && b <= 2.05), ppl);
// the mesh inspector stands a 1.8 m figure beside every piece: a house from the places group, with the yardstick on its stage
const ins = await page.evaluate(() => { openInspector(); const e = INSPECTOR.entries.find(x => x.key === 'buildings/houses-by-style/irish');
  INSPECTOR.select(e.id); const f = INSPECTOR.figure; const on = !!(f && f.root.parent && f.root.parent === INSPECTOR.stage || (f && f.root.parent && f.root.parent.parent === INSPECTOR.stage));
  const tall = f ? +(f.root.scale.y / PW.BODY * SCALE.PERSON_MODEL).toFixed(3) : null; const name = e.key; closeInspector(); return { name, on, tall }; });
check('the mesh inspector stands a figure of exactly 1.8 m beside the piece shown (an Irish house)', ins.on && Math.abs(ins.tall - 1.8) < .005, ins);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
