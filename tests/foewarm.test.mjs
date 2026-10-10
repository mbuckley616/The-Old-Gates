// The first foe of a kind compiled its shader programs on the frame it first drew: the first wolf, or what the first night
// brings, was a hitch on a GPU and seconds on software GL (Session 233, backlog D's owed prewarm). Session 688 builds one foe
// of every kind behind the world's loading fade and compiles their programs then (prewarmFoes). This suite settles Dunmore,
// waits until nothing more compiles, then raises every zone foe's kind beside you in the world's own scene and draws them:
// with the prewarm nothing compiles; with it held off (FOEWARM=0) the same foes compile their programs on that frame.
import { boot, check } from './lib/game.mjs';
const warm = process.env.FOEWARM !== '0';
const g = await boot(); const { page } = g;
if (!warm) await page.evaluate(() => { _foesWarm = true; });
await g.intoWorld();
const pw = await page.evaluate(() => _foesWarm);
console.log('prewarm', warm ? JSON.stringify(pw) : 'held off');
await g.settle('dunmore');
await page.evaluate(() => { forceTime(12); const S = WORLD.settle.get('dunmore'); px = S.site.x; pz = S.site.z + 4;
  const gl = REN.getContext(); window.__cs = 0; const o = gl.compileShader.bind(gl); gl.compileShader = s => { window.__cs++; return o(s); }; });
let still = 0;
for (let i = 0; i < 40 && still < 4; i++) { const a = await page.evaluate(() => __cs); await page.waitForTimeout(1500); await g.frames(3); still = (await page.evaluate(() => __cs)) === a ? still + 1 : 0; }
const base = await page.evaluate(() => ({ cs: __cs, progs: REN.info.programs.length }));
console.log('settled', JSON.stringify(base));
// every kind, in front of you, unlocked, in the world's scene, through the game's own builder
const raised = await page.evaluate(() => { const out = []; const kinds = Object.keys(ZONE_FOE_DEF);
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw); window.__raised = [];
  kinds.forEach((k, i) => { const r = 4 + (i % 6) * 1.5, s = (Math.floor(i / 6) - 2.5) * 1.6; const x = px + fx * r - fz * s, z = pz + fz * r + fx * s;
    const e = unlockFoe(buildZoneEnemy(WORLD.scene, [], x, z, k, null)); e.mesh.position.y = worldH(x, z); e.hpBg.visible = e.hpFg.visible = true; __raised.push(e); out.push(k); });
  return out; });
const t0 = Date.now(); await g.frames(4); const ms = Date.now() - t0;
const after = await page.evaluate(() => ({ cs: __cs, progs: REN.info.programs.length, drawn: __raised.filter(e => { let v = true; for (let a = e.mesh; a; a = a.parent) if (!a.visible) v = false; return v && e.mesh.parent; }).length }));
console.log('after raising', raised.length, 'kinds:', JSON.stringify(after), 'four frames', ms, 'ms');
if (warm) {
  check('the prewarm ran behind the first entry to the world, every kind', pw && pw.kinds === raised.length + 1 && pw.programs > 0, pw);
  check('every kind raised and drawn in the world', after.drawn === raised.length, { drawn: after.drawn, kinds: raised.length });
  check('raising every foe kind compiles no shader and adds no program', after.cs === base.cs && after.progs === base.progs, { before: base, after });
} else {
  check('held off: raising every foe kind compiles their programs on the frame they draw (the hitch)', after.cs > base.cs && after.progs > base.progs, { before: base, after });
}
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
