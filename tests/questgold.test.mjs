// Charisma's quest gold (Session 340): +2% a point on every quest's pay. Only the legacy chain's `completeQuest` read it;
// the world's quests and faction services (`qTurnIn`), the guild tasks and the tutorial lines paid the bare sum.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const w = await page.evaluate(() => {
  const run = (cha) => { ATTRS.charisma = cha; const q = { title: 'Test', reward: 100, giver: 'x' }; const g0 = gold, x0 = xp; const r = WORLD.qTurnIn(q); return { got: gold - g0, xp: xp - x0, r }; };
  const a = run(0), b = run(10);
  const id = Object.keys(QS).find(k => { const q = getQuest(k); return q && q.rewards && q.rewards.gold > 0; });
  const legacy = (cha) => { ATTRS.charisma = cha; QS[id].state = 'reward'; const g0 = gold; completeQuest(id); return gold - g0; };
  const base = getQuest(id).rewards.gold; const l0 = legacy(0), l10 = legacy(10);
  ATTRS.charisma = 0; return { a, b, id, base, l0, l10 };
});
check('a world quest of 100 pays 100 at Charisma 0 and 120 at 10, the XP unchanged', w.a.got === 100 && w.b.got === 120 && w.b.r === 120 && w.a.xp === w.b.xp, w);
check('the legacy chain still pays its +2% a point', w.l0 === w.base && w.l10 === Math.round(w.base * 1.2), w);
await g.settle('dunmore');
const gh = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => (x.type === 'guild_f' || x.type === 'guild_m') && x.keeper); if (!h) return null;
  forceTime(13); px = h.exitX; pz = h.exitZ; goToInterior(h); return h.type; });
if (gh) {
  await page.waitForTimeout(4500); await g.hide();
  const r = await page.evaluate((gk) => {
    const d = currentHouse && currentHouse.dlg; const head = d && d.topics.some(t => t.label === 'Any work?') ? { def: d } : null;
    if (!head) return { head: false, house: currentHouse && currentHouse.type, zone: activeZoneId, npcs: WORLD.intNpcs.map(n => [n.def && n.def.name, n.def && n.def.topics && n.def.topics.map(t => t.label).join('|')]) };
    const pay = (cha) => { ATTRS.charisma = cha; WORLD.guild.state()[gk].active = { kind: 'relic', got: true, gold: 80, short: 'a test' }; const g0 = gold;
      const s = head.def.topics.find(t => t.label === "It's done.").fn(); return { got: gold - g0, s }; };
    const p0 = pay(0), p10 = pay(10); ATTRS.charisma = 0; return { head: true, p0, p10 };
  }, gh);
  check('a guild task of 80 pays 80 at Charisma 0 and 96 at 10, and the head says so', r.head && r.p0.got === 80 && r.p10.got === 96 && /96 gold/.test(r.p10.s), r);
} else check('Dunmore has a guild hall to test in', false, gh);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
