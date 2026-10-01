// The coach's boarding line (Session 348, the critic's s253): boarding a waiting coach said *The coach leaves on the hour.*
// while the prompt a moment before said *leaves at six* — it leaves the a-end at six, the b-end at six in the evening,
// and a coach halted on a broken road goes on when the road is clear. Both lines now read one `coachWhen`.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.waitForFunction(() => { const T = ['town', 'city', 'port']; return WORLD.ROAD_DEFS.some(d => { const a = WORLD.siteAnywhere(d.a), b = WORLD.siteAnywhere(d.b); return a && b && T.includes(a.kind) && T.includes(b.kind); }); }, null, { timeout: 60000, polling: 500 }).catch(() => {});
await page.evaluate(() => { const T = ['town', 'city', 'port'];
  const defs = WORLD.ROAD_DEFS.map(d => ({ d, a: WORLD.siteAnywhere(d.a), b: WORLD.siteAnywhere(d.b) })).filter(q => q.a && q.b && T.includes(q.a.kind) && T.includes(q.b.kind)).sort((p, q) => Math.hypot((p.a.x + p.b.x) / 2 - px, (p.a.z + p.b.z) / 2 - pz) - Math.hypot((q.a.x + q.b.x) / 2 - px, (q.a.z + q.b.z) / 2 - pz));
  const { d, a, b } = defs[0]; const key = d.a < d.b ? d.a + '|' + d.b : d.b + '|' + d.a; worldState.coaches = worldState.coaches || {}; worldState.coaches[key] = { a: d.a, b: d.b, opened: 0 }; px = (a.x + b.x) / 2; pz = (a.z + b.z) / 2; });
await page.waitForTimeout(6000);
await page.evaluate(() => { forceTime(12); for (let i = 0; i < 5; i++) WORLD.tick(1 / 60, performance.now()); });
await page.waitForTimeout(3000);
const r = await page.evaluate(() => {
  const C = [...WORLD.coachLines.values()][0]; if (!C) return null;
  const out = {};
  for (const [name, u] of [['aEnd', 0], ['bEnd', 1], ['halted', .4]]) {
    forceTime(12); C.state = 'wait'; C.u = u; C.riding = false;
    if (u === 0 || u === 1) WORLD.tick(1 / 60, performance.now());
    C.state = 'wait'; C.u = u; px = C.cart.position.x + .5; pz = C.cart.position.z;
    const prompt = WORLD.shipPrompt(); WORLD.coachInteract(); const msg = MSGEL.textContent; WORLD.coachInteract();
    out[name] = { prompt, msg, state: C.state };
  }
  return out;
});
console.log(JSON.stringify(r));
check('a coach line was built', !!r, r);
check('at the a-end: the prompt and the seat both say it leaves at six', /\(leaves at six\)$/.test(r.aEnd.prompt) && r.aEnd.msg === 'You take a seat. The coach leaves at six.', r.aEnd);
check('at the b-end: both say six in the evening', /\(leaves at six in the evening\)$/.test(r.bEnd.prompt) && r.bEnd.msg === 'You take a seat. The coach leaves at six in the evening.', r.bEnd);
check('halted on the road: both say it goes on when the road is clear', /\(goes on when the road is clear\)$/.test(r.halted.prompt) && r.halted.msg === 'You take a seat. The coach goes on when the road is clear.', r.halted);
check('nothing says *on the hour*', !JSON.stringify(r).includes('on the hour'), r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
