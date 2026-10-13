// The hermit and the altars (Session 792; the approved draft *The Makers' Things*, §§2–3): every camp's hermit is Old Blood and
// has a folder on the six tools, an entry for each that lies where it was left (with the way to it), *Gone* for one taken, and
// the seventh always; all six taken, the folder says so. At a shrine whose god's tool is untaken, the first prayer there logs the
// tool's old name, once a shrine.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const ids = await page.evaluate(() => { WORLD.anchoredPlaces(); const s = siteAnywhere('dunmore'); const near = (k) => allSites().filter(t => t.kind === k).sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z))[0];
  const c = near('camp'), sh = near('shrine'); delete worldState.artifacts; delete worldState.shrineVerse; delete worldState.shrines; px = c.x; pz = c.z; return { camp: c.id, campName: c.name, shrine: sh.id, shrineName: sh.name }; });
await g.settle(ids.camp);
const r = await page.evaluate(({ camp }) => {
  const site = siteAnywhere(camp); const n = ZONES.world.npcs.find(n => n.def && n.def.role === 'Hermit' && n.g.parent && Math.hypot(n.g.position.x - site.x, n.g.position.z - site.z) < 40); const def = n && n.def;
  const out = { name: def && def.name, people: def && def.people }; const P = artifactPlaces();
  const folder = () => def.topics.find(t => t.label === 'Did the makers leave anything behind?');
  const F = folder(); out.ask = F && F.response; out.follow = F && F.follow.map(t => [t.label, t.response]);
  out.expect = { blade: `Eochair na Cloiche. You would say a sword. It stands in a stone by ${P.gate_blade.name}, ${compassWord(P.gate_blade.x - site.x, P.gate_blade.z - site.z)} of here, where anyone may look at it. Few can take it.`,
    cloak: `Brat na Máthar. The Mother's mantle. The master of ${P.wolf_cloak.name} sleeps on it. All her children lie down on it, and none of them knows why.` };
  // the blade taken, the lamp carried
  takeArtifact('gate_blade'); takeArtifact('waylamp'); const F2 = folder(); out.taken = F2.follow.map(t => [t.label, t.response]);
  // the lamp given back to an inn: it lies again
  worldState.artifacts.waylamp.yielded = 'inn'; out.hung = folder().follow.find(t => t.label === 'The Hearth’s?').response;
  // all six taken
  for (const k of Object.keys(ARTIFACTS)) if (!worldState.artifacts[k]) worldState.artifacts[k] = { taken: true, day: 1 }; delete worldState.artifacts.waylamp.yielded;
  const F3 = folder(); out.all = F3.response; out.allFollow = F3.follow.map(t => t.label + '=' + t.response.slice(0, 20));
  delete worldState.artifacts;
  // the altars, by god
  out.verses = {}; for (const G of GODS) { delete worldState.shrineVerse; const said = GAME_LOG.length; out.verses[G.key] = altarVerse({ site: { id: 'test_' + G.key }, god: G }) ? GAME_LOG[GAME_LOG.length - 1].text : null; }
  delete worldState.shrineVerse; out.again = [altarVerse({ site: { id: 't1' }, god: GODS[0] }), altarVerse({ site: { id: 't1' }, god: GODS[0] }), altarVerse({ site: { id: 't2' }, god: GODS[0] })];
  delete worldState.shrineVerse; takeArtifact('drowned_bell'); out.takenAltar = altarVerse({ site: { id: 't3' }, god: GODS.find(x => x.key === 'muir') }); delete worldState.artifacts; delete worldState.shrineVerse;
  return out; }, ids);
console.log(JSON.stringify(r).slice(0, 2500));
check(`${ids.campName}'s hermit, ${r.name}, is Old Blood`, r.people === 'oldblood', r);
const L = (r.follow || []).map(x => x[0]);
check(`*Did the makers leave anything behind?* — *${r.ask}*, with ${L.join(', ')} (the blade's stone not yet in the world, Session 796)`, r.ask === 'Six things. One for each of the six with a shrine. Ask by name.' && L.join('|') === 'The Beasts’?|The Hearth’s?|And the seventh?', r.follow);
check(`the Beasts' gives the way: *${r.follow[0][1]}*`, r.follow[0][1] === r.expect.cloak && r.follow[1][1] === 'Lóchrann an Teallaigh. A lantern. It goes from inn to inn and the weather does not put it out. A theft does.' && r.follow[2][1] === 'The Guest has none. You do not leave a tool for a guest. You leave the door off the latch.', r.follow);
const T = Object.fromEntries(r.taken);
check('the blade and the lamp taken: their entries say *Gone from where it lay*; the lamp given back to an inn lies again', T['The Stone’s?'] === 'Gone from where it lay. You know where. Or someone does.' && T['The Hearth’s?'] === T['The Stone’s?'] && T['The Beasts’?'] === r.expect.cloak && /^Lóchrann/.test(r.hung), r.taken);
check(`all six taken: *${r.all}*`, r.all === 'Nothing is left lying. Everything the makers left is carried now. That has not been true for a long time.' && r.allFollow.length === 7, r.allFollow);
const V = { cloch: 'Eochair na Cloiche. The Stone’s key.', muir: 'Clog na Mara. The Sea’s bell.', speir: 'Fáinne an Lae. The ring of the day.', beithigh: 'Brat na Máthar. The Mother’s mantle.', teallach: 'Lóchrann an Teallaigh. The Hearth’s lantern.', fiodoir: 'Spól an Fhíodóra. The Weaver’s shuttle.' };
check('each of the six altars logs its tool\'s old name', Object.keys(V).every(k => r.verses[k] === `Cut under the altar’s lip, older than the rest: ${V[k]}`), r.verses);
check('once a shrine, and not once the tool is taken', r.again.join() === 'true,false,true' && r.takenAltar === false, r);
// a real prayer at the nearest shrine
await page.evaluate((id) => { const t = siteAnywhere(id); px = t.x; pz = t.z; }, ids.shrine);
await g.settle(ids.shrine);
const p = await page.evaluate((id) => { const S = WORLD.settle.get(id); px = S.altar.x; pz = S.altar.z + 1; delete worldState.shrines; delete worldState.shrineVerse; const n0 = GAME_LOG.length;
  shrineInteract(); const a = GAME_LOG.slice(n0).map(e => e.text); delete worldState.shrines; const n1 = GAME_LOG.length; shrineInteract(); const b = GAME_LOG.slice(n1).map(e => e.text);
  return { god: S.god && S.god.key, a, b }; }, ids.shrine);
console.log(JSON.stringify(p));
check(`praying at ${ids.shrineName} (${p.god}): *${p.a[p.a.length - 1]}*; the next day's prayer adds no verse`, p.a.length === 2 && p.a[1] === `Cut under the altar’s lip, older than the rest: ${V[p.god]}` && p.b.length === 1, p);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
