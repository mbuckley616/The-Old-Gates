// The great gates' two paths and the world's corruption level (card F12's number, Session 1340; Michael, 13 Oct 2026, lore §9a;
// visual-foundation.md §2). Each great gate is untouched, torn or sealed; the level is the number torn; any choice can be undone
// until all six share one state, and then the fate is fixed. The state is the world's: it rides the world row, and a save keeps it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  out.start = corruptionLevel();
  out.bad = [setGreatGate('ember', 'torn'), setGreatGate('tine', 'open')];
  setGreatGate('tine', 'torn'); setGreatGate('uisce', 'torn'); setGreatGate('scath', 'sealed');
  out.two = corruptionLevel(); out.torn = corruptionTorn().join(',');
  setGreatGate('uisce', 'sealed'); out.undone = corruptionLevel();
  for (const s of ['tine', 'uisce', 'cloch', 'scath', 'solas']) setGreatGate(s, 'torn');
  out.five = corruptionLevel(); out.fiveFate = greatFate();
  setGreatGate('gaoth', 'sealed'); out.mixFate = greatFate();
  out.split = (() => { const p = ssSplitPayload(_buildSavePayload()); return { world: !!(p.w && p.w.wS && p.w.wS.greatGates), char: !!(p.c && p.c.wS && p.c.wS.greatGates) }; })();
  return out;
});
console.log(JSON.stringify(r));
check(`a new world stands at level 0 (${r.start})`, r.start === 0, r);
check('an unknown school or state changes nothing', r.bad.every(x => x === false), r);
check(`two torn and one sealed is level 2, the torn named for the horizon (${r.torn})`, r.two === 2 && r.torn === 'tine,uisce', r);
check(`a torn gate sealed again lowers the level (${r.undone})`, r.undone === 1, r);
check(`five torn and one sealed is level 5, fate still open`, r.five === 5 && r.mixFate === null, r);
check('the state is the world\'s: it rides the world row, not the character\'s', r.split.world && !r.split.char, r.split);
await page.evaluate(() => saveToSlot(0));
await page.reload();
await page.waitForFunction(() => { const b = document.getElementById('cb'); return b && typeof saveToSlot === 'function' && getComputedStyle(b).display !== 'none'; }, null, { timeout: 120000, polling: 100 });
await page.evaluate(() => document.getElementById('cb').click());
await page.waitForFunction(() => typeof corruptionLevel === 'function' && worldState.greatGates, null, { timeout: 120000, polling: 200 });
const s = await page.evaluate(() => {
  const out = { loaded: corruptionLevel() };
  out.lastTorn = setGreatGate('gaoth', 'torn'); out.fate = greatFate(); out.six = corruptionLevel();
  out.after = [setGreatGate('tine', 'sealed'), corruptionLevel(), greatFate()];
  return out;
});
console.log(JSON.stringify(s));
check(`a save and a load keep the five torn (${s.loaded})`, s.loaded === 5, s);
check('the sixth to match fixes the fate: six torn, level 6', s.lastTorn === true && s.fate === 'torn' && s.six === 6, s);
check('once fate is fixed nothing undoes it', s.after[0] === false && s.after[1] === 6 && s.after[2] === 'torn', s);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
