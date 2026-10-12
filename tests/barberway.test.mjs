// The barber has a tagline and can be asked the way to (Session 735; the quest writer's Finding 26). `TAGLINES.barber` was
// [''], so the keeper had no *What do you sell?*, and `WAY_ASK` had no barber, so *Where can I find …* listed every shop but his.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const r = await page.evaluate(() => {
  const c = WORLD.SITES.filter(t => t.pad && ['city', 'town'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  let S = null, h = null, n = 0;
  for (const t of c) { const s = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); const x = s && s.houses.find(q => q.type === 'barber'); if (x) { n++; if (!h) { S = s; h = x; } } }
  if (!h) return { none: true };
  const tags = [];
  for (const t of c) { const s = WORLD.settlements.get(t.id); if (s) for (const q of s.houses) if (q.type === 'barber') tags.push(q.tagline); }
  const keeper = (S.npcs || []).find(q => q.def && q.def._houseId === h.id) || null;
  const kTopics = keeper ? keeper.def.topics.map(t => [t.label, t.response]) : null;
  const other = (S.npcs || []).find(q => q.def && q.def._houseId !== h.id && !q.def._lord);
  const way = directionTopics(S.site, other.def); const labels = way.map(t => t.label);
  const bi = labels.indexOf('A barber?'); const said = bi >= 0 ? way[bi].fn() : null;
  return { town: S.site.name, name: h.name, n, tags: [...new Set(tags)], kTopics, labels, said, keeperFound: !!keeper };
});
console.log(JSON.stringify(r));
check('a barber in a town near Dunmore', !r.none, r);
const OK = ['"Shorn, shaved, or dyed. Sit still."', '"A sharp razor and a steady hand."', '"Come in rough, go out kempt."'];
check('every barber\'s tagline is one of the three, none blank', r.tags.length > 0 && r.tags.every(t => OK.includes(t)), r.tags);
check('the barber is asked *What do you sell?* and answers with his tagline', r.keeperFound && r.kTopics.some(([l, s]) => l === 'What do you sell?' && OK.includes(s)), r.kTopics);
check('*A barber?* is among the ways, after the goods store and before the shipwright', r.labels.includes('A barber?') && (!r.labels.includes('Somewhere for supplies?') || r.labels.indexOf('Somewhere for supplies?') < r.labels.indexOf('A barber?')) && (!r.labels.includes('The shipwright?') || r.labels.indexOf('The shipwright?') > r.labels.indexOf('A barber?')), r.labels);
check('the answer names the shop', typeof r.said === 'string' && r.said.includes(r.name), r.said);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
