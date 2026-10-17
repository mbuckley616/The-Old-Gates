// Enemies by place, the sheet's main line (Session 1066; the designer's sheet on Michael's A on #373): one chunk, one lair, one
// commission and one dungeon's two floors, on the same seed, made at level 1 and at level 30, give the same foes: kind, variant,
// health, blow and pace, the count, and the traps. No level is read where a foe, a trap or a dungeon is made. Since Session 1073
// (Michael's A on DECISION #394) the hoard and the floors' chests are held to it too; a gold pile's count still follows your level.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const row = e => [e.baseName || e.name, e.variant || null, e.tier || null, e.maxHp, +(e.dmgMult || 0).toFixed(4), +(e.dmg || 0).toFixed(3), +(e.spd || 0).toFixed(4), !!e.locked];
const open = await page.evaluate(() => {
  const home = getCell(HOME_I, HOME_J).regions, L0 = level, P0 = [px, pz], out = {};
  const ROW = e => [e.baseName || e.name, e.variant || null, e.tier || null, e.maxHp, +(e.dmgMult || 0).toFixed(4), +(e.dmg || 0).toFixed(3), +(e.spd || 0).toFixed(4), !!e.locked];
  forceTime(23);
  // the chunks: nine at the centre of the Deepwood and nine in the Wastes
  const chunks = lv => { level = lv; const rows = [];
    for (const id of ['deepwood', 'wastes']) { const reg = home.find(q => q.id === id); if (!reg) continue;
      const c0 = Math.floor(reg.x / CHUNK) - 1, d0 = Math.floor(reg.z / CHUNK) - 1;
      for (let cx = c0; cx < c0 + 3; cx++) for (let cz = d0; cz < d0 + 3; cz++) { const ch = { cx, cz, enemies: [] }; spawnChunkEncounters(ch);
        for (const e of ch.enemies) rows.push([id, chunkKey(cx, cz), ...ROW(e)]); despawnChunkEncounters(ch); } }
    return rows; };
  out.chunks = [chunks(1), chunks(30)];
  // a lair round home, built again from nothing at each level
  let lair = null; for (let i = HOME_I - 1; i <= HOME_I + 1 && !lair; i++) for (let j = HOME_J - 1; j <= HOME_J + 1 && !lair; j++) { const c = getCell(i, j); lair = c && c.sites.find(t => t.kind === 'lair' && !t.dragon); }
  const lairAt = lv => { level = lv; if (SETTLE.has(lair.id)) disposeSettlement(lair.id); genSettlement(lair); const S = SETTLE.get(lair.id);
    const rows = (S && S.creatures || []).map(ROW); disposeSettlement(lair.id); return rows; };
  out.lair = lair ? { name: lair.name, tier: worldTierAt(lair.x, lair.z), rows: [lairAt(1), lairAt(30)] } : null;
  // a guild commission's quarry, spawned near you on the same task id at each level
  const W = home.find(q => q.id === 'foothills') || home[0], G = gstate(), keep = G.guild_f.active;
  const quarry = lv => { level = lv; const t = { id: 'guild_f:tlf:1', g: 'guild_f', kind: 'beast', beast: 'Ogre', sx: W.x + 30, sz: W.z, spawned: false, done: false };
    G.guild_f.active = t; px = W.x; pz = W.z; ensureTaskWorldObjects(); const e = ZONES.world.enemies.find(e => e._guildTag === t.id); const r = e ? ROW(e) : null;
    if (e) { ZONES.world.enemies.splice(ZONES.world.enemies.indexOf(e), 1); if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); } return r; };
  out.quarry = [quarry(1), quarry(30)]; G.guild_f.active = keep; [px, pz] = P0; level = L0;
  const D = home.find(q => q.id === 'deepwood'); out.D = { x: D.x, z: D.z }; return out; });
console.log(JSON.stringify({ chunks: open.chunks[0].length, sample: open.chunks[0].slice(0, 4), lair: open.lair && { name: open.lair.name, tier: open.lair.tier, rows: open.lair.rows[0] }, quarry: open.quarry }));

// a lair's cavern in the Deepwood, two floors, entered at level 1 and at level 30
async function enter(lv) {
  await page.evaluate(([lv, D]) => { level = lv; window._lairBoss = null; delete (worldState.masters || {})[7363];
    const L = { place: 'Testwood', boss: 'Cave Bear' }, p = makePortalDef({ x: D.x, z: D.z, zone: 'world', seed: 7363, size: 'medium', theme: 'deep', lair: L }); p.lair = L; goToDungeon(p); }, [lv, open.D]);
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId === 'dungeon' && ENEMIES.length > 0 && !!window._lairBoss)) break; }
  await g.spin(30);
  const r = await page.evaluate(() => { const ROW = e => [e.baseName || e.name, e.variant || null, e.tier || null, e.maxHp, +(e.dmgMult || 0).toFixed(4), +(e.dmg || 0).toFixed(3), +(e.spd || 0).toFixed(4), !!e.locked];
    const traps = D_TRAPS.map((t, i) => [t.kind || 'blade', +(t.x || 0).toFixed(2), +(t.z || 0).toFixed(2), t.kind === 'spike' ? spikeTrapRaw(t) : bladeTrapRaw()]);
    const h = (worldState.masters || {})[currentPortal.seed]; const hoard = h && h.hoard ? h.hoard.items.map(it => [it.name, it.value || 0]) : null;
    const chests = CHESTS.concat(BARRELS).map(c => [c.id, ...(c.items || []).map(it => it.name + (it.type === 'gold' ? '' : '|' + (it.tier || 0)))]);
    return { chests, grade: currentPortal.diff, foes: ENEMIES.map(e => [e.floor || 1, ...ROW(e), e === window._lairBoss]), traps, hoard, wyrm: +wyrmFireRaw().toFixed(2) }; });
  await page.evaluate(() => { goToOW(); });
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(400); if (await page.evaluate(() => activeZoneId !== 'dungeon')) break; }
  await g.frames(4);
  return r;
}
const a = await enter(1), b = await enter(30);
console.log(JSON.stringify({ grade: a.grade, foes: a.foes.length, f2: a.foes.filter(x => x[0] === 2).length, master: a.foes.find(x => x[x.length - 1]), traps: a.traps.length, sample: a.traps.slice(0, 3), hoard: [a.hoard, b.hoard] }));
const diff = (x, y) => x.map((r, i) => [r, y[i]]).filter(([p, q]) => JSON.stringify(p) !== JSON.stringify(q)).slice(0, 6);
check(`18 chunks in the Deepwood and the Wastes spawn the same ${open.chunks[0].length} foes at level 30 as at level 1`, open.chunks[0].length > 10 && JSON.stringify(open.chunks[0]) === JSON.stringify(open.chunks[1]), diff(open.chunks[0], open.chunks[1]));
check('no foe of theirs is latent', open.chunks[0].concat(open.chunks[1]).every(x => !x[x.length - 1]));
check(`a lair round home (${open.lair && open.lair.name}, tier ${open.lair && open.lair.tier}) is built with the same beasts at both levels`, !!open.lair && open.lair.rows[0].length >= 3 && JSON.stringify(open.lair.rows[0]) === JSON.stringify(open.lair.rows[1]), open.lair);
check('a commission\'s Ogre is the same at both levels', !!open.quarry[0] && JSON.stringify(open.quarry[0]) === JSON.stringify(open.quarry[1]), open.quarry);
check(`a Deepwood lair's cavern is ${a.grade} at both levels, with the same ${a.foes.length} foes on its two floors, the master among them`, a.grade === b.grade && a.foes.some(x => x[0] === 2) && a.foes.some(x => x[x.length - 1]) && JSON.stringify(a.foes) === JSON.stringify(b.foes), diff(a.foes, b.foes));
check(`its ${a.traps.length} traps stand in the same places and land the same at both levels`, JSON.stringify(a.traps) === JSON.stringify(b.traps) && a.wyrm === b.wyrm, { a: a.traps, b: b.traps });
check(`the master's hoard is the same at both levels (${JSON.stringify(a.hoard)})`, !!a.hoard && JSON.stringify(a.hoard) === JSON.stringify(b.hoard), { a: a.hoard, b: b.hoard });
check(`its ${a.chests.length} chests and barrels hold the same goods at both levels`, a.chests.length > 2 && JSON.stringify(a.chests) === JSON.stringify(b.chests), diff(a.chests, b.chests));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
