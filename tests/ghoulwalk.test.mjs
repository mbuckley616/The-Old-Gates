// A ghoul limps (Session 534, Michael's inspector note: "Their walk should probably have a limp as well / be more
// zombie-like"). Over a walk cycle the bad leg's ankle barely leaves the ground while the good one swings clear, the hips
// drop lower over the bad leg than over the good, and the trunk is hunched; a ghoul never breaks into a run. Other foes
// walk as before.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  // the ankles' and the hips' heights over one walk cycle, from the bones, at the rig's own scale
  const cycle = rig => { const B = rig.B, o = pwOpts(rig), lim = o.limp, v = new THREE.Vector3();
    const bad = lim > 0 ? 'anL' : 'anR', good = lim > 0 ? 'anR' : 'anL'; let lo = { bad: 1e9, good: 1e9 }, hi = { bad: -1e9, good: -1e9 }, hb = 1e9, hg = 1e9;
    for (let i = 0; i < 48; i++) { const ph = i / 48, P = pwWalk(ph, o); pwApply(rig, P); rig.root.updateMatrixWorld(true);
      const y = n => v.setFromMatrixPosition(B[n].matrixWorld).y;
      const yb = y(bad), yg = y(good), yh = y('hips'); lo.bad = Math.min(lo.bad, yb); hi.bad = Math.max(hi.bad, yb); lo.good = Math.min(lo.good, yg); hi.good = Math.max(hi.good, yg);
      // which foot stands: the stance half of the bad leg's own phase
      const fb = lim > 0 ? ph : (ph + .5) % 1; if (fb < PW.DUTY) hb = Math.min(hb, yh); else hg = Math.min(hg, yh); }
    const P = pwWalk(.25, o);
    return { limp: lim, badLift: +(hi.bad - lo.bad).toFixed(3), goodLift: +(hi.good - lo.good).toFixed(3), floor: +Math.min(lo.bad, lo.good).toFixed(3), hipsBad: +hb.toFixed(3), hipsGood: +hg.toFixed(3), spine: +P.spine[0].toFixed(2) }; };
  const ghouls = [], others = {};
  for (let k = 0; k < 4; k++) { const rig = buildFoe('Ghoul', 10 + k * 7, 20 + k * 3); PEOPLE_RIGS.delete(rig); ghouls.push(cycle(rig)); }
  for (const t of ['Bandit', 'Hollowed', 'Ash Wight']) { const rig = buildFoe(t, 3, 3); PEOPLE_RIGS.delete(rig); others[t] = cycle(rig); }
  // in tickPeople, chased at a ghoul's best pace and faster: the bandit runs, the ghoul keeps to its hobble
  const pace = t => { const rig = buildFoe(t, 0, 0), grp = new THREE.Group(); grp.add(rig.root); grp.visible = false; scene.add(grp); grp.visible = true;
    rig.e = { x: 0, z: 0, dead: false }; let now = performance.now();
    for (let i = 0; i < 90; i++) { rig.e.x += 4 / 60; now += 1000 / 60; tickPeople(1 / 60, now); }
    const w = { walk: +rig.w.walk.toFixed(2), run: +rig.w.run.toFixed(2) }; scene.remove(grp); return w; };
  return { ghouls, others, ghoulPace: pace('Ghoul'), banditPace: pace('Bandit') };
});
console.log(JSON.stringify(r));
const G = r.ghouls, O = Object.values(r.others);
check('every ghoul limps on one leg, chosen by its seed; a bandit, a Hollowed and an Ash Wight do not', G.every(x => Math.abs(x.limp) === 1) && new Set(G.map(x => x.limp)).size === 2 && O.every(x => x.limp === 0), r);
check('the bad leg drags: its ankle rises under a third of what the good one does', G.every(x => x.badLift < x.goodLift / 3), G);
check('the knee gives under the bad leg: the hips sit 2 cm or more lower over it than over the good', G.every(x => x.hipsGood - x.hipsBad > .02), G);
check('the trunk is hunched: the spine leans .25 or more forward (a bandit .07)', G.every(x => x.spine >= .25) && r.others.Bandit.spine < .1, r);
check('no foot sinks: the lowest ankle is no lower than a bandit\'s, less 1 cm', G.every(x => x.floor > r.others.Bandit.floor - .01), r);
check('the others walk as before: both legs lift alike', O.every(x => Math.abs(x.badLift - x.goodLift) < .005), r.others);
check('chased at 4 a second, a bandit runs and a ghoul keeps to its walk', r.banditPace.run > .9 && r.ghoulPace.run < .01 && r.ghoulPace.walk > .9, r);
const walk = ph => `INSPECTOR.opts.anim=false;INSPECTOR.opts.figure=false;const e=INSPECTOR.entries.find(x=>x.key==="people/foes-on-the-body/ghoul");const R=INSPECTOR.built.get(e.id);R.anim(0,${ph}/1.4,"walk");INSPECTOR.orbit.theta=1.5708;INSPECTOR.orbit.phi=1.5;INSPECTOR.orbit.dist*=1.25;`;
if (process.env.SHOTS) await inspShots(g, [['people/foes-on-the-body/ghoul', process.env.SHOTS + '-a.png', walk(.3)], ['people/foes-on-the-body/ghoul', process.env.SHOTS + '-b.png', walk(.7)]]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
