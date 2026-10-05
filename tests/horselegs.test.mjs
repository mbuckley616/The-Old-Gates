// The horse's legs (Session 523, Michael's inspector note: "Horse legs are far too small/lean. They should be considerably
// thicker. Same with the mouth/jaw"). In the bind pose, a slice through each leg at the cannon (.14–.2 above the hoof's
// sole) is at least .06 across (it was .042), the horse stands as tall as before, and it stays under 8,000 triangles.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  const out = {};
  for (const kind of ['Horse', 'Grey Horse']) {
    const rig = buildWolf(kind, 1); WOLF_RIGS.delete(rig); let mesh = null; rig.root.traverse(o => { if (o.isSkinnedMesh && !mesh) mesh = o; });
    const p = mesh.geometry.attributes.position; let y0 = 1e9, y1 = -1e9; for (let i = 0; i < p.count; i++) { y0 = Math.min(y0, p.getY(i)); y1 = Math.max(y1, p.getY(i)); }
    const q = {}; for (let i = 0; i < p.count; i++) { const y = p.getY(i) - y0; if (y < .14 || y > .2) continue; const k = (p.getX(i) > 0 ? 'L' : 'R') + (p.getZ(i) > 0 ? 'f' : 'h'); const b = q[k] || (q[k] = [1e9, -1e9, 1e9, -1e9]);
      b[0] = Math.min(b[0], p.getX(i)); b[1] = Math.max(b[1], p.getX(i)); b[2] = Math.min(b[2], p.getZ(i)); b[3] = Math.max(b[3], p.getZ(i)); }
    const w = {}; for (const k in q) w[k] = +Math.min(q[k][1] - q[k][0], q[k][3] - q[k][2]).toFixed(3);
    out[kind] = { legs: w, h: +(y1 - y0).toFixed(2), tris: (mesh.geometry.index ? mesh.geometry.index.count : p.count) / 3 };
  }
  return out;
});
console.log(JSON.stringify(r));
for (const k of ['Horse', 'Grey Horse']) {
  const L = Object.values(r[k].legs);
  check(`${k}: four legs, each at least .06 across at the cannon (was .042)`, L.length === 4 && L.every(w => w >= .06), r[k]);
  check(`${k}: stands as tall as before (1.2) and under 8,000 triangles`, Math.abs(r[k].h - 1.2) < .03 && r[k].tris < 8000, r[k]);
}
await inspShots(g, [['creatures/on-the-wolf-kit/horse', 'horse-after.png', 'INSPECTOR.orbit.theta=1.5708;INSPECTOR.orbit.phi=1.45;']]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
