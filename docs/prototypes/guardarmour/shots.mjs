// node docs/prototypes/guardarmour/shots.mjs -> docs/prototypes/guardarmour-grid.png, guardarmour-stats.json
// Should the town guards wear the worn armour kit (Session 384) too? Changes no game code: builds guard genomes as the
// towns do (personGenome, role 'guard'), and for the options sets g.eq.armour and g.hat as tpBuild does for the player.
// Today: the people's helm and coat. B: every guard in Iron mail and the nasal helm. C: by the town's wealth — lamellar
// (Wooden) in a poor town, mail (Iron) in a middling one, Steel plate for a captain.
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
  const piece = t => { const m = MATERIALS[t - 1]; return { tier: t, fam: AR_FAM[t], sig: AR_SIG[t], metal: m.blade, guard: m.guard, glow: m.glow }; };
  const kit = t => ({ head: piece(t), chest: piece(t), hands: piece(t), legs: piece(t), feet: null });
  const GUARDS = [['Cathal', 'gatelander', false, 'guard'], ['Roisin', 'gatelander', true, 'guard'], ['Aodh', 'oldblood', false, 'guard'], ['Ferdia', 'gatelander', false, 'captain']];
  const stats = {}, rows = [], rigs = [];
  const build = (mode, x, d, ry) => { const gn = personGenome({ name: d[0], role: d[3], people: d[1], female: d[2] }, { nation: 'gatelands', key: 'proto' + d[0] });
    let t = null; if (mode === 'B') t = 3; if (mode === 'C') t = d[3] === 'captain' ? 4 : x < 0 ? 1 : 3;
    if (t) { gn.eq = { armour: kit(t), amulet: false, quiver: false }; gn.hat = 'none'; gn.cloak = false; }
    const r = buildPerson(gn, {}); r.root.position.set(bx + x, y0, bz); r.root.rotation.y = ry; scene.add(r.root); r.root.visible = true; rigs.push(r);
    stats[(mode || 'today') + ' ' + d[0]] = { tris: r.tris, trisLo: r.trisLo }; return r; };
  const cam = new THREE.PerspectiveCamera(22, W / H, .05, 200);
  const snap = () => { for (let f = 0; f < 3; f++) tickPeople(1 / 60, 1e7 + f * 16); cam.position.set(bx, y0 + .8, bz + 9.4); cam.lookAt(bx, y0 + .56, bz); scene.updateMatrixWorld(true); REN.render(scene, cam);
    const o = document.createElement('canvas'); o.width = W; o.height = Math.round(H * .5); o.getContext('2d').drawImage(cv, 0, H * .26, W, H * .5, 0, 0, W, o.height); return o; };
  const xs = [-2.6, -1.8, 1.2, 2.4];
  for (const mode of [null, 'B', 'C']) { GUARDS.forEach((d, i) => build(mode, xs[i], d, .3 + (i === 2 ? Math.PI * .85 : 0)));
    rows.push(snap()); rigs.splice(0).forEach(r => { scene.remove(r.root); PEOPLE_RIGS.delete(r); r.mesh.geometry.dispose(); if (r.geoLo) r.geoLo.dispose(); }); }
  const labels = ['today: the people\'s helm and coat', 'B: every guard in Iron mail and the nasal helm', 'C: by the town\'s wealth — lamellar in a poor town (left pair), mail in a middling one, plate for the captain (right)'];
  const c = document.createElement('canvas'); c.width = W; const rh = rows[0].height; c.height = rows.length * (rh + 28); const x = c.getContext('2d'); x.fillStyle = '#1a1612'; x.fillRect(0, 0, c.width, c.height);
  rows.forEach((o, i) => { x.font = '17px Georgia, serif'; x.fillStyle = '#e8dcc0'; x.fillText(labels[i], 10, i * (rh + 28) + 20); x.drawImage(o, 0, i * (rh + 28) + 28); });
  objs.forEach(o => scene.remove(o)); return { png: c.toDataURL(), stats }; });
fs.writeFileSync(path.join(OUT, 'guardarmour-grid.png'), Buffer.from(out.png.split(',')[1], 'base64'));
fs.writeFileSync(path.join(OUT, 'guardarmour-stats.json'), JSON.stringify(out.stats, null, 1));
console.log(JSON.stringify(out.stats)); console.log('errors', g.errs); await g.close();
