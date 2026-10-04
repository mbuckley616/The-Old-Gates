// A cell unloaded while its load job is part-way (Session 458). The world loads the 3×3 cells round you through a job
// queue, a few steps a frame; a ferry, fast travel or a fast crossing can take you away before a cell's job has run, and
// the cell is unloaded at once. The job used to run on regardless, placing that cell's doors into DOORS for a cell no
// longer listed, so when it was loaded again every door stood twice; the next unload deleted the shared position and one
// entry, and the door left behind had no position: the minimap threw on it every frame (found in `blacksail` at Beaurouge).
// Here: to a far cell, a few frames, home before its job is done, back until it is loaded, home again.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const res = await page.evaluate(() => {
  const home = [px, pz]; const frames = (n) => { for (let i = 0; i < n; i++) WORLD.tick(1 / 60, performance.now()); };
  const dupes = () => WORLD.DOORS.length - new Set(WORLD.DOORS.map(e => e.seed)).size;
  // a far cell with doors of its own, on land
  const [hi, hj] = WORLD.cellOf(px, pz); let far = null;
  for (let j = 0; j < WORLD.GRID && !far; j++) for (let i = 0; i < WORLD.GRID; i++) { if (Math.abs(i - hi) < 4 && Math.abs(j - hj) < 4) continue; const c = WORLD.getCell(i, j); if (c.type !== 'sea' && (c.doors || []).length >= 2) { far = c; break; } }
  const key = far.i + ',' + far.j, fx = (far.i + .5) * WORLD.SIZE, fz = (far.j + .5) * WORLD.SIZE;
  const out = { cell: key, doors: far.doors.length, runs: [] };
  for (let run = 0; run < 3; run++) {
    // go there, frame by frame, until the cell is listed and its job has begun but its doors are not placed yet
    px = fx; pz = fz; let m = 0; for (; m < 60 * 60; m++) { frames(1); const L = WORLD.LOADED.get(key); if (L && L.pending && !WORLD.DOORS.some(e => far.doors.includes(e))) break; }
    const pend = WORLD.LOADED.get(key); const was = { listed: !!pend, pending: !!(pend && pend.pending), placed: WORLD.DOORS.filter(e => far.doors.includes(e)).length, m, jobs: WORLD.jobs.length };
    // home in one step (a ferry, fast travel): the cell is unloaded there and then, as the next cell tick does, its job still queued
    WORLD.unloadCell(key); px = home[0]; pz = home[1]; frames(60 * 3);
    const away = { listed: WORLD.LOADED.has(key), jobs: WORLD.jobs.length, dupes: dupes(), stray: WORLD.DOORS.filter(e => far.doors.includes(e)).length };
    // back again, until the cell has loaded in full
    px = fx; pz = fz; let n = 0; for (; n < 60 * 120; n++) { frames(1); const L = WORLD.LOADED.get(key); if (L && !L.pending && !WORLD.jobs.some(j => j.cellKey === key)) break; }
    const there = { dupes: dupes(), mine: WORLD.DOORS.filter(e => far.doors.includes(e)).length };
    let threw = null; try { drawMM(); } catch (e) { threw = e.message; }
    px = home[0]; pz = home[1]; frames(60 * 3);
    let threw2 = null; try { drawMM(); } catch (e) { threw2 = e.message; }
    out.runs.push({ was, away, n, there, threw, back: { dupes: dupes(), left: WORLD.DOORS.filter(e => far.doors.includes(e)).length, threw: threw2 } });
  }
  return out; });
console.log(JSON.stringify(res));
check(`a far cell (${res.cell}, ${res.doors} doors) left while its load was part-way, its doors not yet placed, in each of 3 runs`, res.runs.every(r => r.was.listed && r.was.pending && r.was.placed === 0), res.runs.map(r => r.was));
check('once it is unloaded, its job places none of its doors', res.runs.every(r => r.away.stray === 0 && !r.away.listed), res.runs.map(r => r.away));
check('loaded again in full, each of its doors is in DOORS once', res.runs.every(r => r.there.dupes === 0 && r.there.mine <= res.doors), res.runs.map(r => r.there));
check('and unloaded again, none of its doors is left behind', res.runs.every(r => r.back.left === 0 && r.back.dupes === 0), res.runs.map(r => r.back));
check('the minimap draws there and at home without an error', res.runs.every(r => !r.threw && !r.back.threw), res.runs.map(r => [r.threw, r.back.threw]));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
