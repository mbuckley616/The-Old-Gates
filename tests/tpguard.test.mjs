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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
