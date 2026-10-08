// PROTOTYPE (look builder, 8 Oct 2026): the Mark's cutter and Aurenne's caravel on hulls of their own (Michael's B on #192 drew
// them on the sloop's and the cog's). Writes docs/prototypes/shiphulls-*.png; checks the bakes build, their triangles, and errors.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const out = {};
  for (const k of ['sloop', 'cog', 'galleon', 'cutter', 'caravel']) { const b = shipBake(k, 'player'); let t = b.geo.attributes.position.count / 3; for (const q of b.rigs) t += q.geo.attributes.position.count / 3 + (q.extra ? q.extra.attributes.position.count / 3 : 0);
    out[k] = { tris: Math.round(t), L: b.L, W: b.W, rigs: b.rigs.map(q => q.type).join(',') }; }
  openInspector(); out.keys = INSPECTOR.entries.filter(e => e.group === 'Ships').map(e => e.key || e.id); return out; });
console.log(JSON.stringify(r));
check('the cutter and the caravel bake on hulls of their own', r.cutter.L === 14 && r.caravel.L === 17.5 && /lateen/.test(r.caravel.rigs), r);
const key = n => r.keys.find(k => k.includes(n));
await inspShots(g, [[key('cutter/player'), 'shiphulls-cutter.png'], [key('caravel/player'), 'shiphulls-caravel.png'], [key('sloop/player'), 'shiphulls-sloop-today.png'], [key('cog/player'), 'shiphulls-cog-today.png'],
  [key('cutter/pirate'), 'shiphulls-cutter-pirate.png'], [key('caravel/merchant'), 'shiphulls-caravel-merchant.png']]);
const pin = k => `INSPECTOR.pin(INSPECTOR.entries.find(e=>e.key==='${k}').id);`;
const side = 'INSPECTOR.orbit.theta=Math.PI/2+.12;INSPECTOR.orbit.phi=1.42;INSPECTOR.orbit.dist*=1.05;';
await inspShots(g, [[key('sloop/player'), 'shiphulls-sloop-side.png', side],
  [key('cog/player'), 'shiphulls-cog-side.png', side],
  [key('cutter/player'), 'shiphulls-cutter-side.png', side], [key('caravel/player'), 'shiphulls-caravel-side.png', side],
  [key('caravel/player'), 'shiphulls-caravel-stern.png', 'INSPECTOR.orbit.theta=Math.PI*.82;INSPECTOR.orbit.phi=1.3;INSPECTOR.orbit.dist*=.7;']]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
