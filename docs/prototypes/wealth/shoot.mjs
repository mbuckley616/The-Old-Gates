// node docs/prototypes/wealth/shoot.mjs -> docs/prototypes/wealth-*.png
// Backlog H.2 / variety, owed since Session 153: wealth in clothes. Today a townsperson's dress is their people, nation
// and role; a lord's crown and a smith's apron say what they do, but a poor fisher and a well-off one, or the folk of a
// dying village and a thriving town, dress alike. The prototype gives a person a wealth from 0 to 1 and dresses by it:
// poor is faded, patched cloth, a rope belt and foot-wraps; well-off is deeper dyes, gilt trim, a buckle, a chain and
// pendant and dark boots; the middle is today's look. index.html is not changed: this patches a copy.
// Rows: poor, today, well-off; the same five people (same genome) in each.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..', '..');
let src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const patch = (a, b) => { if (!src.includes(a)) throw new Error('patch missed: ' + a.slice(0, 60)); src = src.replace(a, b); };
patch("const belt=part(SK.torus(.172*bw*(fem?.96:1),.02,5,20),dark,hips,0,.02,0);belt.rotation.x=Math.PI/2;belt.scale.y=.74;",
  "const WL=g.wealth==null?.5:g.wealth,gold=C(0xc8a040);" +
  "const belt=part(SK.torus(.172*bw*(fem?.96:1),WL<.3?.016:.02,5,20),WL<.3?C(0x9a8458):dark,hips,0,.02,0);belt.rotation.x=Math.PI/2;belt.scale.y=.74;" +
  // poor: a patch on the skirt, a rope belt's knot; well-off: a buckle
  "if(WL<.3){if(!g.dress)part(SK.ball(.034,7,5),mixC(cloth,0x3a3024,.45),hips,.085*bw,-.075,.136*bw).scale.set(1.1,.9,.28);part(SK.ball(.016,6,5),C(0x9a8458),hips,.06*bw,.0,.128*bw);}" +
  "if(WL>.7)part(SK.rbox(.042,.034,.012,.005,2),gold,hips,0,.02,.13*bw);");
patch("part(SK.lathe(chestPts.map(q=>[q[0]*bw,q[1]])),cloth,spine).scale.z=.72;",
  "part(SK.lathe(chestPts.map(q=>[q[0]*bw,q[1]])),cloth,spine).scale.z=.72;" +
  "if(WL<.3)part(SK.ball(.036,7,5),mixC(cloth,0x3a3024,.4),spine,-.07*bw,.13,.124*bw).scale.set(1,1.1,.26);" +
  "if(WL>.7){const ch=part(SK.torus(.085*bw,.005,4,18),gold,spine,0,.35,.035);ch.rotation.x=Math.PI/2-.55;part(SK.ball(.018,8,6),gold,spine,0,.285,.13*bw).scale.z=.5;}");
const tmp = path.join(ROOT, 'tests', 'tmp'); fs.mkdirSync(tmp, { recursive: true });
const pat = path.join(tmp, 'wealth.html'); fs.writeFileSync(pat, src);

const g = await boot({ src: pat }); const { page } = g;
await g.intoWorld();
const out = await page.evaluate(() => {
  forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height;
  const bx = px + 300, bz = pz, y0 = 60, objs = [];
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshLambertMaterial({ color: 0x3a3430 })); bg.position.set(bx, y0 + 4, bz - 1.5); scene.add(bg); objs.push(bg);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshLambertMaterial({ color: 0x4a4238 })); fl.rotation.x = -Math.PI / 2; fl.position.set(bx, y0, bz); scene.add(fl); objs.push(fl);
  const Lt = new THREE.PointLight(0xfff0d8, .9, 16); Lt.position.set(bx + 1, y0 + 3, bz + 4); scene.add(Lt); objs.push(Lt);
  const cam = new THREE.PerspectiveCamera(26, W / H, .05, 100);
  const C = x => new THREE.Color(x);
  // what wealth does to the colours: poor fades towards undyed wool and wraps the feet; well-off deepens the dye
  const dressBy = (gn, w) => { gn.wealth = w;
    if (w < .3) { const u = C(0x7a6c5a); gn.cloth = gn.cloth.clone().lerp(u, .45); gn.sleeve = gn.sleeve.clone().lerp(u, .45); gn.legs = gn.legs.clone().lerp(u, .3); gn.trim = gn.cloth.clone().multiplyScalar(.8); gn.boot = C(0x7a6a52); if (gn.hat === 'chaperon' || gn.hat === 'fur') gn.hat = 'none'; }
    else if (w > .7) { for (const k of ['cloth', 'sleeve']) { const h = {}; gn[k].getHSL(h); gn[k] = new THREE.Color().setHSL(h.h, Math.min(1, h.s * 1.15 + .03), h.l * .82); } gn.trim = C(0xc8a040); gn.boot = C(0x1a120c); gn.legs = gn.legs.clone().multiplyScalar(.8); } };
  const sets = [
    ['Gatelands', [['gatelands', { name: 'Brigid', role: 'villager', people: 'gatelander', female: true }], ['gatelands', { name: 'Cathal', role: 'villager', people: 'gatelander', female: false }], ['gatelands', { name: 'Niamh', role: 'fisher', people: 'gatelander', female: true }], ['gatelands', { name: 'Donal', role: 'villager', people: 'gatelander', female: false }], ['gatelands', { name: 'Orla', role: 'villager', people: 'gatelander', female: true }]]],
    ['the Mark and Aurenne', [['mark', { name: 'Sigrun', role: 'villager', people: 'markman', female: true }], ['mark', { name: 'Halvard', role: 'villager', people: 'markman', female: false }], ['aurenne', { name: 'Isabeau', role: 'villager', people: 'aurennais', female: true }], ['aurenne', { name: 'Remy', role: 'merchant', people: 'aurennais', female: false }], ['aurenne', { name: 'Margaux', role: 'villager', people: 'aurennais', female: true }]]]];
  const rowsN = [['poor (wealth .15)', .15], ['today', null], ['well-off (wealth .85)', .85]];
  const shots = [], tris = {};
  for (const [label, people] of sets) {
    const rows = [];
    for (const [rn, w] of rowsN) {
      const rigs = people.map(([nation, def], i) => { const gn = personGenome(def, { nation, key: 'proto' }); if (w != null) dressBy(gn, w);
        const rig = buildPerson(gn, { noLod: true }); rig.root.position.set(bx + (i - 2) * .95, y0, bz); rig.root.rotation.y = .12; rig.root.visible = true; scene.add(rig.root);
        let t = 0; rig.root.traverse(o => { if (o.isMesh) t += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); tris[def.name + ' ' + rn] = t; return rig; });
      for (let f = 0; f < 3; f++) tickPeople(1 / 60, 1e7 + f * 16);
      cam.position.set(bx, y0 + 1.05, bz + 6.2); cam.lookAt(bx, y0 + .82, bz); scene.updateMatrixWorld(true); REN.render(scene, cam);
      const o = document.createElement('canvas'); o.width = 1500; o.height = Math.round(1500 * H / W * .62); o.getContext('2d').drawImage(cv, 0, H * .19, W, H * .62, 0, 0, o.width, o.height); rows.push([rn, o]);
      rigs.forEach(r => scene.remove(r.root)); }
    const rh = rows[0][1].height, c = document.createElement('canvas'); c.width = 1500; c.height = rh * 3 + 30; const x = c.getContext('2d'); x.fillStyle = '#1a1612'; x.fillRect(0, 0, c.width, c.height);
    x.font = '20px serif'; x.fillStyle = '#e8dcc0'; x.fillText(label + ' — the same five people, three ways', 8, 22);
    rows.forEach(([rn, o], i) => { x.drawImage(o, 0, 30 + i * rh); x.fillStyle = '#e8dcc0'; x.fillText(rn, 10, 30 + i * rh + rh - 12); });
    const id = x.getImageData(0, 0, c.width, c.height), d = id.data; for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] / 8) * 8; x.putImageData(id, 0, 0);
    shots.push(c.toDataURL()); }
  objs.forEach(o => scene.remove(o)); return { shots, tris }; });
out.shots.forEach((u, i) => fs.writeFileSync(path.join(here, '..', 'wealth-' + (i + 1) + '.png'), Buffer.from(u.split(',')[1], 'base64')));
console.log(JSON.stringify(out.tris)); console.log('errors', g.errs); await g.close();
