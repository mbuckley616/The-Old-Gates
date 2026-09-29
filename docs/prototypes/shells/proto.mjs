// Prototype (look builder, Session 333): the interiors' shells on the shape kit. Not in the game: this script boots the game,
// builds generated rooms through WORLD.buildInteriorFor, hides today's shell (four flat wall planes, a flat dark ceiling, box
// beams, the French rooms' box studs, the entrance door's box) and puts a kit shell in its place, then renders.
//   A — the full frame: in plastered rooms, posts at the corners and under each beam's ends where no window stands, knee braces,
//       a sole plate along the foot and a wall plate along the head; beams with joists and a boarded ceiling; in stone rooms a
//       plinth course and stepped corbels under the beams instead of posts; the walls darkened at the foot, the head and in the
//       corners (vertex shade, as the dungeon's shell); the entrance a plank door with strap hinges in a timber or stone frame.
//       Aurenne's rooms keep their close studding (a post every 1.6) on the kit.
//   B — the trim only: the sole plate, the wall plate, the shade, the joisted ceiling and the door; no posts, braces or corbels (Aurenne's box studs stay as today).
// Run: node docs/prototypes/shells/proto.mjs  →  docs/prototypes/shells-*.png
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const shots = await page.evaluate(() => {
  const K = furnKit();
  const rb = (w, h, d, r) => SK.rbox(w, h, d, r == null ? Math.min(.02, w / 3, h / 3, d / 3) : r, 1);
  const rng = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const jit = (c, r, a) => new THREE.Color(c).offsetHSL(0, 0, (r() - .5) * (a || .06));
  // the shade: a wall plane with vertex colours, darker at the foot, the head and the corners
  function shadedWall(len, H, mat) { const nx = Math.max(4, Math.round(len / .5)), ny = 10, geo = new THREE.PlaneGeometry(len, H, nx, ny), p = geo.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + len / 2, y = p.getY(i) + H / 2, e = Math.min(x, len - x);
      const f = Math.max(.45, 1 - .38 * Math.exp(-y / .3) - .3 * Math.exp(-(H - y) / .35) - .32 * Math.exp(-e / .4)); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = f; }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); const m = mat.clone(); m.vertexColors = true; return new THREE.Mesh(geo, m); }
  // the entrance: a plank door with ledges, a brace, strap hinges and a ring, in a frame (timber or stone). Local: the wall at z=0,
  // the room towards +z, the door's foot at y=0 centred on x=0
  function door(stone, n, seed) { const r = rng(seed || 9), p = K.Parts(), W = K.WOOD[n] || K.WOOD.gatelands, w = 1.0, h = 1.5, I = 0x2a2624, S = 0x9a9284;
    const nb = 5; for (let k = 0; k < nb; k++) p(rb(w / nb - .008, h, .05, .01), jit(W.wood, r, .08), -w / 2 + w / nb * (k + .5), h / 2, .03);
    for (const y of [.25, h - .25]) p(rb(w - .1, .09, .035, .01), jit(W.dark, r), 0, y, .07);
    { const L = Math.hypot(w - .16, h - .6); p(rb(.08, L, .03, .01), jit(W.dark, r), 0, h / 2, .07, 0, 0, Math.atan2(w - .16, h - .6)); }
    for (const y of [.25, h - .25]) { p(rb(w * .7, .045, .012, .005), I, -w * .15, y, .095); for (let k = 0; k < 4; k++) p(SK.ball(.012, 5, 4), I, -w / 2 + .06 + k * w * .19, y, .1); }
    p(SK.torus(.05, .008, 4, 12), I, w * .32, h * .52, .1); p(SK.ball(.02, 6, 5), I, w * .32, h * .52 + .05, .09);
    if (stone) { for (const sx of [-1, 1]) for (let k = 0, y = 0; k < 4; k++) { const bh = h / 4, bw = k % 2 ? .16 : .24; p(rb(bw, bh - .012, .2), jit(S, r, .07), sx * (w / 2 + bw / 2), y + bh / 2, .08); y += bh; }
      p(rb(w + .6, .22, .22), jit(S, r, .05), 0, h + .11, .09); }
    else { for (const sx of [-1, 1]) p(rb(.12, h + .1, .14), jit(W.dark, r), sx * (w / 2 + .06), (h + .1) / 2, .06); p(rb(w + .5, .16, .16), jit(W.dark, r), 0, h + .13, .07); }
    return p; }
  // the shell: every piece in room coordinates (x east, z south, the door at z=D)
  function shell(variant, W, D, H, stone, n, seed, wins, close) { const r = rng(seed || 3), p = K.Parts(), Wd = K.WOOD[n] || K.WOOD.gatelands, T = Wd.dark, S = 0x6e675e;
    const nb = Math.max(2, Math.round(D / 3)), beams = []; for (let i = 1; i <= nb; i++) beams.push(D * i / (nb + 1));
    const bh = .22, bw = .2, jh = .09, yB = H - jh - bh / 2;
    // beams, joists, and the plate they bear on
    for (const z of beams) p(rb(W, bh, bw, .03), jit(T, r, .05), W / 2, yB, z);
    for (let x = .3; x < W - .1; x += .5) p(rb(.09, jh, D, .015), jit(T, r, .07), x, H - jh / 2, D / 2);
    // the sole plate or plinth, and the wall plate, along each wall (the entrance gap in the south wall)
    const along = (fn) => { fn(W / 2, .0, W, 0); fn(0, D / 2, D, 1); fn(W, D / 2, D, 1); fn(W / 2, D, W, 0); };
    along((cx, cz, L, side) => { const inset = side ? (cx < 1 ? .05 : -.05) : (cz < 1 ? .05 : -.05);
      const segs = cz === D ? [[0, W / 2 - .9], [W / 2 + .9, W]] : [[0, L]];
      for (const [a, b] of segs) { const len = b - a, mid = (a + b) / 2;
        if (stone) { for (let s = a; s < b - .05; s += .55) { const l = Math.min(.55, b - s) - .02, c = s + l / 2; side ? p(rb(.16, .26, l, .03), jit(S, r, .08), cx + inset, .13, c) : p(rb(l, .26, .16, .03), jit(S, r, .08), c, .13, cz + inset); } }
        else side ? p(rb(.1, .16, len, .015), jit(T, r), cx + inset, .08, mid) : p(rb(len, .16, .1, .015), jit(T, r), mid, .08, cz + inset); }
      side ? p(rb(.14, .16, L, .02), jit(T, r), cx + inset * 1.2, H - jh - .08, cz) : p(rb(L, .16, .14, .02), jit(T, r), cx, H - jh - .08, cz + inset * 1.2); });
    if (variant === 'A') {
      const clear = z => !wins.some(wz => Math.abs(wz - z) < 1.2);
      const post = (x, z) => p(rb(.18, H - jh - .16, .18, .03), jit(T, r, .05), x, (H - jh - .16) / 2, z);
      if (!stone) { for (const [x, z] of [[.09, .09], [W - .09, .09], [.09, D - .09], [W - .09, D - .09]]) post(x, z);
        for (const z of beams) for (const sx of [0, 1]) { const x = sx ? W - .09 : .09, dir = sx ? -1 : 1;
          if (clear(z)) { post(x, z); const L = .75; for (const dz of [-1, 1]) p(rb(.1, L, .1, .02), jit(T, r), x + dir * .02, yB - bh / 2 - L * .35, z + dz * L * .35, dz * .78, 0, 0); p(rb(.1, .5, .1, .02), jit(T, r), x + dir * .24, yB - bh / 2 - .18, z, 0, 0, -dir * .8); }
          else p(rb(.22, .3, .24, .03), jit(T, r), x + dir * .03, yB - bh / 2 - .15, z); }
        const step = close ? 1.6 : 2.4; for (let x = step; x < W - .8; x += step) { if (Math.abs(x - W / 2) > 1.1) post(x, D - .09); post(x, .09); }
        if (close) for (let z = 1.6; z < D - .8; z += 1.6) if (clear(z) && !beams.some(b => Math.abs(b - z) < .5)) { post(.09, z); post(W - .09, z); } }
      else for (const z of beams) for (const sx of [0, 1]) { const x = sx ? W : 0, dir = sx ? -1 : 1;
        for (let k = 0; k < 3; k++) p(rb(.16 + k * .12, .12, .3, .025), jit(S, r, .06), x + dir * (.08 + k * .06), yB - bh / 2 - .3 + k * .12, z); } }
    return p; }
  const render = (sc, pos, look) => { const cv = REN.domElement, cam = new THREE.PerspectiveCamera(60, cv.width / cv.height, .05, 80); cam.position.set(...pos); cam.lookAt(...look); sc.updateMatrixWorld(true); REN.render(sc, cam); return cv.toDataURL('image/png'); };
  const out = {}, tris = {}; let PLANK = null;
  const rooms = [['home', 'irish', 'irish', 'gatelands'], ['home', 'french', 'french', 'aurenne'], ['home', 'anglo', 'anglo', 'mark'], ['home', 'stone', 'irish', 'gatelands']];
  for (const [type, style, reg, n] of rooms) for (const variant of ['today', 'A', 'B']) {
    const house = { id: 'shell_' + type + style, type, w: 7, d: 5, doorX: px, doorZ: pz, style, reg };
    const sc = WORLD.buildInteriorFor(house), W = house.intW, D = house.intD; let H = 0;
    sc.traverse(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && Math.abs(o.rotation.x - Math.PI / 2) < 1e-6) H = Math.max(H, o.position.y); });
    const stone = style === 'stone' || style === 'anglo' || style === 'garrison';
    if (variant !== 'today') {
      const hide = []; sc.children.forEach(o => { if (!o.isMesh) return; const gp = o.geometry.parameters || {}, gt = o.geometry.type;
        if (gt === 'PlaneGeometry' && o.material.map && Math.abs(o.rotation.x) < 1e-6 && Math.abs(o.position.y - H / 2) < 1e-3) hide.push(['wall', o]);
        else if (gt === 'PlaneGeometry' && Math.abs(o.rotation.x - Math.PI / 2) < 1e-6) hide.push(['ceil', o]);
        else if (gt === 'BoxGeometry' && gp.width === W && gp.height === .16 && gp.depth === .22) hide.push(['beam', o]);
        else if (gt === 'BoxGeometry' && gp.height === H && ((gp.width === .14 && gp.depth === .12) || (gp.width === .12 && gp.depth === .14))) hide.push(['stud', o]);
        else if (gt === 'BoxGeometry' && gp.width === .9 && gp.height === 1.4 && gp.depth === .08) hide.push(['door', o]); });
      for (const [k, o] of hide) { if (k === 'stud' && variant === 'B') continue; o.visible = false;
        if (k === 'wall') { const w = shadedWall(o.geometry.parameters.width, H, o.material); w.position.copy(o.position); w.rotation.copy(o.rotation); sc.add(w); }
        if (k === 'ceil') { const c = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshLambertMaterial({ map: (() => { let t = null; sc.traverse(q => { if (!t && q.isMesh && q.material.map && q.rotation.x < -1) t = q.material.map; }); if (!stone) PLANK = t; t = PLANK.clone(); t.needsUpdate = true; t.repeat.set(W / 2.2, D / 2.2); return t; })(), color: 0x8a7a68 })); c.rotation.x = Math.PI / 2; c.position.set(W / 2, H, D / 2); sc.add(c); } }
      const wins = []; for (let z = D * .3; z < D * .9; z += Math.max(3, D * .3)) wins.push(z);
      const G = K.bake(shell(variant, W, D, H, stone, n, 5, wins, style === 'french')); sc.add(G);
      const Dr = K.bake(door(stone, n, 9)); Dr.position.set(W / 2, 0, D); Dr.rotation.y = Math.PI; sc.add(Dr);
      tris[type + '-' + style + '-' + variant] = G.userData.tris + Dr.userData.tris; }
    out[type + '-' + style + '-' + variant] = [render(sc, [W * .55, 1.0, D - 1.0], [W * .15, 1.3, D * .2]), render(sc, [W * .5, 1.05, D * .35], [W * .5, 1.0, D])]; }
  return { out, tris };
});
const pngs = shots.out;
console.log(JSON.stringify(shots.tris));
// a sheet per room: rows are variants, left looking up the room, right looking back at the door
const sheet = async (keys, name) => { const url = await page.evaluate(async ({ keys, pngs }) => { const ims = await Promise.all(keys.flatMap(k => pngs[k]).map(src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = src; })));
  const w = ims[0].width / 2, h = ims[0].height / 2, c = document.createElement('canvas'); c.width = w * 2; c.height = h * keys.length; const x = c.getContext('2d'); x.font = 'bold 20px serif';
  ims.forEach((im, i) => { x.drawImage(im, (i % 2) * w, (i >> 1) * h, w, h); if (i % 2 === 0) { x.fillStyle = '#000a'; x.fillRect(0, (i >> 1) * h, 300, 32); x.fillStyle = '#fff'; x.fillText(keys[i >> 1], 8, (i >> 1) * h + 23); } });
  return c.toDataURL(); }, { keys, pngs }); fs.writeFileSync('docs/prototypes/' + name, Buffer.from(url.split(',')[1], 'base64')); };
for (const [k, name] of [['home-irish', 'shells-gatelands.png'], ['home-french', 'shells-aurenne.png'], ['home-anglo', 'shells-mark.png'], ['home-stone', 'shells-stone.png']])
  await sheet([k + '-today', k + '-A', k + '-B'], name);
if (g.errs.length) console.log('page errors', g.errs);
await g.close();
