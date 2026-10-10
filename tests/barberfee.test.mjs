// The barber's fee and strongbox (Session 551, Michael's A on DECISION #151): one fee for the visit at an inn room's price
// in that place, nothing when nothing changed; the shop keeps a strongbox at the general goods rate, like every keeper.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

// the fee in the towns and cities near the start
const fees = await page.evaluate(() => { const out = [];
  const c = WORLD.SITES.filter(t => t.pad && ['city', 'town'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  for (const t of c.slice(0, 12)) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); if (!S || S.dead) continue; const h = S.houses.find(x => x.type === 'barber'); if (!h) continue;
    const inn = S.houses.find(x => x.type === 'inn'); out.push({ kind: t.kind, siteKind: h.siteKind, fee: barberFee(h), inn: inn ? innPrice(inn) : null, room: innPrice(h) }); }
  return out; });
console.log(JSON.stringify(fees));
const towns = fees.filter(f => f.kind === 'town'), cities = fees.filter(f => f.kind === 'city');
check('a barber\'s fee is an inn room\'s price in that place: 9–17 in a town, 17–25 in a city', towns.length > 0 && towns.every(f => f.fee === f.room && f.fee >= 9 && f.fee <= 17) && cities.every(f => f.fee === f.room && f.fee >= 17 && f.fee <= 25), fees);

// paying: nothing when nothing changed; the fee when something did; nothing taken from a short purse
const pay = await page.evaluate(() => { let h = null; for (const S of WORLD.settle.values()) { h = S.houses.find(x => x.type === 'barber'); if (h) break; }
  if (!h) { const c = WORLD.SITES.filter(t => t.pad && ['city', 'town'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
    for (const t of c) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); h = S && S.houses.find(x => x.type === 'barber'); if (h) break; } }
  window._B = h; const fee = barberFee(h);
  gold = 100; const a = barberPay(h, false), g1 = gold; const b = barberPay(h, true), g2 = gold; gold = fee - 1; const c = barberPay(h, true), g3 = gold;
  return { name: h.name, fee, a, g1, b, g2, c, g3, log: (GAME_LOG[GAME_LOG.length - 1] || {}).text };
});
console.log(JSON.stringify(pay));
check('rising with nothing changed costs nothing', pay.a === 'free' && pay.g1 === 100, pay);
check('with a change, the one fee is paid and written in the log', pay.b === 'paid' && pay.g2 === 100 - pay.fee && pay.log === `Paid ${pay.fee} gold at ${pay.name}.`, pay);
check('a purse one short pays nothing', pay.c === 'poor' && pay.g3 === pay.fee - 1, pay);

// the strongbox
await g.hide();
await page.evaluate(() => { forceTime(12); const h = _B; px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(4000); await g.hide();
const box = await page.evaluate(() => { const X = WORLD.intBox, h = _B; if (!X) return null; const W = h.intW, D = h.intD;
  const under = FOOTHOLDS.filter(f => f.y > .2 && Math.hypot((f.x0 + f.x1) / 2 - X.x, (f.z0 + f.z1) / 2 - X.z) > .05 && X.x + .35 > f.x0 && X.x - .35 < f.x1 && X.z + .35 > f.z0 && X.z - .35 < f.z1), onFurn = under.length > 0, fh = under.map(f => [f.x0, f.x1, f.z0, f.z1, f.y].map(v => +v.toFixed(2)));
  px = X.x; pz = X.z + .8; jumpY = 0; lookAtPt(X.x, .3, X.z); const standClear = !intSolidAt(px, pz, .1); const prompt = WORLD.boxPrompt();
  const site = WORLD.settle.get(h.siteId) ? WORLD.settle.get(h.siteId).site : SITE[h.siteId]; const p = WORLD.prosperity(site);
  return { kind: X.kind, type: X.type, x: X.x, z: X.z, W, D, onFurn, fh, standClear, prompt, mean: WORLD.boxCoins(p, X.type), goods: WORLD.boxCoins(p, 'misc'), lock: lockPins(h) }; });
console.log(JSON.stringify(box));
check('the barber\'s room has a strongbox', !!box && box.kind === 'shop' && box.type === 'barber', box);
check('it holds the general goods rate', box && Math.abs(box.mean - box.goods) < 1e-9 && box.mean > 10, box);
check('it stands clear of the furniture (no foothold under it but its own lid), and it can be reached and picked', box && !box.onFurn && box.standClear && /pick the lock on the strongbox/.test(box.prompt || ''), box);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
