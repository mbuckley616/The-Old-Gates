// One door to a name (Michael's A on DECISION #171), Session 579. Homes were named *Séamus's House* for their resident, and
// a big town repeats first names, so Carraig Mór had two *Séamus's House* (lots 10 and 44), both for sale. Now the first of a
// name keeps it; a second takes the resident's trade (*Séamus the Cooper's House*, *Old Úna's House*); a plain resident, or a
// trade that repeats too, its end of the town (*… at the north end*). Also Session 578's register fix (quest review Finding 18).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const tp = await page.evaluate(() => ({ greet: TEMPERS.pious.greet, bye: TEMPERS.pious.bye }));
console.log(JSON.stringify(tp));
check('the pious temper keeps the Weaver, not a Light (Finding 18)', tp.greet[1] === 'The Weaver keeps this door.' && tp.bye[0] === 'Go with the Weaver.' && !/light/i.test(JSON.stringify(tp)), tp);

const ids = await page.evaluate(() => { WORLD.anchoredPlaces(); const out = {};
  for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) WORLD.getCell(i, j).sites.forEach(t => { if (['Carraig Mór', 'Dunmore', 'Portclare'].includes(t.name)) out[t.name] = t.id; });
  return out; });
console.log(JSON.stringify(ids));
const all = {};
for (const nm of ['Carraig Mór', 'Dunmore', 'Portclare']) {
  await g.settle(ids[nm]);
  const r = await page.evaluate((id) => { const S = WORLD.settle.get(id); if (!S) return null;
    const homes = S.houses.filter(h => h.type === 'home');
    return homes.map(h => ({ id: h.id, name: h.name, keeper: h.keeper, tag: h.roleTag, sh: !!h.shuttered })); }, ids[nm]);
  all[nm] = r;
}
let total = 0, dupTowns = [], second = [], byEnd = [], numbered = [], keptFirst = true, keeperOk = true;
for (const [nm, homes] of Object.entries(all)) {
  if (!homes) { dupTowns.push(nm + ' (not built)'); continue; }
  total += homes.length;
  const base = homes.map(h => h.name.replace(/ \(shuttered\)$/, ''));
  if (base.some((x, i) => base.indexOf(x) !== i)) dupTowns.push(nm);
  const seen = new Set();
  for (const h of homes) { const b = h.name.replace(/ \(shuttered\)$/, '');
    if (!b.includes(h.keeper)) keeperOk = false;
    if (b === `${h.keeper}'s House`) { if (seen.has(h.keeper)) keptFirst = false; seen.add(h.keeper); continue; }
    if (b === 'Your House') continue;
    if (!seen.has(h.keeper)) keptFirst = false; seen.add(h.keeper);
    if (/ \(\d+\)$/.test(b)) numbered.push(`${nm}: ${b}`); else if (/ end$/.test(b)) byEnd.push(`${nm}: ${b}`); else second.push(`${nm}: ${b}`);
  }
}
console.log(JSON.stringify({ total, second, byEnd, numbered }));
const cm = all['Carraig Mór'] || [];
const seam = cm.filter(h => h.keeper === 'Séamus').map(h => `${h.id}: ${h.name}`);
console.log(JSON.stringify({ seam }));
check('every home in three towns has a name of its own', total > 40 && dupTowns.length === 0, { total, dupTowns });
check('the first of a name keeps *X\'s House*; every other names its resident', keptFirst && keeperOk);
check('the repeats read by trade, or by the end of the town, and none needs a number', second.length + byEnd.length > 0 && numbered.length === 0, { second: second.length, byEnd: byEnd.length, numbered });
check('Carraig Mór\'s two Séamus houses read apart', seam.length < 2 || new Set(seam.map(s => s.split(': ')[1])).size === seam.length, seam);
stop(); check('no page errors', g.errs.length === 0, g.errs);
await g.close();
