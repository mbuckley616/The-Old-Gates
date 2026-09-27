// The run (Session 162): past PW.RUN.on heights a second the stride blends from the walk into a run, for the
// townsfolk and the player alike: feet still planted while down, a flight between steps, the trunk leaning in.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
fs.mkdirSync('tests/out', { recursive: true });

// Drive one townsperson along its facing at a given pace for n frames, measuring the feet in world space.
// The stiller foot is the one carrying the body; "flight" counts frames where both are off the ground.
const drive = (pace, n) => page.evaluate(([pace, n]) => {
  const rig = window._gr || (window._gr = [...PEOPLE_RIGS].find(r => r.root.parent === WORLD.scene && r.root.visible && !r.g.gear)); const root = rig.root;
  const fyaw = root.rotation.y, s = root.scale.x, step = pace / 60; const vL = new THREE.Vector3(), vR = new THREE.Vector3(), hp = new THREE.Vector3(), hd = new THREE.Vector3();
  let prev = null, still = 0, swing = 0, flight = 0, lean = 0, t0 = 1e5 + (window._gt || 0); window._gt = (window._gt || 0) + n * 17;
  tickPeople(1 / 60, t0); root.updateMatrixWorld(true); const ph0 = rig.phase, cyc0 = pwCycle(rig.w);
  let ground = null, prevPh = 0; const pairs = [];
  for (let i = 1; i <= n; i++) {
    root.position.x += Math.sin(fyaw) * step; root.position.z += Math.cos(fyaw) * step; tickPeople(1 / 60, t0 + i * 16.7); root.updateMatrixWorld(true);
    rig.B.anL.getWorldPosition(vL); rig.B.anR.getWorldPosition(vR); const cur = [vL.clone(), vR.clone()];
    if (i > n - 60) {
      if (ground == null) ground = []; ground.push(Math.min(vL.y, vR.y));
      if (prev) { const dL = cur[0].distanceTo(prev[0]), dR = cur[1].distanceTo(prev[1]); swing = Math.max(swing, Math.max(dL, dR)); pairs.push([rig.phase, prevPh, cur, prev]); }
      rig.B.hips.getWorldPosition(hp); rig.B.head.getWorldPosition(hd); lean += ((hd.x - hp.x) * Math.sin(fyaw) + (hd.z - hp.z) * Math.cos(fyaw)) / 60;
    }
    prev = cur; prevPh = rig.phase;
  }
  // flight: the lower ankle more than 1cm above where a planted one sits
  const gmin = Math.min(...ground), fl = Math.round(100 * ground.filter(y => y > gmin + .01).length / ground.length);
  // the standing foot: over each frame where a foot is in its stance at both ends (by the stride's own phase), it must not move
  const D = rig.run ? PW.RUN.DUTY : PW.DUTY, down = (ph, f) => ((ph + f * .5) % 1) < D;
  for (const [ph, pp, c, p] of pairs) for (let f = 0; f < 2; f++) if (down(ph, f) && down(pp, f) && ((ph + f * .5) % 1) > ((pp + f * .5) % 1)) still = Math.max(still, c[f].distanceTo(p[f]));
  return { pace, perHeight: +(pace / s).toFixed(2), run: rig.run, w: { walk: +rig.w.walk.toFixed(2), run: +rig.w.run.toFixed(2) }, stillMm: +(still * 1000).toFixed(2), swingMm: +(swing * 1000).toFixed(1),
    flightPct: fl, leanMm: +(lean * 1000).toFixed(0), cyc: +pwCycle(rig.w).toFixed(3), stepsPerSec: +(2 * pace / (pwCycle(rig.w) * s)).toFixed(2), scale: +s.toFixed(3) };
}, [pace, n]);

const stroll = await drive(.7, 120), guard = await drive(.95, 120);
check('a stroll and a guard\'s pace stay a walk, feet planted', !stroll.run && !guard.run && stroll.w.walk > .9 && guard.w.walk > .9 && stroll.flightPct === 0 && guard.flightPct === 0 && stroll.stillMm < 2 && guard.stillMm < 2, { stroll, guard });
const run = await drive(2.4, 150);
check('at a run\'s pace the gait runs: the standing foot still holds, the other flies, a flight between steps', run.run && run.w.run > .95 && run.stillMm < 2 && run.swingMm > 30 && run.flightPct >= 20, run);
const leanWalk = guard.leanMm, leanRun = run.leanMm;
check('running, the trunk leans further into the stride than walking', leanRun > leanWalk + 15, { leanWalk, leanRun });
// the pace falls back under PW.RUN.off: a walk again (and nothing in between the two thresholds flips it)
const mid = await drive(1.25 * run.scale, 90), back = await drive(.9, 120);
check('between the thresholds a runner keeps running; slowing to a walk\'s pace walks again', mid.run && !back.run && back.w.walk > .9, { mid: mid.run, back: { run: back.run, w: back.w } });

// the stance is reachable through the whole run: IK never clamps, so the planted foot really is on the ground
const reach = await page.evaluate(() => { const R = PW.RUN; let worst = 0;
  for (let k = 0; k < 400; k++) { const ph = k / 400; const p = pwRun(ph, {}); if (ph % 1 < R.DUTY) { const z = R.STRIDE - 2 * R.STRIDE * (ph / R.DUTY), y = p.hipsY - PW.HIPJ - PW.FOOT; worst = Math.max(worst, Math.hypot(z, y) / (PW.L1 + PW.L2)); } }
  return { worstReach: +worst.toFixed(3) }; });
check('the standing leg is never stretched past its length', reach.worstReach < 1, reach);

// the player at their own walking speed (3.83 a second) now runs, feet planted, at a human cadence
const pl = await page.evaluate(() => { thirdPerson = true; const st = m => ({ moving: m, sprinting: false, camY: 1.6, now: performance.now() });
  EQ.weapon = null; EQ.offhand = null; tpUpdate(1 / 60, st(false)); const R = TP.rig; const vL = new THREE.Vector3(), vR = new THREE.Vector3(); let prev = null, still = 0, pph = 0; const rows = []; const step = 3.83 / 60;
  for (let i = 1; i <= 120; i++) { px += Math.sin(yaw) * -step; pz += Math.cos(yaw) * -step; tpUpdate(1 / 60, st(true)); R.root.updateMatrixWorld(true);
    R.ankleL.getWorldPosition(vL); R.ankleR.getWorldPosition(vR); const cur = [vL.clone(), vR.clone()];
    if (prev && i > 60) rows.push([cur, prev, TP.gph, pph]); prev = cur; pph = TP.gph; }
  const gmin = Math.min(...rows.map(([c]) => Math.min(c[0].y, c[1].y)));
  const D = PW.RUN.DUTY, down = (ph, f) => ((ph + f * .5) % 1) < D;
  for (const [c, p, ph, pp] of rows) for (let f = 0; f < 2; f++) if (down(ph, f) && down(pp, f) && ((ph + f * .5) % 1) > ((pp + f * .5) % 1)) still = Math.max(still, c[f].distanceTo(p[f]));
  const lean = sp => { for (let i = 0; i < 30; i++) { px += Math.sin(yaw) * -step; pz += Math.cos(yaw) * -step; tpUpdate(1 / 60, { moving: true, sprinting: sp, camY: 1.6, now: performance.now() }); }
    R.root.updateMatrixWorld(true); const h = new THREE.Vector3(), p = new THREE.Vector3(); R.head.getWorldPosition(h); R.hips.getWorldPosition(p); return +(((h.x - p.x) * -Math.sin(yaw) + (h.z - p.z) * -Math.cos(yaw)) * 1000).toFixed(0); };
  const elbow = +R.elL.rotation.x.toFixed(2);
  const leanRun = lean(false), leanSprint = lean(true); _sneaking = true; const leanSneak = lean(false); _sneaking = false;
  const s = R.root.scale.x; return { leanRun, leanSprint, leanSneak, run: !!TP.run, rw: +TP.rw.toFixed(2), stillMm: +(still * 1000).toFixed(2), stepsPerSec: +(2 * 3.83 / (PW.RUN.cycle * s)).toFixed(2), walkStepsWas: +(2 * 3.83 / (PW.cycle * s)).toFixed(2),
    elbow }; });
check('the player at walking speed runs, feet planted, arms bent, leaning into it (sprint and sneak lean forward too)', pl.run && pl.rw > .95 && pl.leanRun > 30 && pl.leanSprint > pl.leanRun && pl.leanSneak > 30 && pl.stillMm < 3 && pl.elbow < -1 && pl.stepsPerSec < 6, pl);

// the photograph: one townsperson side on, eight frames through a run's stride, on a plain sky
const strip = await page.evaluate(async () => { forceTime(12); const src = [...PEOPLE_RIGS].find(r => r.root.parent === WORLD.scene && !r.g.dress && !r.g.gear) || window._gr; const rig = buildPerson(src.g); PEOPLE_RIGS.delete(rig);
  const t = WORLD.siteAnywhere('dunmore'); const cx = t.x, cz = t.z + t.pad + 30, y = WORLD.worldH(cx, cz);
  const cv = REN.domElement, out = document.createElement('canvas'); const W = 160, H = 220; out.width = W * 8; out.height = H * 2; const x2 = out.getContext('2d');
  scene.add(rig.root); rig.root.rotation.y = Math.PI / 2;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .1, 200);
  const shoot = (poseFn, row) => { for (let k = 0; k < 8; k++) { const P = poseFn(k / 8);
      rig.root.position.set(cx, y + 50, cz); pwApply(rig, P); rig.root.updateMatrixWorld(true);
      cam.position.set(cx, y + 50 + .55, cz + 3.2); cam.lookAt(cx, y + 50 + .55, cz); REN.render(scene, cam);
      const sw = cv.height * .8, sx = cv.width / 2 - sw * .36, sy = cv.height / 2 - sw * .5; x2.drawImage(cv, sx, sy, sw * .72, sw, k * W, row * H, W, H); } };
  shoot(ph => pwWalk(ph, {}), 0); shoot(ph => pwRun(ph, {}), 1);
  scene.remove(rig.root); try { rig.geoHi.dispose(); if (rig.geoLo) rig.geoLo.dispose(); } catch (e) {}
  return out.toDataURL(); });
fs.writeFileSync('tests/out/gait-strip.png', Buffer.from(strip.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
