// The light and robe armour lines on the player's body (Session 569; Michael's B on #156 and A on #161, Session 556's
// prototype as shown). A worn piece whose item carries `line` 'light' or 'robe' (the systems builder's, Session 564) is dressed
// by ARMOUR_LINE; every other piece by the heavy kit as before. The robe chest is never the old dress, the line's head is never
// the old cloth hood, and soft boots take the line's leather, not the metal's colour.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  const keep = {}; for (const k in EQ) keep[k] = EQ[k];
  const NAMES = { light: { Helmet: 'Hood', Cuirass: 'Jerkin', Gauntlets: 'Bracers', Greaves: 'Leggings', Boots: 'Soft Boots' }, robe: { Helmet: 'Cowl', Cuirass: 'Robe', Gauntlets: 'Wraps', Greaves: 'Under-robe' } };
  const A = (t, n, ln) => { const it = makeItem(t, ARMOR_TYPES.find(a => a.type === n), null, true); if (ln) { it.line = ln; it.name = MATERIALS[t - 1].name + ' ' + NAMES[ln][n]; } return it; };
  const has = (R, hex) => { const c = new THREE.Color(hex); const C = R.rig.mesh.geometry.attributes.color; let n = 0;
    for (let i = 0; i < C.count; i++) if (Math.abs(C.getX(i) - c.r) + Math.abs(C.getY(i) - c.g) + Math.abs(C.getZ(i) - c.b) < .06) n++; return n; };
  const clear = () => { for (const k of Object.keys(EQ)) EQ[k] = null; EQ.feet = { name: 'Leather Boots' }; };
  const dress = (t, ln) => { clear(); for (const n in NAMES[ln || 'light']) { const it = A(t, n, ln); EQ[it.slot] = it; } };
  const out = { read: {}, bodies: [] };
  // what AR_FROM_EQ reads
  dress(5, 'light'); const AL = AR_FROM_EQ(EQ); dress(5, 'robe'); const AR = AR_FROM_EQ(EQ); dress(5, null); const AH = AR_FROM_EQ(EQ);
  out.read = { light: [AL.chest.fam, AL.chest.line, AL.chest.sig, AL.feet.fam].join('/'), robe: [AR.chest.fam, AR.head.line, AR.feet && AR.feet.fam].join('/'), heavy: [AH.chest.fam, AH.chest.line, AH.chest.sig].join('/') };
  // on the body
  clear(); const R0 = tpBuild(); const bare = R0.rig.tris; tpDispose(R0);
  for (const ln of ['light', 'robe', null]) for (const t of [1, 3, 5, 7, 10]) {
    dress(t, ln); const R = tpBuild(); const gn = R.rig.g || R.rig.genome || null;
    out.bodies.push({ ln: ln || 'heavy', t, tris: R.rig.tris, robe: ln === 'robe' ? has(R, LINE_ROBE[t]) : 0, leather: ln === 'light' ? has(R, armourLineLeather(t)) : 0,
      dressed: gn ? !!gn.dress : null, hat: gn ? gn.hat : null, boot: gn && gn.boot ? gn.boot.getHex() : null });
    tpDispose(R); }
  for (const k in keep) EQ[k] = keep[k];
  out.bare = bare; return out; });
console.log(JSON.stringify(r.read)); for (const b of r.bodies) console.log(JSON.stringify(b)); console.log('bare', r.bare);
const B = (ln, t) => r.bodies.find(b => b.ln === ln && b.t === t);
check('AR_FROM_EQ hands a light piece to its line (no plate mark), a robe set has no feet, and a heavy piece is the kit as before',
  r.read.light === 'light/light//light' && r.read.robe === 'robe/robe/' && r.read.heavy === 'plate//fluted', r.read);
check('every light and robe body is built, heavier than the bare body by 3,000 triangles or more',
  r.bodies.filter(b => b.ln !== 'heavy').every(b => b.tris > r.bare + 3000), r.bodies.map(b => b.ln + b.t + ':' + b.tris).join(' '));
check('the robe is dyed per tier: each tier\'s own cloth is on its body', r.bodies.filter(b => b.ln === 'robe').every(b => b.robe > 200), r.bodies.filter(b => b.ln === 'robe').map(b => b.robe));
check('the light line\'s leather is on its body at every tier', r.bodies.filter(b => b.ln === 'light').every(b => b.leather > 200), r.bodies.filter(b => b.ln === 'light').map(b => b.leather));
const gn = r.bodies.find(b => b.dressed !== null);
if (gn) {
  check('a robe is never the old dress, and the line\'s head is never the cloth hood or the bowl helm', r.bodies.filter(b => b.ln !== 'heavy').every(b => b.dressed === false && b.hat === 'none'), r.bodies.map(b => [b.ln, b.t, b.dressed, b.hat].join(':')));
  check('soft boots take the line\'s leather, not the metal', [1, 3, 5, 7, 10].every(t => B('light', t).boot !== null), r.bodies.filter(b => b.ln === 'light').map(b => b.boot));
}
check('the heavy kit is unchanged by the lines (the plate and mail bodies build as before)', r.bodies.filter(b => b.ln === 'heavy').every(b => b.tris > r.bare + 3000), r.bodies.filter(b => b.ln === 'heavy').map(b => b.tris));

// the inspector carries both lines, five tiers each, and builds them
const ins = await page.evaluate(() => { openInspector(); const E = INSPECTOR.entries.filter(e => /Your body in (light armour|robes)/.test(e.sub)); const built = [];
  for (const e of E) { INSPECTOR.select(e.id); const b = INSPECTOR.built.get(e.id); built.push(!!(b && b.obj)); } closeInspector(); return { n: E.length, keys: E.map(e => e.key), built }; });
console.log(JSON.stringify(ins.keys));
// two pictures for Michael: Iron and Mithril of each line, on your own body, as the inspector shows them
for (const [file, keys] of [['armourline-ingame-light.png', ['iron', 'mithril']], ['armourline-ingame-robe.png', ['iron', 'mithril']]]) {
  await page.evaluate(([ln, keys]) => { openInspector(); INSPECTOR.opts.figure = false; const sub = ln === 'light' ? 'light-armour' : 'robes';
    const E = k => INSPECTOR.entries.find(e => e.key === 'weapons-and-armour/your-body-in-' + sub + '/' + k); INSPECTOR.pins.length = 0;
    INSPECTOR.pin(E(keys[0]).id); INSPECTOR.select(E(keys[1]).id);
    for (let i = 0; i < 4; i++) INSPECTOR.frame(performance.now() + i * 40); }, [file.includes('light') ? 'light' : 'robe', keys]);
  await g.frames(2); await page.screenshot({ path: 'docs/prototypes/' + file, timeout: 120000 }); await page.evaluate(() => closeInspector()); }
check('the inspector has ten entries for the two lines, and builds each', ins.n === 10 && ins.built.every(Boolean), ins);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
