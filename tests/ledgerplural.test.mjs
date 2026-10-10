// The Standing page (the hub's character tab) read *Novice · 1 tasks* for a guild and *… · 1 services* for a faction
// (the critic's s480 note: the guild head's *My standing?* was mended, the page was not). Session 689 counts them as
// the dialogue does. This renders the page through the game's own renderHubAttrs at one and at two of each.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const read = (n) => page.evaluate((n) => {
  WORLD.guild.state(); const G = worldState.guild; G.guild_m.done = n; G.guild_f.done = 0;
  const F = WORLD.fstate(); const k = Object.keys(WORLD.FACTIONS)[0]; F[k].rank = 1; F[k].done = n;
  renderHubAttrs(); const rows = [...document.querySelectorAll('#standing-body > div')].map(d => d.innerText.replace(/\s+/g, ' ').trim());
  return { mages: rows.find(r => r.startsWith(WORLD.guild.GUILD_DEF.guild_m.name)), fighters: rows.find(r => r.startsWith(WORLD.guild.GUILD_DEF.guild_f.name)), faction: rows.find(r => r.startsWith(WORLD.FACTIONS[k].name)) };
}, n);
const one = await read(1), two = await read(2);
console.log(JSON.stringify(one), JSON.stringify(two));
check('one guild task reads “1 task”', /· 1 task$/.test(one.mages), one.mages);
check('two read “2 tasks”', /· 2 tasks$/.test(two.mages), two.mages);
check('a guild with none done reads “not a member”', /not a member$/.test(one.fighters), one.fighters);
check('one faction service reads “1 service”', /· 1 service\b(?!s)/.test(one.faction), one.faction);
check('two read “2 services”', /· 2 services\b/.test(two.faction), two.faction);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
