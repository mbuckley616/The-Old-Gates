// Photograph each 1280×720 screen of index.html, and pair today's Magic tab with the proposed page.
// python3 docs/prototypes/spellmaking/build.py && node docs/prototypes/spellmaking/shoot.mjs
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
for (const id of ['page', 'table', 'ring', 'hud']) await page.locator('#' + id).screenshot({ path: path.join(here, `${id}.png`) });
const src = f => 'data:image/png;base64,' + fs.readFileSync(path.join(here, f)).toString('base64');
await page.setContent(`<body style="margin:0;background:#141008;font:18px Georgia;color:#e0c994;display:flex;gap:16px;padding:14px">
  <div><div style="margin:0 0 8px">Today (the Magic tab, build s171)</div><img src="${src('current-hub-magic.png')}" style="width:960px;height:540px;object-fit:cover;object-position:top"></div>
  <div><div style="margin:0 0 8px">Proposed (A, the page)</div><img src="${src('page.png')}" style="width:960px;height:540px"></div></body>`);
await page.setViewportSize({ width: 1966, height: 600 });
await page.screenshot({ path: path.join(here, 'compare-page.png') });
await browser.close();
