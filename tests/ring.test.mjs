// The Mark's rings (arenas-build.md, the sheet's `ring` suite). Session 1639 laid the ladder's ground: the twelve bouts' table, the
// rings it is fought in, each bout's fighter (its tier, its moves by bout, its weapon rolled on its id, the shield of 10 or 11 and the
// champion's), and the two saves (`arena` the character's, `rings` the world's). The call, the purse, the forfeit and the wager join it
// as their sessions land.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { REN.render = () => {}; });

const r = await page.evaluate(() => {
  const out = {};
  out.rows = LADDER.map(b => b.tier + ':' + b.purse + ':' + (b.feint ? 'f' : '') + (b.heavy ? 'h' : '')).join(' ');
  const S = ladderSites(); out.sites = S.map(s => s.name + ' (' + s.kind + ')'); out.seat = S[0] && S[0].anchor;
  out.mark = S.every(s => { const [i, j] = cellOf(s.x, s.z); return nationKeyOf(i, j) === 'mark'; });
  // fighters, built away from you and from each other, then taken out again
  const F = {}; const x0 = px + 60, z0 = pz + 60;
  for (const b of [1, 4, 7, 10, 11, 12]) { const e = ladderFighter(b, x0 + b * 3, z0); F[b] = e; }
  const rolls = (e) => { let h = 0, f = 0; e._heavyLast = e._feintLast = false; for (let k = 0; k < 60; k++) { if (foeHeavyRoll(e)) h++; else if (foeFeintRoll(e)) f++; } return { h, f }; };
  out.moves = Object.fromEntries([1, 4, 7].map(b => [b, rolls(F[b])]));
  out.tier = Object.fromEntries([1, 4, 7, 12].map(b => [b, F[b].tier != null ? F[b].tier : null]));
  out.shield = Object.fromEntries([10, 11, 12].map(b => [b, !!F[b].shieldUp]));
  const plain4 = buildZoneEnemy(scene, [], x0, z0 + 9, 'Bandit Captain', null, { tier: 4 }); out.champ = { hp: F[12].maxHp, base: plain4.maxHp };
  if (plain4.mesh && plain4.mesh.parent) plain4.mesh.parent.remove(plain4.mesh);
  for (const e of Object.values(F)) if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh);
  out.w = []; for (let b = 1; b <= 12; b++) out.w.push(ladderWeapon(b));
  out.kind = foeWeaponKind(F[4]) === ladderWeapon(4) && foeWeaponKind(F[1]) === ladderWeapon(1);
  out.ids = [1, 12].map(b => F[b].id);
  // the save: rank and the ban are the character's, a dead name on a post the world's
  const A = arenaState(); A.rank = 5; A.banUntil = dayNow() + 28; const R = ringOf(S[0].id); R.dead.push('Test Fighter'); ringsState().next[5] = 1;
  const d = JSON.parse(ssStringify(_buildSavePayload())); const rows = ssSplitPayload(d);
  out.inC = !!rows.c.wS && !!rows.c.wS.arena && !(rows.c.wS && rows.c.wS.rings); out.inW = !!rows.w.wS && !!rows.w.wS.rings && !rows.w.wS.arena;
  delete worldState.arena; delete worldState.rings;
  _applyLoadData(JSON.parse(JSON.stringify(rows.c)), JSON.parse(JSON.stringify(rows.w)));
  out.back = { rank: arenaState().rank, ban: arenaState().banUntil - dayNow(), dead: ringOf(S[0].id).dead.slice(), id5: ladderFighterId(5) };
  return out; });
console.log(JSON.stringify(r));
check(`the ladder's twelve bouts, tier:purse:moves: ${r.rows}`,
  r.rows === '1:50: 1:60: 1:70: 2:120:f 2:140:f 2:160:f 3:250:fh 3:280:fh 3:310:fh 4:450:fh 4:500:fh 4:1000:fh', r.rows);
check(`its rings: ${r.sites.join(', ')}, Caer Slige first, every one Markish`, r.seat === 'caer_slige' && r.mark && r.sites.length >= 4, r);
check(`moves by bout, in 60 wind-ups: bout 1 heavy ${r.moves[1].h} feint ${r.moves[1].f}; bout 4 heavy ${r.moves[4].h} feint ${r.moves[4].f}; bout 7 heavy ${r.moves[7].h} feint ${r.moves[7].f}`,
  r.moves[1].h === 0 && r.moves[1].f === 0 && r.moves[4].h === 0 && r.moves[4].f > 0 && r.moves[7].h > 0 && r.moves[7].f > 0, r.moves);
check(`a shield on one of bouts 10 and 11 (${r.shield[10]}, ${r.shield[11]}) and on the champion (${r.shield[12]})`, r.shield[10] !== r.shield[11] && r.shield[12], r.shield);
check(`the champion's health ×1.6 over a tier-4 fighter: ${r.champ.hp} against ${r.champ.base}`, r.champ.hp === Math.round(r.champ.base * 1.6), r.champ);
check(`weapons by bout, never the bout before's: ${r.w.join(', ')}; the fighter holds its own (${r.kind})`,
  r.w.every((w, i) => ['sword', 'axe', 'mace', 'spear', 'dagger'].includes(w) && (i === 0 || w !== r.w[i - 1])) && r.kind, r.w);
check(`fighters keyed by bout and replacement: ${r.ids.join(', ')}`, r.ids[0] === 'ring:1:0' && r.ids[1] === 'ring:12:0', r.ids);
check(`the save: the arena in the character row (${r.inC}), the rings in the world row (${r.inW}); back after a load: rank ${r.back.rank}, ban ${r.back.ban} days, the post's ${r.back.dead.join()}, bout 5's fighter ${r.back.id5}`,
  r.inC && r.inW && r.back.rank === 5 && r.back.ban === 28 && r.back.dead.join() === 'Test Fighter' && r.back.id5 === 'ring:5:1', r);

// S1644 — the yard's brawl on the bout: the stake by tier, fists, one a night, spared for the stakes, assault after the yield, the rope,
// murder. Driven by the brawl's own tick (no foe swings back), the ring at the player.
const b = await page.evaluate(() => {
  const out = {}; gold = 1000; staggered.length = 0; delete worldState.arena; delete worldState.crime; delete worldState.favor;
  const run = (n) => { for (let i = 0; i < n; i++) tickBrawl(1 / 60); };
  const start = (site, tier) => WORLD.brawlStart({ x: px, z: pz - 1.4, site, tier, force: true });
  const wpn = EQ.weapon && EQ.weapon.name;
  let r = start('b1', 2); const e = WORLD.brawl.foe;
  out.start = { ok: !!r.ok, stake: r.stake, gold: gold, hand: EQ.weapon ? EQ.weapon.name : null, fists: foeWeaponKind(e) };
  out.again = start('b1', 2).say;
  e.hp = Math.floor(e.maxHp * .25); run(2); out.yielded = WORLD.bout && WORLD.bout.state; run(200);
  out.won = { end: WORLD.brawl, gold: gold, back: EQ.weapon && EQ.weapon.name === wpn, alive: !e.dead };
  out.againNight = start('b1', 2).say;
  // assault: a blow after the held 0.4 s, the brawler stays down
  r = start('b2', 1); const e2 = WORLD.brawl.foe; out.stake1 = r.stake; e2.hp = Math.floor(e2.maxHp * .25); run(2);
  playClockS += 1; _offenceS = playClockS; e2.hp -= 3; run(1);
  const c2 = (worldState.crime || {}).b2; out.assault = { bounty: c2 && c2.bounty, favour: (worldState.favor || {}).b2, alive: !e2.dead, state: WORLD.bout && WORLD.bout.state, n: WORLD.brawl && WORLD.brawl.assaults };
  run(200); out.assaultEnd = !WORLD.brawl;
  // the rope: a step 1 m past it is a loss; the stake kept
  r = start('b3', 1); const g0 = gold; const x0 = px; px = x0 + 6.6; run(1); px = x0; out.rope = { gold: gold - g0, end: !WORLD.brawl, kit: !!EQ.weapon };
  // murder: a blow that kills after the yield
  r = start('b4', 1); const e4 = WORLD.brawl.foe; e4.hp = Math.floor(e4.maxHp * .25); run(2); playClockS += 1; _offenceS = playClockS;
  e4.hp = 0; killZoneEnemy(e4, scene, ''); const c4 = (worldState.crime || {}).b4;
  out.murder = { dead: e4.dead, ban: arenaState().banUntil - dayNow(), bounty: c4 && c4.bounty, favour: (worldState.favor || {}).b4, end: !WORLD.brawl, kit: !!EQ.weapon };
  return out; });
console.log('brawl', JSON.stringify(b));
check(`a tier-2 brawl: a stake of ${b.start.stake} taken (gold ${b.start.gold}), your hands empty (${b.start.hand}), the brawler on its fists (${b.start.fists})`,
  b.start.ok && b.start.stake === 100 && b.start.gold === 900 && b.start.hand === null && b.start.fists === 'fists' && /already in the ring/.test(b.again), b.start);
check(`yielded at a quarter (${b.yielded}), spared after 3 s: the stakes paid (gold ${b.won.gold}), your weapon back (${b.won.back}); one brawl a night (*${b.againNight}*)`,
  b.yielded === 'yielded' && b.won.end === null && b.won.gold === 1100 && b.won.back && b.won.alive && /One brawl a night/.test(b.againNight), b);
check(`a blow after the yield is assault: bounty ${b.assault.bounty}, favour ${b.assault.favour}, the brawler down and alive (${b.assault.state}); the brawl still ends`,
  b.stake1 === 50 && b.assault.bounty === 75 && b.assault.favour === -3 && b.assault.alive && b.assault.state === 'yielded' && b.assault.n === 1 && b.assaultEnd, b);
check(`over the rope: lost, the stake kept (${b.rope.gold}), your kit back`, b.rope.end && b.rope.gold === 0 && b.rope.kit, b.rope);
check(`a blow that kills after the yield is murder: bounty ${b.murder.bounty}, favour ${b.murder.favour}, the rings shut ${b.murder.ban} days`,
  b.murder.dead && b.murder.bounty === 125 && b.murder.favour === -5 && b.murder.ban === 28 && b.murder.end && b.murder.kit, b.murder);

// S1645 — the ladder's call on the hour, the bout in the 8 m ring, the purse, the day used up, the potion forfeit, a call missed, the
// rope, murder and the title's ring. Driven by the ladder's own tick (no foe swings back), the ring 2 m from the player.
const L = await page.evaluate(() => {
  const out = {}; gold = 1000; staggered.length = 0; delete worldState.arena; delete worldState.rings; delete worldState.crime; delete worldState.favor;
  const S = ladderSites(), city = S.find(s => s.anchor !== 'caer_slige'), cid = city.id;
  const at = (day, h) => { worldState.gameTimeAbsMinutes = day * 1440 + Math.round(h * 60); worldState.gameTimeMinutes = Math.round(h * 60) % 1440; };
  const run = (n) => { for (let i = 0; i < n; i++) tickLadder(1 / 60); };
  const call = () => WORLD.ladderCall({ site: cid, x: px, z: pz - 2 });
  const hit = () => { const c = arenaState().call; at(c.day, c.hour); run(1); return WORLD.ladder; };
  at(5, 7.5); out.early = call().say;
  at(5, 10.5); let r = call(); out.call = { ok: !!r.ok, bout: r.bout, hour: r.hour, again: call().say };
  at(5, 10.9); run(5); out.before = !!WORLD.ladder;
  let Lb = hit(); const e = Lb && Lb.foe; out.begin = { on: !!Lb, r: WORLD.bout && WORLD.bout.r, d: e && Math.round(Math.hypot(e.x - px, e.z - (pz - 2)) * 10) / 10, feint: e && e._noFeint, heavy: e && e._noHeavy };
  e.hp = Math.floor(e.maxHp * .25); run(2); out.yielded = WORLD.bout && WORLD.bout.state; run(200);
  out.won = { end: Lb.end, gold: gold - 1000, rank: arenaState().rank, favour: (worldState.favor || {})[cid], alive: !e.dead };
  out.sameDay = call().say;
  // day 6: bout 2, a draught drunk inside the rope
  at(6, 9.2); call(); Lb = hit(); bagAdd({ name: 'Test Draught', type: 'potion', heal: 10, qty: 1 }); DRINK = null;
  useItem(BAG.findIndex(it => it.name === 'Test Draught')); out.forfeit = { end: Lb.end, why: Lb.why, rank: arenaState().rank, next: call().say };
  // day 7: called and away from the ring at the hour
  at(7, 12.4); call(); const x0 = px; px = x0 + 40; const c7 = arenaState().call; at(7, c7.hour); run(1); px = x0;
  out.away = { on: !!WORLD.ladder, call: arenaState().call, day: arenaState().lastDay };
  // day 8: over the 8 m rope
  at(8, 13.5); call(); Lb = hit(); px = x0 + 7.5; run(1); out.inside = !WORLD.ladder || WORLD.ladder === Lb; px = x0; const zr = pz; pz = zr - 2 - 9.1; run(1); pz = zr;
  out.rope = { end: Lb.end, why: Lb.why, rank: arenaState().rank };
  // day 9: bout 4 (rank 3), murder after the held 0.4 s
  arenaState().rank = 3; at(9, 9.5); call(); Lb = hit(); const e4 = Lb.foe; out.f4 = { feint: e4._noFeint, id: e4.id };
  e4.hp = Math.floor(e4.maxHp * .25); run(2); playClockS += 1; _offenceS = playClockS; e4.hp = 0; killZoneEnemy(e4, scene, '');
  const c9 = (worldState.crime || {})[cid];
  out.murder = { end: Lb.end, ban: arenaState().banUntil - dayNow(), bounty: c9 && c9.bounty, post: ringOf(cid).dead.slice(), id: ladderFighterId(4), shut: (at(10, 10), call().say) };
  // the title is fought at Caer Slige only
  Object.assign(arenaState(), { rank: 11, banUntil: 0, lastDay: -1 }); out.title = call().say;
  // S1646 — the wager: odds 1 + (tier level − yours) ÷ 5, clamped evens to 4 to 1, fixed when placed; a win returns the stake and the odds
  const lv0 = level; level = 4; Object.assign(arenaState(), { rank: 6 }); at(11, 10.5); out.noCall = WORLD.ladderWager(10).say; call();
  out.over = WORLD.ladderWager(300).say; const g0 = gold; r = WORLD.ladderWager(100); out.wager = { ok: !!r.ok, odds: r.odds, took: g0 - gold, again: WORLD.ladderWager(5).say };
  level = 9; Lb = hit(); const e7 = Lb.foe; e7.hp = Math.floor(e7.maxHp * .25); run(2); run(200); out.wagerWon = { end: Lb.end, back: gold - g0, book: Lb.won };
  level = 4; at(12, 9.5); call(); WORLD.ladderWager(50); const g1 = gold; Lb = hit(); const zq = pz; pz = zq - 2 - 9.1; run(1); pz = zq; out.wagerLost = { end: Lb.end, back: gold - g1, stake: arenaState().stake };
  level = 1; out.clampHi = ladderOdds(10); level = 20; out.clampLo = ladderOdds(10); level = lv0;
  // S1647 — the fixer: from bout 4, one in three by the bout and the day; 3 × the purse; found out one in four on a loss; roughs at dusk
  // on a win; reported, the ring has none again and the next purse is ×1.5
  const days = []; for (let d = 20; d < 400; d++) if (ladderFixed(4, d, cid)) days.push(d);
  out.share = days.length / 380; out.none3 = [20, 21, 22, 23].every(d => !ladderFixed(3, d, cid)) && !Array.from({ length: 60 }, (_, i) => ladderFixed(3, 20 + i, cid)).some(Boolean);
  const fo = (d) => seededRng('fixout', ladderBoutId(4, d))() < .25;
  const dKept = days.find(d => !fo(d)), dFound = days.find(d => fo(d)), rest = days.filter(d => d !== dKept && d !== dFound);
  const fresh = () => Object.assign(arenaState(), { rank: 3, banUntil: 0, lastDay: -1, call: null, stake: null, purseUp: 0 });
  const lose = () => { Lb = hit(); const z = pz; pz = z - 2 - 9.1; run(1); pz = z; return Lb; };
  fresh(); at(dKept, 9.5); r = call(); let ga = gold; const tb = WORLD.takeBribe(); out.kept = { fixer: r.fixer, bribe: tb.n, gold: gold - ga, rep: WORLD.reportFixer().say };
  Lb = lose(); out.kept.fix = Lb.fix; out.kept.ban = arenaState().banUntil; out.kept.rank = arenaState().rank;
  fresh(); at(dFound, 9.5); call(); WORLD.takeBribe(); ga = gold; Lb = lose(); out.found = { fix: Lb.fix, fine: ga - gold, ban: arenaState().banUntil - dayNow() };
  fresh(); const dW = rest[0]; at(dW, 9.5); call(); WORLD.takeBribe(); Lb = hit(); const eW = Lb.foe; eW.hp = Math.floor(eW.maxHp * .25); run(2); run(200);
  const n0 = ZONES.world.enemies.length; at(dW, 17.5); run(1); const n1 = ZONES.world.enemies.length; at(dW, 18.5); run(1);
  const roughs = ZONES.world.enemies.filter(e => /^rough:/.test(e.id || ''));
  out.crossed = { end: Lb.end, fix: Lb.fix, rank: arenaState().rank, before: n1 - n0, roughs: roughs.length, alert: roughs.every(e => e.alert), tier: roughs.map(e => e.tier) };
  for (const e of roughs) { if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1); }
  fresh(); const dR = rest[1]; at(dR, 9.5); call(); const rp = WORLD.reportFixer(); ga = gold; Lb = hit(); const eR = Lb.foe; eR.hp = Math.floor(eR.maxHp * .25); run(2); run(200);
  const repLb = Lb, repGold = gold - ga;
  // S1648 — the title: bout 12 won at Caer Slige; the challenger every 28 days; three refusals or one loss and it passes
  const seat = S[0], callAt = (s) => WORLD.ladderCall({ site: s.id, x: px, z: pz - 2 }), win = () => { Lb = hit(); const e = Lb.foe; e.hp = Math.floor(e.maxHp * .25); run(2); run(200); return Lb; };
  fresh(); arenaState().rank = 11; at(500, 9.5); callAt(seat); ga = gold; win();
  out.title = { end: Lb.end, title: arenaState().title, rank: arenaState().rank, champ: ringsState().champion, purse: gold - ga, next: arenaState().nextChallenge };
  at(501, 9.5); run(1); out.title.after = callAt(seat).say; renderHubAttrs(); out.title.journal = (document.getElementById('standing-body').textContent.match(/The Mark's rings\s*([^A-Z]*Champion)/) || [])[1] || document.getElementById('standing-body').textContent.slice(0, 400);
  at(528, 9.5); run(1); out.def = { city: callAt(city).say, seat: !!callAt(seat).ok }; Lb = win(); out.def.id = Lb.foe.id; out.def.end = Lb.end; out.def.hp = Lb.foe.maxHp;
  at(529, 9); run(1); out.def.next = arenaState().nextChallenge; out.def.title = arenaState().title;
  const refs = []; for (const d of [557, 585, 613]) { at(d, 9); run(1); refs.push([arenaState().refusals, arenaState().title]); }
  out.refs = refs; out.passed = { champ: ringsState().champion, rank: arenaState().rank, again: (fresh(), arenaState().rank = 11, at(620, 9.5), !!callAt(seat).ok) };
  arenaState().call = null; titleWon(); const dL = arenaState().nextChallenge; at(dL, 9.5); callAt(seat); Lb = hit(); { const z = pz; pz = z - 2 - 9.1; run(1); pz = z; }
  out.lostDef = { end: Lb.end, title: arenaState().title, rank: arenaState().rank, champ: ringsState().champion };
  out.report = { ok: !!rp.ok, paid: repLb.paid, gold: repGold, gone: days.every(d => !ladderFixed(4, d, cid)), bribe: (fresh(), at(rest[2] || dR + 1, 9.5), call(), WORLD.takeBribe().say) };
  return out; });
console.log('ladder', JSON.stringify(L));
check(`the call: refused at 7h30 (*${L.early}*); at 10h30 bout ${L.call.bout} is called at ${L.call.hour}h (*${L.call.again}*), and nothing starts before`,
  /from 9h to 17h/.test(L.early) && L.call.ok && L.call.bout === 1 && L.call.hour === 11 && /called at 11h/.test(L.call.again) && !L.before, L.call);
check(`at the hour the bout begins in an ${L.begin.r} m ring, the fighter ${L.begin.d} m off, light blows only (feint off ${L.begin.feint}, heavy off ${L.begin.heavy})`,
  L.begin.on && L.begin.r === 8 && L.begin.feint === true && L.begin.heavy === true, L.begin);
check(`yielded at a quarter (${L.yielded}) and spared: the purse ${L.won.gold}, rank ${L.won.rank}, the town's favour ${L.won.favour}; one bout a day (*${L.sameDay}*)`,
  L.yielded === 'yielded' && L.won.end === 'won' && L.won.gold === 50 && L.won.rank === 1 && L.won.favour === 1 && L.won.alive && /One bout a day/.test(L.sameDay), L.won);
check(`a draught drunk inside the rope forfeits the bout (${L.forfeit.end}, ${L.forfeit.why}), rank still ${L.forfeit.rank}, the day used (*${L.forfeit.next}*)`,
  L.forfeit.end === 'lost' && L.forfeit.why === 'forfeit' && L.forfeit.rank === 1 && /One bout a day/.test(L.forfeit.next), L.forfeit);
check(`not at the ring at the hour: no bout (${L.away.on}), the day lost (${L.away.day})`, !L.away.on && !L.away.call && L.away.day === 7, L.away);
check(`7.5 m in is inside the ring (${L.inside}); 1 m past the 8 m rope is lost (${L.rope.end}, ${L.rope.why}), rank ${L.rope.rank}`,
  L.inside && L.rope.end === 'lost' && L.rope.why === 'rope' && L.rope.rank === 1, L.rope);
check(`murder at bout 4 (the feint on: ${!L.f4.feint}): bounty ${L.murder.bounty}, the rings shut ${L.murder.ban} days (*${L.murder.shut}*), ${L.murder.post.join()} on the post, the bout's next fighter ${L.murder.id}`,
  L.f4.feint === false && L.murder.end === 'murder' && L.murder.bounty === 125 && L.murder.ban === 28 && /shut to you/.test(L.murder.shut) && L.murder.post.join() === 'The fighter of bout 4' && L.murder.id === 'ring:4:1', L.murder);
check(`bout 12 is refused away from Caer Slige (*${L.title}*)`, /fought at Caer Slige/.test(L.title), L.title);
check(`the wager on bout 7 at level 4: none before a call (*${L.noCall}*), the purse its cap (*${L.over}*), 100 taken at ${L.wager.odds} to 1, one stake (*${L.wager.again}*)`,
  /no bout called/.test(L.noCall) && /up to 250/.test(L.over) && L.wager.ok && Math.abs(L.wager.odds - 2.4) < 1e-9 && L.wager.took === 100 && /already down/.test(L.wager.again), L.wager);
check(`won with the odds fixed when placed (level 9 by the bout): the book pays ${L.wagerWon.book}, gold +${L.wagerWon.back} with the 250 purse`,
  L.wagerWon.end === 'won' && L.wagerWon.book === 340 && L.wagerWon.back === 250 + 240, L.wagerWon);
check(`lost over the rope: the stake kept (gold ${L.wagerLost.back}); the odds clamped, 4 to 1 at level 1 against bout 10 (${L.clampHi}), evens at level 20 (${L.clampLo})`,
  L.wagerLost.end === 'lost' && L.wagerLost.back === 0 && !L.wagerLost.stake && L.clampHi === 4 && L.clampLo === 1, L);
check(`the fixer at bout 4 on ${Math.round(L.share * 100)}% of days (a third), never before bout 4 (${L.none3}); the bribe ${L.kept.bribe} (3 × 120), paid at once`,
  L.share > .25 && L.share < .42 && L.none3 && L.kept.fixer === true && L.kept.bribe === 360 && L.kept.gold === 360 && /taken his money/.test(L.kept.rep), L);
check(`taken and lost: kept (${L.kept.fix}), no ban, rank ${L.kept.rank}; found out on its day: a fine of ${L.found.fine}, the rings shut ${L.found.ban} days`,
  L.kept.fix === 'kept' && !L.kept.ban && L.kept.rank === 3 && L.found.fix === 'found' && L.found.fine === 720 && L.found.ban === 28, L);
check(`taken and won anyway: rank ${L.crossed.rank}, none before dusk (${L.crossed.before}), ${L.crossed.roughs} roughs at the gate at 18h30, alert, tier ${L.crossed.tier}`,
  L.crossed.end === 'won' && L.crossed.fix === 'crossed' && L.crossed.rank === 4 && L.crossed.before === 0 && L.crossed.roughs === 2 && L.crossed.alert && L.crossed.tier.every(t => t === 2), L.crossed);
check(`reported: the next purse ${L.report.paid} (×1.5 of 120), that ring has no fixer again (${L.report.gone}; *${L.report.bribe}*)`,
  L.report.ok && L.report.paid === 180 && L.report.gold === 180 && L.report.gone && /No one is offering/.test(L.report.bribe), L.report);
check(`bout 12 won at Caer Slige: the title (${L.title.title}), rank ${L.title.rank}, the purse ${L.title.purse}, the posts' champion yours (${L.title.champ}), the challenger due day ${L.title.next}; *${L.title.after}*; the journal: ${L.title.journal}`,
  L.title.end === 'won' && L.title.title && L.title.rank === 12 && L.title.purse === 1000 && L.title.next === 528 && /hold the title/.test(L.title.after) && /Champion/.test(L.title.journal), L.title);
check(`on day 528 the challenge (*${L.def.city}* away from the seat), ${L.def.id} at ${L.def.hp} health, defended; the next due ${L.def.next}`,
  /fought at Caer Slige/.test(L.def.city) && L.def.seat && L.def.id === 'ring:challenger:528' && L.def.end === 'won' && L.def.next === 556 && L.def.title, L.def);
check(`three challenges let go by: refusals ${L.refs.map(r => r[0] + (r[1] ? '' : ' (passed)')).join(', ')}; the posts' champion ${L.passed.champ}, rank ${L.passed.rank}, bout 12 open again (${L.passed.again})`,
  L.refs[0][0] === 1 && L.refs[0][1] && L.refs[1][0] === 2 && !L.refs[2][1] && L.passed.champ === 'The challenger' && L.passed.rank === 11 && L.passed.again, L);
check(`a defence lost over the rope: the title passes (${L.lostDef.title}), rank ${L.lostDef.rank}, ${L.lostDef.champ} on the posts`,
  L.lostDef.end === 'lost' && !L.lostDef.title && L.lostDef.rank === 11 && L.lostDef.champ === 'The challenger', L.lostDef);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
