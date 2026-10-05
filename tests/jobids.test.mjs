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
// Session 503 — the foes a job raises carry the job's id and index; their spots come from the job's own stream
const f = await page.evaluate(() => {
  const spawnRoad = () => { const q = { id: 'tq:dunmore:7', giver: 'x', giverSite: 'dunmore', title: 't', desc: '', objective: 'o', kind: 'road', data: { x: px + 40, z: pz + 40, count: 3, have: 0, spawned: false }, reward: 1 };
    worldState.quests = [q]; const before = ZONES.world.enemies.length; const ox = px, oz = pz; px = q.data.x + 10; pz = q.data.z; qTick(); px = ox; pz = oz;
    const E = ZONES.world.enemies.slice(before); const out = E.map(e => ({ id: e.id, x: +e.x.toFixed(2), z: +e.z.toFixed(2), rng: typeof e.rng })); E.forEach(e => { e.hp = 0; e.dead = true; if (e.mesh) e.mesh.visible = false; }); ZONES.world.enemies.splice(before); return out; };
  const a = spawnRoad(), b = spawnRoad();
  const G = gstate(); G.guild_f = { done: 0, active: { id: 'guild_f:dunmore:9', g: 'guild_f', kind: 'beast', beast: 'Ogre', sx: px + 30, sz: pz + 30, spawned: false, done: false, gold: 1, short: 's' } };
  const before = ZONES.world.enemies.length; ensureTaskWorldObjects(); const E = ZONES.world.enemies.slice(before); const beast = E.map(e => ({ id: e.id, name: e.name, rng: typeof e.rng }));
  E.forEach(e => { e.hp = 0; e.dead = true; if (e.mesh) e.mesh.visible = false; }); ZONES.world.enemies.splice(before); G.guild_f = { done: 0, active: null };
  return { a, b, beast };
});
console.log(JSON.stringify(f));
check('a road job\'s band is keyed by the job and index, each with its own stream', f.a.length === 3 && f.a.every((e, k) => e.id === 'tq:dunmore:7:foe:' + k && e.rng === 'function'), f.a);
check('raised twice, the band stands on the same spots (the job\'s own stream, not Math.random)', JSON.stringify(f.a) === JSON.stringify(f.b), { a: f.a, b: f.b });
check('a guild\'s beast is keyed by the task', f.beast.length === 1 && f.beast[0].id === 'guild_f:dunmore:9:foe:0' && f.beast[0].rng === 'function', f.beast);

check('a lord\'s jobs are the town and its count: tq:dunmore:0, then tq:dunmore:1', r.all[0] === 'tq:dunmore:0' && r.all[1] === 'tq:dunmore:1', r.all);
check('a guild\'s tasks are the guild, the town and its count, kept in the guild\'s state', r.all[2] === 'guild_f:dunmore:1' && r.all[3] === 'guild_f:dunmore:2' && r.n === 2, r);
check('a rank commission is the guild and the rank', r.all[4] === 'guild_f:c2', r.all[4]);
check('no id carries a clock time', !r.digits, r.all);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
