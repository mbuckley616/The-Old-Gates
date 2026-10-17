// The Gate-Blade's claimant, the Crown (Session 787; the page's Stone row, the approved draft's words): the lord at Coeur de Vie
// asks for the blade while it is on you. Given: 1,500 gold and the commission (or a service counted, or the gold alone if sworn
// elsewhere). Kept under licence: a licence item, and a twentieth of every sale at a counter while the blade is on you.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('coeur_de_vie');

const r = await page.evaluate(() => {
  const site = siteAnywhere('coeur_de_vie'); const S = WORLD.settle.get('coeur_de_vie'); const keep = S.houses.find(h => h.type === 'castle');
  const lord = (keep && keep.dlg) || (S.lordNpc && (S.lordNpc.def || (S.lordNpc.userData && S.lordNpc.userData.def))); const lordLabels = () => (lord ? lord.topics.map(t => t.label) : ['no lord: ' + Object.keys(S.lordNpc || {}).join(',')]);
  const fresh = () => { delete worldState.artifacts; for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].artifact || BAG[i].licence) BAG.splice(i, 1); worldState.factions = {}; ATTRS.might = 30; artifactTry('gate_blade'); };
  const keepA = { ...ATTRS }, keepG = gold; const out = {};
  out.none = crownBladeTopics(site).length; fresh(); out.labels = lordLabels(); out.elsewhere = crownBladeTopics(siteAnywhere('dunmore') || allSites().find(t => t.id !== 'coeur_de_vie' && t.kind === 'town')).length;
  const T = crownBladeTopics(site)[0]; out.ask = T.label; out.askQuest = T.quest === true; out.askSay = T.response; out.follow = T.follow.map(f => f.label);
  // given, rank 0
  gold = 0; out.gaveNew = T.follow[0].fn(); out.goldNew = gold; out.rankNew = fstate().crown.rank; out.titleNew = FACTIONS.crown.ranks[fstate().crown.rank - 1]; out.yielded = worldState.artifacts.gate_blade.yielded; out.after = crownBladeTopics(site).length;
  // given, already ranked
  fresh(); fstate().crown.done = 4; fstate().crown.rank = 1; gold = 0; out.gaveRanked = crownBladeTopics(site)[0].follow[0].fn(); out.doneRanked = fstate().crown.done;
  // given, sworn to the League
  fresh(); fstate().league.rank = 2; gold = 0; out.gaveSworn = crownBladeTopics(site)[0].follow[0].fn(); out.goldSworn = gold; out.rankSworn = fstate().crown.rank;
  // kept under licence; the twentieth at a sale
  fresh(); out.keep = crownBladeTopics(site)[0].follow[1].fn(); const lic = BAG.find(i => i.licence === 'gate_blade'); out.lic = lic && { name: lic.name, unique: lic.unique, desc: lic.desc };
  const T2 = crownBladeTopics(site)[0]; out.licLabel = T2.label; out.licQuest = T2.quest === true; out.licSay = T2.response; out.licFollow = T2.follow.map(f => f.label);
  const said = []; const sm = showMsg, rs = renderShop; showMsg = (t) => said.push(t); renderShop = () => {}; /* no counter is open here */
  const sell = () => { BAG.push({ name: 'Old Boot', ico: '👢', type: 'misc', qty: 1, weight: 1, sellMult: .5, buyPrice: 200 }); const g0 = gold; sellItem(BAG.length - 1, 100); return { got: gold - g0, said: said[said.length - 1] }; };
  try { out.saleLic = sell(); const b = BAG.findIndex(i => i.artifact === 'gate_blade'); const blade = BAG.splice(b, 1)[0]; stashBag.push(blade); out.saleStash = sell(); stashBag.splice(stashBag.indexOf(blade), 1); BAG.push(blade); } finally { showMsg = sm; renderShop = rs; }
  out.goldMult = _buffMult('goldFind', 1); out.ser = _serItem(lic).licence;
  // giving it after the licence takes the licence back too
  gold = 0; out.gaveLic = T2.follow[0].fn(); out.licGone = !BAG.some(i => i.licence); out.goldLic = gold;
  delete worldState.artifacts; worldState.factions = {}; Object.assign(ATTRS, keepA); gold = keepG;
  return out; });
console.log(JSON.stringify(r));
check('nothing is asked without the blade, or by another town\'s lord', r.none === 0 && r.elsewhere === 0, r);
check(`with the blade, the keep at Coeur de Vie offers *${r.ask}* with *${r.follow.join('*, *')}*`, r.labels.includes('The blade from the stone.') && r.follow.join('|') === 'Give it to the Crown.|I’ll keep it.|Not now.' && /la Lame du Seuil/.test(r.askSay), r);
check(`given at rank 0: *${r.gaveNew}*; 1500 gold, ${r.titleNew}, the blade the Crown's and the topic gone`, /Commissioner\.$/.test(r.gaveNew) && r.goldNew === 1500 && r.rankNew === 1 && r.titleNew === 'Commissioner' && r.yielded === 'crown' && r.after === 0, r);
check(`given already ranked: *${r.gaveRanked}* (services ${r.doneRanked})`, /counted as a service/.test(r.gaveRanked) && r.doneRanked === 5, r);
check(`given while sworn to the League: the gold (${r.goldSworn}), no rank`, /sworn elsewhere/.test(r.gaveSworn) && r.goldSworn === 1500 && r.rankSworn === 0, r);
check(`kept: *${r.keep}*; *${r.lic.name}*, unique, given to you by name and date`, /^Then here is the licence/.test(r.keep) && r.lic.name === 'Crown Licence — the Gate-Blade' && r.lic.unique && /licence to \S+ to hold/.test(r.lic.desc) && /year of the Peace\.$/.test(r.lic.desc) && r.ser === 'gate_blade', r);
check(`under licence the lord asks *${r.licLabel}* and offers only *Give it to the Crown.*`, r.licLabel === 'The licence.' && /sour like milk/.test(r.licSay) && r.licFollow.join() === 'Give it to the Crown.', r);
const full = Math.round(100 * r.goldMult);
check(`a sale of ${full}: ${r.saleLic.got} with the blade on you, *${r.saleLic.said}*; with the blade in the stash, ${r.saleStash.got}`, r.saleLic.got === full - Math.round(full / 20) && r.saleLic.said.endsWith(`(the Crown's twentieth, ${Math.round(full / 20)})`) && r.saleStash.got === full && !/twentieth/.test(r.saleStash.said), r);
check('given after the licence: the gold, and the licence goes back with it', r.goldLic === 1500 && r.licGone, r);
check(`both are drawn as quest talk, gold like *Serve the Crown.* (S987, the critic's note): ${r.askQuest}, ${r.licQuest}`, r.askQuest && r.licQuest, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
