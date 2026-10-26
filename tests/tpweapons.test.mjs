// The player's weapons and shields in third person on the weapon kit (Session 227, Michael's answer A on Session 220): the
// kit's blades, axes, maces and bows in place of the boxes, tinted by the item's own metal, guard and glow.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const shapes = await page.evaluate(() => { const S = ['dagger', 'sword', 'scimitar', 'longsword', 'claymore', 'axe', 'greataxe', 'mace', 'flail', 'warhammer', 'greatclub', 'staff', 'bow', 'spear', 'crossbow'];
  return S.map(sh => { const w = tpWeapon({ name: 'Test ' + sh, weaponShape: sh }); let boxes = 0, meshes = 0; w.traverse(o => { if (o.isMesh) { meshes++; if (o.geometry.type === 'BoxGeometry') boxes++; } });
    const bb = new THREE.Box3().setFromObject(w); return { sh, kit: w.userData.kit, boxes, meshes, h: +(bb.max.y - bb.min.y).toFixed(2), bow: !!w.userData.bow }; }); });
check('every weapon shape the items name builds from the kit, with no box', shapes.every(s => s.kit && s.boxes === 0 && s.meshes >= 1), shapes);
const H = Object.fromEntries(shapes.map(s => [s.sh, s.h]));
check('blades grow from dagger to sword to longsword to claymore; the great axe outreaches the axe', H.dagger < H.sword && H.sword < H.longsword && H.longsword < H.claymore && H.greataxe > H.axe && shapes.find(s => s.sh === 'bow').bow && H.spear > 2 && H.crossbow > .8 && H.crossbow < 1.1 /* S1458 */, H);

// the item's own colours: an elven blade's metal and a gilt guard reach the vertex colours; the same item shares its geometry
const tint = await page.evaluate(() => { const it = { name: 'Elven Sword', weaponShape: 'sword', matCol: '#9ad8b0', matGuard: '#d8b040' };
  const a = tpWeapon(it), b = tpWeapon(it), c = tpWeapon({ name: 'Iron Sword', weaponShape: 'sword' }); const has = (w, hex) => { const t = new THREE.Color(hex); let n = 0; w.traverse(o => { if (!o.isMesh) return; const C = o.geometry.attributes.color; for (let i = 0; i < C.count; i++) if (Math.abs(C.getX(i) - t.r) + Math.abs(C.getY(i) - t.g) + Math.abs(C.getZ(i) - t.b) < .01) n++; }); return n; };
  const geo = w => w.children[0].children[0].geometry; return { blade: has(a, 0x9ad8b0), guard: has(a, 0xd8b040), ironHasElven: has(c, 0x9ad8b0), shared: geo(a) === geo(b), differs: geo(a) !== geo(c) }; });
check('an item\'s own metal and guard colour the kit; the same item shares its geometry, another does not', tint.blade > 50 && tint.guard > 20 && tint.ironHasElven === 0 && tint.shared && tint.differs, tint);

// on the body: a sword in the right hand and a round shield on the left forearm; then a kite shield
const body = await page.evaluate(() => { thirdPerson = true; EQ.weapon = { name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword' }; EQ.offhand = { name: 'Round Shield', slot: 'offhand', shieldType: 'shield' };
  tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 1.6, now: performance.now() }); let R = TP.rig; const a = { sword: R.weapon && R.weapon.parent === R.handR && R.weapon.userData.kit, shield: R.shield && R.shield.parent === R.elL && R.shield.userData.kit };
  EQ.offhand = { name: 'Kite Shield', slot: 'offhand', shieldType: 'shield', matCol: '#3a4a8a' }; EQ.weapon = { name: 'Hunting Bow', slot: 'weapon', weaponShape: 'bow', twoHand: true };
  tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 1.6, now: performance.now() + 20 }); R = TP.rig; const kite = R.shield && R.shield.userData.kit, bowLeft = R.weaponL && R.weaponL.parent === R.handL && R.weaponL.userData.kit;
  EQ.offhand = { name: 'Tower Shield', slot: 'offhand', shieldType: 'shield' }; tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 1.6, now: performance.now() + 40 }); R = TP.rig; return { ...a, kite, bowLeft, tower: R.shield && R.shield.userData.kit }; });
check('the sword goes in the right hand and the round shield on the left forearm; a kite shield and a bow in the left hand likewise; a tower shield its own shape (S231)', body.sword === 'sword' && body.shield === 'round' && body.kite === 'kite' && body.bowLeft === 'bow' && body.tower === 'tower', body);

// S1458 — the spear and the crossbow in the right hand alone (the crossbow two-handed for the shield's sake, carried in one fist, its prod down)
const pair = await page.evaluate(() => { const o = {}; for (const [k, w] of [['spear', { name: 'Iron Spear', slot: 'weapon', weaponShape: 'spear' }], ['crossbow', { name: 'Iron Crossbow', slot: 'weapon', weaponShape: 'crossbow', twoHand: true }]]) {
    EQ.weapon = w; EQ.offhand = null; tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 1.6, now: performance.now() + 60 }); const R = TP.rig; o[k] = { kit: R.weapon && R.weapon.parent === R.handR && R.weapon.userData.kit, twoH: R.twoH, left: !!R.weaponL }; }
  return o; });
check('the spear and the crossbow are the kit\'s, in the right hand alone (S1458)', pair.spear.kit === 'spear' && pair.crossbow.kit === 'crossbow' && !pair.crossbow.twoH && !pair.crossbow.left && !pair.spear.twoH, pair);

// the photograph: the kit tinted as the items tint it, in a row, and the player with sword and shield from behind
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = scene; const bx = px + 300, bz = pz, y = 60; const objs = [];
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .02, 100);
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshLambertMaterial({ color: 0x3a3430 })); bg.position.set(bx, y + .6, bz - .4); sc.add(bg); objs.push(bg);
  const L = new THREE.PointLight(0xfff0d8, 1.2, 8); L.position.set(bx + .5, y + 1.6, bz + 1.6); sc.add(L); objs.push(L);
  const items = [['dagger'], ['sword', '#9ad8b0', '#d8b040'], ['scimitar'], ['longsword'], ['claymore', '#5a5e68'], ['axe'], ['greataxe'], ['mace'], ['flail'], ['warhammer'], ['greatclub'], ['staff', null, null, '#ff7040'], ['bow']];
  items.forEach(([sh, m, gd, gl], i) => { const w = tpWeapon({ name: sh, weaponShape: sh, matCol: m, matGuard: gd, matGlow: gl }); w.position.set(bx - 2.4 + i * .4, y + .05, bz); w.rotation.y = sh === 'bow' ? Math.PI / 2 + .3 : .5; w.scale.setScalar(.8); sc.add(w); objs.push(w); });
  [['Round Shield', null], ['Kite Shield', '#3a4a8a'], ['Tower Shield', null]].forEach(([n, c], i) => { const k = buildWeapon(/Round/.test(n) ? 'round' : /Tower/.test(n) ? 'tower' : 'kite', { tint: c ? { face: parseInt(c.slice(1), 16) } : null }); k.position.set(i === 2 ? bx + 2.0 : bx + 2.75, i === 2 ? y + 1.3 : y + .75 - (i === 1 ? .6 : 0), bz); k.rotation.y = -Math.PI / 2 + .5; sc.add(k); objs.push(k); });
  cam.position.set(bx + .2, y + .6, bz + 5.4); cam.lookAt(bx + .2, y + .5, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); objs.forEach(x => sc.remove(x)); return o.toDataURL(); });
fs.writeFileSync('tests/out/tpweapons.png', Buffer.from(shot.split(',')[1], 'base64'));
// S1466 — your spear's blow in third person is a thrust: through the coil the shaft comes down level, and at the hit it lies along
// your facing at chest height, its head further out than in the coil; driven by the game's loop at 1/60
const tt = await page.evaluate(async () => { forceTime(11);
  thirdPerson = true; let t = performance.now(); prevT = t; const step = () => { t += 1000 / 60; loop(t); };
  SHEATHED = false; _sheathedItem = null; _lastSwingG = 1e9; EQ.weapon = { name: 'Iron Spear', slot: 'weapon', weaponShape: 'spear', matCol: '#a8b0b8', matGuard: '#787880' }; buildViewmodel();
  for (let i = 0; i < 400; i++) { step(); if (TP.rig && TP.rig.rig && TP.rig.rig.hb && i > 30) break; }
  for (let i = 0; i < 10; i++) step();
  const R = TP.rig; const h = R.hbHeld && R.hbHeld.find(x => x.o === R.weapon); const obj = h ? h.c : R.weapon;
  obj.updateWorldMatrix(true, false); let tipL = null, far = -1; const v = new THREE.Vector3(), o0 = new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld);
  obj.traverse(m => { if (!m.isMesh) return; m.updateWorldMatrix(true, false); const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); const d = v.distanceTo(o0); if (d > far) { far = d; tipL = [m, i]; } } });
  const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), sd = new THREE.Vector3(-f.z, 0, f.x);
  const at = () => { R.root.updateMatrixWorld(true); obj.updateWorldMatrix(true, false); tipL[0].updateWorldMatrix(true, false); const P = new THREE.Vector3().fromBufferAttribute(tipL[0].geometry.attributes.position, tipL[1]).applyMatrix4(tipL[0].matrixWorld);
    const O = new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld), d = P.clone().sub(O).normalize(), rel = P.clone().sub(new THREE.Vector3(px, P.y, pz));
    return { fwd: +d.dot(f).toFixed(2), up: +d.y.toFixed(2), side: +d.dot(sd).toFixed(2), headOut: +rel.dot(f).toFixed(2), headY: +(P.y - worldH(px, pz)).toFixed(2), handY: +(O.y - worldH(px, pz)).toFixed(2) }; };
  const out = { rest: at(), tl: [] }; const S = ANIM_PARAMS.swing, D = S.normalDur; swingT = D; _pendingStrike = { resolveFn: () => {}, isPow: false, fired: false };
  let n = 0; while (swingT > 0 && n++ < 60) { step(); out.tl.push([+(1 - swingT / (vmSword.userData.swingMax || D)).toFixed(2), at()]); }
  const tl = out.tl.map(x => x[1]), hit = tl.reduce((a, b) => b.headOut > a.headOut ? b : a), coil = out.tl.filter(x => x[0] < ANIM_PARAMS.swing.antEnd).map(x => x[1]).pop();
  thirdPerson = false; EQ.weapon = null; buildViewmodel(); return { rest: out.rest, coil, hit, frames: tl.length }; });
console.log('  thrust:', JSON.stringify(tt));
check(`your spear thrusts in third person: coiled, the shaft ${(Math.asin(tt.coil.up) * 57.3).toFixed(0)}° off level; at the hit along your facing (${tt.hit.fwd}), ${(Math.asin(tt.hit.up) * 57.3).toFixed(0)}° up, its head ${tt.hit.headY} m high and ${(tt.hit.headOut - tt.coil.headOut).toFixed(2)} m further out (S1466)`,
  Math.abs(tt.coil.up) < .2 && tt.hit.fwd > .96 && Math.abs(tt.hit.up) < .2 && tt.hit.headY > 1 && tt.hit.headY < 1.7 && tt.hit.headOut - tt.coil.headOut > .35, tt);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
