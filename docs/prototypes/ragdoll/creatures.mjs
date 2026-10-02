// Session 422, H: the creatures' deaths. Session 419 put the people-bodied foes on a ragdoll (Michael's C on #102); the
// wolves, bears, boars and the other beasts on the wolf's bones still take the old slump: a dead pose and the whole
// figure turned 90° on z in one frame, which is the snap Michael called stiff. Three ways a wolf goes down, struck from
// the player's side on open ground: A today, B a canned collapse (the legs fold, the body rolls onto its side over half
// a second, with a small bounce), C a ragdoll on the wolf's own joints (29 points: hips, spine, neck, head and nose,
// three tail bones and their end, four legs of four bones and a paw's end; the torso held rigid by cross braces, the
// stifle and the carpus bending forward and the elbow and the hock back; gravity, the blow's push, the ground's height
// and friction; the bones then turned onto the points, as the people's are). Rows A–C are filmstrips, row D is where C
// leaves six deaths: three wolves, a Dire Wolf, a Cave Bear and a Boar. Nothing here changes the game.
// Run from the repo root: node docs/prototypes/ragdoll/creatures.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.frames(30);
const r = await page.evaluate(() => {
  forceTime(11);
  const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const V = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), O = V(px + fx * 4, 0, pz + fz * 4); O.y = activeTerrainH(O.x, O.z);
  const hit = V(fx, 0, fz).normalize(), side = V(-hit.z, 0, hit.x);
  const H = (x, z) => activeTerrainH(x, z);
  const make = (name) => { const rig = buildWolf(name || 'Wolf', 1); WOLF_RIGS.delete(rig); rig.mesh.frustumCulled = false; wgApply(rig, wgStand(0));
    const G = new THREE.Group(); G.add(rig.root); scene.add(G); G.position.copy(O); rig.root.rotation.y = Math.atan2(-hit.x, -hit.z); G.updateMatrixWorld(true); return { rig, G }; };
  const kill = ({ G }) => { scene.remove(G); };
  const cv = REN.domElement, cam = new THREE.PerspectiveCamera(34, 1, .05, 80), tiles = [];
  const snap = (label, at, from) => { cam.aspect = cv.width / cv.height; cam.updateProjectionMatrix();
    cam.position.copy(at).add(from); cam.lookAt(at); REN.render(scene, cam);
    const s = Math.min(cv.width, cv.height), T = document.createElement('canvas'); T.width = T.height = 200; T.getContext('2d').drawImage(cv, (cv.width - s) / 2, (cv.height - s) / 2, s, s, 0, 0, 200, 200);
    const x = T.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, 200, 20); x.fillStyle = '#f0e6c8'; x.font = '13px serif'; x.fillText(label, 5, 14); tiles.push(T); };
  // the camera from the wolf's flank, a little behind the player's side
  const sideCam = () => V().copy(side).multiplyScalar(2.2).add(V(0, .75, 0)).add(V().copy(hit).multiplyScalar(-.5));
  const at = () => V().copy(O).add(V(0, .25, 0)).add(V().copy(hit).multiplyScalar(.2));
  const TIMES = [0, .12, .25, .4, .7, 1.6];

  // ── A: today (killZoneEnemy: the dead pose, the figure turned 90° on z, lifted .15, darkened) ──
  { const F = make(); const m0 = F.rig.mesh.material;
    for (const t of TIMES) { if (t > 0) { wgApply(F.rig, wgDead()); F.G.rotation.z = Math.PI / 2; F.G.position.y = O.y + .15; if (F.rig.mesh.material === m0) { F.rig.mesh.material = m0.clone(); F.rig.mesh.material.color.multiplyScalar(.35); } }
      snap('A ' + t.toFixed(2) + ' s', at(), sideCam()); } kill(F); }

  // ── B: a canned collapse: the legs fold, the body rolls onto its side away from the blow, a small bounce ──
  { const F = make(); // the roll is about the body's own long axis
    const fwd = V(Math.sin(F.rig.root.rotation.y), 0, Math.cos(F.rig.root.rotation.y));
    const pose = t => { const k = Math.min(1, t / .5), fall = k * k, land = t > .5 ? Math.exp(-(t - .5) * 9) * Math.sin((t - .5) * 22) * .05 : 0, kl = Math.min(1, t / .25);
      const P = wgStand(0); P.drop = .12 * kl; ['L', 'R'].forEach(K => { P['el' + K] = [-.6 * kl, 0, 0]; P['wr' + K] = [1.1 * kl, 0, 0]; P['kn' + K] = [-.5 * kl, 0, 0]; P['hk' + K] = [.9 * kl, 0, 0]; });
      P.neck = [.3 * k, 0, 0]; P.head = [.25 * k, 0, 0]; P.jaw = [.2 * k, 0, 0]; P.tail1 = [-.5 * k, 0, 0]; wgApply(F.rig, P);
      F.G.quaternion.setFromAxisAngle(fwd, -(fall * Math.PI / 2 * .95) + land); F.G.position.y = O.y + .02 * fall; };
    for (const t of TIMES) { pose(t); snap('B ' + t.toFixed(2) + ' s', at(), sideCam()); } kill(F); }

  // ── C: the ragdoll on the wolf's joints ──
  const ragdoll = (F, push, rnd) => {
    const B = F.rig.B, sc = F.rig.root.scale.x; F.G.updateMatrixWorld(true);
    const W = b => b.getWorldPosition(V());
    // an end point past a bone with no child: half its own length on from the parent, in the bone's own frame
    const endOff = (b, f) => { const p = W(b), q = W(b.parent); return b.worldToLocal(V().copy(p).addScaledVector(V().subVectors(p, q), f || .5)); };
    const J = [['hips', B.hips], ['spine', B.spine], ['neck', B.neck], ['head', B.head], ['nose', B.head, endOff(B.head, 1.1)],
      ['tail1', B.tail1], ['tail2', B.tail2], ['tail3', B.tail3], ['tailE', B.tail3, endOff(B.tail3, 1)]];
    for (const K of ['L', 'R']) J.push(['sh' + K, B['sh' + K]], ['el' + K, B['el' + K]], ['wr' + K, B['wr' + K]], ['pf' + K, B['pf' + K]], ['pfE' + K, B['pf' + K], endOff(B['pf' + K], .6)],
      ['th' + K, B['th' + K]], ['kn' + K, B['kn' + K]], ['hk' + K, B['hk' + K]], ['ph' + K, B['ph' + K]], ['phE' + K, B['ph' + K], endOff(B['ph' + K], .6)]);
    const I = {}; const P = J.map(([n, b, off], i) => { I[n] = i; const w = b.localToWorld(off ? off.clone() : V()).sub(O); return { p: w, q: w.clone(), b, off }; });
    const L = (a, b) => [I[a], I[b], P[I[a]].p.distanceTo(P[I[b]].p)];
    const C = [];
    [['spine', 'neck'], ['neck', 'head'], ['head', 'nose'], ['neck', 'nose'], ['hips', 'tail1'], ['tail1', 'tail2'], ['tail2', 'tail3'], ['tail3', 'tailE']].forEach(([a, b]) => C.push(L(a, b)));
    for (const K of ['L', 'R']) [['sh', 'el'], ['el', 'wr'], ['wr', 'pf'], ['pf', 'pfE'], ['wr', 'pfE'], ['th', 'kn'], ['kn', 'hk'], ['hk', 'ph'], ['ph', 'phE'], ['hk', 'phE']].forEach(([a, b]) => C.push(L(a + K, b + K)));
    // the torso rigid: hips, spine, the neck's root and the four leg roots
    const box = ['hips', 'spine', 'neck', 'shL', 'shR', 'thL', 'thR'];
    for (let i = 0; i < box.length; i++) for (let j = i + 1; j < box.length; j++) C.push(L(box[i], box[j]));
    // the neck turns but cannot fold back through the shoulders; the tail cannot fold onto the back
    C.push([I.spine, I.head, P[I.spine].p.distanceTo(P[I.head].p), .75], [I.hips, I.tail2, P[I.hips].p.distanceTo(P[I.tail2].p), .7]);
    // the blow: the higher the joint the harder (the body tips from the feet), the legs give, and a roll onto one side
    const top = Math.max(...P.map(o => o.p.y)), lat = V().crossVectors(V(0, 1, 0), push).normalize(), roll = rnd() < .5 ? 1 : -1;
    const vel = P.map(o => { const k = Math.max(0, o.p.y / top); return V().copy(push).multiplyScalar(.3 + .7 * k).add(V((rnd() - .5) * .3, (rnd() - .5) * .2, (rnd() - .5) * .3)); });
    for (const n of ['hips', 'spine', 'neck']) { vel[I[n]].y -= 1.0; vel[I[n]].addScaledVector(lat, roll * (.9 + rnd() * .5)); }
    for (const K of ['L', 'R']) for (const n of ['wr', 'pf', 'hk', 'ph']) vel[I[n + K]].addScaledVector(lat, -roll * (.6 + rnd() * .4));
    const dt = 1 / 60; P.forEach((o, i) => o.q.copy(o.p).addScaledVector(vel[i], -dt));
    const rad = i => sc * (i === I.hips || i === I.spine ? .11 : i === I.neck ? .08 : i === I.head ? .06 : i === I.nose ? .03 : /^tail/.test(J[i][0]) ? .025 : .028);
    // the body's forward: from the hips to the neck
    const fwdOf = () => V().subVectors(P[I.neck].p, P[I.hips].p).normalize();
    const hinge = (a, m, c, sign) => { const f = fwdOf(), A = P[I[a]].p, M = P[I[m]].p, Cc = P[I[c]].p, d = V().subVectors(Cc, A), t = V().subVectors(M, A).dot(d) / Math.max(1e-6, d.lengthSq()),
      off = V().subVectors(M, V().copy(A).addScaledVector(d, t)); const k = off.dot(f); if (k * sign < 0) M.addScaledVector(f, -2 * k); };
    // which way each joint juts at rest decides its hinge's sign (the elbow and the hock back, the carpus and the stifle forward)
    const HINGES = []; for (const K of ['L', 'R']) for (const [a, m, c] of [['sh', 'el', 'wr'], ['el', 'wr', 'pf'], ['th', 'kn', 'hk'], ['kn', 'hk', 'ph']]) {
      const f = fwdOf(), A = P[I[a + K]].p, M = P[I[m + K]].p, d = V().subVectors(P[I[c + K]].p, A), t = V().subVectors(M, A).dot(d) / d.lengthSq(), k = V().subVectors(M, V().copy(A).addScaledVector(d, t)).dot(f);
      HINGES.push([a + K, m + K, c + K, k >= 0 ? 1 : -1]); }
    const step = () => {
      P.forEach(o => { const v = V().subVectors(o.p, o.q); o.q.copy(o.p); o.p.add(v.multiplyScalar(.995)); o.p.y -= 9.8 * dt * dt; });
      for (let it = 0; it < 10; it++) {
        for (const [a, b, len, min] of C) { const pa = P[a].p, pb = P[b].p, d = V().subVectors(pb, pa), l = d.length() || 1e-6; if (min && l >= len * min) continue; const want = min ? len * min : len, k = (l - want) / l * .5; pa.addScaledVector(d, k); pb.addScaledVector(d, -k); }
        for (const [a, m, c, s] of HINGES) hinge(a, m, c, s);
        P.forEach((o, i) => { const gy = H(O.x + o.p.x, O.z + o.p.z) - O.y + rad(i); if (o.p.y < gy) { o.p.y = gy; o.q.x = o.p.x - (o.p.x - o.q.x) * .55; o.q.z = o.p.z - (o.p.z - o.q.z) * .55; if (o.q.y < o.p.y) o.q.y = o.p.y; } });
      }
    };
    // the hips by the torso's frame (sideways from the right thigh to the left, forward to the neck), then every bone turned
    // onto its next point, parent first
    const frame = () => { const z = V().subVectors(P[I.neck].p, P[I.hips].p).normalize(), x = V().subVectors(P[I.thL].p, P[I.thR].p); x.addScaledVector(z, -x.dot(z)).normalize();
      return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, V().crossVectors(z, x), z)); };
    const F0 = frame(), hipsQ0 = B.hips.getWorldQuaternion(new THREE.Quaternion()), hipsOff = V().subVectors(W(B.hips), V().copy(P[I.hips].p).add(O));
    const AIM = [['spine', 'neck'], ['neck', 'head'], ['head', 'nose'], ['tail1', 'tail2'], ['tail2', 'tail3'], ['tail3', 'tailE']];
    for (const K of ['L', 'R']) AIM.push(['sh' + K, 'el' + K], ['el' + K, 'wr' + K], ['wr' + K, 'pf' + K], ['pf' + K, 'pfE' + K], ['th' + K, 'kn' + K], ['kn' + K, 'hk' + K], ['hk' + K, 'ph' + K], ['ph' + K, 'phE' + K]);
    const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion();
    const apply = () => {
      const d = frame().multiply(F0.clone().invert());
      const hw = V().copy(P[I.hips].p).add(O).add(hipsOff.clone().applyQuaternion(d)); B.hips.parent.updateMatrixWorld(true);
      B.hips.position.copy(B.hips.parent.worldToLocal(hw)); q1.copy(d).multiply(hipsQ0); B.hips.parent.getWorldQuaternion(q2); B.hips.quaternion.copy(q2.invert().multiply(q1)); B.hips.updateMatrixWorld(true);
      for (const [a, c] of AIM) { const o = P[I[a]], t = P[I[c]], b = o.b; b.updateMatrixWorld(true);
        const from = W(b), cur = (t.b === b ? b.localToWorld(t.off.clone()) : W(t.b)).sub(from), want = V().copy(t.p).add(O).sub(from);
        if (cur.lengthSq() < 1e-8 || want.lengthSq() < 1e-8) continue;
        q1.setFromUnitVectors(cur.normalize(), want.normalize()); b.getWorldQuaternion(q2); q1.multiply(q2); b.parent.getWorldQuaternion(q2); b.quaternion.copy(q2.invert().multiply(q1)); b.updateMatrixWorld(true); }
    };
    // a check: after apply, every point's bone lands where its particle is
    const err = () => { F.G.updateMatrixWorld(true); return Math.max(...P.map(o => o.b.localToWorld(o.off ? o.off.clone() : V()).sub(O).distanceTo(o.p))); };
    return { step, apply, P, I, err, HINGES };
  };
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cost = []; let restErr = 0, hingeSigns = null;
  { const F = make(), RD = ragdoll(F, V().copy(hit).multiplyScalar(2.4), rnd); hingeSigns = RD.HINGES.map(h => h[1] + (h[3] > 0 ? '+' : '-')).join(' ');
    RD.apply(); restErr = RD.err(); let t = 0;
    for (const T of TIMES) { const c0 = performance.now(); let n = 0; while (t < T - 1e-6) { RD.step(); t += 1 / 60; n++; } if (n) cost.push((performance.now() - c0) / n); RD.apply(); snap('C ' + T.toFixed(2) + ' s', at(), sideCam()); }
    kill(F); }
  // ── D: six deaths where C leaves them after two and a half seconds ──
  const deaths = [['Wolf', 'a bite parried', V().copy(hit).multiplyScalar(1.6)], ['Wolf', 'mid-leap', V().copy(hit).multiplyScalar(3.2).add(V(0, 1.2, 0))], ['Wolf', 'from the side', V().copy(side).multiplyScalar(2.2)],
    ['Dire Wolf', 'a heavy blow', V().copy(hit).multiplyScalar(3.4)], ['Cave Bear', 'Cave Bear', V().copy(hit).multiplyScalar(2.0)], ['Boar', 'Boar', V().copy(hit).multiplyScalar(2.2).addScaledVector(side, -1)]];
  const settle = [], lens = [];
  for (const [kind, label, push] of deaths) { const F = make(kind), RD = ragdoll(F, push, rnd); let quiet = -1;
    const L0 = [['thL', 'knL'], ['shR', 'elR'], ['hips', 'spine']].map(([a, b]) => RD.P[RD.I[a]].p.distanceTo(RD.P[RD.I[b]].p));
    for (let i = 0; i < 150; i++) { const before = RD.P.map(o => o.p.clone()); RD.step(); const mv = Math.max(...RD.P.map((o, k) => o.p.distanceTo(before[k]))); if (quiet < 0 && i > 10 && mv < .0015) quiet = +(i / 60).toFixed(2); }
    settle.push(quiet); RD.apply(); lens.push([['thL', 'knL'], ['shR', 'elR'], ['hips', 'spine']].map(([a, b], j) => +(RD.P[RD.I[a]].p.distanceTo(RD.P[RD.I[b]].p) / L0[j]).toFixed(3)));
    const mid = V().addVectors(RD.P[RD.I.hips].p, RD.P[RD.I.neck].p).multiplyScalar(.5).add(O), big = kind === 'Cave Bear' ? 1.5 : 1;
    snap('D ' + label, mid, V().copy(side).multiplyScalar(1.3 * big).addScaledVector(hit, -1.0 * big).add(V(0, 1.2 * big, 0))); kill(F); }
  window.requestAnimationFrame = raf;
  const c = document.createElement('canvas'); c.width = 1200; c.height = 800; const X = c.getContext('2d'); X.fillStyle = '#222'; X.fillRect(0, 0, 1200, 800);
  tiles.forEach((T, i) => X.drawImage(T, (i % 6) * 200, Math.floor(i / 6) * 200));
  return { png: c.toDataURL(), msPerStep: +(cost.reduce((a, b) => a + b, 0) / cost.length).toFixed(3), settle, lens, restErr: +restErr.toFixed(4), hingeSigns };
});
fs.writeFileSync('docs/prototypes/ragdoll-creatures.png', Buffer.from(r.png.split(',')[1], 'base64'));
console.log('ms a step (one body):', r.msPerStep, 'settled after (s):', JSON.stringify(r.settle), 'bone lengths after:', JSON.stringify(r.lens),
  'bones off their points at rest:', r.restErr, 'hinges:', r.hingeSigns, 'errors', g.errs);
await g.close();
