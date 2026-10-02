// node docs/prototypes/foearmour/ingame.mjs -> docs/prototypes/foearmour-ingame.png (Session 403, H): the four helmed foes as
// the game now builds them (Michael's B on #94), with plain buildFoe; the row above is today's build before the change,
// built by taking each foe's kit off FOE_DRESS for that call.
// Should the helmed foes wear the armour kit (Session 384) as the player and the guards (Session 395) now do? Changes no game
// code: builds each foe with buildFoe as the zones do, and for B wraps buildPerson for that one call to set g.eq.armour and
// g.hat as tpBuild does for the player. A is today: the people's bowl helm over cloth.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, '..');
const g = await boot(); const { page } = g;
await g.intoWorld();
const out = await page.evaluate(() => {
  forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height, bx = px + 300, bz = pz, y0 = 60, objs = [];
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), new THREE.MeshLambertMaterial({ color: 0x5a544c })); bg.position.set(bx, y0 + 4, bz - 2.2); scene.add(bg); objs.push(bg);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshLambertMaterial({ color: 0x4a4238 })); fl.rotation.x = -Math.PI / 2; fl.position.set(bx, y0, bz); scene.add(fl); objs.push(fl);
  const Lt = new THREE.PointLight(0xfff0d8, .35, 30); Lt.position.set(bx + 2, y0 + 4, bz + 6); scene.add(Lt); objs.push(Lt);
  const piece = (t, metal) => { const m = MATERIALS[t - 1]; return { tier: t, fam: AR_FAM[t], sig: null, metal: metal != null ? metal : m.blade, guard: m.guard, glow: null }; };
  // B: what each foe's story would put on him
  const KIT = {
    'Deserter': { head: piece(3), chest: piece(3), hands: null, legs: null, feet: null },                 // his old army's mail and nasal helm
    'Bandit Captain': { head: piece(3), chest: piece(1), hands: piece(1), legs: null, feet: null },       // pieced from loot: lamellar, an iron helm
    'Shieldbearer': { head: piece(4), chest: piece(4), hands: piece(3), legs: piece(3), feet: null },     // the dungeon's shield wall: plate over mail
    'Ash Wight': { head: piece(3, 0x4a3e34), chest: piece(3, 0x4a3e34), hands: null, legs: piece(3, 0x4a3e34), feet: null } // the dead's mail, rusted black as their blades
  };
  const FOES = ['Deserter', 'Bandit Captain', 'Shieldbearer', 'Ash Wight'], xs = [-2.4, -.8, .8, 2.4];
  const stats = {}, rows = [], rigs = [];
  const build = (mode, type, x) => { const real = buildPerson;
    const kit = FOE_DRESS[type].kit; if (mode === 'A') FOE_DRESS[type].kit = null;
    let r; try { r = buildFoe(type, 9000 + x * 10, 9000, null, type === 'Ash Wight' ? 0xff6020 : null); } finally { buildPerson = real; FOE_DRESS[type].kit = kit; }
    r.root.position.set(bx + x, y0, bz); r.root.rotation.y = .25; scene.add(r.root); r.root.visible = true; rigs.push(r);
    stats[mode + ' ' + type] = { tris: r.tris, trisLo: r.trisLo }; return r; };
  const cam = new THREE.PerspectiveCamera(22, W / H, .05, 200);
  const snap = () => { for (let f = 0; f < 3; f++) tickPeople(1 / 60, 1e7 + f * 16); cam.position.set(bx, y0 + .8, bz + 9.4); cam.lookAt(bx, y0 + .56, bz); scene.updateMatrixWorld(true); REN.render(scene, cam);
    const o = document.createElement('canvas'); o.width = W; o.height = Math.round(H * .5); o.getContext('2d').drawImage(cv, 0, H * .26, W, H * .5, 0, 0, W, o.height); return o; };
  for (const mode of ['A', 'B']) { FOES.forEach((t, i) => build(mode, t, xs[i])); rows.push(snap());
    rigs.splice(0).forEach(r => { scene.remove(r.root); PEOPLE_RIGS.delete(r); r.mesh.geometry.dispose(); if (r.geoLo) r.geoLo.dispose(); }); }
  const labels = ['before: Deserter, Bandit Captain, Shieldbearer, Ash Wight in the bowl helm over cloth', 'in the game now (B on #94): mail, looted lamellar under an iron helm, plate over mail, rusted mail'];
  const c = document.createElement('canvas'); c.width = W; const rh = rows[0].height; c.height = rows.length * (rh + 28); const x = c.getContext('2d'); x.fillStyle = '#1a1612'; x.fillRect(0, 0, c.width, c.height);
  rows.forEach((o, i) => { x.font = '17px Georgia, serif'; x.fillStyle = '#e8dcc0'; x.fillText(labels[i], 10, i * (rh + 28) + 20); x.drawImage(o, 0, i * (rh + 28) + 28); });
  objs.forEach(o => scene.remove(o)); return { png: c.toDataURL(), stats }; });
fs.writeFileSync(path.join(OUT, 'foearmour-ingame.png'), Buffer.from(out.png.split(',')[1], 'base64'));
console.log(JSON.stringify(out.stats)); console.log('errors', g.errs); await g.close();
