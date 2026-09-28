// node docs/prototypes/secondary/shoot.mjs -> docs/prototypes/secondary-*.png
// Backlog H.3, owed since Session 153: secondary motion — cloaks and hair that swing. Today a cloak is a rigid shell on
// the spine and a plait or a tail of hair is rigid on the head, so they turn with the body and never move of their own.
// The prototype builds a copy of the game with two extra bones (index.html itself is not changed): a cloak bone at the
// shoulders and a hair bone at the nape, each driven as a damped pendulum from how its pivot moves in the world: it
// lags when the body starts or stops, streams back with the pace, swings out on a turn, and settles when you stand.
// Rows: today (the same person, pendulums off) and the proposal. Columns: standing, walking, running, running through a
// turn to the left, just stopped, settled.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..', '..');
let src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const patch = (a, b) => { if (!src.includes(a)) throw new Error('patch missed: ' + a.slice(0, 60)); src = src.replace(a, b); };
// the cloak hangs from a bone at the shoulders, not from the spine, in two halves hinged at the middle so it can bend
patch("if(g.cloak){part(SK.cyl(.17*bw,.27*bw,.62,14,1,true,Math.PI/2+.25,Math.PI-.5),mixC(cloth,0x000000,.3),spine,0,.02,-.005).scale.z=.8;",
      "if(g.cloak){const cb=bone('cloak',spine,0,.33,-.1),cb2=bone('cloak2',cb,0,-.31,-.08),cc=mixC(cloth,0x000000,.3);"+
      "part(SK.cyl(.17*bw,.225*bw,.34,14,2,true,Math.PI/2+.25,Math.PI-.5),cc,cb,0,-.17,.095).scale.z=.8;part(SK.cyl(.215*bw,.27*bw,.34,14,2,true,Math.PI/2+.25,Math.PI-.5),cc,cb2,0,-.14,.175).scale.z=.8;");
// a plait can hang from its own bone (its points are still given in the head's frame)
patch("const plait=(pts,r,col)=>{const n=pts.length-1,per=4;let last=null;",
      "const plait=(pts,r,col,pb)=>{const n=pts.length-1,per=4;let last=null;const PB=pb||head;if(pb)pts=pts.map(p=>[p[0]-pb.position.x,p[1]-pb.position.y,p[2]-pb.position.z]);");
patch("const lobe=part(SK.ball(rr,6,5),col||hair,head,x+side,y,z);", "const lobe=part(SK.ball(rr,6,5),col||hair,PB,x+side,y,z);");
patch("part(SK.torus(last[3]*.8,.006,4,8),trim,head,last[0],last[1]-.012,last[2]).rotation.x=Math.PI/2;", "part(SK.torus(last[3]*.8,.006,4,8),trim,PB,last[0],last[1]-.012,last[2]).rotation.x=Math.PI/2;");
patch("part(SK.cone(last[3]*.85,.05,6),col||hair,head,last[0],last[1]-.045,last[2]).rotation.x=Math.PI;};", "part(SK.cone(last[3]*.85,.05,6),col||hair,PB,last[0],last[1]-.045,last[2]).rotation.x=Math.PI;};");
patch("if(st==='braid')plait([[0,.1,-.135],[0,-.02,-.16],[0,-.15,-.15],[0,-.27,-.13],[0,-.35,-.12]],.024);",
      "if(st==='braid')plait([[0,.1,-.135],[0,-.02,-.16],[0,-.15,-.15],[0,-.27,-.13],[0,-.35,-.12]],.024,null,bone('hairB',head,0,.1,-.135));");
patch("if(st==='tied')part(SK.cone(.035,.17,8),hair,head,0,.03,-.145).rotation.x=Math.PI+.35;",
      "if(st==='tied')part(SK.cone(.035,.17,8),hair,bone('hairB',head,0,.1,-.12),0,-.07,-.025).rotation.x=Math.PI+.35;");
patch("plait([[0,.26,-.1],[0,.2,-.16],[0,.12,-.17],[0,.04,-.16]],.022);", "plait([[0,.26,-.1],[0,.2,-.16],[0,.12,-.17],[0,.04,-.16]],.022,null,bone('hairB',head,0,.26,-.1));");
const tmp = path.join(ROOT, 'tests', 'tmp'); fs.mkdirSync(tmp, { recursive: true });
const pat = path.join(tmp, 'secondary.html'); fs.writeFileSync(pat, src);

const g = await boot({ src: pat }); const { page } = g;
await g.intoWorld();
const out = await page.evaluate(() => {
  const cv = REN.domElement, W = cv.width, H = cv.height;
  const bx = px + 40, bz = pz + 40, y0 = WORLD.worldH(bx, bz);
  // the pendulum: angles in the body's own frame (pitch: the tip swung back; roll: the tip out to the body's +x)
  const G = 9.8;
  const PEND = { cloak: { L: .3, c: 3.4, drag: .3, lo: -.05, hi: .85, side: .45 }, cloak2: { L: .2, c: 3, drag: .2, lo: 0, hi: .6, side: .35 }, hairB: { L: .26, c: 2.2, drag: .12, lo: -.5, hi: 1.1, side: .8 } };
  const swing = (rig, dt, on) => {
    const rq = rig.root.getWorldQuaternion(new THREE.Quaternion()).invert(), ry = rig.root.rotation.y;
    const fw = [Math.sin(ry), Math.cos(ry)], sx = [Math.cos(ry), -Math.sin(ry)];
    for (const k in PEND) { const b = rig.B[k]; if (!b) continue; const P = PEND[k], s = rig.root.scale.x, L = P.L * s;
      const st = rig.sw[k] || (rig.sw[k] = { p: 0, vp: 0, r: 0, vr: 0, last: null, vel: null });
      rig.root.updateMatrixWorld(true); const w = b.getWorldPosition(new THREE.Vector3());
      const v = st.last ? w.clone().sub(st.last).divideScalar(dt) : new THREE.Vector3(); const a = st.vel ? v.clone().sub(st.vel).divideScalar(dt) : new THREE.Vector3();
      st.last = w; st.vel = v; a.clampLength(0, 40);
      const vf = v.x * fw[0] + v.z * fw[1], af = a.x * fw[0] + a.z * fw[1], ax = a.x * sx[0] + a.z * sx[1], gy = G + a.y;
      st.vp += (-gy / L * Math.sin(st.p) + af / L * Math.cos(st.p) + P.drag * vf * Math.abs(vf) / L - P.c * st.vp) * dt; st.p += st.vp * dt;
      st.vr += (-gy / L * Math.sin(st.r) - ax / L * Math.cos(st.r) - P.c * st.vr) * dt; st.r += st.vr * dt;
      // what the parent bone has already turned, in the body's frame, comes off: the pendulum hangs in the world
      const pq = b.parent.getWorldQuaternion(new THREE.Quaternion()).premultiply(rq), pe = new THREE.Euler().setFromQuaternion(pq, 'XZY');
      if (!on) { b.rotation.set(0, 0, 0); continue; }
      b.rotation.x = Math.max(P.lo, Math.min(P.hi, st.p - pe.x)); b.rotation.z = Math.max(-P.side, Math.min(P.side, st.r - pe.z)); } };
  const mk = (def, nation, over) => { const gn = personGenome(def, { nation, key: 'proto' }); Object.assign(gn, over); const rig = buildPerson(gn, { noLod: true }); rig.sw = {}; rig.root.visible = true; scene.add(rig.root); return rig; };
  const cam = new THREE.PerspectiveCamera(24, W / H, .05, 300);
  const people = [
    ['mark', { name: 'Ragnhild', role: 'villager', female: true }, { cloak: true, style: 'braid', hat: 'none', dress: true }],
    ['mark', { name: 'Torvald', role: 'villager', female: false }, { cloak: true, style: 'warrior', hat: 'none', beard: 'full' }],
    ['gatelands', { name: 'Aoife', role: 'villager', female: true }, { cloak: true, style: 'tied', hat: 'none', dress: false }]];
  // the script: stand 1 s, walk 1.5 s at 1.3, run 2 s at 3.8, stop dead, stand 2 s; a turn to the left while running
  const T = 6.6, dt = 1 / 60, snaps = [.9, 2.3, 3.25, 4.2, 4.62, 6.5], names = ['standing', 'walking', 'running', 'running, turning left', 'just stopped', 'settled'];
  const pace = t => t < 1 ? 0 : t < 1.3 ? 1.3 * (t - 1) / .3 : t < 2.5 ? 1.3 : t < 2.8 ? 1.3 + 2.5 * (t - 2.5) / .3 : t < 4.5 ? 3.8 : 0;
  const tiles = []; const peak = {};
  for (const [nation, def, over] of people) for (const on of [false, true]) {
    const rig = mk(def, nation, over); let x = bx, z = bz, ry = Math.PI / 2, t = 0, mx = 0;
    const row = [];
    for (let f = 0; f <= T / dt; f++) { t = f * dt; const v = pace(t); if (t > 3.3 && t < 4.3) ry += .9 * dt; x += Math.sin(ry) * v * dt; z += Math.cos(ry) * v * dt;
      rig.root.position.set(x, WORLD.worldH(x, z), z); rig.root.rotation.y = ry; rig.root.updateMatrixWorld(true);
      tickPeople(dt, 1e7 + t * 1000); swing(rig, dt, on); if (rig.B.cloak) mx = Math.max(mx, rig.B.cloak.rotation.x);
      if (snaps.some(s => Math.abs(s - t) < dt / 2)) { const hy = rig.root.position.y + .95 * rig.root.scale.x;
        // from the side and a little behind, so a cloak streaming back reads
        const ca = ry + Math.PI * .6; cam.position.set(x + Math.sin(ca) * 4.2, hy + .6, z + Math.cos(ca) * 4.2); cam.lookAt(x, hy - .05, z);
        scene.updateMatrixWorld(true); REN.render(scene, cam);
        const o = document.createElement('canvas'); o.width = 300; o.height = 380; o.getContext('2d').drawImage(cv, W / 2 - H * .395, 0, H * .79, H, 0, 0, 300, 380); row.push(o); } }
    if (on) peak[def.name] = +mx.toFixed(2); scene.remove(rig.root); tiles.push({ who: def.name, on, row }); }
  const shots = []; for (let p = 0; p < people.length; p++) {
    const c = document.createElement('canvas'); c.width = 300 * 6; c.height = 380 * 2 + 30; const x2 = c.getContext('2d'); x2.fillStyle = '#1a1612'; x2.fillRect(0, 0, c.width, c.height);
    x2.font = '18px serif'; x2.fillStyle = '#e8dcc0'; names.forEach((n, i) => x2.fillText(n, i * 300 + 10, 21));
    [0, 1].forEach(r => { tiles[p * 2 + r].row.forEach((o, i) => x2.drawImage(o, i * 300, 30 + r * 380)); x2.fillText(r ? 'proposed' : 'today', 8, 30 + r * 380 + 370); });
    // fewer shades of each channel (steps of 12): the grass's noise otherwise makes each picture 1.7 MB
    const id = x2.getImageData(0, 0, c.width, c.height), d = id.data; for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] / 12) * 12; x2.putImageData(id, 0, 0);
    shots.push(c.toDataURL()); }
  return { shots, peak }; });
out.shots.forEach((u, i) => fs.writeFileSync(path.join(here, '..', 'secondary-' + (i + 1) + '.png'), Buffer.from(u.split(',')[1], 'base64')));
console.log(JSON.stringify(out.peak)); console.log('errors', g.errs); await g.close();
