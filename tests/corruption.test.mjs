// The great gates' two paths and the world's corruption level (card F12's number, Session 1340; Michael, 13 Oct 2026, lore §9a;
// visual-foundation.md §2). Each great gate is untouched, torn or sealed; the level is the number torn; any choice can be undone
// until all six share one state, and then the fate is fixed. The state is the world's: it rides the world row, and a save keeps it.
// Session 1346 (great-gates-build.md session 1): the knot. A torn school casts one tier deeper and a bound one a tier shallower
// (effTier), the tier learned untouched; a cut that lifts a spell to Mastery is a Mastery touch; in a gate flagged great the knot
// stands over the ring's dais and answers by what you carry (piece I's table).
// Session 1353 (session 2's first half, piece II): reaching a ring with neither tool, the next waking leaves Varek's note naming
// it; read, it stars the Ashfeld, and the flagstone there gives the Loosing Knife, which cannot be stashed and rides the character.
// Session 1354 (piece I §4): once its ring is reached, a great gate's door offers the way down to the ring, landing beside the knot.
// Session 1349 (session 3, piece III): the gifts while a gate is torn: fire halved, carry ×1.5, sea speed ×1.5, the undead at peace
// until one of a room is struck.
// Session 1350 (session 4's talk, piece I §5): Any news? by the count torn in the site's people's voice, Normal after a bind, the lords.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  out.start = corruptionLevel();
  out.bad = [setGreatGate('ember', 'torn'), setGreatGate('tine', 'open')];
  setGreatGate('tine', 'torn'); setGreatGate('uisce', 'torn'); setGreatGate('scath', 'sealed');
  out.two = corruptionLevel(); out.torn = corruptionTorn().join(',');
  setGreatGate('uisce', 'sealed'); out.undone = corruptionLevel();
  for (const s of ['tine', 'uisce', 'cloch', 'scath', 'solas']) setGreatGate(s, 'torn');
  out.five = corruptionLevel(); out.fiveFate = greatFate();
  setGreatGate('gaoth', 'sealed'); out.mixFate = greatFate();
  out.split = (() => { const p = ssSplitPayload(_buildSavePayload()); return { world: !!(p.w && p.w.wS && p.w.wS.greatGates), char: !!(p.c && p.c.wS && p.c.wS.greatGates) }; })();
  return out;
});
console.log(JSON.stringify(r));
check(`a new world stands at level 0 (${r.start})`, r.start === 0, r);
check('an unknown school or state changes nothing', r.bad.every(x => x === false), r);
check(`two torn and one sealed is level 2, the torn named for the horizon (${r.torn})`, r.two === 2 && r.torn === 'tine,uisce', r);
check(`a torn gate sealed again lowers the level (${r.undone})`, r.undone === 1, r);
check(`five torn and one sealed is level 5, fate still open`, r.five === 5 && r.mixFate === null, r);
check('the state is the world\'s: it rides the world row, not the character\'s', r.split.world && !r.split.char, r.split);
await page.evaluate(() => saveToSlot(0));
await page.reload();
await page.waitForFunction(() => { const b = document.getElementById('cb'); return b && typeof saveToSlot === 'function' && getComputedStyle(b).display !== 'none'; }, null, { timeout: 120000, polling: 100 });
await page.evaluate(() => document.getElementById('cb').click());
await page.waitForFunction(() => typeof corruptionLevel === 'function' && worldState.greatGates, null, { timeout: 120000, polling: 200 });
const s = await page.evaluate(() => {
  const out = { loaded: corruptionLevel() };
  out.lastTorn = setGreatGate('gaoth', 'torn'); out.fate = greatFate(); out.six = corruptionLevel();
  out.after = [setGreatGate('tine', 'sealed'), corruptionLevel(), greatFate()];
  return out;
});
console.log(JSON.stringify(s));
check(`a save and a load keep the five torn (${s.loaded})`, s.loaded === 5, s);
check('the sixth to match fixes the fate: six torn, level 6', s.lastTorn === true && s.fate === 'torn' && s.six === 6, s);
check('once fate is fixed nothing undoes it', s.after[0] === false && s.after[1] === 6 && s.after[2] === 'torn', s);
// the knot (Session 1346): a fresh state, a Tine spell at Comprehension
const k = await page.evaluate(() => {
  worldState.greatGates = { gates: {}, fate: null, fatedAt: null }; knownSpells.caor = 2; knownSpells.sioc = 1; delete knownSpells.smol;
  const m = () => worldState.masteries || 0, m0 = m(), out = {};
  out.cut = cutKnot('tine').ok; out.torn = [effTier('caor'), getSpellTier('caor'), m() - m0];
  out.cutTwice = cutKnot('tine').ok;
  const b = bindKnot('tine'); out.bound = [b.ok, b.again, effTier('caor'), getSpellTier('caor'), corruptionLevel()];
  bindKnot('uisce'); out.floor = [effTier('sioc'), effTier('smol')];
  out.recut = [cutKnot('tine').again, effTier('caor'), m() - m0];
  worldState.greatGates = { gates: {}, fate: null, fatedAt: null };
  return out; });
console.log(JSON.stringify(k));
check(`a torn school casts a tier deeper, the tier learned kept (Comprehension casts ${k.torn[0]}, learned ${k.torn[1]})`, k.torn[0] === 3 && k.torn[1] === 2, k);
check(`a cut that lifts a spell to Mastery is one Mastery touch (${k.torn[2]}); a torn knot will not cut again`, k.torn[2] === 1 && k.cut && k.cutTwice === false, k);
check(`binding a cut knot ends a tier below where it began (${k.bound[2]}), the level back to 0`, k.bound[0] && k.bound[1] && k.bound[2] === 1 && k.bound[3] === 2 && k.bound[4] === 0, k);
check(`a bound school never takes a spell below Impression, nor gives one not known (${k.floor})`, k.floor[0] === 1 && k.floor[1] === 0, k);
check(`cut again: the again line, Mastery cast, a second touch (${k.recut})`, k.recut[0] === true && k.recut[1] === 3 && k.recut[2] === 2, k);
await page.evaluate(() => devGreatGate('tine', 2055));
await enterDungeon(page, { theme: 'ruins', size: 'medium', seed: 2055 });
const d = await page.evaluate(() => {
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i] && (BAG[i].artifact || BAG[i].bookId === 'varek_note')) BAG.splice(i, 1);
  const L = KNOT_LIE, gen = window._lastGen, sp = gen && gen.spaces[gen.ring], out = { laid: !!L, school: L && L.school };
  if (!L) return out;
  out.onDais = Math.abs(L.x - dAt((sp.dais.x0 + sp.dais.x1) / 2)) < .01 && Math.abs(L.z - dAt((sp.dais.z0 + sp.dais.z1) / 2)) < .01 && L.floor === (sp.floor || 1) && !!L.mesh.parent;
  px = L.x + 1.5; pz = L.z; currentFloor = L.floor;
  out.near = knotNear(); out.seen = [knotTick(), knotTick(), !!worldState.greatGates.ev.ring.tine];
  const p = () => knotPrompt().replace(L.name, 'G');
  out.p0 = p(); out.u0 = knotUse();
  const knife = { name: 'Loosing Knife', ico: '🗡', type: 'quest', quest: true, artifact: 'looseKnife', weight: 0, qty: 1 }, needle = { name: 'Binding Needle', ico: '🪡', type: 'quest', quest: true, artifact: 'bindNeedle', weight: 0, qty: 1 };
  BAG.push(knife); out.p1 = p(); out.u1 = knotUse(); out.s1 = [greatGateState('tine'), effTier('caor')];
  BAG.push(needle); out.p2 = p(); out.u2 = knotUse(); out.s2 = [greatGateState('tine'), effTier('caor')];
  out.p3 = p();
  BAG.splice(BAG.indexOf(knife), 1); out.p4 = p(); out.u4 = knotUse();
  BAG.splice(BAG.indexOf(needle), 1);
  out.log = GAME_LOG.slice(-4).map(e => e.text.replace(L.name, 'G'));
  const ev = worldState.greatGates.ev; out.note = [!!ev.noteDue, ev.ringGate === L.name, !!ev.noteGiven]; out.gate = L.name;
  return out; });
console.log(JSON.stringify(d));
check('in a gate flagged great the knot stands over the ring chamber\'s dais', d.laid && d.school === 'tine' && d.onDais, d);
check('the ring is seen once, and remembered for the way back', d.near && d.seen[0] === true && d.seen[1] === false && d.seen[2], d);
check(`with nothing to act with, E examines (${d.u0}): "${d.p0}"`, d.p0 === 'The knot of G' && d.u0 === 'untied', d);
check(`with the knife it cuts: "${d.p1}"`, d.p1 === "The knot of G — Press 'E' to cut it" && d.u1 === 'cut' && d.s1[0] === 'torn' && d.s1[1] === 3, d);
check(`with the needle a cut knot binds: "${d.p2}"`, d.p2 === "The cut knot of G — Press 'E' to bind it" && d.u2 === 'bind' && d.s2[0] === 'sealed' && d.s2[1] === 1, d);
check(`a bound knot offers the cut again, and with neither tool is only looked at ("${d.p3}", "${d.p4}")`, d.p3 === "The bound knot of G — Press 'E' to cut it" && d.p4 === 'The bound knot of G' && d.u4 === 'examine', d);
check('the log keeps the ring and both acts', d.log.includes('Reached the ring of G.') && d.log.includes('Cut the knot of G.') && d.log.includes('Bound the knot of G again.'), d.log);
check('a ring reached with neither tool makes Varek\'s note due, naming that gate', d.note[0] && d.note[1] && !d.note[2], d.note);
// the knife (Session 1353): out to the Ashfeld, sleep, read the note, lift the flagstone
const ash = await page.evaluate(() => { const f = siteAnywhere('ashfeld'); goToZone('world', f.x + 3, f.z + 3, 0, 'x'); return [f.x, f.z]; });
await page.waitForFunction(([x, z]) => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'world' && Math.hypot(px - x, pz - z) < 50, ash, { timeout: 60000, polling: 200 });
await g.cells();
const pre = await page.evaluate(() => { tickFlagstone(true); const F = FLAG_STONE; if (!F) return 'none'; px = F.x + .6; pz = F.z; return flagstonePrompt(); });
await page.evaluate(() => restAtBed(1));
await page.waitForFunction(() => BAG.some(it => it && it.bookId === 'varek_note'), null, { timeout: 30000, polling: 200 });
const n = await page.evaluate((gate) => {
  const out = {}, ev = worldState.greatGates.ev;
  out.log = GAME_LOG.some(e => e.text === 'A paper you did not put there is folded in your pack.');
  out.starBefore = liveMarkers().some(m => m.label === 'a flagstone');
  px = FLAG_STONE.x + .6; pz = FLAG_STONE.z;
  const i = BAG.findIndex(it => it && it.bookId === 'varek_note'); openBookReader(i);
  out.page = (BOOKS.find(b => b.id === 'varek_note').pages[0] || '').split(gate).length - 1;
  document.getElementById('book-overlay').style.display = 'none';
  out.read = !!ev.noteRead; out.star = liveMarkers().some(m => m.label === 'a flagstone');
  out.solid = solidAt(FLAG_STONE.x, FLAG_STONE.z);
  out.prompt = flagstonePrompt(); out.use = flagstoneUse();
  const k = BAG.find(it => it && it.artifact === 'looseKnife'); out.knife = k ? [k.name, k.unique, k.quest, k.desc.startsWith('an Scian · A knife of grey stone')] : null;
  out.took = GAME_LOG.some(e => e.text === 'Took the Loosing Knife from under the Ashfeld.');
  out.after = [flagstonePrompt(), liveMarkers().some(m => m.label === 'a flagstone')];
  depositToStash(BAG.indexOf(k)); out.stashed = !BAG.includes(k);
  const p = ssSplitPayload(_buildSavePayload()); out.rows = [JSON.stringify(p.c).includes('looseKnife'), !JSON.stringify(p.w).includes('looseKnife'), !!(p.w.wS.greatGates.ev.knifeLifted)];
  return out; }, d.gate);
console.log(JSON.stringify(n));
check('on waking the note is in the pack, and the log says so', n.log, n);
check(`the note names the ring reached (${n.page} times), and reading it stars the Ashfeld`, n.page === 2 && !n.starBefore && n.read && n.star, n);
check(`the flagstone asks nothing before the note and lifts after it: "${n.prompt}"`, pre === null && n.prompt === "A flagstone at the end of the path — Press 'E' to lift it" && n.use === true && !n.solid, n);
check('under it the Loosing Knife: unique, a quest item, its card as written, the log line', !!n.knife && n.knife[0] === 'The Loosing Knife' && n.knife[1] && n.knife[2] && n.knife[3] && n.took, n);
check('lifted once: no prompt, no star', n.after[0] === null && n.after[1] === false, n.after);
check('the knife cannot be stashed; it rides the character\'s row, the lifting the world\'s', !n.stashed && n.rows.every(Boolean), n);
// the way back (Session 1354)
const w = await page.evaluate(() => {
  const p = Object.assign({}, PORTALS[0], { theme: 'ruins', seed: 2055, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, lair: null, name: 'The Test Gate' });
  const q = Object.assign({}, p, { seed: 2056 }); window._gp = p; window._prevDScene = dScene;
  const out = { prompt: greatDoorPrompt(p), plain: greatDoorPrompt(q) };
  greatDoorChoice(p); out.choice = dlgOpen && dlgNPC && dlgNPC.topics.map(t => t.label).join(' / '); closeDialog();
  p._toRing = true; goToDungeon(p); return out; });
await page.waitForFunction(() => activeZoneId === 'dungeon' && scene === dScene && dScene !== window._prevDScene && document.getElementById('fd').style.opacity === '0', null, { timeout: 60000, polling: 200 });
const wl = await page.evaluate(() => ({ d: +Math.hypot(px - KNOT_LIE.x, pz - KNOT_LIE.z).toFixed(2), near: knotNear(), floor: currentFloor === KNOT_LIE.floor, msg: MSGEL.textContent, prompt: knotPrompt().replace(KNOT_LIE.name, 'G') }));
console.log(JSON.stringify(w), JSON.stringify(wl));
check(`a great gate whose ring you reached offers the way down at its door: "${w.prompt}"`, w.prompt === "The Test Gate — Press 'E' to go down to the ring" && w.plain === null && w.choice === 'Go down to the ring. / Go in. / Leave it.', w);
check(`going down lands you on the dais by the knot (${wl.d} m), with the draft's line`, wl.d < 2.5 && wl.near && wl.floor && wl.msg === 'The way to the ring is open. The hall does not ask the long way of you twice.' && wl.prompt === "The bound knot of G — Press 'E' to cut it", wl);
// the gifts (Session 1349), measured torn against not, in the gate the way back landed in
const gf = await page.evaluate(() => {
  const G = worldState.greatGates.gates, save = Object.assign({}, G), out = {};
  const m = () => ({ fire: _warded(40, { fire: true }), elem: _warded(40, { baseType: 'Fire Elemental' }), plain: _warded(40, {}), carry: maxCarry(), sea: shipTopSpeed() });
  for (const s of ['tine', 'cloch', 'gaoth', 'solas']) delete G[s]; out.off = m();
  for (const s of ['tine', 'cloch', 'gaoth']) G[s] = 'torn'; out.on = m();
  const live = ENEMIES.filter(e => !e.dead && e.floor === 1), z = e => dZoneAt(e.x, e.z, 1);
  const a = live.find(e => live.some(o => o !== e && z(o) === z(e) && z(e) >= 0)), b = a && live.find(o => o !== a && z(o) === z(a)), c = a && live.find(o => z(o) !== z(a) && z(o) >= 0);
  if (a && b && c) { const keep = [a, b, c].map(e => [e.baseType, e.hp]); [a, b, c].forEach(e => { e.baseType = 'Skeleton'; e.hp = e.maxHp; e._solasStruck = false; });
    out.offWard = solasWards(a); G.solas = 'torn'; out.ward = [solasWards(a), solasWards(b), solasWards(c)];
    a.hp = a.maxHp - 1; out.struck = [solasWards(a), solasWards(b), solasWards(c)];
    [a, b, c].forEach((e, i) => { e.baseType = keep[i][0]; e.hp = keep[i][1]; e._solasStruck = false; }); } else out.ward = 'no three foes in two zones';
  for (const k of Object.keys(G)) delete G[k]; Object.assign(G, save);
  return out; });
console.log(JSON.stringify(gf));
check(`Tine torn: fire takes half (${gf.off.fire} → ${gf.on.fire}, a Fire Elemental ${gf.off.elem} → ${gf.on.elem}), other blows whole`, gf.on.fire === Math.max(1, Math.round(gf.off.fire / 2)) && gf.on.elem === gf.on.fire && gf.on.plain === gf.off.plain, gf);
check(`Cloch torn: carry ×1.5 (${gf.off.carry} → ${gf.on.carry}); Gaoth torn: top speed ×1.5 (${gf.off.sea} → ${gf.on.sea})`, Math.abs(gf.on.carry - gf.off.carry * 1.5) < 1e-9 && Math.abs(gf.on.sea - gf.off.sea * 1.5) < 1e-9, gf);
check('Solas torn: the undead are at peace until one is struck, then its zone wakes and the next zone stays at peace', gf.offWard === false && Array.isArray(gf.ward) && gf.ward.every(x => x === true) && gf.struck[0] === false && gf.struck[1] === false && gf.struck[2] === true, gf);
// the talk (Session 1350)
const tk = await page.evaluate(() => {
  const g = worldState.greatGates, save = JSON.parse(JSON.stringify(g)), site = siteAnywhere('ironhaven'), P = peopleOfSite(site), out = { P };
  const all = Object.values(GATE_TALK).map(r => r[P]), has = l => liveRumours(site).includes(l), any = () => liveRumours(site).filter(l => all.includes(l));
  g.gates = {}; g.fate = null; g.last = null; out.none = [any().length, greatGateLordTopics(site).length];
  g.gates = { tine: 'torn', uisce: 'torn', cloch: 'torn', scath: 'torn' }; g.last = { day: dayNow(), kind: 'torn' };
  out.four = [has(GATE_TALK[4][P]), any().length, greatGateLordTopics(site).map(t => t.label + '|' + (t.response === GATE_LORDS.gatelands.torn)).join()];
  bindKnot('tine'); out.bound = [has(GATE_TALK.normal[P]), has(GATE_TALK[3][P]), greatGateLordTopics(site)[0].response === GATE_LORDS.gatelands.sealed];
  worldState.gameTimeAbsMinutes += 8 * 1440; out.later = [has(GATE_TALK[3][P]), has(GATE_TALK.normal[P])];
  worldState.gameTimeAbsMinutes -= 8 * 1440; worldState.greatGates = save; return out; });
console.log(JSON.stringify(tk));
check(`no great gate touched, no talk of them and no lord's topic (${tk.P})`, tk.none[0] === 0 && tk.none[1] === 0, tk);
check(`four torn: the fourth line in the site's own voice, one line only, and the Crown's lord on the tear`, tk.four[0] && tk.four[1] === 1 && tk.four[2] === 'The great gates?|true', tk);
check('a bind: the Normal line instead for seven days, the lord on the seal; then the count\'s line again', tk.bound[0] && !tk.bound[1] && tk.bound[2] && tk.later[0] && !tk.later[1], tk);
// the tolls' start and Uisce's water (Session 1357; the sheet's session 4, piece III): the log's line once, at the third tear; two
// fish a catch in the Gatelands' waters while Uisce is torn, none there once three are torn, and the catch again when it is bound
const tl = await page.evaluate(() => {
  const keep = JSON.stringify(worldState.greatGates || null), swim = isSwimming, logN = () => GAME_LOG.filter(e => e.text === 'Somewhere, something gave.').length;
  worldState.greatGates = { gates: {}, ev: {} }; const out = { at: [] };
  for (const s of ['tine', 'uisce', 'cloch', 'scath']) { cutKnot(s); out.at.push(logN()); }
  out.flag = !!worldState.greatGates.ev.toll;
  const P0 = [px, pz], cv = siteAnywhere('coeur_de_vie'); px = cv.x; pz = cv.z; /* the Crown's seat: the Gatelands */
  isSwimming = () => true; const school = { cx: px, cz: pz, r: 3, y: jumpY, cool: 0, chunk: 'toll:test' }; LIFE.fish.push(school);
  const fish = () => BAG.filter(it => it && it._typeKey === 'fish').reduce((n, it) => n + (it.qty || 1), 0);
  const catchN = () => { school.cool = 0; const a = fish(), ok = catchFish(); return [ok, fish() - a]; };
  out.waters = uisceWaters();
  worldState.greatGates = { gates: { uisce: 'torn' }, ev: {} }; out.face = catchN(); out.tollOff = gateToll('uisce');
  worldState.greatGates.gates.tine = 'torn'; worldState.greatGates.gates.cloch = 'torn'; out.toll = [gateToll('uisce'), fishPrompt(), catchN()];
  worldState.greatGates.gates.uisce = 'sealed'; out.bound = [gateToll('uisce'), catchN()];
  LIFE.fish.splice(LIFE.fish.indexOf(school), 1); isSwimming = swim; [px, pz] = P0; worldState.greatGates = JSON.parse(keep);
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i] && BAG[i]._typeKey === 'fish') BAG.splice(i, 1);
  return out; });
console.log(JSON.stringify(tl));
check(`the tolls begin at three torn: *Somewhere, something gave.* once in the log, and a fourth tear adds none (${tl.at})`, tl.at.join() === '0,0,1,1' && tl.flag, tl);
check('Uisce torn, in the Gatelands\' waters: a catch brings two fish; from three torn, no fish there and no prompt; bound, one again', tl.waters && tl.face[0] && tl.face[1] === 2 && !tl.tollOff && tl.toll[0] && tl.toll[1] === null && tl.toll[2][0] === false && tl.toll[2][1] === 0 && !tl.bound[0] && tl.bound[1][0] && tl.bound[1][1] === 1, tl);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
