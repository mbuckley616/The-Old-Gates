// The Wolf-Mother's Cloak off a corpse (Session 781; Michael's 2A on DECISION #263, the draft *The Makers' Things*): the cloak's
// master is the beast of its lair's cavern. Killed before the cloak was taken, the cloak lies in the hoard; killed while the
// cloak is yours, it goes thin. Either way it keeps the peace with wolves only, and the town pays nothing.
// The cavern is entered for real and its master killed at the blow (killE → slayMaster).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

await page.evaluate(() => { window._said = []; const sm = showMsg, sl = showMsgLong; showMsg = (t, c) => { window._said.push(t); return sm(t, c); }; showMsgLong = (t, c) => { window._said.push(t); return sl(t, c); };
  window._peace = () => ['Wolf', 'Dire Wolf', 'Cave Bear', 'Spider'].map(n => beastAtPeace({ name: n, hp: 10, maxHp: 10 }));
  delete worldState.artifacts; delete worldState.artifactTries; });

const where = await page.evaluate(() => { const P = artifactPlaces().wolf_cloak, sd = cloakSeed(); const d = WORLD.doorAnywhere(sd);
  const p = makePortalDef(d); const wp = WORLD.dungeonPos[sd]; if (wp) { p.x = wp.x; p.z = wp.z; } p.zone = 'world'; p.lair = d.lair; px = p.x; pz = p.z + 3; window._cave = p; window._lairBoss = null;
  if (worldState.masters) delete worldState.masters[sd]; goToDungeon(p); return { lair: P.name, seed: sd, door: !!d, isLair: !!(d && d.lairDoor) }; });
for (let k = 0; k < 60 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && window._lairBoss && !window._lairBoss.dead)); k++) await page.waitForTimeout(500);
// Session 809: the cloak's line is said on a 1.6 s timer (artifactSay), and a timer runs only between frames. On CI one frame
// can outlast the 2.2 s this suite waited, and the line was not yet said (once in 11–13 Oct). Wait for the line itself, up to a
// minute, and then half a second for anything said after it.
const saidUntil = async re => { for (let k = 0; k < 120; k++) { if ((await page.evaluate(() => [...window._said])).some(t => re.test(t))) break; await page.waitForTimeout(500); } await page.waitForTimeout(500); };
check(`the cloak's lair is ${where.lair}, its cavern door seed ${where.seed}`, where.door && where.isLair, where);

// A: killed before the cloak was taken
let a = await page.evaluate(() => { const e = window._lairBoss; window._said.length = 0; const drainBefore = cloakDrain(cloakTown());
  e.hp = 0; killE(e); const sd = cloakSeed(), r = worldState.masters[sd]; const it = r.hoard.items.find(i => i.artifact === 'wolf_cloak');
  const chest = CHESTS.find(c => c.id && /:hoard$/.test(c.id)); const inChest = !!(chest && chest.items.includes(it));
  const S = { ...worldState.artifacts.wolf_cloak };
  /* take it from the hoard and wear it */ chest.items.splice(chest.items.indexOf(it), 1); const keep = EQ.back; EQ.back = it;
  const peace = window._peace(), drain = cloakDrain(cloakTown()), ser = _serItem(it), tryAgain = artifactTry('wolf_cloak');
  EQ.back = keep;
  return { dead: r.dead, inChest, item: it && { name: it.name, half: it.half, unique: it.unique, slot: it.slot, desc: it.desc }, S, peace, drainBefore, drain, serHalf: ser.half, tryAgain }; });
await saidUntil(/grey cloak/); a.said = await page.evaluate(() => [...window._said]);
console.log(JSON.stringify(a));
check(`killed with the cloak untaken, the master falls and, after the kill's own line, the cavern says *${a.said.find(s => /grey cloak/.test(s))}*`, a.dead && a.said[a.said.length - 1] === 'Under it, the grey cloak, soaked through. Something has gone out of it.', a.said);
check('the cloak lies in the hoard, the Wolf-Mother\'s own and gone thin; the world records it taken from the corpse', a.inChest && a.item.name === "The Wolf-Mother's Cloak" && a.item.half && a.item.unique && a.item.slot === 'back' && a.S.how === 'corpse' && a.S.half, a);
check(`worn, it keeps the peace with the Wolf and the Dire Wolf and not with the Cave Bear or the Spider (${a.peace})`, a.peace.join() === 'true,true,false,false', a.peace);
check('the town pays nothing, and the thin cloak stays thin through a save; it is not to be had again from the stone', a.drain === 0 && a.serHalf === true && a.tryAgain && a.tryAgain.gone, a);
await page.evaluate(() => goToOW());
for (let k = 0; k < 60 && !(await page.evaluate(() => activeZoneId === 'world')); k++) await page.waitForTimeout(500);

// B: killed while the cloak, taken alive, is on your back
let b = await page.evaluate(() => { const sd = cloakSeed(); delete worldState.artifacts; worldState.masters[sd] = { dead: false, hoard: { x: 0, z: 0, floor: 1, items: [] } };
  takeArtifact('wolf_cloak'); const i = BAG.findIndex(it => it.artifact === 'wolf_cloak'); const keep = EQ.back; EQ.back = BAG.splice(i, 1)[0];
  const before = { peace: window._peace(), drain: cloakDrain(cloakTown()) }; window._said.length = 0;
  slayMaster({ seed: sd, lair: {} }); const after = { peace: window._peace(), drain: cloakDrain(cloakTown()), half: !!EQ.back.half, S: { ...worldState.artifacts.wolf_cloak }, hoard: worldState.masters[sd].hoard.items.length };
  slayMaster({ seed: sd, lair: {} });
  /* another lair's master: nothing */ delete worldState.artifacts; takeArtifact('wolf_cloak'); const j = BAG.findIndex(it => it.artifact === 'wolf_cloak'); const fresh = BAG.splice(j, 1)[0];
  EQ.back = fresh; const other = 123457 === sd ? 123458 : 123457; if (worldState.masters) delete worldState.masters[other]; slayMaster({ seed: other, lair: {} });
  const otherKill = { half: !!fresh.half, peace: window._peace() };
  EQ.back = keep; delete worldState.artifacts; delete worldState.masters[sd]; delete worldState.masters[other];
  return { before, after, otherKill }; });
await saidUntil(/Something has gone out of it/); { const said = (await page.evaluate(() => [...window._said])).filter(t => /Something has gone out of it/.test(t)); b.after.said = said; b.again = said.slice(1); } /* only the cloak's lines: walking out, the world says its own (a place discovered) */
console.log(JSON.stringify(b));
check(`taken alive and worn: every beast at peace (${b.before.peace}) and the town drained ${b.before.drain} a day`, b.before.peace.every(x => x) && b.before.drain === 0.6, b.before);
check(`its master killed: *${b.after.said[0]}*; it keeps the Wolf and the Dire Wolf only, and the town pays nothing`, b.after.said[0] === 'The cloak is lighter on your shoulders. Something has gone out of it.' && b.after.half && b.after.S.half && b.after.peace.join() === 'true,true,false,false' && b.after.drain === 0 && b.after.hoard === 0, b.after);
check('the master dies once: a second call, and another lair\'s master, say nothing', b.again.length === 0, b.again);
check('another lair\'s master dying leaves the cloak whole', !b.otherKill.half && b.otherKill.peace.every(x => x), b.otherKill);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
