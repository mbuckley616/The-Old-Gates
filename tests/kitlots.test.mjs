// The Gatelands' lots widened to whole bays on the new look (Session 1065; card F6, Michael's C on DECISION #396). On ?look=new a
// Gatelander settlement's homes and ordinary shops take the kit's bays (PKIT.gl.BAYS): a village's are cottages, a town's, port's
// or city's townhouses and merchants' houses. Each such lot's width is exactly its bays and its end piers, it keeps its centre,
// its depth, its door and its id (a house you own is still yours, whichever look you load it in), and it stands 0.9 m or more
// clear of every other lot's walls. Settlements of the other islands, and the old look, are as they were.
import { boot, check } from './lib/game.mjs';

const pickSites = () => { const nat = t => nationKeyOf(...cellOf(t.x, t.z)), d = siteAnywhere('dunmore'), A = allSites();
  const near = (n, k, m) => A.filter(t => nat(t) === n && t.kind === k && t.pad > 0).sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z)).slice(0, m);
  return [...near('gatelands', 'town', 2), ...near('gatelands', 'village', 2), ...near('gatelands', 'port', 1), ...near('gatelands', 'city', 1), ...near('mark', 'town', 1)].map(t => ({ id: t.id, kind: t.kind, nat: nat(t) })); };
const survey = ids => { const out = {};
  for (const id of ids) { const site = allSites().find(t => t.id === id); if (!WORLD.settle.get(id)) genSettlement(site); const S = WORLD.settle.get(id); if (!S) { out[id] = null; continue; }
    out[id] = { houses: S.houses.filter(h => h.siteId === id).map(h => ({ id: h.id, type: h.type, w: h.w, d: h.d, x: +h.doorX.toFixed(3), z: +h.doorZ.toFixed(3), kit: h.kit })),
      lots: S.sol.filter(s => s.hid).map(s => ({ hid: s.hid, cx: s.cx, cz: s.cz, rx: s.rx, rz: s.rz, c: s.c, s: s.s })) }; }
  return out; };

// the old look: the plan as it was
const g0 = await boot(); await g0.intoWorld();
const sites = await g0.page.evaluate(pickSites);
check('two towns, two villages, a port and a city of the Gatelands, and a town of the Mark', sites.length === 7 && sites.filter(s => s.nat === 'gatelands').length === 6, sites);
const old = await g0.page.evaluate(survey, sites.map(s => s.id));
check('on the old look no lot takes the kit\'s bays', Object.values(old).every(v => v && v.houses.every(h => !h.kit)) && g0.errs.length === 0, g0.errs);
await g0.close();

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const neu = await page.evaluate(survey, sites.map(s => s.id));
const B = await page.evaluate(() => PKIT.gl.BAYS);
const bw = (k, n) => +(n * B[k].bay + 2 * B[k].end).toFixed(3);
const gl = sites.filter(s => s.nat === 'gatelands'), mk = sites.find(s => s.nat === 'mark');

// the same houses: every id, door and depth of the old look, in the same order
const same = sites.map(s => { const a = old[s.id].houses, b = neu[s.id].houses; const ok = a.length === b.length && a.every((h, i) => h.id === b[i].id && h.type === b[i].type && h.d === b[i].d && Math.hypot(h.x - b[i].x, h.z - b[i].z) < .01);
  return { id: s.id, ok, n: a.length, first: ok ? null : a.map((h, i) => [h.id, b[i] && b[i].id, h.x, b[i] && b[i].x]).find(([p, q, x, y]) => p !== q || Math.abs(x - y) > .01) }; });
check(`every settlement keeps its houses, ids, doors and depths (${same.map(s => s.n).join(', ')} houses)`, same.every(s => s.ok), same.filter(s => !s.ok));

// the widths: whole bays, by kind of settlement and of lot
const rows = gl.flatMap(s => neu[s.id].houses.map(h => ({ ...h, site: s.id, sk: s.kind, w0: old[s.id].houses.find(o => o.id === h.id).w })));
const kit = rows.filter(h => h.kit), share = kit.filter(h => h.type === 'home').length / rows.filter(h => h.type === 'home').length;
const badW = kit.filter(h => h.w !== bw(h.kit.kind, h.kit.bays) || h.kit.bays < B[h.kit.kind].min || h.kit.bays > B[h.kit.kind].max || h.kit.w0 !== h.w0);
check(`each widened lot is exactly its bays and end piers wide (${kit.length} lots)`, kit.length > 40 && badW.length === 0, badW.slice(0, 6));
const badK = kit.filter(h => (h.sk === 'village') !== (h.kit.kind === 'cottage') || (h.sk !== 'village' && (h.type === 'home') !== (h.kit.kind === 'townhouse') && !(h.kit.kind === 'townhouse' && h.type !== 'home')));
check('a village\'s are cottages; a town\'s, port\'s or city\'s homes townhouses and shops merchants\' houses (or a townhouse\'s front)', badK.length === 0, badK.slice(0, 6));
check(`most homes take the bays (${Math.round(share * 100)}%)`, share > .8, { kit: kit.filter(h => h.type === 'home').length, homes: rows.filter(h => h.type === 'home').length });
const special = rows.filter(h => ['church', 'castle', 'guild_f', 'guild_m', 'inn', 'shipwright'].includes(h.type));
check(`churches, keeps, guild halls, inns and the shipwright keep their size (${special.length})`, special.length > 4 && special.every(h => !h.kit && h.w === h.w0), special.filter(h => h.kit || h.w !== h.w0).slice(0, 4));
const wider = kit.filter(h => h.w > h.w0).length, w = kit.map(h => h.w);
check(`the lots grow: ${wider} of ${kit.length} wider than they were, ${Math.min(...w)} to ${Math.max(...w)} m (were ${Math.min(...kit.map(h => h.w0))} to ${Math.max(...kit.map(h => h.w0))})`, wider / kit.length > .7 && Math.max(...w) >= 8, null);
const hist = {}; kit.forEach(h => { const k = `${h.kit.kind} ${h.kit.bays}`; hist[k] = (hist[k] || 0) + 1; }); console.log('  bays:', JSON.stringify(hist));

// clear of one another: a widened lot's walls stand 0.9 m or more from any other lot's (the solids are the lot and 0.15 m)
const corners = l => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => ({ x: l.cx + u * l.rx * l.c + v * l.rz * l.s, z: l.cz - u * l.rx * l.s + v * l.rz * l.c }));
const gap = (a, b) => { const A = corners(a), C = corners(b); let best = -1e9; for (const P of [A, C]) for (let k = 0; k < 2; k++) { const ax = P[k + 1].x - P[k].x, az = P[k + 1].z - P[k].z, L = Math.hypot(ax, az);
  const pa = A.map(q => (q.x * ax + q.z * az) / L), pc = C.map(q => (q.x * ax + q.z * az) / L); best = Math.max(best, Math.min(...pc) - Math.max(...pa), Math.min(...pa) - Math.max(...pc)); } return best; };
const close = []; for (const s of gl) { const L = neu[s.id].lots, K = new Set(neu[s.id].houses.filter(h => h.kit).map(h => h.id));
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if ((K.has(L[i].hid) || K.has(L[j].hid)) && L[i].hid !== L[j].hid) { const d = gap(L[i], L[j]); if (d < .9 - 1e-6) close.push([s.id, L[i].hid, L[j].hid, +d.toFixed(2)]); } }
check('every widened lot stands 0.9 m or more clear of every other lot', close.length === 0, close.slice(0, 6));

// the Mark's town is as it was
check('the Mark\'s town is as on the old look, widths and all', JSON.stringify(old[mk.id].houses) === JSON.stringify(neu[mk.id].houses), null);
check('no errors on the new look', g.errs.length === 0, g.errs);
await g.close();
