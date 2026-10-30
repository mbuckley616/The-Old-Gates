// The wonders (Session 1614; backlog L5, "Strange places", OG-106; Michael's C on #898): the Mark's Skyfall Fields on the new look.
// Its place is the seed's (a snowy field in the Mark, clear of every site, door and road), the same when asked again; it stands within
// 1.6 km in 11 draws, its stones hung over their pits with the scatter cleared under them, its two broken walls solid where they stand;
// from 20h to 5h it wakes (the stones drift, the seams burn), by day it is dead stone; and it goes when you leave.
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
const d = await page.evaluate(() => { const S = WONDERS.skyfall; px = S.site.x + 2500; pz = S.site.z; WONDERS._t = 0; tickWonders(); return { gone: !S.W, sol: STATIC_SOL.filter(q => q.cell === 'wonder:skyfall').length }; });
check('2.5 km off it is dropped, and its solids with it', d.gone && d.sol === 0, d);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
