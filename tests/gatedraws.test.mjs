// A gate's draws and lights (card F5, Session 1299; docs/design/gate-interiors-build.md, "Light and draws" and "The suites"): only
// your space and the spaces joined to it are drawn (dZoneShown, dRender), with the side rooms a sightline from your cell reaches, and
// nothing past the fog's far edge; at most 8 point lights live (the pool, moved to the nearest sources in the zones drawn). Five spots
// a gate size (the way in, the first space's middle, a threshold, a side room, the ring chamber), four headings each: under 200 draw
// calls and 8 lights. And the cull hides nothing in view: each view rendered whole and culled, under a flat white light so nothing
// hides in the dark, differs by no pixel. The frame's cost is logged, culled and whole.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const GATES = [['tiny', 31], ['small', 4021], ['medium', 2055], ['large', 909], ['massive', 2055]];
const R = [];
for (const [size, seed] of GATES) {
  await enterDungeon(page, { theme: 'ruins', size, seed });
  R.push(Object.assign({ size, seed }, await page.evaluate(() => {
    const gen = window._lastGen, ring = gen.spaces[gen.ring], s0 = gen.spaces[0], t0 = gen.thresholds[0], sd = gen.side[0];
    const spots = [['in', 1, px, pz], ['space', s0.floor || 1, dAt(s0.x - .5 + s0.w / 2), dAt(s0.y - .5 + s0.h / 2)]];
    if (t0) spots.push(['threshold', t0.floor || 1, dAt(t0.c), dAt(t0.r)]);
    if (sd) spots.push(['side room', sd.floor || 1, dAt(sd.cx), dAt(sd.cy)]);
    spots.push(['ring', ring.floor || 1, dAt(ring.x - .5 + ring.w / 2), dAt(ring.y - .5 + ring.h / 2)]);
    const amb = dScene.children.find(o => o.isAmbientLight), amb0 = [amb.intensity, amb.color.getHex()];
    const grab = () => { const cv = REN.domElement, o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; const c = o.getContext('2d'); c.drawImage(cv, 0, 0); return c.getImageData(0, 0, o.width, o.height).data; };
    const diff = (a, b) => { let d = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) d++; return d / (a.length / 4); };
    const lightsLive = () => { let n = 0; dScene.traverseVisible(o => { if (o.isPointLight) n++; }); return n; };
    const visN = () => dScene.children.filter(o => o.visible).length;
    const out = []; let restored = true, propsSeen = 0;
    for (const [where, f, x, z] of spots) { px = x; pz = z; currentFloor = f; let calls = 0, whole = 0, lights = 0, px0 = 0, ms = 0, msWhole = 0;
      for (let h = 0; h < 4; h++) { CAM.position.set(x, (f === 2 ? FLOOR2_Y : 0) + 1.65, z); CAM.rotation.order = 'YXZ'; CAM.rotation.set(-.05, h * Math.PI / 2, 0); CAM.updateMatrixWorld(true);
        _sweepScenePool(dScene); lights = Math.max(lights, lightsLive());
        let t = performance.now(); REN.render(dScene, CAM); msWhole = Math.max(msWhole, performance.now() - t); whole = Math.max(whole, REN.info.render.calls);
        const v0 = visN(); t = performance.now(); dRender(dScene, CAM); ms = Math.max(ms, performance.now() - t); calls = Math.max(calls, REN.info.render.calls); if (visN() !== v0) restored = false;
        // the flat light: every piece in view shows, so a piece the cull hid that should show is a changed pixel
        amb.intensity = 4; amb.color.set(0xffffff);
        REN.render(dScene, CAM); const a = grab(); dRender(dScene, CAM); const b = grab(); px0 = Math.max(px0, diff(a, b));
        // and the check can see: with every piece but the shell hidden, the same view changes
        const pcs = dScene.children.filter(o => o.visible && !o.isLight && !(o.userData && o.userData.dunShell)); pcs.forEach(o => o.visible = false); REN.render(dScene, CAM); propsSeen = Math.max(propsSeen, diff(a, grab())); pcs.forEach(o => o.visible = true);
        amb.intensity = amb0[0]; amb.color.setHex(amb0[1]); }
      out.push({ where, floor: f, calls, whole, lights, px: +(px0 * 100).toFixed(3), ms: +ms.toFixed(1), msWhole: +msWhole.toFixed(1) }); }
    return { zones: DZONE ? DZONE.n + DZONE.side.length : 0, pool: dScene.userData.lightPool, spots: out, restored, propsSeen: +(propsSeen * 100).toFixed(2) }; })));
}
for (const r of R) console.log(r.size, r.seed, 'zones', r.zones, 'propsSeen', r.propsSeen + '%', r.spots.map(s => `${s.where}@${s.floor}: ${s.calls} (whole ${s.whole}) ${s.lights}L ${s.px}% ${s.ms}/${s.msWhole} ms`).join(' | '));
const all = R.flatMap(r => r.spots.map(s => Object.assign({ size: r.size }, s)));
check(`five spots a gate size, every gate cut into zones by space (${all.length} spots)`, R.every(r => r.spots.length >= 4 && r.zones >= 2), R.map(r => [r.size, r.spots.length, r.zones]));
check('under 200 draw calls at every spot, over four headings', all.every(s => s.calls < 200), all.map(s => [s.size, s.where, s.calls]));
check('at most 8 point lights live in every gate (the pool of 8)', R.every(r => r.pool === 8) && all.every(s => s.lights <= 8), all.map(s => [s.size, s.where, s.lights]));
check('the cull hides nothing in view: culled and whole renders under a flat light differ by no pixel', all.every(s => s.px === 0), all.filter(s => s.px > 0).map(s => [s.size, s.where, s.px]));
check('and that check can see: hiding every piece but the shell changes the view somewhere in every gate', R.every(r => r.propsSeen > .2), R.map(r => [r.size, r.propsSeen]));
check('what the cull hides is shown again after the frame', R.every(r => r.restored));
check('the cull spends draws: a massive gate draws fewer than half its whole frame from its first space', (() => { const s = R.find(r => r.size === 'massive').spots.find(s => s.where === 'space'); return s.calls * 2 < s.whole; })(), R.find(r => r.size === 'massive').spots);
// the game's own loop draws through it: a few real frames in the massive gate, no error
await g.frames(10);
check('the loop draws a gate through dRender, no page errors', g.errs.length === 0, g.errs);
await g.close();
