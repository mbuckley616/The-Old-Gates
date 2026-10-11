// The factor's panel (Session 641; Michael's B on #192, the ship in hand, item 4): the harbourmaster's Cargo opens a
// parchment board, one row per good with the ask, the bid and what you hold, − and + a crate, Fill (as many of one good as
// the hold takes and the purse pays for), and the hold's bar. Every change goes through cargoBuy / cargoSell.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const ports = await page.evaluate(() => { const out = {}; const s = WORLD.siteAnywhere('dunmore');
  for (const p of WORLD.allPorts().sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z))) { const n = WORLD.cargoNation(p); if (!out[n]) out[n] = p.id; }
  return out; });
check('a harbour in the Mark and in Aurenne', ports.mark && ports.aurenne, ports);
const R = () => page.evaluate(() => { const rows = {}; for (const tr of document.querySelectorAll('#cargo-rows tr[data-k]')) { const td = [...tr.children];
    rows[tr.dataset.k] = { ask: td[1].textContent, bid: td[2].textContent, held: td[3].textContent, ...Object.fromEntries([...tr.querySelectorAll('button')].map(b => [b.dataset.a, !b.disabled])) }; }
  const bar = document.getElementById('cargo-bar');
  return { open: cargoOpen, rows, order: Object.keys(rows), hold: document.getElementById('cargo-hold').textContent, bar: bar ? bar.style.width : null, said: document.getElementById('cargo-said').textContent,
    gold, purse: document.getElementById('cargo-gold').textContent, notes: document.getElementById('cargo-notes').textContent, title: document.getElementById('cargo-title').textContent }; });
const btn = (k, a) => page.evaluate(([k, a]) => document.querySelector(`#cargo-rows tr[data-k="${k}"] button[data-a="${a}"]`).click(), [k, a]);

// the ship in port at the Mark: a sloop, hold 40
await page.evaluate((ports) => { worldState.cargoMkt = {}; const M = WORLD.siteAnywhere(ports.mark); window._M = M;
  worldState.ship = { cls: 'sloop', cargo: 0, name: 'Test Gull' }; WORLD.ship.mesh = WORLD.ship.mesh || new THREE.Group(); WORLD.ship.x = M.x + 60; WORLD.ship.z = M.z;
  for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].type === 'cargo') BAG.splice(i, 1); gold = 1000; openCargoPanel(M); }, ports);
const a = await R();
console.log(JSON.stringify(a));
check('the board opens titled by the town', a.open && /^The factor’s board — /.test(a.title), a.title);
check('thirteen rows, the island’s own four first', a.order.length === 13 && a.order.slice(0, 4).sort().join() === 'furs,iron,silver,timber', a.order);
check('own goods are asked (iron 24) and can be bought and filled; goods from abroad are not asked and cannot be bought', a.rows.iron.ask === '24' && a.rows.iron.buy && a.rows.iron.fill && a.rows.grain.ask === '—' && !a.rows.grain.buy && !a.rows.grain.fill && a.rows.grain.bid === '25', a.rows);
check('nothing held: − is off everywhere', Object.values(a.rows).every(r => !r.sell && r.held === '—'), a.rows);
check('the hold reads 0 of 40 with an empty bar', /'s hold: 0 of 40/.test(a.hold) && a.bar === '0%', { hold: a.hold, bar: a.bar });

await btn('iron', 'fill'); const b = await R();
console.log(JSON.stringify({ said: b.said, gold: b.gold, hold: b.hold, bar: b.bar, iron: b.rows.iron }));
check('Fill takes four crates of iron aboard (24 + 25 + 26 + 27 = 102) and stops at the hold', /Took aboard 4 × crate of iron for 102 gold/.test(b.said) && b.gold === 898 && b.rows.iron.held === '4' && /40 of 40/.test(b.hold) && b.bar === '100%', b);
check('the purse line follows', b.purse === 'Your purse: 898 gold', b.purse);
await btn('iron', 'fill'); const c = await R();
check('a full hold fills no more and says so', c.said === 'No room in the hold.' && c.gold === 898, c.said);
await btn('iron', 'sell'); const d = await R();
check('− sells a crate out of the hold (bid 22 after four bought: 24)', /^Sold a crate of iron for \d+ gold\.$/.test(d.said) && d.rows.iron.held === '3' && /30 of 40/.test(d.hold) && d.gold > 898, d);
await btn('furs', 'buy'); const e = await R();
check('+ buys one crate (a bale of furs, 36) into the hold', /Bought a bale of furs for 36 gold/.test(e.said) && e.rows.furs.held === '1' && /35 of 40/.test(e.hold), e);

// a short purse: Fill stops at what you can pay for
await page.evaluate(() => { const h = worldState.ship.hold; for (const k in h) delete h[k]; worldState.cargoMkt = {}; gold = 60; cargoPanelDraw(); });
await btn('silver', 'fill'); const f = await R();
check('with 60 gold Fill buys one chest of silver (57) and stops at the purse', /Took aboard 1 × chest of silver for 57 gold/.test(f.said) && f.gold === 3 && f.rows.silver.held === '1', f);
await btn('silver', 'fill'); const f2 = await R();
check('and then says the price', /^A chest of silver is 59 gold\.$/.test(f2.said), f2.said);

// the ship away: what you buy, you carry; Fill is off
await page.evaluate(() => { WORLD.ship.x = _M.x + 400; gold = 500; cargoPanelDraw(); });
const h = await R();
check('with her away the board says so, Fill is off, and + puts a crate on your back', /not at this harbour; what you buy, you carry/.test(h.hold) && !h.rows.iron.fill && h.rows.iron.buy && h.bar === null, h);
await btn('timber', 'buy'); const h2 = await R();
check('a load of timber goes on your back', /Bought a load of timber/.test(h2.said) && h2.rows.timber.held === '1', h2.rows.timber);

// Aurenne: the tithe in the notes
await page.evaluate((ports) => { closeCargoPanel(); openCargoPanel(WORLD.siteAnywhere(ports.aurenne)); }, ports);
const t = await R();
check('in Aurenne the notes name the tithe', /The Compact tithes every sale a tenth\./.test(t.notes), t.notes);

// E closes it, and the loop stands while it is open
const p0 = await page.evaluate(() => px);
await page.keyboard.down('KeyW'); await g.frames(4); await page.keyboard.up('KeyW');
const still = await page.evaluate(p0 => Math.abs(px - p0) < 1e-6, p0);
check('while it is open, W does not walk you', still);
await page.keyboard.press('e'); await g.frames(2);
const shut = await page.evaluate(() => ({ open: cargoOpen, shown: document.getElementById('cargoui').style.display, dlg: dlgOpen }));
check('E closes the board and opens nothing else', !shut.open && shut.shown === 'none' && !shut.dlg, shut);
await page.evaluate(() => { worldState.ship = null; for (let k = BAG.length - 1; k >= 0; k--) if (BAG[k].type === 'cargo') BAG.splice(k, 1); });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
