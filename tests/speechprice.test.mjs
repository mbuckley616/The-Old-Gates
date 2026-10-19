// The attributes at ≤1% a point, and Speech's prices (Session 953; skills and perks A, the build sheet's *The attributes at
// ≤1% a point* and Speech's row): Charisma's barter 0.5% a point to a quarter, Speech 0.2% a level to 20% on top; Swiftness's
// move 0.5% a point; Fortune's crit 0.5%; Finesse's sprint 1%.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const a0 = { ...ATTRS }, sp0 = { ...SKILLS.speech }; const out = {}; const ch = currentHouse; currentHouse = null;
  const at = (cha, sp) => { ATTRS.charisma = cha; SKILLS.speech = { lv: sp, p: 0 }; return +barterPct().toFixed(4); };
  out.barter = { c0s5: at(0, 5), c10s5: at(10, 5), c0s50: at(0, 50), c0s100: at(0, 100), c60s100: at(60, 100) };
  ATTRS.finesse = 0; const sp0f = _finesseSprint(); ATTRS.finesse = 10; out.sprint = +(sp0f - _finesseSprint()).toFixed(4);
  out.crit = FORTUNE_CRIT_PCT * 10;
  currentHouse = ch; Object.assign(ATTRS, a0); SKILLS.speech = sp0; return out; });
console.log(JSON.stringify(r));
const B = r.barter;
// S973: Haggle, Speech's perk at 25, adds 5% from there (perkhand measures the edge)
check(`Speech: 0.2% a level, to 20%, and Haggle's 5% from 25 (${B.c0s5}, ${B.c0s50}, ${B.c0s100} at 5, 50, 100)`, B.c0s5 === .01 && B.c0s50 === .15 && B.c0s100 === .25, B);
check(`Charisma: 0.5% a point on top (${B.c10s5} at Charisma 10, Speech 5), its own share still to a quarter (${B.c60s100} at 60 and 100)`, B.c10s5 === .06 && B.c60s100 === .5, B);
check(`Finesse 10 takes ${r.sprint * 100}% off the sprint, Fortune 10 gives ${r.crit * 100}% crit`, Math.abs(r.sprint - .1) < 1e-9 && Math.abs(r.crit - .05) < 1e-9, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
