// The Sand Scorpion and the Shore Wisp (Session 224, Michael's answer B on Session 214: "as shown"). The scorpion is the
// spider's kit in sand with pincers on the fang bones and a jointed tail on its own bone that strikes over its head; the
// wisp a cold light: a white core in blue haloes, three motes circling, a tail of fading light.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const built = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); window._T = {}; const out = {};
  ['Sand Scorpion', 'Spider', 'Shore Wisp'].forEach((n, i) => { const x = px + fx * 30 + (i - 1) * 3, z = pz + fz * 30;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, n, null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh); _T[n] = e; const w = e.limbs && e.limbs.wolf;
    let boxes = 0, meshes = 0, additive = 0; e.mesh.traverse(o => { if (o.isMesh) { meshes++; if (o.geometry && o.geometry.type === 'BoxGeometry') boxes++; if (o.material && o.material.blending === THREE.AdditiveBlending) additive++; } });
    out[n] = { rig: !!w, scorpion: !!(w && w.k.scorpion), tail: !!(w && w.B.tail), bones: w ? w.mesh.skeleton.bones.length : 0, tris: w ? w.tris : 0, shape: e.shape, hp: e.maxHp, boxes, meshes, additive,
      motes: e.mesh.children.filter(c => c._mote != null).length, hover: !!e.mesh._hover, body: !!(e.limbs && e.limbs.body) }; });
  return out; });
const S = built['Sand Scorpion'], W = built['Shore Wisp'];
check('the sand scorpion is the spider\'s kit with a tail bone of its own, still a spider-shaped foe with its numbers, no box left', S.rig && S.scorpion && S.tail && S.bones === built.Spider.bones + 1 && S.shape === 'spider' && S.hp === 30 && S.boxes === 0, { S, spider: built.Spider });
check('the spider keeps its own bones and has no tail', built.Spider.rig && !built.Spider.tail && !built.Spider.scorpion, built.Spider);
check('the shore wisp is additive light: a core, haloes, three motes and a tail, no box (the rest its health bar)', W.boxes === 0 && W.additive === 15 && W.meshes - W.additive <= 2 && W.motes === 3 && W.hover && W.body, W);

// the tail: sways standing, cocks back through the wind-up, strikes forward over the head
const tail = await page.evaluate(() => { const e = _T['Sand Scorpion'], w = e.limbs.wolf; let t = 4e5; const run = n => { for (let i = 0; i < n; i++) { t += 16.7; tickCreatures(1 / 60, t); } return +w.B.tail.rotation.x.toFixed(2); };
  const rest = run(30); e._wind = 1; const wound = run(10); e._wind = 0; e._lunge = .15; const strike = run(1); e._lunge = null; const back = run(30);
  const fl = +w.B.fangL.rotation.z.toFixed(2); return { rest, wound, strike, back, fl }; });
check('the scorpion\'s tail cocks back through the wind-up and strikes forward over its head', tail.wound < -.2 && tail.strike > .6 && Math.abs(tail.back) < .1 && Math.abs(tail.rest) < .1, tail);

// the photograph: a bandit for scale, two scorpions (one striking), two spiders' worth of sand; then wisps at dusk
const shot = await page.evaluate(() => { const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60; const outs = [];
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const grab = (objs, cp, look) => { cam.position.set(bx + cp[0], y + cp[1], bz + cp[2]); cam.lookAt(bx + look[0], y + look[1], bz + look[2]); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); objs.forEach(x => sc.remove(x)); outs.push(o.toDataURL()); };
  const floor = c => { const f = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ color: c })); f.rotation.x = -Math.PI / 2; f.position.set(bx, y, bz); sc.add(f); return f; };
  const bandit = x => { const r = buildFoe('Bandit', 3, 3); PEOPLE_RIGS.delete(r); pwApply(r, pwIdle(1, { holds: r.holds, gear: r.g.gear })); r.root.position.set(bx + x, y, bz); r.root.rotation.y = .35; sc.add(r.root); return r.root; };
  forceTime(12); let objs = [floor(0xc8b27a), bandit(-2.3)];
  [[-.8, .6, 0], [1.2, -.5, 1]].forEach(([x, ry, strike]) => { const w = buildSpider('Sand Scorpion', 1.2); WOLF_RIGS.delete(w); w.root.position.set(bx + x, y, bz); w.root.rotation.y = ry; sc.add(w.root); objs.push(w.root);
    const P = sgStand(1); if (strike) sgAttack(0, 1, P); P.tail = strike ? .9 : 0; sgApply(w, P); });
  grab(objs, [0, 2.2, 5.2], [0, .25, 0]);
  forceTime(20.5); objs = [floor(0x8a8060), bandit(-2.2)];
  for (let i = 0; i < 3; i++) { const e = buildZoneEnemy(sc, [], bx - .6 + i * 1.3, bz + (i % 2 ? .6 : 0), 'Shore Wisp', null); e.mesh.position.set(bx - .6 + i * 1.3, y, bz + (i % 2 ? .6 : 0)); e.mesh.rotation.y = .4 + i; e.mesh.visible = true; if (!e.mesh.parent) sc.add(e.mesh);
    e.mesh.children.forEach(c => { if (c.isMesh && !c.material.blending) c.visible = false; }); objs.push(e.mesh); }
  grab(objs, [0, 1.2, 6], [0, .7, 0]); return outs; });
fs.writeFileSync('tests/out/scorpion.png', Buffer.from(shot[0].split(',')[1], 'base64'));
fs.writeFileSync('tests/out/wisp.png', Buffer.from(shot[1].split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
