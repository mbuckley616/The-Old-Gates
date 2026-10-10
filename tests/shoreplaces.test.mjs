// The places the lakes were laid over move to the shore (Session 452, Michael's A on #121; found by Session 448).
// After the routing, a place with no dry straight line from its pad's edge out to three pads, on any of 24 bearings,
// is set down at the nearest spot in its own cell where its pad and a ring 30 beyond stand on dry bare land.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); const stop = g.keepAlive();

const r = await page.evaluate(() => { WORLD.rawH(0, 0);
  const SEA = WORLD.SEA_Y, RV = WORLD.routed, H = (x, z) => { const was = RV.routing; RV.routing = true; const h = WORLD.rawH(x, z); RV.routing = was; return h; }; /* the bare land, as the move reads it (doorGround) */
  const cutOff = t => { const R0 = t.pad * 1.2; for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; let dry = true;
    for (let f = 0; f <= 4 && dry; f++) { const rr = R0 + (t.pad * 3 - R0) * f / 4; if (H(t.x + Math.cos(a) * rr, t.z + Math.sin(a) * rr) < SEA + .3) dry = false; } if (dry) return false; } return true; };
  const ring16 = t => { const R = t.pad * 1.5 + 10; let w = 0; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; if (H(t.x + Math.cos(a) * R, t.z + Math.sin(a) * R) < SEA) w++; } return w; };
  const out = { shore: WORLD.routed.shore, moved: [], bad: [], stillCut: [], ring16: 0, total: 0, lairs: [] };
  for (let j = 0; j < WORLD.GRID; j++) for (let i = 0; i < WORLD.GRID; i++) { const c = WORLD.getCell(i, j); if (c.home) continue;
    for (const t of c.sites) { if (!(t.pad > 0) || t.islet || ['port', 'portal', 'bridge'].includes(t.kind)) continue; out.total++;
      if (cutOff(t)) out.stillCut.push(t.name); if (ring16(t) === 16) out.ring16++;
      if (!t.drawnAt) continue;
      const d = Math.hypot(t.x - t.drawnAt.x, t.z - t.drawnAt.z), [ci, cj] = WORLD.cellOf(t.x, t.z);
      const clear = c.sites.every(s => s === t || !(s.pad > 0) || s.kind === 'portal' || Math.hypot(s.x - t.x, s.z - t.z) >= s.pad + t.pad + 40);
      let minRing = 1e9; for (const R of [t.pad * .5, t.pad, t.pad + 30]) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; minRing = Math.min(minRing, H(t.x + Math.cos(a) * R, t.z + Math.sin(a) * R)); }
      const m = { id: t.id, name: t.name, kind: t.kind, d: Math.round(d), centre: +H(t.x, t.z).toFixed(2), minRing: +minRing.toFixed(2), sameCell: ci === i && cj === j, clear };
      out.moved.push(m); if (!(m.centre >= 1.8 && m.minRing >= 1.5 && m.sameCell && clear)) out.bad.push(m);
      if (t.kind === 'lair') { const e = c.doors.find(e => e.lairDoor && e.lairSite === t.id); out.lairs.push({ name: t.name, gap: e ? +Math.hypot(e.x - t.x, e.z - t.z).toFixed(2) : null }); } } }
  out.diawor = out.moved.find(m => m.name === 'Diawor'); return out; });
console.log(JSON.stringify({ shore: r.shore, n: r.moved.length, total: r.total, ring16: r.ring16, stillCut: r.stillCut, bad: r.bad, lairs: r.lairs, dist: r.moved.map(m => m.d).sort((a, b) => a - b) }));
check('the routing moves 35–50 cut-off places and leaves none stuck', r.shore.moved >= 35 && r.shore.moved <= 50 && r.shore.stuck === 0 && r.moved.length === r.shore.moved, r.shore);
check('no place is cut off now, and none has water on all 16 bearings', r.stillCut.length === 0 && r.ring16 === 0, { stillCut: r.stillCut, ring16: r.ring16 });
check('every moved place stands in its own cell on dry ground (centre ≥ 1.8, pad and ring ≥ 1.5), clear of the other pads', r.bad.length === 0, r.bad.slice(0, 5));
check('each moved within 600 units of where it was drawn', r.moved.every(m => m.d <= 600), Math.max(...r.moved.map(m => m.d)));
check('a moved lair keeps its cavern door in its pad, 16 units off (Session 702; it was 6)', r.lairs.length > 0 && r.lairs.every(l => l.gap != null && Math.abs(l.gap - 16) < .01), r.lairs);

// Diawor, Session 448's example, loaded: built where it now stands, on the stamped ground, with dry land round its pad
await g.settle(r.diawor.id);
const dw = await page.evaluate(id => { const t = WORLD.siteAnywhere(id), S = WORLD.settle.get(id); let dry = 0;
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, R = t.pad * 1.5 + 10; if (WORLD.worldH(t.x + Math.cos(a) * R, t.z + Math.sin(a) * R) > WORLD.SEA_Y + .3) dry++; }
  const roads = WORLD.getCell(...WORLD.cellOf(t.x, t.z)).roadDefs.filter(d => d.a === id || d.b === id).length;
  return { built: !!S, at: S ? [Math.round(S.site.x), Math.round(S.site.z)] : null, site: [Math.round(t.x), Math.round(t.z)], centre: +WORLD.worldH(t.x, t.z).toFixed(2), dry, roads }; }, r.diawor.id);
console.log(JSON.stringify(dw));
check('Diawor builds at its new spot', dw.built && dw.at[0] === dw.site[0] && dw.at[1] === dw.site[1], dw);
check('…on dry ground, with dry land on every bearing 1.5 pads out (was water on all 16)', dw.centre > 1.5 && dw.dry === 16, dw);
check('…and its roads still name it', dw.roads > 0, dw.roads);
check('no page errors', g.errs.length === 0, g.errs);
stop(); await g.close();
