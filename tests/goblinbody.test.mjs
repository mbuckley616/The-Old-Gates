// The goblin made meaner (Session 535, Michael's inspector note: "Looks a bit too friendly/humanoid." Distort and contort the
// body, make them smaller; "probably not be holding a cane"). Measured from the bones: smaller than before, crouched on bent
// knees and hunched with the head thrust out, longer arms, a rusted knife in place of the cane; the inspector shows it at the
// size the game builds it. Other foes are unchanged.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  const v = new THREE.Vector3(), at = (rig, n) => v.setFromMatrixPosition(rig.B[n].matrixWorld).clone();
  const measure = (type, k) => { const rig = buildFoe(type, 10 + k * 7, 20 + k * 3); PEOPLE_RIGS.delete(rig); const o = pwOpts(rig);
    // at the game's size: a goblin's group is scaled .72 in the open world and in dungeons, a bandit's 1
    rig.root.scale.multiplyScalar(/Goblin/.test(type) ? .72 : 1);
    pwApply(rig, pwIdle(0, o)); rig.root.updateMatrixWorld(true);
    const head = at(rig, 'head').y, sh = at(rig, 'shL'), wr = at(rig, 'wrL'), hips = at(rig, 'hips').y, s = rig.root.scale.y;
    // the arm's length in the bind's own units (shoulder to wrist along the bones), against the height at the hips
    const arm = (Math.abs(rig.B.elL.position.y) + Math.abs(rig.B.wrL.position.y));
    let floor = 1e9; for (let i = 0; i < 24; i++) { pwApply(rig, pwWalk(i / 24, o)); rig.root.updateMatrixWorld(true); floor = Math.min(floor, at(rig, 'anL').y / s, at(rig, 'anR').y / s); }
    return { type, gear: rig.g.gear, wpn: rig.weapon ? rig.weapon.userData.wpn : null, head: +head.toFixed(3), hips: +(hips / s).toFixed(3), arm: +arm.toFixed(3),
      spine: +pwIdle(0, o).spine[0].toFixed(2), walkHips: +pwWalk(.25, o).hipsY.toFixed(3), floor: +floor.toFixed(3), goblin: !!o.goblin }; };
  const gob = [0, 1, 2, 3].map(k => measure('Goblin', k)), sling = measure('Goblin Slinger', 0), band = [0, 1, 2].map(k => measure('Bandit', k));
  const others = ['Bandit', 'Ghoul', 'Kobold', 'Cultist'].map(t => { const rig = buildFoe(t, 3, 3); PEOPLE_RIGS.delete(rig); return { t, goblin: !!pwOpts(rig).goblin, armK: rig.g.armK || 1 }; });
  openInspector(); const e = INSPECTOR.entries.find(x => x.key === 'people/foes-on-the-body/goblin'); INSPECTOR.select(e.id);
  const insScale = +INSPECTOR.built.get(e.id).obj.scale.y.toFixed(3); closeInspector();
  return { gob, sling, band, others, insScale };
});
console.log(JSON.stringify(r));
const G = r.gob, bandHead = Math.max(...r.band.map(x => x.head)), bandArm = r.band[0].arm, bandHips = Math.min(...r.band.map(x => x.hips));
check('no goblin holds a cane: the goblin a rusted knife from the kit, the slinger nothing in hand', G.every(x => x.gear === 'kit' && x.wpn === 'dagger') && r.sling.gear !== 'stick', { G, sling: r.sling });
check('smaller: a goblin\'s head stands under .6 of the tallest bandit\'s (was .72 by its scale alone)', G.every(x => x.head < .6 * bandHead), { G: G.map(x => x.head), bandHead });
check('crouched: its hips sit under .88 of a bandit\'s in its own units, standing and walking', G.every(x => x.hips < .88 * bandHips && x.walkHips < .88 * r.band[0].walkHips), { G, band: r.band });
check('hunched: the spine leans .35 or more forward standing (a bandit .0x)', G.every(x => x.spine >= .35) && r.band.every(x => x.spine < .1), G.map(x => x.spine));
check('long arms: shoulder to wrist 1.2 times a bandit\'s', G.every(x => x.arm >= 1.2 * bandArm - 1e-6), { G: G.map(x => x.arm), bandArm });
check('no foot sinks in the crouched walk: the lowest ankle no lower than a bandit\'s, less 1 cm', G.every(x => x.floor > r.band[0].floor - .01), { G: G.map(x => x.floor), band: r.band[0].floor });
check('the other foes are untouched: no crouch, arms as they were', r.others.every(x => !x.goblin && x.armK === 1), r.others);
check('the inspector shows the goblin at the .72 the game builds it at', r.insScale < .75 && r.insScale > .5, r.insScale);
if (process.env.SHOTS) {
  const K = 'people/foes-on-the-body/goblin', n = process.env.SHOTS;
  await inspShots(g, [[K, n + '-front.png', 'INSPECTOR.orbit.theta=0.55;INSPECTOR.orbit.phi=1.42;INSPECTOR.orbit.dist*=1.7;'],
    [K, n + '-side.png', `INSPECTOR.opts.anim=false;const e=INSPECTOR.entries.find(x=>x.key==="${K}");const R=INSPECTOR.built.get(e.id);R.anim(0,.3/1.4,"walk");INSPECTOR.orbit.theta=1.5708;INSPECTOR.orbit.phi=1.45;INSPECTOR.orbit.dist*=1.7;`],
    [K, n + '-face.png', 'INSPECTOR.opts.figure=false;INSPECTOR.orbit.theta=0.2;INSPECTOR.orbit.phi=1.5;INSPECTOR.orbit.dist*=.4;INSPECTOR.orbit.target.y=0.62;']]);
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
