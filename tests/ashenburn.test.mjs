// Q7 in the open world, part 1 (Session 269, Michael's A on issue #32): handing in Q6 burns the world's Ashenmoor for
// good — the war code's ruin, burnt shells and nobody in the street — but Edna's cottage and Brother Oswin's oratory
// stand, with the two of them inside. Coming onto its pad is Q7's first step, *Return to Ashenmoor*.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('ashenmoor');
const stop = g.keepAlive();

const before = await page.evaluate(() => { const S = WORLD.settle.get('ashenmoor'); forceTime(14); for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now()); return { rigs: WORLD.scene.children.filter(o => o.userData && o.userData.rig && Math.hypot(o.position.x - S.site.x, o.position.z - S.site.z) < (S.site.pad || 58)).length, houses: S.houses.length, npcs: S.npcs.length, keepers: S.houses.map(h => h.keeper) }; });
// Q6 handed in, from a distance (the hand-in is in Ironhaven)
const q6 = await page.evaluate(() => { const t = WORLD.siteAnywhere('ashenmoor'); px = t.x + 400; pz = t.z; jumpY = WORLD.worldH(px, pz);
  QS.q6_binding_stone = QS.q6_binding_stone || {}; QS.q6_binding_stone.state = 'reward'; completeQuest('q6_binding_stone');
  for (let i = 0; i < 10; i++) WORLD.tick(1 / 60, performance.now());
  return { q6: qState('q6_binding_stone'), q7: qState('q7_the_rubbing'), pending: !!worldState.ashenmoorPending, burnedFlag: WORLD.TS(t).flags.burned != null, o0: QS.q7_the_rubbing && QS.q7_the_rubbing.objectives && QS.q7_the_rubbing.objectives[0] && QS.q7_the_rubbing.objectives[0].current }; });
console.log(JSON.stringify({ before, q6 }));
check('the living town has its people in the scene (the count below means something)', before.rigs > 0, before);
check('Q6 handed in: Q7 active, and the world\'s Ashenmoor flagged burned before you see it', q6.q6 === 'complete' && q6.q7 === 'active' && q6.pending && q6.burnedFlag && !q6.o0, q6);

await g.settle('ashenmoor');
const ruin = await page.evaluate(() => { forceTime(14); for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now()); const S = WORLD.settle.get('ashenmoor');
  const rigs = WORLD.scene.children.filter(o => o.userData && o.userData.rig && Math.hypot(o.position.x - S.site.x, o.position.z - S.site.z) < (S.site.pad || 58)).length;
  return { rigs, dead: !!S.dead, houses: S.houses.map(h => h.keeper + ':' + h.type), visible: S.npcs.filter(n => n.g.visible).length, who: S.npcs.filter(n => n.g.visible).map(n => n.def.name + '/' + n.def.role + '/' + (n.sched && n.sched.type)), lord: !!S.lordNpc, burned: !!worldState.ashenmoorBurned, q7: QS.q7_the_rubbing.objectives.map(o => o.current || 0), done0: !!(QS.q7_the_rubbing.objectives[0].done || QS.q7_the_rubbing.objectives[0].current >= (QS.q7_the_rubbing.objectives[0].count || 1)) }; });
console.log(JSON.stringify(ruin));
check('the ruin: nobody in the street, no lord; of the houses only Edna\'s cottage and the oratory stand', ruin.dead && ruin.visible === 0 && ruin.rigs === 0 && !ruin.lord && ruin.houses.length === 2 && ruin.houses.some(h => /^Edna:/.test(h)) && ruin.houses.some(h => /^Brother Oswin:church/.test(h)), ruin);
check('coming onto the pad is Q7\'s first step, Return to Ashenmoor', ruin.burned && ruin.done0, ruin);

// Edna at home at 23h, in her burned voice
const edna = await page.evaluate(() => { forceTime(23); const S = WORLD.settle.get('ashenmoor'); const h = S.houses.find(x => x.keeper === 'Edna'); window._h = h; px = h.exitX; pz = h.exitZ; goToInterior(h); return h.id; });
await page.waitForTimeout(4500); await g.hide();
const talk = await page.evaluate(() => { const inside = currentHouse === window._h; const here = !!intNPCMesh; if (here) { px = intNPCPos.x; pz = intNPCPos.z + 1; jumpY = 0; interact(); }
  const out = { inside, here, open: dlgOpen, name: dlgOpen && document.getElementById('dlg-name').textContent, text: dlgOpen && document.getElementById('dlg-text').textContent }; if (dlgOpen) closeDialog(); return out; });
const burnedLines = await page.evaluate(() => SHOP_DIALOG_BURNED.Edna.greeting);
console.log(JSON.stringify(talk));
check('Edna is in her cottage at 23h and speaks as she does after the burning', talk.inside && talk.here && talk.open && /Edna/.test(talk.name || '') && burnedLines.some(l => (talk.text || '').includes(l.slice(0, 20))), { talk, burnedLines });
// the burning holds: thirty days on it is still a ruin
const held = await page.evaluate(() => { const t = WORLD.siteAnywhere('ashenmoor'); const st = WORLD.TS(t); st.p = 60; worldState.gameTimeAbsMinutes += 40 * 1440; for (let i = 0; i < 5; i++) WORLD.tick(1 / 60, performance.now()); return { burned: st.flags.burned != null }; });
check('forty days on, the ruin is still a ruin', held.burned, held);
stop(); check('no page errors', g.errs.length === 0, g.errs);
await g.close();
