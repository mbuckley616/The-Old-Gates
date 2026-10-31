// node docs/prototypes/levelup/legendary-sheet.mjs OUT.jpg COLS file.jpg=Label [file.jpg=Label ...] (concept, 31 Oct 2026): lays
// legendary-shoot.mjs's frames out as one sheet at 1920×1080, COLS across, each panel labelled. Paths are relative to this folder
// unless absolute; SRC=<dir> reads the frames from another folder.
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), src = process.env.SRC || here, [out, cols, ...jobs] = process.argv.slice(2), C = +cols, Rn = Math.ceil(jobs.length / C);
const cw = Math.floor(1920 / C), ch = Math.floor(1080 / Rn);
const cells = jobs.map(j => { const [f, ...l] = j.split('='); return `<div><img src="data:image/jpeg;base64,${fs.readFileSync(path.resolve(src, f)).toString('base64')}"><b>${l.join('=')}</b></div>`; }).join('');
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader'] }; if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const b = await chromium.launch(launch), p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.setContent(`<style>body{margin:0;background:#0d1014;display:grid;grid-template-columns:repeat(${C},${cw}px);grid-template-rows:repeat(${Rn},${ch}px)}div{position:relative;overflow:hidden;border:1px solid #0d1014;box-sizing:border-box}
img{width:100%;height:100%;object-fit:cover}b{position:absolute;left:10px;bottom:8px;color:#f3ead6;font:600 ${Rn > 2 ? 17 : 21}px system-ui;text-shadow:0 1px 3px #000}</style>${cells}`);
await p.screenshot({ path: path.resolve(here, out), type: 'jpeg', quality: 88 }); await b.close(); console.log(out);
