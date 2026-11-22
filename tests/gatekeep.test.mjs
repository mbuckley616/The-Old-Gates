// What a gate keeps (what-a-gate-keeps-build.md, Michael's C on #1092), the sheet's first session (Session 2370): a lesser gate's ring
// chamber is its keep, and its coffer stands on the dais. Rolled on <seed>:<floor>:coffer with no day, so two rolls agree; 2 pieces of arms,
// armour or implements, never gold, at the floor's tier plus one and at most 4; the gate's orb, one gate in three, in it and in no chest.
// Then one such gate entered: the coffer shut until its carving is touched, open after, one piece taken, and what is left kept by the world
// row of the save and by the gate rebuilt.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const P = await page.evaluate(() => {
  const T = carvingTable().bySeed, port = (e) => { const p = makePortalDef(e); p.zone = 'world'; p.sigil = true; p.theme = p.theme || e.theme; return p; };
  const doors = []; for (const s of Object.keys(T)) { const e = WORLD.doorAnywhere(+s); if (!e || e.lairDoor || e.kind === 'fort_door') continue; const p = port(e); if (gateCofferDue(p)) doors.push({ p, d: Math.hypot(e.x - px, e.z - pz) }); }
  doors.sort((a, b) => a.d - b.d);
  const rows = [], twenty = doors.slice(0, 20);
  for (const { p } of twenty) { const a = gateCofferItems(p, 1), b = gateCofferItems(p, 1), name = (L) => L.map(i => i.name + '|' + (i.tier || 0)).join(';');
    rows.push({ seed: p.seed, same: name(a) === name(b), n: a.length, gold: a.filter(i => i.type === 'gold').length, kit: a.every(i => i.slot || i.implement), orb: gateOrbDue(p), orbFirst: !!(a[0] && a[0].gateOrb != null), orbs: a.filter(i => i.gateOrb != null).length,
      cap: Math.min(4, dungeonTier(p, 1) + 1), mat: Math.max(...a.filter(i => i.gateOrb == null).map(i => i.tier || 0)) }); }
  // the roll's kind over many pieces: arms, armour and found implements of the gate's school only
  let found = 0, weap = 0, other = 0, wrong = 0; const p0 = twenty[0].p, school = gateOrbSchool(p0);
  for (let k = 0; k < 400; k++) withLootRng(seededRng('cofferkind', k), () => { const was = LOOT_SCHOOL; LOOT_SCHOOL = school; try { const it = rollLoot(p0.diffScale, p0.theme, 'coffer');
    if (!it || !(it.slot || it.implement)) other++; else if (it.found) { found++; if (it.school !== school) wrong++; } else if (it.slot === 'weapon') weap++; } finally { LOOT_SCHOOL = was; } });
  // S2376 — the delver: one keep in three, his things on his own stream
  const delv = doors.filter(x => gateDelverDue(x.p)), dRows = delv.slice(0, 12).map(({ p }) => { const a = gateDelverItems(p, 1), b = gateDelverItems(p, 1), nm = (D) => D.body.concat(D.camp).map(i => i.name + '|' + (i.value || i.tier || 0)).join(';');
    const sw = a.body.find(i => i.slot === 'weapon'), gold = a.body.find(i => i.type === 'gold');
    return { seed: p.seed, same: nm(a) === nm(b), gold: gold && gold.value, sword: sw && sw.weaponType, mat: sw && sw.tier, torch: a.body.some(i => i.torchType === 'torch'), book: a.body.some(i => i.bookId === 'delver_journal'), roll: a.camp.length === 1 && a.camp[0].roll === 'blanket' }; });
  const delvers = { n: delv.length, rows: dRows };
  const arcs = doors.filter(x => gateArcDue(x.p)).length, caps = ['steady', 'failing', 'catastrophic'].map(gateVeinCap);
  return { rows, n: doors.length, delvers, found, weap, other, wrong, school, arcs, caps, pick: (twenty.find(x => gateOrbDue(x.p) && gateArcDue(x.p) && gateDelverDue(x.p)) || twenty.find(x => gateArcDue(x.p) && gateDelverDue(x.p)) || twenty.find(x => gateOrbDue(x.p) && gateArcDue(x.p)) || twenty.find(x => gateArcDue(x.p)) || twenty[0]).p };
});
console.log('rolls', JSON.stringify({ n: P.n, rows: P.rows.map(r => [r.seed, r.n, r.orb ? 'orb' : '', r.cap, r.mat].join(' ')), found: P.found, weap: P.weap, other: P.other }));
check(`20 lesser gates with a carving of their own (of ${P.n} in the world)`, P.rows.length === 20, P.n);
check('each coffer rolls the same twice, on its own stream', P.rows.every(r => r.same), P.rows.filter(r => !r.same));
check('2 pieces each, plus the orb where the gate keeps one, and no gold', P.rows.every(r => r.n === 2 + (r.orb ? 1 : 0) && r.gold === 0 && r.kit), P.rows.filter(r => !(r.n === 2 + (r.orb ? 1 : 0) && r.gold === 0)));
check(`the orb lies first in the coffer of every orb gate (${P.rows.filter(r => r.orb).length} of 20)`, P.rows.every(r => r.orb ? r.orbFirst && r.orbs === 1 : r.orbs === 0), P.rows);
check('nothing in a coffer is a potion, a pick or gold: only arms, armour and implements, over 400 rolls', P.other === 0, P.other);
check(`one lesser gate's altar in three holds an arc (${P.arcs} of ${P.n}; DECISION #1718's B until answered)`, P.arcs / P.n > .22 && P.arcs / P.n < .45, P.arcs);
check(`the vein holds 3, 4 and 5 crystals by the gate's condition (${P.caps})`, P.caps.join() === '3,4,5', P.caps);
const share = P.found / (P.found + P.weap);
check(`a weapon roll in five is a found implement of the gate's school (${(share * 100).toFixed(0)}% of ${P.found + P.weap}, ${P.wrong} of another school)`, share > .13 && share < .28 && P.wrong === 0, { found: P.found, weap: P.weap, wrong: P.wrong });

const DV = P.delvers;
check(`one lesser gate's keep in three holds a dead delver (${DV.n} of ${P.n})`, DV.n / P.n > .22 && DV.n / P.n < .45, DV.n);
check(`his things roll the same twice: a purse of 8 to 20 (${DV.rows.map(r => r.gold)}), a sword, a torch, his journal, and his camp's blanket roll`, DV.rows.length > 0 && DV.rows.every(r => r.same && r.gold >= 8 && r.gold <= 20 && r.sword === 'Sword' && r.torch && r.book && r.roll), DV.rows);

// S2372 — session 2's parts that need no words: three arcs set together, the kept armillary's needle, a crystal set at the forge
const J = await page.evaluate(() => { const sm = showMsg; showMsg = () => {}; const out = {}, X = 'cloch';
  const T = carvingTable().bySeed, gates = []; for (const s of Object.keys(T)) { if (T[s].school !== X) continue; const e = WORLD.doorAnywhere(+s); if (!e || e.lairDoor || e.kind === 'fort_door') continue; const p = makePortalDef(e); p.zone = 'world'; if (!gateCofferDue(p)) continue; const q = dungeonWorldPos[e.seed] || e; gates.push({ seed: +s, d: Math.hypot(q.x - px, q.z - pz) }); }
  gates.sort((a, b) => a.d - b.d);
  const keepRA = worldState.relicArcs; worldState.relicArcs = { found: { cloch: 2 } }; for (let n = 1; n <= 3; n++) bagAdd(arcItem(X, n));
  out.two = (() => { const b = BAG.filter(x => x.arc && x.arc.school === X); const one = b.pop(); BAG.splice(BAG.indexOf(one), 1); const r = joinArcs(X); bagAdd(one); return r; })();
  const i = BAG.findIndex(b => b.arc && b.arc.school === X); useItem(i); out.started = !!ARC_JOIN; tickArcJoin(5); out.half = !!ARC_JOIN && arcsHeld(X).length === 3; tickArcJoin(5.1);
  const A = BAG.find(b => b.armillary === X); out.joined = { arcs: arcsHeld(X).length, item: !!A, name: A && A.name, w: A && A.weight, price: A && A.buyPrice * A.sellMult, salvage: !!(A && A.salvage), flag: !!(worldState.relicArcs.joined && worldState.relicArcs.joined[X]) };
  _armCache = null; const g1 = armillaryGate(); out.needle = { seed: g1 && g1.seed, want: gates[0] && gates[0].seed, d: g1 && Math.round(g1.d), wantD: gates[0] && Math.round(gates[0].d), school: g1 && g1.school, onCompass: compassPlaces().some(p => p.armillary === X) };
  const K = worldState.gateKeeps || (worldState.gateKeeps = {}); const was = K[gates[0].seed]; K[gates[0].seed] = { coffer: [] }; _armCache = null; const g2 = armillaryGate(); out.next = { seed: g2 && g2.seed, want: gates[1] && gates[1].d < 2600 ? gates[1].seed : null };
  if (was) K[gates[0].seed] = was; else delete K[gates[0].seed]; BAG.splice(BAG.indexOf(A), 1); _armCache = null; out.none = armillaryGate() === null;
  // the forge: a bought Cloch maul and a tome, a crystal, Smithing 20 then 30
  const fh = forgeHere, sf = smithForge; forgeHere = () => true; smithForge = () => false; const S_ = skillsReady(), sl = S_.smithing;
  const maul = makeImplement(2, 'wand', X), orb = makeOrb(2, X); bagAdd(maul); bagAdd(orb); const M = BAG[BAG.length - 2]; out.listed = crystalPieces().includes(M) && !crystalPieces().some(b => b.implement === 'orb');
  out.noCrystal = forgeSetCrystal(M).why; bagAdd(gateCrystalItem(X)); S_.smithing = { ...(sl || {}), lv: 20 }; out.low = forgeSetCrystal(M).why; S_.smithing = { ...(sl || {}), lv: 30 };
  const t0 = worldState.gameTimeAbsMinutes || 0; const r = forgeSetCrystal(M); out.set = { done: r.done, found: M.found, kind: M.implement, mins: (worldState.gameTimeAbsMinutes || 0) - t0, left: bagCount(b => b.gateCrystal === X), desc: /20% less/.test(M.desc), again: forgeSetCrystal(M).why };
  const kw = EQ.weapon; EQ.weapon = M; out.cut = implementCut(X); EQ.weapon = kw;
  BAG.splice(BAG.indexOf(M), 1); BAG.splice(BAG.findIndex(b => b.implement === 'orb'), 1); forgeHere = fh; smithForge = sf; S_.smithing = sl; worldState.relicArcs = keepRA; showMsg = sm; return out; });
console.log('join', JSON.stringify(J));
check('two arcs will not join', J.two === false, J.two);
check(`three arcs, used from the bag, are set together in 10 s into ${J.joined.name}: weight 3, 150 at a counter, salvage`, J.started && J.half && J.joined.arcs === 0 && J.joined.item && J.joined.w === 3 && J.joined.price === 150 && J.joined.salvage && J.joined.flag, J);
check(`carried, it points the compass at the nearest lesser gate of its school with a shut coffer (${J.needle.d} m, ${J.needle.seed})`, J.needle.seed === J.needle.want && J.needle.school === 'cloch' && J.needle.d <= 2600 && J.needle.onCompass, J.needle);
check('that coffer opened, it points at the next; set down, at none', J.next.seed === J.next.want && J.none, { next: J.next, none: J.none });
check(`at the forge a crystal sets a bought maul of its school: refused without one ("${J.noCrystal}") and under Smithing 25 ("${J.low}")`, J.listed && /gate crystal/.test(J.noCrystal) && /Smithing 25/.test(J.low), J);
check(`set: found, its words ${Math.round(J.cut * 100)}% cheaper, ${J.set.mins} minutes, the crystal spent ("${J.set.again}" again)`, J.set.done && J.set.found && J.set.kind === 'maul' && J.cut === .2 && J.set.mins === 20 && J.set.left === 0 && J.set.desc && /found already/.test(J.set.again), J.set);

// one gate entered, as its door makes its portal
const seed = P.pick.seed;
await page.evaluate((s) => { if (worldState.sigilsRead) delete worldState.sigilsRead[s]; if (worldState.gateKeeps) delete worldState.gateKeeps[s]; window._prevDScene = typeof dScene !== 'undefined' ? dScene : null;
  const e = WORLD.doorAnywhere(s), p = makePortalDef(e); p.zone = 'world'; p.sigil = true; p.theme = p.theme || e.theme; goToDungeon(p); }, seed);
const inGate = () => page.waitForFunction((s) => activeZoneId === 'dungeon' && typeof dScene !== 'undefined' && dScene !== window._prevDScene && scene === dScene && currentPortal && currentPortal.seed === s && ENEMIES.length > 0, seed, { timeout: 180000, polling: 200 });
await inGate(); await g.hide();
// S2375 — the keep dressed on the new look (gkeep*, 56-dungeon-build.js; vaults.js's lesserKeep): the coffer with its hinged lid, the altar,
// the arc on it, the vein's five clusters, the eye's shaft and its light; a few draws, a few thousand triangles
const DR = await page.evaluate(() => { const c = CHESTS.find(x => x.coffer != null), L = GATE_KEEP_LIE || {}, S = dScene.getObjectByName('gateKeepShaft'); let tris = 0, draws = 0;
  const V = L.delver || {}; for (const o of [c && c.mesh, L.altar && L.altar.mesh, L.vein && L.vein.g, L.vein && L.vein.rock, S, V.body && V.body.mesh, V.camp && V.camp.mesh]) if (o) o.traverse(m => { if (m.isMesh) { draws++; tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; } });
  return { look: window.OG_LOOK, lid: !!(c && c.lid && c.lid.name === 'gateCofferLid'), altar: !!(L.altar && L.altar.mesh.getObjectByName('gateAltar')), arc: L.altar && L.altar.arc ? L.altar.arc.children.length : 0,
    clusters: L.vein && L.vein.g ? L.vein.g.children.filter(m => m.isMesh).length : 0, shaft: !!S, light: !!(S && S.userData.light), draws, tris: Math.round(tris),
    delver: !!V.body, bones: !!(V.body && V.body.mesh.getObjectByName('gateDelverBody')), camp: !V.camp || !!(V.camp.mesh.getObjectByName('gateCampDressed') && V.camp.rollMesh.name === 'campRoll' && V.camp.rollMesh.children.length) }; });
check(`the keep is dressed: a hinged coffer, the altar and its arc, ${DR.clusters} clusters of crystal, the eye's shaft${DR.delver ? ', the delver\'s bones and his camp' : ''}; ${DR.draws} draws, ${DR.tris} triangles`, DR.look === 'new' && DR.lid && DR.altar && DR.arc >= 2 && DR.clusters === 5 && DR.shaft && DR.light && (!DR.delver || DR.bones && DR.camp) && DR.draws <= 40 && DR.tris < 10000, DR);
const A = await page.evaluate((s) => { const C = CHESTS.filter(c => c.coffer != null), c = C[0], sp = _lastGen.spaces[_lastGen.ring], d = sp.dais, out = { n: C.length };
  if (!c) return out; out.id = c.id; out.off = +Math.hypot(c.x - dAt((d.x0 + d.x1) / 2), c.z - dAt((d.z0 + d.z1) / 2)).toFixed(2); out.floor = c.floor === (sp.floor || 1);
  out.y = +(c.mesh.position.y - (c.floor === 2 ? FLOOR2_Y : 0)).toFixed(2); out.items = c.items.map(i => i.name); out.want = gateCofferItems(currentPortal, c.floor).map(i => i.name);
  out.orbChests = CHESTS.filter(x => x.coffer == null && x.items.some(i => i.gateOrb != null)).length;
  const sm = showMsg; let said = ''; showMsg = (t) => { said = t; }; out.shut = gateCofferShut(c) && openCoffer(c) === false && !lootOpen; out.said = said;
  const sig = SIGILS.find(q => q.floor === c.floor) || SIGILS[0]; out.sig = !!sig; if (sig) touchSigil(sig); showMsg = sm;
  out.read = !gateCofferShut(c); out.opened = openCoffer(c) === true && lootOpen && currentLootContainer === c;
  out.took = c.items[c.items.length - 1].name; takeLootItem(c.items.length - 1); closeLoot();
  out.left = (worldState.gateKeeps[s].coffer || []).map(i => i.name); out.inBag = BAG.some(b => b.name === out.took);
  const rows = ssSplitPayload(JSON.parse(ssStringify(_buildSavePayload()))); out.worldRow = !!(rows.w.wS.gateKeeps && rows.w.wS.gateKeeps[s]) && !(rows.c.wS && rows.c.wS.gateKeeps);
  const d2 = JSON.parse(ssStringify(_buildSavePayload())); worldState.gateKeeps = {}; _applyLoadData(d2); out.loaded = ((worldState.gateKeeps[s] || {}).coffer || []).map(i => i.name);
  return out; }, seed);
console.log('gate', seed, JSON.stringify(A));
check(`the gate has one coffer, on the middle of its ring chamber's dais (${A.off} m off), on its top (${A.y} m up)`, A.n === 1 && A.off < .05 && A.floor && Math.abs(A.y - .4) < .02, A);
check('it holds what its stream rolls', JSON.stringify(A.items) === JSON.stringify(A.want), { items: A.items, want: A.want });
check(`no other chest holds the orb (${A.orbChests})`, A.orbChests === 0, A.orbChests);
check(`shut before the carving is read: "${A.said}"`, A.shut && /closed to you/.test(A.said), A);
check('the carving touched, it opens', A.sig && A.read && A.opened, A);
check(`one piece taken (${A.took}): the coffer keeps the rest, ${A.left.length}`, A.inBag && A.left.length === A.items.length - 1, A);
check("the coffer's list is the world row's, and a load gives it back", A.worldRow && JSON.stringify(A.loaded) === JSON.stringify(A.left), { worldRow: A.worldRow, loaded: A.loaded, left: A.left });
// S2380 — the critic's 18 Nov note: between the altar and the coffer, the crosshair on the coffer's lock, E opens the coffer and leaves the arc
const Y = await page.evaluate(() => { const L = GATE_KEEP_LIE || {}, A = L.altar, c = CHESTS.find(x => x.coffer != null); if (!A || !A.arc || !c) return { skip: true };
  const fy = c.floor === 2 ? FLOOR2_Y : 0, eye = fy + SCALE.EYE_STAND, ux = (A.x - c.x) / 2.6, uz = (A.z - c.z) / 2.6, was = thirdPerson; thirdPerson = false;
  const aim = (o, h) => { yaw = Math.atan2(-(o.x - px), -(o.z - pz)); pitch = Math.atan2(fy + h - eye, Math.hypot(o.x - px, o.z - pz)); CAM.position.set(px, eye, pz); CAM.rotation.set(pitch, yaw, 0, 'YXZ'); CAM.updateMatrixWorld(true); };
  px = c.x + ux * 1.3; pz = c.z + uz * 1.3; aim(c, .75); const out = { inReach: Math.hypot(px - A.x, pz - A.z) < TOUCH + .6, onLock: lookingAt(c), altar: !!gateAltarNear() };
  const sm = showMsg; showMsg = () => {}; const n0 = BAG.length; interact(); out.opened = lootOpen && currentLootContainer === c; out.arcKept = !!A.arc && BAG.length === n0; if (lootOpen) closeLoot();
  aim(A, .4 + .75); out.faced = lookingAt(A, TOUCH + .6) && !!gateAltarNear(); showMsg = sm; thirdPerson = was; return out; });
console.log('aim', JSON.stringify(Y));
check('between the altar and the coffer, the crosshair on its lock: E opens the coffer and leaves the arc; turned to the altar, the arc is offered', Y.skip || (Y.inReach && Y.onLock && !Y.altar && Y.opened && Y.arcKept && Y.faced), Y);
// S2371 — the altar's arc and the crystal vein, in the same keep
const K = await page.evaluate((s) => { const L = GATE_KEEP_LIE || {}, A = L.altar, v = L.vein, out = { altar: !!A, arcShown: !!(A && A.arc && A.arc.parent), vein: !!v, cond: _lastGen.cond };
  if (!A || !v) return out; const sp = _lastGen.spaces[_lastGen.ring], t = _lastGen.thresholds.find(t => t.a === _lastGen.ring || t.b === _lastGen.ring), tx = dAt(t.c), tz = dAt(t.r), c = CHESTS.find(x => x.coffer != null);
  out.altarFore = Math.hypot(A.x - tx, A.z - tz) < Math.hypot(c.x - tx, c.z - tz); out.veinFar = +Math.hypot(v.x - tx, v.z - tz).toFixed(1); out.coffFar = +Math.hypot(c.x - tx, c.z - tz).toFixed(1);
  out.inRoom = v.x > dAt(sp.x - .5) && v.x < dAt(sp.x + sp.w - .5) && v.z > dAt(sp.y - .5) && v.z < dAt(sp.y + sp.h - .5);
  out.cap = v.cap; out.want = gateVeinCap(_lastGen.cond); const sm = showMsg; showMsg = () => {};
  worldState.relicArcs = { found: {} }; px = A.x + .8; pz = A.z; out.near = !!gateAltarNear(); const n0 = BAG.length; interact(); const it = BAG[BAG.length - 1];
  out.took = BAG.length === n0 + 1 && it.arc ? { n: it.arc.n, school: it.arc.school, want: gateOrbSchool(currentPortal), desc: itemDesc(it), w: it.weight, price: it.buyPrice * it.sellMult, salvage: !!it.salvage } : null;
  out.arcGone = !A.arc && !(A.mesh.getObjectByName('gateArc')) && worldState.gateKeeps[s].arc === 1 && !gateAltarNear();
  worldState.relicArcs.found[out.took ? out.took.school : 'tine'] = 3; const sp4 = arcItem(out.took ? out.took.school : 'tine', 4); out.fourth = { arc: !!sp4.arc, spare: !!sp4.arcSpare, desc: itemDesc(sp4) };
  // the crystal: a pick, Mining 100 so every strike lands, struck until it is all cut out
  if (!BAG.some(b => b.tool === 'pick')) bagAdd({ ...PICK_ITEM }); const S_ = skillsReady(), ml = S_.mining; S_.mining = { ...(ml || {}), lv: 100 }; px = v.x; pz = v.z;
  const k0 = BAG.filter(b => b.gateCrystal).reduce((a, b) => a + (b.qty || 1), 0); let strikes = 0, last = null; for (let k = 0; k < 40; k++) { last = gateVeinStrike(v); strikes++; if (last.why || !last.left) break; }
  out.got = BAG.filter(b => b.gateCrystal).reduce((a, b) => a + (b.qty || 1), 0) - k0; out.strikes = strikes; out.after = gateVeinStrike(v).why; out.shown = v.g.children.filter(m => m.visible).length;
  const cr = BAG.find(b => b.gateCrystal); out.crystal = cr ? { s: cr.gateCrystal, w: cr.weight, price: cr.buyPrice * cr.sellMult, rows: BAG.filter(b => b.gateCrystal).length } : null;
  S_.mining = ml; showMsg = sm;
  const rows = ssSplitPayload(JSON.parse(ssStringify(_buildSavePayload()))); out.arcsChar = !!(rows.c.wS.relicArcs && rows.c.wS.relicArcs.found) && !(rows.w.wS && rows.w.wS.relicArcs);
  worldState.gameTimeAbsMinutes = (worldState.gameTimeAbsMinutes || 0) + 30 * 1440; return out; }, seed);
console.log('keep', JSON.stringify(K));
// S2492 — the sigil stone: laid beside the vein in a failing or catastrophic gate's keep, none in a steady one; a steel pick cuts it, once
const SG = await page.evaluate((s) => { const L = GATE_KEEP_LIE || {}, v = L.vein, cond = _lastGen.cond, out = { cond, laid: !!L.sigil, due: gateSigilDue(cond) };
  const st = L.sigil || (v && { id: s + ':' + v.floor + ':sigil', gate: s, school: v.school, cap: 1, key: 'sigil', x: v.x, z: v.z, floor: v.floor, g: null });
  if (!st) return out; if (L.sigil) { out.byVein = +Math.hypot(st.x - v.x, st.z - v.z).toFixed(2); out.mesh = !!(st.g && st.g.parent === dScene); }
  const sm = showMsg; showMsg = () => {}; const S_ = skillsReady(), ml = S_.mining; S_.mining = { ...(ml || {}), lv: 100 }; const bag0 = BAG.slice(); BAG.length = 0;
  if (worldState.gateKeeps[s]) delete worldState.gateKeeps[s].sigil;
  out.none = gateSigilStrike(st).why; bagAdd({ ...PICK_ITEM }); out.iron = gateSigilStrike(st).why;
  if (L.sigil) { px = st.x; pz = st.z; out.near = gateVeinNear() === st; out.word = gateVeinWord(st); }
  bagAdd(toolItem('pick', 4)); let r = null; for (let k = 0; k < 20; k++) { r = gateSigilStrike(st); if (r.why || !r.left) break; }
  const it = BAG.find(b => b.sigilStone); out.stone = it ? { school: it.sigilStone, want: v.school, salvage: !!it.salvage, w: it.weight, price: it.buyPrice, n: BAG.filter(b => b.sigilStone).length } : null;
  out.after = gateSigilStrike(st).why; out.rec = JSON.stringify((worldState.gateKeeps[s] || {}).sigil); if (L.sigil) { out.kit = !!st.kit; out.hidden = st.kit ? !!(st.g.children[0] && st.g.children[0].userData.kit && st.g.children[0].userData.kit.cut) : st.g.children.every(m => !m.visible); /* S2519 — the kit's stone stays, hewn out */ out.word2 = gateVeinWord(st); }
  const rows = ssSplitPayload(JSON.parse(ssStringify(_buildSavePayload()))); out.worldRow = !!(rows.w.wS.gateKeeps && rows.w.wS.gateKeeps[s] && rows.w.wS.gateKeeps[s].sigil);
  out.saved = (rows.c.BAG || []).some(b => b && b.sigilStone === v.school && b.salvage);
  BAG.length = 0; bag0.forEach(b => BAG.push(b)); S_.mining = ml; showMsg = sm; return out; }, seed);
console.log('sigil', JSON.stringify(SG));
check(`S2492: a ${SG.cond} gate's keep ${SG.laid ? 'has' : 'has no'} sigil stone beside its vein${SG.laid ? ` (${SG.byVein} m off)` : ''}: failing and catastrophic only`, SG.laid === SG.due && (!SG.laid || (SG.byVein > 1 && SG.byVein < 1.8 && SG.mesh && SG.near && /sigil stone/.test(SG.word))), SG);
check('S2492: no pick, then an iron pick, are refused at the stone; a steel pick cuts one stone of the gate\'s school, salvage, weight 2, 150; then it is cut out, and never returns',
  /need a pick/.test(SG.none) && /steel pick/.test(SG.iron) && SG.stone && SG.stone.school === SG.stone.want && SG.stone.salvage && SG.stone.w === 2 && SG.stone.price === 150 && SG.stone.n === 1 && /cut out/.test(SG.after || '') && (!SG.laid || (SG.hidden && /cut out/.test(SG.word2))), SG);
check('S2492: the stone cut is the world row\'s record, and the stone in the bag keeps its school and its mark through a save', SG.worldRow && SG.saved, SG);
check(`the keep has its altar before the coffer and its vein in the corner farthest from the way in (${K.veinFar} m against the coffer's ${K.coffFar})`, K.altar && K.vein && K.altarFore && K.inRoom && K.veinFar > K.coffFar, K);
check(`its arc taken: the first of ${K.took && K.took.school}'s armillary, the gate's school, "${K.took && K.took.desc}", weight 1, 40, salvage`, K.arcShown && K.near && K.took && K.took.n === 1 && K.took.school === K.took.want && /^1 of 3 of /.test(K.took.desc) && K.took.w === 1 && K.took.price === 40 && K.took.salvage, K.took);
check('taken once: gone from the altar, and the world remembers it', K.arcGone, K);
check(`a fourth arc of a school is plain salvage (${K.fourth.desc})`, !K.fourth.arc && K.fourth.spare, K.fourth);
check(`a ${K.cond} gate's vein gives ${K.got} crystals (${K.want} wanted) and then none`, K.cap === K.want && K.got === K.want && /cut out/.test(K.after || '') && K.shown === 0, K);
check('a crystal is of the gate\'s school, weight 0.5, 25, one stack', K.crystal && K.crystal.s === (K.took && K.took.want) && K.crystal.w === .5 && K.crystal.price === 25 && K.crystal.rows === 1, K.crystal);
check('the arcs found are the character row\'s', K.arcsChar, K.arcsChar);
// S2376 — the delver in this keep, if it has one: against the dais, his camp near the door, each looted once
const D = await page.evaluate((s) => { const L = GATE_KEEP_LIE || {}, D = L.delver, out = { due: gateDelverDue(currentPortal), laid: !!D };
  if (!D) return out; const b = D.body, c = D.camp, sp = _lastGen.spaces[_lastGen.ring], d = sp.dais, t = _lastGen.thresholds.find(t => t.a === _lastGen.ring || t.b === _lastGen.ring), tx = dAt(t.c), tz = dAt(t.r);
  const X0 = dAt(d.x0) - DCELL / 2, X1 = dAt(d.x1) + DCELL / 2, Z0 = dAt(d.z0) - DCELL / 2, Z1 = dAt(d.z1) + DCELL / 2;
  out.daisGap = +Math.hypot(Math.max(X0 - b.x, 0, b.x - X1), Math.max(Z0 - b.z, 0, b.z - Z1)).toFixed(2);
  out.camp = !!c; if (c) { out.campDoor = +Math.hypot(c.x - tx, c.z - tz).toFixed(1); out.bodyDoor = +Math.hypot(b.x - tx, b.z - tz).toFixed(1); }
  const want = gateDelverItems(currentPortal, b.floor); out.same = JSON.stringify(b.items.map(i => i.name)) === JSON.stringify(want.body.map(i => i.name));
  const sm = showMsg; showMsg = () => {}; const g0 = gold; out.opened = lootDelver(b) && lootOpen && currentLootContainer === b; while (b.items.length) takeLootItem(0); closeLoot();
  out.gold = gold - g0; out.journal = BAG.some(i => i.bookId === 'delver_journal'); out.sword = BAG.some(i => i.slot === 'weapon' && i.weaponType === 'Sword' && i.salvage);
  if (c) { lootDelver(c); takeLootItem(0); closeLoot(); out.roll = BAG.some(i => i.roll === 'blanket'); out.rollHidden = !c.rollMesh.visible; }
  showMsg = sm; out.kept = JSON.stringify(worldState.gateKeeps[s].delver); return out; }, seed);
console.log('delver', JSON.stringify(D));
if (D.laid) {
  check(`a dead delver lies against the dais (${D.daisGap} m off its side)`, D.daisGap < 1, D);
  check(`his camp is nearer the way in than he is (${D.campDoor} m against ${D.bodyDoor})`, D.camp && D.campDoor < D.bodyDoor, D);
  check(`looted: his things as rolled, ${D.gold} gold, his journal and his sword (salvage), the camp's bedroll`, D.same && D.opened && D.gold >= 8 && D.gold <= 20 && D.journal && D.sword && D.roll && D.rollHidden, D);
} else check('this keep has no delver, as its seed says', !D.due, D);
// S2469 — the cache (what-a-gate-keeps' session 7, Michael's B on #1783): every keep has one, sealed by its gate's school; one in three holds an arc
const CG = await page.evaluate(() => { const T = carvingTable().bySeed, out = { n: 0, placed: 0, arcs: 0, own: 0, miss: [] };
  for (const s of Object.keys(T)) { const e = WORLD.doorAnywhere(+s); if (!e || e.lairDoor || e.kind === 'fort_door') continue; const p = makePortalDef(e); p.zone = 'world'; p.sigil = true; p.theme = p.theme || e.theme; if (!gateCofferDue(p)) continue;
    out.n++; const a = gateCacheArc(p); if (a) { out.arcs++; if (a === gateCacheSchool(p)) out.own++; }
    if (out.n <= 40) { const W = WORLD_DUNGEONS.find(x => x.seed === p.seed) || {}, G = makeGate(p.size, p.seed, W.floors, W.cond); if (gateCachePlace(G, p.seed)) out.placed++; else out.miss.push(p.seed); } }
  return out; });
console.log('caches', JSON.stringify(CG));
check(`every keep has its cache in a side wall of the ring chamber (${CG.placed} of ${Math.min(40, CG.n)} laid out)`, CG.placed === Math.min(40, CG.n) && CG.placed > 0, CG.miss);
check(`one cache in three holds an arc, never of the gate's own school (${CG.arcs} of ${CG.n})`, CG.arcs / CG.n > .22 && CG.arcs / CG.n < .45 && CG.own === 0, CG);
const KC = await page.evaluate((s) => { const L = GATE_KEEP_LIE || {}, rec = L.cache, out = { laid: !!rec };
  if (!rec) return out; const sp = _lastGen.spaces[_lastGen.ring], P = rec.place, M = P.floor === 2 ? _lastGen.map2 : _lastGen.map; out.school = rec.school; out.want = gateCacheSchool(currentPortal);
  out.wall = M[P.r][P.c] === 1 && !(M[P.r + P.oz] && M[P.r + P.oz][P.c + P.ox] > 0) && !!(GATE_SECRETS.indexOf(rec) >= 0); out.shut = !rec.opened && rec.shut.visible && !rec.inside.rub.visible;
  const sm = showMsg; const said = []; showMsg = (t) => said.push(t); px = rec.kx - rec.place.ox * .5; pz = rec.kz - rec.place.oz * .5; out.near0 = !!gateCacheNear();
  const wrong = rec.school === 'cloch' ? 'solas_gheal' : 'cloch_ghear'; secretLaid(wrong, null, rec.kx, rec.kz); out.wrong = said.slice(-1)[0] || ''; out.stillShut = !rec.opened;
  // its school's key, as the seals' table gives it
  const S = rec.school, t0 = playClockS;
  if (S === 'tine') { for (const b of rec.braziers) { lightBrazier(b); gateSecretsTick(); playClockS += 5; } out.braziers = rec.braziers.length; out.gap = +Math.hypot(rec.braziers[0].x - rec.braziers[1].x, rec.braziers[0].z - rec.braziers[1].z).toFixed(1); }
  else if (S === 'uisce') { touchThing('sioc', rec.thing); }
  else if (S === 'cloch') { secretLaid('cloch_ghear', null, rec.kx - rec.place.ox * .8, rec.kz - rec.place.oz * .8); }
  else if (S === 'scath') { gateSecretsTick(); out.before = !rec.opened; _oicheUntil = performance.now() + 60000; px = dAt(rec.c); pz = dAt(rec.r); gateSecretsTick(); _oicheUntil = 0; }
  else if (S === 'solas') { const ll = laidLive; laidLive = () => ({ light: 8, x: rec.kx - rec.place.ox, z: rec.kz - rec.place.oz }); gateSecretsTick(); playClockS += 1.5; gateSecretsTick(); out.half = !rec.opened; playClockS += 1.6; gateSecretsTick(); laidLive = ll; }
  else if (S === 'gaoth') { const G = rec.gallery; px = (G.x0 + G.x1) / 2; pz = (G.z0 + G.z1) / 2; const jy = jumpY; jumpY = G.y; gateSecretsTick(); out.galleryUp = +(G.y - rec.y).toFixed(2); }
  out.opened = rec.opened && !rec.shut.visible && rec.inside.rub.visible && (!rec.arc || rec.inside.arc.visible) && gateSecretOpen(s, 'k'); out.say = said.slice(-1)[0] || '';
  if (S === 'gaoth') jumpY = rec.gallery.y; else { px = rec.kx - rec.place.ox * .5; pz = rec.kz - rec.place.oz * .5; }
  const yw = yaw; yaw = Math.atan2(-(rec.x - px), -(rec.z - pz)); out.near = !!gateCacheNear(); const n0 = BAG.length; worldState.relicArcs = { found: {} }; interact(); yaw = yw;
  const rub = BAG.find((b, i) => i >= n0 && b.type === 'rubbing'), arc = BAG.find((b, i) => i >= n0 && b.arc);
  out.rub = rub ? { seed: rub.seed, gate: rub.gate, self: rub.seed == s, read: !!(worldState.sigilsRead || {})[rub.seed] } : null; out.arc = rec.arc; out.arcGot = arc ? { school: arc.arc.school, n: arc.arc.n } : null;
  out.empty = !gateCacheNear() && !rec.inside.rub.visible && (!rec.inside.arc || !rec.inside.arc.visible); out.kept = JSON.stringify(worldState.gateKeeps[s].cache);
  out.again = (openCache(s) || [1]).length === 0; out.br = (rec.braziers || []).map(b => [b.lit, b.litAt, GATE_THINGS.indexOf(b) >= 0]); jumpY = 0; showMsg = sm; return out; }, seed);
console.log('cache', JSON.stringify(KC));
check(`the keep's cache is laid, sealed by its gate's school (${KC.school}), in a side wall`, KC.laid && KC.school === KC.want && KC.wall && KC.shut && !KC.near0, KC);
check(`a wrong word at it: "${KC.wrong}"`, /does not answer/.test(KC.wrong) && KC.stillShut, KC);
check(`its school's key opens it ("${KC.say}")`, KC.opened, KC);
check(`E takes a rubbing of the nearest unread carving (${KC.rub && KC.rub.gate})${KC.arc ? ' and an arc of ' + KC.arc : ''}; then it is empty`, KC.near && KC.rub && !KC.rub.self && !KC.rub.read && (KC.arc ? KC.arcGot && KC.arcGot.school === KC.arc && KC.arcGot.n === 1 : !KC.arcGot) && KC.empty && KC.again, KC);
// the gate built again, 30 days on: the coffer open, as you left it; the arc and the crystal do not come back
await page.evaluate((s) => { window._prevDScene = dScene; const e = WORLD.doorAnywhere(s), p = makePortalDef(e); p.zone = 'world'; p.sigil = true; p.theme = p.theme || e.theme; goToDungeon(p); }, seed);
await inGate();
const B = await page.evaluate(() => { const c = CHESTS.find(x => x.coffer != null), L = GATE_KEEP_LIE || {}, D = L.delver; return c ? { opened: c.opened, items: c.items.map(i => i.name), lid: c.lid ? +c.lid.rotation.x.toFixed(2) : null, cache: L.cache ? { opened: L.cache.opened, face: L.cache.shut.visible, rub: L.cache.inside.rub.visible } : null, arc: !!(L.altar && L.altar.arc), left: L.vein ? gateVeinLeft(L.vein) : null, delver: D ? { body: D.body.items.length, camp: D.camp ? D.camp.items.length : 0, roll: D.camp ? D.camp.rollMesh.visible : false } : null } : null; });
console.log('again', JSON.stringify(B));
check('entered again, the coffer stands open with what you left in it', B && B.opened && JSON.stringify(B.items) === JSON.stringify(A.left) && B.lid < 0, B);
check(`and 30 days on the altar is bare and the vein cut out (${B && B.left} left)`, B && !B.arc && B.left === 0, B);
check('entered again, the cache stands open and empty', B && B.cache && B.cache.opened && !B.cache.face && !B.cache.rub, B && B.cache);
if (D.laid) check('entered again, the delver and his camp are bare', B && B.delver && B.delver.body === 0 && B.delver.camp === 0 && !B.delver.roll, B && B.delver);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
