// The wreck and the world's chests on the kit (Session 259, H.5): a sea-floor wreck is a hull broken in two, open ribs
// on a keel with rotted planking, a stem, a snapped mast; the wreck's sea chest and the lairs' and bandit camps' hoards
// are S198's kit chest at the old box's size, their lids opening on the hinge. Session 2170 adds the whale fall on the open bed, Session 2200
// the drowned arches off the Gatelands' ports, Session 2203 the sunken village on the Gatelands' bed,
// Session 2208 the drowned quarter on Aurenne's.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const geo = WORLD.wreckGeo((() => { let a = 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })()); geo.computeBoundingBox(); const b = geo.boundingBox;
  const out = { tris: geo.attributes.position.count / 3, colours: !!geo.attributes.color, box: [b.min.x, b.max.x, b.min.y, b.max.y, b.min.z, b.max.z].map(v => +v.toFixed(2)) };
  // a picture: the wreck on a sand floor, from the side and from above
  forceTime(12); const sc = WORLD.scene, cv = REN.domElement, bx = px + 500, bz = pz, y = WORLD.worldH(bx, bz) + 90, tmp = [];
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ color: 0xb8a878 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); tmp.push(floor);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })); m.position.set(bx, y, bz); tmp.push(m); tmp.forEach(o => sc.add(o));
  const cam = new THREE.PerspectiveCamera(45, cv.width / cv.height, .3, 300); const shots = [];
  for (const [cx, cy, cz] of [[11, 4, 6], [4, 13, -6]]) { cam.position.set(bx + cx, y + cy, bz + cz); cam.lookAt(bx, y + .6, bz); sc.updateMatrixWorld(true); const f = sc.fog; sc.fog = null; REN.render(sc, cam); sc.fog = f;
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); shots.push(o.toDataURL()); }
  tmp.forEach(o => sc.remove(o)); out.shots = shots; return out; });
r.shots.forEach((u, i) => fs.writeFileSync(`tests/out/wreck-${i}.png`, Buffer.from(u.split(',')[1], 'base64'))); delete r.shots;
console.log(JSON.stringify(r));
check('a wreck is one vertex-coloured mesh of 1.5–6k triangles', r.colours && r.tris > 1500 && r.tris < 6000, r);
check('it lies about where the old one did (within ±4 across with the mast, ±7 along) and low (under 3.2), sunk into the floor (below −.3)', r.box[0] > -4 && r.box[1] < 4 && r.box[4] > -7 && r.box[5] < 7 && r.box[3] < 3.2 && r.box[2] < -.3, r.box);
// a hoard in a lair or a bandit camp near the start: the kit chest survives the site's bake whole and opens on its hinge
// WORLD.SITES holds only the loaded cells' places, and since the rivers (Session 432) the start loads the home cell alone, which
// has no lair or bandit camp: take them from the cells around and load the chosen one's cell (Session 453).
const c = await page.evaluate(() => { const [hi, hj] = WORLD.cellOf(px, pz); const ring = []; for (let i = hi - 2; i <= hi + 2; i++) for (let j = hj - 2; j <= hj + 2; j++) { const c = WORLD.getCell(i, j); if (c && c.sites) ring.push(...c.sites); } const near = ring.filter(t => (t.kind === 'lair' || t.kind === 'bcamp') && t.pad > 0).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  for (const t0 of near.slice(0, 6)) { WORLD.loadCell(...WORLD.cellOf(t0.x, t0.z)); const t = WORLD.SITE[t0.id] || t0; let S = WORLD.settlements.get(t.id); if (!S) S = WORLD.genSettlement(t); if (!S || !S.chest) continue; const ch = S.chest;
    const inScene = !!ch.g.parent, meshes = []; ch.g.traverse(o => { if (o.isMesh) meshes.push(o); }); const before = ch.lid.rotation.x;
    try { openLoot(ch); } catch (e) { return { id: t.id, err: String(e) }; } const after = ch.lid.rotation.x; try { closeLoot(); } catch (e) { }
    ch.g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(ch.g);
    return { id: t.id, kind: t.kind, inScene, meshes: meshes.length, before, after: +after.toFixed(3), size: [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z].map(v => +v.toFixed(2)) }; }
  return null; });
console.log(JSON.stringify(c));
check('a lair or bandit camp near the start has its hoard', !!c && !c.err, c);
if (c && !c.err) { check('the hoard is the kit chest (body and lid), still in the scene after the site\'s bake', c.inScene && c.meshes === 2, c);
  check('it opens on its hinge', c.before === 0 && c.after < -.9, c); }
// Session 2170 — the whale fall (OG-125, card F11; PKIT.places.whale, undersea.js's whaleFall): about one chunk of open bed in 800 lays a
// whale's bones, the same spots when asked again; the nearest is built when its chunk loads, one draw, her bones on the drawn bed, and a
// chunk left and entered again takes the same built bones back rather than building them twice
const wf = await page.evaluate(() => { const N = Math.ceil(WORLD.SIZE * GRID / CHUNK), L = []; for (let cx = 0; cx < N; cx++) for (let cz = 0; cz < N; cz++) { if (hash01(cx, cz, 170) > WHALE_FALL_ODDS) continue; const d = whaleFallSpot(cx, cz); if (d) L.push({ cx, cz, ...d }); }
  const again = L.every(d => { const e = whaleFallSpot(d.cx, d.cz); return e && e.x === d.x && e.z === d.z && e.ry === d.ry; }), wrecks = L.filter(d => wreckSpot(d.cx, d.cz)).length;
  L.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); return { n: L.length, again, wrecks, near: L[0] }; });
check(`${wf.n} whale falls lie on the open bed (60 to 300), the same when asked again, none in a wreck's chunk`, wf.n >= 60 && wf.n <= 300 && wf.again && wf.wrecks === 0, wf);
if (wf.near) { const D = wf.near, key = `${D.cx},${D.cz}`;
  await page.evaluate(D => WORLD.enter(D.x - 14, D.z + 6, 0, 'test'), D);
  for (let k = 0; k < 30; k++) { await g.spin('clear', 20); if (await page.evaluate(k => !!(chunks.get(k) && chunks.get(k).whale), key)) break; }
  const w = await page.evaluate(k => { const ch = chunks.get(k); if (!ch || !ch.whale) return { none: true }; const W = ch.whale, M = W.M, co = Math.cos(W.ry), s_ = Math.sin(W.ry), Wd = (u, v) => [W.x + u * co + v * s_, W.z - u * s_ + v * co];
    const sink = M.spine.filter(v => !v.loose).map(v => v.y - v.r * .6 - (meshH(...Wd(v.x, v.z)) - W.y)), mesh = W.group.children[0];
    const out = { tris: W.tris, draws: W.draws, colours: !!mesh.geometry.attributes.color, len: M.length, gap: M.gap, bed: W.bed, inScene: !!(W.group.parent === ch.group && ch.group.parent), sinkMin: +Math.min(...sink).toFixed(3), sinkMax: +Math.max(...sink).toFixed(3) };
    const grp = W.group; dropChunk(k); out.gone = !grp.parent || !grp.parent.parent; buildChunk(...k.split(',').map(Number)); const c2 = chunks.get(k); out.same = !!(c2 && c2.whale && c2.whale.group === grp && grp.parent === c2.group); return out; }, key);
  console.log(JSON.stringify(w));
  check(`the nearest is built with her chunk, on a bed ${w.bed} m down: ${w.tris} triangles in ${w.draws} draw (under 20k, one draw, vertex-coloured), ${w.len} m long`, !w.none && w.inScene && w.draws === 1 && w.tris < 20000 && w.colours && w.len > 18 && w.len < 21, w);
  check(`her vertebrae lie on the drawn bed, 5 to 12 cm into it (${w.sinkMin}..${w.sinkMax}); the cage's gap ${w.gap && w.gap.clear} m wide and ${w.gap && w.gap.high} m high`, w.sinkMin > -.12 && w.sinkMax < -.05 && w.gap && w.gap.clear > .9 && w.gap.high > 1.5, w);
  check('her chunk dropped takes her out of the scene, and loaded again takes the same bones back', w.gone && w.same, w); }
// Session 2200 — the drowned arches (OG-125, card F11; PKIT.places.arches, undersea.js's drownedArches): one Gatelands port in two keeps an
// old causeway out from the bank beside its quay, where the bed allows: the same ports when asked again, none off the Gatelands; the nearest
// is built with its town, its piers footed under the drawn bed, its deck 1.75 m under the sea, clear of the quay and the berth
const da = await page.evaluate(() => { const P = allPorts(), L = P.map(t => ({ id: t.id, nk: nationKeyOf(...cellOf(t.x, t.z)), d: drownedArchesSpot(t, shoreDir(t)) }));
  const again = L.every(o => { const e = drownedArchesSpot(P.find(t => t.id === o.id), shoreDir(P.find(t => t.id === o.id))); return o.d ? e && e.x === o.d.x && e.z === o.d.z : !e; });
  const gl = L.filter(o => o.nk === 'gatelands'), wl = L.filter(o => o.d).map(o => { const t = P.find(p => p.id === o.id); return { id: o.id, x: t.x, z: t.z, dist: Math.hypot(t.x - px, t.z - pz) }; }).sort((a, b) => a.dist - b.dist);
  return { ports: gl.length, n: gl.filter(o => o.d).length, off: L.filter(o => o.d && o.nk !== 'gatelands').length, again, near: wl[0] }; });
check(`${da.n} of ${da.ports} Gatelands ports keep drowned arches (3 to 18), none off the Gatelands, the same when asked again`, da.n >= 3 && da.n <= 18 && da.off === 0 && da.again, da);
if (da.near) { await page.evaluate(t => WORLD.enter(t.x, t.z, 0, 'test'), da.near);
  for (let k = 0; k < 40; k++) { await g.spin('clear', 30); if (await page.evaluate(id => { const S = WORLD.settlements.get(id); return !!(S && S.arches); }, da.near.id)) break; }
  const a = await page.evaluate(id => { const S = WORLD.settlements.get(id); if (!S || !S.arches) return { none: true }; const A = S.arches, M = A.M, co = Math.cos(A.ry), s_ = Math.sin(A.ry), W = (u, v) => [A.x + u * co + v * s_, A.z - u * s_ + v * co];
    const piers = M.arcade.bays.map(b => ({ z: b.z, foot: b.pier[0], top: b.pier[1], bed: +(worldH(...W(0, b.z)) - SEA_Y).toFixed(2) }));
    const deck = M.arcade.bays.filter(b => b.whole).map(b => +(worldH(...W(0, b.z)) - SEA_Y).toFixed(2));
    const t = WORLD.SITE[id] || allPorts().find(p => p.id === id), sd = shoreDir(t), plat = ZONES.world.platforms.find(p => p.site === id), berth = plat && quayBerth(plat, sd);
    const pts = []; for (let v = M.arcade.z0 + 1; v >= M.arcade.z1; v -= 1) for (const u of [-1.3, 1.3]) pts.push(W(u, v));
    const inPlat = plat ? pts.filter(([x, z]) => x > plat.x0 - 3 && x < plat.x1 + 3 && z > plat.z0 - 3 && z < plat.z1 + 3).length : -1, toBerth = berth ? +Math.min(...pts.map(([x, z]) => Math.hypot(x - berth.x, z - berth.z))).toFixed(1) : -1;
    return { tris: A.tris, draws: A.draws, inScene: !!(A.group.parent && A.group.parent.parent), lod: !!S.archLod, piers, deck, standing: piers.filter(p => p.top - p.bed > 1).length, deckY: M.arcade.deck, inPlat, toBerth }; }, da.near.id);
  console.log(JSON.stringify(a));
  check(`the nearest (${da.near.id}) is built with its town: ${a.tris} triangles in ${a.draws} draws (under 12k, four draws)`, !a.none && a.inScene && a.lod && a.tris < 12000 && a.draws === 4, a);
  check(`every pier is footed under the drawn bed beside it, ${a.standing} stand a metre or more clear of it, the deck ${a.deckY} m under the sea over the whole bays`, !a.none && a.piers.every(p => p.foot < p.bed - .3) && a.standing >= 3 && a.deckY < -1.5 && a.deck.every(b => b < a.deckY + .3), a);
  check(`clear of the quay (${a.inPlat} points within 3 m of it) and of the berth (${a.toBerth} m)`, !a.none && a.inPlat === 0 && a.toBerth > 8, a);
  // Session 2220 — the drowned places are stone to a swimmer (their solids read off their own meshes): a whole pier stops you at its middle,
  // its deck is a floor to a swimmer coming down onto it, and nothing stops a query without the feet's height (a hull, a foe, an arrow)
  const as = await page.evaluate(id => { const A = WORLD.settlements.get(id).arches, M = A.M, co = Math.cos(A.ry), s_ = Math.sin(A.ry), W = (u, v) => [A.x + u * co + v * s_, A.z - u * s_ + v * co];
    const b = M.arcade.bays.find(b => b.whole && b.top - b.ground > 2.5) || M.arcade.bays[1], mid = SEA_Y + (b.pier[0] + b.pier[1]) / 2, [x, z] = W(0, b.z), bayZ = b.z - (M.arcade.span + M.arcade.pier[1]) / 2, [bx, bz] = W(0, bayZ);
    const sp = seaSolSpan(bx, bz, SEA_Y + M.arcade.deck + 1); return { key: SEA_SOLS.has(id + ':arches'), pier: solidAt(x, z, Math.max(mid, meshH(x, z) + .95)), noY: solidAt(x, z), over: solidAt(x, z, SEA_Y + M.arcade.deck + .6), floor: sp && +(sp.lo - SEA_Y).toFixed(2), deck: M.arcade.deck }; }, da.near.id);
  check(`its stone is solid to a swimmer: a pier stops you, its deck (${as.deck}) is a floor at ${as.floor} coming down, a query with no feet passes`, as.key && as.pier && !as.noY && !as.over && as.floor > as.deck && as.floor < as.deck + .5, as); }
// Session 2203 — the sunken village (OG-125, card F11; PKIT.places.village, undersea.js's sunkenVillage): a few chunks of the Gatelands'
// sea hold a drowned lane of seven roofless cottages running down the bed, the same spots when asked again, none off the Gatelands or in a
// wreck's or a whale's chunk; the nearest is built with its chunk, its cottages settled on the drawn bed with their broken tops under the sea
const sv = await page.evaluate(() => { const N = Math.ceil(WORLD.SIZE * GRID / CHUNK), L = []; for (let cx = 0; cx < N; cx++) for (let cz = 0; cz < N; cz++) { if (hash01(cx, cz, 180) > VILLAGE_ODDS) continue; const d = sunkenVillageSpot(cx, cz); if (d) L.push({ cx, cz, ...d }); }
  const again = L.every(d => { const e = sunkenVillageSpot(d.cx, d.cz); return e && e.x === d.x && e.z === d.z && e.ry === d.ry; }), others = L.filter(d => wreckSpot(d.cx, d.cz) || whaleFallSpot(d.cx, d.cz)).length,
    off = L.filter(d => nationKeyOf(...cellOf(d.cx * CHUNK + CHUNK / 2, d.cz * CHUNK + CHUNK / 2)) !== 'gatelands').length;
  L.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); return { n: L.length, again, others, off, near: L[0] }; });
check(`${sv.n} sunken villages lie on the Gatelands' bed (15 to 120), the same when asked again, none off the Gatelands, none in a wreck's or a whale's chunk`, sv.n >= 15 && sv.n <= 120 && sv.again && sv.others === 0 && sv.off === 0, sv);
if (sv.near) { const D = sv.near, key = `${D.cx},${D.cz}`;
  await page.evaluate(D => WORLD.enter(D.x, D.z, 0, 'test'), D);
  for (let k = 0; k < 40; k++) { await g.spin('clear', 20); if (await page.evaluate(k => !!(chunks.get(k) && chunks.get(k).village), key)) break; }
  const v = await page.evaluate(k => { const ch = chunks.get(k); if (!ch || !ch.village) return { none: true }; const V = ch.village, M = V.M, co = Math.cos(V.ry), s_ = Math.sin(V.ry), W = (u, v) => [V.hx + u * co + v * s_, V.hz - u * s_ + v * co];
    const houses = M.houses.map(h => ({ bed: +(meshH(...W(h.x, h.z)) - SEA_Y).toFixed(2), top: h.top, roof: h.roof, broken: h.walls, caps: h.caps }));
    const out = { tris: V.tris, draws: V.draws, colours: V.group.children.every(m => !!m.geometry.attributes.color), head: V.head, end: V.end, houses, inScene: !!(V.group.parent === ch.group && ch.group.parent), wall: M.wall };
    const grp = V.group; dropChunk(k); out.gone = !grp.parent || !grp.parent.parent; buildChunk(...k.split(',').map(Number)); const c2 = chunks.get(k); out.same = !!(c2 && c2.village && c2.village.group === grp && grp.parent === c2.group); return out; }, key);
  console.log(JSON.stringify(v));
  check(`the nearest is built with its chunk, its lane from ${v.head} to ${v.end} m down: ${v.tris} triangles in ${v.draws} draws (under 40k, under 13 draws, vertex-coloured)`, !v.none && v.inScene && v.tris < 40000 && v.draws <= 12 && v.colours, v);
  check('seven cottages, each roofless and its walls broken in courses with tops between them, standing 0.8 to 4 m over the bed at its middle (the plinth shows downhill) and at least 1.5 m under the sea', !v.none && v.houses.length === 7 && v.houses.every(h => h.roof >= 3 && h.broken > 50 && h.caps > 50 && h.top - h.bed > .8 && h.top - h.bed < 4 && h.top < -1.5), v.houses);
  check('its chunk dropped takes it out of the scene, and loaded again takes the same village back', v.gone && v.same, v);
  // Session 2220 — the drowned places are stone to a swimmer: driven through the game's own loop, from a cottage's floor you swim at its
  // back wall and stop inside it; risen over its broken top, the same stroke carries you over and out. A query with no feet passes.
  const sw = await page.evaluate(k => { const V = chunks.get(k).village, M = V.M, co = Math.cos(V.ry), s_ = Math.sin(V.ry), W = (u, v) => [V.hx + u * co + v * s_, V.hz - u * s_ + v * co], Lx = (x, z) => (x - V.hx) * co - (z - V.hz) * s_;
    const raf = window.requestAnimationFrame, rr = REN.render; window.requestAnimationFrame = () => 0; REN.render = () => {}; let t = performance.now(); prevT = t;
    const run = n => { for (let i = 0; i < n; i++) { t += 1000 / 60; loop(t); } }, keys = o => { for (const kk in K) K[kk] = false; Object.assign(K, o || {}); HELD_KEYS.KeyW = !!(o && o.KeyW); }; /* the stroke reads K, the dive HELD_KEYS (let go of W and you rise) */
    const P = SEA_SOLS.get('village:' + k), t0 = performance.now(); P.grid = null; seaSolBuild(P); const r = { ms: +(performance.now() - t0).toFixed(1), cells: P.grid.size };
    try { for (const h of M.houses) { const sx = h.x > 0 ? 1 : -1, back = Math.abs(h.x) + h.d / 2, [cx, cz] = W(h.x, h.z), sp = seaSolSpan(cx, cz, meshH(cx, cz) + .95); if (!sp) continue; const y0 = sp.lo + .05;
        const path = []; for (let u = Math.abs(h.x); u < back + .6; u += .1) path.push(solidAt(...W(sx * u, h.z), y0)); if (!path.some(b => b) || y0 > SEA_Y + h.top - .5) continue;
        const dx = sx * co, dz = -sx * s_; yaw = Math.atan2(-dx, -dz); pitch = 0;
        const go = y => { px = cx; pz = cz; jumpY = y; DIVE.depth = y; onGround = true; velY = 0; PHP = maxHP; DIVE.breath = 1; run(2); keys({ KeyW: true }); run(240); keys(); run(2); return +(Math.abs(Lx(px, pz))).toFixed(2); };
        r.house = { x: h.x, d: h.d, back: +back.toFixed(2), top: h.top, y0: +(y0 - SEA_Y).toFixed(2) }; r.stopped = go(y0); r.swimming = WORLD.isSwimming(); r.held = +(jumpY - SEA_Y).toFixed(2); r.over = go(SEA_Y + h.top + .6);
        r.noY = path.length && !solidAt(...W(sx * (back - .3), h.z)); break; } }
    finally { window.requestAnimationFrame = raf; REN.render = rr; }
    return r; }, key);
  console.log(JSON.stringify(sw));
  check(`a cottage's back wall stops a swimmer inside it (${sw.stopped} m out, the wall's face at ${sw.house && sw.house.back}), and over its broken top the same stroke carries on to ${sw.over} m; the solids built in ${sw.ms} ms`, sw.house && sw.stopped < sw.house.back - .3 && sw.stopped > Math.abs(sw.house.x) && sw.over > sw.house.back + 1 && sw.noY && sw.ms < 400, sw); }
// Session 2208 — the drowned quarter (OG-125, card F11; PKIT.places.quarter, undersea.js's sunkenQuarter): a few chunks of Aurenne's sea, off
// a coast, hold a town's bridge (its middle span fallen) and its theatre; the nearest is built with its chunk on the drawn bed, every top
// at least 1.8 m under the sea
const sq = await page.evaluate(() => { const N = Math.ceil(WORLD.SIZE * GRID / CHUNK), L = []; for (let cx = 0; cx < N; cx++) for (let cz = 0; cz < N; cz++) { if (hash01(cx, cz, 190) > QUARTER_ODDS) continue; const d = sunkenQuarterSpot(cx, cz); if (d) L.push({ cx, cz, ...d }); }
  const again = L.every(d => { const e = sunkenQuarterSpot(d.cx, d.cz); return e && e.x === d.x && e.z === d.z && e.ry === d.ry; }), others = L.filter(d => wreckSpot(d.cx, d.cz) || whaleFallSpot(d.cx, d.cz)).length,
    off = L.filter(d => nationKeyOf(...cellOf(d.cx * CHUNK + CHUNK / 2, d.cz * CHUNK + CHUNK / 2)) !== 'aurenne').length;
  L.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)); return { n: L.length, again, others, off, near: L[0] }; });
check(`${sq.n} drowned quarters lie on Aurenne's bed (10 to 90), the same when asked again, none off Aurenne, none in a wreck's or a whale's chunk`, sq.n >= 10 && sq.n <= 90 && sq.again && sq.others === 0 && sq.off === 0, sq);
if (sq.near) { const D = sq.near, key = `${D.cx},${D.cz}`;
  await page.evaluate(D => WORLD.enter(D.x, D.z, 0, 'test'), D);
  for (let k = 0; k < 40; k++) { await g.spin('clear', 20); if (await page.evaluate(k => !!(chunks.get(k) && chunks.get(k).quarter), key)) break; }
  const v = await page.evaluate(k => { const ch = chunks.get(k); if (!ch || !ch.quarter) return { none: true }; const Q = ch.quarter, M = Q.M, Bq = M.bridge, T = M.theatre; let top = -Infinity;
    Q.group.children.forEach(m => { const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i++) top = Math.max(top, P.getY(i)); });
    const out = { tris: Q.tris, draws: Q.draws, colours: Q.group.children.every(m => !!m.geometry.attributes.color), top: +top.toFixed(2), deck: Bq.deck, spring: Bq.spring, ground: Bq.ground, fallen: Bq.fallen.length, base: T.base, foot: T.foot, wedges: T.wedges.length, columns: T.columns, wall: T.wall, inScene: !!(Q.group.parent === ch.group && ch.group.parent) };
    const grp = Q.group; dropChunk(k); out.gone = !grp.parent || !grp.parent.parent; buildChunk(...k.split(',').map(Number)); const c2 = chunks.get(k); out.same = !!(c2 && c2.quarter && c2.quarter.group === grp && grp.parent === c2.group); return out; }, key);
  console.log(JSON.stringify(v));
  check(`the nearest is built with its chunk: ${v.tris} triangles in ${v.draws} draws (under 12k, 2 draws, vertex-coloured), its highest point ${v.top} m (at least 1.8 m under the sea)`, !v.none && v.inScene && v.tris < 12000 && v.draws === 2 && v.colours && v.top <= -1.79, v);
  check('its bridge springs over the bed and its deck stands over the arches, its middle span on the bed; its theatre has seven wedges standing, six columns, its stage wall on the bed', !v.none && v.spring > v.ground[1] && v.deck - v.spring > 4 && v.fallen === 18 && v.wedges === 7 && v.columns.length === 6 && v.wall.foot < v.base, v);
  check('its chunk dropped takes it out of the scene, and loaded again takes the same quarter back', v.gone && v.same, v);
  // Session 2220 — the bridge's standing arch is a roof to a swimmer under it, its pier stops you, the opening under it is open
  const qs = await page.evaluate(k => { const Q = chunks.get(k).quarter, co = Math.cos(Q.ry), s_ = Math.sin(Q.ry), W = (u, v) => [Q.ox + u * co + v * s_, Q.oz - u * s_ + v * co], B = Q.M.bridge;
    const [ax, az] = W(-31.2, -14), [qx, qz] = W(-26.6, -14), y = Math.max(meshH(ax, az) + .95, SEA_Y + B.spring + .3), sp = seaSolSpan(ax, az, y);
    return { open: !solidAt(ax, az, y), pier: solidAt(qx, qz, Math.max(meshH(qx, qz) + .95, SEA_Y + B.spring)), roof: sp && sp.hi < 1e8 ? +(sp.hi - SEA_Y).toFixed(2) : null, deck: B.deck, spring: B.spring, y: +(y - SEA_Y).toFixed(2) }; }, key);
  check(`the bridge's standing arch is open under it at ${qs.y}, a roof at ${qs.roof} (the deck ${qs.deck}), its pier solid`, qs.open && qs.pier && qs.roof != null && qs.roof < qs.deck && qs.roof > qs.y, qs); }
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
