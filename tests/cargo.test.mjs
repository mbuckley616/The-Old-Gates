// Cargo by the crate (Session 390; Michael's B on #88, built as A first). A harbour's factor sells his island's four goods
// at ×0.6 of their worth and buys any good (his own ×0.6, another island's ×1.4) less a tenth; a crate sold drops that
// quay's price 4%, a crate bought raises it 4%, and the gap closes by 30% a day. The Compact tithes a sale a tenth. With
// your ship at the harbour the crates go into her hold (40 / 60 / 90 by class, +25 a hold tier), else on your back.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

// one port of each island
const ports = await page.evaluate(() => { const out = {}; const s = WORLD.siteAnywhere('dunmore');
  for (const p of WORLD.allPorts().sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z))) { const n = WORLD.cargoNation(p); if (!out[n]) out[n] = p.id; }
  return out; });
check('a harbour on each island', ports.gatelands && ports.mark && ports.aurenne, ports);

const prices = await page.evaluate((ports) => { worldState.cargoMkt = {}; const S = id => WORLD.siteAnywhere(id); const G = S(ports.gatelands), M = S(ports.mark), A = S(ports.aurenne);
  return { grainAskHome: WORLD.cargoAsk(G, 'grain'), ironAskMark: WORLD.cargoAsk(M, 'iron'), ironBidHome: WORLD.cargoBid(M, 'iron').net, ironBidGates: WORLD.cargoBid(G, 'iron'),
    grainBidAur: WORLD.cargoBid(A, 'grain'), grainBidMark: WORLD.cargoBid(M, 'grain') }; }, ports);
console.log(JSON.stringify(prices));
check('at home a good is ×0.6 (grain 12, iron 24 in the Mark)', prices.grainAskHome === 12 && prices.ironAskMark === 24, prices);
check('abroad it is bought at ×1.4 less a tenth (iron in the Gatelands 50; grain in the Mark 25)', prices.ironBidGates.net === 50 && prices.ironBidGates.tithe === 0 && prices.grainBidMark.net === 25, prices);
check('the Compact tithes a sale a tenth (grain in Aurenne 25, tithe 3, paid 22)', prices.grainBidAur.raw === 25 && prices.grainBidAur.tithe === 3 && prices.grainBidAur.net === 22, prices);
check('at home the factor buys below his asking price, so a crate bought and sold at one quay loses', prices.ironBidHome < prices.ironAskMark, prices);

// a run on foot: silver from the Mark to the Gatelands
const run = await page.evaluate((ports) => { worldState.cargoMkt = {}; worldState.ship = null; const S = id => WORLD.siteAnywhere(id); const G = S(ports.gatelands), M = S(ports.mark);
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].type === 'cargo') BAG.splice(i, 1);
  gold = 1000; const out = { asks: [], bids: [] };
  for (let i = 0; i < 3; i++) { out.asks.push(WORLD.cargoAsk(M, 'silver')); out.buyMsg = WORLD.cargoBuy(M, 'silver'); }
  out.spent = 1000 - gold; const it = BAG.find(b => b.type === 'cargo' && b.cargo === 'silver'); out.inBag = it ? it.qty : 0; out.weight = it ? itemWeight(it) : 0;
  out.notSold = WORLD.cargoBuy(G, 'silver');
  const g0 = gold; for (let i = 0; i < 3; i++) { out.bids.push(WORLD.cargoBid(G, 'silver').net); out.sellMsg = WORLD.cargoSell(G, 'silver'); }
  out.earned = gold - g0; out.left = BAG.some(b => b.type === 'cargo');
  out.after = WORLD.cargoBid(G, 'silver').net;
  worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes || 0) + 1440; out.day1 = WORLD.cargoBid(G, 'silver').net;
  worldState.gameTimeAbsMinutes += 1440 * 9; out.day10 = WORLD.cargoBid(G, 'silver').net;
  return out; }, ports);
console.log(JSON.stringify(run));
check('three chests of silver in the Mark cost 57, 59, 62: each bought raises the price 4%', run.asks.join() === '57,59,62' && run.spent === 178 && run.inBag === 3 && run.weight === 24, run);
check('a factor sells only his own island’s goods', /not sold here/.test(run.notSold), run);
check('in the Gatelands they sell for 120, 115, 111: each sold drops the price 4%', run.bids.join() === '120,115,111' && run.earned === 346 && !run.left, run);
check('the run pays: 346 for 178', run.earned - run.spent === 168, run);
check('the price comes back: 106 after the sales, 110 a day later, 120 after ten', run.after === 106 && run.day1 === 110 && run.day10 === 120, run);

// the ship's hold, and what a counter makes of a crate
const hold = await page.evaluate((ports) => { worldState.cargoMkt = {}; const M = WORLD.siteAnywhere(ports.mark); const out = {};
  const keepMesh = WORLD.ship.mesh, kx = WORLD.ship.x, kz = WORLD.ship.z; worldState.ship = { cls: 'sloop', cargo: 0 };
  WORLD.ship.mesh = WORLD.ship.mesh || new THREE.Group(); WORLD.ship.x = M.x + 60; WORLD.ship.z = M.z;
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].type === 'cargo') BAG.splice(i, 1);
  gold = 5000; out.cap = WORLD.holdCap();
  for (let i = 0; i < 6; i++) WORLD.cargoBuy(M, 'iron');
  out.hold = { ...worldState.ship.hold }; out.used = WORLD.holdUsed(); const b = BAG.find(x => x.type === 'cargo'); out.bag = b ? b.qty : 0;
  out.board = WORLD.cargoBoard(M);
  worldState.ship.cargo = 2; out.cap2 = WORLD.holdCap(); worldState.ship.cls = 'galleon'; out.capG = WORLD.holdCap();
  const g0 = gold; out.sell = WORLD.cargoSell(M, 'iron'); out.fromHold = worldState.ship.hold.iron;
  WORLD.ship.x = M.x + 400; out.away = WORLD.cargoBoard(M); out.sellAway = WORLD.cargoSell(M, 'iron'); out.holdAway = worldState.ship.hold.iron;
  out.sellRows = WORLD.cargoRows(M).map(r => r.label);
  // a shop counter refuses a crate
  const i = BAG.findIndex(x => x.type === 'cargo'); const g1 = gold; out.counterPrice = counterSellPrice(BAG[i]);
  if (i >= 0) { BAG[i].qty = 1; sellItem(i, out.counterPrice); } out.counterGold = gold - g1; out.counterMsg = document.getElementById('msg').textContent;
  WORLD.ship.mesh = keepMesh; WORLD.ship.x = kx; WORLD.ship.z = kz; worldState.ship = null;
  for (let k = BAG.length - 1; k >= 0; k--) if (BAG[k].type === 'cargo') BAG.splice(k, 1);
  return out; }, ports);
console.log(JSON.stringify(hold));
check('a sloop’s hold is 40: four crates of iron go aboard, the fifth and sixth on your back', hold.cap === 40 && hold.hold.iron === 4 && hold.used === 40 && hold.bag === 2, hold);
check('the board names the hold (40 of 40)', /hold: 40 of 40/.test(hold.board), hold.board);
check('two hold tiers make 90, a galleon with them 140', hold.cap2 === 90 && hold.capG === 140, hold);
check('with her at the harbour a sale comes out of the hold', hold.fromHold === 3, hold);
check('with her away the board says so and a sale comes off your back', /not at this harbour/.test(hold.away) && hold.holdAway === 3 && /Sold a crate of iron/.test(hold.sellAway), hold);
check('a shop counter takes no crate', hold.counterPrice === 0 && hold.counterGold === 0 && /factor/.test(hold.counterMsg), hold);

// the save keeps the market
const sv = await page.evaluate((ports) => { worldState.cargoMkt = {}; const G = WORLD.siteAnywhere(ports.gatelands); gold = 500; WORLD.cargoBuy(G, 'wool'); WORLD.cargoBuy(G, 'wool');
  const ask = WORLD.cargoAsk(G, 'wool'); const d = JSON.parse(ssStringify(_buildSavePayload())); worldState.cargoMkt = {}; const cleared = WORLD.cargoAsk(G, 'wool');
  _applyLoadData(d); return { ask, cleared, loaded: WORLD.cargoAsk(G, 'wool') }; }, ports);
check('the save keeps each quay’s prices', sv.ask === 19 && sv.cleared === 18 && sv.loaded === 19, sv);

// through the harbourmaster's own dialogue
const port = ports.mark; await g.settle(port);
const talk = await page.evaluate((port) => { worldState.cargoMkt = {}; worldState.ship = null; gold = 300; updateHUD(); forceTime(12); for (let i = 0; i < 300; i++) WORLD.tick(1 / 60, performance.now());
  const n = WORLD.settle.get(port).npcs.find(n => n.def.role === 'Harbourmaster'); if (!n) return null; window._n = n; n._scared = performance.now() + 1;
  window._place = () => { const dx = Math.sin(n.g.rotation.y), dz = Math.cos(n.g.rotation.y); px = n.g.position.x + dx * 1.3; pz = n.g.position.z + dz * 1.3; jumpY = n.g.position.y; yaw = Math.atan2(dx, dz); pitch = 0; }; _place(); return n.def.name; }, port);
check('the Mark harbour has a harbourmaster', !!talk, port);
await g.frames(2); await page.evaluate(() => _place());
await page.keyboard.press('e'); await g.frames(2);
const click = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src).test(x.textContent)); if (b) b.click(); return !!b; }, re);
const ch = await page.evaluate(() => [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim()));
const c1 = await click('Cargo'); await g.frames(1);
const board = await page.evaluate(() => ({ text: document.getElementById('dlg-text').textContent, rows: [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim()) }));
const c2 = await click('Buy a chest of silver'); await g.frames(1);
const bought = await page.evaluate(() => ({ gold, text: document.getElementById('dlg-text').textContent, rows: [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim()), bag: (BAG.find(b => b.cargo === 'silver') || {}).qty || 0 }));
console.log(talk, JSON.stringify(ch), JSON.stringify(board), JSON.stringify(bought));
check('the harbourmaster offers the factor’s prices', c1 && /Selling: Grain|Selling: Iron/.test(board.text) && board.rows.some(r => /Buy a crate of iron \(24 gold\)/.test(r)), { ch, board });
check('buying there takes the gold, puts the chest in your bag, and the board stays open with a sell row', c2 && bought.gold === 243 && bought.bag === 1 && /Bought a chest of silver for 57/.test(bought.text) && bought.rows.some(r => /Sell a chest of silver/.test(r)), bought);
await page.evaluate(() => { closeDialog(); for (let k = BAG.length - 1; k >= 0; k--) if (BAG[k].type === 'cargo') BAG.splice(k, 1); });

stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
