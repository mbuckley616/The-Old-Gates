// Session 2174 — The Last Entry (the quest writer's draft, approved by Michael 14 Oct 2026; docs/quest_drafts.md): after the unbound
// ending, Varek's list lies in the crypt of the new game, one cell before the open sarcophagus. A game begun any other way has no
// paper; ending('unbound') carries the deaths and the list in og_carry; the new game lays it, E takes it with the pickup's line and
// nothing in the log, and the reader opens it bare, its last fold the back's one line by the deaths carried (three, in words).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
const toCrypt = async () => {
  await page.click('#sb');
  await page.waitForFunction(() => getComputedStyle(document.getElementById('cc-modal')).display !== 'none', null, { timeout: 60000 }).catch(() => {});
  await page.evaluate(() => ccBegin());
  await page.waitForFunction(() => document.getElementById('fd').style.opacity === '0' && activeZoneId === 'dungeon' && scene === dScene, null, { timeout: 60000 }).catch(() => {});
  await g.hide();
};

// a game begun from the title: no paper
await toCrypt();
const plain = await page.evaluate(() => ({ zone: activeZoneId, tut: !!(currentPortal && currentPortal.tutorial), lie: !!VLIST_LIE, list: worldState.varekList || null }));
console.log(JSON.stringify(plain));
check('a game begun from the title: in the crypt, and no paper laid', plain.zone === 'dungeon' && !plain.lie && !plain.list, plain);

// the unbound ending carries the deaths and the list
const carry = await page.evaluate(() => { vstate().deaths = 3; ending('unbound'); return JSON.parse(localStorage.getItem('og_carry') || 'null'); });
console.log(JSON.stringify({ deaths: carry && carry.deaths, list: carry && carry.list }));
check('ending(\'unbound\') writes og_carry with deaths 3 and list', !!carry && carry.deaths === 3 && carry.list === true, carry);

// the new game: the paper before the sarcophagus
g.errs.length = 0; await page.reload();
await page.waitForFunction(() => typeof ccBegin === 'function' && getComputedStyle(document.getElementById('sb')).display !== 'none', null, { timeout: 120000 });
await toCrypt();
const laid = await page.evaluate(() => { const sp = currentPortal._tutorialSpawn, L = VLIST_LIE;
  return { list: worldState.varekList, lie: !!L, d: L ? +Math.hypot(L.x - sp.x, L.z - sp.z).toFixed(2) : null, cell: DCELL, inScene: !!(L && L.mesh && L.mesh.parent) }; });
console.log(JSON.stringify(laid));
check(`the new game: worldState.varekList laid with n 3, the paper in the scene ${laid.d} m from the sarcophagus (a cell is ${laid.cell} m)`,
  laid.list && laid.list.n === 3 && laid.list.state === 'laid' && laid.lie && laid.inScene && laid.d > 0 && laid.d <= laid.cell * 1.5, laid);

const took = await page.evaluate(() => { const L = VLIST_LIE; px = L.x + .3; pz = L.z; currentFloor = 1;
  const shown = [], keep = showMsg; showMsg = (m, c) => { shown.push(m); return keep(m, c); }; const logs0 = GAME_LOG.length;
  const near = varekListNear(); interact(); showMsg = keep;
  const i = BAG.findIndex(b => b && b.bookId === 'worn_paper'); const it = BAG[i];
  return { near, shown, logs: GAME_LOG.length - logs0, i, name: it && it.name, weight: it && it.weight, state: worldState.varekList.state, lie: !!VLIST_LIE }; });
console.log(JSON.stringify(took));
check('E at it: in the bag as *Worn Paper*, 0.1, the state taken, the paper gone from the floor', took.near && took.i >= 0 && took.name === 'Worn Paper' && took.weight === .1 && took.state === 'taken' && !took.lie, took);
check(`the pickup's line alone (*${took.shown.join(' | ')}*), and nothing in the log`, took.shown.length === 1 && took.shown[0] === 'Took the worn paper.' && took.logs === 0, took);

const read = await page.evaluate(() => { const logs0 = GAME_LOG.length, i = BAG.findIndex(b => b && b.bookId === 'worn_paper'); openBookReader(i);
  const title = document.getElementById('book-title').textContent, pag = document.getElementById('book-pagination').textContent, first = document.getElementById('book-page').textContent;
  const n = _bookState.bookDef.pages.length; _bookState.page = n - 1; renderBookPage(); const last = document.getElementById('book-page').textContent.trim();
  const P = document.getElementById('book-page'), hand = k => { _bookState.page = k; renderBookPage(); const W = [...P.querySelectorAll(':scope > span:not(.bk-blot)')];
    return { words: W.length, skew: W.length ? (W[0].style.transform.match(/skewX\(([-\d.]+)deg\)/) || [])[1] : null, ls: P.style.letterSpacing, ink: P.querySelectorAll('.bk-blot svg path').length }; };
  const hands = [0, 3, 6, 7].map(hand);
  _bookState.page = 4; renderBookPage(); const fifth = document.getElementById('book-page').textContent; const fifthInk = P.querySelectorAll('.bk-blot svg path').length;
  if (globalThis.__shot) { _bookState.page = 6; renderBookPage(); } else closeBookReader();
  return { title, pag, first: first.slice(0, 40), n, last, blots: (fifth.match(/—/g) || []).length, braces: /\{/.test(fifth), logs: GAME_LOG.length - logs0, hands, fifthInk }; });
console.log(JSON.stringify(read));
check('the reader: no title, no folios, eight folds, the first *First year after the stone*', read.title === '' && read.pag === '' && read.n === 8 && read.first.startsWith('First year after the stone, at the hay.'), read);
check(`the back: *${read.last}*`, read.last === 'Died three times. Stood up three times. Where do you go?', read);
check(`the fifth fold's blots read as dashes (${read.blots}), and nothing in the log for reading it`, read.blots === 12 && !read.braces && read.logs === 0, read);
// S2176 — the reader draws the worn hand: fold 1 is the neat hand (no leaning words, the page's own spacing), the hand worsens to fold 7
// (every word leaning 9°, the letters .14 em apart) and the back is steady again; each blot an ink stroke over a hidden dash
const H = read.hands;
check(`the hand wears by the fold: neat (${H[0].words} words set apart, ${H[0].ls}), fold 4 ${H[1].skew}°, fold 7 ${H[2].skew}° at ${H[2].ls}, the back neat; the fifth's ${read.fifthInk} blots inked, fold 7's ${H[2].ink}`,
  H[0].words === 0 && parseFloat(H[0].ls) === .02 && +H[1].skew < 0 && +H[1].skew > +H[2].skew && +H[2].skew === -9 && parseFloat(H[2].ls) === .14 && H[3].words === 0 && read.fifthInk === 12 && H[2].ink === 3, H);

const backs = await page.evaluate(() => [0, 1, 2, 21, 99, 140].map(vlistBack));
console.log(JSON.stringify(backs));
check('the back by the count: none, once, two, twenty-one, ninety-nine, 140', backs[0] === 'Has not died. I would have known.' && backs[1] === 'Died once. Stood up once. Where do you go?'
  && backs[2] === 'Died two times. Stood up two times. Where do you go?' && backs[3].startsWith('Died twenty-one times.') && backs[4].startsWith('Died ninety-nine times.') && backs[5].startsWith('Died 140 times.'), backs);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
