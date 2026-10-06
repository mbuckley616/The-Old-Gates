// *What do you sell?* only where there is an answer (Session 592; the critic, 6 Oct, s455). Every generated keeper's def got
// the topic with the house's tagline as its reply, and the barber's tagline is blank until the quest writer gives him one
// (Session 512), so the reply was empty. The topic is left off while the tagline is blank.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const r = await page.evaluate(() => { const rows = [], empty = [], kinds = {};
  const c = WORLD.SITES.filter(t => t.pad && ['city', 'town', 'village', 'port'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  for (const t of c.slice(0, 12)) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); if (!S || S.dead) continue;
    for (const h of S.houses) { if (!h.keeper || !h.dlg) continue; const tops = h.dlg.topics || [];
      const sell = tops.find(x => x.label === 'What do you sell?');
      if (h.type === 'barber') rows.push({ site: t.id, name: h.name, sell: !!sell, labels: tops.map(x => x.label) });
      if (sell) { kinds[h.type] = (kinds[h.type] || 0) + 1; if (!sell.response || !String(sell.response).trim()) empty.push({ site: t.id, name: h.name, type: h.type }); } } }
  return { rows, empty, kinds }; });
console.log(JSON.stringify(r).slice(0, 2500));
check('barbers found', r.rows.length >= 3, r.rows);
check('no barber offers What do you sell? while his tagline is blank', r.rows.every(x => !x.sell), r.rows.filter(x => x.sell));
check('every keeper who offers it has an answer', r.empty.length === 0 && Object.keys(r.kinds).length >= 2, { empty: r.empty, kinds: r.kinds });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
