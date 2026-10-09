// A job's draw rolls on its own id (Session 678; the co-op rules' seeded-stream line, which the critic's s480 run noted
// `genTask` still broke). A guild task (`genTask`) and a lord's job (`townQuestFor`) picked their kind, their place and their
// pay on Math.random, so a reload, or a host and a guest, drew different work under one id. Each now rolls on
// `seededRng('task', <id>)` and `seededRng('tq', <id>)` (a faction's service on its own `fq:` id). Draw each job twice under
// the same id with Math.random giving opposite answers: the two are the same. Different ids still give different work.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const rnd = Math.random; const strip = t => JSON.stringify(t, (k, v) => (k[0] === '_' || typeof v === 'function') ? undefined : v);
  const out = { guild: [], town: [], spread: {} };
  for (const id of ['ironhaven', 'vieux_marche', 'dunmore']) {
    const site = SITE[id]; if (!site) continue;
    for (const gk of ['guild_f', 'guild_m']) {
      const st = gstate()[gk]; const n0 = st.n || 0;
      for (let k = 0; k < 6; k++) {
        st.n = n0 + k; Math.random = () => .001; const a = strip(genTask(gk, site));
        st.n = n0 + k; Math.random = () => .999; const b = strip(genTask(gk, site));
        out.guild.push({ site: id, g: gk, same: a === b, id: JSON.parse(a).id, kind: JSON.parse(a).kind, gold: JSON.parse(a).gold });
      }
      st.n = n0;
    }
    for (const kind of [null, 'find', 'retrieve', 'deliver', 'cull']) {
      Math.random = () => .001; const a = townQuestFor(site, kind, true);
      Math.random = () => .999; const b = townQuestFor(site, kind, true);
      out.town.push({ site: id, force: kind, same: strip(a) === strip(b), kind: a.kind, reward: a.reward });
    }
    Math.random = () => .5; const s1 = strip(townQuestFor(site, 'find', true, 'fq:test:0:0')), s2 = strip(townQuestFor(site, 'find', true, 'fq:test:0:0')), s3 = strip(townQuestFor(site, 'find', true, 'fq:test:1:0'));
    out.town.push({ site: id, force: 'service', same: s1 === s2, differs: s1 !== s3 });
  }
  Math.random = rnd;
  const kinds = new Set(out.guild.map(t => t.g + ':' + t.kind)), golds = new Set(out.guild.map(t => t.gold));
  out.spread = { kinds: kinds.size, golds: golds.size, ids: new Set(out.guild.map(t => t.id)).size, n: out.guild.length };
  return out;
});
console.log('  guild', JSON.stringify(r.guild.slice(0, 6)), '…');
console.log('  town', JSON.stringify(r.town));
console.log('  spread', JSON.stringify(r.spread));
check('a guild task drawn twice under its id is the same task, whatever Math.random says', r.guild.length >= 24 && r.guild.every(t => t.same), r.guild.filter(t => !t.same));
check('a lord\'s job drawn twice under its id is the same job, whatever Math.random says', r.town.length >= 15 && r.town.every(t => t.same), r.town.filter(t => !t.same));
check('a faction\'s service rolls on its own id: another service\'s id draws other work', r.town.filter(t => t.force === 'service').every(t => t.differs), r.town.filter(t => t.force === 'service'));
check('different ids still give different work (kinds and pay spread)', r.spread.ids === r.spread.n && r.spread.kinds >= 5 && r.spread.golds >= 10, r.spread);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
