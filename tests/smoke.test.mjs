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

// Session 345 — the forts' barracks and the coaching inns smoke too (the barracks by the homes' hours, the inn always)
await page.evaluate(() => forceTime(7));
const fd = await page.evaluate(() => { const out = []; const [hi, hj] = WORLD.cellOf(px, pz); for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { let c; try { c = WORLD.getCell(hi + di, hj + dj); } catch (e) { continue; } if (c) for (const e of c.doors) if (e.kind === 'fort_door') out.push({ seed: e.seed, x: e.x, z: e.z, d: Math.hypot(e.x - px, e.z - pz) }); } return out.sort((a, b) => a.d - b.d)[0] || null; });
let fort = null; if (fd) { await page.evaluate(f => goToZone('world', f.x, f.z + 45, 0, 'x'), fd); await page.waitForTimeout(9000); await g.hide();
  await page.evaluate(seed => { for (let k = 0; k < 900 && !WORLD.settlements.has('fort_' + seed); k++) { WORLD.tick(1 / 60, performance.now()); while (WORLD.jobs.length) { const j = WORLD.jobs.shift(); let more = false; try { more = j.fn(); } catch (e) {} if (more) WORLD.jobs.push(j); } } }, fd.seed);
  await g.spin(null, 600);
  fort = await page.evaluate(seed => { const S = WORLD.settlements.get('fort_' + seed); if (!S) return { none: seed }; const P = S.smoke, a = P && P.geometry.attributes.aAlpha.array, p = P && P.geometry.attributes.position.array;
    let nan = false; if (p) for (let i = 0; i < p.length; i++) if (!isFinite(p[i])) nan = true;
    return { n: S.chimneys.length, types: S.chimneys.map(c => c.t), count: P && P.geometry.attributes.position.count, alpha: a && +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3), vis: P && P.visible, nan, inGroup: P && P.parent === S.group }; }, fd.seed); }
console.log(JSON.stringify({ fd, fort }));
check('a fort\'s two barracks smoke at breakfast, one Points object in its group, every position finite', fort && fort.n === 2 && fort.types.every(t => t === 'barracks') && fort.count === 48 && fort.alpha > .1 && fort.vis && !fort.nan && fort.inGroup, fort);
const coachKey = await page.evaluate(() => { const T = ['town', 'city', 'port'];
  const defs = WORLD.ROAD_DEFS.map(d => ({ d, a: WORLD.siteAnywhere(d.a), b: WORLD.siteAnywhere(d.b) })).filter(q => q.a && q.b && T.includes(q.a.kind) && T.includes(q.b.kind)).sort((p, q) => Math.hypot((p.a.x + p.b.x) / 2 - px, (p.a.z + p.b.z) / 2 - pz) - Math.hypot((q.a.x + q.b.x) / 2 - px, (q.a.z + q.b.z) / 2 - pz));
  for (const { d, a, b } of defs) { const key = d.a < d.b ? d.a + '|' + d.b : d.b + '|' + d.a; worldState.coaches = worldState.coaches || {}; worldState.coaches[key] = { a: d.a, b: d.b, opened: 0 }; px = (a.x + b.x) / 2; pz = (a.z + b.z) / 2; return key; } return null; });
await page.waitForTimeout(6000); await g.spin(null, 600);
const inn = await page.evaluate(() => { const C = [...WORLD.coachLines.values()].find(C => C.smokeS); if (!C) return { lines: WORLD.coachLines.size }; const S = C.smokeS, P = S.smoke, a = P.geometry.attributes.aAlpha.array;
  const ch = S.chimneys[0]; return { n: S.chimneys.length, t: ch.t, above: +(ch.y - WORLD.worldH(ch.x, ch.z)).toFixed(2), off: +Math.hypot(ch.x - S.site.x, ch.z - S.site.z).toFixed(2), inGroup: P.parent === C.group, alpha: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3), vis: P.visible }; });
console.log(JSON.stringify({ coachKey, inn }));
check('a coaching inn smokes from its own chimney (on its roof, within 5 of the inn), always', inn.n === 1 && inn.t === 'inn' && inn.above > 3 && inn.above < 12 && inn.off < 5 && inn.inGroup && inn.alpha > .1 && inn.vis, inn);

// Session 354 — the legacy village (Ashenmoor's old scene, where WORLD.tick does not run): Bram's forge chimney smokes, driven
// from the main loop, always (a forge), on the same wind
await page.evaluate(() => { goToZone('overworld', 25.75, 15, 0, 'x'); });
// g.spin ticks WORLD.tick, which does not run here; the main loop calls WORLD.smokeLegacy, so real frames must move the smoke's clock
const t0 = await page.evaluate(() => WORLD.smoke.t); await g.frames(6); const loopRan = await page.evaluate(t0 => { const S = scene.userData.smokeS; return !!S && WORLD.smoke.t > t0; }, t0);
check('in the old village the game\'s own loop drives the smoke (its clock moves over real frames)', loopRan, { t0, loopRan });
const legSpin = n => page.evaluate(n => { for (let i = 0; i < n; i++) WORLD.smokeLegacy(1 / 60, scene); }, n);
await page.evaluate(() => forceTime(13)); await legSpin(600);
const leg = await page.evaluate(() => { const vs = scene, ch = vs.userData.chimneys, S = vs.userData.smokeS; if (!ch || !S) return { zone: activeZoneId, owScene: vs === owScene, ch: !!ch, S: !!S };
  const P = S.smoke, a = P.geometry.attributes.aAlpha.array, p = P.geometry.attributes.position.array; let nan = false, hi = -1e9, sx = 0, sz = 0, n = 0;
  for (let i = 0; i < a.length; i++) { if (!isFinite(p[i * 3]) || !isFinite(p[i * 3 + 1])) nan = true; if (a[i] > .01) { hi = Math.max(hi, p[i * 3 + 1]); sx += p[i * 3] - ch[0].x; sz += p[i * 3 + 2] - ch[0].z; n++; } }
  const w = WORLD.windDir(); return { zone: activeZoneId, owScene: vs === owScene, n: ch.length, t: ch[0].t, top: +ch[0].y.toFixed(2), count: P.geometry.attributes.position.count, inScene: P.parent === vs,
    alpha: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3), vis: P.visible, nan, rise: +(hi - ch[0].y).toFixed(2), downwind: +((sx * Math.sin(w) + sz * Math.cos(w)) / Math.max(1, n)).toFixed(2), t0: WORLD.smoke.t }; });
await page.evaluate(() => forceTime(3)); await legSpin(600);
const legNight = await page.evaluate(() => { const a = scene.userData.smokeS.smoke.geometry.attributes.aAlpha.array; return +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3); });
console.log(JSON.stringify({ leg, legNight }));
check('the old Ashenmoor\'s forge chimney smokes: one Points object of 24 puffs in its scene, rising and drifting downwind, every position finite', leg.owScene && leg.n === 1 && leg.t === 'weapon' && leg.count === 24 && leg.inScene && leg.vis && !leg.nan && leg.alpha > .1 && leg.rise > 2 && leg.downwind > .3, leg);
check('a forge smokes at every hour (3h as at 13h)', legNight > .1, legNight);
await page.evaluate(() => { forceTime(13); pitch = .18; yaw = Math.PI; px = 25.75; pz = 13; }); await legSpin(240); await g.frames(3);
await page.screenshot({ path: 'tests/out/smoke-legacy.png' });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
