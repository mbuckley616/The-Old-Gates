// One shrine bears its god's name (Session 978; QA's note of 15 Oct: `bridgenames` FLAKY with two *Shrine of Na Beithígh*).
// `buildShrine` renamed every shrine to its god when its cell built, after the naming pass had made every name unique, so
// two shrines of one god collided once both had built. Now the first of a god's shrines in the grid's order takes the god's
// name and any other keeps its own. Two shrines of one god are built here, the second first, and their names read.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const pick = await page.evaluate(() => { const by = new Map(); for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) WORLD.getCell(i, j).sites.forEach(t => {
    if (t.kind !== 'shrine' || t.pad < 0) return; const n = godOf(t).name; if (!by.has(n)) by.set(n, []); by.get(n).push({ id: t.id, name: t.name }); });
  const pair = [...by.entries()].find(([, L]) => L.length >= 2); const owners = [...by.entries()].map(([n, L]) => [n, godShrineOwner({ name: n }) === L[0].id]);
  return { pair: pair && { god: pair[0], first: pair[1][0], second: pair[1][1] }, owners, gods: by.size }; });
console.log(JSON.stringify(pick));
check(`a god with two shrines (${pick.gods} gods with shrines)`, !!pick.pair, pick);
check('every god\'s name goes to the first of its shrines in the grid\'s order', pick.owners.every(o => o[1]), pick.owners);
// build the second first, so load order would have given it the name
await g.settle(pick.pair.second.id);
const atB = await page.evaluate(id => { const S = WORLD.settle.get(id); return { built: !!S, god: S && S.god && S.god.name, name: WORLD.siteAnywhere(id).name }; }, pick.pair.second.id);
await g.settle(pick.pair.first.id);
const r = await page.evaluate(p => { const a = WORLD.siteAnywhere(p.first.id), b = WORLD.siteAnywhere(p.second.id);
  const named = []; for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) WORLD.getCell(i, j).sites.forEach(t => { if (t.name) named.push(t.name); });
  return { first: a.name, second: b.name, builtA: !!WORLD.settle.get(p.first.id), 
    dups: [...new Set(named.filter((x, i) => named.indexOf(x) !== i))] }; }, pick.pair);
r.builtB = atB.built; r.godB = atB.god; r.secondThen = atB.name;
console.log(JSON.stringify(r));
check(`both shrines built (${r.builtA}, ${r.builtB})`, r.builtA && r.builtB, r);
check(`the first is *${r.first}*`, r.first === `Shrine of ${pick.pair.god}`, r);
check(`the second keeps its own name, *${r.second}*, and its god (${r.godB})`, r.second === pick.pair.second.name && r.secondThen === r.second && r.second !== r.first && r.godB === pick.pair.god, r);
check('no two named places share a name', r.dups.length === 0, r.dups);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
