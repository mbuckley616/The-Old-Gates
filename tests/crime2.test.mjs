// The crime system, part 2 (Session 156): witnesses, favour, the keeper who won't trade, the fine at the lord, recovery.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const pickDoor = `const wait = ms => new Promise(r => setTimeout(r, ms)); tryLockpick(WORLD.doorLockFor(h)); for (let k = 0; k < 8 && LP.phase !== 'done'; k++) { lpPress(); LP.pushed = performance.now() - LP.rise - 5; lpPress(); } await wait(900);`;
// a witness three units off at night sees the pick; one eight units off does not (night halves the range to six)
const seen = await page.evaluate(async (pickDoor) => { forceTime(23); const S = WORLD.settle.get('dunmore'); const site = S.site; const shops = S.houses.filter(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper);
  BAG.push({ name: 'Lockpick', ico: '🗝', type: 'misc', qty: 12 }); const npcs = S.npcs; npcs.forEach(n => { n.g.visible = false; }); // nobody about
  const w = npcs[0]; const f0 = WORLD.favor(site);
  // stand at the door; the witness stands out in the street along the way out of it
  const place = (h, d) => { const dx = h.exitX - h.doorX, dz = h.exitZ - h.doorZ, L = Math.hypot(dx, dz) || 1; px = h.doorX + dx / L * .8; pz = h.doorZ + dz / L * .8; jumpY = 0;
    w.g.visible = true; w._retreated = false; w.sched = { type: 'guard', a: { x: h.doorX + dx / L * d, z: h.doorZ + dz / L * d }, b: { x: h.doorX + dx / L * d, z: h.doorZ + dz / L * d } }; w.g.position.set(h.doorX + dx / L * d, WORLD.worldH(h.doorX + dx / L * d, h.doorZ + dz / L * d), h.doorZ + dz / L * d); w.g.rotation.y = Math.atan2(-dx, -dz); /* S1160 — facing the door: a witness sees in a 120° cone (S705), and the heading left from the town's last tick is the layout's, not the test's */ worldState.picked = {}; };
  // whether a witness is still out when the lock gives is the town's schedule; what this checks is the sight rule and the chain from seen to consequence
  let h = shops[0]; place(h, 9); const farWit = WORLD.witnessOf(h); const farSeen = !!farWit, farBounty = WORLD.bountyAt(site);
  h = shops[1] || shops[0]; place(h, 3); window._wronged = h; const nearWit = WORLD.witnessOf(h);
  WORLD.doorLockFor(h).onPick(); const nearSeen = WORLD.favor(site) === f0 - 1, bounty = WORLD.bountyAt(site);
  return { witness: w.def && w.def.name, farSeen, farBounty, nearSeen, bounty, favor: WORLD.favor(site), log: GAME_LOG.slice(-1)[0] && GAME_LOG.slice(-1)[0].text, refuse: !!(worldState.refuse && worldState.refuse[h.id]) }; }, pickDoor);
check('a witness within sight sees the pick: favour −1, a 25-gold fine, the keeper on notice; out of sight, nothing', !seen.farSeen && seen.farBounty === 0 && seen.nearSeen && seen.bounty === 25 && /saw you pick the lock/.test(seen.log) && seen.refuse, seen);
await page.waitForTimeout(5000); await g.hide();

// the wronged keeper refuses your custom for five days
const refuse = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); await wait(500); if (currentHouse !== window._wronged) return { wrongHouse: currentHouse && currentHouse.name };
  forceTime(12); const before = shopOpen; openShop(); const refused = !shopOpen; const line = document.getElementById('msg') ? document.getElementById('msg').textContent : '';
  worldState.refuse[window._wronged.id] = 0; openShop(); const later = shopOpen; closeShop(); return { refused, line, later }; });
check('the wronged keeper refuses trade; five days on, the shop opens again', refuse.refused && /know what you did/.test(refuse.line) && refuse.later, refuse);

// the fine at the lord, and favour coming back with quiet days
const fine = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const site = S.site; const ln = S.npcs.find(n => n.def && n.def._lord); const lord = ln && ln.def; const topics = lord && lord._extraFn ? lord._extraFn() : [];
  const t = topics.find(x => /Pay my fine/.test(x.label)); if (!t) return { noTopic: topics.map(x => x.label).slice(0, 6) }; gold = 10; const poor = t.fn(); gold = 500; const paid = t.fn();
  const f0 = WORLD.favor(site); const c = worldState.crime[site.id]; c.last -= 3; WORLD.tickCrimeDay(); const f1 = WORLD.favor(site); WORLD.tickCrimeDay(); const f2 = WORLD.favor(site);
  return { label: t.label, poor, paid, bounty: WORLD.bountyAt(site), gold, f0, f1, f2, debt: c.debt }; });
check('the lord takes the fine (if you have it); favour recovers a point per three quiet days and no more', /25 gold/.test(fine.label) && /Come back/.test(fine.poor) && /Paid/.test(fine.paid) && fine.bounty === 0 && fine.gold === 475 && fine.f1 === fine.f0 + 1 && fine.f2 === fine.f1 && fine.debt === 0, fine);
// S1794 — No mark (Locks 100; #1055 C): a shop lock picked unseen is found by its keeper at the next opening (8:00): favour −1, a point of
// debt, no fine; picked with No mark it is never found
const found = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const site = S.site; S.npcs.forEach(n => { n.g.visible = false; });
  const shops = S.houses.filter(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper); const h = shops[2] || shops[0], h2 = shops[3] || shops[1] || shops[0];
  const gi = goToInterior; goToInterior = () => {}; const c0 = worldState.crime[site.id]; const b0 = WORLD.bountyAt(site), d0 = c0.debt;
  forceTime(23); const f0 = WORLD.favor(site); SKILLS.locks = { lv: 60, p: 0 }; WORLD.doorLockFor(h).onPick(); const rec = worldState.crime[site.id].unfound && worldState.crime[site.id].unfound[h.id];
  const at = rec && rec.at - worldState.gameTimeAbsMinutes; tickCrime(0, performance.now()); const fBefore = WORLD.favor(site);
  worldState.gameTimeAbsMinutes += at; tickCrime(0, performance.now()); const fAfter = WORLD.favor(site), debt = worldState.crime[site.id].debt, log = GAME_LOG.slice(-1)[0] && GAME_LOG.slice(-1)[0].text;
  SKILLS.locks = { lv: 100, p: 0 }; WORLD.doorLockFor(h2).onPick(); const marked = !!(worldState.crime[site.id].unfound || {})[h2.id];
  goToInterior = gi; return { at, f0, fBefore, fAfter, debt, d0, bounty: WORLD.bountyAt(site), b0, log, left: Object.keys(worldState.crime[site.id].unfound || {}).length, marked }; });
check('an unseen shop pick is found at the 8:00 opening, 9 hours on: favour −1 and a point of debt then, no fine; with No mark, never', found.at === 540 && found.fBefore === found.f0 && found.fAfter === found.f0 - 1 && found.debt === found.d0 + 1 && found.bounty === found.b0 && /opened on a picked lock/.test(found.log) && found.left === 0 && !found.marked, found);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
