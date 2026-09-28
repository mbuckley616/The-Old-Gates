// The mimic and the chest on the shape kit (Session 198, H.4): every chest is the kit's rounded chest with a barrel lid
// on a hinge; a mimic is the same chest until it wakes, then a mouth — two rows of teeth, eyes under the lid — that gapes
// and bites.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { level = 8; });
let r = null;
for (const [theme, seed] of [['undead', 7], ['haunted', 3], ['ruins', 11], ['undead', 21], ['haunted', 9]]) { await enterDungeon(page, { theme, seed });
  r = await page.evaluate(() => { const m = ENEMIES.find(e => e.limbs && e.limbs.jaw); const ch = CHESTS[0]; const out = { chests: CHESTS.length, mimic: !!m };
    if (ch && ch.lid) { const f = new THREE.Vector3(0, 0, .3), w0 = new THREE.Vector3(); ch.lid.updateMatrixWorld(true); w0.copy(f).applyMatrix4(ch.lid.matrixWorld); const was = ch.lid.rotation.x; ch.lid.rotation.x = -Math.PI / 3; ch.lid.updateMatrixWorld(true); const w1 = f.clone().applyMatrix4(ch.lid.matrixWorld); ch.lid.rotation.x = was; out.lidFrontRises = +(w1.y - w0.y).toFixed(3); out.chestMesh = ch.g ? ch.g.children.filter(o => o.isMesh).length : null; }
    if (!m) return out; const L = m.limbs; out.hiddenTeeth = !L.revealTeeth.userData.rows.some(q => q.visible) && !L.revealEye.visible; out.sameAsChest = m.mesh.children.filter(o => o.userData && o.userData.dunShell === 'chest').length === 1;
    revealMimic(m); out.shownTeeth = L.revealTeeth.userData.rows.every(q => q.visible) && L.revealEye.visible; tickMimicJaws(1000); out.gape = +L.jaw.rotation.x.toFixed(2);
    m.telegraphMax = 1; m.telegraphT = .1; tickMimicJaws(1000); out.bite = +L.jaw.rotation.x.toFixed(2); return out; });
  if (r.mimic) break; }
check('a chest\'s lid turns on its hinge: opened, its front rises', r.lidFrontRises > .1, r);
check('a mimic has a chest\'s body and no mouth showing until it wakes', r.mimic && r.hiddenTeeth, r);
check('woken, it shows two rows of teeth and its eyes, and its jaw gapes; winding up to bite it opens wide', r.shownTeeth && r.gape < -.3 && r.bite < r.gape - .4, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
