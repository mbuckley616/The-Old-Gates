// The Noon Ring's trial (Session 800; the page's Sky row, the approved draft's second run §4): the ring lies on a cairn at the
// top of a home-island peak picked from the seed. The first time you come within ten units, the draft's line, once. *Press 'E'
// to take the ring* within 2.2; E tries the hour (noon, the game's hour 12), then the sky (clear), then Swiftness 30, each with
// the draft's failing line, costing nothing and kept for the Journal. At noon, clear, Swiftness 30: the draft's words and log
// line, the ring in the bag, the band gone from the cairn; E at the cairn after says what is left. The hermit gives the way,
// and towns near the peak tell of it while it lies there.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const place = await page.evaluate(() => { delete worldState.artifacts; delete worldState.artifactTries; if (worldState.stats) { delete worldState.stats.ringSeen; }
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1);
  const P = artifactPlaces().sundial_ring; if (!P) return { none: true }; const [ci, cj] = cellOf(P.x, P.z); const c = getCell(ci, cj);
  return { ...P, nation: nationKeyOf(ci, cj), inCell: !!(c.peaks || []).find(p => p.id === P.peak), again: artifactPlaces().sundial_ring.peak }; });
console.log('place', JSON.stringify(place));
check(`the ring's peak is ${place.name} (${place.peak}): a home-island peak, the same on a second call`, !place.none && place.nation === 'gatelands' && place.inCell && place.again === place.peak, place);

// rumour, before anything is taken: a town within a cell of the peak tells of it
const rumour = await page.evaluate(() => { const P = artifactPlaces().sundial_ring; const [pi, pj] = cellOf(P.x, P.z); let site = null;
  for (let i = pi - 1; i <= pi + 1 && !site; i++) for (let j = pj - 1; j <= pj + 1 && !site; j++) { const c = getCell(i, j); if (c && c.sites) site = c.sites.find(t => t.kind === 'town' || t.kind === 'village' || t.kind === 'port'); }
  if (!site) return { none: true }; const r = liveRumours(site); return { site: site.name, has: r.some(x => x.startsWith(`There's gold on the cairn at the top of ${P.name}.`)) }; });
check(`at ${rumour.site}, near the peak, a rumour of the gold on the cairn`, !rumour.none && rumour.has, rumour);

// go there: the cairn is built once the peak's cell is loaded
await page.evaluate(() => { const P = artifactPlaces().sundial_ring; px = P.x + 30; pz = P.z + 30; });
let cairn = null;
for (let k = 0; k < 40; k++) { await page.waitForTimeout(1500);
  cairn = await page.evaluate(() => { const P = artifactPlaces().sundial_ring; px = P.x + 30; pz = P.z + 30; tickRingCairn(true); const C = RING_CAIRN; if (!C) return null;
    let top = -1e9; for (let dx = -24; dx <= 24; dx += 1) for (let dz = -24; dz <= 24; dz += 1) if (dx * dx + dz * dz <= 576) top = Math.max(top, worldH(P.x + dx, P.z + dz));
    return { x: C.x, z: C.z, y: C.y, top, centre: worldH(P.x, P.z), inScene: C.mesh.parent === WORLD.scene, ring: C.ring.visible, off: Math.hypot(C.x - P.x, C.z - P.z) }; });
  if (cairn) break; }
console.log('cairn', JSON.stringify(cairn));
check(`the cairn stands at the peak's top: height ${cairn && cairn.y.toFixed(1)}, the highest ground within 24 is ${cairn && cairn.top.toFixed(1)}, the centre ${cairn && cairn.centre.toFixed(1)}`,
  cairn && cairn.inScene && cairn.ring && cairn.y >= cairn.top - 1.5 && cairn.y > cairn.centre - .01 && cairn.off <= 24, cairn);

// the cairn is the look builder's prop (Session 1372): dry-laid courses and a top stone, the ring in its hollow at chest height
const prop = await page.evaluate(() => { const C = RING_CAIRN; let tris = 0, draws = 0; C.mesh.traverse(o => { if (o.isMesh) { draws++; const gg = o.geometry; tris += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; } });
  C.mesh.updateMatrixWorld(true); const v = new THREE.Vector3(); C.ring.getWorldPosition(v);
  return { prop: !!C.mesh.getObjectByName('ringCairn'), cut: !!C.mesh.getObjectByName('ringCut'), tris: Math.round(tris), draws, ringUp: v.y - meshH(C.x, C.z), sunk: C.mesh.position.y - meshH(C.x, C.z) }; });
console.log('prop', JSON.stringify(prop));
check(`the cairn is the prop: ${prop.tris} triangles in ${prop.draws} draws, the line and the hollow cut, the ring ${prop.ringUp.toFixed(2)} m over the drawn ground`,
  prop.prop && prop.cut && prop.tris > 800 && prop.tris < 4000 && prop.draws <= 5 && prop.ringUp > 1.1 && prop.ringUp < 1.45 && Math.abs(prop.sunk) < .01, prop);

await page.evaluate(() => { window._said = []; const sm = showMsg, sl = showMsgLong; showMsg = function (t) { window._said.push(t); return sm.apply(this, arguments); };
  showMsgLong = function (t) { window._said.push(t); return sl.apply(this, arguments); };
  window._put = d => { const C = RING_CAIRN; px = C.x + d; pz = C.z; }; ENEMIES.length = 0; });
// the first sight, through the loop
await page.evaluate(() => { _put(12); tickRingCairn(true); _put(9); tickRingCairn(true); tickRingCairn(true); });
await g.frames(4);
const seen = await page.evaluate(() => window._said.filter(t => t.startsWith('A cairn at the top of the world')).length);
check('within ten units the draft\'s line is said once', seen === 1, seen);

// the prompt, by the loop
await page.evaluate(() => { _put(1.6); forceTime(9); });
await g.frames(4);
const prompt = await page.evaluate(() => { _put(1.6); return document.getElementById('ipr').textContent; });
await g.frames(3);
const prompt2 = await page.evaluate(() => { _put(1.6); return document.getElementById('ipr').style.display !== 'none' ? document.getElementById('ipr').textContent : ''; });
check(`at 1.6 units the prompt reads *Press 'E' to take the ring*`, prompt2 === "Press 'E' to take the ring" || prompt === "Press 'E' to take the ring", { prompt, prompt2 });

const tries = await page.evaluate(() => { const out = {}; const said = () => window._said[window._said.length - 1];
  const at = (h, sky, sw) => { forceTime(h); WX.type = sky; WX.next = sky; WX.k = 1; ATTRS.swiftness = sw; _put(1.6); window._said.length = 0; interact(); return said(); };
  out.hour = at(9, 'clear', 40); out.hourLate = at(13.2, 'clear', 40); out.sky = at(12.3, 'rain', 40); out.fog = at(12.5, 'fog', 40); out.swift = at(12.5, 'clear', 20);
  out.taken = !!artifactState('sundial_ring'); out.tries = (worldState.artifactTries || {}).sundial_ring; out.notYet = (artifactsNotYet().find(r => r.id === 'sundial_ring') || {}).text;
  out.take = at(12.5, 'clear', 30); out.log = (worldState.journal || []).slice(-3).map(j => j.text || j.t || j[1] || JSON.stringify(j));
  out.bag = BAG.filter(it => it.artifact === 'sundial_ring').map(it => it.name); out.ringShown = RING_CAIRN.ring.visible;
  out.after = at(12.5, 'clear', 30); out.bag2 = BAG.filter(it => it.artifact === 'sundial_ring').length; return out; });
console.log('tries', JSON.stringify(tries));
check('at 9h: *The ring will not lift. The light is wrong for it.*; at 13h the same', tries.hour === 'The ring will not lift. The light is wrong for it.' && tries.hourLate === tries.hour, tries);
check('at noon in rain or fog: *Noon, and no sun to read it by.*', tries.sky === 'Noon, and no sun to read it by. The ring stays where it is.' && tries.fog === tries.sky, tries);
check('at noon, clear, Swiftness 20: the shadow is off the line; nothing taken, the tries kept for the Journal', /^The cairn’s shadow is already off the line/.test(tries.swift) && !tries.taken && tries.tries && tries.tries.n === 5
  && /^The Noon Ring — .*\. Swiftness 30\.$/.test(tries.notYet || ''), tries);
check(`at noon, clear, Swiftness 30: taken in the draft's words, the log names ${place.name}, the ring in the bag, the band gone from the cairn`,
  tries.take === 'At noon the cairn has no shadow, and the ring is only a ring. It comes up into your hand.' && tries.bag.length === 1 && tries.bag[0] === 'The Noon Ring' && !tries.ringShown
  && JSON.stringify(tries.log).includes(`Took the Noon Ring from the cairn on ${place.name}.`), tries);
check('E at the cairn after: *An empty hollow in the top stone…*, and nothing more is taken', tries.after === 'An empty hollow in the top stone, and a line no shadow reaches at noon.' && tries.bag2 === 1, tries);
await g.frames(4);
const prompt3 = await page.evaluate(() => { _put(1.6); return document.getElementById('ipr').textContent; });
check("taken, the prompt reads *Press 'E' to look at the cairn*", prompt3 === "Press 'E' to look at the cairn", prompt3);

// the hermit: the way while it lies there (asked before), *Gone* after
const hermit = await page.evaluate(() => { const site = { x: 0, z: 0 }; const row = () => { const f = hermitMakersTopics(site)[0].follow.find(t => t.label === 'The Sky’s?'); return f ? f.response : null; };
  const after = row(); const S = worldState.artifacts.sundial_ring; delete worldState.artifacts.sundial_ring; const before = row(); worldState.artifacts.sundial_ring = S; return { before, after }; });
check('the hermit\'s *The Sky’s?* gives the way to the cairn, and *Gone from where it lay* once taken', (hermit.before || '').includes(`on the cairn at the top of ${place.name}`) && hermit.after === 'Gone from where it lay. You know where. Or someone does.', hermit);
const rumour2 = await page.evaluate(() => { const P = artifactPlaces().sundial_ring; const [pi, pj] = cellOf(P.x, P.z); const out = [];
  for (let i = pi - 1; i <= pi + 1; i++) for (let j = pj - 1; j <= pj + 1; j++) { const c = getCell(i, j); if (c && c.sites) c.sites.forEach(t => { if (t.kind === 'town' || t.kind === 'village' || t.kind === 'port') out.push(...liveRumours(t)); }); }
  return out.filter(x => x.startsWith("There's gold on the cairn")).length; });
check('taken, no town tells of the gold on the cairn', rumour2 === 0, rumour2);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
