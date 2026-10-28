// Session 665 (Michael's A on DECISION #202): the Mark's cutter and Aurenne's caravel on hulls of their own, as the
// Session 643 prototype showed them. The bakes, their sizes and rigs, the caravel's lateens trimmed to leeward, your own
// ship taking her class's hull, the three older hulls untouched; writes docs/prototypes/shiphulls-ingame-*.png and, since
// Session 1538, shipdress-*.png (your sloop in each island's dress).
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const out = {};
  const tris = b => { let t = b.geo.attributes.position.count / 3; for (const q of b.rigs) t += q.geo.attributes.position.count / 3 + (q.extra ? q.extra.attributes.position.count / 3 : 0); return Math.round(t); };
  for (const k of ['sloop', 'cog', 'galleon', 'cutter', 'caravel']) for (const look of ['player', 'pirate', 'merchant']) {
    const b = shipBake(k, look); out[k + '|' + look] = { tris: tris(b), L: b.L, W: b.W, rigs: b.rigs.map(q => q.type).join(','), extra: b.rigs.some(q => q.extra), deck: typeof b.deck, kit: !!b.kit }; }
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
check('the sloop, cog and galleon keep their rigs', r['sloop|player'].rigs === (r['sloop|player'].kit ? 'square' : 'gaff,jib') /* S1531: the kit's Gatelands sloop on the new look, #306's square sail */ && /square/.test(r['cog|player'].rigs) && !/lateen/.test(r['galleon|player'].rigs), [r['sloop|player'].rigs, r['cog|player'].rigs, r['galleon|player'].rigs]);
check('the caravel\'s three yards swing to leeward, and over when the wind crosses', r.latA.length === 3 && r.latA.every(a => a < -.1) && r.latB.every(a => a > .1), [r.latA, r.latB]);
check('the cutter\'s gaff carries its topsail', r.cutterTop === 1, r.cutterTop);
check('your own ship takes her class\'s hull', r.own.cutter === 'cutter' && r.own.caravel === 'caravel' && r.own.sloop === 'sloop' && r.own.cog === 'cog', r.own);
check('other ships still go by length', r.lengthRule.join() === 'sloop,cog,galleon', r.lengthRule);
check('the inspector has six new pieces', ['cutter/player', 'cutter/pirate', 'cutter/merchant', 'caravel/player', 'caravel/pirate', 'caravel/merchant'].every(n => r.keys.some(k => k.includes(n))), r.keys);
const key = n => r.keys.find(k => k.includes(n));
const side = 'INSPECTOR.orbit.theta=Math.PI/2+.12;INSPECTOR.orbit.phi=1.42;INSPECTOR.orbit.dist*=1.05;';
await inspShots(g, [[key('cutter/player'), 'shiphulls-ingame-cutter.png'], [key('caravel/player'), 'shiphulls-ingame-caravel.png'],
  [key('cutter/player'), 'shiphulls-ingame-cutter-side.png', side], [key('caravel/player'), 'shiphulls-ingame-caravel-side.png', side]]);
// Session 1538 (Michael's A on #839): on the new look your sloop wears the dress of the island whose yard sold or last refitted her,
// kept on the ship: the Gatelands' square sail, the Mark's gaff and headsails with the beast's head and shields, Aurenne's lateen.
const d = await page.evaluate(() => { const out = {}, was = worldState.ship;
  for (const dr of ['gatelands', 'mark', 'aurenne', null]) { worldState.ship = dr ? { dress: dr } : {}; const m = WORLD.buildShipMesh(13, 4.4), b = shipBake('sloop', 'player');
    const R = m.userData.rigs; shipTrim(m, Math.PI / 2); const a = R.map(q => [q.type, +q.m.rotation.y.toFixed(2), q.m.scale.x]); shipTrim(m, -Math.PI / 2); const c = R.map(q => [q.type, +q.m.rotation.y.toFixed(2), q.m.scale.x]);
    out[dr || 'none'] = { kit: !!b.kit, dress: b.kit && b.kit.dress, key: m.userData.bakeKey, tris: b.kit && b.kit.tris, draws: b.kit && b.kit.draws, rigs: b.rigs.map(q => q.type).join(), a, c, head: b.kit && b.kit.head, shields: b.kit ? b.kit.shields.length : 0, stow: ((shipStowSlots(m.userData.bakeKey) || {}).slots || []).length }; }
  // a refit at one of the Mark's yards: a cog taken down to a sloop comes out in the Mark's dress
  const mk = allPorts().find(p => nationAt(p.x, p.z) === 'mark'); const g0 = gold; gold = 99999; worldState.ship = { cls: 'cog', dress: 'gatelands', hull: 140, rig: 100 };
  const o = yardOffers(mk).find(q => q.cls === 'sloop' && /Refit/.test(q.label)); if (o) o.fn(); out.refit = { port: mk && mk.name, cls: worldState.ship.cls, dress: worldState.ship.dress, key: WORLD.buildShipMesh(13, 4.4).userData.bakeKey };
  gold = g0; worldState.ship = was; return out; });
console.log(JSON.stringify(d));
if (d.gatelands.kit) {
  check('the three dresses bake as three sloops, each under 30,000 triangles and 16 draws', ['gatelands', 'mark', 'aurenne'].every(k => d[k].dress === k && d[k].key === 'sloop|player|' + k && d[k].tris < 30000 && d[k].draws <= 16), ['gatelands', 'mark', 'aurenne'].map(k => [k, d[k].dress, d[k].tris, d[k].draws]));
  check('a ship from before the dress is the Gatelands\'', d.none.dress === 'gatelands', d.none);
  check('each island its rig: the square sail, the gaff with its headsails, the lateen', d.gatelands.rigs === 'square' && d.mark.rigs === 'gaff,head' && d.aurenne.rigs === 'lateen', [d.gatelands.rigs, d.mark.rigs, d.aurenne.rigs]);
  check('the Mark\'s carries the beast\'s head and a row of shields; the others neither', d.mark.head && d.mark.shields >= 8 && !d.aurenne.head && !d.gatelands.shields, [d.mark.head, d.mark.shields]);
  check('the boom and the lateen swing to leeward and over when the wind crosses; the headsails only belly over', d.mark.a[0][1] < -.2 && d.mark.c[0][1] > .2 && d.mark.a[1][1] === 0 && d.mark.a[1][2] === -d.mark.c[1][2] && d.aurenne.a[0][1] < -.1 && d.aurenne.c[0][1] > .1, [d.mark.a, d.mark.c, d.aurenne.a, d.aurenne.c]);
  check('every dress keeps the hold\'s stowage on deck', ['gatelands', 'mark', 'aurenne'].every(k => d[k].stow === d.gatelands.stow && d[k].stow > 0), ['gatelands', 'mark', 'aurenne'].map(k => d[k].stow));
  check('refitted at a Mark yard, she wears the Mark\'s dress', d.refit.cls === 'sloop' && d.refit.dress === 'mark' && d.refit.key === 'sloop|player|mark', d.refit);
  const quarter = 'INSPECTOR.orbit.theta=Math.PI/2+.6;INSPECTOR.orbit.phi=1.3;INSPECTOR.orbit.dist*=.8;';
  for (const k of ['gatelands', 'mark', 'aurenne']) { await page.evaluate(([dr, sk]) => { worldState.ship = Object.assign(worldState.ship || {}, { dress: dr }); INSPECTOR.select('ships/cog/player'); const e = INSPECTOR.entries.find(x => x.key === sk); INSPECTOR.built.delete(e.id); }, [k, key('sloop/player')]); /* the inspector keeps what it built: build the sloop again in this dress */ await inspShots(g, [[key('sloop/player'), `shipdress-${k}.png`, quarter]]); }
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
