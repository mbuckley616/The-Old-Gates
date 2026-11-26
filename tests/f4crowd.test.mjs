// Card F4 (Session 1195), cut from f4people in Session 2676: the same people on a second boot, and the draw calls where Dunmore's
// crowd is thickest. f4people had grown past run.mjs's 900 s cap on CI (both tries cut at 15:00 to the second on #2051, 45718043941;
// Playwright closes the browser on the cap's SIGTERM, so the log read "the page closed"). These two checks need their own boots, so
// they stand here: the first boot only records who is in the street and their genomes, the second is the old suite's second boot.
import { boot, check } from './lib/game.mjs';

// Dunmore's square at noon, every body within reach of the eye built (one at a time, nearest first, as the game builds them)
async function dunmore(g) {
  const { page } = g;
  await g.intoWorld(); await g.settle('dunmore');
  return page.evaluate(() => { forceTime(12); for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
    const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 4; yaw = 0; pitch = 0; for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
    CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
    const want = () => [...HB_RIGS].filter(r => (!r.hb || r.hb.cold) && !r.hbFail && r.root.parent === WORLD.scene && r.root.visible && Math.hypot(CAM.position.x - r.root.position.x, CAM.position.z - r.root.position.z) < HBODY.build).length;
    { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); } // the loading comes first (hbTick waits for it)
    REN.render(scene, CAM); const p0 = REN.info.programs.length; // the street drawn once, without the builder's bodies
    let k = 0; const t0 = performance.now(); while (want() && k++ < 1500) tickPeople(1 / 60, 1e5 + k * (HBODY.gap + 1));
    const p1 = REN.info.programs.length, shown = [...HB_RIGS].filter(r => r.hb && r.hb.L < 2).length; REN.render(scene, CAM);
    return { ticks: k, left: want(), ms: Math.round(performance.now() - t0), built: HBODY.n, msEach: Math.round(HBODY.ms / Math.max(1, HBODY.n)), frames: HBODY.frames, worst: Math.round(HBODY.worst), warmed: p1 - p0, shown, atDraw: REN.info.programs.length - p1 }; });
}

// the first boot: who stands in Dunmore's street with the builder's body, and their genomes (f4people checks the bodies themselves)
const g = await boot({ look: 'new' }); const { page } = g;
await dunmore(g);
const who = await page.evaluate(() => { const built = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene && !r.foe && HB_RIGS.has(r) && r.hb);
  return { built: built.length, sample: built.slice(0, 6).map(r => r.g.hbKey) }; });
const genomes = await page.evaluate((keys) => Object.fromEntries(keys.map(k => [k, JSON.stringify(HB.toSaved(HB_GENOMES.get(k)))])), who.sample);
await g.close();

// a second boot: the same people, the same bodies
const g2 = await boot({ look: 'new' }); await dunmore(g2);
const g2genomes = await g2.page.evaluate((keys) => Object.fromEntries(keys.map(k => [k, HB_GENOMES.has(k) ? JSON.stringify(HB.toSaved(HB_GENOMES.get(k))) : null])), who.sample);
const same = who.sample.filter(k => g2genomes[k] === genomes[k]).length;
check('on a second boot each of them is the same person (the same genome from the same place and name)', same === who.sample.length && same >= 4, { same, of: who.sample.length });
// S1224 (card F4): the near level's cost where the crowd is thickest. At 18h, the most of Dunmore's people within 16 m of one of them
// (seven, Session 1224); 6 m off their middle, every body within 46 m built, the frame at the middle quality looking four ways
const crowd = await g2.page.evaluate(() => { forceTime(18); for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
  let rs = [...HB_RIGS].filter(r => r.root.parent === WORLD.scene && r.root.visible), P = rs.map(r => [r.root.position.x, r.root.position.z]);
  let best = 0, at = null; for (const [x, z] of P) { const n = P.filter(([a, b]) => Math.hypot(a - x, b - z) < 16).length; if (n > best) { best = n; at = [x, z]; } }
  const near = P.filter(([a, b]) => Math.hypot(a - at[0], b - at[1]) < 16), cx = near.reduce((s, p) => s + p[0], 0) / near.length, cz = near.reduce((s, p) => s + p[1], 0) / near.length;
  px = cx; pz = cz + 6; for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 30000) runJobs(); }
  pitch = -.05; CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.rotation.set(pitch, 0, 0, 'YXZ'); CAM.updateMatrixWorld(true);
  const want = () => [...HB_RIGS].filter(r => (!r.hb || r.hb.cold) && !r.hbFail && r.root.parent === WORLD.scene && r.root.visible && Math.hypot(CAM.position.x - r.root.position.x, CAM.position.z - r.root.position.z) < HBODY.build).length;
  let k = 0; while (want() && k++ < 1500) tickPeople(1 / 60, 1e5 + k * (HBODY.gap + 1));
  SETTINGS.quality = 1; rs = [...HB_RIGS].filter(r => r.hb && r.root.parent === WORLD.scene && r.root.visible);
  const views = [0, Math.PI / 2, Math.PI, -Math.PI / 2].map(yw => { yaw = yw; CAM.rotation.set(pitch, yaw, 0, 'YXZ'); CAM.updateMatrixWorld(true); tickPeople(1 / 60, 4e5); REN.render(scene, CAM); return REN.info.render.calls; });
  return { most16: best, built: rs.length, left: want(), near: rs.filter(r => r.hb.L === 0).length, views, worst: Math.max(...views) }; });
console.log('  crowd:', JSON.stringify(crowd));
check(`where Dunmore's crowd is thickest (${crowd.most16} people within 16 m, ${crowd.near} bodies whole), the frame stays under 1,000 draw calls every way you look (${crowd.worst})`, crowd.left === 0 && crowd.most16 >= 4 && crowd.near >= 4 && crowd.worst < 1000, crowd);
await g2.close();
