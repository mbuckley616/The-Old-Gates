// The log names a named foe without *a* (Session 697, the critic's s482: *First blood — slew a Carrigowen the Marsh Hag*,
// and *a Carrigowen — Cave Bear* in the cavern). `foeLogName(e)` gives a lair's beast, a cavern's master, a wyrm or a duel's
// rival bare, and the rest *a* or *an* as the word begins (*an Ogre*, *an Ash Wight*, where the log said *a Ogre*).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {}; const last = () => GAME_LOG[GAME_LOG.length - 1].text;
  // the open world, through killZoneEnemy itself: a lair's beast as siteCreatures names it, an Ogre, a Wolf
  const mk = (name, extra) => { const e = buildZoneEnemy(WORLD.scene, [], px + 30, pz + 30, name, null); WORLD.scene.add(e.mesh); e.mesh.visible = false; Object.assign(e, extra || {}); ZONES.world.enemies.push(e); return e; };
  const hag = mk('Marsh Hag', { name: 'Carrigowen the Marsh Hag', boss: true, lair: 'test' }); killZoneEnemy(hag, WORLD.scene); out.hag = last();
  const ogre = mk('Ogre'); seenEnemyTypes.delete(ogre.name); killZoneEnemy(ogre, WORLD.scene); out.ogre = last();
  const wolf = mk('Wolf'); seenEnemyTypes.delete(wolf.name); killZoneEnemy(wolf, WORLD.scene); out.wolf = last();
  out.names = { master: foeLogName({ name: 'Carrigowen — Cave Bear', master: true, boss: true }), wyrm: foeLogName({ name: 'Carrigowen Wyrm', boss: true, dragon: true }),
    rival: foeLogName({ name: 'Rowe', _duel: true }), wight: foeLogName({ name: 'Ash Wight' }), skel: foeLogName({ name: 'Skeleton' }), dash: foeLogName({ name: 'Glenree — Ogre' }) };
  return out; });
console.log(JSON.stringify(r));
check('a lair\'s beast is named bare: *First blood — slew Carrigowen the Marsh Hag*', r.hag === 'First blood — slew Carrigowen the Marsh Hag', r.hag);
check('an Ogre takes *an*', r.ogre === 'First blood — slew an Ogre', r.ogre);
check('a Wolf keeps *a*', r.wolf === 'First blood — slew a Wolf', r.wolf);
check('a master, a wyrm and a duel\'s rival bare; a name with a dash bare', r.names.master === 'Carrigowen — Cave Bear' && r.names.wyrm === 'Carrigowen Wyrm' && r.names.rival === 'Rowe' && r.names.dash === 'Glenree — Ogre', r.names);
check('an Ash Wight, a Skeleton', r.names.wight === 'an Ash Wight' && r.names.skel === 'a Skeleton', r.names);
// the cavern's log, through killE: the master and a Cave Troll (*Slew a Cave Troll in …*)
await page.evaluate(() => { window._lairBoss = null; const p = Object.assign({}, PORTALS[0], { theme: 'deep', seed: 4021, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, lair: { place: 'Carrigowen', boss: 'Cave Bear' } }); goToDungeon(p); });
for (let k = 0; k < 60; k++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon' && !!window._lairBoss)) break; }
const d = await page.evaluate(() => { const e = window._lairBoss; seenEnemyTypes.delete(e.name); killE(e); const a = GAME_LOG[GAME_LOG.length - 1].text;
  const t = ENEMIES.find(x => !x.dead && x !== e); t.name = 'Cave Troll'; seenEnemyTypes.add('Cave Troll'); killE(t); const b = GAME_LOG[GAME_LOG.length - 1].text; return { a, b }; });
console.log(JSON.stringify(d));
check('the cavern\'s master: *First blood — slew Carrigowen — Cave Bear*', d.a === 'First blood — slew Carrigowen — Cave Bear', d.a);
check('a brute again: *Slew a Cave Troll in …*', /^Slew a Cave Troll in /.test(d.b), d.b);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
