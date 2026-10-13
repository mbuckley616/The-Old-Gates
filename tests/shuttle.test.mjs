// The Shuttle (Session 782; the Weaver's row of docs/design/unique-artifacts.md, Michael's 4A on DECISION #263): carried, the
// compass turns to the nearest unread sigil, as the Weaver's Eye does; the cost, for anyone who carries it, the Cold rises 1 for
// each week of game time it is on you (the draft's log line), and each of Varek's discoveries needs one Mastery fewer.
// The trial and its place are owed; the Shuttle is taken here through the frame's artifactTry.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const take = await page.evaluate(() => {
  delete worldState.artifacts; delete worldState.shuttleCarry; worldState.cold = 0; window._keepA = { ...ATTRS };
  const markers = () => getActiveQuestMarkers().filter(m => m.label === 'a warm stone').length;
  const bare = { eye: fxOn('seamsight'), warm: markers(), due: varekDue() };
  ATTRS.intelligence = 35; const c = artifactTry('shuttle'); const it = BAG.find(i => i.artifact === 'shuttle');
  const v = vstate(); const keepV = JSON.parse(JSON.stringify(v)); const keepM = worldState.masteries;
  worldState.masteries = 0; v.deaths = 1; v.done = {}; v.chapel = false; v.gapH = 0; v.shortRoad = null;
  const dueWith = varekDue(); const i = BAG.indexOf(it); BAG.splice(i, 1); const dueWithout = varekDue(); const warmOff = markers(); BAG.splice(i, 0, it);
  worldState.masteries = 1; v.shortRoad = 'Portclare'; v.done.returns = 1; const mapWith = varekDue();
  Object.assign(v, keepV); worldState.masteries = keepM;
  return { bare, ok: c.ok, item: it && { name: it.name, unique: it.unique, desc: it.desc }, warm: markers(), warmOff, near: !!WORLD.nearestSigilDoor(), dueWith, dueWithout, mapWith };
});
console.log(JSON.stringify(take));
check('at Intelligence 35 the Shuttle is taken, unique, with the draft\'s words', take.ok && take.item.name === 'The Shuttle' && take.item.unique && /Spól an Fhíodóra/.test(take.item.desc), take);
check(`carried, the compass shows the nearest unread sigil (${take.warm} marker) without the spell; not carried, none`, !take.bare.eye && take.near && take.bare.warm === 0 && take.warm === 1 && take.warmOff === 0, take);
check(`Varek: with no Mastery and a death, *returns* is due with the Shuttle (${take.dueWith}) and not without (${take.dueWithout}); one Mastery and a short road bring *map* (${take.mapWith})`, take.dueWith === 'returns' && take.dueWithout === null && take.mapWith === 'map', take);

// the Cold: counted in game minutes while it is on you, in every zone
const cold = await page.evaluate(() => {
  const W = 7 * 1440; let T = worldState.gameTimeAbsMinutes || 0; const at = (m) => { worldState.gameTimeAbsMinutes = T = m; return tickShuttle(true); };
  const log0 = GAME_LOG.length; at(T); const r = {};
  at(T + W - 10); r.justShort = worldState.cold; at(T + 10); r.week = worldState.cold; r.line = GAME_LOG.slice(log0).map(l => l.icon + ' ' + l.text);
  at(T + 3 * 1440); const it = BAG.find(i => i.artifact === 'shuttle'); BAG.splice(BAG.indexOf(it), 1); stashBag.push(it);
  at(T + 10 * W); r.stashed = worldState.cold; stashBag.splice(stashBag.indexOf(it), 1); BAG.push(it);
  at(T + 4 * 1440 - 1); r.short = worldState.cold; at(T + 1); r.second = worldState.cold;
  at(T + 3 * W); r.three = worldState.cold; r.acc = worldState.shuttleCarry.acc;
  return r; });
console.log(JSON.stringify(cold));
check(`a week carried raises the Cold to ${cold.week} (a week less ten minutes, ${cold.justShort}), with *${cold.line[0]}* in the log`, cold.justShort === 0 && cold.week === 1 && cold.line.length === 1 && cold.line[0] === '❄ Your hands are colder than the weather.', cold);
check('ten weeks in the stash count nothing; three days before and four after make the second week', cold.stashed === 1 && cold.short === 1 && cold.second === 2, cold);
check(`three weeks more at once (a long sleep) count three (${cold.three})`, cold.three === 5 && cold.acc === 0, cold);

// the loop counts it by itself, and the hub shows the Cold for anyone, not only an Old Blood reader
const loop = await page.evaluate(() => { const c0 = worldState.cold; worldState.gameTimeAbsMinutes += 7 * 1440; return { c0, people: WORLD.playerPeople() }; });
await page.waitForTimeout(2500);
const after = await page.evaluate(() => { renderHubAttrs(); const sb = document.getElementById('standing-body'); const hub = sb ? sb.textContent : '';
  const S = ssSplitPayload(JSON.parse(ssStringify(_buildSavePayload())));
  const r = { cold: worldState.cold, hub: (hub.match(/the Cold \d+/) || [''])[0], charRow: !!(S.c.wS && S.c.wS.shuttleCarry), worldRow: !!(S.w.wS && S.w.wS.shuttleCarry) };
  const it = BAG.find(i => i.artifact === 'shuttle'); if (it) BAG.splice(BAG.indexOf(it), 1); delete worldState.artifacts; delete worldState.shuttleCarry; worldState.cold = 0; Object.assign(ATTRS, window._keepA);
  return r; });
console.log(JSON.stringify(loop), JSON.stringify(after));
check(`the main loop counts it on its own: a week's minutes later the Cold is ${after.cold} (from ${loop.c0}), shown on the hub as *${after.hub}* to a ${loop.people}`, after.cold === loop.c0 + 1 && after.hub === `the Cold ${after.cold}` && loop.people !== 'oldblood', { loop, after });
check('the count rides the character row', after.charRow && !after.worldRow, after);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
