// A load gives a lair's beasts back as they were saved (Session 695, the critic's s482). The beasts a site raises
// (`siteCreatures`) stayed in `ZONES.world.enemies` through `_applyLoadData`: at Carrigowen's Lair a save made before the fight
// brought back neither the Marsh Hag's health nor her dead wolves, so dying was a way to grind a lair's beast down. A load now
// puts down every loaded site that holds beasts, and the settlement tick builds it again from the loaded `worldState.lairs`.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const site = await page.evaluate(() => { const [hi, hj] = WORLD.cellOf(px, pz); const ring = []; for (let i = hi - 2; i <= hi + 2; i++) for (let j = hj - 2; j <= hj + 2; j++) { const c = WORLD.getCell(i, j); if (c && c.sites) ring.push(...c.sites); }
  ring.sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  const t0 = ring.find(s => s.kind === 'lair' && s.pad > 0 && !(worldState.lairs && worldState.lairs[s.id])); if (!t0) return null; WORLD.loadCell(...WORLD.cellOf(t0.x, t0.z));
  const t = WORLD.SITE[t0.id] || t0; px = t.x + 40; pz = t.z + 40; return { id: t.id, name: t.name }; });
check('a lair near the start', !!site, site);
const read = () => page.evaluate((id) => { const S = WORLD.settlements.get(id); const L = ZONES.world.enemies.filter(e => e._site === id);
  return { built: !!S, n: S && S.creatures ? S.creatures.length : -1, inZone: L.length, alive: L.filter(e => !e.dead).length, hp: L.map(e => [Math.round(e.hp), e.maxHp]), dead: !!(worldState.lairs && worldState.lairs[id]), tag: S ? S._t : null }; }, site.id);
const settle = async () => { for (let i = 0; i < 30; i++) { await g.spin(null, 20); const r = await read(); if (r.built && r.n >= 0 && (r.inZone > 0 || r.dead)) return r; } return read(); };
const loadBack = async () => { await page.evaluate(() => reloadActiveSlot()); await page.waitForTimeout(4000);
  await page.evaluate((id) => { const t = WORLD.SITE[id]; px = t.x + 40; pz = t.z + 40; }, site.id); return settle(); };

const a = await settle();
check('the lair is built with its beast and two wolves, all whole', a.n === 3 && a.alive === 3 && a.hp.every(([h, m]) => h === m), a);
await page.evaluate(async (id) => { WORLD.settlements.get(id)._t = 'before'; await saveToSlot(0); }, site.id);
// the fight: the beast to a third, both wolves dead
await page.evaluate((id) => { const S = WORLD.settlements.get(id); const [b, w1, w2] = S.creatures; b.hp = Math.round(b.maxHp / 3); for (const w of [w1, w2]) { w.hp = 0; w.dead = true; } }, site.id);
const hurt = await read();
const b = await loadBack();
check('after a load from before the fight: the site is built again (not the one you left)', b.built && b.tag !== 'before', { hurt, b });
check('the beast is whole again and both wolves stand: three alive, none wounded', b.n === 3 && b.inZone === 3 && b.alive === 3 && b.hp.every(([h, m]) => h === m), b);

// kill all three, let the site mark itself dead, save; a load keeps it dead
await page.evaluate((id) => { const S = WORLD.settlements.get(id); for (const e of S.creatures) { e.hp = 0; e.dead = true; } }, site.id);
for (let i = 0; i < 10 && !(await read()).dead; i++) await g.spin(null, 60);
await page.evaluate(async () => { await saveToSlot(0); });
const c = await loadBack();
check('a lair killed and saved stays dead through a load: no beasts raised', c.dead && c.built && c.n === 0 && c.alive === 0, c);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
