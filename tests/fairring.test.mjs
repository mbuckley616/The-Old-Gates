// The Strait Fair's ring on the new look (Session 2333; Michael's A on #1672; contests.js of Session 2317, PKIT.props.ring in 38-kit.js).
// Every Markish place that keeps the fair stands the ring on its square, or the nearest clear ground (genSettlement's S.fair, 83): built
// hidden, up from 5:00 on the fair's morning and down at noon (fairRingLive), kept up while a contest runs in it. Nothing of it is solid.
// fairRingStart with no middle given takes the ring's. A picture of it on the morning.
import { boot, check } from './lib/game.mjs';
import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));

const g = await boot({ look: 'new' }); const { page } = g; await g.intoWorld();
const ids = await page.evaluate(() => { anchoredPlaces(); const S = [...CELLS.values()].filter(c => c.type !== 'sea' && nationKeyOf(c.i, c.j) === 'mark').flatMap(c => c.sites).filter(s => !s.islet);
  return ['town', 'village'].map(k => (S.find(s => s.kind === k) || {}).id).filter(Boolean); });
const out = [];
for (const id of ids) {
  check(`${id} is built`, await g.settle(id));
  out.push(await page.evaluate(id => { const S = WORLD.settle.get(id), F = S && S.fair, site = siteAnywhere(id); if (!F) return { id, none: true };
    let solid = 0, lo = 1e9, hi = -1e9; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (const f of [0, .4, .8, 1.1]) { const x = F.x + Math.cos(a) * F.r * f, z = F.z + Math.sin(a) * F.r * f; if (solidAt(x, z)) solid++; const y = worldH(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); } }
    let lots = 1e9; for (const h of S.houses) if (h.doorX != null) lots = Math.min(lots, Math.hypot(h.doorX - F.x, h.doorZ - F.z));
    return { id, kind: site.kind, from: +Math.hypot(F.x - site.x, F.z - site.z).toFixed(1), road: F.road, out: F.out, solid, fall: +(hi - lo).toFixed(2), door: +lots.toFixed(1), tris: F.tris, draws: F.draws, hidden: !F.group.visible }; }, id));
}
console.log(JSON.stringify(out));
for (const r of out) {
  check(`${r.id} (${r.kind}) has its ring ${r.from} m from the square's middle${r.out ? ', outside the walls' : r.road ? ', over the street' : ''}`, !r.none && r.from < 40, r);
  check(`  nothing solid in it (${r.solid}), the ground falling ${r.fall} m across it, the nearest door ${r.door} m off; ${r.tris} triangles in ${r.draws} draws`, !r.none && r.solid === 0 && r.fall < 1.2 && r.door > 5.5 && r.draws <= 6 && r.tris <= 4000, r);
  check('  and it is down on an ordinary day', !r.none && r.hidden, r);
}
// the day: up on the fair's morning in a town keeping it, down at noon; a contest begun with no middle given is fought in it
const id = ids[0]; await g.settle(id);
const d = await page.evaluate(id => { const site = siteAnywhere(id), S = WORLD.settle.get(id), F = S.fair, st = TS(site), keep = { p: st.p, flags: st.flags }, o = {};
  const sf = FESTIVALS.find(f => f.key === 'straitfair'), n = ((sf.month - CAL.startMonth + 12) % 12) * 28 + sf.dom - 1;
  const at = h => { worldState.gameTimeAbsMinutes = n * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; px = F.x + 9; pz = F.z; CAM.position.set(px, CAM.position.y, pz); houseLod(); return F.group.visible; };
  st.p = 70; st.flags = {}; worldState.festivals = {};
  try { o.dawn = at(4.5); o.morning = at(9); o.noon = at(12.5); st.p = 5; o.thin = at(9); st.p = 70;
    at(11); px = F.x; pz = F.z; const R = fairRingStart({ site }); o.ok = R.ok; o.say = R.say;
    if (FAIRRING) { o.mid = +Math.hypot(FAIRRING.x - F.x, FAIRRING.z - F.z).toFixed(3); worldState.gameTimeAbsMinutes = n * 1440 + 13 * 60; worldState.gameTimeMinutes = 780; houseLod(); o.during = F.group.visible; fairRingEnd('left'); houseLod(); o.after = F.group.visible; }
  } finally { if (FAIRRING) fairRingEnd('left'); Object.assign(st, keep); worldState.festivals = {}; }
  return o; }, id);
console.log(JSON.stringify(d));
check(`the ring is down at 4:30 (${!d.dawn}), up at 9:00 (${d.morning}), down after noon (${!d.noon}), and not put up in a lean year (${!d.thin})`, !d.dawn && d.morning && !d.noon && !d.thin, d);
check(`fairRingStart with no middle fights in the ring (${d.mid} m off its middle); it stays up past noon while the bout runs and comes down after`, d.ok && d.mid < .01 && d.during && !d.after, d);

// Session 2346: the ring on E. Inside the rope while it stands, the world's prompt is the ring's and E steps you in; the day before, after
// noon and 3 m outside the rope there is no prompt; in the bout the prompt is gone; a second try the same year gives its refusal.
const e = await page.evaluate(id => { const site = siteAnywhere(id), S = WORLD.settle.get(id), F = S.fair, st = TS(site), keep = { p: st.p, flags: st.flags }, o = {};
  const sf = FESTIVALS.find(f => f.key === 'straitfair'), n = ((sf.month - CAL.startMonth + 12) % 12) * 28 + sf.dom - 1;
  const at = (d, h) => { worldState.gameTimeAbsMinutes = d * 1440 + h * 60; worldState.gameTimeMinutes = h * 60; };
  st.p = 70; st.flags = {}; worldState.festivals = {};
  try { px = F.x + 1; pz = F.z; at(n - 1, 9); o.before = fairRingPrompt(); at(n, 13); o.after = fairRingPrompt();
    at(n, 9); o.on = fairRingPrompt(); o.world = shipPrompt(); px = F.x + F.r + 3; o.off = fairRingPrompt(); px = F.x + F.r + .5; o.rope = fairRingPrompt();
    o.e = shrineInteract(); o.started = !!FAIRRING; o.mid = FAIRRING ? +Math.hypot(FAIRRING.x - F.x, FAIRRING.z - F.z).toFixed(3) : null; o.during = fairRingPrompt();
    fairRingEnd('left'); o.again = fairRingPrompt(); const m = []; const sm = showMsg; window.showMsg = t => m.push(t); try { o.e2 = shrineInteract(); } finally { window.showMsg = sm; } o.say2 = m[0]; o.started2 = !!FAIRRING;
  } finally { if (FAIRRING) fairRingEnd('left'); Object.assign(st, keep); worldState.festivals = {}; }
  return o; }, id);
console.log(JSON.stringify(e));
check(`on the fair's morning inside the rope the world's prompt is the ring's (${e.world}), and at the rope (${!!e.rope}); the day before ${e.before}, after noon ${e.after}, 3 m outside ${e.off}`, e.on === "Press 'E' to step into the ring" && e.world === e.on && e.rope === e.on && !e.before && !e.after && !e.off, e);
check(`E steps you into the ring (${e.mid} m off its middle), the prompt gone while you fight; the same year E gives *${e.say2}* and starts nothing`, e.e && e.started && e.mid < .01 && !e.during && e.again === e.on && e.e2 && /this year/.test(e.say2 || '') && !e.started2, e);

// a picture on the fair's morning, from outside the rope
const pic = path.join(here, '../docs/prototypes/kit-fair-ring.png');
await page.evaluate(id => { const F = WORLD.settle.get(id).fair, site = siteAnywhere(id), st = TS(site); st.p = 70; st.flags = {};
  const sf = FESTIVALS.find(f => f.key === 'straitfair'), n = ((sf.month - CAL.startMonth + 12) % 12) * 28 + sf.dom - 1; worldState.gameTimeAbsMinutes = n * 1440 + 600;
  forceTime(10); VM_SCENE.visible = false; thirdPerson = false; const L = Math.hypot(site.x - F.x, site.z - F.z) || 1, ux = (site.x - F.x) / L, uz = (site.z - F.z) / L; px = F.x + ux * 10 + uz * 2; pz = F.z + uz * 10 - ux * 2; yaw = Math.atan2(px - F.x, pz - F.z); pitch = -.24; /* from the square's side, the reeve's post beyond */ }, id);
await g.spin(null, 8); await g.frames(6); await page.screenshot({ path: pic }); console.log(`  (picture: ${path.relative(path.join(here, '..'), pic)})`);
await page.evaluate(() => { VM_SCENE.visible = true; });
await g.close();
