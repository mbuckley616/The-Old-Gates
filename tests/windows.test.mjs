// The interiors' windows on the kit (Session 331, Michael's 2 on #53, by the room): shuttered timber (B) in homes, cabins and
// the poorer rooms; leaded casements (A) in the trades, inns, guilds and chapels; round-headed stone (C) for the tall windows
// of churches and keep halls. The painted view behind is a medieval place graded by the town's prosperity and nation.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const r = await page.evaluate(() => { const out = {};
  for (const type of ['home', 'cabin', 'cellar', 'inn', 'weapon', 'guild_f', 'chapel', 'church', 'castle']) {
    const house = { id: 'win_' + type, type, w: 7, d: 5, doorX: px, doorZ: pz, style: 'irish', reg: 'irish' };
    const sc = WORLD.buildInteriorFor(house), W = house.intW, D = house.intD; sc.updateMatrixWorld(true);
    let H = 0; sc.traverse(o => { if (o.isMesh && Math.abs(o.rotation.x - Math.PI / 2) < 1e-6 && o.geometry.type === 'PlaneGeometry') H = Math.max(H, o.position.y); });
    const bakes = sc.children.filter(o => o.userData.windows); const kinds = bakes.map(b => b.userData.windows).sort().join('');
    const panes = []; sc.traverse(o => { if (o.isMesh && o.material.isMeshBasicMaterial && (o.geometry.type === 'PlaneGeometry' || o.geometry.type === 'ShapeGeometry') && Math.abs(Math.abs(o.rotation.y) - Math.PI / 2) < 1e-6 && (o.position.x < .02 || o.position.x > W - .02)) panes.push(o); });
    let inside = true; for (const b of bakes) { const bb = new THREE.Box3().setFromObject(b); if (bb.min.x < -.05 || bb.max.x > W + .05 || bb.min.z < -.05 || bb.max.z > D + .05 || bb.min.y < 0 || bb.max.y > H + .01) inside = false; }
    out[type] = { kinds, tris: bakes.map(b => b.userData.tris), panes: panes.length, painted: panes.filter(p => p.material.map).length, arched: panes.filter(p => p.geometry.type === 'ShapeGeometry').length, inside, H: +H.toFixed(2), W, D }; }
  return out; });
console.log(JSON.stringify(r));
check('homes, cabins and cellars take the shuttered window (B)', ['home', 'cabin', 'cellar'].every(t => r[t].kinds === 'B'), ['home', 'cabin', 'cellar'].map(t => r[t].kinds));
check('the inn, a shop, a guild hall and a chapel take the leaded casement (A)', ['inn', 'weapon', 'guild_f', 'chapel'].every(t => r[t].kinds === 'A'), ['inn', 'weapon', 'guild_f', 'chapel'].map(t => r[t].kinds));
check('a church and a keep\'s hall: leaded low windows and round-headed stone tall ones (A and C), each tall pane an arch', ['church', 'castle'].every(t => r[t].kinds === 'AC' && r[t].arched >= 6), ['church', 'castle'].map(t => [r[t].kinds, r[t].arched]));
check('every room\'s frames are one bake a kind (a church two), 1–30k triangles, inside the walls and under the ceiling', Object.values(r).every(o => o.inside && o.tris.every(t => t > 1000 && t < 30000)), Object.fromEntries(Object.entries(r).map(([k, o]) => [k, [o.tris, o.inside, o.H]])));
check('the painted view is on every low pane but a church\'s (lit glass)', ['home', 'inn', 'weapon', 'castle'].every(t => r[t].painted >= 2 && r[t].painted === r[t].panes - r[t].arched) && r.church.painted === 0, Object.fromEntries(Object.entries(r).map(([k, o]) => [k, [o.panes, o.painted, o.arched]])));

// the view by the town: a poor village, a middling place and a rich city draw three different pictures; the room picks its own
const view = await page.evaluate(() => { const S = WORLD.SITES.filter(t => ['village', 'town', 'city', 'port'].includes(t.kind));
  const pick = f => S.find(t => f(WORLD.prosperity(t)));
  const out = {}; for (const [tier, f] of [[0, p => p < 35], [1, p => p >= 35 && p < 60], [2, p => p >= 60]]) { let t = pick(f);
    if (!t) { t = S[tier]; WORLD.setProsperity(t, [20, 50, 80][tier]); }
    const house = { id: 'winv_' + t.id, type: 'home', w: 7, d: 5, doorX: t.x, doorZ: t.z, siteId: t.id, style: 'irish', reg: 'irish' };
    const sc = WORLD.buildInteriorFor(house); let map = null; sc.traverse(o => { if (!map && o.isMesh && o.material.isMeshBasicMaterial && o.material.map && o.geometry.type === 'PlaneGeometry') map = o.material.map; });
    const nation = WORLD.nationKeyOf(...WORLD.cellOf(t.x, t.z));
    out[tier] = { site: t.id, p: WORLD.prosperity(t), nation, same: map === WORLD.windowView(tier, nation) }; }
  const a = WORLD.windowView(0, 'gatelands'), b = WORLD.windowView(1, 'gatelands'), c = WORLD.windowView(2, 'gatelands'), d = WORLD.windowView(2, 'aurenne');
  const px = tex => { const x = tex.image.getContext('2d').getImageData(0, 150, 256, 106).data; let s = 0; for (let i = 0; i < x.length; i += 4) s += x[i] * 3 + x[i + 1] * 5 + x[i + 2] * 7; return s; };
  out.distinct = new Set([px(a), px(b), px(c), px(d)]).size; return out; });
check('a room in a poor place, a middling one and a rich one each shows its own tier\'s view, drawn for its nation', [0, 1, 2].every(k => view[k].same), view);
check('the three tiers and a second nation are four different pictures', view.distinct === 4, view.distinct);

// the legacy builder's rooms (Hearthwick): the frames and the view there too
const leg = await page.evaluate(() => { const out = {}; for (const type of ['weapon', 'inn', 'church', 'castle']) { buildInterior({ id: 'legw_' + type, type, name: 'Test', keeper: '' });
    const b = interiorScene.children.filter(o => o.userData.windows); let painted = 0, arched = 0; interiorScene.traverse(o => { if (o.isMesh && o.material.map && o.material.isMeshBasicMaterial) painted++; if (o.isMesh && o.geometry.type === 'ShapeGeometry') arched++; });
    out[type] = { bakes: b.length, tris: b.map(x => x.userData.tris), painted, arched }; } return out; });
check('Hearthwick\'s rooms: one bake of frames each, the painted view in the shop and the inn, arched stone tops in the church and the keep', leg.weapon.bakes === 1 && leg.weapon.painted === 4 && leg.inn.painted === 4 && leg.church.arched === 6 && leg.castle.arched === 8 && leg.castle.painted === 8, leg);

// pictures: a home (B), an inn (A), a church (C), and the three views at day and at night
const shots = await page.evaluate(() => { const pics = [];
  const cv = REN.domElement; const snap = (sc, pos, look) => { const cam = new THREE.PerspectiveCamera(60, cv.width / cv.height, .05, 80); cam.position.set(...pos); cam.lookAt(...look); sc.updateMatrixWorld(true); REN.render(sc, cam); const o = document.createElement('canvas'); o.width = 640; o.height = 360; o.getContext('2d').drawImage(cv, 0, 0, 640, 360); return o; };
  const rich = WORLD.SITES.find(t => ['town', 'city', 'port'].includes(t.kind) && WORLD.prosperity(t) >= 60) || WORLD.SITES[0];
  for (const type of ['home', 'inn', 'church']) { const house = { id: 'winp_' + type, type, w: 7, d: 5, doorX: rich.x, doorZ: rich.z, siteId: rich.id, style: 'irish', reg: 'irish' };
    const sc = WORLD.buildInteriorFor(house), W = house.intW, D = house.intD; const z = type === 'church' ? 3 + Math.max(3, D / 4) : D * .3;
    pics.push(snap(sc, type === 'church' ? [W * .55, 2.2, z + 2.5] : [W * .55, 1.35, z + 1.6], type === 'church' ? [0, 2.6, z - .4] : [0, 1.3, z - .2])); }
  const views = document.createElement('canvas'); views.width = 640; views.height = 360; const vx = views.getContext('2d'); vx.fillStyle = '#222'; vx.fillRect(0, 0, 640, 360);
  const keep = forceTime; const t0 = worldState.gameTimeMinutes;
  [[12, 0], [22, 1]].forEach(([h, row]) => { worldState.gameTimeMinutes = h * 60; for (let k = 0; k < 3; k++) { const tex = WORLD.windowView(k, ['gatelands', 'mark', 'aurenne'][k]); vx.drawImage(tex.image, 16 + k * 208, 8 + row * 176, 160, 160); } });
  worldState.gameTimeMinutes = t0; pics.push(views);
  const c = document.createElement('canvas'); c.width = 1280; c.height = 720; const x = c.getContext('2d'); pics.forEach((o, i) => x.drawImage(o, (i % 2) * 640, Math.floor(i / 2) * 360)); return c.toDataURL(); });
fs.writeFileSync('tests/out/windows-ingame.png', Buffer.from(shots.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
