// The great gates' two paths and the world's corruption level (card F12's number, Session 1340; Michael, 13 Oct 2026, lore §9a;
// visual-foundation.md §2). Each great gate is untouched, torn or sealed; the level is the number torn; any choice can be undone
// until all six share one state, and then the fate is fixed. The state is the world's: it rides the world row, and a save keeps it.
// Session 1346 (great-gates-build.md session 1): the knot. A torn school casts one tier deeper and a bound one a tier shallower
// (effTier), the tier learned untouched; a cut that lifts a spell to Mastery is a Mastery touch; in a gate flagged great the knot
// stands over the ring's dais and answers by what you carry (piece I's table).
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
  return out; });
console.log(JSON.stringify(d));
check('in a gate flagged great the knot stands over the ring chamber\'s dais', d.laid && d.school === 'tine' && d.onDais, d);
check('the ring is seen once, and remembered for the way back', d.near && d.seen[0] === true && d.seen[1] === false && d.seen[2], d);
check(`with nothing to act with, E examines (${d.u0}): "${d.p0}"`, d.p0 === 'The knot of G' && d.u0 === 'untied', d);
check(`with the knife it cuts: "${d.p1}"`, d.p1 === "The knot of G — Press 'E' to cut it" && d.u1 === 'cut' && d.s1[0] === 'torn' && d.s1[1] === 3, d);
check(`with the needle a cut knot binds: "${d.p2}"`, d.p2 === "The cut knot of G — Press 'E' to bind it" && d.u2 === 'bind' && d.s2[0] === 'sealed' && d.s2[1] === 1, d);
check(`a bound knot offers the cut again, and with neither tool is only looked at ("${d.p3}", "${d.p4}")`, d.p3 === "The bound knot of G — Press 'E' to cut it" && d.p4 === 'The bound knot of G' && d.u4 === 'examine', d);
check('the log keeps the ring and both acts', d.log.includes('Reached the ring of G.') && d.log.includes('Cut the knot of G.') && d.log.includes('Bound the knot of G again.'), d.log);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
