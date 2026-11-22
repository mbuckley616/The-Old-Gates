// frostborn (Session 2524; OG-104's Mark panel; Michael's A on #1823 and B on #1858, "cut it into the fell there is"): the Frostborn Vault
// in the game, the kit's PKIT.wonders.frostborn over a gorge stamped into the world's own ground (a stamp of a height, baseH's fn). On
// seed 1 the search finds no Mark fell clear of the world for it (the two that hold it hold the Skyfall Fields and the Northlight Altar;
// DECISION, Session 2524), so the suite measures one placing with wonderFrostAt (the Fields' fell, the Fields taken away) and builds it
// there: the ground cut and met, the far sheet under it, the decks, the ice and the solids, then dropped from 2.5 km.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const s0 = await page.evaluate(() => { const t0 = performance.now(), a = wonderFrostSite(), ms = Math.round(performance.now() - t0); WONDERS.frostborn.site = undefined; const b = wonderFrostSite();
  return { ms, same: JSON.stringify(a) === JSON.stringify(b), found: !!a }; });
console.log(JSON.stringify(s0));
check(`the search over the Mark's fells answers the same twice (${s0.ms} ms; a placing ${s0.found ? 'found' : 'not found on this seed'})`, s0.same, s0);
const st = await page.evaluate(() => { const F = WONDERS.skyfall; if (F.W) wonderSkyfallDrop(); F.site = null; const s = wonderFrostAt(9575, 7425, 0); WONDERS.frostborn.site = s; if (!s) return null; const { base, ...r } = s; r.nb = base.length; return r; });
console.log(JSON.stringify(st));
check(`one placing measured: pads within ${st && st.spread} m, the datum ${st && st.y} m up, the cut run out ${st && st.dl} m down the gorge, the cliff's foot read every 2 m`, !!st && st.spread <= 44 && st.y >= 95 && st.dl >= 250 && st.nb === 401, st);
const at = await page.evaluate(s => { const [x, z] = wonderToWorld(s, 0, -40); return { x, z }; }, st);
await page.evaluate(({ x, z }) => goToZone('world', x, z, 0, 'x'), at);
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, [at.x, at.z], { timeout: 90000 });
await g.cells(); await g.hide();
const w = await page.evaluate(() => { forceTime(13); WONDERS._t = 0; tickWonders(); const S = WONDERS.frostborn, W = S.W, s = S.site, L = S.land; if (!W) return { none: true };
  const t0 = performance.now(); while (JOBS.length && performance.now() - t0 < 15000) runJobs(); for (let i = 0; i < 20; i++) WORLD.tick(1 / 60, performance.now()); WONDERS._t = 0; tickWonders(); /* the herbs and veins of chunks laid since, as the game's next second does */
  let meshes = 0; W.group.traverse(o => { if (o.isMesh) meshes++; }); const Wd = (lx, lz) => wonderToWorld(s, lx, lz), was = (x, z) => { S.stamp.off = true; try { return worldH(x, z); } finally { S.stamp.off = false; } };
  const floor = [[0, -100], [0, 0], [10, -150]].map(([a, b]) => +(meshH(...Wd(a, b)) - s.y).toFixed(1));
  const pads = [[130, -40], [-130, -180]].map(([a, b]) => +(meshH(...Wd(a, b)) - s.y).toFixed(2));
  /* outside the shape the ground is the fell's own; along the shape's edge it meets it */
  let off = 0; for (const [a, b] of [[120, 300], [-130, 400], [480, -100], [-450, -300], [0, 900]]) { const [x, z] = Wd(a, b); off = Math.max(off, Math.abs(worldH(x, z) - was(x, z))); }
  let seam = 0; for (let lz = -200; lz <= 400; lz += 25) for (const sd of [-1, 1]) { const [x, z] = Wd(sd * 92, lz), [x2, z2] = Wd(sd * 93, lz); if (L.inside(...L.toL(x, z)) && !L.inside(...L.toL(x2, z2))) seam = Math.max(seam, Math.abs(worldH(x2, z2) - worldH(x, z))); }
  /* the far sheet: no far point within the shape stands over the ground there */
  let farUp = 0, farN = 0; for (const o of sc.children) { const F = o.userData && o.userData.far; if (!F) continue; const P = o.geometry.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i) + F.ox + WORLD.SIZE / 2, z = P.getZ(i) + F.oz + WORLD.SIZE / 2; if (!S.stamp.inside(x, z)) continue; farN++; if (P.getY(i) > worldH(x, z) - 2.9) farUp++; } }
  /* the deck holds the walker on it and nobody under it; the ice is walked over the ground */
  const [dx, dz] = Wd(0, -40), [ix, iz] = Wd(0, -200), [cx, cz] = Wd(10, -150), keep = [px, pz, jumpY];
  px = dx; pz = dz; jumpY = s.y + .3; const onDeck = +(activeTerrainH(px, pz) - s.y).toFixed(2); const underDeck = +(activeTerrainH(dx + 1e-3, dz) - s.y).toFixed(1); [px, pz, jumpY] = keep;
  const ice = +(activeTerrainH(ix, iz) - s.y).toFixed(1), iceGround = +(meshH(ix, iz) - s.y).toFixed(1), iceKit = +W.surf(0, -200).toFixed(1);
  /* solids: the face at the ice; the first viaduct's pier at the ice, its arch open; the cliff's foot */
  const yI = (lx, lz) => W.surf(lx, lz) + s.y + .2, S5 = W.viaducts[0].S, pierX = -75 + S5 + 3.5, archX = -75 + S5 / 2;
  const face = solidAt(...Wd(0, -306), yI(0, -300)), pier = solidAt(...Wd(pierX, -40), yI(pierX, -40)), arch = !solidAt(...Wd(archX, -40), yI(archX, -40)), deckFree = !solidAt(dx, dz, s.y + .3);
  const cliff = S.sol.filter(q => q.part === 'cliff').length, cliffBlock = S.sol.filter(q => q.part === 'cliff').slice(0, 5).every(q => solidAt(q.cx, q.cz, q.top - 20));
  const herbs = (ZONES.world.herbs || []).filter(h => S.stamp.inside(h.x, h.z) && activeTerrainH(h.x, h.z) > worldH(h.x, h.z) + .5).length;
  return { tris: W.tris, draws: W.draws, meshes, inScene: W.group.parent === sc, towers: W.towers.length, halls: W.halls.length, sol: S.sol.length, floor, pads, off: +off.toFixed(3), seam: +seam.toFixed(2), farUp, farN,
    onDeck, underDeck, ice, iceGround, iceKit, face, pier, arch, deckFree, cliff, cliffBlock, herbs, cx, cz }; });
console.log(JSON.stringify(w));
check(`within 1.6 km it stands: ${w.tris} triangles in ${w.draws} draws, ${w.halls} halls and ${w.towers} towers`, !w.none && w.inScene && w.draws === w.meshes && w.draws <= 12 && w.tris < 80000 && w.halls === 4 && w.towers === 9, w);
check(`the gorge is cut to its floor (${w.floor.join(', ')} m), the pads levelled (${w.pads.join(', ')} m); past its shape the ground is the fell's own (off by ${w.off} m), and its edge meets it (${w.seam} m a metre across)`,
  w.floor.every(y => Math.abs(y + 85) < 1.5) && w.pads.every(y => Math.abs(y + .4) < .3) && w.off < .01 && w.seam < 1.5, w);
check(`no far point stands over the ground in its shape (${w.farUp} of ${w.farN})`, w.farN > 0 && w.farUp === 0, w);
check(`the deck holds its walker (${w.onDeck} m) and not the ground under it (${w.underDeck} m); the glacier is walked on its ice (${w.ice} m, the kit's ${w.iceKit}, over ground at ${w.iceGround})`,
  Math.abs(w.onDeck - .3) < .01 && w.underDeck < -30 && Math.abs(w.ice - w.iceKit) < .3 && w.ice > w.iceGround + 5, w);
check(`on the ice the face and the piers block and the arches do not; the deck is clear to walk; the cliff's foot is ${w.cliff} solids; no herb is left under the ice or a deck (${w.herbs})`,
  w.face && w.pier && w.arch && w.deckFree && w.cliff > 20 && w.cliffBlock && w.herbs === 0, w);
const dr = await page.evaluate(() => { const S = WONDERS.frostborn; px = S.site.x + 2500; pz = S.site.z; WONDERS._t = 0; tickWonders(); return { gone: !S.W, sol: STATIC_SOL.filter(q => q.cell === 'wonder:frostborn').length, plats: ZONES.world.platforms.filter(p => p.wonder === 'frostborn').length }; });
check('2.5 km off it is dropped, its solids and its walk with it', dr.gone && dr.sol === 0 && dr.plats === 0, dr);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
