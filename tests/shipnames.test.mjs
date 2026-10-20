// The names a bought ship takes (Session 1218; the quest writer's Finding 32, docs/quest_review.md run 22): the *Kestrel* is
// Oswy Blackhand's ship (the courier step's marker), so the player's list gives the name up for *Bad Penny*. A ship saved
// under the old name keeps it: `spawnShip` reads `worldState.ship.name` first.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const list = SHIP_NAMES.slice();
  const ws0 = worldState.ship; const seen = new Set();
  for (let i = 0; i < 200; i++) { worldState.ship = null; spawnShip(px + 40, pz + 40, 0); seen.add(SHIP.name); }
  worldState.ship = { name: 'Kestrel' }; spawnShip(px + 40, pz + 40, 0); const kept = SHIP.name;
  worldState.ship = ws0 || null; if (SHIP.mesh) SHIP.mesh.visible = false;
  return { list, seen: [...seen], kept };
});
check(`the list has ten names, *Bad Penny* among them and no *Kestrel*: ${r.list.join(', ')}`, r.list.length === 10 && r.list.includes('Bad Penny') && !r.list.includes('Kestrel'), r.list);
check(`200 new ships take ${r.seen.length} names from the list, never *Kestrel*`, r.seen.length >= 8 && !r.seen.includes('Kestrel') && r.seen.every(n => r.list.includes(n)), r.seen);
check(`a ship saved as the *Kestrel* keeps its name (${r.kept})`, r.kept === 'Kestrel', r.kept);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
