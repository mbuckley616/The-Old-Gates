// The light and robe lines' rough edges (Session 575; owed since Session 556's prototype): the thigh straps stood off the leg,
// and the shirt's shoulder cap showed through the robe's mantle from the side. Measured on the bind-pose bake with the
// occlusion off, so each part is found by its own colour (its hue, at its own brightness within the bake's small jitter): the straps against the thigh beneath them, and every vertex of
// the shoulder cap against the mantle's surface at its height. The light hood's cape is measured the same way against the
// cap and the jerkin's shoulder lames.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  const keep = {}; for (const k in EQ) keep[k] = EQ[k]; const look0 = worldState.look, pao = PAO.on; PAO.on = false;
  const NAMES = { light: { Helmet: 'Hood', Cuirass: 'Jerkin', Gauntlets: 'Bracers', Greaves: 'Leggings', Boots: 'Soft Boots' }, robe: { Helmet: 'Cowl', Cuirass: 'Robe', Gauntlets: 'Wraps', Greaves: 'Under-robe' } };
  const A = (t, n, ln) => { const it = makeItem(t, ARMOR_TYPES.find(a => a.type === n), null, true); it.line = ln; it.name = MATERIALS[t - 1].name + ' ' + NAMES[ln][n]; return it; };
  const clear = () => { for (const k of Object.keys(EQ)) EQ[k] = null; };
  worldState.look = Object.assign({}, lookDefault('gatelander', playerArchetype, playerName), { tunic: 0xff00ff, breeches: 0x00ffff, hair: 0x00ff00, style: 'bald', beard: false });
  const verts = (R, hex, kt) => { kt = kt || .035; const c = new THREE.Color(hex), G = R.rig.mesh.geometry, P = G.attributes.position, C = G.attributes.color, o = [];
    const ts = c.r + c.g + c.b;
    for (let i = 0; i < C.count; i++) { const x = C.getX(i), y = C.getY(i), z = C.getZ(i), k = (x + y + z) / ts; if (k > 1 - kt && k < 1 + kt && Math.abs(x - k * c.r) + Math.abs(y - k * c.g) + Math.abs(z - k * c.b) < .012 * k * 3) o.push([P.getX(i), P.getY(i), P.getZ(i)]); } return o; };
  // the rings of a lathe, by height: centre and half-widths in x and z (the centre from the extremes: a lathe's seam vertex is doubled)
  const rings = (V, min) => { const m = new Map(); for (const v of V) { const k = Math.round(v[1] * 2000); if (!m.has(k)) m.set(k, []); m.get(k).push(v); }
    return [...m.values()].filter(a => a.length >= (min || 8)).map(a => { const X = a.map(v => v[0]), Z = a.map(v => v[2]), cx = (Math.min(...X) + Math.max(...X)) / 2, cz = (Math.min(...Z) + Math.max(...Z)) / 2;
      return { y: a[0][1], cx, cz, ex: Math.max(...a.map(v => Math.abs(v[0] - cx))), ez: Math.max(...a.map(v => Math.abs(v[2] - cz))) }; }).sort((p, q) => p.y - q.y); };
  // how far a point stands outside a lathe (in its own units of the x half-width); <=0 inside
  const outside = (Rg, v) => { if (Rg.length < 2) return 9; if (v[1] <= Rg[0].y || v[1] >= Rg[Rg.length - 1].y) return -1; let i = 1; while (Rg[i].y < v[1]) i++; const a = Rg[i - 1], b = Rg[i], f = (v[1] - a.y) / (b.y - a.y);
    const cx = a.cx + (b.cx - a.cx) * f, cz = a.cz + (b.cz - a.cz) * f, ex = a.ex + (b.ex - a.ex) * f, ez = a.ez + (b.ez - a.ez) * f;
    return (Math.hypot((v[0] - cx) / ex, (v[2] - cz) / ez) - 1) * ex; };
  const sleeve = new THREE.Color(0xff00ff).multiplyScalar(.9).getHex();
  const out = { straps: [], mantle: [], cape: [] };
  for (const t of [1, 3, 5, 7, 10]) {
    // the thigh straps: each strap ring's inner edge against the thigh's own surface at that height, on that side
    clear(); EQ.legs = A(t, 'Greaves', 'light'); let R = tpBuild();
    const lea = new THREE.Color(armourLineLeather(t)).multiplyScalar(.62).getHex(), S = verts(R, lea), L = verts(R, 0x00ffff);
    const legTop = Math.max(...L.map(v => v[1]));
    for (const sd of [1, -1]) { const SS = S.filter(v => v[0] * sd > 0 && v[1] < legTop - .04), LL = L.filter(v => v[0] * sd > 0);
      const ys = [...new Set(SS.map(v => Math.round(v[1] * 100)))]; const bands = []; for (const y of ys) { if (!bands.some(b => Math.abs(b - y) <= 3)) bands.push(y); }
      for (const yb of bands) { const B = SS.filter(v => Math.abs(v[1] * 100 - yb) <= 3); if (B.length < 12 || Math.max(...B.map(v => v[1])) - Math.min(...B.map(v => v[1])) > .02) continue; /* a strap is a ring of 14, .016 tall; a stray vertex of the same colour is not */ const y0 = B.reduce((s, v) => s + v[1], 0) / B.length, LR = rings(LL), up = LR.filter(q => q.y > y0), dn = LR.filter(q => q.y < y0);
        // the thigh is a lathe with rings only at its ends: its axis runs through their centres, and its surface here is the
        // line between its widest ring above and below; each strap vertex is measured from that axis
        const hi = up.reduce((m, q) => q.ex > m.ex ? q : m, up[0]), lo = dn.reduce((m, q) => q.ex > m.ex ? q : m, dn[0]);
        const ax = [hi.cx - lo.cx, hi.y - lo.y, hi.cz - lo.cz], al = Math.hypot(...ax), u = ax.map(a => a / al);
        const meas = v => { const d = [v[0] - lo.cx, v[1] - lo.y, v[2] - lo.cz], f = d[0] * u[0] + d[1] * u[1] + d[2] * u[2];
          const r = Math.hypot(d[0] - f * u[0], d[1] - f * u[1], d[2] - f * u[2]), ex = lo.ex + (hi.ex - lo.ex) * f / al; return r - ex; };
        const ds = B.map(meas); const inner = Math.min(...ds), outer = Math.max(...ds);
        out.straps.push({ t, sd, y: +y0.toFixed(3), gap: +inner.toFixed(4), proud: +outer.toFixed(4) }); } }
    tpDispose(R);
    // the robe's mantle against the shoulder cap under it
    clear(); EQ.chest = A(t, 'Cuirass', 'robe'); R = tpBuild();
    const dk = new THREE.Color(LINE_ROBE[t]).multiplyScalar(.7).getHex(), cap = verts(R, sleeve), top = Math.max(...cap.map(v => v[1])), M = rings(verts(R, dk).filter(v => v[1] > top - .2));
    const worst = Math.max(...cap.map(v => outside(M, v))), n = cap.filter(v => outside(M, v) > .002).length;
    out.mantle.push({ t, rings: M.length, cap: cap.length, through: n, worst: +worst.toFixed(4) }); tpDispose(R);
    // the light hood's cape against the cap and the jerkin's shoulder lames
    clear(); EQ.head = A(t, 'Helmet', 'light'); EQ.chest = A(t, 'Cuirass', 'light'); R = tpBuild();
    const le = new THREE.Color(armourLineLeather(t)), hc = le.clone().lerp(new THREE.Color(0x2a3424), .5).getHex();
    const capeV = verts(R, hc, .1).filter(v => v[1] < Math.max(...verts(R, hc, .1).map(q => q[1])) - .25), Cp = rings(capeV, 18); /* the cape is a lathe of 18: a full ring, not a stray vertex of the same leather */
    const under = verts(R, le.getHex()).concat(verts(R, le.clone().multiplyScalar(.62).getHex())).concat(cap.length ? verts(R, sleeve) : []).filter(v => Math.abs(v[0]) > .1);
    const w2 = Cp.length > 1 ? Math.max(...under.map(v => outside(Cp, v))) : null;
    out.cape.push({ t, rings: Cp.length, through: Cp.length > 1 ? under.filter(v => outside(Cp, v) > .002).length : null, worst: w2 != null ? +w2.toFixed(4) : null }); tpDispose(R);
  }
  for (const k in keep) EQ[k] = keep[k]; worldState.look = look0; PAO.on = pao; return out; });
for (const s of r.straps) console.log('strap', JSON.stringify(s));
for (const m of r.mantle) console.log('mantle', JSON.stringify(m));
for (const c of r.cape) console.log('cape', JSON.stringify(c));
// the pictures: Iron in each line from the side (the robe pinned beside the light set), at the shoulders and at the thighs
const shot = process.env.ARMOURFIT_SHOT || 'after';
for (const [part, ty, dist] of [['shoulders', 1.25, 2.6], ['thighs', .7, 2.6]]) {
  await page.evaluate(([ty, dist]) => { openInspector(); Object.assign(INSPECTOR.opts, { figure: false, anim: false });
    const E = k => INSPECTOR.entries.find(e => e.key === 'weapons-and-armour/' + k); INSPECTOR.pins.length = 0;
    INSPECTOR.pin(E('your-body-in-robes/iron').id); INSPECTOR.select(E('your-body-in-light-armour/iron').id);
    for (let i = 0; i < 3; i++) INSPECTOR.frame(performance.now() + i * 40);
    Object.assign(INSPECTOR.orbit, { theta: 1.15, phi: 1.5, dist }); INSPECTOR.orbit.target.y = ty;
    for (let i = 0; i < 3; i++) INSPECTOR.frame(performance.now() + i * 40); }, [ty, dist]);
  await g.frames(2); await page.screenshot({ path: `docs/prototypes/armourfit-${shot}-${part}.png`, timeout: 120000 }); await page.evaluate(() => closeInspector()); }
check('both thigh straps on each leg at every tier are found', r.straps.length === 20, r.straps.length);
check('every thigh strap sits on the leg: its inner edge no more than 1 mm off the thigh', r.straps.every(s => s.gap <= .001), r.straps.map(s => s.gap));
check('and stands no more than 1.4 cm proud of it', r.straps.every(s => s.proud <= .014), r.straps.map(s => s.proud));
check('the mantle is found, a lathe of four rings or more', r.mantle.every(m => m.rings >= 4 && m.cap > 20), r.mantle);
check('no vertex of the shoulder cap stands through the robe\'s mantle, at any tier', r.mantle.every(m => m.through === 0), r.mantle);
check('the shoulder cap and the jerkin\'s lames stay under the light hood\'s cape', r.cape.every(c => c.through === 0), r.cape);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
