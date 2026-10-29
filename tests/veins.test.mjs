// Survival B, session 3: veins and ore (Session 1491; `docs/design/survival-build.md`). 2 to 5 veins a 64 m chunk on steep
// ground, each keyed <cx,cz>:<i>. The place sets the metal: tier 1 copper and tin (iron one in four), 2 iron and silver,
// 3 iron and mithril, 4 mithril, adamant and obsidian. A vein holds 3 ore and comes back 7 game-days after; a strike with a
// pick every 0.9 s breaks an ore at 35% + 0.5% a Mining point, on a stream seeded by the vein and the strike's count, so a
// reload strikes the same ore at the same strike. `worldState.veins` is the world's.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  BAG.length = 0; worldState.veins = {};
  // ── the veins about the home province ──
  const live = VEINS.filter(veinLive);
  out.n = live.length;
  const per = {}; live.forEach(v => { const k = v.id.split(':')[0]; per[k] = (per[k] || 0) + 1; });
  out.perMax = Math.max(0, ...Object.values(per)); out.perMin = Math.min(99, ...Object.values(per));
  out.ids = live.every(v => /^-?\d+,-?\d+:\d+$/.test(v.id));
  // the steepest of the chunk's tries: no try left out is steeper than one taken
  out.steep = live.every(v => { const [cx, cz] = v.id.split(':')[0].split(',').map(Number); const taken = live.filter(u => u.id.startsWith(cx + ',' + cz + ':'));
    const lo = Math.max(...taken.map(u => slopeNormalY(u.x, u.z))); let worse = 0;
    for (let i = 0; i < 40; i++) { if (taken.some(u => u.id.endsWith(':' + i))) continue; const x = cx * CHUNK + 3 + hash01(cx + i, cz, 302) * (CHUNK - 6), z = cz * CHUNK + 3 + hash01(cz, cx + i, 303) * (CHUNK - 6);
      if (worldH(x, z) >= 1.5 && !solidAt(x, z) && slopeNormalY(x, z) < lo - 1e-9) { const ri = roadInfo(x, z), st = stampAt(x, z); if (!(ri && ri.d < ROAD_HALF + 2) && !(st && st.kind === 'site' && Math.hypot(x - st.x, z - st.z) < st.r)) worse++; } }
    return worse === 0; });
  out.byTable = live.every(v => VEIN_TABLE[v.tier].some(([k]) => k === v.ore));
  out.tiers = [...new Set(live.map(v => v.tier))].sort();
  out.mesh = live.filter(v => v.g && v.g.parent).length;
  // S1498 — one mesh a vein, not drawn past VEIN_FAR
  out.one = live.map(v => { let n = 0; v.g.traverse(o => { if (o.isMesh) n++; }); return n; });
  { const v = live[0], c = new THREE.PerspectiveCamera(), at = d => { c.position.set(v.x + d, worldH(v.x, v.z) + 1.6, v.z); c.updateMatrixWorld(true); v.g.updateMatrixWorld(true); v.g.update(c); return v.g.userData.mesh.visible; };
    out.lod = [at(10), at(VEIN_FAR + 10), at(10)]; out.full = v.g.userData.mesh.geometry.attributes.position.count; }
  // ── each tier's metals, over 400 ids ──
  out.metals = {};
  for (const t of [1, 2, 3, 4]) { const c = {}; for (let i = 0; i < 400; i++) { const k = veinOre('t:' + i, t); c[k] = (c[k] || 0) + 1; } out.metals[t] = c; }
  // ── working one ──
  const v = live[0]; if (!v) return out;
  px = v.x + 1; pz = v.z;
  out.near = veinNear() === v;
  out.noPick = strikeVein(v).why;
  bagAdd({ ...PICK_ITEM }); SKILLS.mining = { lv: 25, p: 0 };
  const p0 = SKILLS.mining.p; let strikes = 0, ores = 0, seq = [];
  while (veinLeft(v) > 0 && strikes < 200) { const s = strikeVein(v); strikes++; seq.push(s.ore ? 1 : 0); if (s.ore) ores++; }
  out.work = { strikes, ores, left: veinLeft(v), bag: bagCount(b => b.ore === v.ore), seams: v.g ? v.g.userData.shown : -1, bare: v.g ? v.g.userData.mesh.geometry.attributes.position.count : -1,
    rec: worldState.veins[v.id], learned: SKILLS.mining.p > p0 || SKILLS.mining.lv > 25 };
  out.spent = strikeVein(v).why;
  // ── back after 7 days ──
  worldState.gameTimeAbsMinutes += 6 * 1440; out.day6 = veinLeft(v);
  worldState.gameTimeAbsMinutes += 1440; out.day7 = veinLeft(v);
  // ── the same strikes after a reload: strike twice, save, strike five; load the save, strike the same five ──
  const v2 = live[1] || v; worldState.veins[v2.id] = undefined; delete worldState.veins[v2.id];
  BAG.length = 0; bagAdd({ ...PICK_ITEM });
  strikeVein(v2); strikeVein(v2);
  const d = JSON.parse(ssStringify(_buildSavePayload())); const saved = JSON.parse(JSON.stringify((d.wS.veins || {})[v2.id] || null));
  const a = []; for (let i = 0; i < 5; i++) a.push(strikeVein(v2).ore || '-');
  _applyLoadData(d); BAG.length = 0; bagAdd({ ...PICK_ITEM }); SKILLS.mining = { lv: 25, p: 0 };
  const b = []; for (let i = 0; i < 5; i++) b.push(strikeVein(v2).ore || '-');
  out.reload = { a, b, rec: saved, id: v2.id, same: v2 === v };
  // ── the break chance by Mining, over many strikes on fresh ids ──
  const rate = lv => { SKILLS.mining = { lv, p: 0 }; let got = 0; const N = 600; for (let i = 0; i < N; i++) { const t = { id: 'rate:' + lv + ':' + i, ore: 'iron', g: null };
    worldState.veins[t.id] = undefined; delete worldState.veins[t.id]; BAG.length = 0; bagAdd({ ...PICK_ITEM }); if (strikeVein(t).ore) got++; } return +(got / N).toFixed(3); };
  out.rate5 = rate(5); out.rate100 = rate(100);
  // ── Mining's perks (S1495): Seam, the doubled ore, Prospector ──
  const t5 = { id: 'seam:0', ore: 'iron', g: null }; delete worldState.veins[t5.id]; BAG.length = 0; bagAdd({ ...PICK_ITEM });
  SKILLS.mining = { lv: 99, p: 0 }; const cap99 = veinLeft(t5); SKILLS.mining = { lv: 100, p: 0 }; let n5 = 0;
  for (let i = 0; i < 400 && veinLeft(t5) > 0; i++) if (strikeVein(t5).ore) n5++;
  out.seam = { cap99, cap100: 5 - (worldState.veins[t5.id] || { n: 0 }).n + n5, ores: n5, spent: strikeVein(t5).why };
  const dbl = lv => { SKILLS.mining = { lv, p: 0 }; let got = 0, two = 0; for (let i = 0; i < 800; i++) { const t = { id: 'dbl:' + lv + ':' + i, ore: 'iron', g: null }; delete worldState.veins[t.id];
    BAG.length = 0; bagAdd({ ...PICK_ITEM }); const s = strikeVein(t); if (s.ore) { got++; if (bagCount(b => b.ore === 'iron') === 2) two++; } } return { got, two }; };
  out.dbl49 = dbl(49); out.dbl50 = dbl(50);
  const cv = document.createElement('canvas'); cv.width = cv.height = 104; const ctx = cv.getContext('2d');
  px = v.x + 1; pz = v.z; SKILLS.mining = { lv: 24, p: 0 }; out.dots24 = prospectorDots(ctx, 104, 58);
  SKILLS.mining = { lv: 25, p: 0 }; out.dots25 = prospectorDots(ctx, 104, 58); out.within40 = VEINS.filter(u => veinLive(u) && Math.hypot(u.x - px, u.z - pz) <= 40).length;
  // ── S1560: Lodestone (Mining 75, #860 A): one ore in ten from a vein in the Mark's highlands brings a lodestone; carried, Prospector
  // reaches 120 m and the compass points to the nearest vein ──
  { let mk = null; for (let i = 0; i < 60 && !mk; i++) for (let j = 0; j < 60 && !mk; j++) if (nationKeyOf(i, j) === 'mark') mk = [i, j];
    const S = WORLD.SIZE, at = (c, tier, id) => ({ id, ore: 'iron', tier, x: (c[0] + .5) * S, z: (c[1] + .5) * S, g: null });
    out.lode = { live: PERK_LIVE.has('mining:75'), mark: !!mk, ground3: !!mk && lodestoneGround(at(mk, 3, 'lg:a')), ground2: !!mk && lodestoneGround(at(mk, 2, 'lg:b')), home3: lodestoneGround({ ...v, tier: 3 }) };
    const lodes = lv => { SKILLS.mining = { lv, p: 0 }; let got = 0, n = 0; const said = []; for (let i = 0; i < 1500; i++) { const t = at(mk, 3, 'lode:' + lv + ':' + i); delete worldState.veins[t.id];
      BAG.length = 0; bagAdd({ ...PICK_ITEM }); const q = strikeVein(t); if (q.ore) { got++; if (bagCount(b => b.lodestone)) { n++; if (said.length < 1) said.push(q.ore); } } } return { got, n, said }; };
    if (mk) { out.lode.at74 = lodes(74); out.lode.at75 = lodes(75); }
    BAG.length = 0; px = v.x + 1; pz = v.z; SKILLS.mining = { lv: 25, p: 0 };
    out.lode.compass0 = WORLD.compassPlaces().filter(q => q.lode).length; out.lode.dots40 = prospectorDots(ctx, 104, 58);
    bagAdd({ ...LODESTONE_ITEM }); out.lode.dots120 = prospectorDots(ctx, 104, 58);
    out.lode.within120 = VEINS.filter(u => veinLive(u) && Math.hypot(u.x - px, u.z - pz) <= 120).length;
    out.lode.past58 = VEINS.filter(u => veinLive(u) && Math.hypot(u.x - px, u.z - pz) > 58 && Math.hypot(u.x - px, u.z - pz) <= 120).length;
    px = v.x + 30; pz = v.z + 30; const near = VEINS.filter(u => veinLive(u) && veinLeft(u) > 0).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))[0];
    const lv = lodestoneVein(), cp = WORLD.compassPlaces().filter(q => q.lode);
    out.lode.compass = { nearest: !!lv && !!near && lv.x === near.x && lv.z === near.z, places: cp.length, glyph: cp[0] && cp[0].glyph, d: cp[0] && Math.round(cp[0].d) };
    const d = JSON.parse(ssStringify(_buildSavePayload())); out.lode.saved = JSON.stringify(d).includes('"lodestone":true'); BAG.length = 0; }
  // ── the shops ──
  out.pickAt = { weapon: minersPickFor({ type: 'weapon' }).length, misc: minersPickFor({ type: 'misc' }).length, potion: minersPickFor({ type: 'potion' }).length };
  out.oreW = oreItem('iron').weight; out.pickW = PICK_ITEM.weight; out.pickPrice = PICK_ITEM.buyPrice;
  // ── S1533: the Fighters' Guild's Supply (#814 A): one task in five; the hall's country's ore; dug, carried, and taken at turn-in ──
  { const site = siteAnywhere('dunmore'), G = gstate(), keep = JSON.stringify(G.guild_f), kinds = {}; let sup = null;
    G.guild_f = { done: 3, active: null };
    for (let i = 0; i < 400; i++) { const t = genTask('guild_f', site); kinds[t.kind] = (kinds[t.kind] || 0) + 1; if (t.kind === 'supply' && !sup) sup = t; }
    const want = SUPPLY_ORE[veinTier(site.x, site.z)];
    out.supply = { kinds, tier: veinTier(site.x, site.z), want, ore: sup && sup.ore, need: sup && sup.need, short: sup && sup.short };
    if (sup) { G.guild_f.active = sup; BAG.length = 0; bagAdd({ ...PICK_ITEM }); SKILLS.mining = { lv: 100, p: 0 };
      out.supply.before = turnIn('guild_f');
      const t = { id: 'supply:0', ore: sup.ore, g: null }; delete worldState.veins[t.id];
      for (let i = 0; i < 400 && oreCount(sup.ore) < sup.need + 1; i++) { if (veinLeft(t) <= 0) { worldState.veins[t.id] = undefined; delete worldState.veins[t.id]; t.id += 'x'; } strikeVein(t); }
      out.supply.carried = oreCount(sup.ore); out.supply.stamped = sup.doneAt != null && !!sup._told;
      const g0 = gold; out.supply.said = turnIn('guild_f'); out.supply.paid = gold - g0; out.supply.left = oreCount(sup.ore); out.supply.active = G.guild_f.active; }
    G.guild_f = JSON.parse(keep); }
  return out;
});
console.log(JSON.stringify(r));
check('Seam (100): a vein holds 5 (3 at 99)', r.seam.cap99 === 3 && r.seam.ores === 5 && /worked out/.test(r.seam.spent), r.seam);
check('Mining 50: about one ore in four comes double; none at 49', r.dbl49.two === 0 && Math.abs(r.dbl50.two / r.dbl50.got - .25) < .07, [r.dbl49, r.dbl50]);
check('Prospector (25): the veins within 40 m on the minimap; none at 24', r.dots24 === 0 && r.dots25 === r.within40 && r.dots25 >= 1, [r.dots24, r.dots25, r.within40]);
check('Lodestone (75) is live; the ground is a tier-3 vein in a cell of the Mark, not tier 2 there, not at home', r.lode.live && r.lode.mark && r.lode.ground3 && !r.lode.ground2 && !r.lode.home3, r.lode);
check('at 75 about one ore in ten from the Mark\'s highlands brings a lodestone, said with the ore; none at 74', r.lode.at74 && r.lode.at74.n === 0 && r.lode.at75 && Math.abs(r.lode.at75.n / r.lode.at75.got - .1) < .04 && /and a lodestone/.test(r.lode.at75.said[0] || ''), [r.lode.at74, r.lode.at75]);
check('carried, a lodestone takes Prospector from 40 m to 120 m (past the minimap\'s 58 m on its rim)', r.lode.dots40 === r.dots25 && r.lode.dots120 === r.lode.within120 && r.lode.dots120 > r.lode.dots40, [r.lode.dots40, r.lode.dots120, r.lode.within120, r.lode.past58]);
check('and the compass points to the nearest vein with ore left; none without a lodestone; the save keeps it', r.lode.compass0 === 0 && r.lode.compass.nearest && r.lode.compass.places === 1 && r.lode.compass.glyph === '◆' && r.lode.saved, r.lode.compass);
check('veins lie about the home province', r.n >= 2, r.n);
check('2 to 5 a chunk', r.perMin >= 2 && r.perMax <= 5, [r.perMin, r.perMax]);
check('each keyed <cx,cz>:<i>', r.ids);
check('on the steepest of the chunk\'s tries', r.steep);
check('each vein\'s metal is on its tier\'s row', r.byTable, r.tiers);
check('each vein is drawn in its chunk', r.mesh === r.n, r.mesh);
check('each vein is one mesh, the rock and its seams (one draw call)', r.one.length && r.one.every(n => n === 1), r.one);
check(`a vein is drawn within ${80} m and not past it`, r.lod.join() === 'true,false,true', r.lod);
const M = r.metals;
check('tier 1: copper and tin, iron one in four', !M[1].silver && Math.abs(M[1].iron / 400 - .25) < .07 && M[1].copper > 100 && M[1].tin > 100, M[1]);
check('tier 2: iron and silver', Object.keys(M[2]).sort().join() === 'iron,silver', M[2]);
check('tier 3: iron and mithril', Object.keys(M[3]).sort().join() === 'iron,mithril', M[3]);
check('tier 4: mithril, adamant and obsidian', Object.keys(M[4]).sort().join() === 'adamant,mithril,obsidian', M[4]);
check('the vein is found at hand', r.near);
check('no pick, no strike', r.noPick === 'You need a pick.', r.noPick);
check('a vein gives 3 ore, then none', r.work && r.work.ores === 3 && r.work.left === 0 && r.work.bag === 3 && r.spent === 'The vein is worked out.', [r.work, r.spent]);
check('the seams go as the ore is taken', r.work && r.work.seams === 0 && r.work.bare === r.full - 72, r.work && [r.work.seams, r.work.bare, r.full]);
check('a strike teaches Mining', r.work && r.work.learned);
check('worked out at day 6, back at day 7', r.day6 === 0 && r.day7 === 3, [r.day6, r.day7]);
check('the save keeps the vein\'s strikes', r.reload.rec && r.reload.rec.s === 2, r.reload.rec);
check('a reload strikes the same ore at the same strike', r.reload.a.join() === r.reload.b.join(), r.reload);
check('35% + 0.5% a Mining point: 37.5% at 5, 85% at 100', Math.abs(r.rate5 - .375) < .06 && Math.abs(r.rate100 - .85) < .05, [r.rate5, r.rate100]);
check('the pick at the smith and the goods shop', r.pickAt.weapon === 1 && r.pickAt.misc === 1 && r.pickAt.potion === 0, r.pickAt);
check('ore weighs 2, the pick 4 and costs 40', r.oreW === 2 && r.pickW === 4 && r.pickPrice === 40);
const S = r.supply;
check('the Fighters\' Guild rolls Supply about one task in five', S.kinds.supply >= 55 && S.kinds.supply <= 105, S.kinds);
check('Supply asks 3 + tier of the ore the hall\'s own country yields', S.ore && S.want.includes(S.ore) && S.need === 4 && /^Supply 4 /.test(S.short), S);
check('dug ore counts: not yet with none, done when carried, the guild takes what it asked and leaves the rest', /^Not yet\. 0\/4\./.test(S.before) && S.carried >= 5 && S.stamped && /^Good work\. \d+ gold/.test(S.said) && S.paid > 0 && S.left === S.carried - 4 && !S.active, S);
await g.close();
