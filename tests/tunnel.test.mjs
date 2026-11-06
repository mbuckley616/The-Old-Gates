// tunnel (Session 1828, card F8; Michael's A on #335, "a road", and his A on #1096, "inland, under a ridge beside a road"): an Aurenne cell
// whose land holds one keeps a trade tunnel (tunnelAt, 82), places.js's aurenneTunnel (PKIT.au.tunnel) between two portals, each the cave's
// outcrop in Aurenne's pale rock with the tunnel's frame (PKIT.places.cavemouth, rock 'aurenne', frame, tunnel), on either side of a ridge
// beside one of the cell's roads. The suite builds the kit on a climb, counts the tunnels, goes to the nearest, in at one portal, walks the
// bore and out at the other, and in again at that one. Session 1938: the lane from each portal to the road.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const kit = await page.evaluate(() => { const T = PKIT.au.tunnel({ key: 'test', rise: 3 }), F = PKIT.au.tunnel({ key: 'test', rise: 9 });
  const walk = T.cells.filter(c => c.y != null), mid = walk.filter(c => c.z1 <= -27 && c.z0 >= -29);
  return { tris: T.tris, draws: T.draws, L: T.L, rise: T.rise, capped: F.rise, ends: [T.floorY(0), T.floorY(-56)], mouths: T.mouths.map(m => m.y), cells: walk.length, midW: Math.max(...mid.map(c => c.x1 - c.x0)), lamps: T.lamps.length, names: T.group.children.map(m => m.name) }; });
console.log(JSON.stringify(kit));
check(`the kit (${kit.tris} triangles in ${kit.draws} draws): a bore of ${kit.L} m climbing ${kit.rise} m from portal to portal (a climb of 9 held to ${kit.capped}, 1 in 12), its passing place ${kit.midW} m of floor across, ${kit.lamps} lamps lit`,
  kit.L === 56 && kit.rise === 3 && Math.abs(kit.capped - 56 / 12) < .01 && kit.ends[0] === 0 && kit.ends[1] === 3 && kit.mouths[1] === 3 && kit.midW >= 5 && kit.lamps >= 8 && kit.tris < 60000 && kit.draws <= 18 && kit.names.includes('sky'), kit);
const k = await page.evaluate(() => { const A = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home && nationKeyOf(c.i, c.j) === 'aurenne'), Q = A.map(c => tunnelAt(c)).filter(Boolean);
  Q.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  const other = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home && nationKeyOf(c.i, c.j) !== 'aurenne').map(c => tunnelAt(c)).filter(Boolean).length;
  return { cells: A.length, n: Q.length, other, rock: Q.map(q => q.rock), len: Q.map(q => +Math.hypot(q.x1 - q.x, q.z1 - q.z).toFixed(1)), near: Q[0] }; });
console.log(JSON.stringify(k));
check(`${k.n} of ${k.cells} Aurenne cells keep a trade tunnel, none elsewhere; each 56 m portal to portal with ${Math.min(...k.rock)} m or more of hill over its floor`, k.n > 0 && k.other === 0 && k.len.every(l => Math.abs(l - 56) < .1) && k.rock.every(r => r >= 5) && /Tunnel$/.test(k.near.name), k);
await page.evaluate(C => { px = C.x + Math.sin(C.ry) * 8; pz = C.z + Math.cos(C.ry) * 8; }, k.near);
for (let n = 0; n < 8; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._tunnel && c._tunnel.id === id); return !!(c && c._tunnel.house); }, k.near.id); if (ok) break; await page.waitForTimeout(1000); }
// S1938 — a lane from each portal to the road: from 4 m before the throat, out of the hill and round its outcrop, onto a road's line, its bed
// the ground (cut or built up), drawn by the chunks' road ribbon, and never through a solid
await g.frames(2);
const ln = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._tunnel && c._tunnel.id === id), C = c._tunnel;
  return (C.lanes || []).map(rd => { const P = rd.pts, E = rd.def.end === 'a' ? C : C.far, pe = P[P.length - 1];
    let onRoad = 1e9; for (const s of RSEG) { if (s.road.def.via === 'spur' || s.road.def.via === 'quay') continue; const vx = s.bx - s.ax, vz = s.bz - s.az, t = Math.max(0, Math.min(1, ((pe.x - s.ax) * vx + (pe.z - s.az) * vz) / (s.len2 || 1))); onRoad = Math.min(onRoad, Math.hypot(s.ax + vx * t - pe.x, s.az + vz * t - pe.z)); }
    let drawn = 0; for (let i = 1; i < P.length - 1; i++) { const p = P[i], ch = chunks.get(chunkKey(Math.floor(p.x / CHUNK), Math.floor(p.z / CHUNK)));
      if (ch && ch.group.children.some(o => { if (!o.userData.ribbon) return false; const a = o.geometry.attributes.position; for (let k = 0; k < a.count; k++) if (Math.hypot(a.getX(k) - p.x, a.getZ(k) - p.z) < 3) return true; return false; })) drawn++; }
    return { end: rd.def.end, via: rd.def.via, len: rd.len, grade: rd.grade, cut: rd.cut, start: +Math.hypot(P[0].x - E.x, P[0].z - E.z).toFixed(2), onRoad: +onRoad.toFixed(2), solid: P.filter(p => solidAt(p.x, p.z)).length,
      bed: +Math.max(...P.map(p => Math.abs(worldH(p.x, p.z) - p.y))).toFixed(2), drawn, inner: P.length - 2 }; }); }, k.near.id);
console.log(JSON.stringify(ln));
check(`a lane from each portal to the road (${ln.map(l => `${l.end}: ${l.len} m at 1 in ${(1 / Math.max(l.grade, .001)).toFixed(1)}, cut or fill to ${l.cut} m`).join('; ')}): 4 m out of the throat, onto a road's line, the ground its bed, drawn all along, through no solid`,
  ln.length === 2 && ln.every(l => l.via === 'spur' && Math.abs(l.start - 4) < .05 && l.onRoad < .05 && l.solid === 0 && l.bed < .05 && l.drawn === l.inner && l.grade <= .25 && l.len < 110), ln);
const at = async end => page.evaluate(([id, end]) => { const c = [...CELLS.values()].find(c => c._tunnel && c._tunnel.id === id), T = c && c._tunnel, C = T && (end ? T.far : T); if (!C || !T.house) return { none: true };
  const co = Math.cos(C.ry), s = Math.sin(C.ry), W = (u, v) => [C.x + u * co + v * s, C.z - u * s + v * co], sol = (u, v) => solidAt(...W(u, v));
  [px, pz] = W(0, 6); jumpY = activeTerrainH(px, pz); const away = limeCavePrompt(); [px, pz] = W(0, -1); jumpY = activeTerrainH(px, pz); const inn = limeCavePrompt();
  const r = { id, end, rise: T.rise, y: +C.y.toFixed(2), tris: T.tris, draws: T.draws, away, inn, open: [sol(0, 3), sol(0, .6), sol(0, -1.5)], solid: [sol(-3.6, -1.5), sol(3.6, -1.5), sol(0, -4)] };
  if (inn) interact(); return r; }, [k.near.id, end]);
const a = await at(0); console.log(JSON.stringify(a));
check(`the portals of ${a.id} (${a.tris} triangles in ${a.draws} draws, the floor climbing ${a.rise} m between them) offer the way in only in the throat, open there and solid round it`, !a.none && !a.away && /into the tunnel/.test(a.inn) && a.open.every(v => !v) && a.solid.every(Boolean) && a.tris < 30000 && a.draws <= 14, a);
const inside = () => page.waitForFunction(() => isInterior() && currentHouse && currentHouse.type === 'tunnel', null, { timeout: 40000 }).then(() => true, () => false);
check('into the tunnel at portal A', await inside());
await page.waitForTimeout(1500);
const m = await page.evaluate(() => { const T = currentHouse._limeCave, Bd = T.bounds, FY = T.low - .25; let x = px, z = pz, y = jumpY, blocked = [], maxStep = 0;
  const step = (nx, nz) => { if (intSolidAt(nx, nz, .3, y)) { blocked.push([+(nx + Bd.x0).toFixed(2), +(nz + Bd.z0).toFixed(2)]); return false; } const ny = footholdY(nx, nz, y, 0); maxStep = Math.max(maxStep, Math.abs(ny - y)); x = nx; z = nz; y = ny; return true; };
  const start = [+(px + Bd.x0).toFixed(2), +(pz + Bd.z0).toFixed(2), +(jumpY + FY).toFixed(2)], clear = !intSolidAt(px, pz, .3, jumpY);
  for (let tz = -2; tz >= -T.L + 1.5; tz -= 1) { const X = T.xc(tz) - Bd.x0, Z = tz - Bd.z0; let n = 0; while (Math.hypot(X - x, Z - z) > .03 && n++ < 400) { const d = Math.hypot(X - x, Z - z), s = Math.min(.05, d); if (!step(x + (X - x) / d * s, z + (Z - z) / d * s)) break; } }
  const wall = (u, v) => intSolidAt(u - Bd.x0, v - Bd.z0, .3, T.floorY(v) - FY); px = x; pz = z; jumpY = y;
  return { start, clear, blocked: blocked.slice(0, 3), nb: blocked.length, maxStep: +maxStep.toFixed(2), end: [+(x + Bd.x0).toFixed(2), +(z + Bd.z0).toFixed(2), +(y + FY).toFixed(2)], rise: T.rise, walls: [wall(T.xc(-14) + 2.4, -14), wall(T.xc(-14) - 2.4, -14), wall(0, -28 - 0)], bench: wall(T.xc(-28) - 2.7, -27.5), prompt: limeCavePrompt(), lights: interiorScene.children.filter(o => o.isPointLight).length }; });
console.log(JSON.stringify(m));
check(`arrived inside portal A at ${m.start[2]} m, clear; walked the bore ${-m.end[1]} m to portal B with no wall in the way (${m.nb} blocked) and no step over ${m.maxStep} m, ${m.end[2]} m up (the floor's climb ${m.rise})`, m.clear && Math.abs(m.start[2]) < .05 && m.nb === 0 && m.maxStep <= .1 && m.end[1] < -53 && Math.abs(m.end[2] - m.rise) < .15, m);
check('the bore\'s rock either side is a wall, and the passing place\'s bench is in the way', m.walls[0] && m.walls[1] && !m.walls[2] && m.bench, m);
check(`at portal B the way out (${m.prompt})`, /out of the tunnel/.test(m.prompt || ''), m);
await page.evaluate(() => interact());
const outside = () => page.waitForFunction(() => !isInterior() && activeZoneId === 'world', null, { timeout: 40000 }).then(() => true, () => false);
check('out of the tunnel', await outside());
await page.waitForTimeout(1500);
const o = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._tunnel && c._tunnel.id === id), T = c._tunnel, F = T.far; return { d: +Math.hypot(px - F.out.x, pz - F.out.z).toFixed(2), dA: +Math.hypot(px - T.out.x, pz - T.out.z).toFixed(1), solid: solidAt(px, pz) }; }, k.near.id);
check(`stood outside portal B (${o.d} m from its spot, ${o.dA} m from A's), on open ground`, o.d < .5 && o.dA > 40 && !o.solid, o);
const b = await at(1); console.log(JSON.stringify(b));
check('portal B offers the way in, and takes you in at its own end', !b.none && /into the tunnel/.test(b.inn) && b.open.every(v => !v) && b.solid.every(Boolean), b);
check('inside again', await inside());
await page.waitForTimeout(1000);
const e = await page.evaluate(() => { const T = currentHouse._limeCave, Bd = T.bounds; return { z: +(pz + Bd.z0).toFixed(2), prompt: limeCavePrompt() }; });
check(`in at portal B's end (${e.z} m), offered the way out there`, e.z < -53 && /out of the tunnel/.test(e.prompt || ''), e);
check('no errors on the new look', g.errs.length === 0, g.errs);
await g.close();
