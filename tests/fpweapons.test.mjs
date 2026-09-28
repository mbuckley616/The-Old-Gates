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
    { name: 'Oak Staff', slot: 'weapon', weaponShape: 'staff', twoHand: true, matGlow: '#88aaff' }, { name: "The Forge-Man's Hammer", slot: 'weapon', weaponShape: 'warhammer', matCol: '#6a6a70' }];
  const snap = () => { REN.render(scene, CAM); vmSword.updateMatrixWorld(true); try { _updateArmBridge(vmArmR); _updateArmBridge(vmArmL); } catch (e) { } REN.autoClear = false; REN.clearDepth(); REN.render(VM_SCENE, VM_CAM); REN.autoClear = true;
    const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height; o.getContext('2d').drawImage(cv, cv.width / 2, 0, cv.width / 2, cv.height, 0, 0, cv.width / 2, cv.height); return o; };
  for (const w of items) { EQ.weapon = w; buildViewmodel(); const k = vmSword.userData.kit; const hands = new Set(); [vmSword.userData.handMain, vmSword.userData.handLow, vmSword.userData.bowStringTopGroup, vmSword.userData.bowStringBotGroup, vmSword.userData.bowNockArrow].forEach(o => o && o.traverse(c => hands.add(c))); // (the hands, and the bow's own string and arrow, which stay)
    let boxShown = 0, kitShown = 0; vmSword.traverse(o => { if (!o.isMesh || hands.has(o)) return; let p = o, inKit = false; while (p) { if (p === k) inKit = true; p = p.parent; } if (!o.visible) return; if (inKit) kitShown++; else boxShown++; });
    const res = { kit: !!k, kitShown, boxShown };
    if (w.weaponShape === 'bow' && k) { // the bow's belly: its grip (the tube's middle) lies further from the eye (−z in the view) than its tips
      const v = new THREE.Vector3(); let mid = 0, midN = 0, tip = 0, tipN = 0; vmSword.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(vmSword.matrixWorld).invert();
      k.traverse(m => { if (!m.isMesh) return; const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv); if (Math.abs(v.y) < .05) { mid += v.z; midN++; } else if (Math.abs(v.y) > .36) { tip += v.z; tipN++; } } });
      res.midZ = +(mid / midN).toFixed(3); res.tipZ = +(tip / tipN).toFixed(3); res.string = !!(vmSword.userData.bowStringTopGroup && vmSword.userData.bowStringTopGroup.children[0].visible); }
    out[w.name] = res; tiles.push(snap()); }
  const c = document.createElement('canvas'); c.width = tiles[0].width * tiles.length / 2; c.height = tiles[0].height / 2; const x = c.getContext('2d'); tiles.forEach((t, i) => x.drawImage(t, i * t.width / 2, 0, t.width / 2, t.height / 2));
  EQ.weapon = null; buildViewmodel(); return { out, shot: c.toDataURL() }; });
fs.writeFileSync('tests/out/fpweapons.png', Buffer.from(r.shot.split(',')[1], 'base64'));
const o = r.out; console.log(JSON.stringify(o));
check('every weapon but the Forge-Man\'s Hammer shows the kit in first person, and none of the box weapon', Object.entries(o).filter(([k]) => !/Forge/.test(k)).every(([, v]) => v.kit && v.kitShown > 0 && v.boxShown === 0), o);
check('the Forge-Man\'s Hammer keeps its own model', !o["The Forge-Man's Hammer"].kit && o["The Forge-Man's Hammer"].boxShown > 0, o["The Forge-Man's Hammer"]);
check('the bow faces out: its grip further from the eye than its tips, and its string (the view model\'s, which draws) shown', o['Hunting Bow'].midZ < o['Hunting Bow'].tipZ - .03 && o['Hunting Bow'].string, o['Hunting Bow']);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
