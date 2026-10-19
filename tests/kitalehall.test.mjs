// The Mark's alehall in the game's kit (Session 1159; card F9, Michael's A on DECISION #321: wall benches, 10 by 18 m, as drawn).
// js/38-kit.js copies markHall from docs/prototypes/levelup/pieces.js and markAlehall from rooms.js, and this holds the copy to the
// prototype: three keys of the alehall and two halls (shingle with a porch and chimney, turf without) build to the triangles, draws
// and vertex hashes the prototype gives for the same keys (read from the prototype in the test Chromium, 19 Oct 2026), the same twice,
// at 10 by 18 m with its two long tables. On the old look the kit loads and builds nothing until asked.
import { boot, check } from './lib/game.mjs';
const ALE = { alehall: [9490, 15, 1473512360], 'alehall:0': [9890, 15, 1821128147], 'alehall:1': [9578, 15, -651945077] }, SHELL = [1648, 7, -1445980848];
const HALL = { 'hall:a': [{ roof: 'shingle', w: 7.6, d: 14, porch: true, chimney: true, carve: true, wall: 2 }, 1724, 9, -716079296], 'hall:b': [{ roof: 'turf', w: 6, d: 9, porch: false, chimney: false, carve: false }, 768, 10, 866376744] };
const g = await boot({ look: 'new' }); const { page } = g;
const R = await page.evaluate(([ALE, HALL]) => { const hash = b => { let h = 0; b.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const ale = {}, hall = {};
  for (const k of Object.keys(ALE)) { const a = PKIT.mk.alehall({}, PKIT.stream(k)), b = PKIT.mk.alehall({}, PKIT.stream(k));
    ale[k] = { tris: a.tris, draws: a.draws, room: hash(a.room), shell: hash(a.shell), shellTris: a.shellTris, shellCalls: a.shellCalls, same: hash(a.group) === hash(b.group), w: a.w, d: a.d, tables: a.tables.length, boxes: a.boxes.length }; }
  for (const [k, [o]] of Object.entries(HALL)) { const h = PKIT.mk.hall(o, PKIT.stream(k)); hall[k] = { tris: h.tris, draws: h.draws, hash: hash(h.group) }; }
  return { ale, hall }; }, [ALE, HALL]);
check(`the alehall, three keys, builds to the prototype's triangles, draws and vertices (${Object.entries(R.ale).map(([k, v]) => `${k} ${v.tris.toLocaleString()} in ${v.draws}`).join(', ')})`, Object.entries(ALE).every(([k, [t, d, h]]) => R.ale[k].tris === t && R.ale[k].draws === d && R.ale[k].room === h), Object.fromEntries(Object.entries(R.ale).map(([k, v]) => [k, [v.tris, v.draws, v.room]])));
check(`its shell is the prototype's hall, ${SHELL[0].toLocaleString()} triangles in ${SHELL[1]}, the same vertices in every key`, Object.values(R.ale).every(v => v.shellTris === SHELL[0] && v.shellCalls === SHELL[1] && v.shell === SHELL[2]), Object.values(R.ale).map(v => [v.shellTris, v.shellCalls, v.shell]));
check(`the Mark's hall two ways builds to the prototype's (${Object.entries(R.hall).map(([k, v]) => `${k} ${v.tris.toLocaleString()} in ${v.draws}`).join(', ')})`, Object.entries(HALL).every(([k, [, t, d, h]]) => R.hall[k].tris === t && R.hall[k].draws === d && R.hall[k].hash === h), R.hall);
const A = R.ale.alehall;
check(`each is the same twice, ${A.w} by ${A.d} m, with its ${A.tables} long tables and ${A.boxes} pieces kept for the checks`, Object.values(R.ale).every(v => v.same) && A.w === 10 && A.d === 18 && A.tables === 2 && A.boxes === 22, A);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
const g0 = await boot(); const o = await g0.page.evaluate(() => ({ look: window.OG_LOOK || 'old', fn: typeof PKIT.mk.alehall, made: PKIT.texturesMade() }));
check('on the old look the kit has the alehall and has painted nothing', o.look !== 'new' && o.fn === 'function' && o.made === 0 && g0.errs.length === 0, { ...o, errs: g0.errs });
await g0.close();
