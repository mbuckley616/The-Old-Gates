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
    EQ.weapon = bow; EQ.offhand = null; buildViewmodel(); buildShieldViewmodel();
    run('bow drawn', () => { _bowDrawing = true; _bowDrawT = BOW_DRAW_MAX; });
    EQ.weapon = sword; buildViewmodel();
    run('dead', () => { dead = true; }, {}, 60); dead = false; tick(60, {});
    // swimming (F2b's line): the body sunk so the head's top is a quarter metre over the sea (tpUpdate's comment); the builder's crown
    // read from its skinned points, the eyes from its eyeballs
    { const sw = WORLD.isSwimming, jy = jumpY; WORLD.isSwimming = () => true; jumpY = SEA_Y - 1.45; reset(); tick(20, {});
      const R = TP.rig, pts = hbSkinPts(R.rig); let top = -1e9; for (let i = 0; i < pts.length; i += 3) { if (pts[i + 1] > top) top = pts[i + 1]; }
      const eyes = []; R.rig.hb.P.byName.head.traverse(o => { if (o.isMesh && o.parent === R.rig.hb.P.byName.head && o.geometry.type === 'SphereGeometry') eyes.push(W(o).y); });
      out.swim = Object.assign(measure(), { crown: +(top - SEA_Y).toFixed(3), eye: eyes.length ? +(eyes.reduce((a, b) => a + b, 0) / eyes.length - SEA_Y).toFixed(3) : null, st: +R.rig.hb.st.toFixed(3) });
      WORLD.isSwimming = sw; jumpY = jy; tick(5, {}); }
  } finally { window.requestAnimationFrame = raf; EQ.weapon = keep.w; EQ.offhand = keep.o; buildViewmodel(); buildShieldViewmodel(); reset(); }
  return out; });
for (const [k, v] of Object.entries(r)) console.log(k.padEnd(10), String(v.deg).padStart(5), v.worst, 'head', v.head, 'driver', v.headD, 'foot', v.foot, 'driver', v.footD);
const rest = r.rest.deg, moving = Object.entries(r).filter(([k]) => k !== 'rest');
check('at rest each limb of the builder\'s body lies along the driver\'s within 20°', rest < 20, r.rest);
check('in every state the copy holds as it does at rest (no limb more than 12° further off): walk, sprint, sneak, block, swing, cast, jump, bow, death', moving.every(([, v]) => v.deg < rest + 12), Object.fromEntries(moving.map(([k, v]) => [k, [v.worst, v.deg]])));
const hs = Object.entries(r).filter(([, v]) => v.heldN > 0);
check('what is held keeps its angle to the builder\'s forearm as to the driver\'s (within 1°), and the shield its distance from it (within 5 mm), in every state', hs.length >= 8 && hs.every(([, v]) => v.held < 1 && v.off < .005), Object.fromEntries(hs.map(([k, v]) => [k, [v.heldN, v.held, v.off]])));
check('the death fall lays the builder\'s body down: its head under 0.6 m above the root', r.dead.head < .6, r.dead);
console.log('swim', JSON.stringify({ crown: r.swim.crown, eye: r.swim.eye, st: r.swim.st }));
check('swimming, the builder\'s crown is a quarter metre over the sea (±3 cm), its eyes over the water', Math.abs(r.swim.crown - .25) <= .03 && r.swim.eye > 0, { crown: r.swim.crown, eye: r.swim.eye });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
