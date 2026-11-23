// The wonders (Session 1614; backlog L5, "Strange places", OG-106; Michael's C on #898): the Mark's Skyfall Fields on the new look.
// Its place is the seed's (a snowy field in the Mark, clear of every site, door and road), the same when asked again; it stands within
// 1.6 km in 11 draws, its stones hung over their pits with the scatter cleared under them, its two broken walls solid where they stand;
// from 20h to 5h it wakes (the stones drift, the seams burn), by day it is dead stone; and it goes when you leave. Session 1634: the
// same for Aurenne's Broken Orrery on its headland. Session 1666: the Gatelands' Drowned Ring in its lough.
// Session 2385: the Weavers' ring of broken arches on a Gatelands headland. Session 2409: the Northlight Altar on a Markish fell.
// Session 2410: the herbs laid before a wonder's stamp are set on its ground, or taken away from its solids and water.
// Session 2419: the Drowned Spires off a Gatelands strand, walked from the strand through every tower.
// Session 2450: the veins laid before the Spires' stamp are set on its ground, or taken away from its solids, decks and water.
// Session 2468: the Scarred Gate on Aurenne's dunes, walked up its plinth and through the ring.
// Session 2487: the Gate Isles off a Gatelands shore, climbed from the water to each ring's sill; a ship stops off their rock.
// Session 2491: the Forgotten Aqueducts cut into a Gatelands hill, walked down the flight to the scree; the hole sealed to the bed's walker.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const s = await page.evaluate(() => { const a = wonderSkyfallSite(); WONDERS.skyfall.site = undefined; const t0 = performance.now(), b = wonderSkyfallSite(), ms = Math.round(performance.now() - t0);
  const sites = [...CELLS.values()].flatMap(c => c.sites), near = sites.reduce((m, t) => Math.min(m, Math.hypot(t.x - b.x, t.z - b.z) - (t.pad || 0)), 1e9);
  const [i, j] = cellOf(b.x, b.z); return { ...b, ms, same: JSON.stringify(a) === JSON.stringify(b), nation: nationKeyOf(i, j), snow: b.h - snowLineAt(b.x, b.z), near: Math.round(near) }; });
console.log(JSON.stringify(s));
check(`the Skyfall Fields' place is in the Mark, over the snow line (${s.snow.toFixed(1)} m), the same asked twice`, s.nation === 'mark' && s.snow > 22 && s.same, s);
// Session 2571: the Fields moved off their fell to the Frostborn Vault (#1892 A); their next-best place falls more (the rule loosens 5 m at a time to 50 m
// when nothing passes at 30; on seed 1 39 m), and it keeps clear of the vault and 1.2 km off the Northlight Altar.
check(`its field falls ${s.fall} m over 300 by 130 m, and it stands ${s.near} m past the nearest site's pad`, s.fall <= 50 && s.near >= 260, s);
const at = await page.evaluate((s) => { const [x, z] = wonderToWorld(s, 6, -170); return { x, z }; }, s);
// Session 2564: each jump waits up to 180 s for its fade to lift there, as the Spires' always did (FLAKY on auto/look-2526, 45034030499:
// the first jump, at 60 s, while the first world frames still compile on CI). The condition is unchanged.
await page.evaluate(({ x, z }) => goToZone('world', x, z, 0, 'x'), at);
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [at.x, at.z], { timeout: 180000 });
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
// Session 1646 (the critic, 31 Oct): the walls' seams are the pale lilac the prototype's page shows, not the raw magenta of its numbers
// read through the game's linear output (green over .5, where the kit's violet is .30)
const ws = await page.evaluate(() => { const m = WONDERS.skyfall.W.group.getObjectByName('w:seam'), e = m && m.userData.on && m.userData.on.emissive; return e ? { r: +e.r.toFixed(2), g: +e.g.toFixed(2), b: +e.b.toFixed(2) } : null; }).catch(() => null);
check(`the walls' seams burn pale lilac (${ws && [ws.r, ws.g, ws.b].join(', ')}), not magenta`, ws && ws.g > .5 && ws.b > .9, ws);
// Session 1647 (OG-106; the critic, 31 Oct): the aurora over the Fields, one mesh, seen only while they wake
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
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [oat.x, oat.z], { timeout: 180000 });
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
// Session 1666: the Gatelands' Drowned Ring in a routed lake. The place is the seed's (a lake of the Gatelands whose heart is open water,
// clear of every site, door and road); a stamp sinks its bed to 9 m under the ring; the seven standing piers are solid, the heart open;
// the boardwalk from the nearest shore is a deck you walk; the script and the sigil burn from 20h to 5h; it goes when you leave.
const l = await page.evaluate(() => { const a = wonderLoughSite(); WONDERS.lough.site = undefined; const t0 = performance.now(), b = wonderLoughSite(), ms = Math.round(performance.now() - t0);
  if (!b) return { none: true }; const sites = [...CELLS.values()].flatMap(c => c.sites), near = sites.reduce((m, t) => Math.min(m, Math.hypot(t.x - b.x, t.z - b.z) - (t.pad || 0)), 1e9);
  const [i, j] = cellOf(b.x, b.z), lk = RV.lakes.find(q => q.id === b.lake); return { ...b, ms, same: JSON.stringify(a) === JSON.stringify(b), nation: nationKeyOf(i, j), near: Math.round(near), routed: !!(lk && lk.routed), heart: +rawH(b.x, b.z).toFixed(2) }; });
console.log(JSON.stringify(l));
check(`the Drowned Ring's lough is ${l.name}, a routed lake of the Gatelands about ${l.r * 2} m across, the same asked twice (${l.ms} ms)`, !l.none && l.nation === 'gatelands' && l.routed && l.same && l.heart < -3, l);
check(`it stands ${l.near} m past the nearest site's pad, its boardwalk ${l.shore} m from the heart to the shore`, l.near >= 150 && l.shore <= 320, l);
const lat = await page.evaluate((s) => { const [x, z] = wonderToWorld(s, 0, s.shore + 10); return { x, z }; }, l);
await page.evaluate(({ x, z }) => goToZone('world', x, z, 0, 'x'), lat);
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [lat.x, lat.z], { timeout: 180000 });
await g.cells(); await g.hide();
const lw = await page.evaluate(() => { forceTime(13); WONDERS._t = 0; tickWonders(); const S = WONDERS.lough, W = S.W, st = S.site; if (!W) return { none: true };
  let meshes = 0; W.group.traverse(o => { if (o.isMesh) meshes++; });
  const p0 = W.piers.find(p => !p.fallen), [qx, qz] = wonderToWorld(st, p0.x, p0.z), mid = (W.walk.z0 + W.walk.z1) / 2, [wx, wz] = wonderToWorld(st, 0, mid), [ox, oz] = wonderToWorld(st, 4, mid);
  const glow = W.group.getObjectByName('script'), sigil = W.group.getObjectByName('sigil');
  return { tris: W.tris, draws: W.draws, meshes, size: W.size, standing: W.piers.filter(p => !p.fallen).length, bed: +meshH(st.x, st.z).toFixed(2), sol: S.sol.length, pier: solidAt(qx, qz), heartOpen: !solidAt(st.x, st.z),
    deck: +activeTerrainH(wx, wz).toFixed(2), beside: +activeTerrainH(ox, oz).toFixed(2), walkY: W.walk.y, dead: glow.material !== glow.userData.on, sigilOff: !sigil.visible, inScene: W.group.parent === sc,
    herbs: ZONES.world.herbs.filter(h => Math.hypot(h.x - st.x, h.z - st.z) < 58).map(h => solidAt(h.x, h.z) ? 99 : +Math.abs(h.g.position.y - worldH(h.x, h.z)).toFixed(2)),
    herbAt: ZONES.world.herbs.filter(h => Math.hypot(h.x - st.x, h.z - st.z) < 58).map(h => [h.id, h.type, +h.g.position.y.toFixed(2), +worldH(h.x, h.z).toFixed(2)]) }; });
console.log(JSON.stringify(lw));
check(`within 1.6 km it stands: ${lw.standing} piers ${lw.size && lw.size.high} m over the water and one fallen, ${lw.tris} triangles in ${lw.draws} draws`, !lw.none && lw.inScene && lw.standing === 7 && lw.draws === lw.meshes && lw.draws <= 11 && lw.tris < 20000, lw);
check(`its bed lies ${lw.bed} m under the heart (a 9 m lough), the dais's top 2.4 m under the water`, lw.bed <= -8.5 && lw.size.under === 2.4, lw);
check(`its ${lw.sol} solids: a standing pier is solid, the heart open`, lw.sol === 7 && lw.pier && lw.heartOpen, lw);
check(`its ${lw.herbs.length} herbs stand on the ground, none hung over the sunk bed (worst ${Math.max(0, ...lw.herbs)} m off)`, lw.herbs.every(d => d < .3), lw.herbAt);
check(`the boardwalk is a deck at ${lw.deck} m over the water, the lough 4 m beside it ${lw.beside} m`, Math.abs(lw.deck - lw.walkY) < .01 && lw.beside < 0, lw);
check('at 13h it sleeps: the script is dead stone, the sigil only the dais', lw.dead && lw.sigilOff, lw);
const ln = await page.evaluate(() => { const W = WONDERS.lough.W; forceTime(22); tickWonders(); W.tick(performance.now() / 1000, wonderAwake()); const glow = W.group.getObjectByName('script'), sigil = W.group.getObjectByName('sigil');
  return { awake: wonderAwake(), lit: glow.material === glow.userData.on && glow.material.emissiveIntensity > .5, sigil: sigil.visible && sigil.material.emissiveIntensity > 1, blue: +sigil.material.emissive.g.toFixed(2) }; });
check(`at 22h it wakes: the script and the sigil under the water burn Uisce's blue (green ${ln.blue})`, ln.awake && ln.lit && ln.sigil && ln.blue > .8, ln);
const ld = await page.evaluate(() => { const S = WONDERS.lough; px = S.site.x + 2500; pz = S.site.z; WONDERS._t = 0; tickWonders(); return { gone: !S.W, sol: STATIC_SOL.filter(q => q.cell === 'wonder:lough').length, plats: ZONES.world.platforms.filter(p => p.wonder === 'lough').length }; });
check('2.5 km off it is dropped, its solids and its boardwalk with it', ld.gone && ld.sol === 0 && ld.plats === 0, ld);
// Session 2385: the Weavers' ring of broken arches (OG-104; Michael's B on #429) on a headland of the Gatelands. The place is the seed's,
// clear of every site, door and road; its crown is levelled under the ring; four arches stand 60 m and seven are broken; the standing jambs
// are solid and the bays between open; the dais's three steps are walked; it goes when you leave.
const rs = await page.evaluate(() => { const a = wonderRingSite(); WONDERS.ring.site = undefined; const t0 = performance.now(), b = wonderRingSite(), ms = Math.round(performance.now() - t0);
  if (!b) return { none: true }; const sites = [...CELLS.values()].flatMap(c => c.sites), near = sites.reduce((m, t) => Math.min(m, Math.hypot(t.x - b.x, t.z - b.z) - (t.pad || 0)), 1e9);
  const [i, j] = cellOf(b.x, b.z), [sx, sz] = [b.x - Math.sin(b.ry) * b.dmin, b.z - Math.cos(b.ry) * b.dmin];
  return { ...b, ms, same: JSON.stringify(a) === JSON.stringify(b), nation: nationKeyOf(i, j), near: Math.round(near), seaAhead: rawH(sx, sz) < 0 }; });
console.log(JSON.stringify(rs));
check(`the Weavers' ring stands on a Gatelands headland ${rs.h} m over the sea, the sea on ${rs.seaN} of 16 headings and ${rs.dmin} m off its gone bay, the same asked twice (${rs.ms} ms)`, !rs.none && rs.nation === 'gatelands' && rs.h >= 12 && rs.same && rs.seaAhead, rs);
check(`its crown falls ${rs.fall} m before the stamp, it stands ${rs.near} m past the nearest site's pad, nothing within 220 m more than 3 m over it (${rs.above})`, rs.fall <= 14 && rs.near >= 330 && rs.above <= 3, rs);
const rat = await page.evaluate((s) => { const [x, z] = wonderToWorld(s, 0, 150); return { x, z }; }, rs);
await page.evaluate(({ x, z }) => goToZone('world', x, z, 0, 'x'), rat);
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [rat.x, rat.z], { timeout: 180000 });
await g.cells(); await g.hide();
const rw = await page.evaluate(() => { forceTime(13); WONDERS._t = 0; tickWonders(); const S = WONDERS.ring, W = S.W, st = S.site; if (!W) return { none: true };
  let meshes = 0; W.group.traverse(o => { if (o.isMesh) meshes++; });
  const q0 = S.stamps[0]; let rim = 0; for (let k = 0; k < 24; k++) rim = Math.max(rim, Math.abs(meshH(st.x + Math.sin(k * .26) * 85, st.z + Math.cos(k * .26) * 85) - q0.y));
  const at = d => { const [x, z] = wonderToWorld(st, 0, d); return +activeTerrainH(x, z).toFixed(2); };
  const b = W.bays.find(b => b.cond === 'cracked'), [jx, jz] = wonderToWorld(st, b.jambs[1].x, b.jambs[1].z), [mx, mz] = wonderToWorld(st, b.x, b.z);
  return { tris: W.tris, draws: W.draws, meshes, rim: +rim.toFixed(2), steps: [at(30), at(14), at(10), at(3)], plats: W.dais.steps.map(p => p.y), sol: S.sol.length, jamb: solidAt(jx, jz), bayOpen: !solidAt(mx, mz), heartOpen: !solidAt(st.x, st.z),
    standing: W.bays.filter(b => b.cond === 'cracked').map(b => b.top), broken: W.bays.filter(b => b.cond === 'broken').length, inScene: W.group.parent === sc,
    herbs: ZONES.world.herbs.filter(h => Math.hypot(h.x - st.x, h.z - st.z) < 128).map(h => solidAt(h.x, h.z) ? 99 : +Math.abs(h.g.position.y - worldH(h.x, h.z)).toFixed(2)) }; });
console.log(JSON.stringify(rw));
check(`within 1.6 km it stands: ${rw.standing && rw.standing.length} arches ${rw.standing && rw.standing.join(', ')} m high and ${rw.broken} broken, ${rw.tris} triangles in ${rw.draws} draws`, !rw.none && rw.inScene && rw.standing.length === 4 && rw.standing.every(h => h > 55) && rw.broken === 7 && rw.draws === rw.meshes && rw.draws <= 8 && rw.tris < 20000, rw);
check(`the crown is level under the ring (the ground on its circle within ${rw.rim} m of the stamp)`, rw.rim < .5, rw);
check(`you walk up the dais's three steps (${rw.steps.join(' → ')} m)`, rw.steps[0] < rw.plats[0] - .3 && rw.steps[1] === rw.plats[0] && rw.steps[2] === rw.plats[1] && rw.steps[3] === rw.plats[2], rw);
check(`its ${rw.sol} solids: a standing jamb is solid, the bay between and the heart open`, rw.sol === 96 && rw.jamb && rw.bayOpen && rw.heartOpen, rw);
check(`its ${rw.herbs.length} herbs stand on the levelled ground, none in a jamb (worst ${Math.max(0, ...rw.herbs)} m off)`, rw.herbs.every(d => d < .3), rw.herbs);
const rd = await page.evaluate(() => { const S = WONDERS.ring; px = S.site.x + 2500; pz = S.site.z; WONDERS._t = 0; tickWonders(); return { gone: !S.W, sol: STATIC_SOL.filter(q => q.cell === 'wonder:ring').length, plats: ZONES.world.platforms.filter(p => p.wonder === 'ring').length }; });
check('2.5 km off it is dropped, its solids and steps with it', rd.gone && rd.sol === 0 && rd.plats === 0, rd);
// Session 2409: the Northlight Altar (OG-104; Michael's A on #1746, dead as built) on a high fell of the Mark. The place is the seed's,
// over the snow line and clear of every site, door, road and the Fields; its gap opens on falling land within 45° of the north; the
// prototype's eleven stones (two of 42 m by the gap, six standing, two fallen, one snapped), nothing lit; the stones solid, the gap open;
// the dais's two steps walked, the altar solid; the aurora beyond the gap only by night; it goes when you leave.
const ns = await page.evaluate(() => { const a = wonderNorthSite(); WONDERS.northlight.site = undefined; const t0 = performance.now(), b = wonderNorthSite(), ms = Math.round(performance.now() - t0);
  if (!b) return { none: true }; const sites = [...CELLS.values()].flatMap(c => c.sites), near = sites.reduce((m, t) => Math.min(m, Math.hypot(t.x - b.x, t.z - b.z) - (t.pad || 0)), 1e9), f = wonderSkyfallSite();
  return { ...b, ms, same: JSON.stringify(a) === JSON.stringify(b), nation: nationKeyOf(...cellOf(b.x, b.z)), near: Math.round(near), fields: Math.round(Math.hypot(f.x - b.x, f.z - b.z)) }; });
console.log(JSON.stringify(ns));
check(`the Northlight Altar stands on a Markish fell ${ns.over} m over the snow line, the same asked twice (${ns.ms} ms)`, !ns.none && ns.nation === 'mark' && ns.over >= 22 && ns.same, ns);
check(`its ground falls ${ns.fall} m under the stones, it stands ${ns.near} m past the nearest pad and ${ns.fields} m from the Fields; beyond its gap (${(ns.ry * 180 / Math.PI).toFixed(0)}° off the north) the land falls ${ns.north} m`, ns.fall <= 24 && ns.near >= 330 && ns.fields >= 1200 && Math.abs(ns.ry) <= Math.PI / 4 + 1e-3 && ns.north > 0, ns);
const nat = await page.evaluate((s) => { const [x, z] = wonderToWorld(s, 0, 150); return { x, z }; }, ns);
await page.evaluate(({ x, z }) => goToZone('world', x, z, 0, 'x'), nat);
// S2491: the jump from the Gatelands' ring to the Mark crosses some 18 km and loads a new country's cells; on a CI runner it passed 60 s
// twice in a row (#1851's first run, #1855's), 1.6 s here. Its wait is 180 s, as hubreturn's slow click got 400 (S2481).
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [nat.x, nat.z], { timeout: 180000 });
await g.cells(); await g.hide();
const nw = await page.evaluate(() => { forceTime(13); WONDERS._t = 0; tickWonders(); const S = WONDERS.northlight, W = S.W, st = S.site; if (!W) return { none: true };
  let meshes = 0, lit = 0; W.group.traverse(o => { if (o.isMesh) { meshes++; if (o.material.emissive && o.material.emissive.getHex() !== 0) lit++; } });
  const q0 = S.stamps[0], w2 = (x, z) => wonderToWorld(st, x, z); let rim = 0; for (let k = 0; k < 24; k++) rim = Math.max(rim, Math.abs(meshH(...w2(Math.sin(k * .26) * 64, Math.cos(k * .26) * 64)) - q0.y));
  const at = (x, z) => +activeTerrainH(...w2(x, z)).toFixed(2), sd = W.stones.find(s => s.cond === 'stand' && !s.flank);
  return { tris: W.tris, draws: W.draws, meshes, lit, rim: +rim.toFixed(2), steps: [at(0, 10), at(0, 7), at(0, 4.5)], plats: W.dais.steps.map(p => p.y), sol: S.sol.length,
    stone: solidAt(...w2(sd.x, sd.z)), fallen: W.stones.filter(s => s.cond === 'fallen').every(s => solidAt(...w2(s.x * .75, s.z * .75))), gapOpen: !solidAt(...w2(0, -60)), altar: solidAt(st.x, st.z),
    flank: W.stones.filter(s => s.flank).map(s => s.h), standing: W.stones.filter(s => s.cond === 'stand' && !s.flank).map(s => s.h), conds: W.stones.map(s => s.cond[0]).join(''),
    sunk: W.stones.filter(s => s.cond !== 'fallen').every(s => s.low < -2.5), aurora: W.aurora.visible, inScene: W.group.parent === sc,
    herbs: ZONES.world.herbs.filter(h => Math.hypot(h.x - st.x, h.z - st.z) < 96).map(h => solidAt(h.x, h.z) ? 99 : +Math.abs(h.g.position.y - worldH(h.x, h.z)).toFixed(2)),
    herbAt: ZONES.world.herbs.filter(h => Math.hypot(h.x - st.x, h.z - st.z) < 96).map(h => [h.id, h.type, +h.g.position.y.toFixed(2), +worldH(h.x, h.z).toFixed(2), Math.round(Math.hypot(h.x - st.x, h.z - st.z)), !!h.inst]) }; });
console.log(JSON.stringify(nw));
check(`within 1.6 km it stands: two stones of ${nw.flank && nw.flank.join(' and ')} m by the gap, ${nw.standing && nw.standing.length} more of ${nw.standing && Math.min(...nw.standing)} to ${nw.standing && Math.max(...nw.standing)} m, two fallen and one snapped (${nw.conds}), every standing foot sunk; ${nw.tris} triangles in ${nw.draws} draws, nothing lit`, !nw.none && nw.inScene && nw.flank.every(h => h === 42) && nw.standing.length === 6 && nw.standing.every(h => h >= 30 && h <= 39) && nw.conds.split('f').length === 3 && nw.conds.split('s').length === 10 && nw.sunk && nw.draws === nw.meshes && nw.draws <= 7 && nw.tris < 8000 && nw.lit === 0, nw);
check(`the crown is level under the stones (the ground on their circle within ${nw.rim} m of the stamp)`, nw.rim < .5, nw);
check(`you walk up the dais's two steps (${nw.steps.join(' → ')} m) and the altar on it is solid`, nw.steps[0] < nw.plats[0] - .3 && nw.steps[1] === nw.plats[0] && nw.steps[2] === nw.plats[1] && nw.altar, nw);
check(`its ${nw.sol} solids: a standing stone and both fallen ones are solid, the gap open; by day no aurora`, nw.sol === 13 && nw.stone && nw.fallen && nw.gapOpen && !nw.aurora, nw);
check(`its ${nw.herbs.length} herbs stand on the cut terrace, none in a stone (worst ${Math.max(0, ...nw.herbs)} m off)`, nw.herbs.every(d => d < .3), nw.herbAt);
const nn = await page.evaluate(() => { forceTime(23); WONDERS._t = 0; tickWonders(); const W = WONDERS.northlight.W, st = WONDERS.northlight.site, b = new THREE.Box3().setFromObject(W.aurora); const c = b.getCenter(new THREE.Vector3());
  const dx = c.x - st.x, dz = c.z - st.z, gx = -Math.sin(st.ry), gz = -Math.cos(st.ry); return { aurora: W.aurora.visible, out: Math.round(dx * gx + dz * gz), lit: W.group.children.filter(m => m.isMesh && m.material.emissive && m.material.emissive.getHex() !== 0).length }; });
check(`at 23h the aurora is up ${nn.out} m out beyond the gap, and still nothing of the ring's is lit`, nn.aurora && nn.out > 300 && nn.lit === 0, nn);
const nd = await page.evaluate(() => { const S = WONDERS.northlight; px = S.site.x + 2500; pz = S.site.z; WONDERS._t = 0; tickWonders(); return { gone: !S.W, sol: STATIC_SOL.filter(q => q.cell === 'wonder:northlight').length, plats: ZONES.world.platforms.filter(p => p.wonder === 'northlight').length }; });
check('2.5 km off it is dropped, its solids and steps with it', nd.gone && nd.sol === 0 && nd.plats === 0, nd);
// Session 2419: the Drowned Spires (OG-104; Michael's B on #1737, always walked) off a Gatelands strand. The place is the seed's, clear of
// every site, door, road and the two Gatelands wonders; the chain runs out into the sea with open water ahead; four towers stand with their
// spires and two are broken, one span is broken; you walk from the strand up the spit and out along the decks through every tower's
// passage, the broken span's gap is open water; a passage's sides, the parapets and the stone under the decks are solid to a swimmer; it
// goes when you leave.
const ps = await page.evaluate(() => { const a = wonderSpiresSite(); WONDERS.spires.site = undefined; const t0 = performance.now(), b = wonderSpiresSite(), ms = Math.round(performance.now() - t0);
  if (!b) return { none: true }; const sites = [...CELLS.values()].flatMap(c => c.sites), near = sites.reduce((m, t) => Math.min(m, Math.hypot(t.x - b.x, t.z - b.z) - (t.pad || 0)), 1e9), r = wonderRingSite();
  return { ...b, ms, same: JSON.stringify(a) === JSON.stringify(b), nation: nationKeyOf(...cellOf(b.x, b.z)), near: Math.round(near), ring: Math.round(Math.hypot(r.x - b.x, r.z - b.z)) }; });
console.log(JSON.stringify(ps));
check(`the Drowned Spires stride off a Gatelands strand (the first tower ${ps.y} m at the water's edge), the same asked twice (${ps.ms} ms)`, !ps.none && ps.nation === 'gatelands' && Math.abs(ps.y) <= 3 && ps.same, ps);
check(`the last tower stands in ${-ps.last} m of water, open sea on ${ps.open} of 7 marks ahead, the spit ${ps.spit} m; ${ps.near} m past the nearest pad, ${ps.ring} m from the ring`, ps.last < -1 && ps.open >= 5 && ps.spit <= 150 && ps.near >= 330 && ps.ring >= 1200, ps);
const pat = await page.evaluate((s) => { const [x, z] = wonderToWorld(s, 30, 60); return { x, z }; }, ps);
await page.evaluate(({ x, z }) => goToZone('world', x, z, 0, 'x'), pat);
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [pat.x, pat.z], { timeout: 180000 });
await g.cells(); await g.hide();
const pw = await page.evaluate(() => { forceTime(13); WONDERS._t = 0; tickWonders(); const S = WONDERS.spires, W = S.W, st = S.site; if (!W) return { none: true };
  let meshes = 0, lit = 0; W.group.traverse(o => { if (o.isMesh) { meshes++; if (o.material.emissive && o.material.emissive.getHex() !== 0) lit++; } });
  const P = (lx, lz) => wonderToWorld(st, lx, lz), y = (lx, lz) => +activeTerrainH(...P(lx, lz)).toFixed(2), so = (lx, lz, yy) => solidAt(...P(lx, lz), yy), T = W.towers, D = W.deck, gap = W.spans.find(s => s.cond === 'broken');
  // the centre line from 40 m up the strand out through every tower, ten steps a leg: the height you walk at, and whether a step there is blocked
  const walk = [], way = [[0, 40], ...T.map(t => [t.x, t.z])]; for (let i = 0; i < way.length - 1; i++) { const [x0, z0] = way[i], [x1, z1] = way[i + 1]; for (let k = 0; k < 10; k++) { const lx = x0 + (x1 - x0) * k / 10, lz = z0 + (z1 - z0) * k / 10, h = y(lx, lz);
    const inGap = i - 1 === gap.i && k >= 5 + gap.x1 / 5 + 1 && k <= 8; /* the leg runs tower to tower, 50 m: the span from 5 to 45 m, the far tower's face at k 9 */ walk.push({ i, k, h, block: so(lx, lz, h), inGap }); } }
  const deckOff = walk.filter(q => q.i > 0 && !q.inGap && (q.block || Math.abs(q.h - D) > .05)), strand = walk.filter(q => q.i === 0 && q.block), gapW = walk.filter(q => q.inGap);
  const t2 = T[2], sx = 3.75 * Math.cos(t2.ry), sz = -3.75 * Math.sin(t2.ry), s1 = W.spans[1], vx = Math.sin(s1.ry), vz = Math.cos(s1.ry);
  let inWay = 0; for (const m of W.group.children) { const Q = m.geometry.attributes.position; for (let n = 0; n < Q.count; n++) { const x = Q.getX(n), yy = Q.getY(n), z = Q.getZ(n); if (yy < D + .3 || yy > D + 6) continue;
    for (let j = 0; j < 5; j++) { const t = T[j], u = T[j + 1], L = Math.hypot(u.x - t.x, u.z - t.z), ux = (u.x - t.x) / L, uz = (u.z - t.z) / L, al = (x - t.x) * ux + (z - t.z) * uz, ac = (x - t.x) * uz - (z - t.z) * ux; if (Math.abs(ac) < 3.8 && al > 5.3 && al < L - 5.3) inWay++; } } } /* along each span's own line, between the towers' faces */
  return { inWay, tris: W.tris, draws: W.draws, meshes, lit, inScene: W.group.parent === sc, sol: S.sol.length, plats: S.plats.length, standing: T.filter(t => t.cond === 'cracked').map(t => Math.round(t.top - st.y)), broken: T.filter(t => t.cond === 'broken').map(t => Math.round(t.top - D)),
    spans: W.spans.map(s => s.cond[0]).join(''), steps: walk.length, deckOff: deckOff.slice(0, 6), strand: strand.slice(0, 4), gapW: gapW.map(q => q.h), sill: y(0, 5.5), D,
    side: so(t2.x + sx, t2.z + sz, D), swimTower: so(t2.x, t2.z, 0), swimSpan: so(s1.x, s1.z, 0), parapet: so(s1.x + vx * 4.5, s1.z + vz * 4.5, D),
    cut: Object.fromEntries(['cut', 'cutRing', 'dead'].map(n => { const m = W.group.getObjectByName('spires:' + n); return [n, m ? { tris: m.geometry.attributes.position.count / 3, alpha: !!m.material.alphaMap && m.material.alphaTest > 0, shadow: m.castShadow } : null]; })), names: W.group.children.map(m => m.name) }; });
console.log(JSON.stringify(pw));
check(`within 1.6 km it stands: ${pw.standing && pw.standing.length} towers ${pw.standing && pw.standing.join(', ')} m high with their spires, two broken to ${pw.broken && pw.broken.join(' and ')} m over the decks, spans ${pw.spans}; ${pw.tris} triangles in ${pw.draws} draws, nothing lit`, !pw.none && pw.inScene && pw.standing.length === 4 && pw.standing.every(h => h > 90) && pw.broken.length === 2 && pw.spans === 'cccbc' && pw.draws === pw.meshes && pw.draws <= 8 && pw.tris < 12000 && pw.lit === 0, pw);
check(`walked from the strand up the spit (the sill ${pw.sill} m) and out along the decks through all six towers at ${pw.D} m: ${pw.steps} steps, ${pw.deckOff && pw.deckOff.length} off the deck or blocked, ${pw.strand && pw.strand.length} blocked on the strand`, pw.deckOff.length === 0 && pw.strand.length === 0 && Math.abs(pw.sill - pw.D) < .3, pw);
check(`no stone stands in the decks' clear way between the parapets (${pw.inWay} points)`, pw.inWay === 0, pw.inWay);
/* Session 2425: the dead script and the ring sigil were one near-black plate each (a 6.5 m black square on every tower by day); they are cut into the stone, only the strokes drawn */
check(`the dead script and sigil are cut into the stone, not dark plates: ${pw.cut && pw.cut.cut && pw.cut.cut.tris} script and ${pw.cut && pw.cut.cutRing && pw.cut.cutRing.tris} sigil triangles drawn as strokes, no dead plate`, pw.cut && !pw.cut.dead && pw.cut.cut && pw.cut.cut.alpha && !pw.cut.cut.shadow && pw.cut.cutRing && pw.cut.cutRing.alpha && pw.cut.cutRing.tris >= 8, pw.cut);
check(`the broken span's gap is open water (${pw.gapW && pw.gapW.length} steps at ${pw.gapW && Math.max(...pw.gapW)} m)`, pw.gapW.length >= 2 && pw.gapW.every(h => h < pw.D - 3), pw.gapW);
check(`its ${pw.sol} solids: a passage's side and a parapet block you on the deck; the stone under a tower and a deck blocks a swimmer`, pw.side && pw.parapet && pw.swimTower && pw.swimSpan, pw);
// Session 2450 (the critic, 20 Nov): a vein the chunk laid before the stamp lay 2.4 m under the first tower's sill, its prompt still offered,
// and another hung 2 m over the spit. Every live vein within the Spires' reach sits on the ground (0.12 m into it), and none under a deck.
const pv = await page.evaluate(() => { const S = WONDERS.spires, st = S.site, R = S.herbR, near = v => Math.hypot(v.x - st.x, v.z - st.z) < R;
  const live = VEINS.filter(v => veinLive(v) && near(v)).map(v => ({ id: v.id, off: +Math.abs(v.g.position.y - (worldH(v.x, v.z) - .12)).toFixed(2), over: +(activeTerrainH(v.x, v.z) - worldH(v.x, v.z)).toFixed(2), solid: solidAt(v.x, v.z) }));
  const near0 = veinNear(), prompt = near0 && Math.hypot(near0.x - st.x, near0.z - st.z) < R ? near0.id : null;
  return { live, R, prompt }; });
check(`its ${pv.live.length} veins within ${pv.R} m sit on the ground, none in a solid or under a deck (worst ${Math.max(0, ...pv.live.map(v => v.off))} m off)`, pv.live.every(v => v.off < .05 && v.over < .5 && !v.solid), pv);
// Session 2421: a hull meets the towers. Your ship is laid 70 m out to sea beyond the last tower, on the chain's line, and sailed full
// ahead at it for 30 s of fixed ticks: she stops with her bow off the stone, in deep water (the stone stops her, not the shallows).
const sh = await page.evaluate(() => { const S = WONDERS.spires, W = S.W, st = S.site, T = W.towers, a = T[4], b = T[5];
  const [ax, az] = wonderToWorld(st, a.x, a.z), [bx, bz] = wonderToWorld(st, b.x, b.z), L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
  const keep = worldState.ship; worldState.ship = { cls: 'sloop', name: 'Test Helm', sails: 0, cargo: 0 }; WORLD.spawnShip(bx + ux * 70, bz + uz * 70, Math.atan2(ux, uz));
  const clearAtStart = !hullStoneAhead(SHIP.x, SHIP.z, SHIP.yaw, 1, SHIP.L, SHIP.W); SHIP.sailing = true; HELD_KEYS.KeyW = true;
  let closest = 1e9, top = 0; for (let k = 0; k < 1800; k++) { tickShip(1 / 60); closest = Math.min(closest, Math.hypot(SHIP.x - bx, SHIP.z - bz)); top = Math.max(top, Math.abs(SHIP.speed)); }
  HELD_KEYS.KeyW = false; const fx = -Math.sin(SHIP.yaw), fz = -Math.cos(SHIP.yaw), bow = { x: SHIP.x + fx * (SHIP.L / 2 + 2), z: SHIP.z + fz * (SHIP.L / 2 + 2) };
  const r = { clearAtStart, closest: +closest.toFixed(1), top: +top.toFixed(1), speed: +SHIP.speed.toFixed(2), L: SHIP.L, bed: +(worldH(bow.x, bow.z) - SEA_Y).toFixed(1), bowIn: STATIC_SOL.some(q => q.cell === 'wonder:spires' && solBoxHit(q, bow.x, bow.z, 0)) };
  SHIP.sailing = false; sc.remove(SHIP.mesh); SHIP.mesh = null; worldState.ship = keep; return r; });
console.log(JSON.stringify(sh));
check(`a ship sailed full ahead (${sh.top} m/s) at the last tower stops ${sh.closest} m from its middle, her bow outside the stone, in ${-sh.bed} m of water`, sh.clearAtStart && sh.top > 2 && sh.closest >= 5 + sh.L / 2 && Math.abs(sh.speed) < .5 && !sh.bowIn && sh.bed < -1.4, sh);
const pd = await page.evaluate(() => { const S = WONDERS.spires; px = S.site.x + 2500; pz = S.site.z; WONDERS._t = 0; tickWonders(); return { gone: !S.W, sol: STATIC_SOL.filter(q => q.cell === 'wonder:spires').length, plats: ZONES.world.platforms.filter(p => p.wonder === 'spires').length }; });
check('2.5 km off it is dropped, its solids and decks with it', pd.gone && pd.sol === 0 && pd.plats === 0, pd);
// Session 2468: the Scarred Gate (OG-104; Michael's A on #1754, spent as built) on Aurenne's dunes. The place is the seed's, on the dunes,
// the wastes or the burned waste, clear of every site, door, road and the Orrery; the prototype's ring (17 outer stones gone and thrown, the
// inner course slipped over the blast), nothing lit; the crater sunk before its right foot, the plinth's slabs gone or tipped there; you
// walk up the plinth's two steps and through the ring over its sill, the foot either side solid; it goes when you leave.
const gs = await page.evaluate(() => { const a = wonderScarredSite(); WONDERS.scarred.site = undefined; const t0 = performance.now(), b = wonderScarredSite(), ms = Math.round(performance.now() - t0);
  if (!b) return { none: true }; const sites = [...CELLS.values()].flatMap(c => c.sites), near = sites.reduce((m, t) => Math.min(m, Math.hypot(t.x - b.x, t.z - b.z) - (t.pad || 0)), 1e9), o = wonderOrrerySite();
  return { ...b, ms, same: JSON.stringify(a) === JSON.stringify(b), nation: nationKeyOf(...cellOf(b.x, b.z)), near: Math.round(near), orrery: Math.round(Math.hypot(o.x - b.x, o.z - b.z)) }; });
console.log(JSON.stringify(gs));
check(`the Scarred Gate stands on Aurenne's ${gs.biome}, ${gs.h} m up, the same asked twice (${gs.ms} ms)`, !gs.none && gs.nation === 'aurenne' && ['dunes', 'wastes', 'wasteland'].includes(gs.biome) && gs.same, gs);
check(`its ground falls ${gs.fall} m under the plinth and the ring, the scar's run within ${gs.even} m of its foot; ${gs.near} m past the nearest pad, ${gs.orrery} m from the Orrery`, gs.fall <= 6 && gs.near >= 330 && gs.orrery >= 1200, gs);
const gat = await page.evaluate((s) => { const [x, z] = wonderToWorld(s, -20, 120); return { x, z }; }, gs);
await page.evaluate(({ x, z }) => goToZone('world', x, z, 0, 'x'), gat);
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [gat.x, gat.z], { timeout: 180000 });
await g.cells(); await g.hide();
const gw = await page.evaluate(() => { forceTime(13); WONDERS._t = 0; tickWonders(); const S = WONDERS.scarred, W = S.W, st = S.site; if (!W) return { none: true };
  let meshes = 0, lit = 0; W.group.traverse(o => { if (o.isMesh) { meshes++; if (o.material.emissive && o.material.emissive.getHex() !== 0) lit++; } });
  const w2 = (x, z) => wonderToWorld(st, x, z), at = (x, z) => +activeTerrainH(...w2(x, z)).toFixed(2), so = (x, z, y) => solidAt(...w2(x, z), y);
  let rim = 0; for (let k = 0; k < 24; k++) { const t = k * .26; rim = Math.max(rim, Math.abs(meshH(...w2(Math.sin(t) * 40, Math.cos(t) * 8 - 12)) - st.y)); } /* behind the ring and under it: the crater is before its right foot */
  const walk = [20, 14, 10, 6, 2, 0, -2, -6, -10, -14, -20].map(z => ({ z, y: at(0, z), block: so(0, z, at(0, z)) }));
  const herbs = ZONES.world.herbs.filter(h => Math.hypot(h.x - st.x, h.z - st.z) < S.herbR).map(h => solidAt(h.x, h.z) ? 99 : +Math.abs(h.g.position.y - worldH(h.x, h.z)).toFixed(2));
  return { tris: W.tris, draws: W.draws, meshes, lit, inScene: W.group.parent === sc, gone: W.gone, slipped: W.slipped, thrown: W.thrown.length, far: Math.round(Math.max(...W.thrown.map(t => Math.hypot(t.x, t.z)))), sunk: W.thrown.every(t => t.low < 0),
    plinth: W.plinth, rim: +rim.toFixed(2), crater: +(st.y - meshH(...w2(22, 24))).toFixed(2), walk, plats: W.plats.map(p => p.y), sol: S.sol.length,
    foot: so(-20, 0) && so(20, 0) && so(-34, 0), open: !so(0, 0), thrownSolid: W.sol.filter(b => b.thrown).every(b => so(b.x, b.z)), glass: (() => { const m = W.group.getObjectByName('scarred:glass'); return m ? { tris: m.geometry.attributes.position.count / 3, transparent: m.material.transparent } : null; })(), herbs }; });
console.log(JSON.stringify(gw));
check(`within 1.6 km it stands: ${gw.gone} of the outer course's 44 stones gone, thrown out to ${gw.far} m and each sunk where it fell; ${gw.slipped} of the inner course slipped; ${gw.tris} triangles in ${gw.draws} draws, nothing lit`, !gw.none && gw.inScene && gw.gone === 17 && gw.slipped >= 10 && gw.thrown === 17 && gw.sunk && gw.draws === gw.meshes && gw.draws <= 5 && gw.tris < 9000 && gw.lit === 0, gw);
check(`the ground is level behind and under the ring (within ${gw.rim} m of the stamp), the crater sunk ${gw.crater} m before its right foot, ${gw.plinth.lost} of the plinth's ${gw.plinth.slabs} slabs gone into it and ${gw.plinth.tipped} tipped`, gw.rim < .5 && gw.crater > 3 && gw.plinth.lost > 0 && gw.plinth.tipped > 0, gw);
const gwk = gw.walk;
check(`walked straight through the ring from the plinth's foot (a thrown stone lies on the axis 30 m out): up its steps (${gwk.map(q => q.y).join(' → ')} m) and over its sill, nothing blocking`, gwk.every(q => !q.block) && gwk[0].y < gw.plats[0] - .3 && gwk.find(q => q.z === 10).y === gw.plats[0] && gwk.find(q => q.z === 6).y === gw.plats[1] && gwk.find(q => q.z === 0).y === gw.plats[2], gwk);
check(`its ${gw.sol} solids: the ring's foot either side of the opening and every thrown stone over 0.9 m; the opening is clear; the black glass a skin of ${gw.glass && gw.glass.tris} triangles`, gw.foot && gw.open && gw.thrownSolid && gw.glass && gw.glass.transparent, gw);
check(`its ${gw.herbs.length} herbs within reach sit on the ground, none in a stone (worst ${Math.max(0, ...gw.herbs)} m off)`, gw.herbs.every(d => d < .3), gw.herbs);
const gd = await page.evaluate(() => { const S = WONDERS.scarred; px = S.site.x + 2500; pz = S.site.z; WONDERS._t = 0; tickWonders(); return { gone: !S.W, sol: STATIC_SOL.filter(q => q.cell === 'wonder:scarred').length, plats: ZONES.world.platforms.filter(p => p.wonder === 'scarred').length }; });
check('2.5 km off it is dropped, its solids and steps with it', gd.gone && gd.sol === 0 && gd.plats === 0, gd);
// Session 2487: the Gate Isles (OG-104; Michael's A on #1791, reached by boat) off a Gatelands shore. The place is the seed's: the first isle
// 250 to 600 m off a Gatelands shore, every isle in open water, clear of every pad and the other Gatelands wonders; the prototype's five
// rings (the third broken), nothing lit; on every standing isle you climb from the water up the landing, over the crown and the plinth's
// steps to the ring's sill; the cliff all round, the stacks and the ring's feet are solid, the opening is not; a ship sailed at an isle
// stops off its rock; it goes when you leave.
const is = await page.evaluate(() => { const a = wonderIslesSite(); WONDERS.isles.site = undefined; const t0 = performance.now(), b = wonderIslesSite(), ms = Math.round(performance.now() - t0);
  if (!b) return { none: true }; const O = { x: b.ox, z: b.oz, ry: b.ry }, pts = [0, -270, -580, -930, -1330].map(l => wonderToWorld(O, 0, l)), sites = [...CELLS.values()].flatMap(c => c.sites);
  const near = Math.min(...pts.map(([x, z]) => sites.reduce((m, t) => Math.min(m, Math.hypot(t.x - x, t.z - z) - (t.pad || 0)), 1e9))), ws = [wonderRingSite(), wonderLoughSite(), wonderSpiresSite()].filter(Boolean);
  const wonder = Math.min(...pts.map(([x, z]) => Math.min(...ws.map(w => Math.hypot(w.x - x, w.z - z)))));
  return { ...b, ms, same: JSON.stringify(a) === JSON.stringify(b), near: Math.round(near), wonder: Math.round(wonder) }; });
console.log(JSON.stringify(is));
check(`the Gate Isles run out from ${is.shore} m off a Gatelands shore in ${-is.y} m of water, a far coast ${is.far} m past the last, the same asked twice (${is.ms} ms)`, !is.none && is.shore >= 250 && is.shore <= 600 && is.y <= -8 && is.same, is);
check(`every isle ${is.near} m past the nearest pad and ${is.wonder} m from the nearest Gatelands wonder`, is.near >= 400 && is.wonder >= 1200, is);
const iat = await page.evaluate((s) => { const [x, z] = wonderToWorld({ x: s.ox, z: s.oz, ry: s.ry }, 30, 0); return { x, z }; }, is);
await page.evaluate(({ x, z }) => goToZone('world', x, z, 0, 'x'), iat);
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [iat.x, iat.z], { timeout: 180000 });
await g.cells(); await g.hide();
const iw = await page.evaluate(() => { forceTime(13); WONDERS._t = 0; tickWonders(); const S = WONDERS.isles, W = S.W, st = S.site; if (!W) return { none: true };
  let meshes = 0, lit = 0; W.group.traverse(o => { if (o.isMesh) { meshes++; if (o.material.emissive && o.material.emissive.getHex() !== 0) lit++; } });
  const O = { x: st.ox, z: st.oz, ry: st.ry }, P = (lx, lz) => wonderToWorld(O, lx, lz), y = (lx, lz) => +(activeTerrainH(...P(lx, lz)) - SEA_Y).toFixed(2), so = (lx, lz, yy) => solidAt(...P(lx, lz), yy == null ? null : yy + SEA_Y);
  const isles = W.isles.map(I => { const z = I.z, path = [];
    for (let x = I.stair.x1 - 1; x >= 20; x -= 1) path.push([x, z]); for (let lz = z; lz <= z + 9; lz += 1) path.push([20, lz]); for (let x = 20; x >= 0; x -= 1) path.push([x, z + 9]); for (let lz = z + 9; lz >= z + 1; lz -= .5) path.push([0, lz]);
    const walk = path.map(([a, b]) => { const h = y(a, b); return { h, blk: so(a, b, h) }; }); let rise = 0; for (let k = 1; k < walk.length; k++) rise = Math.max(rise, walk[k].h - walk[k - 1].h);
    const T = [.5, 1.5, 2.5, 3.5, 4.5, 5.5], hd = t => W.head(I.i, t);
    return { i: I.i, cond: I.cond, gone: I.gone, start: walk[0].h, sill: y(0, z), top: Math.max(...walk.map(q => q.h)), rise: +rise.toFixed(2), blocked: walk.filter(q => q.blk).length,
      cliff: T.every(t => so(Math.cos(t) * (hd(t) + 2), z + Math.sin(t) * (hd(t) + 2), 13)), swim: T.every(t => so(Math.cos(t) * (hd(t) + 7.5), z + Math.sin(t) * (hd(t) + 7.5), 0)),
      stacks: I.stacks.every(q => so(q.x, q.z, 0)), feet: so(-7, z, W.P) && so(7, z, W.P), open: !so(0, z, y(0, z)), lost: I.lost.filter(q => q.top > .9).every(q => so(q.x, q.z, y(q.x, q.z))) }; });
  const cr = Math.cos(st.ry), sr = Math.sin(st.ry), onRock = (ZONES.world.herbs || []).filter(h => { const dx = h.x - st.ox, dz = h.z - st.oz, lx = dx * cr - dz * sr, lz = dx * sr + dz * cr; return W.isles.some(I => Math.hypot(lx, lz - I.z) < W.head(I.i, Math.atan2(lz - I.z, lx)) + 36); }).map(h => h.id);
  return { tris: W.tris, draws: W.draws, meshes, lit, inScene: W.group.parent === sc, sol: S.sol.length, plats: S.plats.length, P: W.P, isles, onRock }; });
console.log(JSON.stringify(iw));
const II = iw.isles || [], up = II.filter(q => q.cond === 'stand');
check(`within 1.6 km the five stand: rings ${II.map(q => q.cond[0]).join('')}, the third's ${II[2] && II[2].gone} stones down; ${iw.tris} triangles in ${iw.draws} draws, nothing lit`, !iw.none && iw.inScene && II.map(q => q.cond[0]).join('') === 'ssbss' && II[2].gone > 0 && iw.draws === iw.meshes && iw.draws <= 6 && iw.tris < 60000 && iw.lit === 0, iw);
check(`on each standing isle you climb from the water (${up.map(q => q.start).join(', ')} m) up the landing, over the crown and the plinth to the sill at ${up.map(q => q.top).join(', ')} m, no rise over ${Math.max(...up.map(q => q.rise))} m, nothing in the way`, up.length === 4 && up.every(q => q.start < 0 && Math.abs(q.top - (iw.P + .6)) < .01 && q.sill === q.top && q.rise < 1.5 && q.blocked === 0), up);
check(`its ${iw.sol} solids: every isle's cliff all round, to the walker on the lip and the swimmer at its foot; the stacks, the rings' feet and the lost stones; the opening is clear`, II.every(q => q.cliff && q.swim && q.stacks && q.feet && q.open && q.lost), II);
check(`no herb is left on or in an isle's rock (${iw.onRock && iw.onRock.length}; a sea-bed herb stood on the first crown before)`, iw.onRock && iw.onRock.length === 0, iw.onRock);
const ish = await page.evaluate(() => { const S = WONDERS.isles, st = S.site, O = { x: st.ox, z: st.oz, ry: st.ry }, I = S.W.isles[1], [ax, az] = wonderToWorld(O, 0, I.z), [bx, bz] = wonderToWorld(O, 160, I.z), L = Math.hypot(bx - ax, bz - az), ux = (ax - bx) / L, uz = (az - bz) / L;
  const keep = worldState.ship; worldState.ship = { cls: 'sloop', name: 'Test Helm', sails: 0, cargo: 0 }; WORLD.spawnShip(bx, bz, Math.atan2(-ux, -uz));
  const clearAtStart = !hullStoneAhead(SHIP.x, SHIP.z, SHIP.yaw, 1, SHIP.L, SHIP.W); SHIP.sailing = true; HELD_KEYS.KeyW = true;
  let closest = 1e9, top = 0; for (let k = 0; k < 1800; k++) { tickShip(1 / 60); closest = Math.min(closest, Math.hypot(SHIP.x - ax, SHIP.z - az)); top = Math.max(top, Math.abs(SHIP.speed)); }
  HELD_KEYS.KeyW = false; const fx = -Math.sin(SHIP.yaw), fz = -Math.cos(SHIP.yaw), bow = { x: SHIP.x + fx * (SHIP.L / 2 + 2), z: SHIP.z + fz * (SHIP.L / 2 + 2) };
  const r = { clearAtStart, closest: +closest.toFixed(1), top: +top.toFixed(1), speed: +SHIP.speed.toFixed(2), foot: Math.round(S.W.head(1, 0) + 8), L: SHIP.L, bed: +(worldH(bow.x, bow.z) - SEA_Y).toFixed(1) };
  SHIP.sailing = false; sc.remove(SHIP.mesh); SHIP.mesh = null; worldState.ship = keep; return r; });
console.log(JSON.stringify(ish));
check(`a ship sailed full ahead (${ish.top} m/s) at the second isle's landing stops ${ish.closest} m from its heart, off the rock (its foot about ${ish.foot} m out)`, ish.clearAtStart && ish.top > 2 && ish.closest >= ish.foot && Math.abs(ish.speed) < .5, ish);
const idr_ = await page.evaluate(() => { const S = WONDERS.isles; px = S.site.x + 2500; pz = S.site.z; WONDERS._t = 0; tickWonders(); return { gone: !S.W, sol: STATIC_SOL.filter(q => q.cell === 'wonder:isles').length, plats: ZONES.world.platforms.filter(p => p.wonder === 'isles').length }; });
check('2.5 km off it is dropped, its solids and steps with it', idr_.gone && idr_.sol === 0 && idr_.plats === 0, idr_);
// Session 2491: the Forgotten Aqueducts (#1808 A) cut into a Gatelands hill: the terrain sunk under the hole and the halls, the kit's own
// land over it, the flight walked from the lip to the scree, the hole sealed to the bed's walker but at the flight's foot.
const aq = await page.evaluate(() => { const a = wonderAqueductsSite(); WONDERS.aqueducts.site = undefined; const t0 = performance.now(), b = wonderAqueductsSite(), ms = Math.round(performance.now() - t0);
  if (!b) return { none: true }; const sites = [...CELLS.values()].flatMap(c => c.sites), near = sites.reduce((m, t) => Math.min(m, Math.hypot(t.x - b.x, t.z - b.z) - (t.pad || 0)), 1e9);
  const ws = [wonderRingSite(), wonderLoughSite(), wonderSpiresSite(), wonderIslesSite()].filter(Boolean), wonder = Math.min(...ws.map(w => Math.hypot(w.x - b.x, w.z - b.z)));
  return { ...b, ms, same: JSON.stringify(a) === JSON.stringify(b), nation: nationKeyOf(...cellOf(b.x, b.z)), near: Math.round(near), wonder: Math.round(wonder) }; });
console.log(JSON.stringify(aq));
check(`the Forgotten Aqueducts' hill is the Gatelands', its lip ${aq.y} m up at its lowest (rising ${aq.fall} m round), the same asked twice (${aq.ms} ms)`, !aq.none && aq.nation === 'gatelands' && aq.y >= 76 && aq.fall <= 24 && aq.same, aq);
check(`it stands ${aq.near} m past the nearest pad and ${aq.wonder} m from the nearest Gatelands wonder`, aq.near >= 330 && aq.wonder >= 1200, aq);
const aat = await page.evaluate((s) => { const [x, z] = wonderToWorld(s, 0, 95); return { x, z }; }, aq);
await page.evaluate(({ x, z }) => goToZone('world', x, z, 0, 'x'), aat);
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [aat.x, aat.z], { timeout: 180000 });
await g.cells(); await g.hide();
const aw = await page.evaluate(() => { forceTime(13); WONDERS._t = 0; tickWonders(); const S = WONDERS.aqueducts, W = S.W, st = S.site; if (!W) return { none: true };
  let meshes = 0; W.group.traverse(o => { if (o.isMesh) meshes++; }); const L = (lx, lz) => wonderToWorld(st, lx, lz), T = (lx, lz) => activeTerrainH(...L(lx, lz)) - st.y;
  // the ground: sunk under the hole and the halls; walked on the bed in the hole and on the land as it was beside it
  S.stamp.off = true; const was = [[0, 75], [100, 0], [-150, 0], [0, -62]].map(([a, b]) => worldH(...L(a, b)) - st.y); S.stamp.off = false;
  const land = [[0, 75], [100, 0], [-150, 0], [0, -62]].map(([a, b], i) => +(T(a, b) - was[i]).toFixed(3)), sunk = [[0, 0], [100, 0], [-60, 20]].map(([a, b]) => +(worldH(...L(a, b)) - st.y).toFixed(1));
  // the far sheet: no far point in the hole or over the halls above the hall's floor
  let farUp = 0; for (const o of sc.children) { const F = o.userData && o.userData.far; if (!F) continue; const P = o.geometry.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i) + F.ox + 2400 / 2, z = P.getZ(i) + F.oz + 2400 / 2; if (S.stamp.inside(x, z) && P.getY(i) > st.y - 72) farUp++; } }
  // the kit's land over the sunk ground: on a 6 m grid over its box, the sheet (cast down onto it) stands over the drawn terrain
  const lm = W.group.getObjectByName('land'), rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0); let under = 0, cast = 0, worst = 9; const unders = [];
  for (let lx = -156; lx <= 156; lx += 6) for (let lz = -57; lz <= 57; lz += 6) { if (Math.hypot(lx, lz) < W.lip(Math.atan2(lx, lz)) + 1) continue; const [x, z] = L(lx, lz); rc.set(new THREE.Vector3(x, st.y + 400, z), dn); const h = rc.intersectObject(lm)[0]; if (!h) continue; cast++;
    const now = meshH(x, z); if (h.point.y - now >= .02) continue; S.stamp.off = true; const was = meshH(x, z); S.stamp.off = false; if (was - now < .05) continue; /* the world's own ground, untouched by the stamp, may show past the sheet's rim */
    under++; worst = Math.min(worst, h.point.y - now); if (unders.length < 5) unders.push([lx, lz, +(h.point.y - now).toFixed(2)]); }
  // the flight: tread by tread from the lip's ground to the scree, on its middle line, nothing in the way
  const path = []; let rise = 0, blocked = 0; for (let k = 0; k < W.stair.n; k++) { const a = W.treadA(k), r = W.treadR(k) - 1.5, [x, z] = L(Math.sin(a) * r, Math.cos(a) * r), y = activeTerrainH(x, z); if (solidAt(x, z, y)) blocked++; if (path.length) rise = Math.max(rise, Math.abs(y - path[path.length - 1])); path.push(y); }
  const a0 = W.stair.a0, l0 = W.lip(a0), headLand = T(Math.sin(a0) * (l0 + .5), Math.cos(a0) * (l0 + .5)), head = path[0] - st.y, foot = path[path.length - 1] - st.y;
  const scree = T(-22, 28), wade = T(-20, -15);
  // sealed: round the hole, a walker on the bed meets rock a metre inside the lip; one on the land crosses; under the flight the bed's
  // walker is stopped and the flight's is not
  let ring = 0, ringN = 0, crossN = 0; for (let k = 0; k < 72; k++) { const a = (k + .5) * Math.PI / 36; if (a < a0 + .06 || a > Math.PI * 2 + W.stair.a1 - .06) continue; ringN++; const l = W.lip(a), [x, z] = L(Math.sin(a) * (l - 1.2), Math.cos(a) * (l - 1.2)), [ox, oz] = L(Math.sin(a) * (l + 3), Math.cos(a) * (l + 3));
    if (solidAt(x, z, st.y - 60)) ring++; if (!solidAt(ox, oz, activeTerrainH(ox, oz))) crossN++; }
  const k = Math.floor(W.stair.n * .6), ua = W.treadA(k), ur = W.treadR(k) - 1.5, [ux, uz] = L(Math.sin(ua) * ur, Math.cos(ua) * ur), underBed = solidAt(ux, uz, st.y - 64), onTread = solidAt(ux, uz, activeTerrainH(ux, uz));
  const herbs = (ZONES.world.herbs || []).filter(h => Math.hypot(h.x - st.x, h.z - st.z) < 190 && activeTerrainH(h.x, h.z) > worldH(h.x, h.z) + .5).length;
  return { tris: W.tris, draws: W.draws, meshes, arches: W.arches.map(q => q.cond[0]).join(''), inScene: W.group.parent === sc, sol: S.sol.length, land, sunk, farUp, cast, under, unders, worst: +worst.toFixed(2),
    n: W.stair.n, rise: +rise.toFixed(3), blocked, head: +head.toFixed(2), headLand: +headLand.toFixed(2), foot: +foot.toFixed(2), scree: +scree.toFixed(2), wade: +wade.toFixed(2), ring, ringN, crossN, underBed, onTread, herbs }; });
console.log(JSON.stringify(aw));
check(`within 1.6 km it stands: arches ${aw.arches} (broken over the hole), ${aw.tris} triangles in ${aw.draws} draws`, !aw.none && aw.inScene && aw.arches === 'cccbbbccccccbbbccc' && aw.draws === aw.meshes && aw.draws <= 18 && aw.tris < 90000, aw);
check(`the terrain is sunk under the hole and the halls (${aw.sunk.join(', ')} m), and a walker beside it stands on the ground as it was (off by ${Math.max(...aw.land.map(Math.abs))} m); no far point stands in the hole or the halls (${aw.farUp})`, aw.sunk.every(y => y <= -74) && aw.land.every(d => Math.abs(d) < .2) && aw.farUp === 0, aw);
check(`the kit's land covers the sunk ground: of ${aw.cast} points cast down onto it, ${aw.under} where the stamp moved the terrain stand under it`, aw.cast > 400 && aw.under === 0, aw);
check(`the flight goes down ${aw.n} treads from ${aw.head} m (the land beside its head ${aw.headLand} m) to ${aw.foot} m on the scree, no rise over ${aw.rise} m, nothing in the way; the scree at ${aw.scree} m, the nave waded at ${aw.wade} m`, Math.abs(aw.head - aw.headLand) < 1 && Math.abs(aw.foot + 39.4) < .5 && aw.rise <= .42 && aw.blocked === 0 && aw.scree < -38 && aw.scree > -64 && Math.abs(aw.wade + 65.3) < .05, aw);
check(`it is sealed: rock meets the bed's walker at ${aw.ring} of ${aw.ringN} bearings a metre inside the lip, and the land's walker crosses at ${aw.crossN}; under the flight the bed's walker is stopped and the flight's is not`, aw.ring === aw.ringN && aw.crossN === aw.ringN && aw.underBed && !aw.onTread, aw);
check(`no herb or vein is left on the sunk ground (${aw.herbs})`, aw.herbs === 0, aw);
const adr = await page.evaluate(() => { const S = WONDERS.aqueducts; px = S.site.x + 2500; pz = S.site.z; WONDERS._t = 0; tickWonders(); return { gone: !S.W, sol: STATIC_SOL.filter(q => q.cell === 'wonder:aqueducts').length, plats: ZONES.world.platforms.filter(p => p.wonder === 'aqueducts').length }; });
check('2.5 km off it is dropped, its solids and its walk with it', adr.gone && adr.sol === 0 && adr.plats === 0, adr);
// Session 2431: no chunk foe on a wonder's ground (S2409: foes stood inside the Northlight Altar's ring). Every chunk whose centre lies
// within a wonder's ground + 70 m is spawned afresh at 23h (the night's density), with the rule and without it: with it none spawns.
const wf = await page.evaluate(() => { forceTime(23); const C = WORLD.CHUNK, out = {}, keep = wonderFoeClear;
  const spawn = (cx, cz) => { const ch = { cx, cz, enemies: [], group: new THREE.Group() }; delete cleared[chunkKey(cx, cz)]; spawnChunkEncounters(ch); const n = ch.enemies.length; despawnChunkEncounters(ch); delete cleared[chunkKey(cx, cz)]; return n; };
  for (const K of WONDER_KINDS) { const st = K.site(); if (!st) { out[K.k] = null; continue; } const G = wonderFoeGround(K.k, st); let on = 0, off = 0, n = 0;
    for (let cz = Math.floor((G.z - G.r - 70) / C); cz <= Math.floor((G.z + G.r + 70) / C); cz++) for (let cx = Math.floor((G.x - G.r - 70) / C); cx <= Math.floor((G.x + G.r + 70) / C); cx++) {
      if (Math.hypot(cx * C + C / 2 - G.x, cz * C + C / 2 - G.z) >= G.r + 70) continue; n++; on += spawn(cx, cz); wonderFoeClear = () => false; try { off += spawn(cx, cz); } finally { wonderFoeClear = keep; } }
    out[K.k] = { chunks: n, on, off, inRule: wonderFoeClear(G.x, G.z), out: wonderFoeClear(G.x + G.r + 200, G.z) }; }
  forceTime(13); return out; });
console.log(JSON.stringify(wf));
// S2571: eleven stand on seed 1, the Frostborn Vault on the Fields' old fell (#1892 A).
const wk = Object.entries(wf).filter(([, v]) => v), off = wk.reduce((m, [, v]) => m + v.off, 0);
check(`no chunk foe spawns on any of the ${wk.length} wonders' ground (${wk.map(([k, v]) => `${k} ${v.on} of ${v.chunks} chunks`).join(', ')}; ${off} without the rule)`, wk.length === 11 && wk.every(([, v]) => v.on === 0 && v.inRule && !v.out && v.chunks > 0), wf);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
