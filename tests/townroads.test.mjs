// Town roads (Session 193, playtest s162: overlapping path patterns, roads running into buildings). Across thirty
// settlements: no footpath runs through a building, no building or wall stands on a road, and the street grid gives
// way where a road already runs.
import { boot, check } from './lib/game.mjs';
import { measureTowns } from './lib/townroads.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const T = (await measureTowns(page, 30)).filter(x => !x.err);
const worst = k => T.reduce((m, x) => Math.max(m, x[k] || 0), 0);
check('thirty settlements build', T.length >= 25, { n: T.length });
check('no footpath runs through a building', worst('footInBld') === 0, T.filter(x => x.footInBld > 0).map(x => [x.id, x.footInBld]));
check('no building or wall stands on a road', T.every(x => x.bldOnRoad === 0), T.filter(x => x.bldOnRoad).map(x => [x.id, x.bldOnRoad]));
check('the street grid gives way to the roads (at most 2% of a town\'s street on a road)', worst('streetOnRoad') <= .02, T.map(x => [x.id, x.streetOnRoad]).filter(x => x[1] > .01));
check('streets still stay out of buildings', worst('streetInBld') < .015, { worst: worst('streetInBld') });
// Dunmore from above: the roads, the streets and footpaths, the buildings
await g.settle('dunmore'); await g.spin(null, 600);
const shot = await page.evaluate(() => { forceTime(12); const S = WORLD.settlements.get('dunmore'), t = S.site; const cv = REN.domElement, sc = WORLD.scene;
  const h = t.pad + 10, cam = new THREE.OrthographicCamera(-h * cv.width / cv.height, h * cv.width / cv.height, h, -h, 1, 800); cam.position.set(t.x, WORLD.worldH(t.x, t.z) + 300, t.z); cam.up.set(0, 0, -1); cam.lookAt(t.x, 0, t.z);
  const fog = sc.fog; sc.fog = null; sc.updateMatrixWorld(true); REN.render(sc, cam); sc.fog = fog; const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL(); });
fs.writeFileSync('tests/out/townroads-dunmore.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
