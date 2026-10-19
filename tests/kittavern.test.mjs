// Aurenne's tavern in the game's kit (Session 1167; card F9, Michael's A on DECISION #322: the Roman house, a vine on a pergola).
// js/38-kit.js copies aurenneHouse (with aurKit, its materials and surfaces) from docs/prototypes/levelup/pieces.js and homeMats and
// aurenneTavern from rooms.js, and this holds the copy to the prototype: three keys of the tavern and three houses (Roman with an arcade,
// flat with a dome, lattices and a pergola, flat with an outside stair) build to the triangles, draws and vertex hashes the prototype
// gives for the same keys (read from the prototype in the test Chromium, 19 Oct 2026), the same twice, at 9.6 by 8 m with its seven
// tables. On the old look the kit loads and builds nothing until asked.
import { boot, check } from './lib/game.mjs';
const TAV = { tavern: [10508, 18, 1688931971], 'tavern:0': [10928, 18, 17590128], 'tavern:1': [10600, 18, -272605017] }, SHELL = [3476, 8, 472917338];
const HOUSE = { 'house:a': [{ kind: 'tile', w: 8.4, d: 7.2, two: true, arcade: true }, 5408, 12, 1286884975, 7.786], 'house:b': [{ kind: 'flat', w: 8.8, d: 7.0, two: true, dome: 'blue', pergola: true, lattice: true, stair: false }, 7966, 14, 628404905, 9.281],
  'house:c': [{ kind: 'flat', w: 7.0, d: 6.4, two: false, stair: true, pergola: false }, 4992, 11, -1240906987, 4.445] };
const g = await boot({ look: 'new' }); const { page } = g;
const R = await page.evaluate(([TAV, HOUSE]) => { const hash = b => { let h = 0; b.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const tav = {}, house = {};
  for (const k of Object.keys(TAV)) { const a = PKIT.au.tavern({}, PKIT.stream(k)), b = PKIT.au.tavern({}, PKIT.stream(k));
    tav[k] = { tris: a.tris, draws: a.draws, room: hash(a.room), shell: hash(a.shell), shellTris: a.shellTris, shellCalls: a.shellCalls, same: hash(a.group) === hash(b.group), w: a.w, d: a.d, tables: a.tables.length, boxes: a.boxes.length, lamps: a.lamps.length }; }
  for (const [k, [o]] of Object.entries(HOUSE)) { const h = PKIT.au.house(o, PKIT.stream(k)); house[k] = { tris: h.tris, draws: h.draws, hash: hash(h.group), roofTop: +h.roofTop.toFixed(3) }; }
  return { tav, house }; }, [TAV, HOUSE]);
check(`the tavern, three keys, builds to the prototype's triangles, draws and vertices (${Object.entries(R.tav).map(([k, v]) => `${k} ${v.tris.toLocaleString()} in ${v.draws}`).join(', ')})`, Object.entries(TAV).every(([k, [t, d, h]]) => R.tav[k].tris === t && R.tav[k].draws === d && R.tav[k].room === h), Object.fromEntries(Object.entries(R.tav).map(([k, v]) => [k, [v.tris, v.draws, v.room]])));
check(`its shell is the prototype's Roman house with an arcade, ${SHELL[0].toLocaleString()} triangles in ${SHELL[1]}, the same vertices in every key`, Object.values(R.tav).every(v => v.shellTris === SHELL[0] && v.shellCalls === SHELL[1] && v.shell === SHELL[2]), Object.values(R.tav).map(v => [v.shellTris, v.shellCalls, v.shell]));
check(`Aurenne's house three ways builds to the prototype's (${Object.entries(R.house).map(([k, v]) => `${k} ${v.tris.toLocaleString()} in ${v.draws}`).join(', ')})`, Object.entries(HOUSE).every(([k, [, t, d, h, top]]) => R.house[k].tris === t && R.house[k].draws === d && R.house[k].hash === h && R.house[k].roofTop === top), R.house);
const A = R.tav.tavern;
check(`each is the same twice, ${A.w} by ${A.d} m, with its ${A.tables} tables, ${A.lamps} lamps and ${A.boxes} pieces kept for the checks`, Object.values(R.tav).every(v => v.same) && A.w === 9.6 && A.d === 8 && A.tables === 7 && A.boxes === 34 && A.lamps === 2, A);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
const g0 = await boot(); const o = await g0.page.evaluate(() => ({ look: window.OG_LOOK || 'old', fn: typeof PKIT.au.tavern, made: PKIT.texturesMade() }));
check('on the old look the kit has the tavern and has painted nothing', o.look !== 'new' && o.fn === 'function' && o.made === 0 && g0.errs.length === 0, { ...o, errs: g0.errs });
await g0.close();
