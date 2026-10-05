// Foes' weapons face the way they strike, and the brim hat is a hat's size (Session 520, Michael's inspector notes:
// "the bandit's axe is turned the wrong direction, the cultist's sword is held sideways"; the highwayman's "hat is
// comically large / goofy"). The kit is built with its edge (an axe's bit) along -x; held, that axis must lie along the
// foe's facing, the shaft upright. A bow's back (the kit's -z) faces forward, its string on the archer's side.
import { boot, check } from './lib/game.mjs';
import { inspShots } from './lib/inspshot.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  const out = [], hats = [];
  for (const type of ['Bandit', 'Highwayman', 'Cultist', 'Pirate', 'Deserter', 'Bandit Captain', 'Shieldbearer', 'Rogue Mage', 'Bandit Archer', 'Skeleton']) {
    for (let k = 0; k < 4; k++) {
      const rig = buildFoe(type, 100 + k * 7, 50 + k * 3); scene.add(rig.root); rig.root.visible = false;
      if (!rig.weapon) { scene.remove(rig.root); continue; }
      for (let i = 0; i < 3; i++) tickPeople(1 / 60);
      rig.root.updateMatrixWorld(true);
      const q = rig.weapon.getWorldQuaternion(new THREE.Quaternion()), f = new THREE.Vector3(0, 0, 1).applyQuaternion(rig.root.getWorldQuaternion(new THREE.Quaternion()));
      const bow = rig.g ? rig.g.wpn === 'bow' : /Archer/.test(type);
      const ax = new THREE.Vector3(bow ? 0 : -1, 0, bow ? -1 : 0).applyQuaternion(q), up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
      out.push({ type, bow, fwd: +ax.dot(f).toFixed(2), up: +up.y.toFixed(2) });
      scene.remove(rig.root);
    }
  }
  // the hat: the widest the figure gets in its top tenth of height, against the head's own width just below the hat
  for (let k = 0; k < 6; k++) {
    const rig = buildFoe('Highwayman', 300 + k * 11, 40 + k * 5); const pos = rig.mesh ? rig.mesh.geometry.attributes.position : null;
    if (!pos) continue; let top = -1e9; for (let i = 0; i < pos.count; i++) top = Math.max(top, pos.getY(i));
    const band = (lo, hi) => { let w = 0; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y > top - hi && y <= top - lo) w = Math.max(w, Math.abs(pos.getX(i))); } return w; };
    hats.push({ top: +top.toFixed(3), brim: +band(0, .2).toFixed(3)});
  }
  return { out, hats };
});
console.log(JSON.stringify(r));
const kit = r.out.filter(x => !x.bow), bows = r.out.filter(x => x.bow);
check('every foe holding a kit weapon holds it edge forward (the kit\'s edge axis along the facing) with the shaft upright', kit.length >= 30 && kit.every(x => x.fwd > .9 && x.up > .9), kit.filter(x => !(x.fwd > .9 && x.up > .9)));
check('a bandit archer\'s bow has its back to the front, the string on the archer\'s side', bows.length >= 4 && bows.every(x => x.fwd > .9), bows);
check('the highwayman\'s brim reaches at most .21 from the head\'s middle (it was .245 at scale 1)', r.hats.length >= 4 && r.hats.every(h => h.brim < .21), r.hats);
// side views (the stage's orbit a quarter round), where an edge held forward shows the blade's whole profile
const side = 'INSPECTOR.opts.figure=false;INSPECTOR.orbit.theta=1.5708;INSPECTOR.orbit.phi=1.4;';
await inspShots(g, [['people/foes-on-the-body/highwayman', 'highwayman-after.png', side], ['people/foes-on-the-body/bandit', 'foeweapon-bandit-after.png', side], ['people/foes-on-the-body/cultist', 'foeweapon-cultist-after.png', side]]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
