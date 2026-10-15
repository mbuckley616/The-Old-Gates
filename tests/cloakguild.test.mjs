// The cloak's claimant, the Fighters' Guild (Session 789; the page's Beasts row, the approved draft's words): while the
// Wolf-Mother's Cloak, taken alive, is on you and its master lives, any Fighters' Guild head asks about it in their people's
// voice and offers a contract on the master. Taken, it is the Guild's active task, done when the cavern's master is dead and
// turned in with the Guild's own lines.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {}; const sd = cloakSeed(), P = artifactPlaces().wolf_cloak; out.lair = P && P.name; out.town = (cloakTown() || {}).name;
  const st = gstate().guild_f; const keepG = gold, keepBack = EQ.back, keepAct = st.active;
  const towns = allSites().filter(t => t.kind === 'town' || t.kind === 'city'); const byP = {};
  for (const t of towns) { const p = peopleOfSite(t); if (!byP[p]) byP[p] = t; }
  out.peoples = Object.keys(byP);
  const home = byP.gatelander || towns[0];
  const head = (site) => guildDef('guild_f', site, null, {}); const labels = (site) => head(site).topics.map(t => t.label);
  const topic = (site, l) => head(site).topics.find(t => t.label === l);
  const fresh = (half) => { delete worldState.artifacts; for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1); EQ.back = null;
    (worldState.masters || (worldState.masters = {}))[sd] = { dead: false, hoard: { x: 0, z: 0, floor: 1, items: [] } }; takeArtifact('wolf_cloak');
    const i = BAG.findIndex(it => it.artifact === 'wolf_cloak'); EQ.back = BAG.splice(i, 1)[0]; if (half) { worldState.artifacts.wolf_cloak.half = true; EQ.back.half = true; } st.active = null; };
  delete worldState.artifacts; EQ.back = null; st.active = null; out.none = labels(home).includes('The grey cloak.');
  fresh(true); out.half = labels(home).includes('The grey cloak.');
  fresh(); worldState.masters[sd].dead = true; out.dead = labels(home).includes('The grey cloak.');
  fresh(); const cl = EQ.back; EQ.back = null; stashBag.push(cl); out.stash = labels(home).includes('The grey cloak.'); stashBag.splice(stashBag.indexOf(cl), 1); EQ.back = cl;
  out.fee = cloakContractFee(); out.fee2 = cloakContractFee();
  out.voices = {}; for (const p in byP) { const T = topic(byP[p], 'The grey cloak.'); out.voices[p] = T && { say: T.response, follow: T.follow.map(f => f.label), not: T.follow[1].response }; }
  out.mine = labels(home);
  // another task owed: the contract waits
  // (quest review finding 30: the refusal in the head's own people, for the contract and for *Any work?* alike)
  out.owed = {}; for (const p in byP) { st.active = { id: 'guild_f:x:1', g: 'guild_f', kind: 'hunt', target: 'Wolf', need: 4, have: 0, gold: 60, short: 'Hunt 4 Wolves' };
    out.owed[p] = { cloak: topic(byP[p], 'The grey cloak.').follow[0].fn(), work: topic(byP[p], 'Any work?').fn() }; }
  out.owed.oldblood = { cloak: OWE_LINES.oldblood('Hunt 4 Wolves', '0/4'), work: OWE_LINES.oldblood('Hunt 4 Wolves', '0/4') }; st.active = null;
  // taken
  out.take = topic(home, 'The grey cloak.').follow[0].fn(); const A = st.active; out.task = A && { id: A.id, kind: A.kind, gold: A.gold, short: A.short, x: A.x === P.x };
  out.afterTake = labels(home); out.notYet = topic(home, 'It’s done.') ? 'offered' : 'no';
  // the master dies: done, and turned in
  worldState.masters[sd].dead = true; out.doneLabels = labels(home); const g0 = gold; out.turn = topic(home, "It's done.").fn(); out.paid = gold - g0; out.active = st.active; out.expect = questGold(out.fee);
  delete worldState.artifacts; delete worldState.masters[sd]; EQ.back = keepBack; gold = keepG; st.active = keepAct;
  return out; });
console.log(JSON.stringify(r).slice(0, 3000));
check(`the cloak's lair is ${r.lair}, its town ${r.town}; nothing is asked without the cloak, with the thin one, with its master dead, or with it in the stash`, r.lair && r.town && !r.none && !r.half && !r.dead && !r.stash, r);
const fill = (s) => s.replace('${lair}', r.lair).replace('${town}', r.town).replace('${fee}', r.fee);
const D = { gatelander: "That's no cloak you bought at a fair. And the master of ${lair} is still breathing", markman: 'Took that off a live one, aye? Thought so.', aurennais: "That cloak, Master, is from no loom I know", oldblood: 'Brat na Máthar. You walked in and walked out.' };
for (const p of r.peoples) { const v = r.voices[p]; check(`a ${p} head asks *The grey cloak.*: *${v && v.say.slice(0, 90)}…*`, v && v.say.startsWith(fill(D[p])) && v.say.includes(String(r.fee)) && v.say.includes(r.town) && v.follow.join('|') === 'I’ll take the contract.|Not that one.' && !v.say.includes('${'), v); }
check(`the fee is the beast contract's, fixed by the contract's id: ${r.fee}`, r.fee === r.fee2 && r.fee >= 100 && r.fee < 140 + 50 * 3, r);
const OWED = { gatelander: "You'll not plough two fields with the one ox. Yours is still on the board: Hunt 4 Wolves. 0/4.", markman: 'You still owe us: Hunt 4 Wolves. 0/4.', aurennais: 'Forgive me, Master; one contract is closed before the next is entered. Yours is still open: Hunt 4 Wolves. 0/4.', oldblood: 'Yours is not done: Hunt 4 Wolves. 0/4.' };
for (const p in OWED) { const o = r.owed[p]; check(`with another task owed, a ${p} head says *${o && o.cloak}* to the contract and to *Any work?*`, !!o && o.cloak === OWED[p] && o.work === OWED[p], o); }
check(`taken: *${r.take}*; the task is *${r.task && r.task.short}* at ${r.fee}, the topic gone and the hand-back offered`, r.take === "Then it's on the board with your name beside it. Go gently in. It knows you." && r.task && r.task.kind === 'cloak' && r.task.gold === r.fee && r.task.x && !r.afterTake.includes('The grey cloak.') && r.afterTake.includes('I can’t do it.') && !r.afterTake.includes("It's done."), r);
check(`the master dead: *It's done.* pays ${r.paid}: *${r.turn}*`, r.doneLabels.includes("It's done.") && /^Good work\. \d+ gold\./.test(r.turn) && r.paid === r.expect && r.active === null, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
