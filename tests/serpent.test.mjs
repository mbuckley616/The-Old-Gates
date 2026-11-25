// The sea serpent (Session 2651; the sea that pushes back, session 4: Michael's B on #1925 and B on #2012, 11 m/s;
// `docs/design/the-sea-that-pushes-back-build.md`). The roll is 1 in 250 per chunk-hour key, ×2 in a storm's sea, ×0.5 with its skull;
// it never rises by a black sail or within 20 game hours of its last rise. Risen, it swims at 11 m/s and never over a bed shallower than
// 4 m; within 25 m it tells for 2.5 s and strikes a 9 m circle where she would be 1.0 s into the tell: 15 hull on a still ship, nothing on
// a ship holding her course at 7 m/s. Up 60 s, down 90, up once more if she is near, then gone. Ticked at fixed 1/60 steps in one evaluate.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const roll = await page.evaluate(() => { let n = 0; for (let i = 0; i < 100; i++) for (let j = 0; j < 100; j++) if (serpentRolls(i, j, 3, 14, 1 / 250)) n++;
  let k = 0; for (let i = 0; i < 100; i++) for (let j = 0; j < 100; j++) if (serpentRolls(i, j, 3, 14, 2 / 250)) k++;
  return { n, k, same: serpentRolls(7, 9, 4, 10, .5) === serpentRolls(7, 9, 4, 10, .5) }; });
check(`the roll: ${roll.n} rises in 10,000 keys at 1 in 250 (40 ±15%), ${roll.k} at ×2; one key gives one answer`, roll.n >= 34 && roll.n <= 46 && roll.k >= 68 && roll.k <= 92 && roll.same, roll);

// an open-water spot with a straight 400 m run of deep water ahead, far from any port
const spot = await page.evaluate(() => { const ports = allPorts(); const o = { tried: 0, open: 0 };
  for (const P of ports) for (let r = 600; r <= 3000; r += 300) for (let q = 0; q < 16; q++) { const x = P.x + Math.cos(q * Math.PI / 8) * r, z = P.z + Math.sin(q * Math.PI / 8) * r; o.tried++;
    if (!openWater(x, z)) continue; o.open++; if (ports.some(t => Math.hypot(t.x - x, t.z - z) < 400)) continue;
    for (let a = 0; a < 8; a++) { const yaw = a * Math.PI / 4, fx = -Math.sin(yaw), fz = -Math.cos(yaw); let ok = true;
      for (let d = -120; d <= 400 && ok; d += 10) if (!(worldH(x + fx * d, z + fz * d) < -6)) ok = false;
      if (ok) return { x, z, yaw }; } }
  console.log('no spot', JSON.stringify(o));
  return null; });
check('an open-water spot with 400 m of deep water ahead', !!spot, spot);

const res = await page.evaluate(async (at) => { const o = {}; const S = WORLD.ship; WORLD.wx.type = 'clear'; WORLD.wx.next = 'clear'; WORLD.wx.k = 1;
  WORLD.spawnShip(at.x, at.z, at.yaw); S.x = at.x; S.z = at.z; S.yaw = at.yaw; S.sailing = true; S.speed = 0; worldState.ship.hull = 100; worldState.ship.cls = 'sloop'; px = S.x; pz = S.z;
  for (const c in HELD_KEYS) HELD_KEYS[c] = false;
  const hull = () => shipBars().hull, step = (n, v) => { for (let i = 0; i < n; i++) { if (v) { S.x += -Math.sin(S.yaw) * v / 60; S.z += -Math.cos(S.yaw) * v / 60; S.speed = v; } else S.speed = 0; px = S.x; pz = S.z; serpentTick(1 / 60); } };
  // the bars and the odds
  SERP.last = -1e9; serpDrop(); o.bar0 = serpentBar(S.x, S.z); o.odds = serpentOdds(S.x, S.z); o.uisce = serpUisceNear(S.x, S.z);
  WORLD.wx.type = 'storm'; WORLD.wx.next = 'storm'; o.storm = serpentOdds(S.x, S.z); WORLD.wx.type = 'clear'; WORLD.wx.next = 'clear';
  OTHER.push({ kind: 'pirate', x: S.x + 100, z: S.z, dead: false }); o.barBlack = serpentBar(S.x, S.z); OTHER.pop();
  // the hook: the sailing tick asks for her chunk
  SERP.chunk = null; WORLD.tick(1 / 60, performance.now()); o.hooked = SERP.chunk === Math.floor(S.x / CHUNK) + ',' + Math.floor(S.z / CHUNK); S.x = at.x; S.z = at.z; S.speed = 0;
  // a still ship: it rises, swims at 11, tells, strikes for 15
  serpDrop(); SERP.last = -1e9; o.rose = serpentRise(null, false); const O = SERP.on; o.d0 = Math.hypot(O.x - S.x, O.z - S.z); o.barRest = serpentBar(S.x, S.z);
  const x0 = O.x, z0 = O.z; step(60); o.speed = Math.hypot(O.x - x0, O.z - z0);
  let deep = true; const h0 = hull(); let t = 0; while (!(O.tells >= 1 && !O.tell) && t < 1800) { step(1); t++; if (!(worldH(O.x, O.z) < SEA_Y - 4)) deep = false; }
  o.stillHit = h0 - hull(); o.tellAt = t; o.strikes = O.strikes;
  // a ship holding her course at 7 m/s
  worldState.ship.hull = 100; const h1 = hull(), n1 = O.tells; t = 0; while (!(O.tells >= n1 + 1 && !O.tell) && t < 1500) { step(1, 7); t++; } o.runHit = h1 - hull(); o.runTells = O.tells - n1;
  // up 60 s, then down 90 with her near: a second rise; then down again and gone
  S.speed = 0; let g = 0; while (SERP.on && SERP.on.phase === 'up' && g < 60 * 70) { step(1); g++; } o.upFor = (O.t, g); o.down = SERP.on && SERP.on.phase === 'down'; o.hidden = !SERP.g.visible;
  step(90 * 60 + 2); o.rises = SERP.on && SERP.on.rises; o.up2 = SERP.on && SERP.on.phase === 'up';
  step(61 * 60); step(91 * 60); o.gone = !SERP.on;
  return o; }, spot);
console.log('  serpent:', JSON.stringify(res));
check(`it may rise in open water far from a port, at 1 in 250 (×3 here by an Uisce gate: ${res.uisce}); a storm doubles it; a black sail within 140 m bars it`, res.bar0 === null && Math.abs(res.odds - (res.uisce ? 3 : 1) / 250) < 1e-9 && Math.abs(res.storm - 2 * res.odds) < 1e-9 && res.barBlack === 'black sail', res);
check('the sailing tick rolls for the chunk she is in', res.hooked, res);
check('it rises 60 to 90 m off her, and not again within 20 hours', res.rose && res.d0 >= 59 && res.d0 <= 91 && res.barRest === 'rest', res);
check(`it swims at 11 m/s (${res.speed.toFixed(2)} m in a second)`, Math.abs(res.speed - 11) < .05, res);
check('a tell then a strike on a still ship costs 15 hull', res.stillHit === 15 && res.strikes === 1, res);
check('a ship holding her course at 7 m/s is clear of the strike', res.runTells >= 1 && res.runHit === 0, res);
check('up, then down; near her it rises once more, and after the second dive it is gone', res.down && res.hidden && res.rises === 2 && res.up2 && res.gone, res);

// the shallows: led toward a bed shallower than 4 m, it turns along the line and never crosses it
const shoal = await page.evaluate(() => { const ports = allPorts();
  for (const P of ports) for (let r = 200; r <= 1500; r += 100) for (let q = 0; q < 16; q++) { const x = P.x + Math.cos(q * Math.PI / 8) * r, z = P.z + Math.sin(q * Math.PI / 8) * r; if (!(worldH(x, z) < -6)) continue;
    for (let a = 0; a < 8; a++) { const ux = Math.cos(a * Math.PI / 4), uz = Math.sin(a * Math.PI / 4); let sh = null;
      for (let d = 10; d <= 120 && !sh; d += 5) { const h = worldH(x + ux * d, z + uz * d); if (h > -4 && h < -1) sh = { x: x + ux * d, z: z + uz * d }; }
      if (!sh) continue; const O = { x, z, yaw: 0 }; let ok = true, minD = 1e9;
      for (let i = 0; i < 60 * 20; i++) { serpStep(O, sh.x + ux * 30, sh.z + uz * 30, 1 / 60); if (!(worldH(O.x, O.z) < SEA_Y - 4)) ok = false; minD = Math.min(minD, Math.hypot(O.x - sh.x, O.z - sh.z)); }
      return { ok, minD: +minD.toFixed(1), from: [Math.round(x), Math.round(z)] }; } }
  return null; });
check('led at the shallows it never crosses the 4 m line', shoal && shoal.ok, shoal);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
