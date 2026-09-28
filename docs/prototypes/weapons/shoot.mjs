// node docs/prototypes/weapons/shoot.mjs -> docs/prototypes/weapons-*.png
// Session 220: the weapon kit. Today's weapons (tpWeapon, the player's hands in third person) are boxes; the foes carry the
// people's walking stick for a club. A kit on the shape kit: extruded blades with a bevel for an edge, wrapped grips,
// pommels, bearded axe heads, a flanged mace, a recurve bow on a curve, planked shields with a boss and rim.
// A prototype: index.html is not changed.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld();
const shots = await page.evaluate(() => { const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .02, 100);
  const Ms = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .6, metalness: 0 }, o || {}));
  const steel = Ms(0xc8ccd4, { metalness: .75, roughness: .32 }), dsteel = Ms(0x6a6e76, { metalness: .6, roughness: .45 }), brass = Ms(0xc8a050, { metalness: .7, roughness: .35 });
  const wood = Ms(0x6a4428, { roughness: .8 }), dwood = Ms(0x4a2e18, { roughness: .85 }), leather = Ms(0x3a2618, { roughness: .9 }), gut = Ms(0xe8e0c8);
  const add = (par, geo, mat, p, r, s) => { const m = new THREE.Mesh(geo, mat); if (p) m.position.set(...p); if (r) m.rotation.set(...r); if (s) m.scale.set(...s); par.add(m); return m; };
  // a blade: a flat outline extruded thin with a bevel, so it has an edge and a spine that catch the light
  const blade = (len, w, tip, curve) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2 * .92, len * .8); s.quadraticCurveTo(-w / 2 * .7 + (curve || 0), len * .93, curve || 0, len * (1 + tip)); s.quadraticCurveTo(w / 2 * .7 + (curve || 0), len * .93, w / 2 * .92, len * .8); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: .004, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2, curveSegments: 6 }); geo.translate(0, 0, -.002); return geo; };
  const wrapGrip = (G, len, r, y0) => { add(G, SK.cyl(r, r, len, 10), leather, [0, y0 + len / 2, 0]); for (let i = 0; i < 6; i++) add(G, SK.torus(r * 1.02, r * .18, 4, 10), dwood, [0, y0 + len * (i + .5) / 6, 0], [Math.PI / 2, 0, 0]); };
  const K = {
    sword: () => { const G = new THREE.Group(); wrapGrip(G, .1, .014, -.05); add(G, SK.ball(.022, 10, 8), brass, [0, -.06, 0]); add(G, SK.rbox(.15, .022, .03, .008, 2), brass, [0, .06, 0]);
      add(G, SK.ball(.012, 6, 5), brass, [.075, .06, 0]); add(G, SK.ball(.012, 6, 5), brass, [-.075, .06, 0]); add(G, blade(.46, .042, .08), steel, [0, .07, 0]); return G; },
    longsword: () => { const G = new THREE.Group(); wrapGrip(G, .16, .015, -.1); add(G, SK.ball(.026, 10, 8), steel, [0, -.115, 0]); add(G, SK.rbox(.19, .024, .034, .009, 2), dsteel, [0, .065, 0]); add(G, blade(.6, .046, .07), steel, [0, .077, 0]); return G; },
    dagger: () => { const G = new THREE.Group(); wrapGrip(G, .08, .013, -.04); add(G, SK.ball(.018, 8, 6), brass, [0, -.05, 0]); add(G, SK.rbox(.09, .018, .026, .006, 2), brass, [0, .045, 0]); add(G, blade(.2, .034, .15), steel, [0, .054, 0]); return G; },
    axe: () => { const G = new THREE.Group(); add(G, SK.cyl(.016, .019, .5, 8), wood, [0, .15, 0]); wrapGrip(G, .1, .02, -.08); const s = new THREE.Shape(); s.moveTo(0, -.03); s.lineTo(-.06, -.05); s.quadraticCurveTo(-.15, -.08, -.14, .02); s.quadraticCurveTo(-.155, .1, -.1, .12); s.lineTo(0, .04); s.lineTo(0, -.03);
      add(G, new THREE.ExtrudeGeometry(s, { depth: .006, bevelEnabled: true, bevelThickness: .005, bevelSize: .004, bevelSegments: 2 }), steel, [-.012, .34, -.003]); add(G, SK.rbox(.04, .07, .036, .01, 2), dsteel, [0, .36, 0]); return G; },
    mace: () => { const G = new THREE.Group(); add(G, SK.cyl(.015, .018, .4, 8), dwood, [0, .12, 0]); wrapGrip(G, .1, .019, -.08); add(G, SK.ball(.045, 12, 9), dsteel, [0, .34, 0]);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(G, SK.rbox(.012, .09, .05, .004, 1), dsteel, [Math.cos(a) * .035, .34, Math.sin(a) * .035], [0, -a, 0]); } add(G, SK.cone(.02, .05, 6), dsteel, [0, .4, 0]); return G; },
    warhammer: () => { const G = new THREE.Group(); add(G, SK.cyl(.018, .022, .72, 8), wood, [0, .22, 0]); wrapGrip(G, .14, .023, -.12); add(G, SK.rbox(.2, .085, .085, .018, 2), dsteel, [.02, .56, 0]); add(G, SK.cone(.03, .12, 6), dsteel, [-.14, .56, 0], [0, 0, Math.PI / 2]); add(G, SK.cone(.02, .08, 6), dsteel, [0, .64, 0]); return G; },
    staff: () => { const G = new THREE.Group(); add(G, SK.bumpy(SK.cyl(.016, .022, 1.0, 8, 10), .004, 23, 30), dwood, [0, .22, 0]); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; add(G, SK.cone(.008, .12, 5), dwood, [Math.cos(a) * .022, .76, Math.sin(a) * .022], [Math.sin(a) * -.35, 0, Math.cos(a) * .35]); }
      add(G, new THREE.OctahedronGeometry(.04, 0), new THREE.MeshBasicMaterial({ color: 0x88c0ff }), [0, .8, 0], null, [1, 1.5, 1]); add(G, SK.ball(.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0x4080ff, transparent: true, opacity: .15, depthWrite: false }), [0, .8, 0]); return G; },
    bow: () => { const G = new THREE.Group(); const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20 * 2 - 1; pts.push(new THREE.Vector3(0, t * .34, -.05 * (1 - t * t) + .025 * Math.pow(Math.abs(t), 6))); }
      const cur = new THREE.CatmullRomCurve3(pts); const tube = new THREE.TubeGeometry(cur, 30, .011, 6); const p = tube.attributes.position; add(G, tube, wood); add(G, SK.cyl(.016, .016, .09, 8), leather, [0, 0, -.05]);
      add(G, SK.cyl(.0025, .0025, .68, 4), gut, [0, 0, .025]); return G; },
    round: () => { const G = new THREE.Group(); const R = .19; for (let i = 0; i < 5; i++) { const w = R * 2 / 5; const x = -R + w * (i + .5); const h = 2 * Math.sqrt(Math.max(0, R * R - x * x)); add(G, SK.rbox(.02, h * .98, w * .96, .004, 1), Ms([0x7a5230, 0x6a4628, 0x82583a][i % 3], { roughness: .85 }), [0, 0, x]); }
      add(G, SK.torus(R, .012, 6, 28), dsteel, [0, 0, 0], [0, Math.PI / 2, 0]); add(G, SK.ball(.05, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), dsteel, [.012, 0, 0], [0, 0, -Math.PI / 2]); return G; },
    kite: () => { const G = new THREE.Group(); const s = new THREE.Shape(); s.moveTo(0, .24); s.quadraticCurveTo(.17, .24, .16, .1); s.quadraticCurveTo(.13, -.12, 0, -.3); s.quadraticCurveTo(-.13, -.12, -.16, .1); s.quadraticCurveTo(-.17, .24, 0, .24);
      const geo = new THREE.ExtrudeGeometry(s, { depth: .02, bevelEnabled: true, bevelThickness: .008, bevelSize: .008, bevelSegments: 2 }); add(G, geo, Ms(0x7a2020, { roughness: .7 }), [0, 0, 0], [0, Math.PI / 2, 0]);
      add(G, SK.ball(.045, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass, [-.014, .05, 0], [0, 0, Math.PI / 2]); for (const [a, b2] of [[.24, .12], [-.3, 0]]) add(G, SK.ball(.012, 6, 5), brass, [-.014, a, b2]); return G; }
  };
  const old = { sword: { weaponShape: 'sword' }, longsword: { weaponShape: 'longsword' }, dagger: { weaponShape: 'dagger' }, axe: { weaponShape: 'axe' }, mace: { weaponShape: 'mace' }, warhammer: { weaponShape: 'warhammer' }, staff: { weaponShape: 'staff' }, bow: { weaponShape: 'bow' } };
  const out = {}; const objs = [];
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshLambertMaterial({ color: 0x3a3430 })); bg.position.set(bx, y + .6, bz - .4); sc.add(bg); objs.push(bg);
  const L = new THREE.PointLight(0xfff0d8, 1.2, 8); L.position.set(bx + .5, y + 1.6, bz + 1.6); sc.add(L); objs.push(L);
  // 1. the lineup: today's box weapons above, the kit below
  forceTime(12); const names = ['dagger', 'sword', 'longsword', 'axe', 'mace', 'warhammer', 'staff', 'bow'];
  names.forEach((n, i) => { const x = bx - 1.75 + i * .5; const o = tpWeapon(old[n]); o.position.set(x, y + .95, bz); o.scale.setScalar(.8); if (n === 'bow') o.rotation.y = Math.PI / 2; sc.add(o); objs.push(o);
    const k = K[n](); k.position.set(x, y + .05, bz); k.scale.setScalar(.8); k.rotation.y = n === 'bow' ? Math.PI / 2 + .3 : .5; sc.add(k); objs.push(k); });
  ['round', 'kite'].forEach((n, i) => { const k = K[n](); k.position.set(bx + 2.35, y + .95 - i * .75, bz); k.rotation.y = Math.PI / 2 - .5; k.scale.setScalar(1.1); sc.add(k); objs.push(k); });
  cam.position.set(bx, y + .75, bz + 4.6); cam.lookAt(bx + .2, y + .55, bz); sc.updateMatrixWorld(true); REN.render(sc, cam);
  const grab = key => { const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); out[key] = o.toDataURL(); };
  grab('lineup'); objs.splice(2).forEach(o => sc.remove(o));
  // 2. in the hands: a bandit with a sword and a round shield, a highwayman with an axe, a deserter with a mace, an archer with a bow, a rogue mage with a staff
  const people = [['Bandit', 'sword', 'round'], ['Highwayman', 'axe'], ['Deserter', 'mace', 'kite'], ['Bandit Archer', 'bow'], ['Rogue Mage', 'staff']];
  const rigs = []; people.forEach(([n, w, sh], i) => { const g0 = FOE_DRESS[n].gear; FOE_DRESS[n].gear = null; const r = buildFoe(n, i * 11, 7); FOE_DRESS[n].gear = g0; PEOPLE_RIGS.delete(r); r.root.position.set(bx - 1.9 + i * .95, y, bz + .6); r.root.rotation.y = .3; sc.add(r.root); rigs.push(r.root);
    pwApply(r, pwIdle(i + 1, { holds: true, gear: w === 'staff' ? 'stick' : 'hammer' }));
    const k = K[w](); if (w === 'bow') { k.position.set(0, -.05, .01); r.B.wrL.add(k); } else { k.position.set(0, -.035, .006); k.rotation.x = w === 'staff' ? 0 : Math.PI / 2 * .0; r.B.gear.add(k); }
    if (sh) { const s = K[sh](); s.position.set(.07, -.05, .02); s.rotation.y = 0; s.scale.setScalar(.9); r.B.elL.add(s); } });
  cam.position.set(bx, y + .95, bz + 5.2); cam.lookAt(bx, y + .6, bz); sc.updateMatrixWorld(true); REN.render(sc, cam); grab('hands');
  rigs.forEach(o => sc.remove(o)); objs.forEach(o => sc.remove(o)); return out; });
for (const [k, url] of Object.entries(shots)) fs.writeFileSync(path.join(here, '..', 'weapons-' + k + '.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('errors', g.errs); await g.close();
