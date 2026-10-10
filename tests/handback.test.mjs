// A guild task can be handed back (Session 682; Michael's A on DECISION #217, from the critic's s480 run: a *Draught to
// Hermit's Camp* could never be delivered, had no date, and the hall had no topic to take it back, so *Any work?* said *You
// still owe us* for ever). While a task is open and not done, the guild head offers *I can’t do it.*: the task is taken off
// you with no pay and no mark against your standing, and *Any work?* gives another. Played through the head's own topics
// at Ironhaven's Mages' Guild with the critic's stuck draught, then a relic, a raid and a rank commission.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('ironhaven');
const r = await page.evaluate(() => {
  const site = SITE.ironhaven; const out = {};
  const head = (gk) => guildDef(gk, site, null, {});
  const topic = (gk, label) => head(gk).topics.find(t => t.label === label);
  const labels = (gk) => head(gk).topics.map(t => t.label);
  const st = gstate().guild_m; st.active = null; st.done = 0; st.commissions = [];
  // the critic's stuck draught, as an old save holds it
  st.active = { id: 'guild_m:ironhaven:9', g: 'guild_m', kind: 'deliver', siteId: 'hermit_camp', who: null, gold: 67, desc: "Someone in Hermit's Camp, south of here, is sick.", short: "Draught to Hermit's Camp" };
  const g0 = gold, xp0 = xp, done0 = st.done, rank0 = rankOf('guild_m');
  out.before = { labels: labels('guild_m'), work: topic('guild_m', 'Any work?').fn() };
  const said = topic('guild_m', 'I can’t do it.').fn();
  const log = GAME_LOG.slice(-3).map(e => e.text);
  out.after = { said, active: st.active, gold: gold - g0, xp: xp - xp0, done: st.done - done0, rank: rankOf('guild_m') === rank0, labels: labels('guild_m'), log, jl: journalOf('guild_m:ironhaven:9').map(e => e.qk) };
  const fresh = topic('guild_m', 'Any work?').fn();
  out.next = { said: fresh.slice(0, 60), id: st.active && st.active.id, kind: st.active && st.active.kind, labels: labels('guild_m') };
  // a task that is done: the hand-back is not offered, the turn-in is
  st.active.done = true; st.active.have = 99; st.active.got = true; st.active.spawned = true;
  out.done = { labels: labels('guild_m') };
  // a relic lying in the world: handed back, it is taken up
  st.active = null; const rel = { id: 'guild_m:ironhaven:20', g: 'guild_m', kind: 'relic', x: px + 30, z: pz + 30, got: false, gold: 90, short: 'A binding-stone' };
  st.active = rel; ensureTaskWorldObjects(); const relObj = rel._obj && rel._obj.m; const inPick = pickups.some(p => p.task === rel);
  topic('guild_m', 'I can’t do it.').fn();
  out.relic = { hadObj: !!relObj, inPick, objGone: !!relObj && !relObj.parent, pickGone: !pickups.some(p => p.task === rel) };
  // a raid on a town: handed back, the town is not held under raid
  const fs = gstate().guild_f; fs.active = null;
  const S = SETTLE.get('ironhaven');
  fs.active = { id: 'guild_f:ironhaven:30', g: 'guild_f', kind: 'raid', siteId: S.site.id, count: 6, spawned: true, have: 0, gold: 140, short: 'Hold the town' }; S.raid = true;
  topic('guild_f', 'I can’t do it.').fn();
  out.raid = { active: fs.active, raid: !!S.raid };
  // a rank commission handed back comes round again
  st.active = null; st.done = 2; st.commissions = [];
  topic('guild_m', 'Any work?').fn(); const c1 = st.active && st.active.id;
  topic('guild_m', 'I can’t do it.').fn();
  topic('guild_m', 'Any work?').fn(); const c2 = st.active && st.active.id;
  out.commission = { c1, c2 };
  // S692 — the head's line is in their own people's voice (quest review, run 13, finding 23); the worries name no king or tithe (finding 24)
  out.people = head('guild_m').people; out.voices = {};
  for (const p of ['gatelander', 'markman', 'aurennais', 'oldblood', 'other']) { st.active = { id: 'guild_m:ironhaven:40', g: 'guild_m', kind: 'deliver', siteId: 'hermit_camp', gold: 10, short: 'x' }; out.voices[p] = handBack('guild_m', p); }
  out.worries = WORRIES.filter(w => /king|tithe/.test(w)); out.soldier = WORRIES.includes('my brother went for a soldier and never wrote') && WORRIES.includes('the dues went up again and nobody says why');
  st.active = null; st.done = 0; st.commissions = []; fs.active = null;
  return out;
});
console.log('  before', JSON.stringify(r.before));
console.log('  after', JSON.stringify(r.after));
console.log('  next', JSON.stringify(r.next));
console.log('  done', JSON.stringify(r.done), 'relic', JSON.stringify(r.relic), 'raid', JSON.stringify(r.raid), 'commission', JSON.stringify(r.commission));
check('with the stuck draught, *Any work?* says you still owe it, and *I can’t do it.* is offered', /still owe us/.test(r.before.work) && r.before.labels.includes('I can’t do it.') && !r.before.labels.includes("It's done."), r.before);
check('handed back: the task is gone, with no pay, no XP and no mark against your standing', r.after.active === null && r.after.gold === 0 && r.after.xp === 0 && r.after.done === 0 && r.after.rank, r.after);
check('the head answers, the log and the journal say it was handed back, and the topic goes', /[Bb]ack/.test(r.after.said) && r.after.said === r.voices[r.people] && r.after.log.some(t => /Handed back/.test(t)) && r.after.jl.includes('lapsed') && !r.after.labels.includes('I can’t do it.'), r.after);
check('*Any work?* then gives a new task', !!r.next.id && r.next.id !== 'guild_m:ironhaven:9' && !/still owe/.test(r.next.said), r.next);
check('a task that is done offers *It’s done.*, not the hand-back', r.done.labels.includes("It's done.") && !r.done.labels.includes('I can’t do it.'), r.done);
check('a relic handed back is taken up from the world', r.relic.hadObj && r.relic.inPick && r.relic.objGone && r.relic.pickGone, r.relic);
check('a raid handed back leaves the town no longer under raid', r.raid.active === null && !r.raid.raid, r.raid);
check('a rank commission handed back comes round again', !!r.commission.c1 && /:c2$/.test(r.commission.c1) && r.commission.c2 === r.commission.c1, r.commission);
console.log('  voices', JSON.stringify(r.voices), 'worries', JSON.stringify(r.worries));
check('each people hands back in its own voice: four different lines and a plain one for anyone else', new Set(Object.values(r.voices)).size === 5 && /Master/.test(r.voices.aurennais) && /^Aye\./.test(r.voices.markman) && /set down/.test(r.voices.gatelander) && /Someone else will carry it/.test(r.voices.oldblood), r.voices);
check('no townsperson’s worry names a king or a tithe', r.worries.length === 0 && r.soldier, r.worries);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
