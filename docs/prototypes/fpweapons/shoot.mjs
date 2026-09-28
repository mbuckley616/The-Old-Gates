// node docs/prototypes/fpweapons/shoot.mjs -> docs/prototypes/fpweapons-*.png
// Session 232: the first-person weapon (buildViewmodel) is still built from boxes, while the third-person weapon is the kit
// (Sessions 226–227). Michael's answer on Session 220 named third person; this asks about first person. The prototype
// builds today's view model for five items, then the same with its weapon meshes hidden and the kit's weapon (tpWeapon,
// tinted by the item) at the fist; hands, arms and position unchanged. index.html is not changed.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld();
const shots = await page.evaluate(() => { forceTime(11); thirdPerson = false; const cv = REN.domElement; const out = {};
  const items = [{ name: 'Steel Sword', slot: 'weapon', weaponShape: 'sword', matCol: '#dde8ec', matGuard: '#a0b0b8' }, { name: 'Iron War Axe', slot: 'weapon', weaponShape: 'axe', matCol: '#a8b0b8', matGuard: '#787880' },
    { name: 'Iron Mace', slot: 'weapon', weaponShape: 'mace', matCol: '#a8b0b8', matGuard: '#787880' }, { name: 'Hunting Bow', slot: 'weapon', weaponShape: 'bow', twoHand: true, matCol: '#6a4a2a' }, { name: 'Oak Staff', slot: 'weapon', weaponShape: 'staff', twoHand: true, matGlow: '#88aaff' }];
  const snap = () => { REN.render(scene, CAM); if (vmSword) vmSword.updateMatrixWorld(true); try { _updateArmBridge(vmArmR); _updateArmBridge(vmArmL); } catch (e) {} REN.autoClear = false; REN.clearDepth(); REN.render(VM_SCENE, VM_CAM); REN.autoClear = true;
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o; };
  const kitOn = w => { const hands = new Set(); const mark = o => o && o.traverse(c => hands.add(c)); mark(vmSword.userData.handMain); mark(vmSword.userData.handLow);
    vmSword.traverse(o => { if (o !== vmSword && o.isMesh && !hands.has(o)) o.visible = false; }); vmSword.traverse(o => { if (o.isLight) o.visible = false; });
    const k = tpWeapon(w); k.position.set(0, vmSword.userData.handMain.position.y, 0); vmSword.add(k);
    // the view scene has no environment for a metal to reflect: in first person the kit's metal is duller and lit by its colour
    k.traverse(o => { if (o.isMesh && o.material.metalness > .3) { o.material = o.material.clone(); o.material.metalness = .25; o.material.roughness = .4; } }); return k; };
  const rows = { today: [], kit: [] };
  for (const w of items) { EQ.weapon = w; buildViewmodel(); rows.today.push(snap()); kitOn(w); rows.kit.push(snap()); }
  // a grid: today's above, the kit below; each cell the right half of the frame, where the weapon is
  const cw = cv.width / 2, ch = cv.height, sx = 256 / cw, W = 256 * items.length, H = Math.round(ch * sx) * 2; const grid = document.createElement('canvas'); grid.width = W; grid.height = H; const x2 = grid.getContext('2d');
  ['today', 'kit'].forEach((r, j) => rows[r].forEach((c, i) => x2.drawImage(c, cw, 0, cw, ch, i * 256, j * H / 2, 256, H / 2)));
  x2.fillStyle = '#fff'; x2.font = '14px sans-serif'; x2.fillText('today', 6, 18); x2.fillText('the kit', 6, H / 2 + 18); out.grid = grid.toDataURL();
  // the sword full size, today's and the kit's
  out.sword_today = rows.today[0].toDataURL(); out.sword_kit = rows.kit[0].toDataURL(); return out; });
for (const [k, url] of Object.entries(shots)) fs.writeFileSync(path.join(here, '..', 'fpweapons-' + k + '.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('errors', g.errs); await g.close();
