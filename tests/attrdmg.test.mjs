// Attributes as a small buff on damage (Session 173): Might, Finesse and Intelligence each add 1% a point to
// melee, bow and spell damage (they added 3%, 4% and 3%). Michael: the weapon and its skill carry the damage.
// Every roll is pinned (Math.random = .5) so a hit with 10 points can be set against the same hit with none.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  const rnd = Math.random; Math.random = () => .5;
  const keep = { ...ATTRS }, lvl = level; level = 50; // a big base, so rounding cannot hide a tenth
  // a dummy in the zone list, a step in front of the player, that cannot die
  const dummy = () => { const mesh = new THREE.Group(); scene.add(mesh);
    return { name: 'Dummy', x: px + fwdX * 1.2, z: pz + fwdZ * 1.2, y: 0, hp: 1e6, maxHp: 1e6, def: 0, mesh, alert: false, ai: 'melee' }; };
  const melee = pts => { ATTRS.might = pts; const e = dummy(); ZE.push(e); const before = e.hp; _resolveZoneStrike(false); ZE.splice(ZE.indexOf(e), 1); scene.remove(e.mesh); return before - e.hp; };
  const spell = pts => { ATTRS.intelligence = pts; const sp = SPELLS.find(s => s.id === 'fireball') || SPELLS.find(s => s.dmg || s.mag) || SPELLS[0];
    return { id: sp.id, dmg: applySpellDamage({ def: 0, resist: {} }, sp, 1).dmg }; };
  const out = { m0: melee(0), m10: melee(10), m30: melee(30), s0: spell(0), s10: spell(10), per: ATTR_DMG_PER_POINT, bow: BOW_FINESSE_DMG };
  ATTRS.might = 10; ATTRS.finesse = 10; ATTRS.intelligence = 10; renderHubAttrs();
  out.grid = [...document.querySelectorAll('#derived-grid .derived-row')].map(d => d.textContent);
  out.gain = gainLines('might', 1);
  Object.assign(ATTRS, keep); level = lvl; Math.random = rnd; return out;
});
console.log(JSON.stringify(r));
check('10 Might adds 10% to a melee hit (it was 30%)', r.m0 > 0 && Math.abs(r.m10 / r.m0 - 1.1) < .03, r);
check('30 Might adds 30% (it was 90%)', Math.abs(r.m30 / r.m0 - 1.3) < .03, r);
check('10 Intelligence adds 10% to a spell (it was 30%)', r.s0.dmg > 0 && Math.abs(r.s10.dmg / r.s0.dmg - 1.1) < .03, r);
check('Finesse on the bow is 1% a point (it was 4%)', r.per === .01 && r.bow === .01, r);
check('the hub and the level-up card say 1% a point', r.grid.some(t => /Melee DMG\s*\+10%/.test(t)) && r.grid.some(t => /Ranged DMG\s*\+10%/.test(t)) && r.grid.some(t => /Spell DMG\s*\+10%/.test(t)) && /\+1% melee damage/.test(r.gain), r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
