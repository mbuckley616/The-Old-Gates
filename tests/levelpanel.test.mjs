// Session 531 (the concept artist's "found on the way", DECISION #142, Michael's A): the level panel always read
// *❤ +10 HP restored*, a static line, though the level gives 10 to the maximum and Fortitude's picks give more; and
// `gainLines` left out the gains ATTR_DEF grants, so Charisma ×4 showed only *+4% barter prices*. The panel's health line
// now counts what confirmLevelUp gives, and every attribute's lines name every gain. Since Session 952 the bed places 12 points.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const L = (k, m) => gainLines(k, m);
  const lines = { might: L('might', 2), finesse: L('finesse', 1), resolve: L('resolve', 3), intelligence: L('intelligence', 1), charisma: L('charisma', 4) };
  ATTRS.charisma = 0; const cha0 = L('charisma', 4); ATTRS.charisma = 2; const cha2 = L('charisma', 4); ATTRS.charisma = 0;
  // S952 — the bed's 12 points (skills and perks A): each Fortitude point placed is 10 health; the archetype's +1 is gone
  const arch = playerArchetype; playerArchetype = 'duelist'; levelUps = {};
  const fm = 2;
  openLevelUp(); const hp = () => document.getElementById('lu-hpgain').textContent;
  const h0 = hp(); luAdd('fortitude', 1); luAdd('fortitude', 1); const h1 = hp(); luAdd('fortitude', -1); luAdd('fortitude', -1); const h2 = hp();
  const cards = [...document.querySelectorAll('#lu-attrs .lu-attr-gain')].map(e => e.textContent);
  const fortArch = false;
  const maxBefore = maxHP; for (let i = 0; i < 3; i++) luAdd('fortitude', 1); for (let i = 0; i < 5; i++) luAdd('might', 1); for (let i = 0; i < 4; i++) luAdd('finesse', 1); const shown = hp(); confirmLevelUp(); const gained = maxHP - maxBefore;
  const tank = ARCHETYPES.find(a => (a.primaries || []).includes('fortitude'));
  playerArchetype = tank && tank.id; levelUps = {};
  openLevelUp(); const tShown0 = hp(); for (let i = 0; i < 5; i++) luAdd('might', 1); for (let i = 0; i < 5; i++) luAdd('finesse', 1); luAdd('swiftness', 1); luAdd('swiftness', 1); const tShown = hp(); const tb = maxHP; confirmLevelUp(); const tGained = maxHP - tb;
  playerArchetype = arch;
  return { lines, cha0, cha2, fm, h0, h1, h2, cards: cards.length, fortArch, shown, gained, tank: tank && tank.id, tShown0, tShown, tGained };
});
console.log('panel', JSON.stringify(r));
check('Might ×2 reads its carry weight', /\+2% melee damage/.test(r.lines.might) && /\+10 carry weight/.test(r.lines.might), r.lines.might);
check('Finesse reads its ranged damage', /\+1% ranged damage/.test(r.lines.finesse), r.lines.finesse);
check('Resolve ×3 reads its block cost and magic resist', /-15% block cost/.test(r.lines.resolve) && /\+3% magic resist/.test(r.lines.resolve), r.lines.resolve);
check('Intelligence reads its spell damage', /\+1% spell damage/.test(r.lines.intelligence), r.lines.intelligence);
// S953 (skills and perks A): Charisma's barter is 0.5% a point and its quest gold 1%, the attributes at ≤1%; Session 959 re-measured this line
check('Charisma ×4 reads quest gold, and the better stock only when the raise reaches 5 points', /\+2% barter/.test(r.cha0) && /\+4% quest reward gold/.test(r.cha0) && !/tier above/.test(r.cha0) && /tier above/.test(r.cha2), { cha0: r.cha0, cha2: r.cha2 });
check(`the health line counts what the level gives (${r.h0} → with ${r.fm} Fortitude points ${r.h1} → ${r.h2})`, /^❤ \+\d+ max HP$/.test(r.h0) && r.h1 !== r.h0 && r.h2 === r.h0 && !/restored/.test(r.h0), r);
check(`and it is what confirming gives (${r.shown}, max HP +${r.gained})`, r.shown === `❤ +${r.gained} max HP` && r.gained === 40, r);
check(`since Session 952 an archetype with Fortitude among its primaries (${r.tank}) gets no +1: the level's 10 alone (${r.tShown0}), and confirming gives it (+${r.tGained})`, !!r.tank && r.tShown0 === '❤ +10 max HP' && r.tGained === 10 && r.tShown === `❤ +${r.tGained} max HP`, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
