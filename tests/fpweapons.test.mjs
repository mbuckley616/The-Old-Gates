// The weapon kit in first person (Session 266, H.4, Michael's A on Session 232: every weapon; "check the bow again, it looks
// like it's facing backwards, towards the player"): the view model's box weapon hidden, the kit's in the fist; the bow's
// belly away from the eye and its string (the view model's own, which draws back) towards it; the Forge-Man's Hammer its own.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { forceTime(11); thirdPerson = false; const cv = REN.domElement; const out = {}, tiles = [];
  const items = [{ name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', matCol: '#dde8ec', matGuard: '#a0b0b8' }, { name: 'Iron War Axe', slot: 'weapon', weaponShape: 'axe', matCol: '#a8b0b8', matGuard: '#787880' },
    { name: 'Iron Mace', slot: 'weapon', weaponShape: 'mace', matCol: '#a8b0b8', matGuard: '#787880' }, { name: 'Hunting Bow', slot: 'weapon', weaponShape: 'bow', twoHand: true, matCol: '#6a4a2a' },
    { name: 'Oak Staff', slot: 'weapon', weaponShape: 'staff', twoHand: true, matGlow: '#88aaff' }, { name: "The Forge-Man's Hammer", slot: 'weapon', weaponShape: 'warhammer', matCol: '#6a6a70' },
    { name: 'Iron Spear', slot: 'weapon', weaponShape: 'spear', matCol: '#a8b0b8', matGuard: '#787880' }, { name: 'Iron Crossbow', slot: 'weapon', weaponShape: 'crossbow', twoHand: true, matCol: '#a8b0b8', matGuard: '#787880' }];
  const snap = () => { REN.render(scene, CAM); vmSword.updateMatrixWorld(true); try { _updateArmBridge(vmArmR); _updateArmBridge(vmArmL); } catch (e) { } REN.autoClear = false; REN.clearDepth(); REN.render(VM_SCENE, VM_CAM); REN.autoClear = true;
    const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height; o.getContext('2d').drawImage(cv, cv.width / 2, 0, cv.width / 2, cv.height, 0, 0, cv.width / 2, cv.height); return o; };
  for (const w of items) { EQ.weapon = w; buildViewmodel(); const k = vmSword.userData.kit; const hands = new Set(); [vmSword.userData.handMain, vmSword.userData.handLow, vmSword.userData.bowStringTopGroup, vmSword.userData.bowStringBotGroup, vmSword.userData.bowNockArrow].forEach(o => o && o.traverse(c => hands.add(c))); // (the hands, and the bow's own string and arrow, which stay)
    let boxShown = 0, kitShown = 0; vmSword.traverse(o => { if (!o.isMesh || hands.has(o)) return; let p = o, inKit = false; while (p) { if (p === k) inKit = true; p = p.parent; } if (!o.visible) return; if (inKit) kitShown++; else boxShown++; });
    const res = { kit: !!k, kitShown, boxShown };
    if (w.weaponShape === 'bow' && k) { // the bow's belly: its grip (the tube's middle) lies further from the eye (−z in the view) than its tips
      const v = new THREE.Vector3(); let mid = 0, midN = 0, tip = 0, tipN = 0; vmSword.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(vmSword.matrixWorld).invert();
      k.traverse(m => { if (!m.isMesh) return; const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv); if (Math.abs(v.y) < .05) { mid += v.z; midN++; } else if (Math.abs(v.y) > .36) { tip += v.z; tipN++; } } });
      res.midZ = +(mid / midN).toFixed(3); res.tipZ = +(tip / tipN).toFixed(3); res.string = !!(vmSword.userData.bowStringTopGroup && vmSword.userData.bowStringTopGroup.children[0].visible); }
    // S1458 — a spear or a crossbow points ahead: its far end (the head, the prod) is further from the eye than the fist, and above it
    if (k && (w.weaponShape === 'spear' || w.weaponShape === 'crossbow')) { vmSword.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(vmSword.matrixWorld).invert(), v = new THREE.Vector3(), c = new THREE.Vector3();
      let far = null; k.traverse(m => { if (!m.isMesh) return; const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv); if (!far || v.z < far.z) far = v.clone(); } });
      vmSword.userData.handMain.getWorldPosition(c).applyMatrix4(inv); res.ahead = +(c.z - far.z).toFixed(3); res.up = +(far.y - c.y).toFixed(3); res.kitKind = k.userData.kit; }
    out[w.name] = res; tiles.push(snap()); }
  const c = document.createElement('canvas'); c.width = tiles[0].width * tiles.length / 2; c.height = tiles[0].height / 2; const x = c.getContext('2d'); tiles.forEach((t, i) => x.drawImage(t, i * t.width / 2, 0, t.width / 2, t.height / 2));
  EQ.weapon = null; buildViewmodel(); return { out, shot: c.toDataURL() }; });
fs.writeFileSync('tests/out/fpweapons.png', Buffer.from(r.shot.split(',')[1], 'base64'));
const o = r.out; console.log(JSON.stringify(o));
check('every weapon but the Forge-Man\'s Hammer shows the kit in first person, and none of the box weapon', Object.entries(o).filter(([k]) => !/Forge/.test(k)).every(([, v]) => v.kit && v.kitShown > 0 && v.boxShown === 0), o);
check('the Forge-Man\'s Hammer keeps its own model', !o["The Forge-Man's Hammer"].kit && o["The Forge-Man's Hammer"].boxShown > 0, o["The Forge-Man's Hammer"]);
check('the bow faces out: its grip further from the eye than its tips, and its string (the view model\'s, which draws) shown', o['Hunting Bow'].midZ < o['Hunting Bow'].tipZ - .03 && o['Hunting Bow'].string, o['Hunting Bow']);
check('the spear and the crossbow are the kit\'s own, pointing ahead of the fist: the head 0.8 m or more out, the prod 0.4 m (S1458)', o['Iron Spear'].kitKind === 'spear' && o['Iron Spear'].ahead > .8 && o['Iron Spear'].up > 0 && o['Iron Crossbow'].kitKind === 'crossbow' && o['Iron Crossbow'].ahead > .4 && o['Iron Crossbow'].up > 0, { spear: o['Iron Spear'], crossbow: o['Iron Crossbow'] });
// S1465 — your spear's blow is a thrust: through a swing (the loop's own frames) its head goes out along the shaft and back, and the
// shaft keeps its line, where a sword's swing turns the blade through a wide arc
const th = await page.evaluate(() => { thirdPerson = false; let t = performance.now(); prevT = t; const step = () => { t += 1000 / 60; loop(t); };
  const run = w => { SHEATHED = false; _sheathedItem = null; _lastSwingG = 1e9; EQ.weapon = w; buildViewmodel(); swingT = 0; _pendingStrike = null; for (let i = 0; i < 4; i++) step(); const k = vmSword.userData.kit, h = vmSword.userData.handMain; vmSword.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(vmSword.matrixWorld).invert(), v = new THREE.Vector3(); let tip = null, tm = null;
    k.traverse(m => { if (!m.isMesh) return; const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv); if (!tip || v.z < tip.z) { tip = v.clone(); tm = [m, i]; } } });
    const at = () => { const P = new THREE.Vector3().fromBufferAttribute(tm[0].geometry.attributes.position, tm[1]); vmSword.updateMatrixWorld(true); P.applyMatrix4(tm[0].matrixWorld); const H = h.getWorldPosition(new THREE.Vector3()); return { P, d: P.clone().sub(H).normalize() }; };
    const r0 = at(); let out = 0, back = 0, turn = 0, n = 0; swingT = ANIM_PARAMS.swing.normalDur; vmSword.userData.swingMax = 0; _pendingStrike = { resolveFn: () => {}, isPow: false, fired: false };
    while (swingT > 0 && n++ < 120) { step(); const a = at(); out = Math.max(out, r0.P.z - a.P.z); back = Math.max(back, a.P.z - r0.P.z); turn = Math.max(turn, Math.acos(Math.min(1, a.d.dot(r0.d))) * 57.3); }
    return { out: +out.toFixed(3), back: +back.toFixed(3), turn: +turn.toFixed(1), frames: n }; };
  const sp = run({ name: 'Iron Spear', slot: 'weapon', weaponShape: 'spear', matCol: '#a8b0b8', matGuard: '#787880' }), sw = run({ name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', matCol: '#dde8ec', matGuard: '#a0b0b8' });
  EQ.weapon = null; buildViewmodel(); return { sp, sw }; });
console.log('  thrust:', JSON.stringify(th));
check(`your spear thrusts: its head ${th.sp.out} m out along the shaft and ${th.sp.back} m back in the draw, the shaft turned at most ${th.sp.turn}° (a sword's swing turns its blade ${th.sw.turn}°) (S1465)`,
  th.sp.out > .25 && th.sp.back > .05 && th.sp.turn < 8 && th.sw.turn > 20, th);
// S1550 — Bowyer's longbow and war bow are the kit's own, 1.5× and 1.7× the plain bow, in third person and first, and a long bow at rest is tipped clear of the face
const bl = await page.evaluate(() => { const out = {}, len = o => { o.updateMatrixWorld(true); const s = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()); return Math.max(s.x, s.y, s.z); };
  for (const k of ['bow', 'longbow', 'warbow']) { const it = { name: 'Bow', slot: 'weapon', weaponShape: 'bow', matCol: '#6a4a2a', bowKind: k === 'bow' ? undefined : k };
    const w = tpWeapon(it); EQ.weapon = it; buildViewmodel(); out[k] = { kit: w.children[0].name, tp: +len(w).toFixed(3), fp: +len(vmSword.userData.kit).toFixed(3), tip: vmSword.userData.bowTipY }; }
  EQ.weapon = null; buildViewmodel(); return out; });
console.log('  bows:', JSON.stringify(bl));
check(`the longbow and the war bow are ${(bl.longbow.tp / bl.bow.tp).toFixed(2)}× and ${(bl.warbow.tp / bl.bow.tp).toFixed(2)}× the bow in the hand, ${(bl.longbow.fp / bl.bow.fp).toFixed(2)}× and ${(bl.warbow.fp / bl.bow.fp).toFixed(2)}× in first person, the string hung from tips ${bl.longbow.tip} and ${bl.warbow.tip} (S1550)`,
  bl.longbow.kit === 'weapon:longbow' && bl.warbow.kit === 'weapon:warbow' && Math.abs(bl.longbow.tp / bl.bow.tp - 1.5) < .08 && Math.abs(bl.warbow.tp / bl.bow.tp - 1.7) < .08 &&
  Math.abs(bl.longbow.fp / bl.bow.fp - 1.5) < .08 && Math.abs(bl.warbow.fp / bl.bow.fp - 1.7) < .08 && Math.abs(bl.warbow.tip - .68) < 1e-6, bl);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
