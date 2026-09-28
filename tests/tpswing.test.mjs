// The body's swing in third person follows the swing the viewmodel picked (Session 244). The body read the variant and
// the power flag on a swing's first frame, before the viewmodel chose them later in that frame (and it clears them when
// each swing ends), so every third-person swing was the flat cut at a normal swing's size. Driven through the game's own
// loop, a frame at a time, so the order within a frame is the real one (the render itself is skipped: it is slow on
// software GL and changes nothing measured here).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const run = (lock, pow) => page.evaluate(([lock, pow]) => {
  thirdPerson = true; EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', weight: 3 }; EQ.offhand = null;
  ANIM_PARAMS.swing.variantLock = lock;
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  let t = performance.now(); const step = () => { t += 1000 / 60; loop(t); };
  try {
    // settle: no swing, a few frames so the body stands
    swingT = 0; _pendingStrike = null; for (let i = 0; i < 4; i++) step();
    swingT = ANIM_PARAMS.swing.normalDur; _pendingStrike = { resolveFn: () => {}, isPow: pow, fired: false };
    const R = TP.rig, seen = []; let peakY = 0, peakX = 0;
    while (swingT > 0 && seen.length < 80) { step(); if (TP.swMax > 0) seen.push(TP.swVar); peakY = Math.max(peakY, Math.abs(R.shR.rotation.y)); peakX = Math.min(peakX, R.shR.rotation.x); }
    for (let i = 0; i < 3; i++) step();
    return { vmVar: vmSword.userData.swingVariant, tpVar: TP.swVar, pow: TP.swPow, vars: [...new Set(seen)], frames: seen.length, peakY: +peakY.toFixed(2), peakX: +peakX.toFixed(2), after: swingT, cleared: TP.swMax };
  } finally { window.requestAnimationFrame = raf; REN.render = rr; ANIM_PARAMS.swing.variantLock = -1; }
}, [lock, pow]);

const chop = await run(2, false), fore = await run(0, false), back = await run(1, false);
console.log('chop', JSON.stringify(chop)); console.log('forehand', JSON.stringify(fore)); console.log('backhand', JSON.stringify(back));
check('the viewmodel\'s overhead chop is the body\'s overhead chop, from the swing\'s first posed frame to its last', chop.vars.length === 1 && chop.vars[0] === 1 && chop.frames > 20, chop);
check('the forehand is the body\'s flat cut, the backhand its rising diagonal', fore.vars.join() === '0' && back.vars.join() === '2', { fore: fore.vars, back: back.vars });
check('the chop raises the arm overhead (shoulder past -2.2), the flat cut swings it across (turn past .9)', chop.peakX < -2.2 && fore.peakY > .9, { chop: chop.peakX, fore: fore.peakY });
const pow = await run(0, true);
console.log('power', JSON.stringify(pow));
check('a power swing is the body\'s power swing, wider than a normal one', pow.pow === true && pow.peakY > fore.peakY + .1, { pow: pow.peakY, normal: fore.peakY });
check('after the swing the body lets go of it', chop.after === 0 && chop.cleared === 0 && pow.cleared === 0, { chop, pow });

// both hands on a two-handed weapon (S246): the left wrist on the grip at rest, blocking and through each swing; measured
// once with the reach turned off (the grip point kept aside) for the before
const both = await page.evaluate(() => {
  thirdPerson = true; EQ.weapon = { name: 'Claymore', slot: 'weapon', weaponShape: 'claymore', weight: 7, twoHand: true }; EQ.offhand = null;
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {}; let t = performance.now(); const step = () => { t += 1000 / 60; loop(t); };
  const out = {};
  try {
    swingT = 0; _pendingStrike = null; step(); const R = TP.rig, gp = R.gripL && R.gripL.clone();
    const tip = (() => { R.root.updateMatrixWorld(true); const h = R.handR.getWorldPosition(new THREE.Vector3()); let far = null, fd = 0; R.weapon.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position, q = new THREE.Vector3(); for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); const d = q.distanceTo(h); if (d > fd) { fd = d; far = q.clone(); } } }); return R.weapon.worldToLocal(far); })();
    out.gripOppositeBlade = !!gp && Math.sign(gp.y) !== Math.sign(tip.y); out.grip = gp && +gp.y.toFixed(3);
    const gap = () => { R.root.updateMatrixWorld(true); return R.handL.getWorldPosition(new THREE.Vector3()).distanceTo(R.weapon.localToWorld(gp.clone())); };
    for (const on of [false, true]) { R.gripL = on ? gp : null; const k = on ? 'with' : 'without';
      for (let i = 0; i < 20; i++) step(); out[k + 'Rest'] = +gap().toFixed(3);
      blocking = true; for (let i = 0; i < 20; i++) step(); out[k + 'Block'] = +gap().toFixed(3); blocking = false; for (let i = 0; i < 10; i++) step();
      let worst = 0; for (const v of [0, 1, 2]) { ANIM_PARAMS.swing.variantLock = v; swingT = ANIM_PARAMS.swing.normalDur; _pendingStrike = { resolveFn: () => {}, isPow: false, fired: false };
        while (swingT > 0) { step(); if (TP.swMax > 0) worst = Math.max(worst, gap()); } for (let i = 0; i < 6; i++) step(); }
      out[k + 'SwingWorst'] = +worst.toFixed(3); }
    R.gripL = gp;
  } finally { window.requestAnimationFrame = raf; REN.render = rr; ANIM_PARAMS.swing.variantLock = -1; blocking = false; }
  return out; });
console.log('two hands', JSON.stringify(both));
check('the left hand\'s place is on the grip, on the pommel side of the fist, away from the blade', both.gripOppositeBlade, both);
check('two-handed, the left wrist is on the grip (within 1 cm) at rest and blocking', both.withRest < .01 && both.withBlock < .01, both);
check('through the swings (one-handed poses) it stays nearer the grip than it did', both.withSwingWorst < both.withoutSwingWorst - .1, both);
check('without the reach it was off the grip somewhere (the before)', Math.max(both.withoutRest, both.withoutBlock, both.withoutSwingWorst) > .08, both);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
