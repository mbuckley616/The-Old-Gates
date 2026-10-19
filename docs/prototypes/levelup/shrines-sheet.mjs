// node docs/prototypes/levelup/shrines-sheet.mjs (the concept artist, 18 Oct 2026): the three shrines-guest-<island>.jpg side by side at
// 1920×1080, each panel named, -> shrines-guest.jpg. The pictures come from shoot.mjs --page=shrines.html --q="view=row&island=…&cam=guest".
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const S = [['gatelands', 'The Gatelands · struck'], ['mark', 'The Mark · struck'], ['aurenne', 'Aurenne · bricked and plastered']];
const cells = S.map(([k, n]) => `<div><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(here, `shrines-guest-${k}.jpg`)).toString('base64')}"><b>${n}</b></div>`).join('');
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch), p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.setContent(`<style>body{margin:0;background:#0d1014;display:grid;grid-template-columns:repeat(3,640px);height:1080px}div{position:relative;overflow:hidden}
img{height:1080px;width:1920px;margin-left:-640px}b{position:absolute;left:14px;bottom:14px;color:#f3ead6;font:600 24px system-ui;text-shadow:0 1px 3px #000}</style>${cells}`);
await p.screenshot({ path: path.join(here, 'shrines-guest.jpg'), type: 'jpeg', quality: 88 }); await b.close(); console.log('shrines-guest.jpg');
