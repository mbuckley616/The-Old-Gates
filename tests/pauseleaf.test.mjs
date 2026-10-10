// The pause leaf (Session 690; backlog E, Michael's B on #208, the leaf routed to the look builder). Esc in play with no panel
// open stops the world and opens one parchment leaf: the date, the place, Resume, Save, Load, Settings, The keys, Quit to the title. A lock
// lost that no panel asked for opens it too (the browser keeps the first Esc for itself). Esc with a panel open still only closes
// the panel. Save and Load go out from the leaf and come back to it; a load that replaced the world leaves it closed. Quit asks twice.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
// the harness hides the opening quest popup by its style alone; closing it as the game does clears its flag too
await page.evaluate(() => { _questPopupOpen = false; forceTime(16.4); document.getElementById('g').focus(); });
await g.frames(3);
const esc = async () => { await page.focus('#g').catch(() => {}); await page.keyboard.press('Escape'); await g.frames(2); };
const state = () => page.evaluate(() => { const ov = document.getElementById('pauseui'), P = ov && ov.querySelector('#pause-paper');
  return { open: pauseOpen, shown: !!ov && ov.style.display === 'block', rows: P ? [...P.querySelectorAll('[data-pi]')].map(r => r.querySelector('span:nth-child(2) span').textContent) : [],
    on: pauseLeaf.on, view: pauseLeaf.view, text: P ? P.textContent : '', clock: worldState.gameTimeAbsMinutes, play: playClockS, inv: invOpen || hubOpen, sl: document.getElementById('slmenu').style.display }; });

// 1. Esc in play opens it
await esc();
const a = await state();
console.log(JSON.stringify({ ...a, text: a.text.slice(0, 160) }));
check('Esc in play, no panel open, opens the leaf', a.open && a.shown, a);
check('its rows: Resume, Save, Load, Settings, The keys, Quit to the title; Resume chosen', JSON.stringify(a.rows) === JSON.stringify(['Resume', 'Save', 'Load', 'Settings', 'The keys', 'Quit to the title']) && a.on === 0, a.rows);
check('it heads with the date and the place, and ends with who you are', /Paused/.test(a.text) && /4:2\d pm/.test(a.text) && /Dunmore/.test(a.text) && /level \d+ · \d+ gold/.test(a.text), a.text.slice(0, 200));
await page.screenshot({ path: 'docs/prototypes/pauseleaf-ingame.png' });

// 2. the world stands still while it is open
await g.frames(20);
const b = await state();
check('the world stands still: the clock and the play clock do not move over 20 frames', b.clock === a.clock && b.play === a.play, { a: [a.clock, a.play], b: [b.clock, b.play] });
// play keys do nothing under it
await page.keyboard.press('KeyI'); await page.keyboard.press('KeyF'); await g.frames(2);
const c = await state();
check('I and F under the leaf open nothing and cast nothing', !c.inv && c.open, c);

// 3. ↓ four times to The keys, E opens the page, Esc back to the leaf
for (let k = 0; k < 4; k++) await page.keyboard.press('ArrowDown');
await g.frames(1);
const d0 = await state();
await page.keyboard.press('KeyE'); await g.frames(2);
const d = await state();
console.log(JSON.stringify({ on: d0.on, view: d.view, text: d.text.slice(0, 200) }));
check('↓ four times chooses The keys; E opens the page of keys', d0.on === 4 && d.view === 'keys' && /strike; hold for a power blow/.test(d.text) && /the book: map, quests, journal/.test(d.text), d.text.slice(0, 120));
await page.screenshot({ path: 'docs/prototypes/pauseleaf-keys.png' });
await page.keyboard.press('Escape'); await g.frames(2);
const e = await state();
check('Esc on the keys goes back to the leaf, still paused', e.open && e.view === 'leaf', e);

// 4. Quit asks a second time; Esc stays
await page.keyboard.press('ArrowDown'); await page.keyboard.press('KeyE'); await g.frames(2);
const q = await state();
check('Quit asks first: Leave without saving?', q.open && /Leave without saving\?/.test(q.text) && await page.evaluate(() => started), q.text.slice(0, 300));
await page.keyboard.press('Escape'); await g.frames(2);
const q2 = await state();
check('Esc takes the question back and the leaf stays', q2.open && !/Leave without saving/.test(q2.text), q2.text.slice(0, 120));

// 5. Save from the leaf: the menu opens over a hidden leaf, the world still stopped; closing it comes back to the leaf
await page.evaluate(() => { pauseLeaf.on = 1; pauseTake(); });
await g.frames(10);
const s = await state();
check('Save opens the save menu, the leaf hidden behind it, the world still stopped', s.open && !s.shown && s.sl === 'flex' && s.clock === a.clock, s);
await page.keyboard.press('Escape'); await g.frames(2);
const s2 = await state();
check('closing the save menu brings the leaf back', s2.open && s2.shown && s2.sl === 'none', s2);
// Load: a load that went through (the load path sets _slLoaded and closes the menu) leaves the leaf closed
await page.evaluate(() => { pauseLeaf.on = 2; pauseTake(); });
await g.frames(2);
const l = await page.evaluate(() => { const m = document.getElementById('slmenu').style.display, tab = document.getElementById('slmenu-title').textContent; _slLoaded = true; closeSLMenu(); return { m, tab, open: pauseOpen }; });
check('Load opens the load menu; once a load replaces the world, the leaf is gone', l.m === 'flex' && /Load/.test(l.tab) && !l.open, l);

// 6. Esc on the leaf resumes, and the world moves again
await esc();
await page.keyboard.press('Escape'); await g.frames(2);
const r0 = await state();
await g.frames(20);
const r = await state();
check('Esc on the leaf resumes: closed, and the play clock moves again', !r0.open && !r0.shown && r.play > r0.play, { r0: r0.play, r: r.play });

// 7. Esc with a panel open only closes the panel
await page.keyboard.press('KeyI'); await g.frames(2);
const i0 = await state();
await page.keyboard.press('Escape'); await g.frames(2);
const i1 = await state();
check('Esc with the pack open (I, the book at its pack) closes it and opens no leaf', i0.inv && !i1.inv && !i1.open, { i0: i0.inv, i1 });

// 8. a lock lost that no panel asked for opens the leaf; one a panel asked for does not
const lk = await page.evaluate(() => { const out = {};
  _lockReleaseAskedAt = -1e9; document.dispatchEvent(new Event('pointerlockchange')); out.lost = pauseOpen; closePauseLeaf(false);
  _lockReleaseAskedAt = performance.now(); document.dispatchEvent(new Event('pointerlockchange')); out.asked = pauseOpen; closePauseLeaf(false);
  dead = true; out.deadOpens = openPauseLeaf(); dead = false;
  return out; });
check('a lock lost with no panel asking opens the leaf; a panel\'s own release does not; nor when you are dead', lk.lost && !lk.asked && !lk.deadOpens, lk);

// 9. Quit, twice, goes to the title
await esc();
await page.evaluate(() => { pauseLeaf.on = 5; });
await page.keyboard.press('KeyE'); await g.frames(1);
const nav = page.waitForEvent('load', { timeout: 180000 });
await page.keyboard.press('KeyE');
await nav; await page.waitForTimeout(3000);
const t = await page.evaluate(() => ({ started, title: document.getElementById('ov').style.display !== 'none' }));
check('E again on Quit goes to the title', !t.started && t.title, t);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
