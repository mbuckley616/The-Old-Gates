// A lair hoard's sword or cuirass is named for its tier's metal (Michael's A on DECISION #232, Session 717): it named its metal
// on one draw (Iron/Steel/Silver; a wyrm's Silver/Gold/Mithril) and rolled its tier on the next, so a Steel Cuirass could be
// tier 3 and a wyrm's tier-6 blade Silver. The metal's draw is still taken, so every other roll in the hoard comes out as before.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { window._lairBoss = null; const p = Object.assign({}, PORTALS[0], { id: 'dyn_hoardmetal', theme: 'deep', seed: 4021, size: 'medium', interior: 'cave', zone: 'world', tutorial: false, lair: { place: 'Test', boss: 'Troll King' } }); window._hmP = p; goToDungeon(p); });
for (let k = 0; k < 60; k++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon' && !!window._lairBoss)) break; }
const r = await page.evaluate(() => { const p = window._hmP, out = [], t0 = worldState.gameTimeAbsMinutes || 0;
  for (let day = 0; day < 20; day++) for (const dragon of [false, true]) {
    worldState.gameTimeAbsMinutes = t0 + day * 1440; if (worldState.masters) delete worldState.masters[p.seed];
    p.lair = { place: 'Test', boss: 'Troll King', dragon }; const n0 = CHESTS.length; lairFinish(p); if (CHESTS.length === n0) { out.push(null); continue; }
    const h = CHESTS[CHESTS.length - 1], it = h.items[1];
    // the old draws, in their old order, on the hoard's own stream: the metal, the tier, sword or cuirass, a wyrm's scales
    const s = seededRng('loot', h.id + ':' + lootDay()); s(); const tier = (dragon ? 5 : 3) + Math.floor(s() * 2), sword = s() < .5, scales = dragon ? 1 + Math.floor(s() * 2) : 0;
    const sc = h.items.find(q => q.name === 'Dragon Scale');
    out.push({ dragon, name: it.name, tier: it.tier, material: it.material, metal: (MATERIALS.find(q => q.tier === it.tier) || {}).name, slot: it.slot, wantTier: tier, wantSlot: sword ? 'weapon' : 'chest', scales: sc ? sc.qty : 0, wantScales: scales, reqVal: it.reqVal, gold: h.items[0].value }); }
  worldState.gameTimeAbsMinutes = t0; return out; });
console.log(JSON.stringify(r.map(x => x && [x.dragon ? 'W' : '-', x.name, x.tier])));
const ok = r.filter(Boolean);
check('forty hoards built, twenty plain and twenty a wyrm\'s', ok.length === 40 && ok.filter(x => x.dragon).length === 20, r.length);
check('every piece is named for its tier\'s metal (3 Iron, 4 Steel, 5 Mithril, 6 Adamant), and carries it as its material', ok.every(x => x.metal && x.name.startsWith(x.metal + ' ') && x.material === x.metal), ok.map(x => [x.name, x.tier]));
check('no Silver or Gold piece in any hoard', ok.every(x => !/^(Silver|Gold) /.test(x.name)), ok.map(x => x.name));
check('the tier, sword or cuirass, and a wyrm\'s scales come out of the old draws, in their old order', ok.every(x => x.tier === x.wantTier && x.slot === x.wantSlot && x.scales === x.wantScales), ok.map(x => [x.tier, x.wantTier, x.slot, x.wantSlot, x.scales, x.wantScales]));
check('both tiers of each kind turn up (plain 3 and 4, a wyrm\'s 5 and 6)', [3, 4].every(t => ok.some(x => !x.dragon && x.tier === t)) && [5, 6].every(t => ok.some(x => x.dragon && x.tier === t)), ok.map(x => x.tier));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
