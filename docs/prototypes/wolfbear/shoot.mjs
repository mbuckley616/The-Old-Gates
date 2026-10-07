// node docs/prototypes/wolfbear/shoot.mjs -> docs/prototypes/wolfbear-*.png
// Session 620: Michael's two mesh-inspector notes of 6 Oct — the wolves too small, slender and comical, the cave bear too small
// beside them. A prototype, so js/ is not changed: this script takes wolfBakeQ's source from js/34-creatures.js, patches a
// copy (a kind with `fierce` gets the new head, raised hackles and a heavier build), and evaluates it in the page.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'js', '34-creatures.js'), 'utf8').replace(/\r\n/g, '\n');
const a = src.indexOf('function wolfBakeQ(k,q){'), b = src.indexOf('function wolfGeo(');
let bake = src.slice(a, b);
const H0 = bake.indexOf('  const head=B.head,M=k.muzzle;'), H1 = bake.indexOf('  // legs: a shoulder blade and a haunch');
const oldHead = bake.slice(H0, H1);
// the fierce head: a longer, lower skull; a brow ridge frowning over small slanted eyes set under it (no round pupils);
// a longer, deeper muzzle with the lip line dark and the canines showing; smaller ears laid back; hackles along the back
const newHead = `  if(k.fierce){
  const head=B.head,M=k.muzzle*1.2;
  part(SK.ball(.07,14,10),coat,head,0,.004,-.012,true).scale.set(.9,.76,1.22);
  [-1,1].forEach(s=>part(SK.ball(.042,10,7),coat,head,s*.04,-.014,.012,true).scale.set(.85,.85,1.25));
  [-1,1].forEach(s=>{const br=part(SK.ball(.024,9,6),coat,head,s*.028,.036,.044,true);br.scale.set(1.5,.5,1.15);br.rotation.z=s*.38;});
  part(zlathe([[0,0],[.054,0],[.05,.06],[.04,.115],[.026,.15],[0,.16]].map(p=>[p[0],p[1]*M]),12),coat,head,0,-.008,.03,true).scale.set(.95,.92,1);
  part(SK.ball(.042,10,7),coat,head,0,.026,.07,true).scale.set(.85,.62,2.1);
  part(zlathe([[0,0],[.04,0],[.034,.08],[.02,.13],[0,.135]].map(p=>[p[0],p[1]*M]),10),coat,B.jaw,0,.002,0,true).scale.set(.9,.62,1);
  part(SK.ball(.02,8,6),dark,head,0,.006,.03+.155*M).scale.set(1.3,.85,1);
  [-1,1].forEach(s=>{const lp=part(SK.ball(.02,8,5),dark,head,s*.03,-.03,.03+.085*M);lp.scale.set(.25,.22,3.2);lp.rotation.y=-s*.12;
    const ct=part(SK.cone(.0065,.03,5),C(0xece4d0),head,s*.019,-.038,.03+.13*M);ct.rotation.x=Math.PI;
    const cb=part(SK.cone(.006,.024,5),C(0xece4d0),B.jaw,s*.015,.004,.11*M);cb.rotation.x=0;});
  [-1,1].forEach(s=>{
    if(q>=1){const ey=part(SK.ball(.0095,8,6),C(k.eye),head,s*.034,.024,.058);ey.scale.set(1.5,.55,.6);ey.rotation.z=s*.35;}
    const e=part(SK.cone(.03,.07*k.ears,6),coat,head,s*.046,.07,-.04,true);e.rotation.set(-.55,0,-s*.36);e.scale.set(1,1,.5);
    const ei=part(SK.cone(.019,.05*k.ears,5),C(0x3a2a24),head,s*.046,.065,-.033);ei.rotation.set(-.55,0,-s*.36);ei.scale.set(1,1,.3);
  });
  for(let i=0;i<8;i++){const onSp=i<5,b=onSp?B.spine:hips,z=onSp?.17-i*.065:.12-(i-5)*.08;const h=.07-Math.abs(i-2)*.007;
    const o=part(SK.bumpy(SK.cone(.03,h,6),.004,17,i),C(k.saddle),b,0,onSp?.13:.12,z);o.rotation.x=-1.0;o.scale.set(.75,.75,1.3);}
  }else{
${oldHead}  }
`;
bake = bake.slice(0, H0) + newHead + bake.slice(H1);
// a heavier build for a fierce kind: a wider chest and a thicker neck
bake = bake.replace("coat,B.spine,0,-.04,0,true).scale.set(.63*bw*ln,1.08*bw,1);", "coat,B.spine,0,-.04,0,true).scale.set((k.fierce?.76:.63)*bw*ln,(k.fierce?1.16:1.08)*bw,1);")
           .replace("seg(B.spine,[.14,.13],.075*bw,.062*bw,.006)", "seg(B.spine,[.14,.13],(k.fierce?.088:.075)*bw,(k.fierce?.074:.062)*bw,.006)");
const LT = '(k.fierce?1.3:1)';
for (const [a1, b1] of [['seg(el,F.b,.03,.021,.006)', `seg(el,F.b,.03*${LT},.021*${LT},.006)`], ['seg(wr,F.c,.021,.019,0)', `seg(wr,F.c,.021*${LT},.019*${LT},0)`],
  ['seg(kn,H.b,.032,.021,.007)', `seg(kn,H.b,.032*${LT},.021*${LT},.007)`], ['seg(hk,H.c,.02,.018,0)', `seg(hk,H.c,.02*${LT},.018*${LT},0)`]]) { if (!bake.includes(a1)) throw new Error('leg anchor ' + a1); bake = bake.replace(a1, b1); }
if (!bake.includes('k.fierce?.76') || !bake.includes('k.fierce?.088')) throw new Error('patch anchors missing');

const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(s => { (0, eval)(s); }, bake);
const out = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const PROTO = { // today's kind -> the proposed one: the same coat, the fierce head, a little more bulk, the head carried lower
    'Wolf': { bulk: 1.1, neck: .12, ruff: 1.15, muzzle: 1.05 }, 'Snow Wolf': { bulk: 1.1, neck: .12, ruff: 1.35 },
    'Dire Wolf': { bulk: 1.22, neck: .14, ruff: 1.45 }, 'Ash Hound': { bulk: 1.05, neck: .12, ruff: .7 } };
  for (const n in PROTO) WOLF_KINDS[n + '*'] = Object.assign({}, WOLF_KINDS[n], PROTO[n], { fierce: true });
  // sizes in play: today's (42-zone-enemies.js) and proposed. The bear's: a cave bear larger than a grizzly.
  const NOW = { 'Wolf': .75, 'Snow Wolf': .9, 'Dire Wolf': .95, 'Ash Hound': .8, 'Cave Bear': 1.35 };
  const NEW = { 'Wolf': 1.05, 'Snow Wolf': 1.15, 'Dire Wolf': 1.35, 'Ash Hound': 1.0, 'Cave Bear': 1.55 };
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshLambertMaterial({ color: 0x5a6040 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const snap = () => { sc.updateMatrixWorld(true); REN.render(sc, cam); const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL(); };
  let objs = [];
  const clear = () => { objs.forEach(o => sc.remove(o)); objs = []; };
  const bandit = (x, ry) => { const bd = buildFoe('Bandit', 3, 3); PEOPLE_RIGS.delete(bd); pwApply(bd, pwIdle(1, { holds: bd.holds, gear: bd.g.gear })); bd.root.position.set(bx + x, y, bz); bd.root.rotation.y = ry || .3; sc.add(bd.root); objs.push(bd.root); return bd; };
  const beast = (n, s, x, z, ry, pose) => { const w = buildWolf(n, s); WOLF_RIGS.delete(w); w.root.position.set(bx + x, y, bz + (z || 0)); w.root.rotation.y = ry; sc.add(w.root); objs.push(w.root);
    wgApply(w, pose === 'trot' ? wgStride(WG.TROT, .3, 1, false) : pose === 'atk' ? wgAttack(.3, .7, wgStand(1)) : wgStand(1)); return w; };
  const shots = {}; const meas = {};
  // 1. the line-up in play, today then proposed: a bandit, the four wolves, the bear
  const lineup = (key, star, sizes) => { bandit(-4.2, .25); let x = -3.3; const kinds = ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound'];
    kinds.forEach(n => { beast(n + star, sizes[n], x + .35 * sizes[n], 0, Math.PI / 2 - .35, 'stand'); x += 1.25 * sizes[n] + .1; });
    beast('Cave Bear', sizes['Cave Bear'], x + .6 * sizes['Cave Bear'], 0, Math.PI / 2 - .35, 'stand');
    cam.position.set(bx + .5, y + 1.6, bz + 9.8); cam.lookAt(bx + .5, y + .6, bz); shots[key] = snap(); clear(); };
  lineup('lineup-today', '', NOW); lineup('lineup-proposed', '*', NEW);
  // 2. the heads, close: today's four over the proposed four, three-quarter view
  const heads = (key, star) => { ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound'].forEach((n, i) => beast(n + star, 1, -1.25 + i * .8, 0, .6, 'stand'));
    cam.position.set(bx, y + .7, bz + 3.4); cam.lookAt(bx, y + .4, bz); shots[key] = snap(); clear(); };
  heads('heads-today', ''); heads('heads-proposed', '*');
  // 3. a pack coming at you at the proposed size, one lunging, from a man's eye height
  bandit(1.5, -.4).root.position.z = bz - .9; beast('Wolf*', NEW.Wolf, -.6, .2, .15, 'trot'); beast('Dire Wolf*', NEW['Dire Wolf'], .5, -1.4, -.1, 'stand'); beast('Wolf*', NEW.Wolf, -1.9, -1.2, .45, 'atk');
  cam.position.set(bx + .2, y + 1.15, bz + 4.4); cam.lookAt(bx - .3, y + .45, bz - .6); shots['pack-proposed'] = snap(); clear();
  // 4. the bear beside a man and a wolf, today then proposed
  const bearRow = (key, sz) => { bandit(-1.9, .3); beast('Cave Bear', sz['Cave Bear'], .2, 0, Math.PI / 2 - .5, 'stand'); beast('Wolf' + (key.includes('proposed') ? '*' : ''), sz.Wolf, 2.6, .3, Math.PI / 2 - .5, 'stand');
    cam.position.set(bx + .2, y + 1.3, bz + 6.8); cam.lookAt(bx + .2, y + .6, bz); shots[key] = snap(); clear(); };
  bearRow('bear-today', NOW); bearRow('bear-proposed', NEW);
  // the numbers: height of the back over a bandit's height, at today's and the proposed sizes, and the triangles
  const bd = buildFoe('Bandit', 3, 3); PEOPLE_RIGS.delete(bd); const man = new THREE.Box3().setFromObject(bd.root).max.y;
  for (const n of ['Wolf', 'Snow Wolf', 'Dire Wolf', 'Ash Hound', 'Cave Bear']) for (const star of n === 'Cave Bear' ? [''] : ['', '*']) {
    const w = buildWolf(n + star, 1); WOLF_RIGS.delete(w); const ga = w.mesh.geometry, pa = ga.attributes.position, si = ga.attributes.skinIndex; const bi = new Set([w.B.spine.userData.i, w.B.hips.userData.i]);
    let top = 0, len0 = 1e9, len1 = -1e9; for (let i = 0; i < pa.count; i++) { if (bi.has(si.getX(i))) top = Math.max(top, pa.getY(i)); len0 = Math.min(len0, pa.getZ(i)); len1 = Math.max(len1, pa.getZ(i)); }
    meas[n + star] = { back: +(top / man).toFixed(2), length: +((len1 - len0) / man).toFixed(2), tris: w.tris, sizeNow: NOW[n], sizeNew: NEW[n] }; }
  floor.parent.remove(floor); return { shots, meas, man: +man.toFixed(2) }; });
for (const [k, v] of Object.entries(out.shots)) fs.writeFileSync(path.join(ROOT, 'docs', 'prototypes', `wolfbear-${k}.png`), Buffer.from(v.split(',')[1], 'base64'));
console.log(JSON.stringify({ man: out.man, meas: out.meas }));
console.log('errors', g.errs);
await g.close();
