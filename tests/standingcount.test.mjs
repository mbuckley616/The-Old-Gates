// *My standing?* at a guild head (the critic, 8 Oct, s477): after the first commission it said *1 tasks done.* It now says
// *1 task done.*, and *N tasks done.* for 0 and from 2 on (Session 648).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const site = siteAnywhere('dunmore'); const out = {};
  for (const n of [0, 1, 2, 7]) { gstate().guild_f = { done: n, active: null };
    const d = guildDef('guild_f', site); const t = d.topics.find(t => t.label === 'My standing?'); out[n] = t ? t.fn() : null; }
  return out;
});
console.log(JSON.stringify(r));
check('one commission: *1 task done.*', /\. 1 task done\.$/.test(r[1] || ''), r[1]);
check('none, two and seven: *N tasks done.*', /\. 0 tasks done\.$/.test(r[0] || '') && /\. 2 tasks done\.$/.test(r[2] || '') && /\. 7 tasks done\.$/.test(r[7] || ''), r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
