// The night watch on the Spire of Caer Slige (Session 1112; the approved draft *The Spire Held*, docs/quest_drafts.md, Michael
// 14 Oct). The League's Captain is given the spire to hold (`spireGive`). Standing on its roof between 20h and 1h begins the
// watch; three waves of the seat's cull target form on the roof 15 minutes in and two hours apart (2 or 3, 2, 3); on the roof at 6h
// with every wave dead the spire is held. Off the roof more than ten seconds, dead, or the seat occupied, the watch is back to
// 'wait' and its foes are gone. Wait is refused on watch with the draft's line.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();
const spireId = await page.evaluate(() => { WORLD.devUnlockAll(); return WORLD.anchoredPlaces().spire.id; });
await g.settle(spireId);

const setup = () => page.evaluate(() => {
  const L = WORLD.fstate().league; if (L.active) L.active.turnedIn = true;
  Object.assign(L, { done: 9, rank: 3, active: null, closed: false, rowe: 'alive' }); delete L.spire; delete L.spireDay;
  for (const q of worldState.quests) if (q.kind === 'spire') q.turnedIn = true;
  const seat = WORLD.siteAnywhere(WORLD.FACTIONS.league.seat); const out = {};
  out.notRank = (L.rank = 2, WORLD.spireGive(seat)); L.rank = 3;
  const q = WORLD.spireGive(seat); out.given = !!q; out.title = q && q.title; out.reward = q && q.reward; out.spire = L.spire; out.state = q && q.data.state;
  out.twice = WORLD.spireGive(seat);
  return out; });
const clock = (abs) => page.evaluate((abs) => { worldState.gameTimeAbsMinutes = abs; worldState.gameTimeMinutes = abs % 1440; }, abs);
const onRoof = () => page.evaluate(() => { const r = WORLD.settle.get(WORLD.anchoredPlaces().spire.id).roof; px = r.x; pz = r.z + 1.2; jumpY = r.y; PHP = maxHP; dead = false; return { r: [r.x, r.y, r.z].map(v => +v.toFixed(1)) }; });
const tick = (dt = 1 / 60) => page.evaluate((dt) => { PHP = maxHP; for (const e of WORLD.spire.foes) e.atkCd = 1e9; WORLD.tickSpire(dt); const q = worldState.quests.find(x => x.kind === 'spire' && !x.turnedIn);
  return { state: q && q.data.state, wave: q && q.data.wave, foes: WORLD.spire.foes.length, alive: WORLD.spire.foes.filter(e => !e.dead).length, names: [...new Set(WORLD.spire.foes.map(e => e.name))], onRoof: WORLD.spireOnRoof(), spire: WORLD.fstate().league.spire }; }, dt);
const killAll = () => page.evaluate(() => { for (const e of WORLD.spire.foes) if (!e.dead) { e.hp = 0; killZoneEnemy(e, ZONES.world.scene, ''); } });
const DAY = 40 * 1440;

const s = await setup();
console.log('give', JSON.stringify(s));
check('the League\'s Captain is given the spire (not at rank 2, not twice); the quest waits', s.notRank === null && s.given && s.twice === null && s.spire === 'given' && s.state === 'wait' && /The Spire Held/.test(s.title), s);

// by day on the roof: nothing begins
await clock(DAY + 14 * 60); const rr = await onRoof(); let t = await tick();
check('on the roof at 14h the watch does not begin', t.onRoof && t.state === 'wait', { rr, t });
// 21h: it begins; nothing yet; Wait refused
await clock(DAY + 21 * 60); t = await tick();
const wait = await page.evaluate(() => _canWait());
check('on the roof at 21h the watch begins, no foe yet', t.state === 'watch' && t.wave === 0 && t.foes === 0, t);
check('Wait is refused on watch: "Not on watch."', !wait.ok && wait.reason === 'Not on watch.', wait);
// the waves
const waves = [];
for (const m of [15, 135, 255]) { await clock(DAY + 21 * 60 + m); const a = await tick(); await g.frames(6); const y = await page.evaluate(() => WORLD.spire.foes.filter(e => !e.dead).map(e => +(e.mesh.position.y - WORLD.settle.get(WORLD.anchoredPlaces().spire.id).roof.y).toFixed(2)));
  waves.push({ m, wave: a.wave, alive: a.alive, names: a.names, dy: y }); await killAll(); await tick(); }
console.log('waves', JSON.stringify(waves));
const seatBiomeT = waves[0].names[0];
check('three waves at 21:15, 23:15 and 1:15: 2 or 3, then 2, then 3', waves[0].wave === 1 && waves[0].alive >= 2 && waves[0].alive <= 3 && waves[1].wave === 2 && waves[1].alive === 2 && waves[2].wave === 3 && waves[2].alive === 3, waves);
check(`the waves are the seat's cull target (${seatBiomeT}), one kind`, waves.every(w => w.names.length === 1 && w.names[0] === seatBiomeT), waves.map(w => w.names));
check('the wave foes stand on the roof (within 0.3 m of its height)', waves.every(w => w.dy.length && w.dy.every(d => Math.abs(d) < .3)), waves.map(w => w.dy));
// 5:59 not yet; 6h held
await clock(DAY + 1440 + 5 * 60 + 59); t = await tick();
check('at 5:59 with every wave dead the watch still runs', t.state === 'watch', t);
await clock(DAY + 1440 + 6 * 60); t = await tick();
const held = await page.evaluate(() => { const q = worldState.quests.find(x => x.kind === 'spire'); const L = WORLD.fstate().league; return { done: !!q.done, spire: L.spire, day: L.spireDay, now: Math.floor(worldState.gameTimeAbsMinutes / 1440), log: GAME_LOG.slice(-6).map(x => x.text), wait: _canWait().reason || 'ok' }; });
console.log('held', JSON.stringify(held));
check('at 6h on the roof the spire is held: the quest done, league.spire held, the day kept', held.done && held.spire === 'held' && held.day === held.now, held);
check('the log carries the draft\'s lines (the last wave cleared, held)', held.log.includes('The cuts are dim. The sky to the east is not.') && held.log.includes('The Spire of Caer Slige is held.'), held.log);
check('Wait is no longer refused once held', held.wait !== 'Not on watch.', held);

// S1338 — the words: the Captain's *The spire?* turns the held watch in and pays; then the after line; Rowe at the seat; the rumours
const talk = await page.evaluate(() => {
  const seat = WORLD.siteAnywhere(WORLD.FACTIONS.league.seat), L = WORLD.fstate().league;
  const T = () => factionTopics(seat).find(t => t.label === 'The spire?');
  const g0 = gold; const turnIn = T().fn(); const paid = gold - g0; const q = worldState.quests.find(x => x.kind === 'spire');
  const after = T().fn();
  const rowe = rivalLines('league', L, WORLD.FACTIONS.league);
  const here = liveRumours(seat);
  const mk = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites).find(s => ['town', 'village', 'city', 'port'].includes(s.kind) && s.id !== seat.id); const there = mk ? liveRumours(mk) : null;
  return { turnIn, paid, turnedIn: !!q.turnedIn, after, greet: rowe.greet, now: rowe.topics.find(t => t.label === 'What now, Rowe?').response, here, there, mk: mk && mk.name };
});
console.log('talk', JSON.stringify(talk));
check('the Captain turns the held spire in: the draft\'s line and the pay, appended', /^Held, then\. The night sergeant's back on the wall/.test(talk.turnIn) && talk.turnIn.endsWith(` (${talk.paid} gold.)`) && talk.paid > 0 && talk.turnedIn, talk);
check('asked again, the after line', talk.after === "Held. The men sleep badly now. They'll get used to it. So will I.", talk.after);
check('Rowe at the seat, once held: the dark spire and the strait', /The spire's dark and the sergeants are sulking/.test(talk.greet) && /crossing the strait at night without lamps/.test(talk.now), talk);
check('the rumours: the seat has the night on the roof; another town of the Mark has the dark spire', talk.here.some(r => /held the spire a whole night/.test(r)) && !talk.here.some(r => /has gone dark/.test(r)) && (!talk.there || talk.there.some(r => /The spire at Caer Slige has gone dark/.test(r))), talk);

// the resets: off the roof more than ten seconds; a dead player; an occupied seat
const resets = {};
await setup(); await clock(DAY + 2 * 1440 + 22 * 60); await onRoof(); await tick(); await clock(DAY + 2 * 1440 + 22 * 60 + 20); t = await tick();
await page.evaluate(() => { px += 20; jumpY = 0; }); const off9 = await tick(9); const off11 = await tick(2);
const gone = await page.evaluate(() => ({ inWorld: ZONES.world.enemies.filter(e => e._spire && !e.dead).length }));
resets.off = { started: t.foes, off9: off9.state, off11: off11.state, foes: off11.foes, inWorld: gone.inWorld };
await onRoof(); await clock(DAY + 2 * 1440 + 23 * 60); t = await tick(); const again = t.state;
await page.evaluate(() => { dead = true; }); const deadT = await page.evaluate(() => { WORLD.tickSpire(1 / 60); const q = worldState.quests.find(x => x.kind === 'spire' && !x.turnedIn); dead = false; return q.data.state; });
await tick(); const restarted = (await tick()).state;
const occ = await page.evaluate(() => { const seat = WORLD.siteAnywhere(WORLD.FACTIONS.league.seat); const f = WORLD.TS(seat).flags; const was = f.occupied; f.occupied = 'markmen'; WORLD.tickSpire(1 / 60); const q = worldState.quests.find(x => x.kind === 'spire' && !x.turnedIn); const st = q.data.state; WORLD.tickSpire(1 / 60); const st2 = q.data.state; f.occupied = was; return { st, st2 }; });
resets.again = again; resets.dead = deadT; resets.restarted = restarted; resets.occ = occ;
console.log('resets', JSON.stringify(resets));
check('nine seconds off the roof keeps the watch; eleven ends it, its foes gone from the world', resets.off.started >= 2 && resets.off.off9 === 'watch' && resets.off.off11 === 'wait' && resets.off.foes === 0 && resets.off.inWorld === 0, resets.off);
check('back on the roof at 23h the watch begins again', resets.again === 'watch', resets);
check('a dead player ends the watch; it begins again on the roof', resets.dead === 'wait' && resets.restarted === 'watch', resets);
check('an occupied seat ends the watch and it cannot begin', resets.occ.st === 'wait' && resets.occ.st2 === 'wait', resets.occ);
// S1338 — the brief: given once, then still lit; behind their lines while the seat is held
const brief = await page.evaluate(() => {
  const seat = WORLD.siteAnywhere(WORLD.FACTIONS.league.seat), L = WORLD.fstate().league, f = WORLD.TS(seat).flags, was = f.occupied;
  for (const q of worldState.quests) if (q.kind === 'spire') q.turnedIn = true; delete L.spire;
  const T = () => factionTopics(seat).find(t => t.label === 'The spire?');
  const rank2 = (L.rank = 2, T()); L.rank = 3;
  f.occupied = 'markmen'; const occ = T().fn(); const occGiven = L.spire || null; f.occupied = was;
  const first = T().fn(); const q = worldState.quests.find(x => x.kind === 'spire' && !x.turnedIn); const second = T().fn();
  return { rank2: !!rank2, occ, occGiven, first, given: !!q && q.data.state === 'wait' && L.spire === 'given', second };
});
console.log('brief', JSON.stringify(brief));
check('no *The spire?* below Captain', !brief.rank2, brief);
check('behind their lines while the seat is occupied, and nothing given', /^The spire's behind their lines\./.test(brief.occ) && !brief.occGiven, brief);
check('the brief gives the quest; asked again, still lit', /^The spire's yours to hold\. I said it on the yard/.test(brief.first) && brief.given && /^Still lit at night, is it\?/.test(brief.second), brief);
// S1387 — the people at the foot and the roof's words: the night sergeant (§2), the roof and the stone (§3), Rowe's morning (§5)
const foot = () => page.evaluate(() => { const h = spireTower(); px = h.doorX + 3; pz = h.doorZ + 4; jumpY = 0; return !!h; });
const folk = () => page.evaluate(() => { WORLD.tickSpire(1 / 60); const S = SPIRE_FOLK.sgt, R = SPIRE_FOLK.rowe;
  return { sgt: S && { name: S.def.name, role: S.def.role, greet: S.def.greeting[0], labels: S.def.topics.map(t => t.label) }, rowe: R && { greet: R.def.greeting[0], labels: R.def.topics.map(t => t.label), where: R.def.topics.find(t => t.label === 'Where now?').response } }; });
const sgtFn = () => page.evaluate(() => SPIRE_FOLK.sgt.def.topics.find(t => t.label === 'Let me up.').fn());
await setup(); const D3 = DAY + 3 * 1440;
await clock(D3 + 14 * 60); await foot(); const dayF = await folk();
const atDoor = () => page.evaluate(() => { const h = spireTower(); px = h.doorX; pz = h.doorZ; jumpY = activeTerrainH(px, pz); if (dlgOpen) closeDialog(); const go = window.goToInterior; let went = null; window.goToInterior = (x) => { went = x.id; }; try { interact(); } finally { window.goToInterior = go; } const out = { inside: went === h.id, talk: dlgOpen && !!SPIRE_FOLK.sgt && dlgNPC === SPIRE_FOLK.sgt.def, open: dlgOpen }; if (dlgOpen) closeDialog(); return out; });
await clock(D3 + 22 * 60); const nightF = await folk(); const barred = await atDoor(); const up = await sgtFn();
await page.waitForTimeout(1600); const afterUp = await folk(); const freed = await atDoor();
await clock(D3 + 1440 + 21 * 60); const nextNight = await folk();
const noQ = await page.evaluate(() => { for (const q of worldState.quests) if (q.kind === 'spire') q.turnedIn = true; return { greet: SPIRE_FOLK.sgt.def.greeting[0], up: SPIRE_FOLK.sgt.def.topics.find(t => t.label === 'Let me up.').fn() }; });
console.log('sergeant', JSON.stringify({ dayF, nightF, up, afterUp, nextNight, noQ }));
check('no sergeant by day; at 22h one stands at the door, a Sergeant of the Mark, with the quest\'s greeting and the four asks', !dayF.sgt && nightF.sgt && nightF.sgt.role === 'Sergeant' && nightF.sgt.name && /^So you're the one\./.test(nightF.sgt.greet) && ["What's up there?", 'What does it pay?', 'What comes down off it?', 'Let me up.'].every(l => nightF.sgt.labels.includes(l)), nightF);
check('with the quest *Let me up.* gives the watch and he is gone for the night; back the next night', /^Aye\. Iron and blood, then\. It's your watch\./.test(up) && !afterUp.sgt && !!nextNight.sgt, { up, afterUp, nextNight });
check('while he stands the door is his: E at it turns you to him and does not go in; once he has given the watch it goes in', !barred.inside && barred.talk && freed.inside, { barred, freed });
check('without the quest he refuses, and greets with one of the three', noQ.up === "Not without the Captain's word. I don't care whose Captain you are." && ["Night watch. The spire's shut to anyone the Captain didn't send.", 'Warm up there tonight. Always is.', 'Stand where you like. Just not between me and the door.'].includes(noQ.greet), noQ);
// the roof's words, coming up with the quest; the stone
await setup();
const arrive = () => page.evaluate(() => { MSGEL.textContent = ''; const h = spireTower(); px = h.doorX + 3; pz = h.doorZ + 4; jumpY = 0; WORLD.tickSpire(1 / 60); const r = WORLD.settle.get(WORLD.anchoredPlaces().spire.id).roof; px = r.x; pz = r.z + 1.2; jumpY = r.y; WORLD.tickSpire(1 / 60); const q = worldState.quests.find(x => x.kind === 'spire' && !x.turnedIn); const t = MSGEL.textContent; if (q && q.data.state === 'watch') { spireReset(q, true); } return t; });
await clock(D3 + 2 * 1440 + 14 * 60); await page.evaluate(() => { px += 400; jumpY = 0; WORLD.tickSpire(1 / 60); }); const day1 = await arrive(); const day2 = await arrive();
await clock(D3 + 2 * 1440 + 22 * 60); const night1 = await arrive();
const stone = (people) => page.evaluate((people) => { const r = WORLD.settle.get(WORLD.anchoredPlaces().spire.id).roof; const was = worldState.people; worldState.people = people; px = r.x; pz = r.z; jumpY = r.y; const mid = spireStonePrompt(); px = r.x + 3; pz = r.z; MSGEL.textContent = ''; const prompt = spireStonePrompt(); delete WORLD.fstate().league.spireSeen; spireStoneUse(); const out = { mid, prompt, text: MSGEL.textContent, seen: WORLD.fstate().league.spireSeen === true }; worldState.people = was; return out; }, people);
const stNight = await stone('markman'); await clock(D3 + 2 * 1440 + 15 * 60); const stDay = await stone('oldblood'); await page.waitForTimeout(1800); const ob = await page.evaluate(() => MSGEL.textContent);
console.log('roof', JSON.stringify({ day1, day2, night1, stNight, stDay, ob }));
check('by day on the roof with the quest: the day line, once a visit', day1 === 'By day the spire is only stone. The light comes after dark.' && day2 === '', { day1, day2 });
check('by night: the new cuts and the warmth', /^The parapet’s inner face is cut with old strokes/.test(night1) && night1.endsWith('It is warm up here.'), night1);
check('the stone\'s prompt by the parapet, not at the hatch; looked at by night it is lit and warm, and spireSeen is kept', stNight.mid === null && stNight.prompt === "Press 'E' to look at the stone" && stNight.text.endsWith('Where it falls, the stone is as warm as a hand.') && stNight.seen, stNight);
check('by day the stone is cold; an Old Blood player could read the old strokes, and doesn\'t', stDay.text.endsWith('The stone is cold.') && ob === 'You could read the old strokes, if you let yourself. You don’t.', { stDay, ob });
// S1390 — on the roof by its south parapet the tower's door is 1.5 m across and 39 m below: E looks at the stone, it does not go in
const south = await page.evaluate(() => { const r = WORLD.settle.get(WORLD.anchoredPlaces().spire.id).roof, h = spireTower(); px = r.x; pz = r.z + 3.3; jumpY = r.y; MSGEL.textContent = '';
  const out = { toDoor: +Math.hypot(px - h.doorX, pz - h.doorZ).toFixed(2), prompt: spireStonePrompt(), feet: doorAtFeet(h) }; const go = window.goToInterior; let went = null; window.goToInterior = (x) => { went = x.id; }; try { interact(); } finally { window.goToInterior = go; } out.inside = went === h.id; out.text = MSGEL.textContent;
  px = h.doorX; pz = h.doorZ; jumpY = worldH(h.doorX, h.doorZ); out.groundFeet = doorAtFeet(h); return out; });
console.log('south parapet', JSON.stringify(south));
check(`by the south parapet, ${south.toDoor} m across from the tower's door 39 m below, E looks at the stone and does not go in; at the door on the ground it would`, south.toDoor < 1.6 && south.prompt === "Press 'E' to look at the stone" && !south.feet && !south.inside && /stone/.test(south.text) && south.groundFeet, south);
// Rowe's morning: at the foot from 6h to 9h on the day it was held, not at the seat
const morning = await page.evaluate(() => { const L = WORLD.fstate().league; L.spire = 'held'; L.rowe = 'alive'; return true; });
await clock(D3 + 4 * 1440 + 7 * 60); await page.evaluate(() => { WORLD.fstate().league.spireDay = dayNow(); }); await foot(); const m7 = await folk();
const seatRowe = await page.evaluate(() => { const seat = WORLD.siteAnywhere(WORLD.FACTIONS.league.seat); px = seat.x; pz = seat.z; tickRival(); return !!RIVAL.npc; });
await foot(); await clock(D3 + 4 * 1440 + 10 * 60); const m10 = await folk(); const nightHeld = (await clock(D3 + 4 * 1440 + 22 * 60), await folk());
const bh = await page.evaluate(() => !!WORLD.anchoredPlaces().blackhand);
console.log('morning', JSON.stringify({ m7, seatRowe, m10, nightHeld, bh }));
check('the morning it is held Rowe is at the spire\'s foot (6h–9h), with her three asks, and not at the seat', m7.rowe && /^Still standing\. Good\./.test(m7.rowe.greet) && ['Did anyone come?', 'What was the light?', 'Where now?'].every(l => m7.rowe.labels.includes(l)) && !seatRowe, { m7, seatRowe });
check(`*Where now?* points at ${bh ? 'Port Blackhand' : 'the harbour that does not ask'}`, bh ? /Port Blackhand's the only harbour/.test(m7.rowe.where) : /Find the harbour that doesn't ask/.test(m7.rowe.where), m7.rowe && m7.rowe.where);
check('at 10h she is gone from the foot; once held no sergeant stands at night', !m10.rowe && !nightHeld.sgt, { m10, nightHeld });
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
