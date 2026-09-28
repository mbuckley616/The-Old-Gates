// The player's weapons and shields in third person on the weapon kit (Session 227, Michael's answer A on Session 220): the
// kit's blades, axes, maces and bows in place of the boxes, tinted by the item's own metal, guard and glow.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const shapes = await page.evaluate(() => { const S = ['dagger', 'sword', 'scimitar', 'longsword', 'claymore', 'axe', 'greataxe', 'mace', 'flail', 'warhammer', 'greatclub', 'staff', 'bow'];
  return S.map(sh => { const w = tpWeapon({ name: 'Test ' + sh, weaponShape: sh }); let boxes = 0, meshes = 0; w.traverse(o => { if (o.isMesh) { meshes++; if (o.geometry.type === 'BoxGeometry') boxes++; } });
    const bb = new THREE.Box3().setFromObject(w); return { sh, kit: w.userData.kit, boxes, meshes, h: +(bb.max.y - bb.min.y).toFixed(2), bow: !!w.userData.bow }; }); });
check('every weapon shape the items name builds from the kit, with no box', shapes.every(s => s.kit && s.boxes === 0 && s.meshes >= 1), shapes);
const H = Object.fromEntries(shapes.map(s => [s.sh, s.h]));
check('blades grow from dagger to sword to longsword to claymore; the great axe outreaches the axe', H.dagger < H.sword && H.sword < H.longsword && H.longsword < H.claymore && H.greataxe > H.axe && shapes.find(s => s.sh === 'bow').bow, H);

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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
