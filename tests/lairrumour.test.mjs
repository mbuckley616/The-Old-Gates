// The doubled glade's card line and canon §12's lair rumour (Session 729, the quest writer's Finding 27). A glade whose
// herbs a slain lair-beast has doubled (Session 719) reads *Glade · grown thick since the beast died* on the map. A town
// within two provinces (the 5×5 cells round it) speaks of a slain lair's beast, and of the thick glade when the lair's
// cell holds one; a live lair is spoken of only within 700, the reach at which it harms a town.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const lairs = [], glades = [], towns = [];
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) { const c = getCell(i, j); if (!c || !c.sites) continue;
    for (const t of c.sites) { if (t.kind === 'lair') lairs.push(t); else if (t.kind === 'glade') glades.push(t); else if (['city', 'town', 'village', 'port'].includes(t.kind)) towns.push(t); } }
  const D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z), cellIs = (a, b) => { const [ai, aj] = cellOf(a.x, a.z), [bi, bj] = cellOf(b.x, b.z); return { di: Math.abs(ai - bi), dj: Math.abs(aj - bj), same: ai === bi && aj === bj }; };
  const within2 = (a, b) => { const c = cellIs(a, b); return c.di <= 2 && c.dj <= 2; };
  const saved = worldState.lairs; worldState.lairs = {};
  const rum = (site) => liveRumours(site);
  const has = (L, re) => L.some(s => re.test(s));
  const out = { lairs: lairs.length, towns: towns.length };
  // the card: a lair whose nearest glade is within 700 and in its own cell
  const P = lairs.map(l => { const gl = glades.slice().sort((a, b) => D(a, l) - D(b, l))[0]; return { l, gl, d: D(l, gl) }; }).find(p => p.d <= 700 && cellIs(p.l, p.gl).same)
    || lairs.map(l => { const gl = glades.slice().sort((a, b) => D(a, l) - D(b, l))[0]; return { l, gl, d: D(l, gl) }; }).find(p => p.d <= 700);
  const card = (gl) => { const [ci, cj] = cellOf(gl.x, gl.z); const e = mapEntries(getCell(ci, cj)).find(e => e.id === gl.id); return e && e.sub; };
  if (P) { out.pair = { lair: P.l.name, glade: P.gl.name, d: Math.round(P.d), sameCell: cellIs(P.l, P.gl).same };
    out.cardAlive = card(P.gl); worldState.lairs[P.l.id] = 1440; out.cardDead = card(P.gl);
    const T = towns.find(t => within2(t, P.l)); if (T) { out.town = T.name; out.deadSaid = rum(T).filter(s => /Somebody killed/.test(s)); } worldState.lairs = {}; }
  // a live lair: a town within 700 hears of it, a town further off (but within two provinces) does not
  const near = [], far = [];
  for (const l of lairs) for (const t of towns) { if (!within2(t, l)) continue; (D(t, l) < 700 ? near : far).push({ l, t, d: D(t, l) }); }
  const N = near[0]; if (N) { out.near = { town: N.t.name, lair: N.l.name, d: Math.round(N.d), said: rum(N.t).filter(s => s.includes(N.l.name)) }; }
  const F = far.find(f => !near.some(n => n.t.id === f.t.id && n.l.id === f.l.id) && !lairs.some(l => l.id !== f.l.id && D(f.t, l) < 700)) || far[0];
  if (F) { out.far = { town: F.t.name, lair: F.l.name, d: Math.round(F.d), aliveSaid: rum(F.t).filter(s => s.includes(F.l.name)) };
    worldState.lairs[F.l.id] = 1440; out.far.deadSaid = rum(F.t).filter(s => s.includes(F.l.name)); worldState.lairs = {}; }
  // a lair beyond two provinces is never spoken of, dead or alive
  const X = towns.map(t => ({ t, l: lairs.find(l => !within2(t, l)) })).find(x => x.l); if (X) { worldState.lairs[X.l.id] = 1440; out.beyond = rum(X.t).filter(s => s.includes(X.l.name)).length; worldState.lairs = {}; }
  // a slain lair with no doubled glade in its cell: the sheep go that way again
  const S = lairs.map(l => ({ l, t: towns.find(t => within2(t, l)) })).find(x => { if (!x.t) return false; worldState.lairs = { [x.l.id]: 1440 }; const [ci, cj] = cellOf(x.l.x, x.l.z); const ok = !getCell(ci, cj).sites.some(t => t.kind === 'glade' && gladeDoubled(t)); worldState.lairs = {}; return ok; });
  if (S) { worldState.lairs[S.l.id] = 1440; out.sheep = rum(S.t).filter(s => s.includes(S.l.name)); worldState.lairs = {}; }
  worldState.lairs = saved; return out; });
console.log(JSON.stringify(r).slice(0, 1600));
check('a slain lair\'s nearest glade within 700 reads *Glade · grown thick since the beast died*; alive, *Glade*', r.cardAlive === 'Glade' && r.cardDead === 'Glade · grown thick since the beast died', { alive: r.cardAlive, dead: r.cardDead, pair: r.pair });
check('a town within two provinces names the dead lair, and the thick glade when it shares the lair\'s cell', r.deadSaid && r.deadSaid.length >= 1 && (r.pair && r.pair.sameCell ? r.deadSaid.some(s => s === `Somebody killed the thing at ${r.pair.lair}. The herbs have come up thick in ${r.pair.glade} since.`) : true), { town: r.town, said: r.deadSaid, pair: r.pair });
check('a live lair within 700 of a town is spoken of there', r.near && r.near.said.some(s => s === `Something lives up at ${r.near.lair}. The sheep won't graze that way, and you can't make them.`), r.near);
check('a live lair 700 or more off is not spoken of; slain, it is', r.far && r.far.d >= 700 && r.far.aliveSaid.length === 0 && r.far.deadSaid.length === 1, r.far);
check('a slain lair with no thick glade in its cell: *The sheep go that way again.*', r.sheep && r.sheep.length === 1 && /The sheep go that way again\.$/.test(r.sheep[0]), r.sheep);
check('a lair beyond two provinces is not spoken of, even slain', r.beyond === 0, r.beyond);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
