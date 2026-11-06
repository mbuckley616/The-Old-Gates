// aqueduct (Session 1800, card F8; Michael's A on #333, "broken, as drawn", and his A on #1072, "fit the arcade to the land"): one Aurenne
// cell in three keeps a ruined aqueduct across one of its rivers' valleys (aqueductAt, 82), places.js's aurenneAqueduct laid to the drawn
// ground (PKIT.places.aqueduct): one tier where the valley is under 12 m deep, two where deeper, the break over the deepest bays. The suite
// builds the kit on the prototype's own valley and on a shallow one, counts the aqueducts, goes to the nearest, and walks under its arches.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
// the kit alone: the drawn valley (20 m deep, 108 m across) keeps both tiers; a valley of 9 m is one low tier with a few arches open
const kit = await page.evaluate(() => { const P = PKIT.places.aqueduct({ key: 'test' }), S = PKIT.places.aqueduct({ key: 'test', x0: -45, x1: 45, ground: x => -9 * (1 - (x / 45) ** 2) });
  const f = A => ({ two: A.two, depth: A.depth, tris: A.tris, draws: A.draws, upper: A.bays.filter(b => b.upper).length, lower: A.bays.filter(b => b.lower).length, gap: A.gap, spring: A.arch.upSpring });
  return { drawn: f(P), shallow: f(S) }; });
console.log(JSON.stringify(kit));
check(`the drawn valley (${kit.drawn.depth} m) keeps two tiers, ${kit.drawn.lower} arches below and ${kit.drawn.upper} above, broken over the middle`, kit.drawn.two && kit.drawn.lower >= 3 && kit.drawn.upper >= 8 && !!kit.drawn.gap, kit.drawn);
check(`a valley of 9 m is one tier of ${kit.shallow.upper} open arches springing ${-kit.shallow.spring} m under the walk (the rings under the tile band), broken over the deepest two`, !kit.shallow.two && kit.shallow.lower === 0 && kit.shallow.upper >= 4 && kit.shallow.upper <= 7 && !!kit.shallow.gap && Math.abs(kit.shallow.gap.stump) < 4.2, kit.shallow);
const k = await page.evaluate(() => { const A = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home && nationKeyOf(c.i, c.j) === 'aurenne'); const Q = A.map(c => aqueductAt(c)).filter(Boolean);
  Q.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  const G = [...CELLS.values()].filter(c => c.type !== 'sea' && !c.home && nationKeyOf(c.i, c.j) !== 'aurenne').map(c => aqueductAt(c)).filter(Boolean).length;
  return { cells: A.length, n: Q.length, other: G, two: Q.filter(q => q.depth >= 12).length, spans: Q.map(q => q.x1 - q.x0), depths: Q.map(q => q.depth), near: Q[0] }; });
console.log(JSON.stringify(k));
check(`${k.n} of ${k.cells} Aurenne cells keep an aqueduct (${k.two} of them two tiers), none elsewhere; each 36 to 130 m long and 7 m or more deep`, k.n > 0 && k.n < k.cells && k.other === 0 && k.spans.every(s => s >= 36 && s <= 130) && k.depths.every(d => d >= 7), k);
await page.evaluate(C => { px = C.x + 30; pz = C.z + 30; }, k.near);
for (let n = 0; n < 8; n++) { await g.cells(); const ok = await page.evaluate(id => { const c = [...CELLS.values()].find(c => c._aq && c._aq.id === id); return !!(c && c._aq.group && c._aq.group.parent); }, k.near.id); if (ok) break; await page.waitForTimeout(1000); }
const w = await page.evaluate(id => { const C = [...CELLS.values()].find(c => c._aq && c._aq.id === id)._aq; if (!C.group || !C.group.parent) return { none: true };
  const co = Math.cos(C.ry), s = Math.sin(C.ry), W = (u, v) => [C.x + u * co + v * s, C.z - u * s + v * co];
  /* under each arch that reaches the ground: open to walk through, square across the arcade, with headroom under the spring */
  const fallen = b => !C.two && C.gap && b.x0 >= C.gap.x0 - .01 && b.x1 <= C.gap.x1 + .01, reach = b => C.two ? b.lower || (b.upper && meshH(...W((b.x0 + b.x1) / 2, 0)) - C.y > C.arch.tier) : b.upper;
  const under = C.bays.filter(reach).map(b => { const u = (b.x0 + b.x1) / 2, sp = b.lower ? C.arch.lowSpring : C.arch.upSpring;
    let blocked = 0; for (let v = -4; v <= 4; v += .25) if (solidAt(...W(u, v))) blocked++; return { u, blocked, fallen: !!fallen(b), head: fallen(b) ? 99 : +(C.y + sp - meshH(...W(u, 0))).toFixed(2) }; });
  const piers = C.piers.filter(x => x > C.x0 + 4 && x < C.x1 - 4 && !(C.gap && !C.two && Math.abs(x - C.gap.stump) > 1 && x > C.gap.x0 && x < C.gap.x1)).map(x => solidAt(...W(x, 0)));
  const ends = [C.x0 - 2, C.x1 + 2].map(u => solidAt(...W(u, 0)));
  return { id, two: C.two, depth: C.depth, tris: C.tris, draws: C.draws, sol: C.sol, gap: C.gap, under, piers, ends, names: C.group.children.map(m => m.name), rot: +C.group.rotation.y.toFixed(4), y: C.y }; }, k.near.id);
console.log(JSON.stringify(w));
check(`${w.id} (${w.depth} m deep, ${w.tris} triangles in ${w.draws} draws) is built ${w.two ? 'in two tiers' : 'in one tier'} as its valley asks, broken`, !w.none && w.two === (w.depth >= 12) && !!w.gap && w.draws <= 7 && w.tris < 60000 && w.names.includes('zellige'), w);
check(`under each of its ${w.under && w.under.length} open arches (${w.under && w.under.filter(u => u.fallen).length} of them fallen) the way through is clear, with ${w.under && Math.min(...w.under.map(u => u.head))} m or more under the spring`, !w.none && w.under.length >= 3 && w.under.every(u => u.blocked === 0 && u.head >= .5), w.under);
check('its piers and its ends in the hill are solid', !w.none && w.piers.length > 0 && w.piers.every(Boolean) && w.ends.every(Boolean), { piers: w.piers, ends: w.ends });
// S1927 — the channel walked: from the hill at its west end along the bed to the pier before the breach, held at the bed's height and
// between its walls; at the bed the walls block, the arcade under it does not; nothing under an arch is lifted onto it, and the foes'
// test (no height) still meets the arcade
const ch = await page.evaluate(id => { const C = [...CELLS.values()].find(c => c._aq && c._aq.id === id)._aq, co = Math.cos(C.ry), s = Math.sin(C.ry), W = (u, v) => ({ x: C.x + u * co + v * s, z: C.z - u * s + v * co });
  const P = C.walks && C.walks[0]; if (!P) return { none: true };
  const f = W(C.x0 - 3, 0), T = W(C.gap.x0 - 1, 0), raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {};
  for (const k in K) K[k] = false; px = f.x; pz = f.z; jumpY = activeTerrainH(px, pz); velY = 0; onGround = true; stamina = maxStamina; ROLL = null; pitch = 0;
  let t = performance.now(), n = 0, lo = 1e9, hi = -1e9, off = 0; prevT = t; const start = +(jumpY - C.y).toFixed(2);
  try { for (; n < 3000; n++) { const d = Math.hypot(T.x - px, T.z - pz); if (d < .15) break; yaw = Math.atan2(-(T.x - px), -(T.z - pz)); K['KeyW'] = true; t += 1000 / 60; loop(t);
      const [u, v] = P.local(px, pz); if (u > C.x0 + 1) { lo = Math.min(lo, jumpY - C.y); hi = Math.max(hi, jumpY - C.y); off = Math.max(off, Math.abs(v)); } } }
  finally { for (const k in K) K[k] = false; window.requestAnimationFrame = raf; REN.render = rr; prevT = 0; }
  const res = { id, runs: C.walks.length, ticks: n, start, left: +Math.hypot(T.x - px, T.z - pz).toFixed(2), lo: +lo.toFixed(3), hi: +hi.toFixed(3), off: +off.toFixed(2), over: +(C.y - meshH(px, pz)).toFixed(2) };
  const m = W((C.x0 + C.gap.x0) / 2, 0), side = W((C.x0 + C.gap.x0) / 2, .45), out = W((C.x0 + C.gap.x0) / 2, 1.4);
  res.bed = { mid: currentZoneSolid(m.x, m.z, C.y), wall: currentZoneSolid(side.x, side.z, C.y), outside: currentZoneSolid(out.x, out.z, C.y), foe: currentZoneSolid(m.x, m.z) };
  const a = C.bays.filter(b => b.upper && !(C.gap && b.x0 >= C.gap.x0 - .01 && b.x1 <= C.gap.x1 + .01))[0]; if (a) { const q = W((a.x0 + a.x1) / 2, 0), g = ZONES.world.getY(q.x, q.z);
    res.arch = { lifted: +(activeTerrainH(q.x, q.z) - g).toFixed(2) }; px = q.x; pz = q.z; jumpY = g; res.arch.self = +(activeTerrainH(px, pz) - g).toFixed(2); res.arch.free = !currentZoneSolid(q.x, q.z, g); }
  return res; }, k.near.id);
console.log(JSON.stringify(ch));
check(`its channel walked from the hill to the breach in ${ch.ticks} ticks, held ${ch.lo} to ${ch.hi} m on its bed ${ch.over} m over the ground and within ${ch.off} m of its line`,
  !ch.none && ch.left < .2 && ch.lo > -.05 && ch.hi < .45 && ch.off < .35 && ch.over > 3, ch);
check('on the bed the walls block and the arcade does not; a foe still meets the arcade; under an arch nothing is lifted onto the channel',
  !ch.none && !ch.bed.mid && ch.bed.wall && ch.bed.outside && ch.bed.foe && !!ch.arch && ch.arch.lifted === 0 && ch.arch.self === 0 && ch.arch.free, ch);
// S1932 — its far copy: one draw of the tiers' outlines, the channel, the string course and the tile band, shown from 70 m past half its
// reach (houseLod's rule), the arcade as drawn nearer
const fc = await page.evaluate(id => { const C = [...CELLS.values()].find(c => c._aq && c._aq.id === id)._aq, L = C.lod; if (!L || !C.far) return { none: true };
  const co = Math.cos(C.ry), s = Math.sin(C.ry), at = d => { const cam = new THREE.PerspectiveCamera(); cam.position.set(C.x + s * d, C.y, C.z + co * d); cam.updateMatrixWorld(); L.updateMatrixWorld(); L.update(cam); return { near: C.group.visible, far: C.far.visible }; };
  const r = { farAt: C.farAt, farTris: C.farTris, tris: C.tris, mats: Array.isArray(C.far.material) ? C.far.material.length : 1, inScene: L.parent === sc, close: at(C.farAt - 10), away: at(C.farAt + 10) }; L.update(CAM); return r; }, k.near.id);
console.log(JSON.stringify(fc));
check(`its far copy (${fc.farTris} triangles in one draw, against ${fc.tris}) stands in from ${fc.farAt} m, the arcade as drawn nearer`,
  !fc.none && fc.inScene && fc.mats === 1 && fc.farTris > 0 && fc.farTris < fc.tris / 4 && fc.close.near && !fc.close.far && fc.away.far && !fc.away.near, fc);
check('no errors on the new look', g.errs.length === 0, g.errs);
await g.close();
