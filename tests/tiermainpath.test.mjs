// Enemies by place, the main path (Session 1067; the designer's sheet on Michael's A on #373). Every place the main quest's first
// act sends you, from the crypt to Aldwyn with the rubbing, stands at tier 1 or 2, counting the floor it sends you to: a door's
// floor 2 is its tier plus one. A gate's world place is where the world's own data puts it (fixedDoorSpot), so the answer does
// not hang on what has loaded; a live portal, where one stands, reads the same tier.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = [], seen = new Set();
  const door = (seed, floor, why) => { const e = WORLD_DUNGEONS.find(d => d.seed === seed); if (!e) { out.push({ why, seed, missing: true }); return; }
    const p = fixedDoorSpot(e); const t = p ? worldTierAt(p.x, p.z) : null;
    const live = PORTALS.find(q => q.seed === seed && q.zone === 'world');
    out.push({ why, name: e.canonicalName || dungeonName(e.seed, e.theme), seed, floor, door: t, tier: t == null ? null : Math.min(4, t + floor - 1), live: live ? dungeonTier(live, 1) : null }); };
  const place = (id, why, dx, dz) => { const s = siteAnywhere(id); out.push({ why, name: s ? s.name : id, tier: s ? worldTierAt(s.x + (dx || 0), s.z + (dz || 0)) : null }); };
  for (const q of QUEST_DEFS) { if (!/^q[0-7]_/.test(q.id)) continue;
    for (const o of (q.objectives || [])) {
      const why = q.id + ': ' + (o.label || o.type);
      if (o.dungeonSeed != null) door(o.dungeonSeed, o.floor || 1, why);
      else if (o.type === 'kill_in_zone') WORLD_DUNGEONS.filter(d => d.zone === o.zone).forEach(d => door(d.seed, 1, why + ' — ' + (d.canonicalName || dungeonName(d.seed, d.theme))));
      else if (o.type === 'defeat_boss' && o.bossId === 'faolchu') place('ashenmoor', why, 4, 2);
      else if (o.zone === 'ironhaven') place('ironhaven', why);
      else if (o.zone === 'overworld') place('ashenmoor', why); } }
  return out; });
console.log(JSON.stringify(r, null, 0));
const over = r.filter(x => x.tier == null || x.tier > 2 || x.missing);
check(`the first act's ${r.length} destinations were found (${new Set(r.map(x => x.name)).size} places)`, r.length >= 10 && !r.some(x => x.missing || x.tier == null), r.filter(x => x.missing || x.tier == null));
check('every one stands at tier 1 or 2, counting the floor it sends you to', over.length === 0, over.map(x => `${x.why}: ${x.name} tier ${x.tier}`));
check('a live portal, where one stands, reads the same tier as its door\'s place in the world\'s data', r.filter(x => x.live != null).every(x => x.live === x.door), r.filter(x => x.live != null && x.live !== x.door));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
