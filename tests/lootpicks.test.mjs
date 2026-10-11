// Session 633: Michael's A on DECISION #191, lockpicks more common as loot. A chest and a treasure chest roll three picks
// at weight 30 (was 12 of 127, and a treasure chest never), and a humanoid foe's body (bandit, kobold, skeleton, goblin)
// holds 1–2 picks one time in twenty, rolled on the corpse's key (A's draft said a quarter; see the devlog: the dungeons hold
// far more humanoid dead than it counted). Checked: the pools; the odds over 4,000 chests and 4,000 bodies; that beasts and
// guards hold none; that a keyed body holds the same picks twice; and, in eight of the world's dungeons, the picks a clear
// finds in its chests and its humanoid dead (the aim: about 5 a dungeon), with one real kill through killE.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const pools = await page.evaluate(() => { const w = k => { const P = LOOT_POOLS[k]; const t = P.reduce((a, p) => a + p.w, 0);
    const pk = P.filter(p => { const it = p.roll(); return it && it.name === 'Lockpick'; }); return { picks: pk.reduce((a, p) => a + p.w, 0), total: t, qty: pk.length ? pk[0].roll().qty : 0 }; };
  return { chest: w('chest'), treasure: w('treasure'), corpse: w('corpse') }; });
check(`a chest rolls picks at weight ${pools.chest.picks} of ${pools.chest.total}, a treasure chest ${pools.treasure.picks} of ${pools.treasure.total}, three at a time`,
  pools.chest.picks === 30 && pools.treasure.picks === 30 && pools.chest.qty === 3 && pools.treasure.qty === 3, pools);

const odds = await page.evaluate(() => { const N = 4000; const q = L => L.filter(it => it && it.name === 'Lockpick').reduce((a, it) => a + (it.qty || 1), 0);
  let ch = 0, tr = 0; for (let i = 0; i < N; i++) { ch += q(rollContainerLoot('chest', null, 'ruins', 1, 'pk:c:' + i)); tr += q(rollContainerLoot('treasure', null, 'ruins', 1, 'pk:t:' + i)); }
  const body = name => { let has = 0, n = 0, max = 0; for (let i = 0; i < N; i++) { const L = bodyPicks({ name }, [], 'pk:b:' + name + ':' + i); const k = q(L); if (k) { has++; n += k; max = Math.max(max, k); } } return { share: +(has / N).toFixed(3), mean: has ? +(n / has).toFixed(2) : 0, max }; };
  const same = (() => { let s = 0; for (let i = 0; i < 200; i++) { const a = JSON.stringify(bodyPicks({ name: 'Bandit' }, [], 'pk:s:' + i)), b = JSON.stringify(bodyPicks({ name: 'Bandit' }, [], 'pk:s:' + i)); if (a === b) s++; } return s; })();
  return { chest: +(ch / N).toFixed(3), treasure: +(tr / N).toFixed(3), Bandit: body('Bandit'), 'Bandit Captain': body('Bandit Captain'), Kobold: body('Kobold Thief'), Skeleton: body('Skeleton'), Goblin: body('Goblin Slinger'),
    Wolf: body('Wolf'), Golem: body('Golem'), Slime: body('Slime'), guard: (() => { let n = 0; for (let i = 0; i < 400; i++) n += q(bodyPicks({ name: 'Bandit', _guard: true }, [], 'pk:g:' + i)); return n; })(), same }; });
console.log('picks a chest', odds.chest, 'a treasure chest', odds.treasure, JSON.stringify(odds));
check(`a chest holds ${odds.chest} picks on average, a treasure chest ${odds.treasure} (12 of 127 gave a chest about 0.25)`, odds.chest > 0.5 && odds.chest < 0.7 && odds.treasure > 0.75 && odds.treasure < 1.0, odds);
const hum = ['Bandit', 'Bandit Captain', 'Kobold', 'Skeleton', 'Goblin'];
check(`a bandit's, kobold's, skeleton's or goblin's body holds picks one time in twenty (${hum.map(k => odds[k].share).join(', ')}), 1–2 of them (mean ${hum.map(k => odds[k].mean).join(', ')})`,
  hum.every(k => Math.abs(odds[k].share - .05) < .015 && odds[k].mean > 1.35 && odds[k].mean < 1.65 && odds[k].max === 2), odds);
check(`a wolf, a golem, a slime and a guard hold none (${odds.Wolf.share}, ${odds.Golem.share}, ${odds.Slime.share}, ${odds.guard})`, odds.Wolf.share === 0 && odds.Golem.share === 0 && odds.Slime.share === 0 && odds.guard === 0, odds);
check(`a keyed body holds the same picks rolled twice (${odds.same}/200)`, odds.same === 200, odds.same);

const seeds = await page.evaluate(() => { const out = []; for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) { const c = WORLD.getCell(i, j); for (const e of (c && c.doors) || []) if (e && e.seed != null && !e.lair) out.push(e.seed); } return out; });
const idx = [...new Set([...Array(8)].map((_, k) => seeds[Math.floor((k + .5) * seeds.length / 8)]).filter(x => x != null))];
const rows = []; let killed = null;
for (const i of idx) {
  const r = await page.evaluate(async ({ i, kill }) => { const wait = ms => new Promise(r => setTimeout(r, ms));
    const e = WORLD.doorAnywhere(i); if (!e) return null; const p = makePortalDef(e); const wp = (WORLD.dungeonPos || {})[i]; if (wp) { p.x = wp.x; p.z = wp.z; px = wp.x; pz = wp.z + 3; } p.zone = 'world';
    goToDungeon(p); for (let k = 0; k < 40 && activeZoneId !== 'dungeon'; k++) await wait(500); await wait(3000);
    const qty = L => (L || []).filter(it => it && it.name === 'Lockpick').reduce((a, it) => a + (it.qty || 1), 0);
    const found = CHESTS.reduce((a, c) => a + qty(c.items), 0); const hum = ENEMIES.filter(f => !f.dead && PICK_BODIES.test(f.name || ''));
    let k = null;
    if (kill) { const f = hum.find(f => f.id && bodyPicks(f, [], `${f.id}:corpse:${lootDay()}`).length) || hum.find(f => f.id); if (f) { const before = CORPSES.length; killE(f); const c = CORPSES[before];
        const again = bodyPicks(f, [], `${f.id}:corpse:${lootDay()}`); k = { name: f.name, id: f.id, corpse: !!c, picks: c ? qty(c.items) : -1, expect: qty(again) }; } }
    return { name: p.name, zone: activeZoneId, chests: CHESTS.length, found, foes: ENEMIES.length, humanoid: hum.length, names: [...new Set(hum.map(f => f.name))], k };
  }, { i, kill: !killed || killed.picks === 0 });
  if (r) { rows.push(r); if (r.k && (!killed || r.k.picks > 0)) killed = r.k; console.log(`${r.name}: ${r.chests} chests hold ${r.found} picks; ${r.humanoid} of ${r.foes} foes are bandits, kobolds, skeletons or goblins (${r.names.join(', ')}); expected from bodies ${(r.humanoid * .075).toFixed(1)}`); }
  await page.evaluate(() => goToOW()); await page.waitForTimeout(4000); await g.hide();
}
const inD = rows.filter(r => r.zone === 'dungeon');
const mean = inD.reduce((a, r) => a + r.found + r.humanoid * .075, 0) / Math.max(1, inD.length);
console.log(`mean picks a clear finds: ${mean.toFixed(1)} (chests as rolled, bodies at their expectation)`);
check(`eight dungeons were entered (${inD.length}), and a clear finds about 5 picks on average (${mean.toFixed(1)})`, inD.length === 8 && mean > 3.5 && mean < 8, rows.map(r => [r.name, r.zone]));
check(`a body killed through killE (${killed && killed.name}) holds what its key rolls: ${killed && killed.picks} picks, the key says ${killed && killed.expect}`, !!killed && killed.corpse && killed.picks === killed.expect && killed.picks > 0, killed);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
