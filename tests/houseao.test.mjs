// Shading in the houses' creases (Session 284, H.1, Michael's B on Session 276): the people's pass over a house's bake,
// but only parts at least .35 thick cast it (walls, roof slabs, the chimney, the lean-to, the jetty), so the thousands of
// slates, turfs and course stones no longer grey whole walls. Checked per style against A (every part casts), and a
// whole town's build time with and without it.
import { boot, check } from './lib/game.mjs';
import fs from 'fs';
const g = await boot(); const { page } = g;
await g.intoWorld();
fs.mkdirSync('tests/out', { recursive: true });
const r = await page.evaluate(() => { const out = { cfg: { on: HAO.on, minR: HAO.minR }, styles: {} };
  const dark = (raw, col) => { let s = 0, clear = 0; const n = col.length / 3; for (let i = 0; i < col.length; i += 3) { const la = raw[i] + raw[i + 1] + raw[i + 2], d = la > 0 ? 1 - (col[i] + col[i + 1] + col[i + 2]) / la : 0; s += d; if (d < .02) clear++; } return [+(s / n).toFixed(3), +(clear / n).toFixed(3)]; };
  for (const k of WORLD.houseStyles()) { HAO.keep = true; const geo = WORLD.houseProto(k, 8, 6, 11).hi; HAO.keep = false; const raw = geo.userData.raw; if (!raw) { out.styles[k] = null; continue; }
    const b = dark(raw.col, geo.attributes.color.array); const colA = raw.col.slice(); personAO(raw.pos, raw.nor, colA, raw.PR, { k: HAO.k, max: HAO.max, on: true, cut: HAO.cut }); const a = dark(raw.col, colA);
    out.styles[k] = { B: b[0], clearB: b[1], A: a[0], clearA: a[1] }; geo.dispose(); }
  return out; });
console.log(JSON.stringify(r));
check('the houses\' shading is on, large parts only (minR .35)', r.cfg.on === true && r.cfg.minR === .35, r.cfg);
const S = Object.entries(r.styles);
check('every style\'s bake is shaded (a mean darkening of 5–35%)', S.every(([, v]) => v && v.B > .05 && v.B < .35), r.styles);
check('B darkens less than A in every style, and leaves more of the house its own colour', S.every(([, v]) => v.B < v.A && v.clearB >= v.clearA), r.styles);
// a whole town built with it off and on: the shading's own time, and the town's
await g.settle('dunmore');
const t = await page.evaluate(() => { const site = WORLD.settlements.get('dunmore').site; const build = on => { HAO.on = on; HAO.ms = 0; HAO.n = 0; WORLD.disposeSettlement('dunmore'); const t0 = performance.now(); WORLD.genSettlement(site); return { ms: +(performance.now() - t0).toFixed(0), aoMs: +HAO.ms.toFixed(0), houses: HAO.n }; };
  const off = build(false), on = build(true); HAO.on = true; return { off, on }; });
console.log(JSON.stringify(t));
check('Dunmore\'s detailed houses go through the shading when the town builds, and it takes time only when on', t.on.houses > 5 && t.on.aoMs > 0 && t.off.aoMs < 5, t);
check('the shading costs under 25 ms a house on average and under 1.5 s for the whole town', t.on.aoMs / t.on.houses < 25 && t.on.aoMs < 1500, t);
// the picture: Dunmore from its edge in the afternoon, today (off) and now (on); the town is rebuilt between, so a
// house's variant can differ (the variant is drawn from a running counter)
const shot = async on => page.evaluate(on => { const site = WORLD.settlements.get('dunmore').site; HAO.on = on; WORLD.disposeSettlement('dunmore'); WORLD.genSettlement(site); HAO.on = true; forceTime(15);
  const S = WORLD.settlements.get('dunmore'), hi = (S.lodMeshes || []).filter(m => m.userData.lod === 'hi'); CAM.position.set(site.x, CAM.position.y, site.z); WORLD.tick(1 / 60, performance.now());
  const b = new THREE.Box3(); hi[0].geometry.computeBoundingBox(); b.copy(hi[0].geometry.boundingBox).applyMatrix4(hi[0].matrixWorld); const c = b.getCenter(new THREE.Vector3());
  const cv = REN.domElement, cam = new THREE.PerspectiveCamera(50, cv.width / cv.height, .3, 400); cam.position.set(c.x + 20, c.y + 8, c.z + 20); cam.lookAt(c.x, c.y, c.z); WORLD.scene.updateMatrixWorld(true);
  const f = WORLD.scene.fog; WORLD.scene.fog = null; REN.render(WORLD.scene, cam); WORLD.scene.fog = f; const o = document.createElement('canvas'); o.width = cv.width / 2; o.height = cv.height / 2; o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); return o.toDataURL(); }, on);
const pics = [await shot(false), await shot(true)];
const grid = await page.evaluate(ps => new Promise(res => { const c = document.createElement('canvas'); let x = null, k = 0;
  ps.forEach((p, i) => { const im = new Image(); im.onload = () => { if (!x) { c.width = im.width * 2; c.height = im.height; x = c.getContext('2d'); } x.drawImage(im, i * im.width, 0); x.fillStyle = '#fff'; x.font = '16px sans-serif'; x.fillText(i ? 'the large parts shaded (B)' : 'before', i * im.width + 8, 20); if (++k === 2) res(c.toDataURL()); }; im.src = p; }); }), pics);
fs.writeFileSync('tests/out/houseao.png', Buffer.from(grid.split(',')[1], 'base64'));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
