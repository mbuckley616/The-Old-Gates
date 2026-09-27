// node docs/prototypes/creatures2/shoot.mjs -> docs/prototypes/creatures2-*.png
// Session 201: the families left on the old box bodies — the cave troll, the golem, the gargoyle — and the Faolchú,
// the canon's first named antibody (lore_canon.md: wolf-shaped, hunched, extra arms from a spine seam glowing red,
// half-formed sigil-script along its sides). Built in the game itself from its kits (the people's body and bones, the
// wolf's), with the parts they lack hung on the bones as plain meshes: a prototype, so index.html is not changed.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld();
const shots = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 14), new THREE.MeshLambertMaterial({ color: 0x5a5a50 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const C = x => new THREE.Color(x); const M = (c, glow) => glow ? new THREE.MeshBasicMaterial({ color: c }) : new THREE.MeshStandardMaterial({ color: c, roughness: .9 });
  const add = (bone, geo, col, p, r, s, glow) => { const m = new THREE.Mesh(geo, M(col, glow)); m.position.set(...p); if (r) m.rotation.set(...r); if (s) m.scale.set(...s); bone.add(m); return m; };
  const person = (seed, tune) => { const g0 = personGenome({ name: 'proto2' + seed, role: 'villager' }, { key: 'proto2' }); g0.cloak = false; g0.dress = false; g0.apron = null; g0.extras = []; g0.hat = 'none'; g0.beard = 'none'; tune(g0); const r = buildPerson(g0, { noLod: true }); PEOPLE_RIGS.delete(r); return r; };
  const pose = (r, kind, t) => pwApply(r, kind === 'run' ? pwRun(t || .3, { holds: r.holds, gear: r.g.gear }) : pwIdle(t || 1, { holds: r.holds, gear: r.g.gear, elder: r.g.age === 'elder' }));
  const V = {
    // the cave troll: the people's body grown huge and stooped, grey-green hide, a heavy jaw with tusks, a club
    troll: (s) => { const r = person(s, g => { g.skin = C(0x6e7a5c).lerp(C(0x5a664c), (s % 3) / 3); g.height = 1; g.build = 1.75; g.head = 1.15; g.age = 'elder'; g.style = 'buzz'; g.hair = C(0x3a3e30); g.nose = [2.2, 1.8]; g.ears = 1.3; g.eye = C(0xd0a020); g.ruddy = false; g.freckles = false;
        g.cloth = C(0x4e4030); g.sleeve = g.skin.clone(); g.legs = g.skin.clone().multiplyScalar(.9); g.boot = C(0x3a3428); g.gear = 'stick'; g.bodyScale = [1.15, 1, 1.1]; });
      const h = r.B.head; for (const sd of [1, -1]) add(h, SK.cone(.03, .13, 6), 0xe8dcc0, [sd * .05, .07, .12], [-.25, 0, sd * .25]);
      add(h, SK.ball(.12, 10, 8), r.g.skin.getHex(), [0, .06, .03], null, [1.1, .6, 1]); r.root.scale.setScalar(1.5); return r; },
    // the golem: dressed stone blocks on the people's bones (the flesh hidden), a blue rune-light in the seams
    golem: (s) => { const r = person(s, g => { g.height = 1; }); r.mesh.material = new THREE.MeshBasicMaterial({ visible: false }); const B = r.B, st = 0x7c776e, st2 = 0x6a655c, rune = 0x6ab0ff;
      const blk = (bone, w, h, d, p, col) => add(bone, SK.rbox(w, h, d, Math.min(w, h, d) * .18, 2), col || st, p);
      blk(B.hips, .38, .22, .28, [0, -.02, 0], st2); blk(B.spine, .5, .42, .34, [0, .2, 0]); blk(B.spine, .56, .14, .36, [0, .38, 0], st2); blk(B.head, .24, .22, .22, [0, .1, .01]);
      add(B.head, new THREE.BoxGeometry(.14, .025, .02), rune, [0, .11, .125], null, null, true); add(B.spine, new THREE.BoxGeometry(.02, .3, .02), rune, [0, .2, .175], [0, 0, .6], null, true); add(B.spine, new THREE.BoxGeometry(.02, .3, .02), rune, [0, .2, .175], [0, 0, -.6], null, true);
      for (const k of ['L', 'R']) { blk(B['sh' + k], .17, .22, .17, [0, -.1, 0]); blk(B['el' + k], .15, .2, .15, [0, -.1, 0]); blk(B['wr' + k], .16, .12, .12, [0, -.06, 0], st2);
        blk(B['th' + k], .19, .24, .19, [0, -.12, 0]); blk(B['kn' + k], .16, .24, .16, [0, -.12, 0]); blk(B['an' + k], .18, .08, .26, [0, -.03, .04], st2); }
      r.root.scale.setScalar(1.45); return r; },
    // the gargoyle: a crouched stone figure with bat wings, horns, a lashing tail, eyes lit
    gargoyle: (s) => { const r = person(s, g => { g.skin = C(0x77746c); g.height = .95; g.build = 1.05; g.head = 1.1; g.style = 'buzz'; g.hair = C(0x5a5750); g.cloth = C(0x6a6760); g.sleeve = g.skin.clone(); g.legs = g.skin.clone(); g.boot = g.skin.clone().multiplyScalar(.8); g.eye = C(0xff5020); g.nose = [1.4, 1.1]; g.ears = 1.4; g.ruddy = false; g.freckles = false; });
      const B = r.B; for (const sd of [1, -1]) { add(B.head, SK.cone(.03, .14, 6), 0x55524c, [sd * .07, .22, -.02], [-.6, 0, -sd * .4]);
        const wing = new THREE.Shape(); wing.moveTo(0, 0); wing.lineTo(.55, .35); wing.lineTo(.62, .05); wing.lineTo(.48, -.05); wing.lineTo(.4, -.25); wing.lineTo(.22, -.12); wing.lineTo(.1, -.3); wing.lineTo(0, -.05);
        const wg = new THREE.ShapeGeometry(wing); const wm = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: 0x6a675f, side: THREE.DoubleSide, roughness: .9 })); wm.position.set(sd * .08, .3, -.1); wm.rotation.set(.2, sd > 0 ? -.5 : Math.PI + .5, 0); B.spine.add(wm);
      }
      add(B.hips, SK.cone(.035, .5, 6), 0x6a675f, [0, -.02, -.12], [-2.3, 0, 0]); add(B.hips, SK.cone(.05, .09, 3), 0x5a574f, [0, -.3, -.42], [-2.3, 0, 0]);
      r.root.scale.setScalar(1.1); return r; },
    // the gargoyle, B: a stone beast on the dragon's bones (four legs, wings, a tail), grey, eyes lit
    gargB: (s) => { const w = buildWolf('Dragon', .85); WOLF_RIGS.delete(w); const gg = w.mesh.geometry.clone(); const c = gg.attributes.color; for (let i = 0; i < c.count; i++) { const l = .3 * c.getX(i) + .59 * c.getY(i) + .11 * c.getZ(i), k = .2 + l * .7; c.setXYZ(i, k * .98, k * .96, k * .9); } w.mesh.geometry = gg; w.B.neck.rotation.x = .25; return w; },
    // the Faolchú: the dire wolf hunched, arms from a seam down its spine glowing red, sigil-script along its flanks
    faol: (s) => { const w = buildWolf('Dire Wolf', 1.45); WOLF_RIGS.delete(w); const B = w.B; B.spine.rotation.x = -.18; B.neck.rotation.x = .35; B.head.rotation.x = .15;
      add(B.spine, new THREE.BoxGeometry(.018, .015, .42), 0xff3020, [0, .1, .02], [.05, 0, 0], null, true); add(B.hips, new THREE.BoxGeometry(.018, .015, .26), 0xff3020, [0, .12, -.05], null, null, true);
      for (const sd of [1, -1]) for (const [z, a] of [[.16, .3], [-.02, -.1]]) { const sh = new THREE.Group(); sh.position.set(sd * .04, .11, z); sh.rotation.set(a, 0, sd * 1.1); B.spine.add(sh);
        add(sh, SK.limb(.2, .026, .02), 0x3a322c, [0, 0, 0]); const el = new THREE.Group(); el.position.set(0, -.2, 0); el.rotation.set(.9, 0, -sd * .6); sh.add(el); add(el, SK.limb(.18, .02, .014), 0x3a322c, [0, 0, 0]);
        for (let f = -1; f <= 1; f++) add(el, SK.cone(.008, .05, 4), 0xd8d0c0, [f * .012, -.2, .01], [Math.PI, 0, 0]); add(sh, SK.ball(.03, 6, 5), 0xff3020, [0, 0, 0], null, null, true); }
      for (const sd of [1, -1]) for (let k = 0; k < 7; k++) { const gl = k % 3 === 0 ? SK.torus(.018, .004, 4, 8, Math.PI * (1 + (k % 2) * .5)) : new THREE.BoxGeometry(.006, .03 + (k % 2) * .02, .006);
        add(B.spine, gl, 0xff7a30, [sd * .115, .02 + (k % 3) * .025, -.12 + k * .06], [0, sd * Math.PI / 2, k * .7], null, true); }
      return w; }
  };
  const out = {}; const grab = (key, rigs, camPos, look) => { cam.position.set(bx + camPos[0], y + camPos[1], bz + camPos[2]); cam.lookAt(bx + look[0], y + look[1], bz + look[2]); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); out[key] = o.toDataURL(); rigs.forEach(r => sc.remove(r.root)); };
  for (const k of ['troll', 'golem', 'gargoyle', 'gargB', 'faol']) { const rigs = []; const man = buildFoe('Bandit', 0, 0); PEOPLE_RIGS.delete(man); man.root.position.set(bx - 2.4, y, bz); man.root.rotation.y = .35; sc.add(man.root); pwApply(man, pwIdle(1, { holds: man.holds, gear: man.g.gear })); rigs.push(man);
    for (let i = 0; i < 3; i++) { const r = V[k](i + 1); r.root.position.set(bx - 1.0 + i * 1.5, y, bz); r.root.rotation.y = i === 2 ? Math.PI / 2 : .45; sc.add(r.root); rigs.push(r); if (k !== 'faol' && k !== 'gargB') pose(r, i === 2 ? 'run' : 'idle', i + 1); }
    if (k === 'gargoyle') rigs.slice(1).forEach(r => { r.B.knL.rotation.x = r.B.knR.rotation.x = 2.0; r.B.thL.rotation.x = r.B.thR.rotation.x = -1.3; r.B.hips.position.y -= .28; r.B.spine.rotation.x = .55; r.B.anL.rotation.x = r.B.anR.rotation.x = -.1; r.B.neck.rotation.x = -.3; });
    grab(k, rigs, [0, 1.4, 6.2], [0, .7, 0]); }
  sc.remove(floor); return out; });
for (const [k, url] of Object.entries(shots)) fs.writeFileSync(path.join(here, '..', 'creatures2-' + k + '.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('errors', g.errs); await g.close();
