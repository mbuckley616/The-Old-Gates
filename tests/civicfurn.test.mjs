// The church and the keep's hall on the shape kit (Session 291, H.5 props, Michael's A on #46): each room one bake (the
// altar's candles and the braziers in its flame mesh), the old solids where they were.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const enter = async type => { await page.evaluate(() => { try { if (interiorScene) exitInterior(); } catch (e) {} }); await page.waitForTimeout(1500); await g.hide();
  const ok = await page.evaluate(type => { let h = null; for (const S of WORLD.settle.values()) { h = S.houses.find(x => x.type === type); if (h) break; }
    if (!h) { const c = WORLD.SITES.filter(t => t.pad && ['city', 'town'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
      for (const t of c.slice(0, 24)) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); h = S && S.houses.find(x => x.type === type); if (h) break; } }
    if (!h) return false; window._S = h; px = h.exitX; pz = h.exitZ; goToInterior(h); return true; }, type);
  if (ok) { await page.waitForTimeout(4000); await g.hide(); } return ok; };
const look = () => page.evaluate(() => { const sc = interiorScene, W = _S.intW, D = _S.intD, furn = sc.children.filter(o => o.userData.furn); let meshes = 0, cyl = 0; sc.traverse(o => { if (o.isMesh) { meshes++; if (o.geometry.type === 'CylinderGeometry') cyl++; } });
  return { type: _S.type, W, D, furn: furn.length, tris: furn.map(f => f.userData.tris), fire: furn.some(f => f.userData.fire), meshes, cyl, sol: INT_SOL.length }; });
const shoot = views => page.evaluate(views => { const sc = interiorScene, W = _S.intW, D = _S.intD, cv = REN.domElement, CW = cv.width, CH = cv.height, cam = new THREE.PerspectiveCamera(60, CW / CH, .05, 120);
  const c = document.createElement('canvas'); c.width = CW; c.height = CH / 2; const x = c.getContext('2d');
  views.forEach((v, i) => { const f = new Function('W', 'D', 'return ' + v)(W, D); cam.position.set(f[0], f[1], f[2]); cam.lookAt(f[3], f[4], f[5]); sc.updateMatrixWorld(true); REN.render(sc, cam); x.drawImage(cv, 0, 0, CW, CH, i * CW / 2, 0, CW / 2, CH / 2); });
  return c.toDataURL(); }, views);
fs.mkdirSync('tests/out', { recursive: true });
check('a church is found', await enter('church'));
const ch = await look(); console.log(JSON.stringify(ch));
check('the church is one bake with the altar\'s candle flames, 10–60k triangles, and none of the old cylinder pillars', ch.furn === 1 && ch.fire && ch.tris[0] > 10000 && ch.tris[0] < 60000 && ch.cyl === 0, ch);
const cs = await page.evaluate(() => { const W = _S.intW, D = _S.intD; return { altar: intSolidAt(W / 2, 1.6, .1) || FOOTHOLDS.some(f => W / 2 > f.x0 && W / 2 < f.x1 && 1.6 > f.z0 && 1.6 < f.z1), pillar: intSolidAt(W / 2 - 4.1, 5.5, .1), inPew: intSolidAt(W / 2 - 3, 8, .1) || intSolidAt(W / 2 + 3, 8, .1),
  cols: INT_SOL.filter(q => q.y1 > 2.5 && q.x1 - q.x0 < 1 && q.z1 - q.z0 < 1).map(q => [+(((q.x0 + q.x1) / 2) - W / 2).toFixed(2), +((q.z0 + q.z1) / 2).toFixed(2)]), W, D }; });
console.log(JSON.stringify(cs));
check('the altar is solid, and the columns too (Session 303: at W/2 ± 4.1 from z 5.5)', cs.altar && cs.pillar, cs);
check('no column stands in the pews (they run W/2 ± .9–3.5; Session 291 put the columns at ± 3) or on the dais (to z 4.1)', !cs.inPew && cs.cols.length >= 4 && cs.cols.every(([dx, z]) => Math.abs(dx) - .4 > 3.5 && z > 4.1), cs.cols);
const churchPic = await shoot(['[W/2, 1.5, D-2.2, W/2, .6, 1.6]', '[W/2+1.2, 1.1, 5.6, W/2-2.2, .5, 1.4]']);
fs.writeFileSync('tests/out/church.png', Buffer.from(churchPic.split(',')[1], 'base64'));
check('a keep is found', await enter('castle'));
const ca = await look(); console.log(JSON.stringify(ca));
check('the keep\'s hall is one bake with the braziers\' flames, 10–80k triangles, and none of the old cylinder pillars or braziers', ca.furn === 1 && ca.fire && ca.tris[0] > 10000 && ca.tris[0] < 80000 && ca.cyl === 0, ca);
const ks = await page.evaluate(() => { const W = _S.intW, D = _S.intD, z = D * .3, fh = (x, z, lo, hi) => FOOTHOLDS.some(f => f.y > lo && f.y < hi && x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1);
  return { table: fh(W / 2, z, .4, .5), benches: fh(W / 2, z + 1.2, .2, .3) && fh(W / 2, z - 1.2, .2, .3), column: intSolidAt(W / 2 - 5, 6, .1), brazier: fh(W / 2 - 3, 5.2, .6, .75) }; });
check('the long table and its benches are footholds, the columns solid, the braziers footholds', ks.table && ks.benches && ks.column && ks.brazier, ks);
const hallPic = await shoot(['[W/2, 2.2, D-2.5, W/2, .8, 1.6]', '[W/2+3.8, 1.3, D*.3+3.2, W/2-1, .4, D*.3-.4]']);
fs.writeFileSync('tests/out/hall.png', Buffer.from(hallPic.split(',')[1], 'base64'));
// both, one above the other
const both = await page.evaluate(ps => new Promise(res => { const c = document.createElement('canvas'); let x = null, k = 0; ps.forEach((p, i) => { const im = new Image(); im.onload = () => { if (!x) { c.width = im.width; c.height = im.height * 2; x = c.getContext('2d'); } x.drawImage(im, 0, i * im.height); if (++k === 2) res(c.toDataURL()); }; im.src = p; }); }), [churchPic, hallPic]);
fs.writeFileSync('tests/out/civic.png', Buffer.from(both.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
