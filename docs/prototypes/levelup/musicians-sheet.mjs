// node docs/prototypes/levelup/musicians-sheet.mjs (the concept artist, 19 Oct 2026): the fifteen musicians-solo-<inst>.jpg as one sheet,
// five a row, an island a row, each panel named -> musicians-players.jpg (1920×1080). The pictures come from shoot.mjs --page=musicians.html
// --name=musicians-solo-<inst> --q="view=solo&inst=<inst>&cam=tq".
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const ROWS = [['The Gatelands', [['fiddle', 'Fiddle'], ['whistle', 'Tin whistle'], ['bodhran', 'Bodhrán'], ['harp', 'Harp'], ['lute', 'Lute']]],
  ['The Mark', [['tagelharpa', 'Tagelharpa'], ['warhorn', 'War horn'], ['framedrum', 'Frame drum'], ['lyre', 'Bowed lyre'], ['boneflute', 'Bone flute']]],
  ['Aurenne', [['oud', 'Oud'], ['qanun', 'Qanun'], ['ney', 'Ney'], ['riq', 'Riq'], ['santur', 'Santur']]]];
const cells = ROWS.map(([isl, r]) => r.map(([k, n]) => `<div><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(here, `musicians-solo-${k}.jpg`)).toString('base64')}"><b>${n}</b><i>${isl}</i></div>`).join('')).join('');
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch), p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
// each solo is cropped to the player: the middle 46% of the frame's width, its upper 92%
await p.setContent(`<style>body{margin:0;background:#0d1014;display:grid;grid-template-columns:repeat(5,384px);grid-auto-rows:360px}div{position:relative;overflow:hidden}
img{height:400px;width:711px;margin-left:-190px;margin-top:-20px}b{position:absolute;left:10px;bottom:28px;color:#f3ead6;font:600 20px system-ui;text-shadow:0 1px 3px #000}
i{position:absolute;left:10px;bottom:8px;color:#d8ccb4;font:14px system-ui;text-shadow:0 1px 3px #000}</style>${cells}`);
await p.screenshot({ path: path.join(here, 'musicians-players.jpg'), type: 'jpeg', quality: 86 }); await b.close(); console.log('musicians-players.jpg');
