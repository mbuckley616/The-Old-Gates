// The street as the shop (Session 705, Michael's A on DECISION #222): outdoors a townsperson or guard sees a crime only
// in the 120° cone the way they face (sin ry, cos ry), to the ranges `witnessrange` holds; within two units they hear
// you whichever way they face. A guard on his beat faces the way he walks, so a lock can be worked once he has passed.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

const r = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const npcs = S.npcs; npcs.forEach(n => { n.g.visible = false; });
  const w = npcs.find(n => n.def && !(n.sched && /guard|watch|constable/.test(n.sched.type)));
  const gd = npcs.find(n => n.sched && (n.sched.type === 'guard' || n.sched.type === 'watch'));
  const h = S.houses.find(x => x.keeper && x.type !== 'home') || S.houses[0];
  let at = null; for (let k = 0; k < 400 && !at; k++) { const a = (k % 16) / 16 * Math.PI * 2, rr = 2 + Math.floor(k / 16) * 1.5; const x = S.site.x + Math.cos(a) * rr, z = S.site.z + Math.sin(a) * rr;
    for (let b = 0; b < 8 && !at; b++) { const hd = b / 8 * Math.PI * 2; let ok = true; for (let t = 0; t <= 26 && ok; t++) { if (WORLD.solidAt(x + Math.cos(hd) * t / 2, z + Math.sin(hd) * t / 2)) ok = false; } if (ok) at = { x, z, hd }; } }
  if (!at) return { noGround: true };
  px = at.x; pz = at.z; jumpY = 0; _sneaking = false; forceTime(13);
  // put n at d units along the clear heading, turned off its line to you by `off` degrees
  const put = (n, d, off) => { npcs.forEach(o => { o.g.visible = false; }); const x = at.x + Math.cos(at.hd) * d, z = at.z + Math.sin(at.hd) * d; n.g.visible = true; n._retreated = false;
    n.g.position.set(x, WORLD.worldH(x, z), z); n.g.rotation.y = Math.atan2(px - x, pz - z) + off * Math.PI / 180; };
  const seen = (n, d, off) => { put(n, d, off); return !!WORLD.witnessOf(h); };
  const out = {};
  out.folk = { face: seen(w, 8, 0), off55: seen(w, 8, 55), offm55: seen(w, 8, -55), off65: seen(w, 8, 65), offm65: seen(w, 8, -65), back: seen(w, 8, 180), back11: seen(w, 11.5, 180) };
  out.hear = { back19: seen(w, 1.9, 180), back21: seen(w, 2.1, 180), side30: seen(w, 3, 90) };
  forceTime(23); _sneaking = true; out.nightSneak = { back19: seen(w, 1.9, 180), face29: seen(w, 2.9, 0), back25: seen(w, 2.5, 180) }; _sneaking = false; forceTime(13);
  out.guard = gd ? { name: gd.def && gd.def.name, type: gd.sched.type, face: seen(gd, 8, 0), back: seen(gd, 8, 180), side: seen(gd, 8, 70), hear: seen(gd, 1.5, 180) } : null;
  // a pick behind a back: pickSeen records nothing; turned to you, it is seen
  const n0 = (worldState.crimes || []).length; put(w, 6, 180); const behind = pickSeen(h); out.pickBehind = { seen: !!behind, crimes: (worldState.crimes || []).length - n0 };
  return out; });
console.log(JSON.stringify(r));
check('found open ground on Dunmore\'s pad', !r.noGround, r);
check('a townsperson facing you at 8 units sees you, and within 55° either side', r.folk.face && r.folk.off55 && r.folk.offm55, r.folk);
check('65° off their line, or with their back turned, they do not (8 and 11.5 units)', !r.folk.off65 && !r.folk.offm65 && !r.folk.back && !r.folk.back11, r.folk);
check('within two units they hear you whichever way they face (1.9 yes, 2.1 no)', r.hear.back19 && !r.hear.back21 && !r.hear.side30, r.hear);
check('sneaking at night: the 3-unit reach holds in the cone, the 2-unit hearing behind', r.nightSneak.back19 && r.nightSneak.face29 && !r.nightSneak.back25, r.nightSneak);
check('a guard is judged by the same cone', r.guard && r.guard.face && !r.guard.back && !r.guard.side && r.guard.hear, r.guard);
check('a lock picked behind a turned back at 6 units is not seen', !r.pickBehind.seen && r.pickBehind.crimes === 0, r.pickBehind);

// the beat: a guard walking it faces the way he walks
const b = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); S.npcs.forEach(n => { n.g.visible = true; n._retreated = false; });
  forceTime(14); px = S.site.x + 200; pz = S.site.z + 200; for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
  const G = S.npcs.filter(n => n.sched && (n.sched.type === 'guard' || n.sched.type === 'watch'));
  const prev = G.map(n => ({ x: n.g.position.x, z: n.g.position.z })); let n = 0, ok = 0, worst = 1;
  for (let f = 0; f < 600; f++) { px = S.site.x + 200; pz = S.site.z + 200; WORLD.tick(1 / 60, performance.now());
    G.forEach((o, k) => { const dx = o.g.position.x - prev[k].x, dz = o.g.position.z - prev[k].z, d = Math.hypot(dx, dz);
      if (d > .01) { n++; const dot = (Math.sin(o.g.rotation.y) * dx + Math.cos(o.g.rotation.y) * dz) / d; if (dot > .9) ok++; worst = Math.min(worst, dot); }
      prev[k] = { x: o.g.position.x, z: o.g.position.z }; }); }
  return { guards: G.length, steps: n, facing: ok, worst: +worst.toFixed(3) }; });
console.log(JSON.stringify(b));
check('a guard on his beat faces the way he walks (each step within 25° of his facing)', b.guards > 0 && b.steps > 100 && b.facing / b.steps > .97, b);
await g.close();
