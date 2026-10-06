// The rest slip's head (Session 593; the critic, 6 Oct, s455): at 1280 × 720 in an inn the head read *Sleep*Stoneday, the 23rd
// of Reaping, … · La / Lanterne, Coeur de Vie: no space after the title, and the line broke in the middle of the inn's name. The
// title keeps its width and a gap of 12 from the date; the date aligns right; the place wraps whole.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const measure = (place) => page.evaluate((place) => { const was = ssPlaceName; window.ssPlaceName = () => place;
  worldState.gameTimeMinutes = 21 * 60 + 58; worldState.gameTimeAbsMinutes = 22 * 1440 + 21 * 60 + 58; openSleepUI();
  const t = document.getElementById('rs-title').getBoundingClientRect(), d = document.getElementById('sleep-date'), dr = d.getBoundingClientRect();
  const pl = d.querySelector('span'); const plRects = pl ? pl.getClientRects().length : 0;
  // the text of each line of the date, by the rects of its words
  const range = document.createRange(); range.selectNodeContents(d); const lines = new Set([...range.getClientRects()].map(r => Math.round(r.top)));
  const out = { text: d.textContent, gap: +(dr.left - t.right).toFixed(1), titleW: +t.width.toFixed(1), lines: lines.size, plRects, title: document.getElementById('rs-title').textContent };
  closeSleepUI(); window.ssPlaceName = was; return out; }, place);

const long = await measure('La Lanterne, Coeur de Vie');
const short = await measure('Dunmore');
console.log(JSON.stringify({ long, short }));
check('the long date: the title and the date stand 12 apart', long.gap >= 11.5 && long.title === 'Sleep', long);
check('the place wraps whole: its words on one line', long.plRects === 1 && / · La Lanterne, Coeur de Vie$/.test(long.text), long);
check('the title keeps its width whatever the date\'s length', Math.abs(long.titleW - short.titleW) < .5, { long: long.titleW, short: short.titleW });
check('a short place: the text as before, one line, the gap kept', /^Stoneday, the 23rd of Reaping, in the 27th year of the Peace · 9:58 pm · Dunmore$/.test(short.text) && short.gap >= 11.5 && short.lines === 1, short);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
