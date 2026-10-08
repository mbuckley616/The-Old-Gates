// Session 467: the Compact's rank-3 claim is *a house and a ship*. A Prior who already owns a ship is given a refit
// (Michael's B on #128): she is mended and raised one class free, sloop → cog → galleon (since S636 by worth, through the
// cutter and caravel), where she lies; a galleon is only
// mended. A sunk ship is raised free by the shipwright nearest her wreck, a class up. The claim is clicked in the lord's
// own dialogue at the seat, as `blacksail` does it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const seat = await page.evaluate(() => { WORLD.anchoredPlaces(); const C = WORLD.fstate().compact;
  Object.assign(C, { done: 9, rank: 3, active: null, closed: false, house: false }); worldState.ship = null; gold = 500; updateHUD(); forceTime(11);
  const s = WORLD.siteAnywhere(WORLD.FACTIONS.compact.seat); px = s.x; pz = s.z; return { id: s.id, name: s.name }; });
await g.settle(seat.id);
await page.evaluate((id) => { const S = WORLD.settle.get(id); window._lord = S.lordNpc ? S.lordNpc.def : (S.houses.find(h => h.type === 'castle') || {}).dlg; }, seat.id);

const claim = async () => { await page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} WORLD.fstate().compact.house = false; openDialog(window._lord); }); await g.frames(2);
  const clicked = await page.evaluate(() => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => /^Claim a house and a ship\.$/.test(x.textContent.trim().replace(/^\d+\.\s*/, ''))); if (b) b.click(); return !!b; });
  await g.frames(2); const said = await page.evaluate(() => (document.getElementById('dlg-text') || {}).textContent || '');
  await page.evaluate(() => { try { if (dlgOpen) closeDialog(); } catch (e) {} }); return { clicked, said }; };
const state = () => page.evaluate(() => { const st = worldState.ship || {}; const S = WORLD.ship; const b = WORLD.shipBars();
  return { cls: st.cls || 'sloop', hull: b.hull, hullMax: b.hullMax, rig: b.rig, L: S.L, W: S.W, mesh: !!S.mesh, x: Math.round(S.x), z: Math.round(S.z), gold,
    sunk: !!st.sunk, raise: st.raise || null }; });

// a battered sloop of your own, moored off the seat
await page.evaluate((id) => { const s = WORLD.siteAnywhere(id); WORLD.spawnShip(s.x + 300, s.z + 300, 0); const st = worldState.ship; st.hull = 40; st.rig = 55; }, seat.id);
const s0 = await state();
const c1 = await claim(); const s1 = await state();
console.log('sloop', JSON.stringify(s0), JSON.stringify(c1), JSON.stringify(s1));
check('the claim is clicked in the lord\'s dialogue and deeds the house', c1.clicked && c1.said === 'Entered in your name, Prior: the house. You keep a ship already, so the Compact has seen to her where she lies: mended, and refitted as a cog, at its own charge.', c1);
check(`a sloop at hull ${s0.hull}, rig ${s0.rig} is refitted as a cog: hull ${s1.hull} of ${s1.hullMax}, rig ${s1.rig}`, s0.cls === 'sloop' && s1.cls === 'cog' && s1.hull === 140 && s1.hullMax === 140 && s1.rig === 100, { s0, s1 });
check(`her hull is rebuilt at the cog\'s size (${s0.L}×${s0.W} → ${s1.L}×${s1.W}) where she lay, and no gold is taken`, s1.mesh && s1.L === 17 && s1.W === 5.6 && s1.x === s0.x && s1.z === s0.z && s1.gold === s0.gold, { s0, s1 });
const log1 = await page.evaluate(() => JSON.stringify(GAME_LOG.slice(-4)));
check('the log says so', /The Compact mended the .* and refitted her as a cog\./.test(log1), log1);

// further claims (the flag reset by hand). Session 636 (Michael's B on #192): the next hull up is by worth, so the ladder
// runs sloop → cog → cutter → caravel → galleon (1,300 / 2,000 / 3,200 / 3,500); the cutter is drawn on the sloop's hull and
// the caravel on the cog's until they have their own
const ladder = [];
for (const [cls, hull, L] of [['cutter', 80, 13], ['caravel', 130, 17], ['galleon', 200, 22]]) {
  await page.evaluate(() => { worldState.ship.hull = 10; worldState.ship.rig = 20; });
  const c = await claim(); const s = await state(); ladder.push({ want: cls, clicked: c.clicked, said: c.said, cls: s.cls, hull: s.hull, rig: s.rig, L: s.L });
  check(`the next claim refits her as a ${cls} (${s.L} long, hull ${s.hull} of ${s.hullMax}, rig ${s.rig})`, c.clicked && s.cls === cls && s.hull === hull && s.hullMax === hull && s.rig === 100 && s.L === L && c.said.endsWith(`refitted as a ${cls}, at its own charge.`), { c, s });
}
console.log('ladder', JSON.stringify(ladder));

// a galleon is only mended
await page.evaluate(() => { worldState.ship.hull = 77; worldState.ship.rig = 3; });
const c3 = await claim(); const s3 = await state();
const log3 = await page.evaluate(() => JSON.stringify(GAME_LOG.slice(-4)));
console.log('galleon', JSON.stringify(c3), JSON.stringify(s3));
check(`a galleon stays a galleon and is mended (hull ${s3.hull}, rig ${s3.rig})`, c3.clicked && /mended, at its own charge\. There is no larger hull to enter\.$/.test(c3.said) && s3.cls === 'galleon' && s3.hull === 200 && s3.rig === 100 && /The Compact mended the /.test(log3), { s3, log3 });

// sunk: raised free by the shipwright nearest the wreck, a class up
const sk = await page.evaluate(() => { worldState.ship.cls = 'sloop'; WORLD.ship.sailing = false; const S = WORLD.ship; const x0 = S.x, z0 = S.z;
  WORLD.shipWear(999, 0); WORLD.shipWear(5, 0); return { sunk: worldState.ship.sunk, x0, z0 }; });
const g4 = await page.evaluate(() => gold);
const c4 = await claim(); const s4 = await state();
const raise = await page.evaluate(() => { const st = worldState.ship; const site = st.raise && WORLD.siteAnywhere(st.raise.site); const ports = WORLD.allPorts();
  const near = st.sunk ? ports.slice().sort((a, b) => Math.hypot(a.x - st.sunk.x, a.z - st.sunk.z) - Math.hypot(b.x - st.sunk.x, b.z - st.sunk.z)).slice(0, 3).map(p => p.id) : [];
  return { site: site && site.name, id: site && site.id, near, dueIn: st.raise ? st.raise.due - (worldState.gameTimeAbsMinutes || 0) : null }; });
console.log('sunk', JSON.stringify(sk), JSON.stringify(c4), JSON.stringify(s4), JSON.stringify(raise));
check(`sunk, she is raised free at ${raise.site} (near her wreck) in three days, refitted as a cog`, !!sk.sunk && c4.clicked && c4.said === `Entered in your name, Prior: the house. Your ship lies on the bottom; the shipwright at ${raise.site} has the Compact's order to raise her, a class better, and three days to do it.` && s4.sunk && s4.cls === 'cog' && raise.dueIn === 3 * 1440 && raise.near.includes(raise.id) && s4.gold === g4, { sk, s4, raise });
const up = await page.evaluate(() => { worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes || 0) + 3 * 1440 + 1; for (let i = 0; i < 70; i++) WORLD.tick(1 / 60 * 60, performance.now());
  const st = worldState.ship; return { sunk: !!st.sunk, mesh: !!WORLD.ship.mesh, cls: st.cls, hull: st.hull, L: WORLD.ship.L }; });
console.log('raised', JSON.stringify(up));
check(`three days on she lies at that quay as a cog, hull ${up.hull}`, !up.sunk && up.mesh && up.cls === 'cog' && up.hull === 140 && up.L === 17, up);

// with no ship at all, the claim still moors a sloop (Session 457)
await page.evaluate(() => { const S = WORLD.ship; if (S.mesh) { S.mesh.parent && S.mesh.parent.remove(S.mesh); S.mesh = null; } worldState.ship = null; });
const c5 = await claim(); const s5 = await page.evaluate(() => ({ ship: !!worldState.ship, cls: (worldState.ship || {}).cls || 'sloop', mesh: !!WORLD.ship.mesh }));
check('with no ship, the claim still gives a sloop', c5.clicked && /^Entered in your name, Prior: the house(, and the ship at the quay| here, and the ship at the quay at .+)\.$/.test(c5.said) && s5.ship && s5.mesh && s5.cls === 'sloop', s5);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
