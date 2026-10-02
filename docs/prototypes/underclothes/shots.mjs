// Session 394, H: the underclothes as built (Michael's B on #83): a man and a woman, the starting kit and every slot empty,
// front and back. Run from the repo root: node docs/prototypes/underclothes/shots.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const keep = {}; for (const k in EQ) keep[k] = EQ[k];
  const cv = REN.domElement, W = cv.width, H = cv.height;
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x8a9aa8);
  sc.add(new THREE.HemisphereLight(0xdfe8f0, 0x6a5a48, .9)); const sun = new THREE.DirectionalLight(0xfff2e0, .8); sun.position.set(2, 4, 3); sc.add(sun);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshLambertMaterial({ color: 0x6a6a52 })); floor.rotation.x = -Math.PI / 2; sc.add(floor);
  const cam = new THREE.PerspectiveCamera(30, W / H, .1, 50); const keepName = playerName;
  const look0 = lookNow() || lookDefault(WORLD.playerPeople(), playerArchetype, playerName);
  const tiles = [];
  for (const [nm, who] of [['Aodh', 'a man'], ['Brídín', 'a woman']]) for (const opt of ['starting kit', 'all slots empty']) {
    playerName = nm; for (const k of Object.keys(EQ)) EQ[k] = null;
    if (opt === 'starting kit') { EQ.chest = { name: 'Tattered Tunic' }; EQ.legs = { name: 'Worn Breeches' }; EQ.feet = { name: 'Leather Boots' }; }
    const L = Object.assign({}, look0, { style: nm === 'Aodh' ? 'short' : 'long', beard: nm === 'Aodh' ? 'short' : 'no' });
    const R = tpBuild(L), root = R.root; root.position.set(0, 0, 0); sc.add(root); root.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(root), h = bb.max.y - bb.min.y;
    const t = document.createElement('canvas'); t.width = W * .5; t.height = H * .5; const x = t.getContext('2d');
    for (const [i, a] of [[0, .35], [1, 2.6]]) { cam.position.set(Math.sin(a) * h * 2.6, h * .55, Math.cos(a) * h * 2.6); cam.lookAt(0, h * .5, 0); cam.aspect = W / H; cam.updateProjectionMatrix();
      REN.render(sc, cam); x.drawImage(cv, W * .3, 0, W * .4, H, i * t.width / 2, 0, t.width / 2, t.height); }
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, 260, 24); x.fillStyle = '#f0e6c8'; x.font = '15px serif'; x.fillText(`${opt} — ${who}`, 8, 17);
    tiles.push(t); sc.remove(root); tpDispose(R); }
  playerName = keepName; for (const k in keep) EQ[k] = keep[k];
  const c = document.createElement('canvas'), tw = tiles[0].width, th = tiles[0].height; c.width = tw * 2; c.height = th * 2; tiles.forEach((t, i) => c.getContext('2d').drawImage(t, (i % 2) * tw, Math.floor(i / 2) * th));
  return c.toDataURL(); });
fs.writeFileSync('docs/prototypes/underclothes-ingame.png', Buffer.from(r.split(',')[1], 'base64'));
console.log(g.errs);
await g.close();
