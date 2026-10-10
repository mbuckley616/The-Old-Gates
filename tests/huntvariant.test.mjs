// A guild hunt counts the creature's variants (Session 667, the critic's s477 note: `onKill` counted a foe for *Hunt 4
// Wolves* only if its name was the target's exactly). A variant foe is named with its variant's label (`applyVariantToDef`:
// *Greater Wolf*, *Shadow Skeleton*), so a Greater Wolf met on the hunt's own ground did not count. A zone foe now carries
// the creature it was built from (`baseName`), and a hunt counts either name. A Dire Wolf is a kind of its own and still
// does not count for Wolves. Each foe is built by `buildZoneEnemy` and killed through `killZoneEnemy`, as a blow kills one.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const G = gstate();
  const hunt = (target) => { G.guild_f.active = { id: 'guild_f:test:1', g: 'guild_f', kind: 'hunt', target, need: 9, have: 0, gold: 60, desc: '', short: 'Hunt' }; return G.guild_f.active; };
  const kill = (type, variant) => { const e = buildZoneEnemy(WORLD.scene, [], px + 4, pz + 4, type, variant); if (!e.mesh.parent) WORLD.scene.add(e.mesh); e.mesh.visible = false;
    killZoneEnemy(e, WORLD.scene); return { name: e.name, baseName: e.baseName }; };
  const out = {};
  let t = hunt('Wolf');
  out.wolf = [kill('Wolf', null), t.have]; out.greaterWolf = [kill('Wolf', 'greater'), t.have];
  out.dire = [kill('Dire Wolf', null), t.have]; out.greaterGoblin = [kill('Goblin', 'greater'), t.have];
  t = hunt('Skeleton');
  out.shadowSkel = [kill('Skeleton', 'shadow'), t.have]; out.skel = [kill('Skeleton', null), t.have];
  G.guild_f.active = null;
  return out;
});
console.log(JSON.stringify(r));
check('a plain Wolf counts for a Wolf hunt (1)', r.wolf[1] === 1 && r.wolf[0].name === 'Wolf', r.wolf);
check('a Greater Wolf counts for a Wolf hunt (2)', r.greaterWolf[1] === 2 && r.greaterWolf[0].name === 'Greater Wolf' && r.greaterWolf[0].baseName === 'Wolf', r.greaterWolf);
check('a Dire Wolf, a kind of its own, does not (still 2)', r.dire[1] === 2 && r.dire[0].baseName === 'Dire Wolf', r.dire);
check('a Greater Goblin does not count for Wolves (still 2)', r.greaterGoblin[1] === 2, r.greaterGoblin);
check('a Shadow Skeleton counts for a Skeleton hunt, and a plain one after it (1, 2)', r.shadowSkel[1] === 1 && r.shadowSkel[0].name === 'Shadow Skeleton' && r.skel[1] === 2, [r.shadowSkel, r.skel]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
