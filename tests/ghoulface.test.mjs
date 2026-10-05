// A ghoul's face blotched and blemished (Session 529, Michael's inspector note: "more facial blemishes/discoloration").
// Ghouls, and no other foe, carry patches of rot-green, bruise-purple, black and yellow on the face: the same genome baked
// with and without its ghoul's mark differs by the patches' triangles.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  // the same ghoul's genome baked as it is and with its ghoul's mark taken off: the difference is the patches
  const out = []; for (let k = 0; k < 3; k++) { const rig = buildFoe('Ghoul', 10 + k * 7, 20 + k); const gg = rig.g;
    const a = personBake(gg, 1), b = personBake(Object.assign({}, gg, { ghoul: false }), 1);
    out.push({ ghoul: !!gg.ghoul, extra: a.tris - b.tris, seed: gg.seed }); a.geo.dispose(); b.geo.dispose(); }
  const others = ['Hollowed', 'Ash Wight', 'Bandit'].map(t => !!buildFoe(t, 3, 3).g.ghoul);
  return { out, others };
});
console.log(JSON.stringify(r));
check('a ghoul is marked a ghoul; a Hollowed, an Ash Wight and a bandit are not', r.out.every(x => x.ghoul) && r.others.every(x => !x), r);
check('every ghoul carries its patches: 14 on the face, 600 or more triangles that the same genome without them lacks', r.out.every(x => x.extra >= 600), r.out);
await inspShots(g, [['people/foes-on-the-body/ghoul', 'ghoul-after.png', 'INSPECTOR.opts.figure=false;INSPECTOR.orbit.theta=0.15;INSPECTOR.orbit.phi=1.45;INSPECTOR.orbit.dist*=.35;INSPECTOR.orbit.target.y=1.15;']]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
