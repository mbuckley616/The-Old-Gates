// The things a touched word acts on, in a gate (Session 1675; magic-build.md's Touched column, Caor "lights a brazier, burns a web";
// magic.md, "a web across a door"). gateThings lays them from the gate's seed: a pair of braziers flanking each threshold on both sides
// and four at the ring's dais, burning or cold; a web across the one bare mouth of a side room, one room in three. A hundred gates
// through the generator alone, then two built: the braziers stand clear of the way and are solid, a web is a wall until burnWeb, and
// lightBrazier lights a cold one. The same gate entered again is laid the same.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const gen = await page.evaluate(() => {
  const out = { gates: 0, br: 0, lit: 0, webs: 0, same: true, badCell: [], badWeb: [], dupIds: 0, nearThr: 0 };
  for (const size of ['tiny', 'small', 'medium', 'large', 'massive']) for (let k = 0; k < 20; k++) {
    const seed = 101 + k * 977, G = makeGate(size, seed), a = JSON.stringify(gateThings(G, seed)), b = JSON.stringify(gateThings(makeGate(size, seed), seed));
    if (a !== b) out.same = false; out.gates++;
    const ids = new Set(G.things.map(t => t.id)); if (ids.size !== G.things.length) out.dupIds++;
    for (const t of G.things) { const M = t.floor === 2 ? G.map2 : G.map, CS = t.floor === 2 ? G.cellSpace2 : G.cellSpace;
      if (t.kind === 'brazier') { out.br++; if (t.lit) out.lit++; const sp = G.spaces[CS[t.r][t.c]];
        if (M[t.r][t.c] !== 1 || !sp || ['stair', 'flooded', 'chasm'].includes(sp.type)) out.badCell.push([size, seed, t.id]);
        if ((G.thresholds || []).some(q => (q.floor || 1) === t.floor && q.c === t.c && q.r === t.r)) out.nearThr++; }
      else { out.webs++; const R = t.room; let mouths = 0;
        for (let y = R.y - 1; y <= R.y + R.h; y++) for (let x = R.x - 1; x <= R.x + R.w; x++) { if (x >= R.x && x < R.x + R.w && y >= R.y && y < R.y + R.h) continue;
          if (!((x >= R.x && x < R.x + R.w) || (y >= R.y && y < R.y + R.h))) continue; if (M[y] && M[y][x] > 0) mouths++; }
        const into = [t.c + t.dc, t.r + t.dr], inRoom = into[0] >= R.x && into[0] < R.x + R.w && into[1] >= R.y && into[1] < R.y + R.h;
        if (mouths !== 1 || M[t.r][t.c] !== 1 || !inRoom) out.badWeb.push([size, seed, t.id, mouths]); } } }
  return out; });
console.log(JSON.stringify(gen));
check(`a hundred gates laid the same twice: ${gen.br} braziers (${gen.lit} burning), ${gen.webs} webs, ids unique`, gen.gates === 100 && gen.same && gen.dupIds === 0 && gen.br > 300 && gen.webs > 50, gen);
check('every brazier stands on a floor cell of a space that is not the stair hall, a flooded hall or a chasm, never in a threshold', gen.badCell.length === 0 && gen.nearThr === 0, gen.badCell.slice(0, 5));
check("every web hangs in its side room's one mouth, a bare corridor cell, facing into the room", gen.badWeb.length === 0, gen.badWeb.slice(0, 5));
const R = [];
for (const [size, seed] of [['large', 909], ['medium', 2055]]) {
  await enterDungeon(page, { theme: 'ruins', size, seed });
  R.push(Object.assign({ size, seed }, await page.evaluate(() => {
    const G = window._lastGen, B = GATE_THINGS.filter(t => t.kind === 'brazier'), W = GATE_THINGS.filter(t => t.kind === 'web');
    const o = { laid: G.things.length, built: GATE_THINGS.length, br: B.length, webs: W.length, ids: GATE_THINGS.map(t => t.id + (t.lit ? '*' : '')).join(','), inScene: GATE_THINGS.every(t => t.group.parent === dScene) };
    // a brazier: about 1,100 triangles in 2 draws, solid at its middle, and the cell's middle beside the wall open
    let tris = 0, draws = 0; B[0].group.traverse(q => { if (q.isMesh) { draws++; tris += q.geometry.index.count / 3; } }); o.tris = tris; o.draws = draws;
    o.solid = B.every(t => { currentFloor = t.floor; return dBlk(t.x, t.z); });
    o.cellOpen = B.every(t => { currentFloor = t.floor; const M = t.floor === 2 ? G.map2 : G.map, c0 = dCellOf(t.x), r0 = dCellOf(t.z); let ok = true; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const c = c0 + dc, r = r0 + dr; if (M[r] && M[r][c] === 1 && dBlk(dAt(c), dAt(r))) ok = false; } return ok; });
    o.flames = B.every(t => t.group.userData.fire.visible === t.lit) && B.every(t => !!t.light === t.lit);
    const cold = B.find(t => !t.lit); if (cold) { const n0 = TORCHES.length; o.lit1 = lightBrazier(cold); o.lit2 = lightBrazier(cold); o.lightAdded = TORCHES.length === n0 + 1 && cold.group.userData.fire.visible && cold.light.parent != null; }
    // a web: a wall across its mouth until it burns; the passage behind it open after
    const w = W[0]; if (w) { const T = G.things.find(q => q.id === w.id); currentFloor = w.floor;
      const before = [dBlk(w.x, w.z), dBlk(w.x - T.dc * .2 + (T.dr ? .9 : 0), w.z - T.dr * .2 + (T.dc ? .9 : 0))];
      const [nx, nz] = [w.x - T.dc * 2, w.z - T.dr * 2]; o.found = gateThingNear('web', nx, nz, 3) === w;
      o.burn1 = burnWeb(w); o.burn2 = burnWeb(w); o.webWall = before; o.webOpen = !dBlk(w.x, w.z); o.gone = gateThingNear('web', nx, nz, 3) == null; }
    return o; })));
}
console.log(JSON.stringify(R));
check(`two gates built: every thing laid stands in the scene (${R.map(r => `${r.size} ${r.br} braziers, ${r.webs} webs`).join('; ')})`, R.every(r => r.inScene && r.built > 0 && r.built <= r.laid) && R.some(r => r.webs > 0), R);
check(`a brazier is ${R[0].tris} triangles in ${R[0].draws} draws`, R.every(r => r.tris < 1400 && r.draws === 2), R.map(r => [r.tris, r.draws]));
check('every brazier is solid, and the middles of the nine cells round it stay open', R.every(r => r.solid && r.cellOpen), R);
check('a burning brazier shows its flames and has its light, a cold one neither; lightBrazier lights a cold one once', R.every(r => r.flames && (r.lit1 === undefined || (r.lit1 && !r.lit2 && r.lightAdded))), R);
check('a web is a wall across its passage until burnWeb; then the way through is open and nothing is left to burn', R.filter(r => r.webs).every(r => r.webWall[0] && r.webWall[1] && r.found && r.burn1 && !r.burn2 && r.webOpen && r.gone), R);
await enterDungeon(page, { theme: 'ruins', size: 'large', seed: 909 });
const again = await page.evaluate(() => GATE_THINGS.map(t => t.id + (t.lit ? '*' : '')).join(','));
check('the same gate entered again is laid the same', again === R[0].ids, [again, R[0].ids]);
await g.frames(10);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
