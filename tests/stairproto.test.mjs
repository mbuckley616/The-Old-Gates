// PROTOTYPE pictures for a DECISION on the dungeon's stairs (Michael, 5 Oct: "staircases are ugly and don't match the style at all").
// Not a test. Today's spiral is pale plank boxes round a smooth post, inside four flat near-black planes. The prototype is a stone
// newel stair in the dungeon's own stone: wedge treads fanned round a coursed newel, each tread's underside stepped, the shaft's
// walls laid in courses of the shell's stone, a rope handrail on iron brackets at the wall, a stone landing.
import { boot } from './lib/game.mjs';
const OUT = process.env.SHOT_DIR || 'docs/prototypes';
const g = await boot(); const { page } = g;
await g.intoWorld();
let info = null;
for (let seed = 4021; seed < 4060 && !info; seed++) {
  await page.evaluate((seed) => { const p = Object.assign({}, PORTALS[0], { theme: 'ruins', seed, size: 'large', interior: 'cave', zone: 'world', tutorial: false }); goToDungeon(p); }, seed);
  for (let k = 0; k < 20 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(300);
  info = await page.evaluate((seed) => { const f = FOOTHOLDS.find(f => f.kind === 'spiral'); return f ? { seed, cx: f.cx, cz: f.cz, a0: f.a0 } : null; }, seed);
}
console.log(JSON.stringify(info));
await page.evaluate(() => { ENEMIES.forEach(e => { e.dead = true; if (e.mesh) e.mesh.visible = false; }); PHP = 1e6; if (typeof vmSword !== 'undefined' && vmSword) vmSword.visible = false; if (typeof vmArmR !== 'undefined' && vmArmR) vmArmR.visible = false; });
const built = await page.evaluate(() => {
  const f = FOOTHOLDS.find(f => f.kind === 'spiral'), { cx, cz, a0, turns } = f, N = 30, Y = FLOOR2_Y, rise = Math.abs(Y) / N, th = THEME_DEF.ruins;
  const old = []; dScene.children.forEach(o => { if (o.isMesh && (o.position.x || o.position.z) && Math.hypot(o.position.x - cx, o.position.z - cz) < 1.35) old.push(o); });
  const P = new THREE.Group(); const stone = new THREE.Color(th.wallCol).multiplyScalar(2.6), wallC = new THREE.Color(th.wallCol).multiplyScalar(2.1);
  const jit = (c, k) => c.clone().multiplyScalar(1 + (Math.random() - .5) * k);
  const lam = c => new THREE.MeshLambertMaterial({ color: c }); let tris = 0; const add = (geo, mat, setup) => { const m = new THREE.Mesh(geo, mat); if (setup) setup(m); P.add(m); tris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3; return m; };
  // the treads: a wedge of stone from the newel to the wall, .2 thick so the underside steps down the helix; a small bevel at the nosing
  const span = turns * Math.PI * 2 / N;
  for (let i = 0; i <= N; i++) { const t = i / N, ang = a0 + t * turns * Math.PI * 2, y = t * Y;
    const sh = new THREE.Shape(), r0 = .2, r1 = 1.0, h = span * .56; sh.moveTo(r0 * Math.cos(-h), r0 * Math.sin(-h)); sh.absarc(0, 0, r1, -h, h, false); sh.lineTo(r0 * Math.cos(h), r0 * Math.sin(h)); sh.absarc(0, 0, r0, h, -h, true);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: .2, bevelEnabled: true, bevelSize: .018, bevelThickness: .018, bevelSegments: 1, curveSegments: 6 }); geo.rotateX(-Math.PI / 2);
    add(geo, lam(jit(stone, .16)), m => { m.position.set(cx, y - .218, cz); m.rotation.y = -ang; });
    // the newel: a drum of stone per tread, its radius and colour a little off the last, so it reads as courses
    add(new THREE.CylinderGeometry(.205 + (i % 2) * .008, .205 + (i % 2) * .008, rise + .002, 12), lam(jit(stone.clone().multiplyScalar(.9), .14)), m => m.position.set(cx, y + rise / 2, cz)); }
  add(new THREE.CylinderGeometry(.24, .21, .1, 12), lam(stone), m => m.position.set(cx, .05 + .0, cz));
  // the shaft: each wall a plane cut into blocks in courses, every block its own shade of the shell's stone, every other course offset
  const top = 0, bot = Y + FLOOR_HEIGHT - .1, H = top - bot;
  for (const [x, z, ry] of [[cx, cz - 1, 0], [cx, cz + 1, Math.PI], [cx - 1, cz, Math.PI / 2], [cx + 1, cz, -Math.PI / 2]]) {
    const rows = Math.round(H / .32), cols = 5, geo = new THREE.PlaneGeometry(2, H, cols * 2, rows).toNonIndexed(), pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
    for (let v = 0; v < pos.count; v += 3) { const mx = (pos.getX(v) + pos.getX(v + 1) + pos.getX(v + 2)) / 3, my = (pos.getY(v) + pos.getY(v + 1) + pos.getY(v + 2)) / 3;
      const row = Math.floor((my + H / 2) / (H / rows)), blk = Math.floor((mx + 1 + (row % 2) * .2) / .4), hsh = Math.abs(Math.sin(row * 12.9898 + blk * 78.233 + x * 3.1) * 43758.5453) % 1, c = wallC.clone().multiplyScalar(.82 + hsh * .36);
      for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (v + k) * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); add(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), m => { m.position.set(x, bot + H / 2, z); m.rotation.y = ry; }); }
  // the rope handrail at the wall, on an iron bracket every third tread
  const pts = []; for (let i = 0; i <= N * 2; i++) { const t = i / (N * 2), ang = a0 + t * turns * Math.PI * 2; pts.push(new THREE.Vector3(cx + Math.cos(ang) * .9, t * Y + .82, cz + Math.sin(ang) * .9)); }
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 4, .022, 6, false), lam(0x7a6040));
  const iron = lam(0x2a2826);
  for (let i = 0; i <= N; i += 3) { const t = i / N, ang = a0 + t * turns * Math.PI * 2, y = t * Y + .82, c = Math.cos(ang), s = Math.sin(ang), d = 1 / Math.max(Math.abs(c), Math.abs(s)), L = d - .9;
    add(new THREE.BoxGeometry(L, .03, .03), iron, m => { m.position.set(cx + c * (.9 + L / 2), y - .03, cz + s * (.9 + L / 2)); m.rotation.y = -ang; });
    add(new THREE.TorusGeometry(.035, .008, 4, 8), iron, m => { m.position.set(cx + c * .9, y - .015, cz + s * .9); m.rotation.y = -ang + Math.PI / 2; }); }
  // the landing: one slab of the floor's stone, a step's height, its edge chamfered
  const lm = old.find(o => o.geometry && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.height === .12);
  if (lm) { const p = lm.geometry.parameters; add(SK.rbox(p.width, .14, p.depth, .025, 2), lam(jit(stone, .1)), m => m.position.set(lm.position.x, -.07, lm.position.z)); }
  dScene.add(P); P.visible = false; window._proto = { P, old, f }; return { old: old.length, tris: Math.round(tris), parts: P.children.length }; });
console.log('built', JSON.stringify(built));
const shot = async (file, which, view) => {
  await page.evaluate(([which, view]) => { const { P, old, f } = window._proto; P.visible = which === 'new'; old.forEach(o => o.visible = which === 'old');
    const a = f.a0, c = Math.cos(a), s = Math.sin(a);
    if (view === 'above') { px = f.cx + c * 3.2; pz = f.cz + s * 3.2; yaw = Math.atan2(c, s); pitch = -.5; }
    if (view === 'down') { px = f.cx + c * 1.45; pz = f.cz + s * 1.45; yaw = Math.atan2(c, s); pitch = -1.15; jumpY = 0; }
    if (view === 'up') { px = f.cx + c * 2.6 + s * .6; pz = f.cz + s * 2.6 - c * .6; yaw = Math.atan2(c * 2.6 + s * .6, s * 2.6 - c * .6); pitch = .32; jumpY = FLOOR2_Y; } }, [which, view]);
  await g.spin(view === 'up' ? 1 : 20); await page.evaluate((view) => { if (view === 'up') jumpY = FLOOR2_Y; }, view); await g.frames(3);
  console.log(file, JSON.stringify(await page.evaluate(() => ({ px: +px.toFixed(2), pz: +pz.toFixed(2), jumpY: +jumpY.toFixed(2) }))));
  await page.screenshot({ path: `${OUT}/${file}` });
};
for (const v of ['above', 'up']) { await shot(`dungeon-stair-today-${v}.png`, 'old', v); await shot(`dungeon-stair-proto-${v}.png`, 'new', v); }
console.log('errs', JSON.stringify(g.errs));
await g.close();
