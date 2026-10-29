// Survival B, session 4: felling (Session 1511; `docs/design/survival-build.md`). A tree is <cx,cz>:<i> by its cell of the
// chunk's scatter lattice. With a hatchet, a strike every 0.9 s (a war axe 1.8) fells it at the 6th strike, one fewer for each
// 20 Woodcutting; 2 to 4 logs (+1 at 100), on a stream seeded by the tree and the day it last fell. The tree goes from its mesh
// and its solids, a stump stands for 10 game-days, then the tree is back. `worldState.felled` is the world's.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const out = {};
  BAG.length = 0; worldState.felled = {}; CHOP = null;
  const tick = s => { for (let i = 0; i < Math.round(s * 60); i++) tickFelling(1 / 60); };
  // a standing tree in a loaded chunk near you, on the new look's leaf cards where it can
  const all = [];
  for (const ch of chunks.values()) for (const t of ch.trees || []) if (fellable(t)) all.push({ ch, t });
  out.trees = all.length;
  out.ids = all.every(({ t }) => /^-?\d+,-?\d+:\d+$/.test(t.id));
  out.unique = new Set(all.map(({ t }) => t.id)).size === all.length;
  const meshOf = (ch, id) => ch.group.children.find(o => o.isInstancedMesh && o.userData.tids && o.userData.tids.indexOf(id) >= 0 && o.userData.tids.indexOf(id) < o.count) || null;
  all.sort((a, b) => Math.hypot(a.t.x - px, a.t.z - pz) - Math.hypot(b.t.x - px, b.t.z - pz));
  const pick = all.find(({ ch, t }) => meshOf(ch, t.id) && meshOf(ch, t.id).userData.landTree) || all[0];
  if (!pick) return out;
  let { ch, t } = pick; const id = t.id, key = chunkKey(ch.cx, ch.cz);
  out.id = id; out.sp = t.sp; out.landTree = !!meshOf(ch, id).userData.landTree;
  const stand = () => { px = t.x + t.r + .6; pz = t.z; };
  stand(); out.near = treeNear() && treeNear().t.id === id;
  out.solid0 = ch.sol.filter(s => s.tid === id).length;
  const im = meshOf(ch, id), n0 = im.count;
  // ── no hatchet ──
  out.noTool = strikeTree(ch, t, 0).why;
  // ── a hatchet at Woodcutting 5: six strikes, 0.9 s apart ──
  bagAdd({ ...HATCHET_ITEM }); SKILLS.woodcutting = { lv: 5, p: 0 };
  const day0 = Math.floor(gameMinNow() / 1440);
  chopTree(ch, t); tick(.9 * 5 + .2); out.after5 = { n: CHOP && CHOP.n, standing: !t.out };
  tick(.9); out.fell = { chop: CHOP, down: !!t.out, logs: bagCount(b => !!b.log), kind: (BAG.find(b => b.log) || {}).name,
    count: im.count, n0, inMesh: im.userData.tids.indexOf(id), solids: ch.sol.filter(s => s.tid === id).length,
    stump: !!(t.out && t.out.stump && t.out.stump.parent === ch.group), rec: worldState.felled[id], day0, learned: SKILLS.woodcutting.p > 0 || SKILLS.woodcutting.lv > 5 };
  out.nearAfter = treeNear() ? treeNear().t.id : null;
  out.again = strikeTree(ch, t, 0).why;
  // ── fewer strikes by skill; the war axe at half pace ──
  SKILLS.woodcutting = { lv: 40, p: 0 }; out.need40 = fellStrikes(); SKILLS.woodcutting = { lv: 100, p: 0 }; out.need100 = fellStrikes();
  // logs over many ids: 2 to 4, +1 at 100
  const spread = lv => { SKILLS.woodcutting = { lv, p: 0 }; const c = {}; for (let i = 0; i < 300; i++) { const k = treeLogs({ id: 'lg:' + i }); c[k] = (c[k] || 0) + 1; } return c; };
  out.logs5 = spread(5); out.logs100 = spread(100);
  // ── a chunk built again: the stump and no tree; the other trees keep their ids ──
  const others = ch.trees.filter(u => u.id !== id).map(u => u.id).sort().join();
  dropChunk(key); buildChunk(ch.cx, ch.cz); ch = chunks.get(key); t = ch.trees.find(u => u.id === id);
  out.rebuilt = { found: !!t, down: !!(t && t.out), stump: !!(t && t.out && t.out.stump && t.out.stump.parent === ch.group), inMesh: !!meshOf(ch, id),
    solids: ch.sol.filter(s => s.tid === id).length, others: ch.trees.filter(u => u.id !== id).map(u => u.id).sort().join() === others };
  // ── back in 10 days, while the chunk is loaded ──
  worldState.gameTimeAbsMinutes = (day0 + 9) * 1440 + 600; tick(.1); out.day9 = !!t.out;
  worldState.gameTimeAbsMinutes = (day0 + 10) * 1440 + 10; tick(.1);
  out.day10 = { down: !!t.out, inMesh: !!meshOf(ch, id), solids: ch.sol.filter(s => s.tid === id).length, stumps: ch.group.children.filter(o => o.name === 'stump').length };
  // and a chunk built after the 10 days: the tree, no stump
  dropChunk(key); buildChunk(ch.cx, ch.cz); ch = chunks.get(key); t = ch.trees.find(u => u.id === id);
  out.rebuilt10 = { down: !!t.out, inMesh: !!meshOf(ch, id), stumps: ch.group.children.filter(o => o.name === 'stump').length };
  // ── the save: the stump after a reload, and the same logs at the same strike ──
  SKILLS.woodcutting = { lv: 5, p: 0 }; BAG.length = 0; bagAdd({ ...HATCHET_ITEM });
  const d = JSON.parse(ssStringify(_buildSavePayload()));
  stand(); chopTree(ch, t); tick(.9 * 6 + .2); const a = bagCount(b => !!b.log);
  const d2 = JSON.parse(ssStringify(_buildSavePayload())); out.saved = (d2.wS.felled || {})[id];
  out.charRow = (typeof SS_CHAR_WS !== 'undefined') && !!SS_CHAR_WS.felled;
  _applyLoadData(d2); dropChunk(key); buildChunk(ch.cx, ch.cz); ch = chunks.get(key); t = ch.trees.find(u => u.id === id);
  out.reloadStump = { down: !!t.out, stump: !!(t.out && t.out.stump), inMesh: !!meshOf(ch, id) };
  _applyLoadData(d); dropChunk(key); buildChunk(ch.cx, ch.cz); ch = chunks.get(key); t = ch.trees.find(u => u.id === id);
  BAG.length = 0; bagAdd({ ...HATCHET_ITEM }); SKILLS.woodcutting = { lv: 5, p: 0 }; CHOP = null;
  stand(); chopTree(ch, t); tick(.9 * 6 + .2); const b = bagCount(b => !!b.log);
  out.reloadLogs = { a, b, down: !!t.out };
  // ── a dropped frame: one 2 s step strikes once, never skips the count ──
  { const u = all.find(x => x.t.id !== id && chunks.get(chunkKey(x.ch.cx, x.ch.cz)) === x.ch && !x.t.out); if (u) { px = u.t.x + u.t.r + .6; pz = u.t.z;
    SKILLS.woodcutting = { lv: 5, p: 0 }; chopTree(u.ch, u.t); tickFelling(2); out.dropped = CHOP && CHOP.n; CHOP = null; } }
  // the war axe, no hatchet: twice the time
  { BAG.length = 0; const was = EQ.weapon; EQ.weapon = { name: 'Great Axe', weaponShape: 'greataxe', type: 'weapon', atk: [5, 6] };
    out.axeTool = chopTool(); const u = all.find(x => x.t.id !== id && chunks.get(chunkKey(x.ch.cx, x.ch.cz)) === x.ch && !x.t.out);
    if (u) { px = u.t.x + u.t.r + .6; pz = u.t.z; chopTree(u.ch, u.t); out.axeStep = CHOP && CHOP.step; CHOP = null; } EQ.weapon = was; }
  // ── S1534: Felling (Woodcutting 25): the trunk falls where you face, a walkable deck for 600 world minutes; none at 24 ──
  { const free = () => all.find(x => chunks.get(chunkKey(x.ch.cx, x.ch.cz)) === x.ch && !x.t.out && !treeDown(x.t.id));
    const fell = (lv, yw) => { const u = free(); if (!u) return null; px = u.t.x + u.t.r + .6; pz = u.t.z; yaw = yw; BAG.length = 0; bagAdd({ ...HATCHET_ITEM });
      SKILLS.woodcutting = { lv, p: 0 }; const n0 = TRUNKS.length, P0 = ZONES.world.platforms.length; for (let i = 0; i < 9 && !u.t.out; i++) strikeTree(u.ch, u.t, 9);
      return { down: !!u.t.out, trunks: TRUNKS.length - n0, plats: ZONES.world.platforms.length - P0, T: TRUNKS[TRUNKS.length - 1], t: u.t }; };
    const a = fell(24, 0); out.trunk24 = a && { down: a.down, trunks: a.trunks, plats: a.plats };
    const b = fell(25, Math.PI / 2), T = b && b.T;
    if (T) { const mid = (k, off) => [T.x0 + T.dx * T.L * k - T.dz * off, T.z0 + T.dz * T.L * k + T.dx * off];
      const [mx, mz] = mid(.5, 0), [ox, oz] = mid(.5, T.hw + .6), [bx, bz] = mid(-.3, 0);
      out.trunk = { down: b.down, trunks: b.trunks, plats: b.plats, dir: [+T.dx.toFixed(3), +T.dz.toFixed(3)], L: +T.L.toFixed(2), R: +T.R.toFixed(2), mesh: !!(T.mesh && T.mesh.parent === b.t.out.stump.parent),
        kit: !!(T.mesh && T.mesh.name === 'felled trunk'), kitTop: T.mesh ? +(new THREE.Box3().setFromObject(T.mesh).max.y - T.y).toFixed(3) : null, kitLen: T.mesh ? (() => { const b = new THREE.Box3().setFromObject(T.mesh); return +Math.hypot(b.max.x - b.min.x, b.max.z - b.min.z).toFixed(2); })() : null,
        kitTris: T.mesh ? (() => { let n = 0; T.mesh.traverse(o => { if (o.isMesh) n += o.geometry.attributes.position.count / 3; }); return n; })() : 0,
        onTop: +(activeTerrainH(mx, mz) - T.y).toFixed(3), clear: worldH(mx, mz) < T.y, beside: +(activeTerrainH(ox, oz) - worldH(ox, oz)).toFixed(3), behind: +(activeTerrainH(bx, bz) - worldH(bx, bz)).toFixed(3) };
      worldState.gameTimeAbsMinutes += 599; tickTrunks(); out.trunk.at599 = TRUNKS.includes(T) && ZONES.world.platforms.includes(T.plat);
      worldState.gameTimeAbsMinutes += 1; tickTrunks(); out.trunk.at600 = { held: TRUNKS.includes(T), plat: ZONES.world.platforms.includes(T.plat), mesh: !!(T.mesh && T.mesh.parent), ground: +(activeTerrainH(mx, mz) - worldH(mx, mz)).toFixed(3) };
      worldState.gameTimeAbsMinutes -= 600; }
    yaw = 0; }
  // ── S1559: Heartwood (Woodcutting 75, #860 A): one oak or pine in ten is a great tree; at 75 its fall gives a heartwood log ──
  { const share = sp => { let n = 0; for (let i = 0; i < 2000; i++) if (greatTree({ sp, id: 'gt:' + i })) n++; return n / 2000; };
    out.great = { oak: share('oak'), pine: share('pine'), birch: share('birch'), live: PERK_LIVE.has('woodcutting:75') };
    const g0 = greatTree; greatTree = () => true;
    const fellGreat = lv => { const u = all.find(x => chunks.get(chunkKey(x.ch.cx, x.ch.cz)) === x.ch && !x.t.out && !treeDown(x.t.id)); if (!u) return null;
      px = u.t.x + u.t.r + .6; pz = u.t.z; BAG.length = 0; bagAdd({ ...HATCHET_ITEM }); SKILLS.woodcutting = { lv, p: 0 };
      const said = []; const sm = showMsg; showMsg = m => said.push(m); chopTree(u.ch, u.t); tick(.9 * 6 + .2); showMsg = sm;
      return { down: !!u.t.out, heart: bagCount(b => b.heartwood === 'log'), logs: bagCount(b => !!b.log), said }; };
    out.great74 = fellGreat(74); out.great75 = fellGreat(75); greatTree = g0;
    bagAdd({ ...JOINER_ITEM }); openBenchPage(); out.heartRow = [...document.querySelectorAll('#bn-list [data-k]')].some(d => d.dataset.k === 'heartspar'); closeBenchPage();
    out.heartSpar = benchMake('heartspar'); out.heartLeft = { log: bagCount(b => b.heartwood === 'log'), spar: bagCount(b => b.heartwood === 'spar'), plainSpar: bagCount(b => b.spar) };
    const d = JSON.parse(ssStringify(_buildSavePayload())); out.heartSaved = JSON.stringify(d).includes('"heartwood":"spar"'); }
  // ── the shops ──
  out.at = { weapon: hatchetFor({ type: 'weapon' }).length, misc: hatchetFor({ type: 'misc' }).length, potion: hatchetFor({ type: 'potion' }).length };
  out.price = HATCHET_ITEM.buyPrice; out.w = HATCHET_ITEM.weight; out.logW = SURV_ITEMS.log.weight;
  return out;
});
console.log(JSON.stringify(r));
check('Felling (25): the trunk falls where you face, the length of its tree; none at 24', r.trunk24 && r.trunk24.down && r.trunk24.trunks === 0 && r.trunk24.plats === 0 && r.trunk && r.trunk.down && r.trunk.trunks === 1 && r.trunk.plats === 1 && r.trunk.mesh && Math.abs(r.trunk.dir[0] + 1) < 1e-3 && Math.abs(r.trunk.dir[1]) < 1e-3 && r.trunk.L >= 4 && r.trunk.L <= 18, [r.trunk24, r.trunk]);
check('on the new look the log is the kit\'s felled trunk, its top within a fifth of its radius of the deck, under 3,000 triangles (S1540)', r.trunk && r.trunk.kit && Math.abs(r.trunk.kitTop) <= r.trunk.R * .2 + .02 && r.trunk.kitTris < 3000 && r.trunk.kitLen >= r.trunk.L, r.trunk && [r.trunk.kit, r.trunk.kitTop, r.trunk.R, r.trunk.kitTris, r.trunk.kitLen, r.trunk.L]);
check('you walk on its top along its length, and on the ground beside it and behind the stump', r.trunk && r.trunk.clear && r.trunk.onTop === 0 && r.trunk.beside === 0 && r.trunk.behind === 0, r.trunk);
check('it lies 10 minutes (600 on the world clock), then the deck and the log are gone', r.trunk && r.trunk.at599 && !r.trunk.at600.held && !r.trunk.at600.plat && !r.trunk.at600.mesh && r.trunk.at600.ground === 0, r.trunk && [r.trunk.at599, r.trunk.at600]);
check('trees about the home province, each keyed <cx,cz>:<i>, none twice', r.trees > 20 && r.ids && r.unique, r.trees);
check('the tree is found at hand, on the new look\'s leaf cards', r.near && r.landTree, [r.id, r.sp]);
check('no hatchet, no strike', r.noTool === 'You need a hatchet.', r.noTool);
check('at Woodcutting 5 it stands after 5 strikes', r.after5.n === 5 && r.after5.standing, r.after5);
check('and falls at the 6th', r.fell.down && !r.fell.chop, r.fell);
check('2 to 4 logs into the bag', r.fell.logs >= 2 && r.fell.logs <= 4, r.fell.logs);
check('the tree leaves its mesh and its solids', r.fell.count === r.fell.n0 - 1 && r.fell.inMesh < 0 && r.fell.solids === 0 && r.solid0 >= 1, r.fell);
check('a stump stands in its place', r.fell.stump);
check('worldState.felled holds the day', r.fell.rec === r.fell.day0, [r.fell.rec, r.fell.day0]);
check('a strike teaches Woodcutting', r.fell.learned);
check('a felled tree is not offered again', r.nearAfter !== r.id && /down/.test(r.again || ''), [r.nearAfter, r.again]);
check('one strike fewer a 20 Woodcutting: 4 at 40, 1 at 100', r.need40 === 4 && r.need100 === 1, [r.need40, r.need100]);
check('logs 2 to 4, about a third each; 3 to 5 at 100', Object.keys(r.logs5).sort().join() === '2,3,4' && Object.values(r.logs5).every(n => n > 70) && Object.keys(r.logs100).sort().join() === '3,4,5', [r.logs5, r.logs100]);
check('a chunk built again shows the stump and no tree', r.rebuilt.found && r.rebuilt.down && r.rebuilt.stump && !r.rebuilt.inMesh && r.rebuilt.solids === 0, r.rebuilt);
check('the chunk\'s other trees keep their ids', r.rebuilt.others);
check('down at day 9, back at day 10 (mesh, solid, no stump)', r.day9 && !r.day10.down && r.day10.inMesh && r.day10.solids >= 1 && r.day10.stumps === 0, [r.day9, r.day10]);
check('a chunk built after the 10 days has the tree', !r.rebuilt10.down && r.rebuilt10.inMesh && r.rebuilt10.stumps === 0, r.rebuilt10);
check('the save keeps the felling (the world\'s row)', r.saved != null && !r.charRow, [r.saved, r.charRow]);
check('the stump stays after a reload', r.reloadStump.down && r.reloadStump.stump && !r.reloadStump.inMesh, r.reloadStump);
check('a reload fells it for the same logs at the same strike', r.reloadLogs.down && r.reloadLogs.a === r.reloadLogs.b && r.reloadLogs.a >= 2, r.reloadLogs);
check('a dropped frame strikes once', r.dropped === 1, r.dropped);
check('a war axe in hand works at half pace', r.axeTool === 'axe' && Math.abs(r.axeStep - 1.8) < 1e-9, [r.axeTool, r.axeStep]);
check('Heartwood (75) is live; a great tree is one oak or pine in ten, never a birch', r.great.live && r.great.oak > .07 && r.great.oak < .13 && r.great.pine > .07 && r.great.pine < .13 && r.great.birch === 0, r.great);
check('a great tree felled at Woodcutting 74 gives its logs only; at 75 a Heartwood Log too, said at the start and the fall', r.great74 && r.great74.down && r.great74.heart === 0 && r.great75 && r.great75.down && r.great75.heart === 1 && r.great75.logs >= 2 && r.great75.said.some(m => /heartwood in it/.test(m)) && r.great75.said.some(m => /and a Heartwood Log/.test(m)), [r.great74, r.great75]);
check('the bench shows the Heartwood Spar row and makes one from the log; it is no plain spar, and the save keeps it', r.heartRow && r.heartSpar.made && r.heartLeft.log === 0 && r.heartLeft.spar === 1 && r.heartLeft.plainSpar === 0 && r.heartSaved, [r.heartSpar.why, r.heartLeft, r.heartSaved]);
check('the hatchet at the smith and the goods shop, 30 gold, weight 3; a log weighs 3', r.at.weapon === 1 && r.at.misc === 1 && r.at.potion === 0 && r.price === 30 && r.w === 3 && r.logW === 3, r.at);
await g.close();
