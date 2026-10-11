// node docs/prototypes/quaycut/shoot.mjs -> docs/prototypes/quaycut-*.png (Session 725): Portclare's lane to the quay (Session 618)
// cuts through the ridge behind the town, up to 8 units deep. Today's cut (the road's blend: bare earth banks) beside a prototype
// dry-stone retaining wall each side where the cut is deeper than 1.2, its face battered back 1 in 5, coursed, with a cap,
// at most 2.6 high with the turf bank going on above it (a deep cutting walled at its foot, not a canyon of stone). The
// wall here is laid in the page (protoCutWall below), not in the game. Prints the cut's depth along the lane.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, '..');
const g = await boot(); const { page } = g; await g.intoWorld();
const id = await page.evaluate(() => { const p = WORLD.allPorts().find(q => /portclare/i.test(q.name || '')) || WORLD.allPorts()[0]; return p.id; });
for (let k = 0; k < 3 && !(await page.evaluate(id => !!WORLD.settle.get(id), id)); k++) await g.settle(id);
const prof = await page.evaluate(id => { const t = siteAnywhere(id), A = t.quayLane.a, B = t.quayLane.b, L = Math.hypot(B.x - A.x, B.z - A.z), dx = (B.x - A.x) / L, dz = (B.z - A.z) / L;
  const ya = baseH(A.x, A.z), yb = Math.max(SEA_Y + .6, baseH(B.x, B.z)); const rows = [];
  for (let s = 0; s <= L; s += 4) { const x = A.x + dx * s, z = A.z + dz * s, y = ya + (yb - ya) * s / L; rows.push({ s, road: +y.toFixed(1), L: +(baseH(x + dz * 8, z - dx * 8) - y).toFixed(1), R: +(baseH(x - dz * 8, z + dx * 8) - y).toFixed(1) }); }
  return { name: t.name, L: +L.toFixed(1), rows }; }, id);
console.log(JSON.stringify(prof));
const shots = async () => page.evaluate(id => {
  forceTime(11); const t = siteAnywhere(id), A = t.quayLane.a, B = t.quayLane.b, L = Math.hypot(B.x - A.x, B.z - A.z), dx = (B.x - A.x) / L, dz = (B.z - A.z) / L;
  const ya = baseH(A.x, A.z), yb = Math.max(SEA_Y + .6, baseH(B.x, B.z)), yAt = s => ya + (yb - ya) * s / L;
  // the deepest station
  let best = 0, bs = L / 2; for (let s = 0; s <= L; s += 2) { const x = A.x + dx * s, z = A.z + dz * s, d = Math.max(baseH(x + dz * 8, z - dx * 8), baseH(x - dz * 8, z + dx * 8)) - yAt(s); if (d > best) { best = d; bs = s; } }
  const cv = REN.domElement, W = cv.width, H = cv.height, TW = 640, TH = 360, tiles = []; const cam = new THREE.PerspectiveCamera(55, W / H, .3, 600);
  const shoot = (x, cy, z, lx, ly, lz) => { cam.position.set(x, cy, z); cam.lookAt(lx, ly, lz); CAM.position.copy(cam.position); WORLD.tick(1 / 60, performance.now()); WORLD.scene.updateMatrixWorld(true);
    const fog = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = fog; const o = document.createElement('canvas'); o.width = TW; o.height = TH; o.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); tiles.push(o); };
  const s0 = Math.max(0, bs - 22), x0 = A.x + dx * s0, z0 = A.z + dz * s0;
  shoot(x0, yAt(s0) + 1.7, z0, A.x + dx * (bs + 10), yAt(bs + 10) + 1, A.z + dz * (bs + 10));
  const xm = A.x + dx * bs, zm = A.z + dz * bs; shoot(xm - dx * 16 + dz * 2, yAt(bs) + 11, zm - dz * 16 - dx * 2, xm + dx * 8, yAt(bs + 8), zm + dz * 8);
  return tiles.map(o => o.toDataURL()); }, id);
await page.evaluate(id => { const t = siteAnywhere(id), A = t.quayLane.a, B = t.quayLane.b; px = (A.x + B.x) / 2; pz = (A.z + B.z) / 2; }, id);
const drain = () => page.evaluate(() => { for (let k = 0; k < 600 && (WORLD.jobs.length || [...WORLD.LOADED.values()].some(L => L.pending)); k++) { WORLD.tick(1 / 60, performance.now());
  while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } } });
await drain(); await g.frames(3); await drain();
const before = await shots();
// the prototype wall: each side, every metre, where the ground 8 out stands more than 1.2 over the lane
await page.evaluate(id => { const t = siteAnywhere(id), A = t.quayLane.a, B = t.quayLane.b, L = Math.hypot(B.x - A.x, B.z - A.z), dx = (B.x - A.x) / L, dz = (B.z - A.z) / L;
  const ya = baseH(A.x, A.z), yb = Math.max(SEA_Y + .6, baseH(B.x, B.z)), yAt = s => ya + (yb - ya) * s / L; const pos = [], col = [];
  const stone = [0x857d70, 0x7c7468, 0x8a8275, 0x77706a], cap = new THREE.Color(0x6a6458);
  const quad = (a, b, c, d, cl) => { for (const q of [a, b, c, a, c, d]) { pos.push(q[0], q[1], q[2]); col.push(cl.r, cl.g, cl.b); } };
  for (const sd of [1, -1]) { const nx = dz * sd, nz = -dx * sd; let run = [];
    const flush = () => { for (let k = 0; k + 1 < run.length; k++) { const p = run[k], q = run[k + 1];
        const courses = Math.max(2, Math.round((Math.min(p.top, q.top) - p.y0) / .35));
        for (let c = 0; c < courses; c++) { const u0 = c / courses, u1 = (c + 1) / courses; const cl = new THREE.Color(stone[(c + k * 3 + (k >> 1)) % 4]).multiplyScalar(.95 + .08 * ((c * 7 + k * 13) % 5) / 4);
          const P = (r, u) => { const h = r.y0 + (r.top - r.y0) * u, b = (h - r.y0) * .2; return [r.x + nx * (ROAD_HALF + .3 + b), h, r.z + nz * (ROAD_HALF + .3 + b)]; };
          quad(P(p, u0), P(q, u0), P(q, u1), P(p, u1), cl); }
        const T = (r, o) => { const b = (r.top - r.y0) * .2; return [r.x + nx * (ROAD_HALF + .3 + b + o), r.top + .18, r.z + nz * (ROAD_HALF + .3 + b + o)]; };
        const B_ = (r, o) => { const b = (r.top - r.y0) * .2; return [r.x + nx * (ROAD_HALF + .3 + b + o), r.top, r.z + nz * (ROAD_HALF + .3 + b + o)]; };
        quad(B_(p, -.12), B_(q, -.12), T(q, -.12), T(p, -.12), cap); quad(T(p, -.12), T(q, -.12), T(q, .55), T(p, .55), cap); }
      run = []; };
    for (let s = 0; s <= L; s += 1) { const x = A.x + dx * s, z = A.z + dz * s, y0 = yAt(s) - .15, hn = baseH(x + nx * 8, z + nz * 8);
      if (hn - yAt(s) > 1.2) run.push({ x, z, y0, top: Math.min(hn - .4, yAt(s) + 2.6) }); else if (run.length) flush(); }
    flush(); }
  const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g2.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g2.computeVertexNormals();
  const m = new THREE.Mesh(g2, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); m.castShadow = true; m.receiveShadow = true; WORLD.scene.add(m); window._wallTris = pos.length / 9; }, id);
const after = await shots(); console.log('wall triangles', await page.evaluate(() => window._wallTris));
await g.close();
const { chromium } = await import('playwright');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}); const p = await b.newPage();
for (const [k, name] of [[0, 'lane'], [1, 'above']]) {
  const png = await p.evaluate(async us => { const im = await Promise.all(us.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
    const c = document.createElement('canvas'); c.width = im[0].width * 2 + 8; c.height = im[0].height; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); im.forEach((i, j) => x.drawImage(i, j * (i.width + 8), 0)); return c.toDataURL(); }, [before[k], after[k]]);
  fs.writeFileSync(path.join(OUT, `quaycut-${name}.png`), Buffer.from(png.split(',')[1], 'base64')); }
await b.close();
