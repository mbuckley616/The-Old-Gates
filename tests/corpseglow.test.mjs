// A foe killed inside a guard-break flash does not glow orange as a corpse (Session 626; the critic, 7 Oct 2026). A guard
// break lights the body's material orange (`emissive` 0xffaa00) and a 220 ms timer puts it back. The kill (`killE` in a
// dungeon, `killZoneEnemy` in the open) clones every material of the body to darken it, so a kill inside those 220 ms
// copied the orange into the corpse, and the timer then cleared the material the corpse no longer wore. Each foe here is
// flashed as the guard-break code does it, killed at once, and read after the timer has run.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._flashKill = (e, kill) => { const body = enemyBodyMesh(e), m = body && body.material;
    if (m && m.emissive) { m.emissive.setHex(0xffaa00); setTimeout(() => { if (m && m.emissive) m.emissive.setHex(0); }, 220); }
    const flashed = !!(m && m.emissive); kill(e); return flashed; };
  window._glow = (e) => { let n = 0, lit = 0; e.mesh.traverse(c => { if (c.isMesh && c.material && c.material.emissive) { n++; if (c.material.emissive.getHex() === 0xffaa00) lit++; } }); return { n, lit }; }; });
const open = await page.evaluate(() => { const out = [], L = ZONES.world.enemies; const t = WORLD.siteAnywhere('dunmore');
  for (const kind of ['Bandit', 'Skeleton', 'Wolf', 'Troll']) { px = t.x + 40; pz = t.z + 40;
    const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px, pz - 2, kind, null)); L.push(e);
    const flashed = _flashKill(e, e => killZoneEnemy(e, WORLD.scene)); out.push({ kind, flashed, e }); }
  window._openDead = out; return out.length; });
await page.waitForTimeout(600);
const openRes = await page.evaluate(() => _openDead.map(o => ({ kind: o.kind, flashed: o.flashed, dead: !!o.e.dead, ..._glow(o.e) })));
console.log(' open', JSON.stringify(openRes));
await enterDungeon(page, { theme: 'ruins', seed: 11, interior: 'fort_linear', size: 'medium' });
await page.evaluate(() => { const live = ENEMIES.filter(e => !e.dead && !e.disguised && e.mesh).slice(0, 4);
  window._dunDead = live.map(e => ({ kind: e.name, flashed: _flashKill(e, e => killE(e)), e })); });
await page.waitForTimeout(600);
const dunRes = await page.evaluate(() => _dunDead.map(o => ({ kind: o.kind, flashed: o.flashed, dead: !!o.e.dead, ..._glow(o.e) })));
console.log(' dungeon', JSON.stringify(dunRes));
const all = [...openRes, ...dunRes];
check('eight foes flashed and killed, four in the open and four in a fort', openRes.length === 4 && dunRes.length === 4 && all.every(o => o.flashed && o.dead), all);
check('no corpse keeps the flash: no material of the body is still 0xffaa00 after the timer', all.every(o => o.n > 0 && o.lit === 0), all);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
