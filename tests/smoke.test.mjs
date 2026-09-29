// Chimney smoke on the world's wind (Session 343, Michael's B on #63): each detailed house records its chimney's top; a town
// draws all its smoke as one Points object that rises, drifts along windDir() and fades; by the hearth's hours — the inn, the
// smithy and the guild halls always, homes morning and evening with a thin thread between and cold at night, every chimney in
// snow or the tundra; a storm lays the plume flat without breaking it into beads.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
fs.mkdirSync('tests/out', { recursive: true });
await page.evaluate(() => { WORLD.wx.timer = 1e9; WORLD.wx.type = WORLD.wx.next = 'clear'; WORLD.wx.k = 1; WORLD.wx.storm = 0; });

const town = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), P = S.smoke;
  const types = {}; S.chimneys.forEach(c => types[c.t] = (types[c.t] || 0) + 1);
  const onRoofs = S.chimneys.every(c => c.y - WORLD.worldH(c.x, c.z) > 3 && c.y - WORLD.worldH(c.x, c.z) < 12);
  const inLots = S.chimneys.every(c => S.sol.some(b => { if (b.c == null) return false; const dx = c.x - b.cx, dz = c.z - b.cz, u = dx * b.c - dz * b.s, v = dx * b.s + dz * b.c; return Math.abs(u) < b.rx + .5 && Math.abs(v) < b.rz + .5 || Math.abs(v) < b.rx + .5 && Math.abs(u) < b.rz + .5; }));
  return { n: S.chimneys.length, types, onRoofs, inLots, pts: !!P && P.isPoints, count: P && P.geometry.attributes.position.count, inGroup: P && P.parent === S.group,
    smokes: [...WORLD.settle.values()].filter(T => T.smoke).length, rel: P && Math.hypot(P.position.x - S.site.x, P.position.z - S.site.z) }; });
console.log(JSON.stringify(town));
check('Dunmore\'s detailed houses record their chimneys, on the roofs of their own lots', town.n >= 12 && town.onRoofs && town.inLots, town);
check('the town\'s smoke is one Points object in its group, 24 puffs a chimney, placed at the town\'s centre', town.pts && town.inGroup && town.count === town.n * 24 && town.rel < 1e-6, [town.count, town.n, town.rel]);

// the hearth's hours, as a rule and live (the strength eases in over a few seconds)
const rule = await page.evaluate(() => { const f = (t, h, cold) => WORLD.smokeWant({ t }, h, cold);
  return { home7: f('home', 7), home13: f('home', 13), home19: f('home', 19), home2: f('home', 2), inn2: f('inn', 2), smith2: f('weapon', 2), guild2: f('guild_m', 2), homeSnow2: f('home', 2, true) }; });
check('the rule: homes full 6–9 and 17–23, a thread (.3) 9–17, cold at night; the inn, the smithy and the guild halls always; all in snow', rule.home7 === 1 && rule.home19 === 1 && rule.home13 === .3 && rule.home2 === 0 && rule.inn2 === 1 && rule.smith2 === 1 && rule.guild2 === 1 && rule.homeSnow2 === 1, rule);
const live = async h => { await page.evaluate(h => forceTime(h), h); await g.spin(null, 900);
  return page.evaluate(() => { const S = WORLD.settle.get('dunmore'), a = S.smoke.geometry.attributes.aAlpha.array, K = 24, by = {};
    S.chimneys.forEach((c, ci) => { let s = 0; for (let k = 0; k < K; k++) s += a[ci * K + k]; (by[c.t === 'home' ? 'home' : 'trade'] = by[c.t === 'home' ? 'home' : 'trade'] || []).push(s / K); });
    const m = v => v && +(v.reduce((x, y) => x + y, 0) / v.length).toFixed(3); return { home: m(by.home), trade: m(by.trade), vis: S.smoke.visible }; }); };
const at7 = await live(7), at13 = await live(13), at2 = await live(2);
await page.evaluate(() => { WORLD.wx.type = WORLD.wx.next = 'snow'; }); const snow2 = await live(2); await page.evaluate(() => { WORLD.wx.type = WORLD.wx.next = 'clear'; });
console.log(JSON.stringify({ at7, at13, at2, snow2 }));
check('live: homes smoke at breakfast, a thread at noon, nothing at 2 a.m.; the trades still smoke at 2; in snow the homes do too', at7.vis && at7.home > .1 && at13.home > at7.home * .15 && at13.home < at7.home * .5 && at2.home < .005 && (at2.trade == null || at2.trade > .1) && snow2.home > .1, { at7, at13, at2, snow2 });

// the wind: every chimney's plume leans along (sin w, cos w), and turns with it
const lean = async () => { await g.spin(null, 120); return page.evaluate(() => { const S = WORLD.settle.get('dunmore'), P = S.smoke, p = P.geometry.attributes.position.array, a = P.geometry.attributes.aAlpha.array, K = 24;
  let sx = 0, sz = 0, rise = 0, n = 0, far = 0; S.chimneys.forEach((c, ci) => { for (let k = 0; k < K; k++) { const i = ci * K + k; if (a[i] < .02) continue; const dx = p[i * 3] + P.position.x - c.x, dz = p[i * 3 + 2] + P.position.z - c.z; sx += dx; sz += dz; rise = Math.max(rise, p[i * 3 + 1] - c.y); far = Math.max(far, Math.hypot(dx, dz)); n++; } });
  const w = WORLD.windDir(), L = Math.hypot(sx, sz) || 1; return { w: +w.toFixed(3), dot: +((sx * Math.sin(w) + sz * Math.cos(w)) / L).toFixed(3), n, rise: +rise.toFixed(2), far: +far.toFixed(2) }; }); };
await page.evaluate(() => forceTime(7)); const l0 = await lean();
await page.evaluate(() => { const w0 = WORLD.windDir(); for (let k = 0; k < 40 && Math.abs(WORLD.windDir() - w0) < .8; k++) worldState.gameTimeAbsMinutes += 60 * 3; }); const l1 = await lean();
check('the smoke leans downwind (mean drift along windDir within 15°), and follows the wind round when it turns', l0.dot > .96 && l1.dot > .96 && Math.abs(l1.w - l0.w) > .3, { l0, l1 });
await page.evaluate(() => { WORLD.wx.type = WORLD.wx.next = 'storm'; }); const ls = await lean();
check('a storm lays the plume flat (lower) without stretching it into beads (about the calm plume\'s length)', ls.rise < l1.rise * .8 && ls.far < l1.far * 1.6 && ls.dot > .9, { calm: l1, storm: ls });
await page.evaluate(() => { WORLD.wx.type = WORLD.wx.next = 'clear'; WORLD.wx.storm = 0; });

// far away the smoke is hidden and not worked
const away = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'), x0 = px, z0 = pz; px = S.site.x + 400; for (let i = 0; i < 3; i++) WORLD.tick(1 / 60, performance.now()); const v = S.smoke.visible; px = x0; pz = z0; WORLD.tick(1 / 60, performance.now()); return { far: v, back: S.smoke.visible }; });
check('past 300 units a town\'s smoke is hidden', away.far === false && away.back === true, away);

// pictures: the town from the hill at noon, at breakfast, at dusk, and close by a house calm and in a storm
const png = await page.evaluate(async () => { const T = WORLD.siteAnywhere('dunmore'), S = WORLD.settle.get('dunmore'), cvR = REN.domElement, cam = new THREE.PerspectiveCamera(50, cvR.width / cvR.height, .1, 600), tiles = [];
  const va = 2.3, vx = T.x + Math.sin(va) * 70, vz = T.z + Math.cos(va) * 70, hill = [vx, WORLD.worldH(vx, vz) + 14, vz], look = [T.x, WORLD.worldH(T.x, T.z) + 3, T.z];
  const mid = S.chimneys.reduce((b, c) => Math.hypot(c.x - T.x, c.z - T.z) < Math.hypot(b.x - T.x, b.z - T.z) ? c : b), nx = mid.x + Math.sin(va) * 14, nz = mid.z + Math.cos(va) * 14;
  const snap = (label, h, pos, lk, wx) => { forceTime(h); WORLD.wx.type = WORLD.wx.next = wx || 'clear'; WORLD.wx.storm = wx === 'storm' ? 1 : 0; for (let i = 0; i < 600; i++) WORLD.tick(1 / 60, performance.now());
    cam.position.set(...pos); cam.lookAt(...lk); CAM.position.copy(cam.position); WORLD.scene.updateMatrixWorld(true); REN.render(WORLD.scene, cam);
    const c = document.createElement('canvas'); c.width = 640; c.height = 360; const x = c.getContext('2d'); x.drawImage(cvR, 0, 0, cvR.width, cvR.height, 0, 0, 640, 360); x.fillStyle = '#000a'; x.fillRect(0, 0, 300, 28); x.fillStyle = '#fff'; x.font = 'bold 17px serif'; x.fillText(label, 8, 20); tiles.push(c); };
  snap('noon (homes a thread)', 12, hill, look); snap('breakfast, 7h', 7, hill, look); snap('dusk, 18h30', 18.5, hill, look); snap('night, 2h (the trades)', 2, hill, look);
  snap('close by a house, 7h', 7, [nx, WORLD.worldH(nx, nz) + 2.2, nz], [mid.x, mid.y + 1.5, mid.z]); snap('the same in a storm', 7, [nx, WORLD.worldH(nx, nz) + 2.2, nz], [mid.x, mid.y + 1.5, mid.z], 'storm');
  WORLD.wx.type = WORLD.wx.next = 'clear'; WORLD.wx.storm = 0;
  const out = document.createElement('canvas'); out.width = 1280; out.height = 1080; const o = out.getContext('2d'); tiles.forEach((c, i) => o.drawImage(c, (i % 2) * 640, Math.floor(i / 2) * 360)); return out.toDataURL(); });
fs.writeFileSync('tests/out/smoke-ingame.png', Buffer.from(png.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
