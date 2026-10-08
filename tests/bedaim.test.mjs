// A bed answers E only with the crosshair on it (Session 645; Michael's 6 Oct 2026 playtest: "E should need range AND the
// reticle on the object: the inn's bed still shows as interactable from downstairs"). In Dunmore's inns and a home: standing
// at a bed and looking at it, the prompt shows and E reaches the bed; at the same spot looking away, neither. On the inn's
// ground floor under the gallery's beds (where the room's old `intBedPos` lay, which the prompt read and E did not), no prompt.
// And a bed on the far side of a wall, within the old reach, never answers.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore'); await page.evaluate(() => { window._hold = true; });
const houses = await page.evaluate(() => { const S = WORLD.settle.get('dunmore').houses; const inns = S.filter(h => h.type === 'inn' && h.dlg).slice(0, 2);
  const home = S.find(h => h.type === 'home' || h.type === 'house'); return [...inns, home].filter(Boolean).map(h => ({ id: h.id, type: h.type, name: h.name })); });
const enter = async (id) => { await page.evaluate((id) => { const h = WORLD.settle.get('dunmore').houses.find(x => x.id === id); window._bh = h; px = h.exitX; pz = h.exitZ; goToInterior(h); }, id);
  await page.waitForFunction(() => currentHouse === window._bh && INT_BEDS.length > 0, null, { timeout: 60000 }); await g.frames(2); await g.hide(); };
const leave = async () => { await page.evaluate(() => exitInterior()); await page.waitForFunction(() => currentHouse == null, null, { timeout: 60000 }); await g.frames(2); };
// stand at (x,z) on floor y, look at the point (tx,ty,tz) or along `away`, run two frames and read the prompt; then press E
// with the sleep panel and the bed's own answer caught
const stand = (p) => page.evaluate(async (p) => { px = p.x; pz = p.z; jumpY = p.y; onGround = true;
  if (window._hold) for (const n of (INT_NPCS || [])) if (n.g) n.g.position.set(-50, n.g.position.y, -50);
  const aim = () => { const ey = CAM.position.y; if (p.away) { yaw = Math.atan2(px - p.tx, pz - p.tz); pitch = 0; } else { yaw = Math.atan2(-(p.tx - px), -(p.tz - pz)); pitch = Math.atan2(p.ty - ey, Math.hypot(p.tx - px, p.tz - pz)); } };
  for (let i = 0; i < 4; i++) { aim(); await new Promise(r => requestAnimationFrame(() => r())); }
  aim(); CAM.position.set(px, CAM.position.y, pz); CAM.rotation.set(pitch, yaw, 0, 'YXZ'); CAM.updateMatrixWorld(true); const t = typeof intBedTarget === 'function' ? intBedTarget() : null; const want = t ? WORLD.bedPrompt(t) : null; const ipr = document.getElementById('ipr'), ob = document.getElementById('ob');
  const prompt = [ipr && ipr.style.display !== 'none' && +ipr.style.opacity > 0 ? ipr.textContent : '', ob ? ob.textContent : ''].join(' | ');
  const S0 = openSleepUI, B0 = WORLD.bedInteract; let slept = false, bed = false; openSleepUI = () => { slept = true; }; WORLD.bedInteract = (b) => { bed = true; return true; };
  const M0 = showMsg; showMsg = () => {};
  try { interact(); } finally { openSleepUI = S0; WORLD.bedInteract = B0; showMsg = M0; }
  const dbg = { d: +Math.hypot(px - p.tx, pz - p.tz).toFixed(2), cam: [CAM.position.x, CAM.position.y, CAM.position.z].map(v => +v.toFixed(2)), p: [px, jumpY, pz].map(v => +v.toFixed(2)), yaw: +yaw.toFixed(2), pitch: +pitch.toFixed(2), tp: thirdPerson, sight: intSightLine(px, pz, p.tx, p.tz) };
  return { dbg, target: !!t, rest: want ? prompt.includes(want) : /rest|sleep|bed|a room/i.test(prompt), want, prompt: prompt.slice(0, 80), e: slept || bed }; }, p);
const out = [];
for (const h of houses) { await enter(h.id);
  const L = await page.evaluate(() => ({ beds: INT_BEDS.map(b => ({ x: b.x, z: b.z, y: b.y || 0 })), ibp: intBedPos, W: currentHouse._roomW, D: currentHouse._roomD }));
  // one spot per bed: the free ground nearest it in the 1.0–1.5 ring on its own floor, the wall in no way between
  const spots = await page.evaluate(() => INT_BEDS.map(b => { for (let r = 1.0; r <= 1.5; r += .1) for (let a = 0; a < 6.28; a += .2) { const x = b.x + Math.cos(a) * r, z = b.z + Math.sin(a) * r;
    if (x < .3 || z < .3 || x > currentHouse._roomW - .3 || z > currentHouse._roomD - .3) continue; if (typeof intSolidAt === 'function' && intSolidAt(x, z, .3, b.y || 0)) continue;
    if (INT_BEDS.some(o => o !== b && Math.hypot(o.x - x, o.z - z) < 1.6 && Math.abs((o.y || 0) - (b.y || 0)) < .9)) continue; if (!intSightLine(x, z, b.x, b.z)) continue; if ((INT_DOORS || []).some(d => Math.hypot(d.x - x, d.z - z) < 1.8)) continue; return { x, z, y: b.y || 0, b }; } return null; }));
  let n = 0;
  for (const s of spots) { if (!s || n >= 3) continue; n++;
    const on = await stand({ x: s.x, z: s.z, y: s.y, tx: s.b.x, ty: s.y + .45, tz: s.b.z });
    const off = await stand({ x: s.x, z: s.z, y: s.y, tx: s.b.x, ty: s.y + .45, tz: s.b.z, away: true });
    out.push({ house: h.name, kind: 'bed', bedY: s.y, on, off }); }
  // the ground floor under a gallery bed: at the old intBedPos, and under each gallery bed, looking up at it
  const upper = L.beds.filter(b => b.y > 1);
  if (upper.length && L.ibp) { out.push({ house: h.name, kind: 'under', at: 'intBedPos', r: await stand({ x: L.ibp.x, z: L.ibp.z, y: 0, tx: L.ibp.x, ty: 3, tz: L.ibp.z - 1 }) });
    for (const b of upper.slice(0, 2)) out.push({ house: h.name, kind: 'under', at: 'bed', r: await stand({ x: b.x, z: b.z + 1.0, y: 0, tx: b.x, ty: b.y + .45, tz: b.z }) }); }
  // through a wall: a spot within 1.5 of a bed on its floor with a wall between, looking at the bed
  const thru = await page.evaluate(() => { for (const b of INT_BEDS) for (let r = .9; r <= 1.5; r += .1) for (let a = 0; a < 6.28; a += .15) { const x = b.x + Math.cos(a) * r, z = b.z + Math.sin(a) * r;
    if (x < .3 || z < .3 || x > currentHouse._roomW - .3 || z > currentHouse._roomD - .3) continue; if (typeof intSolidAt === 'function' && intSolidAt(x, z, .3, b.y || 0)) continue;
    if (!intSightLine(x, z, b.x, b.z)) return { x, z, y: b.y || 0, b }; } return null; });
  if (thru) out.push({ house: h.name, kind: 'wall', r: await stand({ x: thru.x, z: thru.z, y: thru.y, tx: thru.b.x, ty: thru.y + .45, tz: thru.b.z }) });
  await leave(); }
for (const o of out) console.log(' ', JSON.stringify(o));
const beds = out.filter(o => o.kind === 'bed'), under = out.filter(o => o.kind === 'under'), wall = out.filter(o => o.kind === 'wall');
check('beds tried in two inns and a home', beds.length >= 5 && new Set(beds.map(o => o.house)).size >= 3, beds.length);
check('looking at a bed in reach: it is the target, E reaches it, and the prompt says what the bed says (a stranger\'s bed says nothing)', beds.every(o => o.on.target && o.on.e && (o.on.want ? o.on.rest : true)) && beds.filter(o => o.on.want).length >= 4, beds.map(o => o.on));
check('the same spot looking away: no target, no prompt, E does nothing with the bed', beds.every(o => !o.off.target && !o.off.rest && !o.off.e), beds.map(o => o.off));
check('on the inn\'s ground floor under the gallery beds: no bed prompt and E does nothing with a bed', under.length >= 2 && under.every(o => !o.r.target && !o.r.rest && !o.r.e), under);
check('a bed on the far side of a wall never answers', wall.every(o => !o.r.target && !o.r.e), wall);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
