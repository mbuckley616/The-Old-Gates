// Session 518: the co-op rules' step 3, ids for what has none (CLAUDE.md, Michael's A on #119; backlog K), its last item. A quest's
// pickup (a lord's *retrieve* job) is <quest id>:pickup and a guild task's relic <task id>:pickup; whether it was taken is the
// quest's or task's own `got`, saved with it. Each is raised by the world's own tick, walked onto, and taken.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const out = {};
  const q = { id: 'tq:testsite:4', kind: 'retrieve', title: 'A test parcel', data: { x: px + 30, z: pz + 5 } }; QJ().push(q); qTick();
  const pq = pickups.find(p => p.quest === q); out.quest = pq && pq.id;
  const G = gstate(); const keep = G.guild_m.active; const t = { id: 'guild_m:testsite:2', kind: 'relic', title: 'A test relic', x: px - 30, z: pz + 5, siteId: 'testsite' };
  G.guild_m.active = t; ensureTaskWorldObjects(); const pt = pickups.find(p => p.task === t); out.task = pt && pt.id;
  const home = { px, pz }; px = q.data.x; pz = q.data.z; qPickupTick(); out.questGot = !!q.data.got; out.questGone = !pickups.some(p => p.quest === q);
  px = t.x; pz = t.z; tickPickups(); out.taskGot = !!t.got; out.taskGone = !pickups.some(p => p.task === t);
  px = home.px; pz = home.pz; QJ().splice(QJ().indexOf(q), 1); G.guild_m.active = keep; return out; });
console.log('pickups', JSON.stringify(r));
check(`a retrieve job's pickup is <quest id>:pickup (${r.quest}), and walking onto it takes it`, r.quest === 'tq:testsite:4:pickup' && r.questGot && r.questGone, r);
check(`a guild task's relic is <task id>:pickup (${r.task}), and walking onto it takes it`, r.task === 'guild_m:testsite:2:pickup' && r.taskGot && r.taskGone, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
