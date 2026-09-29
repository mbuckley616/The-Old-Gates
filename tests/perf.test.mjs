// Performance profile (Session 176): what a frame costs, where. Draw calls and triangles for the eye's pass and the
// sun's shadow pass separately, what casts shadows, trees and lights, the world's tick. Headless Chromium draws on
// software GL, so milliseconds here are only for comparing one part against another; counts are exact.
// Prints a table; checks only that the profile could be taken.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const profile = (label) => page.evaluate((label) => {
  CAM.updateMatrixWorld(true); scene.updateMatrixWorld(true);
  const I = REN.info; I.autoReset = false; const sm = REN.shadowMap; const au = sm.autoUpdate;
  const pass = (shadow) => { I.reset(); sm.autoUpdate = shadow; sm.needsUpdate = shadow; const gl = REN.getContext(); gl.finish(); const t = performance.now(); REN.render(scene, CAM); gl.finish(); return { ms: performance.now() - t, calls: I.render.calls, tris: I.render.triangles }; };
  pass(true); pass(false);
  const runs = n => { const a = []; for (let i = 0; i < n; i++) a.push(pass(i % 2 === 0)); return a; };
  const r = runs(6), withS = r.filter((_, i) => i % 2 === 0), noS = r.filter((_, i) => i % 2 === 1);
  const avg = (a, k) => a.reduce((s, x) => s + x[k], 0) / a.length;
  sm.autoUpdate = au; I.autoReset = true;
  // what is in the scene
  let meshes = 0, vis = 0, casters = 0, casterTris = 0, inst = 0, instances = 0, instCasters = 0, pts = 0, ptsOn = 0, skinned = 0;
  const casterBy = {};
  scene.traverseVisible(o => { if (o.isPointLight) { pts++; if (o.intensity > 0) ptsOn++; }
    if (!o.isMesh) return; vis++; if (o.isSkinnedMesh) skinned++;
    const gm = o.geometry, t = gm && gm.attributes.position ? (gm.index ? gm.index.count : gm.attributes.position.count) / 3 : 0;
    if (o.isInstancedMesh) { inst++; instances += o.count; if (o.castShadow) instCasters += o.count; }
    if (o.castShadow) { casters++; const n = o.isInstancedMesh ? t * o.count : t; casterTris += n; const k = o.isInstancedMesh ? 'instanced' : o.isSkinnedMesh ? 'people' : (o.material && o.material.name) || 'other'; casterBy[k] = (casterBy[k] || 0) + n; } });
  scene.traverse(o => { if (o.isMesh) meshes++; });
  // the world's tick, 60 steps
  const t0 = performance.now(); for (let i = 0; i < 60; i++) WORLD.tick(1 / 60, performance.now()); const tickMs = (performance.now() - t0) / 60;
  return { label, calls: { eye: noS[0].calls, shadow: withS[0].calls - noS[0].calls }, tris: { eye: noS[0].tris, shadow: withS[0].tris - noS[0].tris },
    ms: { withShadow: +avg(withS, 'ms').toFixed(1), eyeOnly: +avg(noS, 'ms').toFixed(1), tick: +tickMs.toFixed(2) },
    meshes, visible: vis, casters, casterTris: Math.round(casterTris), casterBy: Object.fromEntries(Object.entries(casterBy).map(([k, v]) => [k, Math.round(v)]).sort((a, b) => b[1] - a[1]).slice(0, 6)),
    instanced: inst, instances, instCasters, skinned, pointLights: pts, pointLightsOn: ptsOn, shadowMap: sun_size(), pixelRatio: REN.getPixelRatio(), size: [innerWidth, innerHeight] };
  function sun_size() { let s = null; scene.traverse(o => { if (o.isDirectionalLight && o.castShadow) s = [o.shadow.mapSize.x, o.shadow.camera.right * 2]; }); return s; }
}, label);

// a CPU profile of the world's tick: self time by function, the top twelve
const cdp = await page.context().newCDPSession(page);
const tickProfile = async (label, n = 120) => {
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  const ms = await page.evaluate(n => { const t0 = performance.now(); for (let i = 0; i < n; i++) WORLD.tick(1 / 60, performance.now()); return (performance.now() - t0) / n; }, n);
  const { profile } = await cdp.send('Profiler.stop');
  const self = {}; const dt = {}; const idx = new Map(profile.nodes.map(nd => [nd.id, nd]));
  for (let i = 0; i < profile.samples.length; i++) { const nd = idx.get(profile.samples[i]); const k = `${nd.callFrame.functionName || '(anon)'}:${nd.callFrame.lineNumber + 1}`; self[k] = (self[k] || 0) + (profile.timeDeltas[i] || 0); }
  const tot = Object.values(self).reduce((a, b) => a + b, 0);
  const top = Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k} ${(100 * v / tot).toFixed(1)}%`);
  // who asks for the terrain: inclusive time of each caller of rawH, by the chain up to the tick
  const parent = new Map(); for (const nd of profile.nodes) for (const c of (nd.children || [])) parent.set(c, nd.id);
  const incl = {}; for (let i = 0; i < profile.samples.length; i++) { let id = profile.samples[i]; const seen = new Set();
    while (id != null) { const nd = idx.get(id); const k = `${nd.callFrame.functionName || '(anon)'}:${nd.callFrame.lineNumber + 1}`; if (!seen.has(k)) { seen.add(k); incl[k] = (incl[k] || 0) + (profile.timeDeltas[i] || 0); } id = parent.get(id); } }
  const inclTop = Object.entries(incl).sort((a, b) => b[1] - a[1]).slice(0, 26).map(([k, v]) => `${k} ${(100 * v / tot).toFixed(1)}%`);
  console.log(JSON.stringify({ label, tickMs: +ms.toFixed(2), top, inclTop }));
  return ms; };
const rows = [];
await page.waitForTimeout(3000); rows.push(await profile('start (Hearthwick road)'));
await page.waitForTimeout(15000); await tickProfile('tick at the start, settled');
await g.settle('dunmore'); await page.evaluate(() => { forceTime(13); const S = WORLD.settle.get('dunmore'); px = S.site.x; pz = S.site.z + 4; });
await page.waitForTimeout(4000); await g.frames(4); rows.push(await profile('Dunmore square, 13h'));
await tickProfile('tick in Dunmore at 13h');
for (const r of rows) console.log(JSON.stringify(r));
// F9: the readout a playtest can use on a real machine
await page.keyboard.press('F9'); await page.waitForTimeout(3000); await g.frames(6);
const hud = await page.evaluate(() => ({ on: window.PERF.on, last: window.PERF.last, text: (document.getElementById('perf-hud') || {}).textContent, shown: (document.getElementById('perf-hud') || { style: {} }).style.display }));
await page.keyboard.press('F9'); const off = await page.evaluate(() => ({ on: window.PERF.on, shown: document.getElementById('perf-hud').style.display }));
console.log('F9', JSON.stringify(hud));
check('F9 shows frames a second, the frame, the loop, the draw, calls and triangles', hud.on && hud.shown === 'block' && hud.last && hud.last.fps > 0 && hud.last.calls > 0 && hud.last.tris > 0 && /fps · frame .* ms \(worst .*\) · loop .* · draw /.test(hud.text) && / calls · .*k tris/.test(hud.text), hud);
check('F9 again hides it', !off.on && off.shown === 'none', off);
check('a profile was taken in both places', rows.length === 2 && rows.every(r => r.calls.eye > 0), rows.map(r => r.label));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
