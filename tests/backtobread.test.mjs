// Back to Their Bread (Session 1030; the approved draft, quest_drafts.md): after the open ending (`worldState.knowing`) a
// generated townsperson once in a long while greets you with one of the three descriptions in their people's voice, at most
// once a game-week, one greeting in six, seeded by the person and the hour; and Varek is seen at a distance at the fields.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');

const r = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'), out = {};
  const def = S.houses.map(h => h.dlg).find(d => d && !d.authored && d._siteId && d.role !== 'Guard' && d.nameKey !== 'lord' && !Object.values(GUILD_DEF).some(x => x.role === d.role));
  out.who = def && [def.name, def.role, def.people];
  const all = new Set(); for (const p in KNOWING_LINES) for (const k in KNOWING_LINES[p]) all.add(KNOWING_LINES[p][k].replace(/\{nick\}/g, duelNick()));
  const v = vstate(); v.deaths = 0; v.shortRoad = null; delete v.told; worldState.knowing = false;
  const t0 = worldState.gameTimeAbsMinutes || 0;
  // before the ending: never
  let before = 0; for (let h = 0; h < 300; h++) { worldState.gameTimeAbsMinutes = t0 + h * 60; if (knowingGreet(def)) before++; delete v.told; } out.before = before;
  worldState.knowing = true;
  // the rate, and which descriptions are open
  const kinds = s => Object.entries(KNOWING_LINES[def.people] || KNOWING_LINES.gatelander).find(([k, l]) => l.replace(/\{nick\}/g, duelNick()) === s)?.[0];
  let hits = 0; const seen0 = new Set(); for (let h = 0; h < 1200; h++) { worldState.gameTimeAbsMinutes = t0 + h * 60; const l = knowingGreet(def); if (l) { hits++; seen0.add(kinds(l)); } delete v.told; }
  out.rate = hits / 1200; out.open0 = [...seen0].sort();
  v.deaths = 1; v.shortRoad = 'Portclare'; const seen1 = new Set(); for (let h = 0; h < 1200; h++) { worldState.gameTimeAbsMinutes = t0 + h * 60; const l = knowingGreet(def); if (l) seen1.add(kinds(l)); delete v.told; } out.open1 = [...seen1].sort();
  // the same hour gives the same answer
  let hitH = -1; for (let h = 0; h < 400 && hitH < 0; h++) { worldState.gameTimeAbsMinutes = t0 + h * 60; delete v.told; if (knowingGreet(def)) hitH = h; }
  worldState.gameTimeAbsMinutes = t0 + hitH * 60; delete v.told; const a = knowingGreet(def); delete v.told; const b = knowingGreet(def); out.same = a === b && !!a;
  // through the dialogue: the greeting is the line, then once a week only
  delete v.told; openDialog(def); out.greet = document.getElementById('dlg-text').textContent; closeDialog();
  out.greetIsLine = all.has(out.greet); out.told = v.told;
  let again = 0; for (let h = 0; h < 160; h++) { worldState.gameTimeAbsMinutes = t0 + hitH * 60 + h * 60; openDialog(def); if (all.has(document.getElementById('dlg-text').textContent)) again++; closeDialog(); } out.again = again;
  let week = 0; for (let h = 0; h < 400; h++) { worldState.gameTimeAbsMinutes = t0 + hitH * 60 + 7 * 1440 + h * 60; if (knowingGreet(def)) { week++; break; } } out.week = week;
  // who never says it
  const never = [Object.assign({}, def, { authored: true }), Object.assign({}, def, { role: 'Guard' }), Object.assign({}, def, { nameKey: 'lord' }), Object.assign({}, def, { _siteId: undefined }), Object.assign({}, def, { name: 'Varek' }), Object.assign({}, def, { role: Object.values(GUILD_DEF)[0].role })];
  let nv = 0; for (const d of never) for (let h = 0; h < 200; h++) { worldState.gameTimeAbsMinutes = t0 + h * 60; delete v.told; if (knowingGreet(d)) nv++; } out.never = nv;
  // the four peoples, the draft's words; the Markman's nickname
  out.lines = {}; for (const p of ['gatelander', 'markman', 'aurennais', 'oldblood']) { const d = Object.assign({}, def, { people: p }); for (let h = 0; h < 400; h++) { worldState.gameTimeAbsMinutes = t0 + h * 60; delete v.told; const l = knowingGreet(d); if (l) { out.lines[p] = l; break; } } }
  out.nick = duelNick();
  delete v.told; worldState.gameTimeAbsMinutes = t0;
  return out; });
console.log(JSON.stringify(r).slice(0, 2500));
check(`a townsperson (${r.who}) never says it before the ending (${r.before} of 300 hours)`, r.who && r.before === 0, r);
check(`after it, one greeting in six (${(r.rate * 100).toFixed(1)}%); only *returns* with no death and no short road (${r.open0}); all three with both (${r.open1})`, r.rate > .12 && r.rate < .22 && r.open0.join() === 'returns' && r.open1.join() === 'dies,returns,road', r);
check('the same person in the same hour gives the same answer (a seeded roll)', r.same, r);
check(`the dialogue opens on the line (*${(r.greet || '').slice(0, 60)}…*) and records the minute; not again for a week (${r.again} in 160 hours); after a week it can come again`, r.greetIsLine && r.told != null && r.again === 0 && r.week === 1, r);
check(`never from a named character, a guard, a lord, a guild head, Varek, or anyone without a town (${r.never})`, r.never === 0, r);
check('the four peoples, the draft\'s words, each ending on the work in hand', Object.keys(r.lines).length === 4
  && /(The butter won’t wait on a song\.|I’ve bread in the oven\.|the dough’s risen while I stood talking\.)$/.test(r.lines.gatelander)
  && /(That wood won’t split itself\.|The forge wants feeding\.|I’ve hides to scrape\.)$/.test(r.lines.markman) && !r.lines.markman.includes('{nick}')
  && /^(Forgive me, Master\.|The old carvings speak|Master, the old songs)/.test(r.lines.aurennais)
  && /^An (té|bóthar)/.test(r.lines.oldblood), r.lines);

// Varek at the fields
const f = await page.evaluate(() => {
  const out = {}, F = fieldFor('gatelands'); out.field = F && F.name;
  const v = vstate(); v.fieldSeen = {}; worldState.knowing = true; const t0 = worldState.gameTimeAbsMinutes || 0;
  px = F.x + 300; pz = F.z; const m0 = GAME_MSGS_SEEN = []; const sm = window.showMsg; window.showMsg = (t, c) => { GAME_MSGS_SEEN.push(t); return sm(t, c); };
  tickVarek(.1); const n = VFLD.npc; out.appeared = !!n; out.msg1 = GAME_MSGS_SEEN.slice(-1)[0];
  if (n) { out.dist = Math.hypot(px - n.g.position.x, pz - n.g.position.z); out.toField = Math.hypot(F.x - n.g.position.x, F.z - n.g.position.z); out.topics = n.def ? (n.def.topics || []).length : -1; out.inScene = !!n.g.parent; }
  tickVarek(.1); out.still = VFLD.npc === n;
  px = n.g.position.x + 30; pz = n.g.position.z; tickVarek(.1); out.gone = !VFLD.npc; out.msg2 = GAME_MSGS_SEEN.slice(-1)[0];
  px = F.x + 300; pz = F.z; tickVarek(.1); out.notAgain = !VFLD.npc;
  worldState.gameTimeAbsMinutes = t0 + 10 * 1440 + 1; tickVarek(.1); out.tenDays = !!VFLD.npc;
  const k = GAME_MSGS_SEEN.length; px = F.x + 600; pz = F.z; tickVarek(.1); out.leftSilent = !VFLD.npc && GAME_MSGS_SEEN.length === k;
  worldState.knowing = false; worldState.gameTimeAbsMinutes = t0; window.showMsg = sm; return out; });
console.log(JSON.stringify(f));
check(`at ${f.field}, 300 off: he stands ${f.dist && f.dist.toFixed(1)} away toward the field (${f.toField && f.toField.toFixed(1)} from it), no topics, in the scene; *${f.msg1}*`, f.appeared && Math.abs(f.dist - 90) < 1 && Math.abs(f.toField - 210) < 1 && f.topics === 0 && f.inScene && f.msg1 === 'Far off across the field, someone is standing, looking out.' && f.still, f);
check(`within 40 he is gone: *${f.msg2}*; not again for ten game-days; then again; leaving the field he goes silently`, f.gone && f.msg2 === 'Where he stood, the grass is pressed flat, and springing back.' && f.notAgain && f.tenDays && f.leftSilent, f);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
