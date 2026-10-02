// The body's own underclothes (Session 394, Michael's B on decision #83): with the chest, legs and feet slots empty the
// third-person body wears an undyed linen shirt cut at the shoulder (bare arms, no trim), linen braies and bare feet;
// the look's colours dye the starting tunic, breeches and boots, which are items. First person shows a bare arm.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const r = await page.evaluate(() => {
  const keep = {}; for (const k in EQ) keep[k] = EQ[k];
  const LOOK = { skin: 0xc89a70, tunic: 0x2a6a3a, breeches: 0x6a2a5a, boots: 0x2a3a8a };
  const has = (R, hex, k) => { const c = new THREE.Color(hex); if (k) c.multiplyScalar(k); const C = R.rig.mesh.geometry.attributes.color; let n = 0;
    for (let i = 0; i < C.count; i++) if (Math.abs(C.getX(i) - c.r) + Math.abs(C.getY(i) - c.g) + Math.abs(C.getZ(i) - c.b) < .06) n++; return n; };
  const measure = () => { const R = tpBuild(LOOK); R.root.updateMatrixWorld(true);
    const o = { tris: R.rig.tris, linen: has(R, TP_LINEN), braies: has(R, TP_LINEN, .93), skin: has(R, LOOK.skin), tunic: has(R, LOOK.tunic), breeches: has(R, LOOK.breeches), boots: has(R, LOOK.boots), shirt: R.rig.g ? !!R.rig.g.shirt : null };
    const bb = new THREE.Box3().setFromObject(R.root); o.minY = bb.min.y; tpDispose(R); return o; };
  for (const k of Object.keys(EQ)) EQ[k] = null;
  EQ.chest = { name: 'Tattered Tunic' }; EQ.legs = { name: 'Worn Breeches' }; EQ.feet = { name: 'Leather Boots' };
  const dressed = measure(), arm0 = _chestArmColors().sleeve;
  EQ.chest = null; const noChest = measure(), arm1 = _chestArmColors().sleeve;
  EQ.legs = null; const noLegs = measure();
  EQ.feet = null; const bare = measure();
  for (const k in keep) EQ[k] = keep[k];
  return { dressed, noChest, noLegs, bare, arm0, arm1, palm: HAND_SKIN.palm }; });
const { dressed, noChest, noLegs, bare } = r;
check('dressed in the starting kit, the tunic, breeches and boots take the look\'s colours and no linen shows',
  dressed.tunic > 50 && dressed.breeches > 100 && dressed.boots > 50 && dressed.linen === 0 && dressed.braies === 0, dressed);
check('the chest slot empty: a linen shirt, no tunic colour, and more skin (bare arms)',
  noChest.linen > 100 && noChest.tunic === 0 && noChest.skin > dressed.skin + 50 && noChest.breeches > 100, noChest);
check('the legs slot empty too: linen braies in place of the breeches', noLegs.braies > 100 && noLegs.breeches === 0, noLegs);
check('the feet empty too: bare feet, no boot colour, more skin again', bare.boots === 0 && bare.skin > noLegs.skin + 50, bare);
check('the bare feet stand on the boots\' ground line (within 1 cm)', Math.abs(bare.minY - dressed.minY) < .01, [dressed.minY, bare.minY]);
check('the shirt is lighter than the tunic it replaces (no trim, shorter hem)', noChest.tris < dressed.tris + 200, [dressed.tris, noChest.tris, bare.tris]);
check('first person: the arm is the skin with nothing on the chest, the tunic\'s cloth with it', r.arm1 === r.palm && r.arm0 !== r.palm, r);

// in play: taking the tunic off rebuilds the body in the shirt
const play = await page.evaluate(() => { thirdPerson = true; const st = { moving: false, sprinting: false, camY: 1.6, now: performance.now() };
  for (const k of Object.keys(EQ)) EQ[k] = null; EQ.chest = { name: 'Tattered Tunic' };
  tpUpdate(1 / 60, st); const before = TP.rig.rig.tris; EQ.chest = null; st.now += 20; tpUpdate(1 / 60, st);
  const after = TP.rig.rig.tris; st.moving = true; for (let i = 0; i < 30; i++) { st.now += 16; tpUpdate(1 / 60, st); }
  return { before, after, shirt: !!TP.rig.rig.g && !!TP.rig.rig.g.shirt }; });
check('in play, taking the tunic off rebuilds the body, and it walks', play.after !== play.before, play);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
