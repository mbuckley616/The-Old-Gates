// The townsperson (Session 153): one skinned mesh per person, a genome per name and place, a gait with planted feet.
import { boot, check, ROOT } from './lib/game.mjs';
import { execSync } from 'child_process';
import fs from 'fs'; import path from 'path';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const rigs = await page.evaluate(() => { const rs = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene);
  return { n: rs.length, skinned: rs.filter(r => r.mesh.isSkinnedMesh && r.mesh.skeleton.bones.length >= 17 && r.mesh.skeleton.bones.length <= 20 && r.root.children.length === 1).length,
    tris: rs.map(r => r.tris), styles: new Set(rs.map(r => r.g.style)).size, beards: new Set(rs.map(r => r.g.beard)).size, hats: new Set(rs.map(r => r.g.hat)).size,
    skins: new Set(rs.map(r => r.g.skin.getHex())).size, roles: [...new Set(rs.map(r => r.g.role))].slice(0, 12) }; });
// (Session 267: a cloak adds two bones and back hair one, the swinging parts')
check('every townsperson is one skinned mesh on seventeen bones (and up to three more for a cloak and back hair)', rigs.n >= 8 && rigs.skinned === rigs.n && rigs.tris.every(t => t > 1500 && t < 9000), { n: rigs.n, skinned: rigs.skinned, tris: [Math.min(...rigs.tris), Math.max(...rigs.tris)] });
check('and no two look the same', rigs.styles >= 4 && rigs.skins >= 4 && rigs.hats >= 2, rigs);

const det = await page.evaluate(() => { const pick = x => [x.style, x.beard, x.hat, x.skin.getHex(), x.hair.getHex(), x.height.toFixed(4), x.female, x.age];
  const a = personGenome({ name: 'Niamh', role: 'Villager', people: 'gatelander' }, { nation: 'gatelands', key: 'dunmore' }), b = personGenome({ name: 'Niamh', role: 'Villager', people: 'gatelander' }, { nation: 'gatelands', key: 'dunmore' });
  const c = personGenome({ name: 'Niamh', role: 'Villager', people: 'gatelander' }, { nation: 'gatelands', key: 'portclare' });
  const ob = personGenome({ name: 'Sadb', role: 'Villager', people: 'oldblood' }, { nation: 'mark', key: 'x' });
  return { same: JSON.stringify(pick(a)) === JSON.stringify(pick(b)), elsewhere: JSON.stringify(pick(a)) !== JSON.stringify(pick(c)), female: a.female, tattoo: ob.tattoo, greyEyes: ob.eye.getHex() === 0xb4bcc2 }; });
check('the same name in the same place is the same person; the Old Blood wear their wrists', det.same && det.elsewhere && det.female && det.tattoo && det.greyEyes, det);

// walk one of them: the stride follows the ground covered, and the standing foot stays where it was put
const walk = await page.evaluate(() => { const rig = [...PEOPLE_RIGS].find(r => r.root.parent === WORLD.scene && r.root.visible && !r.g.gear); window._wr = rig; const root = rig.root;
  const fyaw = root.rotation.y, step = .012; const vL = new THREE.Vector3(), vR = new THREE.Vector3(); let prev = null, worstStill = 0, swingMoved = 0;
  tickPeople(1 / 60, 1e5); const ph0 = rig.phase; // sync to where the town's own schedule has walked them
  for (let i = 1; i <= 90; i++) { root.position.x += Math.sin(fyaw) * step; root.position.z += Math.cos(fyaw) * step; tickPeople(1 / 60, 1e5 + i * 16.7); root.updateMatrixWorld(true);
    rig.B.anL.getWorldPosition(vL); rig.B.anR.getWorldPosition(vR); const cur = [vL.clone(), vR.clone()];
    // the stiller foot is the one carrying the body; it should not move at all
    if (prev && i > 30) { const dL = cur[0].distanceTo(prev[0]), dR = cur[1].distanceTo(prev[1]); worstStill = Math.max(worstStill, Math.min(dL, dR)); swingMoved = Math.max(swingMoved, Math.max(dL, dR)); } prev = cur; }
  const s = root.scale.x; const expect = (90 * step) / (PW.cycle * s);
  return { walk: rig.w.walk, phaseAdv: ((rig.phase - ph0 + 10) % 1).toFixed(3), expect: (expect % 1).toFixed(3), stillMm: +(worstStill * 1000).toFixed(2), swingMm: +(swingMoved * 1000).toFixed(1), scale: +s.toFixed(3) }; });
check('walking: the stride tracks the ground, the standing foot holds still while the other swings', walk.walk > .9 && Math.abs(+walk.phaseAdv - +walk.expect) < .01 && walk.stillMm < 2 && walk.swingMm > 8, walk);
const idle = await page.evaluate(() => { const rig = window._wr; for (let i = 0; i < 90; i++) tickPeople(1 / 60, 2e5 + i * 16.7); return { walk: rig.w.walk, idle: rig.w.idle }; });
check('standing still, the walk fades out', idle.walk < .1 && idle.idle > .9, idle);

// the keeper behind the counter is the keeper in the street
const keeper = await page.evaluate(() => { forceTime(12); const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.keeper && /weapon|armor|potion|misc/.test(x.type) && PEOPLE_GENOMES.has(x.keeper + '|dunmore'));
  if (!h) return { none: true, keepers: S.houses.filter(x => x.keeper).map(x => x.keeper + ':' + x.type).slice(0, 6) }; window._kh = h; px = h.exitX; pz = h.exitZ; goToInterior(h); return { name: h.keeper, type: h.type }; });
await page.waitForTimeout(5000); await g.hide();
const inside = await page.evaluate(() => { const rig = intNPCMesh && intNPCMesh.userData.rig; const street = PEOPLE_GENOMES.get(window._kh.keeper + '|dunmore');
  for (let i = 0; i < 30; i++) tickPeople(1 / 60, 3e5 + i * 16.7); const posed = rig && rig.B.head.rotation.x !== 0;
  return { has: !!rig, same: !!rig && rig.g === street, posed, scene: scene === interiorScene }; });
check('indoors, the keeper is the same person, and still breathes', !keeper.none && inside.has && inside.same && inside.posed && inside.scene, { keeper, inside });
await page.evaluate(() => exitInterior()); await page.waitForTimeout(3000); await g.hide();

// a guard at night carries the torch in the left hand
const torch = await page.evaluate(() => { forceTime(22); for (let i = 0; i < 240; i++) WORLD.tick(1 / 60, performance.now());
  const rs = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene); const held = rs.filter(r => r.B.wrL.children.some(c => c.userData && c.userData.light));
  return { guards: rs.filter(r => r.g.gear === 'spear').length, torches: held.length }; });
check('a guard at night carries the torch in the left hand', torch.torches >= 1, torch);

// the cost, against the previous build, in the same town from the same spot
await page.evaluate(() => { forceTime(12); const S = WORLD.settle.get('dunmore'); px = S.site.x; pz = S.site.z + 6; });
await page.waitForTimeout(2500);
// stand 2.6 units from the nearest townsperson, facing them (the camera looks along -sin yaw, -cos yaw)
// the photograph: a townsperson's own genome, placed in the open on the road outside town, 2.5 units ahead of the camera
const shotAt = await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + t.pad + 6; yaw = Math.PI; pitch = -.08;
  const src = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene && /villager|farmer|elder/.test(r.g.role))[2] || [...PEOPLE_RIGS][0];
  const rig = buildPerson(src.g); window._sr = rig; return rig.g.name + ' (' + rig.g.role + ')'; });
// a frame can take seconds on software GL: wait until the camera has actually arrived before placing the subject in front of it
for (let k = 0; k < 40 && !(await page.evaluate(() => Math.hypot(CAM.position.x - px, CAM.position.z - pz) < 1)); k++) await page.waitForTimeout(500);
await page.waitForTimeout(1500);
await page.evaluate(() => { const dir = new THREE.Vector3(); CAM.getWorldDirection(dir); const rig = window._sr; const fx = CAM.position.x + dir.x * 2.5, fz = CAM.position.z + dir.z * 2.5;
  rig.root.position.set(fx, WORLD.worldH(fx, fz), fz); rig.root.rotation.y = Math.atan2(-dir.x, -dir.z); scene.add(rig.root); });
// slow CI runners can take over 30s to hand over a frame here (Session 156); the photograph is not an assertion
await page.waitForTimeout(2500); await page.screenshot({ path: 'tests/out/people-town.png', timeout: 120000 });
const onScreen = await page.evaluate(() => { const h = new THREE.Vector3(); window._sr.root.updateMatrixWorld(true); window._sr.B.head.getWorldPosition(h); const p = h.project(CAM); return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(3) }; });
check('the townsperson is in the frame in front of the camera', Math.abs(onScreen.x) < .5 && Math.abs(onScreen.y) < .6 && onScreen.z < 1, onScreen);
const cost = await page.evaluate(() => { REN.render(scene, CAM); const i = REN.info.render; const t0 = performance.now(); for (let k = 0; k < 200; k++) tickPeople(1 / 60, 4e5 + k * 16.7); const ms = (performance.now() - t0) / 200;
  const rs = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene); const bs = rs[0].mesh.geometry.boundingSphere;
  return { calls: i.calls, triangles: i.triangles, people: rs.length, shown: rs.filter(r => r.root.visible).length, sphere: [+bs.center.y.toFixed(2), +bs.radius.toFixed(2)], tickMs: +ms.toFixed(3) }; });
// no greeting wave (Session 185, playtest s162): walk up to a standing townsperson and they keep to idle; the pose is
// still in the kit, and a scripted moment that sets wavedAt gets it
const greet = await page.evaluate(() => { const rig = [...PEOPLE_RIGS].find(r => r.root.parent === WORLD.scene && r.root.visible && !r.foe); const at = new THREE.Vector3(); rig.root.getWorldPosition(at);
  let t = 2e6; let maxWave = 0; px = at.x + 5; pz = at.z; for (let i = 0; i < 120; i++) { px = at.x + 5 - i * .035; tickPeople(1 / 60, t += 16.7); maxWave = Math.max(maxWave, rig.w.wave); }
  rig.wavedAt = t; for (let i = 0; i < 40; i++) tickPeople(1 / 60, t += 16.7); return { walkedUpWave: +maxWave.toFixed(3), scripted: +rig.w.wave.toFixed(2), greet: PW.GREET }; });
check('walking up to a townsperson brings no wave; a scripted wave still plays', greet.walkedUpWave < .01 && greet.scripted > .5 && greet.greet === false, greet);
// the hem's trim ring sits on the skirt (Session 186, playtest s162): the skirt is flattened to .76 front to back and the
// ring was round, so it stood off the cloth before and behind; at the hem's height the depth is now the skirt's .76 of the width
const hem = await page.evaluate(() => { const out = [];
  for (const [name, dress] of [['Aoife', false], ['Brendan', false], ['Deirdre', true], ['Maeve', true]]) { const gn = personGenome({ name, role: 'villager' }, { key: 'hemtest' }); gn.dress = dress; gn.cloak = false; gn.apron = null;
    const r = buildPerson(gn, { noLod: true }); PEOPLE_RIGS.delete(r); const P = r.mesh.geometry.attributes.position; const y0 = PW.HIPS + (dress ? -.36 - PW.DL : -.125);
    let dx = 0, dz = 0; for (let i = 0; i < P.count; i++) { if (Math.abs(P.getY(i) - y0) > .014) continue; dx = Math.max(dx, Math.abs(P.getX(i))); dz = Math.max(dz, Math.abs(P.getZ(i))); }
    r.mesh.geometry.dispose(); out.push({ name, dress, width: +dx.toFixed(3), depth: +dz.toFixed(3), ratio: +(dz / dx).toFixed(2) }); }
  return out; });
check('the hem ring hugs the skirt front and back (tunic and dress)', hem.every(h => h.ratio < .85), hem);
// the legs (Session 187, playtest s162: the legs read short): the hip joint at 43% of the height or more (it was 37%), and a
// person as tall as before (the figure is scaled back by PW.BODY), so doors, bars and the camera are unchanged
const legs = await page.evaluate(() => { const out = [];
  for (const n of ['Aoife', 'Brendan', 'Cathal']) { const gn = personGenome({ name: n, role: 'villager' }, { key: 'legtest' }); gn.hat = 'none'; gn.style = 'buzz';
    const r = buildPerson(gn, { noLod: true }); PEOPLE_RIGS.delete(r); r.mesh.geometry.computeBoundingBox(); const top = r.mesh.geometry.boundingBox.max.y;
    out.push({ n, hip: +((PW.HIPS - PW.HIPJ) / top).toFixed(3), tall: +(top * r.root.scale.y).toFixed(3), was: +(gn.height * 1.225).toFixed(3) }); r.mesh.geometry.dispose(); }
  return out; });
check('the legs are longer (hip joint at 43%+ of the height) and a person is as tall as before', legs.every(l => l.hip >= .43 && Math.abs(l.tall - l.was) / l.was < .02), legs);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();

// the previous build, same town: draw calls and triangles for the whole view
const old = path.join(ROOT, 'tests', 'tmp', 'old.html'); fs.mkdirSync(path.dirname(old), { recursive: true });
fs.writeFileSync(old, execSync('git show HEAD:index.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }));
const o = await boot({ src: old }); await o.intoWorld(); await o.settle('dunmore');
await o.page.evaluate(() => { forceTime(12); const S = WORLD.settle.get('dunmore'); px = S.site.x; pz = S.site.z + 6; }); await o.page.waitForTimeout(2500);
const before = await o.page.evaluate(() => { REN.render(scene, CAM); const i = REN.info.render; return { calls: i.calls, triangles: i.triangles }; });
await o.close();
console.log('  cost  before ' + JSON.stringify(before) + '  after ' + JSON.stringify(cost) + '  shot: ' + shotAt);
