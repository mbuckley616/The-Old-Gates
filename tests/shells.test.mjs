// The interiors' shells on the kit (Session 342, Michael's A on #62): in the generated rooms a boarded ceiling over joists,
// rounded beams, walls shaded at the foot, the head and the corners; in plastered rooms posts, knee braces, a sole plate and a
// wall plate (Aurenne's close studding on the kit); in stone and rubble rooms a plinth and stepped corbels; a plank door at
// the entrance. Churches, keep halls and the tower keep today's shell.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const r = await page.evaluate(() => { const out = {};
  const rooms = [['home', 'irish'], ['home', 'french'], ['home', 'anglo'], ['home', 'stone'], ['inn', 'irish'], ['weapon', 'irish'], ['potion', 'french'], ['misc', 'anglo'],
    ['guild_f', 'stone'], ['cabin', 'irish'], ['cellar', 'irish'], ['home2', 'irish'], ['church', 'irish'], ['castle', 'stone']];
  for (const [t, style] of rooms) { const two = t === 'home2', type = two ? 'home' : t;
    const house = { id: 'shell_' + t + style, type, w: 7, d: 5, two, doorX: px, doorZ: pz, style, reg: style === 'stone' ? 'irish' : style };
    const sc = WORLD.buildInteriorFor(house), W = house.intW, D = house.intD; sc.updateMatrixWorld(true);
    let H = 0, ceilTex = false; sc.traverse(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && Math.abs(o.rotation.x - Math.PI / 2) < 1e-6 && o.position.y > H) { H = o.position.y; ceilTex = !!o.material.map; } });
    const shell = sc.children.find(o => o.userData.shell), door = sc.children.find(o => o.userData.entrance);
    const oldDoor = sc.children.some(o => o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width === .9 && o.geometry.parameters.height === 1.4);
    const oldBeams = sc.children.filter(o => o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width === W && o.geometry.parameters.height === .16 && o.geometry.parameters.depth === .22).length;
    const shaded = sc.children.filter(o => o.userData.shaded && o.material.vertexColors).length;
    let inside = null; if (shell) { const bb = new THREE.Box3().setFromObject(shell); inside = bb.min.x > -.02 && bb.max.x < W + .02 && bb.min.z > -.02 && bb.max.z < D + .02 && bb.min.y > -.02 && bb.max.y < H + .02; }
    let doorAt = null; if (door) { const bb = new THREE.Box3().setFromObject(door); doorAt = [+((bb.min.x + bb.max.x) / 2 - W / 2).toFixed(2), +(bb.min.z - D).toFixed(2), +bb.max.y.toFixed(2)]; }
    const posts = INT_SOL.filter(q => q.post), others = INT_SOL.filter(q => !q.post);
    const clash = posts.filter(p => others.some(q => q.x0 < p.x1 && q.x1 > p.x0 && q.z0 < p.z1 && q.z1 > p.z0)).length;
    const wins = []; for (let z = D * .3; z < D * .9; z += Math.max(3, D * .3)) wins.push(z);
    const inWin = posts.filter(p => (p.x0 < 1 || p.x1 > W - 1) && p.z0 > .5 && p.z1 < D - .5 && wins.some(z => Math.abs((p.z0 + p.z1) / 2 - z) < .6)).length;
    const tall = []; sc.traverse(o => { if (o.isMesh && o.geometry.type === 'ShapeGeometry') tall.push(o.position); });
    let corbelClash = 0; if (shell && tall.length) shell.traverse(m => { if (!m.isMesh) return; const pos = m.geometry.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld); const x = v.x, y = v.y, z = v.z; if ((x < .45 || x > W - .45) && y > H - 1 && y < H - .35 && tall.some(p => Math.abs(p.z - z) < .6)) corbelClash++; } });
    const doorway = posts.filter(p => p.z1 > D - .5 && Math.abs((p.x0 + p.x1) / 2 - W / 2) < 1.0).length;
    out[t + '-' + style] = { W, D, H: +H.toFixed(2), tris: shell && shell.userData.tris, doorTris: door && door.userData.tris, posts: posts.length, corbelClash, stone: shell && shell.userData.shell.stone,
      clash, inWin, doorway, inside, doorAt, oldDoor, oldBeams, shaded, ceilTex }; }
  return out; });
console.log(JSON.stringify(r));
const kit = Object.keys(r);
check('every generated room has the kit shell and the plank door, and no box door or box beams (the church and the keep\'s hall since Session 344)', kit.every(k => r[k].tris > 0 && r[k].doorTris > 0 && !r[k].oldDoor && r[k].oldBeams === 0), Object.fromEntries(kit.map(k => [k, [r[k].tris, r[k].doorTris, r[k].oldDoor, r[k].oldBeams]])));
check('the church and the keep\'s hall are stone rooms with the larger door (2.3 tall with its head)', ['church-irish', 'castle-stone'].every(k => r[k].stone && r[k].doorAt[2] > 2.4 && r[k].doorAt[2] < 2.7), [r['church-irish'], r['castle-stone']]);
check('the four walls are shaded in their vertex colours and the ceiling is boarded', kit.every(k => r[k].shaded === 4 && r[k].ceilTex), Object.fromEntries(kit.map(k => [k, [r[k].shaded, r[k].ceilTex]])));
const plaster = kit.filter(k => !r[k].stone), stone = kit.filter(k => r[k].stone);
check('plastered rooms stand on posts (Aurenne\'s close-studded ones on more); stone and rubble rooms have none', plaster.every(k => r[k].posts >= 4) && stone.every(k => r[k].posts === 0) && r['home-french'].posts > r['home-irish'].posts && stone.length >= 4, Object.fromEntries(kit.map(k => [k, r[k].posts])));
check('no post stands in anything solid, in front of a window or in the entrance', kit.every(k => r[k].clash === 0 && r[k].inWin === 0 && r[k].doorway === 0), Object.fromEntries(kit.map(k => [k, [r[k].clash, r[k].inWin, r[k].doorway]])));
check('in the church and the keep\'s hall no corbel sits over a tall window', r['church-irish'].corbelClash === 0 && r['castle-stone'].corbelClash === 0, [r['church-irish'].corbelClash, r['castle-stone'].corbelClash]);
check('the shell lies inside the walls and under the ceiling; the door is centred on the south wall, 1.5 tall with its head', kit.every(k => r[k].inside && Math.abs(r[k].doorAt[0]) < .05 && r[k].doorAt[1] > -.3 && r[k].doorAt[1] < 0 && (r[k].doorAt[2] > 1.55 && r[k].doorAt[2] < 1.75 || /church|castle/.test(k))), Object.fromEntries(kit.map(k => [k, [r[k].inside, r[k].doorAt]])));
check('the shell costs 2–25k triangles a room and the door under 3k', kit.every(k => r[k].tris > 2000 && r[k].tris < 25000 && r[k].doorTris < 3000), Object.fromEntries(kit.map(k => [k, [r[k].tris, r[k].doorTris]])));

// a post is a solid: walking along the west wall of a home stops at it
const walk = await page.evaluate(() => { const house = { id: 'g_shellwalk_1', type: 'home', w: 7, d: 5, doorX: px, doorZ: pz, style: 'irish', reg: 'irish' };
  WORLD.buildInteriorFor(house); const p = INT_SOL.find(q => q.post && q.x0 < .1 && q.z0 > 1);
  const j0 = jumpY; jumpY = 0; const res = { post: p && [p.x0, p.z0], blocked: p ? intSolidAt(.3, (p.z0 + p.z1) / 2, .3) : null, free: intSolidAt(1.5, 1.5, .3) }; jumpY = j0; return res; });
check('a post blocks the player at the wall; the middle of the room is free', walk.blocked === true && walk.free === false, walk);

// pictures: today's shell beside the kit's is in docs/prototypes/shells-*.png; here the four homes, the inn and the smithy
const shot = await page.evaluate(() => { const cv = REN.domElement, pics = [];
  for (const [type, style] of [['home', 'irish'], ['home', 'french'], ['home', 'anglo'], ['home', 'stone'], ['inn', 'irish'], ['weapon', 'irish'], ['church', 'irish'], ['castle', 'stone']]) {
    const house = { id: 'shellp_' + type + style, type, w: 7, d: 5, doorX: px, doorZ: pz, style, reg: style === 'stone' ? 'irish' : style };
    const sc = WORLD.buildInteriorFor(house), W = house.intW, D = house.intD;
    const views = type === 'church' || type === 'castle' ? [[[W * .5, 1.6, D - 1.2], [W * .5, 2.6, 0]], [[W * .5, 1.6, D * .3], [W * .5, 1.8, D]]] : type === 'home' ? [[[W * .55, 1.0, D - 1.0], [W * .15, 1.3, D * .2]], [[W * .5, 1.05, D * .35], [W * .5, 1.0, D]]] : [[[W * .85, 1.1, D * .5], [0, 1.5, D * .12]], [[W * .15, 1.1, D * .5], [W, 1.5, D * .12]]];
    for (const [pos, look] of views) {
      const cam = new THREE.PerspectiveCamera(60, cv.width / cv.height, .05, 80); cam.position.set(...pos); cam.lookAt(...look); sc.updateMatrixWorld(true); REN.render(sc, cam);
      const o = document.createElement('canvas'); o.width = 480; o.height = 270; const x = o.getContext('2d'); x.drawImage(cv, 0, 0, 480, 270); x.fillStyle = '#000a'; x.fillRect(0, 0, 150, 24); x.fillStyle = '#fff'; x.font = 'bold 16px serif'; x.fillText(type + ' ' + style, 6, 17); pics.push(o); } }
  const c = document.createElement('canvas'); c.width = 960; c.height = 270 * 8; const x = c.getContext('2d'); pics.forEach((o, i) => x.drawImage(o, (i % 2) * 480, Math.floor(i / 2) * 270)); return c.toDataURL(); });
fs.writeFileSync('tests/out/shells-ingame.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
