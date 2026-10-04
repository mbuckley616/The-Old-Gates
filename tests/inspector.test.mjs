// The mesh inspector (Session 485): every entry of every group builds with the game's own builders, has triangles, the
// animated ones move, the thumbnails render, and closing it hands the game back. One screenshot per group goes to
// docs/prototypes/inspector-<group>.png (what Michael sees) and tests/out/.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
fs.mkdirSync('tests/out', { recursive: true }); fs.mkdirSync('docs/prototypes', { recursive: true });

const opened = await page.evaluate(() => { openInspector(); return { open: INSPECTOR.open, groups: INSPECTOR.groups, n: INSPECTOR.entries.length, ov: document.getElementById('ov').style.display, canvasIn: REN.domElement.parentNode.id }; });
console.log(JSON.stringify(opened));
check('the inspector opens from the title screen with five groups and the renderer\'s canvas on its stage', opened.open && opened.groups.length === 5 && opened.n > 100 && opened.ov === 'none' && opened.canvasIn === 'insp-stage', opened);

const all = await page.evaluate(() => INSPECTOR.buildAll());
const failed = all.filter(e => e.err), empty = all.filter(e => !e.err && e.tris === 0);
const byGroup = {}; for (const e of all) { const k = e.group; byGroup[k] = byGroup[k] || { n: 0, tris: 0, failed: 0 }; byGroup[k].n++; byGroup[k].tris += e.tris; if (e.err) byGroup[k].failed++; }
console.log(JSON.stringify(byGroup)); if (failed.length) console.log('failed:', JSON.stringify(failed.map(e => [e.group, e.sub, e.name, e.err])));
check('every entry builds with the game\'s own builder and has triangles', failed.length === 0 && empty.length === 0, { failed: failed.map(e => e.name + ': ' + e.err), empty: empty.map(e => e.name) });
check('the five groups each hold their pieces: people by role and nation, the foes, both kits, the houses by style, the ships by class and look, the herbs, trees and rocks',
  byGroup['People'].n >= 60 && byGroup['Creatures'].n >= 14 && byGroup['Buildings'].n >= 12 && byGroup['Ships'].n >= 12 && byGroup['Plants, trees, rocks'].n >= 40, byGroup);

// the animated ones move: a walking villager's thigh turns, a trotting wolf's, a ship's yard braces
const moved = await page.evaluate(() => {
  const pick = (name, mode) => { const e = INSPECTOR.entries.find(x => x.name === name); INSPECTOR.select(e.id); const r = INSPECTOR.built.get(e.id); if (mode) r.mode = mode; return r; };
  const sample = (r, j) => { const o = r.obj; let b = null; o.traverse(x => { if (!b && x.isBone && x.name === j) b = x; }); const B = o.userData.B; return (b || (B && B[j])); };
  const out = {};
  const v = pick('villager', 'walk'); const th = v.obj.children[0] && v.obj.getObjectByName && (v.obj.getObjectByName('thL') || null);
  const rot = () => { let q = null; v.obj.traverse(x => { if (!q && x.isBone) q = x; }); return null; };
  const a0 = []; v.obj.traverse(x => { if (x.isBone) a0.push(x.rotation.x); }); for (let k = 0; k < 20; k++) INSPECTOR.frame(performance.now() + k * 50);
  const a1 = []; v.obj.traverse(x => { if (x.isBone) a1.push(x.rotation.x); }); out.person = a0.some((x, i) => Math.abs(x - a1[i]) > .01);
  const w = pick('Wolf', 'trot'); const w0 = []; w.obj.traverse(x => { if (x.isBone) w0.push(x.rotation.x); }); for (let k = 0; k < 20; k++) INSPECTOR.frame(performance.now() + k * 50);
  const w1 = []; w.obj.traverse(x => { if (x.isBone) w1.push(x.rotation.x); }); out.wolf = w0.some((x, i) => Math.abs(x - w1[i]) > .01);
  const s = pick('player'); const rigs = s.obj.userData.rigs || []; const y0 = rigs.map(q => q.m.rotation.y); for (let k = 0; k < 40; k++) INSPECTOR.frame(performance.now() + k * 50);
  out.ship = rigs.length > 0 && rigs.some((q, i) => Math.abs(q.m.rotation.y - y0[i]) > .005);
  return out; });
console.log(JSON.stringify(moved));
check('the poses and gaits animate on the stage: a villager walks, a wolf trots, a ship\'s sails trim', moved.person && moved.wolf && moved.ship, moved);

// one screenshot per group: the thumbnail grid
const slug = s => s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
let thumbs = 0;
for (const grp of opened.groups) {
  const n = await page.evaluate(gr => { INSPECTOR.group(gr); return document.querySelectorAll('#insp-grid .card canvas').length; }, grp);
  thumbs += n; await page.waitForTimeout(300);
  const file = `inspector-${slug(grp)}.png`; await page.screenshot({ path: 'tests/out/' + file, timeout: 120000 }); fs.copyFileSync('tests/out/' + file, 'docs/prototypes/' + file);
}
check('every group draws a thumbnail for each of its entries', thumbs === all.length - failed.length, { thumbs, entries: all.length });

// the stage with a piece on it, for the eye
await page.evaluate(() => { INSPECTOR.select(INSPECTOR.entries.find(e => e.name === 'galleon' || (e.sub === 'galleon' && e.name === 'pirate')).id); for (let k = 0; k < 5; k++) INSPECTOR.frame(performance.now() + k * 40); });
await g.frames(2); await page.screenshot({ path: 'tests/out/inspector-stage.png', timeout: 120000 }); fs.copyFileSync('tests/out/inspector-stage.png', 'docs/prototypes/inspector-stage.png');

const closed = await page.evaluate(() => { closeInspector(); return { open: INSPECTOR.open, ov: document.getElementById('ov').style.display, canvasIn: REN.domElement.parentNode.id, ui: document.getElementById('insp').style.display }; });
check('closing it hands the canvas back to the game and shows the title again', !closed.open && closed.ov !== 'none' && closed.canvasIn === 'g' && closed.ui === 'none', closed);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
