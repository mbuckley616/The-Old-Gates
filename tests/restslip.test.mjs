// Session 532 (Michael's A on DECISION #142, the concept artist's prototype `docs/prototypes/rest/` on auto/concept): one
// rest slip for a bed and for waiting. The day drawn as a band with NOW and the hour you wake; a slider of 1–24 hours and
// today's five times as marks (keys 1–5) that set it to that hour exactly; what the rest gives, by restAtBed's rule, before
// you take it. Waiting goes by any number of hours (it went only to the five times), restores nothing, and takes no level.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
/* S2146 — waking autosaves, and the save's picture (`ssShot`: a render and a read back of the WebGL canvas) held the page
   142–200 s with three boots on four cores, so the 30 s wait for the clock timed out with the clock already moved. The slip
   is what this suite reads, not the picture (the saves suites take it): the picture is skipped and every check is unchanged. */
await page.evaluate(() => { window.ssShot = () => null; });
const key = (code) => page.evaluate((code) => window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })), code);
const slip = () => page.evaluate(() => { const q = id => document.getElementById(id); return { open: sleepOpen, shown: q('sleepui').style.display, title: q('rs-title').textContent,
  date: q('sleep-date').textContent, hrs: q('sleep-hrs').textContent, range: q('sleep-range').value, out: q('rs-out').innerText.replace(/\s+/g, ' ').trim(),
  dial: q('rs-dial').textContent.replace(/\s+/g, ' ').trim(), marks: [...q('rs-marks').querySelectorAll('button')].map(b => b.textContent.trim()), min: restSlip.min }; });

// 9:40 pm on day 4, hurt, ready to level
await page.evaluate(() => { ZE.forEach(e => { if (e && !e.dead) e.locked = true; });
  worldState.gameTimeMinutes = 21 * 60 + 40; worldState.gameTimeAbsMinutes = 3 * 1440 + 21 * 60 + 40;
  PHP = Math.round(effMaxHP() * .5); mana = Math.round(effMaxMana() * .4); levelMarks = marksNeeded(); /* S952 — the level comes on marks */ openSleepUI(); });
const s8 = await slip();
const want = await page.evaluate(() => ({ p8: restPreview(8), p3: restPreview(3), mh: effMaxHP(), mm: effMaxMana(), hp: PHP, mp: mana, lv: level }));
console.log('sleep 8', JSON.stringify(s8));
check(`a bed opens the slip: Sleep, ${s8.date}, 8 hours`, s8.open && s8.shown === 'flex' && s8.title === 'Sleep' && /^Seaday, the 4th of Reaping, in the 27th year of the Peace · 9:40 pm/.test(s8.date) && s8.hrs === '8 hours' && s8.range === '8', s8);
check('the band marks now and the hour you wake', /NOW · 9:40 pm/.test(s8.dial) && /YOU WAKE · 5:40 am/.test(s8.dial) && /8 HOURS/.test(s8.dial), s8.dial);
check(`it says what eight hours give: wake 5:40 am, Skyday, the 5th of Reaping; health ${want.hp} → ${want.p8.hp}, mana ${want.mp} → ${want.p8.mp}; level ${want.lv + 1}`,
  /You wake at 5:40 am, Skyday, the 5th of Reaping\./.test(s8.out) && /a full night/.test(s8.out) && new RegExp(`Health ${want.hp} ${want.p8.hp} of ${want.mh}`).test(s8.out) && new RegExp(`Mana ${want.mp} ${want.p8.mp} of ${want.mm}`).test(s8.out) && new RegExp(`level ${want.lv + 1}`).test(s8.out), { out: s8.out, want });
await key('ArrowLeft'); for (let i = 0; i < 4; i++) await key('ArrowLeft');
const s3 = await slip();
check(`five ← make it 3 hours, a short sleep: health ${want.p3.hp}, mana ${want.p3.mp}, as restAtBed gives`, s3.hrs === '3 hours' && /You wake at 12:40 am, Skyday, the 5th of Reaping\./.test(s3.out) && /a short sleep/.test(s3.out) && new RegExp(`Health ${want.hp} ${want.p3.hp} `).test(s3.out) && new RegExp(`Mana ${want.mp} ${want.p3.mp} `).test(s3.out), s3.out);
await key('Digit1');
const sd = await slip();
check(`key 1 sets dawn exactly (${sd.hrs})`, sd.min === 500 && sd.hrs === '8 hours 20 minutes' && /YOU WAKE · 6:00 am/.test(sd.dial) && /Dawn/.test(sd.marks[0]), sd);
await key('Digit3');
const before = await page.evaluate(() => ({ abs: worldState.gameTimeAbsMinutes, lv: level }));
await page.evaluate(() => document.getElementById('sleep-go').click());
await page.waitForFunction((a) => worldState.gameTimeAbsMinutes - a >= 860, before.abs, { timeout: 30000 });
/* S2004 — the level comes on restAtBed's 900 ms timer after the wake's autosave: on a slow runner that took longer than a fixed
   1.5 s (the weekly run of 8 Nov read 1 → 1 and the next check read 2). Wait for it, up to 15 s; the check is unchanged. */
await page.waitForFunction((lv) => level > lv, before.lv, { timeout: 15000 }).catch(() => {});
const slept = await page.evaluate(() => ({ abs: worldState.gameTimeAbsMinutes, tod: worldState.gameTimeMinutes, hp: PHP, mh: effMaxHP(), lv: level, open: sleepOpen }));
check(`Sleep to noon (key 3) sleeps 14 h 20 min, fills health and takes the level (${before.lv} → ${slept.lv})`, slept.abs - before.abs >= 860 && slept.abs - before.abs < 875 && slept.hp === slept.mh && slept.lv === before.lv + 1 && !slept.open, { before, slept });

// waiting: any number of hours, nothing restored
await page.evaluate(() => { PHP = Math.round(effMaxHP() * .5); levelMarks = marksNeeded(); /* S952 — the level comes on marks */ openWaitMenu(); });
const w = await slip();
console.log('wait', JSON.stringify(w));
check(`the ⏳ opens the same slip, Wait, set to dawn (${w.hrs})`, w.open && w.title === 'Wait' && w.min === 18 * 60 && /YOU RISE · 6:00 am/.test(w.dial) && /Waiting restores nothing; a bed does\./.test(w.out) && /only sleep takes the level/.test(w.out), w);
await page.evaluate(() => { const r = document.getElementById('sleep-range'); r.value = '5'; r.dispatchEvent(new Event('input')); });
const w5 = await slip();
check('the slider waits by any hour: 5 hours, you rise at 5:00 pm', w5.hrs === '5 hours' && /You rise at 5:00 pm, Skyday, the 5th of Reaping\./.test(w5.out), w5.out);
const wb = await page.evaluate(() => ({ abs: worldState.gameTimeAbsMinutes, hp: PHP, lv: level }));
await key('Enter');
await page.waitForFunction((a) => worldState.gameTimeAbsMinutes - a >= 300, wb.abs, { timeout: 30000 }); await page.waitForTimeout(500);
const wa = await page.evaluate(() => ({ abs: worldState.gameTimeAbsMinutes, hp: PHP, lv: level, open: sleepOpen }));
check('Enter waits the five hours, restores nothing and takes no level', wa.abs - wb.abs >= 300 && wa.abs - wb.abs < 315 && wa.hp === wb.hp && wa.lv === wb.lv && !wa.open, { wb, wa });
await page.evaluate(() => openWaitMenu()); await key('Escape');
const esc = await page.evaluate((a) => ({ open: sleepOpen, shown: document.getElementById('sleepui').style.display, moved: worldState.gameTimeAbsMinutes - a }), wa.abs);
check('Esc leaves you as you were', !esc.open && esc.shown === 'none' && esc.moved < 15, esc);
// S2516: not while someone is talking to you. The dialogue is a panel at the foot of the screen and the ⏳ stays clickable above it; the
// guard read #dlg as shown 'flex', which the dialogue never sets ('block'), so time passed mid-conversation. A real click on the button.
const talk = await page.evaluate(() => { luOpen = false; document.getElementById('lu').style.display = 'none'; /* the level taken above leaves its page up */ const npc = NPC_DEF[Object.keys(NPC_DEF)[0]]; openDialog(npc); const b = document.getElementById('wait-btn').getBoundingClientRect();
  const x = b.x + b.width / 2, y = b.y + b.height / 2, top = document.elementFromPoint(x, y); return { npc: npc.name, open: dlgOpen, can: _canWait().ok, x, y, top: top && top.id }; });
await page.mouse.click(talk.x, talk.y); await g.frames(2);
const talk2 = await page.evaluate(() => { const r = { slip: sleepOpen, still: dlgOpen }; closeDialog(); r.after = _canWait().ok; return r; });
check(`not while someone is talking to you: the ⏳ (on top: ${talk.top}) opens no slip with ${talk.npc} speaking; free again once the talk ends`,
  talk.open && talk.top === 'wait-btn' && !talk.can && !talk2.slip && talk2.still && talk2.after, { talk, talk2 });
// S2591 — at 1,024 wide the ⏳ sits under the movement pad's empty third row, which took the top of every tap; the pad's box lets taps
// through and only its four buttons take them
const vw = page.viewportSize(); await page.setViewportSize({ width: 1024, height: 720 });
const pad = await page.evaluate(() => { const r = e => e.getBoundingClientRect(), b = r(document.getElementById('wait-btn')); let n = 0, on = 0;
  for (let y = b.top + 2; y < b.bottom - 1; y += 3) for (let x = b.left + 9; x < b.right - 8; x += 3) { n++; const t = document.elementFromPoint(x, y); if (t && t.id === 'wait-btn') on++; }
  const keys = [...document.querySelectorAll('#dp button')].map(e => { const k = r(e), t = document.elementFromPoint(k.left + k.width / 2, k.top + k.height / 2); return t === e; });
  return { n, on, keys, dp: [r(document.getElementById('dp')).top, r(document.getElementById('dp')).bottom], wait: [b.top, b.bottom] }; });
await page.setViewportSize(vw);
check(`at 1,024 wide every point of the ⏳ takes the tap (${pad.on} of ${pad.n}), under the pad's box; each of the pad's 4 buttons still takes its own`,
  pad.n > 50 && pad.on === pad.n && pad.wait[0] < pad.dp[1] && pad.keys.length === 4 && pad.keys.every(Boolean), pad);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
