// The main quest's marks in the open world (Session 595; backlog A, Michael's 5 Oct note: "There is no quest marker if the
// quest requires you to travel moderately far"). The main quest's objectives name the legacy zones, 'overworld' (Ashenmoor)
// and 'ironhaven', and pointed at the gate toward them. The open world has no such gates, so Q3's *talk to Aldwyn* in
// Ironhaven, Q6's *kill in Ironhaven's dungeons* and Q7's talks marked nothing at all. Now a person is marked where they
// stand in the world (or at their door), else the place; a zone's dungeons by the nearest of their doors.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const marks = (id, done) => page.evaluate(({ id, done }) => {
  const save = JSON.parse(JSON.stringify(QS[id])); QS[id].state = 'active';
  QS[id].objectives.forEach((o, i) => { o.current = i < done ? (QUEST_DEFS.find(q => q.id === id).objectives[i].count || 1) : 0; });
  const legacy = getActiveQuestMarkers().filter(m => !(WORLD.compassMarkers() || []).some(c => c.x === m.x && c.z === m.z && c.label === m.label));
  Object.assign(QS[id], save);
  return legacy.map(m => ({ label: m.label, x: Math.round(m.x), z: Math.round(m.z), d: Math.round(Math.hypot(m.x - px, m.z - pz)) }));
}, { id, done });

const ctx = await page.evaluate(() => { const ih = WORLD.siteAnywhere('ironhaven'), am = WORLD.siteAnywhere('ashenmoor');
  const ihDoors = WORLD_DUNGEONS.filter(d => d.zone === 'ironhaven').map(d => PORTALS.find(p => p.seed === d.seed)).filter(Boolean).map(p => ({ name: p.name, x: Math.round(p.x), z: Math.round(p.z) }));
  return { ih: ih && { x: Math.round(ih.x), z: Math.round(ih.z) }, am: am && { x: Math.round(am.x), z: Math.round(am.z) }, ihDoors, me: [Math.round(px), Math.round(pz)] }; });
console.log(JSON.stringify(ctx));
const near = (m, p, r) => m && p && Math.hypot(m.x - p.x, m.z - p.z) <= r;

const q3 = await marks('q3_the_merchant_knows', 0); console.log('q3', JSON.stringify(q3));
const q6 = await marks('q6_binding_stone', 0); console.log('q6', JSON.stringify(q6));
const q7a = await marks('q7_the_rubbing', 4); console.log('q7 → Oswin', JSON.stringify(q7a));
const q7b = await marks('q7_the_rubbing', 7); console.log('q7 → Aldwyn', JSON.stringify(q7b));
const q1 = await marks('q1_first_blood', 0); console.log('q1', JSON.stringify(q1));

const ald = q3.find(m => /Aldwyn/.test(m.label));
check('Q3, talk to Aldwyn in Ironhaven: marked in the world\'s Ironhaven, far off', !!ald && near(ald, ctx.ih, 160) && ald.d > 1000, { q3, ih: ctx.ih });
const door = q6[0];
// a door is in PORTALS once its cell has loaded; before that the mark is Ironhaven itself
check('Q6, kill in Ironhaven\'s dungeons: the nearest of their known doors, or Ironhaven while none is', q6.length === 1 && (ctx.ihDoors.length
  ? ctx.ihDoors.some(p => p.x === door.x && p.z === door.z) && ctx.ihDoors.every(p => Math.hypot(p.x - ctx.me[0], p.z - ctx.me[1]) >= door.d - 1)
  : door.label === '→ Ironhaven' && near(door, ctx.ih, 1)), { q6, doors: ctx.ihDoors });
const osw = q7a.find(m => /Oswin/.test(m.label));
check('Q7, talk to Brother Oswin: marked in the world\'s Ashenmoor', !!osw && near(osw, ctx.am, 160), { q7a, am: ctx.am });
check('Q7, last: talk to Aldwyn, marked in Ironhaven', q7b.some(m => /Aldwyn/.test(m.label) && near(m, ctx.ih, 160)), q7b);
check('Q1, a dungeon objective, still marks its door as before', q1.length === 1 && /Shadows/.test(q1[0].label), q1);
// at Ironhaven, with the town built, Aldwyn himself (or his door) is marked, not the town's centre
await g.settle('ironhaven'); await g.spin(null, 120);
const at = await page.evaluate(() => { const n = ZONES.world.npcs.find(n => n.def && n.def.name === 'Aldwyn' && n.g.visible); let h = null; for (const S of WORLD.settle.values()) { h = (S.houses || []).find(h => h.keeper === 'Aldwyn'); if (h) break; }
  return { npc: n ? { x: Math.round(n.g.position.x), z: Math.round(n.g.position.z) } : null, door: h ? { x: Math.round(h.doorX), z: Math.round(h.doorZ) } : null }; });
const q3b = await marks('q3_the_merchant_knows', 0); console.log('q3 at Ironhaven', JSON.stringify(q3b), JSON.stringify(at));
const a2 = q3b.find(m => /Aldwyn/.test(m.label)), want = at.npc || at.door;
const q6b = await marks('q6_binding_stone', 0); const dn = await page.evaluate(() => WORLD_DUNGEONS.filter(d => d.zone === 'ironhaven').map(d => PORTALS.find(p => p.seed === d.seed)).filter(Boolean).length); console.log('q6 at Ironhaven', JSON.stringify(q6b), dn);
check('at Ironhaven, Q6 marks a door of its dungeons', dn > 0 && q6b.length === 1 && q6b[0].label !== '→ Ironhaven', { q6b, dn });
check('at Ironhaven, the mark is Aldwyn himself or his door', !!a2 && !!want && near(a2, want, 2) && !(a2.x === ctx.ih.x && a2.z === ctx.ih.z), { a2, at });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
