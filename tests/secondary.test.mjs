// Cloaks and hair that swing (Session 267, H.3, Michael's A on Session 242): the cloak hangs from its own bones in two
// hinged halves and the back hair from a bone at the nape; each is a damped pendulum driven by how its pivot moves, so the
// cloak streams back at a run, lags at a stop, and settles when you stand.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const x0 = px + 40, z0 = pz + 40; const out = {};
  const mk = (def, nation, over) => { const gn = personGenome(def, { nation, key: 'sec' }); Object.assign(gn, over); const rig = buildPerson(gn, { noLod: true }); rig.root.visible = true; scene.add(rig.root); rig.root.position.set(x0, WORLD.worldH(x0, z0), z0); rig.root.rotation.y = 0; return rig; };
  const rig = mk({ name: 'Ragnhild', role: 'villager', female: true }, 'mark', { cloak: true, style: 'braid', hat: 'none', dress: true });
  out.bones = ['cloak', 'cloak2', 'hairB'].filter(k => rig.B[k]);
  const dt = 1 / 60; let t = 1000; const step = v => { rig.root.position.z += v * dt; rig.root.position.y = WORLD.worldH(rig.root.position.x, rig.root.position.z); t += 1000 * dt; tickPeople(dt, t); };
  for (let i = 0; i < 60; i++) step(0); out.rest = +rig.B.cloak.rotation.x.toFixed(3);
  let peak = 0, hairPeak = 0; for (let i = 0; i < 120; i++) { step(3.8); peak = Math.max(peak, rig.B.cloak.rotation.x); hairPeak = Math.max(hairPeak, Math.abs(rig.B.hairB.rotation.x)); } out.run = +rig.B.cloak.rotation.x.toFixed(3); out.peak = +peak.toFixed(3); out.hairPeak = +hairPeak.toFixed(3);
  for (let i = 0; i < 12; i++) step(0); out.stopped = +rig.B.cloak.rotation.x.toFixed(3);
  for (let i = 0; i < 240; i++) step(0); out.settled = +rig.B.cloak.rotation.x.toFixed(3); out.lower = +rig.B.cloak2.rotation.x.toFixed(3);
  // a picture at a run, from the side
  for (let i = 0; i < 90; i++) step(3.8); forceTime(12); const cv = REN.domElement, cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100); const p = rig.root.position;
  cam.position.set(p.x + 4.5, p.y + 1.1, p.z - .3); cam.lookAt(p.x, p.y + .9, p.z); scene.updateMatrixWorld(true); const f = scene.fog; scene.fog = null; REN.render(scene, cam); scene.fog = f;
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); out.shot = o.toDataURL(); scene.remove(rig.root); return out; });
fs.writeFileSync('tests/out/secondary.png', Buffer.from(r.shot.split(',')[1], 'base64')); delete r.shot;
console.log(JSON.stringify(r));
check('a cloaked, braided person has the cloak\'s two bones and the back hair\'s', r.bones.join() === 'cloak,cloak2,hairB', r.bones);
check('standing, the cloak hangs at rest (under .05)', Math.abs(r.rest) < .05, r);
check('running, the cloak streams back (past .3, within its clamp of .85) and the plait swings', r.peak > .3 && r.peak <= .8501 && r.hairPeak > .05, r);
check('stopped, it swings on, then settles back to rest (under .05) standing', Math.abs(r.settled) < .05 && Math.abs(r.lower) < .05, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
