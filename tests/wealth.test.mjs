// Wealth in clothes (Session 268, H.2, Michael's A on Session 246: from the role and the town's prosperity): a person of
// a place carries a wealth, and dresses poor (faded cloth, foot-wraps, a rope belt, patches) or well-off (deeper dyes,
// gilt trim, dark boots, a buckle, a chain and pendant) by it; the same person follows the town's fortune.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
await g.settle('hearthwick');
const r = await page.evaluate(() => { const site = WORLD.SITE.hearthwick, st = WORLD.TS(site), p0 = st.p; const out = { p0 };
  const one = (role, p) => { st.p = p; const gn = personGenome({ name: 'Maeve', role, female: true }, { nation: 'gatelands', key: 'hearthwick' }); const b = personBake(gn, 1); const t = b.tris; b.geo.dispose(); return { w: +gn.wealth.toFixed(2), tris: t, cloth: gn.cloth.getHexString(), boot: gn.boot.getHexString(), trim: gn.trim.getHexString() }; };
  out.poor = one('farmer', 5); out.mid = one('villager', 50); out.rich = one('merchant', 95); out.lord = one('lord', 50);
  out.guard = (() => { st.p = 50; const gn = personGenome({ name: 'Maeve', role: 'guard', female: true }, { nation: 'gatelands', key: 'hearthwick' }); return gn.wealth == null; })();
  out.noPlace = (() => { const gn = personGenome({ name: 'Maeve', role: 'farmer', female: true }, { nation: 'gatelands' }); return gn.wealth == null; })();
  st.p = p0;
  // a picture: the same farmer, merchant and villager poor (a failing town), as today, and well-off (a thriving one)
  forceTime(12); const sc = WORLD.scene, x = px + 300, z = pz, y = WORLD.worldH(x, z) + 40, tmp = [];
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshLambertMaterial({ color: 0x6a6048 })); floor.rotation.x = -Math.PI / 2; floor.position.set(x, y, z); sc.add(floor); tmp.push(floor);
  [[5, -2.4], [50, 0], [95, 2.4]].forEach(([pp, dx]) => { st.p = pp; ['farmer', 'villager', 'merchant'].forEach((role, i) => { const gn = personGenome({ name: ['Maeve', 'Cian', 'Orla'][i], role, female: i !== 1 }, { nation: 'gatelands', key: 'hearthwick' }); const rg = buildPerson(gn); rg.root.position.set(x + dx + (i - 1) * .7, y, z); rg.root.rotation.y = 0; pwApply(rg, pwIdle(1, { holds: rg.holds, gear: rg.g.gear })); sc.add(rg.root); tmp.push(rg.root); }); });
  st.p = p0; const cv = REN.domElement, cam = new THREE.PerspectiveCamera(32, cv.width / cv.height, .05, 100); cam.position.set(x, y + 1.3, z + 7.5); cam.lookAt(x, y + .85, z); sc.updateMatrixWorld(true); const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f;
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); tmp.forEach(t => sc.remove(t)); out.shot = o.toDataURL();
  // the townsfolk as built: a spread of wealth
  const ws = [...PEOPLE_RIGS].filter(q => q.g && q.g.wealth != null).map(q => q.g.wealth); out.town = { n: ws.length, min: +Math.min(...ws).toFixed(2), max: +Math.max(...ws).toFixed(2) };
  return out; });
fs.writeFileSync('tests/out/wealth.png', Buffer.from(r.shot.split(',')[1], 'base64')); delete r.shot;
console.log(JSON.stringify(r));
check('a farmer in a failing town is poor, a villager middling, a merchant in a thriving town and a lord well-off', r.poor.w < .3 && r.mid.w >= .3 && r.mid.w <= .7 && r.rich.w > .7 && r.lord.w > .7, r);
check('poor adds its patches and knot, well-off its buckle, chain and pendant; each dresses differently (cloth, boots, trim)', r.poor.tris > r.mid.tris && r.rich.tris > r.mid.tris && r.poor.cloth !== r.mid.cloth && r.rich.cloth !== r.mid.cloth && r.rich.trim === 'c8a040' && r.poor.boot === '7a6a52', r);
check('a guard in uniform, and a person of no place, carry no wealth (dressed as before)', r.guard && r.noPlace, r);
check('Hearthwick\'s townsfolk carry a wealth, with a spread', r.town.n > 3 && r.town.max - r.town.min > .1, r.town);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
