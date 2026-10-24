// The Gatelands' lots widened to whole bays on the new look (Session 1065; card F6, Michael's C on DECISION #396). On ?look=new a
// Gatelander settlement's homes and ordinary shops take the kit's bays (PKIT.gl.BAYS): a village's are cottages, a town's, port's
// or city's townhouses and merchants' houses. Each such lot's width is exactly its bays and its end piers, it keeps its centre,
// its depth, its door (moved along the front into its bay since Session 1072) and its id (a house you own is still yours, whichever look you load it in), and it stands 0.9 m or more
// clear of every other lot's walls. Since Session 1126 (Michael's B on #408) a town's townhouse or merchant's house grows back
// into its yard to 8 m deep where it fits, its front and door kept. Since Session 1286 a Markish town's homes and shops are the kit's
// halls (tests/kitislands), their ids and doors kept and their lots deeper; Aurenne's settlements, and the old look, are as they were.
import fs from 'fs';
import { boot, check } from './lib/game.mjs';

const pickSites = () => { const nat = t => nationKeyOf(...cellOf(t.x, t.z)), d = siteAnywhere('dunmore'), A = allSites();
  const near = (n, k, m) => A.filter(t => nat(t) === n && t.kind === k && t.pad > 0).sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z)).slice(0, m);
  return [...near('gatelands', 'town', 2), ...near('gatelands', 'village', 2), ...near('gatelands', 'port', 1), ...near('gatelands', 'city', 1), ...near('mark', 'town', 1)].map(t => ({ id: t.id, kind: t.kind, nat: nat(t) })); };
const survey = ids => { const out = {};
  for (const id of ids) { const site = allSites().find(t => t.id === id); if (!WORLD.settle.get(id)) genSettlement(site); const S = WORLD.settle.get(id); if (!S) { out[id] = null; continue; }
    out[id] = { houses: S.houses.filter(h => h.siteId === id).map(h => ({ id: h.id, type: h.type, w: h.w, d: h.d, x: +h.doorX.toFixed(3), z: +h.doorZ.toFixed(3), yaw: h.exitYaw, kit: h.kit })),
      innPlot: !!(S.plots || []).find(P => P.type === 'inn'), lots: S.sol.filter(s => s.hid).map(s => ({ hid: s.hid, cx: s.cx, cz: s.cz, rx: s.rx, rz: s.rz, c: s.c, s: s.s })) }; }
  return out; };

// the old look: the plan as it was
const g0 = await boot({ look: 'old' }); await g0.intoWorld();
const sites = await g0.page.evaluate(pickSites);
check('two towns, two villages, a port and a city of the Gatelands, and a town of the Mark', sites.length === 7 && sites.filter(s => s.nat === 'gatelands').length === 6, sites);
const old = await g0.page.evaluate(survey, sites.map(s => s.id));
check('on the old look no lot takes the kit\'s bays', Object.values(old).every(v => v && v.houses.every(h => !h.kit)) && g0.errs.length === 0, g0.errs);
await g0.close();

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const neu = await page.evaluate(survey, sites.map(s => s.id));
const B = await page.evaluate(() => PKIT.gl.BAYS), CL = await page.evaluate(() => ({ 2: PKIT.gl.churchLen(2), 3: PKIT.gl.churchLen(3) }));
const bw = (k, n) => +(n * B[k].bay + 2 * B[k].end).toFixed(3);
const gl = sites.filter(s => s.nat === 'gatelands'), mk = sites.find(s => s.nat === 'mark');

// the same houses: every id, door and depth of the old look, in the same order
const same = sites.map(s => { const a = old[s.id].houses, b = neu[s.id].houses; const one = (h, i) => { const k = b[i].kit ? b[i].kit.door || 0 : 0, tx = -Math.sin(h.yaw), tz = -Math.cos(h.yaw); /* a kit house's door stands in its bay (Session 1072), k along the front */
    const hall = b[i].kit && b[i].kit.kind === 'guildhall'; /* a guild hall takes the kit hall's 9 m (Session 1083), its front kept */
    const inn = b[i].kit && b[i].kit.inn, kch = b[i].kit && b[i].kit.kind === 'church'; /* a town's church takes the kit church's size (Session 1127), its front kept */ /* a village's inn takes the farmhouse's 6.2 m (Session 1086), its front kept */
    return h.id === b[i].id && h.type === b[i].type && (hall ? b[i].d === 9 : inn ? b[i].d === 6.2 : kch ? b[i].d === (b[i].kit.side ? 8.4 : CL[b[i].kit.bays]) : b[i].kit && b[i].kit.kind === 'markhall' ? b[i].kit.d0 === h.d && b[i].d > h.d : b[i].kit && b[i].kit.d0 ? b[i].kit.d0 === h.d && b[i].d > h.d && b[i].d <= 8 : h.d === b[i].d) && (hall ? (e => Math.abs(e.x * tz - e.z * tx) < .01 && e.x * tx + e.z * tz > -3.51 && e.x * tx + e.z * tz < .01)({ x: b[i].x - h.x - tz * k, z: b[i].z - h.z + tx * k }) : Math.hypot(h.x + tz * k - b[i].x, h.z - tx * k - b[i].z) < .01); }; /* Session 1275: a hall's door is on its lot's own street line, up to 3.5 m behind the old look's, whose hall stood on the 13 by 11 m lot grown about its centre */
  /* Session 1343 (Michael's A on #642): on the new look a Gatelands town's or city's lots are laid round the coaching inn's plot, which
     the old look has not, so its houses move; each keeps its id and its type, in order, and the new ones after them are homes */
  if (neu[s.id].innPlot) { const ok = a.every((h, i) => b[i] && b[i].id === h.id && b[i].type === h.type) && b.slice(a.length).every(h => h.type === 'home'), bad = ok ? -1 : a.findIndex((h, i) => !b[i] || b[i].id !== h.id || b[i].type !== h.type);
    return { id: s.id, ok, n: a.length, nb: b.length, plot: 'inn', first: ok ? null : [a[bad], b[bad]] }; }
  const ok = a.length === b.length && a.every(one), bad = ok ? -1 : a.findIndex((h, i) => !b[i] || !one(h, i)); /* the first house that fails, as it was and as it is */
  return { id: s.id, ok, n: a.length, nb: b.length, first: ok ? null : [a[bad], b[bad]] }; });
check(`every settlement keeps its houses, ids, doors (in their bays) and depths (${same.map(s => s.n).join(', ')} houses; round the coaching inn's plot, ids and types: ${same.filter(s => s.plot).map(s => s.id).join(', ')})`, same.every(s => s.ok), same.filter(s => !s.ok));

// the widths: whole bays, by kind of settlement and of lot
const rows = gl.flatMap(s => neu[s.id].houses.map(h => ({ ...h, site: s.id, sk: s.kind, w0: neu[s.id].innPlot ? (h.kit && h.kit.w0 != null ? h.kit.w0 : h.w) : old[s.id].houses.find(o => o.id === h.id).w }))); /* S1343 — round the coaching inn's plot a lot's width before the bays is its own, not the old look's */
const kit = rows.filter(h => h.kit && h.kit.kind !== 'guildhall' && h.kit.kind !== 'church' && h.kit.kind !== 'coachinn' && !h.kit.inn), share = kit.filter(h => h.type === 'home').length / rows.filter(h => h.type === 'home').length;
const badW = kit.filter(h => h.w !== bw(h.kit.kind, h.kit.bays) || h.kit.bays < B[h.kit.kind].min || h.kit.bays > B[h.kit.kind].max || h.kit.w0 !== h.w0);
check(`each widened lot is exactly its bays and end piers wide (${kit.length} lots)`, kit.length > 40 && badW.length === 0, badW.slice(0, 6));
const badK = kit.filter(h => (h.sk === 'village') !== (h.kit.kind === 'cottage') || (h.sk !== 'village' && (h.type === 'home') !== (h.kit.kind === 'townhouse') && !(h.kit.kind === 'townhouse' && h.type !== 'home')));
check('a village\'s are cottages; a town\'s, port\'s or city\'s homes townhouses and shops merchants\' houses (or a townhouse\'s front)', badK.length === 0, badK.slice(0, 6));
check(`most homes take the bays (${Math.round(share * 100)}%)`, share > .8, { kit: kit.filter(h => h.type === 'home').length, homes: rows.filter(h => h.type === 'home').length });
const special = rows.filter(h => ['castle', 'shipwright'].includes(h.type) || (h.type === 'church' && h.sk === 'village') || (h.type === 'inn' && h.sk !== 'village' && !(h.kit && h.kit.kind === 'coachinn'))); /* S1343 — the coaching inn is tests/townplots' */
check(`a village's church, keeps, a town's inns and the shipwright keep their size (${special.length})`, special.length > 4 && special.every(h => !h.kit && h.w === h.w0), special.filter(h => h.kit || h.w !== h.w0).slice(0, 4));
// a village's inn (Session 1086, Michael's 1 A on #320): the kit's farmhouse, three bays (10.5 m) or two (7.4 m), 6.2 m deep, slid 0.6 m at most
const vinns = rows.filter(h => h.type === 'inn' && h.sk === 'village'), badI = vinns.filter(h => !h.kit || h.kit.kind !== 'farmhouse' || !h.kit.inn || h.w !== bw('farmhouse', h.kit.bays) || h.d !== 6.2 || Math.abs(h.kit.slide) > .6);
check(`each village's inn is the kit's farmhouse (${vinns.map(h => `${h.kit && h.kit.bays} bays, slid ${h.kit && h.kit.slide} m`).join('; ')})`, vinns.length >= 2 && badI.length === 0, badI.slice(0, 4));
// the town church (Session 1127, Michael's B on #410): a town's, port's or city's is the kit's church with its west tower where it fits,
// end-on (8.4 m wide, 27.4 or 22.6 m deep) or side-on (27.4 or 22.6 wide, 8.4 deep), slid along its front by 3 m at most
const tch = rows.filter(h => h.type === 'church' && h.sk !== 'village'), kch = tch.filter(h => h.kit), badC = kch.filter(h => h.kit.kind !== 'church' || ![2, 3].includes(h.kit.bays) || Math.abs(h.kit.slide) > 3
  || (h.kit.side ? h.w !== CL[h.kit.bays] || h.d !== 8.4 : h.w !== 8.4 || h.d !== CL[h.kit.bays]));
check(`the towns' churches are the kit's church where it fits: ${kch.length} of ${tch.length} (${kch.map(h => `${h.site} ${h.kit.bays} bays ${h.kit.side ? 'side-on' : 'end-on'}`).join('; ')})`, kch.length >= 1 && badC.length === 0, badC.slice(0, 4));
// the guild halls (Session 1083, Michael's C on #352): a town's or city's is the kit's hall, 14.4 by 9 m, slid along its front by 0.7 m at most
const halls = rows.filter(h => h.type === 'guild_f' || h.type === 'guild_m'), badH = halls.filter(h => !h.kit || h.kit.kind !== 'guildhall' || h.w !== 14.4 || h.d !== 9 || Math.abs(h.kit.slide) > .7 || h.kit.guild !== (h.type === 'guild_m' ? 'mages' : 'fighters'));
check(`every guild hall of the Gatelands' towns and city is the kit's hall, 14.4 by 9 m (${halls.length}; slid ${[...new Set(halls.map(h => h.kit && h.kit.slide))].join(', ')} m)`, halls.length >= 4 && badH.length === 0, badH.slice(0, 4));
const wider = kit.filter(h => h.w > h.w0).length, w = kit.map(h => h.w);
check(`the lots grow: ${wider} of ${kit.length} wider than they were, ${Math.min(...w)} to ${Math.max(...w)} m (were ${Math.min(...kit.map(h => h.w0))} to ${Math.max(...kit.map(h => h.w0))})`, wider / kit.length > .7 && Math.max(...w) >= 8, null);
// the depth (Session 1126, Michael's B on #408): a town's townhouses and merchants' houses grow back into their yards to 8 m where
// the row behind allows, else as deep as fits; cottages, halls and inns are untouched by it
const tk = kit.filter(h => h.sk !== 'village'), deep = tk.filter(h => h.kit.d0), d8 = tk.filter(h => h.d === 8);
const badD = deep.filter(h => h.d > 8 || h.d <= h.kit.d0 || Math.abs(h.d * 4 - Math.round(h.d * 4)) > 1e-6) .concat(kit.filter(h => h.sk === 'village' && h.kit.d0));
check(`a town's houses grow back toward 8 m deep: ${deep.length} of ${tk.length} deeper, ${d8.length} at the full 8 m (were ${Math.min(...tk.map(h => h.kit.d0 || h.d))} to ${Math.max(...tk.map(h => h.kit.d0 || h.d))} m)`,
  deep.length / tk.length > .5 && d8.length > tk.length / 4 && badD.length === 0, badD.slice(0, 4));
const hist = {}; kit.forEach(h => { const k = `${h.kit.kind} ${h.kit.bays}`; hist[k] = (hist[k] || 0) + 1; }); console.log('  bays:', JSON.stringify(hist));

// clear of one another: a widened lot's walls stand 0.9 m or more from any other lot's (the solids are the lot and 0.15 m)
const corners = l => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => ({ x: l.cx + u * l.rx * l.c + v * l.rz * l.s, z: l.cz - u * l.rx * l.s + v * l.rz * l.c }));
const gap = (a, b) => { const A = corners(a), C = corners(b); let best = -1e9; for (const P of [A, C]) for (let k = 0; k < 2; k++) { const ax = P[k + 1].x - P[k].x, az = P[k + 1].z - P[k].z, L = Math.hypot(ax, az);
  const pa = A.map(q => (q.x * ax + q.z * az) / L), pc = C.map(q => (q.x * ax + q.z * az) / L); best = Math.max(best, Math.min(...pc) - Math.max(...pa), Math.min(...pa) - Math.max(...pc)); } return best; };
const close = []; for (const s of gl) { const L = neu[s.id].lots, K = new Set(neu[s.id].houses.filter(h => h.kit).map(h => h.id));
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if ((K.has(L[i].hid) || K.has(L[j].hid)) && L[i].hid !== L[j].hid) { const d = gap(L[i], L[j]); if (d < .9 - 1e-6) close.push([s.id, L[i].hid, L[j].hid, +d.toFixed(2)]); } }
check('every widened lot stands 0.9 m or more clear of every other lot', close.length === 0, close.slice(0, 6));

// the Mark's town (Session 1286): its homes and shops are the kit's halls where they fit (tests/kitislands), their ids and doors kept
// above and their lots deeper; every other house is as on the old look, widths and all
const mkHalls = neu[mk.id].houses.filter(h => h.kit && h.kit.kind === 'markhall').length, mkRest = (a => a.filter((h, i) => !(neu[mk.id].houses[i].kit && neu[mk.id].houses[i].kit.kind === 'markhall')))(old[mk.id].houses);
check(`the Mark's town has ${mkHalls} kit halls, and its other ${mkRest.length} houses are as on the old look, widths and all`, mkHalls > 0 && JSON.stringify(mkRest) === JSON.stringify(neu[mk.id].houses.filter(h => !(h.kit && h.kit.kind === 'markhall'))), null);
// a picture of a kit church in its town at noon, from over its street, 24 m up, 26 m out and 22 m to one side (docs/prototypes/kit-church-ingame.png)
if (kch.length) { const c = kch[0]; const url = await page.evaluate(([site, id]) => { forceTime(12); const S = WORLD.settle.get(site), h = S.houses.find(h => h.id === id), fx = -Math.sin(h.exitYaw), fz = -Math.cos(h.exitYaw), ex = Math.cos(h.exitYaw), ez = -Math.sin(h.exitYaw);
    const L = h.kit.side ? 4 : h.d / 2, tx = h.doorX - fx * L, tz = h.doorZ - fz * L, X = tx + fx * 26 + ex * 22, Z = tz + fz * 26 + ez * 22, cv = REN.domElement, sc = WORLD.scene;
    const cam = new THREE.PerspectiveCamera(50, cv.width / cv.height, .1, 600); cam.position.set(X, WORLD.worldH(X, Z) + 24, Z); cam.lookAt(tx, WORLD.worldH(tx, tz) + 6, tz);
    CAM.position.copy(cam.position); WORLD.tick(1 / 60, performance.now()); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); return o.toDataURL('image/png'); }, [c.site, c.id]);
  fs.writeFileSync(new URL('../docs/prototypes/kit-church-ingame.png', import.meta.url), Buffer.from(url.split(',')[1], 'base64')); console.log(`  (picture: docs/prototypes/kit-church-ingame.png, ${c.site})`); }
check('no errors on the new look', g.errs.length === 0, g.errs);
await g.close();
