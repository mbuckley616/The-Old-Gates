// Card F10, part three (Session 1253): every animation of the player's third-person body carried onto the builder's skeleton. The
// 17-bone driver is posed by tpPose as before; hbPose copies its joints onto the builder's (F4's HB_MAP). For each state (rest, walk,
// sprint, sneak, block, a swing at its strike, the bow at full draw, a cast, a jump, the death fall) the body is driven over fixed
// ticks of tpUpdate and each limb's line on the builder (shoulder to elbow, elbow to wrist, hip to knee, knee to ankle, the spine) is
// compared with the driver's: the copy holds in every state as it does at rest. F10_SHOTS=1 writes pictures to docs/prototypes/f10/.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const g = await boot(); const { page } = g;
page.on('pageerror', e => console.log('  pageerror:', (e.stack || e.message).slice(0, 500)));
await g.intoWorld();
const r = await page.evaluate(() => { const keep = { w: EQ.weapon, o: EQ.offhand }, out = {};
  const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  thirdPerson = true; const sword = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', matCol: '#dde8ec', matGuard: '#a0b0b8' };
  const bow = { name: 'Hunting Bow', slot: 'weapon', weaponShape: 'bow', twoHand: true, matCol: '#6a4a2a' };
  const W = o => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
  const ang = (a, b) => +(Math.acos(Math.max(-1, Math.min(1, a.clone().normalize().dot(b.clone().normalize())))) * 180 / Math.PI).toFixed(1);
  const measure = () => { const R = TP.rig, B = R.rig.B, H = R.rig.hb, by = H.P.byName, sd = s => HBODY.swap ? (s === 'L' ? 'R' : 'L') : s; R.root.updateMatrixWorld(true);
    const seg = (a, b, x, y) => ang(W(B[b]).sub(W(B[a])), W(by[y]).sub(W(by[x])));
    const m = {}; for (const s of ['L', 'R']) { const t = sd(s);
      m['upper arm ' + s] = seg('sh' + s, 'el' + s, 'upperarm01.' + t, 'lowerarm01.' + t); m['forearm ' + s] = seg('el' + s, 'wr' + s, 'lowerarm01.' + t, 'wrist.' + t);
      m['thigh ' + s] = seg('th' + s, 'kn' + s, 'upperleg01.' + t, 'lowerleg01.' + t); m['shin ' + s] = seg('kn' + s, 'an' + s, 'lowerleg01.' + t, 'foot.' + t); }
    m.spine = seg('hips', 'neck', 'root', 'neck01');
    const worst = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
    // what the hands hold, against the forearm that holds it: each axis of a piece's copy makes the same angle with the builder's forearm
    // as the piece with the driver's (S1253), and the distance of its middle from the forearm's line is the same
    let held = 0, off = 0; for (const h of R.hbHeld || []) { const A = h.arm, dF = W(A[1]).sub(W(A[0])).normalize(), bF = W(A[3]).sub(W(A[2])).normalize();
      const qo = h.o.getWorldQuaternion(new THREE.Quaternion()), qc = h.c.children[0].getWorldQuaternion(new THREE.Quaternion());
      for (const u of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) { const a = new THREE.Vector3(...u).applyQuaternion(qo), b = new THREE.Vector3(...u).applyQuaternion(qc); held = Math.max(held, Math.abs(ang(a, dF) - ang(b, bF))); }
      if (!h.f) { const line = (p, e, d) => p.clone().sub(e).cross(d).length(); off = Math.max(off, Math.abs(line(W(h.o), W(A[0]), dF) - line(W(h.c.children[0]), W(A[2]), bF))); } }
    const y0 = W(R.root).y, foot = o => Math.min(W(o[0]).y, W(o[1]).y) - y0;
    return { worst: worst[0], deg: worst[1], all: m, head: +(W(by.head).y - y0).toFixed(2), headD: +(W(B.head).y - y0).toFixed(2),
      foot: +foot([by['foot.L'], by['foot.R']]).toFixed(3), footD: +foot([B.anL, B.anR]).toFixed(3), held: +held.toFixed(2), heldN: (R.hbHeld || []).length, off: +off.toFixed(4) }; };
  const tick = (n, st) => { for (let i = 0; i < n; i++) { if (st.move) { px += .05 * (st.sprinting ? 1.6 : 1); } tpUpdate(1 / 60, { moving: !!st.move, sprinting: !!st.sprinting, camY: 1.6, now: performance.now() + i * 16.7, roll: null }); } };
  const reset = () => { _sneaking = false; blocking = false; onGround = true; velY = 0; swingT = 0; castT = 0; dead = false; try { _bowDrawing = false; _bowDrawT = 0; } catch (e) {} };
  const run = (name, set, st, n) => { reset(); set(); tick(n || 40, st || {}); out[name] = measure(); reset(); };
  try {
    EQ.weapon = sword; EQ.offhand = { name: 'Iron Kite Shield', slot: 'offhand', shieldType: 'shield', matCol: '#a8b0b8', matGuard: '#787880' }; buildViewmodel(); buildShieldViewmodel();
    run('rest', () => {}); run('walk', () => {}, { move: 1 }); run('sprint', () => {}, { move: 1, sprinting: 1 }); run('sneak', () => { _sneaking = true; }, { move: 1 });
    run('block', () => { blocking = true; });
    run('swing', () => { vmSword.userData.swingMax = .5; vmSword.userData.swingVariant = 0; swingT = .5; }, {}, 1);
    { reset(); vmSword.userData.swingMax = .5; vmSword.userData.swingVariant = 0; swingT = .5; for (let i = 0; i < 14; i++) { swingT = Math.max(0, .5 - i / 60); tick(1, {}); } out.swing = measure(); reset(); }
    run('cast', () => { castT = CAST_ANIM_DURATION * .5; }, {}, 6);
    run('jump', () => { onGround = false; velY = 3; }, {}, 20);
    // S1594 — the double jump's tuck (12 ticks after the step, 0.2 s) and the air dash's lean (8 ticks into it), read off AIRSTEP and AIRDASH
    { const R = TP.rig, B = R.rig.B, by = R.rig.hb.P.byName, sd = s => HBODY.swap ? (s === 'L' ? 'R' : 'L') : s;
      const knee = () => { R.root.updateMatrixWorld(true); return { knee: +(W(by['lowerleg01.' + sd('L')]).y - W(by['upperleg01.' + sd('L')]).y).toFixed(3), kneeD: +(W(B.knL).y - W(B.thL).y).toFixed(3) }; };
      const ahead = () => { R.root.updateMatrixWorld(true); const f = W(by['foot.L']).add(W(by['foot.R'])).multiplyScalar(.5), h = W(by.head).sub(f);
        return { ahead: +(h.x * fwdX + h.z * fwdZ).toFixed(3), rx: +R.root.rotation.x.toFixed(3), rz: +R.root.rotation.z.toFixed(3), hip: +(W(by.root).y - jumpY).toFixed(3) }; };
      reset(); tick(20, {}); out.rest.hip = ahead().hip; Object.assign(out.rest, knee());
      reset(); onGround = false; velY = 2; tick(2, {}); AIRSTEP.used = true; velY = 4.5; tick(12, {}); out.step = Object.assign(measure(), knee()); AIRSTEP.used = false; reset(); tick(20, {});
      reset(); onGround = false; velY = 0; tick(2, {}); Object.assign(AIRDASH, { t0: performance.now() / 1000, dx: fwdX, dz: fwdZ }); tick(8, {}); out.dash = Object.assign(measure(), ahead());
      AIRDASH.t0 = null; tick(20, {}); out.dash.after = ahead(); reset(); tick(20, {}); }
    EQ.weapon = bow; EQ.offhand = null; buildViewmodel(); buildShieldViewmodel();
    run('bow drawn', () => { _bowDrawing = true; _bowDrawT = BOW_DRAW_MAX; });
    EQ.weapon = sword; buildViewmodel();
    run('dead', () => { dead = true; }, {}, 60); dead = false; tick(60, {});
    // swimming (F2b's line): the body sunk so the head's top is a quarter metre over the sea (tpUpdate's comment); the builder's crown
    // read from its skinned points, the eyes from its eyeballs
    { const sw = WORLD.isSwimming, jy = jumpY; WORLD.isSwimming = () => true; jumpY = SEA_Y - 1.45; reset(); tick(20, {});
      const R = TP.rig, pts = hbSkinPts(R.rig); let top = -1e9; for (let i = 0; i < pts.length; i += 3) { if (pts[i + 1] > top) top = pts[i + 1]; }
      const eyes = []; R.rig.hb.P.byName.head.traverse(o => { if (o.isMesh && o.parent === R.rig.hb.P.byName.head && o.geometry.type === 'SphereGeometry') eyes.push(W(o).y); });
      out.swim = Object.assign(measure(), { crown: +(top - SEA_Y).toFixed(3), eye: eyes.length ? +(eyes.reduce((a, b) => a + b, 0) / eyes.length - SEA_Y).toFixed(3) : null, st: +R.rig.hb.st.toFixed(3), armL: +R.shL.rotation.z.toFixed(2), armR: +R.shR.rotation.z.toFixed(2), grip: !!R.gripL });
      WORLD.isSwimming = sw; jumpY = jy; tick(5, {}); }
  } finally { window.requestAnimationFrame = raf; EQ.weapon = keep.w; EQ.offhand = keep.o; buildViewmodel(); buildShieldViewmodel(); reset(); }
  return out; });
// S1435 — your arms under a cloak (Michael's #274, as the townsfolk's in S1434): walking with a sword and a wool cloak, the hand and
// forearm points under the cloak are read round the neck's axis against its columns (f4people's test) on every third tick of a 60-tick
// walk and standing with the blade at rest, with the hold and without it; and an arm the pose takes (a swing, a block) is let go at once to the driver's pose
const ck = await page.evaluate(() => { const keep = { w: EQ.weapon, o: EQ.offhand, b: EQ.back }, raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const v = new THREE.Vector3(), W = o => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
  const test = rig => { const P = rig.hb.P, cloak = rig.hb.full.find(m => m.name === 'cloak'), body = rig.hb.full.filter(m => m.isSkinnedMesh && !m.name).sort((a, b) => b.geometry.attributes.position.count - a.geometry.attributes.position.count)[0];
    rig.root.updateMatrixWorld(true); const inv = cloak.matrixWorld.clone().invert(), K = 56, R = cloak.geometry.attributes.position.count / K, at = (m, i) => { m.getVertexPosition(i, v); return v.applyMatrix4(inv).clone(); };
    const neck = P.byName['neck01'].getWorldPosition(new THREE.Vector3()).applyMatrix4(inv), ax = neck.x, az = neck.z, pol = [];
    for (let k = 0; k < K; k++) { const c = []; for (let r = 0; r < R; r++) { const q = at(cloak, k * R + r); c.push({ th: Math.atan2(q.x - ax, -(q.z - az)), r: Math.hypot(q.x - ax, q.z - az), y: q.y }); } pol.push(c); }
    const col = (k, y) => { const c = pol[k]; let lo = 0; while (lo < R - 2 && c[lo + 1].y > y) lo++; const a = c[lo], b = c[lo + 1], t = Math.max(0, Math.min(1, (a.y - y) / Math.max(1e-6, a.y - b.y))); return { th: a.th + (b.th - a.th) * t, r: a.r + (b.r - a.r) * t }; };
    let yHem = -1e9; for (const c of pol) yHem = Math.max(yHem, c[R - 1].y); const yTop = neck.y - .14, bones = body.skeleton.bones, si = body.geometry.attributes.skinIndex, sw = body.geometry.attributes.skinWeight;
    if (!rig._arm) { rig._arm = []; for (let i = 0; i < si.count; i += 2) { let b = 0, w = 0; for (let q = 0; q < 4; q++) if (sw.getComponent(i, q) > w) { w = sw.getComponent(i, q); b = si.getComponent(i, q); } if (/upperarm|lowerarm|wrist|finger|metacarpal/.test(bones[b].name)) rig._arm.push(i); } }
    let tested = 0, out = 0, worst = 0;
    for (const i of rig._arm) { const p = at(body, i); if (p.y > yTop || p.y < yHem + .01) continue; const th = Math.atan2(p.x - ax, -(p.z - az)), r = Math.hypot(p.x - ax, p.z - az);
      if (th < col(1, p.y).th || th > col(K - 2, p.y).th) continue; let k = 1, A = col(1, p.y), B = col(2, p.y); while (k < K - 3 && B.th < th) { k++; A = B; B = col(k + 1, p.y); }
      const t = Math.max(0, Math.min(1, (th - A.th) / Math.max(1e-6, B.th - A.th))), cr = A.r + (B.r - A.r) * t; tested++; worst = Math.max(worst, r - cr); if (r > cr + .003) out++; }
    return { tested, out, worst }; };
  const tick = (n, st) => { for (let i = 0; i < n; i++) { if (st.move) px += .05; tpUpdate(1 / 60, { moving: !!st.move, sprinting: false, camY: 1.6, now: performance.now() + i * 16.7, roll: null }); } };
  const reset = () => { _sneaking = false; blocking = false; onGround = true; velY = 0; swingT = 0; castT = 0; dead = false; };
  const fore = () => { const R = TP.rig, B = R.rig.B, by = R.rig.hb.P.byName, t = HBODY.swap ? 'L' : 'R'; R.root.updateMatrixWorld(true);
    const a = W(B.wrR).sub(W(B.elR)).normalize(), b = W(by['wrist.' + t]).sub(W(by['lowerarm01.' + t])).normalize(); return +(Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * 180 / Math.PI).toFixed(1); };
  const walk = hold => { const rig = TP.rig.rig, keepH = rig.tpHold; if (!hold) rig.tpHold = null; const o = { tested: 0, out: 0, worst: 0 };
    tick(15, { move: 1 }); for (let i = 1; i <= 45; i++) { tick(1, { move: 1 }); if (i % 3 === 0) { const c = test(rig); o.tested += c.tested; o.out += c.out; o.worst = Math.max(o.worst, c.worst); } }
    rig.tpHold = keepH; o.worst = +o.worst.toFixed(3); return o; };
  const out = {};
  try { reset(); thirdPerson = true; EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', matCol: '#dde8ec', matGuard: '#a0b0b8' }; EQ.offhand = null;
    EQ.back = { name: 'Wool Cloak', slot: 'back', cloak: 'wool' }; buildViewmodel(); buildShieldViewmodel(); tick(10, {});
    const rig = TP.rig.rig; out.cloak = !!rig.hb.full.find(m => m.name === 'cloak'); out.held = rig.hb.hold ? rig.hb.hold.size : 0; tick(30, {}); out.rest = test(rig); rig.tpHold = null; tick(1, {}); out.restFree = test(rig); rig.tpHold = TP.hbHold; tick(30, {});
    out.free = walk(false); out.hold = walk(true); out.k = { L: TP.hbHold.L, R: TP.hbHold.R, S: TP.hbHold.S, lean: +TP.rig.torso.rotation.x.toFixed(3) };
    out.forearmWalk = fore();
    vmSword.userData.swingMax = .5; vmSword.userData.swingVariant = 0; swingT = .5; for (let i = 0; i < 10; i++) { swingT = Math.max(0, .5 - i / 60); tick(1, { move: 1 }); }
    out.swing = { L: +TP.hbHold.L.toFixed(2), R: +TP.hbHold.R.toFixed(2), forearm: fore() }; reset(); tick(20, { move: 1 });
    blocking = true; tick(12, { move: 1 }); out.block = { L: +TP.hbHold.L.toFixed(2), R: +TP.hbHold.R.toFixed(2), forearm: fore() }; reset();
  } finally { window.requestAnimationFrame = raf; EQ.weapon = keep.w; EQ.offhand = keep.o; EQ.back = keep.b; buildViewmodel(); buildShieldViewmodel(); reset(); tick(4, {}); }
  return out; });
console.log('  cloak:', JSON.stringify(ck));
check(`walking in a cloak, none of your hand and forearm points under it comes out by 3 mm (${ck.hold.out} of ${ck.hold.tested}, at most ${ck.hold.worst * 1000} mm; ${ck.free.out} of ${ck.free.tested} without the hold), nor standing with the sword (${ck.rest.out} of ${ck.rest.tested}; ${ck.restFree.out} without)`,
  ck.cloak && ck.held > 0 && ck.rest.out === 0 && ck.restFree.out > 0 && ck.hold.tested > 1000 && ck.hold.out === 0 && ck.hold.worst < .006 && ck.free.out > ck.hold.out, ck);
check('a swing or a block begun in the walk lets the arm go from the hold to the driver\'s pose (the right forearm within 30° of the driver\'s: 18° at rest)',
  ck.swing.R < .1 && ck.swing.forearm < 30 && ck.block.R === 0 && ck.block.forearm < 30, { swing: ck.swing, block: ck.block });
for (const [k, v] of Object.entries(r)) console.log(k.padEnd(10), String(v.deg).padStart(5), v.worst, 'head', v.head, 'driver', v.headD, 'foot', v.foot, 'driver', v.footD);
const rest = r.rest.deg, moving = Object.entries(r).filter(([k]) => k !== 'rest');
check('at rest each limb of the builder\'s body lies along the driver\'s within 20°', rest < 20, r.rest);
check('in every state the copy holds as it does at rest (no limb more than 12° further off): walk, sprint, sneak, block, swing, cast, jump, bow, death', moving.every(([, v]) => v.deg < rest + 12), Object.fromEntries(moving.map(([k, v]) => [k, [v.worst, v.deg]])));
const hs = Object.entries(r).filter(([, v]) => v.heldN > 0);
check('what is held keeps its angle to the builder\'s forearm as to the driver\'s (within 1°), and the shield its distance from it (within 5 mm), in every state', hs.length >= 8 && hs.every(([, v]) => v.held < 1 && v.off < .005), Object.fromEntries(hs.map(([k, v]) => [k, [v.heldN, v.held, v.off]])));
check('the double jump tucks the knees up toward the chest (Session 1594): the builder\'s left knee within 15 cm of its hip\'s height, where it hangs 40 cm under it at rest', r.step.knee > -.15 && r.rest.knee < -.3, { step: [r.step.knee, r.step.kneeD], rest: [r.rest.knee, r.rest.kneeD] });
check('the air dash leans the body into it about its middle: the head 40 cm or more ahead of the feet, the hips within 15 cm of their height at rest; 0.33 s after it the body is upright again', r.dash.ahead > .4 && Math.abs(r.dash.hip - r.rest.hip) < .15 && r.dash.after.rx === 0 && r.dash.after.rz === 0, { dash: { ahead: r.dash.ahead, rx: r.dash.rx, hip: r.dash.hip, restHip: r.rest.hip }, after: r.dash.after });
check('the death fall lays the builder\'s body down: its head under 0.6 m above the root', r.dead.head < .6, r.dead);
console.log('swim', JSON.stringify({ crown: r.swim.crown, eye: r.swim.eye, st: r.swim.st }));
check('swimming, the builder\'s crown is a quarter metre over the sea (±3 cm), its eyes over the water', Math.abs(r.swim.crown - .25) <= .03 && r.swim.eye > 0, { crown: r.swim.crown, eye: r.swim.eye });
check('treading water (Session 1272) the arms scull out to the sides, both of them', r.swim.armL > .5 && r.swim.armR < -.5, { armL: r.swim.armL, armR: r.swim.armR });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
