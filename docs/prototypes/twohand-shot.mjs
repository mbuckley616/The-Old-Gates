// node docs/prototypes/twohand-shot.mjs -> docs/prototypes/twohand-ingame.png (Session 247): the player with a claymore in
// third person, the build before (tests/tmp/twohand-before.html, from git) above and this build below: at rest, blocking,
// and at three moments of an overhead chop.
import { boot } from '../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..');
const rows = [];
for (const src of [path.join(ROOT, 'tests', 'tmp', 'twohand-before.html'), path.join(ROOT, 'index.html')]) {
  const g = await boot({ src }); const { page } = g; await g.intoWorld();
  rows.push(await page.evaluate(() => {
    forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height; const bx = px + 300, bz = pz, y0 = 60, objs = [];
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshLambertMaterial({ color: 0x3a3430 })); scene.add(bg); objs.push(bg);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ color: 0x4a4238 })); fl.rotation.x = -Math.PI / 2; fl.position.set(bx, y0, bz); scene.add(fl); objs.push(fl);
    const Lt = new THREE.PointLight(0xfff0d8, 1.1, 14); scene.add(Lt); objs.push(Lt);
    const cam = new THREE.PerspectiveCamera(30, W / H, .05, 100);
    thirdPerson = true; yaw = 0; EQ.weapon = { name: 'Claymore', slot: 'weapon', weaponShape: 'claymore', weight: 7, twoHand: true }; EQ.offhand = null;
    tpUpdate(1 / 60, { moving: false, sprinting: false, camY: 1.6, now: performance.now() }); const R = TP.rig;
    R.root.position.set(bx, y0, bz); R.root.rotation.y = Math.PI; R.root.visible = true;
    const ca = Math.PI - .7; cam.position.set(bx + Math.sin(ca) * 3.4, y0 + 1.15, bz + Math.cos(ca) * 3.4); cam.lookAt(bx, y0 + .9, bz);
    bg.position.set(bx - Math.sin(ca) * 3, y0 + 5, bz - Math.cos(ca) * 3); bg.lookAt(cam.position); Lt.position.set(cam.position.x, y0 + 2.6, cam.position.z);
    const st = { moving: false, sprinting: false, camY: 1.6, now: 0 }, dt = 1 / 60, TW = 300, TH = 380, tiles = [];
    const shoot = () => { scene.updateMatrixWorld(true); REN.render(scene, cam); const o = document.createElement('canvas'); o.width = TW; o.height = TH; const sw = H * TW / TH; o.getContext('2d').drawImage(cv, W / 2 - sw / 2, 0, sw, H, 0, 0, TW, TH); tiles.push(o); };
    const tick = n => { for (let i = 0; i < n; i++) { st.now += 16; tpPose(R, dt, st); if (swingT > 0) swingT = Math.max(1e-4, swingT - dt); } };
    swingT = 0; tick(40); shoot(); blocking = true; tick(30); shoot(); blocking = false; tick(30);
    const dur = ANIM_PARAMS.swing.normalDur; swingT = dur; vmSword.userData.swingMax = dur; vmSword.userData.swingVariant = 2; vmSword.userData.swingIsPower = false; TP.swMax = 0;
    for (const p of [.3, .5, .75]) { while (1 - swingT / dur < p) tick(1); shoot(); }
    swingT = 0; objs.forEach(o => scene.remove(o));
    const c = document.createElement('canvas'); c.width = TW * tiles.length; c.height = TH; const x = c.getContext('2d'); tiles.forEach((o, i) => x.drawImage(o, i * TW, 0)); return c.toDataURL(); }));
  if (rows.length === 2) { const png = await page.evaluate(async rows => {
      const im = await Promise.all(rows.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
      const c = document.createElement('canvas'); c.width = im[0].width; c.height = im[0].height * 2 + 30; const x = c.getContext('2d'); x.fillStyle = '#1a1612'; x.fillRect(0, 0, c.width, c.height);
      x.font = '18px serif'; x.fillStyle = '#e8dcc0'; ['at rest', 'blocking', 'chop .30', 'chop .50', 'chop .75'].forEach((n, i) => x.fillText(n, i * 300 + 8, 21));
      im.forEach((m, i) => { x.drawImage(m, 0, 30 + i * m.height); x.fillStyle = '#e8dcc0'; x.fillText(i ? 'this build' : 'before', 8, 30 + i * m.height + m.height - 10); }); return c.toDataURL(); }, rows);
    fs.writeFileSync(path.join(here, 'twohand-ingame.png'), Buffer.from(png.split(',')[1], 'base64')); }
  console.log('errors', g.errs); await g.close(); }
