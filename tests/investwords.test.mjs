// The mayor's investments in plain English (Session 349, the critic's s253): *Pay for a inn*, *Pay for a walls*.
// Each build now takes its own article (`aBuild`): *an inn*, *walls*, *a guild hall*; *the walls are finished*.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
const r = await page.evaluate(() => {
  const S = WORLD.settle.get('dunmore'); const site = S.site; const ln = S.npcs.find(n => n.def && n.def._lord); if (!ln) return null;
  const lord = ln.def; const st = WORLD.TS(site); st.p = 90; WORLD.addFavor(site, 5); st.builds = st.builds.filter(b => b.key !== 'walls' && b.key !== 'inn');
  const topics = () => lord._extraFn().filter(t => /^Pay for /.test(t.label));
  const labels = topics().map(t => t.label);
  gold = 0; const short = {}; for (const t of topics()) short[t.label.replace(/ \(.*/, '')] = t.fn();
  const msgs = []; const sm = window.showMsg; window.showMsg = (t) => { msgs.push(t); sm(t); };
  gold = 99999; const n0 = GAME_LOG.length; const w = topics().find(t => /walls/.test(t.label)); const said = w.fn();
  const log = GAME_LOG.slice(n0).map(e => e.text);
  worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes || 0) + 1440 * 4; WORLD.tick(1 / 60, performance.now());
  window.showMsg = sm; gold = 0;
  return { labels, short, said, log, msgs };
});
console.log(JSON.stringify(r));
check('the lord of Dunmore has investments on offer', !!r && r.labels.length >= 4, r);
check('the labels read *a well*, *an inn*, *walls*, *a guild hall*, never *a inn* or *a walls*', r.labels.some(l => /^Pay for an inn \(/.test(l)) && r.labels.some(l => /^Pay for walls \(/.test(l)) && r.labels.some(l => /^Pay for a guild hall \(/.test(l)) && !r.labels.some(l => /Pay for a (inn|walls)/.test(l)), r.labels);
check('short of gold: *An inn would cost…*, *Walls would cost…*', /^An inn would cost the town \d+ gold\.$/.test(r.short['Pay for an inn']) && /^Walls would cost the town \d+ gold\.$/.test(r.short['Pay for walls']), r.short);
check('paid: the log says *Paid for walls at Dunmore.*', r.log.some(t => /^Paid for walls at /.test(t)), r.log);
check('three days on: *the walls are finished*', r.msgs.some(t => /: the walls are finished\.$/.test(t)), r.msgs);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
