// The Gate-Blade's trial (Session 802; the page's Stone row, the approved draft's first run §5): the blade stands in a standing
// stone 8 to 18 units from its ruined gate's door, on open ground. The first time within ten units, the draft's line, once.
// *Press 'E' to take hold of the hilt* within 1.8; Might under 30 gives one of three lines by how short (logged, kept for the
// Journal); at 30 the draft's words and log line, the blade in the bag, the hilt gone from the stone; E at the stone after says
// what is left. The hermit gives the way, and the townland tells of it while it stands there.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const place = await page.evaluate(() => { delete worldState.artifacts; delete worldState.artifactTries; if (worldState.stats) delete worldState.stats.bladeSeen;
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1);
  const P = artifactPlaces().gate_blade; if (!P) return { none: true }; const d = WORLD.doorAnywhere(P.door); return { ...P, exterior: d.exterior, kind: d.kind }; });
console.log('place', JSON.stringify(place));
check(`the blade's gate is ${place.name}, a ruined gatehouse`, !place.none && place.kind === 'fort_door' && place.exterior === 'ruined_gatehouse', place);

await page.evaluate(() => { const P = artifactPlaces().gate_blade; px = P.x + 20; pz = P.z + 20; });
let B = null;
for (let k = 0; k < 40 && !B; k++) { await page.waitForTimeout(1500);
  B = await page.evaluate(() => { const P = artifactPlaces().gate_blade; px = P.x + 20; pz = P.z + 20; tickBladeStone(true); const S = BLADE_STONE; if (!S) return null;
    let clear = !solidAt(S.x, S.z); for (let q = 0; q < 8; q++) if (solidAt(S.x + Math.cos(q / 8 * Math.PI * 2) * 1.4, S.z + Math.sin(q / 8 * Math.PI * 2) * 1.4)) clear = false;
    return { x: S.x, z: S.z, off: Math.hypot(S.x - P.x, S.z - P.z), clear, inScene: S.mesh.parent === WORLD.scene, hilt: S.hilt.visible, again: (() => { const s2 = bladeStoneSpot(P); return s2 && s2.x === S.x && s2.z === S.z; })() }; }); }
console.log('stone', JSON.stringify(B));
check(`the stone stands ${B && B.off.toFixed(1)} units from the gate's door, on open ground, the same spot again`, B && B.off >= 7.99 && B.off <= 18.01 && B.clear && B.inScene && B.hilt && B.again, B);

const rumour = await page.evaluate(() => { const P = artifactPlaces().gate_blade; const [gi, gj] = cellOf(P.x, P.z); let site = null;
  for (let i = gi - 1; i <= gi + 1 && !site; i++) for (let j = gj - 1; j <= gj + 1 && !site; j++) { const c = getCell(i, j); if (c && c.sites) site = c.sites.find(t => ['town', 'village', 'port', 'city'].includes(t.kind)); }
  return site ? { site: site.name, has: liveRumours(site).some(x => x === `There's a sword in a stone out by ${P.name}. Half the young ones in the townland have had a pull at it. It's still there. So are they, mostly.`) } : { none: true }; });
check(`at ${rumour.site}, the rumour of the sword in the stone`, !rumour.none && rumour.has, rumour);

await page.evaluate(() => { window._said = []; const sm = showMsg, sl = showMsgLong; showMsg = function (t) { window._said.push(t); return sm.apply(this, arguments); };
  showMsgLong = function (t) { window._said.push(t); return sl.apply(this, arguments); };
  window._put = d => { const S = BLADE_STONE; px = S.x + d; pz = S.z; tickBladeStone(true); }; ENEMIES.length = 0; });
await page.evaluate(() => { _put(12); window._said.length = 0; _put(9); _put(5); });
await g.frames(3);
const seen = await page.evaluate(() => window._said.slice());
check('within ten units the draft\'s line, once', seen.length === 1 && seen[0].startsWith('A blade stands in a stone to a hand’s breadth below its guard.'), seen);

await page.evaluate(() => { _put(1.2); });
await g.frames(4);
const prompt = await page.evaluate(() => { _put(1.2); return document.getElementById('ipr').textContent; });
check("at 1.2 units the prompt reads *Press 'E' to take hold of the hilt*", prompt === "Press 'E' to take hold of the hilt", prompt);

const tries = await page.evaluate(() => { const at = m => { ATTRS.might = m; _put(1.2); window._said.length = 0; const n = GAME_LOG.length; interact(); return { said: window._said[0], log: GAME_LOG.slice(n).map(e => e.icon + ' ' + e.text) }; };
  const out = { m10: at(10), m19: at(19), m20: at(20), m26: at(26), m27: at(27), m29: at(29) }; out.taken0 = !!artifactState('gate_blade'); out.n = worldState.artifactTries.gate_blade.n;
  out.notYet = (artifactsNotYet().find(r => r.id === 'gate_blade') || {}).text; out.m30 = at(30); out.bag = BAG.filter(it => it.artifact === 'gate_blade').map(it => it.name); out.hilt = BLADE_STONE.hilt.visible;
  out.after = at(30); out.bag2 = BAG.filter(it => it.artifact === 'gate_blade').length; return out; });
console.log('tries', JSON.stringify(tries).slice(0, 1500));
const W = 'You might as well pull at the hill. The stone does not move.', M = 'The stone does not move. Not yet.', N = 'Something gives: a grain of grit, no more. Not yet.';
check('Might 10 and 19: *pull at the hill*; 20 and 26: *Not yet.*; 27 and 29: *a grain of grit*; each logged with 🗝', tries.m10.said === W && tries.m19.said === W && tries.m20.said === M && tries.m26.said === M && tries.m27.said === N && tries.m29.said === N
  && tries.m10.log[0] === '🗝 ' + W && tries.m29.log[0] === '🗝 ' + N, tries);
check('nothing taken short of 30; six tries kept; the Journal\'s line names the gate and Might 30', !tries.taken0 && tries.n === 6 && tries.notYet === `The Gate-Blade — ${place.name}. Might 30.`, tries.notYet);
check(`Might 30: the draft's words, the log names ${place.name}, the blade in the bag, the hilt gone from the stone`, tries.m30.said === 'It comes out of the stone the way a key comes out of a lock: all at once, after nothing.'
  && tries.m30.log.some(l => l.endsWith(`Took the Gate-Blade from the stone by ${place.name}.`)) && tries.bag.length === 1 && tries.bag[0] === 'The Gate-Blade' && !tries.hilt, tries.m30);
check('E at the stone after: *An empty slot in a standing stone…*, nothing more taken', tries.after.said === 'An empty slot in a standing stone. Looked at end on, it is the shape of a key.' && tries.bag2 === 1, tries.after);
await g.frames(4);
const p2 = await page.evaluate(() => { _put(1.2); return document.getElementById('ipr').textContent; });
check("taken, the prompt reads *Press 'E' to look at the stone*", p2 === "Press 'E' to look at the stone", p2);
const hermit = await page.evaluate(() => { const site = { x: 0, z: 0 }; const row = () => { const f = hermitMakersTopics(site)[0].follow.find(t => t.label === 'The Stone’s?'); return f ? f.response : null; };
  const P = artifactPlaces().gate_blade; const after = row(); const S = worldState.artifacts.gate_blade; delete worldState.artifacts.gate_blade; const before = row();
  const [gi, gj] = cellOf(P.x, P.z); let site2 = null; for (let i = gi - 1; i <= gi + 1 && !site2; i++) for (let j = gj - 1; j <= gj + 1 && !site2; j++) { const c = getCell(i, j); if (c && c.sites) site2 = c.sites.find(t => ['town', 'village', 'port', 'city'].includes(t.kind)); }
  worldState.artifacts.gate_blade = S; const rumAfter = liveRumours(site2).some(x => x.startsWith("There's a sword in a stone")); return { before, after, rumAfter }; });
check("the hermit's *The Stone’s?* gives the way, and *Gone from where it lay* once taken; no rumour after", (hermit.before || '').startsWith(`Eochair na Cloiche. You would say a sword. It stands in a stone by ${place.name},`)
  && hermit.after === 'Gone from where it lay. You know where. Or someone does.' && !hermit.rumAfter, hermit);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
