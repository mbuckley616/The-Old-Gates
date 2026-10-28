// node docs/prototypes/levelup/herbs-sheet.mjs <out> <cols> <file|caption> ... (concept, 28 Oct 2026): herbs-*.jpg panels in one
// 1920x1080 sheet, each named; herbs-options.jpg is the nine fields (island by row, A B C by column), herbs-close.jpg four close-ups.
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), [out, cs, ...ims] = process.argv.slice(2), cols = +cs, rows = Math.ceil(ims.length / cols), cw = 1920 / cols, rh = Math.floor(1080 / rows);
const cells = ims.map(f => { const [p, n] = f.split('|'); return `<div><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(here, p)).toString('base64')}"><b>${n}</b></div>`; }).join('');
const launch = {}; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch), pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.setContent(`<style>body{margin:0;background:#0d1014;display:grid;grid-template-columns:repeat(${cols},${cw}px);grid-template-rows:repeat(${rows},${rh}px)}div{position:relative;overflow:hidden;outline:1px solid #0d1014}img{width:${cw}px;height:${rh}px;object-fit:cover}b{position:absolute;left:10px;bottom:8px;color:#f3ead6;font:600 ${cols > 2 ? 18 : 22}px system-ui;text-shadow:0 1px 3px #000}</style>${cells}`);
await pg.screenshot({ path: path.join(here, out), type: 'jpeg', quality: 88 }); await b.close(); console.log(out);
