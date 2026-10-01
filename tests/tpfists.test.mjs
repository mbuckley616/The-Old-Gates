// The empty hand's punch in third person (Session 402, after Michael's A on #80). The first person throws a straight jab
// from a guard (Session 396), but the body still played the sword's arcs with an empty hand: a slash with a fist. Now the
// body throws the same jab: from a guard by the chin, out straight at shoulder height on the middle line as the strike
// lands, the left fist kept at the face. Driven through the game's own loop a frame at a time (render skipped), as
// tpswing does; the before is the same punch with the view model's fist mark taken off, which is the old path.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const run = (pow, old) => page.evaluate(([pow, old]) => {
  thirdPerson = true; EQ.weapon = null; EQ.offhand = null; buildViewmodel(); if (typeof tpBuild === 'function') tpBuild();
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(); const step = () => { t += 1000 / 60; loop(t); };
  const fistMark = vmSword && vmSword.userData.fists; if (old && vmSword) vmSword.userData.fists = false;
  try {
    swingT = 0; _pendingStrike = null; for (let i = 0; i < 6; i++) step();
    const R = TP.rig, I = ANIM_PARAMS.swing.impactPoint, V = () => new THREE.Vector3();
    // in the body's own frame: x across (+ the body's left), y up, z forward (+ ahead), measured from the right shoulder
    const fwd = () => { R.root.updateMatrixWorld(true); const h = R.root.worldToLocal(R.handR.getWorldPosition(V())), s = R.root.worldToLocal(R.shR.getWorldPosition(V())), hl = R.root.worldToLocal(R.handL.getWorldPosition(V())), hd = R.root.worldToLocal(R.head.getWorldPosition(V())); return { h, s, hl, hd }; };
    swingT = ANIM_PARAMS.swing.normalDur; _pendingStrike = { resolveFn: () => {}, isPow: pow, fired: false };
    const tr = []; let n = 0;
    while (swingT > 0 && n++ < 90) { step(); if (TP.swMax > 0) { const p = 1 - swingT / TP.swMax, f = fwd(); tr.push({ p, rx: R.shR.rotation.x, el: R.elR.rotation.x, h: f.h, s: f.s, hl: f.hl, hd: f.hd }); } }
    for (let i = 0; i < 4; i++) step();
    const A = ANIM_PARAMS.swing.antEnd, draw = tr.reduce((b, x) => Math.abs(x.p - A) < Math.abs(b.p - A) ? x : b);
    const hit = tr.reduce((b, x) => Math.abs(x.p - (I + 1 / 33)) < Math.abs(b.p - (I + 1 / 33)) ? x : b);
    const r3 = v => [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];
    return { frames: tr.length, I, hit: { p: +hit.p.toFixed(3), el: +hit.el.toFixed(2), rx: +hit.rx.toFixed(2), hand: r3(hit.h), sh: r3(hit.s), handL: r3(hit.hl), head: r3(hit.hd) },
      arm: +hit.h.distanceTo(hit.s).toFixed(3), drawEl: +draw.el.toFixed(2), drawHand: r3(draw.h), drawSh: r3(draw.s),
      leftWorst: +Math.max(...tr.map(x => x.hl.distanceTo(x.hd))).toFixed(3),
      sideMax: +Math.max(...tr.map(x => Math.abs(x.h.x - x.hd.x))).toFixed(3), after: swingT, cleared: TP.swMax, elAfter: +R.elR.rotation.x.toFixed(2) };
  } finally { if (vmSword) vmSword.userData.fists = fistMark; window.requestAnimationFrame = raf; REN.render = rr; }
}, [pow, old]);

const jab = await run(false, false), before = await run(false, true), pow = await run(true, false);
console.log('jab', JSON.stringify(jab)); console.log('before (the sword\'s arc)', JSON.stringify(before)); console.log('power', JSON.stringify(pow));
const fwdAxis = await page.evaluate(() => { const R = TP.rig; R.root.updateMatrixWorld(true); const hd = R.root.worldToLocal(R.head.getWorldPosition(new THREE.Vector3())); const nose = R.root.worldToLocal(R.head.localToWorld(new THREE.Vector3(0, 0, 1))); return Math.sign(nose.z - hd.z); });
const ahead = r => (r.hit.hand[2] - r.hit.sh[2]) * fwdAxis, drawAhead = r => (r.drawHand[2] - r.drawSh[2]) * fwdAxis;
check('the empty hand has the fists in first person, so the body knows it is a punch', await page.evaluate(() => !!(vmSword && vmSword.userData.fists)));
check('drawn back at the wind-up\'s end the elbow is folded (past -1.6); as the jab lands the arm is straight (under .2)', jab.drawEl < -1.6 && Math.abs(jab.hit.el) < .2, { draw: jab.drawEl, hit: jab.hit.el });
check('the fist travels out (.15 or more ahead in the body\'s frame from the draw to the hit) to most of the arm\'s length ahead of the shoulder, at shoulder height (within .12)', (jab.hit.hand[2] - jab.drawHand[2]) * fwdAxis > .15 && ahead(jab) > .75 * jab.arm && Math.abs(jab.hit.hand[1] - jab.hit.sh[1]) < .12, { travel: (jab.hit.hand[2] - jab.drawHand[2]) * fwdAxis, ahead: ahead(jab), arm: jab.arm, dy: jab.hit.hand[1] - jab.hit.sh[1] });
check('the jab stays near the body\'s middle line (never more than .3 to the side of the head); the sword\'s arc swept wider', jab.sideMax < .3 && before.sideMax > jab.sideMax + .05, { jab: jab.sideMax, before: before.sideMax });
check('the left fist stays up by the face through the jab (within .35 of the head)', jab.leftWorst < .35, jab.leftWorst);
check('the power punch lands further ahead of the body than the jab (the step and the shoulder drive through)', (pow.hit.hand[2] - jab.hit.hand[2]) * fwdAxis > .04, { pow: pow.hit.hand[2], jab: jab.hit.hand[2] });
check('after the punch the body lets go of it', jab.after === 0 && jab.cleared === 0 && pow.cleared === 0, { jab, pow });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
