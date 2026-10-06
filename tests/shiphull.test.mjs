// The ship's hull and rig (Session 411; Michael's A on #85, docs/design/sailing.md, its bars and three of its damage
// sources). A hull by class (sloop 100, cog 140, galleon 200) and a rig of 100. Under half her hull she makes ×0.8,
// under a quarter ×0.6, and the rig sets ×(0.5 + 0.5 × rig/100); at 0 hull she makes 2.5 at most. Grounding faster than
// 2 costs (speed − 2) × 4; a ram the closing speed × 3, half bow-on; a volley that comes down on her deck 2 hull and 3 rig.
// The shipwright mends her to full for 4 gold a hull point and 3 a rig point, an hour a 20 points.
// Session 416: the shipwright's replies follow his harbour's people (`tests/shipwrightvoice` checks the words); here, the sums.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const stop = g.keepAlive();

// a coast: from the start, the first line out to sea with 30 units of deep water past the shallows
const coast = await page.evaluate(() => {
  for (let a = 0; a < 6.28; a += .2) { const cx = Math.cos(a), cz = Math.sin(a);
    for (let r = 20; r < 1500; r += 4) { const x = px + cx * r, z = pz + cz * r;
      if (WORLD.worldH(x, z) > WORLD.SEA_Y - 1.4) continue;
      let deep = true; for (let k = 4; k <= 60; k += 4) { const h = WORLD.worldH(px + cx * (r + k), pz + cz * (r + k)); if (h > -4) { deep = false; break; } }
      if (!deep) break;
      for (let s = r - 4; s > 0; s -= 4) if (WORLD.worldH(px + cx * s, pz + cz * s) <= WORLD.SEA_Y - 1.4) { r = s; } else break;
      window._coast = { a, cx, cz, x0: px + cx * r, z0: pz + cz * r, ox: px, oz: pz }; return { a: +a.toFixed(2), r }; } }
  return null; });
check('found a shore with deep water off it', !!coast, coast);

const key = (code, down) => page.evaluate(([code, down]) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code })), [code, down]);
// your sloop, d units out from the shallows' edge, bow to the land
const launch = (d, extra) => page.evaluate(([d, extra]) => { const c = _coast; for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = Object.assign({ cls: 'sloop', name: 'Test Gull' }, extra || {}); const yaw = Math.atan2(c.cx, c.cz);
  WORLD.spawnShip(c.x0 + c.cx * d, c.z0 + c.cz * d, yaw); const S = WORLD.ship; S.sailing = true; S.speed = 0; WORLD.tick(1 / 60, performance.now()); return WORLD.shipBars(); }, [d, extra]);

const fresh = await launch(40);
const speeds = await page.evaluate(() => { const st = worldState.ship, out = {};
  for (const [h, r] of [[100, 100], [60, 100], [45, 100], [20, 100], [100, 50], [45, 50], [0, 100]]) { st.hull = h; st.rig = r; out[h + '/' + r] = +WORLD.shipSpeedNow().toFixed(3); }
  st.hull = 100; st.rig = 100; return out; });
console.log(JSON.stringify({ fresh, speeds }));
check('a sloop starts at hull 100 of 100 and rig 100 of 100', fresh.hull === 100 && fresh.hullMax === 100 && fresh.rig === 100, fresh);
check('speed: 7.5 sound, 7.5 at 60, 6.0 under half (45), 4.5 under a quarter (20), 5.625 at rig 50, 4.5 at both, 2.5 waterlogged',
  speeds['100/100'] === 7.5 && speeds['60/100'] === 7.5 && speeds['45/100'] === 6 && speeds['20/100'] === 4.5 && speeds['100/50'] === 5.625 && speeds['45/50'] === 4.5 && speeds['0/100'] === 2.5, speeds);

// sail her at the shore under full sail (W held) until she stops
const sail = () => page.evaluate(() => { const S = WORLD.ship; let v = 0, n = 0, msg = '';
  for (; n < 1800; n++) { const before = Math.abs(S.speed); WORLD.tick(1 / 60, performance.now()); if (S.speed === 0 && before > 0) { v = before; msg = document.getElementById('msg').textContent; break; } }
  return { v: +v.toFixed(2), ticks: n, hull: WORLD.shipBars().hull, msg }; });
await launch(40); await key('KeyW', true); const hard = await sail(); await key('KeyW', false);
console.log(JSON.stringify(hard));
const want = Math.round((hard.v - 2) * 4);
check('driven onto the shallows at speed, she loses (speed − 2) × 4 of her hull', hard.v > 4 && hard.hull === 100 - want && want > 8, { hard, want });
check('and says so', /Aground — she strikes the shallows\. Hull −\d+\./.test(hard.msg), hard.msg);
// the same shore at a crawl: S held drifts her astern; W tapped to under 2
await launch(14); await page.evaluate(() => { WORLD.ship.speed = 1.6; }); await key('KeyW', true);
const soft = await page.evaluate(() => { const S = WORLD.ship; let n = 0, v = 0; for (; n < 1800; n++) { const b = S.speed; WORLD.tick(1 / 60, performance.now()); S.speed = Math.min(S.speed, 1.6); if (S.speed === 0 && b > 0) { v = b; break; } } return { v: +v.toFixed(2), ticks: n, hull: WORLD.shipBars().hull }; }); await key('KeyW', false);
console.log(JSON.stringify(soft));
check('below 2 she only stops, as before: no hull lost', soft.v > 0 && soft.v < 2 && soft.hull === 100, soft);

// rams: a black sail dead ahead of your bow, you at 7 into her; then a merchantman driven into your beam while you lie still.
// The world's own ships go first, as in launch: on a slow runner one sailed in between the steps, and its touch (speed × .6)
// came before hers, so the ram counted 4.2, not 7 (S483)
const rams = await page.evaluate(() => { const S = WORLD.ship, out = {}; const fx = -Math.sin(S.yaw), fz = -Math.cos(S.yaw);
  out.cleared = WORLD.others.length; for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship.hull = 100; S.x = _coast.x0 + _coast.cx * 400; S.z = _coast.z0 + _coast.cz * 400; S.sailing = false;
  const o = WORLD.spawnOtherShip('pirate', S.x + fx * 7.5, S.z + fz * 7.5); o.speed = 0; o.yaw = S.yaw + Math.PI / 2;
  S.speed = 7; WORLD.tickHullCollisions(1 / 60); out.bow = { hull: WORLD.shipBars().hull, msg: document.getElementById('msg').textContent };
  WORLD.tickHullCollisions(1 / 60); out.bowAgain = WORLD.shipBars().hull; WORLD.despawnOtherShip(o);
  worldState.ship.hull = 100; S.speed = 0; const sx = -fz, sz = fx; const m = WORLD.spawnOtherShip('merchant', S.x + sx * 8.5, S.z + sz * 8.5);
  m.yaw = Math.atan2(sx, sz); m.speed = 4; WORLD.tickHullCollisions(1 / 60); out.beam = { hull: WORLD.shipBars().hull, msg: document.getElementById('msg').textContent };
  m.speed = 0; m.x += sx * 6; m.z += sz * 6; WORLD.tickHullCollisions(1 / 60); m.x -= sx * 7; m.z -= sz * 7; m.speed = 4; WORLD.tickHullCollisions(1 / 60); out.beamAgain = WORLD.shipBars().hull;
  WORLD.despawnOtherShip(m); return out; });
console.log(JSON.stringify(rams));
check('bow-on into her at 7: half of 7 × 3, hull −11 (to 89)', rams.bow.hull === 89 && /You ram her\. Hull −11\./.test(rams.bow.msg), rams.bow);
check('still touching, it does not count again', rams.bowAgain === 89, rams);
check('a merchantman into your beam at 4 while you lie still: 4 × 3, hull −12 (to 88)', rams.beam.hull === 88 && /The hulls strike\. Hull −12\./.test(rams.beam.msg), rams.beam);
check('once she has drawn off and comes again, it counts again (76)', rams.beamAgain === 76, rams);

// a volley on your deck (from a black sail's crew since S612, her own volleys and ram held off): 2 hull and 3 rig, once a volley however many arrows; one at you in the water off her costs her nothing
const volleys = await page.evaluate(() => { const S = WORLD.ship, out = {}; worldState.ship.hull = 100; worldState.ship.rig = 100; S.sailing = true; S.speed = 0;
  const o = WORLD.spawnOtherShip('pirate', S.x + 30, S.z); o.volleyT = 1e9; o.ramWait = 1e9; WORLD.tick(1 / 60, performance.now()); WORLD.tick(1 / 60, performance.now()); out.atHelm = +Math.hypot(px - S.helm.x, pz - S.helm.z).toFixed(2);
  const R = Math.random; Math.random = () => .5; const before = WORLD.arrows.length; PHP = maxHP; WORLD.volley(o); Math.random = R; out.arrows = WORLD.arrows.length - before;
  for (let i = 0; i < 240 && WORLD.arrows.length; i++) WORLD.tick(1 / 60, performance.now());
  out.deck = WORLD.shipBars(); out.left = WORLD.arrows.length;
  S.sailing = false; px = S.x + 40; pz = S.z + 40; jumpY = WORLD.SEA_Y - .35; Math.random = () => .5; WORLD.volley(o); Math.random = R;
  for (let i = 0; i < 240 && WORLD.arrows.length; i++) WORLD.tick(1 / 60, performance.now());
  out.water = WORLD.shipBars(); WORLD.despawnOtherShip(o); PHP = maxHP; return out; });
console.log(JSON.stringify(volleys));
check('a volley of 2–3 arrows on her deck: hull 98, rig 97', volleys.arrows >= 2 && volleys.atHelm < .01 && volleys.deck.hull === 98 && volleys.deck.rig === 97, volleys);
check('a volley at you in the water 40 units off: nothing to her', volleys.water.hull === 98 && volleys.water.rig === 97, volleys);

// the panel: shown at the wheel with her numbers, hidden off her
const panel = await page.evaluate(() => { const S = WORLD.ship; S.sailing = true; WORLD.tick(1 / 60, performance.now()); WORLD.shipBarsUI(); const el = document.getElementById('shipbars');
  const on = { shown: el && el.style.display === 'block', text: el && el.textContent };
  S.sailing = false; px = S.x + 40; pz = S.z + 40; WORLD.shipBarsUI(); return { on, off: el.style.display }; });
console.log(JSON.stringify(panel));
check('at the wheel a panel shows "The Test Gull", hull 98 / 100 and rig 97 / 100; off her it is hidden', panel.on.shown && /The Test Gull/.test(panel.on.text) && /Hull 98 \/ 100/.test(panel.on.text) && /Rig 97 \/ 100/.test(panel.on.text) && panel.off === 'none', panel);

// the shipwright: berth her at a port, damage her, ask
const port = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0]; window._port = s; return s && s.id; });
const yard = await page.evaluate(() => { const s = _port, S = WORLD.ship, st = worldState.ship, out = {};
  S.sailing = false; S.x = s.x + 60; S.z = s.z; st.hull = 55; st.rig = 80; gold = 1000; worldState.gameTimeAbsMinutes = 10000;
  const t = WORLD.upgradeTopics(s).find(x => /^Mend her/.test(x.label)); out.label = t && t.label;
  out.reply = t && t.fn(); out.gold = gold; out.mins = Math.round(worldState.gameTimeAbsMinutes - 10000); out.bars = WORLD.shipBars();
  out.afterLabels = WORLD.upgradeTopics(s).map(x => x.label).filter(l => /^Mend/.test(l));
  st.hull = 90; gold = 30; const t2 = WORLD.upgradeTopics(s).find(x => /^Mend her/.test(x.label)); out.poor = t2 && t2.fn(); out.poorHull = WORLD.shipBars().hull; out.poorGold = gold;
  S.x = s.x + 400; out.far = WORLD.upgradeTopics(s).some(x => /^Mend/.test(x.label)); S.x = s.x + 60;
  st.cls = 'sloop'; gold = 5000; st.hull = 100; const r = WORLD.upgradeTopics(s).find(x => /^Refit her as a cog/.test(x.label)); if (r) r.fn(); out.cog = WORLD.shipBars();
  return out; });
console.log(port, JSON.stringify(yard));
check('in port, the shipwright offers "Mend her: hull 55 of 100, rig 80 of 100 (240 gold)"', yard.label === 'Mend her: hull 55 of 100, rig 80 of 100 (240 gold)', yard.label);
check('mending takes 4 a hull point and 3 a rig point (180 + 60) and an hour a 20 points (65 points, 195 minutes), and she is sound',
  yard.gold === 760 && yard.mins === 195 && yard.bars.hull === 100 && yard.bars.rig === 100 && /^3 hours in the yard\b.*\bsound again, hull and rig/i.test(yard.reply), yard);
check('sound, he offers no mending', yard.afterLabels.length === 0, yard.afterLabels);
check('short of the 40 gold, nothing changes hands and she stays at 90', /\b40 gold\b/.test(yard.poor) && yard.poorHull === 90 && yard.poorGold === 30, yard);
check('with her 400 units off, he cannot mend her', yard.far === false, yard);
check('refitted as a cog she is a new hull, 140 of 140', yard.cog.hull === 140 && yard.cog.hullMax === 140, yard.cog);

check('no page errors', g.errs.length === 0, g.errs);
stop(); await g.close();
