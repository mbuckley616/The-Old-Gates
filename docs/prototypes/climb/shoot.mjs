// node docs/prototypes/climb/shoot.mjs -> docs/prototypes/climb-*.png (Session 726): the climb up a boarding net in third person.
// Today (Session 638's rule) the body slides on a straight line from the water to the rail in 0.8 s in whatever pose it had,
// passing through the planking. The prototype, laid in the page (protoClimb below, not in the game): the body faces the hull
// and climbs hand over hand, three reaches in the 0.8 s, the knees stepping up the mesh, the head tipped up, held on the net
// .35 off the planking until the last fifth, when it swings in over the rail. Three moments of a climb, today above the prototype.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, '..');
const g = await boot(); const { page } = g; await g.intoWorld();
await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  let sx = null, sz = null; for (let r = 300; r < 3000 && sx === null; r += 30) for (let a = 0; a < 6.28; a += .3) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if ([[0, 0], [40, 0], [-40, 0], [0, 40], [0, -40]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -5)) { sx = x; sz = z; break; } }
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(sx, sz, 0.7); forceTime(11); thirdPerson = true; });
const shots = (proto) => page.evaluate((proto) => {
  const m = WORLD.ship.mesh, W = WORLD.ship.W; m.updateMatrixWorld(true);
  const w = (lx, y, lz) => new THREE.Vector3(lx, y, lz).applyMatrix4(m.matrixWorld);
  const start = w(W / 2 + .6, 0, 0); px = start.x; pz = start.z; jumpY = SWIM_Y; velY = 0;
  const hull = w(0, 0, 0); yaw = Math.atan2(-(hull.x - px), -(hull.z - pz)); pitch = .15;
  startClimb(m, W, 1, null); const C = CLIMB; const cv = REN.domElement, TW = 420, TH = 420, tiles = [];
  const cam = new THREE.PerspectiveCamera(45, 1, .1, 300);
  for (const u of [.25, .55, .9]) {
    C.t = u * NET_CLIMB - 1e-4; tickNetClimb(1e-4);
    if (proto) { // the body held on the net until the last fifth, then in over the rail
      const net = w(W / 2 + .38, 0, 0), rail = netRail(m, W, 1), k = Math.max(0, (u - .8) / .2), y0 = C.y0, top = DECK_Y;
      const rise = Math.min(1, u / .8); px = net.x + (rail.x - net.x) * k; pz = net.z + (rail.z - net.z) * k; jumpY = y0 + (top + .1 - y0) * rise; }
    for (let i = 0; i < 12; i++) tpUpdate(1 / 60, { moving: false, sprinting: false, camY: jumpY + 1.6, now: performance.now() + i * 16, roll: null });
    const R = TP.rig; R.root.position.set(px, jumpY, pz); R.root.visible = true;
    if (proto) { const cyc = u * 3 * Math.PI * 2, s = Math.sin(cyc), k = Math.max(0, (u - .8) / .2);
      R.root.rotation.y = yaw + Math.PI;
      const set = (b, x, y, z) => { if (b) b.rotation.set(x, y || 0, z || 0); };
      set(R.shL, -2.55 + .45 * s, -.15, .12); set(R.elL, -.55 - .45 * (1 + s) / 2); set(R.shR, -2.55 - .45 * s, .15, -.12); set(R.elR, -.55 - .45 * (1 - s) / 2);
      set(R.thighL, -.95 - .35 * s * (1 - k)); set(R.kneeL, 1.35 + .3 * s * (1 - k)); set(R.thighR, -.95 + .35 * s * (1 - k)); set(R.kneeR, 1.35 - .3 * s * (1 - k));
      set(R.torso, .18 + .25 * k); set(R.head, -.4 + .3 * k); }
    const eye = w(W / 2 + 4.2, 1.4, 2.6); cam.position.copy(eye); cam.lookAt(w(W / 2 - .2, 1.0, 0)); WORLD.scene.updateMatrixWorld(true);
    const fog = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = fog;
    const o = document.createElement('canvas'); o.width = TW; o.height = TH; const s0 = Math.min(cv.width, cv.height); o.getContext('2d').drawImage(cv, (cv.width - s0) / 2, (cv.height - s0) / 2, s0, s0, 0, 0, TW, TH); tiles.push(o); }
  CLIMB = null; const c = document.createElement('canvas'); c.width = TW * 3 + 16; c.height = TH; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); tiles.forEach((o, i) => x.drawImage(o, i * (TW + 8), 0)); return c.toDataURL(); }, proto);
const before = await shots(false), after = await shots(true);
console.log(JSON.stringify(g.errs));
await g.close();
const { chromium } = await import('playwright');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}); const p = await b.newPage();
const png = await p.evaluate(async us => { const im = await Promise.all(us.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
  const c = document.createElement('canvas'); c.width = im[0].width; c.height = im[0].height * 2 + 8; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); im.forEach((i, j) => x.drawImage(i, 0, j * (i.height + 8))); return c.toDataURL(); }, [before, after]);
fs.writeFileSync(path.join(OUT, 'climb-net.png'), Buffer.from(png.split(',')[1], 'base64')); await b.close();
