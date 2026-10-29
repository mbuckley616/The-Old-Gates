// Overcasting (Session 1571; magic-build.md, magic B's first session): short of mana, the rest is paid in health at 2 a point of
// mana, with a 0.5 s stagger, and a cast that would leave you under 1 health is refused. The sheet's case: mana 10, Caor at 30
// (Comprehension, Tine at 50), health 100 → health 60, mana 0; at health 40 it is refused and nothing is spent. A fizzle gives back
// half the mana paid, never the health.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const ks = knownWords, as = activeSpellId, sk = SKILLS.tine, out = {};
  knownWords = { caor: 2 }; activeSpellId = 'caor'; SKILLS.tine = { lv: 50, p: 0 };
  const cast = (m, hp) => { castT = 0; spCd = 0; mana = m; PHP = hp; PPOST.stagUntil = 0; let said = ''; const sm = showMsg; showMsg = t => { said += ' ' + t; };
    try { castSpell(); } finally { showMsg = sm; } const now = performance.now() / 1000;
    return { hp: PHP, mana: Math.round(mana), stag: +(PPOST.stagUntil - now).toFixed(2), said: said.trim() }; };
  out.full = cast(100, 100); out.short = cast(10, 100); out.refused = cast(10, 40); out.edge = cast(10, 41);
  knownWords = ks; activeSpellId = as; SKILLS.tine = sk; castT = 0; spCd = 0; PPOST.stagUntil = 0; PHP = maxHP; mana = effMaxMana();
  return out; });
console.log(JSON.stringify(r));
check(`with the mana, Caor costs 30 and no health (${r.full.mana} mana left, health ${r.full.hp})`, r.full.mana === 70 && r.full.hp === 100 && r.full.stag <= 0, r.full);
check(`mana 10, health 100: health ${r.short.hp}, mana ${r.short.mana}, staggered ${r.short.stag} s`, r.short.hp === 60 && r.short.mana === 0 && r.short.stag > .4 && r.short.stag <= .5, r.short);
check(`it says so: "${r.short.said}"`, /takes 40 health/.test(r.short.said), r.short);
check(`at health 40 it is refused, nothing spent (health ${r.refused.hp}, mana ${r.refused.mana})`, r.refused.hp === 40 && r.refused.mana === 10 && r.refused.stag <= 0 && /Not enough mana!/.test(r.refused.said), r.refused);
check(`at health 41 it goes, leaving 1 (${r.edge.hp})`, r.edge.hp === 1 && r.edge.mana === 0, r.edge);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
