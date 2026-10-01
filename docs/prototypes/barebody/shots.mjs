// Prototype (Session 381, H): what the player's body wears with the chest, legs and feet slots empty, owed since Session 174
// (every slot may be empty; the body still wore the creator's tunic, breeches and boots). Built on tpBuild with the look's
// colours overridden for the shot (and, for B, the sleeves given the skin's colour); no game code changes.
// Run from the repo root: node docs/prototypes/barebody/shots.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  for (const k of ['chest', 'legs', 'feet', 'head', 'hands', 'weapon', 'offhand']) EQ[k] = null;
  const cv = REN.domElement, W = cv.width, H = cv.height;
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x8a9aa8);
  sc.add(new THREE.HemisphereLight(0xdfe8f0, 0x6a5a48, .9)); const sun = new THREE.DirectionalLight(0xfff2e0, .8); sun.position.set(2, 4, 3); sc.add(sun);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshLambertMaterial({ color: 0x6a6a52 })); floor.rotation.x = -Math.PI / 2; sc.add(floor);
  const cam = new THREE.PerspectiveCamera(30, W / H, .1, 50);
  const linen = 0xa89c80, keepName = playerName;
  const look0 = lookNow() || lookDefault(WORLD.playerPeople(), playerArchetype, playerName);
  const build = (name, opt) => { playerName = name; const L = Object.assign({}, look0, lookDefault(WORLD.playerPeople(), playerArchetype, name), { skin: look0.skin, hair: look0.hair, style: name === 'Aodh' ? 'short' : 'long', beard: name === 'Aodh' ? 'trimmed' : 'none' });
    if (opt !== 'today') { L.tunic = linen; L.breeches = new THREE.Color(linen).multiplyScalar(.93).getHex(); L.boots = L.skin; }
    const real = buildPerson; if (opt === 'B') buildPerson = (gg, o) => { gg.sleeve = gg.skin.clone(); gg.dress = false; return real(gg, o); };
    else if (opt !== 'today') buildPerson = (gg, o) => { gg.dress = false; return real(gg, o); };
    let R; try { R = tpBuild(L); } finally { buildPerson = real; } return R; };
  const opts = ['today', 'B', 'C'], names = [['Aodh', 'a man'], ['Brídín', 'a woman']], tiles = [], info = {};
  for (const [nm, who] of names) for (const opt of opts) {
    const R = build(nm, opt); const root = R.root; root.position.set(0, 0, 0); root.rotation.y = 0; sc.add(root); root.updateMatrixWorld(true);
    info[nm] = R.rig.g ? R.rig.g.female : (R.rig.genome && R.rig.genome.female);
    const bb = new THREE.Box3().setFromObject(root), h = bb.max.y - bb.min.y;
    const t = document.createElement('canvas'); t.width = W * .5; t.height = H * .5; const x = t.getContext('2d');
    for (const [i, a] of [[0, .35], [1, 2.6]]) { cam.position.set(Math.sin(a) * h * 2.6, h * .55, Math.cos(a) * h * 2.6); cam.lookAt(0, h * .5, 0); cam.aspect = W / H; cam.updateProjectionMatrix();
      REN.render(sc, cam); x.drawImage(cv, W * .3, 0, W * .4, H, i * t.width / 2, 0, t.width / 2, t.height); }
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, 230, 24); x.fillStyle = '#f0e6c8'; x.font = '15px serif'; x.fillText(`${opt === 'today' ? 'today' : opt} — ${who}`, 8, 17);
    tiles.push(t); sc.remove(root); }
  playerName = keepName;
  const c = document.createElement('canvas'), tw = tiles[0].width, th = tiles[0].height; c.width = tw * 3; c.height = th * 2; tiles.forEach((t, i) => c.getContext('2d').drawImage(t, (i % 3) * tw, Math.floor(i / 3) * th));
  return { shot: c.toDataURL(), info }; });
fs.writeFileSync('docs/prototypes/barebody-grid.png', Buffer.from(r.shot.split(',')[1], 'base64'));
console.log(JSON.stringify(r.info), g.errs);
await g.close();
