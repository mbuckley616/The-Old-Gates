// node docs/prototypes/levelup/gates-sheet.mjs [cam] (the concept artist, 14 Oct 2026): the six gates-<school>-<cam>.jpg in one
// 3 × 2 sheet at 1920×1080, each panel named, -> gates-<cam>-six.jpg. The pictures come from shoot.mjs --page=gates.html.
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), cam = process.argv[2] || 'far';
const S = [['tine', 'Tine · fire'], ['uisce', 'Uisce · water'], ['cloch', 'Cloch · stone'], ['scath', 'Scáth · shadow'], ['solas', 'Solas · light'], ['gaoth', 'Gaoth · wind']];
const cells = S.map(([k, n]) => `<div><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(here, `gates-${k}-${cam}.jpg`)).toString('base64')}"><b>${n}</b></div>`).join('');
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch), p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.setContent(`<style>body{margin:0;background:#0d1014;display:grid;grid-template-columns:repeat(3,640px);grid-template-rows:repeat(2,540px)}div{position:relative;overflow:hidden}
img{width:960px;height:540px;margin-left:-160px;object-fit:cover}b{position:absolute;left:12px;bottom:10px;color:#f3ead6;font:600 22px system-ui;text-shadow:0 1px 3px #000}</style>${cells}`);
await p.screenshot({ path: path.join(here, `gates-${cam}-six.jpg`), type: 'jpeg', quality: 88 }); await b.close(); console.log('gates-' + cam + '-six.jpg');
