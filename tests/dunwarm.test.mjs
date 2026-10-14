// Session 688 prewarmed the open world's foes and left a note: the dungeon's foes are not prewarmed, so a first skeleton
// below can still hitch. Session 746 measured it, and there is nothing to prewarm: a dungeon's foes share their materials,
// its lights are a fixed pool of 20 (`_sweepScenePool`), so no kill or loot glow re-keys a program, and the first frame,
// behind the way-down fade, compiles the rest. A prewarm of the whole scene (REN.compile on both floors) changed nothing.
// This suite keeps it so: three old gates whose themes hold the most kinds (wraiths and phantoms, elementals and golems,
// gargoyles and mimics) at level 9; after the entry settles it stands by every foe on both floors and looks at it, and
// nothing may compile. A new material or a light outside the pool would show here as a compile on sight.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { const gl = REN.getContext(); window.__cs = 0; const o = gl.compileShader.bind(gl); gl.compileShader = s => { window.__cs++; return o(s); }; level = 9; });
const settle = async () => { let still = 0; for (let i = 0; i < 30 && still < 3; i++) { const a = await page.evaluate(() => __cs); await page.waitForTimeout(800); await g.frames(3); still = (await page.evaluate(() => __cs)) === a ? still + 1 : 0; } };
// Session 807: the count is taken as the renderer sees it, at each render of the dungeon's scene. On CI (4 runs in 27 reds)
// a count read between two frames found 21: a light added between frames (a foe's fx, a timer) that the next frame's
// sweep takes into the pool before it draws. What must hold is that no frame is drawn with a light outside the pool.
const nLights = () => page.evaluate(() => { let n = 0; dScene.traverse(o => { if (o.isPointLight) n++; }); return n; });
await page.evaluate(() => { const r = REN.render.bind(REN); window.__drawn = []; REN.render = (sc, cam) => { if (sc === dScene) { let n = 0; sc.traverse(o => { if (o.isPointLight) n++; }); __drawn.push(n); } return r(sc, cam); }; });
const drawnLights = () => page.evaluate(() => { const d = __drawn.slice(); __drawn.length = 0; return d; });
let seen = 0; const onSight = [], kinds = new Set(), lights = [];
for (const [theme, seed] of [['undead', 7], ['elemental', 9], ['haunted', 6]]) {
  await enterDungeon(page, { theme, seed }); await settle();
  const n = await page.evaluate(() => ENEMIES.length);
  for (const f of [1, 2]) {
    if (f === 2) { const ok = await page.evaluate(() => { if (!dMap2) return false; goToFloor2(); return true; }); if (!ok) break; await page.waitForTimeout(2500); await settle(); }
    for (let i = 0; i < n; i++) {
      const a = await page.evaluate(([i, f]) => { const e = ENEMIES[i]; if ((e.floor || 1) !== f || e.dead) return null; const y = f === 2 ? FLOOR2_Y : 0;
        px = e.x + 2.2; pz = e.z + .4; jumpY = y; lookAtPt(e.x, y + .8, e.z); window.__a = __cs; return 1; }, [i, f]);
      if (a === null) continue;
      await g.frames(3); seen++;
      const d = await page.evaluate((i) => [ENEMIES[i].name, ENEMIES[i].floor || 1, __cs - __a], i);
      kinds.add(d[0]); if (d[2]) onSight.push([theme, ...d]);
    }
  }
  // a kill adds a loot glow; the pool keeps the scene's point lights at 20, so no program is re-keyed
  await drawnLights(); await g.frames(2); const pre = await drawnLights();
  const l0 = pre.length ? Math.max(...pre) : -1, c0 = await page.evaluate(() => __cs);
  await page.evaluate(() => { const e = ENEMIES.find(x => !x.dead && (x.floor || 1) === currentFloor); px = e.x + 2; pz = e.z; lookAtPt(e.x, (currentFloor === 2 ? FLOOR2_Y : 0) + .8, e.z); killE(e); });
  await g.frames(4); const drawn = await drawnLights();
  lights.push([theme, l0, drawn.length ? Math.min(...drawn) : -1, drawn.length ? Math.max(...drawn) : -1, (await page.evaluate(() => __cs)) - c0, await nLights()]);
  console.log(theme, seed, 'foes', n);
}
// what CI read: a light added between two frames, as a timer would, is in the scene (21) until the next frame's sweep.
// Session 827: 21 or more. On a busy runner a foe's own light can already be waiting for the sweep when the suite adds its
// one (22 in 1 run of 3 run side by side here); what must hold is that every frame is still drawn with the pool's 20.
const between = await page.evaluate(() => { const L = new THREE.PointLight(0xffcc44, 1.2, 3); L.position.set(px, 1, pz); dScene.add(L); let n = 0; dScene.traverse(o => { if (o.isPointLight) n++; }); return n; });
await drawnLights(); const c1 = await page.evaluate(() => __cs); await g.frames(3); const after = await drawnLights(); const c2 = await page.evaluate(() => __cs);
console.log('a light added between frames: the scene holds', between, 'then draws', JSON.stringify(after), 'compiled', c2 - c1);
console.log('foes looked at', seen, 'kinds', [...kinds].join(', '), 'compiled on sight', JSON.stringify(onSight), 'kill:', JSON.stringify(lights));
check('every foe on both floors of three old gates comes into view with no shader compiled', seen > 60 && onSight.length === 0, { seen, kinds: kinds.size, onSight });
check('a kill and its loot glow leave the point lights at the pool\'s 20 in every frame drawn after it, and compile nothing', lights.every(([, a, lo, hi, c]) => a === 20 && lo === 20 && hi === 20 && c === 0), lights);
check('a light added between frames is counted (21, or more with a foe\'s own waiting) until the next sweep, and every frame is drawn with the pool\'s 20 (what CI read as a fault)', between >= 21 && after.length > 0 && after.every(n => n === 20) && c2 === c1, { between, after, compiled: c2 - c1 });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
