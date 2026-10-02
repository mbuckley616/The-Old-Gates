// The Yard at Caer Slige (Session 373; Michael's A on #69, the quest writer's draft in docs/quest_drafts.md). The League's
// ninth service is a duel in a roped ring east of the seat, laid from first light to noon. Rowe yields at a quarter of her
// health; spared three seconds she lives and you are Captain; struck after the yield she dies and the League closes. The
// ring holds you at 1 health: down, yielded or over the rope, Rowe is acclaimed and the ring is laid again in seven days.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => WORLD.devUnlockAll());

// a fresh ninth service: the League at eight done, the quest taken at the seat, the player stood in the ring
const fresh = (hour = 8) => page.evaluate((hour) => {
  const F = WORLD.fstate(); const L = F.league; if (L.active) L.active.turnedIn = true;
  Object.assign(L, { done: 8, rank: 2, active: null, closed: false }); delete L.rowe;
  WORLD.tickDuel(0); forceTime(hour); WORLD.anchoredPlaces();
  const seat = WORLD.siteAnywhere(WORLD.FACTIONS.league.seat); px = seat.x; pz = seat.z;
  const serve = WORLD.factionTopics(seat).find(t => /^Serve /.test(t.label)); const brief = serve.fn(); const q = L.active;
  px = q.data.x; pz = q.data.z + 1; PHP = maxHP; dead = false;
  WORLD.tickDuel(1 / 60); const D = WORLD.duel;
  return { seat: seat.name, brief, kind: q.kind, objective: q.objective, state: q.data.state, parts: D.parts.length, watchers: D.watchers.length, sgt: D.sgt && D.sgt.def.role, rowe: D.npc && D.npc.def.name };
}, hour);
const callIt = () => page.evaluate(() => { const D = WORLD.duel; const t = D.sgt.def.topics.find(x => x.label === 'Call it.'); const said = t ? t.fn() : null; const e = D.rowe; if (e) e.atkCd = 1e9;
  return { said, state: D.q.data.state, rowe: e && e.name, hp: e && e.hp, max: e && e.maxHp }; });
const serveNow = () => page.evaluate(() => { const seat = WORLD.siteAnywhere(WORLD.FACTIONS.league.seat); const px0 = px, pz0 = pz; px = seat.x; pz = seat.z;
  const ts = WORLD.factionTopics(seat); const t = ts.find(x => /^Serve /.test(x.label)); const r = t.fn ? t.fn() : t.response; px = px0; pz = pz0; const L = WORLD.fstate().league;
  return { label: t.label, r, done: L.done, rank: L.rank, closed: L.closed, active: !!L.active }; });

// 1 — the yard, and the spared ending
const a = await fresh(8);
console.log('yard', JSON.stringify(a));
check('the ninth service is a duel in the ring east of Caer Slige, with the ring in the brief', a.kind === 'duel' && /in the ring east of Caer Slige/.test(a.objective) && /The ring's laid east of the walls from first light/.test(a.brief), a);
check('at 8h the ring is laid: 12 stakes and 12 ropes, the yard-sergeant, watchers round it, and Rowe waiting inside', a.parts === 24 && a.sgt === 'Yard-sergeant' && a.watchers >= 6 && a.rowe === 'Hesket Rowe' && a.state === 'wait', a);
const lay = await page.evaluate(() => { const q = WORLD.duel.q, d = q.data; const hs = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; for (const r of [0, 2.5, 5]) hs.push(WORLD.worldH ? WORLD.worldH(d.x + Math.cos(a) * r, d.z + Math.sin(a) * r) : 0); }
  const sgt = WORLD.duel.sgt.def; return { rise: +(Math.max(...hs) - Math.min(...hs)).toFixed(2), greet: sgt.greeting[0], topics: sgt.topics.map(t => t.label), rg: WORLD.duel.npc.def.greeting[0], rt: WORLD.duel.npc.def.topics.map(t => t.label) }; });
console.log('lay', JSON.stringify(lay));
check('the sergeant greets you in the ring\'s hours and offers the rules and *Call it.*; Rowe greets you by your people', /Rowe's been in there since first light/.test(lay.greet) && lay.topics.includes('The rules?') && lay.topics.includes('Call it.') && /turf-cutter|One of ours|unlettered|Cold-eyes/.test(lay.rg) && lay.rt.includes('Why do you want it?'), lay);

// S393 — the yard's people take no name the seat already uses (the critic's s342: a watcher Wulfstan beside Reeve Wulfstan).
// The yard's names are seeded by the quest's id, so the yard is laid twenty times under twenty ids.
const nmz = await page.evaluate(() => { const L = WORLD.fstate().league, q0 = L.active, seat = WORLD.siteAnywhere(q0.giverSite); const first = n => String(n || '').split(/\s+/);
  const taken = new Set([...first(q0.giver), ...first(WORLD.rival.name)]); let lord = null; try { if (!seat.lordless) { lord = WORLD.lordFor(seat).name; first(lord).forEach(w => taken.add(w)); } } catch (e) {}
  const S = WORLD.settle.get(seat.id); if (S) S.npcs.forEach(n => first(n.def && n.def.name).forEach(w => taken.add(w)));
  let builds = 0, clashes = 0; const seen = [];
  const Q = worldState.quests, qi = Q.indexOf(q0);
  for (let k = 0; k < 20; k++) { L.active = Q[qi] = { ...q0, id: q0.id + '_n' + k, data: { ...q0.data, state: 'wait' } }; WORLD.tickDuel(1 / 60); WORLD.tickDuel(1 / 60); const D = WORLD.duel;
    if (!D.sgt) continue; builds++; const yard = [D.sgt.def.name, ...D.watchers.map(w => w.def.name)]; const c = yard.filter(n => taken.has(n)); if (c.length) { clashes++; seen.push(c.join('/')); } }
  L.active = Q[qi] = q0; WORLD.tickDuel(1 / 60); WORLD.tickDuel(1 / 60);
  return { lord, seatPeople: S ? S.npcs.length : 0, builds, clashes, seen, back: WORLD.duel.q === q0 && !!WORLD.duel.sgt }; });
console.log('names', JSON.stringify(nmz));
check('laid twenty times, no one at the yard shares a name with the seat\'s lord (the Reeve) or its people', nmz.builds === 20 && nmz.clashes === 0 && nmz.back, nmz);
const c1 = await callIt();
check('*Call it.* starts the fight: Rowe is the Bandit Captain wearing her name', c1.state === 'fight' && c1.rowe === 'Hesket Rowe' && /Iron and blood/.test(c1.said), c1);
const y1 = await page.evaluate(() => { const e = WORLD.duel.rowe; e.hp = -5; killZoneEnemy(e, WORLD.scene, ''); return { dead: e.dead, hp: e.hp, max: e.maxHp, state: WORLD.duel.q.data.state, hold: e._duelHold }; });
check('a blow that would kill her before the yield leaves her at a quarter, on one knee, yielded', !y1.dead && y1.hp === Math.floor(y1.max * .25) && y1.state === 'yielded' && y1.hold, y1);
await g.spin(null, 200);
const w1 = await page.evaluate(() => { const D = WORLD.duel, q = D.q; return { state: q && q.data.state, done: q && q.done, rowe: WORLD.fstate().league.rowe, npc: D.npc && D.npc.def.name, greet: D.npc && D.npc.def.greeting[0], parts: D.parts.length }; });
check('unstruck for three seconds she is spared: the quest is done, Rowe stands as a person, the ring comes down', w1.state === 'won' && w1.done && w1.rowe === 'alive' && w1.npc === 'Hesket Rowe' && /Good fight/.test(w1.greet) && w1.parts === 0, w1);
const t1 = await serveNow();
console.log('won turn-in', JSON.stringify(t1));
check('at the Captain: "The Captains\' League names you Captain." with the new line, rank 3', /^The Captains' League names you Captain\. Acclaimed\. Rowe says you fought well/.test(t1.r) && t1.rank === 3 && t1.done === 9, t1);

const seatRowe = () => page.evaluate(() => { const seat = WORLD.siteAnywhere(WORLD.FACTIONS.league.seat); px = seat.x; pz = seat.z; WORLD.tick(1 / 60, performance.now()); WORLD.tick(1 / 60, performance.now());
  const n = WORLD.rival.npc; return n ? { greet: n.def.greeting[0], topics: n.def.topics.map(t => t.label + ' / ' + (t.response || '')) } : null; });
const r1 = await seatRowe();
console.log('rowe at the seat, won', JSON.stringify(r1));
check('spared, Rowe stands at the seat with the League\'s rank-3 lines', r1 && /^Captain\. Took me a week/.test(r1.greet) && r1.topics.some(t => /^What now, Rowe\? \/ The spire\./.test(t)) && r1.topics.some(t => /I'm not, now/.test(t)), r1);

// 2 — murder
await fresh(8); await callIt();
const m = await page.evaluate(() => { const D = WORLD.duel, e = D.rowe; e.hp = Math.floor(e.maxHp * .25); WORLD.tickDuel(1 / 60); const s1 = D.q.data.state; const rot = D.watchers.map(w => w.g.rotation.y);
  _offenceS = D.yieldS + .5; e.hp -= 3; WORLD.tickDuel(1 / 60); const L = WORLD.fstate().league; /* S408: a blow begun 0.5 s after she knelt, past the 0.4 s that is checked */
  return { s1, state: D.q.data.state, dead: e.dead, done: D.q.done, closed: L.closed, rowe: L.rowe, turned: D.watchers.every((w, i) => Math.abs(Math.abs(w.g.rotation.y - rot[i]) - Math.PI) < 1e-6), parts: D.parts.length, sgt: D.sgt.def.greeting[0] }; });
check('at a quarter she yields; a blow after it kills her: murder, the League closed, the watchers turn their backs', m.s1 === 'yielded' && m.state === 'murder' && m.dead && m.done && m.closed && m.rowe === 'dead' && m.turned && m.parts === 0 && /She yielded/.test(m.sgt), m);
const t2 = await serveNow(); const t2b = await serveNow();
console.log('murder turn-in', JSON.stringify(t2), JSON.stringify(t2b));
check('the Captain turns you out, pays nothing, and the seat has only "Not you." after', /The yard saw it/.test(t2.r) && t2.done === 8 && t2.closed && !t2.active && t2b.label === 'Serve the Captains\' League?' && /^Not you\./.test(t2b.r), { t2, t2b });
const mr = await page.evaluate(() => { const seat = WORLD.siteAnywhere(WORLD.FACTIONS.league.seat); const home = WORLD.siteAnywhere('dunmore');
  const inMark = new Set(), inGates = new Set(); for (let k = 0; k < 60; k++) { WORLD.liveRumours(seat).forEach(x => inMark.add(x)); if (home) WORLD.liveRumours(home).forEach(x => inGates.add(x)); }
  px = seat.x; pz = seat.z; WORLD.tick(1 / 60, performance.now()); WORLD.tick(1 / 60, performance.now());
  return { mark: [...inMark].some(x => /Hesket Rowe down on the yard/.test(x)), gates: [...inGates].some(x => /Hesket Rowe/.test(x)), home: !!home, rival: !!WORLD.rival.npc }; });
check('after the murder the Mark talks of it and the Gatelands do not; Rowe is at no seat', mr.mark && mr.home && !mr.gates && !mr.rival, mr);

// 3 — the player's yield offer, the rope, going down, and the week
await fresh(8); await callIt();
const o = await page.evaluate(() => { PHP = Math.floor(maxHP * .2); WORLD.tickDuel(1 / 60); return { open: dlgOpen, who: dlgNPC && dlgNPC.name, hold: WORLD.duel.rowe._duelHold }; });
check('below 30% health Rowe offers the yield, and holds while you answer', o.open && o.who === 'Hesket Rowe' && o.hold, o);
await page.evaluate(() => { const t = dlgNPC.topics.find(x => x.label === 'I yield.'); t.fn(); });
await page.waitForTimeout(1600);
const l1 = await page.evaluate(() => { const q = WORLD.duel.q || WORLD.quests.find(q => q.kind === 'duel' && !q.turnedIn); return { state: q.data.state, retry: q.data.retryDay, day: Math.floor((worldState.gameTimeAbsMinutes || 0) / 1440), rowe: WORLD.fstate().league.rowe, php: PHP, dead }; });
check('*I yield.*: lost, the rematch in seven days, Rowe the Captain, no death', l1.state === 'lost' && l1.retry === l1.day + 7 && l1.rowe === 'captain' && l1.php >= 1 && !l1.dead, l1);
const t3 = await serveNow(); const t3b = await serveNow();
check('the Captain names the rematch, then "Not yet." before the week is out; the quest stays open', /Give your arm a week/.test(t3.r) && /^Not yet\./.test(t3b.r) && t3b.active && t3b.done === 8, { t3, t3b });
const r3 = await seatRowe();
check('in the rematch week she is at the seat as *Captain Rowe*', r3 && /^Captain Rowe, for a week at least/.test(r3.greet) && r3.topics.some(t => /step slow on the left, and you didn't see it/.test(t)), r3);
const wk = await page.evaluate(() => { worldState.gameTimeAbsMinutes += 7 * 1440; forceTime(8); const q = WORLD.fstate().league.active; px = q.data.x; pz = q.data.z + 1; WORLD.tickDuel(1 / 60); WORLD.tickDuel(1 / 60); const D = WORLD.duel; return { state: q.data.state, parts: D.parts.length, rowe: D.npc && D.npc.def.name }; });
check('a week on, the ring is laid again with Rowe in it', wk.state === 'wait' && wk.parts === 24 && wk.rowe === 'Hesket Rowe', wk);
await callIt();
const rope = await page.evaluate(() => { const q = WORLD.duel.q; px = q.data.x; pz = q.data.z; WORLD.tickDuel(1 / 60); const s1 = q.data.state; px = q.data.x + 6.5; WORLD.tickDuel(1 / 60); return { s1, state: q.data.state }; });
check('stepping over the rope in the fight is a yield', rope.s1 === 'fight' && rope.state === 'lost', rope);
const down = await page.evaluate(() => { const q = WORLD.fstate().league.active; worldState.gameTimeAbsMinutes += 7 * 1440; forceTime(8); px = q.data.x; pz = q.data.z; WORLD.tickDuel(1 / 60); WORLD.tickDuel(1 / 60);
  WORLD.duel.sgt.def.topics.find(x => x.label === 'Call it.').fn(); WORLD.duel.rowe.atkCd = 1e9; WORLD.tickDuel(1 / 60); let deaths = 0; const nd = WORLD.noteDeath; WORLD.noteDeath = () => { deaths++; };
  PHP = 0; playerDead(); WORLD.noteDeath = nd; return { state: q.data.state, php: PHP, dead, deaths }; });
check('a killing blow in the ring leaves you at 1 health: down, not dead, and no death counted', down.state === 'lost' && down.php === 1 && !down.dead && down.deaths === 0, down);

// 4 — the hours
const h = await page.evaluate(() => { const q = WORLD.fstate().league.active; worldState.gameTimeAbsMinutes += 7 * 1440; forceTime(14); px = q.data.x; pz = q.data.z; WORLD.tickDuel(1 / 60); WORLD.tickDuel(1 / 60); const D = WORLD.duel;
  const out = { state: q.data.state, parts: D.parts.length, rowe: !!D.npc, greet: D.sgt && D.sgt.def.greeting[0], topics: D.sgt && D.sgt.def.topics.map(t => t.label) };
  forceTime(8); WORLD.tickDuel(1 / 60); WORLD.tickDuel(1 / 60); out.morning = WORLD.duel.parts.length; return out; });
check('out of the ring\'s hours only the sergeant is at the yard, with the hours line and no *Call it.*; at 8h the ring is back', h.state === 'wait' && h.parts === 0 && !h.rowe && /Ring's down/.test(h.greet) && !h.topics.includes('Call it.') && h.morning === 24, h);

const occ = await page.evaluate(() => { const q = WORLD.fstate().league.active; worldState.gameTimeAbsMinutes += 7 * 1440; forceTime(8); const seat = WORLD.siteAnywhere(q.giverSite); px = q.data.x; pz = q.data.z;
  WORLD.tickDuel(1 / 60); WORLD.tickDuel(1 / 60); const before = WORLD.duel.parts.length; WORLD.TS(seat).flags.occupied = 'aurenne'; WORLD.tickDuel(1 / 60); WORLD.tickDuel(1 / 60); const during = { parts: WORLD.duel.parts.length, sgt: !!WORLD.duel.sgt };
  WORLD.TS(seat).flags.occupied = null; WORLD.tickDuel(1 / 60); WORLD.tickDuel(1 / 60); return { before, during, after: WORLD.duel.parts.length }; });
check('while Caer Slige is occupied no ring is laid; freed, it is laid again', occ.before === 24 && occ.during.parts === 0 && !occ.during.sgt && occ.after === 24, occ);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
