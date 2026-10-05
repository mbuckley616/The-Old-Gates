// The snowpine's snow lies on the needles (Session 522, Michael's inspector note: "Snow does not really 'sit' on the tree /
// leaves. it billows out like a skirt"). Every snow vertex (the white ones) lies within a hair of the green tiers' own cone
// surface at its height: no ring stands out past the needles.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  if (!PROTO.oak) buildProtos();
  const G = PROTO.snowpine, p = G.attributes.position, c = G.attributes.color;
  const TIERS = [[3.4, 4.2, 6.6], [2.7, 3.9, 9.0], [1.8, 3.6, 11.2]]; // radius, height, middle of the three green tiers
  const env = y => { let m = 0; for (const [R, H, yc] of TIERS) { const top = yc + H / 2, bot = yc - H / 2; if (y >= bot - .05 && y <= top + .1) m = Math.max(m, R * Math.max(0, top - y) / H); } return m; };
  let snow = 0, worst = 0, out = 0; const flat = [];
  for (let i = 0; i < p.count; i++) { if (c.getX(i) < .8 || c.getY(i) < .8 || c.getZ(i) < .8) continue; snow++;
    const y = p.getY(i), rr = Math.hypot(p.getX(i), p.getZ(i)), over = rr - env(y) * 1.07; if (over > worst) worst = over; if (over > .05) { out++; if (flat.length < 4) flat.push([+y.toFixed(2), +rr.toFixed(2), +env(y).toFixed(2)]); } }
  return { snow, out, worst: +worst.toFixed(2), flat, tris: p.count / 3 };
});
console.log(JSON.stringify(r));
check('the snowpine has snow on it', r.snow > 30, r);
check('every snow vertex lies on the needles\' slope (within 7% of the tier\'s radius at its height): no ring stands out', r.out === 0, r);
check('it costs no more than before (172 triangles)', r.tris <= 172, r);
await inspShots(g, [['plants-trees-rocks/trees-and-scrub/snowpine', 'snowpine-after.png']]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
