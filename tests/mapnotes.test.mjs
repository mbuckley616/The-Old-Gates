// Notes pinned to the map (Session 496, Michael's C on DECISION #132, part C): *✎ Note* on the world map arms the next
// click, which opens a box for up to 500 characters; the note is kept in worldState.mapNotes (a character key) with its
// world spot and date, drawn as a pin, read on hover and on a click, and taken down from its panel.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { delete worldState.mapNotes; worldState.gameTimeAbsMinutes = 1440 * 5 + 600; worldState.gameTimeMinutes = 600; openHub('map'); });
await g.frames(3);
const box = await page.evaluate(() => { const r = document.getElementById('w80-map').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
const cx = Math.round(box.x + box.w / 2 + 60), cy = Math.round(box.y + box.h / 2 + 40);

// 1. arm, click the spot, type, Enter
await page.click('#wm-pin');
const armed = await page.evaluate(() => ({ armed: MAP.pinArmed, cursor: MAP.cv.style.cursor, panel: document.getElementById('wm-panel-body').innerText }));
await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.up();
const spot = await page.evaluate(([sx, sy]) => { const r = MAP.cv.getBoundingClientRect(); return screenToMap(sx - r.left, sy - r.top); }, [cx, cy]);
const opened = await page.evaluate(() => ({ ta: !!document.getElementById('wm-note'), focus: document.activeElement && document.activeElement.id, armed: MAP.pinArmed }));
await page.keyboard.type('The ferryman here owes me a crossing. Ask for Daithi.');
const hub0 = await page.evaluate(() => hubOpen);
await page.keyboard.press('Enter');
await g.frames(2);
const pinned = await page.evaluate(() => ({ L: worldState.mapNotes, panel: document.getElementById('wm-panel-body').innerText }));
console.log(JSON.stringify({ armed, spot, opened, pinned }).slice(0, 900));
check('✎ Note arms the map: a crosshair, and the panel says to click the spot', armed.armed && armed.cursor === 'crosshair' && /Click the map where the note should go/.test(armed.panel), armed);
check('the click opens the note box with the focus in it, and disarms', opened.ta && opened.focus === 'wm-note' && !opened.armed, opened);
const n = pinned.L && pinned.L[0];
check('Enter pins the note at the world spot clicked, with its date', hub0 && pinned.L && pinned.L.length === 1 && n.text === 'The ferryman here owes me a crossing. Ask for Daithi.' && Math.abs(n.x - spot[0]) < 0.2 && Math.abs(n.z - spot[1]) < 0.2 && n.t === 1440 * 5 + 600 && n.tod === 600, n);
check('the panel then shows the note, its date and Take it down', /Your note/.test(pinned.panel) && /Day 6 · 10:00 am/.test(pinned.panel) && /owes me a crossing/.test(pinned.panel) && /Take it down/.test(pinned.panel), pinned.panel);

// 2. the pin is drawn, read on hover, opened on a click; Cancel pins nothing; an empty note pins nothing
await page.evaluate(() => { mapPanel(null); MAP.sel = null; MAP.dirty = true; mapDraw(); });
const pin = await page.evaluate(() => { const r = MAP.cv.getBoundingClientRect(); const p = MAP._notes[0]; return p ? { x: r.left + p.sx + 4, y: r.top + p.sy - 9 } : null; });
await page.mouse.move(pin.x - 30, pin.y - 30); await page.mouse.move(pin.x, pin.y);
const hover = await page.evaluate(() => { const el = document.getElementById('wm-hover'); return { shown: el && el.style.display, text: el && el.innerText, hover: MAP.hover }; });
await page.mouse.down(); await page.mouse.up();
const clicked = await page.evaluate(() => ({ sel: MAP.sel, panel: document.getElementById('wm-panel-body').innerText }));
check('the pin is drawn where the note was pinned, and its words show on hover', pin && hover.shown === 'block' && /owes me a crossing/.test(hover.text) && /Day 6/.test(hover.text) && hover.hover === 'note:0', { pin, hover });
check('a click on the pin opens it', clicked.sel === 'note:0' && /Take it down/.test(clicked.panel), clicked);
await page.click('#wm-pin'); await page.mouse.move(cx - 150, cy - 90); await page.mouse.down(); await page.mouse.up();
await page.keyboard.type('never kept'); const reach = await page.evaluate(() => ['wm-note-pin', 'wm-note-cancel'].map(id => { const b = document.getElementById(id).getBoundingClientRect(); const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return { id, top: Math.round(b.top), h: Math.round(b.height), hit: at && at.id, vh: innerHeight }; })); check('Pin it and Cancel sit on screen where a click lands on them', reach.every(r => r.hit === r.id && r.top > 0 && r.top + r.h < r.vh), reach);
await page.evaluate(() => document.getElementById('wm-note-cancel').click());
await page.click('#wm-pin'); await page.mouse.move(cx - 150, cy - 90); await page.mouse.down(); await page.mouse.up();
await page.keyboard.type('    '); await page.keyboard.press('Enter');
await page.click('#wm-pin'); await page.mouse.move(cx - 150, cy - 90); await page.mouse.down(); await page.mouse.up();
await page.keyboard.type('x'.repeat(600)); await page.evaluate(() => document.getElementById('wm-note-pin').click());
const after = await page.evaluate(() => worldState.mapNotes.map(n => n.text.length));
check('Cancel and an empty note pin nothing; a long one is kept at 500', JSON.stringify(after) === JSON.stringify([53, 500]), after);

// 3. saved with the character, back after a reload
await page.evaluate(async () => { closeHub(); await saveToSlot(0); });
const rows = await page.evaluate(async () => { const m = SS.idx.find(e => e.kind === 'manual' && e.slot === 0); const c = JSON.parse(await ssGet(m.key)), w = JSON.parse(await ssGet(ssWorldKey(m.key))); return { c: c.wS && c.wS.mapNotes && c.wS.mapNotes.length, w: w.wS && w.wS.mapNotes }; });
g.errs.length = 0; await page.reload(); await page.waitForTimeout(5000);
await page.evaluate(() => document.getElementById('cb').click()); await page.waitForTimeout(12000); await g.hide();
const back = await page.evaluate(() => (worldState.mapNotes || []).map(n => n.text.slice(0, 20)));
check('the notes ride the character row and come back on a reload', rows.c === 2 && rows.w === undefined && back.length === 2 && back[0] === 'The ferryman here ow', { rows, back });

// 4. taken down
await page.evaluate(() => { openHub('map'); }); await g.frames(3);
const gone = await page.evaluate(() => { MAP.dirty = true; mapDraw(); mapNotePanel(0); document.getElementById('wm-note-del').click(); MAP.dirty = true; mapDraw(); return { L: worldState.mapNotes.map(n => n.text.length), pins: MAP._notes.length, panel: document.getElementById('wm-panel-body').innerText }; });
check('Take it down removes the note and its pin', JSON.stringify(gone.L) === '[500]' && gone.pins <= 1 && !/Your note/.test(gone.panel), gone);
await page.evaluate(() => closeHub());
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
