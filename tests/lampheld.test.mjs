// The Waylamp held (Session 784; the page's Hearth row, in the approved draft's words): lit and on you, any town inn's room costs
// nothing, the lamp's line first and then the house's own offer; out, or in the stash, the room is paid as before. The claim:
// *Give the lamp to the house.* at any inn hangs it over that door, the town's favour +2, and the round can begin again from
// there. The rumour: the town whose inn holds it, and the towns in the cells round it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const P = await page.evaluate(() => { delete worldState.artifacts; return artifactPlaces().waylamp; });
await g.settle(P.site);
const talk = (houseId, label, follow) => page.evaluate(([houseId, label, follow]) => {
  const S = [...WORLD.settle.values()].find(S => S.houses.some(h => h.id === houseId)); const h = S.houses.find(h => h.id === houseId); const def = h.dlg;
  const labels = def.topics.map(t => t.label); const t = def.topics.find(t => t.label === label); if (!t) return { labels, none: true };
  let say = t.response != null ? t.response : t.fn(); let fl = null;
  if (follow != null) { const F = typeof t.follow === 'function' ? t.follow() : t.follow; fl = F.map(f => f.label); const f = follow === 0 ? F[0] : F.find(f => f.label === follow); say = f.fn ? f.fn() : f.response; }
  return { labels, say, fl, people: def.people };
}, [houseId, label, follow]);

// made the lamp's own: taken down, five towns' inns (counted through lampTrim), and in the bag
const setup = await page.evaluate((site) => { const inns = WORLD.settle.get(site).houses.filter(h => h.type === 'inn');
  lampTake(inns[0]); const others = allSites().filter(t => (t.kind === 'town' || t.kind === 'port' || t.kind === 'city') && t.id !== site).slice(0, 5);
  for (const t of others) lampTrim({ type: 'inn', id: 'g_' + t.id + '_x', siteId: t.id }); delete worldState.rented;
  return { first: inns[0].id, second: inns[1] && inns[1].id, own: lampOwn(), free: lampFree(), gold }; }, P.site);
check('the lamp is yours, lit and on you', setup.own && setup.free && !!setup.second, setup);

const room = await talk(setup.second, 'A bed for the night?', 0);
const after = await page.evaluate(() => ({ gold, rented: !!worldState.rented, log: GAME_LOG[GAME_LOG.length - 1].text }));
console.log(JSON.stringify(room), JSON.stringify(after));
const roomQ = await page.evaluate((id) => { const S = [...WORLD.settle.values()].find(S => S.houses.some(h => h.id === id)); const h = S.houses.find(h => h.id === id); delete worldState.rented;
  const T = () => h.dlg.topics.find(t => t.label === 'A bed for the night?'); /* the list is built afresh at each talk, so read it again after each change */ let t = T(); const lit = { say: t.response, fl: t.follow.map(f => f.label) };
  worldState.artifacts.waylamp.outUntil = (worldState.gameTimeAbsMinutes || 0) + 100; t = T(); const out = { say: t.response, fl: t.follow.map(f => f.label) }; delete worldState.artifacts.waylamp.outUntil;
  const it = BAG.find(i => i.artifact === 'waylamp'); BAG.splice(BAG.indexOf(it), 1); stashBag.push(it); t = T(); const stashed = { say: t.response }; stashBag.splice(stashBag.indexOf(it), 1); BAG.push(it);
  return { lit, out, stashed, price: innPrice(h) }; }, setup.second);
console.log(JSON.stringify(roomQ));
const lampLineOf = { gatelander: "There's no charge to the one carrying that lamp.", markman: "You've the lamp. No charge.", aurennais: "The lamp's bearer is not charged, Master.", oldblood: 'The lamp pays.' }[room.people];
check(`lit and on you, the room offer opens with the lamp's line (*${lampLineOf}* …) and then the house's own; the answer is *Yes.*`, roomQ.lit.say.startsWith(lampLineOf) && /A room is|gold\./.test(roomQ.lit.say) && roomQ.lit.fl[0] === 'Yes.', roomQ.lit);
check(`*Yes.*: *${room.say}*; no gold taken (${setup.gold} → ${after.gold}), the room yours, the log says the lamp paid`, after.gold === setup.gold && after.rented && /made up|Ready|ready/.test(room.say) && /not charged/.test(after.log), { room, after });
check(`out, the room is ${roomQ.price} gold as before; in the stash, no lamp line`, !roomQ.out.say.startsWith(lampLineOf) && roomQ.out.fl[0] === `Yes. ${roomQ.price} gold.` && !roomQ.stashed.say.startsWith(lampLineOf), roomQ);

// the claim: given to the town's second inn, it hangs there; that inn now offers it, the first does not
const fav0 = await page.evaluate((site) => favor(site), P.site);
const give = await talk(setup.second, 'Give the lamp to the house.');
const gave = await page.evaluate(([site, fav0]) => { const S = worldState.artifacts.waylamp; return { yielded: S.yielded, hung: S.hung, inBag: BAG.some(i => i.artifact === 'waylamp'), fav: favor(site) - fav0, log: GAME_LOG[GAME_LOG.length - 1].text, own: lampOwn() }; }, [P.site, fav0]);
console.log(JSON.stringify(give), JSON.stringify(gave));
check(`given to the house: *${give.say}*; it hangs there, out of your bag; the town's favour +${gave.fav}; *${gave.log}*`, !give.none && gave.yielded === 'inn' && gave.hung.inn === setup.second && !gave.inBag && gave.fav === 2 && /^Gave the Waylamp to .+, at .+\.$/.test(gave.log) && !gave.own, { give, gave });
const offerSecond = await talk(setup.second, 'The lamp over the door?'); const offerFirst = await talk(setup.first, 'The lamp over the door?');
check('the inn it was given to now offers it, and the town\'s first inn does not', !offerSecond.none && offerFirst.none, { offerSecond: offerSecond.labels, offerFirst: offerFirst.labels });

const rum = await page.evaluate(([site]) => { const T = siteAnywhere(site); const [ci, cj] = cellOf(T.x, T.z);
  const far = allSites().find(t => (t.kind === 'town' || t.kind === 'village') && (() => { const [i, j] = cellOf(t.x, t.z); return Math.abs(i - ci) > 2 || Math.abs(j - cj) > 2; })());
  const has = s => liveRumours(s).some(r => /burns in the rain/.test(r)); return { here: has(T), far: has(far), line: liveRumours(T).find(r => /burns in the rain/.test(r)) }; }, [P.site]);
check(`while it hangs, its town says *${rum.line}*; a town far off does not`, rum.here && !rum.far, rum);

const again = await talk(setup.second, 'The lamp over the door?', 'I’ll carry it.');
const st = await page.evaluate((site) => { const S = worldState.artifacts.waylamp; const r = { trial: S.trial, count: S.count, towns: S.towns, yielded: !!S.yielded, inBag: BAG.some(i => i.artifact === 'waylamp') };
  const it = BAG.find(i => i.artifact === 'waylamp'); if (it) BAG.splice(BAG.indexOf(it), 1); delete worldState.artifacts; return r; }, P.site);
check(`taken down again from there: *${again.say}*; the round begins again, its town not to count`, st.trial && st.count === 0 && st.towns[P.site] === 1 && !st.yielded && st.inBag, { again, st });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
