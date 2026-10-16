// The Drowned Bell's trial (Session 801; the page's Sea row, the approved draft's second run §2): the bell hangs from the last
// beam of a wreck on a rock off a home-island port, picked from the seed. The sea does not move in the world, so the wreck
// does: at high tide only the mast stands out, at low tide (hours 0–6 and 12–18) the ribs and the beam. The first time within
// forty units, the draft's line for the tide, once, and the Journal's line from then. At high tide E at the mast: *The sea has
// it now.* At low tide *Press 'E' to take the bell*, and E takes it with the draft's words and log line; after, *An empty beam…*.
// The hermit gives the way, and the coast near it tells of it while it hangs there.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const place = await page.evaluate(() => { delete worldState.artifacts; delete worldState.artifactTries; if (worldState.stats) delete worldState.stats.bellSeen;
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1);
  const P = artifactPlaces().drowned_bell; if (!P) return { none: true }; const port = siteAnywhere(P.port); const [ci, cj] = cellOf(port.x, port.z); const c = getCell(...cellOf(P.x, P.z));
  return { ...P, kind: port.kind, nation: nationKeyOf(ci, cj), off: Math.hypot(P.x - port.x, P.z - port.z), sea: seaBare(P.x, P.z, c.islets), again: artifactPlaces().drowned_bell.x === P.x }; });
console.log('place', JSON.stringify(place));
check(`the bell's wreck lies off ${place.coast}, a home-island port, ${place.off && place.off.toFixed(0)} units out in open sea; the same on a second call`,
  !place.none && place.kind === 'port' && place.nation === 'gatelands' && place.off >= 50 && place.off <= 140 && place.sea >= .98 && place.again, place);

const rumour = await page.evaluate(() => { const P = artifactPlaces().drowned_bell; const r = liveRumours(siteAnywhere(P.port)); return r.some(x => x.startsWith(`There's a wreck on the rock off ${P.coast} that only shows at the ebb.`)); });
check(`at ${place.coast}, a rumour of the wreck`, rumour, rumour);

// go there; the wreck is built within 400 units. Wait for the port's own discovery too (its cell loaded, tickDiscovery's half-second
// come round), or its *discovered · +50 XP* toast lands among the mast's lines below (Session 946: FLAKY twice on 15 Oct)
await page.evaluate(() => { const P = artifactPlaces().drowned_bell; const t = siteAnywhere(P.port); px = t.x; pz = t.z; });
let W = null, portFound = false;
for (let k = 0; k < 40 && !(W && portFound); k++) { await page.waitForTimeout(1500);
  ({ W, portFound } = await page.evaluate(() => { const P = artifactPlaces().drowned_bell; const t = siteAnywhere(P.port); px = t.x; pz = t.z; tickBellWreck(true);
    return { W: BELL_WRECK ? { x: BELL_WRECK.x, z: BELL_WRECK.z } : null, portFound: discovered(P.port) }; })); }
check('the wreck is built near its port', !!W, W);
check('standing at the port, the port is discovered before the wreck is visited', portFound, portFound);

await page.evaluate(() => { window._said = []; const sm = showMsg, sl = showMsgLong; showMsg = function (t) { window._said.push(t); return sm.apply(this, arguments); };
  showMsgLong = function (t) { window._said.push(t); return sl.apply(this, arguments); };
  window._at = (h, d, toBell) => { forceTime(h); const W = BELL_WRECK; tickBellWreck(true); if (toBell) { const b = bellPos(); px = b.x + d; pz = b.z; } else { px = W.x + d; pz = W.z; } tickBellWreck(true); };
  ENEMIES.length = 0; });

// the tide moves the wreck: high at 8h, low at 3h and 14h
const ys = await page.evaluate(() => { const y = h => { forceTime(h); tickBellWreck(true); return +BELL_WRECK.mesh.position.y.toFixed(2); }; return { h8: y(8), h3: y(3), h14: y(14), h20: y(20), h6: y(6), h630: y(6.6) }; });
check('the wreck sits low at high tide (8h, 20h) and is out at low tide (3h, 14h), easing through the turn at 6h', ys.h8 < -2 && ys.h20 < -2 && ys.h3 === 0 && ys.h14 === 0 && ys.h6 < 0 && ys.h6 > ys.h8 && ys.h630 === ys.h8, ys);

// first sight at high tide: the mast's line, once
await page.evaluate(() => { _at(8, 45); window._said.length = 0; _at(8, 35); _at(8, 30); });
await g.frames(3);
const seen = await page.evaluate(() => ({ said: window._said.slice(), notYet: (artifactsNotYet().find(r => r.id === 'drowned_bell') || {}).text }));
check('within forty units at high tide, *A mast stands up out of the sea…*, once; the Journal\'s line from then', seen.said.filter(t => t.startsWith('A mast stands up out of the sea off the rock')).length === 1
  && seen.said.length === 1 && seen.notYet === `The Drowned Bell — in the wreck on the rock off ${place.coast}. At low tide.`, seen);

// high tide: no prompt; E at the mast says the sea has it
await page.evaluate(() => { _at(8, 1.5); });
await g.frames(4);
const high = await page.evaluate(() => { _at(8, 1.5); const pr = document.getElementById('ipr'); const prompt = pr.style.display !== 'none' && pr.style.opacity !== '0' ? pr.textContent : ''; window._said.length = 0; interact();
  return { prompt, said: window._said.slice(), taken: !!artifactState('drowned_bell'), n: worldState.artifactTries.drowned_bell.n }; });
check('at high tide, by the mast: no bell prompt; E says *The sea has it now. It gives it back twice a day.*, nothing taken', !/bell/.test(high.prompt) && high.said[0] === 'The sea has it now. It gives it back twice a day.' && !high.taken && high.n === 1, high);

// low tide: the prompt by the bell, and E takes it
await page.evaluate(() => { _at(3, 1.2, true); });
await g.frames(4);
const low = await page.evaluate(() => { _at(3, 1.2, true); const prompt = document.getElementById('ipr').textContent; window._said.length = 0; interact();
  return { prompt, said: window._said.slice(), log: GAME_LOG.slice(-2).map(e => e.text), bag: BAG.filter(it => it.artifact === 'drowned_bell').map(it => it.name), shown: BELL_WRECK.bell.visible,
    notYet: artifactsNotYet().some(r => r.id === 'drowned_bell') }; });
check("at low tide, by the beam: *Press 'E' to take the bell*", low.prompt === "Press 'E' to take the bell", low);
check(`E takes it in the draft's words; the log names ${place.coast}; the bell is in the bag and gone from the beam; the Journal's line is gone`,
  low.said[0] === 'The bell comes off its beam green to the lip. You knock it on the ribs getting it out, and it does not ring.' && low.log.includes(`Took the Drowned Bell from the wreck off ${place.coast}.`)
  && low.bag.length === 1 && low.bag[0] === 'The Drowned Bell' && !low.shown && !low.notYet, low);
await g.frames(4);
const after = await page.evaluate(() => { _at(14, 1.2, true); const prompt = document.getElementById('ipr').textContent; window._said.length = 0; interact(); const lowSaid = window._said.slice();
  _at(9, 1.2); window._said.length = 0; interact(); return { prompt, lowSaid, highSaid: window._said.slice(), bag: BAG.filter(it => it.artifact === 'drowned_bell').length }; });
check('after, at low tide: *An empty beam…*; at high tide no wreck line (E falls through); one bell in the bag', after.lowSaid[0] === 'An empty beam, and a bright ring of wood where something hung for a long time.' && !after.highSaid.some(t => /sea has it|empty beam|bell comes off/.test(t)) && after.bag === 1, after);
await page.evaluate(() => { _at(14, 1.2, true); });
await g.frames(4);
const p2 = await page.evaluate(() => { _at(14, 1.2, true); return document.getElementById('ipr').textContent; });
check("taken, at low tide the prompt reads *Press 'E' to look at the wreck*", p2 === "Press 'E' to look at the wreck", p2);

const hermit = await page.evaluate(() => { const site = { x: 0, z: 0 }; const row = () => { const f = hermitMakersTopics(site)[0].follow.find(t => t.label === 'The Sea’s?'); return f ? f.response : null; };
  const after = row(); const S = worldState.artifacts.drowned_bell; delete worldState.artifacts.drowned_bell; const before = row(); const rum = liveRumours(siteAnywhere(artifactPlaces().drowned_bell.port)).some(x => x.startsWith("There's a wreck on the rock"));
  worldState.artifacts.drowned_bell = S; const rumAfter = liveRumours(siteAnywhere(artifactPlaces().drowned_bell.port)).some(x => x.startsWith("There's a wreck on the rock")); return { before, after, rum, rumAfter }; });
check("the hermit's *The Sea’s?* gives the way, and *Gone from where it lay* once taken; the rumour only while it hangs there", /^Clog na Mara\. A bell\. It hangs in a wreck on a rock the sea owns twice a day, \S+ of here\./.test(hermit.before || '')
  && hermit.after === 'Gone from where it lay. You know where. Or someone does.' && hermit.rum && !hermit.rumAfter, hermit);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
