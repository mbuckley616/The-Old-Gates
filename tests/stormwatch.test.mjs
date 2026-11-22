// stormwatch (Session 2526; OG-104's Stormwatch Ruins, the Gatelands; Michael's A on #1815, "empty, as built", and A on #1843, "raise a
// headland for it"): the older people's dry-stone fort in the game, the kit's PKIT.wonders.stormwatch on a Gatelands shore raised 40 m by
// one stamp of a height (the kit's stormwatchLand), the kit's cliff on its seaward side and its rim walked over the ground sunk inside the
// rock. The search, the ground raised and met, the far sheet, nothing standing in front of the face, the walk, and the drop from 2.5 km.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const s0 = await page.evaluate(() => { const S = WONDERS.stormwatch; S.site = undefined; const t0 = performance.now(), a = wonderStormSite(), ms = Math.round(performance.now() - t0); S.site = undefined; const b = wonderStormSite();
  return { ms, same: JSON.stringify(a) === JSON.stringify(b), a }; });
console.log(JSON.stringify(s0));
check(`the search over the Gatelands' shores answers the same twice and finds one on seed 1 (${s0.ms} ms: ${s0.a && s0.a.x}, ${s0.a && s0.a.z}, the shore ${s0.a && s0.a.mean} m up)`, s0.same && !!s0.a && s0.a.y === 40, s0);
const st = s0.a;
const at = await page.evaluate(s => { const [x, z] = wonderToWorld(s, 0, 60); return { x, z }; }, st);
await page.evaluate(({ x, z }) => goToZone('world', x, z, 0, 'x'), at);
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [at.x, at.z], { timeout: 90000 });
await g.cells(); await g.hide();
const w = await page.evaluate(() => { forceTime(13); WONDERS._t = 0; tickWonders(); const S = WONDERS.stormwatch, W = S.W, s = S.site, L = S.land; if (!W) return { none: true };
  const t0 = performance.now(); while (JOBS.length && performance.now() - t0 < 20000) runJobs(); for (let i = 0; i < 20; i++) WORLD.tick(1 / 60, performance.now()); WONDERS._t = 0; tickWonders();
  let meshes = 0; W.group.traverse(o => { if (o.isMesh) meshes++; }); const Wd = (lx, lz) => wonderToWorld(s, lx, lz), was = (x, z) => { S.stamp.off = true; try { return worldH(x, z); } finally { S.stamp.off = false; } };
  /* the land behind the brink raised to the prototype's (40 m at the brink, falling inland); past its shape the shore's own */
  const land = [[0, 30], [-100, 60], [100, 100]].map(([a, b]) => +(meshH(...Wd(a, b)) - SEA_Y).toFixed(1));
  let off = 0; for (const [a, b] of [[360, 60], [-345, 100], [0, 345], [200, 360], [0, -90]]) { const [x, z] = Wd(a, b); off = Math.max(off, Math.abs(worldH(x, z) - was(x, z))); }
  /* nothing of the ground stands over the sea in front of the face; no far point over the ground in the shape */
  let front = 0; for (let a = -160; a <= 160; a += 2) for (const d of [.5, 2, 4, 6, 8]) { const [x, z] = Wd(a, L.edge(a) - d); if (meshH(x, z) > SEA_Y + .1) front++; }
  let farUp = 0, farN = 0; for (const o of sc.children) { const F = o.userData && o.userData.far; if (!F) continue; const P = o.geometry.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i) + F.ox + WORLD.SIZE / 2, z = P.getZ(i) + F.oz + WORLD.SIZE / 2; if (!S.stamp.inside(x, z)) continue; farN++; if (P.getY(i) > worldH(x, z) - 2.9) farUp++; } }
  /* the walk: the rim holds you over the sunk ground; past its front you are over the sea */
  const [rx, rz] = Wd(60, L.edge(60) + 3), [ox, oz] = Wd(60, L.edge(60) - 4);
  const rim = +(activeTerrainH(rx, rz) - SEA_Y).toFixed(2), under = +(meshH(rx, rz) - SEA_Y).toFixed(1), over = +(activeTerrainH(ox, oz) - SEA_Y).toFixed(1);
  /* a terrace's platform at its top; the cashel's outer band blocks a walker on the floor; the passage is open under its lintels */
    /* a length of the inner wall's outer band (5.4 m) back from the rim, a point in it 1.2 m inside its outer face */
  const band = W.walls.inner.segs.find(q => !q.gap && q.top > 4 && q.z > L.edge(q.x) + 15), [bx2, bz2] = band ? Wd(...W.ell(26, 22, band.a, 1.2)) : [0, 0], blocks = band ? solidAt(bx2, bz2, meshH(bx2, bz2)) : false;
  const [qx, qz] = Wd(W.passage.x, W.passage.z), pass = !solidAt(qx, qz, meshH(qx, qz) + .05);
  const herbs = (ZONES.world.herbs || []).filter(h => { const [a, b] = L.toL(h.x, h.z); return L.inside(a, b) && b < L.edge(a) + L.consts.CAPW + 1; }).length;
  return { tris: W.tris, draws: W.draws, meshes, inScene: W.group.parent === sc, face: W.face, sol: S.sol.length, plats: S.plats.length, land, off: +off.toFixed(3), front, farUp, farN, rim, under, over, band: band && band.a, blocks, pass, herbs,
    walls: [W.walls.inner.segs.length, W.walls.middle.segs.length, W.walls.outer.segs.length], chev: W.chev.length }; });
console.log(JSON.stringify(w));
check(`within 1.6 km it stands: ${w.tris} triangles in ${w.draws} draws, the walls in ${w.walls && w.walls.join('/')} lengths, ${w.chev} set stones; its face ${w.face && w.face.len} m along, ${w.face && w.face.top} to ${w.face && w.face.foot} m`,
  !w.none && w.inScene && w.draws === w.meshes && w.draws <= 8 && w.tris < 60000 && w.walls.every(n => n > 20) && w.chev > 300 && w.face.top > -1 && w.face.foot < -45, w);
check(`the shore is raised behind the brink (${w.land.join(', ')} m), past its shape the ground is the shore's own (off by ${w.off} m)`, w.land[0] > 36 && w.land.every(y => y > 28 && y < 41) && w.off < .01, w);
check(`no ground stands over the sea in front of the face (${w.front} points), no far point over the ground in its shape (${w.farUp} of ${w.farN})`, w.front === 0 && w.farN > 0 && w.farUp === 0, w);
check(`the rim holds its walker at ${w.rim} m over the ground sunk at ${w.under}; past its front the sea (${w.over} m)`, w.rim > 38 && w.under < 30 && w.over < 1, w);
check(`the cashel's band blocks a walker on the floor, the passage is open under its lintels; no herb or vein is left under the rim (${w.herbs})`, w.blocks && w.pass && w.herbs === 0, w);
const dr = await page.evaluate(() => { const S = WONDERS.stormwatch; px = S.site.x + 2500; pz = S.site.z; WONDERS._t = 0; tickWonders(); return { gone: !S.W, sol: STATIC_SOL.filter(q => q.cell === 'wonder:stormwatch').length, plats: ZONES.world.platforms.filter(p => p.wonder === 'stormwatch').length }; });
check('2.5 km off it is dropped, its solids and its walk with it', dr.gone && dr.sol === 0 && dr.plats === 0, dr);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
