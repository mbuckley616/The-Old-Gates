// Session 2415: the spires' passage through each tower at the decks and the spit up to the first.
// Session 2401 adds the Hollow Below (ruins.js hollowBelow): a gate's three rings in a cavern's back wall, the light through the oculus, the viaduct.
// Session 2398 adds the Scarred Gate (ruins.js scarredGate): a ring 80 m across on its edge, the outer course blown off, the cleft, the crater and scar.
// Session 2395 adds the Northlight Altar (ruins.js northlightAltar): eleven monoliths, the north open, the altar, the tarn.
// Session 2389 adds the Drowned Spires (ruins.js drownedSpires): six towers and five spans, the three deck levels against the tide.
// node docs/prototypes/levelup/ruins.check.mjs (Session 1119): the Weavers' ring of broken arches on a coast (ruins.js, OG-104). It builds the
// same twice and in budget; eleven arches of the gate kit at 3 times their size (#429 B) stand on a circle 170 m across, four standing 60 m to their points
// and seven broken, and not one stone floats or burns (gatekit's `ruin`); no stone lies under the turf; the bay to the sea is gone, its spill
// running to the cliff's edge and never over it; the cliff stands over the sea; a 1.75 m post at a standing arch's foot is the scale;
// and the page renders its views.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined && !ok ? '  ' + JSON.stringify(info).slice(0, 1800) : '')); if (!ok) fails++; };
const page = await browser.newPage({ viewport: { width: 320, height: 200 } }), errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://localhost:${port}/places.html?still&w=320&h=200&place=ring&view=far`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
const R = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./ruins.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 9) h = (h * 31 + Math.round(a[i] * 1e3)) | 0; }); return h; };
  const a = K.weaverRing(), b = K.weaverRing(); a.group.updateMatrixWorld(true);
  // how deep any stone of the arches (and the spill) lies under the turf: the least of y - ground over their vertices
  // the arches' own courses (arch:*) are planted 0.3 m under the turf at the bay's middle; a cracked arch leans up to 3° about its foot, which
  // drops its footing's low edge by half its depth (1.2 m at the kit's size) times the lean's sine, and the turf rolls 0.15 m either way under it.
  // The seaward bay's footings and the spill ('stone') are laid on the turf, and keep the 0.6 m bound.
  let under = Infinity, spilt = Infinity; for (const m of a.group.children) { if (!m.name.startsWith('arch:') && m.name !== 'stone') continue; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 2) { const d = P.getY(i) - a.ground(P.getX(i), P.getZ(i)); if (m.name === 'stone') spilt = Math.min(spilt, d); else under = Math.min(under, d); } }
  const lean = Math.max(...a.bays.map(q => Math.abs(q.lean))), foot = .3 + 1.2 * a.k * Math.sin(lean * Math.PI / 180) + .3;
  const edge = [-60, 0, 60].map(x => +(a.ground(x, a.cliff.z) - a.cliff.sea).toFixed(2)), radii = a.bays.map(q => +Math.hypot(q.x, q.z).toFixed(2)), tops = a.bays.map(q => ({ cond: q.cond, h: +(q.top - a.ground(q.x, q.z)).toFixed(1) }));
  return { tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), bays: a.bays, tops, radii, R: a.R, under: +under.toFixed(2), spilt: +spilt.toFixed(2), foot: +foot.toFixed(2), lean, spill: a.spill, gone: a.gone, cliff: a.cliff, edge, figure: a.figure, span: a.span, rise: a.rise, dais: a.dais, k: a.k,
    names: a.group.children.map(m => m.name) }; });
const st = R.tops.filter(t => t.cond === 'cracked'), br = R.tops.filter(t => t.cond === 'broken');
check(`the ring builds the same twice and in budget: ${R.tris.toLocaleString()} triangles in ${R.draws} draws`, R.same && R.tris < 120000 && R.draws <= 20, [R.tris, R.draws, R.same]);
check(`eleven arches on the circle (${Math.min(...R.radii)} to ${Math.max(...R.radii)} m from the heart): ${st.length} standing to ${st.map(t => t.h).join(', ')} m, ${br.length} broken to ${br.map(t => t.h).join(', ')} m`, R.bays.length === 11 && R.radii.every(d => Math.abs(d - R.R) < .01) && st.length === 4 && br.length === 7 && Math.abs(R.R - 85) < .01 && R.k === 3 && st.every(t => t.h > 19 * R.k && t.h < 21 * R.k) && br.every(t => t.h < 14.5 * R.k), R.tops);
check(`a ruin, not a gate: no stone floats (${R.bays.map(q => q.floating).join(', ')}), no seam burns (${R.bays.reduce((s, q) => s + q.seams, 0)}), the broken arches' stones lie fallen (${br.length ? R.bays.filter(q => q.cond === 'broken').map(q => q.fallen).join(', ') : ''})`, R.bays.every(q => q.floating === 0 && q.seams === 0) && R.bays.filter(q => q.cond === 'broken').every(q => q.fallen >= 4) && !R.names.includes('arch:script') && !R.names.includes('arch:seam') && !R.names.includes('arch:ring'), R.names);
check(`no stone lies deeper under the turf than its footing: the arches' courses to ${R.under} m (their footings, sunk 0.3 m and leaning up to ${R.lean}°, to ${-R.foot} m), the fallen and spilt to ${R.spilt} m (0.6)`, R.under > -R.foot && R.spilt > -.6, [R.under, R.foot, R.spilt]);
check(`the bay to the sea is gone: its footings and ${R.spill.length} stones spilled toward the sea, the nearest ${Math.min(...R.spill.map(p => p[1] - R.cliff.z)).toFixed(1)} m from the cliff's edge, none over it`, R.gone === 20 && R.spill.every(p => p[1] > R.cliff.z + 1) && Math.min(...R.spill.map(p => p[1] - R.cliff.z)) < 12, R.spill);
check(`the cliff: the turf at its edge stands ${R.edge.join(', ')} m over the sea`, R.edge.every(h => h > 25), R.edge);
check(`the scale: an opening ${R.span} m wide and ${R.rise} m to its point, ${(R.rise / R.figure.h).toFixed(1)} times the 1.75 m post at the foot of bay ${R.figure.bay}; the dais ${2 * R.dais.r} m across`, R.span === 30 && R.rise === 54 && R.figure.h === 1.75 && R.rise / R.figure.h > 30 && st.length && R.bays.find(q => q.i === R.figure.bay).cond === 'cracked', R.figure);
check('the page: no page errors', errs.length === 0, errs.slice(0, 2));
// the Drowned Spires (Session 2389; OG-104): six towers and five spans off a strand; the three levels the DECISION asks against the tides
const S = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./ruins.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 9) h = (h * 31 + Math.round(a[i] * 1e3)) | 0; }); return h; };
  const a = K.drownedSpires(), b = K.drownedSpires(), lv = {}; for (const l of ['a', 'b', 'c']) lv[l] = K.drownedSpires({ deck: l }).deck;
  // what of the stone stands above the water with nothing under it: the lowest point of each kit mesh's loose stone is under the mean sea
  const gaps = []; for (let i = 0; i < a.towers.length - 1; i++) { const p = a.towers[i], q = a.towers[i + 1]; gaps.push(+(Math.hypot(q.x - p.x, q.z - p.z) - 10).toFixed(2)); }
  let low = Infinity; for (const m of a.group.children) if (m.name.startsWith('kit:')) { const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i++) low = Math.min(low, P.getY(i)); }
  // Session 2415: the way through. Rays along the chain's centre line at 1.7 and 6 m over the decks, from the spit's back over each tower
  // to the next and 30 m out past the last, hit nothing of the kit's; one straight down in each tower's passage meets its floor at the deck;
  // the spit meets the first tower's sill and climbs no steeper than 1 in 6 from the bank to it.
  a.group.updateMatrixWorld(true); const kit = a.group.children.filter(m => m.name.startsWith('kit:')), rc = new THREE.Raycaster(), T = a.towers, Dk = a.deck;
  const way = [[T[0].x, T[0].z + 30], ...T.map(t => [t.x, t.z]), [T[5].x + Math.sin(T[5].hd) * 30, T[5].z - Math.cos(T[5].hd) * 30]], hits = [];
  for (const dy of [1.7, 6]) for (let i = 0; i < way.length - 1; i++) { const [x0, z0] = way[i], [x1, z1] = way[i + 1], d = new THREE.Vector3(x1 - x0, 0, z1 - z0), L = d.length(); rc.set(new THREE.Vector3(x0, Dk + dy, z0), d.normalize()); rc.far = L;
    const h = rc.intersectObjects(kit, false)[0]; if (h) hits.push({ dy, leg: i, at: +h.distance.toFixed(1), m: h.object.name }); }
  const floors = T.map(t => { rc.set(new THREE.Vector3(t.x, Dk + 3, t.z), new THREE.Vector3(0, -1, 0)); rc.far = 20; const h = rc.intersectObjects(kit, false)[0]; return h ? +(h.point.y - Dk).toFixed(2) : null; });
  const sill = +(a.ground(T[0].x, a.spit.z0 + .6) - Dk).toFixed(2); let steep = 0; for (let z = a.spit.z0 + .6; z < 120; z += 2) steep = Math.max(steep, Math.abs(a.ground(T[0].x, z + 2) - a.ground(T[0].x, z)) / 2);
  return { tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), towers: a.towers, spans: a.spans, lv, gaps, gap: a.gap, low: +low.toFixed(1), figure: a.figure, hits, floors, sill, steep: +steep.toFixed(3), passage: a.passage }; });
{ const st = S.towers.filter(t => t.cond === 'cracked'), br = S.towers.filter(t => t.cond === 'broken');
  check(`the spires build the same twice and in budget: ${S.tris.toLocaleString()} triangles in ${S.draws} draws`, S.same && S.tris < 120000 && S.draws <= 20, [S.tris, S.draws, S.same]);
  check(`six towers: ${st.length} standing to ${st.map(t => t.wet).join(', ')} m over the sea, ${br.length} broken to ${br.map(t => t.wet).join(', ')} m; every foot under the bed`, S.towers.length === 6 && st.length === 4 && br.length === 2 && st.every(t => t.wet > 70) && br.every(t => t.wet > 20 && t.wet < 60) && S.towers.every(t => t.foot < t.bed), S.towers);
  check(`five spans of ${S.gap} m, each between two towers' faces (${S.gaps.join(', ')} m), one broken`, S.spans.length === 5 && S.gaps.every(g => Math.abs(g - S.gap) < .5) && S.spans.filter(s => s.cond === 'broken').length === 1, S.gaps);
  check(`the levels against a 4 m tide: a's deck at ${S.lv.a} (clear at low water, under at high), b's at ${S.lv.b} (clear at high), c's at ${S.lv.c} (under at low)`, S.lv.a > -2 && S.lv.a < 2 && S.lv.b > 2 && S.lv.c < -2, S.lv);
  check(`what fell went into the sea: the lowest stone at ${S.low} m, under the low water`, S.low < -2, S.low);
  check(`a way through every tower at the decks (${S.passage.w} by ${S.passage.h} m): rays along the chain at 1.7 and 6 m over the decks hit nothing, ${S.hits.length} hits`, S.hits.length === 0, S.hits);
  check(`each tower's passage floor is the deck: ${S.floors.join(', ')} m off it`, S.floors.every(f => f !== null && Math.abs(f) < .05), S.floors);
  check(`the spit meets the first tower's sill (${S.sill} m off the deck) and is never steeper than 1 in 6 up the strand (${S.steep})`, Math.abs(S.sill) < .15 && S.steep < 1 / 6, [S.sill, S.steep]); }
// the Northlight Altar (Session 2395; OG-104, the Mark): eleven monoliths on a circle 120 m across, the north open, an altar at the heart
const L = await page.evaluate(async () => { const K = await import('./ruins.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 9) h = (h * 31 + Math.round(a[i] * 1e3)) | 0; }); return h; };
  const a = K.northlightAltar(), b = K.northlightAltar();
  return { tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), R: a.R, stones: a.stones, gap: a.gap, altar: a.altar, heart: +a.ground(0, 0).toFixed(2), tarn: a.tarn, figure: a.figure, sink: a.sink,
    ice: +(a.tarn.y - a.ground(a.tarn.x, a.tarn.z)).toFixed(2), names: a.group.children.map(m => m.name) }; });
{ const by = c => L.stones.filter(s => s.cond === c), st = by('stand'), fa = by('fallen'), sn = by('snapped'), fl = st.filter(s => s.flank), radii = L.stones.map(s => +Math.hypot(s.x, s.z).toFixed(2));
  const north = Math.min(...L.stones.map(s => Math.abs(Math.atan2(Math.sin(s.a - Math.PI), Math.cos(s.a - Math.PI))))) * 180 / Math.PI;
  check(`the Northlight Altar builds the same twice and in budget: ${L.tris.toLocaleString()} triangles in ${L.draws} draws`, L.same && L.tris < 120000 && L.draws <= 12, [L.tris, L.draws, L.same]);
  check(`eleven stones on the circle (${Math.min(...radii)} to ${Math.max(...radii)} m from the heart), none within ${north.toFixed(1)}° of north; ${st.length} standing to ${st.map(s => s.h).join(', ')} m, ${fa.length} fallen, ${sn.length} snapped to ${sn.map(s => s.h).join(', ')} m`,
    L.stones.length === 11 && radii.every(d => Math.abs(d - L.R) < .01) && north > 25 && st.length === 8 && fa.length === 2 && sn.length === 1 && fl.length === 2 && fl.every(s => s.h > 41 && s.h < 43) && st.every(s => s.h > 29 && s.h < 43) && sn.every(s => s.h > 5 && s.h < 16), L.stones);
  check(`nothing floats: the standing stones' feet ${L.sink} m under the snow (to ${Math.min(...st.map(s => s.low))} m with the lean), the fallen sunk to ${fa.map(s => s.low).join(', ')} m and lying ${fa.map(s => s.h).join(', ')} m high, the snapped stone's pieces to ${sn.map(s => s.low).join(', ')} m`,
    st.every(s => s.low < -2.5 && s.low > -3.8) && fa.every(s => s.low < -.8 && s.low > -2 && s.h < 2.4) && sn.every(s => s.low < -2.5), L.stones.map(s => [s.cond, s.low, s.h]));
  check(`the leaning stones lean ${Math.min(...st.map(s => Math.abs(s.lean)))} to ${Math.max(...st.map(s => Math.abs(s.lean)))}° (4 at most), the two by the gap upright`, st.every(s => Math.abs(s.lean) <= 4) && fl.every(s => s.lean === 0), st.map(s => s.lean));
  check(`the gap to the north ${L.gap.width} m between its stones' faces; the altar ${L.altar.len} by ${L.altar.w} m on the dais, its top ${(L.altar.top - L.heart).toFixed(2)} m over the snow at the heart`, L.gap.width > 45 && L.altar.top - L.heart > 2.8 && L.altar.top - L.heart < 3.6, [L.gap, L.altar, L.heart]);
  check(`the scale: the stones by the gap ${fl[0].h} m, ${(fl[0].h / L.figure.h).toFixed(1)} times the 1.75 m post at the foot of stone ${L.figure.stone}`, L.figure.h === 1.75 && fl[0].h / L.figure.h > 20 && L.stones.find(s => s.i === L.figure.stone).cond === 'stand', L.figure);
  check(`the tarn lies outside the ring (${Math.hypot(L.tarn.x, L.tarn.z).toFixed(0)} m from the heart, ${2 * L.tarn.r} m across), its ice ${L.ice} m over its bed`, Math.hypot(L.tarn.x, L.tarn.z) - L.tarn.r > L.R + 40 && L.ice > .3, L.tarn); }
// the Scarred Gate (Session 2398; OG-104, Aurenne): a ring of the Weavers' on its edge in a red desert, broken by a blow from under its right foot
const G = await page.evaluate(async () => { const K = await import('./ruins.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 9) h = (h * 31 + Math.round(a[i] * 1e3)) | 0; }); return h; };
  const a = K.scarredGate(), b = K.scarredGate(), w = K.scarredGate({ wake: true }), f = a.ground(0, 0);
  const sx = a.crater.x + Math.cos(a.scar.a) * 100, sz = a.crater.z + Math.sin(a.scar.a) * 100;
  return { tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), R0: a.R0, R1: a.R1, CY: a.CY, D: a.D, f: +f.toFixed(2), inner: a.inner, outer: a.outer, gone: a.gone, slipped: a.slipped, seats: a.seats, thrown: a.thrown, hung: a.hung,
    names: a.group.children.map(m => m.name), wake: { gone: w.gone, seats: w.seats, thrown: w.thrown.length, hung: w.hung, names: w.group.children.map(m => m.name), tris: w.tris, draws: w.draws },
    crater: +a.ground(a.crater.x, a.crater.z).toFixed(2), scar: +a.ground(sx, sz).toFixed(2), beside: +a.ground(sx - Math.sin(a.scar.a) * 40, sz + Math.cos(a.scar.a) * 40).toFixed(2), plinth: a.plinth, buttes: a.buttes, figure: a.figure, cleft: a.cleft }; });
{ const blast = G.seats.filter(t => t > -20 && t < 95).length;
  check(`the Scarred Gate builds the same twice and in budget: ${G.tris.toLocaleString()} triangles in ${G.draws} draws (waking, ${G.wake.tris.toLocaleString()} in ${G.wake.draws})`, G.same && G.tris < 120000 && G.draws <= 8 && G.wake.tris < 120000 && G.wake.draws <= 8, [G.tris, G.draws, G.same, G.wake.tris]);
  check(`the ring: ${2 * G.R1} m across, its opening ${2 * G.R0} m, ${G.D} m deep, standing ${(G.CY + G.R1 - G.f).toFixed(1)} m over the sand with its foot ${(G.f - (G.CY - G.R1)).toFixed(1)} m under it and its sill ${(G.CY - G.R0 - G.plinth.top).toFixed(1)} m over the upper step`,
    G.R1 === 40 && G.R0 === 28 && G.CY + G.R1 - G.f > 68 && G.CY + G.R1 - G.f < 72 && G.CY - G.R1 < G.f - 8 && G.CY - G.R0 > G.plinth.top, [G.CY, G.f, G.plinth.top]);
  check(`the blow: ${G.gone} of the outer course's ${G.outer} stones gone (${blast} over the crown and down the right, the rest from 95 to 150°), none beyond; the inner course's ${G.inner} all stand, ${G.slipped} of them slipped, the cleft at ${G.cleft.a}° opened ${G.cleft.open} m`,
    blast >= 14 && G.gone > blast && G.seats.every(t => t > -20 && t < 150) && G.slipped >= 10 && G.slipped < G.inner && G.names.filter(n => n === 'script').length === 1, G.seats);
  check(`a ruin, not a gate: nothing hangs (${G.hung.length}), no seam burns, and every thrown stone lies sunk in the sand (lowest ${Math.max(...G.thrown.map(t => t.low))} to ${Math.min(...G.thrown.map(t => t.low))} m, tops ${Math.min(...G.thrown.map(t => t.top))} to ${Math.max(...G.thrown.map(t => t.top))} m over it), out to ${Math.max(...G.thrown.map(t => Math.hypot(t.x, t.z))).toFixed(0)} m`,
    G.hung.length === 0 && !G.names.includes('seam') && G.thrown.length === G.gone && G.thrown.every(t => t.low < -.5 && t.top > 1) && Math.max(...G.thrown.map(t => Math.hypot(t.x, t.z))) > 100, G.thrown);
  check(`waking (&wake, the DECISION's B): the same ${G.wake.gone} stones hang over their seats, lifted ${Math.min(...G.wake.hung.map(h => h.lift))} to ${Math.max(...G.wake.hung.map(h => h.lift))} m, a violet seam on each seat; none thrown`,
    G.wake.gone === G.gone && JSON.stringify(G.wake.seats) === JSON.stringify(G.seats) && G.wake.hung.length === G.gone && G.wake.thrown === 0 && G.wake.names.includes('seam') && G.wake.hung.every(h => h.lift >= 3), G.wake);
  check(`the land: the crater's floor ${G.crater} m, the scar 100 m along it ${G.scar} m against ${G.beside} m beside it; the plinth's ${G.plinth.slabs} slabs, ${G.plinth.lost} gone into the crater and ${G.plinth.tipped} tipped at its edge`,
    G.crater < -3 && G.scar < G.beside - 1.2 && G.plinth.lost > 3 && G.plinth.tipped > 3, [G.crater, G.scar, G.beside, G.plinth]);
  check(`seven buttes ${Math.min(...G.buttes.map(b => b.h))} to ${Math.max(...G.buttes.map(b => b.h))} m high, ${Math.min(...G.buttes.map(b => Math.hypot(b.x, b.z))).toFixed(0)} to ${Math.max(...G.buttes.map(b => Math.hypot(b.x, b.z))).toFixed(0)} m out, none before the gate`,
    G.buttes.length === 7 && G.buttes.every(b => Math.hypot(b.x, b.z) >= 200 && !(b.z > 30 && Math.abs(b.x) < b.z * 1.8)), G.buttes);
  check(`the scale: the ring stands ${((G.CY + G.R1 - G.f) / G.figure.h).toFixed(0)} times the 1.75 m post on the upper step at its foot`, G.figure.h === 1.75 && Math.abs(G.figure.y - G.plinth.top) < .01 && (G.CY + G.R1 - G.f) / G.figure.h > 35, G.figure); }
// the Hollow Below (Session 2401; OG-104, the Mark): a gate's three rings cut into the back wall of a cavern, lit through the vault's oculus
const HB = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./ruins.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 9) h = (h * 31 + Math.round(a[i] * 1e3)) | 0; }); return h; };
  const a = K.hollowBelow(), b = K.hollowBelow(); a.group.updateMatrixWorld(true); const ray = new THREE.Raycaster(), sun = new THREE.Vector3(...a.sun), solid = a.group.children.filter(m => !['beam', 'water', 'script', 'sigil'].includes(m.name));
  const hit = (o, d, far = 2000) => { ray.set(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize()); ray.far = far; const h = ray.intersectObjects(solid, false)[0]; return h ? { name: h.object.name, d: +h.distance.toFixed(1) } : null; };
  // daylight: up the light from the court where it lands (and 4 m round it) to the sky, and from 30 m off it, from the rings' faces and the door, into rock
  const lit = [[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4]].map(([u, v]) => hit([a.lands.x + u, .3, a.lands.z + v], a.sun)), dark = [[a.lands.x + 30, .3, a.lands.z], [a.lands.x, .3, a.lands.z + 30], [-30, .3, a.lands.z]].map(p => hit(p, a.sun));
  const rings = [[0, a.CY + 40, a.back + 2.6], [-28, a.CY + 28, a.back + 2.6], [0, a.CY + 30, a.rings[1].zf + 2.6], [0, 8, a.door.z + .3]].map(p => hit(p, a.sun));
  // enclosed: from the way in and from the court, every way but down meets rock; into the rings from the court meets dressed stone or the door
  const shut = []; for (const o of [[-10, 2, 92], [0, 2, -52], [0, -50, 20]]) for (let k = 0; k < 16; k++) { const t = k / 16 * Math.PI * 2; for (const e of [.15, .6, 1.2]) { const d = [Math.cos(t) * Math.cos(e), Math.sin(e), Math.sin(t) * Math.cos(e)], h = hit(o, d); if (!h) shut.push({ o, t: +t.toFixed(2), e }); } }
  const into = [[0, 8], [10, 20], [-14, 30]].map(([x, y]) => hit([x, y, -60], [0, 0, -1]));
  const g = a.ground;
  return { tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), names: a.group.children.map(m => m.name), rings: a.rings, lost: a.lost, oculus: a.oculus, lands: a.lands, court: a.court, viaduct: a.viaduct, water: a.water, bed: a.bed, roof: a.roof, back: a.back, CY: a.CY, door: a.door, figure: a.figure,
    lit, dark, ringsSun: rings, shut, into, gCourt: +g(0, -52).toFixed(2), gIn: +g(0, 92).toFixed(2), gLake: Math.max(...[-20, 0, 20, 40, 60].map(z => +g(0, z).toFixed(2))), emissive: a.group.children.filter(m => m.material.emissive && m.material.emissive.getHex() !== 0).map(m => m.name) }; });
{ const H = HB, R = H.rings, half = Math.sqrt(R[2].ri ** 2 - H.CY ** 2), fd = Math.hypot(H.figure.x - H.lands.x, H.figure.z - H.lands.z);
  check(`the Hollow Below builds the same twice and in budget: ${H.tris.toLocaleString()} triangles in ${H.draws} draws`, H.same && H.tris < 80000 && H.draws <= 12, [H.tris, H.draws, H.same, H.names]);
  check(`the rings: three on a centre ${H.CY} m over the court, ${R.map(q => `${2 * q.ro} m (${q.n} stones, face at z ${q.zf})`).join(', ')}; each set 14 m deeper than the last; the door ${H.door.w} by ${H.door.h} m in the back plate, the floor through the inner ring ${(2 * half).toFixed(1)} m wide`,
    R.length === 3 && R.every((q, i) => q.ro - q.ri === 8 && (!i || q.zf === R[i - 1].zf - 14 && q.ro < R[i - 1].ri)) && half > H.door.w / 2 + 1.2 && H.CY + R[0].ro > 50, R);
  check(`a ruin: the outer ring has lost ${R[0].gone} stones from its upper left, the middle ${R[1].slipped} slipped, the inner whole; nothing lit (${H.emissive.join(', ') || 'no emissive'})`,
    R[0].gone === 5 && R[1].slipped === 3 && R[2].gone === 0 && R[2].slipped === 0 && H.emissive.length === 0 && !H.names.includes('seam'), R);
  check(`every lost stone lies on the back shelf before the wall, bedded in it (lowest ${Math.max(...H.lost.map(t => t.low))} to ${Math.min(...H.lost.map(t => t.low))} m, tops ${Math.min(...H.lost.map(t => t.top))} to ${Math.max(...H.lost.map(t => t.top))} m over it)`,
    H.lost.length === 5 && H.lost.every(t => t.z < -38 && t.z > H.back && t.low < 0 && t.low > -2 && t.top > 1.2 && t.x < 0), H.lost);
  check(`the cavern: the court at ${H.gCourt} m, the way in at ${H.gIn} m, the lake's bed under the viaduct at most ${H.gLake} m, under water at ${H.water}; the vault ${H.roof} m over the deck`,
    Math.abs(H.gCourt + .4) < .05 && H.gIn > -1.5 && H.gIn < 1 && H.gLake < H.water - 2 && H.roof >= 110, [H.gCourt, H.gIn, H.gLake]);
  check(`the viaduct: ${H.viaduct.z1 - H.viaduct.z0} m from the court to the way in, ${H.viaduct.w} m wide, ${H.viaduct.spans} arches of ${H.viaduct.S} m on piers standing ${-H.bed} m from the bed; the parapet broken in ${H.viaduct.gaps.length} places`,
    H.viaduct.z0 <= -38 && H.viaduct.z1 >= 78 && H.viaduct.spans === 5 && H.viaduct.S > 18 && H.viaduct.S < 22 && H.viaduct.gaps.length === 3, H.viaduct);
  check(`the light: up the sun from where it lands on the court (and 4 m round it) every ray reaches the sky; from 30 m off it, from the rings' faces and the door every ray meets stone before the sky (${H.dark.concat(H.ringsSun).map(h => h ? h.name : 'sky').join(', ')})`,
    H.lit.every(h => h === null) && H.dark.concat(H.ringsSun).every(h => h !== null) && H.ringsSun.slice(0, 2).every(h => h.name === 'cave'), { lit: H.lit, dark: H.dark, rings: H.ringsSun, oculus: H.oculus });
  check(`enclosed: from the way in, the court and the lake, ${3 * 48 - H.shut.length} of ${3 * 48} rays round and up meet stone; into the rings from the court they meet ${H.into.map(h => h && h.name).join(', ')}`,
    H.shut.length === 0 && H.into.every(h => h && ['stone', 'dressed', 'door'].includes(h.name)), { shut: H.shut.slice(0, 6), into: H.into });
  check(`the scale: the outer ring stands ${((H.CY + R[0].ro) / H.figure.h).toFixed(0)} times the 1.75 m post, which stands in the light (${fd.toFixed(1)} m from its middle)`, H.figure.h === 1.75 && fd < 8 && (H.CY + R[0].ro) / H.figure.h > 30, H.figure); }
for (const v of ['mouth', 'deck', 'court', 'lake', 'far', 'mouth&dusk']) { const pg = await browser.newPage({ viewport: { width: 320, height: 200 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/places.html?still&w=320&h=200&place=hollow&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const s = await pg.evaluate(() => window.__stats.place); check(`places.html?place=hollow&view=${v} renders: ${s.tris.toLocaleString()} triangles in ${s.draws} draws, ${s.rings} rings, ${s.lost} stones lost, no page errors`, s.tris > 0 && s.rings === 3 && e2.length === 0, e2.slice(0, 2)); await pg.close(); }
for (const v of ['front', 'cleft', 'foot', 'scar', 'far', 'front&wake', 'front&dusk']) { const pg = await browser.newPage({ viewport: { width: 320, height: 200 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/places.html?still&w=320&h=200&place=scarred&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const s = await pg.evaluate(() => window.__stats.place); check(`places.html?place=scarred&view=${v} renders: ${s.tris.toLocaleString()} triangles in ${s.draws} draws, ${s.gone} stones gone (${s.thrown} thrown, ${s.hung} hung), no page errors`, s.tris > 0 && s.gone > 0 && e2.length === 0, e2.slice(0, 2)); await pg.close(); }
for (const v of ['ring', 'heart', 'stone', 'fallen', 'far', 'ring&day', 'ring&lit']) { const pg = await browser.newPage({ viewport: { width: 320, height: 200 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/places.html?still&w=320&h=200&place=northlight&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const s = await pg.evaluate(() => window.__stats.place); check(`places.html?place=northlight&view=${v} renders: ${s.tris.toLocaleString()} triangles in ${s.draws} draws, ${s.stones} stones, no page errors`, s.tris > 0 && s.stones === 11 && e2.length === 0, e2.slice(0, 2)); await pg.close(); }
for (const v of ['shore', 'span', 'deck', 'sea', 'far', 'far&dusk', 'span&level=a&tide=low', 'span&level=c&tide=high']) { const pg = await browser.newPage({ viewport: { width: 320, height: 200 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/places.html?still&w=320&h=200&place=spires&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const s = await pg.evaluate(() => window.__stats.place); check(`places.html?place=spires&view=${v} renders: ${s.tris.toLocaleString()} triangles, ${s.towers} towers, no page errors`, s.tris > 0 && s.towers === 6 && e2.length === 0, e2.slice(0, 2)); await pg.close(); }
for (const v of ['ring', 'arch', 'heart', 'far', 'ring&dusk']) { const pg = await browser.newPage({ viewport: { width: 320, height: 200 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/places.html?still&w=320&h=200&place=ring&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const s = await pg.evaluate(() => window.__stats.place); check(`places.html?place=ring&view=${v} renders: ${s.tris.toLocaleString()} triangles, ${s.bays} arches, no page errors`, s.tris > 0 && e2.length === 0, e2.slice(0, 2)); await pg.close(); }
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
