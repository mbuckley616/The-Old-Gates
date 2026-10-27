// A save made inside a gate (card F5, the build sheet's "Saves" and "The suites", Session 1335). The Dungeon of Shadows (seed 42,
// a real door of the world), entered as a load enters it; a foe killed, a chest opened and one thing taken from it, a locked door
// opened if the gate has one; saved to slot 0; the page reloaded and Continue pressed. The gate rebuilds from its seed, you stand at
// its entrance (F2b's rule, until F13), and what was killed, opened and taken stays so, found again by its <seed>:<floor>:<index> id.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => WORLD.devUnlockAll());
const inGate = () => page.waitForFunction(() => activeZoneId === 'dungeon' && typeof dScene !== 'undefined' && scene === dScene && currentPortal && currentPortal.seed === 42 && ENEMIES.length > 0, null, { timeout: 120000, polling: 200 });
await page.evaluate(() => { window._prevDScene = typeof dScene !== 'undefined' ? dScene : null; _reenterPlace({ kind: 'dungeon', seed: 42, floor: 1 }); });
await page.waitForFunction(() => typeof dScene !== 'undefined' && dScene !== window._prevDScene, null, { timeout: 120000, polling: 200 });
await inGate(); await g.hide();
const before = await page.evaluate(() => { const start = { x: px, z: pz };
  const foe = ENEMIES.find(e => !e.dead && e.id && e.floor === 1); foe.hp = 0; killE(foe, '');
  const ch = CHESTS.concat(BARRELS).find(b => b.id && !b.opened && b.items && b.items.length >= 2 && b.floor === 1);
  openLoot(ch); const took = ch.items.shift(); if (typeof closeLoot === 'function') closeLoot();
  const door = DOORS.find(d => d.id && !d.open); if (door) { door.open = true; if (door.mesh && door.mesh.parent) door.mesh.parent.remove(door.mesh); }
  return { roster: ENEMIES.map(e => e.id + ' ' + e.name + ' ' + e.maxHp).sort(), tier: dungeonTier(currentPortal, 1), foe: foe.id, foes: ENEMIES.filter(e => !e.dead).length, chest: ch.id, left: ch.items.map(i => i.name), took: took && took.name, door: door ? door.id : null, start, ids: ENEMIES.filter(e => e.id).length, all: ENEMIES.length };
});
console.log('before', JSON.stringify(before));
check(`every foe the gate placed has an id of seed, floor and index (${before.ids} of ${before.all})`, before.ids === before.all && /^42:1:\d+$/.test(before.foe), before);
await page.evaluate(() => saveToSlot(0));
await page.reload();
await page.waitForFunction(() => { const b = document.getElementById('cb'); return b && typeof saveToSlot === 'function' && getComputedStyle(b).display !== 'none'; }, null, { timeout: 120000, polling: 100 });
await page.evaluate(() => document.getElementById('cb').click());
await inGate(); await g.hide();
const after = await page.evaluate(([B]) => {
  const foe = ENEMIES.find(e => e.id === B.foe), ch = CHESTS.concat(BARRELS).find(b => b.id === B.chest), door = B.door ? DOORS.find(d => d.id === B.door) : null;
  return { foeDead: !!(foe && foe.dead), foeShown: !!(foe && foe.mesh && foe.mesh.parent), foes: ENEMIES.filter(e => !e.dead).length,
    opened: !!(ch && ch.opened), left: ch ? ch.items.map(i => i.name) : null, door: door ? door.open : null,
    fromStart: +Math.hypot(px - B.start.x, pz - B.start.z).toFixed(1), floor: currentFloor };
}, [before]);
console.log('after', JSON.stringify(after));
check(`the load puts you at the gate's entrance, on floor one, where walking in puts you (${after.fromStart} m off)`, after.floor === 1 && after.fromStart < 1, after);
check(`the foe killed is dead, gone from the floor, and the rest still stand (${after.foes} of ${before.foes})`, after.foeDead && !after.foeShown && after.foes === before.foes, after);
check(`the chest opened is open, without the ${before.took} taken from it`, after.opened && JSON.stringify(after.left) === JSON.stringify(before.left), { before: before.left, after: after.left });
check('a locked door opened stays open', before.door == null || after.door === true, { door: before.door, after: after.door });
// S1479 — the same gate loaded while its cell is not loaded (the critic, 26 Oct: a load from Aurenne met Frost Wraiths and 150-health
// Phantoms here): the portal stood at the old zone's x, z, the world's empty corner, and read tier 3 and *hard*. It now stands where
// the door does, so its tier and every foe are the same as walking in.
const unloaded = await page.evaluate(() => { delete WORLD.dungeonPos[42]; window._prevDScene = dScene; _reenterPlace({ kind: 'dungeon', seed: 42, floor: 1 }); return true; })
  .then(() => page.waitForFunction(() => typeof dScene !== 'undefined' && dScene !== window._prevDScene, null, { timeout: 120000, polling: 200 }))
  .then(() => inGate()).then(() => page.evaluate(() => ({ roster: ENEMIES.map(e => e.id + ' ' + e.name + ' ' + e.maxHp).sort(), tier: dungeonTier(currentPortal, 1), diff: currentPortal.diff, x: Math.round(currentPortal.x), z: Math.round(currentPortal.z) })));
console.log('unloaded', JSON.stringify({ tier: unloaded.tier, diff: unloaded.diff, x: unloaded.x, z: unloaded.z }));
check(`loaded with its cell not loaded, the gate reads the tier walking in reads (${unloaded.tier} and ${before.tier}) and stands where its door does (${unloaded.x}, ${unloaded.z})`, unloaded.tier === before.tier && unloaded.x > 2500, unloaded);
check(`and its ${unloaded.roster.length} foes are the same kinds and health`, JSON.stringify(unloaded.roster) === JSON.stringify(before.roster), { before: before.roster, unloaded: unloaded.roster });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
