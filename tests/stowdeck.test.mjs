// Session 724: the hold seen on deck (the ship-in-hand page, item 4, under Michael's B on #192): one box, sack, bale or cask per
// crate in its good's shape, in her waist under a lashing net, one mesh; the pile follows worldState.ship.hold (the pirates'
// take lifts off, a sunk ship's hold is gone), is solid by rows, and leaves the rail's walk where the nets set you down free.
// Writes docs/prototypes/stowdeck-*.png from the inspector.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const out = {};
  const sizes = { sloop: [13, 4.4], cog: [17, 5.6], galleon: [22, 7], cutter: [14, 4], caravel: [17.5, 5] }, boom = { sloop: 1.6, cutter: 1.35 };
  const goods = Object.keys(WORLD.CARGO_GOODS).filter(k => !WORLD.CARGO_GOODS[k].hold);
  for (const k of Object.keys(sizes)) { const [L, W] = sizes[k]; const m = WORLD.buildShipMesh(L, W, 'player', k); const cap = { sloop: 40, cog: 60, galleon: 90, cutter: 25, caravel: 55 }[k] + 50;
    const hold = {}; for (let i = 0; i < cap; i++) { const gk = goods[i % goods.length]; hold[gk] = (hold[gk] || 0) + 1; }
    const shown = shipStowOn(m, hold); const st = m.getObjectByName('stow'); const p = st.geometry.attributes.position; const stow = shipStowSlots(m.userData.bakeKey);
    let maxX = 0, maxY = 0, hitsProp = false; const base = shipBake(k, 'player').props;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); maxX = Math.max(maxX, Math.abs(x)); maxY = Math.max(maxY, y);
      if (y < 2.2 && base.some(q => q.r != null ? Math.hypot(x - q.x, z - q.z) < q.r - .02 : Math.abs(x - q.x) < q.hx - .02 && Math.abs(z - q.z) < q.hz - .02)) hitsProp = true; }
    // one crate's triangles, the lashing aside: a pile of one good each form
    const per = {}; for (const gk of ['iron', 'grain', 'wool', 'fish', 'timber']) { const mm = WORLD.buildShipMesh(L, W, 'player', k); shipStowOn(mm, { [gk]: 1 }); const gg = mm.getObjectByName('stow').geometry; per[gk] = gg.attributes.position.count / 3; }
    out[k] = { cap, slots: stow.slots.length, layers: stow.layers, shown, tris: p.count / 3, rail: W / 2 - .8, maxX: +maxX.toFixed(2), top: +(maxY - 1).toFixed(2), boom: boom[k] || 9, hitsProp, per, props: m.userData.props.length - base.length }; }
  out.small = (() => { const m = WORLD.buildShipMesh(17, 5.6, 'player', 'cog'); shipStowOn(m, { iron: 4, wool: 2 }); const a = m.getObjectByName('stow').geometry; const b = a.attributes.position; let z0 = 9, z1 = -9; for (let i = 0; i < b.count; i++) { z0 = Math.min(z0, b.getZ(i)); z1 = Math.max(z1, b.getZ(i)); } return { shown: a.userData.shown, span: +(z1 - z0).toFixed(2) }; })();
  return out; });
console.log(JSON.stringify(r));
const H = ['sloop', 'cog', 'galleon', 'cutter', 'caravel'];
check('every hull stows its base hold on deck in full, three high (two on the cutter)', H.every(k => r[k].slots * r[k].layers >= r[k].cap - 50 && r[k].layers === (k === 'cutter' ? 2 : 3)), H.map(k => [k, r[k].slots, r[k].layers, r[k].cap - 50]));
check('a full hold at the third tier shows what the waist holds, the rest below', H.every(k => r[k].shown === Math.min(r[k].cap, r[k].slots * r[k].layers)), H.map(k => [k, r[k].shown, r[k].cap]));
check('a crate is about 12 triangles: a box 12, a cask 16, with the lashing', H.every(k => Object.entries(r[k].per).every(([gk, t]) => t <= (gk === 'fish' ? 16 : 12) + 40)), H.map(k => [k, r[k].per]));
check('a galleon\'s 140 come to about 1,800 triangles', r.galleon.tris > 1300 && r.galleon.tris < 2600, r.galleon.tris);
check('the pile leaves the rail\'s walk free where the nets set you down', H.every(k => r[k].maxX <= r[k].rail - .3), H.map(k => [k, r[k].maxX, r[k].rail]));
check('under the boom, and clear of every mast, barrel and crate on her deck', H.every(k => r[k].top < r[k].boom - .05 && !r[k].hitsProp), H.map(k => [k, r[k].top, r[k].boom, r[k].hitsProp]));
check('six crates are one pile by the mast, not a layer down her length', r.small.shown === 6 && r.small.span < 1.8, r.small);
check('the pile is solid by rows', H.every(k => r[k].props > 0), H.map(k => r[k].props));

// your own ship at sea: the pile follows the hold
const stop = g.keepAlive();
const live = await page.evaluate(() => { const s = WORLD.allPorts().sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  let sx = null, sz = null; for (let rr = 300; rr < 3000 && sx === null; rr += 30) for (let a = 0; a < 6.28; a += .3) { const x = s.x + Math.cos(a) * rr, z = s.z + Math.sin(a) * rr;
    if ([[0, 0], [40, 0], [-40, 0], [0, 40], [0, -40]].every(([dx, dz]) => WORLD.worldH(x + dx, z + dz) < -5)) { sx = x; sz = z; break; } }
  for (const o of [...WORLD.others]) WORLD.despawnOtherShip(o);
  worldState.ship = { cls: 'sloop', name: 'Test Gull', sails: 0, cargo: 0, hold: { grain: 10, iron: 5, fish: 3 } }; WORLD.spawnShip(sx, sz, 0.7); px = sx + 30; pz = sz; return { ok: sx !== null }; });
check('open sea, and your sloop on it', live.ok, live);
await g.spin('clear', 10);
const shown = () => page.evaluate(() => { const s = WORLD.ship.mesh.getObjectByName('stow'); return s ? s.geometry.userData.shown : 0; });
const a = await shown();
const took = await page.evaluate(() => pirateTake().length); await g.spin('clear', 10); const b = await shown();
const solid = await page.evaluate(() => { const m = WORLD.ship.mesh; m.updateMatrixWorld(true); const B = m.userData.stowBoxes[0]; const w = new THREE.Vector3(B.x, 0, B.z).applyMatrix4(m.matrixWorld);
  const rail = netRail(m, WORLD.ship.W, 1), rail2 = netRail(m, WORLD.ship.W, -1); return { pile: shipPropSolid(w.x, w.z), rail: shipPropSolid(rail.x, rail.z), rail2: shipPropSolid(rail2.x, rail2.z) }; });
await page.evaluate(() => { worldState.ship.hold = {}; }); await g.spin('clear', 10); const c = await shown();
check('eighteen in the hold, eighteen on deck', a === 18, a);
check(`the pirates' take (${took}) lifts its half off the deck`, took === 9 && b === 9, { took, b });
check('the pile is solid, the rail above each net is not', solid.pile && !solid.rail && !solid.rail2, solid);
check('an empty hold, an empty deck', c === 0, c);
stop();
const keys = await page.evaluate(() => { openInspector(); return INSPECTOR.entries.filter(e => e.group === 'Ships').map(e => e.key || e.id); });
const key = n => keys.find(k => k.includes(n));
const load = h => `INSPECTOR.stage.traverse(o=>{if(o.userData&&o.userData.bakeKey)shipStowOn(o,${JSON.stringify(h)});});INSPECTOR.orbit.theta=Math.PI/2+.45;INSPECTOR.orbit.phi=.85;INSPECTOR.orbit.dist*=.36;`;
await inspShots(g, [[key('sloop/player'), 'stowdeck-sloop.png', load({ grain: 14, iron: 10, wool: 8, fish: 8 })], [key('galleon/player'), 'stowdeck-galleon.png', load({ timber: 30, iron: 30, salt: 30, beef: 25, dyes: 25 })]]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
