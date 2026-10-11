// Session 743 — the climb up a boarding net (Michael's A on #237): the body is held on the net, .35 off the planking, rising
// to the deck's height by four-fifths of the 0.8 s climb, then swings in over the rail; in third person it faces the hull and
// climbs hand over hand (three reaches), the knees stepping up the mesh. Writes docs/prototypes/climb-built.png (a quarter, a
// half and nine-tenths of the way up, from 4.2 off her side).
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'prototypes');
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const sea = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  let sx = null, sz = null; for (let r = 300; r < 3000 && sx === null; r += 30) for (let a = 0; a < 6.28; a += .3) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if ([[0, 0], [40, 0], [-40, 0], [0, 40], [0, -40], [40, 40]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -5)) { sx = x; sz = z; break; } }
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: {} }; WORLD.spawnShip(sx, sz, 0.7); forceTime(11); thirdPerson = true;
  return { ok: sx !== null }; });
check('open sea, and your sloop on it', sea.ok, sea);

// a climb from a point in the hull's frame, ticked at 1/60 with the third person's body updated each tick; every tick's
// place in the hull's frame, and the body's pose at a quarter, a half and nine-tenths
const climb = (lx, lz, look) => page.evaluate(([lx, lz, look]) => {
  const m = WORLD.ship.mesh, W = WORLD.ship.W; m.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(m.matrixWorld).invert();
  const p = new THREE.Vector3(lx, 0, lz).applyMatrix4(m.matrixWorld); px = p.x; pz = p.z; jumpY = SWIM_Y; velY = 0; pitch = .1;
  const q = new THREE.Vector3(look[0], .6, look[1]).applyMatrix4(m.matrixWorld); yaw = Math.atan2(-(q.x - px), -(q.z - pz));
  const side = Math.sign(lx); startClimb(m, W, side, null);
  const st = { moving: false, sprinting: false, roll: null }, ticks = [], poses = {};
  for (let i = 0; i < 60 && climbing(); i++) { WORLD.tick(1 / 60, performance.now()); m.updateMatrixWorld(true); inv.copy(m.matrixWorld).invert();
    st.camY = jumpY + 1.6; st.now = performance.now() + i * 16; tpUpdate(1 / 60, st);
    const l = new THREE.Vector3(px, DECK_Y, pz).applyMatrix4(inv); const cp = climbPose();
    ticks.push({ u: cp ? +cp.u.toFixed(3) : 1, lx: +(side * l.x).toFixed(3), lz: +l.z.toFixed(3), y: +(jumpY - DECK_Y).toFixed(3) });
    const R = TP.rig; if (cp) for (const [k, a] of [['q', .25], ['a', .42], ['h', .55], ['n', .9]]) if (!poses[k] && cp.u >= a) {
      const f = new THREE.Vector3(Math.sin(R.root.rotation.y), 0, Math.cos(R.root.rotation.y)), c = new THREE.Vector3(0, 0, l.z).applyMatrix4(m.matrixWorld).sub(new THREE.Vector3(px, 0, pz)).normalize();
      poses[k] = { u: +cp.u.toFixed(2), shL: +R.shL.rotation.x.toFixed(2), shR: +R.shR.rotation.x.toFixed(2), thL: +R.thighL.rotation.x.toFixed(2), thR: +R.thighR.rotation.x.toFixed(2),
        knL: +R.kneeL.rotation.x.toFixed(2), head: +R.head.rotation.x.toFixed(2), facesHull: +f.dot(c).toFixed(3) }; } }
  const l = new THREE.Vector3(px, 0, pz).applyMatrix4(inv);
  return { W, ticks, poses, done: !climbing(), onDeck: onDeck(), lx: +(side * l.x).toFixed(2), lz: +l.z.toFixed(2), msg: document.getElementById('msg').textContent }; }, [lx, lz, look]);

const W = await page.evaluate(() => WORLD.ship.W);
const a = await climb(W / 2 + .5, .4, [W / 2, 0]);
const on = a.ticks.filter(t => t.u >= .15 && t.u <= .8);
console.log(JSON.stringify(a.poses), JSON.stringify(a.ticks.filter((t, i) => i % 6 === 0)));
check(`from the water: boarded at the rail (${a.lx} across, ${a.lz} along) in ${a.ticks.length} ticks`, a.done && a.onDeck && Math.abs(a.lx - (W / 2 - .8)) < .15 && Math.abs(a.lz) < .2 && /You climb aboard/.test(a.msg), a);
check(`held on the net from .15 to .8 of the climb: ${on.length} ticks, ${Math.min(...on.map(t => t.lx)).toFixed(2)}–${Math.max(...on.map(t => t.lx)).toFixed(2)} out from her middle (her side at ${(W / 2).toFixed(2)})`,
  on.length > 30 && on.every(t => Math.abs(t.lx - (W / 2 + .38)) < .05 && Math.abs(t.lz - .4) < .02));
check('never inside the planking before the rail: out from her side through the first four-fifths', a.ticks.filter(t => t.u < .8).every(t => t.lx > W / 2 + .3));
const rise = on.map(t => t.y);
check(`rising evenly on the net, ${rise[0]} to ${rise[rise.length - 1]} by the deck`, rise.every((y, i) => !i || y >= rise[i - 1]) && Math.abs(rise[rise.length - 1] - .1) < .03);
const over = a.ticks.filter(t => t.u > .8);
check(`over the rail in the last fifth, up to ${Math.max(...over.map(t => t.y)).toFixed(2)} over the deck`, over.length >= 8 && Math.max(...over.map(t => t.y)) > .5);
const P = a.poses;
check(`hand over hand: the shoulders up (${P.q.shL}/${P.q.shR}, half a reach on ${P.a.shL}/${P.a.shR}) and alternating`, [P.q, P.a, P.h].every(p => p.shL < -1.9 && p.shR < -1.9) && Math.sign(P.q.shL - P.q.shR) !== Math.sign(P.a.shL - P.a.shR), P);
check(`the knees step up the net (thighs ${P.q.thL}/${P.q.thR}, knee ${P.q.knL}) and the head is tipped up (${P.q.head})`, P.q.thL < -.5 && P.q.thR < -.5 && P.q.knL > .9 && P.q.head < -.2, P);
check(`the body faces the hull on the net (${P.q.facesHull}, ${P.h.facesHull}, ${P.n.facesHull})`, [P.q, P.h, P.n].every(p => p.facesHull > .95), P);

// from 2.6 off her other side, looking at the net: carried to the net in the first .15, not a straight line through the hull
const b = await climb(-(W / 2 + 2.6), .4, [-W / 2, 0]);
const bOn = b.ticks.filter(t => t.u >= .16 && t.u <= .8);
check(`from 2.6 off: on the net by .16 of the climb and boarded at the rail (${b.lx} across)`, b.done && b.onDeck && Math.abs(b.lx - (W / 2 - .8)) < .15 && bOn.every(t => Math.abs(t.lx - (W / 2 + .38)) < .05), b.ticks.slice(0, 12));

// after the climb the body is upright on her deck: the next tick's pose is the standing one again
const after = await page.evaluate(() => { const st = { moving: false, sprinting: false, roll: null, camY: jumpY + 1.6 }; for (let i = 0; i < 30; i++) { st.now = performance.now() + i * 16; tpUpdate(1 / 60, st); }
  const R = TP.rig; return { shL: +R.shL.rotation.x.toFixed(2), thL: +R.thighL.rotation.x.toFixed(2), ry: +(R.root.rotation.y - yaw - Math.PI).toFixed(3) }; });
check(`standing again after the climb (shoulder ${after.shL}, thigh ${after.thL}) and turned with the view`, after.shL > -1 && after.thL > -.4 && Math.abs(after.ry) < 1e-3, after);

// the picture: three moments of a climb from the water
const shot = await page.evaluate(() => {
  const m = WORLD.ship.mesh, W = WORLD.ship.W; m.updateMatrixWorld(true); const w = (lx, y, lz) => new THREE.Vector3(lx, y, lz).applyMatrix4(m.matrixWorld);
  const s0 = w(W / 2 + .6, 0, 0); px = s0.x; pz = s0.z; jumpY = SWIM_Y; velY = 0; const h = w(0, 0, 0); yaw = Math.atan2(-(h.x - px), -(h.z - pz)); pitch = .15;
  startClimb(m, W, 1, null); const cv = REN.domElement, TW = 420, TH = 420, tiles = [], cam = new THREE.PerspectiveCamera(45, 1, .1, 300);
  const st = { moving: false, sprinting: false, roll: null }; let i = 0;
  for (const u of [.25, .55, .9]) { while (CLIMB && CLIMB.t / .8 < u) { WORLD.tick(1 / 60, performance.now()); st.camY = jumpY + 1.6; st.now = performance.now() + (i++) * 16; tpUpdate(1 / 60, st); }
    TP.rig.root.visible = true; const eye = w(W / 2 + 4.2, 1.4, 2.6); cam.position.copy(eye); cam.lookAt(w(W / 2 - .2, 1.0, 0)); WORLD.scene.updateMatrixWorld(true);
    const fog = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = fog;
    const o = document.createElement('canvas'); o.width = TW; o.height = TH; const s = Math.min(cv.width, cv.height); o.getContext('2d').drawImage(cv, (cv.width - s) / 2, (cv.height - s) / 2, s, s, 0, 0, TW, TH); tiles.push(o); }
  CLIMB = null; const c = document.createElement('canvas'); c.width = TW * 3 + 16; c.height = TH; const x = c.getContext('2d'); x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); tiles.forEach((o, j) => x.drawImage(o, j * (TW + 8), 0)); return c.toDataURL(); });
fs.writeFileSync(path.join(OUT, 'climb-built.png'), Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
stop(); await g.close();
