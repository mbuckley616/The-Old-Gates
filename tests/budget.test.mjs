// The budgets (Session 1297, QA; v2-scope.md §5 and docs/design/streaming-and-quality-build.md, "The ceilings"): draw calls and
// triangles counted by REN.info on the frame the game draws (REN.render(scene, CAM): the sun's shadow pass and the bloom's passes
// included) in the five views of the build sheet, Dunmore's street and the field west of it at noon, the field at dawn, the street
// at midnight and Portclare's square at noon, at each quality level, against that level's ceilings (Low 700 calls and 1.2 M
// triangles, Middle 1,000 and 2.0 M, High 1,300 and 4.0 M). Two more spots, an inn's hall and a gate's floor, are counted at Middle
// for the ledger only: the ceilings are the world's. Each count is split by kind for the builders: the shadow pass, the post (the
// bloom's six passes), and the eye's own calls by what draws them (bodies, houses, land, the rest). The camera stands at a fixed
// spot looking a fixed way; a view's count is the median of three frames, since the townsfolk walk. Frame rate is not measured here:
// software GL is not a target machine (it is Michael's reading on his laptop at F14). BUDGET_LEDGER=1 appends the run's table to
// docs/qa/budget.md with the build tag; QA's run does that, CI does not.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const T0 = Date.now(), el = () => Math.round((Date.now() - T0) / 1000);
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();
const CEIL = { Low: { calls: 700, tris: 1.2e6 }, Middle: { calls: 1000, tris: 2.0e6 }, High: { calls: 1300, tris: 4.0e6 } };
const LEVELS = [['Low', 0], ['Middle', 1], ['High', 2]];

// one frame counted three ways: whole (shadow on), without the shadow pass, without the shadow pass and the bloom; and the eye's
// calls by kind, counted as the renderer culls (a mesh in the camera's frustum, or never culled; one call a material group)
const count = () => page.evaluate(() => {
  CAM.updateMatrixWorld(true); scene.updateMatrixWorld(true);
  const sm = REN.shadowMap, au = sm.autoUpdate, I = REN.info, Q = landQ(), bl = Q.bloom;
  const one = (sh, bloom) => { sm.autoUpdate = sh; sm.needsUpdate = sh; Q.bloom = bloom; REN.render(scene, CAM); return { calls: I.render.calls, tris: I.render.triangles }; };
  let all, eye, bare; try { all = one(true, bl); eye = one(false, bl); bare = one(false, false); } finally { sm.autoUpdate = au; Q.bloom = bl; }
  const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(CAM.projectionMatrix, CAM.matrixWorldInverse));
  // a body is anything under a skinned mesh's rig or a builder body; houses are what a settlement's group holds; land is what a
  // chunk's group holds (terrain, trees, grass, roads); the rest is named by its top-level parent, the largest few listed
  const roots = new Map();
  if (typeof chunks !== 'undefined') for (const ch of chunks.values()) if (ch.group) roots.set(ch.group, 'land');
  if (typeof SETTLE !== 'undefined') for (const S of SETTLE.values()) if (S.group) roots.set(S.group, 'houses');
  const top = o => { let p = o; while (p.parent && p.parent !== scene) p = p.parent; return p; };
  const kindOf = o => { let k = null; for (let p = o; p && p !== scene; p = p.parent) {
      if (p.isSkinnedMesh || p.name === 'builder' || p.name === 'mid' || (p.isBone || p.type === 'Bone')) return 'bodies';
      if (!k && roots.has(p)) k = roots.get(p); }
    return k || (isInterior() ? 'room' : activeZoneId === 'dungeon' ? 'gate' : 'other'); };
  const by = { bodies: 0, houses: 0, land: 0, other: 0 }, otherBy = {};
  scene.traverseVisible(o => { if (!(o.isMesh || o.isLine || o.isPoints || o.isSprite)) return; if (o.layers && !o.layers.test(CAM.layers)) return;
    if (o.frustumCulled !== false && !(o.isSprite ? fr.containsPoint(o.getWorldPosition(new THREE.Vector3())) : (o.geometry && (o.geometry.boundingSphere || o.geometry.computeBoundingSphere(), o.geometry.boundingSphere) && fr.intersectsObject(o)))) return;
    if (o.isInstancedMesh && o.count === 0) return;
    const m = o.material, n = Array.isArray(m) ? Math.max(1, (o.geometry.groups || []).length) : 1, kd = kindOf(o); by[kd] = (by[kd] || 0) + n;
    if (kd === 'other') { const t = top(o), nm = t.name || (t.isMesh ? (t.material && t.material.name) || t.type : t.type); otherBy[nm] = (otherBy[nm] || 0) + n; } });
  const others = Object.entries(otherBy).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { calls: all.calls, tris: all.tris, shadow: all.calls - eye.calls, post: eye.calls - bare.calls, eye: bare.calls, by, others, shadowTris: all.tris - eye.tris };
});
const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
const measure = async (label, level) => { const r = []; for (let i = 0; i < 3; i++) { await g.spin(null, 20); r.push(await count()); }
  const mid = r.slice().sort((x, y) => x.calls - y.calls)[1]; const row = { label, level, ...mid, tris: med(r.map(x => x.tris)), spread: [Math.min(...r.map(x => x.calls)), Math.max(...r.map(x => x.calls))] };
  console.log(el(), JSON.stringify(row)); return row; };
// stand at a spot, looking one way, at an hour, and let the cells, the chunks, the grass and the bodies near it build
const stand = async (x, z, ry, hour) => {
  await page.evaluate(([x, z, ry, h]) => { px = x; pz = z; yaw = ry; pitch = -.05; forceTime(h); }, [x, z, ry, hour]);
  const t = Date.now(); await g.cells(); for (let i = 0; i < 3; i++) { await g.spin(null, 60); await page.evaluate(() => { const t0 = performance.now(); while (JOBS.length && performance.now() - t0 < 1500) runJobs(); }); await g.frames(2); }
  console.log(`  stood at ${Math.round(x)}, ${Math.round(z)}, ${hour}h in ${Math.round((Date.now() - t) / 1000)} s`);
};
const setLevel = async n => { const t = Date.now(); await page.evaluate(n => { SETTINGS.quality = n; if (typeof qualityApply === 'function') qualityApply(); else landQuality(); }, n); await g.spin(null, 120); console.log(`  level ${n} set in ${Math.round((Date.now() - t) / 1000)} s`); };

const rows = [];
check('Dunmore stands on the new look', await g.settle('dunmore'));
const D = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); return { x: S.site.x, z: S.site.z }; });
const VIEWS = [['Dunmore street, noon', D.x, D.z + 4, 0, 12], ['the field west of Dunmore, noon', D.x - 160, D.z, -Math.PI / 2, 12],
  ['the field west of Dunmore, dawn', D.x - 160, D.z, -Math.PI / 2, 6], ['Dunmore street, midnight', D.x, D.z + 4, 0, 0]];
for (const [label, x, z, ry, h] of VIEWS) { await stand(x, z, ry, h);
  for (const [name, n] of LEVELS) { await setLevel(n); rows.push(await measure(label, name)); } await setLevel(1); }
check('Portclare stands on the new look', await g.settle('portclare'));
const P = await page.evaluate(() => { const S = WORLD.settle.get('portclare'); return { x: S.site.x, z: S.site.z }; });
await stand(P.x, P.z + 4, 0, 12);
for (const [name, n] of LEVELS) { await setLevel(n); rows.push(await measure('Portclare square, noon', name)); }
await setLevel(1);

// the ledger's two indoor spots, at Middle: Dunmore's inn, from its door; a medium gate's first floor, from its entrance
await g.settle('dunmore');
const inn = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), h = S.houses.find(h => h.type === 'inn'); if (!h) return null; forceTime(20); px = h.exitX; pz = h.exitZ; goToInterior(h); return h.name; });
for (let k = 0; k < 60 && inn && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
if (inn && await page.evaluate(() => isInterior())) { await g.frames(4); rows.push(await measure(`${inn}, the hall from the door`, 'Middle (indoors)'));
  await page.evaluate(() => exitInterior()); await page.waitForFunction(() => currentHouse == null, null, { timeout: 60000 }); await g.frames(2); await g.hide(); }
const { enterDungeon } = await import('./lib/dungeonshot.mjs');
const dg = await enterDungeon(page, { theme: 'ruins', seed: 11, size: 'medium' });
await g.frames(4); rows.push(await measure('a medium gate (ruins, seed 11), its entrance', 'Middle (indoors)'));

const tag = (await page.evaluate(() => (document.getElementById('cbar').textContent.match(/build (s\d+)/) || [])[1])) || '?';
const outdoor = rows.filter(r => CEIL[r.level]);
for (const [name] of LEVELS) { const mine = outdoor.filter(r => r.level === name), c = CEIL[name];
  const over = mine.filter(r => r.calls > c.calls).map(r => [r.label, r.calls]), overT = mine.filter(r => r.tris > c.tris).map(r => [r.label, r.tris]);
  check(`at ${name}, every view under ${c.calls} draw calls`, mine.length === 5 && over.length === 0, { over, calls: mine.map(r => r.calls) });
  check(`at ${name}, every view under ${c.tris / 1e6} M triangles`, mine.length === 5 && overT.length === 0, { over: overT, tris: mine.map(r => r.tris) }); }
check('the inn and the gate were counted, and drew', rows.length === 17 && rows.slice(15).every(r => r.calls > 0), { inn, gate: dg, n: rows.length });
check('no page errors', g.errs.length === 0, g.errs);

// the table, printed and (BUDGET_LEDGER=1) appended to the ledger
const k = n => n >= 1e6 ? (n / 1e6).toFixed(2) + ' M' : Math.round(n / 1000) + 'k';
const head = `\n### ${tag} — ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC\n\n| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Spread | Most of the other |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
const table = head + rows.map(r => `| ${r.label} | ${r.level} | ${r.calls}${CEIL[r.level] && r.calls > CEIL[r.level].calls ? ' **over**' : ''} | ${k(r.tris)} | ${r.shadow} | ${r.post} | ${r.by.bodies} | ${r.by.houses} | ${r.by.land} | ${(r.by.other || 0) + (r.by.room || 0) + (r.by.gate || 0)} | ${r.spread.join('–')} | ${r.others.map(([n, c]) => `${n} ${c}`).join(', ')} |`).join('\n') + '\n';
console.log(table);
fs.mkdirSync(path.join(ROOT, 'tests', 'out'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'tests', 'out', 'budget.json'), JSON.stringify({ tag, rows }, null, 1));
if (process.env.BUDGET_LEDGER) fs.appendFileSync(path.join(ROOT, 'docs', 'qa', 'budget.md'), table);
await g.close();
