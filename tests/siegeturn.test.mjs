// The war at a town, in the world (Session 129's sieges; owed to play in backlog G, *Saves first*: "the war in real play —
// a siege camp on a road, a garrison on a plaza"). Dunmore is besieged by the Mark: its camp of soldiers stands down the
// road. Twelve days on the town falls, and the camp gives way to a garrison on the plaza; kill the garrison and it is free.
// Session 440: when the camp gave way, `tickSieges` took its soldiers' bodies out of the scene but left them among the
// world's foes, so six unseen soldiers stood where the camp had been, still ticked and still striking (a Markish Captain
// took 41 health in five seconds from a player beside him). They now leave the world's foes with their bodies.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
const tick = (n) => page.evaluate((n) => { for (let i = 0; i < n; i++) { WORLD.tick(1 / 60, performance.now()); tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); } }, n);
const count = () => page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); const L = ZONES.world.enemies.filter(e => e._siege === 'dunmore' && !e.dead);
  const seen = L.filter(e => e.mesh && e.mesh.parent); const cx = seen.reduce((a, e) => a + e.homeX, 0) / (seen.length || 1), cz = seen.reduce((a, e) => a + e.homeZ, 0) / (seen.length || 1);
  return { live: L.length, unseen: L.length - seen.length, captains: seen.filter(e => /Captain/.test(e.name)).length, names: [...new Set(seen.map(e => e.name))], fromTown: Math.round(Math.hypot(cx - t.x, cz - t.z)), cx, cz }; });

// the siege: the Mark's camp, the player in the town
await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z; PHP = maxHP; const st = WORLD.TS(t); st.flags.besieged = worldState.gameTimeAbsMinutes || 0; st.siegeBy = 'mark'; st.siegeDay = 0; });
await tick(120);
const siege = await count();
console.log('siege', JSON.stringify(siege));
check('besieged, the Mark’s camp stands down the road: six soldiers and their captain, away from the plaza', siege.live === 6 && siege.unseen === 0 && siege.captains === 1 && siege.names.includes('Markish Soldier') && siege.fromTown > 20, siege);

// the town falls: the camp gives way to the garrison
await page.evaluate(() => { const st = WORLD.TS(WORLD.siteAnywhere('dunmore')); delete st.flags.besieged; delete st.siegeBy; st.flags.occupied = worldState.gameTimeAbsMinutes || 0; st.occupier = 'mark'; });
await tick(120);
const occ = await count();
console.log('occupied', JSON.stringify(occ));
check('fallen, the camp’s soldiers are gone from the world’s foes: none is left unseen', occ.unseen === 0, occ);
check('and the garrison holds the plaza: five, a captain among them', occ.live === 5 && occ.captains === 1 && occ.fromTown < 15, occ);

// where the camp stood, nothing strikes a player for five seconds
const quiet = await page.evaluate(([cx, cz]) => { const t = WORLD.siteAnywhere('dunmore'); px = cx; pz = cz; PHP = maxHP; dead = false; PPOST.stagUntil = 0; const h = PHP;
  for (let i = 0; i < 300; i++) { tickZoneEnemies(1 / 60, performance.now(), WORLD.scene); }
  const L = ZONES.world.enemies.filter(e => e._siege === 'dunmore' && !e.dead); const out = { lost: h - PHP, garrisonFrom: Math.round(Math.min(...L.map(e => Math.hypot(e.x - px, e.z - pz)))) };
  px = t.x; pz = t.z; PHP = maxHP; return out; }, [siege.cx, siege.cz]);
console.log('at the old camp', JSON.stringify(quiet));
check('stood where the camp was for five seconds, nothing strikes you', quiet.lost === 0, quiet);

// the garrison killed, the town is free
await page.evaluate(() => { ZONES.world.enemies.filter(e => e._siege === 'dunmore' && !e.dead).forEach(e => { e.dead = true; e.hp = 0; }); });
await tick(120);
const free = await page.evaluate(() => { const st = WORLD.TS(WORLD.siteAnywhere('dunmore')); return { occupied: st.flags.occupied != null, besieged: st.flags.besieged != null }; });
console.log('freed', JSON.stringify(free));
check('the garrison dead, Dunmore is free', !free.occupied && !free.besieged, free);
check('no page errors', g.errs.length === 0, g.errs);
await page.evaluate(() => { const st = WORLD.TS(WORLD.siteAnywhere('dunmore')); delete st.flags.occupied; delete st.occupier; });
await g.close();
