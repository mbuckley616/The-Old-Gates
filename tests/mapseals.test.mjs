// The world map, sharp and with your work on it (Session 704, Michael's A on DECISION #220; the concept artist's prototype on
// auto/concept): the canvas at the screen's own pixels, tiles in a quadtree so a tile pixel is never more than 1.15 screen
// pixels, and the compass's marks as numbered wax seals at every zoom, off-view marks on the edge, a list in the panel.
// Booted at devicePixelRatio 2, a laptop's screen, where the old map was drawn at half resolution.
import fs from 'fs';
import { boot, check } from './lib/game.mjs';
const g = await boot({ dpr: 2 }); const { page } = g;
await g.intoWorld();
const took = await page.evaluate(() => {
  const d = WORLD.siteAnywhere('dunmore'); const qs = [];
  for (const k of ['cull', 'retrieve', 'deliver', 'find']) { const q = townQuestFor(d, k, true); if (q) { q.id = q.id + ':' + k; qAdd(q); qs.push(q); } }
  const dl = qs.find(q => q.kind === 'deliver'); if (dl) qComplete(dl);
  return { n: qs.length, comp: compassMarkers().length };
});
await page.evaluate(() => openHub('map'));
await g.frames(3);

// 1. the store at device pixels, the maths in CSS pixels
const size = await page.evaluate(() => { const r = MAP.cv.getBoundingClientRect(); return { dpr: devicePixelRatio, bw: MAP.cv.width, bh: MAP.cv.height, cw: MAP.cssW, ch: MAP.cssH, rw: Math.round(r.width), rh: Math.round(r.height) }; });
check('the canvas is stored at twice its CSS size on a ratio-2 screen', size.dpr === 2 && size.bw === size.cw * 2 && size.bh === size.ch * 2 && Math.abs(size.rw - size.cw) <= 1 && Math.abs(size.rh - size.ch) <= 1, size);

// 2. the marks: the compass's list, every one sealed, one gilt for the job done
const open = await page.evaluate(() => { MAP.dirty = true; mapDraw(); const L = mapMarks(); return { L: L.map(m => ({ n: m.n, st: m.st, title: m.title, line: m.line })), drawn: MAP._marks.length, edge: MAP._marks.filter(o => o.edge).length, comp: compassMarkers().length }; });
console.log(JSON.stringify({ took, open }).slice(0, 900));
check('the map marks what the compass marks, four of Dunmore\'s jobs, one waiting to be reported', took.n === 4 && open.L.length === open.comp && open.comp === 4 && open.L.filter(m => m.st === 'back').length === 1 && open.L.find(m => m.st === 'back').line.startsWith('Report to'), open);
check('every mark is drawn where the map opens, numbered 1 to 4', open.drawn === 4 && open.L.map(m => m.n).join() === '1,2,3,4', open);
const cont = await page.evaluate(() => { MAP.zoom = 1; mapClamp(); MAP.dirty = true; mapDraw(); return { drawn: MAP._marks.length, cellPx: SIZE * baseScale() * MAP.zoom }; });
check('the whole continent in view still shows all four seals (the old map showed none below 60 px a province)', cont.drawn === 4 && cont.cellPx < 60, cont);

// 3. deep in: marks off the view sit on the edge, with a distance
const deep = await page.evaluate(() => { const d = WORLD.siteAnywhere('dunmore'); MAP.zoom = 64; const s = baseScale() * MAP.zoom; MAP.ox = MAP.cssW / 2 - (d.x - 1500) * s; MAP.oy = MAP.cssH / 2 - d.z * s; mapClamp(); MAP.dirty = true; mapDraw();
  const e = MAP._marks.filter(o => o.edge); const inside = e.every(o => o.sx >= 0 && o.sy >= 0 && o.sx <= MAP.cssW && o.sy <= MAP.cssH); return { n: MAP._marks.length, edge: e.length, inside, cellPx: SIZE * s }; });
check('zoomed into one district, the marks off the view stand on the frame', deep.n === 4 && deep.edge >= 1 && deep.inside, deep);

// 4. sharp: the level keeps a tile pixel at or under 1.15 screen pixels, and the deep tiles build and are drawn
const lv = await page.evaluate(() => { const out = []; for (const z of [1, 4, 12, 30, 64]) { const cellPx = SIZE * baseScale() * z, dev = cellPx * MAP.dpr, L = mapLevelFor(dev); out.push({ z, L, ratio: +(dev / (1 << L) / MAP_TQ).toFixed(2) }); } return out; });
check('at every zoom the tile level gives at most 1.15 screen pixels a tile pixel (the old fine tile, 320 px a province, gave 14 at ×64)', lv.every(o => o.ratio <= 1.15) && lv[lv.length - 1].L === 4, lv);
const built = await page.evaluate(() => { const t0 = performance.now(); let n = 0; while (n < 6000 && (MAP.jobs.length || n < 2)) { mapDraw(); mapJobs(); n++; } mapDraw();
  const q = [...MAP.tiles.values()].filter(t => t.q && t.L === 4); return { calls: n, ms: Math.round(performance.now() - t0), deep: q.length, done: q.filter(t => t.done).length, left: MAP.jobs.length }; });
check('the deepest tiles in view are built, middle first, until no job is left', built.deep >= 4 && built.done === built.deep && built.left === 0, built);
// detail: the middle of the view, drawn from the deep tiles, against the same view drawn from the province's coarse tile alone
const detail = await page.evaluate(() => {
  const grab = () => { const c = MAP.ctx, w = 200, h = 200, x0 = Math.round(MAP.cv.width / 2 - w / 2), y0 = Math.round(MAP.cv.height / 2 - h / 2); const d = c.getImageData(x0, y0, w, h).data; let s = 0; for (let y = 0; y < h; y++) for (let x = 1; x < w; x++) { const i = (y * w + x) * 4; s += Math.abs(d[i] - d[i - 4]) + Math.abs(d[i + 1] - d[i - 3]); } return s / (w * h); };
  MAP.filt.quests = false; MAP.dirty = true; mapDraw(); const fine = grab();
  const keep = MAP.tiles; MAP.tiles = new Map([...keep].filter(([k, t]) => !t.q)); const jobs = MAP.jobs; MAP.jobs = []; mapDraw(); const coarse = grab(); MAP.tiles = keep; MAP.jobs = jobs; MAP.filt.quests = true; mapDraw();
  return { fine: +fine.toFixed(2), coarse: +coarse.toFixed(2) };
});
check('the middle of a deep view has finer detail than the province tile stretched (twice the edge contrast or more)', detail.fine >= detail.coarse * 2 && detail.fine > 0.5, detail);

// 5. the panel lists the work; a row centres the map on its mark; a seal answers the mouse
await page.evaluate(() => { MAP.sel = null; mapPanel(null); });
const list = await page.evaluate(() => { const b = document.getElementById('wm-panel-body'); return { text: b.innerText, rows: b.querySelectorAll('.mk-row').length }; });
check('with nothing hovered the panel lists the four under Where your work is', /Where your work is/i.test(list.text) && list.rows === 4 && /Report to/.test(list.text), list);
const centred = await page.evaluate(() => { const row = document.querySelectorAll('#wm-panel-body .mk-row')[1]; const id = row.dataset.id; row.click(); mapDraw(); const m = mapMarks().find(o => o.id === id); const [sx, sy] = mapToScreen(m.x, m.z); return { id, sel: MAP.sel, dx: Math.round(sx - MAP.cssW / 2), dy: Math.round(sy - MAP.cssH / 2), panel: document.getElementById('wm-panel-body').innerText }; });
check('a row centres the map on its mark and selects it', centred.sel === centred.id && Math.abs(centred.dx) <= 2 && Math.abs(centred.dy) <= 2 && /u|here/.test(centred.panel), centred);
await page.evaluate(() => { MAP.sel = null; MAP.hover = null; MAP.zoom = 12; const d = WORLD.siteAnywhere('dunmore'); const s = baseScale() * MAP.zoom; MAP.ox = MAP.cssW / 2 - d.x * s; MAP.oy = MAP.cssH / 2 - d.z * s; mapClamp(); MAP.dirty = true; mapDraw(); });
const seal = await page.evaluate(() => { const r = MAP.cv.getBoundingClientRect(); const o = MAP._marks.find(o => !o.edge); return o && { x: r.left + o.sx, y: r.top + o.sy, id: o.m.id, title: o.m.title }; });
await page.mouse.move(seal.x - 40, seal.y - 40); await page.mouse.move(seal.x, seal.y);
const hov = await page.evaluate(() => ({ hover: MAP.hover, panel: document.getElementById('wm-panel-body').innerText }));
const lab = await page.evaluate(() => { const B = MAP._labels; let hit = 0; for (let a = 0; a < B.length; a++) for (let b = a + 1; b < B.length; b++) { const p = B[a], q = B[b]; if (p[0] < q[0] + q[2] && p[0] + p[2] > q[0] && p[1] < q[1] + q[3] && p[1] + p[3] > q[1]) hit++; } return { n: B.length, hit }; });
check('with a seal hovered, no two names are drawn over each other', lab.n >= 2 && lab.hit === 0, lab);
check('hovering a seal names its quest in the panel', hov.hover === seal.id && hov.panel.includes(seal.title), { seal, hov });
const off = await page.evaluate(() => { document.querySelector('.wm-filt[value="quests"]') && (document.querySelector('.wm-filt[value="quests"]').checked = false); MAP.filt.quests = false; MAP.dirty = true; mapDraw(); const n = MAP._marks.length; MAP.filt.quests = true; mapDraw(); return { n, back: MAP._marks.length }; });
check('the quests filter hides the seals and brings them back', off.n === 0 && off.back === 4, off);
// pictures of the map canvas itself, at its device pixels (a page screenshot at ratio 2 outran its timeout on SwiftShader)
const shot = async (file) => { const b64 = await page.evaluate(() => MAP.cv.toDataURL('image/png').split(',')[1]); fs.writeFileSync(file, Buffer.from(b64, 'base64')); };
await page.evaluate(() => { MAP.sel = null; MAP.hover = null; MAP.zoom = 30; const d = WORLD.siteAnywhere('dunmore'); const s = baseScale() * MAP.zoom; MAP.ox = MAP.cssW / 2 - (d.x + 120) * s; MAP.oy = MAP.cssH / 2 - (d.z - 60) * s; mapClamp(); let n = 0; while (n < 400 && (MAP.jobs.length || n < 2)) { mapDraw(); mapJobs(); n++; } MAP.dirty = true; mapDraw(); });
await shot('docs/prototypes/mapseals-ingame.png');
await page.evaluate(() => { MAP.zoom = 1; mapClamp(); MAP.dirty = true; mapDraw(); });
await shot('docs/prototypes/mapseals-continent.png');
await page.evaluate(() => closeHub());
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
