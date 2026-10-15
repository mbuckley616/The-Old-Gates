// Session 739 — a householder sleeps (Michael's A on #240). From 23h to 5h a home's resident lies on their own bed and sees
// nothing; they wake to someone within two units of the bed (the street's hearing) or to E, and stay up for the visit. From 21h
// to 23h and 5h to 7h they are awake as before. The critic's s572 case: a chest across the room is opened unseen at 23h30.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const enter = async (hr, k = 0) => { await page.evaluate(([hr, k]) => { forceTime(hr); const S = WORLD.settle.get('dunmore');
  const hs = S.houses.filter(x => x.type === 'home' && !x.ownedByPlayer && !x.shuttered); const h = hs[k]; window._h = h; px = h.exitX; pz = h.exitZ; goToInterior(h); }, [hr, k]);
  await page.waitForTimeout(3000); await g.hide(); };
const leave = async () => { await page.evaluate(() => exitInterior()); await page.waitForTimeout(1500); };
const state = () => page.evaluate(() => { const m = intNPCMesh; const b = INT_BEDS.find(b => b.owner === 'home');
  return { has: !!m, asleep: !!(m && m.userData.asleep), rx: m ? +m.rotation.x.toFixed(2) : null, x: m ? +m.position.x.toFixed(2) : null, z: m ? +m.position.z.toFixed(2) : null,
    y: m ? +m.position.y.toFixed(2) : null, bed: b ? [b.x, b.z] : null, hour: +gameHour().toFixed(2) }; });
// a still sweep of the room: the player at points across it, facing the sleeper, walking; is anyone a witness?
// S915 (card F2a): `face` turns an awake resident to the room's middle first. Indoors a person sees in a 120° cone, and in a
// cottage of true size one who has ambled to face a wall has none of the dozen spots in it (CI's run 38675675725: 0 of 11 at 22h
// and at 6h; 2 and 5 here); the room 1.8 times too wide always had some in front of them. Faced so, 7 of 11 here: at least a third
const sweep = (face) => page.evaluate((face) => { const b = INT_BEDS.find(b => b.owner === 'home'); const W = _h._roomW || 9, D = _h._roomD || 10; let seen = 0, n = 0, near = 0;
  if (face) { const m = intNPCMesh; m.rotation.y = Math.atan2(W / 2 - m.position.x, D / 2 - m.position.z); }
  const sn = _sneaking; _sneaking = false;
  for (let x = .8; x < W - .5; x += .7) for (let z = .8; z < D - .5; z += .7) { if (intSolidAt(x, z, .25, 0)) continue; if (Math.hypot(x - b.x, z - b.z) < 2.3) { near++; continue; }
    px = x; pz = z; n++; if (WORLD.witnessOf(_h)) seen++; }
  _sneaking = sn; return { n, seen, near, asleep: !!intNPCMesh.userData.asleep }; }, !!face);

// 1. at 23h30 the resident is on the bed, flat, and the room can be crossed unseen
// (S752: the body is centred in the bed by its own shape, curled on its side, so x is within the bed's half-width, .43, not on its listed x)
await enter(23.5);
let s = await state();
check('at 23h30 a home\'s resident is in, and asleep on their own bed (laid flat, over the bed)', s.has && s.asleep && s.rx === -1.57 && Math.abs(s.x - s.bed[0]) < .43 && s.z > s.bed[1] && s.z < s.bed[1] + 1.2 && s.y > .4, s);
let w = await sweep();
// S896 (card F2a): a cottage of true size (about 5 by 5.5 m) holds about a dozen free spots on the .7 grid beyond 2.3 m of the bed (it
// held over thirty in the room 1.8 times too wide)
check('asleep, they see no one anywhere in the room beyond two units of the bed', w.n >= 8 && w.seen === 0 && w.asleep, w);
// the chest: opened by the player at it, unseen
const chest = await page.evaluate(() => { px = INT_BOX.x + .6; pz = INT_BOX.z - .6; return { d: +Math.hypot(INT_BOX.x - INT_BEDS.find(b => b.owner === 'home').x, INT_BOX.z - INT_BEDS.find(b => b.owner === 'home').z).toFixed(2), wit: WORLD.witnessOf(_h) }; });
check('at the chest (the critic\'s s572 case) nobody sees the lock opened', chest.wit === null, chest);
// the frames run: still asleep, still flat (the loop's sway and bob leave a sleeper alone)
await g.frames(20); await page.evaluate(() => { for (let i = 0; i < 120; i++) WORLD.tickInterior(1 / 60, performance.now()); });
s = await state();
check('ticked for two seconds and twenty frames, they stay asleep and flat', s.asleep && s.rx === -1.57, s);
// 2. walking up to the bed wakes them, and they see you
const woke = await page.evaluate(() => { const b = INT_BEDS.find(b => b.owner === 'home'); px = b.x + 1.2; pz = b.z + 1.2; const d = Math.hypot(px - b.x, pz - b.z);
  WORLD.tickInterior(1 / 60, performance.now()); const m = intNPCMesh; return { d: +d.toFixed(2), asleep: !!m.userData.asleep, rx: m.rotation.x, wit: WORLD.witnessOf(_h) }; });
check('within two units of the bed they wake, stand, and are a witness', woke.d < 2 && !woke.asleep && woke.rx === 0 && woke.wit && woke.wit.name === (await page.evaluate(() => _h.keeper)), woke);
const later = await page.evaluate(() => { px = INT_BOX.x + .6; pz = INT_BOX.z - .6; for (let i = 0; i < 300; i++) WORLD.tickInterior(1 / 60, performance.now()); return !!intNPCMesh.userData.asleep; });
check('woken, they stay up for the rest of the visit (five seconds on, across the room)', later === false, later);
await leave();
// 3. witnessOf alone (no tick between): a step beside the bed wakes them and they see you
await enter(1.0, 3);
const w2 = await page.evaluate(() => { const b = INT_BEDS.find(b => b.owner === 'home'); const a = !!intNPCMesh.userData.asleep; px = b.x + .9; pz = b.z + .9; const wit = WORLD.witnessOf(_h); return { a, wit, after: !!intNPCMesh.userData.asleep }; });
check('at 1h another home\'s resident is asleep; a theft beside the bed is heard and seen, and wakes them', w2.a && w2.wit && !w2.after, w2);
await leave();
// 4. E on a sleeper wakes them and opens the talk
await enter(2.0, 6);
const talk = await page.evaluate(() => { const b = INT_BEDS.find(b => b.owner === 'home'); const a = !!intNPCMesh.userData.asleep; px = b.x + 2.1; pz = b.z; jumpY = 0;
  const d = Math.hypot(px - intNPCPos.x, pz - intNPCPos.z); interact(); const open = getComputedStyle(document.getElementById('dlg')).display; return { a, d: +d.toFixed(2), after: !!intNPCMesh.userData.asleep, open }; });
check('E beside the bed (2.1 off) wakes the sleeper', talk.a && talk.d < 2.2 && !talk.after, talk);
await page.evaluate(() => { try { closeDialog(); } catch (e) {} }); await leave();
// 5. awake hours: 22h and 6h they are up and see as before; at 23h a resident awake at 22h goes to bed
for (const hr of [22, 6]) { await enter(hr);
  const r = await state(); const sw = await sweep(true);
  check(`at ${hr}h the resident is in and awake, and sees across the room as before`, r.has && !r.asleep && r.rx === 0 && sw.n >= 8 && sw.seen * 3 >= sw.n, { r, sw });
  await leave(); }
await enter(22.98);
const bed = await page.evaluate(() => { const a = !!intNPCMesh.userData.asleep; px = INT_BOX.x + .6; pz = INT_BOX.z - .6; forceTime(23.02); WORLD.tickInterior(1 / 60, performance.now()); return { a, b: !!intNPCMesh.userData.asleep, h: gameHour() }; });
check('awake at 22h59, they go to bed at 23h with you in the room', !bed.a && bed.b, bed);
const up = await page.evaluate(() => { forceTime(5.02); WORLD.tickInterior(1 / 60, performance.now()); const m = intNPCMesh; return { asleep: !!m.userData.asleep, rx: m.rotation.x, ry: +m.rotation.y.toFixed(2) }; });
check('at 5h they get up (stand, not woken by you, so not facing you)', !up.asleep && up.rx === 0, up);
await leave();
// 6. a shop at night has no one in, as before; a sleeper never at noon (a home's resident is out by day)
const day = await page.evaluate(() => { forceTime(12); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'home' && !x.ownedByPlayer); return { inside: WORLD.npcInsideNow(h), asleep: homeAsleepNow(h) }; });
check('at noon a home\'s resident is out and not asleep', !day.inside && !day.asleep, day);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
