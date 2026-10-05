// Session 532 (Michael's A on DECISION #142, the concept artist's prototype `docs/prototypes/rest/` on auto/concept): one
// rest slip for a bed and for waiting. The day drawn as a band with NOW and the hour you wake; a slider of 1–24 hours and
// today's five times as marks (keys 1–5) that set it to that hour exactly; what the rest gives, by restAtBed's rule, before
// you take it. Waiting goes by any number of hours (it went only to the five times), restores nothing, and takes no level.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const key = (code) => page.evaluate((code) => window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })), code);
const slip = () => page.evaluate(() => { const q = id => document.getElementById(id); return { open: sleepOpen, shown: q('sleepui').style.display, title: q('rs-title').textContent,
  date: q('sleep-date').textContent, hrs: q('sleep-hrs').textContent, range: q('sleep-range').value, out: q('rs-out').innerText.replace(/\s+/g, ' ').trim(),
  dial: q('rs-dial').textContent.replace(/\s+/g, ' ').trim(), marks: [...q('rs-marks').querySelectorAll('button')].map(b => b.textContent.trim()), min: restSlip.min }; });

// 9:40 pm on day 4, hurt, ready to level
await page.evaluate(() => { ZE.forEach(e => { if (e && !e.dead) e.locked = true; });
  worldState.gameTimeMinutes = 21 * 60 + 40; worldState.gameTimeAbsMinutes = 3 * 1440 + 21 * 60 + 40;
  PHP = Math.round(effMaxHP() * .5); mana = Math.round(effMaxMana() * .4); xp = xpNext; openSleepUI(); });
const s8 = await slip();
const want = await page.evaluate(() => ({ p8: restPreview(8), p3: restPreview(3), mh: effMaxHP(), mm: effMaxMana(), hp: PHP, mp: mana, lv: level }));
console.log('sleep 8', JSON.stringify(s8));
check(`a bed opens the slip: Sleep, ${s8.date}, 8 hours`, s8.open && s8.shown === 'flex' && s8.title === 'Sleep' && /^Day 4 · 9:40 pm/.test(s8.date) && s8.hrs === '8 hours' && s8.range === '8', s8);
check('the band marks now and the hour you wake', /NOW · 9:40 pm/.test(s8.dial) && /YOU WAKE · 5:40 am/.test(s8.dial) && /8 HOURS/.test(s8.dial), s8.dial);
check(`it says what eight hours give: wake 5:40 am, Day 5; health ${want.hp} → ${want.p8.hp}, mana ${want.mp} → ${want.p8.mp}; level ${want.lv + 1}`,
  /You wake at 5:40 am, Day 5\./.test(s8.out) && /a full night/.test(s8.out) && new RegExp(`Health ${want.hp} ${want.p8.hp} of ${want.mh}`).test(s8.out) && new RegExp(`Mana ${want.mp} ${want.p8.mp} of ${want.mm}`).test(s8.out) && new RegExp(`level ${want.lv + 1}`).test(s8.out), { out: s8.out, want });
await key('ArrowLeft'); for (let i = 0; i < 4; i++) await key('ArrowLeft');
const s3 = await slip();
check(`five ← make it 3 hours, a short sleep: health ${want.p3.hp}, mana ${want.p3.mp}, as restAtBed gives`, s3.hrs === '3 hours' && /You wake at 12:40 am, Day 5\./.test(s3.out) && /a short sleep/.test(s3.out) && new RegExp(`Health ${want.hp} ${want.p3.hp} `).test(s3.out) && new RegExp(`Mana ${want.mp} ${want.p3.mp} `).test(s3.out), s3.out);
await key('Digit1');
const sd = await slip();
check(`key 1 sets dawn exactly (${sd.hrs})`, sd.min === 500 && sd.hrs === '8 hours 20 minutes' && /YOU WAKE · 6:00 am/.test(sd.dial) && /Dawn/.test(sd.marks[0]), sd);
await key('Digit3');
const before = await page.evaluate(() => ({ abs: worldState.gameTimeAbsMinutes, lv: level }));
await page.evaluate(() => document.getElementById('sleep-go').click());
await page.waitForFunction((a) => worldState.gameTimeAbsMinutes - a >= 860, before.abs, { timeout: 30000 });
await page.waitForTimeout(1500);
const slept = await page.evaluate(() => ({ abs: worldState.gameTimeAbsMinutes, tod: worldState.gameTimeMinutes, hp: PHP, mh: effMaxHP(), lv: level, open: sleepOpen }));
check(`Sleep to noon (key 3) sleeps 14 h 20 min, fills health and takes the level (${before.lv} → ${slept.lv})`, slept.abs - before.abs >= 860 && slept.abs - before.abs < 875 && slept.hp === slept.mh && slept.lv === before.lv + 1 && !slept.open, { before, slept });

// waiting: any number of hours, nothing restored
await page.evaluate(() => { PHP = Math.round(effMaxHP() * .5); xp = xpNext; openWaitMenu(); });
const w = await slip();
console.log('wait', JSON.stringify(w));
check(`the ⏳ opens the same slip, Wait, set to dawn (${w.hrs})`, w.open && w.title === 'Wait' && w.min === 18 * 60 && /YOU RISE · 6:00 am/.test(w.dial) && /Waiting restores nothing; a bed does\./.test(w.out) && /only sleep takes the level/.test(w.out), w);
await page.evaluate(() => { const r = document.getElementById('sleep-range'); r.value = '5'; r.dispatchEvent(new Event('input')); });
const w5 = await slip();
check('the slider waits by any hour: 5 hours, you rise at 5:00 pm', w5.hrs === '5 hours' && /You rise at 5:00 pm, Day 5\./.test(w5.out), w5.out);
const wb = await page.evaluate(() => ({ abs: worldState.gameTimeAbsMinutes, hp: PHP, lv: level }));
await key('Enter');
await page.waitForFunction((a) => worldState.gameTimeAbsMinutes - a >= 300, wb.abs, { timeout: 30000 }); await page.waitForTimeout(500);
const wa = await page.evaluate(() => ({ abs: worldState.gameTimeAbsMinutes, hp: PHP, lv: level, open: sleepOpen }));
check('Enter waits the five hours, restores nothing and takes no level', wa.abs - wb.abs >= 300 && wa.abs - wb.abs < 315 && wa.hp === wb.hp && wa.lv === wb.lv && !wa.open, { wb, wa });
await page.evaluate(() => openWaitMenu()); await key('Escape');
const esc = await page.evaluate((a) => ({ open: sleepOpen, shown: document.getElementById('sleepui').style.display, moved: worldState.gameTimeAbsMinutes - a }), wa.abs);
check('Esc leaves you as you were', !esc.open && esc.shown === 'none' && esc.moved < 15, esc);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
