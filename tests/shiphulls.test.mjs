// Session 636 — Michael's B on #192 (docs/design/the-ship-in-hand.md): two hulls more, each a trade and each sold on one
// island — the Mark's cutter (12 bare, hull 80, hold 25) and Aurenne's caravel (11, 130, 55); sails as +12% of her bare
// speed a tier, with a fourth tier at 1,100; refits from any hull to any other, up for the difference in worth, down with
// two thirds of it paid back. Read from the shipwright's own topics at a port of each nation.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const ports = await page.evaluate(() => { const by = {}; for (const p of allPorts()) { const n = nationAt(p.x, p.z); if (!by[n]) by[n] = { id: p.id, name: p.name }; } return by; });
console.log('ports', JSON.stringify(ports));
check('a port in each nation', ports.gatelands && ports.mark && ports.aurenne, ports);

const t = await page.evaluate((ports) => {
  const out = {}; const C = SHIP_CLASSES;
  out.cls = Object.fromEntries(Object.keys(C).map(k => { worldState.ship = { cls: k, sails: 0, cargo: 0, hold: {} }; const bare = +shipTopSpeed().toFixed(2);
    worldState.ship.sails = 4; const full = +shipTopSpeed().toFixed(2); worldState.ship.sails = 3; const three = +shipTopSpeed().toFixed(2);
    return [k, { bare, three, full, hull: shipBars().hullMax, hold: holdCap(), worth: C[k].worth }]; }));
  // the refit rows at each nation's yard, from a sloop
  const site = id => siteAnywhere(id);
  out.rows = {}; for (const n of ['gatelands', 'mark', 'aurenne']) { worldState.ship = { cls: 'sloop', sails: 0, cargo: 0, hold: {}, name: 'Test Gull' };
    out.rows[n] = upgradeTopics(site(ports[n].id)).map(x => x.label).filter(l => /^Refit|^Better sails/.test(l)); }
  return out; }, ports);
console.log(JSON.stringify(t));
const c = t.cls;
check(`the cutter: ${c.cutter.bare} bare, hull ${c.cutter.hull}, hold ${c.cutter.hold}; the caravel: ${c.caravel.bare}, ${c.caravel.hull}, ${c.caravel.hold}`,
  c.cutter.bare === 12 && c.cutter.hull === 80 && c.cutter.hold === 25 && c.caravel.bare === 11 && c.caravel.hull === 130 && c.caravel.hold === 55, c);
check(`full sails (four tiers, +12% each): sloop ${c.sloop.full}, cog ${c.cog.full}, galleon ${c.galleon.full}, caravel ${c.caravel.full}, cutter ${c.cutter.full}`,
  Math.abs(c.sloop.full - 11.1) < .01 && Math.abs(c.cog.full - 12.58) < .01 && Math.abs(c.galleon.full - 14.06) < .01 && Math.abs(c.caravel.full - 16.28) < .01 && Math.abs(c.cutter.full - 17.76) < .01, c);
check(`a saved sloop with three tiers keeps them: ${c.sloop.three} (was 11.1 at +1.2 a tier)`, Math.abs(c.sloop.three - 10.2) < .01, c.sloop);
check('the three hulls keep their hull and hold (100/40, 140/60, 200/90) and their worth (400, 1,300, 3,500)',
  c.sloop.hull === 100 && c.cog.hull === 140 && c.galleon.hull === 200 && c.sloop.hold === 40 && c.cog.hold === 60 && c.galleon.hold === 90 && c.sloop.worth === 400 && c.cog.worth === 1300 && c.galleon.worth === 3500, c);
const has = (n, re) => t.rows[n].some(l => re.test(l));
check('in the Gatelands a sloop is offered the cog (900) and the galleon (3,100), no cutter or caravel',
  has('gatelands', /^Refit her as a cog \(900 gold\)$/) && has('gatelands', /^Refit her as a galleon \(3100 gold\)$/) && !has('gatelands', /cutter|caravel/), t.rows.gatelands);
check('at the Mark\'s yard the cutter (1,600) as well, and no caravel', has('mark', /^Refit her as a cutter \(1600 gold\)$/) && !has('mark', /caravel/) && has('mark', /cog/), t.rows.mark);
check('at Aurenne\'s yard the caravel (2,800) as well, and no cutter', has('aurenne', /^Refit her as a caravel \(2800 gold\)$/) && !has('aurenne', /cutter/) && has('aurenne', /galleon/), t.rows.aurenne);
check('sails go to a fourth tier', has('gatelands', /^Better sails, tier 1 \(250 gold\)$/), t.rows.gatelands);

// refits clicked at the Mark's yard on a real ship: cog → cutter, cutter → sloop (paid back), sails to tier 4
const r = await page.evaluate((id) => { const s = siteAnywhere(id), out = {};
  worldState.ship = { cls: 'cog', sails: 3, cargo: 0, hold: {}, name: 'Test Gull' }; spawnShip(s.x + 60, s.z + 60, 0); worldState.ship.hull = 70; gold = 1000;
  const pick = re => upgradeTopics(s).find(x => re.test(x.label));
  out.label = pick(/^Refit her as a cutter/).label; out.said = pick(/^Refit her as a cutter/).fn();
  out.cutter = { cls: worldState.ship.cls, gold, hull: shipBars().hull, hullMax: shipBars().hullMax, L: SHIP.L, mesh: !!SHIP.mesh, kind: SHIP.mesh && SHIP.mesh.userData.kind, top: +shipTopSpeed().toFixed(2) };
  const down = pick(/^Refit her as a sloop/); out.downLabel = down.label; out.downSaid = down.fn(); out.sloop = { cls: worldState.ship.cls, gold, hull: shipBars().hull };
  gold = 100; out.poorUp = pick(/^Refit her as a galleon/).fn(); out.poorState = { cls: worldState.ship.cls, gold };
  gold = 2000; const s4 = pick(/^Better sails, tier 4/); out.s4Label = s4 && s4.label; out.s4Said = s4 && s4.fn(); out.s4 = { sails: worldState.ship.sails, gold, more: !!pick(/^Better sails/) };
  worldState.ship.cls = 'cutter'; worldState.ship.cargo = 0; out.raise = shipRaiseCost();
  return out; }, ports.mark.id);
console.log(JSON.stringify(r));
check(`${r.label}: 700 taken, she is a cutter, hull ${r.cutter.hull} of ${r.cutter.hullMax}, on the sloop's ${r.cutter.kind} hull`,
  r.label === 'Refit her as a cutter (700 gold)' && r.cutter.cls === 'cutter' && r.cutter.gold === 300 && r.cutter.hull === 80 && r.cutter.hullMax === 80 && r.cutter.L === 13 && r.cutter.mesh && r.cutter.kind === 'sloop', r);
check(`her three tiers carry: ${r.cutter.top} (12 × 1.36)`, Math.abs(r.cutter.top - 16.32) < .01, r.cutter);
check(`a cutter no bigger than the cog: the shipwright says only "${r.said}"`, /^(She's a|She is a|A) cutter now(, Master)?\.$/.test(r.said), r.said);
check(`${r.downLabel}: the yard pays two thirds of 1,600, and she is a sloop of 100`, r.downLabel === 'Refit her as a sloop (the yard pays 1067 gold)' && r.sloop.cls === 'sloop' && r.sloop.gold === 1367 && r.sloop.hull === 100, r);
check(`short of 3,100 for a galleon: "${r.poorUp}", nothing changes`, /\b3100 gold\b/.test(r.poorUp) && r.poorState.cls === 'sloop' && r.poorState.gold === 100, r);
check(`${r.s4Label}: taken, and no fifth tier is offered`, r.s4Label === 'Better sails, tier 4 (1100 gold)' && r.s4.sails === 4 && r.s4.gold === 900 && !r.s4.more && /11\.1 knots/.test(r.s4Said), r);
check(`raising a sunk cutter with four tiers: 30% of 2,000 + 2,500 = ${r.raise}`, r.raise === 1350, r.raise);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
