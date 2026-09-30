// The ships' sails trimmed to the world's wind (Session 330, Michael's 1 on #57): each mast's yards and sails, each gaff
// with its boom, and the jib are children of the hull that turn on the mast; every ship afloat braces to one wind, which
// wanders with the clock, and eases round when it turns.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

// the rigs per class, and no triangles added: hull plus rigs is the one bake's count before the split
const rigs = await page.evaluate(() => { const out = {};
  for (const [k, L, W] of [['sloop', 13, 4.4], ['cog', 17, 5.6], ['galleon', 22, 7.0]]) { const m = WORLD.buildShipMesh(L, W, 'player');
    const tri = gm => (gm.index ? gm.index.count : gm.attributes.position.count) / 3;
    out[k] = { kind: m.userData.kind, types: m.userData.rigs.map(q => q.type).join(','), hull: tri(m.geometry), rigs: m.userData.rigs.reduce((a, q) => a + tri(q.m.geometry), 0), children: m.children.length }; }
  return out; });
check('the sloop has a gaff and a jib, the cog one square rig, the galleon two square masts and a gaff mizzen',
  rigs.sloop.types === 'gaff,jib' && rigs.cog.types === 'square' && rigs.galleon.types === 'square,square,gaff', rigs);
check('a ship is still 4.3–7k triangles all told (the prototype\'s 4.6–6.0k, Session 165), the rigs 100–1,000 of them', ['sloop', 'cog', 'galleon'].every(k => { const t = rigs[k].hull + rigs[k].rigs; return t > 4300 && t < 7000 && rigs[k].rigs > 100 && rigs[k].rigs < 1000; }), rigs);

// two ships at sea, one wind: after two seconds each rig sits where the rule puts it for the wind against its own heading
const sea = await page.evaluate(() => {
  let sx = null, sz = null; for (let r = 30; r < 2000 && sx === null; r += 30) for (let a = 0; a < 6.28; a += .3) { const x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r; if (WORLD.worldH(x, z) < -4 && WORLD.worldH(x + 30, z) < -4 && WORLD.worldH(x - 30, z) < -4 && WORLD.worldH(x, z + 30) < -4 && WORLD.worldH(x, z - 30) < -4) { sx = x; sz = z; break; } }
  if (sx === null) return null; window._O = [WORLD.spawnOtherShip('merchant', sx, sz), WORLD.spawnOtherShip('pirate', sx + 40, sz)];
  // each holds its heading (a far waypoint dead ahead), so what the rig lags behind is the wind, not a turn
  for (const o of _O) o.wp = { x: o.x - Math.sin(o.yaw) * 5000, z: o.z - Math.cos(o.yaw) * 5000 }; return [Math.round(sx), Math.round(sz)]; });
check('found open water for two ships', !!sea, sea);
const rule = () => page.evaluate(() => { const w = WORLD.windDir(), res = [];
  for (const o of _O) { const m = o.mesh, th0 = w - m.rotation.y, th = Math.atan2(Math.sin(th0), Math.cos(th0)), side = Math.sin(th) >= 0 ? 1 : -1;
    for (const q of m.userData.rigs) { const wr = a => Math.atan2(Math.sin(a), Math.cos(a)); const want = q.type === 'square' ? Math.max(-.61, Math.min(.61, th / 2)) : q.type === 'gaff' ? -side * Math.max(.26, Math.min(1.25, (Math.PI - Math.abs(th)) / 2)) : q.type === 'flag' ? wr(th + Math.PI) : 0;
      // the boom's far end in the hull's frame: on the side the wind blows towards (leeward) is positive
      let lee = null; if (q.type === 'gaff') { m.updateMatrixWorld(true); const v = new THREE.Vector3(0, 0, -3); q.m.localToWorld(v); m.worldToLocal(v); lee = +(v.x * Math.sin(th)).toFixed(2); }
      // a flag's fly end, in the world, along the wind from its pole: downwind is positive
      let down = null; if (q.type === 'flag') { m.updateMatrixWorld(true); const a = new THREE.Vector3(0, 0, -1.5), b = new THREE.Vector3(0, 0, 0); q.m.localToWorld(a); q.m.localToWorld(b); down = +((a.x - b.x) * Math.sin(w) + (a.z - b.z) * Math.cos(w)).toFixed(2); }
      res.push({ kind: o.kind, type: q.type, want: +want.toFixed(3), got: +(q.type === 'flag' ? wr(q.m.rotation.y) : q.m.rotation.y).toFixed(3), th: +th.toFixed(2), lee, down }); } }
  return { w: +w.toFixed(3), res }; });
await g.spin(null, 120);
const r1 = await rule();
check('every rig on both ships sits at the rule\'s trim for the wind against its heading (within .02 rad)', r1.res.every(q => Math.abs(Math.atan2(Math.sin(q.want - q.got), Math.cos(q.want - q.got))) < .02), r1);
check('square yards brace no more than 35°', r1.res.filter(q => q.type === 'square').every(q => Math.abs(q.got) <= .611), r1.res);
check('the black sail\'s flag streams downwind (its fly end 1.4 along the wind from the pole)', r1.res.some(q => q.type === 'flag') && r1.res.filter(q => q.type === 'flag').every(q => q.down > 1.3), r1.res.filter(q => q.type === 'flag'));
check('a gaff\'s boom lies to leeward', r1.res.filter(q => q.type === 'gaff').every(q => q.lee > 0 || Math.abs(q.th) > 3.1), r1.res);

// the wind wanders with the clock: seven game hours later it has swung, the sails ease round (not at once) and settle
const wind = await page.evaluate(() => { const w0 = WORLD.windDir(); worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes || 0) + 7 * 60; const w1 = WORLD.windDir();
  const ws = []; for (let h = 0; h < 48; h++) { worldState.gameTimeAbsMinutes += 60; ws.push(WORLD.windDir()); } worldState.gameTimeAbsMinutes -= 48 * 60;
  let step = 0; for (let i = 1; i < ws.length; i++) step = Math.max(step, Math.abs(ws[i] - ws[i - 1]));
  return { w0: +w0.toFixed(2), w1: +w1.toFixed(2), span: +(Math.max(...ws) - Math.min(...ws)).toFixed(2), maxHourStep: +step.toFixed(2) }; });
check('seven game hours on, the wind has moved (by over 15°); over two days it wanders more than 60°, never more than 40° in an hour', Math.abs(wind.w1 - wind.w0) > .26 && wind.span > 1.05 && wind.maxHourStep < .7, wind);
await g.spin(null, 6);
const mid = await rule();
check('a tenth of a second after the swing, the sails are still easing round', mid.res.some(q => Math.abs(Math.atan2(Math.sin(q.want - q.got), Math.cos(q.want - q.got))) > .05), mid.res.map(q => [q.want, q.got]));
await g.spin(null, 240);
const r2 = await rule();
check('four seconds on, they have settled to the new wind', r2.res.every(q => Math.abs(Math.atan2(Math.sin(q.want - q.got), Math.cos(q.want - q.got))) < .02), r2.res.map(q => [q.want, q.got]));

// a storm gusts: the wind shakes by a few degrees over seconds, in clear weather it does not
const gust = await page.evaluate(() => { const samp = () => { const a = []; for (let i = 0; i < 40; i++) { worldState.gameTimeAbsMinutes += 1 / 20; WORLD.tick(1 / 20, performance.now()); a.push(WORLD.windDir()); } return +(Math.max(...a) - Math.min(...a)).toFixed(3); };
  const wx = WORLD.wx; wx.type = wx.next = 'clear'; wx.k = 1; const clear = samp(); wx.type = wx.next = 'storm'; const storm = samp(); wx.type = wx.next = 'clear'; WORLD.tick(1 / 20, performance.now()); return { clear, storm }; });
check('in a storm the wind gusts by 10–40° over two seconds; in clear weather under 3°', gust.storm > .17 && gust.storm < .7 && gust.clear < .05, gust);

// the picture: the merchantman and the black sail from above and astern, with the wind's arrow
const shot = await page.evaluate(() => new Promise(res => { const w = WORLD.windDir(), S = WORLD.scene, cv = REN.domElement, out = [];
  const A = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: 0xffffff }); const sh = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 8, 8), mat); sh.rotation.x = Math.PI / 2; A.add(sh);
  const hd = new THREE.Mesh(new THREE.ConeGeometry(.9, 2.2, 10), mat); hd.rotation.x = Math.PI / 2; hd.position.z = 5; A.add(hd); A.rotation.y = w; S.add(A);
  for (const o of _O) { const m = o.mesh, p = m.position; A.position.set(p.x - Math.sin(w) * 14, p.y + 16, p.z - Math.cos(w) * 14);
    for (const view of ['plan', 'quarter']) { const cam = new THREE.PerspectiveCamera(42, cv.width / cv.height, .5, 600);
      if (view === 'plan') { cam.up.set(Math.sin(m.rotation.y), 0, Math.cos(m.rotation.y)); cam.position.set(p.x, p.y + 34, p.z); cam.lookAt(p.x, p.y, p.z + .001); }
      else { const ry = m.rotation.y, c = Math.cos(ry), s = Math.sin(ry), lx = 16, lz = -20; cam.position.set(p.x + lx * c + lz * s, p.y + 14, p.z - lx * s + lz * c); cam.lookAt(p.x, p.y + 6, p.z); }
      REN.render(S, cam); const o2 = document.createElement('canvas'); o2.width = 640; o2.height = 360; const x = o2.getContext('2d'); x.drawImage(cv, 0, 0, 640, 360);
      x.font = '20px Georgia'; x.fillStyle = '#fff'; x.fillText((o.kind === 'pirate' ? 'the black sail' : 'the merchantman') + ' — ' + view, 12, 28); out.push(o2); } }
  S.remove(A); const c = document.createElement('canvas'); c.width = 1280; c.height = 720; const x = c.getContext('2d'); out.forEach((o, i) => x.drawImage(o, (i % 2) * 640, Math.floor(i / 2) * 360)); res(c.toDataURL()); }));
fs.writeFileSync('tests/out/sailtrim-ingame.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
