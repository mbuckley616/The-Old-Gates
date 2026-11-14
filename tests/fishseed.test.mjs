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
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
