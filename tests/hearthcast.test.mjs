// The Mages' hearth task is lit only by a flame that goes off (Session 672, the critic's s480 note: `castSpell` called
// `WORLD.guild.onCast()` before it checked for a known spell, mana or the cooldown, so F by the hearth with no magic lit it
// while the screen said *You know no magic.*, and any spell counted). The task says *any flame you can cast will do*: now
// only a Fireball (school `tine`) that leaves the hand lights it — not a press with no spells, not another school, not
// a Fireball short of mana or cooling down, not one that fizzles. The task's house also keeps the cast button indoors.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), h = S.houses.find(x => x.type === 'home'); window._H = h;
  gstate().guild_m.active = { id: 'guild_m:test:1', g: 'guild_m', kind: 'hearth', siteId: 'dunmore', house: null, gold: 40, desc: '', short: 'Light a hearth' };
  px = h.exitX; pz = h.exitZ; goToInterior(h); });
await page.waitForTimeout(5000); await g.hide();
const r = await page.evaluate(() => { const t = gstate().guild_m.active, h = currentHouse, W = h._roomW || 10, D = h._roomD || 10;
  const out = { bound: t.house === _H.id, fbtn: document.getElementById('fbtn').style.display }, lit = () => !!t.done;
  const at = () => { px = W - .4 - 1; pz = D * .4; castT = 0; spCd = 0; };
  const rnd = Math.random, cr = casterRand; Math.random = () => .99; casterRand = () => () => .99; /* S685: the wild roll is the caster's stream */
  at(); knownSpells = {}; activeSpellId = null; castSpell(); out.none = lit();
  at(); knownSpells = { sioc: 1 }; activeSpellId = 'sioc'; mana = effMaxMana(); const m0 = mana; castSpell(); out.frost = [lit(), m0 - mana];
  at(); knownSpells = { caor: 1 }; activeSpellId = 'caor'; mana = 0; castSpell(); out.noMana = lit();
  at(); mana = effMaxMana(); spCd = 5; castSpell(); out.cooling = lit();
  at(); { let k = 0; casterRand = () => () => (k++ === 0 ? 0 : .4); } mana = effMaxMana(); castSpell(); out.fizzle = lit();
  casterRand = () => () => .99;
  at(); px = 1; pz = 1; mana = effMaxMana(); castSpell(); out.far = lit();
  at(); mana = effMaxMana(); const m1 = mana; castSpell(); out.fire = [lit(), m1 - mana];
  Math.random = rnd; casterRand = cr;
  return out; });
console.log(JSON.stringify(r));
check('the task binds to the house you enter, and the cast button stays shown there', r.bound && r.fbtn === 'block', r);
check('F with no spells known does not light it', r.none === false, r);
check('a Frost spell that goes off does not light it', r.frost[0] === false && r.frost[1] > 0, r.frost);
check('a Fireball with no mana, or cooling down, does not light it', r.noMana === false && r.cooling === false, r);
check('a Fireball that fizzles does not light it', r.fizzle === false, r);
check('a Fireball far from the hearth does not light it', r.far === false, r);
check('a Fireball cast by the hearth lights it, and its mana is spent', r.fire[0] === true && r.fire[1] > 0, r.fire);
// another home keeps the button hidden, as every room does
const other = await page.evaluate(async () => { exitInterior(); await new Promise(r => setTimeout(r, 2500));
  gstate().guild_m.active = null; const h = WORLD.settle.get('dunmore').houses.filter(x => x.type === 'home')[1]; px = h.exitX; pz = h.exitZ; goToInterior(h);
  await new Promise(r => setTimeout(r, 4000)); return [currentHouse && currentHouse.id === h.id, document.getElementById('fbtn').style.display]; });
check('with no hearth task the cast button is hidden indoors, as before', other[0] && other[1] === 'none', other);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
