// Session 2465 makes the Vault's headwall a cliff of its own, in ledged beds, buttresses and gullies.
// Session 2461 adds the Frostborn Vault (ruins.js frostbornVault): a Weaver city in a gorge, the glacier out of its great portal, two viaducts.
// Session 2455: Stormwatch's set stones split slabs with broken tops, one in seven fallen flat; the platform a bed of the pavement.
// Session 2454 adds Stormwatch (ruins.js stormwatch): the older people's fort of three dry-stone walls on a sea cliff, not the Weavers'.
// Session 2448 adds the Forgotten Aqueducts (ruins.js forgottenAqueducts): a gate's nave flooded under the land, open to the sky in a sinkhole.
// Session 2441: the isles' rock laid round each isle and stack, so the beds run on across the facets.
// Session 2440: the isles' rock bedded and jointed, not the kit's veined rock; the crowns' turf its own draw.
// Session 2435: the isles' stacks notched at the tide and broken on a slant.
// Session 2431: the isles' cliffs sheer, and stacks off them.
// Session 2430 adds the Gate Isles (ruins.js gateIsles): five rings on rock isles, their hearts on one line, the far coast through them.
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
  // Session 2419: nothing of the kit's stands in the decks' clear way (between the parapets, 0.3 to 6 m over the deck, between the towers' faces)
  let inWay = 0; for (const m of kit) { const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); if (y < Dk + .3 || y > Dk + 6) continue;
    for (let j = 0; j < 5; j++) { const t = T[j], u = T[j + 1], L = Math.hypot(u.x - t.x, u.z - t.z), ux = (u.x - t.x) / L, uz = (u.z - t.z) / L, al = (x - t.x) * ux + (z - t.z) * uz, ac = (x - t.x) * uz - (z - t.z) * ux; if (Math.abs(ac) < 3.8 && al > 5.3 && al < L - 5.3) inWay++; } } } /* along each span's own line, between the towers' faces */
  const sill = +(a.ground(T[0].x, a.spit.z0 + .6) - Dk).toFixed(2); let steep = 0; for (let z = a.spit.z0 + .6; z < 120; z += 2) steep = Math.max(steep, Math.abs(a.ground(T[0].x, z + 2) - a.ground(T[0].x, z)) / 2);
  return { tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), towers: a.towers, spans: a.spans, lv, gaps, gap: a.gap, low: +low.toFixed(1), figure: a.figure, hits, floors, sill, steep: +steep.toFixed(3), passage: a.passage, inWay }; });
{ const st = S.towers.filter(t => t.cond === 'cracked'), br = S.towers.filter(t => t.cond === 'broken');
  check(`the spires build the same twice and in budget: ${S.tris.toLocaleString()} triangles in ${S.draws} draws`, S.same && S.tris < 120000 && S.draws <= 20, [S.tris, S.draws, S.same]);
  check(`six towers: ${st.length} standing to ${st.map(t => t.wet).join(', ')} m over the sea, ${br.length} broken to ${br.map(t => t.wet).join(', ')} m; every foot under the bed`, S.towers.length === 6 && st.length === 4 && br.length === 2 && st.every(t => t.wet > 70) && br.every(t => t.wet > 20 && t.wet < 60) && S.towers.every(t => t.foot < t.bed), S.towers);
  check(`five spans of ${S.gap} m, each between two towers' faces (${S.gaps.join(', ')} m), one broken`, S.spans.length === 5 && S.gaps.every(g => Math.abs(g - S.gap) < .5) && S.spans.filter(s => s.cond === 'broken').length === 1, S.gaps);
  check(`the levels against a 4 m tide: a's deck at ${S.lv.a} (clear at low water, under at high), b's at ${S.lv.b} (clear at high), c's at ${S.lv.c} (under at low)`, S.lv.a > -2 && S.lv.a < 2 && S.lv.b > 2 && S.lv.c < -2, S.lv);
  check(`what fell went into the sea: the lowest stone at ${S.low} m, under the low water`, S.low < -2, S.low);
  check(`a way through every tower at the decks (${S.passage.w} by ${S.passage.h} m): rays along the chain at 1.7 and 6 m over the decks hit nothing, ${S.hits.length} hits`, S.hits.length === 0, S.hits);
  check(`no stone stands in the decks' clear way between the parapets (${S.inWay} points; a broken tower's stones fall across the chain)`, S.inWay === 0, S.inWay);
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
{ const I = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./ruins.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 9) h = (h * 31 + Math.round(a[i] * 1e3)) | 0; }); return h; };
  const a = K.gateIsles(), b = K.gateIsles(); a.group.updateMatrixWorld(true); const rc = new THREE.Raycaster(), solid = a.group.children.filter(m => m.name !== 'sea' && m.name !== 'script');
  const cast = (o, d, all) => { rc.set(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize()); rc.far = 5000; const h = rc.intersectObjects(solid, false); return all ? h.map(x => ({ n: x.object.name, z: +x.point.z.toFixed(1) })) : h[0] ? { n: h[0].object.name, y: +h[0].point.y.toFixed(2), z: +h[0].point.z.toFixed(1) } : null; };
  // along the line: from behind the first ring at its heart's height, and 6 m off it every way, the first thing met is the far coast
  const line = [[0, 0], [6, 0], [-6, 0], [0, 6], [0, -6], [4.2, 4.2], [-4.2, -4.2]].map(([dx, dy]) => cast([dx, a.CY + dy, 40], [0, 0, -1]));
  // through the crown's stone (12.5 m over each heart), which rings the ray meets
  const crown = cast([0, a.CY + 12.5, 40], [0, 0, -1], true).filter(h => h.n === 'stone'), met = a.isles.filter(s => crown.some(h => Math.abs(h.z - s.z) < 3)).map(s => s.i);
  const crowns = a.isles.map(s => [0, 12, -12, 20].map(d => +(a.ground(d, s.z + (d ? 4 : 0)) - a.S).toFixed(2)));
  // Session 2431: the cliff, how far out it takes on each of 8 bearings (clear of the landing) to fall from 3 m under the crown to 1 m over the sea
  const sheer = a.isles.map(s => [1, 2, 3, 4, 5, 6, 7, 7.5].map(k => { const t = k * Math.PI / 4.4, at = d => a.ground(Math.cos(t) * d, s.z + Math.sin(t) * d); let d0 = null, d1 = null; for (let d = 20; d < 110; d += .25) { const y = at(d); if (d0 === null && y < a.S - 3) d0 = d; if (y < 1) { d1 = d; break; } } return +(d1 - d0).toFixed(2); }));
  const down = a.isles.map(s => [.15, .4, .65, .9].map(f => { const x = s.stair.x0 + (s.stair.x1 - s.stair.x0) * f; const h = cast([x, 60, s.z], [0, -1, 0]); return h && h.n; }));
  const stairEnds = a.isles.map(s => { const lo = cast([s.stair.x1 - .3, 60, s.z], [0, -1, 0]), hi = cast([s.stair.x0 + .3, 60, s.z], [0, -1, 0]); return [lo && lo.y, hi && hi.y]; });
  // Session 2435: each stack's girth from its own axis outward (the rock seen from both sides) at the mean sea and 4 m up, and its top straight down at half its radius on 8 bearings
  const rockD = new THREE.Mesh(a.group.children.find(m => m.name === 'rock').geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })), out = (o, d) => { rc.set(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize()); rc.far = 40; const h = rc.intersectObject(rockD, false); return h[0] ? h[0].distance : null; };
  const stacks = a.isles.flatMap(s => s.stacks.map(k => { const girth = y => { const ds = [0, 1, 2, 3, 4, 5].map(j => out([k.x, y, k.z], [Math.cos(j * 1.047), 0, Math.sin(j * 1.047)])); return ds.every(d => d) ? ds.reduce((p, q) => p + q, 0) / 6 : null; };
    const tops = [0, 1, 2, 3, 4, 5, 6, 7].map(j => { rc.set(new THREE.Vector3(k.x + Math.cos(j * .785) * k.r * .5, 80, k.z + Math.sin(j * .785) * k.r * .5), new THREE.Vector3(0, -1, 0)); rc.far = 200; const h = rc.intersectObject(rockD, false); return h[0] ? h[0].point.y : null; });
    return { i: s.i, w0: +(girth(.4) || 0).toFixed(2), w4: +(girth(4) || 0).toFixed(2), top: +(Math.max(...tops) - Math.min(...tops)).toFixed(2), hi: +Math.max(...tops).toFixed(2), h: k.h }; }));
  // Session 2440: the crowns are turf (straight down beside each plinth), and the rock's grain runs level and upright: of the strongest
  // tenth of its texture's edges, the share within 15° of an axis (bedding and joints), against the kit's veined rock
  const turfDown = a.isles.flatMap(s => [[-19, 6], [19, -6], [8, 19], [-8, -19]].map(([x, z]) => { const h = cast([x, 60, s.z + z], [0, -1, 0]); return h && h.n; }));
  const C = await import('./common.js'), grain = t => { const cv = t.image, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, N = cv.width, L = (x, y) => d[(((y + N) % N) * N + ((x + N) % N)) * 4 + 1], gs = [];
    for (let y = 0; y < N; y += 2) for (let x = 0; x < N; x += 2) { const gx = L(x + 1, y) - L(x - 1, y), gy = L(x, y + 1) - L(x, y - 1); gs.push([Math.hypot(gx, gy), Math.atan2(gy, gx)]); }
    gs.sort((p, q) => q[0] - p[0]); const top = gs.slice(0, gs.length / 10), ax = top.filter(([, t]) => { const m = Math.abs(((t % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2)); return m < .262 || m > Math.PI / 2 - .262; }).length; return +(ax / top.length).toFixed(2); };
  const rockMesh = a.group.children.find(m => m.name === 'rock'), texture = { sea: rockMesh.material.map === C.TEX.searock.map, turfMap: !!a.group.children.find(m => m.name === 'turf').material.map, axis: grain(C.TEX.searock.map), kit: grain(C.TEX.rock.map) };
  // Session 2441: the beds run on across the facets: of the rock's points shared by faces that look sideways, the share whose faces all give
  // it one texture coordinate, as laid and as worldUV (the face's major axis) would lay the same faces
  const seamless = geo => { const P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv, at = new Map();
    for (let v = 0; v < P.count; v++) { if (N.getY(v) > .75) continue; const key = [P.getX(v), P.getY(v), P.getZ(v)].map(q => Math.round(q * 1e3)).join(), l = at.get(key) || at.set(key, []).get(key); l.push([U.getX(v), U.getY(v)]); }
    let n = 0, ok = 0; for (const l of at.values()) { if (l.length < 2) continue; n++; if (l.every(q => Math.abs(q[0] - l[0][0]) < 1e-3 && Math.abs(q[1] - l[0][1]) < 1e-3)) ok++; } return +(ok / n).toFixed(3); };
  const wu = rockMesh.geometry.clone(); C.worldUV(wu, .0625); const uvs = { laid: seamless(rockMesh.geometry), axis: seamless(wu) };
  return { uvs, turfDown, texture, tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), line, met, crowns, sheer, down, stairEnds, stacks, isles: a.isles.map(s => ({ i: s.i, z: s.z, cond: s.cond, gone: s.gone, slipped: s.slipped, lost: s.lost })), S: a.S, P: a.P, CY: a.CY, R1: a.R1, R0: a.R0, figure: a.figure, coast: a.coast,
    emissive: a.group.children.filter(m => m.material.emissive && m.material.emissive.getHex()).map(m => m.name), names: a.group.children.map(m => m.name) }; });
  const br = I.isles.filter(s => s.cond === 'broken');
  check(`the rock bedded, not marbled: ${(I.texture.axis * 100).toFixed(0)}% of its texture's strongest edges lie level or upright (the kit's veined rock ${(I.texture.kit * 100).toFixed(0)}%); the crowns are turf with no rock in it (${I.turfDown.filter(n => n === 'turf').length} of ${I.turfDown.length} rays)`,
    I.texture.sea && !I.texture.turfMap && I.texture.axis > .6 && I.texture.axis > I.texture.kit + .2 && I.turfDown.every(n => n === 'turf'), { texture: I.texture, turf: I.turfDown });
  check(`the beds run on across the cliff's facets: ${(I.uvs.laid * 100).toFixed(1)}% of the points the side faces share take one texture coordinate from all of them (by each face's major axis, ${(I.uvs.axis * 100).toFixed(1)}%)`, I.uvs.laid > .95 && I.uvs.laid > I.uvs.axis + .1, I.uvs);
  check(`the Gate Isles build the same twice and in budget: ${I.tris.toLocaleString()} triangles in ${I.draws} draws`, I.same && I.tris < 80000 && I.draws <= 10, [I.tris, I.draws, I.same]);
  check(`five isles along the line at z ${I.isles.map(s => s.z).join(', ')}, each crown level at ${I.S} m (${I.crowns.map(c => c.join('/')).join(', ')} m off it)`, I.isles.length === 5 && I.crowns.every(c => c.every(d => d < 0 && d > -.6)), I.crowns);
  check(`skerries, not domes: on 40 bearings the cliff falls from 3 m under the crown to 1 m over the sea within ${Math.max(...I.sheer.flat())} m (the widest; mean ${(I.sheer.flat().reduce((p, q) => p + q, 0) / 40).toFixed(1)})`, I.sheer.flat().every(d => d > 0 && d < 9), I.sheer);
  check(`stacks worn by the sea, not cut: all ${I.stacks.length} narrower at the mean sea than 4 m up (${Math.min(...I.stacks.map(k => k.w0 / k.w4)).toFixed(2)} to ${Math.max(...I.stacks.map(k => k.w0 / k.w4)).toFixed(2)} of it), each top broken on a slant (${Math.min(...I.stacks.map(k => k.top))} to ${Math.max(...I.stacks.map(k => k.top))} m across half its radius), none over its height`,
    I.stacks.length >= 10 && I.stacks.every(k => k.w0 > 0 && k.w4 > 0 && k.w0 / k.w4 < .85 && k.top > 1.5 && k.hi <= k.h + .01), I.stacks);
  check(`the hearts on one line: along it from behind the first ring, at the heart and 6 m off it, every ray first meets ${[...new Set(I.line.map(h => h ? h.n : 'nothing'))].join(', ')} at z ${Math.max(...I.line.map(h => h ? h.z : 0))}`, I.line.every(h => h && h.n === 'coast' && h.z < I.coast.z + 1), I.line);
  check(`through the crowns' stone 12.5 m over the line the ray meets rings ${I.met.map(i => i + 1).join(', ')}: the broken third's is gone`, I.met.join() === '0,1,3,4', I.met);
  check(`a ruin: one ring broken (${br.map(s => s.gone).join()} stones lost), four whole with ${I.isles.map(s => s.slipped).join(', ')} slipped; nothing lit (${I.emissive.join(', ') || 'no emissive'})`, br.length === 1 && br[0].i === 2 && br[0].gone === 9 && I.isles.filter(s => s.cond !== 'broken').every(s => s.gone === 0) && I.emissive.length === 0, I.isles.map(s => [s.cond, s.gone, s.slipped]));
  const L = br[0].lost; check(`every lost stone lies on the crown, sunk in it (lowest ${Math.min(...L.map(t => t.low))} to ${Math.max(...L.map(t => t.low))} m, tops ${Math.min(...L.map(t => t.top))} to ${Math.max(...L.map(t => t.top))} m over it), within ${Math.max(...L.map(t => Math.hypot(t.x, t.z - br[0].z))).toFixed(1)} m of the heart`,
    L.length === 9 && L.every(t => t.low < 0 && t.low > -1.6 && t.top > .6 && Math.hypot(t.x, t.z - br[0].z) < 21.5), L);
  check(`a landing on every isle: straight down onto the flight, ${I.down.flat().filter(n => n === 'stair').length} of 20 rays meet its steps; it runs from ${Math.min(...I.stairEnds.map(e => e[0]))} m (the low water -2) to ${Math.min(...I.stairEnds.map(e => e[1]))}`, I.down.every(d => d.every(n => n === 'stair')) && I.stairEnds.every(e => e[0] < -2 && e[1] > I.S - .4), { down: I.down, ends: I.stairEnds });
  check(`the scale: each ring ${2 * I.R1} m across and its opening ${2 * I.R0} m, its heart ${I.CY.toFixed(1)} m over the mean sea; ${(2 * I.R1 / I.figure.h).toFixed(0)} times the 1.75 m post on the first plinth`, I.figure.h === 1.75 && Math.abs(I.figure.y - I.P) < .01 && 2 * I.R1 / I.figure.h > 15, I.figure); }
// the Forgotten Aqueducts (Session 2448; OG-104, the Gatelands): a gate's nave under the limestone, flooded, its vault fallen into a sinkhole
{ const F = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./ruins.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 9) h = (h * 31 + Math.round(a[i] * 1e3)) | 0; }); return h; };
  const a = K.forgottenAqueducts(), b = K.forgottenAqueducts(); a.group.updateMatrixWorld(true); const rc = new THREE.Raycaster(), solid = a.group.children.filter(m => !['water', 'fall', 'foam'].includes(m.name));
  const cast = (o, d, far = 3000) => { rc.set(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize()); rc.far = far; const h = rc.intersectObjects(solid, false)[0]; return h ? { n: h.object.name, d: +h.distance.toFixed(1), y: +h.point.y.toFixed(2) } : null; };
  const N = a.nave, lips = Array.from({ length: 64 }, (_, k) => +a.lip(k / 64 * Math.PI * 2).toFixed(1));
  // the sky: straight up from the water in the hole (its heart and 20 m off it), and from the halls under the land (60 and 110 m out each way)
  const open = [[0, 0], [20, 0], [-20, 0], [0, -20]].map(([x, z]) => cast([x, a.water + 1, z], [0, 1, 0])), under = [-110, -60, 60, 110].map(x => cast([x, a.water + 1, 0], [0, 1, 0]));
  // enclosed: from the halls 100 m out each way, 48 rays round and up all meet stone or rock; along the nave each way the ray meets the choke past 100 m
  const leak = []; let out = 0; for (const x of [-100, 100]) for (let k = 0; k < 16; k++) { const t = k / 16 * Math.PI * 2; for (const e of [.1, .5, 1.1]) { const d = [Math.cos(t) * Math.cos(e), Math.sin(e), Math.sin(t) * Math.cos(e)], h = cast([x, a.water + 2, 0], d), u = (a.land - a.water - 2) / d[1]; if (!h && !a.inHole(x + d[0] * u, d[2] * u)) leak.push([x, +t.toFixed(2), e]); else if (!h) out++; } }
  const along = [-1, 1].map(s => cast([0, a.water + 3, -4], [s, 0, 0]));
  // the stair: straight down onto each tenth of the flight, the tread; and from just over each tread out into the wall, rock within 4 m
  const S = a.stair, tread = [], wall = []; for (let k = 0; k < 10; k++) { const t = (k + .5) / 10, an = S.a0 + (S.a1 - S.a0) * t, rr = a.lip(an) - 2.4, x = Math.sin(an) * rr, z = Math.cos(an) * rr, hit = cast([x, 20, z], [0, -1, 0]);
    tread.push(hit && { n: hit.n, y: hit.y }); const w = hit && cast([x, hit.y + .6, z], [Math.sin(an), 0, Math.cos(an)], 8); wall.push(w && { n: w.n, d: w.d }); }
  const emissive = a.group.children.filter(m => m.material.emissive && m.material.emissive.getHex()).map(m => m.name);
  // Session 2449: the water coloured by its depth (the mean brightness of its points over 5.5 m or more against those over less than 1.5 m),
  // and the fallen blocks' stone one ashlar block a face
  const wm = a.group.children.find(m => m.name === 'water'), WP = wm.geometry.attributes.position, WC = wm.geometry.attributes.color, sh = [], dp = [];
  for (let i = 0; i < WP.count; i++) { const d = a.water - a.ground(WP.getX(i), WP.getZ(i)), L = WC.getX(i) + WC.getY(i) + WC.getZ(i); if (d >= 5.5) dp.push(L); else if (d < 1.5) sh.push(L); }
  const mean = l => +(l.reduce((p, q) => p + q, 0) / l.length / 3).toFixed(3), sm = a.group.children.find(m => m.name === 'stone').material.map;
  const tone = { deep: mean(dp), shallow: mean(sh), nd: dp.length, ns: sh.length, uni: !!wm.material.vertexColors, rep: [sm.repeat.x, sm.repeat.y] };
  return { tone, tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), names: a.group.children.map(m => m.name), lips, nave: N, arches: a.arches, falls: a.falls, stair: { ...S }, tread, wall, open, under, leak, out, along, figure: a.figure, water: a.water, floor: a.floor, land: a.land,
    deep: [[20, 0], [0, -12], [12, -24], [-100, 0], [100, 0]].map(([x, z]) => +(a.water - a.ground(x, z)).toFixed(2)), emissive, stones: a.stones }; });
  const br = F.arches.filter(q => q.cond === 'broken'), cr = F.arches.filter(q => q.cond === 'cracked');
  check(`the Forgotten Aqueducts build the same twice and in budget: ${F.tris.toLocaleString()} triangles in ${F.draws} draws`, F.same && F.tris < 80000 && F.draws <= 18, [F.tris, F.draws, F.same, F.names]);
  check(`the sinkhole: its lip ${Math.min(...F.lips)} to ${Math.max(...F.lips)} m from its heart on 64 bearings, the water ${F.land - F.water} m under the land; straight up from the water in it, the sky (${F.open.map(h => h ? h.n : 'sky').join(', ')})`,
    Math.min(...F.lips) > 44 && Math.max(...F.lips) < 56 && F.land - F.water >= 60 && F.open.every(h => h === null), { lips: F.lips, open: F.open });
  check(`the halls run on under the land: straight up from the water 60 and 110 m out each way, the vault (${F.under.map(h => h && `${h.n} ${h.y}`).join(', ')}); along the nave each way the choke at ${F.along.map(h => h && h.d).join(' and ')} m`,
    F.under.every(h => h && h.n === 'vault' && h.y > F.nave.top && h.y <= F.nave.crown + .5) && F.along.every(h => h && ['choke', 'stone'].includes(h.n) && h.d > 100 && h.d < 140), { under: F.under, along: F.along });
  check(`enclosed: from the halls 100 m out each way, ${96 - F.leak.length - F.out} of 96 rays round and up meet stone or rock and ${F.out} leave by the hole, none by any other way`, F.leak.length === 0, F.leak.slice(0, 8));
  check(`the nave: ${F.nave.w} m between the arcades, ${F.nave.bays} bays of ${F.nave.bay} m a side (the kit's arch at twice its size, its crown at ${F.nave.top}), the vault's crown at ${F.nave.crown}; flooded ${Math.min(...F.deep)} m over the floor at ${F.floor} clear of the scree`,
    F.arches.length === 18 && F.nave.bay === 28.8 && F.nave.top === -30 && F.nave.crown === -10 && F.deep.every(d => Math.abs(d - 6) < .01), F.deep);
  check(`a ruin: the ${br.length} arches over the hole broken (${br.map(q => q.fallen).join(', ')} stones fallen into the water), the ${cr.length} under the land cracked; nothing lit (${F.emissive.join(', ') || 'no emissive'}); ${F.stones} of the vault's stones down in the hole`,
    br.length >= 4 && br.every(q => q.fallen > 0 && Math.abs(q.x) < 50) && cr.every(q => q.fallen === 0) && br.length + cr.length === 18 && F.emissive.length === 0 && F.stones > 30, F.arches);
  check(`the way down: ${F.stair.n} steps cut in the south wall from ${F.stair.y0} to ${F.stair.y1} m; straight down onto every tenth of it, its tread (${F.tread.map(t => t && t.y).join(', ')}), and the wall within ${Math.max(...F.wall.map(w => w ? w.d : 99))} m behind it`,
    F.tread.every((t, i) => t && t.n === 'stair' && (!i || t.y < F.tread[i - 1].y)) && F.wall.every(w => w && w.n === 'rock' && w.d < 4), { tread: F.tread, wall: F.wall });
  check(`the water by its depth: ${F.tone.shallow} bright where it is under 1.5 m deep, over the scree's toe (${F.tone.ns} points), ${F.tone.deep} over the nave's 6 m (${F.tone.nd}); a fallen block's face is one stone (the ashlar ${F.tone.rep.join(' by ')} a face)`,
    F.tone.uni && F.tone.ns > 20 && F.tone.nd > 200 && F.tone.shallow > 2 * F.tone.deep && F.tone.rep[0] === .5 && F.tone.rep[1] === .25, F.tone);
  check(`three falls into the water: ${F.falls.map(f => `${(f.top - f.bottom).toFixed(0)} m`).join(', ')}`, F.falls.length === 3 && F.falls.every(f => f.bottom === F.water && f.top - f.bottom > 35), F.falls);
  check(`the scale: the 1.75 m post stands on the scree ${(F.figure.y - F.water).toFixed(1)} m over the water; the arcade stands ${((F.nave.top - F.floor) / F.figure.h).toFixed(0)} times its height`, F.figure.h === 1.75 && F.figure.y - F.water > 1.5 && F.figure.y - F.water < 3 && (F.nave.top - F.floor) / F.figure.h > 20, F.figure); }
// Stormwatch (Session 2454; OG-104, the Gatelands): the older people's fort of three dry-stone walls on a sea cliff
{ const S = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./ruins.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 9) h = (h * 31 + Math.round(a[i] * 1e3)) | 0; }); return h; };
  const a = K.stormwatch(), b = K.stormwatch(); a.group.updateMatrixWorld(true); const rc = new THREE.Raycaster(), solid = a.group.children.filter(m => !['sea', 'foam'].includes(m.name));
  const cast = (o, d, far = 3000) => { rc.set(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize()); rc.far = far; const h = rc.intersectObjects(solid, false)[0]; return h ? { n: h.object.name, d: +h.distance.toFixed(2), y: +h.point.y.toFixed(2) } : null; };
  const W = a.walls, g = a.ground, e = a.edge, AE = a.passage.a;
  // the cliff: at nine points along it, the top over 80 m and the sea's bed under 4.5 m out; from the sea 60 m out, a level ray meets the face
  const xs = [-300, -200, -120, -50, 0, 50, 120, 200, 300], drop = xs.map(x => [+g(x, e(x) + .05).toFixed(1), +g(x, e(x) - 4.5).toFixed(1)]), face = xs.map(x => cast([x, 30, e(x) - 60], [0, 0, 1]));
  // Session 2457: the face in buttresses and gullies: level rays from the sea at 40 m up, every 5 m along 600 m of it, and how far out of the edge's line each meets the rock
  const relief = Array.from({ length: 121 }, (_, k) => { const x = -300 + k * 5, h = cast([x, 40, e(x) - 60], [0, 0, 1]); return h ? +(60 - h.d).toFixed(2) : null; });
  // the walls' ends: each where the cliff took it, its line within 4 m of the edge
  const ends = Object.values(W).map(w => w.ends.map(([x, z]) => +(z - e(x)).toFixed(2)));
  // the inner wall's three bands from the top down: straight down at each band's middle, its top over the ground (at three bearings away from the passage)
  const bands = [1.6, 2.0, 2.6].map(an => [1.2, -.3, -1.5].map(off => { const p = a.ell(26, 22, an, off), h = cast([p[0], 140, p[1]], [0, -1, 0]); return h && { n: h.n, h: +(h.y - g(...a.ell(26, 22, an))).toFixed(2) }; }));
  // the passage: from 3 m outside its mouth, level at 1 m over its floor, three rays (its middle and 0.5 m either side) run on past its inner mouth; at 2.6 m the wall or a lintel
  const P = a.passage, o = a.ell(26, 22, AE, 5.1), i = a.ell(26, 22, AE, -3.2), dir = [i[0] - o[0], 0, i[1] - o[1]], L = Math.hypot(dir[0], dir[2]), tg = [-dir[2] / L, dir[0] / L], fy = g(...a.ell(26, 22, AE));
  const through = [-.5, 0, .5].map(s => cast([o[0] + tg[0] * s, fy + 1, o[1] + tg[1] * s], dir, L)), over = cast([o[0], fy + 2.6, o[1]], dir, L);
  // the way in through the middle and outer walls' gaps: along the normal at the gap's middle, level at 1 m, nothing within the wall's thickness and 2 m
  const gate = [['middle', 58, 52], ['outer', 118, 100]].map(([n, rx, rz]) => { const p = a.ell(rx, rz, AE, 4), q = a.ell(rx, rz, AE, -4); return cast([p[0], g(...a.ell(rx, rz, AE)) + 1, p[1]], [q[0] - p[0], 0, q[1] - p[1]], 8); });
  const emissive = a.group.children.filter(m => m.material.emissive && m.material.emissive.getHex()).map(m => m.name);
  const cs = a.chev.map(c => { const an = Math.atan2((c.z - a.C[1]) / 52, (c.x - a.C[0]) / 58), p = a.ell(58, 52, an); return { off: +Math.hypot(c.x - p[0], c.z - p[1]).toFixed(2), an: +an.toFixed(3), top: c.top, fallen: c.fallen, edge: +(c.z - e(c.x)).toFixed(2) }; });
  return { tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), names: a.group.children.map(m => m.name), drop, face, relief, ends, bands, through, over, gate, emissive, cs, P, figure: a.figure, TOP: a.TOP, tumbles: a.tumbles, platform: a.platform,
    walls: Object.fromEntries(Object.entries(W).map(([k, w]) => [k, { rx: w.rx, rz: w.rz, thick: w.thick, h: w.h, n: w.segs.length, bottoms: Math.max(...w.segs.filter(s => s.gap !== 'pass').map(s => s.bottom)), breach: w.segs.filter(s => s.gap === 'breach').length,
      stand: +(w.segs.filter(s => s.top > 1.5).length / w.segs.length).toFixed(2), tops: w.segs.filter(s => !s.gap).map(s => s.top) }])) }; });
  const W = S.walls;
  check(`Stormwatch builds the same twice and in budget: ${S.tris.toLocaleString()} triangles in ${S.draws} draws`, S.same && S.tris < 110000 && S.draws <= 14, [S.tris, S.draws, S.same, S.names]);
  check(`the cliff: at nine points its top ${Math.min(...S.drop.map(d => d[0]))} m or more over the sea and the bed ${Math.max(...S.drop.map(d => d[1]))} m or less 4.5 m out; from the sea a level ray meets its face (${S.face.map(h => h && h.n).join(', ')})`,
    S.drop.every(d => d[0] > 80 && d[1] < 0) && S.face.every(h => h && h.n === 'cliff' && h.d < 75), { drop: S.drop, face: S.face });
  { const rl = S.relief, steps = rl.slice(1).filter((v, k) => v !== null && rl[k] !== null && Math.abs(v - rl[k]) > 1.5).length;
    check(`the face is not one plane: from the sea at 40 m up, along 600 m, it stands ${Math.min(...rl).toFixed(1)} to ${Math.max(...rl).toFixed(1)} m out of the edge's line, stepping more than 1.5 m between rays 5 m apart ${steps} times`, rl.every(v => v !== null) && Math.max(...rl) - Math.min(...rl) > 8 && steps >= 12, rl); }
  check(`three walls in half-rings, each stopped by the cliff at both ends (${S.ends.map(x => x.join('/')).join(', ')} m from the edge): the seaward half is gone`, S.ends.length === 3 && S.ends.every(x => x.length === 2 && x.every(d => Math.abs(d) < 4)), S.ends);
  check(`the inner wall in three bands from the outside in, their tops ${S.bands.map(b => b.map(x => x && x.h).join('/')).join(', ')} m over the ground (5.4, 3.6, 1.8: two terraces inside)`,
    S.bands.every(b => b.every(x => x && x.n === 'wall') && Math.abs(b[0].h - 5.4) < .5 && Math.abs(b[1].h - 3.6) < .5 && Math.abs(b[2].h - 1.8) < .5), S.bands);
  check(`the way in: a passage ${S.P.w} m wide through the inner wall's ${S.P.len} m; level at 1 m, three rays from outside run clear past its inner mouth (${S.through.map(h => h ? h.n + ' ' + h.d : 'clear').join(', ')}); at 2.6 m the ${S.over && S.over.n} at ${S.over && S.over.d} m`,
    S.through.every(h => h === null) && S.over && ['wall', 'lintel'].includes(S.over.n), { through: S.through, over: S.over });
  check(`the middle and outer walls' gaps on the way in: level at 1 m through each, ${S.gate.map(h => h ? h.n : 'clear').join(' and ')}`, S.gate.every(h => h === null), S.gate);
  check(`no wall floats: every stretch's footing ${Math.max(...Object.values(W).map(w => w.bottoms))} m or more under the ground at its middle (${Object.values(W).map(w => w.n).join(', ')} stretches)`, Object.values(W).every(w => w.bottoms < -.3), Object.values(W).map(w => w.bottoms));
  check(`a ruin: the middle wall's ${W.middle.breach} stretches breached and thrown down, the outer standing over 1.5 m in ${Math.round(W.outer.stand * 100)}% of its run, ${S.tumbles} stones fallen; no Weaver stone, nothing lit (${S.emissive.join(', ') || 'no emissive'})`,
    W.middle.breach >= 4 && W.outer.stand > .1 && W.outer.stand < .6 && W.inner.stand > .9 && S.tumbles > 100 && S.emissive.length === 0 && !S.names.some(n => /script|sigil|arch/.test(n)), { middle: W.middle.breach, outer: W.outer.stand, inner: W.inner.stand });
  const cs = S.cs;
  check(`the set stones: ${cs.length} slabs ${Math.min(...cs.map(c => c.off)).toFixed(1)} to ${Math.max(...cs.map(c => c.off)).toFixed(1)} m out from the middle wall's line, the standing ${Math.min(...cs.filter(c => !c.fallen).map(c => c.top)).toFixed(2)} to ${Math.max(...cs.map(c => c.top)).toFixed(2)} m high, ${cs.filter(c => c.fallen).length} fallen flat (to ${Math.max(0, ...cs.filter(c => c.fallen).map(c => c.top)).toFixed(2)} m), none on the way in or within 3 m of the edge`,
    cs.length > 300 && cs.every(c => c.off > 3 && c.off < 20 && (c.fallen ? c.top < .6 : c.top > .4 && c.top < 2) && c.edge > 3 && Math.abs(c.an - S.P.a) > .3) && cs.filter(c => c.fallen).length > cs.length / 12 && cs.filter(c => c.fallen).length < cs.length / 4, cs.filter(c => !(c.off > 3 && c.off < 20 && (c.fallen ? c.top < .6 : c.top > .4 && c.top < 2) && c.edge > 3)).slice(0, 6));
  check(`the scale: the 1.75 m post inside the passage's mouth; the inner wall ${(5.4 / S.figure.h).toFixed(1)} times its height, the cliff ${(S.TOP / S.figure.h).toFixed(0)} times`, S.figure.h === 1.75 && Math.abs(S.figure.y - S.TOP) < 12, S.figure); }
// The Frostborn Vault (Session 2461; OG-104, the Mark): a Weaver city in a gorge, the glacier out of its great portal, two viaducts and their halls
{ const F = await page.evaluate(async () => { const THREE = await import('three'), K = await import('./ruins.js');
  const hash = g => { let h = 0; g.traverse(m => { if (!m.isMesh) return; h = (h * 31 + m.geometry.attributes.position.count) | 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 9) h = (h * 31 + Math.round(a[i] * 1e3)) | 0; }); return h; };
  const a = K.frostbornVault(), b = K.frostbornVault(); a.group.updateMatrixWorld(true); const rc = new THREE.Raycaster(), all = a.group.children;
  const cast = (o, d, far = 3000) => { rc.set(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize()); rc.far = far; const h = rc.intersectObjects(all, false)[0]; return h ? { n: h.object.name, d: +h.distance.toFixed(2), y: +h.point.y.toFixed(2), x: +h.point.x.toFixed(2), z: +h.point.z.toFixed(2) } : null; };
  const [V1, V2] = a.viaducts;
  // the decks: straight down from 30 m, every 2 m from abutment to abutment, at the deck's middle and 3 m either side
  const deck = v => { const out = []; for (let x = v.x0 + 1; x < v.x1 - 1; x += 2) for (const dz of [-3, 0, 3]) { const h = cast([x, 30, v.z + dz], [0, -1, 0]); out.push({ x, n: h && h.n, y: h && h.y }); } return out; };
  const d1 = deck(V1), d2 = deck(V2), inGap = p => p.x > V2.gap.a + 5.5 && p.x < V2.gap.b - 5.5;
  // the ice: under the broken viaduct over its lower tier's crowns, under the whole one clear below them
  const mids = v => [0, 1, 2, 3, 4].map(i => -75 + i * (v.S + v.pier) + v.S / 2), ice1 = mids(V1).map(x => +a.iceY(x, V1.z).toFixed(1)), ice2 = mids(V2).map(x => +a.iceY(x, V2.z).toFixed(1));
  // the face: level rays from the south up the gorge's middle at the tongue's height, through the great portal over it, through a lancet and against the wall beside them
  const F0 = a.face, fz = F0.z + 60, ray = (x, y) => cast([x, y, fz], [0, 0, -1]);
  const face = { tongue: ray(0, 8), portal: ray(0, 40), lancet: ray(0, 64), wall: ray(-22, 40), side: ray(-38, 15) };
  // the halls' doors: level at 1.5 m over the deck, from the whole viaduct's middle outward, and the roofed halls' roofs straight down at their middles
  const doors = [-1, 1].map(s => cast([0, 1.8, V1.z], [s, 0, 0], 400)), roofs = a.halls.map(h => ({ ...h, top: cast([h.x, 120, h.z], [0, -1, 0]) }));
  const blocks = a.fallen.map(f => ({ ...f, sunk: +(f.at - f.low).toFixed(2) }));
  return { tris: a.tris, draws: a.draws, same: hash(a.group) === hash(b.group), names: all.map(m => m.name), d1, d2: d2.map(p => ({ ...p, gap: inGap(p) })), V1, V2, ice1, ice2, face, F0, doors, roofs, blocks, towers: a.towers, halls: a.halls, figure: a.figure,
    cliffRays: (() => { const C = a.cliff, out = []; for (let x = -700; x <= 700; x += 7) { if (Math.abs(x) < 112) continue; const c = C.cl(x), b0 = C.base(x);
      for (const f of [.15, .45, .75, .95]) { const y = b0 + c * f, h = cast([x, y, C.zh(x) + 24], [0, 0, -1], 200); out.push({ x, f, n: h && h.n, z: h && h.z, want: +C.front(x, c * f).toFixed(2) }); } } return out; })(),
    cliffProfile: (() => { const C = a.cliff; let steps = 0, cols = 0; for (let x = -600; x <= 600; x += 50) { cols++; for (let h = -10; h < C.cl(x) - 2; h += .4) if (C.back(x, h + 1.6) - C.back(x, h) > 1.5) { steps++; h += 3; } } return { steps, cols, beds: C.beds, buttresses: C.buttresses, gullies: C.gullies }; })(),
    rim: [-90, 90].map(x => +a.ground(x, 0).toFixed(1)), bed: +a.ground(0, 200).toFixed(1), head: +a.ground(0, F0.z - F0.d - 80).toFixed(1), emissive: all.filter(m => m.material.emissive && m.material.emissive.getHex()).map(m => m.name) }; });
  check(`the Frostborn Vault builds the same twice and in budget: ${F.tris.toLocaleString()} triangles in ${F.draws} draws`, F.same && F.tris < 190000 && F.draws <= 14, [F.tris, F.draws, F.same, F.names]);
  { const r = F.cliffRays, bad = r.filter(p => p.n !== 'rock' || Math.abs(p.z - p.want) > 8), P = F.cliffProfile, dev = Math.max(...r.map(p => Math.abs(p.z - p.want)));
    check(`the headwall a cliff of its own (S2465): ${r.length} level rays at 15 to 95% of its height, every 7 m along it (the face's 224 m left out), all meet the rock, never the land, at most ${dev.toFixed(1)} m off its drawn face (its columns 3 to 6 m apart, a buttress's flank between two) (${bad.length} not)`, r.length > 600 && bad.length === 0, bad.slice(0, 6));
    check(`the headwall in beds: ${P.beds} beds, ${P.steps} ledges of over 1.5 m in ${P.cols} columns read up it, ${P.buttresses} buttresses and ${P.gullies} gullies`, P.beds >= 8 && P.steps >= P.cols * 3 && P.buttresses >= 8 && P.gullies >= 4, P); }
  check(`the gorge: its rims ${F.rim.join(' and ')} m, its bed ${F.bed} m down, the headwall ${F.head} m over the rims 80 m behind the face (S2465: the cliff now leans back in its beds, so its top stands further in)`, F.rim.every(y => Math.abs(y) < 6) && F.bed < -70 && F.head > 100, { rim: F.rim, bed: F.bed, head: F.head });
  { const bad = F.d1.filter(p => !['snow', 'deck'].includes(p.n) || p.y < 0 || p.y > 1.2);
    check(`the first viaduct (z ${F.V1.z}) whole: from abutment to abutment, ${F.d1.length} rays down at its middle and 3 m either side all land on its deck at 0 to 1.1 m (${bad.length} not)`, bad.length === 0, bad.slice(0, 6)); }
  { const gap = F.d2.filter(p => p.gap), bad = gap.filter(p => p.y > -8), rest = F.d2.filter(p => !p.gap && (p.x < F.V2.gap.a - 6 || p.x > F.V2.gap.b + 6)), off = rest.filter(p => !['snow', 'deck'].includes(p.n));
    check(`the second viaduct (z ${F.V2.z}) broken: its fourth span gone, ${gap.length} rays down in the gap meet ${[...new Set(gap.map(p => p.n))].join('/')} ${Math.max(...gap.map(p => p.y)).toFixed(1)} m or lower; either side its deck runs on (${off.length} rays off it)`,
      gap.length > 20 && bad.length === 0 && off.length === 0, { bad: bad.slice(0, 4), off: off.slice(0, 4) }); }
  check(`the glacier: under the first viaduct ${Math.max(...F.ice1)} m or lower, under its lower tier's crowns (${F.V1.lower.toFixed(1)} m); under the second ${Math.min(...F.ice2)} m or higher, its lower tier drowned (crowns at ${F.V2.lower.toFixed(1)} m)`,
    F.ice1.every(y => y < F.V1.lower - 15) && F.ice2.every(y => y > F.V2.lower + 1), { ice1: F.ice1, ice2: F.ice2 });
  { const b = F.blocks; check(`the gone span's ${b.length} stones lie on the ice under the gap, each sunk ${Math.min(...b.map(x => x.sunk))} to ${Math.max(...b.map(x => x.sunk))} m, none floating`,
      b.length > 30 && b.every(x => x.sunk >= 0 && x.sunk < 1.5 && x.x > F.V2.gap.a - 8 && x.x < F.V2.gap.b + 8 && x.at < -8), b.filter(x => !(x.sunk >= 0 && x.sunk < 1.5)).slice(0, 4)); }
  { const f = F.face; check(`the face (${F.F0.x1 - F.F0.x0} m wide, ${F.F0.d} m deep, to ${F.F0.top} m): level from the south, at 8 m the ${f.tongue && f.tongue.n} out of the great portal; at 40 m through it to the ${f.portal && f.portal.n} ${f.portal && (F.F0.z - f.portal.z).toFixed(1)} m in; at 64 m a lancet to the ${f.lancet && f.lancet.n}; beside them the ${f.wall && f.wall.n} at its front, a side portal to the ${f.side && f.side.n}`,
      f.tongue && f.tongue.n === 'ice2' && f.tongue.z > F.F0.z && f.portal && f.portal.n === 'dark' && f.portal.z < F.F0.z - F.F0.d + .5 && f.lancet && f.lancet.n === 'dark' && f.wall && f.wall.n === 'stone' && Math.abs(f.wall.z - F.F0.z) < .2 && f.side && f.side.n === 'dark', f); }
  { const dr = F.doors; check(`the halls' doors: level 1.5 m over the first viaduct's deck, from its middle both ways through the gables' doors into the halls (${dr.map(h => h ? h.n + ' at ' + Math.abs(h.x) : 'clear').join(', ')})`, dr.every(h => h && Math.abs(h.x) > 150), dr);
    const rf = F.roofs; check(`four halls, one at each end of each viaduct; three roofed (${rf.filter(h => !h.broken).map(h => h.top && h.top.n + ' ' + h.top.y).join(', ')}), the broken viaduct's west hall open to the sky (${rf.filter(h => h.broken).map(h => h.top && h.top.n + ' ' + h.top.y).join(', ')})`,
      rf.length === 4 && rf.filter(h => !h.broken).every(h => h.top && h.top.n === 'roof' && h.top.y > 30) && rf.filter(h => h.broken).length === 1 && rf.filter(h => h.broken).every(h => h.top && h.top.y < 10), rf); }
  check(`the towers: ${F.towers.length} on the rims, ${F.towers.filter(t => t.broken).length} broken off, ${Math.min(...F.towers.map(t => t.h))} to ${Math.max(...F.towers.map(t => t.h))} m, none in the gorge or on a hall`,
    F.towers.length >= 6 && F.towers.every(t => Math.abs(t.x) > 150 && !F.halls.some(h => Math.abs(h.x - t.x) < 30 + t.w / 2 && Math.abs(h.z - t.z) < 18 + t.w / 2)), F.towers);
  check(`a ruin of the Weavers': nothing lit (${F.emissive.join(', ') || 'no emissive'}); the scale: the 1.75 m post on the deck, the viaduct ${(85 / F.figure.h).toFixed(0)} times its height over the bed`, F.emissive.length === 0 && F.figure.h === 1.75 && Math.abs(F.figure.y - .3) < .01, F.figure); }
for (const v of ['gorge', 'under', 'gap', 'portal', 'hall', 'far', 'gorge&dusk']) { const pg = await browser.newPage({ viewport: { width: 320, height: 200 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/places.html?still&w=320&h=200&place=frostborn&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const s = await pg.evaluate(() => window.__stats.place); check(`places.html?place=frostborn&view=${v} renders: ${s.tris.toLocaleString()} triangles in ${s.draws} draws, ${s.viaducts} viaducts, ${s.halls} halls, ${s.towers} towers, no page errors`, s.tris > 0 && s.viaducts === 2 && s.halls === 4 && e2.length === 0, e2.slice(0, 2)); await pg.close(); }
for (const v of ['fort', 'stones', 'gate', 'inside', 'edge', 'sea', 'far', 'fort&dusk']) { const pg = await browser.newPage({ viewport: { width: 320, height: 200 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/places.html?still&w=320&h=200&place=stormwatch&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const s = await pg.evaluate(() => window.__stats.place); check(`places.html?place=stormwatch&view=${v} renders: ${s.tris.toLocaleString()} triangles in ${s.draws} draws, ${s.walls} walls, ${s.chev} set stones, no page errors`, s.tris > 0 && s.walls === 3 && e2.length === 0, e2.slice(0, 2)); await pg.close(); }
for (const v of ['lip', 'stair', 'scree', 'nave', 'far', 'nave&dusk']) { const pg = await browser.newPage({ viewport: { width: 320, height: 200 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/places.html?still&w=320&h=200&place=aqueducts&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const s = await pg.evaluate(() => window.__stats.place); check(`places.html?place=aqueducts&view=${v} renders: ${s.tris.toLocaleString()} triangles in ${s.draws} draws, ${s.arches} arches (${s.broken} broken), ${s.falls} falls, no page errors`, s.tris > 0 && s.arches === 18 && e2.length === 0, e2.slice(0, 2)); await pg.close(); }
for (const v of ['line', 'sight', 'boat', 'landing', 'broken', 'far', 'sight&dusk']) { const pg = await browser.newPage({ viewport: { width: 320, height: 200 } }), e2 = []; pg.on('pageerror', e => e2.push(String(e)));
  await pg.goto(`http://localhost:${port}/places.html?still&w=320&h=200&place=isles&view=${v}`); await pg.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
  const s = await pg.evaluate(() => window.__stats.place); check(`places.html?place=isles&view=${v} renders: ${s.tris.toLocaleString()} triangles in ${s.draws} draws, ${s.isles} isles, ${s.lost} stones lost, no page errors`, s.tris > 0 && s.isles === 5 && e2.length === 0, e2.slice(0, 2)); await pg.close(); }
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
