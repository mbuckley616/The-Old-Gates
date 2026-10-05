// The dead tree (Session 519, Michael's inspector note: "branches do not look connected to the trunk mesh - one is
// floating unconnected"). Every limb's wide end sits inside the trunk at its height or on a limb laid before it,
// no limb starts above the trunk's top, and the prototype the world scatters is the one the inspector shows.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  if (!PROTO.oak) buildProtos();
  const g = PROTO.dead, L = g.userData.limbs || [];
  // the trunk: a cylinder from 0 to 7.4, radius .58 at the foot to .2 at the top
  const trunkR = y => y < 0 || y > 7.4 ? -1 : .58 + (.2 - .58) * y / 7.4;
  const segD = (p, a, b) => { const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
    const t = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / (ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2)));
    return Math.hypot(ap[0] - ab[0] * t, ap[1] - ab[1] * t, ap[2] - ab[2] * t); };
  const rows = L.map((l, i) => { const inTrunk = Math.hypot(l.base[0], l.base[2]) < trunkR(l.base[1]);
    const onLimb = L.slice(0, i).some(p => segD(l.base, p.base, p.tip) < p.r); return { base: l.base.map(v => +v.toFixed(2)), inTrunk, onLimb }; });
  const pos = g.attributes.position; let top = 0; for (let i = 0; i < pos.count; i++) top = Math.max(top, pos.getY(i));
  return { n: L.length, rows, tris: pos.count / 3, top: +top.toFixed(2) };
});
console.log(JSON.stringify(r));
check('the dead tree logs its limbs (five or more)', r.n >= 5, r);
check('every limb grows from the trunk or from a limb before it: none floats', r.rows.every(x => x.inTrunk || x.onLimb), r.rows);
check('it stays a cheap scatter prototype (under 200 triangles) and stands about as tall as before (8–11 units)', r.tris < 200 && r.top > 8 && r.top < 11, r);
await inspShots(g, [['plants-trees-rocks/trees-and-scrub/dead', 'deadtree-after.png']]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
