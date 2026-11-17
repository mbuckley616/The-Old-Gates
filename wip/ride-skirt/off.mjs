import fs from 'fs';
const D = JSON.parse(fs.readFileSync('wip/ride-skirt/dump.json'));
const { bind, index, ids, LAP, HANG, R, mid, legs } = D; const N = bind.length / 3;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = a => Math.hypot(...a);
const P = (A, i) => [A[i * 3], A[i * 3 + 1], A[i * 3 + 2]];
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const thOf = i => Math.atan2(Math.abs(bind[i * 3] - mid[0]), -(bind[i * 3 + 2] - mid[2]));
export function outOfLegs(q, C) { for (const L of legs) { let u = sub(q, L.a); const t = dot(u, L.d) / L.len; if (t < (C.t0 || 0) || t >= 1) continue; const Rr = L.r[Math.floor(t * 12)] + .025; if (!L.r[Math.floor(t * 12)]) continue;
  u = [u[0] - L.d[0] * t * L.len, u[1] - L.d[1] * t * L.len, u[2] - L.d[2] * t * L.len]; const rr = len(u); if (rr < Rr && rr > 1e-5) { const k = (Rr - rr) / rr; q[0] += u[0] * k; q[1] += u[1] * k; q[2] += u[2] * k; } } return q; }
// weld
const rep = new Int32Array(N).fill(-1), weld = new Map();
for (const i of ids) { const k = Math.round(bind[i * 3] * 2e3) + ',' + Math.round(bind[i * 3 + 1] * 2e3) + ',' + Math.round(bind[i * 3 + 2] * 2e3); if (!weld.has(k)) weld.set(k, i); rep[i] = weld.get(k); }
const E = new Map(); for (let t = 0; t < index.length; t += 3) for (let e = 0; e < 3; e++) { const a = index[t + e], b = index[t + (e + 1) % 3]; const k = Math.min(a, b) * N + Math.max(a, b); if (!E.has(k)) E.set(k, [a, b]); }
export function measure(X, label) { const out = []; for (const [a, b] of E.values()) { const d = len(sub(P(X, a), P(X, b))), r = len(sub(P(R, a), P(R, b))); out.push([d, r ? d / r : 0, a, b]); }
  out.sort((x, y) => y[0] - x[0]); const info = i => [+(thOf(i) * 180 / Math.PI).toFixed(0), ...P(bind, i).map((x, k) => +(x - mid[k]).toFixed(3))];
  console.log(label, 'max', out[0][0].toFixed(3), 'r', Math.max(...out.map(o => o[1])).toFixed(1), '>10cm', out.filter(o => o[0] > .1).length, '>15', out.filter(o => o[0] > .15).length, 'r>2', out.filter(o => o[1] > 2).length, 'r>3', out.filter(o => o[1] > 3).length);
  return out; }
export { D, rep, E, P, thOf, ss, N, sub, len };
// baseline: S2300
if (process.argv[2] === 'base') { const X = new Float64Array(N * 3); const C = { back: 100 * Math.PI / 180, side: 150 * Math.PI / 180 };
  for (const i of ids) { const f = 1 - ss(C.back, C.side, thOf(i)); for (let k = 0; k < 3; k++) X[i * 3 + k] = LAP[i * 3 + k] * (1 - f) + HANG[i * 3 + k] * f; }
  const o = measure(X, 'S2300'); for (const r of o.slice(0, 6)) console.log(r[0].toFixed(3), r[1].toFixed(1), [r[2], r[3]].map(i => [rep[i], +(thOf(i) * 180 / Math.PI).toFixed(0), ...P(bind, i).map((x, k) => +(x - mid[k]).toFixed(3)), 'lap', ...sub(P(LAP, i), P(R, i)).map(x => +x.toFixed(2)), 'hang', ...sub(P(HANG, i), P(R, i)).map(x => +x.toFixed(2))])); }
