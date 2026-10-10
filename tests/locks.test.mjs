// Locks on chests (Session 150): dungeon chests by floor, treasure chests always, the tower's chest.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// the rule itself, over many cells: about 1 in 5 on floor 1, 2 in 5 on floor 2, steady per cell
const rule = await page.evaluate(() => { let a = 0, b = 0, same = true; const N = 4000;
  for (let i = 0; i < N; i++) { const x = i % 63, z = Math.floor(i / 63); if (chestLockedAt(x, z, 1)) a++; if (chestLockedAt(x, z, 2)) b++;
    if (chestLockedAt(x, z, 1) !== chestLockedAt(x + .2, z - .2, 1)) same = false; }
  return { f1: a / N, f2: b / N, same }; });
check('about 1 in 5 locked on floor 1, 2 in 5 on floor 2', Math.abs(rule.f1 - .2) < .04 && Math.abs(rule.f2 - .4) < .05 && rule.same, rule);

// a real dungeon: every chest follows the rule, treasure chests always locked
// the world lists only the doors of loaded cells, so wait for one to load rather than take whatever is there
for (let k = 0; k < 24 && !(await page.evaluate(() => WORLD.DOORS.some(e => e && e.seed != null))); k++) await page.waitForTimeout(2500);
await page.evaluate(() => { const d = WORLD.DOORS.find(e => e && e.seed != null) || [...WORLD.DOORS.values?.() || []][0];
  const p = makePortalDef(d); p.zone = 'world'; goToDungeon(p); });
await page.waitForTimeout(12000); await g.hide();
const dun = await page.evaluate(() => ({ zone: activeZoneId, n: CHESTS.length, locked: CHESTS.filter(c => c.locked).length,
  treasure: CHESTS.filter(c => c.treasure).length, treasureLocked: CHESTS.filter(c => c.treasure && c.locked).length,
  wrong: CHESTS.filter(c => !!c.locked !== (c.treasure || chestLockedAt(c.x, c.z, c.floor))).length }));
check('dungeon chests follow the rule', dun.zone === 'dungeon' && dun.n > 0 && dun.wrong === 0 && dun.treasureLocked === dun.treasure, dun);

// no pick: the chest stays shut and nothing opens
const bare = await page.evaluate(() => { for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i].name === 'Lockpick') BAG.splice(i, 1);
  const ch = CHESTS.find(c => c.locked) || lockChest(CHESTS[0]); const r = tryLockpick(ch); return { r, lockOpen, loot: lootOpen, still: ch.locked }; });
check('without a pick a locked chest stays shut', !bare.r && !bare.lockOpen && !bare.loot && bare.still, bare);

// with picks: the minigame opens titled for a chest; set every pin at the shear and the chest opens its loot
const pick = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms));
  BAG.push({ name: 'Lockpick', ico: '🗝', type: 'misc', qty: 5 });
  const ch = CHESTS.find(c => c.locked); const title0 = document.getElementById('lp-title').textContent;
  tryLockpick(ch); const title = document.getElementById('lpk-title').textContent, pins = LP.pins.length;
  // S715 — the lock panel's title is its own element, shown, and the loot panel's is left alone (both were `lp-title`, the loot's first)
  const tEl = document.getElementById('lpk-title'), shown = !!tEl.offsetParent && tEl.closest('#lockpick') !== null, lootTitle = document.getElementById('lp-title').textContent;
  const ids = {}; for (const el of document.querySelectorAll('[id]')) ids[el.id] = (ids[el.id] || 0) + 1; const dupIds = Object.keys(ids).filter(k => ids[k] > 1);
  for (let k = 0; k < 8 && LP.phase !== 'done'; k++) { lpPress(); LP.pushed = performance.now() - LP.rise - 5; lpPress(); }
  await wait(900);
  const out = { title, shown, lootTitle, title0, dupIds, pins, locked: ch.locked, opened: ch.opened, loot: lootOpen, same: currentLootContainer === ch, meshKept: !!ch.mesh.parent, picks: lpPicks(), treasure: ch.treasure };
  try { closeLoot(); } catch (e) {} return out; });
check('the lock panel shows the lock\'s own title, and the loot panel\'s title is untouched by it', /chest|good lock/i.test(pick.title) && pick.shown && pick.lootTitle === pick.title0, pick);
check('no id in the page is used twice', pick.dupIds.length === 0, pick.dupIds);
check('picking a chest opens it in place', /chest|good lock/i.test(pick.title) && !pick.locked && pick.opened && pick.loot && pick.same && pick.meshKept && pick.picks === 5, pick);

// the real key: stand at a locked chest, look at it, press E — the pick comes out, not the loot panel
const viaKey = await page.evaluate(() => { const ch = CHESTS.find(c => c.locked && c.floor === currentFloor && c !== currentLootContainer) || lockChest(CHESTS.find(c => c.floor === currentFloor));
  window._t = ch; px = ch.x; pz = ch.z + 1.3; return { x: ch.x, z: ch.z }; });
let keyOut = null;
for (const yw of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) {
  await page.evaluate((yw) => { yaw = yw; pitch = -.5; const ch = window._t; px = ch.x; pz = ch.z + 1.3; }, yw);
  // the E prompt's target is found by the main loop: on a slow runner 600ms may hold no frame, so wait for real ones
  await g.frames(3); await page.keyboard.press('e'); await g.frames(2);
  keyOut = await page.evaluate(() => ({ lockOpen, loot: lootOpen, still: window._t.locked }));
  if (keyOut.lockOpen || keyOut.loot) break;
}
await page.evaluate(() => { try { closeLockpick(); } catch (e) {} try { closeLoot(); } catch (e) {} });
check('E at a locked chest brings out the pick, not the loot', keyOut.lockOpen && !keyOut.loot && keyOut.still, keyOut);

// treasure chests carry one more pin than an ordinary chest in the same place
const bonus = await page.evaluate(() => { const a = { x: 5, z: 9, floor: 1 }, b = { x: 5, z: 9, floor: 1, lockBonus: 1 };
  return { plain: lpDifficulty(a).pins, treasure: lpDifficulty(b).pins }; });
check('a treasure chest is a harder lock', bonus.treasure === Math.min(5, bonus.plain + 1), bonus);

// the tower: the chest at the top is locked, a good lock, and once picked stays picked
await page.evaluate(() => { goToZone('world', 13100, 25450, 0, 'x'); }); await page.waitForTimeout(9000); await g.hide();
// on a loaded machine the world can still be building after the pause (Session 173: no tower was found, twice, with suites
// running two at a time); wait for it to be the active zone with its towers placed, up to a minute and a half
await page.waitForFunction(() => activeZoneId === 'world' && [...WORLD.SITES].some(t => t.kind === 'tower'), null, { timeout: 90000, polling: 250 }).catch(() => {});
const tower = await page.evaluate(async () => { const wait = ms => new Promise(r => setTimeout(r, ms));
  const s = [...WORLD.SITES].filter(t => t.kind === 'tower').sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
  if (!s) return { none: true }; px = s.x; pz = s.z + 12;
  for (let k = 0; k < 40 && !WORLD.settle.get(s.id); k++) { WORLD.tick(1 / 60, performance.now()); await wait(250); }
  const h = ZONES.world.houses.find(x => x.id === 'g_' + s.id + '_tower'); if (!h) return { noHouse: s.id };
  goToInterior(h); await wait(4000);
  const L = WORLD.intLoot; if (!L) return { noLoot: true }; px = L.x; pz = L.z; jumpY = L.y; lookAtPt(L.x, L.y + .3, L.z);
  const prompt = WORLD.lootPrompt(); const gold0 = BAG.length;
  WORLD.lootInteract(); const pins = LP.pins.length, title = document.getElementById('lpk-title').textContent;
  for (let k = 0; k < 8 && LP.phase !== 'done'; k++) { lpPress(); LP.pushed = performance.now() - LP.rise - 5; lpPress(); }
  await wait(900);
  return { id: s.id, prompt, pins, title, picked: !!(worldState.towerPicked && worldState.towerPicked[L.id]), taken: !!(worldState.towerLoot && worldState.towerLoot[L.id]), got: BAG.length - gold0, after: WORLD.lootPrompt() }; });
check('the tower chest is a good lock, and picking it yields the hoard', !tower.none && /pick/.test(tower.prompt || '') && tower.pins >= 4 && tower.picked && tower.taken && tower.after == null, tower);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
