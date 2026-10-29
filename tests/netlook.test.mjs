// Session 723: the boarding nets laid on the hull (the ship-in-hand page, item 2, under Michael's B on #192: "a net of rope over
// the rail, about 300 triangles a side"; S638's stand-in was a flat grid of boxes standing off the side). Each hull's net is a
// diamond mesh on its own section amidships, from over the rail to below the waterline, inside the crosshair's box (86's netBox).
// Writes docs/prototypes/shipnets-*.png from the inspector.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const out = {};
  const sizes = { sloop: [13, 4.4], cog: [17, 5.6], galleon: [22, 7], cutter: [14, 4], caravel: [17.5, 5] };
  for (const k of Object.keys(sizes)) for (const look of ['player', 'merchant', 'pirate']) {
    const [L, W] = sizes[k]; const m = WORLD.buildShipMesh(L, W, look, k); const n = m.getObjectByName('nets'); const b = shipBake(k, look);
    const p = n.geometry.attributes.position; const a = b.at(0); const hw = W / 2;
    // the hull's half-breadth at height y on the section at z (the loft's own curve)
    const hullX = (y, z) => { const s = b.at(z); let best = null;
      /* S1531: the kit's hull (the new look's sloop) gives its own moulded section, and the clinker laps stand up to 4.6 cm outside it */
      if (s.sect) { for (let k2 = 0; k2 <= 400; k2++) { const q = s.sect(k2 / 400); if (best == null || Math.abs(q[1] - y) < best.d) best = { d: Math.abs(q[1] - y), x: q[0] + .046 }; } return best.x; } for (let k2 = 0; k2 <= 400; k2++) { const th = Math.PI / 2 * (1 - k2 / 400), sx = Math.pow(Math.sin(th), .45), cy = Math.pow(Math.cos(th), .55), fl = 1 + .05 * Math.max(0, (1 - cy) - .6);
      const yy = s.g - (s.g - s.k) * cy; if (best == null || Math.abs(yy - y) < best.d) best = { d: Math.abs(yy - y), x: s.b * sx * fl }; } return best.x; };
    let minOff = 9, maxOff = -9, inBox = true, minY = 9, maxY = -9, sides = { p: 0, s: 0 };
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); minY = Math.min(minY, y); maxY = Math.max(maxY, y); if (x > 0) sides.s++; else sides.p++;
      /* S1552: the kit's galleon's tumblehome and round bilge bring her side 0.48 m inside her beam at the waterline */
      /* S1544: the kit's caravel's full bilge lies 0.34 m inside her beam just over the waterline; a swimmer's aim meets the box's outer face first */
      if (y > 0 && (Math.abs(z) > 1.35 || Math.abs(x) < hw - (b.kit ? (k === 'galleon' ? .55 : .36) : .25) || Math.abs(x) > hw + .35)) inBox = false;
      if (y < a.g - .2 && y > -.55 && i % 3 === 0) { const off = Math.abs(x) - hullX(y, z); minOff = Math.min(minOff, off); maxOff = Math.max(maxOff, off); } }
    out[k + '|' + look] = { trisSide: n.geometry.userData.perSide, minOff: +minOff.toFixed(3), maxOff: +maxOff.toFixed(3), inBox, minY: +minY.toFixed(2), maxY: +maxY.toFixed(2), rail: +a.g.toFixed(2), even: sides.p === sides.s, shared: m.getObjectByName('nets').geometry === WORLD.buildShipMesh(L, W, look, k).getObjectByName('nets').geometry }; }
  return out; });
console.log(JSON.stringify(r));
const all = Object.entries(r);
check('every hull and look hangs a net each side of about 300 triangles (200–400)', all.every(([, o]) => o.trisSide >= 200 && o.trisSide <= 400 && o.even), all.map(([k, o]) => k + ':' + o.trisSide));
check('the net lies on the planking, 1.5 to 9 cm off it, never inside the hull', all.every(([, o]) => o.minOff >= .015 && o.maxOff <= .09), all.map(([k, o]) => [k, o.minOff, o.maxOff]));
check('from over the rail to below the waterline', all.every(([, o]) => o.maxY >= o.rail + .1 && o.minY <= -.55), all.map(([k, o]) => [k, o.minY, o.maxY, o.rail]));
check('above the waterline, inside the crosshair\'s box (2.6 long, from a quarter inside the beam to .35 outside it)', all.every(([, o]) => o.inBox), all.filter(([, o]) => !o.inBox).map(([k]) => k));
check('one bake of the nets a hull, shared by every ship of it', all.every(([, o]) => o.shared), all.filter(([, o]) => !o.shared).map(([k]) => k));
const keys = await page.evaluate(() => { openInspector(); return INSPECTOR.entries.filter(e => e.group === 'Ships').map(e => e.key || e.id); });
const key = n => keys.find(k => k.includes(n));
const close = 'INSPECTOR.orbit.theta=Math.PI/2+.35;INSPECTOR.orbit.phi=1.38;INSPECTOR.orbit.dist*=.42;';
await inspShots(g, [[key('sloop/player'), 'shipnets-sloop.png', close], [key('cog/merchant'), 'shipnets-cog.png', close], [key('caravel/player'), 'shipnets-caravel.png', close]]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
