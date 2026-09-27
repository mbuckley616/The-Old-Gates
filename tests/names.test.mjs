// Names within a town (Session 172): makeDef re-drew every townsperson's name from their people's bank without asking
// who already had it, so Dunmore had two Clodagh's Goods (twin keepers under the name|site genome cache), and inns were
// named with no check at all (two Bramble Hearths). Now a drawn name that is taken moves to the next free one in the bank;
// only when a bank is used up does a name repeat. The same town builds the same names every time.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const read = () => page.evaluate(() => { const S = WORLD.settle.get('dunmore');
  const shops = S.houses.filter(h => h.keeper && h.type !== 'home' && !/guild/.test(h.type)).map(h => h.name);
  const keepers = S.houses.filter(h => h.keeper && h.type !== 'home' && !/guild|inn|church|castle/.test(h.type)).map(h => h.keeper);
  const inns = S.houses.filter(h => h.type === 'inn').map(h => h.name);
  const people = S.npcs.map(n => n.def && n.def.name).filter(Boolean);
  const dup = a => a.filter((x, i) => a.indexOf(x) !== i);
  return { shops, inns, keepers, people: people.length, dupShops: dup(shops), dupInns: dup(inns), dupKeepers: dup(keepers), dupPeople: dup(people).length, all: S.houses.map(h => h.name + '|' + h.keeper), folk: people }; });
const a = await read();
check('no two shops or inns in the town share a name, and no two keepers', a.dupShops.length === 0 && a.dupInns.length === 0 && a.dupKeepers.length === 0, { shops: a.shops, inns: a.inns, keepers: a.keepers });
console.log('  townsfolk outdoors', a.people, 'repeated first names among them', a.dupPeople);

// throw the town away and build it again: the same names
const b = await page.evaluate(async () => { const S = WORLD.settle.get('dunmore'); const site = S.site; WORLD.disposeSettlement('dunmore'); await new Promise(r => setTimeout(r, 300));
  if (WORLD.settle.get('dunmore')) return { notDisposed: true }; WORLD.genSettlement(site); return { rebuilt: !!WORLD.settle.get('dunmore') }; });
const c = b.rebuilt ? await read() : null;
console.log('  houses on rebuild', JSON.stringify({ onlyBefore: a.all.filter(x => !(c && c.all.includes(x))), onlyAfter: c ? c.all.filter(x => !a.all.includes(x)) : [] }));
// the townsfolk outdoors can differ by one on a rebuild in the build before this session too (someone spawned outside the town's generator); reported, not checked
console.log('  townsfolk on rebuild', JSON.stringify({ onlyBefore: a.folk.filter(x => !(c && c.folk.includes(x))), onlyAfter: c ? c.folk.filter(x => !a.folk.includes(x)) : [] }));
check('rebuilt, the town has the same houses, shop and inn names and keepers', b.rebuilt && c && JSON.stringify(c.all) === JSON.stringify(a.all), { b, same: c && JSON.stringify(c.all) === JSON.stringify(a.all), before: a.all.slice(0, 12), after: c && c.all.slice(0, 12) });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
