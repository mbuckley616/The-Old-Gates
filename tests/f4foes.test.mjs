// Card F4 (Session 1201): on the new look the human foes wear the builder's bodies, as the townsfolk have since Session 1195.
// A line of the nine kinds of FOE_DRESS that are people (and a Hollowed, which is not) ahead of you in the open world: each is
// built on the builder's 163-bone skeleton over its 17-bone driver, its genome rolled from its foe id (keyFoe, the co-op rule's
// place and index) and dressed from its kind; its weapon stays the game's, in the builder's fist; it glows with the tell; and
// killed, its corpse is darkened with the garments' shaders kept. Pictures: docs/prototypes/f4/f4-foes.jpg and f4-foes-near.jpg.
import { boot, check, ROOT } from './lib/game.mjs';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

const KINDS = ['Bandit', 'Bandit Archer', 'Highwayman', 'Deserter', 'Cultist', 'Rogue Mage', 'Pirate', 'Bandit Captain', 'Shieldbearer', 'Hollowed'];
const g = await boot({ look: 'new' }); const { page } = g;
await g.intoWorld();

const made = await page.evaluate((KINDS) => { forceTime(12);
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  // a clear line 9 m ahead, 1.6 m apart across it
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), sx = -fz, sz = fx;
  const clear = (x, z) => { for (let dx = -2; dx <= 2; dx += .5) for (let dz = -2; dz <= 2; dz += .5) if (WORLD.solidAt(x + dx, z + dz)) return false; return true; };
  let d = 9; for (; d < 60; d += 3) { let ok = true; for (let i = 0; i < KINDS.length; i++) if (!clear(px + fx * d + sx * (i - 4.5) * 1.6, pz + fz * d + sz * (i - 4.5) * 1.6)) { ok = false; break; } if (ok) break; }
  window._F = KINDS.map((n, i) => { const x = px + fx * d + sx * (i - 4.5) * 1.6, z = pz + fz * d + sz * (i - 4.5) * 1.6;
    // the Shieldbearer is the dungeon's (56-dungeon-build.js builds it with buildFoe and keys it): built the same way here
    if (n === 'Shieldbearer') { const rig = buildFoe(n, x, z), grp = new THREE.Group(); grp.add(rig.root); grp.position.set(x, WORLD.worldH(x, z), z); grp.rotation.y = Math.atan2(px - x, pz - z); WORLD.scene.add(grp);
      const e = keyFoe({ x, z, mesh: grp, dead: false, name: n, limbs: { person: rig } }, 'f4test:' + i); rig.e = e; return { n, e, rig }; }
    const e = keyFoe(buildZoneEnemy(WORLD.scene, [], x, z, n, null), 'f4test:' + i); e.mesh.position.set(x, WORLD.worldH(x, z), z); e.mesh.rotation.y = Math.atan2(px - x, pz - z); e.combatYaw = e.mesh.rotation.y;
    e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh); const rig = e.limbs && e.limbs.person; if (rig) rig.e = e; return { n, e, rig }; });
  // S1224: named, before any body is built, each foe has its genome and its driver's two copies are in its colours: of the driver's
  // vertices, the share in the genome's skin (within .02 a channel) and in the old genome's skin, near and far, against the share of
  // the old skin in a bake of the old colours (`before`: the face and hands, a few per cent, less under a hood or a helm)
  const share = (geo, c) => { const a = geo.attributes.color.array; let n = 0; for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - c.r) < .02 && Math.abs(a[i + 1] - c.g) < .02 && Math.abs(a[i + 2] - c.b) < .02) n++; return +(n / (a.length / 3)).toFixed(3); };
  window._tint = _F.filter(f => f.rig && HB_RIGS.has(f.rig)).map(({ n, e, rig }) => { const G = rig.hbG, t = G && G.skin ? new THREE.Color(G.skin[0], G.skin[1], G.skin[2]) : null, old = new THREE.Color(rig.g.skin);
    return { n, key: G ? [...HB_GENOMES].find(([, x]) => x === G)?.[0] : null, want: 'foe:' + e.id, built: !!rig.hb, hi: t && share(rig.geoHi, t), lo: t && rig.geoLo && share(rig.geoLo, t), oldHi: share(rig.geoHi, old), before: (() => { const b = personBake(rig.g, 1), v = share(b.geo, old); b.geo.dispose(); return v; })(), same: !!t && t.equals(old) }; });
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
  const want = () => _F.filter(f => f.rig && HB_RIGS.has(f.rig) && !f.rig.hb && !f.rig.hbFail).length;
  let k = 0; const t0 = performance.now(); HBODY.last = -1e9; while (want() && k++ < 200) tickPeople(1 / 60, 2e5 + k * (HBODY.gap + 1));
  return { d, ticks: k, left: want(), ms: Math.round(performance.now() - t0) }; }, KINDS);
console.log('  built:', JSON.stringify(made));
const tint = await page.evaluate(() => _tint);
console.log('  tint:', JSON.stringify(tint));
check('named, each human foe has its genome before its body is built, keyed by its foe id', tint.length === 9 && tint.every(t => t.key === t.want && !t.built), tint.filter(t => t.key !== t.want || t.built));
check('and its driver, near and far, is in the genome\'s skin, not the old genome\'s', tint.every(t => t.before > .004 && t.hi >= .9 * t.before && t.lo > .004 && (t.same || t.oldHi < .5 * t.before)), tint.map(t => [t.n, t.before, t.hi, t.lo, t.oldHi]));

const who = await page.evaluate(() => _F.map(({ n, e, rig }) => { const H = rig && rig.hb, names = new Set(); if (H) H.root.traverse(o => { if (o.isMesh || o.isGroup) names.add(o.name); });
  return { n, id: e.id, hb: !!H, fail: !!(rig && rig.hbFail), key: rig && rig.hbG ? [...HB_GENOMES].find(([, G]) => G === rig.hbG)?.[0] : null, bones: H ? H.P.skeleton.bones.length : 0,
    hood: names.has('hoodUp'), mail: [...names].some(x => /^mail/.test(x)), helm: [...names].some(x => /helm/i.test(x)), robe: [...names].some(x => /robe|cord/.test(x)), coat: names.has('coat'), tabard: names.has('tabard'),
    spear: names.has('spear'), weapon: !!(rig && rig.weapon) }; }));
console.log('  foes:', JSON.stringify(who.map(w => [w.n, w.key, w.hood, w.mail, w.helm, w.robe, w.coat, w.tabard])));
const people = who.filter(w => w.n !== 'Hollowed');
check('the nine human foes wear the builder\'s body on its 163-bone skeleton, keyed by their foe id', people.every(w => w.hb && w.bones === 163 && w.key === 'foe:' + w.id), people.filter(w => !(w.hb && w.key === 'foe:' + w.id)));
check('the Hollowed keeps its own body (the dead are not people)', !who.find(w => w.n === 'Hollowed').hb && made.left === 0, who.find(w => w.n === 'Hollowed'));
const by = Object.fromEntries(who.map(w => [w.n, w]));
check('each dressed as its kind: hooded bandits and cultists, mail and helm on the deserter, the captain and the shieldbearer, a coat on the highwayman, a tabard on the shieldbearer, the builder\'s own spear on none',
  by.Bandit.hood && by['Bandit Archer'].hood && by.Cultist.hood && by['Rogue Mage'].hood && by.Deserter.mail && by.Deserter.helm && by['Bandit Captain'].mail && by.Shieldbearer.mail && by.Shieldbearer.tabard && by.Highwayman.coat && people.every(w => !w.spear), by);

// the same foe is the same body: the genome comes from the id alone
const same = await page.evaluate(() => _F.filter(f => f.rig && f.rig.hb).every(f => { const k = JSON.stringify(HB.toSaved(f.rig.hbG)); const r = { ...f.rig, hbG: null }; return JSON.stringify(HB.toSaved(hbFoeGenome(r))) === k; }));
check('a foe\'s genome is the same rolled again from its id', same);

// the game's weapon stays in the builder's fist
const fist = await page.evaluate(() => _F.filter(f => f.rig && f.rig.hb && f.rig.weapon).map(f => { const rig = f.rig, v = new THREE.Vector3(), w = new THREE.Vector3();
  rig.root.updateMatrixWorld(true); rig.weapon.getWorldPosition(v); const b = rig.hb.map.find(([j]) => j === (rig.hb.held.find(h => h.o === rig.weapon).sd === 'L' ? 'wrL' : 'wrR'))[1]; b.getWorldPosition(w);
  return [f.n, +v.distanceTo(w).toFixed(3), rig.weapon.parent === rig.hb.root]; }));
check('each kit weapon is held in the builder\'s fist (the bow in the left), within 12 cm of its wrist, carried in the builder\'s group (the driver\'s is hidden)', fist.length >= 6 && fist.every(([, d, shown]) => d < .12 && shown), fist);

// the tell's glow reaches the builder's body, and goes out with it
const glow = await page.evaluate(() => { const f = _F[0], rig = f.rig, mats = () => [...rig.hb.full, rig.hb.mid].filter(o => o.visible).map(o => o.material);
  const lit = () => mats().filter(m => m.emissive && m.emissive.getHex() !== 0).length;
  telegraphPulse(f.e, 1); tickPeople(1 / 60, 6e5); const on = lit(), all = mats().length; telegraphReset(f.e); tickPeople(1 / 60, 6e5 + 17); return { on, all, off: lit(), level: rig.hb.L }; });
check('the tell\'s glow lights the builder\'s body and goes out with it', glow.on > 0 && glow.on === glow.all && glow.off === 0, glow);

// the picture: the line from 4 m, then each kind killed
await page.evaluate(() => { const f = _F[4].e; const fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = f.x - fx * 6; pz = f.z - fz * 6; pitch = -.05; });
for (let i = 0; i < 8; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-foes.jpg') });
await page.evaluate(() => { const f = _F[0].e; const fx = -Math.sin(yaw), fz = -Math.cos(yaw); px = f.x - fx * 2.6 + fz * .8; pz = f.z - fz * 2.6 - fx * .8; pitch = -.1; });
for (let i = 0; i < 6; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); }
await page.screenshot({ path: path.join(OUT, 'f4-foes-near.jpg') });

const dead = await page.evaluate(() => { const f = _F[0], rig = f.rig, before = []; rig.hb.root.traverse(o => { if (o.isMesh) before.push([o, o.material]); });
  f.e.hp = 0; killZoneEnemy(f.e, WORLD.scene, '');
  for (let i = 0; i < 90; i++) tickPeople(1 / 60, 7e5 + i * 16.7);
  // fallen: the builder's head low over the ground and by the driver's
  rig.root.parent.updateMatrixWorld(true); const hb = rig.hb.map.find(([j]) => j === 'head')[1].getWorldPosition(new THREE.Vector3()), hd = rig.B.head.getWorldPosition(new THREE.Vector3());
  const shaded = before.filter(([o, m]) => m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile);
  return { cloned: before.filter(([o, m]) => o.material !== m).length, n: before.length, shaded: shaded.length, kept: shaded.filter(([o, m]) => o.material.onBeforeCompile === m.onBeforeCompile).length,
    darker: before.filter(([o, m]) => o.material !== m && o.material.color && o.material.color.r <= m.color.r * .36 + 1e-6).length, head: +(hb.y - WORLD.worldH(hb.x, hb.z)).toFixed(2), gap: +hb.distanceTo(hd).toFixed(2) }; });
check('killed, the builder\'s body is darkened with every garment\'s shader kept, and falls with its driver', dead.cloned === dead.n && dead.shaded > 0 && dead.kept === dead.shaded && dead.darker === dead.n && dead.head < .6 && dead.gap < .3, dead);
await page.evaluate(() => { REN.render(scene, CAM); });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
await g.close();
