// Town locks against the takings (Session 608; backlog G's owed check from Session 155: "whether four pins per shop in a
// rich town is fair; the takings against a low-level purse"). The feel is Michael's; this gives the numbers. A shop's door
// and strongbox take at least 4 pins in a town of prosperity 60 or more, at least 3 below it (`lockPins`), and the lock's
// own hash gives 2–4 before that floor (`lpDifficulty`); a home's take one fewer, at least 2. This reads every place with
// shops at the start of a new world (its prosperity), the real locks of Dunmore and Portclare through the game's own
// `lpDifficulty`, and prices a night's break-in (a shop door, then the strongbox) in picks at 12 gold, with Session 376's
// exact snap count (a snap drops the last pin set), against the strongbox's coins (`boxCoins`, × 0.8–1.2).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const world = await page.evaluate(() => { const out = [];
  /* S618 — every cell's places, not the loaded ones (WORLD.SITES held 15 to 46 by when the loader had got to) */
  const all = []; for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) all.push(...getCell(i, j).sites);
  for (const t of all) { if (!/^(village|town|city|port|garrison)$/.test(t.kind)) continue; out.push({ id: t.id, kind: t.kind, p: WORLD.prosperity(t) }); }
  const lp = BAG.find(b => b.name === 'Lockpick'); return { towns: out, pickPrice: 12, carried: lp ? lp.qty || 1 : 0, gold }; });

const locks = [];
for (const id of ['dunmore', 'portclare']) {
  await g.settle(id);
  locks.push(...await page.evaluate((id) => { const S = WORLD.settle.get(id); const p = WORLD.prosperity(S.site); const out = [];
    for (const h of S.houses) { const home = h.type === 'home'; if (!(home || (h.keeper && /weapon|armor|potion|misc/.test(h.type)))) continue;
      const d = WORLD.doorLockFor(h); const box = { seed: 'box_' + h.id, minPins: d.minPins, lockBonus: home ? -1 : 0 };
      out.push({ town: id, p, home, type: h.type, door: lpDifficulty(d).pins, box: lpDifficulty(box).pins, coins: home ? 7 : +WORLD.boxCoins(p, h.type).toFixed(1) }); }
    return out; }, id));
}

// expected snaps to set n pins for a hand that misses with probability q (Session 376's closed form, the rule as built)
const snaps = (n, q) => { let d = q / (1 - q), s = d; for (let k = 1; k < n; k++) { d = (q + q * d) / (1 - q); s += d; } return s; };
const HANDS = [[.1, '1 in 10'], [.2, '1 in 5'], [1 / 3, '1 in 3']];

// the world at the start: prosperity bands and what a shop's two locks are by the rule (the hash is even across 0–2)
const band = p => p >= 80 ? '80+' : p >= 60 ? '60–79' : p >= 40 ? '40–59' : 'under 40';
const bands = {}; for (const t of world.towns) { const b = band(t.p); (bands[b] || (bands[b] = [])).push(t); }
console.log(`places with shops at the start: ${world.towns.length}`);
const rows = [];
for (const b of ['under 40', '40–59', '60–79', '80+']) { const T = bands[b] || []; if (!T.length) continue;
  const pMean = T.reduce((a, t) => a + t.p, 0) / T.length, rich = pMean >= 60 && T.every(t => t.p >= 60);
  // a lock's pins: max(floor, 2 + h%3); the floor is 4 rich, 3 not: rich always 4, else 3 (h%3 = 0, 1) or 4 (h%3 = 2)
  const mix = rich ? { 4: 1 } : { 3: 2 / 3, 4: 1 / 3 };
  const per = q => Object.entries(mix).reduce((a, [n, w]) => a + w * snaps(+n, q), 0) * 2; // the door and the box
  const coins = 10 + 50 * Math.min(100, pMean) / 100;
  const r = { band: b, places: T.length, meanP: Math.round(pMean), pins: rich ? 'all 4' : '3 (2 in 3) or 4', coins: Math.round(coins) };
  for (const [q, nm] of HANDS) { const k = per(q); r[nm] = `${k.toFixed(2)} picks, ${Math.round(k * world.pickPrice)} gold`; }
  rows.push(r); console.log('  ' + JSON.stringify(r)); }

// the real locks, through the game's own lpDifficulty
const shops = locks.filter(l => !l.home), homes = locks.filter(l => l.home);
const byTown = {}; for (const l of shops) { const B = byTown[l.town] || (byTown[l.town] = { p: l.p, shops: 0, door4: 0, box4: 0, coins: [] }); B.shops++; if (l.door === 4) B.door4++; if (l.box === 4) B.box4++; B.coins.push(l.coins); }
console.log('the real locks:', JSON.stringify(byTown));
console.log('homes:', JSON.stringify({ n: homes.length, door: homes.reduce((a, l) => (a[l.door] = (a[l.door] || 0) + 1, a), {}), chest: homes.reduce((a, l) => (a[l.box] = (a[l.box] || 0) + 1, a), {}) }));

check('places with shops, and the start\'s prosperity spread across bands', world.towns.length > 20 && rows.length >= 2, rows.map(r => r.band + ':' + r.places));
check('the real shop locks follow the rule: 4 pins in a town of 60 or more, 3–4 below it', shops.length > 0 && shops.every(l => l.p >= 60 ? l.door === 4 && l.box === 4 : l.door >= 3 && l.door <= 4 && l.box >= 3 && l.box <= 4), byTown);
check('a home\'s door and chest take 2–3 pins', homes.length > 0 && homes.every(l => l.door >= 2 && l.door <= 3 && l.box >= 2 && l.box <= 3), homes.length);
const rich = rows.find(r => r.band === '60–79');
check('a rich shop\'s two locks, for a hand that misses 1 in 3, cost more picks than a poor shop\'s', !rich || rows.every(r => r.band === '60–79' || r.band === '80+' || parseFloat(r['1 in 3']) <= parseFloat(rich['1 in 3'])), rows);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
