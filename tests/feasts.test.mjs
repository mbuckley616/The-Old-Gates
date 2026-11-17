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
check('the butts are shot on Riverfair from 10h, in a town keeping it full; not thin, not on another day', /from 10h to 14h/.test(bt.early) && /no shooting this year/.test(bt.thin) && /shot at Riverfair/.test(bt.otherDay), [bt.early, bt.thin, bt.otherDay]);
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
check('the ring is fought at the Strait Fair from 5h till noon, in a Markish town keeping it full; not in Dunmore, not in a thin year', fr.isle === 'mark' && /from 5h till noon/.test(fr.early) && /Strait Fair/.test(fr.dunmore) && /No ring this year/.test(fr.thin), fr);
check('three quarrels in turn, each a disarmed fighter, your sword on the rack', fr.ok && fr.seen.length === 3 && fr.seen.every(([nm, dis, w]) => nm && dis && w === null) && fr.seen.map(q => q[0]).join('|') === 'The first quarrel|The second quarrel|The third quarrel', fr.seen);
check('three yields win: the purse (40 + 20 a tier), the reeve\'s ring named for the town, Hand-to-hand 20 → 21, the sword back, one try a town a year', fr.ringNull && Object.values(fr.after).some(f => f.won && f.quarrels === 3) && fr.gold >= 40 && fr.gold % 20 === 0 && fr.ring.length === 1 && /^Reeve’s Iron Ring of /.test(fr.ring[0]) && fr.hand === 21 && fr.weapon === 'Test Sword' && /fought here this year/.test(fr.again), fr);
check('a fall in the second quarrel loses it: held at 1 health, nothing paid, the sword back', fr.lost.q2 === 1 && fr.lost.down && fr.lost.gone && fr.lost.f.won === false && fr.lost.f.quarrels === 1 && fr.lost.gold === fr.gold && fr.lost.hp === 1 && fr.lost.weapon === 'Test Sword', fr.lost);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
