// The spiral stair's railing follows the stair (Session 572; Michael's control-room note of 5 Oct: "the railings being totally
// jumbled"). Each rail segment ran from its tread's angle to the next angle counted without the helix's start (a0), so unless the
// stair began at angle 0 every rail was a chord across the shaft.
// Session 598 (Michael's A on DECISION #173, the stone newel stair, "the rail … is not attached to the stairs at any point"): the
// rail is a rope along the helix at .95 from the newel, carried on an iron stanchion from every other tread. The rope's points lie
// on its circle, and every stanchion stands on its tread and reaches the rope.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const rows = [];
for (const seed of [4021, 4022, 4023, 4024, 4025, 4026]) {
  await page.evaluate((seed) => { window._oldStair = typeof dScene !== 'undefined' && dScene.children.find(o => o.userData && o.userData.dunShell === 'stair'); const p = Object.assign({}, PORTALS[0], { theme: 'deep', seed, size: 'large', interior: 'cave', zone: 'world', tutorial: false }); goToDungeon(p); }, seed);
  for (let k = 0; k < 20 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && !dScene.children.includes(window._oldStair))); k++) await page.waitForTimeout(300);
  const r = await page.evaluate((seed) => { const f = FOOTHOLDS.find(f => f.kind === 'spiral'); if (!f) return { seed, none: true };
    const st = dScene.children.find(o => o.userData && o.userData.dunShell === 'stair'); if (!st) return { seed, noStair: true };
    const R = st.userData.rail, rd = R.pts.map(p => Math.hypot(p[0], p[2]));
    // each stanchion's top against the rope's height at its angle: the helix is y = t·FLOOR2_Y + h, t from the angle walked
    let worst = 0; for (const [x, y, z] of R.stanchions) { const ang = Math.atan2(z, x); let best = 1e9;
      for (let i = 0; i < R.pts.length; i++) { const p = R.pts[i]; const d = Math.hypot(p[0] - x, p[2] - z); if (d < .06) best = Math.min(best, Math.abs(p[1] - y)); }
      worst = Math.max(worst, best); }
    return { seed, a0: +f.a0.toFixed(2), n: R.stanchions.length, min: +Math.min(...rd).toFixed(3), max: +Math.max(...rd).toFixed(3), gap: +worst.toFixed(3), ends: R.stanchions.filter(s => s[3]).length }; }, seed);
  console.log(JSON.stringify(r)); rows.push(r);
}
const S = rows.filter(r => !r.none);
check('six seeds give at least two dungeons with a spiral stair, and one starting away from angle 0', S.length >= 2 && S.some(r => Math.abs(r.a0) > .3), rows);
check('every stair is the stone stair, with sixteen stanchions, two of them end posts', S.every(r => !r.noStair && r.n === 16 && r.ends === 2), S.map(r => [r.n, r.ends]));
check('every point of the rope lies on its circle (0.94–0.96 from the newel), none across the shaft', S.every(r => r.min >= .94 && r.max <= .96), S.map(r => [r.min, r.max]));
check('every stanchion reaches the rope (its top within 0.13 of the rope above it)', S.every(r => r.gap <= .13), S.map(r => r.gap));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
