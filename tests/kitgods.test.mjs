// The six gods' row of seven at the town church on the new look (Session 1232; card F6, Michael's B on DECISION #464 after his C on
// #439). A Gatelands town's, port's or city's church plot has a yard of 4.5 m beside the nave (2 m until now), and the row stands along
// its long side facing the nave, as shrines-church.html?place=side drew it: seven niches 1.4 m apart, the Guest's struck, a basin
// before each of the six; its plinths one solid and each basin one; the kneeling place before each basin open ground.
// Writes docs/prototypes/kit-gods-ingame.png (at the row) and kit-gods-yard.png (from the tower's end of the yard).
// Session 1329 (OG-113, the same answers): an Aurennais town's, port's or city's Church of the Weaver has a yard of 4.5 m on its left (the
// tower on its right), and the row stands along it in Aurenne's dress facing the nave: flat steles under cupolas, the Guest's bricked up,
// an iron railing with its gate before the middle niche, a walk of 1.2 m between the railing and the church. The kneeling place before
// each basin is open ground inside the railing, the gate is open, and the railing, its piers and the tithe box are solids.
// Writes docs/prototypes/kit-gods-aurenne.png (through the gate) and kit-gods-aurenne-walk.png (along the walk).
import fs from 'fs';
import { boot, check } from './lib/game.mjs';

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const R = await page.evaluate(() => {
  const nat = t => nationKeyOf(...cellOf(t.x, t.z)), d = siteAnywhere('dunmore'), A = allSites();
  const near = (k, m) => A.filter(t => nat(t) === 'gatelands' && t.kind === k && t.pad > 0).sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z)).slice(0, m);
  const sites = [...near('town', 3), ...near('port', 2), ...near('city', 1)], out = [];
  for (const site of sites) { if (!WORLD.settle.get(site.id)) genSettlement(site); const S = WORLD.settle.get(site.id), P = (S.plots || []).find(p => p.type === 'church');
    if (!P) { out.push({ id: site.id, plot: false }); continue; } const G = S.gods;
    // the plot's frame: its local x across the nave (the church 8.4 m on one side, the yard on the other); how far a point stands out
    // from the nave's flank, the yard's side being the row's
    const c = Math.cos(P.ry), s = Math.sin(P.ry), lx = (x, z) => (x - P.x) * c - (z - P.z) * s, side = G ? Math.sign(lx(G.x, G.z)) : 1, across = (x, z) => side * lx(x, z) - (8.4 - P.w / 2);
    const who = (x, z) => S.sol.filter(q => { const ex = x - q.cx, ez = z - q.cz, qc = q.c == null ? 1 : q.c, qs = q.s || 0; return Math.abs(ex * qc - ez * qs) < q.rx && Math.abs(ex * qs + ez * qc) < q.rz; }).map(q => [q.bt || '-', q.hid || '', +q.rx.toFixed(2), +q.rz.toFixed(2)]);
    const inPlot = (x, z, m) => { const ex = x - P.x, ez = z - P.z, c2 = Math.cos(P.ry), s2 = Math.sin(P.ry); return Math.abs(ex * c2 - ez * s2) < P.w / 2 + m && Math.abs(ex * s2 + ez * c2) < P.d / 2 + m; };
    if (!G) { out.push({ id: site.id, plot: true, gods: false }); continue; }
    const fx = Math.sin(G.ry), fz = Math.cos(G.ry), L = P.lot, toNave = ((L.x - G.x) * fx + (L.z - G.z) * fz) / Math.hypot(L.x - G.x, L.z - G.z);
    const sol = S.sol.filter(q => q.bt === 'wall' && q.rx > 4 && Math.hypot(q.cx - G.x, q.cz - G.z) < 1).length;
    out.push({ id: site.id, kind: site.kind, plot: true, gods: true, w: +P.w.toFixed(3), lotW: L.w, bays: L.bays, tris: G.tris, draws: G.draws, len: +G.len.toFixed(2), toNave: +toNave.toFixed(3), plinthSolid: sol,
      niches: G.niches.map(n => ({ god: n.god, basin: !!n.basin, inPlot: inPlot(n.x, n.z, 0), faceToNave: +across(n.x, n.z).toFixed(2),
        kneel: n.basin ? { across: +across(n.pray.x, n.pray.z).toFixed(2), solid: WORLD.solidAt(n.pray.x, n.pray.z), inPlot: inPlot(n.pray.x, n.pray.z, 0), by: who(n.pray.x, n.pray.z) } : null,
        basinSolid: n.basin ? WORLD.solidAt(n.basin.x, n.basin.z) : null, ground: +(worldH(n.x, n.z) - G.y - n.dy).toFixed(3), dy: +n.dy.toFixed(2) })) }); }
  return out; });
const ok = R.filter(r => r.gods);
check(`every Gatelands town, port and city near Dunmore has its church's plot and the row in its yard (${ok.length} of ${R.length}: ${R.map(r => r.id).join(', ')})`, R.length >= 5 && ok.length === R.length, R.filter(r => !r.gods));
check(`the church's plot is 4.5 m of yard wider than the church (${[...new Set(ok.map(r => +(r.w - r.lotW).toFixed(2)))].join(', ')} m)`, ok.every(r => Math.abs(r.w - r.lotW - 4.5) < 1e-6), ok.map(r => [r.id, r.w, r.lotW]));
check(`seven niches 1.4 m apart, the Guest's last with no basin, the six with one each (${ok[0] && ok[0].niches.map(n => n.god).join(', ')}); the row ${ok[0] && ok[0].len} m long`,
  ok.every(r => r.niches.length === 7 && r.niches[6].god === 'guest' && !r.niches[6].basin && r.niches.slice(0, 6).every(n => n.basin) && Math.abs(r.len - 9.4) < .01), ok.map(r => r.niches.map(n => n.god)));
check(`the row faces the nave and stands in the yard, every niche in the plot (its faces ${[...new Set(ok.flatMap(r => r.niches.map(n => n.faceToNave)))].join(', ')} m from the nave's flank)`,
  ok.every(r => r.toNave > .9 && r.niches.every(n => n.inPlot && n.faceToNave > 3.5 && n.faceToNave < 4.2)), ok.map(r => [r.id, r.toNave, r.niches.map(n => [n.inPlot, n.faceToNave])]));
check('its plinths are one solid and every basin is one; the kneeling place before each basin is open ground in the yard, between the basin and the nave',
  ok.every(r => r.plinthSolid === 1 && r.niches.every(n => !n.basin || (n.basinSolid && !n.kneel.solid && n.kneel.inPlot && n.kneel.across > 2 && n.kneel.across < n.faceToNave))), ok.map(r => [r.id, r.plinthSolid, r.niches.map(n => n.kneel && [n.basinSolid, n.kneel])]));
check(`each niche stands on its own ground, within 8 cm (a row on a slope steps down it: ${ok.map(r => `${r.id} ${Math.min(...r.niches.map(n => n.dy))} to ${Math.max(...r.niches.map(n => n.dy))} m`).join('; ')}): ${[...new Set(ok.flatMap(r => r.niches.map(n => n.ground)))].slice(0, 8).join(', ')})`, ok.every(r => r.niches.every(n => Math.abs(n.ground) < .08)), ok.map(r => r.niches.map(n => n.ground)));
check(`the row is ${ok[0] && ok[0].tris} tris in ${ok[0] && ok[0].draws} materials (the prototype's 25 draws: at most 8 here)`, ok.every(r => r.draws <= 8 && r.tris > 10000 && r.tris < 40000), ok.map(r => [r.tris, r.draws]));
// the pictures: kneeling at An Teallach's basin, at noon; and from the yard's tower end along the row and the nave
{ const id = ok[0].id; for (const [name, view] of [['kit-gods-ingame.png', 'kneel'], ['kit-gods-yard.png', 'yard']]) {
  const url = await page.evaluate(([id, view]) => { forceTime(12); const S = WORLD.settle.get(id), G = S.gods, n = G.niches.find(q => q.god === 'teallach'), fx = Math.sin(G.ry), fz = Math.cos(G.ry), ax = Math.cos(G.ry), az = -Math.sin(G.ry);
    const cv = REN.domElement, sc = WORLD.scene, cam = new THREE.PerspectiveCamera(view === 'kneel' ? 58 : 54, cv.width / cv.height, .05, 900);
    if (view === 'kneel') { const X = n.pray.x + fx * .9 - ax * 1.2, Z = n.pray.z + fz * .9 - az * 1.2; cam.position.set(X, G.y + 1.65, Z); cam.lookAt(n.x, G.y + 1.2, n.z); }
    else { const X = G.x - ax * 9.5 + fx * 2.6, Z = G.z - az * 9.5 + fz * 2.6; cam.position.set(X, G.y + 1.75, Z); cam.lookAt(G.x + ax * 2 + fx * .6, G.y + 1.4, G.z + az * 2 + fz * .6); }
    CAM.position.copy(cam.position); WORLD.tick(1 / 60, performance.now()); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL('image/png'); }, [id, view]);
  fs.writeFileSync(new URL('../docs/prototypes/' + name, import.meta.url), Buffer.from(url.split(',')[1], 'base64')); console.log(`  (picture: docs/prototypes/${name}, ${id})`); } }

// Aurenne (Session 1329): every town, port and city of the first cells planned, then two settled for the solids and the pictures
const AU = await page.evaluate(() => { anchoredPlaces(); const A = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'aurenne').flatMap(c => c.sites).filter(s => ['town', 'port', 'city'].includes(s.kind) && s.pad > 0).slice(0, 14);
  return A.map(site => { if (!WORLD.settle.get(site.id)) genSettlement(site); const S = WORLD.settle.get(site.id), P = (S.plots || []).find(p => p.type === 'church'), G = S.gods;
    const ch = S.houses.find(h => h.type === 'church' && h.kit);
    return { id: site.id, kind: site.kind, au: !!(ch && ch.kit.kind === 'aurchurch'), yard: P ? +(P.w - P.lot.w).toFixed(2) : null, gods: !!G, island: G && G.island, n: G ? G.niches.length : 0, basins: G ? G.niches.filter(n => n.basin).length : 0, guest: G && G.niches[6].god, tris: G && G.tris, draws: G && G.draws }; }); });
const auOk = AU.filter(r => r.au && r.gods && r.island === 'aurenne');
check(`every Aurennais town, port and city tried has the Church of the Weaver with the row in Aurenne's dress (${auOk.length} of ${AU.length})`, AU.length >= 8 && auOk.length === AU.length, AU.filter(r => !auOk.includes(r)));
check(`its yard is 1.5 + 4.5 m wider than the church (${[...new Set(auOk.map(r => r.yard))].join(', ')} m); seven niches, six basins, the Guest's last`, auOk.every(r => Math.abs(r.yard - 6) < 1e-6 && r.n === 7 && r.basins === 6 && r.guest === 'guest'), auOk);
check(`Aurenne's row is ${auOk[0] && auOk[0].tris} tris in ${auOk[0] && auOk[0].draws} materials (at most 15)`, auOk.every(r => r.draws <= 15 && r.tris > 10000 && r.tris < 40000), auOk.map(r => [r.tris, r.draws]));
const auIds = [AU.find(r => r.kind === 'town'), AU.find(r => r.kind === 'port')].filter(Boolean).map(r => r.id);
for (const id of auIds) { await g.settle(id);
  const q = await page.evaluate(id => { const S = WORLD.settle.get(id), G = S.gods, fx = Math.sin(G.ry), fz = Math.cos(G.ry), ax = Math.cos(G.ry), az = -Math.sin(G.ry), at = (u, v) => [G.x + u * ax + v * fx, G.z + u * az + v * fz], so = (u, v) => WORLD.solidAt(...at(u, v)), L = G.rail;
    const P = S.plots.find(p => p.type === 'church'), ch = S.houses.find(h => h.type === 'church' && h.kit), toNave = ((P.lot.x - G.x) * fx + (P.lot.z - G.z) * fz) / Math.hypot(P.lot.x - G.x, P.lot.z - G.z);
    let walk = null; for (let d = 0; d < 4; d += .02) if (so(0, L.z + L.t + d)) { walk = +(d + .3).toFixed(2); break; }
    const walkAlong = [-5, -2.5, 0, 2.5, 5].every(u => !so(u, L.z + L.t + .6));
    return { walk, walkAlong, toNave: +toNave.toFixed(2), gate: [L.z + L.t + .4, L.z, L.z - L.t - .1, 1.1].map(v => so(0, v)), rail: [-3, -1.2, 1.2, 3].map(u => so(u, L.z)), tithe: so(.98, 1.6),
      kneel: G.niches.filter(n => n.basin).map(n => [WORLD.solidAt(n.basin.x, n.basin.z), WORLD.solidAt(n.pray.x, n.pray.z)]), ground: G.niches.map(n => +(worldH(n.x, n.z) - G.y - n.dy).toFixed(3)), door: !WORLD.solidAt(ch.exitX, ch.exitZ) }; }, id);
  check(`${id}: the row faces the nave (${q.toNave}), the walk inside its railing is ${q.walk} m to the church's solid and open its whole length; the church's door still clear`, q.toNave > .9 && q.walk >= 1.15 && q.walk < 1.6 && q.walkAlong && q.door, q);
  check(`${id}: the gate is open from the walk to An Chloch's kneeling place, the railing either side of it and the tithe box are solid`, q.gate.every(v => !v) && q.rail.every(v => v) && q.tithe, q);
  check(`${id}: every basin is solid and the place before it open; each niche on its own ground within 8 cm`, q.kneel.every(([b, k]) => b && !k) && q.ground.every(v => Math.abs(v) < .08), q); }
// the pictures through the game's own frame (its land and its post), as kitislands' are: through the gate, and along the walk
{ const id = auIds[0]; for (const [name, view] of [['kit-gods-aurenne.png', 'gate'], ['kit-gods-aurenne-walk.png', 'walk']]) {
  await page.evaluate(([id, view]) => { forceTime(10); VM_SCENE.visible = false; const S = WORLD.settle.get(id), G = S.gods, fx = Math.sin(G.ry), fz = Math.cos(G.ry), ax = Math.cos(G.ry), az = -Math.sin(G.ry);
    const [u, v, tu, tv] = view === 'gate' ? [-1.6, 3.3, .4, 0] : [-7.5, 2.75, 2, 1.6]; px = G.x + u * ax + v * fx; pz = G.z + u * az + v * fz; py = WORLD.worldH(px, pz) + 1.65;
    const lx = G.x + tu * ax + tv * fx - px, lz = G.z + tu * az + tv * fz - pz; yaw = Math.atan2(-lx, -lz); pitch = view === 'gate' ? -.08 : 0; }, [id, view]);
  await g.frames(6); await page.screenshot({ path: new URL('../docs/prototypes/' + name, import.meta.url).pathname }); console.log(`  (picture: docs/prototypes/${name}, ${id})`); } }
check('no errors', g.errs.length === 0, g.errs);
await g.close();
