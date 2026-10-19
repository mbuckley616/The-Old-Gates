// The two renderers side by side (Session 822, card F1): Dunmore at noon in clear weather, the same spot and the same view, once on
// r128 (the old look, the default) and once on three.js 0.170 (`?look=new`, js/05-compat.js putting back r128's colour and light).
// The pictures go to tests/out/lookpair-old.png and -new.png (Session 822 committed a pair under docs/prototypes/f1/); the suite
// measures the mean colour difference between them, and the frame's cost in each through the game's own PERF meter.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
fs.mkdirSync('tests/out', { recursive: true });

async function shoot(look) {
  const g = await boot({ look }); const { page } = g;
  // Session 991: the road's grain is a cosmetic roll, 1 ± .07 a vertex from Math.random (buildRoadRibbons, js/82-world-structures.js),
  // so each boot lays a different road, and the road box (a few large near triangles) read 223–240 in red across four tries on CI
  // (FLAKY on d07d7c0 and faaa8d4, worst 17 and 11), while sky, grass and wall agreed to a level. Both looks lay the same grain now:
  // while one chunk's ribbons are built, Math.random is a stream seeded by the chunk (cx, cz), and the old Math.random comes back after.
  await page.evaluate(() => { const build = buildRoadRibbons; window.__seededRoads = 0;
    buildRoadRibbons = function (cx, cz, group) { window.__seededRoads++; let s = (Math.imul(cx | 0, 73856093) ^ Math.imul(cz | 0, 19349663)) >>> 0; const rnd = Math.random;
      Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      try { return build(cx, cz, group); } finally { Math.random = rnd; } }; });
  // Session 1072: on the new look a Gatelands town is built from the kit (tests/kittown), so Dunmore's houses differ by design; this
  // suite compares the renderers, so both looks build the old town here.
  await page.evaluate(() => { window.OG_KIT_TOWNS = false; });
  // Session 1175 (card F3): the new look's land (js/89-world-land.js) shades the ground, the sky and the water its own way and
  // tone-maps the world's frame, by design; for the same reason, both looks draw the old land here. The world is not built yet,
  // so the switch holds for every chunk.
  await page.evaluate(() => { if (typeof LAND !== 'undefined') LAND.on = false; });
  await g.intoWorld(); await g.settle('dunmore');
  // Session 832: clear sky is not bare ground. Snow that fell while the town loaded lies for a minute or more after the sky
  // clears (it melts at about .014 a second here), and on CI (dfea40a) the old look's picture had it and the new one's not:
  // grass (191,224,134) against (173,212,98), the sky the same. The cover is taken off and the ground repainted before both shots.
  const cover = await page.evaluate(() => { forceTime(12); devWeather('clear'); const c = +WORLD.wx.cover.toFixed(3); WORLD.wx.cover = 0; snowRepaint(); return c; });
  await g.spin('clear', 120);
  for (let k = 0; k < 20 && await page.evaluate(() => !!(WORLD.wx.coverQ && WORLD.wx.coverQ.length)); k++) await g.spin('clear', 60);
  const r = await page.evaluate(() => {
    const t = WORLD.siteAnywhere('dunmore'); px = t.x + 6; pz = t.z + 34; yaw = Math.atan2(-(t.x - px), -(t.z - pz)); pitch = -.06; thirdPerson = false;
    forceTime(12);
    const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; let t0 = performance.now();
    // Session 1054: on bf251d1 (CI, 16 Oct) the new look's road box read (167,196,98), the grass's own colour: no road drawn there,
    // while snow had been cleared from both looks and the retry (the same cover) matched to 1. What lies under the box is read by a ray
    // through its centre (400, 390): a road ribbon, a near chunk's ground, or nothing near (the far terrain). The 30 frames stand; then
    // the loop runs on, up to 300 frames, until the ray meets a ribbon, and the check below names what it met.
    const ribs = new Set(_ribbons), rc = new THREE.Raycaster();
    const under = () => { const cv = REN.domElement; CAM.updateMatrixWorld(); rc.setFromCamera({ x: 400 / cv.width * 2 - 1, y: -(390 / cv.height * 2 - 1) }, CAM);
      const objs = []; for (const ch of chunks.values()) ch.group.children.forEach(o => { if (o.isMesh && (o.geometry === ch.terrain || ribs.has(o.geometry))) objs.push(o); });
      const h = rc.intersectObjects(objs, false)[0]; if (!h) return { hit: 'none', queued: buildQueue.length };
      const ch = [...chunks.values()].find(c => c.group === h.object.parent), ox = ch.cx * CHUNK, oz = ch.cz * CHUNK;
      let want = 0; for (const road of ROADS) { const p = road.pts; for (let i = 0; i < p.length - 1; i++) { const mx = (p[i].x + p[i + 1].x) / 2, mz = (p[i].z + p[i + 1].z) / 2; if (mx >= ox && mx < ox + CHUNK && mz >= oz && mz < oz + CHUNK) want++; } }
      const have = ch.group.children.filter(o => o.isMesh && ribs.has(o.geometry)).reduce((s, o) => s + o.geometry.attributes.position.count / 6, 0);
      return { hit: ribs.has(h.object.geometry) ? 'road' : 'ground', chunk: [ch.cx, ch.cz], segs: want, laid: have, queued: buildQueue.length }; };
    let extra = 0;
    try { for (let n = 0; n < 30; n++) { t0 += 1000 / 60; loop(t0); }
      for (; extra < 300 && under().hit !== 'road'; extra++) { t0 += 1000 / 60; loop(t0); } } finally { window.requestAnimationFrame = raf; prevT = 0; }
    const road = { ...under(), extra };
    REN.render(scene, CAM); const cv = REN.domElement, o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    // the draw alone: eight renders of the same frame (shadows included), each waited out by reading one pixel back
    const gl = REN.getContext(), px1 = new Uint8Array(4); REN.render(scene, CAM); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1);
    const t1 = performance.now(); for (let k = 0; k < 8; k++) { REN.render(scene, CAM); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1); }
    const renderMs = +((performance.now() - t1) / 8).toFixed(1), calls = REN.info.render.calls, tris = REN.info.render.triangles;
    return { road, seeded: window.__seededRoads, rev: THREE.REVISION, url: o.toDataURL(), at: [Math.round(px), Math.round(pz)], renderMs, calls, tris }; });
  // the frame's cost: the game's own meter over a few seconds of its own loop, standing still at the spot
  // Session 830: the meter reports once two frames 500 ms apart have been drawn; a loaded runner draws one every few seconds, so
  // 9 s could pass with no reading (CI's FLAKY on edda9f4; both looks read null here with two suites side by side). At least
  // 9 s as before, then until it has read, up to 120 s.
  await page.evaluate(() => { perfToggle(); });
  await page.waitForTimeout(9000);
  await page.waitForFunction(() => !!PERF.last, null, { timeout: 120000, polling: 500 }).catch(() => {});
  r.perf = await page.evaluate(() => { const p = PERF.last; perfToggle(); return p; });
  r.errs = g.errs.slice(); r.cover = cover; r.coverLeft = await page.evaluate(() => [WORLD.wx.cover, (WORLD.wx.coverQ || []).length]);
  await g.close();
  return r;
}

const oldR = await shoot('');
const newR = await shoot('new');
fs.writeFileSync('tests/out/lookpair-old.png', Buffer.from(oldR.url.split(',')[1], 'base64'));
fs.writeFileSync('tests/out/lookpair-new.png', Buffer.from(newR.url.split(',')[1], 'base64'));
check('the old look is r128 and the new one 0.170, at the same spot', oldR.rev === '128' && newR.rev === '170' && oldR.at.join() === newR.at.join(), { old: oldR.rev, new: newR.rev, at: oldR.at });

// the mean difference, read in a page of its own: per channel on 0–255, and the share of pixels that differ by more than 24 in any channel
const g = await boot(); const { page } = g;
const diff = await page.evaluate(async ([a, b]) => {
  const load = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; });
  const A = await load(a), B = await load(b); const W = A.width, H = A.height, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.drawImage(A, 0, 0); const da = x.getImageData(0, 0, W, H).data; x.clearRect(0, 0, W, H); x.drawImage(B, 0, 0); const db = x.getImageData(0, 0, W, H).data;
  let s = 0, sr = 0, sg = 0, sb = 0, big = 0, la = 0, lb = 0; const n = W * H;
  for (let i = 0; i < da.length; i += 4) { const r = Math.abs(da[i] - db[i]), gg = Math.abs(da[i + 1] - db[i + 1]), bb = Math.abs(da[i + 2] - db[i + 2]);
    sr += r; sg += gg; sb += bb; s += (r + gg + bb) / 3; if (Math.max(r, gg, bb) > 24) big++; la += da[i] + da[i + 1] + da[i + 2]; lb += db[i] + db[i + 1] + db[i + 2]; }
  // flat regions of the frame (sky, near grass, the road, a lit wall), each channel averaged: the colour and the light, without the fine detail
  const box = (d, [x0, y0, x1, y1]) => { const s = [0, 0, 0]; let k = 0; for (let y = y0; y < y1; y++) for (let xx = x0; xx < x1; xx++) { const i = (y * W + xx) * 4; s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; k++; } return s.map(v => Math.round(v / k)); };
  const R = { sky: [500, 20, 800, 80], grass: [800, 450, 1200, 580], road: [300, 360, 500, 420], wall: [270, 180, 340, 280] }, regions = {};
  let worst = 0; for (const k in R) { const o = box(da, R[k]), nn = box(db, R[k]); regions[k] = [o, nn]; for (let q = 0; q < 3; q++) worst = Math.max(worst, Math.abs(o[q] - nn[q])); }
  return { regions, worst, w: W, h: H, mean: +(s / n).toFixed(2), r: +(sr / n).toFixed(2), g: +(sg / n).toFixed(2), b: +(sb / n).toFixed(2), over24: +(big / n).toFixed(3),
    lumOld: +(la / n / 3).toFixed(1), lumNew: +(lb / n / 3).toFixed(1) };
}, [oldR.url, newR.url]);
await g.close();
console.log('  diff', JSON.stringify(diff));
console.log('  render old', oldR.renderMs, 'ms,', oldR.calls, 'calls,', oldR.tris, 'triangles; new', newR.renderMs, 'ms,', newR.calls, 'calls,', newR.tris, 'triangles');
console.log('  snow cover before the shots: old', oldR.cover, 'new', newR.cover, '; after:', JSON.stringify(oldR.coverLeft), JSON.stringify(newR.coverLeft));
console.log('  perf old', JSON.stringify(oldR.perf));
console.log('  perf new', JSON.stringify(newR.perf));
// Session 822 measured 6.0 over the frame, most of it the grass's fine noise and a house or two the town built differently that run;
// (7.1 on a second run); the flat regions came within 1 level of each other
// Session 1054: what the ray through the road box met in each look (see shoot); a miss names the cause, not the colour
console.log('  under the road box: old', JSON.stringify(oldR.road), 'new', JSON.stringify(newR.road));
check('the road box looks onto a road ribbon in both looks', oldR.road.hit === 'road' && newR.road.hit === 'road', { old: oldR.road, new: newR.road });
check('both looks laid their roads with the seeded grain', oldR.seeded > 0 && newR.seeded > 0, { old: oldR.seeded, new: newR.seeded });
check('the two pictures match closely: mean difference under 12 of 255 (the scene itself varies), average brightness within 3', diff.mean < 12 && Math.abs(diff.lumOld - diff.lumNew) < 3, diff);
check('the colour and the light match: sky, grass, road and a lit wall each within 10 levels a channel', diff.worst <= 10, diff.regions);
check('both looks measured their frame', !!(oldR.perf && newR.perf), { old: oldR.perf, new: newR.perf });
check('no page errors in either look', oldR.errs.length === 0 && newR.errs.length === 0, { old: oldR.errs, new: newR.errs });
