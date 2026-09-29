// The Boon of Renewal (Session 338, Michael's A on #60): praying at An Spéir's shrine restores you and gives the boon;
// while it lasts, health, stamina and mana each come back 0.5 a second. Before, nothing read it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const site = await page.evaluate(() => {
  const god = s => String(s.id).split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 13) % 6;
  const all = []; for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) all.push(...WORLD.getCell(i, j).sites);
  const sh = all.filter(s => s.kind === 'shrine' && s.pad > 0 && god(s) === 1).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz));
  return sh[0] && { id: sh[0].id, x: sh[0].x, z: sh[0].z };
});
check('there is a shrine of An Spéir', !!site, site);
const id = site.id;
await page.evaluate(() => WORLD.devUnlockAll());
for (let k = 0; k < 24; k++) {
  await page.evaluate((t) => { if (Math.hypot(px - t.x, pz - t.z) > 40) { px = t.x; pz = t.z + 4; } }, site);
  await page.waitForTimeout(2500);
  if (await page.evaluate((id) => !!WORLD.settle.get(id), id)) break;
}
await page.waitForTimeout(2000); await g.hide();
const pray = await page.evaluate((id) => {
  const S = WORLD.settle.get(id); px = S.altar.x; pz = S.altar.z + 1.5;
  ACTIVE_BUFFS.length = 0; const ok = WORLD.shipInteract();
  const b = ACTIVE_BUFFS.find(b => b.type === 'regen');
  return { ok, god: S.god && S.god.key, buff: b && { rate: b.rate, remaining: b.remaining, label: b.label }, hp: PHP, max: effMaxHP() };
}, id);
check('praying gives the Boon of Renewal at 0.5 a second for 30 minutes', pray.ok && pray.god === 'speir' && pray.buff && pray.buff.rate === 0.5 && pray.buff.remaining === 1800, pray);
// the main loop's dt is capped at .05 a frame, and the scene runs well under 20 fps here, so each frame is .05 s of play
const run = (withBoon) => page.evaluate(async (withBoon) => {
  if (!withBoon) { const i = ACTIVE_BUFFS.findIndex(b => b.type === 'regen'); if (i >= 0) ACTIVE_BUFFS.splice(i, 1); }
  PHP = 10; mana = 10; stamina = 10; staminaCD = 1e9;
  const t0 = performance.now();
  await new Promise(r => { let k = 0; const f = () => (++k >= 40 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const out = { hp: PHP - 10, mp: mana - 10, st: stamina - 10, secs: (performance.now() - t0) / 1000, boon: ACTIVE_BUFFS.some(b => b.type === 'regen') };
  staminaCD = 0; return out;
}, withBoon);
const on = await run(true), off = await run(false);
check('under the boon, health and stamina each rise 0.5 a second of play (40 frames, about 2 s)', on.boon && on.hp > 0.8 && on.hp < 1.05 && Math.abs(on.st - on.hp) < 0.03, on);
check('and mana rises 0.5 a second above its own 0.8', Math.abs(on.mp - on.hp * 2.6) < 0.08, on);
check('without it, health and stamina stay put and mana keeps its own rate', !off.boon && off.hp === 0 && off.st === 0 && off.mp > 1.4 && off.mp < 1.65, off);
const cap = await page.evaluate(async () => {
  ACTIVE_BUFFS.push({ type: 'regen', mult: 1, rate: 0.5, remaining: 1800, duration: 1800, label: 't' });
  PHP = effMaxHP() - .1; mana = effMaxMana() - .1; stamina = effMaxStamina() - .1;
  await new Promise(r => { let k = 0; const f = () => (++k >= 10 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  return { hp: PHP, mhp: effMaxHP(), mp: mana, mmp: effMaxMana(), st: stamina, mst: effMaxStamina() };
});
check('it fills to the worn maximum and no further', cap.hp === cap.mhp && cap.mp === cap.mmp && cap.st === cap.mst, cap);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
