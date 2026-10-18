// node docs/prototypes/levelup/undersea.check.mjs (Session 1100): the drowned arches under a coastal town (undersea.js, OG-125). It builds the
// same twice and in budget; the floor runs from 4.5 m deep at the quay to 16 m at 60 m out; the arcade's deck lies deep enough for the
// game's galleon (draft 1.5 m) to pass over it, its first four bays whole and its deep end broken (a fallen arch's stones on the sand
// under it, two stumps); every pier stands on the floor; the kelp is rooted on the floor and stays under the surface; the boat lies on the
// sand; the alcove's opening is wide and high enough for a swimmer and nothing stands in it but its chest; and the page renders its views.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined && !ok ? '  ' + JSON.stringify(info).slice(0, 1800) : '')); if (!ok) fails++; };
const page = await browser.newPage({ viewport: { width: 320, height: 200 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://localhost:${port}/undersea.html?still&w=320&h=200&view=alcove`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
const R = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./undersea.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 7) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const a = K.drownedArches(), b = K.drownedArches(); a.group.updateMatrixWorld(true); const meshes = []; a.group.traverse(m => { if (m.isMesh && m.name !== 'sand' && m.name !== 'kelp') meshes.push(m); });
  // the alcove: rays into it from the water at its middle and 0.4 m off it, at its sill + 0.3 and its head - 0.3; what each meets first
  const A = a.alcove, rc = new THREE.Raycaster(), rays = []; for (const dx of [-.4, 0, .4]) for (const y of [A.y0 + .45, A.y0 + A.h - .3]) { rc.set(new THREE.Vector3(A.x + dx, y, -2), new THREE.Vector3(0, 0, 1)); rc.far = 6; const h = rc.intersectObjects(meshes, false)[0]; rays.push({ dx, y: +y.toFixed(2), z: h ? +h.point.z.toFixed(2) : null, what: h ? h.object.name : null }); }
  // a galleon passing over: a ray along the arcade at the keel's depth (1.5 m) and 0.1 m under it meets nothing of the arcade
  const keel = []; for (const y of [-1.5, -1.6]) { rc.set(new THREE.Vector3(0, y, 3), new THREE.Vector3(0, 0, -1)); rc.far = 60; const h = rc.intersectObjects(meshes.filter(m => m.name !== 'quay' && m.name !== 'quayweed' && m.name !== 'dress'), false)[0]; keel.push({ y, hit: h ? [h.object.name, +h.point.z.toFixed(2), +h.point.y.toFixed(2)] : null }); }
  const sandMax = (() => { const m = a.group.children.find(c => c.name === 'sand'); m.geometry.computeBoundingBox(); return [+m.geometry.boundingBox.min.y.toFixed(2), +m.geometry.boundingBox.max.y.toFixed(2)]; })();
  return { tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), floor0: +a.floor(0, -.5).toFixed(2), floor60: +a.floor(0, -60).toFixed(2), sand: sandMax, arcade: a.arcade, kelp: a.kelp, boat: a.boat, boatFloor: +a.floor(a.boat.x, a.boat.z).toFixed(2),
    fallen: a.fallen.map(([x, y, z]) => [x, y, z, +a.floor(x, z).toFixed(2)]), rays, keel, alcove: A, rocks: a.rocks }; });
const A = R.arcade, bays = A.bays;
check(`the drowned arches build the same twice and in budget: ${R.tris.toLocaleString()} triangles in ${R.draws} draws (the two houses on the quay among them)`, R.same && R.tris < 60000 && R.draws <= 40, [R.tris, R.draws, R.same]);
check(`the floor runs from ${-R.floor0} m deep at the quay to ${-R.floor60} m at 60 m out`, R.floor0 <= -4 && R.floor0 >= -6 && R.floor60 <= -14 && R.floor60 >= -18, [R.floor0, R.floor60]);
check(`a galleon passes over the arcade: its deck at ${A.deck} m, and rays along it at the keel's 1.5 m and 1.6 m meet ${R.keel.map(k => k.hit ? k.hit.join(' ') : 'nothing').join('; ')}`, A.deck <= -1.6 && R.keel.every(k => !k.hit), R.keel);
check(`the arcade: ${bays.length} piers, the first four bays whole, the deep end broken (stumps to ${bays.slice(6).map(b => b.pier[1]).join(' and ')} m); every pier stands from below the sand (${bays.map(b => b.pier[0]).join(', ')})`, bays.length === 8 && bays.filter(b => b.whole).length === 4 && bays[6].pier[1] < bays[5].pier[1] - 1 && bays[7].pier[1] < bays[6].pier[1], bays);
check(`the fallen arch's ${R.fallen.length} stones lie on the sand under it (each within 0.6 m of the floor below it)`, R.fallen.length >= 8 && R.fallen.every(([x, y, z, f]) => y >= f && y - f < .6), R.fallen);
const K = R.kelp; check(`${K.length} kelp stalks, every one rooted on the floor shallower than 9 m and its tip 0.6 to 3 m under the surface, none in the arcade's line`, K.length > 60 && K.every(k => k.y0 >= -9 && k.y1 <= -.6 && k.y1 >= -3 && Math.abs(k.x) > 2), K.filter(k => !(k.y0 >= -9 && k.y1 <= -.6 && k.y1 >= -3 && Math.abs(k.x) > 2)).slice(0, 5));
check(`the rowing boat lies on the sand at ${-R.boat.y} m, 0.12 m into it (the floor at ${R.boatFloor})`, Math.abs(R.boat.low - (R.boatFloor - .12)) < .05, [R.boat, R.boatFloor]);
const rays = R.rays; check(`the alcove (${R.alcove.w} by ${R.alcove.h} m, its sill ${-R.alcove.y0} m under) is open to a swimmer: six rays meet ${[...new Set(rays.map(r => r.what))].join(', ')} at z ${Math.min(...rays.map(r => r.z))} to ${Math.max(...rays.map(r => r.z))}`, rays.every(r => r.what && r.z > .8) && R.alcove.w >= 1.0 && R.alcove.h >= 1.5, rays);
check('no page errors', errs.length === 0, errs.slice(0, 3)); await page.close();
// Session 1101: the wrecks at three depths (wreckSite): the same twice and in budget; the storm wreck at 8 to 12 m, the fight at 14 to 20 m,
// the deep wreck at 23 to 30 m; each hull settled by its planking into the sand (its lowest point 0.2 to 1.5 m under the sand below it,
// none floating); sails and running rigging gone from all four; the fight's two hulls meet; the cargo and the chests lie on the sand.
{ const pg = await browser.newPage({ viewport: { width: 320, height: 200 } }), e3 = []; pg.on('pageerror', e => e3.push(String(e)));
  await pg.goto(`http://localhost:${port}/undersea.html?still&w=320&h=200&place=wrecks&view=wide`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const W = await pg.evaluate(async () => { const K = await import('./undersea.js'); const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 9) h = (h * 31 + Math.round(a[i] * 1e3)) | 0; }); return h; };
    const a = K.wreckSite(), b = K.wreckSite(); return { tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), wrecks: a.wrecks, gone: a.gone, pair: a.pair, cargo: a.cargo.map(c => +(c.y - c.floor).toFixed(2)), chests: a.chests.map(c => +(c.y - c.floor).toFixed(2)), spars: a.spars }; });
  const by = W.wrecks.map(w => `${w.name} at ${w.depth} m`);
  check(`the wrecks build the same twice and in budget: ${W.tris.toLocaleString()} triangles in ${W.draws} draws, four hulls`, W.same && W.wrecks.length === 4 && W.tris < 260000 && W.draws <= 90, [W.tris, W.draws, W.same]);
  const [st, c1, c2, dp] = W.wrecks; check(`three depths: ${by.join(', ')}`, st.depth >= 8 && st.depth <= 12 && c1.depth >= 14 && c1.depth <= 20 && c2.depth >= 14 && c2.depth <= 20 && dp.depth >= 23 && dp.depth <= 30, W.wrecks.map(w => [w.name, w.depth]));
  check(`each hull settled by its planking into the sand: ${W.wrecks.map(w => `${w.name.split(' (')[1].replace(')', '')} ${-w.rest} m in, keel along a slope of ${w.slope}°`).join('; ')}`, W.wrecks.every(w => w.rest <= -.2 && w.rest >= -1.5), W.wrecks.map(w => [w.name, w.rest, w.sink]));
  check(`sails and running rigging gone: ${W.gone.length} meshes left off (${[...new Set(W.gone.map(g => g.split(':')[1]))].join(', ')}) from all four`, W.wrecks.every(w => W.gone.some(g => g.startsWith(w.name))), W.gone);
  check(`the fight: the cutter's bow is in the cog's side (their hulls meet, and her stem is in the cog's hole: ${W.wrecks.find(w => /cog/.test(w.name)).dmg.hull} triangles of the cog gone about it)`, W.pair && W.wrecks.find(w => /cog/.test(w.name)).dmg.hull > 100);
  check(`the cargo (${W.cargo.length}) and the chests (${W.chests.length}) lie on the sand, each within 0.25 m of it`, W.cargo.length >= 30 && W.cargo.every(d => Math.abs(d) < .25) && W.chests.length === 4 && W.chests.every(d => Math.abs(d) < .25), [W.cargo, W.chests]);
  // Session 1102: the damage: every hull's masts broken (triangles of its yards and tops gone, its tops lower than built), the cog stove in and
  // the galleon's starboard quarter fallen (hull triangles gone), five fallen spars on the sand
  check(`the masts broken: ${W.wrecks.map(w => `${w.name.split(' (')[1].replace(')', '')} ${w.dmg.spar.toLocaleString()} triangles of yards and tops gone, ${w.dmg.top0} → ${(w.top - w.box[1]).toFixed(1)} m keel to top`).join('; ')}`,
    W.wrecks.every(w => w.dmg.spar > 0 && w.top - w.box[1] < w.dmg.top0 + 2), W.wrecks.map(w => [w.name, w.dmg, w.top, w.box[1]]));
  const cog = W.wrecks.find(w => /cog/.test(w.name)), gal = W.wrecks.find(w => /galleon/.test(w.name));
  check(`the cog stove in where the cutter's stem is (${cog.dmg.hull.toLocaleString()} triangles of strake, rail and deck gone about ${cog.hole && cog.hole.at.join(', ')}), the galleon's starboard quarter fallen in (${gal.dmg.hull.toLocaleString()})`, cog.dmg.hull > 100 && gal.dmg.hull > 100 && W.pair, [cog.dmg, gal.dmg]);
  check(`${W.spars.length} fallen spars lie along the sand (${W.spars.map(s2 => s2.L + ' m').join(', ')})`, W.spars.length === 5 && W.spars.every(s2 => s2.ends.every(e => e[2] < -6)), W.spars);
  check('the wrecks page: no page errors', e3.length === 0, e3.slice(0, 2)); await pg.close(); }
for (const v of ['swim', 'arches', 'alcove', 'boat', 'above', 'swim&water=clear', 'swim&water=mark', 'pair&place=wrecks', 'storm&place=wrecks', 'deep&place=wrecks', 'wide&place=wrecks']) { const pg = await browser.newPage({ viewport: { width: 320, height: 200 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/undersea.html?still&w=320&h=200&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const st = await pg.evaluate(() => window.__stats); check(`undersea.html?view=${v} renders: ${st.tris.toLocaleString()} triangles, ${st.kelp} kelp, ${st.wrecks} wrecks, no page errors`, st.tris > 0 && e2.length === 0, e2.slice(0, 2)); await pg.close(); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
