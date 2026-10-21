// node docs/prototypes/levelup/corruption-sheet.mjs <out> <cols> <file>=<label> ... (the concept artist, 20 Oct 2026): pictures from
// shoot.mjs --page=corruption.html laid out as one sheet 1920 wide, each panel 16:9 and named, -> <out>.jpg. As gates-sheet.mjs.
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), [out, cols, ...items] = process.argv.slice(2), C = +cols, w = Math.floor(1920 / C), h = Math.round(w * 9 / 16), rows = Math.ceil(items.length / C);
const cells = items.map(s => { const [f, n] = s.split('='); return `<div><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(here, f + '.jpg')).toString('base64')}"><b>${n}</b></div>`; }).join('');
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch), p = await b.newPage({ viewport: { width: C * w, height: rows * h } });
await p.setContent(`<style>body{margin:0;background:#0d1014;display:grid;grid-template-columns:repeat(${C},${w}px);grid-template-rows:repeat(${rows},${h}px)}div{position:relative;overflow:hidden}
img{width:${w}px;height:${h}px;object-fit:cover}b{position:absolute;left:12px;bottom:10px;color:#f3ead6;font:600 ${C > 3 ? 18 : 22}px system-ui;text-shadow:0 1px 3px #000}</style>${cells}`);
await p.screenshot({ path: path.join(here, out + '.jpg'), type: 'jpeg', quality: 88 }); await b.close(); console.log(out + '.jpg');
