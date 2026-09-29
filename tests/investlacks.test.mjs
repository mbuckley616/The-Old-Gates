// A lord offers only what the town lacks (Session 352, Michael’s A on #65). The critic's s253: Dunmore has four inns,
// a church, both guild halls and log walls, and its lord offered all four. Now no inn where an inn stands, no chapel
// where a church does, no guild hall where one does, no walls where the ring is logs or better; the well and the
// harbour as before. What stands is read off the live town (`buildStands`), the plan's list when it isn't loaded.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const offers = (id, p) => page.evaluate(({ id, p }) => {
  const S = WORLD.settle.get(id); if (!S) return null; const site = S.site; const ln = S.npcs.find(n => n.def && n.def._lord); if (!ln) return null;
  const st = WORLD.TS(site); if (p != null) st.p = p; if (WORLD.favor(site) < 5) WORLD.addFavor(site, 5 - WORLD.favor(site)); st.builds = [];
  const pays = () => ln.def._extraFn().filter(t => /^Pay for /.test(t.label)).map(t => t.label.replace(/^Pay for (an? )?| \(.*$/g, ''));
  const types = [...new Set(S.houses.map(h => h.type))];
  const live = pays();
  // the same town unloaded: the plan's list at today's prosperity
  WORLD.settle.delete(id); const plan = pays(); WORLD.settle.set(id, S);
  return { id, kind: site.kind, p: st.p, types, live, plan };
}, { id, p });
await g.settle('dunmore');
const dun = await offers('dunmore', 90);
console.log(JSON.stringify(dun));
check('Dunmore (inns, a church, both guild halls, walls at 90) is offered the well and nothing it has', !!dun && dun.types.includes('inn') && dun.types.includes('church') && dun.live.join() === 'well', dun);
check('unloaded, Dunmore reads the same from its plan', !!dun && dun.plan.join() === 'well', dun && dun.plan);
// a town with every building lifted out: the lord offers them again
const bare = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const keep = S.houses; S.houses = keep.filter(h => !['inn', 'church', 'guild_f', 'guild_m'].includes(h.type));
  const ln = S.npcs.find(n => n.def && n.def._lord); const r = ln.def._extraFn().filter(t => /^Pay for /.test(t.label)).map(t => t.label); S.houses = keep; return r; });
check('the same town with no inn, church or guild hall standing is offered all three (walls still stand)', bare.some(l => /an inn/.test(l)) && bare.some(l => /a chapel/.test(l)) && bare.some(l => /a guild hall/.test(l)) && !bare.some(l => /walls/.test(l)), bare);
await g.settle('portclare');
const port = await offers('portclare', 90);
console.log(JSON.stringify(port));
check('Portclare (an inn and a church, no wall ring) is offered the well, walls, a guild hall and the harbour', !!port && !port.live.includes('inn') && !port.live.includes('chapel') && ['well', 'walls', 'guild hall', 'harbour'].every(k => port.live.includes(k)), port);
// every town the loader has built: each offer is something the town lacks
const all = await page.evaluate(() => { const out = []; for (const [id, S] of WORLD.settle) { const ln = S.npcs && S.npcs.find(n => n.def && n.def._lord); if (!ln || S.dead) continue;
  const st = WORLD.TS(S.site); const p0 = st.p, b0 = st.builds; st.p = 90; st.builds = []; if (WORLD.favor(S.site) < 5) WORLD.addFavor(S.site, 5 - WORLD.favor(S.site));
  const types = S.houses.map(h => h.type); const pays = ln.def._extraFn().filter(t => /^Pay for /.test(t.label)).map(t => t.label);
  const bad = pays.filter(l => (/an inn/.test(l) && types.includes('inn')) || (/a chapel/.test(l) && types.includes('church')) || (/a guild hall/.test(l) && (types.includes('guild_f') || types.includes('guild_m'))));
  out.push({ id, kind: S.site.kind, pays: pays.length, bad }); st.p = p0; st.builds = b0; } return out; });
console.log(JSON.stringify(all));
check('in every live town, no offer is a building that stands there', all.length >= 2 && all.every(t => !t.bad.length), all);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
