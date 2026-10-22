// The hour-change stall (critic, build s158): after each forceTime in Dunmore, one frame of 20–24 s on software GL,
// with the shader program count unchanged, read as programs being rebuilt. This counts, across hour jumps and across
// the natural dusk (17:59 → 18:00, 18:59 → 19:00 when the guards' torches light), every shader the GL context compiles,
// every program three.js adds, and the longest frame of the game's own loop (Session 233). What it found: nothing is
// rebuilt. The first dusk after arriving compiles a handful of new programs once, for what night brings into the scene
// (enemies, the guards' torches); every later change of hour compiles nothing. And the night watchman, going indoors
// at dawn, kept his torch lit all day where he went in: a hidden NPC was skipped before the torch line.
// Session 357: the townsfolk's greeting bubble is the game's only Sprite, and its program compiles the first time two
// of them meet. On CI (ed2bce7) that fell at 18:59, after the first night: a first use, not a rebuild, so it is set
// aside with a newly arrived foe's.
// Session 1283: on three.js 0.170 a program's name is empty, so the bubble's is known by its users, every one a Sprite.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
await page.evaluate(() => { forceTime(12); const S = WORLD.settle.get('dunmore'); px = S.site.x; pz = S.site.z + 4;
  const gl = REN.getContext(); window.__cs = 0; const o = gl.compileShader.bind(gl); gl.compileShader = s => { window.__cs++; return o(s); };
  // Session 992: uploads counted too (buffers and textures), logged with each step: a long frame with no shader compiled is read by them
  window.__up = 0; for (const fn of ['bufferData', 'texImage2D', 'texSubImage2D', 'texStorage2D']) { const f = gl[fn] && gl[fn].bind(gl); if (f) gl[fn] = (...a) => { window.__up++; return f(...a); }; }
  window.__seen = new Set(REN.info.programs);
  window.__newProgs = () => { const out = []; for (const p of REN.info.programs) if (!__seen.has(p)) { __seen.add(p); const users = {}; let n = 0, foe = 0, spr = 0; scene.traverse(o => { if (!o.material || Array.isArray(o.material)) return; const pr = REN.properties.get(o.material); if (pr && pr.currentProgram === p) { let q = o, path = []; while (q && q !== scene && path.length < 4) { path.push(q.name || q.type); q = q.parent; } const k = (o.material.name || o.material.type) + ' on ' + path.join('<') + (o.isSkinnedMesh ? ' (skinned)' : ''); users[k] = (users[k] || 0) + 1; n++; if (__isFoe(o)) foe++; if (o.isSprite) spr++; } }); const foeOnly = (n > 0 && (foe === n || spr === n)) || p.name === 'SpriteMaterial'; if (foeOnly) __foeProgs++; out.push({ name: p.name, users, foeOnly }); } return out; };
  window.__foeProgs = 0; window.__isFoe = o => { for (let a = o; a; a = a.parent) if (ZE.some(e => e.mesh === a)) return true; return false; };
  window.__lights = () => { let n = 0; scene.traverseVisible(o => { if (o.isLight) n++; }); return n; };
});
// let the town finish streaming in at noon: a program compiled here is arrival, not the hour
let still = 0;
for (let i = 0; i < 40 && still < 4; i++) { const a = await page.evaluate(() => __cs); await page.waitForTimeout(1500); await g.frames(3); still = (await page.evaluate(() => __cs)) === a ? still + 1 : 0; }
const base = await page.evaluate(() => ({ added: __newProgs(), cs: __cs, progs: REN.info.programs.length, lights: __lights() }));
console.log('settled at noon', JSON.stringify(base));
// Session 1283: on the new look every frame here is 4.3–7.2 s, so the 120 frames it drew (12 a step and noon's) took 670 s of the
// 840, and CI killed the suite at 900. Drawn frame by frame, no frame stood out from its step's others: the stall this hunts
// is a rebuild inside the first render that sees the new hour, so a step now draws 4 frames (the minute before a dusk 2, noon 6).
// The checks and the caps are as they were.
const frames = async n => { let worst = 0; for (let i = 0; i < n; i++) { const t = Date.now(); await g.frames(1); worst = Math.max(worst, Date.now() - t); } return worst; };
const rows = [];
const step = async (label, fn, n = 4) => { const up0 = await page.evaluate(() => __up); await page.evaluate(fn); const worst = await frames(n);
  const s = await page.evaluate(() => ({ cs: __cs, progs: REN.info.programs.length, lights: __lights(), night: +_nightFactor().toFixed(2), torchLight: S_torchLight(), added: __newProgs(), torches: S_torches(), foeProgs: __foeProgs, uploads: __up }));
  s.uploads -= up0;
  rows.push({ label, worst, ...s }); console.log(label, 'worst frame', worst, 'ms', JSON.stringify(s)); };
await page.evaluate(() => { window.S_torches = () => { const S = WORLD.settle.get('dunmore'); let n = 0; for (const p of (S && S.npcs) || []) if (p._torch && p._torch.visible) n++; return n; };
  window.S_torchLight = () => { const S = WORLD.settle.get('dunmore'); let n = 0; for (const p of (S && S.npcs) || []) if (p._torch && p._torch.userData.light.intensity > 0) n++; return n; }; });
const noon = await frames(6);
console.log('noon, no change: worst frame', noon, 'ms');
for (const h of [18, 23, 12, 6, 21, 12]) await step('jump to ' + h + 'h', `forceTime(${h})`);
await step('17:59', 'forceTime(17 + 59/60)', 2);
await step('17:59 → 18:00 by the clock', 'worldState.gameTimeMinutes += 1');
await step('18:59', 'forceTime(18 + 59/60)', 2);
await step('18:59 → 19:00 by the clock', 'worldState.gameTimeMinutes += 1');
const end = rows[rows.length - 1], firstNight = rows.find(r => r.label === 'jump to 23h');
// Session 299: a foe that turns up for the first time after the first night (the wolves' own skinned material, on the
// look branch's wolf kit) compiles its program when it first draws. That is arrival, as at noon above, not the hour, so
// programs used only by the zone's foes are set aside (two shaders each). Which foes spawn by night is chance.
const foeLater = end.foeProgs - firstNight.foeProgs;
check('after the first night, no change of hour compiles a shader (a newly arrived foe\u2019s, or the first greeting bubble\u2019s, aside)', end.cs - 2 * foeLater === firstNight.cs, { settled: base.cs, firstDusk: rows[0].cs, afterFirstNight: firstNight.cs, end: end.cs, foeLater });
check('no program added after the first night, but for a newly arrived foe\u2019s or the first greeting bubble\u2019s', end.progs - foeLater === firstNight.progs, { settled: base.progs, afterFirstNight: firstNight.progs, end: end.progs, foeLater });
check('the scene\u2019s light count never changed', rows.every(r => r.lights === base.lights), rows.map(r => r.lights));
const noons = rows.filter(r => r.label === 'jump to 12h');
check('the torches are lit at night and every one is out at noon, flame and light', firstNight.torches > 0 && noons.every(r => r.torches === 0 && r.torchLight === 0), rows.map(r => [r.label, r.torches, r.torchLight]));
// Session 362: on CI (5633fc4) the one frame over 8 s (8.5 s at 6h, noon's worst 3.3 s) was the step in which a foe's
// skinned material compiled on its first draw: the arrival the two checks above set aside, not the hour. A step in
// which a foe's or the bubble's program first appeared is set aside here too, and named.
const firstUse = rows.map((r, i) => i > 0 && r.foeProgs > rows[i - 1].foeProgs);
const judged = rows.slice(1).filter((r, i) => !firstUse[i + 1]);
const worst = Math.max(...judged.map(r => r.worst));
console.log('the first dusk, compiling: worst frame', rows[0].worst, 'ms; set aside for a first use:', rows.filter((r, i) => firstUse[i]).map(r => `${r.label} ${r.worst} ms`).join(', ') || 'none');
// Session 483: on CI (f8551e4) every frame was 4.5–5.9 s, noon's worst 5.2 s, and 18:59 took 8.6 s with nothing compiled
// (the shader count unchanged): a runner that slow outruns a fixed 8 s. The cap is 8 s or twice noon's worst, whichever
// is more; the stall this hunts was 20–24 s, five times an ordinary frame or more.
// Session 831: or twice the median of the judged steps. Two runs side by side here: noon's 12 frames, read once at the start,
// were 5.3 s at worst, the steps' worst frames 6.4–8.6 s, and the second jump to noon 12.1 s with nothing compiled and no
// program added; a cap of 10.6 s failed it. The steps' own median (7.2 s) gives 14.4 s, and the 20–24 s stall still fails.
const med = (a => a[a.length >> 1])(judged.map(r => r.worst).sort((x, y) => x - y));
// Session 992: the 4× is of the ordinary frame, the larger of noon's and the steps' median. Noon is read once, before the first
// dusk, and on a loaded runner every step after it runs slower: on CI (main f84061f) noon's worst was 1.7 s and the steps' 4.7–5.8 s,
// so 17:59 → 18:00 at 7.8 s, nothing compiled, failed 4× noon (6.9 s) under a cap of 10.6 s; alone here the old look's 23h step,
// 7.4 s against noon's 1.76 s, the same. The cap is unchanged, and the 20–24 s stall still fails it.
const cap = Math.max(8000, 2 * noon, 2 * med), ordinary = Math.max(noon, med);
check('after the first dusk, no frame after a change of hour over 4× an ordinary frame (the larger of noon\u2019s and the steps\u2019 median; and never over 8 s, or 2× that on a slow runner), a first use aside', judged.length >= rows.length - 3 && worst <= Math.max(4 * ordinary, 2000) && worst < cap, { worst, noon, med, ordinary, cap, judged: judged.length, setAside: rows.filter((r, i) => firstUse[i]).map(r => [r.label, r.worst]) });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
