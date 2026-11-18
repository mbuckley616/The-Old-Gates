// The four feasts (Session 550): the rules are Michael's C on DECISION #132 (the inn's meal is free, a petty crime's fine
// is halved that day), the names, dates and lines the quest writer's drafted set (Michael's A on #146). One a season, fixed
// to a date and so to a weekday; a townsperson greets you with the feast's line; the innkeeper says hers before the room
// offer and the meal (a Hot Stew) is the house's, once a feast at each inn; a guard halting you for a halved fine says so;
// the Journal's Due view lists the next feast.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

// 1. the dates
const d = await page.evaluate(() => {
  const at = n => feastOn(n * 1440 + 600);
  const days = [0, 21, 22, 23, 111, 168, 326].map(n => { const f = at(n); return [n, f ? f.key : null, calDay(n * 1440).day.name]; });
  return { days, n9: nextFeast(9 * 1440), n23: nextFeast(23 * 1440), n22: nextFeast(22 * 1440 + 900), n112: nextFeast(112 * 1440) };
});
console.log(JSON.stringify(d));
const k = Object.fromEntries(d.days.map(([n, f, w]) => [n, [f, w]]));
check('the Giving is the 23rd of Reaping, a Stoneday (day 23 of a tale); the days either side are no feast', k[22][0] === 'giving' && k[22][1] === 'Stoneday' && k[21][0] === null && k[23][0] === null && k[0][0] === null, d.days);
check('the Empty Chair on Guestday the 28th of Longnight, the Kindling on Hearthday the 1st of Thaw, the Long Light on Skyday the 19th of Highsun', k[111][0] === 'emptychair' && k[111][1] === 'Guestday' && k[168][0] === 'kindling' && k[168][1] === 'Hearthday' && k[326][0] === 'longlight' && k[326][1] === 'Skyday', d.days);
check('the next feast: from day 10 the Giving on day 23; on its own day it is today\'s; after it the Empty Chair; after that the Kindling', d.n9.f.key === 'giving' && d.n9.at === 22 * 1440 && d.n22.f.key === 'giving' && d.n22.at === 22 * 1440 && d.n23.f.key === 'emptychair' && d.n23.at === 111 * 1440 && d.n112.f.key === 'kindling' && d.n112.at === 168 * 1440, { n9: d.n9.at, n22: d.n22.at, n23: d.n23.at, n112: d.n112.at });

// 2. a townsperson's greeting, the inn and its meal
const t = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); const day = n => { worldState.gameTimeAbsMinutes = n * 1440 + 660; worldState.gameTimeMinutes = 660; };
  const folk = (S.npcs || []).filter(n => n.def && n.def._siteId && n.def.people).slice(0, 6);
  const said = n => { openDialog(n.def); const t = document.getElementById('dlg-text').textContent; try { closeDialog(); } catch (e) {} return t; };
  day(21); const plain = folk.map(said);
  day(22); const feast = folk.map(n => [n.def.people, said(n)]);
  const inn = S.houses.find(h => h.type === 'inn'); const people = inn && inn.dlg ? inn.dlg.people : 'gatelander';
  const T = innTopics(inn, people); worldState.rented = null;
  day(21); const offer21 = T[1].response; const bag21 = BAG.filter(i => i.name === 'Hot Stew').reduce((a, i) => a + (i.qty || 1), 0); T[0].fn(); const after21 = BAG.filter(i => i.name === 'Hot Stew').reduce((a, i) => a + (i.qty || 1), 0);
  day(22); const offer22 = T[1].response; T[0].fn(); const once = BAG.filter(i => i.name === 'Hot Stew').reduce((a, i) => a + (i.qty || 1), 0); T[0].fn(); const twice = BAG.filter(i => i.name === 'Hot Stew').reduce((a, i) => a + (i.qty || 1), 0);
  const meals = JSON.parse(JSON.stringify(worldState.feastMeals || {}));
  return { n: folk.length, plain, feast, people, innLine: FEAST_INN[people] || FEAST_INN.gatelander, giving: FEASTS.find(f => f.key === 'giving').greet, offer21, offer22, bag21, after21, once, twice, meals, charKey: !!SS_CHAR_WS.feastMeals };
});
console.log(JSON.stringify(t).slice(0, 1500));
check('on the Giving every townsperson greets with the Giving\'s line in their people\'s voice', t.n >= 3 && t.feast.every(([p, gr]) => gr.startsWith(t.giving[p] || t.giving.gatelander)), t.feast);
check('the day before, none of them does', t.plain.every(gr => !Object.values(t.giving).some(l => gr.startsWith(l))), t.plain);
check('on the feast the innkeeper\'s line comes before the room offer; the day before it does not', t.offer22.startsWith(t.innLine + ' ') && !t.offer21.includes(t.innLine) && t.offer22.endsWith(t.offer21.slice(-20)), { offer21: t.offer21, offer22: t.offer22 });
check('asking for something to eat on the feast puts one Hot Stew in your pack, once; the day before, none', t.after21 === t.bag21 && t.once === t.bag21 + 1 && t.twice === t.once, t);
check('the meals given are the character\'s (saved with the character row)', t.charKey && t.meals.day === 22 && Object.keys(t.meals).length === 2, t.meals);

// 3. a petty crime's fine is halved on the feast, and the guard says so
const f = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); const site = S.site; const day = n => { worldState.gameTimeAbsMinutes = n * 1440 + 660; worldState.gameTimeMinutes = 660; };
  const house = S.houses.find(h => /weapon|armor|potion|misc/.test(h.type)); const C = worldState.crime || (worldState.crime = {});
  const fine = n => { day(n); delete C[site.id]; seenCrime('theft', house, { name: 'x' }, 10); return C[site.id].bounty; };
  const b21 = fine(21), b22 = fine(22); const c = C[site.id];
  const n = (S.npcs || []).find(x => x.def && x.def.role === 'Guard') || (S.npcs || [])[0];
  confront(n, S, c); const said = document.getElementById('dlg-text').textContent; try { closeDialog(); } catch (e) {}
  day(23); confront(n, S, c); const said23 = document.getElementById('dlg-text').textContent; try { closeDialog(); } catch (e) {}
  const people = peopleOfSite(site); delete C[site.id];
  return { b21, b22, said, said23, line: FEAST_FINE[people] || FEAST_FINE.gatelander, people };
});
console.log(JSON.stringify(f));
check('a theft of goods worth 10 is fined 60 on an ordinary day and 30 on the feast', f.b21 === 60 && f.b22 === 30, f);
check('halted for it that day, the guard says the feast\'s half after the halt; the day after, he does not', f.said.endsWith(f.line) && /fine of 30 gold/.test(f.said) && !f.said23.includes(f.line), f);

// 4. the Due view
const due = await page.evaluate(() => { worldState.gameTimeAbsMinutes = 9 * 1440 + 600; worldState.gameTimeMinutes = 600; const D = calendarDue(); openHub('journal'); journalView('due'); const txt = document.getElementById('jn-body').innerText; closeHub(); return { D: D.filter(e => e.feast), txt }; });
check('the Due view lists the next feast with its line and its date', due.D.length === 1 && /in 13 days\s+🪨 The Giving — the year’s dead named at the old gate\. Stoneday, the 23rd of Reaping/.test(due.txt), due);

// 5. the nine island festivals (Session 2313, Michael's B on #1628): each kept by one island's towns, as its year allows
const fv = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); const site = S.site; const st = TS(site); const keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags, ended: st.ended, freed: st.freed, fav: favor(site) }));
  const day = n => { worldState.gameTimeAbsMinutes = n * 1440 + 660; worldState.gameTimeMinutes = 660; };
  const folk = (S.npcs || []).filter(n => n.def && n.def._siteId && n.def.people).slice(0, 4);
  const said = n => { openDialog(n.def); const t = document.getElementById('dlg-text').textContent; try { closeDialog(); } catch (e) {} return t; };
  const isle = isleAt(site.x, site.z), L = FESTIVALS.find(f => f.key === 'lanterns');
  const dates = FESTIVALS.map(f => { const n = ((f.month - CAL.startMonth + 12) % 12) * 28 + f.dom - 1; const c = calDay(n * 1440); return [f.key, n, c.day.name, (festivalOn(n * 1440 + 600) || {}).key, (festivalOn(n * 1440 + 600, f.nation === 'mark' ? 'aurenne' : 'mark') || {}).key || null]; });
  const clash = FESTIVALS.some(f => FEASTS.some(e => e.month === f.month && e.dom === f.dom));
  st.p = 70; st.flags = {}; delete st.ended; delete st.freed; (worldState.favor || (worldState.favor = {}))[site.id] = 0;
  day(53); const full = festivalState(site), sq53 = feastNow(site.id), gr = folk.map(n => [n.def.people, said(n)]);
  day(8); const sq8 = feastNow(site.id), gr8 = folk.map(said), here8 = festivalHere(site.id);
  day(53); st.p = 40; const thinP = festivalState(site); st.p = 70;
  flag(site, 'besieged', true); const none = festivalState(site), sqNone = feastNow(site.id), grNone = folk.map(said);
  worldState.gameTimeAbsMinutes = 43 * 1440; flag(site, 'besieged', false); const ended = st.ended && st.ended.besieged;
  day(53); const thinLift = festivalState(site); day(80); const fullAfter = festivalState(site);
  day(53); worldState.favor[site.id] = 3; const named = festivalState(site); worldState.favor[site.id] = 0;
  delete st.ended; st.freed = { day: 2, how: 'siege' }; const namedFreed = festivalState(site);
  worldState.gameTimeAbsMinutes = 9 * 1440 + 600; worldState.gameTimeMinutes = 600; const D = calendarDue().filter(e => e.festival).map(e => [e.festival, e.at / 1440]);
  Object.assign(st, { p: keep.p, flags: keep.flags }); if (keep.ended) st.ended = keep.ended; else delete st.ended; if (keep.freed) st.freed = keep.freed; else delete st.freed; worldState.favor[site.id] = keep.fav;
  return { isle, dates, clash, full, sq53, gr, lg: L.greet, sq8, gr8, here8, thinP, none, sqNone, grNone, ended, thinLift, fullAfter, named, namedFreed, D, kind: site.kind };
});
console.log(JSON.stringify(fv).slice(0, 2500));
const fd = Object.fromEntries(fv.dates.map(([k, n, w, on, other]) => [k, { n, w, on, other }]));
check('the nine fall on their drafted dates and gods\' days, each its own island\'s only, and none on a feast', fd.greening.w === 'Beastday' && fd.riverfair.w === 'Seaday' && fd.lanterns.n === 53 && fd.lanterns.w === 'Skyday' && fd.blaze.w === 'Hearthday' && fd.straitfair.w === 'Seaday' && fd.commencement.w === 'Weaverday' && fd.caravan.n === 8 && fd.caravan.w === 'Stoneday' && fd.lamps.w === 'Seaday' && fv.dates.every(([k, , , on, other]) => on === k && other !== k) && !fv.clash, fv.dates);
check('on the Night of the Lanterns, Dunmore (Gatelands) keeps it in full: each townsperson greets with its line in their people\'s voice, and the square fills', fv.isle === 'gatelands' && fv.full === 'full' && fv.sq53 && fv.gr.every(([p, gr]) => gr.startsWith(fv.lg[p] || fv.lg.gatelander)), fv.gr);
check('on the Caravan (Aurenne\'s) Dunmore keeps nothing: no festival, no full square, no festival line', !fv.here8 && !fv.sq8 && fv.gr8.every(gr => !gr.startsWith('The caravan')), fv.gr8);
check('the town as its year allows: thin under prosperity 50; not kept while besieged (no full square, no line); thin for 28 days after the siege lifts, full after', fv.thinP === 'thin' && fv.none === 'none' && !fv.sqNone && fv.grNone.every(gr => !Object.values(fv.lg).some(l => gr.startsWith(l))) && fv.ended === 43 * 1440 && fv.thinLift === 'thin' && fv.fullAfter === 'full', fv);
check('the town names you at favour 3, or when you freed it this year', fv.named === 'named' && fv.namedFreed === 'named', fv);
check('the Due view lists the next festival of the island you stand on', fv.D.length === 1 && fv.D[0][0] === 'lanterns' && fv.D[0][1] === 53, fv.D);
// 6. Riverfair's butts (Session 2314, festivals B session 2): three ends of three at 30, 50 and 70 m, rings 5/3/1, against the
// best of three townsfolk seeded by festival, site and year; a win pays the purse, a silver arrow and +1 Bow once a year
const bt = await page.evaluate(() => {
  const site = siteAnywhere('dunmore'); /* section 5's flags disposed the settlement */ const st = TS(site); const keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags, fav: favor(site) }));
  const rf = FESTIVALS.find(f => f.key === 'riverfair'), n = ((rf.month - CAL.startMonth + 12) % 12) * 28 + rf.dom - 1;
  const at = h => { worldState.gameTimeAbsMinutes = n * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  st.p = 70; st.flags = {}; (worldState.favor || (worldState.favor = {}))[site.id] = 0; worldState.festivals = {};
  const w0 = EQ.weapon, a0 = EQ.ammo, tp0 = thirdPerson, pi0 = pitch, x0 = px, z0 = pz, sk0 = JSON.stringify(SKILLS.bow), g0 = gold;
  EQ.weapon = { name: 'Test Bow', ico: '🏹', type: 'equip', slot: 'weapon', atk: [5, 7], weaponShape: 'bow', wType: 'pierce', twoHand: true, weight: 3 };
  EQ.ammo = { name: 'Iron Arrow', ico: '➶', type: 'ammo', qty: 60, arrowDmg: [2, 12] }; thirdPerson = false; pitch = 0; SKILLS.bow = { lv: 30, p: 0 };
  const out = {};
  try {
    const r1 = buttRivals(site, 27), r2 = buttRivals(site, 27), r3 = buttRivals(site, 28), band = BUTT_SKILL[site.kind] || BUTT_SKILL.town;
    out.seeded = JSON.stringify(r1) === JSON.stringify(r2) && JSON.stringify(r1) !== JSON.stringify(r3);
    out.band = r1.every(q => q.skill >= band[0] && q.skill <= band[1] && q.total === q.ends.flat().reduce((a, b) => a + b, 0)); out.kind = site.kind; out.rivals = r1.map(q => [q.skill, q.total]);
    let city = 0, vil = 0; for (let y = 0; y < 200; y++) { city += Math.max(...buttRivals({ id: 'c' + y, kind: 'city' }, y).map(q => q.total)); vil += Math.max(...buttRivals({ id: 'v' + y, kind: 'village' }, y).map(q => q.total)); }
    out.cityBest = city / 200; out.vilBest = vil / 200;
    at(9); out.early = buttsOpenFor(site).say; at(n === 0 ? 11 : 11);
    st.p = 40; out.thin = buttsOpenFor(site).say; st.p = 70;
    out.otherDay = (worldState.gameTimeAbsMinutes = (n + 1) * 1440 + 660, buttsOpenFor(site).say); at(11);
    // one contest: aim at the face from just before it, at a lateral offset; 0.1 m scores 5, 0.3 m 3, 0.9 m nothing
    const shoot = off => { fireArrow(1); const a = ZB[ZB.length - 1], B = BUTTS; const lx = B.dz, lz = -B.dx;
      a.position.set(B.cx - B.dx * .4 + lx * off, B.cy, B.cz - B.dz * .4 + lz * off); a.userData.vx = B.dx * 30; a.userData.vz = B.dz * 30; a.userData.vy = 0;
      for (let k = 0; k < 10; k++) { tickArrowMotion(a, 1 / 60, true); tickButts(); } return a; };
    // an arrow loosed off the mark does not count
    const R0 = buttsStart({ site, x: px, z: pz, dx: 0, dz: -1 }); out.r0 = R0.ok; out.butt30 = Math.round(Math.hypot(BUTTS.cx - px, BUTTS.cz - pz)); out.meshIn = !!(BUTTS.mesh && BUTTS.mesh.parent);
    const mx = px; px = mx + 3; fireArrow(1); out.offMark = BUTTS.shots.length; px = mx;
    const dists = []; for (const off of [.1, .3, .9, .1, .1, .1, .1, .1, .1]) { dists.push(Math.round(Math.hypot(BUTTS.cx - BUTTS.x, BUTTS.cz - BUTTS.z))); shoot(off); if (!BUTTS) break; }
    out.dists = dists; out.planted = ZB.filter(a => a.userData.butt && a.userData.butt.score === 5).length;
    out.after = JSON.parse(JSON.stringify(worldState.festivals)); out.gold = gold - g0; out.bow = SKILLS.bow.lv; out.arrow = BAG.filter(b => b.keepsake === 'riverfair').map(b => b.name);
    out.again = buttsOpenFor(site).say;
    // the next year: a lost try pays nothing; and the town entry reset in the same year, a win pays the purse but no second point
    worldState.festivals['riverfair:' + site.id].year = 0; const R2 = buttsStart({ site, x: px, z: pz, dx: 0, dz: -1 }); for (let k = 0; k < 9 && BUTTS; k++) shoot(.9);
    out.lost = { ok: R2.ok, f: JSON.parse(JSON.stringify(worldState.festivals['riverfair:' + site.id])), gold: gold - g0 };
    worldState.festivals['riverfair:' + site.id].year = 0; const sk1 = SKILLS.bow.lv; buttsStart({ site, x: px, z: pz, dx: 0, dz: -1 }); for (let k = 0; k < 9 && BUTTS; k++) shoot(.1);
    out.second = { bow: SKILLS.bow.lv - sk1, gold: gold - g0 };
    // walking off the mark ends it
    worldState.festivals['riverfair:' + site.id].year = 0; buttsStart({ site, x: px, z: pz, dx: 0, dz: -1 }); const m = BUTTS.mesh; px = mx + 25; tickButts(); out.left = { gone: !BUTTS, mesh: !(m && m.parent), f: worldState.festivals['riverfair:' + site.id].won }; px = mx;
  } finally { if (BUTTS) buttsEnd('left'); EQ.weapon = w0; EQ.ammo = a0; thirdPerson = tp0; pitch = pi0; px = x0; pz = z0; SKILLS.bow = JSON.parse(sk0);
    for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].keepsake === 'riverfair') BAG.splice(i, 1); Object.assign(st, { p: keep.p, flags: keep.flags }); worldState.favor[site.id] = keep.fav; worldState.festivals = {}; }
  return out;
});
console.log(JSON.stringify(bt).slice(0, 2500));
check('the rivals are seeded by site and year (the same twice, another year another field), their skill in the town\'s band, and their totals their nine arrows', bt.seeded && bt.band, bt.rivals);
check('the field: a city\'s best averages about 23 of 45, a village\'s about 13', bt.cityBest > 19 && bt.cityBest < 28 && bt.vilBest > 9 && bt.vilBest < 17 && bt.cityBest > bt.vilBest + 5, [bt.cityBest, bt.vilBest]);
check('the butts are shot on Riverfair from 10:00, in a town keeping it full; not thin, not on another day', /from 10:00 to 14:00/.test(bt.early) && /no shooting this year/.test(bt.thin) && /shot at Riverfair/.test(bt.otherDay), [bt.early, bt.thin, bt.otherDay]);
check('the butt stands 30 m from the mark; an arrow loosed 3 m off the mark does not count', bt.r0 && bt.butt30 === 30 && bt.meshIn && bt.offMark === 0, bt);
check('three ends at 30, 50 and 70 m; 5, 3 and a miss then six 5s make 38, the arrows that score 5 planted in the face', bt.dists.join() === '30,30,30,50,50,50,70,70,70' && Object.values(bt.after).some(f => f.score === 38) && bt.planted >= 7, [bt.dists, bt.after, bt.planted]);
check('38 beats the town\'s best: the purse (40 + 20 a tier), a silver arrow named for the town, Bow 30 → 31, and one try a town a year', Object.values(bt.after).some(f => f.won) && bt.gold >= 40 && bt.gold % 20 === 0 && bt.arrow.length === 1 && /^Silver Arrow of /.test(bt.arrow[0]) && bt.bow === 31 && bt.after.skill && /shot here this year/.test(bt.again), bt);
check('nine misses lose: nothing paid; a second win the same year pays the purse but no second point of Bow; walking 20 m off the mark ends it, lost', bt.lost.ok && bt.lost.f.score === 0 && !bt.lost.f.won && bt.lost.gold === bt.gold && bt.second.bow === 0 && bt.second.gold === 2 * bt.gold && bt.left.gone && bt.left.mesh && bt.left.f === false, bt);
// 7. the Strait Fair's ring (Session 2315, festivals B session 3): three quarrels in a row, fists, each to a yield, in a Markish town
const fr = await page.evaluate(() => {
  const site = ladderSites()[0], st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags, fav: favor(site) }));
  const sf = FESTIVALS.find(f => f.key === 'straitfair'), n = ((sf.month - CAL.startMonth + 12) % 12) * 28 + sf.dom - 1;
  const at = h => { worldState.gameTimeAbsMinutes = n * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  st.p = 70; st.flags = {}; (worldState.favor || (worldState.favor = {}))[site.id] = 0; worldState.festivals = {};
  const w0 = EQ.weapon, sk0 = JSON.stringify(SKILLS.hand), g0 = gold, hp0 = PHP, A = arenaState(), ban0 = A.banUntil;
  EQ.weapon = { name: 'Test Sword', ico: '🗡', type: 'equip', slot: 'weapon', atk: [5, 7], wType: 'slash', weight: 3 }; SKILLS.hand = { lv: 20, p: 0 }; A.banUntil = 0;
  const out = { isle: isleAt(site.x, site.z), kind: site.kind };
  const yieldAll = () => { const seen = []; for (let q = 0; q < 3 && FAIRRING; q++) { seen.push([BOUT && BOUT.foe.name, BOUT && BOUT.foe._disarmed, EQ.weapon ? EQ.weapon.name : null]); boutYield(); for (let k = 0; k < 220 && FAIRRING && FAIRRING.n === q; k++) tickFairRing(1 / 60); } return seen; };
  try {
    at(4); out.early = fairRingOpenFor(site).say; at(8);
    out.dunmore = fairRingOpenFor('dunmore').say;
    st.p = 40; out.thin = fairRingOpenFor(site).say; st.p = 70;
    const R = fairRingStart({ site, x: px, z: pz }); out.ok = R.ok; out.seen = yieldAll();
    out.after = JSON.parse(JSON.stringify(worldState.festivals)); out.gold = gold - g0; out.hand = SKILLS.hand.lv; out.ring = BAG.filter(b => b.keepsake === 'straitfair').map(b => b.name);
    out.weapon = EQ.weapon && EQ.weapon.name; out.again = fairRingOpenFor(site).say; out.ringNull = !FAIRRING && !BOUT;
    // a fall in the second quarrel loses it all: nothing paid, the sword back, held at 1 health
    worldState.festivals['straitfair:' + site.id].year = 0; fairRingStart({ site, x: px, z: pz }); boutYield(); for (let k = 0; k < 220 && FAIRRING && FAIRRING.n === 0; k++) tickFairRing(1 / 60);
    const q2 = FAIRRING && FAIRRING.n; PHP = 0; const down = boutDown();
    out.lost = { q2, down, f: JSON.parse(JSON.stringify(worldState.festivals['straitfair:' + site.id])), gold: gold - g0, hp: PHP, weapon: EQ.weapon && EQ.weapon.name, gone: !FAIRRING };
  } finally { if (FAIRRING) fairRingEnd('left'); EQ.weapon = w0; SKILLS.hand = JSON.parse(sk0); PHP = hp0; A.banUntil = ban0;
    for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].keepsake === 'straitfair' || BAG[i].name === 'Test Sword') BAG.splice(i, 1); Object.assign(st, { p: keep.p, flags: keep.flags }); worldState.favor[site.id] = keep.fav; worldState.festivals = {}; }
  return out;
});
console.log(JSON.stringify(fr).slice(0, 2000));
check('the ring is fought at the Strait Fair from 5:00 till noon, in a Markish town keeping it full; not in Dunmore, not in a thin year', fr.isle === 'mark' && /from 5:00 till noon/.test(fr.early) && /Strait Fair/.test(fr.dunmore) && /No ring this year/.test(fr.thin), fr);
check('three quarrels in turn, each a disarmed fighter, your sword on the rack', fr.ok && fr.seen.length === 3 && fr.seen.every(([nm, dis, w]) => nm && dis && w === null) && fr.seen.map(q => q[0]).join('|') === 'The first comer|The second comer|The third comer', fr.seen);
check('three yields win: the purse (40 + 20 a tier), the reeve\'s ring named for the town, Hand-to-hand 20 → 21, the sword back, one try a town a year', fr.ringNull && Object.values(fr.after).some(f => f.won && f.quarrels === 3) && fr.gold >= 40 && fr.gold % 20 === 0 && fr.ring.length === 1 && /^Reeve’s Iron Ring of /.test(fr.ring[0]) && fr.hand === 21 && fr.weapon === 'Test Sword' && /fought here this year/.test(fr.again), fr);
check('a fall in the second quarrel loses it: held at 1 health, nothing paid, the sword back', fr.lost.q2 === 1 && fr.lost.down && fr.lost.gone && fr.lost.f.won === false && fr.lost.f.quarrels === 1 && fr.lost.gold === fr.gold && fr.lost.hp === 1 && fr.lost.weapon === 'Test Sword', fr.lost);
// 8. the Commencement's disputation (Session 2319, festivals B session 4): three questions upon books, two answered win, in an Aurennais town
const dp = await page.evaluate(() => {
  let site = null; for (let j = 0; j < GRID && !site; j++) for (let i = 0; i < GRID && !site; i++) { if (nationKeyOf(i, j) !== 'aurenne') continue; const c = getCell(i, j); if (c.type === 'sea') continue; site = c.sites.find(s => s.kind === 'town' || s.kind === 'city') || null; }
  const st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags, fav: favor(site) }));
  const cm = FESTIVALS.find(f => f.key === 'commencement'), n = ((cm.month - CAL.startMonth + 12) % 12) * 28 + cm.dom - 1;
  const at = (h, yr) => { worldState.gameTimeAbsMinutes = ((yr || 0) * CAL.monthLen * CAL.months + n) * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  st.p = 70; st.flags = {}; (worldState.favor || (worldState.favor = {}))[site.id] = 0; worldState.festivals = {};
  const sk0 = JSON.stringify(SKILLS.speech), g0 = gold, br0 = [...booksRead], x0 = px, z0 = pz;
  const out = { isle: isleAt(site.x, site.z), kind: site.kind };
  try {
    const q1 = dispQuestions(site, 27), q2 = dispQuestions(site, 27), q3 = dispQuestions(site, 28);
    out.seeded = JSON.stringify(q1) === JSON.stringify(q2) && JSON.stringify(q1) !== JSON.stringify(q3) && new Set(q1).size === 3 && q1.every(b => DISP_BOOKS.includes(b) && dispBook(b));
    at(8); out.early = dispOpenFor(site).say; at(10);
    out.dunmore = dispOpenFor('dunmore').say; st.p = 40; out.thin = dispOpenFor(site).say; st.p = 70;
    // a win: the first argued at Speech 45 (passes 40), the second from the book read, the third argued (fails 70)
    booksRead.clear(); SKILLS.speech = { lv: 45, p: 0 };
    const R = dispStart({ site, x: px, z: pz }); out.ok = R.ok; out.qs = R.qs; booksRead.add(R.qs[1]);
    out.bookBefore = dispCanBook(); out.unread = dispAnswer('book'); const a1 = dispAnswer('argue'); out.bookNow = dispCanBook();
    const a2 = dispAnswer('book'); const a3 = dispAnswer('argue'); out.answers = [a1, a2, a3];
    out.after = JSON.parse(JSON.stringify(worldState.festivals)); out.gold = gold - g0; out.speech = SKILLS.speech.lv;
    out.seal = BAG.filter(b => b.keepsake === 'commencement').map(b => b.name); out.again = dispOpenFor(site).say; out.done = !DISP;
    out.topics = dispTopics(site).map(t => [t.label, t.avail()]); out.champ = (worldState.festChampions || {})['commencement:' + site.id];
    // a loss the next year: Speech 20, nothing read; nothing paid, no second point. And a withdrawal: walk 13 m off
    at(10, 1); booksRead.clear(); SKILLS.speech = { lv: 20, p: 0 }; const g1 = gold;
    dispStart({ site, x: px, z: pz }); for (let k = 0; k < 3; k++) dispAnswer('argue');
    out.lost = { f: JSON.parse(JSON.stringify(worldState.festivals['disputation:' + site.id])), gold: gold - g1, speech: SKILLS.speech.lv, done: !DISP };
    at(10, 2); dispStart({ site, x: px, z: pz }); px += 13; tickDisp(); px = x0;
    out.left = { done: !DISP, f: JSON.parse(JSON.stringify(worldState.festivals['disputation:' + site.id])) };
  } finally { if (DISP) dispEnd('left'); px = x0; pz = z0; SKILLS.speech = JSON.parse(sk0); booksRead.clear(); br0.forEach(b => booksRead.add(b));
    for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].keepsake === 'commencement') BAG.splice(i, 1); Object.assign(st, { p: keep.p, flags: keep.flags }); worldState.favor[site.id] = keep.fav; worldState.festivals = {}; }
  return out;
});
console.log(JSON.stringify(dp).slice(0, 2000));
check('the disputation sits at the Commencement from 9:00 till noon, in an Aurennais town keeping it full; not in Dunmore, not in a thin year', dp.isle === 'aurenne' && /from 9:00 till noon/.test(dp.early) && /Commencement/.test(dp.dunmore) && /No disputation this year/.test(dp.thin), dp);
check('three questions upon three different books the game holds, the same three for a site and year, others the next year', dp.seeded && dp.qs.length === 3, dp.qs);
check('a book answers only once read; Speech 45 passes the first (40) and fails the third (70); two of three win the purse (40 + 20 a tier), the scholar\'s seal and Speech 45 → 46, one try a town a year', dp.ok && !dp.bookBefore && /not read/.test(dp.unread.say) && dp.bookNow && dp.answers.map(a => a.ok).join() === 'true,true,false' && dp.done && Object.values(dp.after).some(f => f.won && f.answered === 2) && dp.gold >= 40 && dp.gold % 20 === 0 && dp.seal.length === 1 && /^Scholar’s Seal of /.test(dp.seal[0]) && dp.speech === 46 && /sat here this year/.test(dp.again) && dp.champ && dp.champ.you && dp.champ.year === dp.after['disputation:' + Object.keys(dp.after).find(k => k.startsWith('disputation:')).slice(12)].year, dp);
check('none of three at Speech 20 loses, nothing paid; walking off the table withdraws, a loss', dp.lost.done && dp.lost.f.won === false && dp.lost.f.answered === 0 && dp.lost.gold === 0 && dp.lost.speech === 20 && dp.left.done && dp.left.f.won === false, { lost: dp.lost, left: dp.left });
// 9. the post and the town's memory (Session 2320, festivals B session 5): the contest's champion a town and year, yours or the town's
const ch = await page.evaluate(() => {
  const site = siteAnywhere('dunmore'), st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags, fav: favor(site) }));
  const rf = FESTIVALS.find(f => f.key === 'riverfair'), t0 = worldState.gameTimeAbsMinutes, c0 = worldState.festChampions;
  const at = (yr, h) => { worldState.gameTimeAbsMinutes = ((yr - CAL.startYear) * CAL.months + rf.month - CAL.startMonth) * CAL.monthLen * 1440 + (rf.dom - 1) * 1440 + h * 60; };
  st.p = 70; st.flags = {}; worldState.festChampions = {};
  const out = { contest: (festContestOf(site) || {}).key };
  try {
    at(28, 11); out.day = (calDay(worldState.gameTimeAbsMinutes).dom === rf.dom && calDay(worldState.gameTimeAbsMinutes).year === 28);
    out.before = festChampion(site, 'riverfair', 28); out.nowBefore = festChampionNow(site);
    at(28, 15); const a = festChampion(site, 'riverfair', 28), b = festChampion(site, 'riverfair', 28); out.town = a; out.same = JSON.stringify(a) === JSON.stringify(b);
    out.other = festChampion(site, 'riverfair', 29) === null && JSON.stringify(festTownChampion(site, 'riverfair', 29)) !== JSON.stringify(a);
    festCrown('riverfair', site, 28); out.mine = festChampionNow(site);
    at(31, 11); out.post = festPostNames(site).map(c => [c.year, c.name, c.you]); out.nowLater = festChampionNow(site);
    st.p = 40; out.thin = festChampionNow(site); st.p = 70;
    out.saved = /'festChampions'/.test(_applyLoadData.toString()) && !SS_CHAR_WS.festChampions;
  } finally { worldState.gameTimeAbsMinutes = t0; worldState.festChampions = c0; Object.assign(st, { p: keep.p, flags: keep.flags }); }
  return out;
});
console.log(JSON.stringify(ch).slice(0, 2000));
check('a Gatelands town\'s contest is Riverfair\'s; no champion before the butts close; after, the town\'s own, a name seeded by site and year', ch.contest === 'riverfair' && ch.day && ch.before === null && ch.nowBefore === null && ch.town && ch.town.name && ch.town.you === false && ch.same && ch.other, ch);
check('a win is cut as yours; three years on, before the butts close, the post reads three years newest first with yours last and the town says last year\'s; a thin year keeps only what you won; the world\'s save', ch.mine && ch.mine.you && ch.mine.year === 28 && ch.post.length === 3 && ch.post.map(p => p[0]).join() === '30,29,28' && ch.post[2][2] === true && ch.post.slice(0, 2).every(p => p[2] === false) && ch.nowLater && ch.nowLater.year === 30 && ch.thin && ch.thin.you && ch.saved, ch);
// 10. First Snow's night (Session 2321): a Markish town where you saw the snow lie at nightfall in Culling keeps it that day, not on the 28th
const fs = await page.evaluate(() => {
  const L = ladderSites(), site = L[0], other = L.find(s => s.id !== site.id && isleAt(s.x, s.z) === 'mark'), st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags }));
  const t0 = worldState.gameTimeAbsMinutes, m0 = worldState.gameTimeMinutes, cv0 = WX.cover, ns0 = nearSite, f0 = worldState.firstSnow;
  const day = (yr, dom) => ((yr - CAL.startYear) * CAL.months + 8 - CAL.startMonth) * CAL.monthLen + dom - 1;
  const at = (yr, dom, h) => { worldState.gameTimeAbsMinutes = day(yr, dom) * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  const key = (yr, dom) => { const h = festivalHere(site.id, day(yr, dom) * 1440 + 600); return h ? h.f.key : null; };
  const tick = () => { for (let k = 0; k < 130; k++) tickFirstSnow(); };
  st.p = 70; st.flags = {}; worldState.firstSnow = {}; nearSite = () => ({ site });
  const out = { mark: isleAt(site.x, site.z), other: other && other.id };
  try {
    out.before = [key(28, 12), key(28, 28)];
    at(28, 12, 17); WX.cover = .8; tick(); out.early = !!(worldState.firstSnow[site.id]);
    at(28, 12, 19); WX.cover = .2; tick(); out.thin = !!(worldState.firstSnow[site.id]);
    WX.cover = .8; tick(); out.rec = JSON.parse(JSON.stringify(worldState.firstSnow[site.id] || null));
    out.after = [key(28, 12), key(28, 28), key(28, 13)];
    out.otherTown = other ? (festivalHere(other.id, day(28, 28) * 1440 + 600) || { f: {} }).f.key : 'firstsnow';
    at(28, 20, 19); tick(); out.second = worldState.firstSnow[site.id].n === out.rec.n;
    out.nextYear = key(29, 28);
    const S = calDay(day(28, 12) * 1440); out.date = [S.month, S.dom];
  } finally { worldState.gameTimeAbsMinutes = t0; worldState.gameTimeMinutes = m0; WX.cover = cv0; nearSite = ns0; worldState.firstSnow = f0; Object.assign(st, { p: keep.p, flags: keep.flags }); }
  return out;
});
console.log(JSON.stringify(fs));
check('First Snow: Culling 28 until the snow is seen; not before 18:00 or under the cover; seen on Culling 12 at 19:00 it is kept that day and not on the 28th; another Markish town and the next year keep the 28th', fs.mark === 'mark' && fs.date.join() === '8,12' && fs.before.join() === ',firstsnow' && !fs.early && !fs.thin && fs.rec && fs.after.join() === 'firstsnow,,' && fs.otherTown === 'firstsnow' && fs.second && fs.nextYear === 'firstsnow', fs);
// 11. the festivals' acts (Session 2324): the Greening's ribbon at the green's middle and Riverfair's cup at the water at noon, once a
// town a year; the next Gatelander to greet you that day says so, once; the lord's Greening line
await g.settle('dunmore');
const fa = await page.evaluate(() => {
  const site = siteAnywhere('dunmore'), S = WORLD.settle.get('dunmore'), st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags }));
  const mark = ladderSites().find(s => isleAt(s.x, s.z) === 'mark');
  const t0 = worldState.gameTimeAbsMinutes, m0 = worldState.gameTimeMinutes, f0 = worldState.festivals, ns0 = nearSite, p0 = [px, pz];
  const at = (f, yr, h) => { worldState.gameTimeAbsMinutes = (((yr - CAL.startYear) * CAL.months + f.month - CAL.startMonth) * CAL.monthLen + f.dom - 1) * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  const gr = FESTIVALS.find(f => f.key === 'greening'), rf = FESTIVALS.find(f => f.key === 'riverfair');
  const folk = (S.npcs || []).find(n => n.def && n.def.people === 'gatelander' && !n.def._lord), lord = S.lordNpc;
  st.p = 70; st.flags = {}; worldState.festivals = {}; let here = { site }; nearSite = () => here;
  const out = { folk: !!folk, lordPeople: lord && lord.def.people };
  try {
    at(gr, 28, 10); px = site.x + 2; pz = site.z; out.prompt = festActPrompt(); px = site.x + 10; out.far = festActPrompt(); px = site.x + 2;
    out.greet0 = folk && feastGreeting(folk.def); out.lord = lord && feastGreeting(lord.def);
    out.did = festActInteract(); out.rec = JSON.parse(JSON.stringify(worldState.festivals['greening:' + site.id] || null));
    out.after = festActPrompt(); out.again = festActInteract();
    out.thanks = folk && feastGreeting(folk.def); out.thanks2 = folk && feastGreeting(folk.def);
    at(gr, 29, 10); out.nextYear = festActPrompt();
    here = { site: mark }; px = mark.x + 1; pz = mark.z; out.markPrompt = festActPrompt(); here = { site }; px = site.x; pz = site.z;
    const w = festWaterAt(site); px = w.x + 3; pz = w.z;
    at(rf, 28, 11); out.cup11 = festActPrompt(); at(rf, 28, 12.5); out.cup1230 = festActPrompt(); at(rf, 28, 12); out.cup12 = festActPrompt(); out.poured = festActInteract();
    out.cupRec = JSON.parse(JSON.stringify(worldState.festivals['riverfair:' + site.id] || null)); out.butts = buttsOpenFor(site, { force: true }).ok === true;
    at(rf, 28, 13); worldState.festivals = {}; out.cup13 = festActPrompt();
    out.charKey = !!SS_CHAR_WS.festivals && /'festivals'/.test(_applyLoadData.toString());
  } finally { worldState.gameTimeAbsMinutes = t0; worldState.gameTimeMinutes = m0; worldState.festivals = f0; nearSite = ns0; px = p0[0]; pz = p0[1]; Object.assign(st, { p: keep.p, flags: keep.flags }); }
  out.greenGreet = gr.greet.gatelander;
  return out;
});
console.log(JSON.stringify(fa).slice(0, 2500));
check('the Greening: a ribbon at the green\'s middle (not 10 m off, not in a Markish town), once a town a year, its line in the log; again next year', /tie a ribbon/.test(fa.prompt) && fa.far === null && fa.did && fa.rec && fa.rec.act === 28 && fa.after === null && fa.again === false && /tie a ribbon/.test(fa.nextYear || '') && fa.markPrompt === null, fa);
check('after the ribbon the next Gatelander says so, once, then the day\'s greeting again; the lord gives the Greening\'s line', fa.folk && fa.greet0 === fa.greenGreet && /the plain one\?/.test(fa.thanks) && fa.thanks2 === fa.greenGreet && (fa.lordPeople !== 'gatelander' || /carrying a lamb/.test(fa.lord)), fa);
check('Riverfair\'s cup at the water only from 12:00 to 13:00 (and at 12:30); poured once, and the butts still open to you; the character\'s save', fa.cup11 === null && /pour a cup/.test(fa.cup12) && /pour a cup/.test(fa.cup1230 || '') && fa.poured && fa.cupRec && fa.cupRec.act === 28 && fa.butts && fa.cup13 === null && fa.charKey, fa);
// 12. the Night of the Lanterns (Session 2325): the lanternmaker on the square from 18:00 to 22:00, a lantern for two gold, *For me*
// for nothing, given in a town that names you; the last lantern's line at 22:00; the next day's word, once
await g.settle('dunmore');
const ln = await page.evaluate(() => {
  const site = siteAnywhere('dunmore'), S = WORLD.settle.get('dunmore'), st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags }));
  const t0 = worldState.gameTimeAbsMinutes, m0 = worldState.gameTimeMinutes, f0 = worldState.festivals, ns0 = nearSite, fs0 = festivalState, p0 = [px, pz], g0 = gold;
  const lf = FESTIVALS.find(f => f.key === 'lanterns');
  const at = (dom, h) => { worldState.gameTimeAbsMinutes = (((28 - CAL.startYear) * CAL.months + lf.month - CAL.startMonth) * CAL.monthLen + dom - 1) * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  const tick = () => { _lantT = 0; tickLanterns(1); };
  const folk = (S.npcs || []).find(n => n.def && n.def.people === 'gatelander' && !n.def._lord && !n.def._lantern);
  const labels = () => LANTERN.npc.def.topics.map(t => t.label);
  const choose = i => { const T = LANTERN.npc.def.topics.find(t => t.label === 'A lantern.'); const c = T.follow[i]; return c.fn(c); };
  st.p = 70; st.flags = {}; worldState.festivals = {}; nearSite = () => ({ site }); px = site.x; pz = site.z;
  const out = {};
  try {
    at(26, 17); tick(); out.at17 = !!LANTERN;
    at(26, 19); tick(); out.at19 = !!LANTERN && LANTERN.npc.def.role; out.people = LANTERN && LANTERN.npc.def.people; out.greet = LANTERN && dlgGreeting(LANTERN.npc.def);
    out.labels = labels(); gold = 10;
    out.me = choose(3); out.meGold = gold; out.meRec = JSON.parse(JSON.stringify(worldState.festivals['lanterns:' + site.id])); out.labelsAfter = labels();
    worldState.festivals = {}; out.sent = choose(0); out.sentGold = gold; out.rec = JSON.parse(JSON.stringify(worldState.festivals['lanterns:' + site.id]));
    worldState.festivals = {}; gold = 1; out.poor = choose(1); out.poorRec = !!worldState.festivals['lanterns:' + site.id];
    festivalState = () => 'named'; out.given = choose(1); out.givenGold = gold; festivalState = fs0;
    _lantLast = ''; at(26, 22.4); tick(); /* S2348: 22:24, the hour and not only its first minute */ out.at22 = !!LANTERN; out.last = _lantLast === site.id + ':' + calDay(worldState.gameTimeAbsMinutes).n;
    at(27, 10); out.next = folk && feastGreeting(folk.def); out.next2 = folk && feastGreeting(folk.def);
    worldState.festivals['lanterns:' + site.id].sent = false; delete worldState.festivals['lanterns:' + site.id].thanked; out.nextMe = folk && feastGreeting(folk.def);
  } finally { festivalState = fs0; if (LANTERN) lanternOut(); worldState.gameTimeAbsMinutes = t0; worldState.gameTimeMinutes = m0; worldState.festivals = f0; nearSite = ns0; px = p0[0]; pz = p0[1]; gold = g0; Object.assign(st, { p: keep.p, flags: keep.flags }); }
  out.L = LANTERN_LINES.gatelander; out.LOG = LANTERN_LOG;
  return out;
});
console.log(JSON.stringify(ln).slice(0, 2500));
check('the lanternmaker stands on the square on the Night from 18:00 to 22:00 (not at 17:00 or 22:00), and greets with her own line', !ln.at17 && ln.at19 === 'Lanternmaker' && !ln.at22 && (ln.people !== 'gatelander' || ln.greet === ln.L.greet) && ln.labels.includes('A lantern.'), ln);
check('*For me* costs nothing and spends the year\'s lantern; a lantern sent costs two gold with her answer; short of two, nothing; a town that names you gives it', ln.meGold === 10 && ln.meRec.sent === false && !ln.labelsAfter.includes('A lantern.') && ln.sentGold === 8 && ln.rec.sent === true && ln.rec.act === 28 && /will know their own|They’ll know their own/.test(ln.sent) && /two gold/.test(ln.poor) && !ln.poorRec && ln.givenGold === 1, ln);
check('the last lantern\'s line at 22:00 on the square; the next day a Gatelander says you stood with them, once, and not for *For me*', ln.last && ln.next === ln.LOG.after && ln.next2 !== ln.LOG.after && ln.nextMe !== ln.LOG.after, ln);
// 13. the Blaze (Session 2326): a log on the square's fire from 17:00 to first light, once a town a year; the reeve's line; a Markman's
// word that night, once, past midnight too; first light's line on the square
const bz = await page.evaluate(() => {
  const site = ladderSites().find(s => isleAt(s.x, s.z) === 'mark'), st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags }));
  const t0 = worldState.gameTimeAbsMinutes, m0 = worldState.gameTimeMinutes, f0 = worldState.festivals, ns0 = nearSite, p0 = [px, pz];
  const bf = FESTIVALS.find(f => f.key === 'blaze');
  const at = (dd, h) => { worldState.gameTimeAbsMinutes = (((28 - CAL.startYear) * CAL.months + bf.month - CAL.startMonth) * CAL.monthLen + bf.dom - 1 + dd) * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  const man = () => ({ _siteId: site.id, people: 'markman', greeting: ['-'] }), reeve = { _siteId: site.id, people: 'markman', _lord: true, greeting: ['-'] };
  st.p = 70; st.flags = {}; worldState.festivals = {}; nearSite = () => ({ site }); px = site.x + 1; pz = site.z + 1;
  const out = { mark: isleAt(site.x, site.z) };
  try {
    at(0, 15); out.p15 = festActPrompt(); out.reeve = feastGreeting(reeve);
    at(0, 20); out.p20 = festActPrompt(); px = site.x + 8; out.far = festActPrompt(); px = site.x + 1;
    at(1, 2); out.p02 = festActPrompt(); out.did = festActInteract(); out.rec = JSON.parse(JSON.stringify(worldState.festivals['blaze:' + site.id] || null));
    out.again = festActPrompt(); out.thanks = feastGreeting(man()); out.thanks2 = feastGreeting(man());
    at(1, 7); out.p07 = festActPrompt();
    worldState.festivals = {}; at(0, 21); festActInteract(); out.eve = feastGreeting(man()); at(1, 1); out.eveAfter = feastGreeting(man());
    _blazeLast = ''; at(1, 6.4); tickBlazeLight(); /* S2348: 6:24 */ out.light = _blazeLast; tickBlazeLight(); out.light2 = _blazeLast;
  } finally { worldState.gameTimeAbsMinutes = t0; worldState.gameTimeMinutes = m0; worldState.festivals = f0; nearSite = ns0; px = p0[0]; pz = p0[1]; Object.assign(st, { p: keep.p, flags: keep.flags }); }
  out.T = FEST_ACTS.blaze.thanks; out.R = FEST_LORD_LINE.blaze.line; out.ev = bf.dom;
  return out;
});
console.log(JSON.stringify(bz).slice(0, 2000));
check('the Blaze: a log on the square\'s fire from 17:00 to first light (not at 15:00 or 7:00, not 8 m off), the night\'s act on the evening\'s year, once', bz.mark === 'mark' && bz.p15 === null && /put a log/.test(bz.p20) && bz.far === null && /put a log/.test(bz.p02) && bz.did && bz.rec && bz.rec.act === 28 && bz.again === null && bz.p07 === null, bz);
check('the reeve\'s Blaze line; a Markman\'s word that night once, before midnight or after, and not again', bz.reeve === bz.R && bz.thanks === bz.T && bz.thanks2 !== bz.T && bz.eve === bz.T && bz.eveAfter !== bz.T, bz);
check('first light on the square after the Blaze: the fire let die, once', bz.light && bz.light === bz.light2 && bz.light.startsWith(''), bz);
// 14. the alehall on the Blaze and First Snow (Session 2330): the keeper's day line till 17:00; on First Snow's night no places, past
// midnight too; a place already taken holds
const ah = await page.evaluate(() => {
  const site = ladderSites().find(s => isleAt(s.x, s.z) === 'mark'), st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags }));
  const t0 = worldState.gameTimeAbsMinutes, m0 = worldState.gameTimeMinutes, r0 = worldState.rented, fs0 = worldState.firstSnow;
  const bf = FESTIVALS.find(f => f.key === 'blaze'), sf = FESTIVALS.find(f => f.key === 'firstsnow');
  const at = (f, dd, h) => { worldState.gameTimeAbsMinutes = (((28 - CAL.startYear) * CAL.months + f.month - CAL.startMonth) * CAL.monthLen + f.dom - 1 + dd) * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  const keeper = { _siteId: site.id, people: 'markman', _alehall: 1, greeting: ['-'] }, plain = { _siteId: site.id, people: 'markman', greeting: ['-'] };
  const house = { id: 'g_' + site.id + '_99', type: 'inn', kit: { alehall: true }, siteId: site.id, siteKind: site.kind, name: 'The Hall' };
  const bed = () => { const T = innTopics(house, 'markman').find(t => t.label === 'A bed for the night?'); return { r: T.response, f: T.follow.map(x => x.label) }; };
  st.p = 70; st.flags = {}; worldState.rented = null; worldState.firstSnow = {};
  const out = {};
  try {
    at(bf, 0, 10); out.blaze10 = feastGreeting(keeper); out.blazePlain = feastGreeting(plain);
    at(bf, 0, 19); out.blaze19 = feastGreeting(keeper);
    at(bf, -1, 10); out.dayBefore = feastGreeting(keeper);
    at(sf, 0, 15); out.snow15 = feastGreeting(keeper); out.bed15 = bed();
    at(sf, 0, 20); out.snow20 = feastGreeting(keeper); out.bed20 = bed();
    at(sf, 1, 3); out.snow03 = feastGreeting(keeper); out.bed03 = bed();
    at(sf, 1, 7); out.snow07 = feastGreeting(keeper); out.bed07 = bed();
    at(sf, 0, 20); worldState.rented = { id: house.id, room: 0, bench: 1, until: worldState.gameTimeAbsMinutes + 600 }; out.mine = bed();
  } finally { worldState.gameTimeAbsMinutes = t0; worldState.gameTimeMinutes = m0; worldState.rented = r0; worldState.firstSnow = fs0; Object.assign(st, { p: keep.p, flags: keep.flags }); }
  out.L = ALEHALL_FEST;
  return out;
});
console.log(JSON.stringify(ah).slice(0, 2000));
check('the alehall on the Blaze: *Hearth’s out…* from its keeper till 17:00, not after, not from another Markman, not the day before', ah.blaze10 === ah.L.blazeDay && ah.blazePlain !== ah.L.blazeDay && ah.blaze19 !== ah.L.blazeDay && ah.dayBefore !== ah.L.blazeDay, ah);
check('the alehall on First Snow: from 18:00 to first light *No places tonight…*, and the bed lets no place; at 15:00 and 7:00 the bench is let as ever; a place taken holds', ah.snow15 !== ah.L.firstSnow && ah.bed15.f.length === 2 && ah.snow20 === ah.L.firstSnow && ah.bed20.r === ah.L.firstSnow && ah.bed20.f.length === 0 && ah.snow03 === ah.L.firstSnow && ah.bed03.f.length === 0 && ah.snow07 !== ah.L.firstSnow && ah.bed07.f.length === 2 && ah.mine.r === ah.L.firstSnowMine && ah.mine.f.length === 0, ah);
// 15. First Snow sat out (Session 2338): from 18:00 on the square, E is the Wait to first light; the log at 6:00, once a winter; the
// next day a Markman of the town says so, once, and a Gatelander does not
const sn = await page.evaluate(async () => {
  const site = ladderSites().find(s => isleAt(s.x, s.z) === 'mark'), st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags }));
  const t0 = worldState.gameTimeAbsMinutes, m0 = worldState.gameTimeMinutes, f0 = worldState.festivals, fs0 = worldState.firstSnow, ns0 = nearSite, p0 = [px, pz], sm = window.showMsg;
  const sf = FESTIVALS.find(f => f.key === 'firstsnow'), msgs = [];
  const at = (dd, h) => { worldState.gameTimeAbsMinutes = (((28 - CAL.startYear) * CAL.months + sf.month - CAL.startMonth) * CAL.monthLen + sf.dom - 1 + dd) * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  const man = () => ({ _siteId: site.id, people: 'markman', greeting: ['-'] }), gl = () => ({ _siteId: site.id, people: 'gatelander', greeting: ['-'] });
  st.p = 70; st.flags = {}; worldState.festivals = {}; worldState.firstSnow = {}; nearSite = () => ({ site }); px = site.x + 1; pz = site.z + 1;
  const out = {};
  try { window.showMsg = m => msgs.push(m);
    at(0, 17); out.p17 = festActPrompt();
    at(0, 20); out.p20 = festActPrompt(); px = site.x + 8; out.far = festActPrompt(); px = site.x + 1;
    const a0 = worldState.gameTimeAbsMinutes; out.did = festActInteract(); await new Promise(r => setTimeout(r, 900));
    out.hour = hourNow(); out.mins = worldState.gameTimeAbsMinutes - a0; out.log = msgs[msgs.length - 1]; out.rec = JSON.parse(JSON.stringify(worldState.festivals['firstsnow:' + site.id] || null));
    at(0, 22); out.again = festActPrompt();
    at(1, 10); out.gl = feastGreeting(gl()); out.next = feastGreeting(man()); out.next2 = feastGreeting(man());
  } finally { window.showMsg = sm; worldState.gameTimeAbsMinutes = t0; worldState.gameTimeMinutes = m0; worldState.festivals = f0; worldState.firstSnow = fs0; nearSite = ns0; px = p0[0]; pz = p0[1]; Object.assign(st, { p: keep.p, flags: keep.flags }); }
  out.A = FEST_ACTS.firstsnow;
  return out;
});
console.log(JSON.stringify(sn).slice(0, 2000));
check('First Snow: from 18:00 on the square (not at 17:00, not 8 m off) E sits you up till first light: 10 hours pass, the log at 6:00, the winter\'s act on the year', sn.p17 === null && sn.p20 === sn.A.prompt && sn.far === null && sn.did && Math.abs(sn.hour - 6) < .05 && Math.abs(sn.mins - 600) < 3 && sn.log === sn.A.log && sn.rec && sn.rec.act === 28 && sn.rec.sat && sn.again === null, sn);
check('the next day a Markman of the town says you sat it out, once; a Gatelander does not', sn.next === sn.A.after && sn.next2 !== sn.A.after && sn.gl !== sn.A.after, sn);
// 16. the Strait Fair's wager on the boats (Session 2339): a Markman at the water from 5:00 till noon; 2 gold on one of three from 5:00
// to 7:00; from 8:00 the race told, a win paying 6 once; the race seeded by site and year; the ring's try untouched; none while occupied
const wg = await page.evaluate(() => {
  const marks = ladderSites().filter(s => isleAt(s.x, s.z) === 'mark'), site = marks.find(s => s.kind === 'port') || marks[0], st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags }));
  const t0 = worldState.gameTimeAbsMinutes, m0 = worldState.gameTimeMinutes, f0 = worldState.festivals, ns0 = nearSite, p0 = [px, pz], g0 = gold;
  const sf = FESTIVALS.find(f => f.key === 'straitfair');
  const at = (yr, h) => { worldState.gameTimeAbsMinutes = (((yr - CAL.startYear) * CAL.months + sf.month - CAL.startMonth) * CAL.monthLen + sf.dom - 1) * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  st.p = 70; st.flags = {}; worldState.festivals = {}; nearSite = () => ({ site }); px = site.x + 1; pz = site.z + 1;
  const labels = () => WAGER ? WAGER.npc.def ? WAGER.npc.def.topics.map(t => t.label) : null : null;
  const out = { kind: site.kind };
  try {
    at(28, 4); tickWager(); out.at4 = !!WAGER;
    at(28, 5); tickWager(); out.at5 = !!WAGER; const d = WAGER && wagerDef(site, 28, festivalHere(site.id)); out.who = d && [d.people, d.role]; out.fromPad = d && +(Math.hypot(d.x - site.x, d.z - site.z) - site.pad).toFixed(1);
    const T = d.topics.find(t => t.label === 'A bet on the boats.'); out.follow = T && T.follow && T.follow.map(f => f.label); out.ask = T && T.response;
    const win = wagerWinner(site, 28); out.same = win === wagerWinner(site, 28); out.years = [28, 29, 30, 31, 32, 33].map(y => wagerWinner(site, y));
    gold = 1; out.poor = wagerPlace(site, win); out.poorBet = !!wagerBet(site);
    gold = 10; out.placed = wagerPlace(site, win); out.gold1 = gold; out.again = wagerPlace(site, (win + 1) % 3); out.gold2 = gold;
    at(28, 6); out.early = wagerHear(site); out.topics6 = d.topics.map(t => t.label);
    at(28, 9); out.won = wagerHear(site); out.gold3 = gold; out.won2 = wagerHear(site); out.gold4 = gold;
    out.ring = (fairRingOpenFor(site) || {}).ok;
    at(29, 6); gold = 10; out.placed29 = wagerPlace(site, (wagerWinner(site, 29) + 1) % 3); at(29, 9); out.lost = wagerHear(site); out.gold5 = gold;
    at(30, 7); out.at7 = d.topics.map(t => t.label);
    at(30, 12); tickWager(); out.at12 = !!WAGER;
    at(30, 6); st.flags = { occupied: true }; tickWager(); out.occupied = !!WAGER; st.flags = {};
  } finally { if (WAGER) wagerOut(); gold = g0; worldState.gameTimeAbsMinutes = t0; worldState.gameTimeMinutes = m0; worldState.festivals = f0; nearSite = ns0; px = p0[0]; pz = p0[1]; Object.assign(st, { p: keep.p, flags: keep.flags }); }
  out.L = WAGER_LINES;
  return out;
});
console.log(JSON.stringify(wg).slice(0, 2000));
check(`the wager: a Markman at the water (${wg.kind}, ${wg.fromPad} m past the pad) from 5:00, not at 4:00, gone at noon and in an occupied town; three boats asked from 5:00, none offered at 7:00 without a bet`, !wg.at4 && wg.at5 && wg.who[0] === 'markman' && !wg.at12 && !wg.occupied && wg.ask === 'Which boat?' && wg.follow.length === 3 && !wg.at7.includes('A bet on the boats.'), wg);
check('2 gold on a boat (short of two, nothing), once; before 8:00 the same word; from 8:00 a win pays 6 once, a loss tells third; the race the same for a site and year, not every year alike; the ring\'s try untouched', /two gold/.test(wg.poor) && !wg.poorBet && wg.placed === wg.L.placed && wg.gold1 === 8 && wg.again === wg.L.placed && wg.gold2 === 8 && wg.early === wg.L.placed && wg.won === wg.L.won && wg.gold3 === 14 && wg.won2 === wg.L.won && wg.gold4 === 14 && wg.lost === wg.L.lost && wg.gold5 === 8 && wg.same && new Set(wg.years).size > 1 && wg.ring, wg);
// 17. the Caravan's first bale (Session 2340): the caravan-master on the square from 6:00 to 18:00, not while occupied; three topics; a
// pinch at 2 gold once a year, the twist of saffron and the log; the Factor's day line; the next day an Aurennais says so, once
const cv = await page.evaluate(() => {
  let site = null; for (let j = 0; j < GRID && !site; j++) for (let i = 0; i < GRID && !site; i++) { if (nationKeyOf(i, j) !== 'aurenne') continue; const c = getCell(i, j); if (c.type === 'sea') continue; site = c.sites.find(s => s.kind === 'town' || s.kind === 'city') || null; }
  const st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags }));
  const t0 = worldState.gameTimeAbsMinutes, m0 = worldState.gameTimeMinutes, f0 = worldState.festivals, ns0 = nearSite, p0 = [px, pz], g0 = gold, msgs = [], sm = window.showMsg;
  const cf = FESTIVALS.find(f => f.key === 'caravan');
  const at = (dd, h) => { worldState.gameTimeAbsMinutes = (((28 - CAL.startYear) * CAL.months + cf.month - CAL.startMonth) * CAL.monthLen + cf.dom - 1 + dd) * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  const au = () => ({ _siteId: site.id, people: 'aurennais', greeting: ['-'] }), lord = { _siteId: site.id, people: 'aurennais', _lord: true, greeting: ['-'] };
  st.p = 70; st.flags = {}; worldState.festivals = {}; nearSite = () => ({ site }); px = site.x + 1; pz = site.z + 1;
  const out = { isle: isleAt(site.x, site.z) }; const bag0 = BAG.length;
  try { window.showMsg = m => msgs.push(m);
    at(0, 5); tickCaravan(); out.at5 = !!CARAVAN;
    at(0, 7); tickCaravan(); out.at7 = CARAVAN && [CARAVAN.npc.def ? CARAVAN.npc.def.role : null, CARAVAN.npc.def ? CARAVAN.npc.def.people : null];
    const d = caravanDef(site, 28); out.labels = d.topics.map(t => t.label); out.name2 = caravanDef(site, 28).name === d.name;
    out.lord = feastGreeting(lord);
    gold = 1; out.poor = caravanPinch(site); out.poorDone = festActDone('caravan', site);
    gold = 10; out.pinch = caravanPinch(site); out.gold = gold; out.item = BAG.length > bag0 ? BAG[BAG.length - 1].name : null; out.log = msgs[msgs.length - 1];
    out.labels2 = d.topics.map(t => t.label);
    at(1, 10); out.next = feastGreeting(au()); out.next2 = feastGreeting(au());
    at(0, 18); tickCaravan(); out.at18 = !!CARAVAN;
    at(0, 9); st.flags = { occupied: true }; tickCaravan(); out.occupied = !!CARAVAN; st.flags = {};
  } finally { window.showMsg = sm; if (CARAVAN) caravanOut(); while (BAG.length > bag0) BAG.pop(); gold = g0; worldState.gameTimeAbsMinutes = t0; worldState.gameTimeMinutes = m0; worldState.festivals = f0; nearSite = ns0; px = p0[0]; pz = p0[1]; Object.assign(st, { p: keep.p, flags: keep.flags }); }
  out.L = CARAVAN_LINES; out.LL = FEST_LORD_LINE.caravan.line;
  return out;
});
console.log(JSON.stringify(cv).slice(0, 2000));
check(`the Caravan: the caravan-master (${cv.at7}) on the square from 6:00, not at 5:00 or 18:00 or while occupied, the same name for a site and year; his three topics; the Factor's day line`, cv.isle === 'aurenne' && !cv.at5 && cv.at7 && !cv.at18 && !cv.occupied && cv.name2 && JSON.stringify(cv.labels) === JSON.stringify(['How was the road?', 'Why the same day everywhere?', 'A pinch of saffron', 'Farewell.']) && cv.lord === cv.LL, cv);
check('a pinch at 2 gold (short of two, nothing): the twist of saffron, the log, offered once a year; the next day an Aurennais says so, once', /two gold/.test(cv.poor) && !cv.poorDone && cv.pinch === cv.L.pinch && cv.gold === 8 && cv.item === 'A twist of saffron' && cv.log === cv.L.log && !cv.labels2.includes('A pinch of saffron') && cv.next === cv.L.after && cv.next2 !== cv.L.after, cv);
// 18. the Commencement's subscription (Session 2341): the bursar on the square from 9:00 to 12:00; 2 gold entered three ways, once a year;
// the roll's line at noon on the square, once, for the way entered; the next day an Aurennais says so, once
const bs = await page.evaluate(() => {
  let site = null; for (let j = 0; j < GRID && !site; j++) for (let i = 0; i < GRID && !site; i++) { if (nationKeyOf(i, j) !== 'aurenne') continue; const c = getCell(i, j); if (c.type === 'sea') continue; site = c.sites.find(s => s.kind === 'town' || s.kind === 'city') || null; }
  const st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags }));
  const t0 = worldState.gameTimeAbsMinutes, m0 = worldState.gameTimeMinutes, f0 = worldState.festivals, ns0 = nearSite, p0 = [px, pz], g0 = gold, n0 = playerName, msgs = [], sm = window.showMsg;
  const cf = FESTIVALS.find(f => f.key === 'commencement');
  const at = (yr, dd, h, mm) => { worldState.gameTimeAbsMinutes = (((yr - CAL.startYear) * CAL.months + cf.month - CAL.startMonth) * CAL.monthLen + cf.dom - 1 + dd) * 1440 + h * 60 + (mm || 0); worldState.gameTimeMinutes = h * 60 + (mm || 0); };
  const au = () => ({ _siteId: site.id, people: 'aurennais', greeting: ['-'] });
  st.p = 70; st.flags = {}; worldState.festivals = {}; nearSite = () => ({ site }); px = site.x + 1; pz = site.z + 1; playerName = 'Ysolde';
  const out = { gp: peopleOfSite(site) };
  try { window.showMsg = m => msgs.push(m);
    at(28, 0, 8); tickBursar(); out.at8 = !!BURSAR;
    at(28, 0, 10); tickBursar(); out.at10 = BURSAR && BURSAR.npc.def ? BURSAR.npc.def.role : !!BURSAR; const d = bursarDef(site, 28);
    const T = d.topics.find(t => t.label === 'A subscription'); out.ask = T && T.response; out.follow = T && T.follow.map(f => f.label);
    gold = 1; out.poor = bursarSubscribe(site, 0, out.gp); out.poorDone = festActDone('commencement', site);
    gold = 10; out.named = bursarSubscribe(site, 0, out.gp); out.gold = gold; out.log = msgs[msgs.length - 1]; out.after = d.topics.map(t => t.label);
    at(28, 0, 12, 10); _bursarLast = ''; msgs.length = 0; tickBursar(); tickBursar(); out.noon = msgs.slice(); out.at12 = !!BURSAR;
    at(28, 1, 10); out.next = feastGreeting(au()); out.next2 = feastGreeting(au());
    worldState.festivals = {}; at(29, 0, 10); gold = 10; out.off = bursarSubscribe(site, 2, out.gp); at(29, 0, 12, 40); _bursarLast = ''; msgs.length = 0; tickBursar(); out.late = msgs.slice(); at(29, 0, 12, 5); px = site.x + 40; tickBursar(); out.far = msgs.slice(); px = site.x + 1; tickBursar(); out.offNoon = msgs.slice();
    at(29, 0, 10); st.flags = { occupied: true }; tickBursar(); out.occupied = !!BURSAR; st.flags = {};
  } finally { window.showMsg = sm; if (BURSAR) bursarOut(); playerName = n0; gold = g0; worldState.gameTimeAbsMinutes = t0; worldState.gameTimeMinutes = m0; worldState.festivals = f0; nearSite = ns0; px = p0[0]; pz = p0[1]; Object.assign(st, { p: keep.p, flags: keep.flags }); }
  out.L = BURSAR_LINES[out.gp] || BURSAR_LINES.aurennais; out.LOG = BURSAR_LOG;
  return out;
});
console.log(JSON.stringify(bs).slice(0, 2000));
check(`the Commencement: the bursar (${bs.at10}, ${bs.gp}) on the square from 9:00, not at 8:00 or 12:00 or while occupied; *How shall I enter it?* three ways; 2 gold (short of two, nothing), the answer with your name, the log, once a year`, !bs.at8 && bs.at10 && !bs.at12 && !bs.occupied && bs.ask === 'How shall I enter it?' && bs.follow.length === 3 && /two gold/.test(bs.poor) && !bs.poorDone && bs.named === bs.L.answers[0].replace('{player}', 'Ysolde') && bs.gold === 8 && bs.log === bs.LOG.paid && !bs.after.includes('A subscription'), bs);
check('at noon on the square the roll is read for the way you entered, once (not at 12:40, not 40 m off); the next day an Aurennais says so, once', bs.noon.length === 1 && bs.noon[0] === bs.LOG.noon[0] && bs.next === bs.LOG.after && bs.next2 !== bs.LOG.after && bs.off === bs.L.answers[2] && bs.late.length === 0 && bs.far.length === 0 && bs.offNoon.length === 1 && bs.offNoon[0] === bs.LOG.noon[2], bs);
// 19. the Commencement's reading at ten and the lords' Commencement and Lamps lines (Session 2342)
const cr = await page.evaluate(() => {
  let site = null; for (let j = 0; j < GRID && !site; j++) for (let i = 0; i < GRID && !site; i++) { if (nationKeyOf(i, j) !== 'aurenne') continue; const c = getCell(i, j); if (c.type === 'sea') continue; site = c.sites.find(s => s.kind === 'town') || null; }
  const st = TS(site), keep = JSON.parse(JSON.stringify({ p: st.p, flags: st.flags }));
  const t0 = worldState.gameTimeAbsMinutes, m0 = worldState.gameTimeMinutes, ns0 = nearSite, p0 = [px, pz], msgs = [], sm = window.showMsg;
  const at = (key, h, mm) => { const f = FESTIVALS.find(q => q.key === key); worldState.gameTimeAbsMinutes = (((28 - CAL.startYear) * CAL.months + f.month - CAL.startMonth) * CAL.monthLen + f.dom - 1) * 1440 + h * 60 + (mm || 0); worldState.gameTimeMinutes = h * 60 + (mm || 0); };
  const lord = { _siteId: site.id, people: 'aurennais', _lord: true, greeting: ['-'] };
  st.p = 70; st.flags = {}; nearSite = () => ({ site }); px = site.x + 1; pz = site.z + 1;
  const out = {};
  try { window.showMsg = m => msgs.push(m);
    at('commencement', 9); out.lordC = feastGreeting(lord); at('lamps', 9); out.lordL = feastGreeting(lord);
    at('commencement', 10, 5); _commLast = ''; tickBursar(); tickBursar(); out.ten = msgs.filter(m => m.startsWith('At ten')); out.want = commReadLine(site, 28);
    msgs.length = 0; _commLast = ''; at('commencement', 10, 40); tickBursar(); out.late = msgs.filter(m => m.startsWith('At ten')).length;
    at('commencement', 10, 5); px = site.x + 40; tickBursar(); out.far = msgs.filter(m => m.startsWith('At ten')).length; px = site.x + 1;
    const n = [0, 0, 0, 0]; for (let y = 1; y <= 300; y++) n[commAdmitted(site, y).length]++; out.counts = n; out.same = JSON.stringify(commAdmitted(site, 31)) === JSON.stringify(commAdmitted(site, 31));
    let one = 0; for (let y = 1; y <= 40 && !one; y++) if (commAdmitted(site, y).length === 1) one = y; out.oneLine = one ? commReadLine(site, one) : null;
  } finally { window.showMsg = sm; worldState.gameTimeAbsMinutes = t0; worldState.gameTimeMinutes = m0; nearSite = ns0; px = p0[0]; pz = p0[1]; Object.assign(st, { p: keep.p, flags: keep.flags }); }
  out.LC = FEST_LORD_LINE.commencement.line; out.LL = FEST_LORD_LINE.lamps.line;
  return out;
});
console.log(JSON.stringify(cr).slice(0, 2000));
check(`the Commencement's reading at ten on the square, once (not at 10:40, not 40 m off); admitted none, one or two over 300 years ${JSON.stringify(cr.counts)}, the same for a year; the Factor's or Prior's lines on the Commencement and the Lamps`, cr.ten.length === 1 && cr.ten[0] === cr.want && cr.late === 0 && cr.far === 0 && cr.counts[0] > 110 && cr.counts[1] > 70 && cr.counts[2] > 25 && cr.counts[3] === 0 && cr.same && /stands, and the square applauds until (she|he) sits again\.$/.test(cr.oneLine || '') && cr.lordC === cr.LC && cr.lordL === cr.LL, cr);
// 19. the Lamps on the Water (Session 2347): the lampseller from 17:00 to 22:00, at the quay's foot in a port, on the square inland, not
// while occupied; *A lamp* at 2 gold once a year, four answers, the fourth only with a ship; the ledger from 18:00 to 18:30 near her, once;
// none, one or two hulls struck in six, three and one in ten; the next day an Aurennais says so, once
const lm = await page.evaluate(() => {
  const pick = k => { for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) { if (nationKeyOf(i, j) !== 'aurenne') continue; const c = getCell(i, j); if (c.type === 'sea') continue; const s = c.sites.find(k); if (s) return s; } return null; };
  const port = pick(s => s.kind === 'port' && lampsPort(s)), inl = pick(s => (s.kind === 'town' || s.kind === 'city') && !lampsPort(s));
  const t0 = worldState.gameTimeAbsMinutes, m0 = worldState.gameTimeMinutes, f0 = worldState.festivals, ns0 = nearSite, p0 = [px, pz], g0 = gold, sh0 = worldState.ship, msgs = [], sm = window.showMsg;
  const lf = FESTIVALS.find(f => f.key === 'lamps');
  const at = (dd, h, mm) => { worldState.gameTimeAbsMinutes = (((28 - CAL.startYear) * CAL.months + lf.month - CAL.startMonth) * CAL.monthLen + lf.dom - 1 + dd) * 1440 + h * 60 + (mm || 0); worldState.gameTimeMinutes = h * 60 + (mm || 0); };
  const au = s => ({ _siteId: s.id, people: 'aurennais', greeting: ['-'] });
  const out = { port: port && port.id, inl: inl && inl.id }; const keeps = [];
  try { window.showMsg = m => msgs.push(m);
    for (const site of [port, inl]) { if (!site) continue; const st = TS(site); keeps.push([st, JSON.parse(JSON.stringify({ p: st.p, flags: st.flags }))]); st.p = 70; st.flags = {}; }
    const site = port || inl; worldState.festivals = {}; nearSite = () => ({ site }); px = site.x + 1; pz = site.z + 1; worldState.ship = null;
    at(0, 16); tickLamps(); out.at16 = !!LAMPS;
    at(0, 17); tickLamps(); out.at17 = LAMPS && LAMPS.npc.def ? LAMPS.npc.def.role : !!LAMPS;
    const d = lampDef(site, 28), spot = lampSpot(site); out.fromMid = +Math.hypot(spot.x - site.x, spot.z - site.z).toFixed(1); out.name2 = lampDef(site, 28).name === d.name; out.gp = d.people; out.greet = d.greeting[0];
    const T = () => d.topics.find(t => t.label === 'A lamp'); out.ask = T() && T().response; out.follow = T() && T().follow.map(f => f.label);
    worldState.ship = { name: 'Test' }; out.followShip = T() && T().follow.length; worldState.ship = null;
    gold = 1; out.poor = lampSet(site, 0, d.people); out.poorDone = festActDone('lamps', site);
    gold = 10; msgs.length = 0; out.set = lampSet(site, 1, d.people); out.gold = gold; out.log = msgs[0]; out.after = d.topics.map(t => t.label);
    at(0, 18, 10); px = spot.x; pz = spot.z; _lampLast = ''; msgs.length = 0; tickLamps(); tickLamps(); out.dusk = msgs.slice();
    at(0, 18, 40); _lampLast = ''; msgs.length = 0; tickLamps(); out.late = msgs.slice();
    at(0, 18, 5); px = spot.x + 40; _lampLast = ''; tickLamps(); out.far = msgs.slice(); px = site.x + 1; pz = site.z + 1;
    at(1, 10); out.next = feastGreeting(au(site)); out.next2 = feastGreeting(au(site));
    at(0, 22); tickLamps(); out.at22 = !!LAMPS;
    at(0, 19); TS(site).flags = { occupied: true }; tickLamps(); out.occupied = !!LAMPS; TS(site).flags = {};
    if (inl) { at(0, 18, 10); nearSite = () => ({ site: inl }); const sp = lampSpot(inl); px = sp.x; pz = sp.z; _lampLast = ''; msgs.length = 0; tickLamps(); out.inland = msgs.slice(); out.inFromMid = +Math.hypot(sp.x - inl.x, sp.z - inl.z).toFixed(1); }
    const counts = [0, 0, 0]; let same = true; for (let y = 1; y <= 300; y++) for (const s of [port, inl].filter(Boolean)) { const k = lampsStruck(s, y); counts[k.length]++; if (JSON.stringify(k) !== JSON.stringify(lampsStruck(s, y)) || new Set(k).size !== k.length) same = false; }
    out.counts = counts; out.same = same; let y2 = 1; while (y2 < 300 && lampsStruck(site, y2).length !== 2) y2++; out.two = lampsLedger(site, y2);
  } finally { window.showMsg = sm; if (LAMPS) lampsOut(); gold = g0; worldState.ship = sh0; worldState.gameTimeAbsMinutes = t0; worldState.gameTimeMinutes = m0; worldState.festivals = f0; nearSite = ns0; px = p0[0]; pz = p0[1]; for (const [st, k] of keeps) Object.assign(st, { p: k.p, flags: k.flags }); }
  out.L = LAMPW_LINES; out.LOG = { sea: LAMPW_LOG.sea, after: LAMPW_LOG.after, read: LAMPW_LOG.read };
  return out;
});
console.log(JSON.stringify(lm).slice(0, 3000));
check(`the Lamps: the lampseller (${lm.at17}, ${lm.gp}) at ${lm.port ? 'the quay\'s foot of ' + lm.port : lm.inl} (${lm.fromMid} m off the middle) from 17:00, not at 16:00 or 22:00 or while occupied, the same name for a site and year, greeting in her people's voice`, lm.port && !lm.at16 && lm.at17 === 'Lampseller' && !lm.at22 && !lm.occupied && lm.name2 && lm.greet === (lm.L[lm.gp] || lm.L.aurennais).greet, lm);
check(`*A lamp* asks *Who is it for?* with three answers, four with a ship; 2 gold (short of two, nothing), the log on the water, once a year`, lm.ask === 'Who is it for?' && lm.follow.length === 3 && lm.followShip === 4 && /two gold/.test(lm.poor) && !lm.poorDone && lm.gold === 8 && lm.log === lm.LOG.sea && !lm.after.includes('A lamp') && (lm.gp !== 'aurennais' || lm.set === lm.L.aurennais.answers[1]), lm);
check(`the ledger at 18:10 by the quay, once (not at 18:40, not 40 m off); inland the fountain's line; struck none, one, two over 300 years ${JSON.stringify(lm.counts)}, the same for a year; the next day an Aurennais says so, once`, lm.dusk.length === 1 && lm.dusk[0].startsWith(lm.LOG.read) && !lm.late.length && !lm.far.length && (!lm.inl || (lm.inland.length === 1 && /reads from the ledger the names of the town’s people at sea/.test(lm.inland[0]))) && lm.counts[0] > lm.counts[1] && lm.counts[1] > lm.counts[2] && lm.counts[2] > 0 && lm.same && /two more are read, the .+ and the .+, and struck through/.test(lm.two) && lm.next === lm.LOG.after && lm.next2 !== lm.LOG.after, lm);
// 20. the last lines of drafts II and III (Session 2365): on the Caravan an Aurennais shopkeeper's line; in an occupied town the
// Caravan's Aurennais and the Strait Fair's Markman say why there is none; abroad, a Markman or an Aurennais on a home festival, once a town a day
const fl = await page.evaluate(() => {
  const townOf = nat => { for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) { if (nationKeyOf(i, j) !== nat) continue; const c = getCell(i, j); if (c.type === 'sea') continue; const s = c.sites.find(s => s.kind === 'town' || s.kind === 'city'); if (s) return s; } return null; };
  const au = townOf('aurenne'), mk = townOf('mark'), dm = siteAnywhere('dunmore');
  const F = k => FESTIVALS.find(f => f.key === k);
  const at = (k, dd, h) => { const f = F(k); worldState.gameTimeAbsMinutes = (((28 - CAL.startYear) * CAL.months + f.month - CAL.startMonth) * CAL.monthLen + f.dom - 1 + dd) * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  const P = (site, people, o) => Object.assign({ _siteId: site.id, people, greeting: ['-'] }, o || {});
  const keep = [au, mk].map(s => { const st = TS(s); return [st, JSON.parse(JSON.stringify({ p: st.p, flags: st.flags }))]; });
  const t0 = worldState.gameTimeAbsMinutes, m0 = worldState.gameTimeMinutes, f0 = worldState.festivals;
  const out = { isles: [isleAt(au.x, au.z), isleAt(mk.x, mk.z), isleAt(dm.x, dm.z)] };
  try { keep.forEach(([st]) => { st.p = 70; st.flags = {}; }); worldState.festivals = {}; _festAbroad.clear();
    at('caravan', 0, 10);
    out.smith = feastGreeting(P(au, 'aurennais', { _houseId: 'h1', role: 'Smith' }));
    out.barber = feastGreeting(P(au, 'aurennais', { _houseId: 'h2', role: 'Barber' }));
    out.inn = feastGreeting(P(au, 'aurennais', { _houseId: 'h3', role: 'Innkeeper' }));
    out.road = feastGreeting(P(au, 'aurennais', { role: 'Merchant' }));
    out.folk = feastGreeting(P(au, 'aurennais'));
    out.glSmith = feastGreeting(P(au, 'gatelander', { _houseId: 'h4', role: 'Smith' }));
    TS(au).flags = { occupied: true };
    out.occAu = feastGreeting(P(au, 'aurennais')); out.occMk = feastGreeting(P(au, 'markman')); out.occSmith = feastGreeting(P(au, 'aurennais', { _houseId: 'h1', role: 'Smith' }));
    at('caravan', 1, 10); out.occNext = feastGreeting(P(au, 'aurennais'));
    TS(au).flags = {};
    at('straitfair', 0, 9); TS(mk).flags = { occupied: true };
    out.occFair = feastGreeting(P(mk, 'markman')); out.occFairGl = feastGreeting(P(mk, 'gatelander')); TS(mk).flags = {};
    out.fair = feastGreeting(P(mk, 'markman'));
    at('caravan', 0, 10); const A = P(dm, 'aurennais'), B = P(dm, 'aurennais');
    out.ab1 = feastGreeting(A); out.ab1b = feastGreeting(A); out.abB = feastGreeting(B); out.abMk = feastGreeting(P(mk, 'aurennais')); out.abGl = feastGreeting(P(dm, 'gatelander'));
    at('caravan', 1, 10); out.abNext = feastGreeting(A);
    at('blaze', 0, 11); out.blazeAu = feastGreeting(P(au, 'markman')); out.blazeHome = feastGreeting(P(mk, 'markman'));
    at('straitfair', 0, 9); out.fairDm = feastGreeting(P(dm, 'markman'));
    at('lamps', 0, 15); out.lampsMk = feastGreeting(P(mk, 'aurennais')); out.lampsDmMk = feastGreeting(P(dm, 'markman'));
    at('commencement', 0, 8); out.commDm = feastGreeting(P(dm, 'aurennais')); out.commHome = feastGreeting(P(au, 'aurennais'));
    at('greening', 0, 10); out.greenAu = feastGreeting(P(au, 'gatelander'));
  } finally { worldState.gameTimeAbsMinutes = t0; worldState.gameTimeMinutes = m0; worldState.festivals = f0; keep.forEach(([st, k]) => Object.assign(st, k)); }
  out.F = Object.fromEntries(['caravan', 'straitfair', 'blaze', 'lamps', 'commencement'].map(k => [k, { greet: F(k).greet, trader: F(k).trader, occ: F(k).occupied, abroad: F(k).abroad }]));
  return out;
});
console.log(JSON.stringify(fl).slice(0, 1500));
{ const C = fl.F.caravan;
check('the Caravan in an Aurennais town: a shopkeeper of Aurenne (the smith, the barber) says *Caravan day, Master…*; the innkeeper, a road merchant, the townsfolk and a Gatelander smith greet as the day', fl.isles.join() === 'aurenne,mark,gatelands' && /^Caravan day, Master/.test(C.trader) && fl.smith === C.trader && fl.barber === C.trader && fl.inn === C.greet.aurennais && fl.road === C.greet.aurennais && fl.folk === C.greet.aurennais && fl.glSmith === C.greet.gatelander, fl);
check('an occupied town: on the Caravan its Aurennais (the smith too) say *The caravan has gone round us…*, a Markman does not, nor the next day; on the Strait Fair its Markman says *No fair this year…*, a Gatelander does not, and freed it is the fair\'s', fl.occAu === C.occ.line && fl.occSmith === C.occ.line && /gone round us/.test(fl.occAu) && fl.occMk !== C.occ.line && fl.occNext !== C.occ.line && fl.occFair === fl.F.straitfair.occ.line && /^No fair this year/.test(fl.occFair) && fl.occFairGl !== fl.occFair && fl.fair === fl.F.straitfair.greet.markman, fl);
check('abroad: on the Caravan the first Aurennais met in Dunmore says the home line, and again; a second there does not, nor the next day; one in the Mark says it too; a Gatelander does not', fl.ab1 === C.abroad && fl.ab1b === C.abroad && fl.abB !== C.abroad && fl.abNext !== C.abroad && fl.abMk === C.abroad && fl.abGl !== C.abroad, fl);
check('abroad: a Markman in Aurenne on the Blaze and in Dunmore on the Strait Fair; an Aurennais in the Mark on the Lamps and in Dunmore on the Commencement; at home each says the day\'s own; a Markman says nothing of the Lamps, nor a Gatelander abroad of the Greening', fl.blazeAu === fl.F.blaze.abroad && fl.blazeHome === fl.F.blaze.greet.markman && fl.fairDm === fl.F.straitfair.abroad && fl.lampsMk === fl.F.lamps.abroad && fl.commDm === fl.F.commencement.abroad && fl.commHome === fl.F.commencement.greet.aurennais && fl.lampsDmMk == null && fl.greenAu == null, fl); }
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
