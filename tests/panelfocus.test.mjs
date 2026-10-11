// A panel closed by the mouse hands the keys back to the view (Session 722; the critic's s476, s480 and s482 runs).
// The game reads its keys on `#g`. A button clicked inside a panel takes the focus; when the panel hides, the focus falls to
// the page, and W, E and the rest did nothing until you clicked the view. Session 625 fixed it for the death screen's
// *Load last save*; the critic kept meeting it after talking to townsfolk. Each panel here is opened, closed by a real mouse
// click on its own button, and then W is held on the keyboard: the view has the focus and you walk. A text field you are
// typing in keeps the focus when a popup closes on its own.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => forceTime(11));
const focus = () => page.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.tagName) : 'null'; });
const walk = async () => { const p0 = await page.evaluate(() => [px, pz]);
  await page.keyboard.down('KeyW'); await g.frames(30); const held = await page.evaluate(() => !!K.KeyW); await page.keyboard.up('KeyW'); await g.frames(2);
  const p1 = await page.evaluate(() => [px, pz]); return { held, moved: +Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(2) }; };
const PANELS = [
  { name: 'dialogue, *Mind the road.*', open: () => { const S = WORLD.settle.get('dunmore'); const n = S.npcs.find(n => n.def && !n._retreated); openDialog(n.def); },
    btn: '#dlg-choices > button >> nth=-1', shut: () => !dlgOpen },
  { name: 'notice board, ✕', open: () => openNoticeBoard({ title: 'Notice', text: 'Wanted: a reliable hand.' }),
    btn: '#nb-popup button', shut: () => !nbOpen },
  { name: 'the rest slip, *Not now*', open: () => openRestSlip('wait', 360), btn: '#sleep-no', shut: () => !sleepOpen },
  { name: 'a book, *Close Book*', open: () => { BAG.push(makeBookItem(BOOKS[0])); openBookReader(BAG.length - 1); },
    btn: '.book-close-btn', shut: () => getComputedStyle(document.getElementById('book-overlay')).display === 'none' },
  { name: 'a sigil stone, clicked', open: () => showSigilOverlay(SPELLS[0], 'The stone is cold.', null, null),
    btn: '#sigil-overlay', shut: () => document.getElementById('sigil-overlay').style.display === 'none' },
];
const out = [];
for (const P of PANELS) {
  await page.evaluate(() => { if (document.getElementById('g')) document.getElementById('g').focus(); });
  await page.evaluate(`(${P.open.toString()})()`); await g.frames(2);
  await page.locator(P.btn).first().click({ timeout: 8000 }).catch(e => console.log('  click failed', String(e).slice(0, 300))); await g.frames(3);
  const shut = await page.evaluate(`(${P.shut.toString()})()`);
  const o = { panel: P.name, shut, focus: await focus(), ...(await walk()) };
  out.push(o); console.log(' ', JSON.stringify(o));
}
check('each panel closes on its own button', out.every(o => o.shut), out);
check('after the click the view has the focus', out.every(o => o.focus === 'g'), out);
check('W held on the keyboard reaches the game and you walk', out.every(o => o.held && o.moved > .3), out);

// typing in the Journal's search while a popup closes: the search keeps the focus
const typing = await page.evaluate(() => { openHub('journal'); journalView('topics'); const s = document.getElementById('jn-search'); s.focus();
  showSigilOverlay(SPELLS[0], 'The stone is cold.', null, null); closeSigilOverlay(); const a = document.activeElement.id; closeHub(); return a; });
console.log('  typing:', typing);
check('a text field being typed in keeps the focus when a popup closes', typing === 'jn-search', typing);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
