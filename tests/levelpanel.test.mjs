// Session 531 (the concept artist's "found on the way", DECISION #142, Michael's A): the level panel always read
// *❤ +10 HP restored*, a static line, though the level gives 10 to the maximum and Fortitude's picks give more; and
// `gainLines` left out the gains ATTR_DEF grants, so Charisma ×4 showed only *+4% barter prices*. The panel's health line
// now counts what confirmLevelUp gives, and every attribute's lines name every gain.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const L = (k, m) => gainLines(k, m);
  const lines = { might: L('might', 2), finesse: L('finesse', 1), resolve: L('resolve', 3), intelligence: L('intelligence', 1), charisma: L('charisma', 4) };
  ATTRS.charisma = 0; const cha0 = L('charisma', 4); ATTRS.charisma = 2; const cha2 = L('charisma', 4); ATTRS.charisma = 0;
  const arch = playerArchetype; playerArchetype = 'duelist';
  lvAct = { kills: 0, damageTaken: 130, parries: 0, sprintDist: 0, staminaDepleted: 0, transactions: 0, npcTalks: 0, chestsOpened: 0 };
  const fm = getMultiplier('fortitude');
  openLevelUp(); const hp = () => document.getElementById('lu-hpgain').textContent;
  const h0 = hp(); toggleAttr('fortitude'); const h1 = hp(); toggleAttr('fortitude'); const h2 = hp();
  const cards = [...document.querySelectorAll('#lu-attrs .lu-attr-gain')].map(e => e.textContent);
  const fortArch = (ARCHETYPES.find(a => a.id === 'duelist').primaries || []).includes('fortitude');
  const maxBefore = maxHP; toggleAttr('fortitude'); toggleAttr('might'); toggleAttr('finesse'); const shown = hp(); confirmLevelUp(); const gained = maxHP - maxBefore;
  const tank = ARCHETYPES.find(a => (a.primaries || []).includes('fortitude'));
  playerArchetype = tank && tank.id; lvAct = { kills: 0, damageTaken: 0, parries: 0, sprintDist: 0, staminaDepleted: 0, transactions: 0, npcTalks: 0, chestsOpened: 0 };
  openLevelUp(); const tShown0 = hp(); toggleAttr('might'); toggleAttr('finesse'); toggleAttr('swiftness'); const tShown = hp(); const tb = maxHP; confirmLevelUp(); const tGained = maxHP - tb;
  playerArchetype = arch;
  return { lines, cha0, cha2, fm, h0, h1, h2, cards: cards.length, fortArch, shown, gained, tank: tank && tank.id, tShown0, tShown, tGained };
});
console.log('panel', JSON.stringify(r));
check('Might ×2 reads its carry weight', /\+2% melee damage/.test(r.lines.might) && /\+10 carry weight/.test(r.lines.might), r.lines.might);
check('Finesse reads its ranged damage', /\+1% ranged damage/.test(r.lines.finesse), r.lines.finesse);
check('Resolve ×3 reads its block cost and magic resist', /-15% block cost/.test(r.lines.resolve) && /\+3% magic resist/.test(r.lines.resolve), r.lines.resolve);
check('Intelligence reads its spell damage', /\+1% spell damage/.test(r.lines.intelligence), r.lines.intelligence);
check('Charisma ×4 reads quest gold, and the better stock only when the raise reaches 5 points', /\+4% barter/.test(r.cha0) && /\+8% quest reward gold/.test(r.cha0) && !/tier above/.test(r.cha0) && /tier above/.test(r.cha2), { cha0: r.cha0, cha2: r.cha2 });
check(`the health line counts what the level gives (${r.h0} → with Fortitude ×${r.fm} ${r.h1} → ${r.h2})`, /^❤ \+\d+ max HP$/.test(r.h0) && r.h1 !== r.h0 && r.h2 === r.h0 && !/restored/.test(r.h0), r);
check(`and it is what confirming gives (${r.shown}, max HP +${r.gained})`, r.shown === `❤ +${r.gained} max HP`, r);
check(`an archetype whose +1 is Fortitude (${r.tank}) shows its 10 before any pick (${r.tShown0}), and confirming gives it (+${r.tGained})`, !!r.tank && r.tShown0 === '❤ +20 max HP' && r.tShown === `❤ +${r.tGained} max HP`, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
