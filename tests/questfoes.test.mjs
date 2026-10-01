// A foe a quest or the war sets down on purpose is there at any level (Session 386; the critic's s342 finding, 1 Oct).
// `buildZoneEnemy` builds anything whose `minLevel` is above the player's level `locked`: hidden, skipped by
// `tickZoneEnemies`, unhittable, until the player grows into it. That gate is for the wild's own spawns. Hesket Rowe
// in the duel at Caer Slige is a Bandit Captain (minLevel 5), so below level 5 *Call it.* gave an empty ring; so did the
// Fighters' *Blooded* commission (the same captain), the Ogre, Frost Troll and Marsh Hag commissions (minLevel 5–6), and a
// siege camp's captain, whose camp could never be broken because one of its soldiers could never die.
// The same was true of everything built from a Bandit (minLevel 2) at level 1: a siege camp's soldiers, a guild raid,
// a road job's bandits and a caravan's attackers. This drives each it can at level 1 with the real enemy tick and a real swing.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => WORLD.devUnlockAll());
await page.evaluate(() => { level = 1; });

const tickFoes = (n) => page.evaluate((n) => { for (let i = 0; i < n; i++) { WORLD.tick(1 / 60, performance.now()); tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); } }, n);

// 1 — the duel, at level 1
const duel = await page.evaluate(() => {
  const F = WORLD.fstate(); const L = F.league; if (L.active) L.active.turnedIn = true;
  Object.assign(L, { done: 8, rank: 2, active: null, closed: false }); delete L.rowe;
  WORLD.tickDuel(0); forceTime(8); WORLD.anchoredPlaces();
  const seat = WORLD.siteAnywhere(WORLD.FACTIONS.league.seat); px = seat.x; pz = seat.z;
  WORLD.factionTopics(seat).find(t => /^Serve /.test(t.label)).fn(); const q = L.active;
  px = q.data.x; pz = q.data.z + 1; PHP = maxHP; dead = false;
  WORLD.tickDuel(1 / 60); const D = WORLD.duel;
  D.sgt.def.topics.find(x => x.label === 'Call it.').fn(); const e = D.rowe;
  return { level, state: q.data.state, name: e && e.name, locked: e && e.locked, shown: !!(e && e.mesh && e.mesh.visible), inZE: ZONES.world.enemies.includes(e) };
});
console.log('duel at level 1', JSON.stringify(duel));
check('at level 1 *Call it.* puts Rowe in the ring: not latent, shown, among the world\'s foes', duel.level === 1 && duel.state === 'fight' && duel.name === 'Hesket Rowe' && duel.locked === false && duel.shown && duel.inZE, duel);

const walk = await page.evaluate(() => { const e = WORLD.duel.rowe; e.x = px + 4; e.z = pz; e.mesh.position.x = e.x; e.mesh.position.z = e.z; return { d: +Math.hypot(e.x - px, e.z - pz).toFixed(2) }; });
await tickFoes(90);
const walked = await page.evaluate(() => { const e = WORLD.duel.rowe; PHP = maxHP; return { d: +Math.hypot(e.x - px, e.z - pz).toFixed(2), locked: e.locked, alert: e.alert }; });
console.log('rowe closes', JSON.stringify(walk), JSON.stringify(walked));
check('the enemy tick runs her: in 90 ticks she closes from 4 units', walked.d < walk.d - 0.5 && !walked.locked, { walk, walked });

const hit = await page.evaluate(async () => {
  const e = WORLD.duel.rowe; const rnd = Math.random; Math.random = () => .5;
  e.x = px + fwdX * 1.2; e.z = pz + fwdZ * 1.2; e.mesh.position.x = e.x; e.mesh.position.z = e.z; e.spd = 0; e.atkCd = 1e9; e.telegraphT = 0; e.shieldUp = false;
  const hp0 = e.hp; atkCd = 0; stamina = maxStamina; swingT = 0; _pendingStrike = null; attack(false);
  let frames = 0; await new Promise(r => { const f = () => { frames++; if ((swingT === 0 && !_pendingStrike) || frames > 60) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
  Math.random = rnd; return { hp0, hp: e.hp, frames, state: WORLD.duel.q.data.state };
});
console.log('a swing at rowe', JSON.stringify(hit));
check('a swing at her lands: she loses health', hit.hp < hit.hp0, hit);

// 2 — a guild commission's foe, at level 1
const guild = await page.evaluate(() => {
  const G = WORLD.guild.state(); const out = {};
  for (const beast of ['Bandit Captain', 'Ogre', 'Frost Troll', 'Marsh Hag']) {
    G.guild_f.active = { id: 'qf_test_' + beast, g: 'guild_f', kind: 'beast', beast, sx: px + 30, sz: pz, short: 'test' };
    WORLD.tick(1 / 60, performance.now()); WORLD.tick(1 / 60, performance.now());
    const e = ZONES.world.enemies.find(x => x._guildTag === G.guild_f.active.id);
    out[beast] = e ? { locked: e.locked, shown: !!(e.mesh && e.mesh.visible), min: e.minLevel } : null;
    if (e) { e.dead = true; if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1); }
  }
  G.guild_f.active = null; return out;
});
console.log('commissions at level 1', JSON.stringify(guild));
check('at level 1 a commission\'s captain, Ogre, Frost Troll and Marsh Hag are sighted and there: none latent', Object.values(guild).every(v => v && v.locked === false && v.shown), guild);

// 3 — a siege camp's captain, at level 1
await g.settle('dunmore');
await page.evaluate(() => { level = 1; const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 4; const st = WORLD.TS(t); st.flags.besieged = true; st.siegeBy = 'mark'; st.siegeDay = Math.floor((worldState.gameTimeAbsMinutes || 0) / 1440); });
await tickFoes(4);
const siege = await page.evaluate(() => {
  const t = WORLD.siteAnywhere('dunmore'); const E = ZONES.world.enemies.filter(e => e._siege === t.id);
  const cap = E.find(e => /Captain/.test(e.name));
  return { n: E.length, cap: cap && cap.name, locked: cap && cap.locked, shown: !!(cap && cap.mesh && cap.mesh.visible), latent: E.filter(e => e.locked).length };
});
console.log('siege at level 1', JSON.stringify(siege));
check('at level 1 the siege camp\'s captain stands with his soldiers, none of them latent', siege.n >= 6 && siege.cap && siege.locked === false && siege.shown && siege.latent === 0, siege);
await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); ZONES.world.enemies.filter(e => e._siege === t.id).forEach(e => { e.hp = -5; killZoneEnemy(e, WORLD.scene, ''); }); });
await tickFoes(4);
const broke = await page.evaluate(() => { const st = WORLD.TS(WORLD.siteAnywhere('dunmore')); return { besieged: st.flags.besieged }; });
check('all of them down, the siege breaks', broke.besieged == null, broke);

// 4 — a guild raid's bandits (Bandit is minLevel 2), at level 1 (the town is rebuilt after its siege: wait for it)
await g.settle('dunmore');
const raid = await page.evaluate(() => {
  level = 1; const G = WORLD.guild.state(); const t = WORLD.siteAnywhere('dunmore');
  G.guild_f.active = { id: 'qf_test_raid', g: 'guild_f', kind: 'raid', siteId: t.id, count: 4, short: 'test' };
  WORLD.tick(1 / 60, performance.now()); WORLD.tick(1 / 60, performance.now());
  const E = ZONES.world.enemies.filter(x => x._guildTag === 'qf_test_raid');
  const out = { n: E.length, latent: E.filter(e => e.locked).length, shown: E.filter(e => e.mesh && e.mesh.visible).length };
  E.forEach(e => { e.dead = true; if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1); });
  G.guild_f.active = null; return out;
});
console.log('raid at level 1', JSON.stringify(raid));
check('at level 1 *Raiders! 4 of them* brings four raiders you can see and fight', raid.n === 4 && raid.latent === 0 && raid.shown === 4, raid);

// 5 — the wild's own gate still holds
const wild = await page.evaluate(() => { const e = buildZoneEnemy(WORLD.scene, [], px + 50, pz, 'Ogre', null); const out = { locked: e.locked, shown: e.mesh.visible }; WORLD.scene.remove(e.mesh); return out; });
check('a wild Ogre built at level 1 is still latent (the minLevel gate is unchanged for the wild)', wild.locked === true && wild.shown === false, wild);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
