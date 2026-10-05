// Jobs keyed by place and index (Session 502, backlog K step 3, the co-op rules): a lord's job is `tq:<site>:<k>` (the
// count of jobs that town has given), a faction's service `fq:<faction>:<step>:<k>`, a guild task `<guild>:<site>:<n>` (a
// count kept in the guild's saved state), a rank commission `<guild>:c<rank>`. Never a Date.now().
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const site = siteAnywhere('dunmore');
  worldState.quests = []; worldState.gameTimeAbsMinutes = 1440 * 3 + 600;
  const T = () => lordTopics(site);
  T()[0].fn(); const q1 = qActive().find(q => q.giverSite === 'dunmore'); qComplete(q1); T()[1].fn();
  T()[0].fn(); const q2 = qActive().find(q => q.giverSite === 'dunmore');
  const G = gstate(); G.guild_f = { done: 0, active: null };
  offer('guild_f', site); const t1 = G.guild_f.active.id; G.guild_f.active = null; offer('guild_f', site); const t2 = G.guild_f.active.id; const n = G.guild_f.n;
  G.guild_f = { done: 2, active: null }; offer('guild_f', site); const c = G.guild_f.active.id;
  const all = [q1.id, q2.id, t1, t2, c];
  return { all, n, digits: all.some(id => /\d{12,}/.test(String(id))) };
});
console.log(JSON.stringify(r));
check('a lord\'s jobs are the town and its count: tq:dunmore:0, then tq:dunmore:1', r.all[0] === 'tq:dunmore:0' && r.all[1] === 'tq:dunmore:1', r.all);
check('a guild\'s tasks are the guild, the town and its count, kept in the guild\'s state', r.all[2] === 'guild_f:dunmore:1' && r.all[3] === 'guild_f:dunmore:2' && r.n === 2, r);
check('a rank commission is the guild and the rank', r.all[4] === 'guild_f:c2', r.all[4]);
check('no id carries a clock time', !r.digits, r.all);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
