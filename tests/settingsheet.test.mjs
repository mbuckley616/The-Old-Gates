// The settings sheet (Session 691; backlog E, Michael's B on #208): Settings on the pause leaf opens one sheet of the sound (four
// volumes over the speaker button's level), the light (brightness, field of view, full screen), the mouse (look speed, up and down)
// and, when the systems builder's rule is there (`setChallenge`, Session 684 on auto/systems; stood in for here), the challenge.
// ↑/↓ choose a row, ←/→ set it, Esc back to the leaf. Kept in this browser under 'og.settings', never in a save.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await page.evaluate(() => { try { localStorage.removeItem('og.settings'); } catch (e) {} });
await g.intoWorld(); await g.settle('dunmore');
await page.evaluate(() => { _questPopupOpen = false; document.getElementById('g').focus(); });
// Session 1596: a pointer lock held in headless Chromium on software GL, at seconds a frame, takes the browser and the page from
// 0.9 GB to over 7 GB in under a minute and the container kills it (the suite's *Target crashed*, docs/qa/flaky.md); with the lock
// stood in for, the same resume stays at 1.9 GB. So the canvas's lock is a stand-in that counts the asks, and the resume is checked
// to ask for the pointer back.
await page.evaluate(() => { window._lockAsks = 0; CV.requestPointerLock = () => { _lockAsks++; return Promise.resolve(); }; });
await g.frames(2);
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) await page.keyboard.press(k); await g.frames(1); };
const sheet = () => page.evaluate(() => { const P = document.querySelector('#pause-paper'); return { view: pauseLeaf.view, set: pauseLeaf.set,
  rows: [...P.querySelectorAll('[data-srow]')].map(r => r.querySelector('span').textContent), text: P.textContent, S: { ...SETTINGS }, stored: localStorage.getItem('og.settings') }; });

// open it: Esc, then ↓ three times to Settings, E
await page.focus('#g'); await key('Escape'); await key('ArrowDown', 3); await key('KeyE');
const a = await sheet();
console.log(JSON.stringify(a.rows));
const hasRule = await page.evaluate(() => typeof setChallenge === 'function');
// Session 822: a tenth, the renderer (card F1), after the mouse's two
const nine = ['Everything', 'Music', 'Blows and steps', 'Spoken lines', 'Brightness', 'Field of view', 'Full screen', 'Look speed', 'Up and down', 'Renderer'];
// Session 1181 (card F3): on the new look, Quality follows the renderer (the land's three levels); the old look has no land to set
if (await page.evaluate(() => window.OG_LOOK === 'new')) nine.push('Quality');
check('Settings on the leaf opens the sheet with its ten rows (and the challenge only where the rule is built)', a.view === 'settings' && JSON.stringify(a.rows) === JSON.stringify(hasRule ? [...nine, 'How hard the world strikes'] : nine), { hasRule, rows: a.rows });
check('everything starts as it was: 100s, brightness 0, field of view 75, look 1×', a.S.master === 100 && a.S.music === 100 && a.S.bright === 0 && a.S.fov === 75 && a.S.look === 1 && a.S.invert === false, a.S);

// the sound: everything to 80, music to 50
await key('ArrowLeft', 4); await key('ArrowDown'); await key('ArrowLeft', 10);
const s = await page.evaluate(() => ({ S: { ...SETTINGS }, music: volKind('music'), fx: volKind('effects'), gain: AX ? +musicGain.gain.value.toFixed(3) : null, stored: JSON.parse(localStorage.getItem('og.settings')) }));
check('← on Everything and Music: 80 and 50, music at .4 of the button\'s level, effects at .8, kept in this browser', s.S.master === 80 && s.S.music === 50 && Math.abs(s.music - .4) < 1e-9 && Math.abs(s.fx - .8) < 1e-9 && s.stored.master === 80 && s.stored.music === 50, s);

// the light: brightness +10, field of view 90
await key('ArrowDown', 3); await key('ArrowRight', 2);
await key('ArrowDown'); await key('ArrowRight', 3);
const l = await page.evaluate(() => ({ S: { ...SETTINGS }, filter: CV.style.filter }));
check('brightness +10 is a 1.10 brightness on the canvas; the field of view 90', l.S.bright === 10 && /brightness\(1\.1/.test(l.filter) && l.S.fov === 90, l);
await page.screenshot({ path: 'docs/prototypes/settingsheet-ingame.png', timeout: 120000 });
// Esc back to the leaf, resume, and the camera opens out to 90 at rest
await key('Escape');
const back = await page.evaluate(() => ({ view: pauseLeaf.view, open: pauseOpen }));
check('Esc on the sheet goes back to the leaf', back.view === 'leaf' && back.open, back);
const asks0 = await page.evaluate(() => _lockAsks);
await key('Escape');
const asks1 = await page.evaluate(() => ({ asks: _lockAsks, open: pauseOpen }));
check('Esc on the leaf resumes play and asks for the pointer back', !asks1.open && asks1.asks === asks0 + 1, { asks0, ...asks1 });
// the camera eases in the main loop (not the world's tick), so wait for real frames
let fov = 0; for (let k = 0; k < 60 && Math.abs(fov - 90) >= .6; k++) { await g.frames(3); fov = await page.evaluate(() => +CAM.fov.toFixed(1)); }
check('in play at rest the camera\'s field of view is 90', Math.abs(fov - 90) < .6, fov);

// the mouse: look 2×, inverted; a locked pointer's 100-pixel move turns you twice as far, and up is down
await page.focus('#g'); await key('Escape'); await key('ArrowDown', 3); await key('KeyE');
await key('ArrowDown', 7); await key('ArrowRight', 20); await key('ArrowDown'); await key('KeyE');
const m = await page.evaluate(() => { const S = { ...SETTINGS }; closePauseLeaf(false);
  Object.defineProperty(document, 'pointerLockElement', { get: () => CV, configurable: true }); LOCK.t = null;
  const y0 = yaw, p0 = pitch = 0; window.dispatchEvent(new MouseEvent('mousemove', { movementX: 100, movementY: 50 }));
  const out = { S, dyaw: +(yaw - y0).toFixed(3), dpitch: +(pitch - p0).toFixed(3) }; delete document.pointerLockElement; return out; });
check('look speed 2× and inverted: 100 pixels across turn you .8 (was .4), 50 down look up .4', m.S.look === 2 && m.S.invert === true && m.dyaw === -.8 && m.dpitch === .4, m);

// the renderer (Session 822; the new look the default since 18 Oct 2026): ← asks for the old look, r128, kept in this browser as
// og.renderer='old'; in play it waits for the next load (the page does not reload under you), and the row says so; → puts it back
await page.focus('#g'); await key('Escape'); await key('ArrowDown', 3); await key('KeyE');
await key('ArrowDown', 9); await key('ArrowLeft');
const rd = await page.evaluate(() => ({ stored: localStorage.getItem('og.renderer'), look: OG_LOOK, rev: THREE.REVISION, view: pauseLeaf.view, text: document.querySelector('#pause-paper').textContent }));
await key('ArrowRight');
const rd2 = await page.evaluate(() => ({ stored: localStorage.getItem('og.renderer') }));
check('the renderer row: ← keeps the old look for the next load, says so, and does not reload in play; → puts it back', rd.stored === 'old' && rd.look === 'new' && rd.rev === '170' && rd.view === 'settings'
  && /takes hold when the game next loads/.test(rd.text) && rd2.stored === null, { rd: { ...rd, text: undefined }, rd2 });
await key('Escape'); await key('Escape');

// the challenge, when the rule is there (stood in for: the systems builder's names and tables)
const c = await page.evaluate(() => { if (typeof setChallenge === 'function') { delete worldState.challenge; return true; } window.CHALLENGE_STEPS = ['Novice', 'Apprentice', 'Adept', 'Expert', 'Master']; window.setChallenge = n => { worldState.challenge = n; return CHALLENGE_STEPS[n]; };
  window.challengeStep = () => (Number.isInteger(worldState.challenge) ? worldState.challenge : 2); delete worldState.challenge; return true; });
await page.focus('#g'); await key('Escape'); await key('ArrowDown', 3); await key('KeyE');
await key('ArrowUp'); await key('ArrowRight');
const ch = await sheet();
console.log(ch.text.slice(ch.text.indexOf('How hard')));
check('with the rule, an eleventh row: the challenge, Adept to start, → makes it Expert, your blows ×0.75 and theirs ×1.5', c && ch.rows.length === nine.length + 1 && ch.rows[nine.length] === 'How hard the world strikes' && await page.evaluate(() => worldState.challenge) === 3 && /Your blows×0\.75The foes’ blows×1\.5/.test(ch.text), ch.text.slice(-400));
await page.screenshot({ path: 'docs/prototypes/settingsheet-challenge.png', timeout: 120000 });

// kept across a reload, and applied at boot before any game starts
await page.evaluate(() => { worldState.challenge = 2; closePauseLeaf(false); });
await page.reload(); await page.waitForTimeout(4000);
const r = await page.evaluate(() => ({ S: { ...SETTINGS }, filter: CV.style.filter }));
check('after a reload the settings are still yours (80, 50, +10, 90°, 2×, inverted), the brightness on at the title', r.S.master === 80 && r.S.music === 50 && r.S.bright === 10 && r.S.fov === 90 && r.S.look === 2 && r.S.invert === true && /brightness\(1\.1/.test(r.filter), r);
// As they were
const w = await page.evaluate(() => { settingsBack(); return { S: { ...SETTINGS }, filter: CV.style.filter, stored: JSON.parse(localStorage.getItem('og.settings')) }; });
check('As they were puts every setting back as it was, and keeps that', w.S.master === 100 && w.S.music === 100 && w.S.bright === 0 && w.S.fov === 75 && w.S.look === 1 && !w.S.invert && w.filter === '' && w.stored.look === 1, w);

check('no page errors', g.errs.length === 0, g.errs);
await page.evaluate(() => { try { localStorage.removeItem('og.settings'); } catch (e) {} });
await g.close();
