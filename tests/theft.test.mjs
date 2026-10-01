// The theft fine and the cells (Session 168): a seen theft is fined 50 and the goods' value, as the crime system's
// spec says (it was 50 flat), and the cells take back the gold stolen in that town as well as the stolen things.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const stop = g.keepAlive();

const ids = await page.evaluate(() => { forceTime(13); worldState.crime = {}; BAG.push({ name: 'Lockpick', ico: '🗝', type: 'misc', buyPrice: 12, sellMult: .4, weight: .05, qty: 20 }); // priced as the shop's, so a stolen pick that joins this stack is valued at 12
  return WORLD.settle.get('dunmore').houses.filter(x => /weapon|armor|potion|misc/.test(x.type) && x.keeper).map(x => x.id); });
const got = {};
for (const id of ids) {
  if (got.seen && got.unseen) break;
  await page.evaluate((id) => { const h = WORLD.settle.get('dunmore').houses.find(x => x.id === id); window._h = h; forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); }, id);
  await page.waitForTimeout(4500); await g.hide();
  const r = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const X = WORLD.intBox; if (!X) return null;
    px = X.x; pz = X.z + .8; jumpY = 0; const K_ = intNPCMesh; if (K_) { K_.userData.amble = null; K_.rotation.y = Math.atan2(px - K_.position.x, pz - K_.position.z); } // (S368: the keeper stands and watches the box: the cone is keepercone's, the fine and the guard are this test's)
    const seenHere = !!WORLD.witnessOf(window._h);
    const c0 = { ...((worldState.crime || {}).dunmore || {}) }; const gold0 = gold; const added = [], _ba = window.bagAdd; window.bagAdd = function (it) { added.push({ name: it.name, buyPrice: (it.buyPrice || 0) * (it.qty || 1) }); return _ba.apply(this, arguments); }; WORLD.boxInteract();
    for (let k = 0; k < 8 && LP.phase !== 'done'; k++) { lpPress(); LP.pushed = performance.now() - LP.rise - 5; lpPress(); }
    await wait(900); window.bagAdd = _ba; const coins = gold - gold0; const taken = added; const value = coins + taken.reduce((a, it) => a + (it.buyPrice || 0), 0); // each thing at its own price as the box hands it over: a stolen potion or pick may join a stack priced otherwise (S176)
    const c = (worldState.crime || {}).dunmore || {}; exitInterior();
    return { name: window._h.name, seenHere, coins, items: taken.map(i => i.name + ':' + (i.buyPrice || 0)), value, fine: (c.bounty || 0) - (c0.bounty || 0), loot: (c.loot || 0) - (c0.loot || 0), favour: WORLD.favor('dunmore') }; });
  await page.waitForTimeout(2500); await g.hide();
  if (!r || r.coins <= 0) continue;
  if (r.seenHere && !got.seen) got.seen = r; else if (!r.seenHere && !got.unseen) got.unseen = r;
}
check('an unseen theft costs nothing, but the town keeps count of the gold', got.unseen && got.unseen.fine === 0 && got.unseen.loot === got.unseen.coins, got.unseen);
check('a seen theft is fined 50 and the goods’ value (coins and the thing taken)', got.seen && got.seen.fine === 50 + got.seen.value && got.seen.value > got.seen.coins && got.seen.loot === got.seen.coins, got.seen);

// yield to the watch and take the cells: the stolen things and the stolen gold go back
const cells = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const S = WORLD.settle.get('dunmore'); const site = S.site;
  forceTime(12); px = site.x; pz = site.z + 18; jumpY = 0; const c = worldState.crime.dunmore; const loot = c.loot, bounty = c.bounty;
  gold = 900; BAG.push({ name: 'Honest bread', ico: '🍞', type: 'misc', weight: .1, qty: 1 });
  const gd = WORLD.guardsOf(S)[0]; gd.g.visible = true; gd._retreated = false; gd._drawn = false; gd.g.position.set(px + 2.5, WORLD.worldH(px + 2.5, pz), pz);
  WORLD.guardDraw(gd, S); PHP = Math.round(maxHP * .2); const abs0 = worldState.gameTimeAbsMinutes || 0; WORLD.tickCrime(1 / 60, performance.now());
  const t = dlgOpen && dlgNPC.topics.find(x => /cells/i.test(x.label)); if (!t) return { noOffer: true, dlg: dlgOpen && dlgNPC.greeting };
  t.fn(); for (let k = 0; k < 240 && (worldState.gameTimeAbsMinutes || 0) === abs0; k++) await wait(250); await wait(300);
  return { loot, bounty, gold, left: c.loot, stolenGone: !BAG.some(i => i.stolen), breadKept: BAG.some(i => i.name === 'Honest bread'), fine: WORLD.bountyAt('dunmore'),
    msg: document.getElementById('msg') ? document.getElementById('msg').textContent : '', log: GAME_LOG.slice(-1)[0] && GAME_LOG.slice(-1)[0].text }; });
check('the cells take the stolen things and the gold stolen in the town, and clear the fine', !cells.noOffer && cells.gold === 900 - cells.loot && cells.loot > 0 && cells.left === 0 && cells.stolenGone && cells.breadKept && cells.fine === 0 && new RegExp(cells.loot + ' gold').test(cells.log), cells);

// with less on you than you stole, they take what you have
const poor = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); const S = WORLD.settle.get('dunmore'); const site = S.site; const c = worldState.crime.dunmore;
  try { closeDialog(); } catch (err) {} await wait(200); WORLD.tickCrime(1 / 60, performance.now()); // the cells' dialogue shut, and a tick with no one drawn resets the yield
  c.loot = 300; c.bounty = 75; gold = 40; px = site.x; pz = site.z + 18; const gd = WORLD.guardsOf(S)[0]; gd.g.visible = true; gd._retreated = false; gd._drawn = false; gd.g.position.set(px + 2.5, WORLD.worldH(px + 2.5, pz), pz);
  WORLD.guardDraw(gd, S); PHP = Math.round(maxHP * .2); const abs0 = worldState.gameTimeAbsMinutes || 0; WORLD.tickCrime(1 / 60, performance.now());
  const t = dlgOpen && dlgNPC.topics.find(x => /cells/i.test(x.label)); if (!t) return { noOffer: true }; t.fn();
  for (let k = 0; k < 240 && (worldState.gameTimeAbsMinutes || 0) === abs0; k++) await wait(250); await wait(300); return { gold, left: c.loot }; });
check('with less gold on you than you stole, the cells take what you have and no more', poor.gold === 0 && poor.left === 0, poor);
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
