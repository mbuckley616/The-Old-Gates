// Photograph each 1280×720 screen of index.html, and pair today's reader, board and examine text with the proposed.
// node docs/prototypes/books/shoot-current.mjs  (once, needs the game)  then
// python3 docs/prototypes/books/build.py && node docs/prototypes/books/shoot.mjs
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const launch = {};
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 1320, height: 900 } });
await page.goto('file://' + path.join(here, 'index.html'));
await page.evaluate(() => Promise.all(['IM Fell English SC', 'EB Garamond', 'IM Fell English'].map(f => document.fonts.load(`16px "${f}"`)))); await page.waitForTimeout(1200);
console.log('fonts', (await page.evaluate(() => ['IM Fell English SC', 'EB Garamond', 'IM Fell English'].map(f => f + ':' + document.fonts.check(`16px "${f}"`)))).join(' '));
// a leaf whose text runs past its foot would be cut off in the game too: list them, for every page of every book
console.log('overflow', await page.evaluate(() => [...document.querySelectorAll('.leaf')].filter(e => e.scrollHeight > e.clientHeight + 1).map(e => e.textContent.slice(0, 40))));
console.log('fit', await page.evaluate(() => {
  const host = document.createElement('section'); host.className = 'screen inn'; host.style.position = 'absolute'; host.style.left = '-3000px'; document.body.appendChild(host);
  const out = []; for (const b of DATA.book.books) for (let i = 0; i < b.pages.length; i += 2) { spread(host, b, i); for (const l of host.querySelectorAll('.leaf')) {
    const used = [...l.children].filter(c => !c.classList.contains('fol') && !c.classList.contains('run')).reduce((m, c) => Math.max(m, c.offsetTop + c.offsetHeight), 0);
    out.push(`${b.id}:${i}:${Math.round(used)}/${l.clientHeight - 40}`); } }
  host.remove(); return out.join(' '); }));
for (const id of ['spread', 'letters', 'leaf', 'notice', 'examine']) await page.locator('#' + id).screenshot({ path: path.join(here, `${id}.png`) });
const src = f => 'data:image/png;base64,' + fs.readFileSync(path.join(here, f)).toString('base64');
for (const [out, a, b, la, lb] of [['compare-book.png', 'current-book.png', 'spread.png', 'Today (the book reader, build s429)', 'Proposed (A, the open book)'],
                                   ['compare-notice.png', 'current-notice.png', 'notice.png', 'Today (Hearthwick’s board)', 'Proposed (the board)'],
                                   ['compare-examine.png', 'current-examine.png', 'examine.png', 'Today (the keystones, on the same black page)', 'Proposed (the examine slip)']]) {
  await page.setViewportSize({ width: 1966, height: 600 });
  await page.setContent(`<body style="margin:0;background:#141008;font:18px Georgia;color:#e0c994;display:flex;gap:16px;padding:14px">
    <div><div style="margin:0 0 8px">${la}</div><img src="${src(a)}" style="width:960px;height:450px;object-fit:cover;object-position:top"></div>
    <div><div style="margin:0 0 8px">${lb}</div><img src="${src(b)}" style="width:960px;height:540px"></div></body>`);
  await page.screenshot({ path: path.join(here, out) });
}
await browser.close();
