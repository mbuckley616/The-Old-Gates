// warehouse (Session 1948, card F6; Michael's A on #295, "the warehouse stays as drawn"): on the new look every Aurennais port keeps one
// warehouse on its own made ground beside the quay head (81's aurWarehouseLot, stamped when the cell loads), pieces.js's warehouse as drawn
// (PKIT.au.civic, kind 'warehouse') on a quay wall, its doors and crates to the sea. The suite builds the kit alone, runs the lot rule on
// every Aurennais port, then stands at Darouda's and reads its solid, its apron, its ground and its far copy.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
await page.evaluate(() => REN.setSize(320, 180, false));
const kit = await page.evaluate(() => [18, 24].map(w => { const B = PKIT.au.civic({ kind: 'warehouse', w, d: 11 }, PKIT.stream('test')); const bb = new THREE.Box3().setFromObject(B.group);
  return { w, tris: B.tris, draws: B.draws, front: B.front, top: +B.roofTop.toFixed(2), span: +(bb.max.x - bb.min.x).toFixed(2) }; }));
console.log(JSON.stringify(kit));
check(`the kit's warehouse at 18 and 24 m (${kit.map(k => `${k.tris} triangles in ${k.draws} draws`).join(', ')}), its ridge ${kit[0].top} m up`,
  kit.every(k => k.tris < 8000 && k.draws <= 11 && k.top > 9 && k.top < 11 && Math.abs(k.span - k.w - 1) < 1.2 && k.front > 6), kit);
// the rule on every Aurennais port (the quay's start walked as the cell does; the rule reads no ground)
const dry = await page.evaluate(() => { const out = []; for (const c of CELLS.values()) for (const t0 of (c.sites || [])) { if (t0.kind !== 'port' || nationKeyOf(c.i, c.j) !== 'aurenne') continue;
  const sd = shoreDir(t0), t = Object.assign({}, t0); if (!t.quayStart) t.quayStart = { x: t.x + sd.dx * t.pad, z: t.z + sd.dz * t.pad };
  const L = aurWarehouseLot(t, sd), q = t.quayStart, F = { x: sd.dz, z: -sd.dx }; if (!L) { out.push({ id: t.id, none: true }); continue; }
  const lat = Math.abs((L.x - q.x) * F.x + (L.z - q.z) * F.z) - L.W / 2, town = Math.hypot(L.x - t.x, L.z - t.z) - Math.hypot(L.W, L.D) / 2;
  out.push({ id: t.id, W: L.W, D: L.D, lat: +lat.toFixed(2), town: +town.toFixed(1) }); } return out; });
check(`every one of the ${dry.length} Aurennais ports has a warehouse lot, 18 to 24 m by 10 to 11.5, its near end 21 m off the quay's line`,
  dry.length > 30 && dry.every(d => !d.none && d.W >= 18 && d.W <= 24 && d.D >= 10 && d.D <= 11.5 && Math.abs(d.lat - 21) < .01), dry.filter(d => d.none || Math.abs(d.lat - 21) > .01));
check('Darouda stands on the new look', await g.settle('c7_1_s4'));
const w = await page.evaluate(() => { const S = WORLD.settle.get('c7_1_s4'), W = S.warehouse, L = S.site.warehouseLot; if (!W || W.skipped) return { none: true, W };
  const c = Math.cos(W.ry), s = Math.sin(W.ry), at = (u, v) => [W.x + u * c + v * s, W.z - u * s + v * c];
  const inside = [[0, 0], [-W.W / 2 + .5, -W.D / 2 + .5], [W.W / 2 - .5, W.D / 2 - .5], [W.W / 2 - .5, -W.D / 2 + .5]].map(p => solidAt(...at(...p)));
  const apron = [-W.W / 3, 0, W.W / 3].map(u => solidAt(...at(u, W.D / 2 + 1.2)));
  const ground = [[-W.W / 2, -W.D / 2], [W.W / 2, -W.D / 2], [-W.W / 2, W.D / 2 + L.A], [W.W / 2, W.D / 2 + L.A], [0, 0]].map(p => +worldH(...at(...p)).toFixed(2));
  const others = S.sol.filter(q => q.bt !== 'warehouse' && q.bt !== 'tithe' && q.rx && Math.hypot(q.cx - W.x, q.cz - W.z) < Math.hypot(W.W, W.D) / 2 + Math.hypot(q.rx, q.rz)).length;
  const K = S.whLod; return { W: W.W, D: W.D, tris: W.tris, draws: W.draws, inside, apron, ground, others, far: K && Math.round(K.tris), inScene: !!(K && K.hi.parent && K.lo.parent) }; });
console.log(JSON.stringify(w));
check(`Darouda's warehouse (${w.W} by ${w.D} m, ${w.tris} triangles in ${w.draws} draws) is built, solid inside its walls`, !w.none && w.inScene && w.inside.every(Boolean), w);
check('its apron before the doors is open to walk on', !w.none && w.apron.every(v => !v), w);
check(`it stands on its own made ground at the pad's 1.05 (${(w.ground || []).join(', ')}), corners and apron`, !w.none && w.ground.every(h => Math.abs(h - 1.05) < .1), w);
check('no other building of the town stands near enough to touch it', !w.none && w.others === 0, w);
// the far copy: from 200 m out over the water the warehouse is its box and roof, back at the door the warehouse itself
const lod = await page.evaluate(() => { const S = WORLD.settle.get('c7_1_s4'), W = S.warehouse, K = S.whLod, P = CAM.position.clone(), fx = Math.sin(W.ry), fz = Math.cos(W.ry);
  CAM.position.set(W.x + fx * 200, 8, W.z + fz * 200); houseLod(); const far = [K.hi.visible, K.lo.visible];
  CAM.position.set(W.x + fx * 10, 3, W.z + fz * 10); houseLod(); const near = [K.hi.visible, K.lo.visible]; CAM.position.copy(P); return { far, near, tris: Math.round(K.tris) }; });
check(`its far copy (${lod.tris} triangles, one draw) from 200 m out, the warehouse itself from 10 m`, lod.far[0] === false && lod.far[1] === true && lod.near[0] === true && lod.near[1] === false && lod.tris < 100, lod);
// Session 1956 (card F6; #295 A, stepped merlons): the Compact's tithe house past the warehouse along the shore (81's aurTitheLot), as
// pieces.js's quay draws it, its banner the Compact's blue and white (canon §1.4)
const tk = await page.evaluate(() => [20, 24].map(w => { const B = PKIT.au.civic({ kind: 'tithe', w, d: 12.5 }, PKIT.stream('test')); const names = B.group.children.map(m => m.name);
  return { w, tris: B.tris, draws: B.draws, top: +B.roofTop.toFixed(2), blue: names.includes('compact') && names.includes('cloth'), madder: names.includes('awning') }; }));
console.log(JSON.stringify(tk));
check(`the kit's tithe house at 20 and 24 m (${tk.map(k => `${k.tris} triangles in ${k.draws} draws`).join(', ')}), its banner blue and white`,
  tk.every(k => k.tris < 16000 && k.draws <= 12 && k.top > 18 && k.top < 22 && k.blue && !k.madder), tk);
const tdry = await page.evaluate(() => { const out = []; for (const c of CELLS.values()) for (const t0 of (c.sites || [])) { if (t0.kind !== 'port' || nationKeyOf(c.i, c.j) !== 'aurenne') continue;
  const sd = shoreDir(t0), t = Object.assign({}, t0); if (!t.quayStart) t.quayStart = { x: t.x + sd.dx * t.pad, z: t.z + sd.dz * t.pad };
  const W = aurWarehouseLot(t, sd), T = aurTitheLot(t, sd, W); if (!T) { out.push({ id: t.id, none: true }); continue; }
  const gap = Math.abs((T.x - W.x) * Math.cos(W.ry) - (T.z - W.z) * Math.sin(W.ry)) - (T.W + W.W) / 2, fr = ((T.x - W.x) * Math.sin(W.ry) + (T.z - W.z) * Math.cos(W.ry)) - (W.D - T.D) / 2;
  out.push({ id: t.id, W: T.W, D: T.D, gap: +gap.toFixed(2), front: +fr.toFixed(2) }); } return out; });
check(`every one of the ${tdry.length} Aurennais ports has a tithe house lot, 20 to 24 m by 12 to 13, 2.5 m past its warehouse, their fronts on one line`,
  tdry.length > 30 && tdry.every(d => !d.none && d.W >= 20 && d.W <= 24 && d.D >= 12 && d.D <= 13 && Math.abs(d.gap - 2.5) < .02 && Math.abs(d.front) < .02), tdry.filter(d => d.none || Math.abs(d.gap - 2.5) > .02 || Math.abs(d.front) > .02));
const t = await page.evaluate(() => { const S = WORLD.settle.get('c7_1_s4'), T = S.tithe; if (!T || T.skipped) return { none: true, T };
  const c = Math.cos(T.ry), s = Math.sin(T.ry), at = (u, v) => [T.x + u * c + v * s, T.z - u * s + v * c];
  const inside = [[0, 0], [-T.W / 2 + .5, -T.D / 2 + .5], [T.W / 2 - .5, T.D / 2 - .5], [T.W / 2 - .5, -T.D / 2 + .5]].map(p => solidAt(...at(...p)));
  const apron = [-T.W / 3, 0, T.W / 3].map(u => solidAt(...at(u, T.D / 2 + 1.2)));
  const ground = [[-T.W / 2, -T.D / 2], [T.W / 2, -T.D / 2], [-T.W / 2, T.D / 2 + 2.1], [T.W / 2, T.D / 2 + 2.1], [0, 0]].map(p => +worldH(...at(...p)).toFixed(2));
  const others = S.sol.filter(q => q.bt !== 'tithe' && q.rx && Math.hypot(q.cx - T.x, q.cz - T.z) < Math.hypot(T.W, T.D) / 2 + Math.hypot(q.rx, q.rz) && (q.bt !== 'warehouse')).length;
  const K = S.thLod, P = CAM.position.clone(), fx = Math.sin(T.ry), fz = Math.cos(T.ry);
  CAM.position.set(T.x + fx * 200, 8, T.z + fz * 200); houseLod(); const far = [K.hi.visible, K.lo.visible];
  CAM.position.set(T.x + fx * 10, 3, T.z + fz * 10); houseLod(); const near = [K.hi.visible, K.lo.visible]; CAM.position.copy(P);
  return { W: T.W, D: T.D, tris: T.tris, draws: T.draws, inside, apron, ground, others, far, near, lo: Math.round(K.tris) }; });
console.log(JSON.stringify(t));
check(`Darouda's tithe house (${t.W} by ${t.D} m, ${t.tris} triangles in ${t.draws} draws) is built past its warehouse, solid inside its walls, its apron open`,
  !t.none && t.inside.every(Boolean) && t.apron.every(v => !v), t);
check(`it stands on its own made ground at 1.05 (${(t.ground || []).join(', ')}), and no house of the town touches it`, !t.none && t.ground.every(h => Math.abs(h - 1.05) < .1) && t.others === 0, t);
check(`its far copy (${t.lo} triangles) from 200 m out, the house itself from 10 m`, !t.none && t.far[0] === false && t.far[1] === true && t.near[0] === true && t.near[1] === false && t.lo < 100, t);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
