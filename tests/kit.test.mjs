// The new look's kit in the game (Session 1037; DECISION #389, Michael's A: a new file, js/38-kit.js; card F6). The kit's
// Gatelands buildings are copied from docs/prototypes/levelup/pieces.js, and this holds the copy to the prototype: the six
// plans of the line-up build to the triangles and sizes the prototype recorded (pieces-gatelands.json, which its own check,
// pieces.check.mjs, holds pieces.js to), one mesh per material, the same lot the same twice. On the old look the file loads
// and nothing in it runs. Then a street of lots stands in the world on the new look and is drawn.
import { boot, check } from './lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const rec = JSON.parse(fs.readFileSync(path.join(here, '../docs/prototypes/levelup/pieces-gatelands.json'), 'utf8')).line.plans;

// the old look: the file is there and has painted nothing
{ const g = await boot(); const o = await g.page.evaluate(() => ({ look: window.OG_LOOK || 'old', kit: typeof PKIT, made: PKIT.texturesMade(), fns: typeof PKIT.gl.building }));
  check('on the old look the kit loads and paints nothing', o.look !== 'new' && o.kit === 'object' && o.made === 0 && o.fns === 'function' && g.errs.length === 0, { ...o, errs: g.errs });
  await g.close(); }

const g = await boot({ look: 'new' }); const { page } = g;
check('the new look boots with the kit loaded and nothing painted yet', await page.evaluate(() => OG_LOOK === 'new' && PKIT.texturesMade() === 0) && g.errs.length === 0, g.errs);

// the line-up, built as pieces.check.mjs builds it
const line = await page.evaluate(() => { const P = PKIT.gl.PLANS, out = {}, t0 = performance.now();
  const row = [P.cottage({ paint: 'red' }), { ...P.cottage({ hip: true, paint: 'blue' }), name: 'Cottage, hipped' }, P.farmhouse({}), P.townhouse({ color: 'ochre' }), P.merchant({ color: 'cream' }), P.warehouse({})];
  for (const pl of row) { const b = PKIT.gl.building(pl), u = b.userData, mats = new Set(); b.traverse(m => m.isMesh && mats.add(m.material));
    out[u.name] = { tris: u.tris, calls: u.calls, ...u.size, meshes: b.children.length, mats: mats.size, attrs: Object.keys(b.children[0].geometry.attributes).sort().join() }; b.traverse(m => m.geometry && m.geometry.dispose()); }
  return { out, ms: Math.round(performance.now() - t0), made: PKIT.texturesMade() }; });
const strip = v => v && JSON.stringify({ tris: v.tris, w: v.w, d: v.d, eave: v.eave, ridge: v.ridge });
const bad = Object.keys(rec).filter(k => strip(rec[k]) !== strip(line.out[k]));
check(`the six plans build to the prototype's triangles and sizes (${Object.entries(line.out).map(([k, v]) => k.split(/[ ,]/)[0] + ' ' + v.tris).join(', ')})`, bad.length === 0 && Object.keys(line.out).length === 6, bad.map(k => [k, rec[k], line.out[k]]));
check('each is one mesh per material, position, normal and uv only, in 10 to 14 draws', Object.values(line.out).every(v => v.meshes === v.mats && v.calls === v.meshes && v.calls >= 10 && v.calls <= 14 && v.attrs === 'normal,position,uv'), Object.values(line.out).map(v => [v.calls, v.mats, v.attrs]));
console.log(`  (the line-up took ${line.ms} ms, the first build painting ${line.made} surfaces)`);

// the other plans (the forge, the temple, both guild halls) build, at people's measure: a door is the game's door
const more = await page.evaluate(() => { const P = PKIT.gl.PLANS, out = {};
  for (const [k, pl] of [['forge', P.forge({})], ['temple', P.temple({})], ['fighters', P.guildhall({})], ['mages', P.guildhall({ guild: 'mages' })]]) { const b = PKIT.gl.building(pl); out[k] = { tris: b.userData.tris, calls: b.userData.calls, ridge: b.userData.size.ridge, door: !!b.userData.door }; }
  return { out, door: PKIT.gl.PS.door, game: SCALE.DOOR_H, person: PKIT.gl.PS.person }; });
check('the forge, the temple and both guild halls build, each with a door to stand at', Object.values(more.out).every(v => v.tris > 1000 && v.calls <= 16 && v.door), more.out);
check('the kit\'s door is 2.05 m, as the game\'s (07-scale.js)', more.door.h === 2.05 && Math.abs(more.game - 2.05) < 1e-6, { kit: more.door, game: more.game });

// the plans by bays (Session 1064; Michael's C on #396), copied from pieces.js's Session 1063: each plan on each count of bays it takes
// is that many bays and its ends wide and builds to the prototype's triangles (pieces.check.mjs's numbers); baysFor fits a lot of 6 to
// 10 m with the most whole bays; a lot given bays and a depth builds them, and one without is as drawn
const BAYTRIS = { cottage: [1230, 1556, 1826], farmhouse: [1744, 2144], townhouse: [4443, 5033, 5631, 6221], merchant: [4018, 4426, 4846] };
const bays = await page.evaluate(T => { const G = PKIT.gl, out = [];
  for (const kind in T) { const B = G.BAYS[kind]; for (let n = B.min; n <= B.max; n++) { const P = Object.assign(G.bayPlan(kind, n, {}), { r: PKIT.stream('bays') }), b = G.building(P);
    out.push({ kind, n, w: b.userData.size.w, want: +(n * B.bay + 2 * B.end).toFixed(3), tris: b.userData.tris, rec: T[kind][n - B.min] }); b.traverse(m => m.geometry && m.geometry.dispose()); } }
  const fit = []; for (const kind in T) for (let L = 6; L <= 10.001; L += .25) { const n = G.baysFor(kind, L), B = G.BAYS[kind]; if (!((G.bayWidth(kind, n) <= L + 1e-6 || n === B.min) && (n === B.max || G.bayWidth(kind, n + 1) > L + 1e-6))) fit.push([kind, L, n]); }
  const lot = G.lot('bays', 3, { kind: 'townhouse', bays: 4, d: 8 }).plan, lot0 = G.lot('bays', 3, { kind: 'townhouse' }).plan;
  return { out, fit, lot: [lot.w, lot.d, lot.bays], lot0: [lot0.w, lot0.d, lot0.bays ?? null] }; }, BAYTRIS);
check(`the plans by bays: ${bays.out.length} plans, each its bays and ends wide (${bays.out.map(x => x.kind[0] + x.n + ' ' + x.w).join(', ')}) and the prototype's triangles`, bays.out.every(x => Math.abs(x.w - x.want) < .01 && x.tris === x.rec), bays.out.filter(x => Math.abs(x.w - x.want) >= .01 || x.tris !== x.rec));
check(`baysFor fits lots of 6 to 10 m with the most whole bays; a townhouse lot of 4 bays and 8 m is ${bays.lot[0]} by ${bays.lot[1]} m, one without bays ${bays.lot0[0]} by ${bays.lot0[1]} m as drawn`, !bays.fit.length && bays.lot.join() === '8.4,8,4' && bays.lot0[0] === 6.4 && bays.lot0[2] === null, bays);

// a lot is the same twice from its street and index (the co-op rule), lit windows and all; no two neighbours share a colour
const lots = await page.evaluate(() => { const hash = b => { let h = 0; b.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const keys = b => b.children.map(m => m.material.uuid ? (m.material.emissiveIntensity > 0 ? 'lit' : '') + m.geometry.attributes.position.count : '').join();
  const out = []; for (let i = 0; i < 8; i++) { const A = PKIT.gl.lot('the kit test street', i), B = PKIT.gl.lot('the kit test street', i), a = PKIT.gl.building(A.plan), b = PKIT.gl.building(B.plan);
    out.push({ kind: A.kind, colour: A.colour, same: hash(a) === hash(b) && keys(a) === keys(b) }); } return out; });
check('eight lots of a street each build the same twice', lots.every(l => l.same), lots);
check('no two neighbouring lots share a colour', lots.every((l, i) => !i || l.colour !== lots[i - 1].colour), lots.map(l => l.colour));

// a street in the world: six lots in a row 30 m ahead, each turned to face the eye, drawn in the frame
await g.intoWorld();
// Session 1138: the eye is where the player stands only once the game's loop has drawn a frame since the move to 13100,25450; on a
// slow runner intoWorld's 9 s can pass without one, and the eye is still at the legacy Hearthwick's 1130,1480, 12 km off the street
await page.waitForFunction(() => Math.hypot(CAM.position.x - px, CAM.position.z - pz) < 20, null, { timeout: 180000 });
const st = await page.evaluate(() => { forceTime(11); const grp = new THREE.Group(); grp.name = 'kit test street'; let x0 = -24, calls = 0, tris = 0;
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  for (let i = 0; i < 6; i++) { const L = PKIT.gl.lot('the kit test street', i), b = PKIT.gl.building(L.plan), w = b.userData.size.w, x = x0 + w / 2;
    const wx = px + fx * 30 + rx * x, wz = pz + fz * 30 + rz * x; b.position.set(wx, WORLD.worldH(wx, wz), wz); b.rotation.y = yaw; grp.add(b); calls += b.userData.calls; tris += b.userData.tris; x0 += w + .2; }
  const before = (REN.render(scene, CAM), REN.info.render.calls); scene.add(grp); REN.render(scene, CAM); const after = REN.info.render.calls;
  return { calls, tris, before, after, inScene: !!grp.parent }; });
check(`a street of six lots stands in the world and is drawn (${st.calls} draws, ${st.tris} triangles)`, st.inScene && st.after > st.before && st.after - st.before <= st.calls * 2, st);
fs.mkdirSync(path.join(here, 'out'), { recursive: true });
await page.screenshot({ path: path.join(here, 'out/kit-street.png') });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
