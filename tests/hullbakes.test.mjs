// Session 665 (Michael's A on DECISION #202): the Mark's cutter and Aurenne's caravel on hulls of their own, as the
// Session 643 prototype showed them. The bakes, their sizes and rigs, the caravel's lateens trimmed to leeward, your own
// ship taking her class's hull, the three older hulls untouched; writes docs/prototypes/shiphulls-ingame-*.png.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const out = {};
  const tris = b => { let t = b.geo.attributes.position.count / 3; for (const q of b.rigs) t += q.geo.attributes.position.count / 3 + (q.extra ? q.extra.attributes.position.count / 3 : 0); return Math.round(t); };
  for (const k of ['sloop', 'cog', 'galleon', 'cutter', 'caravel']) for (const look of ['player', 'pirate', 'merchant']) {
    const b = shipBake(k, look); out[k + '|' + look] = { tris: tris(b), L: b.L, W: b.W, rigs: b.rigs.map(q => q.type).join(','), extra: b.rigs.some(q => q.extra), deck: typeof b.deck }; }
  // the caravel's lateens to leeward: wind on the starboard beam, then the port
  const m = WORLD.buildShipMesh(17.5, 5, 'player', 'caravel'); const lat = m.userData.rigs.filter(q => q.type === 'lateen');
  shipTrim(m, Math.PI / 2); out.latA = lat.map(q => +q.m.rotation.y.toFixed(2)); shipTrim(m, -Math.PI / 2); out.latB = lat.map(q => +q.m.rotation.y.toFixed(2));
  const c = WORLD.buildShipMesh(14, 4, 'player', 'cutter'); out.cutterTop = c.userData.rigs.filter(q => q.m.children.length).length;
  // your own ship: no look, her class from the save
  const was = worldState.ship; const own = {};
  for (const cls of ['sloop', 'cutter', 'caravel', 'cog']) { worldState.ship = { cls }; const L = { sloop: 13, cutter: 14, caravel: 17.5, cog: 17 }[cls];
    own[cls] = WORLD.buildShipMesh(L, 4, undefined).userData.kind; }
  worldState.ship = was; out.own = own;
  out.lengthRule = [WORLD.buildShipMesh(13, 4.4).userData.kind, WORLD.buildShipMesh(17, 5.6, 'merchant').userData.kind, WORLD.buildShipMesh(22, 7, 'pirate').userData.kind];
  openInspector(); out.keys = INSPECTOR.entries.filter(e => e.group === 'Ships').map(e => e.key || e.id); return out; });
console.log(JSON.stringify(r));
for (const look of ['player', 'pirate', 'merchant']) {
  check(`the cutter (${look}) bakes 14 × 4.0 with a gaff, a topsail on it and two headsails`, r['cutter|' + look].L === 14 && r['cutter|' + look].W === 4 && /gaff/.test(r['cutter|' + look].rigs) && (r['cutter|' + look].rigs.match(/jib/g) || []).length === 2 && r['cutter|' + look].extra, r['cutter|' + look]);
  check(`the caravel (${look}) bakes 17.5 × 5.0 with three lateens`, r['caravel|' + look].L === 17.5 && r['caravel|' + look].W === 5 && (r['caravel|' + look].rigs.match(/lateen/g) || []).length === 3, r['caravel|' + look]);
}
check('the two new hulls stay in the old ones\' range of triangles (under 7,000)', r['cutter|player'].tris < 7000 && r['caravel|player'].tris < 7000, [r['cutter|player'].tris, r['caravel|player'].tris]);
check('the sloop, cog and galleon keep their rigs', r['sloop|player'].rigs === 'gaff,jib' && /square/.test(r['cog|player'].rigs) && !/lateen/.test(r['galleon|player'].rigs), [r['sloop|player'].rigs, r['cog|player'].rigs, r['galleon|player'].rigs]);
check('the caravel\'s three yards swing to leeward, and over when the wind crosses', r.latA.length === 3 && r.latA.every(a => a < -.1) && r.latB.every(a => a > .1), [r.latA, r.latB]);
check('the cutter\'s gaff carries its topsail', r.cutterTop === 1, r.cutterTop);
check('your own ship takes her class\'s hull', r.own.cutter === 'cutter' && r.own.caravel === 'caravel' && r.own.sloop === 'sloop' && r.own.cog === 'cog', r.own);
check('other ships still go by length', r.lengthRule.join() === 'sloop,cog,galleon', r.lengthRule);
check('the inspector has six new pieces', ['cutter/player', 'cutter/pirate', 'cutter/merchant', 'caravel/player', 'caravel/pirate', 'caravel/merchant'].every(n => r.keys.some(k => k.includes(n))), r.keys);
const key = n => r.keys.find(k => k.includes(n));
const side = 'INSPECTOR.orbit.theta=Math.PI/2+.12;INSPECTOR.orbit.phi=1.42;INSPECTOR.orbit.dist*=1.05;';
await inspShots(g, [[key('cutter/player'), 'shiphulls-ingame-cutter.png'], [key('caravel/player'), 'shiphulls-ingame-caravel.png'],
  [key('cutter/player'), 'shiphulls-ingame-cutter-side.png', side], [key('caravel/player'), 'shiphulls-ingame-caravel-side.png', side]]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
