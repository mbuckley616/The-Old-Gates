// The Gatelander inn's taproom in the game's kit (Session 1157; card F9, Michael's 2 A on DECISION #320). js/38-kit.js copies
// gatelandsInn from docs/prototypes/levelup/rooms.js (Session 893), and this holds the copy to the prototype: four keys build to the
// triangles, draws and vertex hashes the prototype gives for the same keys (read from rooms.js in the test Chromium, 19 Oct 2026), the
// shell is the farmhouse the street builds, and the room keeps its measures (the 16 risers of 0.178 m, the floors at 0.05 and 2.9 m,
// three beds to let). Session 1276: the inn on two bays (o.bays, glBayPlan's farmhouse of 7.4 m) too, three keys held to the prototype the same
// way, its shell the two-bay farmhouse, two beds to let.
// The new look only since 1.0 was frozen (18 Oct 2026): the old look’s check is gone.
import { boot, check } from './lib/game.mjs';
const REC = { 'inn|green': [4368, 16, -298206828], 'inn:0|green': [4536, 16, 638560512], 'inn:1|blue': [4560, 16, 1477629853], 'inn:2|red': [4392, 16, 1308120795],
  'inn|green|2': [3348, 16, 254220889], 'inn:1|blue|2': [3360, 16, 1929317014], 'inn:2|red|2': [3336, 16, -1166625903] };
const SHELL = [2120, 10, 363876740], SHELL2 = [1720, 10, 166740022];
const g = await boot({ look: 'new' }); const { page } = g;
const R = await page.evaluate(REC => { const hash = b => { let h = 0; b.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const out = {}; for (const k of Object.keys(REC)) { const [key, paint, bays] = k.split('|'), o = { paint, bays: +bays || 3 }, a = PKIT.gl.inn(o, PKIT.stream(key)), b = PKIT.gl.inn(o, PKIT.stream(key));
    out[k] = { tris: a.tris, draws: a.draws, room: hash(a.room), same: hash(a.group) === hash(b.group), shellTris: a.shellTris, shellCalls: a.shellCalls, shell: hash(a.shell), boxes: a.boxes.length, beds: a.beds.length, stair: a.stair, floors: a.floors, door: a.door, w: a.w, d: a.d,
      leaf: (() => { let n = 0; a.shell.traverse(m => { if (m.isMesh && m.name === 'pane') n++; }); return n; })(), paint: (() => { let c = null; a.room.traverse(m => { if (m.isMesh && m.name === 'paint') c = m.material.color.getHexString(); }); return c; })() }; }
  return out; }, REC);
check(`the taproom, four keys, builds to the prototype's triangles, draws and vertices (${Object.entries(R).map(([k, v]) => `${k} ${v.tris.toLocaleString()} in ${v.draws}`).join(', ')})`, Object.entries(REC).every(([k, [t, d, h]]) => R[k].tris === t && R[k].draws === d && R[k].room === h), Object.fromEntries(Object.entries(R).map(([k, v]) => [k, [v.tris, v.draws, v.room]])));
check(`its shell is the prototype's farmhouse, ${SHELL[0].toLocaleString()} triangles in ${SHELL[1]} (on two bays ${SHELL2[0].toLocaleString()} in ${SHELL2[1]}), the same vertices in every key`, Object.entries(R).every(([k, v]) => (S => v.shellTris === S[0] && v.shellCalls === S[1] && v.shell === S[2])(k.endsWith('|2') ? SHELL2 : SHELL)), Object.values(R).map(v => [v.shellTris, v.shellCalls, v.shell]));
check('each is the same twice', Object.values(R).every(v => v.same));
const A = R['inn|green'], A2 = R['inn|green|2'];
check(`its measures: ${A.w} by ${A.d} m, floors at ${A.floors.join(' and ')} m, ${A.stair.n} risers of ${A.stair.rise} m going ${A.stair.going} m, ${A.beds} beds, ${A.boxes} pieces kept for the checks, the front door ${A.door.w} by ${A.door.h} m`,
  A.w === 10.5 && A.d === 6.2 && A.floors[0] === .05 && A.floors[1] === 2.9 && A.stair.n === 16 && A.stair.rise === .1781 && A.stair.going === .25 && A.beds === 3 && A.boxes === 50 && A.door.w === 1.05 && A.door.h === 2.5, A);
check(`on two bays: ${A2.w} by ${A2.d} m, the front door at ${A2.door.x} m, ${A2.beds} beds, ${A2.boxes} pieces kept for the checks`, A2.w === 7.4 && A2.d === 6.2 && A2.door.x === -1.55 && A2.stair.n === 16 && A2.beds === 2 && A2.boxes === 40, A2);
check(`from inside the shell's glass is clear panes (${A.leaf} meshes)`, Object.values(R).every(v => v.leaf > 0), Object.values(R).map(v => v.leaf));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
