// The worn armour kit on the player's body (Session 384, Michael's B on decision #76): Wooden laced lamellar, Bronze a
// muscle cuirass, Iron mail, Steel plate, and Mithril to Cosmic the plate with a mark each; baked into the one skinned
// body by personBakeQ, so it bends and walks with it. Under a piece the tunic and breeches are the look's own cloth.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

// what AR_FROM_EQ reads: a makeItem piece of a material, nothing for the starting clothes or an odd material
const read = await page.evaluate(() => {
  const A = (t, n) => makeItem(t, ARMOR_TYPES.find(a => a.type === n), null, true);
  const full = t => ({ head: A(t, 'Helmet'), chest: A(t, 'Cuirass'), hands: A(t, 'Gauntlets'), legs: A(t, 'Greaves'), feet: A(t, 'Boots') });
  const rows = []; for (let t = 1; t <= 10; t++) { const r = AR_FROM_EQ(full(t)); rows.push([r.chest.fam, r.chest.sig, r.head.fam, r.feet.fam].join('/')); }
  const start = AR_FROM_EQ({ head: null, chest: { name: 'Tattered Tunic' }, hands: null, legs: { name: 'Worn Breeches' }, feet: { name: 'Leather Boots' } });
  const helmOnly = AR_FROM_EQ({ head: { name: 'Iron Helm', slot: 'head', tier: 3, material: 'Iron' }, chest: { name: 'Tattered Tunic' } });
  const odd = AR_FROM_EQ({ chest: { name: 'Bone Vest', slot: 'chest', tier: 5, material: 'Sigil-Bone' } });
  return { rows, start, helmOnly: helmOnly && [helmOnly.head && helmOnly.head.fam, helmOnly.chest], odd }; });
check('tiers 1–4 are lamellar, muscle, mail, plate; 5–10 plate with fluted, heavy, faceted, scaled, spiked, inlaid',
  read.rows.join(' ') === 'lamellar//lamellar/lamellar muscle//muscle/muscle mail//mail/mail plate//plate/plate plate/fluted/plate/plate plate/heavy/plate/plate plate/faceted/plate/plate plate/scaled/plate/plate plate/spiked/plate/plate plate/inlaid/plate/plate', read.rows);
check('the starting clothes and a material outside MATERIALS dress nothing; an Iron Helm over the tunic dresses only the head',
  read.start === null && read.odd === null && read.helmOnly && read.helmOnly[0] === 'mail' && read.helmOnly[1] === null, read);

// on the body: a full set of each material through tpBuild — the triangles, the metal and the cloth under it
const body = await page.evaluate(() => {
  const keep = {}; for (const k in EQ) keep[k] = EQ[k];
  const A = (t, n) => makeItem(t, ARMOR_TYPES.find(a => a.type === n), null, true);
  const has = (R, hex, k) => { const c = new THREE.Color(hex); if (k) c.multiplyScalar(k); const C = R.rig.mesh.geometry.attributes.color; let n = 0;
    for (let i = 0; i < C.count; i++) if (Math.abs(C.getX(i) - c.r) + Math.abs(C.getY(i) - c.g) + Math.abs(C.getZ(i) - c.b) < .09) n++; return n; };
  const LOOK = { tunic: 0x2a6a3a, breeches: 0x6a2a5a };
  for (const k of Object.keys(EQ)) EQ[k] = null;
  EQ.chest = { name: 'Tattered Tunic' }; EQ.legs = { name: 'Worn Breeches' }; EQ.feet = { name: 'Leather Boots' };
  const R0 = tpBuild(LOOK); const today = R0.rig.tris; tpDispose(R0);
  const out = [];
  for (let t = 1; t <= 10; t++) { for (const k of Object.keys(EQ)) EQ[k] = null;
    EQ.head = A(t, 'Helmet'); EQ.chest = A(t, 'Cuirass'); EQ.hands = A(t, 'Gauntlets'); EQ.legs = A(t, 'Greaves'); EQ.feet = A(t, 'Boots');
    const R = tpBuild(LOOK); const m = MATERIALS[t - 1];
    out.push({ t, tris: R.rig.tris, metal: has(R, m.blade, .72), tunic: has(R, LOOK.tunic), breeches: has(R, LOOK.breeches), bones: R.rig.mesh.skeleton.bones.length });
    tpDispose(R); }
  // a Steel cuirass over the starting breeches: the plate on the chest, the old greaves block untouched, the helm none
  for (const k of Object.keys(EQ)) EQ[k] = null; EQ.chest = A(4, 'Cuirass'); EQ.legs = { name: 'Worn Breeches' };
  const R1 = tpBuild(LOOK); const mixed = { tris: R1.rig.tris, metal: has(R1, MATERIALS[3].blade, .72) }; tpDispose(R1);
  for (const k in keep) EQ[k] = keep[k];
  return { today, out, mixed }; });
const T = body.out.map(o => o.tris);
// Session 414: the body here is unarmed, so both hands are fists (Michael's D on #99), about 1,030 triangles over the
// mittens this ceiling was set against (11,500)
check('every material dresses the body: 7,500–12,600 triangles a full set against today\'s cloth figure', body.out.every(o => o.tris > body.today + 2000 && o.tris >= 7500 && o.tris <= 12600), { today: body.today, T });
check('the four builds differ from one another, and each rare metal\'s mark from plain Steel', new Set(T.slice(0, 4)).size === 4 && T.slice(4).every(n => n !== T[3]), T);
check('each set carries its own metal in the vertex colours', body.out.every(o => o.metal > 200), body.out.map(o => o.metal));
check('under the armour the tunic and breeches are the look\'s own cloth', body.out.every(o => o.tunic > 30 && o.breeches > 30), body.out.map(o => [o.tunic, o.breeches]));
check('still one skinned mesh on the people\'s bones', body.out.every(o => o.bones === body.out[0].bones && o.bones >= 16), body.out.map(o => o.bones));
check('a Steel cuirass alone over the breeches dresses the chest', body.mixed.metal > 200 && body.mixed.tris > body.today, body.mixed);

// S398 — under a kit helm the full styles are cut to the skull (an afro stood out through a closed helm, Session 397)
const hair = await page.evaluate(() => { const keep = {}; for (const k in EQ) keep[k] = EQ[k]; const A = (t, n) => makeItem(t, ARMOR_TYPES.find(a => a.type === n), null, true);
  const tris = st => { const R = tpBuild({ style: st }); const n = R.rig.tris; tpDispose(R); return n; };
  for (const k of Object.keys(EQ)) EQ[k] = null; const bare = { afro: tris('afro'), curly: tris('curly'), shorn: tris('bald'), long: tris('long') };
  EQ.head = A(4, 'Helmet'); const helm = { afro: tris('afro'), curly: tris('curly'), shorn: tris('bald'), long: tris('long') };
  for (const k in keep) EQ[k] = keep[k]; return { bare, helm }; });
check('under a Steel helm an afro and curls are cut to the skull; long hair still hangs below it', hair.bare.afro > hair.bare.shorn && hair.helm.afro === hair.helm.shorn && hair.helm.curly === hair.helm.shorn && hair.helm.long > hair.helm.shorn, hair);

// in play: tpUpdate rebuilds when a piece goes on, and the rig walks with it on
const play = await page.evaluate(() => { thirdPerson = true; const A = (t, n) => makeItem(t, ARMOR_TYPES.find(a => a.type === n), null, true);
  const st = { moving: false, sprinting: false, camY: 1.6, now: performance.now() };
  tpUpdate(1 / 60, st); const before = TP.rig.rig.tris; EQ.chest = A(3, 'Cuirass'); EQ.head = A(3, 'Helmet');
  st.now += 20; tpUpdate(1 / 60, st); const after = TP.rig.rig.tris;
  st.moving = true; for (let i = 0; i < 30; i++) { st.now += 16; tpUpdate(1 / 60, st); }
  return { before, after }; });
check('putting on an Iron cuirass and helm rebuilds the body in mail', play.after > play.before + 1500, play);

// the photograph: the ten materials in a row, front, in the noon light
const shot = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, W = cv.width, H = cv.height, bx = px + 300, bz = pz, y0 = 60, objs = [];
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), new THREE.MeshLambertMaterial({ color: 0x5a544c })); bg.position.set(bx, y0 + 4, bz - 2.2); scene.add(bg); objs.push(bg);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshLambertMaterial({ color: 0x4a4238 })); fl.rotation.x = -Math.PI / 2; fl.position.set(bx, y0, bz); scene.add(fl); objs.push(fl);
  const Lt = new THREE.PointLight(0xfff0d8, .35, 30); Lt.position.set(bx + 2, y0 + 4, bz + 6); scene.add(Lt); objs.push(Lt);
  const keep = {}; for (const k in EQ) keep[k] = EQ[k]; const A = (t, n) => makeItem(t, ARMOR_TYPES.find(a => a.type === n), null, true); const rs = [];
  for (let t = 1; t <= 10; t++) { for (const k of Object.keys(EQ)) EQ[k] = null; EQ.head = A(t, 'Helmet'); EQ.chest = A(t, 'Cuirass'); EQ.hands = A(t, 'Gauntlets'); EQ.legs = A(t, 'Greaves'); EQ.feet = A(t, 'Boots');
    const R = tpBuild({ style: 'crop', beard: 'none', hair: 0x2a1a10 }); R.root.position.set(bx + (t - 5.5), y0, bz); R.root.rotation.y = .35; R.shL.rotation.z = .13; R.shR.rotation.z = -.13; scene.add(R.root); R.root.visible = true; rs.push(R); }
  for (const k in keep) EQ[k] = keep[k];
  const cam = new THREE.PerspectiveCamera(22, W / H, .05, 200); cam.position.set(bx, y0 + .9, bz + 12.2); cam.lookAt(bx, y0 + .58, bz); scene.updateMatrixWorld(true); REN.render(scene, cam);
  const o = document.createElement('canvas'); o.width = W; o.height = Math.round(H * .42); o.getContext('2d').drawImage(cv, 0, H * .3, W, H * .42, 0, 0, W, o.height);
  rs.forEach(R => tpDispose(R)); objs.forEach(x => scene.remove(x)); return o.toDataURL(); });
fs.writeFileSync('tests/out/armourkit.png', Buffer.from(shot.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
