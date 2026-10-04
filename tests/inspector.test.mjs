// The mesh inspector (Session 485): every entry of every group builds with the game's own builders, has triangles, the
// animated ones move, the thumbnails render, and closing it hands the game back. One screenshot per group goes to
// docs/prototypes/inspector-<group>.png (what Michael sees) and tests/out/.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
fs.mkdirSync('tests/out', { recursive: true }); fs.mkdirSync('docs/prototypes', { recursive: true });

const opened = await page.evaluate(() => { openInspector(); return { open: INSPECTOR.open, groups: INSPECTOR.groups, n: INSPECTOR.entries.length, ov: document.getElementById('ov').style.display, canvasIn: REN.domElement.parentNode.id }; });
console.log(JSON.stringify(opened));
check('the inspector opens from the title screen with seven groups and the renderer\'s canvas on its stage', opened.open && opened.groups.length === 7 && opened.n > 380 && opened.ov === 'none' && opened.canvasIn === 'insp-stage', opened);

const all = await page.evaluate(() => INSPECTOR.buildAll());
const failed = all.filter(e => e.err), empty = all.filter(e => !e.err && e.tris === 0);
const byGroup = {}; for (const e of all) { const k = e.group; byGroup[k] = byGroup[k] || { n: 0, tris: 0, failed: 0 }; byGroup[k].n++; byGroup[k].tris += e.tris; if (e.err) byGroup[k].failed++; }
console.log(JSON.stringify(byGroup)); if (failed.length) console.log('failed:', JSON.stringify(failed.map(e => [e.group, e.sub, e.name, e.err])));
check('every entry builds with the game\'s own builder and has triangles', failed.length === 0 && empty.length === 0, { failed: failed.map(e => e.name + ': ' + e.err), empty: empty.map(e => e.name) });
check('the seven groups each hold their pieces: people by role and nation, the foes, both kits, the houses by style, the ships by class and look, the herbs, trees and rocks, the furniture kit and the town props, the weapon kit, the viewmodels and the armoured body',
  byGroup['People'].n >= 60 && byGroup['Creatures'].n >= 14 && byGroup['Buildings'].n >= 12 && byGroup['Ships'].n >= 12 && byGroup['Plants, trees, rocks'].n >= 40 && byGroup['Props and furniture'].n >= 140 && byGroup['Weapons and armour'].n >= 30, byGroup);

// the furniture kit is listed once per nation, every piece; the catalogue is written for the control room's Meshes tab
const cat = await page.evaluate(() => INSPECTOR.catalogue());
const furnByNation = {}; for (const c of cat) if (/^The furniture kit: /.test(c.sub)) furnByNation[c.sub] = (furnByNation[c.sub] || 0) + 1;
const keys = new Set(cat.map(c => c.key));
check('every furniture piece is listed in each nation\'s wood, and every entry has a stable key of its own', Object.keys(furnByNation).length === 3 && Object.values(furnByNation).every(n => n === 38) && keys.size === cat.length && cat.every(c => /^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/.test(c.key)), furnByNation);
fs.writeFileSync('docs/inspector-catalogue.json', JSON.stringify({ at: new Date().toISOString(), entries: cat }, null, 0) + '\n');

// the tree folds: groups closed until opened, a selected piece opens its group and section
const folds = await page.evaluate(() => { INSPECTOR.unpinAll(); const tree = document.querySelector('#insp-tree'); const openBefore = tree.querySelectorAll('.gbox[style*="display: block"]').length;
  INSPECTOR.select('creatures/on-the-wolf-kit/dire-wolf'); const openAfter = [...tree.querySelectorAll('.grp.open')].map(x => x.textContent); const subOpen = [...tree.querySelectorAll('.sub.open')].map(x => x.textContent);
  const on = tree.querySelector('.ent.on'); return { openBefore, openAfter, subOpen, on: on && on.textContent, name: INSPECTOR.sel && INSPECTOR.sel.name }; });
check('the tree starts folded and opens the group and section of the piece picked by its key', folds.openAfter.join() === 'Creatures' && folds.subOpen.join() === 'On the wolf kit' && folds.on === 'Dire Wolf' && folds.name === 'Dire Wolf', folds);

// building the first-person pieces swaps the equipment and puts it back, and rebuilds the player's own viewmodel
const eq = await page.evaluate(() => { const before = { w: EQ.weapon, c: EQ.chest, o: EQ.offhand }; const e = INSPECTOR.entries.find(x => x.sub === 'First person, in hand' && x.name === 'Sword'); const r = INSPECTOR.built.get(e.id);
  return { same: EQ.weapon === before.w && EQ.chest === before.c && EQ.offhand === before.o, vmBack: !!vmSword && vmSword.parent === VM_SCENE && vmSword !== r.obj.children[0], tris: r.tris }; });
check('a first-person piece leaves the equipment and the player\'s own viewmodel as they were', eq.same && eq.vmBack, eq);

// side by side: two pinned pieces and a third selected stand in a row on the stage, and unpinning clears them
const pins = await page.evaluate(() => { INSPECTOR.unpinAll(); INSPECTOR.pin('Wolf'); INSPECTOR.pin('Cave Bear'); INSPECTOR.select('Dragon');
  const xs = INSPECTOR.shown.map(e => INSPECTOR.built.get(e.id).obj.position.x); const onStage = INSPECTOR.shown.every(e => INSPECTOR.built.get(e.id).obj.parent === INSPECTOR.stage);
  const names = INSPECTOR.shown.map(e => e.name); const chips = document.querySelectorAll('#insp-pins .chip').length; INSPECTOR.unpinAll(); const after = INSPECTOR.shown.map(e => e.name); return { names, xs, onStage, after, chips, chipsAfter: document.querySelectorAll('#insp-pins .chip').length }; });
check('pinning puts the pieces side by side in a row, left to right, and unpinning leaves the selected one', pins.names.join() === 'Wolf,Cave Bear,Dragon' && pins.onStage && pins.xs[0] < pins.xs[1] && pins.xs[1] < pins.xs[2] && pins.chips === 2 && pins.after.join() === 'Dragon' && pins.chipsAfter === 0, pins);

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
