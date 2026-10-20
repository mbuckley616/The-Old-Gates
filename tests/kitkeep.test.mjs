// The town's keep in its bawn in the game's kit (Session 1139; card F6, Michael's B on DECISION #416). js/38-kit.js copies
// gatelandsKeep from docs/prototypes/levelup/pieces.js, and this holds the copy to the prototype: each of the three kinds builds to the
// triangles and draws pieces.check.mjs recorded (Session 1096: the tower 15,978 in 15, the bawn 18,346 in 32, the hall 20,840 in 26),
// the same twice, with the bawn's measures as drawn (26 by 22 m, walls 0.9 m and 3.6 m, a gateway of 3 by 3.4 m) and its door before
// the gateway. On the old look the kit loads and builds nothing until asked.
import { boot, check } from './lib/game.mjs';
const REC = { tower: [15978, 15], bawn: [18346, 32], hall: [20840, 26] };
const g = await boot({ look: 'new' }); const { page } = g;
const K = await page.evaluate(() => { const hash = b => { let h = 0; b.traverse(m => { if (!m.isMesh) return; const a = m.geometry.attributes.position.array; for (let i = 0; i < a.length; i += 3) h = (h * 31 + Math.round(a[i] * 1e4)) | 0; }); return h; };
  const out = {}; for (const kind of ['tower', 'bawn', 'hall']) { const a = PKIT.gl.keep({ kind }), b = PKIT.gl.keep({ kind }), u = a.userData, box = new THREE.Box3().setFromObject(a);
    out[kind] = { tris: u.tris, calls: u.calls, same: hash(a) === hash(b), size: u.size, door: u.door.toArray().map(v => +v.toFixed(2)), foot: [+(box.max.x - box.min.x).toFixed(2), +(box.max.z - box.min.z).toFixed(2)], top: +box.max.y.toFixed(2) }; }
  return out; });
check(`the keep three ways builds to the prototype's triangles and draws (${Object.entries(K).map(([k, v]) => `${k} ${v.tris.toLocaleString()} in ${v.calls}`).join(', ')})`, Object.keys(REC).every(k => K[k].tris === REC[k][0] && K[k].calls === REC[k][1]), K);
check('each is the same twice', Object.values(K).every(v => v.same), Object.fromEntries(Object.entries(K).map(([k, v]) => [k, v.same])));
const B = K.bawn;
check(`the bawn is 26 by 22 m, its walls 0.9 m thick and 3.6 m high, its gateway 3 by 3.4 m, ${B.foot[0]} by ${B.foot[1]} m with its flankers, the tower ${B.top} m to its pots`,
  B.size.bawn.w === 26 && B.size.bawn.d === 22 && B.size.bawn.t === .9 && B.size.bawn.h === 3.6 && B.size.gate.w === 3 && B.size.gate.h === 3.4 && B.foot[0] < 30 && B.foot[1] < 25 && Math.abs(B.top - 20.36) < .05, B.size);
check(`its door is before the gateway, on the front (${B.door.join(', ')})`, Math.abs(B.door[0] - (B.size.gate.x + .9)) < .01 && B.door[2] > B.size.bawn.d / 2, B.door);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
const g0 = await boot(); const o = await g0.page.evaluate(() => ({ look: window.OG_LOOK || 'old', fn: typeof PKIT.gl.keep, made: PKIT.texturesMade() }));
check('on the old look the kit has the keep and has painted nothing', o.look !== 'new' && o.fn === 'function' && o.made === 0 && g0.errs.length === 0, { ...o, errs: g0.errs });
await g0.close();
