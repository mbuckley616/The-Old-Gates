// Indoor witnesses (Session 167): indoors a witness needs a clear line as well as the six units — a partition wall or a
// shut door between the keeper and you hides you. The critic found the strongbox a matter of floor plan: keeper-to-box
// 3.9–8.9 units across Dunmore's shops, and the back-room wall doing nothing either way.
// Session 1244 (Michael's B on #516): the six were the old unit's; indoors the reach is now `WIT_IN`, 8.7 m, and the test reads it,
// so a keeper at a kit shop's counter sees the strongbox through the open back-room door and not through the shut one.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const rows = [];
const shops = await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); return S.houses.filter(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper).map(x => x.id); });
for (const id of shops) {
  await page.evaluate((id) => { const h = WORLD.settle.get('dunmore').houses.find(x => x.id === id); window._h = h; forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); }, id);
  await page.waitForTimeout(4500); await g.hide();
  rows.push(await page.evaluate(() => { const h = window._h; const X = WORLD.intBox; const K = intNPCMesh; if (!X || !K) return { name: h.name, none: true };
    const kx = K.position.x, kz = K.position.z; jumpY = 0; const R = WIT_IN;
    // (Session 368: the keeper sees what they face; here they are turned to the spot asked, so what is tested is the range and the line)
    const W = () => { K.rotation.y = Math.atan2(px - kx, pz - kz); return !!WORLD.witnessOf(h); };
    // at the strongbox, as the critic stood
    px = X.x; pz = X.z + .8; const dBox = Math.hypot(px - kx, pz - kz); const atBox = W(); const lineBox = WORLD.intSightLine(kx, kz, px, pz);
    // a step from the keeper, in plain view: always seen
    px = kx + (X.x > kx ? 1.5 : -1.5); pz = kz; const near = W();
    // at the strongbox again with every door of the room open: the keeper at the counter sees you exactly when the box is in reach
    // with a clear line (Session 1244)
    const D0 = WORLD.intDoors, sols = D0.map(d => ({ ...d.sol })); D0.forEach(d => { d.sol.x0 = d.sol.x1 = d.sol.z0 = d.sol.z1 = -9e5; });
    px = X.x; pz = X.z + .8; const openBox = W(), openBoxLine = WORLD.intSightLine(kx, kz, px, pz); D0.forEach((d, i) => Object.assign(d.sol, sols[i]));
    // beyond the back-room door, a step past it on the line from the keeper: the shut door hides you, the open one does not
    const D = WORLD.intDoors; let door = null;
    if (D.length) { const d = D[0]; const L = Math.hypot(d.x - kx, d.z - kz);
      // Session 1215: in the kit's shops (the new look, #393) the back-room door is 5.6 to 5.7 from the counter, so every spot past it
      // is beyond the six units and the door could not be tested at all. There the keeper is stood 2.5 short of the door, on the
      // same line, as guardsindoor does for the strongbox; whether a keeper at the counter should see into the back room is a decision.
      const moved = L + .9 >= R; const sx = moved ? d.x - (d.x - kx) / L * 2.5 : kx, sz = moved ? d.z - (d.z - kz) / L * 2.5 : kz;
      K.position.x = sx; K.position.z = sz;
      const Wd = () => { K.rotation.y = Math.atan2(px - sx, pz - sz); return !!WORLD.witnessOf(h); };
      const bx = d.x + (d.x - kx) / L * .9, bz = d.z + (d.z - kz) / L * .9;
      px = bx; pz = bz; const dist = Math.hypot(px - sx, pz - sz); const shutSeen = Wd();
      const s0 = { ...d.sol }; d.sol.x0 = d.sol.x1 = d.sol.z0 = d.sol.z1 = -9e5; const openSeen = Wd(); const openLine = WORLD.intSightLine(sx, sz, px, pz); Object.assign(d.sol, s0);
      K.position.x = kx; K.position.z = kz; const fromCounter = +(L + .9).toFixed(2);
      // and the whole room: every spot within reach of the keeper that a wall hides
      let hid = 0, hidSeen = 0; for (let x = .5; x < 30; x += .5) for (let z = .5; z < 30; z += .5) { if (Math.hypot(x - kx, z - kz) >= R || WORLD.intSightLine(kx, kz, x, z)) continue; px = x; pz = z; hid++; if (W()) hidSeen++; }
      door = { dist: +dist.toFixed(2), moved, fromCounter, shutSeen, openSeen, openLine, hid, hidSeen }; }
    exitInterior();
    return { name: h.name, R, dBox: +dBox.toFixed(2), dRaw: dBox, doors: D.length, lineBox, atBox, openBox, openBoxLine, near, door }; }));
  await page.waitForTimeout(2500); await g.hide();
}
console.log(JSON.stringify(rows));
const ok = rows.filter(r => !r.none);
check('every shop was entered with a keeper and a strongbox', ok.length === shops.length && ok.length >= 5, rows);
check('a step from the keeper you are always seen', ok.every(r => r.near), ok.map(r => [r.name, r.near]));
check('indoors the reach is 8.7 m (#516)', ok.length > 0 && ok.every(r => r.R === 8.7), ok.map(r => r.R));
check('at the strongbox you are seen exactly when the keeper is within reach with a clear line', ok.every(r => r.atBox === (r.dRaw < r.R && r.lineBox)), ok.map(r => [r.name, r.dBox, r.lineBox, r.atBox]));
// (Session 1244: in Dunmore's seven kit shops the box stands 7.6–7.9 from the counter, inside the reach, but off the doorway's line
// behind the partition, so no shop gives the counter a line to it even with the door open; the open door shows the doorway, below)
check('with the doors open, the keeper at the counter sees you at the strongbox exactly when it is within reach with a clear line', ok.every(r => r.openBox === (r.dRaw < r.R && r.openBoxLine)), ok.map(r => [r.name, r.dBox, r.atBox, r.openBoxLine, r.openBox]));
const withDoor = ok.filter(r => r.door && r.door.dist < r.R);
check('at 8.7 m the keeper at the counter reaches past the back-room door unmoved, in at least one shop (at six none did)', ok.some(r => r.door && !r.door.moved && r.door.fromCounter >= 6 && r.door.openSeen), ok.map(r => [r.name, r.door && r.door.fromCounter, r.door && r.door.moved]));
check('a step past the back-room door, within reach of the keeper: unseen while it is shut, seen when it is open', withDoor.length >= 1 && withDoor.every(r => !r.door.shutSeen && r.door.openSeen === r.door.openLine) && withDoor.some(r => r.door.openSeen), ok.map(r => [r.name, r.door]));
check('no spot within reach that a wall hides from the keeper is seen', ok.filter(r => r.door).every(r => r.door.hidSeen === 0) && ok.some(r => r.door && r.door.hid > 0), ok.map(r => [r.name, r.door && r.door.hid, r.door && r.door.hidSeen]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
