// The wonders (Session 1614; backlog L5, "Strange places", OG-106; Michael's C on #898): the Mark's Skyfall Fields on the new look.
// Its place is the seed's (a snowy field in the Mark, clear of every site, door and road), the same when asked again; it stands within
// 1.6 km in 11 draws, its stones hung over their pits with the scatter cleared under them, its two broken walls solid where they stand;
// from 20h to 5h it wakes (the stones drift, the seams burn), by day it is dead stone; and it goes when you leave. Session 1634: the
// same for Aurenne's Broken Orrery on its headland.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const s = await page.evaluate(() => { const a = wonderSkyfallSite(); WONDERS.skyfall.site = undefined; const t0 = performance.now(), b = wonderSkyfallSite(), ms = Math.round(performance.now() - t0);
  const sites = [...CELLS.values()].flatMap(c => c.sites), near = sites.reduce((m, t) => Math.min(m, Math.hypot(t.x - b.x, t.z - b.z) - (t.pad || 0)), 1e9);
  const [i, j] = cellOf(b.x, b.z); return { ...b, ms, same: JSON.stringify(a) === JSON.stringify(b), nation: nationKeyOf(i, j), snow: b.h - snowLineAt(b.x, b.z), near: Math.round(near) }; });
console.log(JSON.stringify(s));
check(`the Skyfall Fields' place is in the Mark, over the snow line (${s.snow.toFixed(1)} m), the same asked twice`, s.nation === 'mark' && s.snow > 22 && s.same, s);
check(`its field falls ${s.fall} m over 300 by 130 m, and it stands ${s.near} m past the nearest site's pad`, s.fall <= 30 && s.near >= 260, s);
const at = await page.evaluate((s) => { const [x, z] = wonderToWorld(s, 6, -170); return { x, z }; }, s);
await page.evaluate(({ x, z }) => goToZone('world', x, z, 0, 'x'), at);
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [at.x, at.z], { timeout: 60000 });
await g.cells(); await g.hide();
const r = await page.evaluate(() => { forceTime(13); WONDERS._t = 0; tickWonders(); const S = WONDERS.skyfall, W = S.W; if (!W) return { none: true };
  let meshes = 0; W.group.traverse(o => { if (o.isMesh) meshes++; });
  const m = new THREE.Matrix4(), v = new THREE.Vector3(); let under = 0;
  for (const q of S.stamps) for (const ch of chunks.values()) for (const o of ch.group.children) { if (!o.isInstancedMesh || !o.userData.scatter) continue; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); v.setFromMatrixPosition(m); if (Math.hypot(v.x - q.x, v.z - q.z) < q.r) under++; } }
  // a stone's lowest point over the drawn ground under it, in the world
  W.group.updateMatrixWorld(true); let clear = 1e9; for (const im of W.group.children.filter(o => o.isInstancedMesh)) { im.geometry.computeBoundingBox(); for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m); const b = im.geometry.boundingBox.clone().applyMatrix4(m).applyMatrix4(W.group.matrixWorld); const c = b.getCenter(v); clear = Math.min(clear, b.min.y - meshH(c.x, c.z)); } }
  const seam = W.group.getObjectByName('seam'), day = { seamDead: seam.material === seam.userData.on ? false : true };
  const w0 = W.walls[0], [wx, wz] = wonderToWorld(S.site, w0.x, w0.z), [ox, oz] = wonderToWorld(S.site, w0.x, w0.z + 12);
  return { tris: W.tris, draws: W.draws, meshes, stones: W.size.stones, highest: W.size.highest, stamps: S.stamps.length, under, clear: +clear.toFixed(2), sol: S.sol.length, wallSolid: solidAt(wx, wz), besideOpen: !solidAt(ox, oz), day, inScene: W.group.parent === sc }; });
console.log(JSON.stringify(r));
check(`within 1.6 km it stands: ${r.stones} stones up to ${r.highest} m over their pits, ${r.tris} triangles in ${r.draws} draws`, !r.none && r.inScene && r.stones === 34 && r.draws === r.meshes && r.draws <= 12 && r.tris < 30000, r);
check(`every stone hangs clear of the ground (the lowest ${r.clear} m up), with no tree, bush or rock left under any of its ${r.stamps} stamps`, r.clear > 3 && r.under === 0, r);
check(`the broken walls' standing courses are solid (${r.sol} boxes), the ground 12 m off one open`, r.sol >= 10 && r.wallSolid && r.besideOpen, r);
check('at 13h it sleeps: every seam is dead stone', r.day.seamDead, r);
const n = await page.evaluate(() => { const W = WONDERS.skyfall.W, im = W.group.children.find(o => o.isInstancedMesh), m = new THREE.Matrix4(), y = t => (im.getMatrixAt(0, m), m.elements[13]);
  forceTime(22); tickWonders(); const a = y(); for (let k = 0; k < 3; k++) W.tick(performance.now() / 1000 + 3 + k, wonderAwake()); const b = y();
  const seam = W.group.getObjectByName('seam'); const out = { awake: wonderAwake(), lit: seam.material === seam.userData.on && seam.material.emissiveIntensity > .3, moved: +Math.abs(b - a).toFixed(3) };
  forceTime(4.5); out.dawn = wonderAwake(); forceTime(5.5); out.morning = wonderAwake(); return out; });
console.log(JSON.stringify(n));
check(`at 22h it wakes: the seams burn and the stones drift (${n.moved} m in three seconds); awake at 4:30, asleep at 5:30`, n.awake && n.lit && n.moved > 0 && n.dawn && !n.morning, n);
// Session 1644 (the critic, 31 Oct): the walls' seams are the pale lilac the prototype's page shows, not the raw magenta of its numbers
// read through the game's linear output (green over .5, where the kit's violet is .30)
const ws = await page.evaluate(() => { const m = WONDERS.skyfall.W.group.getObjectByName('w:seam'), e = m && m.userData.on && m.userData.on.emissive; return e ? { r: +e.r.toFixed(2), g: +e.g.toFixed(2), b: +e.b.toFixed(2) } : null; }).catch(() => null);
check(`the walls' seams burn pale lilac (${ws && [ws.r, ws.g, ws.b].join(', ')}), not magenta`, ws && ws.g > .5 && ws.b > .9, ws);
// Session 1645 (OG-106; the critic, 31 Oct): the aurora over the Fields, one mesh, seen only while they wake
const au = await page.evaluate(() => { const W = WONDERS.skyfall.W, m = W && W.group.getObjectByName('aurora'); if (!m) return null; const s = performance.now() / 1000;
  W.tick(s, true); const night = m.visible; W.tick(s, false); const day = m.visible; W.tick(s, wonderAwake()); m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox;
  return { night, day, low: Math.round(bb.min.y - W.group.position.y), high: Math.round(bb.max.y), tris: m.geometry.index.count / 3 }; });
check(`the aurora hangs over the Fields by night (${au && au.tris} triangles, ${au && au.low} to ${au && au.high} m) and is gone by day`, au && au.night && !au.day && au.tris < 1500, au);
const d = await page.evaluate(() => { const S = WONDERS.skyfall; px = S.site.x + 2500; pz = S.site.z; WONDERS._t = 0; tickWonders(); return { gone: !S.W, sol: STATIC_SOL.filter(q => q.cell === 'wonder:skyfall').length }; });
check('2.5 km off it is dropped, and its solids with it', d.gone && d.sol === 0, d);
// Session 1634: Aurenne's Broken Orrery on its headland. The place is the seed's; the platform stands level on a stamp, its steps walked,
// its columns and pier solid; the rings turn and the script burns from 20h to 5h; it goes when you leave.
const o = await page.evaluate(() => { const a = wonderOrrerySite(); WONDERS.orrery.site = undefined; const t0 = performance.now(), b = wonderOrrerySite(), ms = Math.round(performance.now() - t0);
  const sites = [...CELLS.values()].flatMap(c => c.sites), near = sites.reduce((m, t) => Math.min(m, Math.hypot(t.x - b.x, t.z - b.z) - (t.pad || 0)), 1e9);
  const [i, j] = cellOf(b.x, b.z), [sx, sz] = [b.x - Math.sin(b.ry) * b.dmin, b.z - Math.cos(b.ry) * b.dmin];
  return { ...b, ms, same: JSON.stringify(a) === JSON.stringify(b), nation: nationKeyOf(i, j), near: Math.round(near), seaAhead: rawH(sx, sz) < 0 }; });
console.log(JSON.stringify(o));
check(`the Broken Orrery's place is on Aurenne's coast, ${o.h} m over the sea with it on ${o.seaN} of 16 headings, the same asked twice (${o.ms} ms)`, o.nation === 'aurenne' && o.h >= 8 && o.seaN >= 3 && o.same && o.seaAhead, o);
check(`its ground falls ${o.fall} m round it, and it stands ${o.near} m past the nearest site's pad`, o.fall <= 10 && o.near >= 200, o);
// Session 1643 (the critic, 31 Oct): a headland, not a brow cut into a slope; no ground within 100 m stands more than 3 m over it
check(`nothing within 100 m stands more than 3 m over it (${o.above} m): a headland, not a brow under a hill`, o.above <= 3, o);
const oat = await page.evaluate((o) => { const [x, z] = wonderToWorld(o, 4, 60); return { x, z }; }, o);
await page.evaluate(({ x, z }) => goToZone('world', x, z, 0, 'x'), oat);
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [oat.x, oat.z], { timeout: 60000 });
await g.cells(); await g.hide();
const q = await page.evaluate(() => { forceTime(13); WONDERS._t = 0; tickWonders(); const S = WONDERS.orrery, W = S.W, st = S.site; if (!W) return { none: true };
  let meshes = 0; W.group.traverse(o => { if (o.isMesh) meshes++; });
  const m = new THREE.Matrix4(), v = new THREE.Vector3(); let under = 0; const q0 = S.stamps[0];
  for (const ch of chunks.values()) for (const o of ch.group.children) { if (!o.isInstancedMesh || !o.userData.scatter) continue; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); v.setFromMatrixPosition(m); if (Math.hypot(v.x - q0.x, v.z - q0.z) < q0.r) under++; } }
  // the ground round the platform's rim, against the stamp's level; and what you stand on, from the rim in to the pier
  let rim = 0; for (let k = 0; k < 12; k++) rim = Math.max(rim, Math.abs(meshH(st.x + Math.sin(k * .52) * 24, st.z + Math.cos(k * .52) * 24) - q0.y));
  const at = d => { const [x, z] = wonderToWorld(st, 0, d); return +activeTerrainH(x, z).toFixed(2); }, steps = [at(30), at(22), at(19.5), at(10)];
  const c = W.cols.find(c => c.stand), [cx, cz] = wonderToWorld(st, c.x, c.z), [ox, oz] = wonderToWorld(st, c.x * .8, c.z * .8);
  const script = W.script.emissiveIntensity, ring = W.group.getObjectByName('armillary').children[0];
  return { tris: W.tris, draws: W.draws, meshes, rim: +rim.toFixed(2), steps, top: W.top, base: W.base, plats: W.plats, under, sol: S.sol.length, colSolid: solidAt(cx, cz), floorOpen: !solidAt(ox, oz), pier: solidAt(st.x, st.z),
    script, sun: W.sunMat.emissiveIntensity, hub: W.hub, size: W.size, inScene: W.group.parent === sc, rot: ring.rotation.y }; });
console.log(JSON.stringify(q));
check(`within 1.6 km it stands: ${q.size.standing} of 16 columns, rings of ${q.size.rings.join(', ')} m, ${q.size.top} m to the top, ${q.tris} triangles in ${q.draws} draws`, !q.none && q.inScene && q.draws === q.meshes && q.draws <= 14 && q.tris < 40000 && q.size.standing === 4, q);
check(`the platform stands level: the ground round its rim within ${q.rim} m of its stamp, and no tree, bush or rock on it`, q.rim < 1 && q.under === 0, q);
check(`you walk up its three steps (${q.steps.join(' → ')} m) to the top at ${q.top}`, q.steps[0] < q.plats[0].y - .3 && q.steps[1] === q.plats[0].y && q.steps[2] === q.plats[1].y && q.steps[3] === q.plats[2].y, q);
check(`its ${q.sol} solids: a standing column and the pier are solid, the floor between open`, q.sol === 17 && q.colSolid && q.pier && q.floorOpen, q);
check('at 13h it sleeps: the script and the sun are dead stone', q.script === 0 && q.sun === 0, q);
// Session 1642 (the critic, 31 Oct): by day the dead strip is a bronze inlay, not a black hollow, and a glyph is drawn at one scale
// both ways (the prototype's 3.2 m a repeat made it 19 times wider in texels than tall per metre, a hatch that buzzed at night)
const strip = await page.evaluate(() => { const W = WONDERS.orrery.W, sm = W.group.getObjectByName('script:0'), P = sm.geometry.attributes.position, U = sm.geometry.attributes.uv, v = i => new THREE.Vector3().fromBufferAttribute(P, i), img = W.script.map && W.script.map.image;
  const c = W.script.color, lum = .2126 * c.r + .7152 * c.g + .0722 * c.b, across = v(0).distanceTo(v(1)), along = v(1).distanceTo(v(2)), du = Math.abs(U.getX(2) - U.getX(1));
  return { lum: +lum.toFixed(3), cut: !!img, aspect: img ? +((du * img.width / along) / (img.height / across)).toFixed(2) : null }; });
check(`by day the strip is a bronze inlay with its script cut in (lum ${strip.lum}), its glyphs square on the ring (texels ${strip.aspect}:1)`, strip.lum >= .2 && strip.cut && strip.aspect > .5 && strip.aspect < 2, strip);
const on = await page.evaluate(() => { const W = WONDERS.orrery.W, ring = W.group.getObjectByName('armillary').children[0]; forceTime(22); tickWonders(); const a = ring.rotation.y; W.tick(performance.now() / 1000 + 20, wonderAwake()); const b = ring.rotation.y;
  return { awake: wonderAwake(), script: W.script.emissiveIntensity, sun: W.sunMat.emissiveIntensity, turned: +Math.abs(b - a).toFixed(3) }; });
console.log(JSON.stringify(on));
check(`at 22h it wakes: the script burns (${on.script.toFixed(2)}), the sun (${on.sun.toFixed(2)}), the outer ring turns (${on.turned} rad in 20 s)`, on.awake && on.script > .9 && on.sun > 1.5 && on.turned > .5, on);
const od = await page.evaluate(() => { const S = WONDERS.orrery; px = S.site.x + 2500; pz = S.site.z; WONDERS._t = 0; tickWonders(); return { gone: !S.W, sol: STATIC_SOL.filter(q => q.cell === 'wonder:orrery').length, plats: ZONES.world.platforms.filter(p => p.wonder === 'orrery').length }; });
check('2.5 km off it is dropped, its solids and steps with it', od.gone && od.sol === 0 && od.plats === 0, od);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
