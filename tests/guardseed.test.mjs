// Session 509: the co-op rules (CLAUDE.md, Michael's A on #119; backlog K step 3). The town guard who draws on you was the
// last foe with no id: his blows rolled on Math.random. He is now keyed by his town, his place among its people and the
// minute he drew, `<site>:guard:<index>:<minute>`, and his fight rolls on that id's stream: the same guard drawn in the same
// minute (two machines, stood in for by one draw, a stand-down and a second draw) rolls the same; another minute does not.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const draw = (min) => page.evaluate((min) => { worldState.gameTimeAbsMinutes = min; const S = WORLD.settle.get('dunmore');
  const n = WORLD.guardsOf(S).find(n => !n._drawn) || WORLD.guardsOf(S)[0]; window._gn = n;
  const e = guardDraw(n, S); const rolls = []; for (let k = 0; k < 8; k++) rolls.push(+foeRand(e).toFixed(6));
  const out = { id: e.id, rng: typeof e.rng === 'function', name: e.name, idx: S.npcs.indexOf(n), rolls };
  standDown(S); return out; }, min);

const a = await draw(9000);
const b = await draw(9000);
const c = await draw(9017);
console.log(JSON.stringify({ a, b, c }));
check(`the guard who draws is keyed by town, place and minute (${a.id}) and has a stream`, a.name === 'Town Guard' && a.id === `dunmore:guard:${a.idx}:9000` && a.idx >= 0 && a.rng, a);
check('drawn again in the same minute he rolls the same fight', b.id === a.id && JSON.stringify(b.rolls) === JSON.stringify(a.rolls), { a, b });
check(`drawn in another minute (${c.id}) he rolls another`, c.id !== a.id && JSON.stringify(c.rolls) !== JSON.stringify(a.rolls), { a, c });

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
