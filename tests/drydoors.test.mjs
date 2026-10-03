// A gate is never drawn into the water, and whether it stands is one answer for the whole game (backlog B, Session 445's
// find; Session 447). Since the rivers and lakes were routed (S432), a cell's gates were drawn before the carve was known:
// 48 of 392 sigil and fort gates stood under 1.5, 33 of them under water, and placeDoor refused or built them by the ground
// it read at load time, which moved with the cells and stamps loaded (fort 565471 read 1.5 one run, 1.97 the next).
// Now a pass after the routing draws a wet gate again in its own cell, on the bare land, and a gate with no dry spot is
// `wet`: never built, never named. The checks: no gate left low, the same answer from two boots in two load orders, and
// every gate placed where it was drawn stands on dry ground.
import { boot, check } from './lib/game.mjs';

const census = () => {
  const RV = WORLD.routed; const bare = (x, z) => { RV.routing = true; const h = WORLD.rawH(x, z); RV.routing = false; return h; };
  const out = [];
  for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) { const c = WORLD.getCell(i, j); if (c.home) continue; c.doors.forEach(e => {
    if (e.zone !== 'gen' || e.lairDoor) return;
    const [ci, cj] = WORLD.cellOf(e.x, e.z);
    out.push({ seed: e.seed, cell: `${i},${j}`, ownCell: ci === i && cj === j, sig: !!(e.sigil || e.kind === 'fort_door'), fort: e.kind === 'fort_door', wet: !!e.wet, moved: !!e.drawnAt,
      g: +bare(e.x, e.z).toFixed(2), was: e.drawnAt ? +bare(e.drawnAt.x, e.drawnAt.z).toFixed(2) : null, x: e.x, z: e.z,
      padClear: c.sites.every(s => !(s.pad > 0) || Math.hypot(s.x - e.x, s.z - e.z) >= s.pad + 60) });
  }); }
  const sigil = WORLD.sigilDoors().map(e => e.seed);
  return { out, sigil };
};

// boot 1: home first, then cell 4,9 (Session 445's two forts) and the cells of four moved sigil gates
let g = await boot(); let { page } = g;
await g.intoWorld();
const a = await page.evaluate(census);
const D = a.out; const bySeed = Object.fromEntries(D.map(d => [d.seed, d]));
const moved = D.filter(d => d.moved), wet = D.filter(d => d.wet), sig = D.filter(d => d.sig);
const sumry = { gates: D.length, sigil: sig.length, moved: moved.length, movedSigil: moved.filter(d => d.sig).length, wet: wet.length, wetSigil: wet.filter(d => d.sig).length,
  lowLeft: D.filter(d => !d.wet && d.g < 1.5).length, wasUnder0: moved.filter(d => d.was < 0).length, minNew: Math.min(...moved.map(d => d.g)) };
console.log(JSON.stringify(sumry));
check('no gate that stands is on ground under 1.5 (the bare land)', sumry.lowLeft === 0, D.filter(d => !d.wet && d.g < 1.5).slice(0, 5));
check('the gates that stood in the water were drawn again onto ground of 1.8 or more', moved.length >= 30 && sumry.wasUnder0 >= 25 && sumry.minNew >= 1.8, sumry);
check('a gate drawn again stays in its own cell and off every pad', moved.every(d => d.ownCell && d.padClear), moved.filter(d => !d.ownCell || !d.padClear).slice(0, 3));
check('a gate with no dry spot is never named: sigilDoors lists none', wet.every(d => !a.sigil.includes(d.seed)) && sig.filter(d => !d.wet).every(d => a.sigil.includes(d.seed)), { wet: wet.length });
check('the gates nobody needed to move kept their spots (few moved)', moved.length + wet.length < D.length * 0.15, sumry);

const cells = ['4,9', ...new Set(moved.filter(d => d.sig).map(d => d.cell))].slice(0, 5);
const loadAll = async (pg, list) => pg.evaluate(async (list) => {
  for (const k of list) { const [i, j] = k.split(',').map(Number); WORLD.loadCell(i, j); }
  /* a cell the job queue had begun (a neighbour of where we stand) is finished by draining the queue */
  for (let n = 0; n < 5000 && WORLD.jobs.length; n++) { const jb = WORLD.jobs.shift(); try { if (jb.fn()) WORLD.jobs.push(jb); } catch (e) {} }
  const pos = WORLD.dungeonPos; const res = {};
  for (const k of list) { const [i, j] = k.split(',').map(Number); WORLD.getCell(i, j).doors.forEach(e => { if (e.zone !== 'gen' || e.lairDoor) return;
    const p = pos[e.seed]; res[e.seed] = p ? { placed: true, h: +WORLD.worldH(p.x, p.z).toFixed(2), d: +Math.hypot(p.x - e.x, p.z - e.z).toFixed(1) } : { placed: false }; }); }
  return res;
}, list);
const p1 = await loadAll(page, cells);
await g.close();

// boot 2: far cells first (the other side of the world), then the same cells in reverse order
g = await boot(); page = g.page;
await g.intoWorld();
await page.evaluate(() => { for (const [i, j] of [[2, 1], [9, 1], [3, 3]]) WORLD.loadCell(i, j); });
const p2 = await loadAll(page, cells.slice().reverse());
const seeds = Object.keys(p1);
const agree = seeds.filter(s => p1[s].placed === p2[s].placed).length;
const shouldStand = seeds.filter(s => !bySeed[s].wet);
const placedOk = shouldStand.filter(s => p1[s].placed && p2[s].placed).length;
const dry = shouldStand.filter(s => p1[s].placed && p1[s].h >= 1.2 && p2[s].h >= 1.2).length;
console.log(JSON.stringify({ cells, gates: seeds.length, agree, shouldStand: shouldStand.length, placedOk, dry, forts: ['565471', '766071'].map(s => [p1[s], p2[s]]),
  low: shouldStand.filter(s => p1[s].h < 1.2 || p2[s].h < 1.2).map(s => [s, p1[s], p2[s]]) }));
check('two boots in two load orders build the same gates', seeds.length > 10 && agree === seeds.length, { agree, of: seeds.length });
check('every gate that is not wet is built, the S445 forts too', placedOk === shouldStand.length && p1['565471']?.placed && p2['565471']?.placed, { placedOk, of: shouldStand.length });
check('and stands on dry ground where it is built (1.2 or more)', dry === shouldStand.length, { dry, of: shouldStand.length });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
