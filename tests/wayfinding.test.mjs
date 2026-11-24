// Directions from townsfolk match the true bearing and pick the nearest building; the map tags every footprint.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const tags = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const t = {}; for (const r of S.sol) { if (r.c === undefined) continue; t[r.bt || 'UNTAGGED'] = (t[r.bt || 'UNTAGGED'] || 0) + 1; } return t; });
check('every footprint carries a type', !tags.UNTAGGED, tags);
const res = await page.evaluate(() => { const S = WORLD.settle.get('dunmore');
  const pool = [...S.npcs, ...S.residents.map(r => r.n).filter(Boolean)].filter(n => n.def && !n.def._lord);
  for (const n of pool) { let t; try { t = n.def.topics; } catch (e) { continue; }
    const f = Array.isArray(t) && t.find(x => /^Where can I find/.test(x.label)); if (!f) continue;
    px = n.g.position.x + 1; pz = n.g.position.z + 1; const out = [];
    for (const it of f.follow) { WORLD.way = null; const said = it.fn(it); const W = WORLD.way; if (!W) { out.push({ label: it.label, said, skipped: true }); continue; }
      const dir = WORLD.compassWord(W.x - px, W.z - pz); out.push({ label: it.label, dirOk: said.includes(dir + ' of here') || /right here|mine|square/.test(said), glyph: !!W.glyph }); }
    return out; } return null; });
check('a townsperson answers', Array.isArray(res) && res.length > 2, res && res.length);
check('every direction matches the bearing', res.every(r => r.skipped || r.dirOk), res.filter(r => !r.skipped && !r.dirOk));
// S2573 — the wide compass (Michael's A on #198): 600 by 46 across 180°, the mark you were given directions to a roundel on it, and faced,
// the ribbon under it names it with its distance; turned away, it is pinned at the band's edge; two marks 2° apart are one roundel of 2
const cmp = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const n = S.npcs.find(n => n.def && !n.def._lord && n.g);
  px = n.g.position.x + 1; pz = n.g.position.z + 1; const t = [...S.houses].sort((a, b) => Math.hypot(b.doorX - px, b.doorZ - pz) - Math.hypot(a.doorX - px, a.doorZ - pz))[0];
  WORLD.way = { x: t.doorX, z: t.doorZ, label: 'the far door', glyph: '⌂' }; const out = { css: [compassEl.offsetWidth, compassEl.offsetHeight] };
  const b = Math.atan2(t.doorX - px, -(t.doorZ - pz)); yaw = -b; drawCompass(); out.faced = COMPASS_LAST; out.d = Math.round(Math.hypot(t.doorX - px, t.doorZ - pz));
  yaw = -(b + Math.PI * .75); drawCompass(); out.away = COMPASS_LAST;
  const L = compassLayout([{ delta: 0, d: 40, q: true, label: 'a' }, { delta: 2 * Math.PI / 180, d: 20, q: false, label: 'b' }, { delta: 1.6, d: 9, q: false, label: 'c' }]);
  out.join = L.groups.map(g => [g.list.length, g.list[0].label, Math.round(g.x)]); out.on = L.on.map(m => m.label);
  WORLD.way = null; return out; });
const fw = cmp.faced.groups.find(g => g.top === 'the far door'), aw = cmp.away.groups.find(g => g.top === 'the far door');
check('the compass is the band, 600 by 46', cmp.css[0] === 600 && cmp.css[1] === 46, cmp.css);
check('faced, the mark is a roundel at the band\'s middle and the ribbon names it with its steps', fw && Math.abs(fw.x - 300) <= 2 && !fw.edge
  && cmp.faced.ribbon.includes('The far door') && cmp.faced.ribbon.includes(cmp.d + ' steps'), { fw, ribbon: cmp.faced.ribbon, d: cmp.d });
check('turned 135° away, it is pinned at the edge and the ribbon says nothing of it', aw && aw.edge && !cmp.away.ribbon.includes('far door'), { aw, ribbon: cmp.away.ribbon });
check('two marks 2° apart are one roundel with the objective on top; a place past the edge is not drawn', JSON.stringify(cmp.join) === JSON.stringify([[2, 'a', 303]]) && cmp.on.join() === 'a,b', cmp);
// S2578 — the rest of #198 A: the band sits at the bottom centre, the ribbon above it; the bottom centre's lines are the ledger's paper slips
// above the vitals' place, four at most, the newest at the foot, a repeat renewing its slip, each gone after 6 s
const led = await page.evaluate(async () => { const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
  const out = { band: r(compassEl), H: innerHeight, W: innerWidth };
  for (let i = 1; i <= 5; i++) showMsg('Line ' + i, '#e8d8a0');
  showMsg('Line 3', '#ff6060');
  const S = () => [...document.querySelectorAll('#ledger .ldg')].filter(e => !e.classList.contains('gone'));
  out.lines = S().map(e => e.textContent); out.ops = S().map(e => +e.style.opacity); out.rule = S().at(-1).style.borderLeftColor;
  out.box = r(document.getElementById('ledger')); out.msg = document.getElementById('msg').textContent;
  await new Promise(f => setTimeout(f, 6600)); out.after = S().length; return out; });
check('the band is at the bottom centre, over the controls line', Math.abs((led.band[0] + led.band[2]) / 2 - led.W / 2) <= 1 && led.band[3] === led.H - 28, led.band);
check('six lines leave four slips, the repeated one renewed at the foot in its own colour, the older paler', JSON.stringify(led.lines) === JSON.stringify(['Line 2', 'Line 4', 'Line 5', 'Line 3'])
  && led.ops[3] === 1 && led.ops[0] < led.ops[3] && led.rule === 'rgb(158, 60, 60)' && led.msg === 'Line 3', led);
check('the ledger stands above the vitals\' place, left, above the band', led.box[0] === 18 && led.box[3] === led.H - 134 && led.box[3] < led.band[1], { box: led.box, band: led.band });
check('every slip is gone after 6 s', led.after === 0, led.after);
// S2584 — the last of #198 A: the vitals plate at the bottom left, under the ledger and clear of the band; each bar's value beside its
// maximum, the marks as a thin bar under the level; the weapon's roundel is the inventory button and the spell's the cast button
const vp = await page.evaluate(() => { const [hud, ibtn, fbtn] = ['hud', 'ibtn', 'fbtn'].map(i => document.getElementById(i)); const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
  PHP = Math.round(effMaxHP() / 2); levelMarks = marksNeeded() / 4; updateHUD(); const out = { plate: r(hud), led: r(document.getElementById('ledger')), band: r(compassEl), H: innerHeight };
  out.hp = document.querySelector('#hud .br .v').textContent; out.want = Math.floor(PHP) + ' / ' + Math.floor(effMaxHP()); out.xp = parseFloat(document.getElementById('xpf').style.width);
  const w = EQ.weapon; EQ.weapon = null; updateHUD(); out.bare = ibtn.textContent; EQ.weapon = { name: 'Test Blade', ico: '🗡️' }; updateHUD(); out.blade = [ibtn.textContent, ibtn.title]; EQ.weapon = w; updateHUD();
  out.inPlate = [ibtn, fbtn].every(b => hud.contains(b)); ibtn.click(); out.inv = invOpen; closeInv?.(); updateSpellButton(); out.fb = [fbtn.textContent, fbtn.title];
  out.note = getComputedStyle(document.getElementById('hudnote')).display; return out; });
check('the vitals plate is at the bottom left, under the ledger and left of the band', vp.plate[0] === 18 && vp.plate[3] === vp.H - 20 && vp.plate[1] < vp.H - 100
  && vp.plate[1] > vp.led[3] && vp.plate[2] < vp.band[0], vp);
// S2594 — under 1,040 wide the band gave its left end to the plate (64 px over it at 960, S2587): it now stops 16 px right of the plate,
// its right end and the ⏳ where they were, the canvas drawn at the band's own width with the heading at its middle
const vwN = page.viewportSize(); const nar = {};
for (const w of [1280, 960, 900]) { await page.setViewportSize({ width: w, height: 720 });
  nar[w] = await page.evaluate(() => { const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right)]; };
    drawCompass(); return { band: r(compassEl), cw: compassEl.width / Math.min(2, devicePixelRatio || 1), plate: r(document.getElementById('hud')), wait: r(document.getElementById('wait-btn')), W: innerWidth }; }); }
await page.setViewportSize(vwN);
check('under 1,040 wide the band stops 16 px right of the vitals plate and keeps its right end and the ⏳; at 1,280 it is 600 as before',
  nar[1280].band[1] - nar[1280].band[0] === 600 && [960, 900].every(w => { const n = nar[w]; return n.band[0] === n.plate[1] + 16 && n.band[1] === w - 100 && n.cw === n.band[1] - n.band[0] && n.wait[1] === w - 16; }), nar);
// S2597 — the ribbon's middle slides left with the band under 1,040, and three names stood over the ledger's foot slip (92 px at 800):
// the ledger narrows with the ribbon's middle, so a slip of two lines and a ribbon of three long names stand apart at every width
const rib = {};
for (const w of [1280, 1040, 960, 800]) { await page.setViewportSize({ width: w, height: 720 });
  rib[w] = await page.evaluate(() => { const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
    showMsg('You have found the Barrow of Woushdaey, and the road beyond it runs on to the coast.', '#e8d8a0');
    _cmpLblKey = ''; _cmpRibbon(['the Barrow of Woushdaey', 'Fionnuala\'s Stores and Chandlery', 'the Shrine of the Guest'].map((l, i) => ({ glyph: '⌂', label: l, d: 1234 + i, q: i === 0, col: '#ff4040' })));
    const o = { lbl: r(compassLbl), slip: r(document.querySelector('#ledger .ldg:last-child')), plate: r(document.getElementById('hud')) };
    _cmpLblKey = ''; _cmpRibbon([]); return o; }); }
await page.setViewportSize(vwN);
check('a ribbon of three names stands clear of the ledger\'s slip and the vitals plate at 1,280, 1,040, 960 and 800 wide', [1280, 1040, 960, 800].every(w => { const o = rib[w];
  const apart = (a, b) => a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]; return (o.lbl[0] >= o.slip[2] + 12 || o.lbl[1] >= o.slip[3]) && apart(o.lbl, o.plate); }), rib);
// S2601 — the controls line was 896 px at every width: at 800 it ran from -48 to 848 and the build tag left the window. It now stays 12 px
// inside each edge, its type 11 px down to 9, the tag at its right end; below ~760 only the controls' text is cut
const cb = {};
for (const [w, h] of [[1280, 720], [900, 720], [800, 600], [640, 480]]) { await page.setViewportSize({ width: w, height: h });
  cb[w] = await page.evaluate(() => { const e = document.getElementById('cbar'), b = e.getBoundingClientRect(), t = e.querySelector('span').getBoundingClientRect();
    return { line: [Math.round(b.left), Math.round(b.right)], tag: [Math.round(t.left), Math.round(t.right)], fs: parseFloat(getComputedStyle(e).fontSize), tagText: e.querySelector('span').textContent, W: innerWidth }; }); }
await page.setViewportSize(vwN);
check('the controls line and its build tag stay inside the window at 1,280, 900, 800 and 640 wide, the type never under 9 px', Object.values(cb).every(o =>
  o.line[0] >= 12 && o.line[1] <= o.W - 12 && o.tag[0] >= o.line[0] && o.tag[1] <= o.line[1] && /^build s\d+$/.test(o.tagText) && o.fs >= 9 && o.fs <= 11) && cb[1280].fs === 11, cb);
check('a bar reads its value over its maximum, and the marks fill a quarter of the level\'s bar', vp.hp === vp.want && Math.abs(vp.xp - 25) < 0.2, { hp: vp.hp, want: vp.want, xp: vp.xp });
check('the weapon\'s roundel shows the weapon in hand, a fist when bare, and opens the inventory; the spell\'s names the spell in its title', vp.inPlate
  && vp.bare === '✊' && vp.blade[0] === '🗡️' && /^Test Blade/.test(vp.blade[1]) && vp.inv && /\(F\)$/.test(vp.fb[1]) && vp.note === 'block', vp);
// S2591 — a line that comes mid-talk stands left of the dialogue panel, wrapped, and the ledger is its full width again after
const dl = await page.evaluate(() => { const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
  luOpen = false; document.getElementById('lu').style.display = 'none'; openDialog(NPC_DEF[Object.keys(NPC_DEF)[0]]);
  showMsg('You paid 30 gold for the room at the inn, and the keeper nods.', '#e8d8a0');
  const d = r(document.getElementById('dlg')), s = r(document.querySelector('#ledger .ldg:last-child')); closeDialog();
  return { d, s, after: r(document.querySelector('#ledger .ldg:last-child')) }; });
check('in a dialogue a long slip wraps left of the panel, clear of it; after, it is one line again', dl.d[2] > dl.d[0] && dl.s[2] <= dl.d[0] - 12 && dl.s[3] - dl.s[1] > 40
  && dl.after[2] > dl.d[0] && dl.after[3] - dl.after[1] < 35, dl);
// S2602 — eleven choices were cut mid-row at 720 tall (the panel held 52vh, 372 of the 461 px they need) and the farewell lay below the fold
// with no sign: the panel now grows to 520 where there is room, and where the list still does not fit a cue stands at the fold until scrolled to
const d11 = {};
for (const [w, h] of [[1280, 720], [1024, 640], [800, 600]]) { await page.setViewportSize({ width: w, height: h });
  d11[h] = await page.evaluate(() => { luOpen = false; document.getElementById('lu').style.display = 'none'; openDialog(NPC_DEF[Object.keys(NPC_DEF)[0]]);
    renderDialogNode('There\'s 2 guests in tonight. A room is 11 gold — the east front room on the first floor, a bed, a bolt on the door, and breakfast.',
      Array.from({ length: 11 }, (_, i) => ({ label: i === 10 ? 'Go with the Weaver.' : 'A question of the house, the ' + (i + 1) + 'th', response: 'x', bye: i === 10 })));
    const d = document.getElementById('dlg'); dlgFoldCue(); const cue = () => getComputedStyle(document.getElementById('dlg-more')).display;
    const last = () => d.querySelector('#dlg-choices').lastElementChild.getBoundingClientRect().bottom <= d.getBoundingClientRect().bottom;
    const o = { fits: d.scrollHeight <= d.clientHeight, top: Math.round(d.getBoundingClientRect().top), lastSeen: last(), cue: cue() };
    d.scrollTop = 1e4; d.dispatchEvent(new Event('scroll')); o.scrolledSeen = last(); o.cueAfter = cue(); closeDialog(); return o; }); }
await page.setViewportSize(vwN);
check('eleven choices fit whole at 720 and 640 tall, the panel 120 px or more below the top; at 600 a cue stands at the fold until the farewell is scrolled to',
  [720, 640].every(h => d11[h].fits && d11[h].lastSeen && d11[h].cue === 'none' && d11[h].top >= 120)
  && !d11[600].fits && !d11[600].lastSeen && d11[600].cue === 'block' && d11[600].scrolledSeen && d11[600].cueAfter === 'none', d11);
// S2603 — in a shop four slips stood over the stock list's rows 10–13 for 6 s after each sale: while the shop is open the ledger stands in its
// header between its name and the ✕, the newest slip alone on one line, and the older ones are seen again when it closes
const sh = {};
for (const [w, h] of [[1280, 720], [800, 600]]) { await page.setViewportSize({ width: w, height: h });
  sh[w] = await page.evaluate(() => { const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
    const shop = document.getElementById('shop'); document.getElementById('sh-title').textContent = 'Fionnuala\'s Stores and Chandlery'; shop.style.display = 'flex';
    for (const l of ['Bought Bronze Dagger for 13🪙', 'Bought Iron Sword for 34🪙', 'Sold Iron Sword for 16🪙', 'Sold a Fine Steel Longsword of the Northern Marches for 120🪙']) showMsg(l, '#e8d8a0');
    const seen = () => [...document.querySelectorAll('#ledger .ldg')].filter(e => !e.classList.contains('gone') && getComputedStyle(e).display !== 'none');
    const t = document.createRange(); t.selectNodeContents(document.getElementById('sh-title'));
    const o = { slips: seen().map(r), text: seen().map(e => e.textContent), cols: r(document.querySelector('.sh-cols')), close: r(document.getElementById('sclose')), titleEnd: Math.round(t.getBoundingClientRect().right) };
    shop.style.display = 'none'; o.after = seen().length; return o; }); }
await page.setViewportSize(vwN);
check('in a shop one slip, the newest, stands on one line in the header, clear of the stock list, the shop\'s name and the ✕; four again after it closes',
  Object.values(sh).every(o => o.slips.length === 1 && /Longsword/.test(o.text[0]) && o.slips[0][3] <= o.cols[1] - 12 && o.slips[0][3] - o.slips[0][1] < 35
    && o.slips[0][2] <= o.close[0] - 12 && o.slips[0][0] >= o.titleEnd + 40 && o.after === 4), sh);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
