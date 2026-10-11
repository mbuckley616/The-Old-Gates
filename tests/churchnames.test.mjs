// A city's two churches (Session 594; the critic, 6 Oct, s455): a church is named for its town, and a city draws two, so Coeur
// de Vie had two *Chapelle de Coeur de Vie* side by side. The second takes its end of the town, as a second house of a name
// does (Michael's A on #171): *Chapelle de Coeur de Vie at the north-east end*. The first keeps its name.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const r = await page.evaluate(() => { const dup = [], multi = [], all = [];
  const c = WORLD.SITES.filter(t => t.pad && ['city', 'town', 'village', 'port'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  for (const t of c.slice(0, 40)) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); if (!S || S.dead) continue;
    const ch = S.houses.filter(h => h.type === 'church').map(h => ({ id: h.id, name: h.name }));
    if (!ch.length) continue; all.push(...ch.map(x => x.name));
    const names = ch.map(x => x.name); if (new Set(names).size !== names.length) dup.push({ site: t.id, names });
    if (ch.length > 1) multi.push({ site: t.id, kind: t.kind, ch }); }
  // the same town built again names its churches the same
  const cdv = WORLD.SITES.find(t => t.id === 'coeur_de_vie'); const a = (WORLD.settlements.get('coeur_de_vie') || WORLD.genSettlement(cdv)).houses.filter(h => h.type === 'church').map(h => h.id + '=' + h.name);
  return { dup, multi, n: all.length, a }; });
console.log(JSON.stringify(r).slice(0, 2500));
const cdv = r.multi.find(m => m.site === 'coeur_de_vie');
check('Coeur de Vie has two churches', !!cdv && cdv.ch.length === 2, r.multi);
check('the first keeps Chapelle de Coeur de Vie; the second takes its end of the town', cdv && cdv.ch[0].name === 'Chapelle de Coeur de Vie' && /^Chapelle de Coeur de Vie at the (north|south|east|west|north-east|north-west|south-east|south-west|middle|centre)[\w-]* end$/.test(cdv.ch[1].name), cdv);
check('no settlement of the forty nearest has two churches of one name', r.dup.length === 0 && r.n >= 10, r.dup);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
