// The Bog Crawler as a giant water bug (Session 234, Michael's answer B on Session 225): the spider's kit with legs of its
// own, a flat oval body, wing covers and a beak; the raptorial forelegs held up on the fang bones, each with a hooked tibia
// that opens through the wind-up and snaps shut on the strike; it walks on the other four legs in diagonal pairs.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });

const built = await page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); const x = px + fx * 30, z = pz + fz * 30;
  const e = buildZoneEnemy(WORLD.scene, [], x, z, 'Bog Crawler', null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh); window._B = e;
  const e2 = buildZoneEnemy(WORLD.scene, [], x + 3, z, 'Bog Crawler', null); if (!e2.mesh.parent) WORLD.scene.add(e2.mesh);
  const w = e.limbs && e.limbs.wolf; let boxes = 0, meshes = 0; e.mesh.traverse(o => { if (o.isMesh && !(o.userData && o.userData.hpBar)) { meshes++; if (o.geometry && o.geometry.type === 'BoxGeometry') boxes++; } });
  return { rig: !!w, bug: !!(w && w.k.bug), bones: w ? w.mesh.skeleton.bones.length : 0, hooks: !!(w && w.B.hookL && w.B.hookR), feet: w ? spiderFeet(w.k).length : 0, tris: w ? w.tris : 0, trisLo: w ? w.trisLo : 0,
    shape: e.shape, hp: e.maxHp, dmg: e.dmg, boxes, meshes, shared: w && w.mesh.geometry === e2.limbs.wolf.mesh.geometry, ownMat: w && w.mesh.material !== e2.limbs.wolf.mesh.material }; });
check('the bog crawler is one skinned mesh on 18 bones (four walking legs, two forelegs with a hook each) plus its eyes, its numbers unchanged, no box',
  built.rig && built.bug && built.bones === 18 && built.hooks && built.feet === 4 && built.meshes === 2 && built.boxes === 0 && built.shape === 'spider' && built.hp === 26 && built.dmg === 7
  && built.shared && built.ownMat && built.tris > 1500 && built.tris < 9000 && built.trisLo < built.tris * .75, built);

// the reach: every walking foot through both strides and the attack is within its leg's length
const reach = await page.evaluate(() => { const K = SPIDER_KINDS['Bog Crawler'], LG = K.legs, F = spiderFeet(K); let worst = 0;
  const one = (feet, drop) => F.forEach((L, k) => { const f = feet[k], lg = LG[L.i]; worst = Math.max(worst, Math.hypot(L.fx + f[0] - L.hx, -K.H + drop + f[1], L.fz + f[2] - L.hz) / (lg[3] + lg[4])); });
  for (const G of [SG, SG.RUN]) for (let q = 0; q < 200; q++) { const ph = q / 200, h = G.S / 2; one(F.map((L, k) => { const u = ((ph + .5 * SG.group(k)) % 1 + 1) % 1; if (u < G.D) return [0, 0, h - G.S * u / G.D]; const s = (u - G.D) / (1 - G.D); return [0, G.LIFT * Math.sin(Math.PI * s), -h + G.S * s * s * (3 - 2 * s)]; }), G === SG ? .006 : .024); }
  one(F.map(() => [0, 0, -.03]), -.03);
  const pairs = F.map((L, k) => L.n + SG.group(k)).join(' ');
  return { worstReach: +worst.toFixed(3), pairs }; });
check('the walking legs are never asked past their length, and they step in diagonal pairs (L0 with R1, R0 with L1)', reach.worstReach < 1 && reach.pairs === 'L00 R01 L11 R10', reach);

// drive it along its facing: each planted foot stays put and sits on the ground
const drive = (pace, n) => page.evaluate(([pace, n]) => { const e = _B, rig = e.limbs.wolf, G = e.mesh, F = spiderFeet(rig.k); const fy = .4; G.rotation.set(0, fy, 0); const step = pace / 60;
  const feet = F.map(L => rig.B['tib' + L.n]); const tip = F.map(L => rig.k.legs[L.i][4]); const v = new THREE.Vector3(); const t0 = 2e5 + (window._bt = (window._bt || 0) + n * 17);
  const pos = () => feet.map((b, k) => v.set(tip[k], 0, 0).applyMatrix4(b.matrixWorld).clone());
  let prev = null, pph = 0, still = 0, swing = 0, grounded = [1e9, -1e9];
  for (let i = 1; i <= n; i++) { e.x += Math.sin(fy) * step; e.z += Math.cos(fy) * step; G.position.set(e.x, WORLD.worldH(e.x, e.z), e.z); tickCreatures(1 / 60, t0 + i * 16.7); G.updateMatrixWorld(true);
    const cur = pos(); if (i > n - 90 && prev) { for (let k = 0; k < F.length; k++) { const Gd = rig.run ? SG.RUN.D : SG.D; const a = ((rig.phase + .5 * SG.group(k)) % 1 + 1) % 1, b = ((pph + .5 * SG.group(k)) % 1 + 1) % 1; const d = cur[k].distanceTo(prev[k]); swing = Math.max(swing, d);
        if (a < Gd && b < Gd && a > b) { still = Math.max(still, d); const y = cur[k].y - G.position.y; grounded = [Math.min(grounded[0], y), Math.max(grounded[1], y)]; } } }
    prev = cur; pph = rig.phase; }
  return { pace, run: rig.run, stillMm: +(still * 1000).toFixed(2), swingMm: +(swing * 1000).toFixed(1), plantedYmm: grounded.map(y => +(y * 1000).toFixed(1)) }; }, [pace, n]);
const wander = await drive(.42, 150), chase = await drive(1.5, 150);
check('walking and running, the planted feet stay put on the ground and the swinging ones travel', !wander.run && chase.run && wander.stillMm < 1 && chase.stillMm < 1.5 && chase.swingMm > 15 && Math.abs(wander.plantedYmm[0]) < 3 && Math.abs(chase.plantedYmm[1]) < 3, { wander, chase });

// the forelegs: the claw's tip measured from the femur's base; wide open through the wind-up, snapped shut on the strike
const atk = await page.evaluate(() => { const e = _B, rig = e.limbs.wolf, G = e.mesh; let t = 4e5; const v = new THREE.Vector3(), o = new THREE.Vector3(); const A = BUG_ARM;
  const run = n => { for (let i = 0; i < n; i++) { t += 16.7; tickCreatures(1 / 60, t); } G.updateMatrixWorld(true); const s = rig.root.scale.x * G.scale.x;
    o.setFromMatrixPosition(rig.B.fangL.matrixWorld); v.set(A.claw[0], A.claw[1], A.claw[2]).applyMatrix4(rig.B.hookL.matrixWorld);
    const vr = new THREE.Vector3(-A.claw[0], A.claw[1], A.claw[2]).applyMatrix4(rig.B.hookR.matrixWorld), orr = new THREE.Vector3().setFromMatrixPosition(rig.B.fangR.matrixWorld);
    return { reach: +(v.distanceTo(o) / s).toFixed(3), reachR: +(vr.distanceTo(orr) / s).toFixed(3), up: +((v.y - o.y) / s).toFixed(3) }; };
  const rest = run(30); e._wind = 1; const wound = run(12); e._wind = 0; e._lunge = .15; const strike = run(1); e._lunge = null; const back = run(40);
  e.dead = true; run(1); const dead = { fang: +rig.B.fangL.rotation.x.toFixed(2), drop: +(SPIDER_KINDS['Bog Crawler'].H - rig.B.body.position.y).toFixed(3) }; e.dead = false; rig.deadPosed = false;
  return { rest, wound, strike, back, dead }; });
check('the forelegs open wide and rise through the wind-up, snap shut on the strike, both sides alike, and settle back', atk.wound.reach > atk.rest.reach + .05 && atk.wound.up > atk.rest.up && atk.strike.reach < atk.rest.reach - .03
  && Math.abs(atk.wound.reach - atk.wound.reachR) < .002 && Math.abs(atk.back.reach - atk.rest.reach) < .03 && atk.dead.fang > .2 && atk.dead.drop > .05, atk);

// the photographs: a bandit for scale, a spider, two water bugs (one striking); then close, from above at three-quarters
const shot = await page.evaluate(() => { const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60; const outs = [];
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const grab = (objs, cp, look) => { cam.position.set(bx + cp[0], y + cp[1], bz + cp[2]); cam.lookAt(bx + look[0], y + look[1], bz + look[2]); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); objs.forEach(x => sc.remove(x)); outs.push(o.toDataURL()); };
  const floor = c => { const f = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ color: c })); f.rotation.x = -Math.PI / 2; f.position.set(bx, y, bz); sc.add(f); return f; };
  const bandit = x => { const r = buildFoe('Bandit', 3, 3); PEOPLE_RIGS.delete(r); pwApply(r, pwIdle(1, { holds: r.holds, gear: r.g.gear })); r.root.position.set(bx + x, y, bz); r.root.rotation.y = .35; sc.add(r.root); return r.root; };
  const sp = (name, s, x, z, ry, pose) => { const w = buildSpider(name, s); WOLF_RIGS.delete(w); w.root.position.set(bx + x, y, bz + z); w.root.rotation.y = ry; sc.add(w.root); sgApply(w, pose(w.k)); return w.root; };
  const stand = K => sgStand(1, K), strike = K => sgAttack(0, 1, sgStand(1, K), K), wound = K => sgAttack(1, 0, sgStand(1, K), K);
  forceTime(12); const s = .8 * 1.4;
  grab([floor(0x4e5a3a), bandit(-2.6), sp('Spider', s, -1.3, .2, .6, stand), sp('Bog Crawler', s, .3, 0, .7, stand), sp('Bog Crawler', s, 2.0, 0, -.6, strike)], [0, 2.1, 5.6], [0, .25, 0]);
  grab([floor(0x4e5a3a), sp('Bog Crawler', 1.6, -1.1, 0, .9, stand), sp('Bog Crawler', 1.6, 1.1, 0, -.9, wound)], [0, 2.4, 3.4], [0, .2, 0]);
  return outs; });
fs.writeFileSync('tests/out/crawler.png', Buffer.from(shot[0].split(',')[1], 'base64'));
fs.writeFileSync('tests/out/crawler-close.png', Buffer.from(shot[1].split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
