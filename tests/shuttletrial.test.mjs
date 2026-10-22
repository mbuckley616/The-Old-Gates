// The Shuttle's trial (Session 797; the page's Weaver row, the approved draft's second run §5): it lies on the floor of the
// deepest room of a home-island sigil gate picked from the seed, on the gate's lowest floor at the open cell farthest by walking
// from where you arrive there. The first time you come within four units, the draft's line, once. *Press 'E' to take up the
// shuttle* within 1.4; at Intelligence under 35 the hand closes beside it (costs nothing, the try kept), at 35 it is taken with
// the draft's words and log line. Taken, it is not laid again; another gate has none. The hermit now gives the way to it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const place = await page.evaluate(() => { delete worldState.artifacts; delete worldState.artifactTries; if (worldState.stats) delete worldState.stats.shuttleSeen;
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1);
  const P = artifactPlaces(), S = P.shuttle; if (!S) return { none: true }; const d = WORLD.doorAnywhere(S.door);
  const [ci, cj] = cellOf(d.x, d.z);
  return { ...S, kind: d.kind, sigil: !!d.sigil, wet: !!d.wet, lair: !!d.lairDoor, nation: nationKeyOf(ci, cj), blade: P.gate_blade && P.gate_blade.door, again: artifactPlaces().shuttle.door }; });
console.log('place', JSON.stringify(place));
check(`the Shuttle's gate is ${place.name} (seed ${place.door}): a home-island sigil cave gate, dry, not a lair, not the blade's`, !place.none && place.kind === 'cave_door' && place.sigil && !place.wet && !place.lair && place.nation === 'gatelands' && place.door !== place.blade && place.again === place.door, place);

const enter = async (seed) => {
  await page.evaluate((seed) => { const p = makePortalDef(WORLD.doorAnywhere(seed)); const wp = WORLD.dungeonPos[seed]; if (wp) { p.x = wp.x; p.z = wp.z; } p.zone = 'world'; px = p.x; pz = p.z + 3; window._gate = p; goToDungeon(p); }, seed);
  for (let k = 0; k < 60 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene)); k++) await page.waitForTimeout(500);
};
const leave = async () => {
  await page.evaluate(() => goToOW());
  for (let k = 0; k < 60 && !(await page.evaluate(() => activeZoneId === 'world')); k++) await page.waitForTimeout(500);
};
await page.evaluate(() => { window._said = []; const sm = showMsg; showMsg = function (t) { window._said.push(t); return sm.apply(this, arguments); }; });

await enter(place.door);
const lie = await page.evaluate(() => { const L = SHUTTLE_LIE; if (!L) return { none: true }; const fl = dMap2 ? 2 : 1, map = fl === 2 ? dMap2 : dMap;
  // the walking distance from the floor's arrival to every open cell, to compare with the spot
  const from = (fl === 2 && dStairC != null) ? { c: dStairC, r: dStairR } : { c: Math.round(dEntranceX), r: Math.round(dEntranceZ) };
  const D = map.map(row => row.map(() => -1)); const q = [[from.c, from.r]]; D[from.r][from.c] = 0; let max = 0;
  for (let h = 0; h < q.length; h++) { const [c, r] = q[h]; for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + dc, nr = r + dr; if (!map[nr] || map[nr][nc] == null || D[nr][nc] >= 0 || !map[nr][nc]) continue; D[nr][nc] = D[r][c] + 1; if (map[nr][nc] === 1) max = Math.max(max, D[nr][nc]); q.push([nc, nr]); } }
  return { x: L.x, z: L.z, floor: L.floor, floors: fl, cell: map[dCellOf(L.z)][dCellOf(L.x)], walk: D[dCellOf(L.z)][dCellOf(L.x)], /* S1283 — the map is cells, the Shuttle metres */ max, inScene: !!(L.mesh && L.mesh.parent === dScene), y: L.mesh.position.y }; });
console.log('lie', JSON.stringify(lie));
check(`it lies on the gate's lowest floor (${lie.floor}), on open floor, ${lie.walk} cells' walk from the arrival (the farthest is ${lie.max})`, !lie.none && lie.floor === lie.floors && lie.cell === 1 && lie.walk >= lie.max * 0.85 && lie.inScene, lie);

// the first sight, driven by the loop
const seen = await page.evaluate(() => { const L = SHUTTLE_LIE; window._put = (dx) => { currentFloor = L.floor; jumpY = L.floor === 2 ? FLOOR2_Y : 0; velY = 0; onGround = true; px = L.x + dx; pz = L.z; }; ENEMIES.forEach(e => { e.dead = true; }); window._put(3.5); window._said.length = 0; return true; });
await g.frames(6);
const s1 = await page.evaluate(() => ({ said: window._said.slice(), seen: worldState.stats && worldState.stats.shuttleSeen, prompt: document.getElementById('ipr').textContent }));
await page.evaluate(() => { window._put(-3.5); window._said.length = 0; });
await g.frames(6);
const s2 = await page.evaluate(() => window._said.slice());
console.log('seen', JSON.stringify(s1), JSON.stringify(s2));
check(`3.5 units off, the draft's line once: *${s1.said[0]}*`, s1.said.filter(t => t === 'Something small and pale lies on the floor under the sigil, the shape of a boat, or a fish, or neither.').length === 1 && s1.seen === 1 && !/shuttle/.test(s1.prompt) && s2.length === 0, { s1, s2 });

await page.evaluate(() => { window._put(0.8); });
await g.frames(4);
const prompt = await page.evaluate(() => document.getElementById('ipr').textContent);
check(`at 0.8 units the prompt reads *${prompt}*`, prompt === "Press 'E' to take up the shuttle", prompt);

const fail = await page.evaluate(() => { window._keepA = { ...ATTRS }; ATTRS.intelligence = 20; window._put(0.8); window._said.length = 0; const n0 = GAME_LOG.length; interact();
  return { said: window._said.slice(), taken: !!artifactState('shuttle'), inBag: BAG.some(it => it.artifact === 'shuttle'), still: !!(SHUTTLE_LIE && SHUTTLE_LIE.mesh.parent), tries: worldState.artifactTries && worldState.artifactTries.shuttle, log: GAME_LOG.slice(n0).map(e => e.text) }; });
console.log('fail', JSON.stringify(fail));
check(`Intelligence 20: *${fail.said[0]}*, nothing taken, the try kept for the journal`, fail.said[0] === 'You can see it, and you cannot see where it is. Your hand closes beside it every time. Not yet.' && !fail.taken && !fail.inBag && fail.still && fail.tries && fail.tries.n === 1, fail);

const take = await page.evaluate(() => { ATTRS.intelligence = 35; window._put(0.8); window._said.length = 0; const n0 = GAME_LOG.length; interact(); const it = BAG.find(it => it.artifact === 'shuttle');
  const r = { said: window._said.slice(), state: artifactState('shuttle'), item: it && it.name, unique: it && it.unique, lie: SHUTTLE_LIE === null, log: GAME_LOG.slice(n0).map(e => e.text), meshes: dScene.children.filter(o => o.isGroup && o.children.some(c => c.isPointLight && c.color.getHex() === 0xdfe8ff)).length };
  Object.assign(ATTRS, window._keepA); return r; });
await g.frames(3);
const after = await page.evaluate(() => { const el = document.getElementById('ipr'); return el.style.opacity === '0' || el.style.display === 'none' ? '' : el.textContent; });
console.log('take', JSON.stringify(take), after);
check(`Intelligence 35: *${take.said[0]}*; *${take.log[0]}*; The Shuttle in the bag, unique; gone from the floor`, take.said[0] === 'You pick it up the way you would pick up something you had put down a moment ago.' && take.log[0] === `Took the Shuttle from the deepest room of ${place.name}.` && take.state && take.state.taken && take.item === 'The Shuttle' && take.unique && take.lie && take.meshes === 0 && !/shuttle/.test(after), { take, after });
await leave();

await enter(place.door);
const again = await page.evaluate(() => ({ lie: SHUTTLE_LIE }));
check('taken, the gate holds nothing on a second visit', again.lie === null, again);
await leave();

const other = await page.evaluate((seed) => { delete worldState.artifacts; const P = artifactPlaces(); const d = P.gate_blade && P.gate_blade.door !== seed ? P.gate_blade.door : 42; return d; }, place.door);
await enter(other);
const o = await page.evaluate(() => ({ lie: SHUTTLE_LIE, seed: window._gate.seed }));
check(`another gate (seed ${o.seed}) has no Shuttle in it`, o.lie === null, o);
await leave();

// the hermit gives the way
const herm = await page.evaluate(() => { delete worldState.artifacts; const P = artifactPlaces(); const site = { x: P.shuttle.x + 100, z: P.shuttle.z }; const F = hermitMakersTopics(site)[0];
  const t = F.follow.find(x => x.label === 'The Weaver’s?'); takeArtifact('shuttle'); const t2 = hermitMakersTopics(site)[0].follow.find(x => x.label === 'The Weaver’s?'); delete worldState.artifacts;
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1);
  return { a: t && t.response, b: t2 && t2.response, name: P.shuttle.name }; });
check(`the hermit's *The Weaver’s?*: *${herm.a}*; taken, *Gone*`, herm.a === `Spól an Fhíodóra. A shuttle. It is in the deepest room of ${herm.name}. It shows where the unread stones are. Reading costs. It will cost you.` && /^Gone from where it lay/.test(herm.b || ''), herm);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
