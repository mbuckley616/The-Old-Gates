// Session 744 — Michael's A on #236: a dry-stone retaining wall at the foot of each bank where a port's lane (Session 618) cuts
// deeper than 1.2 into the ground, at most 2.6 over the lane, battered back 1 in 5, a cap of flat stones, the turf behind the
// cap running back to the bank; solid along its foot; built and dropped with the lane's cell. Portclare's lane is the deep one.
// Writes docs/prototypes/quaywall-lane.png and quaywall-above.png.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'prototypes');
const g = await boot(); const { page } = g; await g.intoWorld();
const stop = g.keepAlive();
const id = await page.evaluate(() => { const p = WORLD.allPorts().find(q => /portclare/i.test(q.name || '')); return p && p.id; });
check(`Portclare is a port (${id})`, !!id);
for (let k = 0; k < 3 && !(await page.evaluate(id => !!WORLD.settle.get(id), id)); k++) await g.settle(id);
await page.evaluate(id => { const t = siteAnywhere(id), A = t.quayLane.a, B = t.quayLane.b; px = (A.x + B.x) / 2; pz = (A.z + B.z) / 2; }, id);
const drain = () => page.evaluate(() => { for (let k = 0; k < 600 && (WORLD.jobs.length || [...WORLD.LOADED.values()].some(L => L.pending)); k++) { WORLD.tick(1 / 60, performance.now());
  while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } } });
await drain(); await g.frames(3); await drain();

const r = await page.evaluate(id => {
  const rd = ROADS.find(q => q.def.via === 'quay' && q.def.a === 'quay_' + id); if (!rd) return { rd: false };
  const P = rd.pts, A = P[0], B = P[P.length - 1], L = Math.hypot(B.x - A.x, B.z - A.z), dx = (B.x - A.x) / L, dz = (B.z - A.z) / L, yAt = s => A.y + (B.y - A.y) * s / L;
  const W = rd.wall; if (!W) return { rd: true, wall: false };
  const m = W.mesh, pos = m.geometry.attributes.position, nor = m.geometry.attributes.normal; let minOff = 1e9, maxOver = -1e9, outward = 0, faces = 0, faceIn = 0;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), s = (x - A.x) * dx + (z - A.z) * dz, o = -(x - A.x) * dz + (z - A.z) * dx;
    minOff = Math.min(minOff, Math.abs(o)); if (Math.abs(o) < ROAD_HALF + .3 + 2.6 * .2 + .56) maxOver = Math.max(maxOver, y - yAt(s)); outward = Math.max(outward, Math.abs(o));
    const ny = nor.getY(i); if (Math.abs(ny) < .5) { faces++; const no = -nor.getX(i) * dz + nor.getZ(i) * dx; if (no * o < 0) faceIn++; } }
  // the cut's depth each side, every metre, and where the wall stands
  let deep = [0, 0], walled = [0, 0], wrong = 0;
  const near = (x, z) => { for (let i = 0; i < pos.count; i += 3) if (Math.hypot(pos.getX(i) - x, pos.getZ(i) - z) < 1.3) return true; return false; };
  for (let s = 0; s <= L; s += 2) for (const [j, sd] of [[0, 1], [1, -1]]) { const nx = dz * sd, nz = -dx * sd, x = A.x + dx * s, z = A.z + dz * s;
    const d = baseH(x + nx * 8, z + nz * 8) - yAt(s), w = near(x + nx * (ROAD_HALF + .5), z + nz * (ROAD_HALF + .5)); if (d > 1.6) { deep[j]++; if (w) walled[j]++; } else if (d < .8 && w) wrong++; }
  // solid at the wall's foot, open in the lane, at the deepest station
  let bs = 0, bd = 0; for (let s = 0; s <= L; s += 1) { const x = A.x + dx * s, z = A.z + dz * s, d = baseH(x + dz * 8, z - dx * 8) - yAt(s); if (d > bd) { bd = d; bs = s; } }
  const x = A.x + dx * bs, z = A.z + dz * bs;
  return { rd: true, wall: true, L: +L.toFixed(1), tris: W.tris, sol: W.sol, minOff: +minOff.toFixed(2), maxOver: +maxOver.toFixed(2), outward: +outward.toFixed(2), faces, faceIn, deep, walled, wrong,
    solidWall: WORLD.solidAt ? WORLD.solidAt(x + dz * (ROAD_HALF + .5), z - dx * (ROAD_HALF + .5)) : solidAt(x + dz * (ROAD_HALF + .5), z - dx * (ROAD_HALF + .5)),
    solidLane: solidAt(x, z), solidEdge: solidAt(x + dz * (ROAD_HALF - .4), z - dx * (ROAD_HALF - .4)), inScene: !!m.parent, cell: rd.cell }; }, id);
console.log(JSON.stringify(r));
check(`Portclare's lane has its walls: ${r.tris} triangles, ${r.sol} solid posts`, r.rd && r.wall && r.tris > 800 && r.tris < 5000 && r.sol > 20 && r.inScene, r);
check(`walled where the cut is deep: ${r.walled[0]}/${r.deep[0]} and ${r.walled[1]}/${r.deep[1]} stations past 1.6 deep, none where it is under .8 (${r.wrong})`,
  r.walled[0] === r.deep[0] && r.walled[1] === r.deep[1] && r.deep[0] + r.deep[1] > 20 && r.wrong === 0, r);
check(`clear of the lane (nearest ${r.minOff} from its middle, its edge at 2.6) and its stone at most ${r.maxOver} over it (2.6, a cap of .18; the turf behind goes on up the bank)`, r.minOff >= 2.75 && r.maxOver <= 2.6 + .18 + .2, r);
check(`the stone faces the lane (${r.faceIn} of ${r.faces} upright vertices)`, r.faceIn / r.faces > .9, r);
check('solid at its foot, open in the lane and at the lane\'s edge', r.solidWall && !r.solidLane && !r.solidEdge, r);

// the other ports near Dunmore: lanes on the flat have no wall
const others = await page.evaluate(id => ROADS.filter(q => q.def.via === 'quay' && q.def.a !== 'quay_' + id).map(q => { const P = q.pts, A = P[0], B = P[P.length - 1], L = Math.hypot(B.x - A.x, B.z - A.z), dx = (B.x - A.x) / L, dz = (B.z - A.z) / L;
  let n = 0; for (const sd of [1, -1]) { let run = 0; for (let s = 0; s <= L; s += 1) { const x = A.x + dx * s, z = A.z + dz * s; if (baseH(x + dz * sd * 8, z - dx * sd * 8) - (A.y + (B.y - A.y) * s / L) > 1.2) { if (++run === 2) n++; } else run = 0; } }
  return { a: q.def.a, L: +L.toFixed(1), cut: n, wall: !!q.wall, tris: q.wall ? q.wall.tris : 0 }; }), id);
console.log('other lanes', JSON.stringify(others));
check(`the other loaded lanes: walled only where they cut deeper than 1.2 for two metres (${others.filter(o => o.wall).length} of ${others.length} walled)`, others.length > 0 && others.every(o => o.wall === (o.cut > 0)), others);

// pictures, from the lane in the deepest part looking down to the quay, and from above
const shots = await page.evaluate(id => {
  forceTime(11); const t = siteAnywhere(id), A = t.quayLane.a, B = t.quayLane.b, L = Math.hypot(B.x - A.x, B.z - A.z), dx = (B.x - A.x) / L, dz = (B.z - A.z) / L;
  const ya = baseH(A.x, A.z), yb = Math.max(SEA_Y + .6, baseH(B.x, B.z)), yAt = s => ya + (yb - ya) * s / L;
  let best = 0, bs = L / 2; for (let s = 0; s <= L; s += 2) { const x = A.x + dx * s, z = A.z + dz * s, d = Math.max(baseH(x + dz * 8, z - dx * 8), baseH(x - dz * 8, z + dx * 8)) - yAt(s); if (d > best) { best = d; bs = s; } }
  const cv = REN.domElement, W = cv.width, H = cv.height, TW = 640, TH = 360, tiles = []; const cam = new THREE.PerspectiveCamera(55, W / H, .3, 600);
  const shoot = (x, cy, z, lx, ly, lz) => { cam.position.set(x, cy, z); cam.lookAt(lx, ly, lz); CAM.position.copy(cam.position); WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true);
    const fog = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = fog; const o = document.createElement('canvas'); o.width = TW; o.height = TH; o.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); tiles.push(o.toDataURL()); };
  const s0 = Math.max(0, bs - 22), x0 = A.x + dx * s0, z0 = A.z + dz * s0;
  shoot(x0, yAt(s0) + 1.7, z0, A.x + dx * (bs + 10), yAt(bs + 10) + 1, A.z + dz * (bs + 10));
  const xm = A.x + dx * bs, zm = A.z + dz * bs; shoot(xm - dx * 16 + dz * 2, yAt(bs) + 11, zm - dz * 16 - dx * 2, xm + dx * 8, yAt(bs + 8), zm + dz * 8);
  return tiles; }, id);
for (const [k, name] of [[0, 'lane'], [1, 'above']]) fs.writeFileSync(path.join(OUT, `quaywall-${name}.png`), Buffer.from(shots[k].split(',')[1], 'base64'));

// the cell unloaded: the wall and its posts go with it
const un = await page.evaluate(id => { const rd = ROADS.find(q => q.def.via === 'quay' && q.def.a === 'quay_' + id); const m = rd.wall.mesh, k = rd.cell, n0 = STATIC_SOL.filter(s => s.cell === k).length;
  WORLD.unloadCell ? WORLD.unloadCell(k) : unloadCell(k); return { gone: !m.parent, posts: STATIC_SOL.filter(s => s.cell === k).length, n0 }; }, id);
check(`unloading the cell drops the wall and its posts (${un.n0} solids → ${un.posts})`, un.gone && un.posts === 0, un);
check('no page errors', g.errs.length === 0, g.errs);
stop(); await g.close();
