// Children at play (Session 2206; Michael's B on #1445, "at play, by island"; backlog L9, OG-116): on the new look, by day (9h to 18h) the
// town or village you are within 80 m of has two to four children out at its island's games near its square, the concept artist's toys
// (docs/prototypes/levelup/kids.js) in their hands; indoors at dusk, gone when you leave. Who plays what, and where, is seeded by the town
// and the day. Bodies only: no talk, no witness, nothing saved. KIDS, kidsFill and kidsTick are in js/32-people.js.
import { boot, check } from './lib/game.mjs';
const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.evaluate(() => REN.setSize(320, 180, false));
const r = await page.evaluate(() => {
  forceTime(11); { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  let S = null, bd = 1e9; for (const s of SETTLE.values()) { const k = s.site.kind; if (k !== 'village' && k !== 'town' && k !== 'city') continue; const d = Math.hypot(px - s.site.x, pz - s.site.z); if (d < bd) { bd = d; S = s; } }
  if (!S) return { none: true };
  px = S.site.x; pz = S.site.z + 3; CAM.position.set(px, CAM.position.y, pz); { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
  tickPeople(1 / 60, 1e5);
  const want = () => KIDS.list.filter(k => !k.rig.hb && !k.rig.hbFail).length;
  let n = 0; while (want() && n++ < 1500) tickPeople(1 / 60, 1e5 + n * (HBODY.gap + 1));
  const isle = (() => { const c = cellOf(S.site.x, S.site.z), k = nationKeyOf(c[0], c[1]); return KID_GAMES[k] ? k : 'gatelands'; })(), games = new Set(KID_GAMES[isle].flat());
  const L = KIDS.list, V = new THREE.Vector3();
  // the held things against the builder's palm, with each child's body shown whole
  const held = []; for (const k of L) { px = k.g.position.x + 2; pz = k.g.position.z; CAM.position.set(px, k.g.position.y + 1.6, pz);
    for (let j = 0; j < 20; j++) tickPeople(1 / 60, 5e5 + j * 17 + held.length * 999);
    const o = k.sword || k.stick || (k.G === 'doll' ? null : null), pR = kidPalm(k.rig, 'R');
    if (o && pR) { V.setFromMatrixPosition(o.matrix); held.push([k.G, +V.distanceTo(pR.p).toFixed(3)]); } }
  const out = { site: S.site.id, kind: S.site.kind, isle, n: L.length, games: L.map(k => k.G), allIsle: L.every(k => games.has(k.G)), child: L.every(k => k.rig.g.child), play: L.every(k => k.rig.play && k.rig.w.play > .9),
    built: L.filter(k => k.rig.hb).length, toys: L.reduce((a, k) => a + k.toys.length, 0), clear: L.every(k => !solidAt(k.U.x, k.U.z)), keys: L.map(k => k.rig.g.hbKey), held,
    near: L.every(k => Math.hypot(k.U.x - S.site.x, k.U.z - S.site.z) < 32), carry: L.filter(k => { const d = k.rig.hbG && k.rig.hbG.dress; return d && (d.staff || d.basket || d.cloak || d.lantern); }).length };
  // the same town on the same day: the same children at the same games in the same places
  const sig = () => KIDS.list.map(k => k.G + '@' + k.U.x.toFixed(2) + ',' + k.U.z.toFixed(2) + ':' + k.rig.g.hbKey).join('|');
  const s0 = sig(), key = KIDS.key; kidsDrop(); kidsFill(S, key); out.same = sig() === s0;
  // every game's pose is a pose: finite joints at any phase, both of a pair
  let bad = 0; for (const G of ['hoop', 'ball', 'doll', 'spar', 'kite', 'bones', 'horse']) for (const k of [0, 1]) for (const u of [0, .2, .5, .8, .99]) { const p = pwPlay(3.3, { play: { game: G, k, u, blk: .5 } }, .37);
    for (const j of PW.JOINTS) if (!p[j].every(Number.isFinite)) bad++; if (!Number.isFinite(p.hipsY)) bad++; }
  out.bad = bad;
  px = S.site.x; pz = S.site.z + 3; forceTime(19.5); tickPeople(1 / 60, 9e5); out.dusk = KIDS.list.length;
  forceTime(11); tickPeople(1 / 60, 9.1e5); out.back = KIDS.list.length; px += 300; tickPeople(1 / 60, 9.2e5); out.away = KIDS.list.length; px -= 300;
  out.saved = JSON.stringify(worldState).includes('kid:'); return out;
});
console.log(JSON.stringify(r));
check(`by day at 11h, ${r.site} (${r.kind}, ${r.isle}) has ${r.n} children out at play (${(r.games || []).join(', ')}), every one a child at its island's games`, !r.none && r.n >= 2 && r.n <= 4 && r.allIsle && r.child && r.play, r);
check(`all ${r.built} take the builder's body, carry nothing of a grown townsman's (${r.carry}), and stand on clear ground within 32 m of the square with ${r.toys} toys`, r.built === r.n && r.carry === 0 && r.clear && r.near && r.toys >= r.n, r);
check(`what a hand holds is in the builder's palm (${(r.held || []).map(h => h[0] + ' ' + h[1] + ' m').join(', ') || 'nothing held here'})`, (r.held || []).every(h => h[1] < .15), r);
check('the same town on the same day is the same children at the same games in the same places', r.same, r);
check(`every game's pose is finite at any phase (${r.bad} bad)`, r.bad === 0, r);
check(`at 19:30 they are indoors (${r.dusk}); at 11h back (${r.back}); 300 m off, gone (${r.away}); nothing saved`, r.dusk === 0 && r.back === r.n && r.away === 0 && !r.saved, r);
check(`no page error (${errs.length})`, errs.length === 0, errs.slice(0, 3));
await g.close();
