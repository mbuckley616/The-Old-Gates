// The Old Gates — interiors on the shape kit (concept prototype, backlog H.5 "props").
// FURN(THREE, SK) returns builders for the furniture of a home and an inn's taproom, in the kit's idioms: lathes for turned
// legs, posts, pots and bottles; SK.rbox for planks, stones and boards; SK.ball for a pillow; vertex colours per plank.
// Every piece is a list of parts [geometry, colour, matrix] (the same shape as dunMerge's), so a room's furniture bakes into
// ONE vertex-coloured mesh, plus one small unlit mesh for the flames. Sizes are final room units (the game's F=.62 height scale
// is already applied): a table top at .46, a chair seat at .26, a bar top at .69, a townsperson about 1.1 tall.
// Nothing here touches index.html; the builder lifts FURN whole and calls FURN.home / FURN.inn where buildInteriorFor now
// calls box()/cyl() for the trade furnishing.
(function (root) {
function FURN(THREE, SK) {
  const C = x => (x && x.isColor) ? x.clone() : new THREE.Color(x);
  const rng = s => { let a = (s >>> 0) % 2147483647 || 1; return () => (a = (a * 16807) % 2147483647) / 2147483647; };
  const M = (x, y, z, rx, ry, rz, sx, sy, sz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx || 1, sy || 1, sz || 1));
  // a part list: P(geo, col, x, y, z, rx, ry, rz, sx, sy, sz)
  function Parts() { const L = [], F = []; const p = (geo, col, x, y, z, rx, ry, rz, sx, sy, sz) => { L.push([geo, C(col), M(x, y, z, rx, ry, rz, sx, sy, sz)]); return p; };
    p.list = L; p.fire = F; p.flame = (geo, col, x, y, z, rx, ry, rz, sx, sy, sz) => { F.push([geo, C(col), M(x, y, z, rx, ry, rz, sx, sy, sz)]); return p; };
    p.put = (q, x, z, ry, y) => { const m = M(x, y || 0, z, 0, ry || 0, 0); for (const e of q.list) L.push([e[0], e[1], m.clone().multiply(e[2])]); for (const e of q.fire) F.push([e[0], e[1], m.clone().multiply(e[2])]); return p; };
    return p; }
  const jit = (col, r, a) => C(col).offsetHSL(0, 0, (r() - .5) * (a || .06));
  const lathe = (pts, seg) => SK.lathe(pts, seg || 8);
  // WOOD by nation: the Gatelands' oak, the Mark's dark pine, Aurenne's walnut with painted pieces
  const WOOD = { gatelands: { wood: 0x6e4a2c, dark: 0x4a301a, pale: 0x8e6a44, paint: null, cloth: [0x7a2a1e, 0xb08a3a, 0x3a4a5a] },
    mark: { wood: 0x5a4632, dark: 0x3a2c1e, pale: 0x7a6448, paint: null, cloth: [0x3a4a5a, 0x8a7a60, 0x4a4a4c] },
    aurenne: { wood: 0x5c3a22, dark: 0x3c2414, pale: 0x86603a, paint: 0x2a4a7a, cloth: [0x1e3a7a, 0xb08a3a, 0x6a2a3a] } };
  const IRON = 0x2c2826, STONE = 0x86807a, SOOT = 0x14100c;

  // a turned leg: h tall, r thick, with a bead and a foot
  const legProf = (h, r) => [[r * .9, 0], [r, h * .05], [r * .8, h * .12], [r * .75, h * .45], [r * 1.15, h * .52], [r * .8, h * .6], [r * .75, h * .82], [r * 1.05, h * .88], [r * 1.05, h]];
  const turned = (h, r, seg) => lathe(legProf(h, r), seg || 8);

  // a table: planked top with breadboard ends, turned legs, aprons, an H stretcher
  function table(w, d, n, seed) { const r = rng(seed || 3), p = Parts(), W = WOOD[n] || WOOD.gatelands, top = .46, th = .045;
    const k = Math.max(3, Math.round(d / .2)), pw = (d - .06) / k;
    for (let i = 0; i < k; i++) p(SK.rbox(w - .1, th, pw - .004, .01, 1), jit(W.wood, r, .035), 0, top - th / 2, -d / 2 + .08 / 2 + pw * (i + .5) - .01);
    for (const s of [-1, 1]) p(SK.rbox(.07, th + .004, d, .012, 1), jit(W.dark, r, .03), s * (w / 2 - .035), top - th / 2, 0);
    const lx = w / 2 - .12, lz = d / 2 - .1, lh = top - th;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(turned(lh, .026), jit(W.dark, r, .04), sx * lx, 0, sz * lz);
    for (const s of [-1, 1]) { p(SK.rbox(2 * lx - .04, .06, .02, .006, 1), W.dark, 0, lh - .035, s * lz); p(SK.rbox(.02, .06, 2 * lz - .04, .006, 1), W.dark, s * lx, lh - .035, 0);
      p(SK.rbox(.03, .03, 2 * lz, .008, 1), W.dark, s * lx, .07, 0); }
    p(SK.rbox(2 * lx, .03, .03, .008, 1), W.dark, 0, .07, 0);
    return p; }
  // a bench: a thick plank on splayed legs, a stretcher under it
  function bench(w, n, seed) { const r = rng(seed || 5), p = Parts(), W = WOOD[n] || WOOD.gatelands, h = .26;
    p(SK.rbox(w, .04, .24, .012, 1), jit(W.wood, r), 0, h - .02, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p(SK.cyl(.018, .022, h - .03, 6), jit(W.dark, r, .04), sx * (w / 2 - .14), (h - .03) / 2, sz * .075, sz * -.18, 0, sx * .12);
    p(SK.rbox(w - .3, .025, .025, .006, 1), W.dark, 0, .08, 0);
    return p; }
  // a chair: turned legs and back posts with finials, three slats, a seat of boards (or rush, painted in Aurenne)
  function chair(n, seed) { const r = rng(seed || 7), p = Parts(), W = WOOD[n] || WOOD.gatelands, wood = W.paint || W.wood, sh = .26, sw = .32, sd = .28;
    p(SK.rbox(sw, .03, sd, .01, 1), n === 'mark' ? jit(W.pale, r) : 0xb8964e, 0, sh - .015, 0);
    for (const sx of [-1, 1]) { p(turned(sh - .03, .017), jit(wood, r, .03), sx * (sw / 2 - .025), 0, sd / 2 - .025);
      p(lathe([[.018, 0], [.02, .1], [.016, .22], [.02, .3], [.017, .5], [.022, .54], [.028, .56], [.018, .59], [.001, .6]], 8), jit(wood, r, .03), sx * (sw / 2 - .025), 0, -sd / 2 + .025, -.08, 0, 0);
      p(SK.rbox(.016, .016, sd - .05, .005, 1), wood, sx * (sw / 2 - .025), .08, 0); }
    for (const y of [.36, .44, .52]) p(SK.rbox(sw - .07, .045, .016, .006, 1), jit(wood, r, .04), 0, y, -sd / 2 + .02 - (y - sh) * .08);
    p(SK.rbox(sw - .05, .016, .016, .005, 1), wood, 0, .1, sd / 2 - .025);
    return p; }
  // a stool: a round seat on three splayed legs with a ring
  function stool(n, seed) { const r = rng(seed || 9), p = Parts(), W = WOOD[n] || WOOD.gatelands, h = .38;
    p(SK.cyl(.13, .12, .04, 12), jit(W.wood, r), 0, h - .02, 0);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; p(SK.cyl(.016, .02, h - .02, 6), W.dark, Math.sin(a) * .08, (h - .02) / 2, Math.cos(a) * .08, Math.cos(a) * -.16, 0, Math.sin(a) * .16); }
    p(SK.torus(.095, .01, 4, 14), W.dark, 0, .12, 0, Math.PI / 2);
    return p; }
  // a box bed: posts with finials, a planked headboard, a stuffed tick, a quilt of three bands over the foot, a turned-down
  // sheet and a pillow. Head at local −z.
  function bed(n, seed, bl, bw) { const r = rng(seed || 11), p = Parts(), W = WOOD[n] || WOOD.gatelands, rail = .2; bl = bl || 1.5; bw = bw || .86;
    for (const s of [-1, 1]) p(SK.rbox(.05, .13, bl - .08, .012, 1), jit(W.wood, r), s * (bw / 2 - .025), rail, 0);
    for (const s of [-1, 1]) p(SK.rbox(bw - .08, .13, .05, .012, 1), jit(W.wood, r), 0, rail, s * (bl / 2 - .025));
    const post = h => lathe([[.03, 0], [.034, .04], [.028, .1], [.028, h - .12], [.036, h - .08], [.026, h - .05], [.036, h - .02], [.02, h], [.001, h + .005]], 8);
    for (const sx of [-1, 1]) { p(post(.66), jit(W.dark, r, .03), sx * (bw / 2 - .03), 0, -bl / 2 + .03); p(SK.ball(.035, 8, 6), W.dark, sx * (bw / 2 - .03), .685, -bl / 2 + .03);
      p(post(.46), jit(W.dark, r, .03), sx * (bw / 2 - .03), 0, bl / 2 - .03); p(SK.ball(.03, 8, 6), W.dark, sx * (bw / 2 - .03), .48, bl / 2 - .03); }
    for (let i = 0; i < 5; i++) p(SK.rbox((bw - .1) / 5 - .01, .3, .03, .008, 1), jit(W.paint || W.pale, r), -bw / 2 + .05 + (bw - .1) / 5 * (i + .5), .44, -bl / 2 + .03);
    p(SK.rbox(bw - .06, .05, .05, .012, 1), W.dark, 0, .6, -bl / 2 + .03);
    p(SK.rbox(bw - .08, .16, .05, .01, 1), jit(W.pale, r), 0, .34, bl / 2 - .03);
    p(SK.rbox(bw - .1, .13, bl - .12, .05, 2), 0xc8b48a, 0, .32, 0);
    const q = W.cloth, qz0 = -.05, ql = bl / 2 + .02 - qz0;
    for (let i = 0; i < 3; i++) { const z = qz0 + ql / 3 * (i + .5); p(SK.rbox(bw - .06, .04, ql / 3 + .004, .018, 1), jit(q[i % 3], r, .04), 0, .4, z);
      for (const s of [-1, 1]) p(SK.rbox(.025, .16, ql / 3 + .004, .01, 1), jit(q[i % 3], r, .04).multiplyScalar(.85), s * (bw / 2 - .035), .325, z); }
    p(SK.rbox(bw - .05, .035, .12, .015, 1), 0xe0d4b8, 0, .405, qz0 - .05);
    p(SK.ball(.12, 12, 8), 0xece2cc, 0, .41, -bl / 2 + .2, 0, 0, 0, 2.5, .55, 1.2);
    return p; }
  // an iron-bound chest: planked body, a barrel-vaulted lid, bands, a lock plate, handles
  function chest(n, seed) { const r = rng(seed || 13), p = Parts(), W = WOOD[n] || WOOD.gatelands, wood = W.paint || W.wood, w = .72, d = .42, h = .32;
    for (let i = 0; i < 3; i++) p(SK.rbox(w, h / 3 - .004, d, .01, 1), jit(wood, r), 0, h / 6 + h / 3 * i, 0);
    p(SK.cyl(d / 2, d / 2, w, 12, 1, false, 0, Math.PI), jit(wood, r), 0, h, 0, 0, 0, Math.PI / 2, .55, 1, 1);
    for (const s of [-1, 1]) p(new THREE.CircleGeometry(d / 2, 12, 0, Math.PI), wood, s * w / 2, h, 0, 0, s * Math.PI / 2, 0, 1, .55, 1);
    for (const x of [-.26, 0, .26]) { p(SK.rbox(.035, h + .004, d + .012, .006, 1), IRON, x, h / 2, 0);
      p(SK.torus(d / 2 + .005, .007, 4, 12, Math.PI), IRON, x, h, 0, 0, Math.PI / 2, 0, 1, .55, 1); }
    p(SK.rbox(.09, .1, .015, .01, 1), 0x6a5a3a, 0, h - .04, d / 2 + .008);
    for (const s of [-1, 1]) p(SK.torus(.04, .008, 4, 10, Math.PI), IRON, s * (w / 2 + .012), h * .7, 0, 0, Math.PI / 2, Math.PI);
    return p; }
  // pots, bottles and cups on the lathe
  const jar = (r, h) => lathe([[.001, 0], [r * .8, 0], [r, h * .15], [r, h * .6], [r * .6, h * .85], [r * .55, h], [r * .65, h * 1.04], [r * .5, h * 1.04]], 10);
  const bottle = (r, h) => lathe([[.001, 0], [r, 0], [r, h * .6], [r * .35, h * .78], [r * .3, h], [.001, h]], 6);
  const bowl = r => lathe([[.001, 0], [r * .5, 0], [r * .9, r * .35], [r, r * .5], [r * .92, r * .5], [r * .42, r * .1], [.001, r * .1]], 10);
  const tankard = (p, x, y, z, col) => { p(lathe([[.001, 0], [.032, 0], [.03, .09], [.033, .1], [.02, .1], [.02, .01], [.001, .01]], 8), col, x, y, z);
    p(SK.torus(.025, .006, 4, 8, Math.PI), col, x + .032, y + .05, z, 0, 0, -Math.PI / 2); };
  // a candle in a dish
  const candle = (p, x, y, z) => { p(lathe([[.001, 0], [.045, 0], [.045, .012], [.012, .015], [.012, .03], [.02, .035], [.001, .035]], 8), 0x7a6a4a, x, y, z);
    p(SK.cyl(.011, .012, .09, 6), 0xe8e0c8, x, y + .08, z); p.flame(SK.cone(.008, .03, 5), 0xffd070, x, y + .14, z); };
  // a wall shelf: a plank on two shaped brackets, dressed with jars, bowls, a stack of plates and a cloth
  function shelf(w, n, seed, stock) { const r = rng(seed || 17), p = Parts(), W = WOOD[n] || WOOD.gatelands;
    p(SK.rbox(w, .03, .22, .01, 1), jit(W.wood, r), 0, 0, .11);
    for (const s of [-1, 1]) { p(SK.rbox(.03, .16, .03, .008, 1), W.dark, s * (w / 2 - .12), -.08, .015); p(SK.rbox(.03, .03, .19, .008, 1), W.dark, s * (w / 2 - .12), -.025, .11);
      p(SK.rbox(.024, .2, .024, .006, 1), W.dark, s * (w / 2 - .12), -.075, .085, -Math.PI / 4.2); }
    const pots = [0x8a5a3a, 0xa8784a, 0x6a6a5a, 0xc8b89a, 0x4a5a3a, 0x7a3a2a];
    for (let x = -w / 2 + .12; x < w / 2 - .08;) { if (r() < .22) { x += .12 + r() * .25; continue; } const kind = stock === 'bottles' ? (r() < .75 ? 1 : 0) : Math.floor(r() * 4);
      if (kind === 0) { const rr = .04 + r() * .025; p(jar(rr, .1 + r() * .08), pots[Math.floor(r() * pots.length)], x + rr, .015, .1 + r() * .03); x += rr * 2 + .03; }
      else if (kind === 1) { const rr = .028 + r() * .01; p(bottle(rr, .16 + r() * .06), [0x2a4a2a, 0x3a2a1a, 0x5a6a3a, 0x2a3a4a][Math.floor(r() * 4)], x + rr, .015, .11); x += rr * 2 + .025; }
      else if (kind === 2) { const rr = .06 + r() * .02; p(bowl(rr), jit(0x9a7050, r), x + rr, .015, .11); x += rr * 2 + .02; }
      else { for (let k = 0; k < 4; k++) p(SK.cyl(.075, .06, .012, 12), jit(0xd8ccb0, r, .03), x + .075, .02 + k * .013, .11); x += .17; } }
    return p; }
  // a braided rag rug: rings of alternating colour, an oval
  function rug(rx, rz, n, seed) { const r = rng(seed || 19), p = Parts(), cols = (WOOD[n] || WOOD.gatelands).cloth.concat([0x8a7a5a]);
    const k = 8; for (let i = 0; i < k; i++) p(new THREE.RingGeometry(i / k, (i + 1) / k, 28), jit(cols[i % cols.length], r, .05), 0, .006 + i * .0004, 0, -Math.PI / 2, 0, 0, rx, rz, 1);
    p(SK.torus(1, .012, 4, 28), cols[0], 0, .008, 0, Math.PI / 2, 0, 0, rx, rz, 1);
    return p; }
  // a stone hearth against a wall: a chimney breast of coursed stones to the ceiling, a timber lintel over an arched-back fire
  // opening, a mantel with odds on it, a hearthstone, firedogs and logs, flames (unlit, in the fire list) and a pot on a crane.
  // Local: the wall at z=0, the room towards +z, centred on x=0.
  function hearth(bw, ceil, n, seed) { const r = rng(seed || 23), p = Parts(), W = WOOD[n] || WOOD.gatelands, dep = .62, ow = bw * .55, oh = .62, ld = .45;
    const stone = () => jit(STONE, r, .12).offsetHSL((r() - .5) * .02, 0, 0);
    const course = (y0, h, x0, x1, zf, dz) => { let x = x0; const off = r() * .1; x += off - .1; while (x < x1 - .02) { const L = Math.min(x1 - x, .22 + r() * .22), lx = Math.max(x, x0);
        const w = Math.min(x + L, x1) - lx; if (w > .03) p(SK.rbox(w - .012, h - .014, dz - .01, .02, 1), stone(), lx + w / 2, y0 + h / 2, zf - dz / 2 + (r() - .5) * .012); x += L; } };
    let y = 0; while (y < oh + .01) { const h = .15 + r() * .05; course(y, h, -bw / 2, -ow / 2, dep, dep); course(y, h, ow / 2, bw / 2, dep, dep); y += h; }
    p(SK.rbox(ow + .5, .17, .22, .02, 1), jit(W.dark, r, .03), 0, oh + .085, dep - .11);
    p(SK.rbox(bw + .16, .05, .26, .012, 1), jit(W.wood, r), 0, oh + .19, dep + .02 - .13 + .02);
    y = oh; const top = Math.min(ceil, oh + .62); while (y < top - .02) { const h = Math.min(top - y, .16 + r() * .05); { const zf = dep - (y < oh + .2 ? .22 : 0); course(y, h, -bw / 2, bw / 2, zf, zf); } y += h; }
    if (ceil > top + .05) { p(SK.rbox(bw * .84, ceil - top + .02, dep - .1, .03, 1), jit(n === 'mark' ? 0x7a746c : 0xd6ccb6, r, .03), 0, (top + ceil) / 2, (dep - .1) / 2);
      p(SK.rbox(bw * .9, .06, dep - .04, .015, 1), jit(STONE, r, .06), 0, top + .01, (dep - .04) / 2); }
    p(SK.rbox(ow, oh, .04, .01, 1), SOOT, 0, oh / 2, .03); for (const s of [-1, 1]) p(SK.rbox(.04, oh, ld, .01, 1), SOOT, s * (ow / 2 - .02), oh / 2, .03 + ld / 2);
    p(SK.rbox(ow, .04, ld + .05, .01, 1), 0x1c1510, 0, oh - .02, .05 + ld / 2);
    p(SK.rbox(bw + .1, .035, .34, .015, 1), jit(0x6e6860, r, .06), 0, .0175, dep + .17);
    for (const s of [-1, 1]) { p(SK.rbox(.02, .12, .02, .004, 1), IRON, s * .15, .06, dep - .15); p(SK.rbox(.02, .02, .3, .004, 1), IRON, s * .15, .1, dep - .3); }
    p(SK.limb(.5, .05, .045), 0x5a3a20, -.25, .16, dep - .3, 0, 0, Math.PI / 2 + .12);
    p(SK.limb(.46, .045, .04), 0x4a3018, .2, .19, dep - .28, 0, .3, -Math.PI / 2 + .1);
    p(SK.ball(.14, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0x3a1a0c, 0, .02, dep - .3, 0, 0, 0, 1.6, .35, 1);
    p.flame(SK.ball(.12, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0xff5a18, 0, .06, dep - .3, 0, 0, 0, 1.4, .3, .9);
    for (const [fx, fh, fr, c] of [[0, .32, .07, 0xffb040], [-.1, .22, .05, 0xff8a28], [.11, .25, .055, 0xff9a30], [.02, .16, .09, 0xff6a20]]) p.flame(SK.cone(fr, fh, 6), c, fx, .2 + fh / 2, dep - .3 + (r() - .5) * .06);
    p(SK.cyl(.012, .012, oh - .06, 6), IRON, ow / 2 - .08, (oh - .06) / 2, dep - .12); p(SK.rbox(.34, .018, .018, .004, 1), IRON, ow / 2 - .25, oh - .12, dep - .12);
    p(SK.cyl(.004, .004, .05, 4), IRON, ow / 2 - .4, oh - .1, dep - .12);
    p(lathe([[.001, 0], [.06, .005], [.1, .05], [.105, .09], [.085, .14], [.09, .15], [.08, .15]], 12), 0x1e1c1a, ow / 2 - .4, oh - .3, dep - .12);
    p(SK.torus(.08, .005, 4, 12, Math.PI), IRON, ow / 2 - .4, oh - .16, dep - .12);
    const onM = oh + .215;
    p(lathe([[.001, 0], [.04, 0], [.05, .06], [.045, .12], [.03, .15], [.034, .17], [.001, .17]], 10), 0x9a6a3a, -bw / 2 + .2, onM, dep - .02);
    candle(p, -bw / 2 + .45, onM, dep - .02); candle(p, bw / 2 - .35, onM, dep - .02);
    p(SK.cyl(.1, .09, .012, 14), 0x8a8478, .05, onM + .1, dep - .08, -1.3);
    return p; }
  // a bar counter: a panelled front on a plinth, a thick top with a rounded nosing, a brass foot rail. Front towards +z.
  function counter(len, n, seed) { const r = rng(seed || 29), p = Parts(), W = WOOD[n] || WOOD.gatelands, h = .69, d = .7;
    p(SK.rbox(len, .06, d + .1, .025, 2), jit(W.wood, r), 0, h - .03, .03);
    p(SK.rbox(len - .06, .07, d - .06, .01, 1), W.dark, 0, .035, 0);
    p(SK.rbox(len - .08, h - .13, d - .12, .01, 1), jit(W.dark, r, .03).multiplyScalar(.85), 0, .07 + (h - .13) / 2, -.02);
    const np = Math.max(2, Math.round(len / .55)), pw = (len - .08) / np;
    for (let i = 0; i <= np; i++) p(SK.rbox(.06, h - .13, .03, .008, 1), jit(W.wood, r, .04), -len / 2 + .04 + pw * i, .07 + (h - .13) / 2, d / 2 - .03);
    for (const yy of [.1, h - .09]) p(SK.rbox(len - .08, .05, .03, .008, 1), jit(W.wood, r, .04), 0, yy, d / 2 - .03);
    for (let i = 0; i < np; i++) { const cx = -len / 2 + .04 + pw * (i + .5); p(SK.rbox(pw - .1, h - .32, .02, .02, 1), jit(W.wood, r, .05).multiplyScalar(.92), cx, .07 + (h - .13) / 2, d / 2 - .045); }
    for (const s of [-1, 1]) p(SK.rbox(.03, h - .06, d - .04, .008, 1), jit(W.wood, r), s * (len / 2 - .015), (h - .06) / 2, 0);
    p(SK.cyl(.012, .012, len - .2, 8), 0xa8843a, 0, .1, d / 2 + .12, 0, 0, Math.PI / 2);
    for (let i = 0; i < 4; i++) p(SK.rbox(.02, .1, .1, .004, 1), 0x8a6a2a, -len / 2 + .1 + (len - .2) * i / 3, .07, d / 2 + .07);
    tankard(p, -len * .3, h, .1, 0x8a8478); tankard(p, -len * .3 + .1, h, .15, 0x7a6a4a); tankard(p, len * .25, h, .05, 0x8a8478);
    p(lathe([[.001, 0], [.05, 0], [.065, .06], [.06, .13], [.035, .18], [.04, .21], [.001, .21]], 10), 0x7a5a38, len * .1, h, .12);
    return p; }
  // a cask on a cradle, lying, with a tap
  function cask(n, seed) { const r = rng(seed || 31), p = Parts(), W = WOOD[n] || WOOD.gatelands, R = .2, L = .5;
    const prof = []; for (let i = 0; i <= 8; i++) { const u = i / 8; prof.push([R * (.86 + .14 * Math.sin(Math.PI * u)), L * u - L / 2]); }
    p(lathe(prof, 14), jit(W.wood, r), 0, R + .08, 0, 0, 0, Math.PI / 2);
    for (const u of [.12, .35, .65, .88]) p(SK.torus(R * (.86 + .14 * Math.sin(Math.PI * u)) + .004, .01, 4, 16), IRON, L * u - L / 2, R + .08, 0, 0, Math.PI / 2, 0);
    for (const s of [-1, 1]) p(new THREE.CircleGeometry(R * .85, 14), jit(W.dark, r), s * L / 2, R + .08, 0, 0, s * Math.PI / 2, 0);
    p(SK.cyl(.012, .012, .08, 6), 0x8a6a2a, L / 2 + .04, R + .02, 0, 0, 0, Math.PI / 2); p(SK.cyl(.01, .01, .05, 6), 0x8a6a2a, L / 2 + .07, R - .01, 0);
    for (const s of [-1, 1]) p(SK.rbox(.06, .12, R * 2 + .05, .01, 1), W.dark, s * L * .3, .06, 0);
    return p; }
  // a tall dresser against the back wall: uprights, three shelves of bottles, jugs and standing plates
  function dresser(w, n, seed) { const r = rng(seed || 37), p = Parts(), W = WOOD[n] || WOOD.gatelands, H = 1.62;
    for (const x of [-w / 2 + .03, 0, w / 2 - .03]) p(SK.rbox(.05, H, .3, .01, 1), jit(W.wood, r), x, H / 2, .15);
    p(SK.rbox(w + .08, .06, .34, .015, 1), W.dark, 0, H + .03, .17);
    [.2, .74, 1.12, 1.49].forEach((y, i) => { p(SK.rbox(w, .03, .28, .008, 1), jit(W.wood, r), 0, y, .15);
      if (i > 0) for (const sx of [-1, 1]) { const q = shelf(w / 2 - .06, n, seed * 7 + i * 2 + sx, i === 1 ? 'mixed' : 'bottles'), m = M(sx * w / 4, y, .02);
        for (const e of q.list) if (e[2].elements[13] > .005) p.list.push([e[0], e[1], m.clone().multiply(e[2])]); } });
    for (let i = 0; i < 3; i++) p(SK.cyl(.1, .09, .012, 14), jit(0xc8b89a, r, .04), -w / 2 + .2 + i * .22, .33, .04, -1.35);
    return p; }
  // the flames flicker: call per frame with the fire mesh and the time
  function flicker(fire, t) { if (!fire) return; const s = 1 + Math.sin(t * 11.3) * .06 + Math.sin(t * 17.1) * .04; fire.scale.set(1, s, 1); }

  // ── bake: one vertex-coloured mesh for the wood and stone, one unlit mesh for the flames. Every vertex near the floor is
  // darkened (the contact shade the bake gives the dungeon's props), from ×.62 at the floor to ×1 at .35 up. ──
  function merge(list, contact) { const P = [], N = [], Cc = [], I = []; const v = new THREE.Vector3(), nm = new THREE.Matrix3();
    for (const [geo, col, m] of list) { const pa = geo.attributes.position, na = geo.attributes.normal, b = P.length / 3; nm.getNormalMatrix(m);
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(m); P.push(v.x, v.y, v.z); const k = contact ? .62 + .38 * Math.min(1, Math.max(0, v.y / .35)) : 1;
        Cc.push(col.r * k, col.g * k, col.b * k); v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); N.push(v.x, v.y, v.z); }
      if (geo.index) { const ix = geo.index.array; for (let i = 0; i < ix.length; i++) I.push(ix[i] + b); } else for (let i = 0; i < pa.count; i++) I.push(b + i); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I); return g; }
  function bake(p) { const G = new THREE.Group();
    const body = new THREE.Mesh(merge(p.list, true), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); G.add(body);
    let fire = null; if (p.fire.length) { fire = new THREE.Mesh(merge(p.fire, false), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .92 })); G.add(fire); }
    G.userData.tris = body.geometry.index.count / 3 + (fire ? fire.geometry.index.count / 3 : 0); G.userData.fire = fire; return G; }

  // ── the two rooms, at the places buildInteriorFor puts today's boxes (W×D room, ceiling H, x east, z south, door at z=D) ──
  function home(W, D, H, n, seed) { const p = Parts(), s = seed || 1;
    p.put(bed(n, s + 1), 1.2, 1.2, 0);
    p.put(hearth(1.8, H, n, s + 2), W, D * .4, -Math.PI / 2);
    p.put(table(1.5, .9, n, s + 3), W / 2, D * .5, 0);
    p.put(chair(n, s + 4), W / 2 - 1.0, D * .5, Math.PI / 2 + .12); p.put(chair(n, s + 5), W / 2 + 1.0, D * .5, -Math.PI / 2 - .2);
    { const q = Parts(); candle(q, 0, .46, 0); q(bowl(.08), 0x9a7050, .3, .46, .12); tankard(q, -.25, .46, -.15, 0x7a6a4a); p.put(q, W / 2, D * .5, 0); }
    p.put(chest(n, s + 6), W / 2 + 2.2, 1.0, 0);
    p.put(shelf(2.2, n, s + 7), 2.6, 0, 0, .68); p.put(shelf(2.2, n, s + 8), 2.6, 0, 0, 1.05);
    p.put(rug(.85, .55, n, s + 9), W / 2, D * .5 + .05, 0);
    return p; }
  function inn(W, D, H, n, seed, gallery) { const p = Parts(), s = seed || 1, L = W * .55;
    p.put(counter(L, n, s + 1), W / 2, 2.2, 0);
    p.put(dresser(L, n, s + 2), W / 2, .02, 0);
    p.put(cask(n, s + 3), W / 2 - L / 2 + .45, 1.1, Math.PI / 2 + Math.PI / 2 * 0); p.put(cask(n, s + 4), W / 2 + L / 2 - .45, 1.1, 0);
    p.put(hearth(2.2, H, n, s + 5), W, D * .5, -Math.PI / 2);
    const T = [[3.4, D * .42], [3.4, D * .66], [W - 3.4, D * .7], [W / 2, D * .6]];
    T.forEach(([x, z], i) => { p.put(table(1.8, 1.0, n, s + 10 + i), x, z, 0); for (const sd of [-1, 1]) p.put(bench(1.6, n, s + 20 + i * 2 + sd), x, z + sd * .9, 0);
      const q = Parts(); tankard(q, -.4, .46, .1, 0x8a8478); tankard(q, .3, .46, -.15, 0x7a6a4a); if (i % 2 === 0) candle(q, 0, .46, 0); else q(bowl(.09), 0x9a7050, .05, .46, .05); p.put(q, x, z, 0); });
    for (let k = 0; k < 3; k++) p.put(stool(n, s + 30 + k), W / 2 - L * .3 + k * L * .3, 2.2 + .72, 0);
    if (!gallery) { p.put(bed(n, s + 40), 1.2, D - 2.0, 0); p.put(bed(n, s + 41), W - 1.2, D - 2.0, 0); }
    return p; }
  return { Parts, table, bench, chair, stool, bed, chest, shelf, rug, hearth, counter, cask, dresser, candle, tankard, bake, merge, flicker, home, inn, WOOD };
}
root.FURN = FURN;
})(typeof window !== 'undefined' ? window : globalThis);
