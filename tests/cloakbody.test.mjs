// Your cloak on your body (Session 560, the look half of Michael's B on #148, docs/design/capes-and-cloaks.md). The systems
// builder's back slot (EQ.back, its `cloak` the kind) is read by tpBuild: the six kinds each have a cut and a colour, the
// Aurennais cape cut to the waist with a gold hem, the dark hood and the pilgrim's grey a hood laid on the shoulders, the fur-lined
// a fur collar; a dyed cloak (EQ.back.col) takes its own colour. With nothing in the slot nothing changes. The inspector lists the six.
import { boot, check } from './lib/game.mjs';
// a hex colour as bytes; the bake's shading (personAO) darkens a part by a byte or two
function THREE_C(h) { return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const was = EQ.back, out = {};
  const measure = () => { const R = tpBuild(null, 'gatelander'); if (R.rig) PEOPLE_RIGS.delete(R.rig); const mesh = R.rig.mesh, geo = mesh.geometry, bones = mesh.skeleton.bones;
    const bi = n => bones.findIndex(b => b.name === n), c1 = bi('cloak'), c2 = bi('cloak2'), sI = geo.attributes.skinIndex, col = geo.attributes.color;
    let on1 = 0, on2 = 0; const cols = {}; for (let i = 0; i < sI.count; i++) { const b = sI.getX(i); if (b === c1) on1++; if (b === c2) on2++; if ((b === c1 || b === c2) && col) { const h = new THREE.Color(col.getX(i), col.getY(i), col.getZ(i)).getHexString(); cols[h] = (cols[h] || 0) + 1; } }
    const top = Object.entries(cols).sort((a, b) => b[1] - a[1])[0];
    const o = { bone: c1 >= 0, on1, on2, tris: (geo.index ? geo.index.count : geo.attributes.position.count) / 3, top: top ? top[0] : null, g: { cut: R.rig.g.cloakCut || null, hood: !!R.rig.g.cloakHood, fur: R.rig.g.cloakFur != null, trim: R.rig.g.cloakTrim != null } };
    tpDispose(R); return o; };
  delete EQ.back; out.none = measure(); out.sig0 = tpSig();
  for (const k of Object.keys(TP_CLOAK)) { EQ.back = { slot: 'back', cloak: k, name: 'cloak ' + k }; out[k] = measure(); out[k].colHex = new THREE.Color(TP_CLOAK[k].col).getHexString(); }
  out.sigWool = (EQ.back = { slot: 'back', cloak: 'wool', name: 'cloak wool' }, tpSig());
  EQ.back = { slot: 'back', cloak: 'wool', name: 'cloak wool', col: 0x8a1c1c }; out.dyed = measure(); out.sigDyed = tpSig();
  if (was === undefined) delete EQ.back; else EQ.back = was;
  return out;
});
console.log(JSON.stringify(r));
const near = (a, b) => { if (!a || !b) return false; const A = new THREE_C(a), B = new THREE_C(b); return Math.abs(A[0] - B[0]) + Math.abs(A[1] - B[1]) + Math.abs(A[2] - B[2]) <= 8; };
const K = ['wool', 'hood', 'oilskin', 'fur', 'cape', 'pilgrim'];
check('with nothing in the back slot your body has no cloak, as before', !r.none.bone && r.none.on1 === 0, r.none);
for (const k of K) check(`${k}: a cloak on its own bones, in its own colour (${r[k].tris - r.none.tris} triangles more)`, r[k].bone && r[k].on1 >= 40 && near(r[k].top, r[k].colHex) && r[k].tris - r.none.tris >= 150 && r[k].tris - r.none.tris <= 1200, r[k]);
check('the long cuts hang a lower half; the Aurennais cape stops at the waist (nothing on the lower bone) with a hem', K.filter(k => k !== 'cape').every(k => r[k].on2 >= 40) && r.cape.on2 === 0 && r.cape.g.trim, K.map(k => [k, r[k].on2]));
check('the dark hood and the pilgrim\'s grey have a hood on the shoulders, the fur-lined a fur collar', r.hood.g.hood && r.pilgrim.g.hood && !r.wool.g.hood && r.fur.g.fur && !r.wool.g.fur && r.hood.on1 > r.wool.on1, { hood: r.hood.on1, wool: r.wool.on1 });
check('a dyed cloak takes its own colour', near(r.dyed.top, '8a1c1c'), r.dyed.top);
check('putting a cloak on, or dyeing it, changes the body\'s signature (it is rebuilt)', r.sig0 !== r.sigWool && r.sigWool !== r.sigDyed, null);
const ins = await page.evaluate(() => { openInspector(); return Object.keys(TP_CLOAK).map(k => { const key = 'weapons-and-armour/your-body-in-a-cloak/' + k, e = INSPECTOR.entries.find(x => x.key === key); if (!e) return null; INSPECTOR.select(key); const b = INSPECTOR.built.get(e.id); return b && b.obj ? b.stats.tris : 0; }).concat([EQ.back == null]) /* S569: EQ has held back:null since the systems builder's S552 */; });
check('the inspector lists your body in each of the six, and puts the back slot back as it was', ins.slice(0, 6).every(t => t > 3000) && ins[6], ins);
await inspShots(g, [['weapons-and-armour/your-body-in-a-cloak/fur', 'cloak-fur.png'], ['weapons-and-armour/your-body-in-a-cloak/cape', 'cloak-cape.png'], ['weapons-and-armour/your-body-in-a-cloak/hood', 'cloak-hood.png']]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
