// A catch rolls on the school's stream (Session 605, CLAUDE.md's co-op rules: a roll that decides an outcome comes from
// a stream keyed by place and id). `catchFish` drew the fish's kind, whether it is a fine one, and the school's rest
// from Math.random. A school is one a chunk (`spawnFishSchool`, keyed `school.chunk`), so a catch is keyed
// `<chunk>:fish:<minute>`, as a ship met at sea is keyed by chunk and minute (S508): the same school in the same minute
// gives the same fish whatever Math.random says, and later minutes other fish.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('portclare');
const stop = g.keepAlive();

// a school as `spawnFishSchool` makes one, in the chunk the player stands in (no school need have spawned near the town:
// only a chunk with a shallow band draws one, at 45%), added to `WORLD.fish` only for the length of each cast
const found = await page.evaluate(() => { const cx = Math.floor(px / WORLD.CHUNK), cz = Math.floor(pz / WORLD.CHUNK);
  window._school = { cx: px, cz: pz, y: 0, r: 4, ph: 0, n: 12, cool: 0, chunk: cx + ',' + cz }; return { chunk: _school.chunk }; });
check('a school in the chunk at Portclare', found && found.chunk, found);

// in the page: swim into the school at minute `min` with Math.random pinned to `rnd`, and read the catch
const cast = (rnd, min) => page.evaluate(([rnd, min]) => {
  const s = window._school; s.cool = 0; worldState.gameTimeAbsMinutes = min; px = s.cx; pz = s.cz; jumpY = s.y;
  const got = [], _ba = window.bagAdd, _r = Math.random, _sw = isSwimming, _m = showMsg;
  window.bagAdd = function (it) { got.push(it.name); return true; }; Math.random = () => rnd; isSwimming = () => true; showMsg = () => {};
  WORLD.fish.push(s); let ok; try { ok = catchFish(); } finally { WORLD.fish.splice(WORLD.fish.indexOf(s), 1); Math.random = _r; window.bagAdd = _ba; isSwimming = _sw; showMsg = _m; }
  return { ok, fish: got[0] || null, cool: +s.cool.toFixed(3) };
}, [rnd, min]);

const base = 40 * 1440 + 9 * 60;
const a = await cast(0.05, base), b = await cast(0.95, base), c = await cast(0.5, base);
console.log('same minute', JSON.stringify({ a, b, c }));
check('one school, one minute: the same fish and the same rest whatever Math.random says', a.ok && a.fish && a.fish === b.fish && a.fish === c.fish && a.cool === b.cool && a.cool === c.cool, { a, b, c });
check('the rest stays 18–30 s', [a, b, c].every(x => x.cool >= 18 && x.cool < 30), [a.cool, b.cool, c.cool]);
const later = []; for (let m = 1; m <= 40; m++) later.push(await cast(0.05, base + m * 7));
const kinds = new Set(later.map(x => x.fish)), fine = later.filter(x => /^Fine /.test(x.fish)).length;
console.log('later', JSON.stringify({ kinds: [...kinds], fine }));
check('later minutes give other fish (at least three kinds in forty casts)', later.every(x => x.ok && x.fish) && kinds.size >= 3, [...kinds]);
check('a fine one now and then, not always (0 < fine < 20 of 40; the rule is 12%)', fine > 0 && fine < 20, fine);
// S2214 — the rod (Michael's B on #1504): standing on the bank with a rod, E at water 0.6 m deep 1–4 m ahead casts; a bite 15–45 game
// minutes later, keyed `rod:<cell>:<day>:<cast>`; E within a minute of it strikes, before it reels in, after it the fish is gone
const rod = await page.evaluate(() => { const out = {}, _m = showMsg; showMsg = () => {}; const keep = BAG.splice(0);
  try {
    let P = null; for (let r = 4; r < 160 && !P; r += 2) for (let k = 0; k < 48 && !P; k++) { const a = k / 48 * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a), x = px + dx * r, z = pz + dz * r;
      if (worldH(x, z) > SEA_Y + .2 && !currentZoneSolid(x, z) && SEA_Y - worldH(x + dx * 2.5, z + dz * 2.5) >= .7) P = { x, z, dx, dz }; }
    out.found = !!P; if (!P) return out;
    px = P.x; pz = P.z; yaw = Math.atan2(-P.dx, -P.dz); onGround = true; jumpY = worldH(px, pz);
    out.noRod = fishPrompt(); BAG.push({ ...ROD_ITEM }); out.prompt = fishPrompt();
    const t0 = 50 * 1440 + 10 * 60; worldState.gameTimeAbsMinutes = t0; ROD.n = {};
    out.cast = catchFish(); const C = ROD.cast; out.wait = C && +(C.bite - C.at).toFixed(2); out.key = C && C.key; out.reelPrompt = fishPrompt();
    ROD.n = {}; ROD.cast = null; catchFish(); out.sameWait = +(ROD.cast.bite - ROD.cast.at).toFixed(2);
    catchFish(); out.reeled = ROD.cast === null;
    const fish = () => BAG.filter(b => b.food === 'fish').length;
    catchFish(); let c = ROD.cast; worldState.gameTimeAbsMinutes = c.bite + .5; tickRod(); out.strikePrompt = fishPrompt(); const f0 = fish(); catchFish(); out.caught = fish() - f0; out.fishName = (BAG.find(b => b.food === 'fish') || {}).name;
    catchFish(); c = ROD.cast; worldState.gameTimeAbsMinutes = c.bite + 1.2; tickRod(); out.gotAway = ROD.cast === null && fish() - f0 === 1;
    catchFish(); px += 3 * Math.sin(yaw); pz += 3 * Math.cos(yaw); tickRod(); out.walkedOff = ROD.cast === null;
    out.stock = survivalFor({ type: 'misc' }).some(i => i.tool === 'rod' && i.buyPrice === 15 && i.weight === 1) && !survivalFor({ type: 'inn' }).some(i => i.tool === 'rod');
  } finally { ROD.cast = null; BAG.splice(0); BAG.push(...keep); showMsg = _m; }
  return out; });
console.log('rod', JSON.stringify(rod));
check('a bank by Portclare with water 0.7 m deep 2.5 m out', rod.found, rod);
check('with no rod there is no cast; with one, E casts', rod.noRod !== "Press 'E' to cast" && rod.prompt === "Press 'E' to cast" && rod.cast === true && rod.reelPrompt === "Press 'E' to reel in", rod);
check('the bite comes 15–45 game minutes later, the same for the same cast of the day', rod.wait >= 15 && rod.wait < 45 && rod.sameWait === rod.wait && /:1$/.test(rod.key), rod);
check('E before the bite reels in; at the bite it strikes and lands a fish; a minute late it is gone; 2 m off ends the cast', rod.reeled && rod.strikePrompt === "Press 'E' to strike" && rod.caught === 1 && rod.gotAway && rod.walkedOff, rod);
check('a rod at every goods shop, 15 gold and 1 kg; none at the inn', rod.stock, rod);
// S2215 — the net (Michael's B on #1504): on your deck at 2 knots or less over a school, E pays the net out; 8 s later 3–5 fish go into
// the sea chest, seeded by the school's chunk and the day, and the school is gone until the next day (worldState.netted)
const net = await page.evaluate(() => { const out = {}, _m = showMsg, _od = onDeck, _sw = isSwimming, keepMesh = SHIP.mesh, keepSail = SHIP.sailing, keepSpd = SHIP.speed;
  const keep = BAG.splice(0), keepStash = stashBag.splice(0), s = window._school; s.cool = 0; worldState.netted = {};
  showMsg = () => {}; onDeck = () => true; isSwimming = () => false; SHIP.mesh = SHIP.mesh || new THREE.Group(); SHIP.sailing = false; SHIP.speed = 1.5;
  WORLD.fish.push(s);
  try { px = s.cx; pz = s.cz; worldState.gameTimeAbsMinutes = 60 * 1440 + 8 * 60;
    out.noNet = fishPrompt(); BAG.push({ ...NET_ITEM }); out.prompt = fishPrompt();
    out.cast = catchFish(); out.on = !!NET.on; SHIP.speed = 3; tickNet(); out.emptyAt3 = NET.on === null && stashBag.length === 0; SHIP.speed = 1.5;
    catchFish(); tickNet(); out.stillOn = !!NET.on; NET.on.t0 -= 8001; tickNet();
    const haul = stashBag.filter(b => b.food === 'fish').map(b => b.name + 'x' + (b.qty || 1)); out.n = stashBag.filter(b => b.food === 'fish').reduce((a, b) => a + (b.qty || 1), 0); out.haul = haul.join();
    out.netted = worldState.netted[s.chunk] === lootDay(); out.gone = deckSchool() === null && (isSwimming = () => true, jumpY = s.y, nearSchool() === null); isSwimming = () => false;
    stashBag.splice(0); worldState.netted = {}; catchFish(); NET.on.t0 -= 8001; tickNet(); out.same = stashBag.map(b => b.name + 'x' + (b.qty || 1)).join() === out.haul;
    worldState.gameTimeAbsMinutes += 1440; out.nextDay = !!deckSchool();
    const port = Object.values(SITE).find(t => t.kind === 'port'); out.stock = !!port && survivalFor({ type: 'misc', siteId: port.id }).some(i => i.tool === 'net' && i.buyPrice === 30 && i.weight === 3) && !survivalFor({ type: 'misc' }).some(i => i.tool === 'net');
    out.saved = _applyLoadData.toString().includes("'netted'");
  } finally { WORLD.fish.splice(WORLD.fish.indexOf(s), 1); NET.on = null; BAG.splice(0); BAG.push(...keep); stashBag.splice(0); stashBag.push(...keepStash);
    showMsg = _m; onDeck = _od; isSwimming = _sw; SHIP.mesh = keepMesh; SHIP.sailing = keepSail; SHIP.speed = keepSpd; worldState.netted = {}; }
  return out; });
console.log('net', JSON.stringify(net));
check('on deck over a school with a net, E pays it out; past 2 knots it comes in empty', net.noNet !== "Press 'E' to cast the net" && net.prompt === "Press 'E' to cast the net" && net.cast && net.on && net.emptyAt3, net);
check('8 s later 3 to 5 fish go into the sea chest, the same haul for the same school and day', net.stillOn && net.n >= 3 && net.n <= 5 && net.same, net);
check('the netted school is gone, from the deck and to a swimmer, until the next day (worldState.netted, saved)', net.netted && net.gone && net.nextDay && net.saved, net);
check('a net at a harbour\'s goods shop, 30 gold and 3 kg; not at an inland one', net.stock, net);
// S2226 — the spyglass (Michael's B on #1504): sold at a harbour's goods shop; used from the bag it narrows the view ×5 to a clear day's
// 1,000 m (nothing past the eye after dusk, fog's 60 m in fog); a ship in the view's middle within 800 m shows her card; a step lowers it
const gl = await page.evaluate(() => { const keep = BAG.splice(0), out = {}; forceTime(12); const W = WORLD.wx, k0 = [W.type, W.next, W.k];
  try { out.shop = survivalFor({ type: 'misc', siteId: 'portclare' }).some(i => i.tool === 'glass'); out.no = glassRaise(); BAG.push({ ...GLASS_ITEM }); out.up = glassRaise(); out.zoom = glassZoom();
    W.type = W.next = 'clear'; W.k = 1; WX.sightM = 2400; out.reach = glassReach(); forceTime(23); out.night = glassReach(); forceTime(12);
    CAM.updateMatrixWorld(); const v = new THREE.Vector3(); CAM.getWorldDirection(v); const L = Math.hypot(v.x, v.z);
    const A = spawnOtherShip('pirate', CAM.position.x + v.x / L * 300, CAM.position.z + v.z / L * 300); const S = glassLook().ship; out.card = S === A ? glassCard(A) : null; despawnOtherShip(A); OTHER.splice(OTHER.indexOf(A), 1);
    K['KeyW'] = true; tickGlass(1 / 60); out.stepped = !GLASS.up; out.zoom2 = glassZoom();
  } finally { K['KeyW'] = false; glassDown(); BAG.splice(0); BAG.push(...keep); W.type = k0[0]; W.next = k0[1]; W.k = k0[2]; }
  return out; });
console.log('glass', JSON.stringify(gl));
check(`the spyglass: sold at the harbour, raised from the bag (×${gl.zoom}), ${gl.reach} m by a clear noon and ${gl.night} after dusk; a black sail at 300 m carded (${gl.card && gl.card.join(' / ')}); a step lowers it`,
  gl.shop && !gl.no && gl.up && gl.zoom === 5 && gl.reach === 1000 && gl.night === 0 && gl.card && gl.card[0] === 'A black sail' && gl.stepped && gl.zoom2 === 1, gl);
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
