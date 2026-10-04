// Session 470: the co-op rule "a roll that decides an outcome comes from a seeded stream keyed by place and id" (CLAUDE.md,
// Michael's A on #119; backlog K, the co-op door's Opus half, step 1) for the loot rolls of `14-items.js`. Every roll there
// draws from lootRand(); rollContainerLoot with a key runs on seededRng('loot', key). Checked: the stream is a function of
// its key alone; a keyed container rolls the same contents twice and leaves no stream set; without a key it is random as
// before; the odds are unchanged (counts and kinds over 3,000 chests each way); and in a real town (Portclare, built after the spy is set) the barrels are rolled on
// their keys (site id, index, game day), each key rolls them again the same, and a new day rolls new ones.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const s = await page.evaluate(() => { const a = seededRng('loot', 'x:1'), b = seededRng('loot', 'x:1'), c = seededRng('loot', 'x:2');
  const A = [], B = [], C = []; for (let i = 0; i < 8; i++) { A.push(a()); B.push(b()); C.push(c()); }
  return { same: A.join() === B.join(), differs: A.join() !== C.join(), range: A.concat(C).every(v => v >= 0 && v < 1), A: A.slice(0, 3).map(v => +v.toFixed(4)) }; });
check('seededRng is a function of its key: the same key, the same draws; another key, others; all in [0, 1)', s.same && s.differs && s.range, s);

const k = await page.evaluate(() => { const J = x => JSON.stringify(x);
  const out = { same: 0, kinds: 0, unkeyedDiffer: 0, restored: true };
  for (let i = 0; i < 40; i++) { const key = 'test:' + i; const a = rollContainerLoot('treasure', null, 'ruins', 1, key), b = rollContainerLoot('treasure', null, 'ruins', 1, key);
    if (J(a) === J(b)) out.same++; if (LOOT_RNG !== null) out.restored = false; }
  const seen = new Set(); for (let i = 0; i < 40; i++) seen.add(J(rollContainerLoot('treasure', null, 'ruins', 1, 'test:' + i))); out.kinds = seen.size;
  for (let i = 0; i < 40; i++) if (J(rollContainerLoot('treasure', null, 'ruins', 1)) !== J(rollContainerLoot('treasure', null, 'ruins', 1))) out.unkeyedDiffer++;
  return out; });
check(`a keyed container rolls the same contents twice (${k.same}/40) and leaves no stream set; 40 keys give ${k.kinds} different hoards`, k.same === 40 && k.restored && k.kinds >= 30, k);
check(`without a key it is random as before (${k.unkeyedDiffer}/40 pairs differ)`, k.unkeyedDiffer >= 30, k);

const d = await page.evaluate(() => { const N = 3000; const tally = (keyed) => { let n = 0, gold = 0, equip = 0, empty = 0;
    for (let i = 0; i < N; i++) { const it = rollContainerLoot('chest', null, 'ruins', 1, keyed ? 'odds:' + i : undefined); n += it.length; if (!it.length) empty++;
      for (const x of it) { if (x.type === 'gold') gold++; if (x.slot || x.dmg != null || x.def != null) equip++; } }
    return { items: +(n / N).toFixed(3), empty: +(empty / N).toFixed(3), gold: +(gold / N).toFixed(3), equip: +(equip / N).toFixed(3) }; };
  return { keyed: tally(true), random: tally(false) }; });
const near = (a, b, t) => Math.abs(a - b) <= t;
check(`the odds are unchanged: items a chest ${d.keyed.items} keyed vs ${d.random.items}, empty ${d.keyed.empty} vs ${d.random.empty}, equipment ${d.keyed.equip} vs ${d.random.equip}`,
  near(d.keyed.items, d.random.items, .12) && near(d.keyed.empty, d.random.empty, .03) && near(d.keyed.gold, d.random.gold, .06) && near(d.keyed.equip, d.random.equip, .08), d);

await page.evaluate(() => { window._lootCalls = []; const real = rollContainerLoot;
  window.rollContainerLoot = function (kind, ds, th, bc, key) { const items = real(kind, ds, th, bc, key); window._lootCalls.push({ kind, ds, bc, key, items: JSON.stringify(items) }); return items; }; });
const pre = await page.evaluate(() => !!WORLD.settle.get('portclare'));
await g.settle('portclare');
const t = await page.evaluate(() => { const S = WORLD.settle.get('portclare'); if (!S || !S.loot) return { none: true };
  const day = lootDay(), calls = window._lootCalls.filter(c => /^portclare:barrel:/.test(c.key || ''));
  let match = 0, nextDiffer = 0, inOrder = 0;
  calls.forEach((c, i) => { if (c.key === 'portclare:barrel:' + i + ':' + day) inOrder++;
    if (JSON.stringify(rollContainerLoot(c.kind, c.ds, null, c.bc, c.key)) === c.items) match++;
    if (JSON.stringify(rollContainerLoot(c.kind, c.ds, null, c.bc, 'portclare:barrel:' + i + ':' + (day + 1))) !== c.items) nextDiffer++; });
  return { barrels: S.loot.length, calls: calls.length, inOrder, match, nextDiffer, day, keys: calls.slice(0, 3).map(c => c.key) }; });
check(`in Portclare (unbuilt before: ${!pre}) the ${t.barrels} barrels are rolled on their keys (site, index, game day: ${t.inOrder}/${t.calls}), and each key rolls them again the same (${t.match}/${t.calls})`, !pre && !t.none && t.barrels > 0 && t.calls === t.barrels && t.inOrder === t.calls && t.match === t.calls, t);
check(`the next game day rolls other contents (${t.nextDiffer}/${t.calls} differ)`, !t.none && t.nextDiffer >= 1, t);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
