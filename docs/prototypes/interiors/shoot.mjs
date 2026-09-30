// node docs/prototypes/interiors/shoot.mjs -> docs/prototypes/interiors/*.png
// Backlog H.5, "props": the furniture inside homes and inns is still boxes, one mesh and one material each. This patches a
// COPY of the game (index.html is not changed) to mark where buildInteriorFor's trade furnishing starts and ends, walks into
// a Dunmore home and its inn, renders the room as it is, then takes today's furniture out (lights, shell, doors, the resident
// and the upstairs stay) and puts furniture.js's pieces at the same places, and renders again from the same camera.
// Also a line-up of the pieces, front and side, beside a townsperson for scale.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..', '..');
let src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const a = '    // ── trade furnishing ─', b = '    // v80 S131 — interior variety';
if (!src.includes(a) || !src.includes(b)) throw new Error('markers not found');
src = src.replace(a, '    sc_.userData.pre=sc_.children.slice();\n' + a).replace(b, '    sc_.userData.furn=sc_.children.filter(o=>!sc_.userData.pre.includes(o));\n' + b);
const tmp = path.join(ROOT, 'tests', 'tmp'); fs.mkdirSync(tmp, { recursive: true }); const patched = path.join(tmp, 'interiors.src.html'); fs.writeFileSync(patched, src);
const g = await boot({ src: patched }); const { page } = g;
await page.addScriptTag({ path: path.join(here, 'furniture.js') });
await g.intoWorld(); await g.settle('dunmore');
const save = (name, url) => fs.writeFileSync(path.join(here, name), Buffer.from(url.split(',')[1], 'base64'));
const stats = {};
for (const kind of ['home', 'inn']) {
  const info = await page.evaluate((kind) => { const S = WORLD.settle.get('dunmore'); const h = kind === 'home' ? S.houses.find(x => x.type === 'home' && !x.two && (x.w || 6) >= 6) || S.houses.find(x => x.type === 'home') : S.houses.find(x => x.type === 'inn');
    window._h = h; px = h.exitX; pz = h.exitZ; goToInterior(h); return { id: h.id, style: h.style, two: !!h.two, w: h.w, d: h.d }; }, kind);
  await page.waitForTimeout(5000); await g.hide();
  const out = await page.evaluate(({ kind, info }) => { const h = window._h, sc = interiorScene, W = h.intW, D = h.intD, st = h.style || 'irish';
    const ceil = st === 'stone' ? 2.6 : st === 'french' ? 2.4 : st === 'anglo' ? 2.0 : 2.1, gallery = !!h.two, Hh = gallery ? ceil * 1.85 : ceil;
    const cv = REN.domElement, CW = cv.width, CH = cv.height, TW = CW / 2, TH = CH / 2;
    const cam = new THREE.PerspectiveCamera(58, CW / CH, .05, 80);
    const VIEWS = kind === 'home' ? [[W * .4, 1.15, D * .74, W * .72, .4, D * .4], [W * .62, 1.15, D * .3, W * .08, .3, D * .1]]
      : [[W * .8, 1.6, D - .8, W * .42, .45, D * .28], [W * .32, 1.3, D * .84, W - .5, .7, D * .48]];
    // a townsperson for scale, by the table
    const who = buildNPCMesh({ name: 'Nuala', role: 'villager', people: 'gatelander', female: true }, { nation: 'gatelands', key: 'proto' }); who.position.set(W / 2 + .35, 0, D * .5 + .95); who.rotation.y = Math.PI * .85; sc.add(who);
    const shot = v => { cam.position.set(v[0], v[1], v[2]); cam.lookAt(v[3], v[4], v[5]); sc.updateMatrixWorld(true); REN.info.autoReset = false; REN.info.reset(); REN.render(sc, cam); const r = { calls: REN.info.render.calls, tris: REN.info.render.triangles }; REN.info.autoReset = true;
      const o = document.createElement('canvas'); o.width = TW; o.height = TH; o.getContext('2d').drawImage(cv, 0, 0, CW, CH, 0, 0, TW, TH); return [o, r]; };
    const T0 = VIEWS.map(shot), r0 = T0[0][1];
    const furn = sc.userData.furn.filter(o => !o.isLight && o.parent === sc);
    let meshes = 0, tris = 0; for (const o of furn) o.traverse(m => { if (m.isMesh) { meshes++; const gg = m.geometry; tris += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; } });
    for (const o of furn) sc.remove(o);
    const F = FURN(THREE, SK), room = F.bake(kind === 'home' ? F.home(W, D, Hh, 'gatelands', 7) : F.inn(W, D, Hh, 'gatelands', 7, gallery)); sc.add(room);
    const T1 = VIEWS.map(shot), r1 = T1[0][1];
    const c = document.createElement('canvas'); c.width = TW * 2; c.height = TH * 2; const x = c.getContext('2d');
    T0.forEach((t, i) => x.drawImage(t[0], 0, i * TH)); T1.forEach((t, i) => x.drawImage(t[0], TW, i * TH));
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, TW * 2, 26); x.fillStyle = '#fff'; x.font = '15px sans-serif';
    x.fillText(`today: ${meshes} furniture meshes, ${Math.round(tris)} triangles`, 8, 18); x.fillText(`proposed: 2 meshes (wood and stone; flames), ${Math.round(room.userData.tris)} triangles`, TW + 8, 18);
    x.fillStyle = '#fff'; x.fillRect(TW - 1, 0, 2, TH * 2); x.fillRect(0, TH - 1, TW * 2, 2);
    return { png: c.toDataURL(), today: { meshes, tris: Math.round(tris), frame: r0 }, proposed: { meshes: 2, tris: Math.round(room.userData.tris), frame: r1 }, room: { W, D, H: Hh, st, gallery } }; }, { kind, info });
  save(kind + '.png', out.png); delete out.png; stats[kind] = Object.assign(out, { house: info });
  await page.evaluate(() => { try { exitInterior(); } catch (e) {} });
  await page.waitForTimeout(2500); await g.hide();
}
// the pieces, lined up with a townsperson, front and three-quarter, in a neutral room light
const lineup = await page.evaluate(() => { const F = FURN(THREE, SK), sc = new THREE.Scene(); sc.background = new THREE.Color(0x2a221c);
  sc.add(new THREE.HemisphereLight(0xfff0dc, 0x3a2a1c, .75)); const sun = new THREE.DirectionalLight(0xffe8c8, .75); sun.position.set(-3, 6, 8); sc.add(sun);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshLambertMaterial({ color: 0x5a4a38 })); fl.rotation.x = -Math.PI / 2; sc.add(fl);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), new THREE.MeshLambertMaterial({ color: 0x8a7a64 })); wall.position.set(0, 3, -.02); sc.add(wall);
  const SETS = { home: [['bed', F.bed('gatelands', 3), 1.0, Math.PI / 2], ['chair', F.chair('gatelands', 4), .25, 0], ['table', F.table(1.5, .9, 'gatelands', 5), .8, 0], ['chest', F.chest('gatelands', 8), .4, 0],
      ['hearth', F.hearth(1.8, 2.1, 'gatelands', 9), .95, 0], ['shelf', F.shelf(1.2, 'gatelands', 10), .65, 0]],
    nations: ['gatelands', 'mark', 'aurenne'].flatMap((n, i) => [[n + ' bed', F.bed(n, 3 + i), .5, 0], [n + ' chair', F.chair(n, 4 + i), .22, 0], [n + ' chest', F.chest(n, 8 + i), .45, 0]]),
    inn: [['bench', F.bench(1.4, 'gatelands', 6), .72, 0], ['stool', F.stool('gatelands', 7), .2, 0], ['counter', F.counter(2.2, 'gatelands', 11), 1.15, 0], ['cask', F.cask('gatelands', 12), .35, 0], ['dresser', F.dresser(1.6, 'gatelands', 13), .85, 0]] };
  const tri = {}, shots = []; let personH = 0; const cv = REN.domElement, CW = cv.width, CH = cv.height;
  for (const set of ['home', 'inn', 'nations']) { let x = 0; const G = new THREE.Group(); sc.add(G);
    for (const [name, p, half, ry] of SETS[set]) { x += half; const m = F.bake(p); m.position.set(x, name === 'shelf' ? .8 : 0, name === 'hearth' || name === 'dresser' || name === 'shelf' ? 0 : .6); m.rotation.y = ry; G.add(m); tri[name] = m.userData.tris; x += half + .25; }
    const who = buildNPCMesh({ name: 'Cathal', role: 'villager', people: 'gatelander' }, { nation: 'gatelands', key: 'proto' }); who.position.set(x + .1, 0, .9); G.add(who);
    const bb = new THREE.Box3().setFromObject(who); personH = bb.max.y - bb.min.y; G.position.x = -(x + .3) / 2;
    const span = x + .6;
    for (const [side, ly] of set === 'nations' ? [[1, .3]] : [[0, .5], [1, .4]]) { const cam = new THREE.PerspectiveCamera(36, CW / CH, .05, 80), dist = span / 2 / Math.tan(18 * Math.PI / 180) / (CW / CH) + 1.2;
      if (side) cam.position.set(-span * .38, 1.9, dist * .8); else cam.position.set(0, 1.0, dist); cam.lookAt(side ? -span * .08 : 0, ly, .3);
      sc.updateMatrixWorld(true); REN.render(sc, cam); const o = document.createElement('canvas'); o.width = CW; o.height = CH; const c = o.getContext('2d'); c.drawImage(cv, 0, 0);
      c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, CW, 26); c.fillStyle = '#fff'; c.font = '15px sans-serif';
      c.fillText(SETS[set].map(q => q[0] + ' ' + q[1] && (q[0] + ' ' + tri[q[0]])).join(' · ') + ' triangles — a townsperson ' + personH.toFixed(2) + ' tall', 8, 18); shots.push([set + (side ? '-side' : '-front'), o.toDataURL()]); }
    sc.remove(G); }
  return { shots, tri, personH }; });
for (const [n, u] of lineup.shots) save('pieces-' + n + '.png', u);
stats.pieces = lineup.tri; stats.personH = lineup.personH;
fs.writeFileSync(path.join(here, 'stats.json'), JSON.stringify(stats, null, 1));
console.log(JSON.stringify(stats, null, 1)); console.log('errors', g.errs); await g.close();
