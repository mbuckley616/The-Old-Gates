// One name per place, world-wide (Michael's A on DECISION #110), Session 432. The world drew every village, town, city,
// port and outpost from its culture's hundred names: 610 places held 368 names, two ports in one realm were both
// *Woushstouir*, and six harbourmasters offered *Passage to* their own harbour's name. Now one pass over the whole grid
// gives each place its own name; Home's hand-placed towns keep theirs.
import { boot, check } from './lib/game.mjs';
const KINDS = ['village', 'town', 'city', 'port', 'outpost'];
const HOME = ['Dunmore', 'Portclare', 'Ironhaven', 'Hearthwick', 'Ashenmoor', 'Carraig Mór', 'Coeur de Vie', 'Salthaven'];

// a fresh page, asked for a far corner first. The boot already makes every cell (that ask takes 0 ms), so this is a
// second boot's names against the first's; the order cannot matter by construction (the pass runs once all 144 exist)
let g = await boot(); let { page } = g;
const first = await page.evaluate(([K]) => {
  const t0 = performance.now(); WORLD.getCell(11, 0); const ms = performance.now() - t0;
  const names = {}; for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) WORLD.getCell(i, j).sites.forEach(t => { if (K.includes(t.kind) || t.kind === 'garrison') names[t.id] = t.name; });
  return { ms, names };
}, [KINDS]);
await g.close();

g = await boot(); page = g.page;
await g.intoWorld();
const r = await page.evaluate(([K, H]) => {
  WORLD.anchoredPlaces(); const all = [];
  for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) WORLD.getCell(i, j).sites.forEach(t => all.push(t));
  const home = WORLD.getCell(5, 10).sites.map(t => t.name);
  const settled = all.filter(t => K.includes(t.kind) || t.kind === 'garrison');
  const names = settled.map(t => t.name); const dups = names.filter((x, i) => names.indexOf(x) !== i);
  const renamed = settled.filter(t => t.drawnName); const drawn = settled.map(t => t.drawnName || t.name);
  const ports = WORLD.allPorts(); const selfPassage = [];
  for (const p of ports) for (const t of WORLD.ferryTopics(p)) { const m = /^Passage to (.+) \(/.exec(t.label); if (m && m[1] === p.name) selfPassage.push(p.name); }
  const byId = {}; settled.forEach(t => { byId[t.id] = t.name; });
  return { n: settled.length, uniq: new Set(names).size, dups: [...new Set(dups)].slice(0, 10), drawnUniq: new Set(drawn).size,
    renamed: renamed.length, sample: renamed.slice(0, 6).map(t => `${t.drawnName} → ${t.name} (${t.reg})`),
    longer: { irish: renamed.filter(t => t.reg === 'irish' && /^(Bally|Kil|Dun|Carrig|Glen|Rath|Cnoc|Inis|Cluain|Lis|Ard|Tully)na/.test(t.name)).length,
      french: renamed.filter(t => t.reg === 'french' && /-(sur-Mer|le-Vieux|la-Forêt|en-Val|les-Prés|sous-Bois)$/.test(t.name)).length },
    numbered: names.filter(x => / \d+$/.test(x)),
    homeKept: H.filter(h => home.includes(h)), homeElsewhere: settled.filter(t => H.includes(t.name) && !home.includes(t.name)).length,
    ports: ports.length, portUniq: new Set(ports.map(p => p.name)).size, selfPassage,
    woush: names.filter(x => x === 'Woushstouir').length, byId };
}, [KINDS, HOME]);
const { byId, ...shown } = r; console.log(JSON.stringify(shown));

check('every settlement in the world has its own name', r.n > 600 && r.uniq === r.n, r.dups);
check('before the pass they shared names (the drawn names repeat), so the pass did the work', r.drawnUniq < r.n - 200, { drawnUniq: r.drawnUniq, n: r.n });
check('only places that had to lose a name were renamed (one per repeat, and the few that drew a name of Home\'s)', r.renamed >= r.n - r.drawnUniq && r.renamed <= r.n - r.drawnUniq + 20, { renamed: r.renamed, minimum: r.n - r.drawnUniq });
check('the cultures that ran out of names built longer ones from the same sounds, and none is numbered', r.longer.irish > 0 && r.longer.french > 0 && r.numbered.length === 0, { longer: r.longer, sample: r.sample });
check('Home\'s hand-placed towns keep their names, and no other place takes one', r.homeKept.length === HOME.length && r.homeElsewhere === 0, r.homeKept);
check('every port has its own name: no two *Woushstouir*s', r.portUniq === r.ports && r.woush <= 1, { ports: r.ports, uniq: r.portUniq });
check('no harbourmaster offers passage to a port of his own harbour\'s name', r.selfPassage.length === 0, r.selfPassage);
const diff = Object.keys(first.names).filter(id => id in byId && first.names[id] !== byId[id] && !['Caer Slige', 'Port Blackhand'].includes(byId[id]));
console.log(JSON.stringify({ firstCellMs: Math.round(first.ms), compared: Object.keys(first.names).length }));
check('the names are the same on a second boot, read before the game is entered', Object.keys(first.names).length === r.n && diff.length === 0, diff.slice(0, 5));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
