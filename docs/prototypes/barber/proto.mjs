// Prototype (look builder, Session 505): a barber and a dyer for the towns (backlog H, "the look, later"). Not in the game:
// this script boots the game and builds, with the furniture kit (furnKit) and the shape kit (SK), what a barber's room
// would hold, the sign over its door, a dyer's corner, and one townsman three ways (as he is, cut and shaved, and his coat
// dyed), through the game's own personGenome/buildPerson. Nothing here is wired to a menu, a price or a person.
// Run: node docs/prototypes/barber/proto.mjs  →  docs/prototypes/barber-*.png
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const res = await page.evaluate(() => {
  const K = furnKit(), W = K.WOOD.gatelands;
  const rng = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const r = rng(11), rb = (w, h, d, q) => SK.rbox(w, h, d, q == null ? Math.min(.012, w / 3, h / 3, d / 3) : q, 1);
  const jit = (c, a) => new THREE.Color(c).offsetHSL(0, 0, (r() - .5) * (a || .06));
  const BRASS = 0xc8a048, IRON = 0x2a2624, LINEN = 0xe4dccb, STEEL = 0xb8c0c4;
  const basin = (R, d) => SK.lathe([[.001, -d], [R * .55, -d], [R * .8, -d * .55], [R * .95, -.004], [R * 1.12, 0], [R * 1.12, .006], [R * .93, .002], [R * .78, -d * .5], [R * .5, -d + .006], [.001, -d + .006]], 16);
  // the barber's chair: a high-backed armchair with a padded seat, a headrest on a stem and a footrest bar
  function barberChair() { const p = K.Parts(), sh = .3, sw = .4, sd = .36, wd = W.wood;
    p(rb(sw, .05, sd, .015), 0x6a2a1e, 0, sh, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(SK.cyl(.022, .026, sh, 8), jit(wd), sx * (sw / 2 - .03), sh / 2, sz * (sd / 2 - .03));
    for (const sx of [-1, 1]) { p(rb(.05, .03, sd + .04), jit(W.dark), sx * (sw / 2 - .01), sh + .2, .01); p(SK.cyl(.016, .016, .2, 6), jit(wd), sx * (sw / 2 - .02), sh + .1, sd / 2 - .04); }
    p(rb(sw, .5, .04, .015), jit(wd), 0, sh + .25, -sd / 2 + .02, -.18, 0, 0);
    p(rb(sw - .08, .36, .03, .012), 0x6a2a1e, 0, sh + .26, -sd / 2 + .055, -.18, 0, 0);
    p(SK.cyl(.012, .012, .2, 6), IRON, 0, sh + .58, -sd / 2 - .03, -.18, 0, 0);
    p(rb(.2, .08, .05, .02), 0x6a2a1e, 0, sh + .68, -sd / 2 - .045, -.18, 0, 0);
    p(rb(sw - .04, .025, .07), jit(W.dark), 0, .08, sd / 2 + .1); for (const sx of [-1, 1]) p(rb(.025, .025, .14), jit(W.dark), sx * (sw / 2 - .04), .08, sd / 2 + .04);
    return p; }
  // the washstand: three turned legs, a ring, a brass basin, a ewer and a towel over the rail
  function washstand() { const p = K.Parts(), h = .42;
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; p(SK.cyl(.012, .015, h, 6), jit(W.wood), Math.cos(a) * .12, h / 2, Math.sin(a) * .12, Math.sin(a) * .08, 0, -Math.cos(a) * .08); }
    p(SK.torus(.13, .012, 6, 20), jit(W.dark), 0, h, 0, Math.PI / 2, 0, 0); p(SK.torus(.1, .008, 6, 16), jit(W.dark), 0, .12, 0, Math.PI / 2, 0, 0);
    p(basin(.13, .06), BRASS, 0, h + .01, 0);
    p(SK.lathe([[.001, 0], [.04, 0], [.05, .05], [.035, .1], [.025, .14], [.032, .17], [.001, .17]], 12), 0xb0a080, .0, .13, .0);
    p(rb(.02, .12, .1, .006), LINEN, .145, h - .05, 0);
    return p; }
  // the mirror: polished steel in a carved oval frame, hung on the wall (local: the wall at z=0, the room towards +z)
  function mirror() { const p = K.Parts();
    p(SK.cyl(.16, .16, .01, 24), STEEL, 0, 0, .02, Math.PI / 2, 0, 0, 1, 1, 1.35);
    p(SK.torus(.17, .02, 8, 28), jit(W.dark), 0, 0, .025, 0, 0, 0, 1, 1.35, 1);
    p(SK.ball(.025, 8, 6), BRASS, 0, .26, .03); return p; }
  // the bench by the wall: a strop hanging from a peg, razors, shears, a comb, folded towels, a jar of leeches (the barber-surgeon)
  function bench() { const p = K.Parts(); p.put(K.table(.9, .4, 'gatelands', 4), 0, 0, 0);
    p(rb(.07, .015, .02), STEEL, -.25, .475, .05); p(rb(.08, .012, .025), 0x3a2a1a, -.17, .475, .04, 0, .4, 0);
    for (const sx of [-1, 1]) p(rb(.1, .008, .012), STEEL, .0 + sx * .01, .472, -.05, 0, sx * .25, 0);
    for (let k = 0; k < 3; k++) p(rb(.14, .025, .1, .01), k % 2 ? LINEN : 0xd8d0b8, .25, .47 + k * .026, .02);
    p(SK.lathe([[.001, 0], [.04, 0], [.045, .08], [.035, .1], [.04, .11], [.001, .11]], 12), 0x8aa0a0, .38, .465, -.08);
    p(rb(.05, .4, .006, .002), 0x5a3a20, -.4, .8, -.2); p(SK.cyl(.01, .01, .05, 6), W.dark, -.4, 1.0, -.2, Math.PI / 2, 0, 0);
    return p; }
  // the sign: the barber's three brass basins on an iron arm (the trade's old sign, before poles)
  function sign() { const p = K.Parts(), L = .8;
    p(rb(L, .03, .03), IRON, L / 2, 0, 0); p(rb(.03, .3, .03), IRON, 0, -.1, 0);
    { const a = Math.atan2(.25, L * .7), len = Math.hypot(.25, L * .7); p(rb(len, .02, .02), IRON, L * .35, -.125, 0, 0, 0, a); }
    p(SK.torus(.05, .008, 6, 14, Math.PI * 1.5), IRON, L + .03, .03, 0, 0, 0, 0);
    [.22, .44, .66].forEach((x, i) => { const y = -.12 - (i % 2) * .05; p(rb(.006, -y - .02, .006), 0x4a4440, x, y / 2, 0); p(basin(.11, .04), BRASS, x, y - .01, 0, Math.PI / 2 - .12, 0, 0); });
    return p; }
  // the dyer's corner: a vat on a brick hearth, a paddle, hanks of dyed wool on a pole, folded bolts on a shelf
  function dyer() { const p = K.Parts(), D = [0x7a2a1e, 0x3a4a6a, 0xb08a3a, 0x3a5a3a, 0x5a2a4a];
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; p(rb(.12, .12, .06, .01), jit(0x8a4a30, .1), Math.cos(a) * .26, .06, Math.sin(a) * .26, 0, -a, 0); }
    p(SK.lathe([[.001, .12], [.2, .12], [.26, .2], [.27, .42], [.29, .44], [.26, .44], [.25, .22], [.001, .22]], 18), 0x4a4440, 0, 0, 0);
    p(SK.cyl(.25, .25, .01, 18), 0x3a4a7a, 0, .41, 0); p(rb(.025, .6, .04), jit(W.pale), .12, .55, .02, 0, 0, -.5);
    p(SK.cyl(.012, .012, 1.3, 6), jit(W.dark), .75, .78, 0, 0, 0, Math.PI / 2); for (const x of [.15, 1.35]) p(SK.cyl(.015, .02, .78, 6), jit(W.wood), x, .39, 0);
    D.forEach((c, i) => { const x = .3 + i * .22; p(SK.cyl(.035, .03, .3, 8, 3), c, x, .62, 0); p(SK.torus(.03, .01, 5, 10), c, x, .78, 0); });
    p.put(K.table(1.1, .45, 'gatelands', 6), 1.95, -.2, 0);
    D.forEach((c, i) => p(rb(.18, .07, .26, .02), c, 1.6 + (i % 3) * .24, .465 + .035 + (i > 2 ? .07 : 0), -.2 + (i > 2 ? .02 : 0)));
    return p; }
  const room = () => { const sc = new THREE.Scene(); sc.background = new THREE.Color(0x1a1612);
    sc.add(new THREE.HemisphereLight(0xfff0d8, 0x40342a, .75)); const d = new THREE.DirectionalLight(0xffe0b0, .8); d.position.set(2, 4, 3); sc.add(d);
    const pl = new THREE.PointLight(0xffb060, .6, 8); pl.position.set(1.5, 1.4, 1.2); sc.add(pl);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshLambertMaterial({ color: 0x6a5038 })); fl.rotation.x = -Math.PI / 2; sc.add(fl);
    const wa = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.4), new THREE.MeshLambertMaterial({ color: 0xcfc2a8 })); wa.position.set(0, 1.2, -1.2); sc.add(wa);
    const wb = wa.clone(); wb.rotation.y = Math.PI / 2; wb.position.set(-2.4, 1.2, 0); sc.add(wb);
    const sk = new THREE.Mesh(new THREE.BoxGeometry(8, .12, .06), new THREE.MeshLambertMaterial({ color: 0x4a301a })); sk.position.set(0, .06, -1.17); sc.add(sk); return sc; };
  const person = (def, tweak) => { const ge = personGenome(def, { nation: 'gatelands' }); if (tweak) tweak(ge); const rig = buildPerson(ge, { noLod: true }); PEOPLE_RIGS.delete(rig); pwApply(rig, pwIdle(0, { holds: rig.holds, gear: rig.g.gear })); return rig; };
  const cv = REN.domElement, shot = (sc, pos, look, fov) => { const cam = new THREE.PerspectiveCamera(fov || 50, cv.width / cv.height, .05, 60); cam.position.set(...pos); cam.lookAt(...look); sc.updateMatrixWorld(true); REN.render(sc, cam); return cv.toDataURL('image/png'); };
  const tris = {}, add = (sc, name, parts, x, y, z, ry) => { const G = K.bake(parts); G.position.set(x, y, z); G.rotation.y = ry || 0; sc.add(G); tris[name] = G.userData.tris; return G; };
  const out = {};
  // 1 — the barber's room
  { const sc = room();
    add(sc, 'chair', barberChair(), 0, 0, -.45, 0);
    add(sc, 'washstand', washstand(), .7, 0, -.7);
    add(sc, 'mirror', mirror(), 0, 1.15, -1.18);
    add(sc, 'bench', bench(), -1.4, 0, -.85);
    add(sc, 'bench-stool', K.stool('gatelands', 3), 1.4, 0, .1);
    const cust = person({ name: 'Proto Customer', role: 'villager', people: 'gatelander', female: false }, ge => { ge.style = 'shaggy'; ge.beard = 'long'; });
    const bb = new THREE.Box3().setFromObject(cust.root); tris.personHeight = +(bb.max.y - bb.min.y).toFixed(2);
    const barber = person({ name: 'Proto Barber', role: 'villager', people: 'gatelander', female: false }, ge => { ge.apron = 0xd8d0b8; ge.style = 'crop'; ge.beard = 'short'; ge.hat = 'none'; });
    const o = barber.root; o.position.set(-.62, 0, -.15); o.rotation.y = 2.1; sc.add(o);
    out.room = shot(sc, [1.6, 1.25, 1.7], [-.1, .45, -.6], 55); out.roomCust = shot(sc, [-1.6, 1.0, 1.4], [0, .5, -.6], 55); }
  // 2 — the sign over a door, and the dyer's corner
  { const sc = room(); add(sc, 'sign', sign(), -1.2, 1.55, -1.12, 0);
    const dr = K.bake((() => { const p = K.Parts(); for (let k = 0; k < 5; k++) p(rb(.18, 1.4, .05), jit(W.wood, .08), -1.9 + .19 * k, .7, -1.17); return p; })()); sc.add(dr);
    add(sc, 'dyer', dyer(), .1, 0, -.6, 0);
    out.sign = shot(sc, [.5, 1.1, 1.8], [0, .8, -1], 60); }
  // 3 — one man three ways: as he walks in, cut and shaved, and his coat dyed
  { const sc = room(); const def = { name: 'Proto Customer', role: 'villager', people: 'gatelander', female: false };
    const looks = [ge => { ge.style = 'shaggy'; ge.beard = 'long'; }, ge => { ge.style = 'crop'; ge.beard = 'vandyke'; }, ge => { ge.style = 'tied'; ge.beard = 'short'; ge.cloth = new THREE.Color(0x3a4a6a); ge.sleeve = new THREE.Color(0x2e3c58); ge.trim = new THREE.Color(0xb08a3a); }];
    looks.forEach((f, i) => { const rg = person(def, f), o = rg.root; o.position.set(-.7 + i * .7, 0, 0); sc.add(o); });
    out.three = shot(sc, [0, .85, 2.2], [0, .6, 0], 40); }
  return { out, tris };
});
console.log(JSON.stringify(res.tris));
for (const [k, f] of [['room', 'barber-room.png'], ['roomCust', 'barber-room2.png'], ['sign', 'barber-sign-dyer.png'], ['three', 'barber-three-ways.png']])
  fs.writeFileSync('docs/prototypes/' + f, Buffer.from(res.out[k].split(',')[1], 'base64'));
if (g.errs.length) console.log('page errors', g.errs);
await g.close();
