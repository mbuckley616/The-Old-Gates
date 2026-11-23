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
check('a bar reads its value over its maximum, and the marks fill a quarter of the level\'s bar', vp.hp === vp.want && Math.abs(vp.xp - 25) < 0.2, { hp: vp.hp, want: vp.want, xp: vp.xp });
check('the weapon\'s roundel shows the weapon in hand, a fist when bare, and opens the inventory; the spell\'s names the spell in its title', vp.inPlate
  && vp.bare === '✊' && vp.blade[0] === '🗡️' && /^Test Blade/.test(vp.blade[1]) && vp.inv && /\(F\)$/.test(vp.fb[1]) && vp.note === 'block', vp);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
