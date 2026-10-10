// Side-by-side plates: today's map (left) and the proposal (right), each cropped to the map pane, at the laptop's ratio.
// node docs/prototypes/worldmap/compare.mjs (after shoot-current.mjs and shoot.mjs)
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const p = await b.newPage({ viewport: { width: 1600, height: 560 }, deviceScaleFactor: 1 });
const uri = f => 'data:image/png;base64,' + fs.readFileSync(path.join(here, f)).toString('base64');
// the pane: 22..1043 × 62..496 css px at 1280×720; at ratio 2 the files are 2560×1440
const pairs = [['settled', 'current-settled-x2.png', 'proposed-settled.png', 'Where the map opens, once every tile has finished'],
  ['town', 'current-town-x2.png', 'proposed-town.png', 'Zoomed into Dunmore (×3.4)'],
  ['pan', 'current-pan-x2.png', 'proposed-pan.png', 'Dragged one province east: the first frame'],
  ['continent', 'current-continent-x2.png', 'proposed-continent.png', 'The whole continent']];
for (const [n, a, c, cap] of pairs) {
  await p.setContent(`<style>body{margin:0;background:#1b1610;font:15px Georgia,serif;color:#e8dcc0}.r{display:flex;gap:16px;padding:12px 16px}
  .f{width:776px}.f div{margin:0 0 6px}.c{width:776px;height:330px;overflow:hidden;position:relative;border:1px solid #5a4630}
  .c img{position:absolute;width:${2560 * 776 / 2042}px;left:${-22 * 776 / 1021}px;top:${-62 * 776 / 1021}px}h1{font:italic 600 18px Georgia;margin:12px 16px 0;color:#e8d8a0}</style>
  <h1>${cap}</h1><div class="r"><div class="f"><div>Today (build s482, a laptop screen)</div><div class="c"><img src="${uri(a)}"></div></div>
  <div class="f"><div>Proposed</div><div class="c"><img src="${uri(c)}"></div></div></div>`);
  await p.waitForTimeout(300); await p.screenshot({ path: path.join(here, `compare-${n}.png`), clip: { x: 0, y: 0, width: 1600, height: 410 } });
}
await b.close();
