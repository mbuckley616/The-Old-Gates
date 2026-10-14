// The two renderers side by side (Session 822, card F1): Dunmore at noon in clear weather, the same spot and the same view, once on
// r128 (the old look, the default) and once on three.js 0.170 (`?look=new`, js/05-compat.js putting back r128's colour and light).
// The pictures go to tests/out/lookpair-old.png and -new.png (Session 822 committed a pair under docs/prototypes/f1/); the suite
// measures the mean colour difference between them, and the frame's cost in each through the game's own PERF meter.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
fs.mkdirSync('tests/out', { recursive: true });

async function shoot(look) {
  const g = await boot({ look }); const { page } = g;
  await g.intoWorld(); await g.settle('dunmore');
  await page.evaluate(() => { forceTime(12); devWeather('clear'); });
  await g.spin('clear', 120);
  const r = await page.evaluate(() => {
    const t = WORLD.siteAnywhere('dunmore'); px = t.x + 6; pz = t.z + 34; yaw = Math.atan2(-(t.x - px), -(t.z - pz)); pitch = -.06; thirdPerson = false;
    forceTime(12);
    const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; let t0 = performance.now();
    try { for (let n = 0; n < 30; n++) { t0 += 1000 / 60; loop(t0); } } finally { window.requestAnimationFrame = raf; prevT = 0; }
    REN.render(scene, CAM); const cv = REN.domElement, o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    // the draw alone: eight renders of the same frame (shadows included), each waited out by reading one pixel back
    const gl = REN.getContext(), px1 = new Uint8Array(4); REN.render(scene, CAM); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1);
    const t1 = performance.now(); for (let k = 0; k < 8; k++) { REN.render(scene, CAM); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1); }
    const renderMs = +((performance.now() - t1) / 8).toFixed(1), calls = REN.info.render.calls, tris = REN.info.render.triangles;
    return { rev: THREE.REVISION, url: o.toDataURL(), at: [Math.round(px), Math.round(pz)], renderMs, calls, tris }; });
  // the frame's cost: the game's own meter over a few seconds of its own loop, standing still at the spot
  // Session 830: the meter reports once two frames 500 ms apart have been drawn; a loaded runner draws one every few seconds, so
  // 9 s could pass with no reading (CI's FLAKY on edda9f4; both looks read null here with two suites side by side). At least
  // 9 s as before, then until it has read, up to 120 s.
  await page.evaluate(() => { perfToggle(); });
  await page.waitForTimeout(9000);
  await page.waitForFunction(() => !!PERF.last, null, { timeout: 120000, polling: 500 }).catch(() => {});
  r.perf = await page.evaluate(() => { const p = PERF.last; perfToggle(); return p; });
  r.errs = g.errs.slice();
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
console.log('  perf old', JSON.stringify(oldR.perf));
console.log('  perf new', JSON.stringify(newR.perf));
// Session 822 measured 6.0 over the frame, most of it the grass's fine noise and a house or two the town built differently that run;
// (7.1 on a second run); the flat regions came within 1 level of each other
check('the two pictures match closely: mean difference under 12 of 255 (the scene itself varies), average brightness within 3', diff.mean < 12 && Math.abs(diff.lumOld - diff.lumNew) < 3, diff);
check('the colour and the light match: sky, grass, road and a lit wall each within 10 levels a channel', diff.worst <= 10, diff.regions);
check('both looks measured their frame', !!(oldR.perf && newR.perf), { old: oldR.perf, new: newR.perf });
check('no page errors in either look', oldR.errs.length === 0 && newR.errs.length === 0, { old: oldR.errs, new: newR.errs });
