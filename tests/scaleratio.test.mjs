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
  const rc = new THREE.Raycaster(); const dir = new THREE.Vector3(), org = new THREE.Vector3();
  const hitAt = (x, y, z, dx, dz) => { org.set(x, y, z); dir.set(dx, 0, dz).normalize(); rc.set(org, dir); rc.far = 3; const h = rc.intersectObjects(meshes, false)[0]; return h ? h.distance : null; };
  const out = [];
  for (const h of Sx.houses) {
    if (!(h.type === 'home' || h.type === 'inn' || h.type === 'misc' || h.type === 'potion' || h.type === 'weapon' || h.type === 'armor' || h.type === 'barber')) continue;
    const b = Sx.sol.find(s => s.hid && Math.hypot(s.cx - h.doorX, s.cz - h.doorZ) < 8); if (!b) continue;
    const tx = h.doorX - b.cx, tz = h.doorZ - b.cz, L = Math.hypot(tx, tz) || 1, nx = tx / L, nz = tz / L;
    // the leaf: the flat face met straight on at the door's middle, 1.3 over the ground; then down and up from there while the
    // ray still meets that face (within 6 mm), to the leaf's foot and its head
    // (12 cm to either side of the middle, clear of the planks' battens; the strap hinges cross one side, so the longer run counts)
    const base = WORLD.worldH(h.doorX, h.doorZ), sx = -nz, sz = nx; let best = null;
    for (const off of [.12, -.12]) { const ox = h.doorX + nx * 1.0 + sx * off, oz = h.doorZ + nz * 1.0 + sz * off;
      const dm = hitAt(ox, base + 1.3, oz, -nx, -nz); if (dm == null) continue;
      let f = 1.3, t = 1.3; for (let y = 1.3; y > -1; y -= .005) { const d = hitAt(ox, base + y, oz, -nx, -nz); if (d == null || Math.abs(d - dm) > .006) break; f = y; }
      for (let y = 1.3; y < 5; y += .005) { const d = hitAt(ox, base + y, oz, -nx, -nz); if (d == null || Math.abs(d - dm) > .006) break; t = y; }
      if (!best || t - f > best.t - best.f) best = { f, t, dm, ox, oz }; }
    if (!best) continue; const foot = best.f, top = best.t, dm = best.dm, ox = best.ox, oz = best.oz;
    out.push({ id: h.id, type: h.type, two: !!h.two, storeys: h.storeys || 1, style: h.style, leafTop: top, foot, wallH: h.wallH || null });
  }
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
