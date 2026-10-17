// F2b, session 1, part 2 (Session 1041; docs/design/scale-numbers-build.md, *Foes' reach*): the foes' table is hull to hull.
// The sheet's `foereach` row: each family engages a still player; the engage distance, the blow's reach and its arc are the
// table's, ±0.05 and ±2°. Centre to centre that is the foe's hull + the number + yours (0.30). The numbers are the sheet's,
// written out, not read from the code: an armed humanoid engages at 1.2 and strikes at its weapon's reach (a knife 1.2, a
// sword or an axe 1.6) in 90°; a wolf engages at 0.6 after a lunge of 1.5 and bites within 0.9 in 70°; a spider or a bear
// engages at 0.8 and strikes within 1.2 in 100°; a troll engages at 1.6 and sweeps 2.4 in 140°; the Faolchú bites at its
// biteRange less 0.9. Each engage is measured in the open world's own tick (tickZoneEnemies) and the wolf's lunge by its bite.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const YOU = .30;
const SHEET = {
  Bandit: { hull: .30, engage: 1.2, arc: 90 }, Cultist: { hull: .30, engage: 1.2, blow: 1.2, arc: 90 },
  Wolf: { hull: .35, engage: .6, lunge: 1.5, blow: .9, arc: 70 }, Spider: { hull: .6, engage: .8, blow: 1.2, arc: 100 },
  'Cave Bear': { hull: .6, engage: .8, blow: 1.2, arc: 100 }, 'Cave Troll': { hull: .8, engage: 1.6, blow: 2.4, arc: 140 },
};
const WPN = { dagger: 1.2, sword: 1.6, axe: 1.6 };
const r = await page.evaluate((kinds) => {
  const sc = new THREE.Group(); scene.add(sc); sc.visible = false;
  const saveZE = ZE.slice(), es0 = executeStrike; let struck = 0;
  window.executeStrike = () => { struck++; };
  const out = {};
  const place = (e, d, ang) => { const a = Math.atan2(fwdX, fwdZ) + (ang || 0); e.x = px + Math.sin(a) * d; e.z = pz + Math.cos(a) * d; if (e.mesh) e.mesh.position.set(e.x, e.mesh.position.y, e.z); };
  const reset = e => { e.dead = false; e.alert = true; e.locked = false; e.atkCd = 0; e.telegraphT = 0; e._windup = null; e.hp = e.maxHp; delete e.staggerUntil; };
  for (const k of kinds) {
    const e = buildZoneEnemy(sc, [], px + 40, pz + 40, k, null); ZE.length = 0; ZE.push(e);
    // engage: stepped in by 0.05 from 5 m, one tick of a tenth of a millisecond each (it does not walk), the first tell
    let engage = null;
    for (let c = 500; c > 20; c -= 5) { const d = c / 100; reset(e); place(e, d); tickZoneEnemies(1e-4, performance.now(), sc); if (e.telegraphT > 0) { engage = d; break; } }
    // the blow: frozen facing you, stepped in, the first distance it reaches; then its arc just inside that reach
    let blow = null, arc = null; const lw = foeReach(e).lunge;
    for (let c = 500; c > 20; c -= 5) { const d = c / 100; reset(e); place(e, d); e.combatYaw = Math.atan2(px - e.x, pz - e.z); if (strikeReaches(e)) { blow = d; break; } }
    if (blow != null) { const d = blow - .1; for (let a = 0; a <= 180; a += .5) { const yaw = Math.atan2(fwdX, fwdZ) + Math.PI; reset(e); place(e, d); e.combatYaw = yaw + a * Math.PI / 180; if (!strikeReaches(e)) { arc = 2 * (a - .5); break; } } }
    out[k] = { engage, blow, arc, hull: hullOf(e), wpn: foeWeaponKind(e), lunge: lw };
    // the wolf: it starts its tell just inside 2.1 hull to hull, you stand still, and the bite lands from the end of its leap;
    // stepped aside 1.5 during the tell, it leaps along its old line and misses
    if (lw) {
      const run = side => { reset(e); place(e, (out[k].engage || 2.7) - .02); tickZoneEnemies(1e-4, performance.now(), sc); const told = e.telegraphT > 0, x0 = e.x, z0 = e.z;
        const px0 = px, pz0 = pz; if (side) { px += Math.cos(Math.atan2(fwdX, fwdZ)) * side; pz -= Math.sin(Math.atan2(fwdX, fwdZ)) * side; }
        struck = 0; e.telegraphT = 1e-5; tickZoneEnemies(1e-4, performance.now(), sc);
        const res = { told, leapt: +Math.hypot(e.x - x0, e.z - z0).toFixed(2), left: +Math.hypot(px - e.x, pz - e.z).toFixed(2), bit: struck > 0 }; px = px0; pz = pz0; return res; };
      out[k].still = run(0); out[k].aside = run(1.5);
    }
    sc.remove(e.mesh);
  }
  // the Faolchú: its bite reach and engage, read from the boss's own definition
  const F = { isBoss: true, bossDef: BOSSES.faolchu || Object.values(BOSSES).find(b => b.biteRange), name: 'Faolchú' };
  const fr = foeReach(F); out.faolchu = { bite: F.bossDef.biteRange, hull: hullOf(F), engage: +fr.engage.toFixed(2), blow: +fr.blow.toFixed(2) };
  window.executeStrike = es0; ZE.length = 0; saveZE.forEach(e => ZE.push(e)); scene.remove(sc);
  return out;
}, Object.keys(SHEET));
console.log(JSON.stringify(r));
const near = (a, b, t) => a != null && Math.abs(a - b) <= t + 1e-9;
const want = k => { const S = SHEET[k], blow = S.blow != null ? S.blow : WPN[r[k].wpn]; return { engage: YOU + S.engage + (S.lunge || 0) + S.hull, blow: YOU + blow + S.hull, arc: S.arc }; };
check('the hulls are the sheet\'s', Object.keys(SHEET).every(k => near(r[k].hull, SHEET[k].hull, 0)), Object.keys(SHEET).map(k => [k, r[k].hull]));
check('the Bandit holds a sword or an axe, the Cultist a knife', ['sword', 'axe'].includes(r.Bandit.wpn) && r.Cultist.wpn === 'dagger', [r.Bandit.wpn, r.Cultist.wpn]);
check('each family starts its tell at the table\'s engage, hull to hull (the wolf\'s with its lunge), ±0.05', Object.keys(SHEET).every(k => near(r[k].engage, want(k).engage, .05)), Object.keys(SHEET).map(k => [k, r[k].engage, +want(k).engage.toFixed(2)]));
check('each family\'s blow reaches the table\'s distance, hull to hull, ±0.05', Object.keys(SHEET).every(k => near(r[k].blow, want(k).blow, .05)), Object.keys(SHEET).map(k => [k, r[k].blow, +want(k).blow.toFixed(2)]));
check('each family\'s blow covers the table\'s arc, ±2°', Object.keys(SHEET).every(k => near(r[k].arc, want(k).arc, 2)), Object.keys(SHEET).map(k => [k, r[k].arc, want(k).arc]));
check('a wolf that told from 2.1 hull to hull leaps about 1.5 to stand at 0.6 and bites a still player', r.Wolf.still && r.Wolf.still.told && near(r.Wolf.still.leapt, 1.5, .1) && near(r.Wolf.still.left, YOU + .6 + .35, .1) && r.Wolf.still.bit, r.Wolf.still);
check('stepped 1.5 aside during the tell, the wolf leaps along its old line and misses', r.Wolf.aside && r.Wolf.aside.told && !r.Wolf.aside.bit, r.Wolf.aside);
check('the Faolchú engages and bites at its biteRange less 0.9, hull to hull', near(r.faolchu.blow, YOU + r.faolchu.bite - .9 + r.faolchu.hull, .01) && r.faolchu.engage === r.faolchu.blow, r.faolchu);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
