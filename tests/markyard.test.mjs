// The Mark's training yard (Session 1657; arenas-build.md session 2, Michael's B on #914): every Markish town or city with a Fighters'
// Guild hall has a yard (PKIT.mk.yard) on the new look: a 5 m rope ring on trodden earth, the staff rack and a bench. Its place is the
// first clear one behind the hall, else outside the walls on the hall's side: clear of every road, lot and solid, on ground that falls
// under 1.6 m across it, with no tree left in it. The rack and the bench are solid; the ring is open. It costs the town's kit no more
// than two draws (the rope and the earth; the stakes, rack and bench are the halls' own wood).
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const id = await page.evaluate(() => { anchoredPlaces(); const S = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites); return (S.find(s => s.kind === 'town') || {}).id; });
check(`a Markish town (${id}) stands`, !!id && await g.settle(id));
const r = await page.evaluate(id => {
  const S = WORLD.settle.get(id), hall = S.houses.find(h => h.type === 'guild_f'), Y = (S.yards || [])[0]; if (!Y) return { none: true, hall: !!hall };
  let lo = 1e9, hi = -1e9; for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; for (const f of [0, .5, 1]) { const y = worldH(Y.x + Math.cos(a) * 6 * f, Y.z + Math.sin(a) * 6 * f); lo = Math.min(lo, y); hi = Math.max(hi, y); } }
  let road = 1e9; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, ri = roadInfo(Y.x + Math.cos(a) * 6, Y.z + Math.sin(a) * 6); if (ri) road = Math.min(road, ri.d - ROAD_HALF); }
  let ringOpen = true; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; for (const f of [0, .4, .8]) if (solidAt(Y.x + Math.cos(a) * 5 * f, Y.z + Math.sin(a) * 5 * f)) ringOpen = false; }
  let trees = 0; const m = new THREE.Matrix4(), v = new THREE.Vector3();
  for (const ch of chunks.values()) for (const o of ch.group.children) { if (!o.isInstancedMesh || !o.userData.scatter) continue; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); v.setFromMatrixPosition(m); if (Math.hypot(v.x - Y.x, v.z - Y.z) < 5.8) trees++; } }
  let kitG = null; S.group.traverse(x => { if (x.name === 'kit houses') kitG = x; });
  const T = PKIT.mk.yard(), mats = new Set(); T.group.children.forEach(c => mats.add(c.material)); const M = PKIT.mk.mats(), own = [M.beam, M.carve, M.wall[1], M.wall[2]];
  return { hall: !!hall, n: S.yards.length, out: Y.out, r: Y.r, tris: Y.tris, draws: Y.draws, fall: +(hi - lo).toFixed(2), road: +road.toFixed(1), rackSolid: solidAt(Y.rack.x + (Y.rack.x - Y.x) / 5.1 * .9, Y.rack.z + (Y.rack.z - Y.z) / 5.1 * .9), ringOpen, trees,
    inKit: !!kitG && kitG.children.length > 0, newMats: [...mats].filter(x => !own.includes(x)).length, prompt: typeof yardRackPrompt === 'function' };
}, id);
console.log(JSON.stringify(r));
check(`${id}'s Fighters' Guild has its yard: a ${r.r} m ring, ${r.tris} triangles${r.out ? ', outside the walls on the hall\'s side' : ', behind the hall'}`, r.hall && r.n === 1 && r.r === 5 && r.tris < 2500, r);
check(`its ground falls ${r.fall} m across it, ${r.road > 1e8 ? 'no road near it' : 'the nearest road ' + r.road + ' m off its edge'}, no tree in it (${r.trees})`, r.fall < 1.6 && r.road >= 1.4 && r.trees === 0, r);
check('the rack is solid and the ring is open', r.rackSolid && r.ringOpen, r);
check(`it adds at most two materials to the town's kit (${r.newMats}: the rope and the earth)`, r.inKit && r.newMats <= 2, r);
// S1690 — the yard's rack by the hour: a staff by day (the spar), and from 18h to 22h the evening's brawl in the same ring, its stake by
// the town's tier taken when it is called (brawlStart, S1644).
const yb = await page.evaluate(id => {
  const Y = WORLD.settle.get(id).yards[0]; const A = arenaState(); A.brawl = {}; A.banUntil = 0; gold = 1000;
  px = Y.rack.x + (Y.rack.x - Y.x) / 5.1 * 1.1; pz = Y.rack.z + (Y.rack.z - Y.z) / 5.1 * 1.1;
  forceTime(10); const day = yardRackPrompt(); forceTime(20); const eve = yardRackPrompt(), g0 = gold; yardRackUse();
  const B = BRAWL ? { at: +Math.hypot(BRAWL.x - Y.x, BRAWL.z - Y.z).toFixed(3), site: BRAWL.site, stake: BRAWL.stake, paid: g0 - gold, inBout: !!BOUT, spar: !!SPAR } : null;
  if (BRAWL) brawlEnd('off'); const back = gold; yardRackUse(); const again = !BRAWL;
  forceTime(23); const late = yardRackPrompt(); yardRackUse(); const shut = !BRAWL && !SPAR;
  return { day, eve, B, back, again, late, shut, site: Y.site, tier: worldTierAt(Y.x, Y.z) };
}, id);
console.log('yard brawl', JSON.stringify(yb));
check(`the rack offers a staff by day (*${yb.day}*) and the brawl at 20h (*${yb.eve}*)`, /staff/.test(yb.day) && /brawl/.test(yb.eve) && new RegExp(String(yb.B && yb.B.stake)).test(yb.eve), yb);
check(`E at 20h calls the brawl in the yard's own ring (${yb.B && yb.B.at} m from its centre), ${yb.B && yb.B.paid} gold staked at tier ${yb.tier}; called off, it comes back (${yb.back}); one a night (${yb.again}); at 23h nothing starts (${yb.shut})`,
  !!yb.B && yb.B.at < .01 && yb.B.site === yb.site && yb.B.inBout && !yb.B.spar && yb.B.paid === yb.B.stake && yb.B.stake === 50 + 50 * (Math.max(1, yb.tier) - 1) && yb.back === 1000 && yb.again && /staff/.test(yb.late) && yb.shut, yb);
// S1658 — the ladder's ring (arenas-build.md session 2): at every ladder site (Caer Slige, the Mark's cities, its largest towns to four), an
// 8 m rope ring with stands and the post, outside the walls on ground that falls under 1.6 m, no road or tree in it, the ring open and
// the stands and post solid, in no material the yard and the halls lack; its gate takes the ring master's call and its post reads the names.
const sites = await page.evaluate(() => ladderSites().map(s => ({ id: s.id, name: s.name, kind: s.kind })));
const rings = [];
for (const s of sites) { if (!await g.settle(s.id)) { rings.push({ id: s.id, settled: false }); continue; }
  rings.push(await page.evaluate(s => {
    const S = WORLD.settle.get(s.id), G = S && S.ring; if (!G) return { id: s.id, kind: s.kind, none: true };
    let lo = 1e9, hi = -1e9; for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; for (const f of [0, .5, 1]) { const y = worldH(G.x + Math.cos(a) * 12.4 * f, G.z + Math.sin(a) * 12.4 * f); lo = Math.min(lo, y); hi = Math.max(hi, y); } }
    let road = 1e9; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, ri = roadInfo(G.x + Math.cos(a) * 12.4, G.z + Math.sin(a) * 12.4); if (ri) road = Math.min(road, ri.d - ROAD_HALF); }
    let open = true; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (const f of [0, .4, .8, .95]) if (solidAt(G.x + Math.cos(a) * 8 * f, G.z + Math.sin(a) * 8 * f)) open = false; }
    let stands = 0; for (const q of G.sols) if (solidAt(q.cx, q.cz)) stands++;
    let trees = 0; const m = new THREE.Matrix4(), v = new THREE.Vector3();
    for (const ch of chunks.values()) for (const o of ch.group.children) { if (!o.isInstancedMesh || !o.userData.scatter) continue; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); v.setFromMatrixPosition(m); if (Math.hypot(v.x - G.x, v.z - G.z) < 12) trees++; } }
    const T = PKIT.mk.ring(), Y = PKIT.mk.yard(), M = PKIT.mk.mats(), own = new Set([M.beam, M.carve, ...M.wall]); Y.group.children.forEach(c => own.add(c.material));
    const newMats = T.group.children.filter(c => c.name !== 'ring:names' && !own.has(c.material)).length, dc = Math.hypot(G.x - S.site.x, G.z - S.site.z);
    return { id: s.id, kind: s.kind, r: G.r, tris: G.tris, draws: G.draws, fall: +(hi - lo).toFixed(2), road: +road.toFixed(1), open, stands, sols: G.sols.length, trees, newMats, out: +(dc - S.site.pad).toFixed(1) };
  }, s));
  if (!rings[rings.length - 1].none) { const r = rings[rings.length - 1];
    Object.assign(r, await page.evaluate(id => { const G = WORLD.settle.get(id).ring; forceTime(10); const A = arenaState(); A.call = null; A.lastDay = -1; A.banUntil = 0;
      px = G.gate.x; pz = G.gate.z; const p1 = ringPrompt(); ringUse(); const call = A.call ? { at: Math.hypot(A.call.x - G.x, A.call.z - G.z), site: A.call.site } : null; A.call = null;
      ringOf(id).dead.push('Testfighter'); px = G.post.x; pz = G.post.z; const p2 = ringPrompt(), lines = ringPostLines(id).join(' '); ringOf(id).dead.pop();
      CAM.position.set(G.gate.x, G.y + 1.6, G.gate.z); houseLod(); const near = WORLD.settle.get(id).ringLod.hi.visible; CAM.position.set(G.x + 300, G.y + 1.6, G.z); houseLod(); const far = !WORLD.settle.get(id).ringLod.hi.visible && WORLD.settle.get(id).ringLod.lo.visible;
      /* S1662 — the names cut on the boards: the ring's own canvas, a row a board; ink counted as the opaque pixels in a row (the rest is cut away) */
      const nm = WORLD.settle.get(id).ring.paint && S_names(id), ink = k => { const c = nm.image, d = c.getContext('2d').getImageData(0, k * 128, 256, 128).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) n++; return n; };
      function S_names(id) { const m = WORLD.settle.get(id).ringLod.hi.children.find(c => c.name === 'ring:names'); return m && m.material.map; }
      const R0 = worldState.rings || (worldState.rings = {}); const was = R0.champion; R0.champion = 'Ragnall Ironmere'; ringOf(id).dead.push('Testfighter'); CAM.position.set(G.gate.x, G.y + 1.6, G.gate.z); houseLod();
      const cut = nm ? [ink(0), ink(1), ink(2)] : null; R0.champion = was; ringOf(id).dead.pop(); houseLod(); const bare = nm ? [ink(0), ink(1)] : null;
      return { p1, p2, call, lines, near, far, cut, bare }; }, s.id)); }
}
console.log(JSON.stringify(rings));
const got = rings.filter(r => !r.none && r.settled !== false);
check(`the ladder's ${sites.length} sites (${sites.map(s => s.name + ' ' + s.kind).join(', ')}) each have a ring (${got.length})`, sites.length >= 4 && got.length === sites.length, rings);
check(`each ring is 8 m, ${got.map(r => r.tris).join('/')} triangles in ${got.map(r => r.draws).join('/')} draws, in no new material`, got.length && got.every(r => r.r === 8 && r.tris < 8000 && r.draws <= 7 && r.newMats === 0), got);
check(`outside the walls (${got.map(r => r.out).join('/')} m past the pad), its ground falls ${got.map(r => r.fall).join('/')} m, no road or tree in it`, got.length && got.every(r => r.fall < 1.6 && r.road >= 1.4 && r.trees === 0), got);
check('the ring is open, the stands and the post are solid', got.length && got.every(r => r.open && r.stands === r.sols), got);
check('at its gate the ring itself is drawn, from 300 m its earth alone', got.length && got.every(r => r.near && r.far), got);
check('its gate takes the call at the ring, its post reads the names', got.length && got.every(r => r.p1 && /bout/.test(r.p1) && r.call && r.call.at < .01 && /post/.test(r.p2) && /Testfighter/.test(r.lines)), got);
check('the post\'s boards carry the names: the champion on the top board, the dead under it, bare again when they go', got.length && got.every(r => r.cut && r.cut[0] > 300 && r.cut[1] > 300 && r.cut[2] === 0 && r.bare && r.bare[1] === 0 && (r.bare[0] === 0 || r.bare[0] > 300)), got.map(r => ({ id: r.id, cut: r.cut, bare: r.bare })));
check('no errors', g.errs.length === 0, g.errs);
await g.close();
