// Card F3, the land in the new look (Session 1180, js/89-world-land.js): booted on three.js 0.170, the world's chunks are
// shaded by the land's own material, which paints fields, hedgerows, rock and the woods from afar over groundColor's vertex
// colour; every chunk carries a per-vertex mask that keeps the fields off roads and out of site stamps; the sky is a gradient
// dome that follows the clock; the world's frame is tone-mapped (ACES) and graded, and rooms are not. The console stays clean
// (a shader that fails to compile says so there). Draw calls at Dunmore at noon are logged against v2-scope.md §5's budget (docs/qa/budget.md does not exist yet).
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
await page.evaluate(() => forceTime(12));
await g.spin(null, 60); await g.frames(3);

const m = await page.evaluate(() => {
  const ch = [...WORLD.scene.children].filter(o => o.isGroup && o.children[0] && o.children[0].isMesh && o.children[0].geometry.attributes.aMask);
  const terr = ch.map(o => o.children[0]);
  const prog = REN.info.programs.find(p => p.cacheKey && p.cacheKey.includes('og-land-terrain'));
  // roads and stamps: no field on any vertex inside a road's half-width or a stamp's core
  let onRoad = 0, roadField = 0, inStamp = 0, stampField = 0, field = 0, verts = 0;
  for (const t of terr) { const pa = t.geometry.attributes.position, mk = t.geometry.attributes.aMask;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) + t.position.x, z = pa.getZ(i) + t.position.z; verts++;
      const ri = roadInfo(x, z), st = stampAt(x, z), f = mk.getZ(i); if (f > .05) field++;
      if (ri && ri.d < ROAD_HALF) { onRoad++; if (f > 0) roadField++; }
      if (st) { inStamp++; if (f > 0 || mk.getX(i) !== 1) stampField++; } } }
  return { on: LAND.on, chunks: ch.length, allLand: terr.every(t => t.material === LAND.mat), prog: !!prog, oldDome: skyDome.visible, dome: !!(LAND.sky && LAND.sky.parent === WORLD.scene && LAND.sky.visible),
    verts, field, onRoad, roadField, inStamp, stampField };
});
check('the new look\'s chunks are drawn by the land material, its program compiled', m.on && m.chunks >= 20 && m.allLand && m.prog, m);
check('fields are laid on the open country and never on a road or in a site\'s stamp', m.field > 0 && m.onRoad > 0 && m.roadField === 0 && m.inStamp > 0 && m.stampField === 0, m);
check('the gradient dome replaces the old sky dome', m.dome && !m.oldDome, m);

// the sky follows the clock: zenith brightest at noon, a warm horizon at dawn and at the golden hour (17.5; on the game's clock the
// sun is down by 18.5, so 20h is already night), dark at midnight
const sky = {};
for (const h of [6, 12, 17.5, 20, 0]) {
  sky[h] = await page.evaluate(h => { forceTime(h); for (let i = 0; i < 240; i++) WORLD.tick(1 / 60, performance.now()); const U = LAND.skyMat.uniforms;
    const L = c => +(.2126 * c.r + .7152 * c.g + .0722 * c.b).toFixed(3);
    return { zen: L(U.uZen.value), hor: L(U.uHor.value), warm: +(U.uHor.value.r / Math.max(.01, U.uHor.value.b)).toFixed(2), sunY: +U.uSun.value.y.toFixed(2) }; }, h);
}
check('the sky follows forceTime: noon\'s zenith brighter than 17.5h\'s, 17.5h\'s than midnight\'s, and 20h and midnight are night', sky[12].zen > sky[17.5].zen && sky[17.5].zen > sky[0].zen && sky[0].zen < .12 && sky[20].zen < .12, sky);
check('the sun rides the dome: up at noon, down at midnight', sky[12].sunY > .9 && sky[0].sunY < -.9, sky);
check('the horizon warms at sunrise and at the golden hour and is cooler at noon', sky[6].warm > sky[12].warm && sky[17.5].warm > sky[12].warm, sky);

// the post: the world's frame is tone-mapped and graded, and the renderer is left as it was after it
const post = await page.evaluate(() => { forceTime(12); for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
  let during = null; const sc = WORLD.scene, ob = sc.onBeforeRender; sc.onBeforeRender = (...a) => { ob(...a); during = REN.toneMapping; };
  REN.render(scene, CAM); sc.onBeforeRender = ob;
  return { during, after: REN.toneMapping, aces: THREE.ACESFilmicToneMapping, graded: THREE.ShaderChunk.tonemapping_fragment.includes('og-grade'), calls: REN.info.render.calls, tris: REN.info.render.triangles }; });
check('the world renders with ACES and the grade, and the renderer goes back to no tone mapping after it', post.during === post.aces && post.after === 0 && post.graded, post);
// Dunmore at noon, from the street: v2-scope.md §5's budget line, logged
const d = await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 4; yaw = 0; pitch = 0; for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.rotation.set(0, 0, 0); CAM.updateMatrixWorld(true);
  const t0 = performance.now(); REN.render(scene, CAM); const ms = performance.now() - t0; return { calls: REN.info.render.calls, tris: REN.info.render.triangles, ms: Math.round(ms) }; });
console.log('  budget: Dunmore at noon, the new land:', JSON.stringify(d));
check('Dunmore at noon stays under the budget\'s 1,000 draw calls', d.calls > 50 && d.calls < 1000, d);

// a room is not tone-mapped: the post is the world's alone
const room = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'inn') || S.houses[0]; px = h.exitX; pz = h.exitZ; goToInterior(h); return h.type; });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
const rm = await page.evaluate(() => { let tm = -1; const sc = scene, ob = sc.onBeforeRender; sc.onBeforeRender = (...a) => { ob && ob(...a); tm = REN.toneMapping; }; REN.render(scene, CAM); sc.onBeforeRender = ob;
  return { inside: isInterior(), tm }; });
check('indoors the frame is not tone-mapped', rm.inside && rm.tm === 0, { room, ...rm });

const errs = g.logs.filter(l => /error/i.test(l) && !/favicon|net::|Failed to load resource/.test(l));
check('no shader or page errors', g.errs.length === 0 && errs.length === 0, { errs: g.errs.slice(0, 3), logs: errs.slice(0, 3) });
await g.close();
