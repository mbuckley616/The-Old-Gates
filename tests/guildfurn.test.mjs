// The guild halls on the shape kit (Session 292, H.5 props, Michael's A on #46): the Fighters' and the Mages' halls each one
// bake with the notice board and the dormitories' chests beside it; the old solids where they were.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const enter = async type => { await page.evaluate(() => { try { if (interiorScene) exitInterior(); } catch (e) {} }); await page.waitForTimeout(1500); await g.hide();
  const ok = await page.evaluate(type => { let h = null; for (const S of WORLD.settle.values()) { h = S.houses.find(x => x.type === type); if (h) break; }
    if (!h) { const c = WORLD.SITES.filter(t => t.pad && ['city', 'town'].includes(t.kind)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
      for (const t of c.slice(0, 30)) { const S = WORLD.settlements.get(t.id) || WORLD.genSettlement(t); h = S && S.houses.find(x => x.type === type); if (h) break; } }
    if (!h) return false; window._S = h; px = h.exitX; pz = h.exitZ; goToInterior(h); return true; }, type);
  if (ok) { await page.waitForTimeout(4000); await g.hide(); } return ok; };
const look = () => page.evaluate(() => { const sc = interiorScene, W = _S.intW, D = _S.intD, furn = sc.children.filter(o => o.userData.furn); let meshes = 0, cyl = 0; sc.traverse(o => { if (o.isMesh) { meshes++; if (o.geometry.type === 'CylinderGeometry') cyl++; } });
  const fh = (x, z, lo, hi) => FOOTHOLDS.some(f => f.y > lo && f.y < hi && x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1);
  return { type: _S.type, W, D, furn: furn.length, big: Math.max(...furn.map(f => f.userData.tris)), meshes, cyl, beds: INT_BEDS.length, desk: fh(W / 2, 3.4, .6, .7), table: fh(W / 2, D * .3, .4, .5), npcs: WORLD.intNpcs.length }; });
const shoot = views => page.evaluate(views => { const sc = interiorScene, W = _S.intW, D = _S.intD, cv = REN.domElement, CW = cv.width, CH = cv.height, cam = new THREE.PerspectiveCamera(60, CW / CH, .05, 120);
  const c = document.createElement('canvas'); c.width = CW; c.height = CH / 2; const x = c.getContext('2d');
  views.forEach((v, i) => { const f = new Function('W', 'D', 'return ' + v)(W, D); cam.position.set(f[0], f[1], f[2]); cam.lookAt(f[3], f[4], f[5]); sc.updateMatrixWorld(true); REN.render(sc, cam); x.drawImage(cv, 0, 0, CW, CH, i * CW / 2, 0, CW / 2, CH / 2); });
  return c.toDataURL(); }, views);
fs.mkdirSync('tests/out', { recursive: true });
const pics = [];
for (const t of ['guild_f', 'guild_m']) {
  check(`a ${t} hall is found`, await enter(t));
  const r = await look(); console.log(JSON.stringify(r));
  // the room's bake, the notice board, and one chest a dormitory pair (4 pairs)
  check(`${t}: the hall is one bake of 15–90k triangles, with the notice board, four dormitory chests and the gallery's chest (Session 293) beside it, and no cylinders left`, r.furn === 7 && r.big > 15000 && r.big < 90000 && r.cyl === 0, r);
  check(`${t}: the steward's desk and the long table are footholds where they were, the dormitories' eight beds (and the gallery's) and the three members there`, r.desk && r.table && r.beds >= 8 && r.npcs === 3, r);
  pics.push(await shoot(['[W/2, 1.6, D*.5-.6, W/2, .7, 1.2]', '[W/2-2.5, 1.3, D*.3+1.8, W-.3, .6, D*.3-1.5]']));
}
const both = await page.evaluate(ps => new Promise(res => { const c = document.createElement('canvas'); let x = null, k = 0; ps.forEach((p, i) => { const im = new Image(); im.onload = () => { if (!x) { c.width = im.width; c.height = im.height * ps.length; x = c.getContext('2d'); } x.drawImage(im, 0, i * im.height); if (++k === ps.length) res(c.toDataURL()); }; im.src = p; }); }), pics);
fs.writeFileSync('tests/out/guilds.png', Buffer.from(both.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
