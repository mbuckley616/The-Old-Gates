// Shading in the creatures' creases (Session 270, H.1, Michael's A on Session 243: the people, then the creatures): the
// wolf family's and the spider family's bakes darken where their parts crowd, as the people's do (personAO), once a bake.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const out = {};
  const cmp = (bake) => { PAO.on = false; const a = bake(); PAO.on = true; const b = bake(); const ca = a.geo.attributes.color.array, cb = b.geo.attributes.color.array; let sum = 0, mx = 0, n = 0, clear = 0;
    for (let i = 0; i < ca.length; i += 3) { const la = ca[i] + ca[i + 1] + ca[i + 2], lb = cb[i] + cb[i + 1] + cb[i + 2]; if (la <= 0) continue; const d = 1 - lb / la; sum += d; mx = Math.max(mx, d); n++; if (d < .02) clear++; }
    const res = { same: ca.length === cb.length, mean: +(sum / n).toFixed(3), max: +mx.toFixed(3), clear: +(clear / n).toFixed(3) }; a.geo.dispose(); b.geo.dispose(); return res; };
  for (const k of ['Wolf', 'Cave Bear', 'Horse']) out[k] = cmp(() => wolfBake(WOLF_KINDS[k], 1));
  out.Spider = cmp(() => spiderBake(SPIDER_KINDS[Object.keys(SPIDER_KINDS)[0]], 1));
  return out; });
console.log(JSON.stringify(r));
check('each creature bakes the same vertices with its creases shaded, open surfaces clear, none past the cap of .5', Object.values(r).every(v => v.same && v.mean > .03 && v.mean < .45 && v.clear > .05 && v.max <= .5001), r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
