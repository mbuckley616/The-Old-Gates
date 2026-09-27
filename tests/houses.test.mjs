// Houses in detail (Session 194, Michael's decision A on Session 179's prototype): every style builds a detailed house
// with variants from its neighbours, the windows under the eaves, and the old house as its distant copy per cluster.
import { boot, check } from './lib/game.mjs';
import { houseLineup } from './lib/houselineup.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const out = { styles: {}, badWin: [], variants: {} };
  for (const k of WORLD.houseStyles()) { let maxT = 0, minT = 1e9; const vs = new Set();
    for (let s = 1; s <= 24; s++) for (const two of [false, true]) { const H = WORLD.houseProto(k, 6 + (s % 3), 4 + (s % 3), s * 101, { twoStory: two }); const t = H.hi.attributes.position.count / 3; maxT = Math.max(maxT, t); minT = Math.min(minT, t); vs.add(JSON.stringify([H.thatch]));
      if (H.winTop > H.eaveLow + 1e-6 && !two) out.badWin.push([k, s, +H.winTop.toFixed(2), +H.eaveLow.toFixed(2)]); if (!H.lo || H.lo.attributes.position.count / 3 > 400) out.badWin.push([k, 'lo']); }
    out.styles[k] = [minT, maxT]; }
  // the Irish draw thatch and slate among their houses; the Mark turf and shingle
  const kinds = (k) => { const s = new Set(); for (let i = 1; i <= 40; i++) s.add(WORLD.houseProto(k, 7, 5, i * 7).thatch); return [...s].sort().join(','); };
  out.irishRoofs = kinds('irish'); out.markRoofs = kinds('mark'); return out; });
check('every style builds a detailed house, 1.5–8k triangles, and a plain distant copy', Object.values(r.styles).every(([a, b]) => a > 1000 && b < 8000), r.styles);
check('the windows sit under the eaves on every one-storey house of every style (Michael: the Irish eaves covered them)', r.badWin.length === 0, r.badWin.slice(0, 6));
check('the cultures draw variants: Irish thatch and slate, the Mark turf and shingle', r.irishRoofs === 'false,true' && r.markRoofs === 'false,true', { irish: r.irishRoofs, mark: r.markRoofs });
// churches and keeps (Session 195): detailed, each with the old one as its distant copy
const civ = await page.evaluate(() => { const C = WORLD.civicProto('church', 7, 9), K = WORLD.civicProto('castle', 14, 11); const t = g0 => g0.attributes.position.count / 3; return { church: [t(C.hi), t(C.lo)], keep: [t(K.hi), t(K.lo)] }; });
check('churches and keeps build in detail with their old selves as distant copies (Session 195)', civ.church[0] > 1500 && civ.church[0] < 6000 && civ.church[1] < 400 && civ.keep[0] > 1500 && civ.keep[0] < 6000 && civ.keep[1] < 600, civ);
// in a town: detailed clusters near, their plain twins far
await g.settle('dunmore');
const lod = await page.evaluate(() => { const S = WORLD.settlements.get('dunmore'); const L = S.lodMeshes || []; const hi = L.filter(m => m.userData.lod === 'hi'), lo = L.filter(m => m.userData.lod === 'lo');
  const tri = a => a.reduce((s, m) => s + m.geometry.attributes.position.count / 3, 0); const saved = CAM.position.clone();
  const look = () => { WORLD.tick(1 / 60, performance.now()); return { hiVis: hi.filter(m => m.visible).length, loVis: lo.filter(m => m.visible).length }; };
  CAM.position.set(S.site.x, CAM.position.y, S.site.z); const near = look();
  CAM.position.set(S.site.x + 400, CAM.position.y, S.site.z); const far = look();
  CAM.position.copy(saved); look();
  const paired = hi.every(m => lo.some(o => o.userData.ckey === m.userData.ckey));
  return { hi: hi.length, lo: lo.length, triHi: tri(hi), triLo: tri(lo), near, far, paired }; });
check('each baked cluster of detailed houses has its plain twin', lod.hi > 3 && lod.hi === lod.lo && lod.paired, lod);
check('from the square the near clusters are detailed; from 400 away every cluster is its plain copy', lod.near.hiVis > 0 && lod.far.hiVis === 0 && lod.far.loVis === lod.lo, lod);
const shot = await houseLineup(page, ['irish', 'anglo', 'french', 'bavarian', 'mark', 'aurenne', 'stone', 'garrison'], 3, { lo: false, gap: 10 });
fs.writeFileSync('tests/out/houses-lineup.png', Buffer.from(shot.split(',')[1], 'base64'));
console.log('  cost', JSON.stringify({ dunmoreHi: lod.triHi, dunmoreLo: lod.triLo }));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
