// The hour-change stall (critic, build s158): after each forceTime in Dunmore, one frame of 20–24 s on software GL,
// with the shader program count unchanged, read as programs being rebuilt. This counts, across hour jumps and across
// the natural dusk (17:59 → 18:00, 18:59 → 19:00 when the guards' torches light), every shader the GL context compiles,
// every program three.js adds, and the longest frame of the game's own loop (Session 233). What it found: nothing is
// rebuilt. The first dusk after arriving compiles a handful of new programs once, for what night brings into the scene
// (enemies, the guards' torches); every later change of hour compiles nothing. And the night watchman, going indoors
// at dawn, kept his torch lit all day where he went in: a hidden NPC was skipped before the torch line.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');
await page.evaluate(() => { forceTime(12); const S = WORLD.settle.get('dunmore'); px = S.site.x; pz = S.site.z + 4;
  const gl = REN.getContext(); window.__cs = 0; const o = gl.compileShader.bind(gl); gl.compileShader = s => { window.__cs++; return o(s); };
  window.__seen = new Set(REN.info.programs);
  window.__newProgs = () => { const out = []; for (const p of REN.info.programs) if (!__seen.has(p)) { __seen.add(p); const users = {}; let n = 0, foe = 0; scene.traverse(o => { if (!o.material || Array.isArray(o.material)) return; const pr = REN.properties.get(o.material); if (pr && pr.currentProgram === p) { let q = o, path = []; while (q && q !== scene && path.length < 4) { path.push(q.name || q.type); q = q.parent; } const k = (o.material.name || o.material.type) + ' on ' + path.join('<') + (o.isSkinnedMesh ? ' (skinned)' : ''); users[k] = (users[k] || 0) + 1; n++; if (__isFoe(o)) foe++; } }); const foeOnly = n > 0 && foe === n; if (foeOnly) __foeProgs++; out.push({ name: p.name, users, foeOnly }); } return out; };
  window.__foeProgs = 0; window.__isFoe = o => { for (let a = o; a; a = a.parent) if (ZE.some(e => e.mesh === a)) return true; return false; };
  window.__lights = () => { let n = 0; scene.traverseVisible(o => { if (o.isLight) n++; }); return n; };
});
// let the town finish streaming in at noon: a program compiled here is arrival, not the hour
let still = 0;
for (let i = 0; i < 40 && still < 4; i++) { const a = await page.evaluate(() => __cs); await page.waitForTimeout(1500); await g.frames(3); still = (await page.evaluate(() => __cs)) === a ? still + 1 : 0; }
const base = await page.evaluate(() => ({ added: __newProgs(), cs: __cs, progs: REN.info.programs.length, lights: __lights() }));
console.log('settled at noon', JSON.stringify(base));
const frames = async n => { let worst = 0; for (let i = 0; i < n; i++) { const t = Date.now(); await g.frames(1); worst = Math.max(worst, Date.now() - t); } return worst; };
const rows = [];
const step = async (label, fn, n = 12) => { await page.evaluate(fn); const worst = await frames(n);
  const s = await page.evaluate(() => ({ cs: __cs, progs: REN.info.programs.length, lights: __lights(), night: +_nightFactor().toFixed(2), torchLight: S_torchLight(), added: __newProgs(), torches: S_torches(), foeProgs: __foeProgs }));
  rows.push({ label, worst, ...s }); console.log(label, 'worst frame', worst, 'ms', JSON.stringify(s)); };
await page.evaluate(() => { window.S_torches = () => { const S = WORLD.settle.get('dunmore'); let n = 0; for (const p of (S && S.npcs) || []) if (p._torch && p._torch.visible) n++; return n; };
  window.S_torchLight = () => { const S = WORLD.settle.get('dunmore'); let n = 0; for (const p of (S && S.npcs) || []) if (p._torch && p._torch.userData.light.intensity > 0) n++; return n; }; });
const noon = await frames(12);
console.log('noon, no change: worst frame', noon, 'ms');
for (const h of [18, 23, 12, 6, 21, 12]) await step('jump to ' + h + 'h', `forceTime(${h})`);
await step('17:59', 'forceTime(17 + 59/60)', 6);
await step('17:59 → 18:00 by the clock', 'worldState.gameTimeMinutes += 1', 12);
await step('18:59', 'forceTime(18 + 59/60)', 6);
await step('18:59 → 19:00 by the clock', 'worldState.gameTimeMinutes += 1', 12);
const end = rows[rows.length - 1], firstNight = rows.find(r => r.label === 'jump to 23h');
// Session 299: a foe that turns up for the first time after the first night (the wolves' own skinned material, on the
// look branch's wolf kit) compiles its program when it first draws. That is arrival, as at noon above, not the hour, so
// programs used only by the zone's foes are set aside (two shaders each). Which foes spawn by night is chance.
const foeLater = end.foeProgs - firstNight.foeProgs;
check('after the first night, no change of hour compiles a shader (a newly arrived foe\u2019s aside)', end.cs - 2 * foeLater === firstNight.cs, { settled: base.cs, firstDusk: rows[0].cs, afterFirstNight: firstNight.cs, end: end.cs, foeLater });
check('no program added after the first night, but for a newly arrived foe\u2019s', end.progs - foeLater === firstNight.progs, { settled: base.progs, afterFirstNight: firstNight.progs, end: end.progs, foeLater });
check('the scene\u2019s light count never changed', rows.every(r => r.lights === base.lights), rows.map(r => r.lights));
const noons = rows.filter(r => r.label === 'jump to 12h');
check('the torches are lit at night and every one is out at noon, flame and light', firstNight.torches > 0 && noons.every(r => r.torches === 0 && r.torchLight === 0), rows.map(r => [r.label, r.torches, r.torchLight]));
const worst = Math.max(...rows.slice(1).map(r => r.worst));
console.log('the first dusk, compiling: worst frame', rows[0].worst, 'ms');
check('after the first dusk, no frame after a change of hour over 4× the worst noon frame (and never over 8 s)', worst <= Math.max(4 * noon, 2000) && worst < 8000, { worst, noon });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
