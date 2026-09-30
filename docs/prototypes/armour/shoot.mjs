// node docs/prototypes/armour/shoot.mjs -> docs/prototypes/armour/*.png, figures.js, stats.json
// The worn armour kit (concept, 2026-09-30). Patches a copy of the game (index.html is not changed): armour.js goes in
// before the shape kit, the kit block in personBakeQ calls ARMOUR_DRESS when the genome's eq carries `armour`, and
// tpBuild fills that from the worn items when window.AR_ON is 'A' or 'B'. Then the player is dressed in a full set of
// each of the ten materials (helmet, cuirass, gauntlets, greaves, boots) and photographed today and proposed.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..', '..');
let src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const patch = (a, b) => { if (!src.includes(a)) throw new Error('patch missed: ' + a.slice(0, 60)); src = src.replace(a, b); };
patch('const SK={', fs.readFileSync(path.join(here, 'armour.js'), 'utf8') + '\nconst SK={');
patch('if(g.eq){const E=g.eq;', 'if(g.eq&&g.eq.armour)ARMOUR_DRESS({part,B,C,SK,THREE,bw,chestPts,E:g.eq.armour,g});if(g.eq){const E=g.eq.armour?{amulet:g.eq.amulet,quiver:g.eq.quiver}:g.eq;');
patch('eq:{chest:ch?', 'eq:{armour:window.AR_ON?AR_FROM_EQ(EQ,window.AR_ON):null,chest:ch?');
// under the proposed armour the tunic and breeches are the look's own cloth (today they take the armour's colour)
patch("cloth:new THREE.Color(chestCol),sleeve:new THREE.Color(chestCol).multiplyScalar(.9),legs:new THREE.Color(legCol),",
  "cloth:new THREE.Color(window.AR_ON&&ch&&ch.material?LK.tunic:chestCol),sleeve:new THREE.Color(window.AR_ON&&ch&&ch.material?LK.tunic:chestCol).multiplyScalar(.9),legs:new THREE.Color(window.AR_ON&&lg&&lg.material?LK.breeches:legCol),");
patch("hat:hd?(tpIsCloth(hd)?'hood':'helm'):'none'", "hat:hd?(tpIsCloth(hd)?'hood':(window.AR_ON?'none':'helm')):'none'");
const tmp = path.join(ROOT, 'tests', 'tmp'); fs.mkdirSync(tmp, { recursive: true });
const pat = path.join(tmp, 'armour.html'); fs.writeFileSync(pat, src);

const g = await boot({ src: pat }); const { page } = g;
await g.intoWorld();
const out = await page.evaluate(() => {
  forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height;
  const bx = px + 300, bz = pz, y0 = 60, objs = [];
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), new THREE.MeshLambertMaterial({ color: 0x5a544c })); bg.position.set(bx, y0 + 4, bz - 2.2); scene.add(bg); objs.push(bg);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshLambertMaterial({ color: 0x4a4238 })); fl.rotation.x = -Math.PI / 2; fl.position.set(bx, y0, bz); scene.add(fl); objs.push(fl);
  const Lt = new THREE.PointLight(0xfff0d8, .35, 30); Lt.position.set(bx + 2, y0 + 4, bz + 6); scene.add(Lt); objs.push(Lt);
  const cam = new THREE.PerspectiveCamera(22, W / H, .05, 200);
  const NAMES = MATERIALS.map(m => m.name);
  const LOOK = { style: 'crop', beard: 'none', hair: 0x2a1a10 };
  const dress = t => { for (const k of Object.keys(EQ)) EQ[k] = null;
    const A = n => makeItem(t, ARMOR_TYPES.find(a => a.type === n), null, true);
    EQ.head = A('Helmet'); EQ.chest = A('Cuirass'); EQ.hands = A('Gauntlets'); EQ.legs = A('Greaves'); EQ.feet = A('Boots'); };
  const tris = {};
  const make = (t, mode, x, ry) => { dress(t); window.AR_ON = mode; const R = tpBuild(LOOK); window.AR_ON = null;
    R.root.position.set(x, y0, bz); R.root.rotation.y = ry; R.shL.rotation.z = .13; R.shR.rotation.z = -.13; R.elL.rotation.x = -.12; R.elR.rotation.x = -.12;
    scene.add(R.root); R.root.visible = true; tris[NAMES[t - 1] + ' ' + (mode || 'today')] = R.rig.tris; return R; };
  const snap = (camPos, look, cropY, cropH, outW) => { cam.position.set(...camPos); cam.lookAt(...look); scene.updateMatrixWorld(true); REN.render(scene, cam);
    const o = document.createElement('canvas'); o.width = outW || 1280; o.height = Math.round(o.width * H / W * cropH);
    o.getContext('2d').drawImage(cv, 0, H * cropY, W, H * cropH, 0, 0, o.width, o.height); return o; };
  const fx = xw => (new THREE.Vector3(xw, y0, bz).project(cam).x + 1) / 2;
  const sheet = (title, rows, labels) => { const rh = rows[0].height, c = document.createElement('canvas'); c.width = rows[0].width; c.height = 34 + rows.length * (rh + 26); const x = c.getContext('2d');
    x.fillStyle = '#1a1612'; x.fillRect(0, 0, c.width, c.height); x.font = '20px Georgia, serif'; x.fillStyle = '#e8dcc0'; x.fillText(title, 10, 24);
    rows.forEach((o, i) => { const y = 34 + i * (rh + 26); x.font = '16px Georgia, serif'; x.fillStyle = '#c8b890'; x.fillText(labels.rows[i], 10, y + 17); x.drawImage(o, 0, y + 24);
      (labels.cols[i] || labels.cols[0]).forEach(([cn, f]) => { x.font = '14px Georgia, serif'; x.fillStyle = '#e8dcc0'; x.fillText(cn, f * c.width - x.measureText(cn).width / 2, y + rh + 18); }); });
    return c.toDataURL(); };
  const clear = rs => rs.forEach(R => { scene.remove(R.root); tpDispose(R); });
  const shots = {};
  // 1. the lineup: ten materials, today / proposed (B) / A (the rare tiers as plain plate)
  { const sp = 1.0, xs = i => bx + (i - 4.5) * sp, rows = [], cols = [];
    for (const mode of [null, 'B', 'A']) { const rs = [], cl = []; for (let t = 1; t <= 10; t++) if (!(mode === 'A' && t < 5)) rs.push(make(t, mode, xs(t - 1), .35));
      rows.push(snap([bx, y0 + .9, bz + 12.2], [bx, y0 + .58, bz], .3, .42)); for (let t = 1; t <= 10; t++) if (!(mode === 'A' && t < 5)) cl.push([NAMES[t - 1], fx(xs(t - 1))]); cols.push(cl); clear(rs); }
    shots.lineup = sheet('Armour by material, a full set each (helmet, cuirass, gauntlets, greaves, boots)', rows,
      { rows: ['today: one shape, recoloured', 'proposed, B: four builds, and a signature for each rare metal', 'A: the rare metals as plain steel plate in their colour (1–4 as B)'], cols }); }
  // 2. the four builds up close, front and side, with today's steel set at the left
  { const sp = 1.05, rows = [], FN = ['today (Steel)', 'Wooden', 'Bronze', 'Iron', 'Steel'];let cl;
    for (const [ry, lab] of [[.28, 'front'], [Math.PI / 2 - .05, 'side'], [Math.PI - .3, 'back']]) { const rs = [make(4, null, bx - 2 * sp, ry)]; [1, 2, 3, 4].forEach((t, i) => rs.push(make(t, 'B', bx + (i - 1) * sp, ry)));
      rows.push(snap([bx, y0 + .72, bz + 6.9], [bx, y0 + .6, bz], .14, .72)); cl = FN.map((n, i) => [n, fx(bx + (i - 2) * sp)]); clear(rs); }
    shots.families = sheet('The four builds: Wooden lamellar, Bronze muscle cuirass, Iron mail, Steel plate (today’s Steel set at the left)', rows.slice(0, 1),
      { rows: ['front'], cols: [cl] });
    shots.side = sheet('The same, side and back', rows.slice(1), { rows: ['side', 'back'], cols: [cl] }); }
  // 3. the rare metals, B
  { const sp = 1.0, rs = []; for (let t = 5; t <= 10; t++) rs.push(make(t, 'B', bx + (t - 7.5) * sp, .4));
    const f = snap([bx, y0 + .72, bz + 7.6], [bx, y0 + .6, bz], .14, .72); clear(rs);
    const rs2 = []; for (let t = 5; t <= 10; t++) rs2.push(make(t, null, bx + (t - 7.5) * sp, .4));
    const f0 = snap([bx, y0 + .72, bz + 7.6], [bx, y0 + .6, bz], .14, .72); clear(rs2);
    shots.rare = sheet('The rare metals: fluted Mithril, heavy Adamant, faceted Obsidian, scaled Draconic, spiked Demonic, inlaid Cosmic', [f0, f],
      { rows: ['today', 'proposed (B)'], cols: [NAMES.slice(4).map((n, i) => [n, fx(bx + (i - 2.5) * sp)])] }); }
  // 4. in scale: two townsfolk and a town guard beside the player in Iron and Steel
  { const people = [{ name: 'Brigid', role: 'villager', people: 'gatelander', female: true }, { name: 'Cathal', role: 'villager', people: 'gatelander', female: false }, { name: 'Roland', role: 'guard', people: 'gatelander', female: false }];
    const rigs = people.map((d, i) => { const gn = personGenome(d, { nation: 'gatelands', key: 'proto' }); const r = buildPerson(gn, { noLod: true }); r.root.position.set(bx - 1.9 + i * .78, y0, bz); r.root.rotation.y = .3; scene.add(r.root); r.root.visible = true; return r; });
    for (let f = 0; f < 3; f++) tickPeople(1 / 60, 1e7 + f * 16);
    const rs = [make(3, 'B', bx + .6, .3), make(4, 'B', bx + 1.4, .3), make(8, 'B', bx + 2.2, .3)];
    const o = snap([bx + .15, y0 + .72, bz + 7.2], [bx + .15, y0 + .6, bz], .14, .72);
    shots.scale = sheet('In scale: Brigid, Cathal and a town guard (about 1.1 units tall) beside Iron, Steel and Draconic', [o], { rows: [''], cols: [[['Brigid', fx(bx - 1.9)], ['Cathal', fx(bx - 1.12)], ['guard', fx(bx - .34)], ['Iron', fx(bx + .6)], ['Steel', fx(bx + 1.4)], ['Draconic', fx(bx + 2.2)]]] });
    rigs.forEach(r => { scene.remove(r.root); PEOPLE_RIGS.delete(r); }); clear(rs); }
  // 5. the baked figures for the standalone viewer: bind-pose geometry, quantised
  const b64 = a => { const u = new Uint8Array(a.buffer); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); };
  const fig = [];
  for (const [t, mode] of [[4, null], ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => [t, 'B'])]) { const R = make(t, mode, bx, 0); const ge = R.rig.mesh.geometry;
    const p = ge.attributes.position.array, n = ge.attributes.normal.array, c = ge.attributes.color.array, ix = ge.index.array;
    const P = new Int16Array(p.length), N = new Int8Array(n.length), Cc = new Uint8Array(c.length);
    for (let i = 0; i < p.length; i++) P[i] = Math.round(p[i] * 8000); for (let i = 0; i < n.length; i++) N[i] = Math.round(n[i] * 127); for (let i = 0; i < c.length; i++) Cc[i] = Math.max(0, Math.min(255, Math.round(c[i] * 255)));
    fig.push({ name: NAMES[t - 1] + (mode ? '' : ' (today)'), tris: R.rig.tris, p: b64(P), n: b64(N), c: b64(Cc), i: b64(new Uint32Array(ix)) }); clear([R]); }
  objs.forEach(o => scene.remove(o)); return { shots, tris, fig }; });
for (const [k, u] of Object.entries(out.shots)) fs.writeFileSync(path.join(here, k + '.png'), Buffer.from(u.split(',')[1], 'base64'));
fs.writeFileSync(path.join(here, 'figures.js'), '// baked by shoot.mjs: the player in a full set of each material, bind pose, positions ×8000 (int16), normals ×127, colours 0–255\nwindow.AR_FIG=' + JSON.stringify(out.fig) + ';\n');
fs.writeFileSync(path.join(here, 'stats.json'), JSON.stringify(out.tris, null, 1));
console.log(JSON.stringify(out.tris)); console.log('errors', g.errs); await g.close();
