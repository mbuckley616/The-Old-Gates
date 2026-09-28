// The town's furniture and the POIs' structures in detail (Session 203, H.5, Michael's A): the well, the market stall,
// the tent, ruins and standing stones, each with its old self as the distant copy; the old ones keep the town's dice.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const out = {}; for (const k of ['well', 'stall', 'tent', 'ruin', 'stone']) { const F = WORLD.furnProto(k, 7); out[k] = { hi: F.hi.attributes.position.count / 3, lo: F.lo ? F.lo.attributes.position.count / 3 : 0 }; }
  // a ruin's detailed walls stand where the plain ones do: their footprints overlap
  const F = WORLD.furnProto('ruin', 11); F.hi.computeBoundingBox(); F.lo.computeBoundingBox(); const a = F.hi.boundingBox, b = F.lo.boundingBox;
  out.ruinOverlap = +((Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x)) / (b.max.x - b.min.x)).toFixed(2);
  return out; });
check('every piece builds in detail with a plain distant copy', Object.values(r).filter(x => x.hi).every(x => x.hi > 150 && x.lo > 0 && x.hi > x.lo * 2), r);
check('a ruin\'s detailed walls stand where its plain ones stand', r.ruinOverlap > .7, { overlap: r.ruinOverlap });
// a town's layout is unchanged: Dunmore's shops keep their names and doors (the stall and well dice as before)
await g.settle('dunmore');
const dm = await page.evaluate(() => { const S = WORLD.settlements.get('dunmore'); return { houses: S.houses.length, names: S.houses.filter(h => h.type && h.type !== 'home').map(h => h.name).sort() }; });
check('Dunmore keeps its shops (the same names as before this change)', dm.names.includes("Clodagh's Goods") && dm.names.includes("Lorcan's Forge"), dm);
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 500, bz = pz, y = WORLD.worldH(bx, bz) + 90;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 80), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor); const mat = new THREE.MeshLambertMaterial({ vertexColors: true }); const ms = [];
  ['well', 'stall', 'tent', 'ruin', 'stone'].forEach((k, i) => { const F = WORLD.furnProto(k, 5 + i); const m = new THREE.Mesh(F.hi, mat); m.position.set(bx + (i - 2) * 7, y, bz); m.rotation.y = .4; sc.add(m); ms.push(m); });
  const cam = new THREE.PerspectiveCamera(40, cv.width / cv.height, .3, 400); cam.position.set(bx, y + 6, bz + 22); cam.lookAt(bx, y + 1.5, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); ms.forEach(m => sc.remove(m)); sc.remove(floor); return o.toDataURL(); });
fs.writeFileSync('tests/out/furniture.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
