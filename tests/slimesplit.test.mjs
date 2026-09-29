// The Slime's split (Session 253): killE builds two Small Slimes where a Slime dies, with buildEnemy, but buildEnemy lives
// inside buildDungeon, so every Slime killed threw *buildEnemy is not defined* out of killE: no Small Slimes, and the
// throw broke off whatever called the kill. Found by the main quest's run (Q5, the Vault of the Tide, floor 2).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();
await page.evaluate(() => { const e = WORLD.doorAnywhere(845); const p = makePortalDef(e); const wp = WORLD.dungeonPos[845]; if (wp) { p.x = wp.x; p.z = wp.z; } p.zone = 'world'; goToDungeon(p); });
await page.waitForTimeout(6000); await g.hide(); await page.evaluate(() => goToFloor2()); await page.waitForTimeout(3000); await g.hide();
const r = await page.evaluate(() => { const s = ENEMIES.find(e => !e.dead && e.baseType === 'Slime' && e.variant !== 'small'); if (!s) return { slime: false, kinds: [...new Set(ENEMIES.map(e => e.baseType))] };
  const before = ENEMIES.length; let err = null; try { s.hp = 0; killE(s); } catch (e) { err = String(e); }
  const small = ENEMIES.slice(before).filter(e => e.name === 'Small Slime');
  return { slime: true, err, small: small.length, inScene: small.filter(e => e.mesh && e.mesh.parent === dScene).length, near: small.every(e => Math.hypot(e.x - s.x, e.z - s.z) < 1), floor: small.map(e => e.floor) }; });
console.log(' ', JSON.stringify(r));
check('there is a Slime on floor 2 of the Vault of the Tide', r.slime, r);
check('killed, it splits into two Small Slimes at the spot, in the scene, without an error', !r.err && r.small === 2 && r.inScene === 2 && r.near, r);
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
