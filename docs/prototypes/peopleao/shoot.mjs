// node docs/prototypes/peopleao/shoot.mjs -> docs/prototypes/peopleao-*.png
// Backlog H.1, owed since Session 153: ambient occlusion in the shape kit's bake. Today every part of a person is baked
// with its flat colour, so an armpit, the underside of a chin, the inside of a thigh or the skin under a hat's brim is as
// bright as a cheek. The prototype patches a copy of the game (index.html is not changed): after the bake, each part is
// stood in for by a few spheres along its longest axis, and each vertex is darkened by the spheres of the other parts in
// front of it (the analytic sphere occlusion: the cosine to the sphere's centre times its solid angle, r²/d²). It is
// computed once per bake, in the bind pose, into the vertex colours; the frame cost is nil.
// Rows: today and with the occlusion. Pictures 1 and 2: three people each, close, from the front at noon. Picture 3: all
// six at street distance, from behind, in late afternoon.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..', '..');
let src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const patch = (a, b) => { if (!src.includes(a)) throw new Error('patch missed: ' + a.slice(0, 60)); src = src.replace(a, b); };
patch("function personBake(g,q){", `
const PAO={k:.75,max:.5,on:false};
function personAO(pos,nor,col,PR){if(!PAO.on)return;const S=[];
  PR.forEach(([s,c],pi)=>{const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let i=s;i<s+c;i++)for(let k=0;k<3;k++){const v=pos[i*3+k];if(v<mn[k])mn[k]=v;if(v>mx[k])mx[k]=v;}
    const e=[0,1,2].map(k=>(mx[k]-mn[k])/2),ax=e.indexOf(Math.max(e[0],e[1],e[2])),o=[0,1,2].filter(k=>k!==ax),r=Math.max(.004,(e[o[0]]+e[o[1]])/2),n=Math.min(6,Math.max(1,Math.round(e[ax]/r)));
    for(let j=0;j<n;j++){const c3=[0,1,2].map(k=>(mn[k]+mx[k])/2);c3[ax]=mn[ax]+e[ax]*2*(j+.5)/n;S.push(c3[0],c3[1],c3[2],Math.min(r,e[ax]),pi);}});
  PR.forEach(([s,c],pi)=>{for(let i=s;i<s+c;i++){const x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2],nx=nor[i*3],ny=nor[i*3+1],nz=nor[i*3+2];let occ=0;
    for(let q=0;q<S.length;q+=5){if(S[q+4]===pi)continue;const dx=S[q]-x,dy=S[q+1]-y,dz=S[q+2]-z,L2=dx*dx+dy*dy+dz*dz,L=Math.sqrt(L2)||1e-6;const cs=(dx*nx+dy*ny+dz*nz)/L;if(cs<=0)continue;occ+=cs*Math.min(1,S[q+3]*S[q+3]/L2);}
    const a=1-Math.min(PAO.max,occ*PAO.k);col[i*3]*=a;col[i*3+1]*=a;col[i*3+2]*=a;}});}
function personBake(g,q){`);
patch("const pos=[],nor=[],col=[],idx=[],si=[],sw=[];", "const pos=[],nor=[],col=[],idx=[],si=[],sw=[],PR=[];");
patch("    base+=pa.count;o.parent.remove(o);geo.dispose();}\n  const geo=new THREE.BufferGeometry();", "    PR.push([base,pa.count]);base+=pa.count;o.parent.remove(o);geo.dispose();}\n  personAO(pos,nor,col,PR);\n  const geo=new THREE.BufferGeometry();");
const tmp = path.join(ROOT, 'tests', 'tmp'); fs.mkdirSync(tmp, { recursive: true });
const pat = path.join(tmp, 'peopleao.html'); fs.writeFileSync(pat, src);

const g = await boot({ src: pat }); const { page } = g;
await g.intoWorld();
const out = await page.evaluate(() => {
  const cv = REN.domElement, W = cv.width, H = cv.height;
  const bx = px + 40, bz = pz + 40;
  const who = [['mark', { name: 'Torvald', role: 'villager', female: false }, { hat: 'none', beard: 'full', style: 'warrior' }],
    ['gatelands', { name: 'Aoife', role: 'villager', female: true }, {}], ['aurenne', { name: 'Margaux', role: 'merchant', female: true }, {}],
    ['gatelands', { name: 'Cathal', role: 'guard', female: false }, {}], ['aurenne', { name: 'Étienne', role: 'villager', female: false }, { hat: 'chaperon' }],
    ['mark', { name: 'Sigrun', role: 'elder', female: true }, { cloak: true, hat: 'hood' }]];
  const cam = new THREE.PerspectiveCamera(30, W / H, .05, 300);
  const rows = [], stat = {};
  for (const on of [false, true]) { PAO.on = on; const rigs = [];
    who.forEach(([nation, def, over], i) => { const gn = personGenome(def, { nation, key: 'proto' }); Object.assign(gn, over); const t0 = performance.now(); const rig = buildPerson(gn, { noLod: true });
      if (on) { stat[def.name] = { ms: +(performance.now() - t0).toFixed(1), tris: rig.tris }; const c = rig.geoHi.attributes.color.array; let lo = 1; }
      const x = bx + (i - 2.5) * .95; rig.root.position.set(x, WORLD.worldH(x, bz), bz); rig.root.rotation.y = 0; rig.root.visible = true; scene.add(rig.root); rigs.push(rig); });
    for (let f = 0; f < 30; f++) tickPeople(1 / 60, 1e7 + f * 16.7);
    const shots = [];
    for (const [hour, back, dist, cx] of [[12.5, false, 3.3, -1.425], [12.5, false, 3.3, 1.425], [17, true, 8, 0]]) { forceTime(hour); for (let f = 0; f < 3; f++) WORLD.tick(1 / 60, performance.now());
      const y = WORLD.worldH(bx + cx, bz) + .8; const a = back ? Math.PI + .35 : .2; cam.position.set(bx + cx + Math.sin(a) * dist, y + (back ? 1.3 : .25), bz + Math.cos(a) * dist); cam.lookAt(bx + cx, y - .05, bz);
      scene.updateMatrixWorld(true); REN.render(scene, cam); const o = document.createElement('canvas'); o.width = W; o.height = H * .8; o.getContext('2d').drawImage(cv, 0, H * .1, W, H * .8, 0, 0, W, H * .8); shots.push(o); }
    rigs.forEach(r => scene.remove(r.root)); rows.push(shots); }
  const pics = [0, 1, 2].map(s => { const c = document.createElement('canvas'), h = rows[0][s].height; c.width = W; c.height = h * 2 + 8; const x2 = c.getContext('2d'); x2.fillStyle = '#1a1612'; x2.fillRect(0, 0, c.width, c.height);
    x2.drawImage(rows[0][s], 0, 0); x2.drawImage(rows[1][s], 0, h + 8); x2.font = '20px serif'; x2.fillStyle = '#f0e6cc'; x2.fillText('today', 10, 26); x2.fillText('with occlusion', 10, h + 34);
    const id = x2.getImageData(0, 0, c.width, c.height), d = id.data; for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] / 12) * 12; x2.putImageData(id, 0, 0);
    return c.toDataURL(); });
  return { pics, stat }; });
out.pics.forEach((u, i) => fs.writeFileSync(path.join(here, '..', 'peopleao-' + (i + 1) + '.png'), Buffer.from(u.split(',')[1], 'base64')));
fs.rmSync(pat, { force: true });
console.log(JSON.stringify(out.stat)); console.log('errors', g.errs); await g.close();
