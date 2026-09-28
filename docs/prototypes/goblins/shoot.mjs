// node docs/prototypes/goblins/shoot.mjs -> docs/prototypes/goblins-*.png
// Session 178: goblins and kobolds on the people's body, two directions each, for Michael to choose from. Built in the
// game itself (the harness boots it) from buildFoe's genome, with the parts a person lacks (pointed ears, a snout, a tail,
// a crest) hung on the bones as plain meshes: a prototype, so index.html is not changed.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld();
const shots = await page.evaluate(() => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
  const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: .85 });
  const add = (bone, geo, col, p, r, s) => { const m = new THREE.Mesh(geo, M(col)); m.position.set(...p); if (r) m.rotation.set(...r); if (s) m.scale.set(...s); bone.add(m); return m; };
  // a variant: a genome turned by `tune`, then `dress` hangs the extra parts on the bones
  const make = (seed, tune, dress) => { const g0 = personGenome({ name: 'proto' + seed, role: 'villager' }, { key: 'proto' }); g0.cloak = false; g0.dress = false; g0.apron = null; g0.extras = []; g0.hat = 'none'; g0.beard = 'none'; tune(g0);
    const r = buildPerson(g0, { noLod: true }); PEOPLE_RIGS.delete(r); if (dress) dress(r, g0); return r; };
  const C = x => new THREE.Color(x);
  const V = {
    // goblins A: the folklore goblin, green, small and big-headed, long pointed ears, a long nose, ragged hide
    gobA: s => make(s, g => { g.skin = C(0x7a9a4a).lerp(C(0x5a7a3a), (s % 3) / 3); g.height = .72; g.head = 1.32; g.build = .92; g.nose = [1.7, 1.5]; g.ears = 1.6; g.hair = C(0x2a2016); g.style = s % 2 ? 'shaggy' : 'buzz'; g.cloth = C(0x5a4a32); g.sleeve = C(0x4a3a26); g.legs = C(0x3a2e20); g.gear = s % 2 ? 'stick' : null; },
      (r, g) => { for (const sd of [1, -1]) add(r.B.head, new THREE.ConeGeometry(.045, .26, 6), g.skin.getHex(), [sd * (.1 * g.head + .1), .15, -.01], [0, 0, -sd * 1.3], [1, 1, .45]); }),
    // goblins B: the antibody's goblin, grey-brown and thin, the ears swept back, no hair, eyes lit amber
    gobB: s => make(s, g => { g.skin = C(0x7a6e62).lerp(C(0x5e544a), (s % 3) / 3); g.height = .8; g.head = 1.15; g.build = .8; g.nose = [1.3, .9]; g.ears = 1.3; g.style = 'buzz'; g.hair = C(0x3a342e); g.cloth = C(0x3a3430); g.sleeve = C(0x2e2a26); g.legs = C(0x2a2622); g.gear = s % 2 ? 'spear' : 'stick'; g.eye = C(0xffb030); },
      (r, g) => { for (const sd of [1, -1]) add(r.B.head, new THREE.ConeGeometry(.04, .28, 6), g.skin.getHex(), [sd * (.1 * g.head + .07), .17, -.08], [-1.0, 0, -sd * .9], [1, 1, .4]); }),
    // kobolds A: little reptile folk, scaled and snouted, a tail, a crest
    kobA: s => make(s, g => { g.skin = C(0x8a5a2a).lerp(C(0x6a7a3a), (s % 3) / 3); g.height = .66; g.head = 1.1; g.build = .85; g.style = 'buzz'; g.hair = g.skin.clone().multiplyScalar(.6); g.cloth = C(0x4a3a2a); g.sleeve = C(0x4a3a2a); g.legs = g.skin.clone().multiplyScalar(.8); g.boot = g.skin.clone().multiplyScalar(.6); g.gear = 'spear'; },
      (r, g) => { const h = r.B.head; add(h, new THREE.ConeGeometry(.075, .22, 8), g.skin.getHex(), [0, .09, .2], [Math.PI / 2, 0, 0], [1, .7, 1]); for (let i = 0; i < 4; i++) add(h, new THREE.ConeGeometry(.018, .06, 4), 0xc85a2a, [0, .22 - i * .02, .02 - i * .05], [-.5, 0, 0]);
        const t = add(r.B.hips, new THREE.ConeGeometry(.05, .5, 8), g.skin.getHex(), [0, -.05, -.25], [-2.0, 0, 0]); }),
    // kobolds B: the old German kobold, a small bearded earth-sprite in a hood, a lantern-bright eye, a mattock
    kobB: s => make(s, g => { g.height = .6; g.head = 1.25; g.build = 1.05; g.age = 'elder'; g.skin = C(0xb08a6a); g.beard = 'long'; g.hair = C(0x8a8a82); g.hat = 'hood'; g.cloth = C(0x6a3a22); g.sleeve = C(0x5a3a22); g.legs = C(0x3a3028); g.gear = 'hammer'; g.nose = [1.5, 1.4]; }, null)
  };
  const out = {};
  const grab = (key, rigs, camPos, look) => { cam.position.set(bx + camPos[0], y + camPos[1], bz + camPos[2]); cam.lookAt(bx + look[0], y + look[1], bz + look[2]); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); out[key] = o.toDataURL(); rigs.forEach(r => sc.remove(r.root)); };
  // each direction: four of them, standing and running, beside a townsperson for scale
  for (const k of ['gobA', 'gobB', 'kobA', 'kobB']) { const rigs = []; const man = buildFoe('Bandit', 0, 0); PEOPLE_RIGS.delete(man); man.root.position.set(bx - 1.9, y, bz); man.root.rotation.y = .35; sc.add(man.root); pwApply(man, pwIdle(1, { holds: man.holds, gear: man.g.gear })); rigs.push(man);
    for (let i = 0; i < 4; i++) { const r = V[k](i + 1); r.root.position.set(bx - .9 + i * .75, y, bz); r.root.rotation.y = i === 3 ? Math.PI / 2 : .45; sc.add(r.root); rigs.push(r);
      pwApply(r, i === 3 ? pwRun(.3, { holds: r.holds, gear: r.g.gear }) : pwIdle(i, { holds: r.holds, gear: r.g.gear, elder: r.g.age === 'elder' })); }
    grab(k, rigs, [0, 1.0, 4.4], [0, .45, 0]); }
  sc.remove(floor); return out; });
for (const [k, url] of Object.entries(shots)) fs.writeFileSync(path.join(here, '..', 'goblins-' + k + '.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('errors', g.errs); await g.close();
