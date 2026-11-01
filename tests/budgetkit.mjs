// The budget suites' kit (Session 1297, QA): `budget` (Dunmore's four views) and `budgetport` (Portclare's square, an inn's hall, a
// gate's floor) share it. Not a suite itself (no .test.mjs). budgetKit(g) returns what a suite measures with, and budgetEnd(g, rows,
// views) checks the ceilings over the views the suite holds, prints the ledger's table and, with BUDGET_LEDGER=1, appends it to
// docs/qa/budget.md with the build tag.
import { check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
export const CEIL = { Low: { calls: 700, tris: 1.2e6 }, Middle: { calls: 1000, tris: 2.0e6 }, High: { calls: 1300, tris: 4.0e6 } };
export const LEVELS = [['Low', 0], ['Middle', 1], ['High', 2]];
export function budgetKit(g) {
const T0 = Date.now(), el = () => Math.round((Date.now() - T0) / 1000);
// one frame counted three ways: whole (shadow on), without the shadow pass, without the shadow pass and the bloom; and the eye's
// calls by kind, counted as the renderer culls (a mesh in the camera's frustum, or never culled; one call a material group)
const count = () => g.page.evaluate(() => {
  CAM.updateMatrixWorld(true); scene.updateMatrixWorld(true);
  const sm = REN.shadowMap, au = sm.autoUpdate, I = REN.info, Q = landQ(), bl = Q.bloom;
  // S1684 — in a gate the game draws through dRender, which hides the spaces you cannot see from where you stand (Session 1302's
  // zones); REN.render alone drew all of them, so the ledger's gate read 277 calls where the game draws 126. Count what the game draws.
  const gate = typeof dRender === 'function' && typeof dScene !== 'undefined' && scene === dScene;
  const draw = () => gate ? dRender(scene, CAM) : REN.render(scene, CAM);
  const one = (sh, bloom) => { sm.autoUpdate = sh; sm.needsUpdate = sh; Q.bloom = bloom; draw(); return { calls: I.render.calls, tris: I.render.triangles }; };
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
  // in a gate, walk the scene while dRender has the unseen spaces hidden: it hides them, calls REN.render, and shows them again
  const walk = f => { if (!gate) return f(); const R0 = REN.render; REN.render = function () { f(); }; try { dRender(scene, CAM); } finally { REN.render = R0; } };
  walk(() => scene.traverseVisible(o => { if (!(o.isMesh || o.isLine || o.isPoints || o.isSprite)) return; if (o.layers && !o.layers.test(CAM.layers)) return;
    if (o.frustumCulled !== false && !(o.isSprite ? fr.containsPoint(o.getWorldPosition(new THREE.Vector3())) : (o.geometry && (o.geometry.boundingSphere || o.geometry.computeBoundingSphere(), o.geometry.boundingSphere) && fr.intersectsObject(o)))) return;
    if (o.isInstancedMesh && o.count === 0) return;
    const m = o.material, n = Array.isArray(m) ? Math.max(1, (o.geometry.groups || []).length) : 1, kd = kindOf(o); by[kd] = (by[kd] || 0) + n;
    if (kd === 'other') { const t = top(o), nm = t.name || (t.isMesh ? (t.material && t.material.name) || t.type : t.type); otherBy[nm] = (otherBy[nm] || 0) + n; } }));
  const others = Object.entries(otherBy).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { calls: all.calls, tris: all.tris, shadow: all.calls - eye.calls, post: eye.calls - bare.calls, eye: bare.calls, by, others, shadowTris: all.tris - eye.tris };
});
const measure = async (label, level) => { await g.spin(null, 20); const row = { label, level, ...(await count()) }; console.log(el(), JSON.stringify(row)); return row; };
// stand at a spot, looking one way, at an hour, and let the cells, the chunks, the grass and the bodies near it build
const stand = async (x, z, ry, hour) => {
  await g.page.evaluate(([x, z, ry, h]) => { px = x; pz = z; yaw = ry; pitch = -.05; forceTime(h); }, [x, z, ry, hour]);
  const t = Date.now(); await g.cells(); for (let i = 0; i < 3; i++) { await g.spin(null, 60); await g.page.evaluate(() => { const t0 = performance.now(); while (JOBS.length && performance.now() - t0 < 1500) runJobs(); }); await g.frames(2); }
  console.log(`  stood at ${Math.round(x)}, ${Math.round(z)}, ${hour}h in ${Math.round((Date.now() - t) / 1000)} s`);
};
const setLevel = async n => { const t = Date.now(); await g.page.evaluate(n => { SETTINGS.quality = n; if (typeof qualityApply === 'function') qualityApply(); else landQuality(); }, n); await g.spin(null, 120); console.log(`  level ${n} set in ${Math.round((Date.now() - t) / 1000)} s`); };

return { count, measure, stand, setLevel };
}
export async function budgetEnd(g, rows, views) {
  const tag = (await g.page.evaluate(() => (document.getElementById('cbar').textContent.match(/build (s\d+)/) || [])[1])) || '?';
  const outdoor = rows.filter(r => CEIL[r.level]);
  for (const [name] of LEVELS) { const mine = outdoor.filter(r => r.level === name), c = CEIL[name];
    const over = mine.filter(r => r.calls > c.calls).map(r => [r.label, r.calls]), overT = mine.filter(r => r.tris > c.tris).map(r => [r.label, r.tris]);
    check(`at ${name}, every view (${views}) under ${c.calls} draw calls`, mine.length === views && over.length === 0, { over, calls: mine.map(r => r.calls) });
    check(`at ${name}, every view (${views}) under ${c.tris / 1e6} M triangles`, mine.length === views && overT.length === 0, { over: overT, tris: mine.map(r => r.tris) }); }
  const k = n => n >= 1e6 ? (n / 1e6).toFixed(2) + ' M' : Math.round(n / 1000) + 'k';
  const over = r => CEIL[r.level] && r.calls > CEIL[r.level].calls ? ' **over**' : '';
  const table = `\n### ${tag} — ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC\n\n| View | Level | Calls | Triangles | Shadow | Post | Bodies | Houses | Land | Other | Most of the other |\n|---|---|---|---|---|---|---|---|---|---|---|\n` +
    rows.map(r => `| ${r.label} | ${r.level} | ${r.calls}${over(r)} | ${k(r.tris)} | ${r.shadow} | ${r.post} | ${r.by.bodies} | ${r.by.houses} | ${r.by.land} | ${(r.by.other || 0) + (r.by.room || 0) + (r.by.gate || 0)} | ${r.others.map(([n, c]) => `${n} ${c}`).join(', ')} |`).join('\n') + '\n';
  console.log(table);
  if (process.env.BUDGET_LEDGER) fs.appendFileSync(path.join(ROOT, 'docs', 'qa', 'budget.md'), table);
}
