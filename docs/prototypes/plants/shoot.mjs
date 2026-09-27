// node docs/prototypes/creatures/shoot.mjs -> docs/prototypes/plants-*.png (headless Chromium, software GL)
import { chromium } from 'playwright';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch);
const page = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
for (const v of (process.argv[2] || 'old,new,size,meadow-old,meadow-new').split(',')) {
  await page.goto('file://' + path.join(here, 'plants.html') + '#' + v); await page.reload();
  await page.waitForFunction(() => window.READY, null, { timeout: 60000 });
  console.log(v, JSON.stringify(await page.evaluate(() => window.INFO)));
  await page.screenshot({ path: path.join(here, '..', 'plants-' + v + '.png') });
}
console.log('errors', errs); await b.close();
