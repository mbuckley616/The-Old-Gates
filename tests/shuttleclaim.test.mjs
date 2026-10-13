// The Shuttle's claimant, the Church (Session 790; the page's Weaver row, the approved draft's words): the Prior at the Compact's
// seat asks for the Shuttle while it is on you. Given: three services with the Compact (never past the eve of its ninth, which is
// played), or none if sworn elsewhere; the letter to the Herald either way. A priest anywhere points the way in their people's
// words. The same cap now holds for the Crown's and the Compact's claims (Sessions 787 and 788).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const seat = await page.evaluate(() => { WORLD.anchoredPlaces(); const s = siteAnywhere(FACTIONS.compact.seat); px = s.x; pz = s.z; return { id: s.id, name: s.name }; });
await g.settle(seat.id);

const r = await page.evaluate((id) => {
  const site = siteAnywhere(id), S = WORLD.settle.get(id); const lord = S.lordNpc ? S.lordNpc.def : (S.houses.find(h => h.type === 'castle') || {}).dlg;
  const church = (S.houses.find(h => h.type === 'church') || {}).dlg; const out = { lordName: lord && lord.name, church: !!church, female: lordFor(site).female };
  const keepG = gold;
  const fresh = () => { delete worldState.artifacts; for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact) BAG.splice(i, 1); worldState.factions = {}; takeArtifact('shuttle'); };
  const topic = () => churchShuttleTopics(site)[0];
  delete worldState.artifacts; out.none = churchShuttleTopics(site).length; out.nonePriest = church ? church.topics.some(t => t.label === 'The shuttle.') : null;
  fresh(); out.labels = lord.topics.map(t => t.label); out.elsewhere = churchShuttleTopics(siteAnywhere('coeur_de_vie')).length;
  const T = topic(); out.ask = T.label; out.askSay = T.response; out.follow = T.follow.map(f => f.label);
  // the priests
  const ct = church && church.topics.find(t => t.label === 'The shuttle.'); out.priestHere = ct && { say: ct.response, people: church.people };
  out.priests = {}; for (const p of ['gatelander', 'markman', 'aurennais', 'oldblood']) out.priests[p] = shuttlePriestTopics({ people: p })[0].response;
  // given, the Compact open, no services yet
  const C = () => fstate().compact; out.gave = T.follow[0].fn(); out.after = { done: C().done, rank: C().rank, yielded: worldState.artifacts.shuttle.yielded, herald: worldState.artifacts.shuttle.herald != null, topic: churchShuttleTopics(site).length, bag: BAG.some(i => i.artifact === 'shuttle'), log: GAME_LOG.slice(-3).map(e => e.text) };
  // given as Factor at six: entered to eight, the ninth still to play
  fresh(); Object.assign(C(), { done: 6, rank: 2 }); topic().follow[0].fn(); out.six = { done: C().done, rank: C().rank };
  // given as Prior: three more
  fresh(); Object.assign(C(), { done: 9, rank: 3 }); topic().follow[0].fn(); out.prior = { done: C().done, rank: C().rank };
  // given while sworn to the League: none, and the letter written
  fresh(); fstate().league.rank = 2; out.sworn = topic().follow[0].fn(); out.swornAfter = { done: C().done, rank: C().rank, herald: worldState.artifacts.shuttle.herald != null };
  // kept, not now, in the stash
  fresh(); out.keep = topic().follow[1].response; out.not = topic().follow[2].response; out.kept = churchShuttleTopics(site).length;
  const i = BAG.findIndex(x => x.artifact === 'shuttle'); const sh = BAG.splice(i, 1)[0]; stashBag.push(sh); out.stash = churchShuttleTopics(site).length + shuttlePriestTopics({ people: 'aurennais' }).length; stashBag.splice(stashBag.indexOf(sh), 1);
  // the Crown's and the Compact's claims, at the ninth service's eve: no rank 3 and no war from a gift
  delete worldState.artifacts; worldState.factions = {}; ATTRS.might = 30; artifactTry('gate_blade'); Object.assign(fstate().crown, { done: 8, rank: 2 }); const war0 = JSON.stringify(worldState.war || null);
  crownBladeTopics(siteAnywhere('coeur_de_vie'))[0].follow[0].fn(); out.crown = { done: fstate().crown.done, rank: fstate().crown.rank, war: JSON.stringify(worldState.war || null) === war0 };
  delete worldState.artifacts; worldState.factions = {}; for (let k = BAG.length - 1; k >= 0; k--) if (BAG[k].artifact) BAG.splice(k, 1);
  delete worldState.artifacts; worldState.factions = {}; gold = keepG;
  return out; }, seat.id);
console.log(JSON.stringify(r).slice(0, 2500));
check(`nothing is asked without the Shuttle, or at Coeur de Vie; at ${seat.name} ${r.lordName} asks *${r.ask}* with *${r.follow.join('*, *')}*`, r.none === 0 && r.nonePriest === false && r.elsewhere === 0 && r.labels.includes('The shuttle.') && r.follow.join('|') === 'Give it to the Church.|I’ll keep it.|Not now.' && /la Navette/.test(r.askSay), r);
check(`given with the Compact open: *${r.gave}*; services ${r.after.done}, rank ${r.after.rank}, the letter written, the Shuttle the Church's`, /^Received, and entered: three services/.test(r.gave) && r.after.done === 3 && r.after.rank === 1 && r.after.yielded === 'church' && r.after.herald && r.after.topic === 0 && !r.after.bag && r.after.log.includes(`Gave the Shuttle to the Church at ${seat.name}.`) && r.after.log.includes('The Compact: named Clerk.'), r.after);
check(`given at six services: entered to ${r.six.done}, rank ${r.six.rank} (the ninth is played); as Prior at nine: ${r.prior.done}`, r.six.done === 8 && r.six.rank === 2 && r.prior.done === 12 && r.prior.rank === 3, r);
check(`given while sworn to the League: *${r.sworn}*; no services, the letter written`, /^Received\. The services the Compact cannot enter/.test(r.sworn) && r.swornAfter.done === 0 && r.swornAfter.rank === 0 && r.swornAfter.herald, r);
check('kept or put off: the draft\'s lines, and the topic stands; with the Shuttle in the stash nobody asks', /^Then I will not argue the point/.test(r.keep) && /^The offer stands, Master/.test(r.not) && r.kept === 1 && r.stash === 0, r);
const pr = r.female ? 'her' : 'him';
check(`${seat.name}'s priest (${r.priestHere && r.priestHere.people}) points the way: *${r.priestHere && r.priestHere.say}*`, r.church && r.priestHere && r.priestHere.say === r.priests[r.priestHere.people], r.priestHere);
check(`the four peoples' priests, the Prior *${pr}*`, r.priests.gatelander.includes(`Take it to ${pr}, or don't.`) && r.priests.aurennais === `That object is the Prior's concern, Master, at ${seat.name}, and not this house's. I would take it to ${pr}. I would not keep it.` && /^That's the Church's business/.test(r.priests.markman) && /^Spól an Fhíodóra\./.test(r.priests.oldblood), r.priests);
check(`the Crown's claim at the ninth's eve: services ${r.crown.done}, rank ${r.crown.rank}, no war`, r.crown.done === 8 && r.crown.rank === 2 && r.crown.war, r.crown);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
