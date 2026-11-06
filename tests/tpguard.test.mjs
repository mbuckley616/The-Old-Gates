// The unarmed body in third person (Session 411, Michael's D on #99): an empty hand is a folded fist (a squarer palm,
// four knuckles, the curled fingers, the thumb across) in place of the mitten, and with both hands empty the body
// carries the jab's guard, the right fist by the chin and the left by the face, standing and on the move; a sprint drops
// to the swinging arms. A weapon, a bow, a shield or a torch keeps the mitten on that hand and today's poses. Driven
// through the game's own loop a frame at a time (render skipped), as tpfists does.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const run = (kit) => page.evaluate((kit) => {
  forceTime(11); thirdPerson = true; EQ.weapon = kit.w; EQ.offhand = kit.o; buildViewmodel();
  // every run starts on the same ground (S421): two runs of walking and sprinting would carry the third some 30 units on,
  // onto whatever slope or drop lies there
  const S = window.__tpgStart || (window.__tpgStart = { px, pz, yaw }); px = S.px; pz = S.pz; yaw = S.yaw; velY = 0; onGround = true; jumpY = 0;
  const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  // the stepped clock starts from the loop's last frame, and the loop is handed that frame back at the end. S421: handing it
  // performance.now() instead (S414) was behind the next real frame's own timestamp, which Chrome takes when it schedules
  // the frame, before this evaluate's several seconds: that frame's dt came out near -7 s, and the hurt and death timers
  // ran backwards into a pose that failed the torch's check on CI
  const T0 = prevT; let t = T0; const step = () => { t += 1000 / 60; loop(t); };
  const K = window._K, V = () => new THREE.Vector3();
  // in the body's own frame, from the head: the right and left hands, and the right shoulder
  const read = () => { const R = TP.rig; R.root.updateMatrixWorld(true); const L = o => R.root.worldToLocal(o.getWorldPosition(V()));
    const hd = L(R.head), hr = L(R.handR), hl = L(R.handL), sr = L(R.shR);
    return { rHead: +hr.distanceTo(hd).toFixed(3), lHead: +hl.distanceTo(hd).toFixed(3), rUp: +(hr.y - sr.y).toFixed(3) }; };
  const out = {};
  try {
    K.KeyW = false; K.ShiftLeft = false; for (let i = 0; i < 60; i++) step();
    const R = TP.rig, B = R.rig.B, geo = R.rig.mesh.geometry;
    out.fistR = !!B.fistR; out.fistL = !!B.fistL; out.unarmed = !!R.unarmed;
    out.tris = geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
    out.stand = read(); out.air = !onGround && Math.abs(velY) > .5; out.timers = [+TP.hurtT.toFixed(3), +TP.deadT.toFixed(3)];
    // on the move: worst over a stride (the lowest the right fist gets, the furthest either hand gets from the head)
    K.KeyW = true; let walk = { rHead: 0, lHead: 0, rUp: 9 };
    for (let i = 0; i < 60; i++) { step(); if (i >= 20) { const r = read(); walk = { rHead: Math.max(walk.rHead, r.rHead), lHead: Math.max(walk.lHead, r.lHead), rUp: Math.min(walk.rUp, r.rUp) }; } }
    out.walk = walk;
    K.ShiftLeft = true; let run = { rUp: -9 }; for (let i = 0; i < 60; i++) { step(); if (i >= 20) run = { rUp: Math.max(run.rUp, read().rUp) }; }
    out.sprint = run;
  } finally { K.KeyW = false; K.ShiftLeft = false; window.requestAnimationFrame = raf; REN.render = rr; prevT = T0; }
  return out;
}, kit);

const bare = await run({ w: null, o: null });
const sword = await run({ w: { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword' }, o: null });
const torch = await run({ w: null, o: { name: 'Torch', torchType: 'torch', slot: 'offhand' } });
console.log('bare', JSON.stringify(bare)); console.log('sword', JSON.stringify(sword)); console.log('torch', JSON.stringify(torch));
check('each run stands on the ground when the standing pose is read (not the air\'s balance pose)', !bare.air && !sword.air && !torch.air, { bare: bare.air, sword: sword.air, torch: torch.air });
check('no run starts hurt or dying (the hurt and death timers read 0 when the standing pose is read)', [bare, sword, torch].every(r => r.timers[0] === 0 && r.timers[1] === 0), [bare.timers, sword.timers, torch.timers]);
check('both empty hands are fists, and the body knows it is unarmed', bare.fistR && bare.fistL && bare.unarmed, bare);
check('a sword keeps the right hand a mitten (the left, empty, is a fist) and today\'s poses', !sword.fistR && sword.fistL && !sword.unarmed, sword);
check('a torch keeps the left hand a mitten (the right, empty, is a fist) and today\'s poses', torch.fistR && !torch.fistL && !torch.unarmed, torch);
check('the two fists cost about a thousand triangles over the sword\'s body (under 1,400 more)', bare.tris > sword.tris && bare.tris - sword.tris < 1400, { bare: bare.tris, sword: sword.tris });
check('standing unarmed, the right fist is by the chin and the left by the face (each within .3 of the head), the right above its shoulder', bare.stand.rHead < .3 && bare.stand.lHead < .3 && bare.stand.rUp > 0, bare.stand);
check('on the move the guard is carried: neither fist further than .33 from the head through the stride', bare.walk.rHead < .33 && bare.walk.lHead < .33, bare.walk);
check('sprinting drops to the swinging arms: the right fist never comes up to its shoulder', bare.sprint.rUp < 0, bare.sprint);
check('with a sword the arms hang as before: the right hand below its shoulder, standing and on the move', sword.stand.rUp < 0 && sword.walk.rUp < 0, { stand: sword.stand, walk: sword.walk });
check('with a torch there is no guard: the right hand below its shoulder standing', torch.stand.rUp < 0, torch.stand);
// Session 1899 (Michael's A on #1192, the deflect): a perfect parry sweeps the guard's sword out to your right, or punches the shield out,
// on the play clock (in by .06 s, back by .42); the riposte's swing is yours after it
const dfl = await page.evaluate(() => { const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; const out = {};
  const sword = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword' }, shield = { name: 'Iron Kite Shield', slot: 'offhand', shieldType: 'shield' };
  const hands = () => { const R = TP.rig; R.root.updateMatrixWorld(true); return [R.handR, R.handL].map(h => R.root.worldToLocal(h.getWorldPosition(new THREE.Vector3()))); };
  const at = (t) => { _lastParryG = t == null ? -1e9 : playClockS - t; for (let i = 0; i < 40; i++) tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 1.6, now: performance.now() + i * 16.7, roll: null }); return hands(); };
  try {
    thirdPerson = true; blocking = true; swingT = 0; EQ.weapon = sword; EQ.offhand = null; buildViewmodel();
    const g0 = at(null), g1 = at(.12), g2 = at(.5);
    out.sword = { out: +(g0[0].x - g1[0].x).toFixed(3), back: +g2[0].distanceTo(g0[0]).toFixed(3), k: [0, .03, .06, .18, .3, .42].map(t => { _lastParryG = playClockS - t; return +tpDeflectK().toFixed(2); }) };
    EQ.offhand = shield; buildViewmodel(); buildShieldViewmodel();
    const s0 = at(null), s1 = at(.12);
    out.shield = { fwd: +(s1[1].z - s0[1].z).toFixed(3), out: +(s1[1].x - s0[1].x).toFixed(3), right: +s1[0].distanceTo(s0[0]).toFixed(3) };
  } finally { blocking = false; _lastParryG = -1e9; EQ.offhand = null; window.requestAnimationFrame = raf; }
  return out; });
console.log('deflect', JSON.stringify(dfl));
check(`a perfect parry sweeps the guard's sword out to your right (${dfl.sword.out} m), and by .5 s it is back in the guard (${dfl.sword.back} m off); in by .06 s, held to .18, gone by .42 (${dfl.sword.k.join(', ')})`,
  dfl.sword.out > .15 && dfl.sword.back < .02 && dfl.sword.k[0] === 0 && dfl.sword.k[2] === 1 && dfl.sword.k[3] === 1 && dfl.sword.k[5] === 0, dfl.sword);
check(`with a shield the shield is punched out (${dfl.shield.fwd} m forward, ${dfl.shield.out} m to the left) and the sword hand stays where it was (${dfl.shield.right} m)`, dfl.shield.fwd > .08 && dfl.shield.out > .05 && dfl.shield.right < .02, dfl.shield);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
