// Inn room rental, interior doors, and lockpicking.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const rent = await page.evaluate(() => { const h = WORLD.settle.get('dunmore').houses.find(x => x.type === 'inn' && x.dlg); gold = 500;
  const bed = h.dlg.topics.find(x => /A bed for the night/.test(x.label)); const yes = bed.follow[0]; const said = yes.fn(yes);
  return { said, room: worldState.rented && worldState.rented.room, gold }; });
check('the innkeeper lets one room', rent.room != null && rent.gold < 500, rent);
await page.evaluate(() => { const h = WORLD.settle.get('dunmore').houses.find(x => x.type === 'inn' && x.dlg); px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(5000); await g.hide();
const beds = await page.evaluate(() => { const mine = worldState.rented.room; return INT_BEDS.map(b => { px = b.x; pz = b.z; jumpY = b.y || 0; return { mine: b.room === mine, sleeps: !WORLD.bedInteract(b) }; }); });
check('your room sleeps, the others refuse', beds.every(b => b.mine === b.sleeps), beds);
const door = await page.evaluate(async () => { const d = WORLD.intDoors[0]; if (!d) return null; px = d.x + .9; pz = d.z + .9; jumpY = d.y;
  const shut = intSolidAt(d.x, d.z, .3); WORLD.intDoorInteract(d); await new Promise(r => setTimeout(r, 500)); const open = intSolidAt(d.x, d.z, .3);
  WORLD.intDoorInteract(d); await new Promise(r => setTimeout(r, 500)); return { shut, open, again: intSolidAt(d.x, d.z, .3), n: WORLD.intDoors.length }; });
check('inn rooms have doors that block when shut', door && door.n >= 1 && door.shut && !door.open && door.again, door);
// lockpicking, on a synthetic dungeon door
const lp = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); BAG.push({ name: 'Lockpick', ico: '🗝', type: 'misc', qty: 5 });
  const d = { x: 3, z: 4, floor: 1, locked: true, open: false, seed: 77 }; tryLockpick(d); const pins = LP.pins.length;
  lpPress(); await wait(LP.rise + 30); lpPress(); const set1 = LP.pins.filter(p => p.set).length;
  lpPress(); await wait(15); lpPress(); const picksAfterSnap = lpPicks();
  closeLockpick(); return { pins, set1, picksAfterSnap, lockOpen }; });
check('a press at the shear sets a pin; a press too soon snaps a pick', lp.set1 === 1 && lp.picksAfterSnap === 4 && !lp.lockOpen, lp);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
