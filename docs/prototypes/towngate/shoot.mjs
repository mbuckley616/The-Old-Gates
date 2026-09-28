// node docs/prototypes/towngate/shoot.mjs -> docs/prototypes/towngate-*.png
// Backlog H.5 (Session 249's "still boxes: the gate itself (a gap between towers)"): where a road crosses a town's wall the
// two gate towers stand either side of it with nothing between them. Two proposals, built from the game's own wall and tower
// builders (WORLD.wallSegHi, WORLD.gateTowerHi) with the gate itself made here from SK shapes (index.html is not changed):
//   A. a gateway: stone tiers an arch of voussoirs springing from the towers with a wall-walk and merlons over it, the
//      palisade a timber lintel frame with a braced top rail; in both, two plank gate leaves standing open against the inside;
//   B. the leaves alone, open, hung on posts at the towers, the gap open to the sky.
// Rows: stone, palisade. Columns: today, A, B. Seen from the road outside, at noon.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g; await g.intoWorld();
const png = await page.evaluate(() => { forceTime(12); const sc = WORLD.scene, cv = REN.domElement, W = cv.width, H = cv.height, TW = 480, TH = 300, bx = px + 500, bz = pz, y = WORLD.worldH(bx, bz) + 90;
  const rng = s => { let a = s; return () => ((a = (a * 16807) % 2147483647) / 2147483647); }; const C = x => new THREE.Color(x); const VC = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mat = c => new THREE.MeshLambertMaterial({ color: c }); const RH = 3.2, GAP = RH + 3.6; // the road's half-width and a tower's offset from the road's middle
  const TIERS = { stone: { H: 4.6, d: 1.3, wall: 0x8a8478, cap: 0x7a7468 }, logs: { H: 3.2, d: .5, wall: 0x5a4222, cap: 0x4a3418 } };
  const leaves = (G, T, halfW, h) => { for (const s of [-1, 1]) { const leaf = new THREE.Group(); const w = halfW - .2; for (let k = 0; k < 6; k++) { const pl = new THREE.Mesh(SK.rbox(w / 6 - .02, h, .12, .02, 1), mat(0x5a3d22 + (k % 2) * 0x080604)); pl.position.set(-s * (k + .5) * w / 6, h / 2, 0); leaf.add(pl); }
      for (const yy of [.5, h - .6]) { const band = new THREE.Mesh(new THREE.BoxGeometry(w, .12, .04), mat(0x2a2624)); band.position.set(-s * w / 2, yy, .08); leaf.add(band); }
      const brace = new THREE.Mesh(new THREE.BoxGeometry(.12, Math.hypot(w, h - 1.2), .1), mat(0x4a3018)); brace.position.set(-s * w / 2, h / 2, .08); brace.rotation.z = s * Math.atan2(w, h - 1.2); leaf.add(brace);
      leaf.position.set(s * (halfW - .1), 0, -.6); leaf.rotation.y = s * -1.45; G.add(leaf); } }; // hinged at the towers, swung open to the inside (−z)
  const build = (tier, mode) => { const G = new THREE.Group(), T = TIERS[tier], r = rng(7);
    for (const s of [-1, 1]) { const seg = new THREE.Mesh(WORLD.wallSegHi(tier, 14, T.H, T.d, C(T.wall), C(T.cap), 0, 0, rng(3 + s)), VC); seg.position.set(s * (GAP + 2 + 7), 0, 0); G.add(seg);
      const tw = new THREE.Mesh(WORLD.gateTowerHi(tier, T.H, C(T.cap), C(0x3a3a46), rng(9 + s)), VC); tw.position.set(s * GAP, 0, 0); G.add(tw); }
    const inner = GAP - (tier === 'stone' ? 1.9 : 1.0); // the towers' inner faces
    if (mode === 'A') { if (tier === 'stone') { const span = inner, rise = 2.2, spring = T.H - 1.4 - rise * .3; // an arch of voussoirs from tower to tower, the wall-walk over it
          for (let k = 0; k <= 16; k++) { const a = k / 16 * Math.PI, v = new THREE.Mesh(SK.rbox(.55, .8, T.d + .2, .06, 1), mat(0x8a8478 - (k % 2) * 0x080808)); v.position.set(Math.cos(a) * span, spring + Math.sin(a) * rise, 0); v.rotation.z = a - Math.PI / 2; v.scale.x = 1 + (k === 8 ? .3 : 0); G.add(v); }
          const walk = new THREE.Mesh(new THREE.BoxGeometry(span * 2 + .6, T.H + 1.2 - (spring + rise), T.d), mat(0x7a7468)); walk.position.set(0, (spring + rise + T.H + 1.2) / 2 - .1, 0); G.add(walk);
          for (let x = -span + .3; x < span; x += 1.8) { const m = new THREE.Mesh(SK.rbox(1.0, .8, .45, .06, 1), mat(0x7a7468)); m.position.set(x, T.H + 1.2 + .4, T.d / 2 - .2); G.add(m); }
          for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(.6, spring, T.d + .2), mat(0x7e786c)); f.position.set(s * (span - .3), spring / 2, 0); G.add(f); } }
        else { const span = inner; for (const s of [-1, 1]) { const post = new THREE.Mesh(SK.cyl(.2, .22, T.H + 1.6, 7), mat(0x5a4222)); post.position.set(s * span, (T.H + 1.6) / 2, 0); G.add(post); }
          for (const yy of [T.H + .6, T.H + 1.3]) { const beam = new THREE.Mesh(SK.cyl(.16, .16, span * 2 + .6, 7), mat(0x4a3418)); beam.rotation.z = Math.PI / 2; beam.position.set(0, yy, 0); G.add(beam); }
          for (const s of [-1, 1]) { const br = new THREE.Mesh(SK.cyl(.09, .09, 1.6, 5), mat(0x4a3418)); br.position.set(s * (span - .6), T.H + .1, 0); br.rotation.z = s * .7; G.add(br); } }
        leaves(G, T, inner, tier === 'stone' ? 3.4 : 2.8); }
    if (mode === 'B') { for (const s of [-1, 1]) { const post = new THREE.Mesh(SK.cyl(.14, .16, 3.4, 6), mat(0x4a3418)); post.position.set(s * inner, 1.7, 0); G.add(post); } leaves(G, T, inner, 3.0); }
    const road = new THREE.Mesh(new THREE.PlaneGeometry(RH * 2, 40), mat(0xb8a878)); road.rotation.x = -Math.PI / 2; road.position.y = .01; G.add(road); return G; };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat(0x6a7a48)); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y - .02, bz); sc.add(floor);
  const cam = new THREE.PerspectiveCamera(50, W / H, .3, 600), tiles = [];
  for (const tier of ['stone', 'logs']) for (const mode of ['today', 'A', 'B']) { const G = build(tier, mode); G.position.set(bx, y, bz); sc.add(G); cam.position.set(bx + 6, y + 3.2, bz + 17); cam.lookAt(bx, y + 3, bz); sc.updateMatrixWorld(true);
    const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f; const o = document.createElement('canvas'); o.width = TW; o.height = TH; o.getContext('2d').drawImage(cv, 0, 0, W, H, 0, 0, TW, TH); tiles.push(o); sc.remove(G); }
  sc.remove(floor); const c = document.createElement('canvas'); c.width = TW * 3; c.height = TH * 2; const x = c.getContext('2d'); tiles.forEach((o, i) => x.drawImage(o, (i % 3) * TW, Math.floor(i / 3) * TH));
  x.fillStyle = '#fff'; x.font = '16px sans-serif'; ['today', 'A: gateway and leaves', 'B: leaves only'].forEach((t, i) => x.fillText(t, i * TW + 8, 20)); return c.toDataURL(); });
fs.writeFileSync(path.join(here, '..', 'towngate-grid.png'), Buffer.from(png.split(',')[1], 'base64')); console.log('errors', g.errs); await g.close();
