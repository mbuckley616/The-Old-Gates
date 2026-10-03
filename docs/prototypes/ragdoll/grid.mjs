// Session 415, H (Michael, 1 Oct, the control room): "Is it possible to have ragdoll for defeated enemies? Having them snap
// to the ground sideways feels stiff." Three ways a human foe goes down, on a Bandit built by buildFoe on open ground,
// struck from the player's side: A today (killE / killZoneEnemy turn the whole figure 90° on z in one frame), B a canned
// fall (the body tips back from the feet, knees giving, arms thrown up, with a small bounce), C a ragdoll (a particle at
// every joint of the seventeen bones, held at the bones' lengths, the torso and head kept rigid, the knees and elbows
// bending only their own way, gravity, the blow's push, the ground's height and friction; the bones are then turned to
// the particles). Rows A–C are filmstrips, row D is where C leaves six different deaths. Nothing here changes the game.
// Run from the repo root: node docs/prototypes/ragdoll/grid.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.frames(30); // the near terrain refines over the first frames; before them the ground drawn sits off activeTerrainH by up to .6
const r = await page.evaluate(() => {
  forceTime(11);
  const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const V = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
  // a spot ahead of the player
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), O = V(px + fx * 4, 0, pz + fz * 4); O.y = activeTerrainH(O.x, O.z);
  const hit = V(fx, 0, fz).normalize(), side = V(-hit.z, 0, hit.x);
  const H = (x, z) => activeTerrainH(x, z);
  const make = () => { const rig = buildFoe('Bandit', 1234, 5678); PEOPLE_RIGS.delete(rig); rig.mesh.frustumCulled = false; const G = new THREE.Group(); G.add(rig.root); scene.add(G);
    G.position.copy(O); rig.root.rotation.y = Math.atan2(-hit.x, -hit.z); G.updateMatrixWorld(true); return { rig, G }; };
  const kill = ({ rig, G }) => { scene.remove(G); G.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); };
  const cv = REN.domElement, cam = new THREE.PerspectiveCamera(34, 1, .05, 80), tiles = [];
  const snap = (label, at, from) => { cam.aspect = cv.width / cv.height; cam.updateProjectionMatrix();
    cam.position.copy(at).add(from); cam.lookAt(at); REN.render(scene, cam);
    const s = Math.min(cv.width, cv.height), T = document.createElement('canvas'); T.width = T.height = 200; T.getContext('2d').drawImage(cv, (cv.width - s) / 2, (cv.height - s) / 2, s, s, 0, 0, 200, 200);
    const x = T.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, 200, 20); x.fillStyle = '#f0e6c8'; x.font = '13px serif'; x.fillText(label, 5, 14); tiles.push(T); };
  const sideCam = () => V().copy(side).multiplyScalar(2.9).add(V(0, 1.1, 0)).add(V().copy(hit).multiplyScalar(-.3));
  const at = () => V().copy(O).add(V(0, .4, 0)).add(V().copy(hit).multiplyScalar(.4));
  const TIMES = [0, .12, .25, .4, .7, 1.6];

  // ── A: today ──
  { const F = make(); const m0 = F.rig.mesh.material; for (const t of TIMES) { F.G.rotation.z = t > 0 ? Math.PI / 2 : 0; F.G.position.y = O.y + (t > 0 ? .15 : 0); if (t > 0 && F.rig.mesh.material === m0) { F.rig.mesh.material = m0.clone(); F.rig.mesh.material.color.multiplyScalar(.35); } snap('A ' + t.toFixed(2) + ' s', at(), sideCam()); } kill(F); }

  // ── B: a canned fall back from the feet ──
  { const F = make(), B = F.rig.B, R = F.rig.root; const pivot = V().copy(side);
    const pose = t => { const k = Math.min(1, t / .55), fall = k * k, land = t > .55 ? Math.exp(-(t - .55) * 9) * Math.sin((t - .55) * 22) * .06 : 0;
      F.G.quaternion.setFromAxisAngle(pivot, -(fall * Math.PI / 2 * .97) + land);
      const kb = Math.min(1, t / .3); B.knL.rotation.x = .5 * kb; B.knR.rotation.x = .7 * kb; B.thL.rotation.x = -.35 * kb; B.thR.rotation.x = -.5 * kb;
      B.shL.rotation.set(-2.2 * k, 0, .4 * k); B.shR.rotation.set(-2.0 * k, 0, -.5 * k); B.elL.rotation.x = -.4 * k; B.elR.rotation.x = -.6 * k;
      B.spine.rotation.x = -.2 * k; B.head.rotation.x = .5 * Math.min(1, t / .2) - .7 * fall; };
    for (const t of TIMES) { pose(t); snap('B ' + t.toFixed(2) + ' s', at(), sideCam()); } kill(F); }

  // ── C: the ragdoll ──
  const ragdoll = (F, push, rnd) => {
    const B = F.rig.B; F.G.updateMatrixWorld(true);
    // the joints: [name, bone, local offset (a point on that bone), parent particle]
    const J = [['hips', B.hips], ['spine', B.spine], ['neck', B.neck], ['head', B.head], ['top', B.head, V(0, .22, .02)],
      ['shL', B.shL], ['elL', B.elL], ['wrL', B.wrL], ['hdL', B.wrL, V(0, -.08, 0)], ['shR', B.shR], ['elR', B.elR], ['wrR', B.wrR], ['hdR', B.wrR, V(0, -.08, 0)],
      ['thL', B.thL], ['knL', B.knL], ['anL', B.anL], ['toL', B.anL, V(0, -.05, .1)], ['thR', B.thR], ['knR', B.knR], ['anR', B.anR], ['toR', B.anR, V(0, -.05, .1)]];
    const I = {}; const P = J.map(([n, b, off], i) => { I[n] = i; const w = b.localToWorld(off ? off.clone() : V()).sub(O); return { p: w, q: w.clone(), b, off }; });
    const L = (a, b) => [I[a], I[b], P[I[a]].p.distanceTo(P[I[b]].p)];
    const C = [];
    const chain = [['hips', 'spine'], ['spine', 'neck'], ['neck', 'head'], ['head', 'top'], ['shL', 'elL'], ['elL', 'wrL'], ['wrL', 'hdL'], ['elL', 'hdL'], ['shR', 'elR'], ['elR', 'wrR'], ['wrR', 'hdR'], ['elR', 'hdR'],
      ['thL', 'knL'], ['knL', 'anL'], ['anL', 'toL'], ['knL', 'toL'], ['thR', 'knR'], ['knR', 'anR'], ['anR', 'toR'], ['knR', 'toR']];
    chain.forEach(([a, b]) => C.push(L(a, b)));
    // the torso and the head, rigid
    const box = ['hips', 'spine', 'neck', 'shL', 'shR', 'thL', 'thR'];
    for (let i = 0; i < box.length; i++) for (let j = i + 1; j < box.length; j++) C.push(L(box[i], box[j]));
    [['head', 'shL'], ['head', 'shR'], ['top', 'neck'], ['top', 'shL'], ['top', 'shR'], ['head', 'spine']].forEach(([a, b]) => C.push(L(a, b)));
    // the blow: the higher the joint, the harder it is pushed (the body tips from the feet)
    const top = P[I.top].p.y, vel = P.map(o => { const k = Math.max(0, o.p.y / top); return V().copy(push).multiplyScalar(.25 + .75 * k).add(V((rnd() - .5) * .3, (rnd() - .5) * .2, (rnd() - .5) * .3)); });
    // the legs give as the blow lands: the knees go forward (the way the foe faces) and the hips drop
    const face = V(Math.sin(F.rig.root.rotation.y), 0, Math.cos(F.rig.root.rotation.y));
    vel[I.knL].addScaledVector(face, 1.1 + rnd() * .5); vel[I.knR].addScaledVector(face, .8 + rnd() * .5); vel[I.hips].y -= 1.2; vel[I.spine].y -= .8;
    const dt = 1 / 60; P.forEach((o, i) => o.q.copy(o.p).addScaledVector(vel[i], -dt));
    const rad = i => (i === I.top || i === I.head ? .1 : i === I.hips || i === I.spine ? .09 : .045);
    const fwdOf = () => { const x = V().subVectors(P[I.thL].p, P[I.thR].p), y = V().subVectors(P[I.neck].p, P[I.hips].p); return V().crossVectors(x, y).normalize(); };
    const hinge = (a, m, c, sign) => { const f = fwdOf(), A = P[I[a]].p, M = P[I[m]].p, Cc = P[I[c]].p, d = V().subVectors(Cc, A), t = V().subVectors(M, A).dot(d) / Math.max(1e-6, d.lengthSq()),
      foot = V().copy(A).addScaledVector(d, t), off = V().subVectors(M, foot); if (off.dot(f) * sign < 0) { const fl = f.clone().multiplyScalar(off.dot(f)); M.addScaledVector(fl, -2); } };
    const step = () => {
      P.forEach(o => { const v = V().subVectors(o.p, o.q); o.q.copy(o.p); o.p.add(v.multiplyScalar(.995)); o.p.y -= 9.8 * dt * dt; });
      for (let it = 0; it < 10; it++) {
        for (const [a, b, len] of C) { const pa = P[a].p, pb = P[b].p, d = V().subVectors(pb, pa), l = d.length() || 1e-6, k = (l - len) / l * .5; pa.addScaledVector(d, k); pb.addScaledVector(d, -k); }
        hinge('thL', 'knL', 'anL', 1); hinge('thR', 'knR', 'anR', 1); hinge('shL', 'elL', 'wrL', -1); hinge('shR', 'elR', 'wrR', -1);
        P.forEach((o, i) => { const gy = H(O.x + o.p.x, O.z + o.p.z) - O.y + rad(i); if (o.p.y < gy) { o.p.y = gy; o.q.x = o.p.x - (o.p.x - o.q.x) * .55; o.q.z = o.p.z - (o.p.z - o.q.z) * .55; if (o.q.y < o.p.y) o.q.y = o.p.y; } });
      }
    };
    // the bones follow: the pelvis by its frame, then each bone turned to point at its next particle (tpGripL's way)
    const frame = () => { const y = V().subVectors(P[I.neck].p, P[I.hips].p).normalize(), x = V().subVectors(P[I.thL].p, P[I.thR].p); x.addScaledVector(y, -x.dot(y)).normalize();
      return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, V().crossVectors(x, y))); };
    const F0 = frame(), hipsQ0 = B.hips.getWorldQuaternion(new THREE.Quaternion()), hipsOff = V().subVectors(B.hips.getWorldPosition(V()), V().copy(P[I.hips].p).add(O));
    const AIM = [['spine', 'neck'], ['neck', 'head'], ['head', 'top'], ['shL', 'elL'], ['elL', 'wrL'], ['wrL', 'hdL'], ['shR', 'elR'], ['elR', 'wrR'], ['wrR', 'hdR'], ['thL', 'knL'], ['knL', 'anL'], ['anL', 'toL'], ['thR', 'knR'], ['knR', 'anR'], ['anR', 'toR']];
    const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion();
    const apply = () => {
      const d = frame().multiply(F0.clone().invert());
      const hw = V().copy(P[I.hips].p).add(O).add(hipsOff.clone().applyQuaternion(d)); B.hips.parent.updateMatrixWorld(true);
      B.hips.position.copy(B.hips.parent.worldToLocal(hw)); q1.copy(d).multiply(hipsQ0); B.hips.parent.getWorldQuaternion(q2); B.hips.quaternion.copy(q2.invert().multiply(q1)); B.hips.updateMatrixWorld(true);
      for (const [a, c] of AIM) { const o = P[I[a]], t = P[I[c]], b = o.b; b.updateMatrixWorld(true);
        const from = b.getWorldPosition(V()), cur = (t.b === b ? b.localToWorld(t.off.clone()) : t.b.getWorldPosition(V())).sub(from), want = V().copy(t.p).add(O).sub(from);
        if (cur.lengthSq() < 1e-8 || want.lengthSq() < 1e-8) continue;
        q1.setFromUnitVectors(cur.normalize(), want.normalize()); b.getWorldQuaternion(q2); q1.multiply(q2); b.parent.getWorldQuaternion(q2); b.quaternion.copy(q2.invert().multiply(q1)); b.updateMatrixWorld(true); }
    };
    const diag = () => { F.G.updateMatrixWorld(true); return ['hips', 'neck', 'head', 'knL', 'anL', 'wrR'].map(n => { const o = P[I[n]]; const w = o.b.localToWorld(o.off ? o.off.clone() : V()).sub(O); return n + ' p' + o.p.toArray().map(x => x.toFixed(2)) + ' b' + w.toArray().map(x => x.toFixed(2)); }); };
    return { step, apply, P, I, diag };
  };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cost = [];
  { const F = make(), RD = ragdoll(F, V().copy(hit).multiplyScalar(2.6), rnd); let t = 0;
    for (const T of TIMES) { const c0 = performance.now(); let n = 0; while (t < T - 1e-6) { RD.step(); t += 1 / 60; n++; } if (n) cost.push((performance.now() - c0) / n); RD.apply(); snap('C ' + T.toFixed(2) + ' s', at(), sideCam()); }
    kill(F); }
  // ── D: six deaths, where C leaves them after two and a half seconds ──
  const pushes = [['a jab', V().copy(hit).multiplyScalar(1.6)], ['a heavy blow', V().copy(hit).multiplyScalar(3.6).add(V(0, .8, 0))], ['from the side', V().copy(side).multiplyScalar(2.4)],
    ['from behind', V().copy(hit).multiplyScalar(-2.2)], ['a glancing blow', V().copy(hit).multiplyScalar(1.8).addScaledVector(side, -1.6)], ['dropped where he stood', V(0, -.5, 0)]];
  const settle = [];
  for (const [label, push] of pushes) { const F = make(), RD = ragdoll(F, push, rnd); let quiet = -1;
    for (let i = 0; i < 150; i++) { const before = RD.P.map(o => o.p.clone()); RD.step(); const mv = Math.max(...RD.P.map((o, k) => o.p.distanceTo(before[k]))); if (quiet < 0 && i > 10 && mv < .0015) quiet = i / 60; }
    settle.push(quiet); RD.apply(); const mid = V().addVectors(RD.P[RD.I.hips].p, RD.P[RD.I.neck].p).multiplyScalar(.5).add(O);
    snap('D ' + label, mid, V().copy(side).multiplyScalar(1.6).addScaledVector(hit, -1.3).add(V(0, 1.6, 0))); kill(F); }
  window.requestAnimationFrame = raf;
  const c = document.createElement('canvas'); c.width = 1200; c.height = 800; const X = c.getContext('2d'); X.fillStyle = '#222'; X.fillRect(0, 0, 1200, 800);
  tiles.forEach((T, i) => X.drawImage(T, (i % 6) * 200, Math.floor(i / 6) * 200));
  return { png: c.toDataURL(), msPerStep: +(cost.reduce((a, b) => a + b, 0) / cost.length).toFixed(3), settle };
});
fs.writeFileSync('docs/prototypes/ragdoll-grid.png', Buffer.from(r.png.split(',')[1], 'base64'));
console.log('ms a step (one body):', r.msPerStep, 'settled after (s):', JSON.stringify(r.settle), 'errors', g.errs);
await g.close();
