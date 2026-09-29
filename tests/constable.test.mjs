// The day constable (Session 268, Michael's B on issue #41). A town without walls had one man of the law, the night
// watchman, asleep from 6:30 to 19h: the critic was seen twice in Portclare's square at 14h and nobody halted or
// followed. Now a second man walks the plaza by day and sleeps by night, and does what any guard on duty does.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('portclare');
const stop = g.keepAlive();

const who = (h) => page.evaluate((h) => { forceTime(h); for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
  const S = WORLD.settle.get('portclare'); const G = WORLD.guardsOf(S);
  return { types: G.map(n => n.sched.type), up: G.filter(n => n.g.visible).map(n => n.sched.type), names: G.map(n => n.def.name) }; }, h);
const d14 = await who(14), d23 = await who(23);
console.log(JSON.stringify({ d14, d23 }));
check('Portclare (no walls): a night watchman and a day constable, no gate guards', d14.types.filter(t => t === 'watch').length === 1 && d14.types.filter(t => t === 'constable').length === 1 && !d14.types.includes('guard') && new Set(d14.names).size === d14.names.length, d14);
check('at 14h the constable is up and the watchman asleep; at 23h the other way round', d14.up.join() === 'constable' && d23.up.join() === 'watch', { d14: d14.up, d23: d23.up });

// the critic's case: a fine on you in the square at 14h, and the constable walks within five units: the halt
const halt = await page.evaluate(() => { forceTime(14); const S = WORLD.settle.get('portclare'); const site = S.site; px = site.x; pz = site.z + 4; jumpY = WORLD.worldH(px, pz);
  const cn = WORLD.guardsOf(S).find(n => n.sched.type === 'constable'); worldState.crime = { portclare: { bounty: 355, debt: 4, last: 0 } };
  let t = 0; for (; t < 120 && !dlgOpen; t += 1 / 60) { WORLD.tick(1 / 60, performance.now()); WORLD.tickCrime(1 / 60, performance.now()); }
  const out = { t: +t.toFixed(1), open: dlgOpen, name: dlgNPC && dlgNPC.name, constable: cn.def.name, greet: dlgNPC && dlgNPC.greeting[0] }; if (dlgOpen) closeDialog(); return out; });
console.log(JSON.stringify(halt));
check('by day, with a fine, standing in the square: the constable comes by and halts you', halt.open && halt.name === halt.constable && /355 gold/.test(halt.greet || ''), halt);

// favour −2 or worse: he trails you on the pad
const follow = await page.evaluate(() => { forceTime(14); const S = WORLD.settle.get('portclare'); const site = S.site; worldState.crime = {}; const f0 = WORLD.favor(site); WORLD.addFavor(site, -3 - f0);
  px = site.x + 10; pz = site.z - 12; jumpY = WORLD.worldH(px, pz); const cn = WORLD.guardsOf(S).find(n => n.sched.type === 'constable');
  let minD = 1e9; for (let t = 0; t < 30; t += 1 / 60) { WORLD.tick(1 / 60, performance.now()); if (t > 20) minD = Math.min(minD, Math.hypot(cn.g.position.x - px, cn.g.position.z - pz)); }
  const out = { favor: WORLD.favor(site), following: !!cn._follow, d: +minD.toFixed(1) }; WORLD.addFavor(site, f0 - WORLD.favor(site)); return out; });
console.log(JSON.stringify(follow));
check('at favour −3 by day, the constable trails you', follow.favor <= -2 && follow.following && follow.d < 10, follow);

// seen indoors with a fine: he is the one sent
const sent = await page.evaluate(() => { forceTime(14); const S = WORLD.settle.get('portclare'); const h = S.houses.find(x => /misc|weapon|armor|potion/.test(x.type)); worldState.crime = { portclare: { bounty: 60, debt: 1, last: 0 } };
  WORLD.dispatchGuard(h, S.site); const s = WORLD.guardSent; const out = { sent: !!s, type: s && s.npc.sched.type }; return out; });
check('seen indoors by day: the constable is sent', sent.sent && sent.type === 'constable', sent);
stop(); check('no page errors', g.errs.length === 0, g.errs);
await g.close();
