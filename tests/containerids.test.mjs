// Session 516: the co-op rules' step 3, ids for what has none (CLAUDE.md, Michael's A on #119; backlog K). The open world's
// containers and every corpse now carry the id their loot was already keyed by: a keyed foe's corpse <foe id>:corpse (zone and
// dungeon), a town's barrel or crate <site>:barrel:<n>, a lair's or camp's hoard <site>:chest, a wreck's sea chest
// wreck:<chunk>, a ship's chest <ship id>:chest. A foe with no id leaves a corpse with none.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// a keyed foe's corpse, and an unkeyed one's
const corpses = await page.evaluate(() => { const out = [];
  for (const id of ['300,400:2:0', null]) { let e = unlockFoe(buildZoneEnemy(WORLD.scene, [], px + 3, pz + 3, 'Bandit', null)); if (id) e = keyFoe(e, id);
    ZONES.world.enemies.push(e); const n0 = ZONE_CORPSES.length; killZoneEnemy(e, WORLD.scene); const c = ZONE_CORPSES.length > n0 ? ZONE_CORPSES[ZONE_CORPSES.length - 1] : null; out.push(c ? c.id : 'no corpse'); }
  return out; });
check(`a keyed foe's corpse is <foe id>:corpse (${corpses[0]}); an unkeyed foe's has no id (${corpses[1]})`, corpses[0] === '300,400:2:0:corpse' && corpses[1] === null, corpses);

// a wreck's sea chest: the first chunk out to sea that the hash gives a wreck, built on a stand-in chunk
const wreck = await page.evaluate(() => { for (let r = 2; r < 60; r++) for (let a = 0; a < 24; a++) {
    const cx = Math.floor(px / CHUNK) + Math.round(Math.cos(a / 24 * Math.PI * 2) * r), cz = Math.floor(pz / CHUNK) + Math.round(Math.sin(a / 24 * Math.PI * 2) * r);
    if (hash01(cx, cz, 150) > .06) continue; const ch = { cx, cz, group: new THREE.Group(), loot: [], sol: [] }; const n0 = ZONE_CORPSES.length; spawnWreck(ch);
    if (!ch.loot.length) continue; ZONE_CORPSES.splice(n0); const c = ch.loot[0]; return { chunk: chunkKey(cx, cz), id: c.id, name: c.name }; }
  return null; });
check(`a wreck's sea chest is wreck:<chunk> (${wreck && wreck.id})`, !!wreck && wreck.id === 'wreck:' + wreck.chunk && wreck.name === 'Sea Chest', wreck);

// a ship's chest: a black sail raised under an id, and boarded
const ship = await page.evaluate(() => { let sea = null; for (let r = 200; r < 4000 && !sea; r += 40) for (let a = 0; a < 16; a++) { const x = px + Math.cos(a / 16 * Math.PI * 2) * r, z = pz + Math.sin(a / 16 * Math.PI * 2) * r; if (WORLD.worldH(x, z) < -6) { sea = { x, z }; break; } }
  if (!sea) return null; const keep = { px, pz }; px = sea.x; pz = sea.z; jumpY = 0; const o = spawnOtherShip('pirate', sea.x + 40, sea.z + 10, 'sea:test:1:pirate'); boardOther(o);
  const id = o.chest && o.chest.id; despawnOtherShip(o); px = keep.px; pz = keep.pz; jumpY = 0; return { id }; });
check(`a ship's chest is <ship id>:chest (${ship && ship.id})`, !!ship && ship.id === 'sea:test:1:pirate:chest', ship);

// a town's barrels and crates, and a lair's or camp's hoard, wherever one is built
await g.settle('dunmore');
const town = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const L = (S.loot || []).map(c => c.id);
  const hoards = []; for (const T of WORLD.settle.values()) if (T.chest) hoards.push([T.site.id, T.chest.id]);
  { const T = { site: { id: 'test_camp', x: px + 20, z: pz }, group: new THREE.Group() }; const n0 = ZONE_CORPSES.length; const c = siteChest(T, px + 22, pz, 1, 'The Hoard'); ZONE_CORPSES.splice(n0); hoards.push([T.site.id, c.id]); }
  return { n: L.length, ids: L, unique: new Set(L).size, shaped: L.every((id, i) => id === 'dunmore:barrel:' + i), hoards }; });
check(`Dunmore's ${town.n} barrels and crates are dunmore:barrel:<n>, one id each (${town.ids.slice(0, 3).join(' ')})`, town.n > 0 && town.unique === town.n && town.shaped, town);
check(`a lair's or camp's hoard is <site>:chest (${town.hoards.length} checked, with one on a stand-in camp: ${town.hoards.map(h => h[1]).join(', ') || 'none'})`, town.hoards.length > 0 && town.hoards.every(([s, id]) => id === s + ':chest'), town.hoards);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
