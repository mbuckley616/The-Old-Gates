// Fortify enchantments (Session 335): *of Might*, *of Fortitude*, *of Finesse*, *of Swiftness*, *of Intellect* and the
// Sigil-Reader's +3 Intelligence were summed into the armour bonus and read by nothing. Now every effect reads the
// attribute with them (attrEff); what you may equip and learn still reads the points you own.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  for (const k of ['might', 'fortitude', 'finesse', 'swiftness', 'intelligence']) ATTRS[k] = 0;
  const amulet = ARMOR_TYPES.find(t => t.type === 'Amulet');
  const ench = id => ARMOR_ENCHANTS.find(e => e.id === id);
  const snap = () => ({ carry: maxCarry(), hp: effMaxHP(), st: effMaxStamina(), mp: effMaxMana(), sprint: _finesseSprint(), pick: pickChance(),
    might: attrEff('might'), int: attrEff('intelligence'), fin: attrEff('finesse'), swift: attrEff('swiftness'), fort: attrEff('fortitude') });
  const EQ0 = { ...EQ };
  EQ.amulet = null; EQ.ring = null; invalidateArmorCache(); const bare = snap();
  const wear = (id, tier) => { EQ.amulet = makeItem(tier, amulet, ench(id), true); invalidateArmorCache(); return EQ.amulet; };
  const out = { bare };
  const m = wear('fortify_might', 9); out.might = { name: m.name, stats: m.enchantStats, ...snap() };
  wear('fortify_fort', 9); out.fort = snap();
  wear('fortify_fin', 9); out.fin = snap();
  wear('fortify_swift', 9); out.swift = snap();
  wear('fortify_int', 9); out.int = snap();
  renderHubAttrs(); out.grid = [...document.querySelectorAll('#derived-grid .derived-row')].map(d => d.textContent);
  out.baseInt = ATTRS.intelligence;
  // a Might-gated sword still asks for the Might you own
  const sword = makeItem(3, WEAPON_TYPES.find(t => t.type === 'Sword'), null, false);
  wear('fortify_might', 9); out.gate = canEquip(sword).ok;
  Object.assign(EQ, EQ0); invalidateArmorCache();
  return out;
});
check('bare: every attribute reads 0 and the base numbers', r.bare.might === 0 && r.bare.int === 0 && r.bare.carry >= 50, r.bare);
check('a Demonic amulet of Might (+3) carries 15 more, as 3 points of Might would', r.might.might === 3 && r.might.carry === r.bare.carry + 15, r.might);
check('of Fortitude (+3): +30 max health, +15 max stamina', r.fort.fort === 3 && r.fort.hp === r.bare.hp + 30 && r.fort.st === r.bare.st + 15, { bare: r.bare, fort: r.fort });
check('of Finesse (+3): the sprint costs 15% less and the pick chance rises 21 points', r.fin.fin === 3 && Math.abs(r.fin.sprint - (r.bare.sprint - .15)) < 1e-9 && Math.abs(r.fin.pick - Math.min(.92, r.bare.pick + .21)) < 1e-9, { bare: r.bare, fin: r.fin });
check('of Swiftness (+3) and of Intellect (+3): the attribute reads 3; Intellect adds 30 max mana', r.swift.swift === 3 && r.int.int === 3 && r.int.mp === r.bare.mp + 30, { swift: r.swift, int: r.int });
check('the hub shows the worn Intelligence (Spell DMG +3%, Max Mana Bonus +30); the points owned stay 0', r.grid.some(t => /Spell DMG\s*\+3%/.test(t)) && r.grid.some(t => /Max Mana Bonus\s*\+30/.test(t)) && r.baseInt === 0, r.grid);
check('an Iron Sword still asks for the Might you own (5), not the worn 3', r.gate === false, r.gate);
// a night's sleep fills the bars to what you wear, not to the bare maximum (it stopped short of every worn bonus)
const rest = await page.evaluate(async () => { const EQ0 = { ...EQ };
  EQ.amulet = makeItem(9, ARMOR_TYPES.find(t => t.type === 'Amulet'), ARMOR_ENCHANTS.find(e => e.id === 'fortify_fort'), true);
  EQ.ring = makeItem(9, ARMOR_TYPES.find(t => t.type === 'Ring'), ARMOR_ENCHANTS.find(e => e.id === 'fortify_int'), true); invalidateArmorCache();
  PHP = 1; mana = 0; stamina = 0; restAtBed(8); await new Promise(r => setTimeout(r, 1500));
  const out = { hp: PHP, mh: effMaxHP(), mp: mana, mm: effMaxMana(), st: stamina, ms: effMaxStamina(), baseHP: maxHP };
  Object.assign(EQ, EQ0); invalidateArmorCache(); PHP = effMaxHP(); return out; });
check('eight hours abed fills health, mana and stamina to the worn maximum', rest.hp === rest.mh && rest.mh > rest.baseHP && rest.mp === rest.mm && rest.st === rest.ms, rest);
// a save made at a worn maximum loads at it (the load clamped to the bare maximum before the gear came back)
const load = await page.evaluate(() => { const EQ0 = { ...EQ };
  EQ.amulet = makeItem(2, ARMOR_TYPES.find(t => t.type === 'Amulet'), ARMOR_ENCHANTS.find(e => e.id === 'fortify_fort'), true); invalidateArmorCache();
  PHP = effMaxHP(); stamina = effMaxStamina(); const saved = { hp: PHP, st: stamina };
  const d = JSON.parse(ssStringify(_buildSavePayload())); PHP = 5; _applyLoadData(d);
  const out = { saved, hp: PHP, st: stamina, mh: effMaxHP(), baseHP: maxHP, worn: !!(EQ.amulet && EQ.amulet.enchantStats && EQ.amulet.enchantStats.fortitudeBonus) };
  Object.assign(EQ, EQ0); invalidateArmorCache(); PHP = Math.min(PHP, effMaxHP()); return out; });
check('a save at full health with a Bronze Amulet of Fortitude (+1) loads at 140 of 140, not the bare 130', load.worn && load.hp === load.saved.hp && load.hp === load.mh && load.mh > load.baseHP && load.st === load.saved.st, load);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
