// Photograph each 1280×720 screen of index.html, and pair today's counter and chest with the proposed.
// node docs/prototypes/trade/shoot-current.mjs  (once, needs the game)  then
// python3 docs/prototypes/trade/build.py && node docs/prototypes/trade/shoot.mjs
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
// rows that overflow their cell would be clipped in the game too: list them
console.log('overflow', await page.evaluate(() => [...document.querySelectorAll('.row .n, .row .st')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent)));
for (const id of ['ledger', 'reckon', 'qty', 'loot']) await page.locator('#' + id).screenshot({ path: path.join(here, `${id}.png`) });
const src = f => 'data:image/png;base64,' + fs.readFileSync(path.join(here, f)).toString('base64');
for (const [out, a, b, la, lb] of [['compare-shop.png', 'current-shop.png', 'ledger.png', 'Today (Lorcan’s Forge, build s348)', 'Proposed (A, the ledger)'],
                                   ['compare-loot.png', 'current-loot.png', 'loot.png', 'Today (a bandit’s chest, build s348)', 'Proposed (the chest’s slip)']]) {
  await page.setViewportSize({ width: 1966, height: 600 });
  await page.setContent(`<body style="margin:0;background:#141008;font:18px Georgia;color:#e0c994;display:flex;gap:16px;padding:14px">
    <div><div style="margin:0 0 8px">${la}</div><img src="${src(a)}" style="width:960px;height:450px;object-fit:cover;object-position:top"></div>
    <div><div style="margin:0 0 8px">${lb}</div><img src="${src(b)}" style="width:960px;height:540px"></div></body>`);
  await page.screenshot({ path: path.join(here, out) });
}
await browser.close();
