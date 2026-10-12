// node docs/prototypes/aurenne/shoot.mjs [views] -> docs/prototypes/aurenne/<view>.png (headless Chromium, software GL;
// three.js r128 is served from tests/vendor in place of cdnjs)
import { chromium } from 'playwright';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch);
const page = await b.newPage({ viewport: { width: 1280, height: 720 } });
await page.route('**/three.min.js', r => r.fulfill({ path: path.join(here, '..', '..', '..', 'tests', 'vendor', 'three.min.js'), contentType: 'text/javascript' }));
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
for (const v of (process.argv[2] || 'compare,street-today,street-a,street-b,street-c,front,side,top,scale').split(',')) {
  await page.goto('file://' + path.join(here, 'index.html') + '#' + v); await page.reload();
  await page.waitForFunction(() => window.READY, null, { timeout: 120000 });
  console.log(v, JSON.stringify(await page.evaluate(() => window.INFO)));
  await page.screenshot({ path: path.join(here, v + '.png') });
}
console.log('errors', errs); await b.close();
