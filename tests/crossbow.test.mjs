// The crossbow (Session 1457; Michael's 2 A on #745): no draw. A click shoots at once at the bow's full draw ×1.15 (×1.61 in
// all) with no sway; then 2.0 s to span, walking (a potion's ×0.5, no sprint); a roll or a blow that wounds you starts the span
// over. It shoots bolts, sold beside the arrows at their price; a bow will not take bolts nor a crossbow arrows. Trained by Bow.
// The loop is driven at fixed 1/60 steps, as `bowsway` does.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const drive = (max, step) => { const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
    let t = performance.now(), n = 0; prevT = t; /* every step 1/60, the first too (the loop takes 0.05 after prevT = 0) */
    try { for (; n < max; n++) { if (step && step(n)) break; PHP = maxHP; dead = false; stamina = maxStamina; t += 1000 / 60; loop(t); } }
    finally { window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; } return n; };
  for (const k in K) K[k] = false;
  const w0 = EQ.weapon, a0 = EQ.ammo, o0 = EQ.offhand, out = {};
  const XB = WEAPON_TYPES.find(t => t.type === 'Crossbow'), xb = makeItem(3, XB, null, false);
  out.item = { skill: weaponSkill(xb), twoHand: !!xb.twoHand, ico: xb.ico, wType: xb.wType };
  EQ.weapon = xb; EQ.offhand = null; EQ.ammo = Object.assign({}, BOLT_IRON, { qty: 10 });
  drive(1);
  // S1476 — the span drawn: the string's middle (in the kit's frame) and the bolt, on the first-person piece
  const rig = () => { const k = vmSword.userData.kit, w = k && k.userData.xbow, P = w ? w.userData.xbowParts || {} : {}, s = P.xbowStringL; if (!s) return null;
    const m = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quaternion).multiplyScalar(s.scale.y).add(s.position);
    return { mid: +m.y.toFixed(3), bolt: !!(P.xbowBolt && P.xbowBolt.visible), tip: +vmSword.userData.level.rotation.x.toFixed(3) }; };
  out.rig0 = rig();
  out.fresh = { spanned: xbowSpanned(), move: commitMoveMult(), shot: xbowShoot(), qty: EQ.ammo.qty };
  out.spanFrames = drive(240, n => { if (n === 60) out.rigMid = rig(); return xbowSpanned(); }); drive(1); out.rigSpanned = rig();
  out.moveSpanned = commitMoveMult();
  yaw = .4; pitch = .05; const keep = ZB.length; const shot = xbowShoot(), a = ZB[ZB.length - 1], u = ZB.length > keep ? a.userData : null;
  const cx = -Math.sin(yaw) * Math.cos(pitch), cy = Math.sin(pitch), cz = -Math.cos(yaw) * Math.cos(pitch), L = u ? Math.hypot(u.vx, u.vy, u.vz) : 1;
  out.shot = { shot, qty: EQ.ammo.qty, mult: u ? +(u.roll.m / (skillMult('bow') * (1 + attrEff('finesse') * BOW_FINESSE_DMG))).toFixed(4) : null,
    ang: u ? +(Math.acos(Math.min(1, (u.vx * cx + u.vy * cy + u.vz * cz) / L)) * 180 / Math.PI).toFixed(3) : null, speed: +L.toFixed(2), after: xbowSpanned() };
  if (u) { a.parent && a.parent.remove(a); ZB.splice(ZB.indexOf(a), 1); }
  out.again = xbowShoot();
  // a blow at 1 s into the span starts it over; so does a roll
  drive(60, n => { if (n === 1) out.rigShot = rig(); }); const before = XBOW.spanT; hurtT = .4; drive(1); out.blow = { before: +before.toFixed(3), after: +XBOW.spanT.toFixed(3) };
  out.blowFrames = drive(240, () => xbowSpanned());
  XBOW.spanT = 0; drive(60); const b2 = XBOW.spanT; K['KeyW'] = true; startRoll(performance.now() / 1000, K); K['KeyW'] = false; const rolled = !!ROLL; drive(1);
  out.roll = { rolled, before: +b2.toFixed(3), after: +XBOW.spanT.toFixed(3) };
  // the ammunition: a bow takes no bolts, a crossbow no arrows
  const bow = makeItem(3, WEAPON_TYPES.find(t => t.type === 'Bow'), null, false);
  EQ.weapon = bow; out.bowBolts = _hasArrows(); EQ.ammo = Object.assign({}, ARROW_IRON, { qty: 5 }); out.bowArrows = _hasArrows();
  EQ.weapon = xb; out.xbArrows = _hasArrows();
  out.shop = { stocked: Object.values(SHOP_STOCK).some(s => Array.isArray(s) && s.some(i => i.name === 'Iron Bolt') && s.some(i => i.name === 'Iron Arrow')),
    price: BOLT_IRON.buyPrice === ARROW_IRON.buyPrice && BOLT_IRON.qty === ARROW_IRON.qty && BOLT_IRON.ammoType === 'bolt' };
  // in third person: the driver's piece and the builder's copy of it both spanned, the string on the nut and the bolt laid
  XBOW.spanT = XBOW_SPAN_S; thirdPerson = true; drive(3); { const R = TP.rig, at = o => { const P = o.userData.xbowParts || {}, s = P.xbowStringL; if (!s) return null;
    const m = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quaternion).multiplyScalar(s.scale.y).add(s.position); return { mid: +m.y.toFixed(3), bolt: !!(P.xbowBolt && P.xbowBolt.visible) }; };
    const h = R && R.hbHeld ? R.hbHeld.find(h => h.o === R.weapon) : null;
    out.tp = { drv: R && R.weapon && R.weapon.userData.xbow ? at(R.weapon.userData.xbow) : null, copy: h ? at(h.c) : 'none' }; }
  // S1504 — the body spans it in third person: standing, a second in, the bow is off the hand and stands on its stirrup, both hands on
  // the string; walking it stays in the fist; once spanned it is back in the fist
  { const Wp = o => new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
    const look = () => { const R = TP.rig, k = R.weapon.userData.xbow, H = R.rig.hb, by = H && H.P.byName; R.root.updateMatrixWorld(true);
      const X = XBOW_RIG, f = xbowSpanPose().f, mid = k.localToWorld(new THREE.Vector3(X.px, X.restY + (X.nutY - X.restY) * f, 0));
      const wr = by ? [by['wrist.L'], by['wrist.R']] : [R.handL, R.handR];
      return { w: +(R.xw || 0).toFixed(3), off: R.weapon.parent === R.root, fist: R.weapon.parent === R.handR, stir: +(k.localToWorld(new THREE.Vector3(0, .70, 0)).y - jumpY).toFixed(3),
        hands: wr.map(b => +Wp(b).distanceTo(mid).toFixed(3)) }; };
    ROLL = null; /* the roll above runs on the wall clock and would start the span over */ XBOW.spanT = 0; drive(60); out.tpSpan = look();
    XBOW.spanT = 0; K['KeyW'] = true; drive(60); out.tpWalk = look(); K['KeyW'] = false;
    drive(240, () => xbowSpanned()); drive(40); out.tpDone = look(); }
  thirdPerson = false;
  EQ.weapon = w0; EQ.ammo = a0; EQ.offhand = o0; drive(1);
  return out;
});
console.log(JSON.stringify(r));
check('a crossbow is a two-handed pierce weapon trained by Bow', r.item.skill === 'bow' && r.item.twoHand && r.item.wType === 'pierce', r.item);
check('taken in hand it is unspanned: no shot, nothing spent, and you walk at ×0.5', !r.fresh.spanned && !r.fresh.shot && r.fresh.qty === 10 && r.fresh.move === .5, r.fresh);
check(`it spans in 2.0 s (${r.spanFrames + 1} frames at 1/60), and spanned you move at full pace`, Math.abs((r.spanFrames + 1) / 60 - 2) <= 2 / 60 && r.moveSpanned === 1, r);
check(`a click shoots one bolt at once at the full draw ×1.15 (×${r.shot.mult}), true to the crosshair (${r.shot.ang}°)`, r.shot.shot && r.shot.qty === 9 && Math.abs(r.shot.mult - 1.61) < 1e-3 && r.shot.ang < .01, r.shot);
check('then it is unspanned and a second click shoots nothing', !r.shot.after && !r.again, r);
check(`a blow 1 s into the span starts it over (${r.blow.before} → ${r.blow.after}); then 2.0 s more`, r.blow.before > .9 && r.blow.after < .02 && Math.abs((r.blowFrames + 1) / 60 - 2) <= 2 / 60, r);
check(`so does a roll (${r.roll.before} → ${r.roll.after})`, r.roll.rolled && r.roll.before > .9 && r.roll.after < .02, r.roll);
check(`the span is drawn: braced at the prod with no bolt when taken (${r.rig0 && r.rig0.mid}), hauled back by 1 s (${r.rigMid && r.rigMid.mid}, the prod tipped ${r.rigMid && r.rigMid.tip}), on the nut with the bolt laid once spanned (${r.rigSpanned && r.rigSpanned.mid}), home again when shot (S1476)`,
  r.rig0 && r.rig0.mid > .48 && !r.rig0.bolt && r.rigMid.mid < .4 && r.rigMid.mid > .17 && !r.rigMid.bolt && r.rigMid.tip > -1.4 && Math.abs(r.rigSpanned.mid - .163) < .002 && r.rigSpanned.bolt && Math.abs(r.rigSpanned.tip + 1.5) < .01 && r.rigShot.mid > .48 && !r.rigShot.bolt, r);
check('in third person the carried crossbow is spanned too, the builder\'s copy as the driver\'s piece (S1476)', r.tp.drv && Math.abs(r.tp.drv.mid - .163) < .002 && r.tp.drv.bolt && (r.tp.copy === 'none' || (r.tp.copy && Math.abs(r.tp.copy.mid - .163) < .002 && r.tp.copy.bolt)), r.tp);
check(`in third person the body spans it: a second in, standing, the bow stands on its stirrup (${r.tpSpan.stir} m up) off the hand, both wrists by the string (${r.tpSpan.hands} m) (S1504)`,
  r.tpSpan.w > .95 && r.tpSpan.off && r.tpSpan.stir > -.02 && r.tpSpan.stir < .08 && r.tpSpan.hands.every(d => d < .2), r.tpSpan);
check(`walking through the span it stays in the fist (${r.tpWalk.w}), and spanned it is back in the fist (${r.tpDone.w}) (S1504)`, r.tpWalk.w < .02 && r.tpWalk.fist && r.tpDone.w === 0 && r.tpDone.fist, { walk: r.tpWalk, done: r.tpDone });
check('a bow takes no bolts, a crossbow no arrows', !r.bowBolts && r.bowArrows && !r.xbArrows, r);
check('bolts are sold beside arrows, the same dozen at the same price', r.shop.stocked && r.shop.price, r.shop);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
