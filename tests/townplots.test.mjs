// The towns laid out around their church and keep (Session 1138; card F6, Michael's B on DECISION #433). Before a lot is laid, a
// town's, port's or city's church takes a plot on the square (end-on, its tower 14 m from the heart, 8.4 m wide and 27.4 m long, or
// 22.6 with two bays, with a yard of 2 m beside it and 3 m behind) and a keep its bawn's plot of 30 by 25 m at the head of the main
// street; no lot, widened house or street stands in either. On both looks alike: the plots, the church's and the keep's lots, ids
// and doors are the same, and on the new look a Gatelands church on its plot is the kit's church with its west tower.
import fs from 'fs';
import { boot, check } from './lib/game.mjs';

const pickSites = () => { const nat = t => nationKeyOf(...cellOf(t.x, t.z)), d = siteAnywhere('dunmore'), A = allSites();
  const near = (n, k, m) => A.filter(t => nat(t) === n && t.kind === k && t.pad > 0).sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z)).slice(0, m);
  return [...near('gatelands', 'town', 3), ...near('gatelands', 'port', 2), ...near('gatelands', 'city', 1), ...near('mark', 'town', 1), ...near('aurenne', 'city', 1)].map(t => ({ id: t.id, kind: t.kind, nat: nat(t) })); };
const survey = ids => { const out = {}, rc = (P, m) => { const c = Math.cos(P.ry), s = Math.sin(P.ry), hw = P.w / 2 + m, hd = P.d / 2 + m; return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([u, v]) => ({ x: P.x + u * c + v * s, z: P.z - u * s + v * c })); };
  const inside = (P, x, z, m) => { const ex = x - P.x, ez = z - P.z, c = Math.cos(P.ry), s = Math.sin(P.ry); return Math.abs(ex * c - ez * s) < P.w / 2 + m && Math.abs(ex * s + ez * c) < P.d / 2 + m; };
  // the least gap between two rotated rects (negative where they overlap), by their separating axes
  const gap = (a, b) => { const A = rc(a, 0), B = rc(b, 0); let best = -1e9; for (const P of [A, B]) for (let k = 0; k < 2; k++) { const ax = P[k + 1].x - P[k].x, az = P[k + 1].z - P[k].z, L = Math.hypot(ax, az);
    const pa = A.map(q => (q.x * ax + q.z * az) / L), pb = B.map(q => (q.x * ax + q.z * az) / L); best = Math.max(best, Math.min(...pb) - Math.max(...pa), Math.min(...pa) - Math.max(...pb)); } return best; };
  for (const id of ids) { const site = allSites().find(t => t.id === id); if (!WORLD.settle.get(id)) genSettlement(site); const S = WORLD.settle.get(id);
    const houses = S.houses.filter(h => h.siteId === id), sol = S.sol.filter(s => s.hid).map(s => ({ hid: s.hid, x: s.cx, z: s.cz, w: 2 * s.rx, d: 2 * s.rz, ry: Math.atan2(s.s || 0, s.c == null ? 1 : s.c) }));
    const plots = S.plots || [], own = P => houses.find(h => h.type === P.type && Math.hypot(h.doorX - (P.lot.x + P.tx * (P.lot.d / 2 + .15)), h.doorZ - (P.lot.z + P.tz * (P.lot.d / 2 + .15))) < .02);
    const intr = [], streets = [];
    for (const P of plots) { const mine = own(P);
      for (const q of sol) { if (mine && q.hid === mine.id) continue; const gp = gap(P, q); if (gp < .45) intr.push([P.type, q.hid, +gp.toFixed(2)]); } /* 0.6 apart, less the solid's 0.15 */
      for (const p of S.paths || []) { if (p.w !== 2.4) continue; const [a, b] = [p.pts[0], p.pts[p.pts.length - 1]], n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / .5);
        for (let k = 0; k <= n; k++) { const x = a.x + (b.x - a.x) * k / n, z = a.z + (b.z - a.z) * k / n; if (inside(P, x, z, -.3)) { streets.push([P.type, +x.toFixed(1), +z.toFixed(1)]); break; } } } }
    out[id] = { plots: plots.map(P => ({ type: P.type, x: +P.x.toFixed(3), z: +P.z.toFixed(3), w: +P.w.toFixed(3), d: +P.d.toFixed(3), ry: +P.ry.toFixed(4), front: +((site.x - P.x) * P.tx + (site.z - P.z) * P.tz).toFixed(2), heart: +Math.hypot(P.lot.x - site.x, P.lot.z - site.z).toFixed(1),
        lot: P.lot, house: (h => h && { id: h.id, w: +h.w.toFixed(3), d: +h.d.toFixed(3), x: +h.doorX.toFixed(3), z: +h.doorZ.toFixed(3), kit: h.kit && { kind: h.kit.kind, bays: h.kit.bays, side: h.kit.side } })(own(P)) })),
      churches: houses.filter(h => h.type === 'church').length, keeps: houses.filter(h => h.type === 'castle').length, intr, streets, n: houses.length }; }
  return out; };

const g0 = await boot(); await g0.intoWorld();
const sites = await g0.page.evaluate(pickSites);
check(`three towns, two ports and a city of the Gatelands, a town of the Mark and a city of Aurenne (${sites.map(s => s.id).join(', ')})`, sites.length === 8, sites);
const old = await g0.page.evaluate(survey, sites.map(s => s.id)); await g0.close();
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const neu = await page.evaluate(survey, sites.map(s => s.id)), CL = await page.evaluate(() => [PKIT.gl.churchLen(2), PKIT.gl.churchLen(3)]);

const all = sites.map(s => ({ ...s, o: old[s.id], n: neu[s.id] })), P = all.flatMap(s => s.o.plots.map(p => ({ ...p, site: s.id, kind: s.kind, nat: s.nat })));
const ch = P.filter(p => p.type === 'church'), kp = P.filter(p => p.type === 'castle');
check(`every town, port and city with a church has its church's plot (${ch.length} of ${all.filter(s => s.o.churches).length}): ${ch.map(p => `${p.site} ${p.lot.d} m, its middle ${p.heart} m from the heart`).join('; ')}`,
  ch.length === all.filter(s => s.o.churches).length && ch.every(p => p.house && p.lot.w === 8.4 && CL.includes(p.lot.d) && p.front > 0), ch.filter(p => !p.house));
// a keep comes with prosperity 80 (shopsFor), but its plot is kept whatever the prosperity, so that no lot (and no id) moves when it comes
const kps = all.filter(s => s.kind === 'city' || s.o.keeps);
check(`every city (and a town with a keep) has its bawn's plot of 30 by 25 m, its gate toward the heart, the keep at its back where it stands (${kp.map(p => `${p.site} ${p.heart} m out${p.house ? '' : ', not yet built'}`).join('; ')})`,
  kp.length === kps.length && kp.length >= 3 && kp.every(p => p.w === 30 && p.d === 25 && p.front > 0 && (p.house ? p.house.w === 14 && p.house.d === 11 : !all.find(s => s.id === p.site).o.keeps)), kp);
const intr = all.flatMap(s => [...s.o.intr, ...s.n.intr].map(x => [s.id, ...x])), streets = all.flatMap(s => [...s.o.streets, ...s.n.streets].map(x => [s.id, ...x]));
check(`no other building stands in a plot or its yard, on either look (${all.reduce((a, s) => a + s.o.n, 0)} and ${all.reduce((a, s) => a + s.n.n, 0)} buildings)`, intr.length === 0, intr.slice(0, 6));
check('no street runs into a plot: a street that meets one stops at it', streets.length === 0, streets.slice(0, 6));
check('the two looks lay the plots out alike: the same plots, and the church\'s and keep\'s ids and doors', all.every(s => JSON.stringify(s.o.plots.map(p => [p.type, p.x, p.z, p.w, p.d, p.ry, p.house && p.house.id, p.house && p.house.x, p.house && p.house.z]))
  === JSON.stringify(s.n.plots.map(p => [p.type, p.x, p.z, p.w, p.d, p.ry, p.house && p.house.id, p.house && p.house.x, p.house && p.house.z]))), all.map(s => [s.id, s.o.plots.length, s.n.plots.length]));
const glc = all.filter(s => s.nat === 'gatelands').flatMap(s => s.n.plots.filter(p => p.type === 'church')), other = all.filter(s => s.nat !== 'gatelands').flatMap(s => s.n.plots.map(p => p.house).filter(Boolean));
check(`on the new look each Gatelands church on its plot is the kit's church end-on (${glc.map(p => `${p.house.kit && p.house.kit.bays} bays`).join(', ')}); elsewhere, and on the old look, the old builders`,
  glc.length >= 5 && glc.every(p => p.house.kit && p.house.kit.kind === 'church' && !p.house.kit.side && CL[p.house.kit.bays - 2] === p.house.d) && other.every(h => h && !h.kit) && all.every(s => s.o.plots.every(p => !p.house || !p.house.kit)), glc.map(p => p.house));
// a picture of a city's keep plot and its church's, from high over the heart at noon (docs/prototypes/kit-plots-ingame.png)
{ const c = all.find(s => s.nat === 'gatelands' && s.kind === 'city'); const url = await page.evaluate(id => { forceTime(12); const site = allSites().find(t => t.id === id), S = WORLD.settle.get(id), K = S.plots.find(p => p.type === 'castle'), C = S.plots.find(p => p.type === 'church');
    const mx = (K.x + C.x) / 2, mz = (K.z + C.z) / 2, cv = REN.domElement, sc = WORLD.scene, X = mx + (mz - site.z) * .5 + 60, Z = mz - (mx - site.x) * .5 + 60;
    const cam = new THREE.PerspectiveCamera(50, cv.width / cv.height, .1, 900); cam.position.set(X, WORLD.worldH(X, Z) + 95, Z); cam.lookAt(mx, WORLD.worldH(mx, mz), mz);
    CAM.position.copy(cam.position); WORLD.tick(1 / 60, performance.now()); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL('image/png'); }, c.id);
  fs.writeFileSync(new URL('../docs/prototypes/kit-plots-ingame.png', import.meta.url), Buffer.from(url.split(',')[1], 'base64')); console.log(`  (picture: docs/prototypes/kit-plots-ingame.png, ${c.id})`); }
check('no errors on either look', g.errs.length === 0, g.errs);
await g.close();
