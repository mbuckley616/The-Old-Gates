// Foundering and the wreck (Session 413; Michael's A on #85, docs/design/sailing.md). At 0 hull she is waterlogged; any
// hull lost after that sinks her. The wreck is on the map where she went down, and a reload does not bring her back. Any
// shipwright raises her, class and tiers, for 30% of what they cost, and she lies at his quay three game days later.
// Session 639: her hold is lost with her, and she comes up empty.
// Session 416: the shipwright's replies follow his harbour's people (`tests/shipwrightvoice` checks the words); here, the sums.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

const port = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0]; window._port = s;
  let sx = null, sz = null; for (let r = 300; r < 3000 && sx === null; r += 30) for (let a = 0; a < 6.28; a += .3) { const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
    if ([[0, 0], [20, 0], [-20, 0], [0, 20], [0, -20]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -5)) { sx = x; sz = z; break; } }
  window._sea = { x: sx, z: sz }; return { id: s.id, sea: sx !== null }; });
check('a port, and open sea off it', !!port.id && port.sea, port);

// a sloop with sails 1 and hold 1 at the wheel, waterlogged, then one more point of storm wear
const sink = await page.evaluate(() => { for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o); const out = {};
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 1, cargo: 1, hold: { grain: 2, horse: 1 } }; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true; WORLD.tick(1 / 60, performance.now());
  WORLD.shipWear(100, 0); out.waterlogged = { hull: WORLD.shipBars().hull, mesh: !!S.mesh, msg: document.getElementById('msg').textContent, top: +WORLD.shipSpeedNow().toFixed(2) };
  WORLD.shipWear(0, 5); out.rigOnly = !!S.mesh;
  const plats = WORLD.ship.plat ? 1 : 0; const r = WORLD.shipWear(1, 0); out.r = r;
  out.after = { mesh: !!S.mesh, sailing: S.sailing, plat: S.plat, msg: document.getElementById('msg').textContent, log: JSON.stringify(GAME_LOG.slice(-3)), jumpY: +jumpY.toFixed(2), sunk: worldState.ship.sunk, hold: worldState.ship.hold, plats };
  for (let i = 0; i < 60; i++) WORLD.tick(1 / 60, performance.now()); out.swimming = WORLD.isSwimming();
  const cell = WORLD.getCell(...WORLD.cellOf(_sea.x, _sea.z)); out.map = WORLD.mapEntries(cell).filter(e => e.id === 'shipwreck' || e.id === 'ship').map(e => e.name + ' · ' + e.sub);
  out.panel = (document.getElementById('shipbars') || {}).style?.display;
  WORLD.restoreShip(); out.restored = !!S.mesh; return out; });
console.log(JSON.stringify(sink));
check('at 0 hull she is waterlogged, still afloat, 2.5 at most', sink.waterlogged.hull === 0 && sink.waterlogged.mesh && sink.waterlogged.top === 2.5 && /waterlogged/.test(sink.waterlogged.msg), sink.waterlogged);
check('rig lost while waterlogged does not sink her', sink.rigOnly, sink);
check('one more point of hull sinks her: gone from the sea, no deck, you in the water', !sink.after.mesh && !sink.after.sailing && !sink.after.plat && sink.swimming && /The Test Gull goes down\. Any shipwright can raise her\./.test(sink.after.msg), sink.after);
check('the wreck is on the map where she went down; the ship is not', sink.map.length === 1 && sink.map[0] === 'The wreck of the Test Gull · Where she went down', sink.map);
// Session 639 (Michael's 6 Oct note, B on #192): the hold is lost with her, horse and all (Session 413 kept it)
check('a reload does not raise her; her hold (two crates of grain and a horse) went down with her, and the log says so', !sink.restored && JSON.stringify(sink.after.hold) === '{}' && /The Test Gull sank with 3 crates in her hold\./.test(sink.after.log), sink);
check('the panel hides', sink.panel === 'none', sink.panel);

// waterlogged on the shallows: she settles, she does not sink
const beach = await page.evaluate(() => { const st = worldState.ship; delete st.sunk; st.hull = 0; WORLD.spawnShip(_sea.x, _sea.z, 0); const S = WORLD.ship; S.sailing = true;
  // put her bow over land: the port's own ground
  const s = _port; S.x = s.x; S.z = s.z; S.speed = 2.5; WORLD.tick(1 / 60, performance.now());
  return { mesh: !!S.mesh, hull: WORLD.shipBars().hull, speed: S.speed, msg: document.getElementById('msg').textContent }; });
console.log(JSON.stringify(beach));
check('waterlogged and run onto the shallows at 2.5, she stops and stays afloat', beach.mesh && beach.speed === 0 && beach.hull === 0, beach);

// raise her at the port: 30% of 400 + 250 (sails 1) + 200 (hold 1) = 255
const raise = await page.evaluate(() => { const S = WORLD.ship, st = worldState.ship, out = {}; WORLD.shipWear(1, 0); out.sunk = !S.mesh;
  gold = 1000; const t0 = worldState.gameTimeAbsMinutes || 0; out.cost = WORLD.shipRaiseCost();
  const labels = WORLD.upgradeTopics(_port).map(x => x.label); out.labels = labels;
  const t = WORLD.upgradeTopics(_port).find(x => /^Raise the/.test(x.label)); out.reply = t && t.fn(); out.gold = gold; out.after = WORLD.upgradeTopics(_port).map(x => x.label);
  worldState.gameTimeAbsMinutes = t0 + 3 * 1440 - 30; for (let i = 0; i < 90; i++) WORLD.tick(1 / 60, performance.now()); out.early = !!S.mesh;
  worldState.gameTimeAbsMinutes = t0 + 3 * 1440 + 1; for (let i = 0; i < 90; i++) WORLD.tick(1 / 60, performance.now());
  out.raised = !!S.mesh; const q = _port.quayStart || _port; out.dist = S.mesh ? Math.round(Math.hypot(S.x - q.x, S.z - q.z)) : null; out.bars = WORLD.shipBars(); out.sunkAfter = !!st.sunk; out.hold = st.hold; out.name = S.name;
  const cell = WORLD.getCell(...WORLD.cellOf(_sea.x, _sea.z)); out.map = WORLD.mapEntries(cell).filter(e => e.id === 'shipwreck').length;
  st.hull = 60; out.yard = WORLD.upgradeTopics(_port).map(x => x.label.replace(/ \(.*/, '')); st.hull = 100;
  out.poorCase = (() => { st.sunk = { x: _sea.x, z: _sea.z }; gold = 100; const t = WORLD.upgradeTopics(_port).find(x => /^Raise/.test(x.label)); const r = t && t.fn(); const g2 = gold; delete st.sunk; return { r, g2, raise: !!st.raise }; })();
  st.cls = 'galleon'; st.sails = 3; st.cargo = 2; out.galleon = WORLD.shipRaiseCost(); return out; });
console.log(JSON.stringify(raise));
check('sunk, the shipwright offers only "Raise the Test Gull (255 gold)": no refits, no mending', raise.sunk && raise.cost === 255 && raise.labels.length === 1 && raise.labels[0] === 'Raise the Test Gull (255 gold)', raise.labels);
check('paid, he says three days and offers nothing more', raise.gold === 745 && /^Three days\b.*\bquay\b/.test(raise.reply) && raise.after.length === 0, raise);
check('half an hour short of three days she is not there', !raise.early, raise);
check('at three days she lies off his quay (where *Fetch her* puts a ship, within 60 of the quay\'s head), sound (100 / 100), the same name, her hold empty; the wreck is off the map', raise.raised && raise.dist < 60 && raise.bars.hull === 100 && raise.bars.rig === 100 && !raise.sunkAfter && raise.name === 'Test Gull' && JSON.stringify(raise.hold) === '{}' && raise.map === 0, raise);
check('lying off his quay she is in port: he offers to mend her, not to fetch her', raise.yard.some(l => /^Mend her/.test(l)) && !raise.yard.some(l => /^Fetch/.test(l)), raise.yard);
check('short of the price, nothing changes hands', /\b255 gold\b/.test(raise.poorCase.r) && raise.poorCase.g2 === 100 && !raise.poorCase.raise, raise.poorCase);
check('a full galleon (sails 3, hold 2): 30% of 400 + 900 + 2,200 + 1,400 + 600 = 1,650', raise.galleon === 1650, raise.galleon);

check('no page errors', g.errs.length === 0, g.errs);
stop(); await g.close();
