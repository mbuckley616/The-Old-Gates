// PROTOTYPE pictures for DECISION: the light and robe armour lines (Michael's B on #156). Not a test: it writes docs/prototypes/armourline-*.png.
import { boot } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await page.evaluate(() => { openInspector(); INSPECTOR.opts.figure = false; INSPECTOR.select('people/foes-on-the-body/bandit'); });
const shot = async (file, line, tiers, view, mode) => {
  const info = await page.evaluate(([line, tiers, view, mode]) => {
    const I = INSPECTOR, S = I.stage; [...S.children].forEach(c => { if (!(c.geometry && c.geometry.type === 'CircleGeometry')) S.remove(c); });
    let tris = []; const n = tiers.length;
    tiers.forEach((t, i) => {
      const m = MATERIALS[t - 1], pc = () => ({ tier: t, fam: line, line, sig: null, metal: m.blade, guard: m.guard, glow: m.glow });
      const gn = personGenome({ name: 'Proto' + i, role: '', people: 'gatelander' }, { key: 'proto' });
      Object.assign(gn, { hat: 'none', dress: false, cloak: false, apron: null, gear: null, extras: [], age: 'adult', child: false, height: 1, build: 1, female: i % 2 === 1,
        cloth: new THREE.Color(0x6a5a44), sleeve: new THREE.Color(0x5e5040), legs: new THREE.Color(0x3a3024), boot: new THREE.Color(line === 'light' ? 0x3a2618 : 0x2a2420),
        eq: { armour: { head: pc(), chest: pc(), hands: pc(), legs: pc(), feet: pc() }, quiver: false, amulet: false } });
      const rig = buildPerson(gn, { noLod: true }); PEOPLE_RIGS.delete(rig);
      const P = mode === 'walk' ? pwWalk(.3, { holds: false }) : pwIdle(0, { holds: false }); pwApply(rig, P);
      rig.root.position.set((i - (n - 1) / 2) * .75, 0, 0); S.add(rig.root);
      const gg = rig.mesh.geometry; tris.push(gg.index ? gg.index.count / 3 : gg.attributes.position.count / 3);
    });
    I.orbit.target.set(0, view === 'close' ? .78 : .62, 0); I.orbit.dist = view === 'close' ? 2.3 : 1.1 + n * .62; I.orbit.theta = view === 'back' ? Math.PI + .3 : view === 'side' ? 1.1 : .3; I.orbit.phi = 1.42;
    for (let i = 0; i < 4; i++) I.frame(performance.now() + i * 40);
    return tris;
  }, [line, tiers, view, mode]);
  await g.frames(2); await page.screenshot({ path: 'docs/prototypes/' + file, timeout: 120000 }); console.log(file, JSON.stringify(info));
};
await shot('armourline-light-tiers.png', 'light', [1, 3, 5, 7, 10], 'front');
await shot('armourline-robe-tiers.png', 'robe', [1, 3, 5, 7, 10], 'front');
await shot('armourline-light-close.png', 'light', [3, 5], 'close');
await shot('armourline-robe-close.png', 'robe', [3, 5], 'close');
await shot('armourline-light-back.png', 'light', [3, 5], 'back');
await shot('armourline-robe-walk.png', 'robe', [3, 5], 'side', 'walk');
console.log('errs', JSON.stringify(g.errs));
await g.close();
