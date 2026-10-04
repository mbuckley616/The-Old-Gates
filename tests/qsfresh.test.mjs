// Session 474 (the critic, 4 Oct, s374): a character loaded with no world row, from the in-game save menu, kept the running
// game's quests. `_applyLoadData` laid the saved `QS` over the live one (`if(d.QS)Object.assign(QS,d.QS)`), and `qsInit()`
// ran only when the page loaded, so a character row (which has no QS) left the first game's quest states in place. From the
// title it looked fresh only because nothing had been played. The quests now start fresh before the saved ones are laid on.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => { const ids = Object.keys(QS); const [a, b] = [ids[0], ids[1]];
  const snap = () => ({ [a]: QS[a].state, [b]: QS[b].state });
  // a save made now, with the first two quests as a new game has them
  const d0 = JSON.parse(ssStringify(_buildSavePayload())); const fresh = snap();
  // play moves them on
  QS[a].state = 'complete'; QS[b].state = 'active'; QS[b].objectives[0].current = 1; const played = snap();
  // the character row alone, loaded in the running game
  const { c, w } = ssSplitPayload(JSON.parse(JSON.stringify(d0))); _applyLoadData(JSON.parse(JSON.stringify(c)), null); const charOnly = snap(); const obj = QS[b].objectives[0].current;
  // both rows, after more play: the world's quests come back
  QS[a].state = 'complete'; QS[b].state = 'complete'; _applyLoadData(JSON.parse(JSON.stringify(c)), JSON.parse(JSON.stringify(w))); const both = snap();
  // a world row that lacks a quest (as a save from before that quest existed): that quest starts as a new game has it
  const w2 = JSON.parse(JSON.stringify(w)); delete w2.QS[b]; QS[b].state = 'complete'; _applyLoadData(JSON.parse(JSON.stringify(c)), w2); const lacking = snap();
  return { a, b, fresh, played, charOnly, obj, both, lacking, hasQS: 'QS' in c }; });
console.log(JSON.stringify(r));
check(`a character row alone, loaded in a running game, starts the quests fresh (${r.a} ${r.charOnly[r.a]}, ${r.b} ${r.charOnly[r.b]}; was ${r.played[r.a]}, ${r.played[r.b]})`,
  !r.hasQS && r.charOnly[r.a] === r.fresh[r.a] && r.charOnly[r.b] === r.fresh[r.b] && r.obj === 0, r);
check('with its world row, the world\'s quests come back as saved', r.both[r.a] === r.fresh[r.a] && r.both[r.b] === r.fresh[r.b], r);
check('a quest the world row lacks starts as a new game has it, not as the running game had it', r.lacking[r.b] === r.fresh[r.b] && r.lacking[r.a] === r.fresh[r.a], r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
