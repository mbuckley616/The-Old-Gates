// The town guards in the armour kit (Session 395, Michael's C on decision #87): by the town's fortune, Wooden lamellar where
// prosperity is under 40, Iron mail anywhere better off, Steel plate for a captain; the guard's own boots, no bowl helm.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const unit = await page.evaluate(() => {
  const site = WORLD.siteAnywhere('dunmore'), st = WORLD.TS(site), keep = st.p, out = {};
  const gen = (role, p, key) => { st.p = p; const gn = personGenome({ role, name: 'Testguard' }, { nation: 'gatelands', key: key === undefined ? 'dunmore' : key });
    const A = gn.eq && gn.eq.armour; return { fam: A && A.chest && A.chest.fam, head: A && A.head && A.head.fam, feet: A ? A.feet : 'none', hat: gn.hat, tier: gn.guardTier || 0, cloth: gn.cloth.getHex() }; };
  out.poor = gen('Guard', 30); out.mid = gen('Guard', 55); out.rich = gen('Guard', 85); out.captain = gen('captain', 30);
  out.watch = gen('night watch', 30); out.farmer = gen('farmer', 30); out.nokey = gen('Guard', 30, '');
  // the same guard in the same place keeps every other trait: only the kit differs from a genome with the rule skipped
  st.p = 55; const a = personGenome({ role: 'Guard', name: 'Testguard' }, { nation: 'gatelands', key: 'dunmore' }), sa = WORLD.siteAnywhere; WORLD.siteAnywhere = () => null;
  let b; try { b = personGenome({ role: 'Guard', name: 'Testguard' }, { nation: 'gatelands', key: 'dunmore' }); } finally { WORLD.siteAnywhere = sa; }
  out.skipped = !(b.eq && b.eq.armour);
  out.same = ['style', 'beard', 'female', 'height', 'build', 'phase'].every(k => JSON.stringify(a[k]) === JSON.stringify(b[k]));
  // the baked figure
  const tri = (role, p) => { st.p = p; const gn = personGenome({ role, name: 'Testguard' }, { nation: 'gatelands', key: 'dunmore' }); const r = buildPerson(gn, {}); const o = { tris: r.tris, lo: r.trisLo, bones: r.mesh.skeleton.bones.length };
    PEOPLE_RIGS.delete(r); r.mesh.geometry.dispose(); if (r.geoLo) r.geoLo.dispose(); return o; };
  out.tris = { today: (() => { st.p = 55; const gn = personGenome({ role: 'Guard', name: 'Testguard' }, { nation: 'gatelands', key: '' }); const r = buildPerson(gn, {}); const o = { tris: r.tris, lo: r.trisLo }; PEOPLE_RIGS.delete(r); r.mesh.geometry.dispose(); if (r.geoLo) r.geoLo.dispose(); return o; })(),
    poor: tri('Guard', 30), mid: tri('Guard', 55), captain: tri('captain', 55) };
  st.p = keep; return out; });
check('a poor town\'s guard wears Wooden lamellar, a middling and a rich one\'s Iron mail', unit.poor.fam === 'lamellar' && unit.mid.fam === 'mail' && unit.rich.fam === 'mail', unit);
check('a captain wears Steel plate whatever the town', unit.captain.fam === 'plate' && unit.captain.tier === 4, unit.captain);
check('the kit\'s helm replaces the bowl helm, and the guard keeps his own boots', unit.poor.head === 'lamellar' && unit.poor.hat === 'none' && unit.poor.feet === null, unit.poor);
check('the night watch is armoured too; a farmer, and a guard of no place, are not', unit.watch.fam === 'lamellar' && !unit.farmer.fam && !unit.nokey.fam && unit.nokey.hat === 'helm', unit);
check('every other trait of the guard is unchanged by the rule', unit.same && unit.skipped && !!unit.mid.fam, unit.same);
check('the armoured guard is 7,000–12,000 triangles, its distant copy under 6,500; still the people\'s bones', [unit.tris.poor, unit.tris.mid, unit.tris.captain].every(o => o.tris >= 7000 && o.tris <= 12000 && o.lo < 6500 && o.bones >= 16), unit.tris);

// in a town: Dunmore's guards on their rigs
await g.settle('dunmore');
const town = await page.evaluate(() => { forceTime(12); const S = WORLD.settle.get('dunmore'); for (let i = 0; i < 20; i++) WORLD.tick(1 / 60, performance.now());
  const p = WORLD.prosperity(S.site); const rigs = [...PEOPLE_RIGS];
  const G = WORLD.guardsOf(S).map(n => { const r = rigs.find(r => r.root === n.g); return { name: n.def.name, type: n.sched.type, fam: r && r.g.eq && r.g.eq.armour ? r.g.eq.armour.chest.fam : null, tris: r && r.tris }; });
  return { p, G }; });
const want = town.p < 40 ? 'lamellar' : 'mail';
check(`Dunmore (prosperity ${town.p}) puts its guards in ${want}`, town.G.length >= 1 && town.G.every(x => x.fam === want), town);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
