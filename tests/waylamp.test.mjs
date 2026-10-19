// The Waylamp's trial (Session 783; the page's Hearth row, in the approved draft's words, Michael's 1A on DECISION #263): it
// hangs over the first inn of a home-island town; its innkeeper offers *The lamp over the door?*; carried lit into the inns of
// five other towns, each trims it (*The lamp.*), and the fifth makes it yours. A crime while it is on you puts it out for seven
// days, the count back to nothing, and doubles that crime's fine; seven days on it is lit again.
// The lamp's town and a second town are built and talked to for real; the other inns are counted through lampTrim with the
// house record of a real town's inn (its siteId), as the topic calls it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const P = await page.evaluate(() => { delete worldState.artifacts; if (worldState.stats) delete worldState.stats.lampSeen; const P = artifactPlaces().waylamp;
  const T = allSites().filter(t => (t.kind === 'town' || t.kind === 'port' || t.kind === 'city') && t.id !== P.site && nationKeyOf(...cellOf(t.x, t.z)) === 'gatelands').sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z));
  return { ...P, others: T.slice(0, 7).map(t => t.id), kind: WORLD.siteAnywhere(P.site).kind }; });
console.log(JSON.stringify(P));
check(`the Waylamp hangs in ${P.name} (a ${P.kind} of the home island)`, !!P.site && ['town', 'port', 'city'].includes(P.kind), P);
await g.settle(P.site);

const talk = (houseId, label, follow) => page.evaluate(([houseId, label, follow]) => {
  const S = [...WORLD.settle.values()].find(S => S.houses.some(h => h.id === houseId)); const h = S.houses.find(h => h.id === houseId); const def = h.dlg;
  const labels = def.topics.map(t => t.label); const t = def.topics.find(t => t.label === label); if (!t) return { labels, none: true };
  let say = t.response != null ? t.response : t.fn(); if (follow) { const f = (typeof t.follow === 'function' ? t.follow() : t.follow).find(f => f.label === follow); say = f.fn ? f.fn() : f.response; }
  return { labels, say, people: def.people };
}, [houseId, label, follow]);

// S1000 — the critic's s632: the first sight waits for the day, and the rain's half is said only in the rain
const sight = await page.evaluate((site) => { const h = lampFirstInn(site); px = h.doorX + 6; pz = h.doorZ + 6; const out = {}; const sl = showMsgLong;
  const look = (hour, wx) => { forceTime(hour); WX.type = WX.next = wx; WX.k = 0; delete worldState.stats.lampSeen; let said = null; showMsgLong = (t) => { said = t; };
    try { tickWaylamp(true); } finally { showMsgLong = sl; } return { said, seen: !!worldState.stats.lampSeen, night: isNight() }; };
  out.night = look(0.05, 'clear'); out.day = look(12, 'clear'); out.rain = look(12, 'rain'); delete worldState.stats.lampSeen; return out; }, P.site);
console.log(JSON.stringify(sight));
check('at midnight, clear: nothing said, the first sight kept for the day', sight.night.night && sight.night.said === null && !sight.night.seen, sight.night);
check(`at noon, clear: *${sight.day.said}*`, sight.day.said === 'A lamp burns over the inn’s door in broad day.' && sight.day.seen, sight.day);
check(`at noon in the rain: both halves`, sight.rain.said === 'A lamp burns over the inn’s door in broad day. The rain does not seem to reach it.', sight.rain);
const inn = await page.evaluate((site) => { const h = lampFirstInn(site); const second = WORLD.settle.get(site).houses.filter(x => x.type === 'inn')[1];
  forceTime(12); WX.type = WX.next = 'rain'; WX.k = 0;
  px = h.doorX + 6; pz = h.doorZ + 6; let said = null; const sl = showMsgLong; showMsgLong = (t) => { said = t; }; try { tickWaylamp(true); } finally { showMsgLong = sl; }
  let again = null; showMsgLong = (t) => { again = t; }; try { tickWaylamp(true); } finally { showMsgLong = sl; }
  return { id: h.id, name: h.name, second: second && second.id, said, again }; }, P.site);
console.log(JSON.stringify(inn));
check(`near ${inn.name}'s door, once: *${inn.said}*`, inn.said === 'A lamp burns over the inn’s door in broad day. The rain does not seem to reach it.' && inn.again === null, inn);
const over = await talk(inn.id, 'The lamp over the door?');
const other = inn.second ? await talk(inn.second, 'The lamp over the door?') : { none: true };
check(`its innkeeper (${over.people}) answers *The lamp over the door?*; the town's other inn does not offer it`, !over.none && /five/i.test(over.say) && other.none, { over, other });
const took = await talk(inn.id, 'The lamp over the door?', 'I’ll carry it.');
const st0 = await page.evaluate(() => ({ S: JSON.parse(JSON.stringify(worldState.artifacts.waylamp)), item: (BAG.find(i => i.artifact === 'waylamp') || {}).name }));
console.log(JSON.stringify(took), JSON.stringify(st0));
check(`*I’ll carry it.*: *${took.say}*; the lamp is in the bag, the count at nothing, its own town not to count`, took.say && took.say !== over.say && st0.item === 'The Waylamp' && st0.S.trial && st0.S.count === 0 && st0.S.towns[P.site] === 1, { took, st0 });
const own = await talk(inn.id, 'The lamp.');
const gone = await talk(inn.id, 'The lamp over the door?');
check(`back at its own inn, *The lamp.* answers *${own.say}*; the offer is gone`, gone.none && own.say && !/\d/.test(own.say), { own, gone });

// the inns of other towns: the first for real, in its own town
await g.settle(P.others[0]);
const inn2 = await page.evaluate((site) => lampFirstInn(site).id, P.others[0]);
const t1 = await talk(inn2, 'The lamp.'); const t1b = await talk(inn2, 'The lamp.');
console.log(JSON.stringify(t1), JSON.stringify(t1b));
check(`in ${P.others[0]} the innkeeper trims it: *${t1.say}*; asked again, *${t1b.say}*`, /1/.test(t1.say) && /4/.test(t1.say) && !/\d/.test(t1b.say), { t1, t1b });

// a crime puts it out: the fine doubled, the count to nothing; out, no inn trims it; seven days on it is lit again
const crime = await page.evaluate((site) => { const h = lampFirstInn(site); const C = worldState.crime || (worldState.crime = {}); delete C[site];
  const fst = typeof feastOn === 'function' && feastOn(absMin()); const fee = 25 * CRIME_PTS.theft + 10, paid = fst ? Math.round(fee * .5) : fee;
  const T0 = worldState.gameTimeAbsMinutes; seenCrime('theft', h, { name: 'Somebody' }, 10); const S = worldState.artifacts.waylamp;
  const r = { bounty: C[site].bounty, paid, count: S.count, towns: Object.keys(S.towns).length, lit: lampLit(), avail: lampTrimAvail(h), out: S.outUntil - T0 };
  delete C[site]; if (worldState.favor) delete worldState.favor[site]; if (worldState.refuse) delete worldState.refuse[h.id]; return r; }, P.others[0]);
await page.waitForTimeout(2200);
const said = await page.evaluate(() => { const L = GAME_LOG.slice(-4).map(l => l.text); return { msg: document.getElementById('msg') ? document.getElementById('msg').textContent : MSGEL.textContent, L }; });
console.log(JSON.stringify(crime), JSON.stringify(said));
check(`a theft seen while it is lit: the fine is ${crime.bounty}, twice ${crime.paid}; the count back to nothing, for seven days out`, crime.bounty === 2 * crime.paid && crime.count === 0 && crime.towns === 0 && !crime.lit && !crime.avail && crime.out === 7 * 1440, crime);
check(`after the witness's line the screen says *${said.msg}*, and the log too`, said.msg === 'The Waylamp goes out in your hand. The bounty on you is doubled.' && said.L.includes('The Waylamp goes out in your hand. The bounty on you is doubled.'), said);

const relit = await page.evaluate(() => { const S = worldState.artifacts.waylamp; worldState.gameTimeAbsMinutes = S.outUntil - 1; tickWaylamp(true); const still = !lampLit();
  worldState.gameTimeAbsMinutes = S.outUntil + 1; tickWaylamp(true); return { still, lit: lampLit(), log: GAME_LOG[GAME_LOG.length - 1].text }; });
check(`seven days on: *${relit.log}*`, relit.still && relit.lit && relit.log === 'The Waylamp is lit again. Nobody lit it.', relit);

// five towns' inns make it yours; a sixth refuses; in the stash, no inn trims it
const five = await page.evaluate((ids) => { const inn = id => ({ type: 'inn', id: 'g_' + id + '_x', siteId: id }); const out = [];
  const it = BAG.find(i => i.artifact === 'waylamp'); BAG.splice(BAG.indexOf(it), 1); stashBag.push(it); const stashed = lampTrimAvail(inn(ids[0])); stashBag.splice(stashBag.indexOf(it), 1); BAG.push(it);
  for (const id of ids.slice(0, 5)) out.push(lampTrim(inn(id))); const after = lampTrim(inn(ids[5])); const S = worldState.artifacts.waylamp;
  return { stashed, out, after, own: S.own, trial: S.trial, log: GAME_LOG[GAME_LOG.length - 1].text, n: ids.length }; }, P.others);
console.log(JSON.stringify(five));
check('in the stash it is not carried: no inn trims it', five.stashed === false, five);
check(`five towns' inns: ${five.out.map(o => o.fifth ? 'fifth' : o.n).join(', ')}; it is yours (*${five.log}*); a sixth inn trims nothing`, five.out[4].fifth && five.out[3].n === 4 && five.own && !five.trial && five.after === null && five.log === 'The Waylamp is yours: five towns’ inns, and nothing on your account.', five);

const rows = await page.evaluate(() => { const S = ssSplitPayload(JSON.parse(ssStringify(_buildSavePayload())));
  const r = { world: !!(S.w.wS && S.w.wS.artifacts && S.w.wS.artifacts.waylamp && S.w.wS.artifacts.waylamp.own), charItem: JSON.stringify(S.c).includes('The Waylamp') };
  const it = BAG.find(i => i.artifact === 'waylamp'); if (it) BAG.splice(BAG.indexOf(it), 1); delete worldState.artifacts; return r; });
check('the lamp\'s state rides the world row, the lamp itself the character', rows.world && rows.charItem, rows);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
