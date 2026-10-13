// node docs/prototypes/levelup/kit.check.mjs [--shots] (Session 807, B5): one genome format, one builder page, in the test Chromium.
// Every body plan's genome saves, loads back byte for byte and builds the same creature; kit.js reads a person's and a
// creature's and refuses anything else; the builder page opens on a creature with no people's pack, switches between a
// person and the plans, and its genome text, Apply and link carry either kind. The person half needs the pack (mh_pack.py);
// without it those checks are skipped, said so. --shots writes builder-creature-*.jpg.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.bin': 'application/octet-stream' };
const asked = []; // every path the pages fetched, to prove a creature never fetches the pack
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); asked.push(u); const f = path.join(here, u); if (!f.startsWith(here) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port, launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (!fs.existsSync(chromium.executablePath()) && fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = '/opt/pw-browsers/chromium';
const PACK = fs.existsSync(path.join(here, 'mh/pack.bin'));
const browser = await chromium.launch(launch); let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) fails++; };
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const open = async (q, w = 960, h = 540) => { const page = await browser.newPage({ viewport: { width: w, height: h } }); page.errs = []; page.on('pageerror', e => page.errs.push(String(e)));
  await page.goto(`http://localhost:${port}/builder.html?w=${w}&h=${h}&${q}`); await page.waitForFunction(() => window.__done || window.__err, null, { timeout: 600000 }); return page; };

// 1. the format: every plan, and the loader's refusals
{ const page = await open('plan=ironwolf&still');
  const r = await page.evaluate(async () => { const K = await import('./creatures.js'), Kit = await import('./kit.js'), out = { plans: {} };
    const hash = C => C.meshes.map(m => { let h = 0; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 5) h = (h * 31 + Math.round(a[i] * 1e5)) | 0; return m.name + ':' + h; }).join(' ');
    for (const plan of Object.keys(K.PLANS)) { const g = K.genome(plan, plan + ':kit:3'), s1 = JSON.stringify(K.toSaved(g)), r2 = Kit.readGenome(s1), s2 = JSON.stringify(Kit.saveGenome(r2.species, r2.G));
      const again = JSON.stringify(K.toSaved(K.genome(plan, plan + ':kit:3'))) === s1, b1 = hash(K.build(g)), b2 = hash(K.build(r2.G));
      out.plans[plan] = { bytes: s1.length, same: s1 === s2, again, species: r2.species, body: b1 === b2 }; }
    const bad = J => { try { Kit.readGenome(J); return false; } catch (e) { return e.message; } };
    const wolf = K.toSaved(K.genome('ironwolf', 'w'));
    out.refuse = { noSpecies: bad({ seed: 1 }), elf: bad({ ...wolf, species: 'elf' }), noPlan: bad({ ...wolf, plan: 'unicorn' }), v2: bad({ ...wolf, v: 2 }), garbage: bad('{nope') };
    const wild = Kit.readGenome({ ...wolf, sliders: { ...wolf.sliders, size: 40, leg: -3, wings: 2 }, tint: 9 }).G; out.clamped = { size: wild.sliders.size, leg: wild.sliders.leg, wings: 'wings' in wild.sliders, tint: wild.tint };
    out.made = await Kit.make(wolf).then(m => ({ species: m.species, root: !!m.root, bones: m.bones?.length })); return out; });
  for (const [plan, s] of Object.entries(r.plans)) check(`${plan}: saves as a creature genome (${s.bytes} bytes), loads back byte for byte, rolls the same from its key, builds the same body`, s.same && s.again && s.body && s.species === 'creature' && s.bytes < 400, s);
  check(`the format covers every plan (${Object.keys(r.plans).length})`, Object.keys(r.plans).length >= 23);
  check('kit.js refuses a genome with no species, an unknown species, an unknown plan, a later version, and text that is not JSON', Object.values(r.refuse).every(Boolean), r.refuse);
  check('a hand-edited creature genome is held to the sliders\' ranges and loses a slider the kit does not know', r.clamped.size === 3 && r.clamped.leg === .6 && !r.clamped.wings && r.clamped.tint === .5, r.clamped);
  check('kit.make builds a creature from its saved genome', r.made.species === 'creature' && r.made.root && r.made.bones > 5, r.made);
  check('no page errors (format)', page.errs.length === 0, page.errs.slice(0, 3)); await page.close(); }

// 2. the page on a creature: no pack fetched, the panel's controls, Apply and the link
{ asked.length = 0; const page = await open('plan=shatterhorn');
  const r = await page.evaluate(async () => { const B = window.__builder, out = {}; await new Promise(r => setTimeout(r, 200));
    out.start = { species: B.species, plan: B.genome.plan, kind: B.kind.value, text: JSON.parse(B.text.value).plan, bones: B.stats.bones };
    // a slider: size to 1.6; the genome and its text follow, and the body grows
    const box = () => B.creature.rig.scale.x;
    const s0 = box(), size = [...document.querySelectorAll('#panel .row')].find(r => r.querySelector('label').textContent === 'size').querySelector('input[type=range]');
    size.value = 1.6; size.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 600)); out.slider = { genome: B.genome.sliders.size, text: JSON.parse(B.text.value).sliders.size, scale0: +s0.toFixed(3), scale1: +box().toFixed(3) };
    // lock size, roll: a new seed, the size kept
    const lock = size.parentElement.querySelector('input[type=checkbox]'); lock.checked = true; lock.dispatchEvent(new Event('change'));
    const seed0 = B.genome.seed; [...document.querySelectorAll('#panel button')].find(b => b.textContent === 'Roll').click(); await new Promise(r => setTimeout(r, 300));
    out.roll = { seedChanged: B.genome.seed !== seed0, sizeKept: B.genome.sliders.size === 1.6 };
    // a gait button
    const gb = [...document.querySelectorAll('#panel button')].find(b => b.textContent === 'stand'); if (gb) gb.click(); out.gait = B.stats.gait;
    // the kind selector: to another plan
    B.kind.value = 'stormplume'; B.kind.dispatchEvent(new Event('change')); await new Promise(r => setTimeout(r, 400)); out.kind = { plan: B.genome.plan, species: B.species, text: JSON.parse(B.text.value).plan };
    // Apply text: a creature genome of another plan, then a broken one (refused, the creature kept)
    const J = { species: 'creature', v: 1, plan: 'tidecrab', seed: 77, sliders: { size: 1.2, leg: 1, bulk: 1, neck: 1, tail: 1, head: 1 }, tint: .1, light: 0 };
    B.text.value = JSON.stringify(J); [...document.querySelectorAll('#panel button')].find(b => b.textContent === 'Apply text').click(); await new Promise(r => setTimeout(r, 600));
    out.apply = { same: JSON.stringify(B.genome) === JSON.stringify(J), kind: B.kind.value };
    const ok = await B.load('{"species":"dragonfly"}'); out.refused = { ok, plan: B.genome.plan, stat: B.stat.textContent };
    // the link
    [...document.querySelectorAll('#panel button')].find(b => b.textContent === 'Copy link').click(); out.link = location.search; return out; });
  check('the page opens on a creature from ?plan, the kind selector and the text agree', r.start.species === 'creature' && r.start.plan === 'shatterhorn' && r.start.kind === 'shatterhorn' && r.start.text === 'shatterhorn', r.start);
  check('a creature never fetches the people\'s pack', !asked.some(u => u.startsWith('/mh/')), asked.filter(u => u.startsWith('/mh/')));
  check('the size slider changes the genome, its text and the body', r.slider.genome === 1.6 && r.slider.text === 1.6 && r.slider.scale1 > r.slider.scale0, r.slider);
  check('Roll with size locked takes a new seed and keeps the size', r.roll.seedChanged && r.roll.sizeKept, r.roll);
  check('a gait button sets the gait', r.gait === 'stand', r.gait);
  check('the kind selector changes the plan', r.kind.plan === 'stormplume' && r.kind.species === 'creature' && r.kind.text === 'stormplume', r.kind);
  check('Apply text loads a creature of another plan exactly', r.apply.same && r.apply.kind === 'tidecrab', r.apply);
  check('a genome of no known species is refused and the creature kept', r.refused.ok === false && r.refused.plan === 'tidecrab' && /Not loaded/.test(r.refused.stat), r.refused);
  check('Copy link puts the genome in the address', r.link.startsWith('?g='), r.link.slice(0, 20));
  check('no page errors (creature page)', page.errs.length === 0, page.errs.slice(0, 3));
  // the link opens the same creature in a fresh page
  const g = new URLSearchParams(r.link).get('g'); await page.close(); const p2 = await open('g=' + g + '&still'); const back = await p2.evaluate(() => window.__builder.genome);
  check('the link opens the same creature', JSON.stringify(back) === JSON.stringify(JSON.parse(Buffer.from(g, 'base64url').toString())) && back.plan === 'tidecrab', back); await p2.close(); }

// 3. one tool: a person and a creature on the same page, either way round (needs the pack)
if (!PACK) console.log('SKIP the person half: no pack (python3 docs/prototypes/levelup/mh_pack.py)');
else { const page = await open('plan=ironwolf');
  const r = await page.evaluate(async () => { const B = window.__builder, P = await import('./people.js'), out = {}, wait = ms => new Promise(r => setTimeout(r, ms));
    B.kind.value = 'human'; B.kind.dispatchEvent(new Event('change')); for (let i = 0; i < 200 && B.species !== 'human'; i++) await wait(100); await wait(300);
    out.toHuman = { species: B.species, saved: B.genome.species, person: !!B.person, creature: !!B.creature, kind: B.kind.value, face: !![...document.querySelectorAll('#panel h2')].find(h => h.textContent === 'Face') };
    const H = P.toSaved(P.rollGenome('kit:person', { people: 'gatelander' })); B.text.value = JSON.stringify(H);
    [...document.querySelectorAll('#panel button')].find(b => b.textContent === 'Apply text').click(); await wait(2500); out.applyHuman = JSON.stringify(B.genome) === JSON.stringify(H);
    const W = { species: 'creature', v: 1, plan: 'bear', seed: 5, sliders: { size: 1, leg: 1, bulk: 1.2, neck: 1, tail: 1, head: 1 }, tint: 0, light: 0 };
    await B.load(JSON.stringify(W)); out.toCreature = { species: B.species, same: JSON.stringify(B.genome) === JSON.stringify(W), person: !!B.person, kind: B.kind.value };
    await B.load(JSON.stringify(H)); out.back = { species: B.species, same: JSON.stringify(B.genome) === JSON.stringify(H), creature: !!B.creature };
    return out; });
  check('the kind selector turns a creature page into the human builder (its panel, a person, no creature left)', r.toHuman.species === 'human' && r.toHuman.saved === 'human' && r.toHuman.person && !r.toHuman.creature && r.toHuman.face, r.toHuman);
  check('Apply text takes a person\'s genome exactly', r.applyHuman);
  check('loading a creature\'s genome on the human page switches to it', r.toCreature.species === 'creature' && r.toCreature.same && !r.toCreature.person && r.toCreature.kind === 'bear', r.toCreature);
  check('and a person\'s back again', r.back.species === 'human' && r.back.same && !r.back.creature, r.back);
  check('no page errors (one tool)', page.errs.length === 0, page.errs.slice(0, 3)); await page.close(); }

if (process.argv.includes('--shots')) {
  const shot = async (name, q, w = 1280, h = 720) => { const page = await open(q, w, h); await page.evaluate(() => document.getElementById('note').style.display = 'none'); await page.waitForTimeout(300);
    fs.writeFileSync(path.join(here, 'builder-' + name + '.jpg'), await page.screenshot({ type: 'jpeg', quality: 88 })); console.log('shot', name, page.errs.slice(0, 2)); await page.close(); };
  await shot('creature-page', 'plan=shatterhorn');
  await shot('creature-dragon', 'plan=dragon&still&view=front');
  await shot('creature-octopus', 'plan=octopus&still');
}
await browser.close(); srv.close(); console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
