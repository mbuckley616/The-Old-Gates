// node docs/prototypes/creatures3/shoot.mjs -> docs/prototypes/creatures3-*.png
// Session 214: the last creatures on box bodies, none of them in a family Michael has approved yet — the Ogre, the Cave
// Bear, the dungeon's slimes and Fire Elemental, the fen's Bog Crawler, the dunes' Sand Scorpion, the coast's Shore Wisp.
// Built in the game from its own kits (the people's body, the wolf's and the spider's bones, SK shapes), with the parts
// they lack hung on the bones as plain meshes: a prototype, so index.html is not changed.
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld();
const shots = await page.evaluate(() => { const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
  const cam = new THREE.PerspectiveCamera(30, cv.width / cv.height, .05, 100);
  const C = x => new THREE.Color(x);
  const Ms = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .85 }, o || {}));
  const Mb = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
  const add = (par, geo, mat, p, r, s) => { const m = new THREE.Mesh(geo, mat); if (p) m.position.set(...p); if (r) m.rotation.set(...r); if (s) m.scale.set(...s); par.add(m); return m; };
  const person = (seed, tune) => { const g0 = personGenome({ name: 'proto3' + seed, role: 'villager' }, { key: 'proto3' }); g0.cloak = false; g0.dress = false; g0.apron = null; g0.extras = []; g0.hat = 'none'; g0.beard = 'none'; tune(g0); const r = buildPerson(g0, { noLod: true }); PEOPLE_RIGS.delete(r); return r; };
  const idle = (r, t) => pwApply(r, pwIdle(t || 1, { holds: r.holds, gear: r.g.gear, elder: r.g.age === 'elder' }));
  const walk = (r, t) => pwApply(r, pwWalk(t || .3, { holds: r.holds, gear: r.g.gear }));
  const bandit = () => { const m = buildFoe('Bandit', 0, 0); PEOPLE_RIGS.delete(m); idle(m); return m; };
  // ── the Ogre: a person grown huge and fat, bald, ruddy, a leather kilt and belt, a knotted tree-limb club
  const ogre = s => { const r = person(s, g => { g.skin = C(0xb88a68).lerp(C(0x9a7050), (s % 3) / 3); g.height = 1; g.build = 1.95; g.head = 1.1; g.style = 'thin'; g.hair = C(0x3a2a1a); g.beard = s % 2 ? 'short' : 'none';
      g.nose = [2.3, 1.7]; g.ears = 1.5; g.eye = C(0x6a4a20); g.ruddy = true; g.freckles = false; g.cloth = C(0x6a5034); g.sleeve = g.skin.clone(); g.legs = g.skin.clone().multiplyScalar(.92); g.boot = C(0x3a2a1a); g.gear = null; g.bodyScale = [1.2, 1, 1.25]; });
    const B = r.B; add(B.spine, SK.ball(.2, 12, 9), Ms(r.g.skin.getHex()), [0, .1, .07], null, [1.05, .95, .95]);
    const cl = new THREE.Group(); cl.position.set(0, -.05, .01); cl.rotation.x = 1.2; B.wrR.add(cl); add(cl, SK.cyl(.028, .06, .78, 8), Ms(0x5a4028), [0, .3, 0]);
    for (let i = 0; i < 5; i++) add(cl, SK.ball(.035, 6, 5), Ms(0x4a3420), [Math.sin(i * 2) * .05, .42 + i * .08, Math.cos(i * 2) * .05]);
    r.root.scale.setScalar(1.6); return r; };
  // ── the Cave Bear: on the wolf's bones like the boar, heavy (bulk 1.6), round small ears, a short muzzle, the tail shrunk away
  WOLF_KINDS['Proto Bear'] = { coat: 0x4a3a2a, saddle: 0x2e2218, belly: 0x6a5440, eye: 0x1a1008, ruff: .45, ears: .5, muzzle: .82, bulk: 1.6, neck: .3 };
  const bear = s => { const w = buildWolf('Proto Bear', 1.35); WOLF_RIGS.delete(w); w.B.tail1.scale.setScalar(.25); w.B.tail2.scale.setScalar(.2);
    ['L', 'R'].forEach(K => { w.B['sh' + K].scale.set(1.7, 1, 1.5); w.B['th' + K].scale.set(1.7, 1, 1.5); }); w.B.head.scale.set(1.2, 1.1, .78);
    const fur = Ms(0x3e3024); add(w.B.spine, SK.ball(.13, 12, 9), fur, [0, .07, .02], null, [1, .8, 1.3]); for (const sd of [1, -1]) add(w.B.head, SK.ball(.028, 8, 6), fur, [sd * .045, .07, -.02], null, [1, 1, .6]); return w; };
  // ── slimes: a soft glassy blob, the floor showing through, a darker heart and what it ate (a skull, a coin) inside; two eyes on stalks of jelly
  const slime = (s, col, size) => { const G = new THREE.Group(); const geo = SK.ball(.45, 28, 20); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), yy = p.getY(i), z = p.getZ(i); const k = 1 + .06 * Math.sin(x * 9 + s) * Math.sin(z * 8) + (yy < 0 ? -.35 * (-yy / .45) ** 2 : 0); p.setXYZ(i, x * (yy < 0 ? 1.12 : 1) * k, yy * .72 * k, z * (yy < 0 ? 1.12 : 1) * k); }
    geo.computeVertexNormals(); const body = add(G, geo, Ms(col, { transparent: true, opacity: .62, roughness: .15, metalness: .05 }), [0, .3, 0]);
    add(G, SK.ball(.16, 12, 9), Mb(C(col).multiplyScalar(.45).getHex(), { transparent: true, opacity: .7 }), [.05, .28, -.05]);
    add(G, SK.ball(.06, 8, 6), Ms(0xd8d0b8), [-.12, .2, .02]); add(G, SK.cyl(.04, .04, .01, 10), Ms(0xd4a020, { metalness: .6, roughness: .35 }), [.1, .15, .12], [1.2, .3, 0]);
    for (const sd of [1, -1]) { add(G, SK.ball(.055, 8, 6), Mb(0xffffff), [sd * .13, .52, .22]); add(G, SK.ball(.027, 6, 5), Mb(0x101010), [sd * .13, .53, .27]); }
    G.scale.setScalar(size); return G; };
  // ── the Fire Elemental: a figure of flame over a cracked molten core; flame tongues licking up the body, arms of fire, a crown of flame
  const fire = s => { const G = new THREE.Group(); const add2 = (geo, col, op, p, r, sc) => add(G, geo, Mb(col, { transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }), p, r, sc);
    const core = add(G, SK.ball(.16, 14, 10), Ms(0x2a1008, { emissive: 0xff4400, emissiveIntensity: .9, roughness: .6 }), [0, .62, 0], null, [1, 1.2, .9]);
    for (let i = 0; i < 22; i++) { const a = i * 2.4 + s, h = .12 + (i % 5) * .05, rr = .07 + (i % 3) * .05, yy = .2 + (i / 22) * .8;
      add2(SK.cone(.05 + (1 - i / 22) * .06, h * 1.6, 7), i % 3 ? 0xff6a10 : 0xffc040, .55, [Math.cos(a) * rr * (1.2 - i / 30), yy, Math.sin(a) * rr * (1.2 - i / 30)], [Math.sin(a) * .25, 0, Math.cos(a) * .25]); }
    for (const sd of [1, -1]) for (let i = 0; i < 6; i++) add2(SK.ball(.06 - i * .006, 8, 6), i % 2 ? 0xff5010 : 0xffb030, .6, [sd * (.17 + i * .045), .8 - i * .075, .04 + i * .015], null, [1, 1.5, 1]);
    for (const sd of [1, -1]) for (let f = 0; f < 3; f++) add2(SK.cone(.02, .12, 5), 0xffd060, .7, [sd * (.42 + f * .02), .36, .1 + (f - 1) * .03], [0, 0, -sd * 2.7]);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add2(SK.cone(.035, .2, 6), 0xffd060, .6, [Math.cos(a) * .07, 1.02, Math.sin(a) * .07], [Math.sin(a) * .3, 0, -Math.cos(a) * .3]); }
    add2(SK.ball(.3, 12, 9), 0xff5010, .12, [0, .6, 0], null, [1, 1.6, 1]);
    for (const sd of [1, -1]) add(G, SK.ball(.028, 6, 5), Mb(0xfff4a0), [sd * .05, .9, .11]);
    G.scale.setScalar(1.05); return G; };
  // ── the Bog Crawler: the spider kit in the fen's colours, low and broad, moss on its back
  SPIDER_KINDS['Proto Crawler'] = { coat: 0x2e3a26, band: 0x566a34, belly: 0x1e2a1c, mark: 0x8aa060, eye: 0xa0ff60 };
  SPIDER_KINDS['Proto Scorpion'] = { coat: 0xb89a58, band: 0x8a6e38, belly: 0xd8c890, mark: 0x6a5028, eye: 0x202020 };
  const crawler = s => { const w = buildSpider('Proto Crawler', 1.4); WOLF_RIGS.delete(w); for (let i = 0; i < 9; i++) add(w.B.abd, SK.ball(.03 + (i % 3) * .01, 6, 5), Ms(0x4a6a2a), [Math.sin(i * 2.3) * .06, .08, -.06 + Math.cos(i * 1.7) * .06]); return w; };
  // ── the Sand Scorpion: the spider kit in sand, two pincers on the fang bones, a jointed tail from the abdomen curling over its back to a sting
  const scorpion = s => { const w = buildSpider('Proto Scorpion', 1.4); WOLF_RIGS.delete(w); const sh = Ms(0xb08a48, { roughness: .55 }), dk = Ms(0x6a4a20, { roughness: .5 });
    for (const sd of [1, -1]) { const f = w.B['fang' + (sd > 0 ? 'L' : 'R')]; const arm = new THREE.Group(); arm.position.set(sd * .02, 0, .02); arm.rotation.set(0, sd * .5, 0); arm.scale.setScalar(1.9); f.add(arm);
      add(arm, SK.cyl(.018, .022, .14, 8), sh, [0, 0, .07], [Math.PI / 2, 0, 0]); const el = new THREE.Group(); el.position.set(0, 0, .14); el.rotation.y = -sd * 1.0; arm.add(el);
      add(el, SK.cyl(.02, .018, .12, 8), sh, [0, 0, .06], [Math.PI / 2, 0, 0]); add(el, SK.ball(.04, 10, 8), sh, [0, 0, .14], null, [1, .7, 1.4]);
      add(el, SK.cone(.018, .09, 6), dk, [sd * .015, 0, .21], [Math.PI / 2, 0, -sd * .2]); add(el, SK.cone(.014, .08, 6), dk, [-sd * .015, 0, .2], [Math.PI / 2, 0, sd * .35]); }
    let par = w.B.abd, a = .9; for (let i = 0; i < 6; i++) { const s2 = new THREE.Group(); s2.position.set(0, i ? .07 : .03, i ? 0 : -.12); s2.rotation.x = i ? -a : -.9; par.add(s2); add(s2, SK.ball(.05 - i * .004, 10, 8), sh, [0, .03, 0], null, [1, 1.3, 1]); par = s2; a = .55; }
    add(par, SK.ball(.03, 8, 6), sh, [0, .07, 0]); add(par, SK.cone(.012, .07, 6), dk, [0, .1, .03], [.9, 0, 0]); return w; };
  // ── the Shore Wisp: a cold light over the tide line — a bright core in a soft halo, three motes circling, a tail of fading light
  const wisp = s => { const G = new THREE.Group(); const glow = (r, c, o, p) => add(G, SK.ball(r, 12, 9), Mb(c, { transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false }), p);
    glow(.07, 0xffffff, 1, [0, .8, 0]); glow(.13, 0xa8e0ff, .5, [0, .8, 0]); glow(.26, 0x60b0ff, .16, [0, .8, 0]); glow(.42, 0x4090e0, .06, [0, .8, 0]);
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + s; glow(.035, 0xffffff, .8, [Math.cos(a) * .32, .8 + Math.sin(a) * .12, Math.sin(a) * .32]); }
    for (let i = 1; i <= 8; i++) glow(.1 * (1 - i / 10), 0x80c8ff, .35 * (1 - i / 9), [Math.sin(i * .6 + s) * .06 * i, .8 - i * .06, -i * .07]);
    const L = new THREE.PointLight(0x80c0ff, 1.2, 4); L.position.set(0, .8, 0); G.add(L); return G; };
  const out = {};
  const floorOf = (col, w, d) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(w || 16, d || 10), new THREE.MeshLambertMaterial({ color: col })); f.rotation.x = -Math.PI / 2; f.position.set(bx, y, bz); sc.add(f); return f; };
  const grab = (key, objs, camPos, look) => { cam.position.set(bx + camPos[0], y + camPos[1], bz + camPos[2]); cam.lookAt(bx + look[0], y + look[1], bz + look[2]); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); out[key] = o.toDataURL(); objs.forEach(x => sc.remove(x)); };
  const place = (o, x, z, ry) => { const r = o.root || o; r.position.set(bx + x, y, bz + z); r.rotation.y = ry || 0; sc.add(r); return r; };
  // 1. ogres beside a bandit
  forceTime(12); let f = floorOf(0x6a7a48); let objs = [f, place(bandit(), -2.6, 0, .35)];
  for (let i = 0; i < 3; i++) { const r = ogre(i + 1); objs.push(place(r, -1.1 + i * 1.7, 0, i === 2 ? Math.PI / 2 : .45)); i === 2 ? walk(r) : idle(r, i + 1); }
  grab('ogre', objs, [0, 1.6, 7.4], [0, .95, 0]);
  // 2. cave bears
  f = floorOf(0x5a6040); objs = [f, place(bandit(), -2.4, 0, .35)];
  for (let i = 0; i < 2; i++) { const w = bear(i); objs.push(place(w, -.4 + i * 2.2, 0, i ? Math.PI / 2 : .6)); }
  grab('bear', objs, [0, 1.3, 6.4], [0, .6, 0]);
  // 3. the dungeon pair: slimes (a small one) and fire elementals, in the dark with a torch's light
  forceTime(0); f = floorOf(0x2a2622); const tl = new THREE.PointLight(0xffb070, 1.4, 12); tl.position.set(bx, y + 2.5, bz + 3); sc.add(tl); objs = [f, tl, place(bandit(), -2.6, 0, .35)];
  objs.push(place(slime(1, 0x32cd32, 1), -1.3, .3, .3), place(slime(2, 0x5fd85f, .55), -.4, .8, -.2), place(fire(1), .9, 0, .2), place(fire(2), 2.3, .2, -.3));
  grab('dungeon', objs, [0, 1.3, 6.2], [0, .55, 0]);
  // 4. the crawlers: bog crawlers and sand scorpions
  forceTime(12); f = floorOf(0x6a6448); objs = [f, place(bandit(), -2.6, 0, .35)];
  objs.push(place(crawler(1), -1.2, 0, .6), place(crawler(2), .2, .3, Math.PI / 2), place(scorpion(1), 1.5, 0, .5), place(scorpion(2), 2.7, .3, -.4));
  grab('crawlers', objs, [0, 2.4, 5.2], [0, .2, 0]);
  // 5. shore wisps at dusk
  forceTime(20.5); f = floorOf(0x8a8060); objs = [f, place(bandit(), -2.2, 0, .35)];
  for (let i = 0; i < 3; i++) objs.push(place(wisp(i), -.6 + i * 1.3, i % 2 ? .6 : 0, .4 + i));
  grab('wisp', objs, [0, 1.2, 6], [0, .7, 0]);
  delete WOLF_KINDS['Proto Bear']; delete SPIDER_KINDS['Proto Crawler']; delete SPIDER_KINDS['Proto Scorpion'];
  return out; });
for (const [k, url] of Object.entries(shots)) fs.writeFileSync(path.join(here, '..', 'creatures3-' + k + '.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log('errors', g.errs); await g.close();
