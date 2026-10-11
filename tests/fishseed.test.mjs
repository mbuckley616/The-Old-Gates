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
stop();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
