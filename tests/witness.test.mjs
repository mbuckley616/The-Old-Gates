// Indoor witnesses (Session 167): indoors a witness needs a clear line as well as the six units — a partition wall or a
// shut door between the keeper and you hides you. The critic found the strongbox a matter of floor plan: keeper-to-box
// 3.9–8.9 units across Dunmore's shops, and the back-room wall doing nothing either way.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const rows = [];
const shops = await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); return S.houses.filter(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper).map(x => x.id); });
for (const id of shops) {
  await page.evaluate((id) => { const h = WORLD.settle.get('dunmore').houses.find(x => x.id === id); window._h = h; forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); }, id);
  await page.waitForTimeout(4500); await g.hide();
  rows.push(await page.evaluate(() => { const h = window._h; const X = WORLD.intBox; const K = intNPCMesh; if (!X || !K) return { name: h.name, none: true };
    const kx = K.position.x, kz = K.position.z; jumpY = 0;
    // at the strongbox, as the critic stood
    px = X.x; pz = X.z + .8; const dBox = Math.hypot(px - kx, pz - kz); const atBox = !!WORLD.witnessOf(h); const lineBox = WORLD.intSightLine(kx, kz, px, pz);
    // a step from the keeper, in plain view: always seen
    px = kx + (X.x > kx ? 1.5 : -1.5); pz = kz; const near = !!WORLD.witnessOf(h);
    // beyond the back-room door, a step past it on the line from the keeper: the shut door hides you, the open one does not
    const D = WORLD.intDoors; let door = null;
    if (D.length) { const d = D[0]; const L = Math.hypot(d.x - kx, d.z - kz); const bx = d.x + (d.x - kx) / L * .9, bz = d.z + (d.z - kz) / L * .9;
      px = bx; pz = bz; const dist = Math.hypot(px - kx, pz - kz); const shutSeen = !!WORLD.witnessOf(h);
      const s0 = { ...d.sol }; d.sol.x0 = d.sol.x1 = d.sol.z0 = d.sol.z1 = -9e5; const openSeen = !!WORLD.witnessOf(h); const openLine = WORLD.intSightLine(kx, kz, px, pz); Object.assign(d.sol, s0);
      // and the whole room: every spot within six units of the keeper that a wall hides
      let hid = 0, hidSeen = 0; for (let x = .5; x < 30; x += .5) for (let z = .5; z < 30; z += .5) { if (Math.hypot(x - kx, z - kz) >= 6 || WORLD.intSightLine(kx, kz, x, z)) continue; px = x; pz = z; hid++; if (WORLD.witnessOf(h)) hidSeen++; }
      door = { dist: +dist.toFixed(2), shutSeen, openSeen, openLine, hid, hidSeen }; }
    exitInterior();
    return { name: h.name, dBox: +dBox.toFixed(2), dRaw: dBox, doors: D.length, lineBox, atBox, near, door }; }));
  await page.waitForTimeout(2500); await g.hide();
}
console.log(JSON.stringify(rows));
const ok = rows.filter(r => !r.none);
check('every shop was entered with a keeper and a strongbox', ok.length === shops.length && ok.length >= 5, rows);
check('a step from the keeper you are always seen', ok.every(r => r.near), ok.map(r => [r.name, r.near]));
check('at the strongbox you are seen exactly when the keeper is within six units with a clear line', ok.every(r => r.atBox === (r.dRaw < 6 && r.lineBox)), ok.map(r => [r.name, r.dBox, r.lineBox, r.atBox]));
const withDoor = ok.filter(r => r.door && r.door.dist < 6);
check('a step past the back-room door, within six units of the keeper: unseen while it is shut, seen when it is open', withDoor.length >= 1 && withDoor.every(r => !r.door.shutSeen && r.door.openSeen === r.door.openLine) && withDoor.some(r => r.door.openSeen), ok.map(r => [r.name, r.door]));
check('no spot within six units that a wall hides from the keeper is seen', ok.filter(r => r.door).every(r => r.door.hidSeen === 0) && ok.some(r => r.door && r.door.hid > 0), ok.map(r => [r.name, r.door && r.door.hid, r.door && r.door.hidSeen]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
