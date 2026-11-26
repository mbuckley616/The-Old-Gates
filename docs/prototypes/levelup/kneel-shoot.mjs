// node docs/prototypes/levelup/kneel-shoot.mjs [--plan=camel] [--out=kneel-2703] (Session 2703): the camel's kneel (creatures.js' C.kneel under
// the gait 'couch') from the side, standing to couched in five steps (0, 0.25, 0.5, 0.75, 1), and one row three-quarter from the front.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), arg = (k, d) => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=') || d;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(here, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(launch), W = 1600, H = 760, plan = arg('plan', 'camel'), out = arg('out', 'kneel-2703');
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 }); page.on('pageerror', e => console.log('pageerror', String(e)));
await page.goto(`http://localhost:${port}/creatures.html?view=one&still&w=64&h=36`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 300000 });
await page.evaluate(async ({ plan, W, H }) => { const T = await import('three'), K = await import('./creatures.js');
  const R = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setSize(W, H); R.shadowMap.enabled = true; Object.assign(R.domElement.style, { position: 'fixed', left: 0, top: 0, zIndex: 99 }); document.body.appendChild(R.domElement);
  const S = new T.Scene(); S.background = new T.Color(0xcfc6b4); S.add(new T.HemisphereLight(0xfff4e0, 0x6a5a48, 1.6)); const sun = new T.DirectionalLight(0xffffff, 2.2); sun.position.set(6, 10, 8); sun.castShadow = true; Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 }); sun.shadow.mapSize.set(2048, 2048); S.add(sun);
  const gnd = new T.Mesh(new T.PlaneGeometry(60, 120), new T.MeshStandardMaterial({ color: 0xb59a72 })); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; S.add(gnd);
  const ks = [0, .25, .5, .75, 1], side = [], tq = [];
  ks.forEach((k, i) => { const C = K.build(K.genome(plan, plan + ':kneel')); C.gait = 'couch'; C.kneel = k < 1 ? k : null; K.pose(C, 0); C.rig.rotation.y = Math.PI / 2; C.rig.position.set((i - 2) * 3.4, 0, 2.2); C.rig.traverse(o => { if (o.isMesh) o.castShadow = true; }); S.add(C.rig); side.push(C.rig);
    const C2 = K.build(K.genome(plan, plan + ':kneel')); C2.gait = 'couch'; C2.kneel = k < 1 ? k : null; K.pose(C2, 0); C2.rig.rotation.y = Math.PI * .8; C2.rig.position.set((i - 2) * 3.4, 0, -40); C2.rig.traverse(o => { if (o.isMesh) o.castShadow = true; }); S.add(C2.rig); tq.push(C2.rig); });
  window.__render = (view) => { side.forEach(r => r.visible = !view); tq.forEach(r => r.visible = !!view); const cam = new T.PerspectiveCamera(24, W / H, .1, 200); if (view) { sun.position.set(6, 10, -32); sun.target.position.set(0, 0, -40); S.add(sun.target); cam.position.set(0, 3.2, -40 + 22); cam.lookAt(0, .8, -40); } else { cam.position.set(0, 2.6, 26); cam.lookAt(0, .8, 2.2); } R.render(S, cam); }; }, { plan, W, H });
const base = path.join(here, out + (plan === 'camel' ? '' : '-' + plan));
await page.evaluate(() => window.__render(0)); await page.screenshot({ path: base + '.jpg', type: 'jpeg', quality: 88 });
await page.evaluate(() => window.__render(1)); await page.screenshot({ path: base + '-front.jpg', type: 'jpeg', quality: 88 });
await browser.close(); srv.close(); console.log('wrote', out);
