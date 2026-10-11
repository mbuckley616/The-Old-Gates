// A flash on one foe lights that foe only (Session 629; the open question in Session 626's devlog). The guard-break flash,
// the tell's glow, the guard-up flash and a drawn guard's tint all write to the body's material (`enemyBodyMesh(e).material`).
// If two foes of one kind shared that material, every foe of the kind on screen would light with the one that broke.
// Two of each kind are built side by side and one is flashed as the guard-break code does it; the other must stay dark.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const open = await page.evaluate(() => { const out = {}; const t = WORLD.siteAnywhere('dunmore');
  for (const kind of ['Wolf', 'Spider', 'Forest Troll', 'Bandit', 'Cave Bear', 'Ash Hound', 'Hollowed', 'Goblin', 'Skeleton', 'Ogre', 'Rogue Mage', 'Shore Wisp']) {
    const a = buildZoneEnemy(WORLD.scene, [], t.x + 40, t.z + 40, kind, null), b = buildZoneEnemy(WORLD.scene, [], t.x + 44, t.z + 40, kind, null);
    const ma = enemyBodyMesh(a).material, mb = enemyBodyMesh(b).material, lit = !!(ma.emissive && mb.emissive); if (lit) ma.emissive.setHex(0xffaa00);
    out[kind] = { same: ma === mb, lit, otherLit: lit && mb.emissive.getHex() === 0xffaa00 }; if (lit) ma.emissive.setHex(0);
    WORLD.scene.remove(a.mesh); WORLD.scene.remove(b.mesh); }
  return out; });
console.log(' open', JSON.stringify(open));
check('in the open, twelve kinds: flashing one foe leaves its twin dark (no body material shared)', Object.keys(open).length === 12 && Object.values(open).every(o => !o.same && !o.otherLit), open);
await page.evaluate(() => { level = 12; });
const dun = {};
for (const [theme, seed] of [['crypt', 3], ['cave', 5], ['mine', 9]]) { await enterDungeon(page, { theme, seed });
  Object.assign(dun, await page.evaluate(() => { const by = {}; for (const e of ENEMIES) if (e.mesh && enemyBodyMesh(e)) (by[e.name] = by[e.name] || []).push(e); const o = {};
    for (const k in by) { const L = by[k]; if (L.length < 2) continue; const m0 = enemyBodyMesh(L[0]).material;
      o[k] = L.slice(1).filter(e => enemyBodyMesh(e).material === m0).length; } return o; })); }
console.log(' dungeon', JSON.stringify(dun));
check('underground, every kind with two or more on a floor gives each its own body material', Object.keys(dun).length >= 6 && Object.values(dun).every(n => n === 0), dun);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
