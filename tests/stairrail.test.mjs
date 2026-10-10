// The spiral stair's railing follows the stair (Session 572; Michael's control-room note of 5 Oct: "the railings being totally
// jumbled"). Each rail segment ran from its tread's angle to the next angle counted without the helix's start (a0), so unless the
// stair began at angle 0 every rail was a chord across the shaft.
// Session 598 (Michael's A on DECISION #173, the stone newel stair, "the rail … is not attached to the stairs at any point"): the
// rail is a rope along the helix at .95 from the newel, carried on an iron stanchion from every other tread. The rope's points lie
// on its circle, and every stanchion stands on its tread and reaches the rope.
// Session 657 (the rough edge Session 598 left): the helix's walk rail stopped the player at .97 from the newel and the stanchions
// stand at .95, so on a tread's outer lip you walked through one. The rail now stops at the foothold's own `rwalk` (.86), inboard
// of every post, and the player is driven outward up the helix to prove it.
// Session 661 (what Session 657 left): the two end posts, at the landing and on the last tread, stand within .25 of a floor, where
// that rail lets go of you. The stair publishes them on its foothold and the loop keeps the body .25 from each at its own height;
// the player is stood on each post from eight sides, and at the post's angle on the inner tread, which must stay walkable.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const rows = [];
for (const seed of [4021, 4022, 4023, 4024, 4025, 4026]) {
  await page.evaluate((seed) => { window._oldStair = typeof dScene !== 'undefined' && dScene.children.find(o => o.userData && o.userData.dunShell === 'stair'); const p = Object.assign({}, PORTALS[0], { id: 'dyn_' + seed, theme: 'deep', seed, size: 'large', interior: 'cave', zone: 'world', tutorial: false }); goToDungeon(p); }, seed);
  for (let k = 0; k < 20 && !(await page.evaluate(() => activeZoneId === 'dungeon' && scene === dScene && !dScene.children.includes(window._oldStair))); k++) await page.waitForTimeout(300);
  // S683 — the dungeon's foes are taken out first: since Session 634 they see you at 8 underground and chase at your walk, and
  // since Session 623 a live foe's body pushes you, so on the systems branch a foe that reached you moved the body during the two
  // frames these checks wait (`inner` read .07–.65 on four seeds of six, a different four each run). The stair alone is measured.
  const r = await page.evaluate(async (seed) => { ENEMIES.forEach(e => { if (e.mesh) e.mesh.visible = false; }); ENEMIES = []; const f = FOOTHOLDS.find(f => f.kind === 'spiral'); if (!f) return { seed, none: true };
    const st = dScene.children.find(o => o.userData && o.userData.dunShell === 'stair'); if (!st) return { seed, noStair: true };
    const R = st.userData.rail, rd = R.pts.map(p => Math.hypot(p[0], p[2]));
    // each stanchion's top against the rope's height at its angle: the helix is y = t·FLOOR2_Y + h, t from the angle walked
    let worst = 0; for (const [x, y, z] of R.stanchions) { const ang = Math.atan2(z, x); let best = 1e9;
      for (let i = 0; i < R.pts.length; i++) { const p = R.pts[i]; const d = Math.hypot(p[0] - x, p[2] - z); if (d < .06) best = Math.min(best, Math.abs(p[1] - y)); }
      worst = Math.max(worst, best); }
    // the walk-through case itself: stand on the outer lip at each stanchion's own angle and height, let the loop's rail pull the
    // player back, and measure how far the body ends from that post. n counts the posts the rail reaches (the two ends sit outside
    // the band where it holds, at the landing and on the last tread).
    let walkMax = 0, clear = 9, stood = 9, n = 0;
    for (const [x, sy, z] of R.stanchions) { const y = sy - R.h - .03, ang = Math.atan2(z, x);
      jumpY = y; onGround = true; px = f.cx + Math.cos(ang) * 1.5; pz = f.cz + Math.sin(ang) * 1.5;
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      const bx = px - f.cx, bz = pz - f.cz, bd = Math.hypot(bx, bz);
      if (Math.abs(jumpY - y) > .3 || bd > 1.4) continue;
      n++; walkMax = Math.max(walkMax, bd); stood = Math.min(stood, bd);
      clear = Math.min(clear, Math.hypot(bx - x, bz - z)); }
    // the end posts: stand on each at its floor's height from eight sides (and dead on it), two frames, measure the clearance
    let endClear = 9, endN = 0, inner = 0;
    for (const q of (f.posts || [])) for (let k = 0; k <= 8; k++) { const a = k * Math.PI / 4, off = k === 8 ? 0 : .08;
      jumpY = q[1]; onGround = true; velY = 0; px = q[0] + Math.cos(a) * off; pz = q[2] + Math.sin(a) * off;
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      endN++; endClear = Math.min(endClear, Math.hypot(px - q[0], pz - q[2])); }
    // the way past it stays open: at the post's own angle, .6 from the newel (on the tread, inside the rail), nothing moves you
    for (const q of (f.posts || [])) { const ang = Math.atan2(q[2] - f.cz, q[0] - f.cx), sx = f.cx + Math.cos(ang) * .6, sz = f.cz + Math.sin(ang) * .6;
      jumpY = q[1]; onGround = true; velY = 0; px = sx; pz = sz;
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      inner = Math.max(inner, Math.hypot(px - sx, pz - sz)); }
    return { seed, a0: +f.a0.toFixed(2), n: R.stanchions.length, posts: (f.posts || []).length, endN, endClear: +endClear.toFixed(3), inner: +inner.toFixed(3), min: +Math.min(...rd).toFixed(3), max: +Math.max(...rd).toFixed(3), gap: +worst.toFixed(3), ends: R.stanchions.filter(s => s[3]).length,
      rwalk: f.rwalk, held: n, walkMax: +walkMax.toFixed(3), stood: +stood.toFixed(3), clear: +clear.toFixed(3) }; }, seed);
  console.log(JSON.stringify(r)); rows.push(r);
}
const S = rows.filter(r => !r.none);
check('six seeds give at least two dungeons with a spiral stair, and one starting away from angle 0', S.length >= 2 && S.some(r => Math.abs(r.a0) > .3), rows);
check('every stair is the stone stair, with sixteen stanchions, two of them end posts', S.every(r => !r.noStair && r.n === 16 && r.ends === 2), S.map(r => [r.n, r.ends]));
check('every point of the rope lies on its circle (0.94–0.96 from the newel), none across the shaft', S.every(r => r.min >= .94 && r.max <= .96), S.map(r => [r.min, r.max]));
check('every stanchion reaches the rope (its top within 0.13 of the rope above it)', S.every(r => r.gap <= .13), S.map(r => r.gap));
check('the walk rail stops the player inboard of the stanchion line (at the foothold’s rwalk, .86 from the newel)', S.every(r => r.rwalk === .86 && r.walkMax <= .861), S.map(r => [r.rwalk, r.walkMax]));
check('a tread is still wide enough to stand on (the rail holds you between .32 and .86, not against the newel)', S.every(r => r.stood >= .32), S.map(r => r.stood));
check('the rail holds the player at the dozen posts along the run', S.every(r => r.held >= 12), S.map(r => r.held));
check('standing at a post\u2019s own angle, the body clears it in plan by 0.05 or more (it stood 0.02 inside one before)', S.every(r => r.clear >= .05), S.map(r => r.clear));
check('the stair publishes its two end posts, one at each floor', S.every(r => r.posts === 2), S.map(r => r.posts));
check('stood on an end post from any side at its floor\u2019s height, the body ends .24 or more from it (it stood on it before)', S.every(r => r.endN === 18 && r.endClear >= .24), S.map(r => [r.endN, r.endClear]));
check('at an end post\u2019s angle, on the tread .6 from the newel, nothing pushes you (the way past it is open)', S.every(r => r.inner <= .02), S.map(r => r.inner));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
