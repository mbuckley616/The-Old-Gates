// The keep in its bawn on its plot (Session 1143; card F6, Michael's B on DECISION #416). On the new look a Gatelands city's keep is
// the kit's tower house in its bawn, centred on the bawn's plot of 30 by 25 m with its gate toward the heart; the keep's lot is the
// tower's footprint (11 by 8.5 m), its door the tower's and its room the old keep's. The bawn's walls, flankers, house and well are
// solids and the gateway is open; the footpath runs from the tower's door out through the gate; the far copy holds the bawn. On the
// old look the keep is the old one, on the plot's lot, its door where it was.
import fs from 'fs';
import { boot, check } from './lib/game.mjs';

const survey = () => { const nat = t => nationKeyOf(...cellOf(t.x, t.z));
  const cities = allSites().filter(t => t.kind === 'city' && t.pad > 0 && nat(t) === 'gatelands');
  const out = []; for (const site of cities) { if (!WORLD.settle.get(site.id)) genSettlement(site); const S = WORLD.settle.get(site.id), P = (S.plots || []).find(p => p.type === 'castle'), h = S.houses.find(x => x.type === 'castle' && x.siteId === site.id);
    if (!P || !h) { out.push({ id: site.id, none: true }); continue; }
    const c = Math.cos(P.ry), s = Math.sin(P.ry), loc = (x, z) => [(x - P.x) * c - (z - P.z) * s, (x - P.x) * s + (z - P.z) * c], W = (u, v) => ({ x: P.x + u * c + v * s, z: P.z - u * s + v * c });
    const k = h.kit, o = { id: site.id, kit: k && k.kind, w: h.w, d: h.d, door: loc(h.doorX, h.doorZ).map(v => +v.toFixed(2)), lotDoor: [0, +(P.lot.z === undefined ? 0 : loc(P.lot.x + P.tx * (P.lot.d / 2 + .15), P.lot.z + P.tz * (P.lot.d / 2 + .15))[1].toFixed(2))] };
    o.front = +((site.x - P.x) * P.tx + (site.z - P.z) * P.tz).toFixed(2);
    if (k && k.kind === 'keep') { o.tris = k.tris; o.calls = k.calls;
      // the bawn's footprint in the plot's frame (its box as measured at the plan, about the plot's middle, where it is centred), and the merged town's vertices
      // above 12 m inside the plot: the tower is drawn there
      { o.box = k.bb.slice();
        const v = new THREE.Vector3(), y0 = worldH(k.at.x, k.at.z); let n = 0; S.kitLod.hi.updateMatrixWorld(true); S.kitLod.hi.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position; for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); const [u, w] = loc(v.x, v.z); if (Math.abs(u) < 15 && Math.abs(w) < 12.5 && v.y - y0 > 12) n++; } }); o.high = n; o.found = n > 1000; }
      // where the tower's door, the gate and the walls are, in the plot's frame (the bawn is centred: k.at is the bawn's middle)
      const [au, av] = loc(k.at.x, k.at.z), B = { w: 26, d: 22, t: .9 }, gx = au + 1.0, fz = av + B.d / 2 - B.t / 2;
      const solid = (u, v) => { const q = W(u, v); return settleSolid(q.x, q.z, .3); };
      o.gate = solid(gx, fz) ? 'shut' : 'open';
      o.walls = [[au - 6, fz], [au + 7, fz], [au - B.w / 2 + .45, av + 4], [au + B.w / 2 - .45, av - 6], [au + 6, av - B.d / 2 + .45], [au + B.w / 2 - .4, av + B.d / 2 - .4], [k.at && au - 7.5, av - 6.75]].map(([u, v]) => solid(u, v));
      o.yard = [[au + 1, av + 6], [au - 4, av + 4], [au + 1, av - 6]].map(([u, v]) => solid(u, v));
      o.at = [+au.toFixed(2), +av.toFixed(2)];
      const path = (S.paths || []).find(p => p.w === 1.3 && p.pts.length === 3 && Math.hypot(p.pts[0].x - h.doorX, p.pts[0].z - h.doorZ) < .6);
      o.path = path ? path.pts.map(q => loc(q.x, q.z).map(v => +v.toFixed(1))) : null;
      // the steward's evening walk to the inn (Session 1143): straight, the bawn's wall is in the way; by the streets, out through the gateway, clear of every solid
      { const n = S.npcs.find(q => q.sched && q.sched.bawn), sc = n && n.sched; o.steward = !!n;
        if (sc && sc.inn) { const hit = (a, b) => { const L = Math.hypot(b.x - a.x, b.z - a.z), m = Math.ceil(L / .25); for (let j = 1; j < m; j++) if (settleSolid(a.x + (b.x - a.x) * j / m, a.z + (b.z - a.z) * j / m, .2)) return true; return false; };
          const way = [sc.door, ...townRoute(S)(sc.door, sc.inn), sc.inn]; o.straight = hit(sc.door, sc.inn); o.wayHits = way.slice(1).filter((p, j) => hit(way[j], p)).length; o.wayN = way.length;
          o.throughGate = way.some((p, j) => j && (() => { const [u0, v0] = loc(way[j - 1].x, way[j - 1].z), [u1, v1] = loc(p.x, p.z), fv = av + B.d / 2 - B.t / 2; if ((v0 - fv) * (v1 - fv) > 0) return false; const u = u0 + (u1 - u0) * (fv - v0) / (v1 - v0); return Math.abs(u - gx) < 1.5; })()); } }
      o.lodR = S.kitLod.r; o.reach = Math.max(...[[o.box[0], o.box[2]], [o.box[1], o.box[2]], [o.box[1], o.box[3]], [o.box[0], o.box[3]]].map(([u, v]) => { const q = W(u, v); return Math.hypot(q.x - site.x, q.z - site.z); }));
      // the ground under the bawn: its height range across the plot, for the walls' footings (0.8 m below)
      const hs = []; for (let u = -14; u <= 14; u += 2) for (let v = -12; v <= 12; v += 2) { const q = W(u, v); hs.push(worldH(q.x, q.z)); } o.ground = +(Math.max(...hs) - Math.min(...hs)).toFixed(2); }
    out.push(o); }
  return out; };

const g0 = await boot(); await g0.intoWorld(); const old = await g0.page.evaluate(survey); const e0 = g0.errs.slice(); await g0.close();
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld(); const neu = await page.evaluate(survey);
const N = neu.filter(o => !o.none), O = old.filter(o => !o.none);
check(`the Gatelands cities with a keep on their plot (${N.map(o => o.id).join(', ')}, of ${neu.length} cities), the same on both looks`, N.length >= 2 && N.map(o => o.id).join() === O.map(o => o.id).join(), { old, neu });
check(`on the new look each keep is the kit's bawn (${N.map(o => `${o.id} ${o.tris && o.tris.toLocaleString()} triangles in ${o.calls} draws`).join('; ')})`, N.every(o => o.kit === 'keep' && o.found && o.tris === 18346 && o.calls >= 30 && o.calls <= 32), N);
check(`the bawn stands inside its plot of 30 by 25 m, its gate toward the heart (${N.map(o => `${o.id} ${o.box.join(' ')}`).join('; ')})`, N.every(o => o.box[0] > -15 && o.box[1] < 15 && o.box[2] > -12.5 && o.box[3] < 12.5 && o.front > 0), N.map(o => [o.box, o.front]));
check(`the keep's door is the tower's, in the bawn's back west corner (${N.map(o => o.door.join(', ')).join('; ')}); the steward's room is the old keep's, 14 by 11`, N.every(o => o.door[0] < -5 && o.door[1] < 0 && o.w === 14 && o.d === 11), N.map(o => [o.door, o.w, o.d]));
check('the gateway is open; the walls, the flankers and the tower are solid; the yard is clear', N.every(o => o.gate === 'open' && o.walls.every(Boolean) && o.yard.every(x => !x)), N.map(o => [o.gate, o.walls, o.yard]));
check(`a footpath runs from the tower's door out through the gate (${N.map(o => o.path && o.path.map(p => p.join(',')).join(' → ')).join('; ')})`, N.every(o => o.path && Math.abs(o.path[1][0] - o.at[0] - 1) < .2 && o.path[2][1] > o.at[1] + 11), N.map(o => o.path));
check(`the steward's evening walk to the inn goes out through the gate by the streets (${N.map(o => `${o.id}: straight ${o.straight ? 'blocked' : 'clear'}, ${o.wayN} points, ${o.wayHits} through a solid`).join('; ')})`,
  N.every(o => o.steward && o.throughGate && o.wayHits === 0), N.map(o => [o.steward, o.straight, o.wayN, o.wayHits, o.throughGate]));
check(`the town's far copy reaches the bawn's far corner (${N.map(o => `${o.lodR.toFixed(1)} against ${o.reach.toFixed(1)} m`).join('; ')})`, N.every(o => o.lodR >= o.reach - .05), N.map(o => [o.lodR, o.reach]));
console.log(`  (the ground across each plot: ${N.map(o => `${o.id} ${o.ground} m`).join(', ')}; the walls' footings go 0.8 m down)`);
check(`on the old look each keep is the old one on the plot's lot, its door at the lot's front (${O.map(o => o.door.join(', ')).join('; ')})`, O.every(o => !o.kit && Math.abs(o.door[0]) < .05 && Math.abs(o.door[1] - o.lotDoor[1]) < .05), O);
// a picture of the first city's keep, from high on the heart's side, into the yard at noon (docs/prototypes/kit-bawn-ingame.png)
{ const url = await page.evaluate(id => { forceTime(12); const S = WORLD.settle.get(id), P = S.plots.find(p => p.type === 'castle'), cv = REN.domElement, sc = WORLD.scene;
    const X = P.x + P.tx * 30 - P.tz * 20, Z = P.z + P.tz * 30 + P.tx * 20, cam = new THREE.PerspectiveCamera(50, cv.width / cv.height, .1, 900);
    cam.position.set(X, WORLD.worldH(X, Z) + 34, Z); cam.lookAt(P.x, WORLD.worldH(P.x, P.z) + 2, P.z); CAM.position.copy(cam.position); WORLD.tick(1 / 60, performance.now()); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL('image/png'); }, N[0].id);
  fs.writeFileSync(new URL('../docs/prototypes/kit-bawn-ingame.png', import.meta.url), Buffer.from(url.split(',')[1], 'base64')); console.log(`  (picture: docs/prototypes/kit-bawn-ingame.png, ${N[0].id})`); }
check('no errors on either look', e0.length === 0 && g.errs.length === 0, [...e0, ...g.errs]);
await g.close();
