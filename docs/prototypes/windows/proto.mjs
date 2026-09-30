// Prototype (look builder, Session 305): the interiors' windows on the shape kit. Not in the game: this script boots the game,
// builds a generated home and church through WORLD.buildInteriorFor, sets their painted window views back into the wall (the church's
// plain panes are hidden for an arched one), puts a kit window at each one's place and renders. Run: node docs/prototypes/windows/proto.mjs  →  docs/prototypes/windows-*.png
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const shots = await page.evaluate(() => {
  const K = furnKit();
  const rb = (w, h, d, r) => SK.rbox(w, h, d, r == null ? Math.min(.012, w / 3, h / 3, d / 3) : r, 1);
  const rng = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const jit = (c, r, a) => new THREE.Color(c).offsetHSL(0, 0, (r() - .5) * (a || .06));
  // clip the lines x±y=c to a rectangle: diamond leading over one light
  const diamonds = (p, x0, x1, y0, y1, step, col, z) => {
    for (const s of [1, -1]) for (let c = -3; c <= 3; c += step) { const pts = [];
      for (const x of [x0, x1]) { const y = s * (x - 0) + c; if (y >= y0 - 1e-6 && y <= y1 + 1e-6) pts.push([x, y]); }
      for (const y of [y0, y1]) { const x = s * (y - c); if (x >= x0 - 1e-6 && x <= x1 + 1e-6) pts.push([x, y]); }
      if (pts.length < 2) continue; const [a, b] = pts; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < .02) continue;
      p(rb(.008, L, .008, .003), col, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z, 0, 0, -Math.atan2(b[0] - a[0], b[1] - a[1])); } };
  // A — a leaded casement in a plastered reveal: splayed jambs and head, a stone sill, an oak frame with a mullion and a
  // transom, diamond leading; local: wall at z=0, room towards +z, the opening centred at (0, cy)
  function winA(w, h, seed) { const r = rng(seed || 3), p = K.Parts(), P = 0xd8ccb4, O = 0x5a3a20, L = 0x3a3a3c, S = 0xa89c88;
    for (const sx of [-1, 1]) p(rb(.14, h + .2, .16), jit(P, r, .03), sx * (w / 2 + .07), 0, .08, 0, sx * .18, 0);
    p(rb(w + .36, .14, .16), jit(P, r, .03), 0, h / 2 + .07, .08, -.12, 0, 0);
    p(rb(w + .44, .07, .26), jit(S, r, .05), 0, -h / 2 - .035, .12);
    p(rb(w + .06, .05, .06), O, 0, h / 2, .03); p(rb(w + .06, .05, .06), O, 0, -h / 2 + .01, .03);
    for (const x of [-w / 2, 0, w / 2]) p(rb(.05, h, .06), O, x, 0, .03);
    const ty = h * .22; p(rb(w, .04, .05), O, 0, ty, .03);
    for (const [x0, x1] of [[-w / 2 + .025, -.025], [.025, w / 2 - .025]]) { diamonds(p, x0, x1, -h / 2 + .035, ty - .02, .16, L, .02); diamonds(p, x0, x1, ty + .02, h / 2 - .025, .16, L, .02); }
    return p; }
  // B — a timber-framed window with open plank shutters: a lintel beam, four panes behind glazing bars, two shutters of three
  // boards on a ledge, folded back against the wall on strap hinges, a plank sill
  function winB(w, h, seed) { const r = rng(seed || 5), p = K.Parts(), O = 0x6e4a2c, D = 0x4a301a, I = 0x2a2a2c;
    p(rb(w + .5, .16, .18), jit(D, r), 0, h / 2 + .08, .09);
    p(rb(w + .3, .06, .22), jit(O, r), 0, -h / 2 - .03, .11);
    for (const sx of [-1, 1]) p(rb(.1, h, .12), jit(O, r), sx * (w / 2 + .05), 0, .06);
    p(rb(.035, h, .04), D, 0, 0, .03); p(rb(w, .035, .04), D, 0, 0, .03);
    for (const sx of [-1, 1]) { const cx = sx * (w / 2 + .1 + w / 4);
      for (let k = 0; k < 3; k++) p(rb(w / 6 - .008, h - .02, .03), jit(O, r, .08), cx + (k - 1) * w / 6, 0, .03);
      for (const y of [-h * .3, h * .3]) { p(rb(w / 2, .06, .025), jit(D, r), cx, y, .055); p(rb(w / 2 * .7, .025, .012), I, cx - sx * w * .08, y, .07); p(SK.ball(.012, 5, 4), I, cx - sx * (w / 4 + .02), y, .07); } }
    return p; }
  // C — a round-headed stone window for a church or hall (the church's tall upper windows; its low ones take A's leading): coursed jambs of alternate long and short blocks, a ring of nine
  // voussoirs round the head, a moulded sill, square quarries of lead
  function winC(w, h, seed) { const r = rng(seed || 7), p = K.Parts(), S = 0xb0a894, L = 0x3a3a3c, R = w / 2, hs = h - R;
    for (const sx of [-1, 1]) for (let k = 0, y = -h / 2; k < 5; k++) { const bh = hs / 5, bw = k % 2 ? .16 : .24; p(rb(bw, bh - .015, .2), jit(S, r, .07), sx * (R + bw / 2), y + bh / 2, .1); y += bh; }
    const cy = -h / 2 + hs; for (let i = 0; i < 9; i++) { const a = Math.PI * (i + .5) / 9, rr = R + .1; p(rb(.2, R * Math.PI / 9 - .015, .2), jit(S, r, .07), -Math.cos(a) * rr, cy + Math.sin(a) * rr, .1, 0, 0, a - Math.PI / 2); }
    p(rb(w + .4, .08, .28), jit(S, r, .04), 0, -h / 2 - .04, .13);
    for (let x = -R + w / 4; x < R - .01; x += w / 4) { const top = cy + Math.sqrt(Math.max(0, R * R - x * x)); p(rb(.01, top + h / 2, .01, .003), L, x, (top - h / 2) / 2, .02); }
    for (let y = -h / 2 + h / 7; y < cy + R - .02; y += h / 7) { const half = y <= cy ? R : Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)); if (half > .03) p(rb(half * 2, .01, .01, .003), L, 0, y, .02); }
    return p; }
  const glass = (w, h, arch) => { let geo; if (arch) { const R = w / 2, s = new THREE.Shape(); s.moveTo(-R, -h / 2); s.lineTo(R, -h / 2); s.lineTo(R, h / 2 - R); s.absarc(0, h / 2 - R, R, 0, Math.PI, false); s.lineTo(-R, -h / 2); geo = new THREE.ShapeGeometry(s, 12); } else geo = new THREE.PlaneGeometry(w, h);
    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: arch ? 0xe0cf9a : 0xd8e2dc })); };
  const out = {}, render = (sc, pos, look) => { const cv = REN.domElement, cam = new THREE.PerspectiveCamera(60, cv.width / cv.height, .05, 80); cam.position.set(...pos); cam.lookAt(...look); sc.updateMatrixWorld(true); REN.render(sc, cam); return cv.toDataURL('image/png'); };
  // the home: every flat window plane replaced; the same room rendered with none (today), A and B
  const tris = {};
  for (const [variant, type] of [['today', 'home'], ['A', 'home'], ['B', 'home'], ['today', 'church'], ['C', 'church']]) {
    const house = { id: 'proto_' + type, type, w: 7, d: 5, doorX: px, doorZ: pz, style: 'irish', reg: 'irish' };
    const sc = WORLD.buildInteriorFor(house), W = house.intW, D = house.intD;
    const panes = []; sc.traverse(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && o.material.isMeshBasicMaterial && Math.abs(Math.abs(o.rotation.y) - Math.PI / 2) < 1e-6) panes.push(o); });
    if (variant !== 'today') for (const o of panes) { const west = o.position.x < W / 2, arch = variant === 'C' && o.geometry.parameters.height > 2, lead = variant === 'A' || (variant === 'C' && !arch);
      if (arch) o.visible = false; else o.position.x = west ? .004 : W - .004; // the painted view stays, set back behind the frame
      const w = .9, h = arch ? 2.6 : .95, parts = lead ? winA(w, h, 3 + panes.indexOf(o)) : variant === 'B' ? winB(w, h, 5 + panes.indexOf(o)) : winC(w, h, 7 + panes.indexOf(o));
      const G = K.bake(parts); tris[variant + (arch ? '' : lead ? '-lead' : '')] = G.userData.tris; G.position.set(west ? 0 : W, o.position.y, o.position.z); G.rotation.y = west ? Math.PI / 2 : -Math.PI / 2; sc.add(G);
      if (arch) { const gl = glass(w, h, arch); gl.position.set(west ? .005 : W - .005, o.position.y, o.position.z); gl.rotation.y = G.rotation.y; sc.add(gl); } }
    const west = panes.filter(o => o.position.x < W / 2 && (type !== 'church' || o.geometry.parameters.height > 2)), gap = o => Math.abs(((o.position.z - 5.5) % 4 + 4) % 4 - 2);
    const p0 = type === 'church' ? west.sort((a, b) => gap(a) - gap(b))[0] : west[0] || panes[0];
    out[type + '-' + variant] = type === 'home' ? [render(sc, [W * .75, 1.25, p0.position.z + 1.6], [0, 1.1, p0.position.z - .3]), render(sc, [1.4, 1.2, p0.position.z + .9], [0, p0.position.y, p0.position.z])]
      : [render(sc, [W * .7, 1.8, D - 2], [0, 3.2, D * .45]), render(sc, [2.8, 2.2, p0.position.z + .6], [0, p0.position.y - .1, p0.position.z])]; }
  return { out, tris };
});
const pngs = shots.out;
console.log(JSON.stringify(shots.tris));
// a sheet per room: rows are variants, left the room, right the close view
const sheet = async (keys, name) => { const url = await page.evaluate(async ({ keys, pngs }) => { const ims = await Promise.all(keys.flatMap(k => pngs[k]).map(src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = src; })));
  const w = ims[0].width / 2, h = ims[0].height / 2, c = document.createElement('canvas'); c.width = w * 2; c.height = h * keys.length; const x = c.getContext('2d'); x.font = 'bold 22px serif'; x.fillStyle = '#fff';
  ims.forEach((im, i) => { x.drawImage(im, (i % 2) * w, (i >> 1) * h, w, h); if (i % 2 === 0) { x.fillStyle = '#000a'; x.fillRect(0, (i >> 1) * h, 180, 34); x.fillStyle = '#fff'; x.fillText(keys[i >> 1], 8, (i >> 1) * h + 24); } });
  return c.toDataURL(); }, { keys, pngs }); fs.writeFileSync('docs/prototypes/' + name, Buffer.from(url.split(',')[1], 'base64')); };
await sheet(['home-today', 'home-A', 'home-B'], 'windows-home.png');
await sheet(['church-today', 'church-C'], 'windows-church.png');
if (g.errs.length) console.log('page errors', g.errs);
await g.close();
