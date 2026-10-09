// A bed under the crosshair wins over a door that is only near (the critic, 8 Oct, s477: in The Rowan Cup at Vieux Marché,
// standing at the foot of room 0's bed, the HUD said *Your room — press 'E' to rest*, the middle *Press 'E' to close the door*,
// and E shut the door). Since Session 650: with a bed in reach under the crosshair that offers something, E goes to the bed
// and the middle prompt is the bed's; the same spot looking away from the bed, E still opens or shuts the door.
// Since Session 680 a door answers only with the crosshair on its doorway: looking at the bed the door is not offered at
// all, and the second look is at the door itself (it was away from the bed, anywhere).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const out = [];
for (const site of ['dunmore', 'vieux_marche']) {
  await g.settle(site);
  const inns = await page.evaluate((site) => { const S = WORLD.settle.get(site); return S ? S.houses.filter(h => h.type === 'inn' && h.dlg).slice(0, 3).map(h => h.id) : []; }, site);
  for (const id of inns) {
    await page.evaluate(([site, id]) => { const h = WORLD.settle.get(site).houses.find(x => x.id === id); window._bh = h; px = h.exitX; pz = h.exitZ; goToInterior(h); }, [site, id]);
    await page.waitForFunction(() => currentHouse === window._bh && INT_BEDS.length > 0, null, { timeout: 60000 }); await g.frames(2); await g.hide();
    // spots within 1.4 of a door on its floor and 0.9–1.5 of a bed with a clear line, where the bed offers a prompt
    const spots = await page.evaluate(() => { const L = []; for (const d of (INT_DOORS || [])) for (const b of INT_BEDS) { if (Math.abs((b.y || 0) - d.y) > .5) continue;
      for (let r = .9; r <= 1.5 && L.length < 40; r += .1) for (let a = 0; a < 6.28; a += .25) { const x = b.x + Math.cos(a) * r, z = b.z + Math.sin(a) * r;
        if (Math.hypot(x - d.x, z - d.z) >= 1.4) continue; if (typeof intSolidAt === 'function' && intSolidAt(x, z, .3, b.y || 0)) continue; if (!intSightLine(x, z, b.x, b.z)) continue;
        if (INT_BEDS.some(o => o !== b && Math.hypot(o.x - x, o.z - z) < 1.7 && Math.abs((o.y || 0) - (b.y || 0)) < .9)) continue;
        L.push({ x, z, y: b.y || 0, bx: b.x, bz: b.z, di: INT_DOORS.indexOf(d) }); break; } } return L.slice(0, 3); });
    for (const s of spots) for (const away of [false, true]) {
      const r = await page.evaluate(async ([s, away]) => { px = s.x; pz = s.z; jumpY = s.y; onGround = true;
        for (const n of (INT_NPCS || [])) if (n.g) n.g.position.set(-50, n.g.position.y, -50);
        const eh = () => jumpY + (typeof _eyeHeightCur === 'number' ? _eyeHeightCur : 1.6);
        const door = INT_DOORS[s.di];
        const aim = () => away ? lookAtPt(door.x, door.y + .8, door.z) : lookAtPt(s.bx, s.y + .45, s.bz);
        const at = () => Math.abs(CAM.position.y - eh()) < .05 && Math.hypot(CAM.position.x - px, CAM.position.z - pz) < .05;
        for (let i = 0; i < 60; i++) { aim(); CAM.position.set(-99, -99, -99); await new Promise(r => requestAnimationFrame(() => r())); if (i >= 3 && at()) break; }
        aim(); const t = intBedTarget(); const want = t ? WORLD.bedPrompt(t) : null; const ipr = document.getElementById('ipr');
        const mid = ipr && ipr.style.display !== 'none' && +ipr.style.opacity > 0 ? ipr.textContent : '';
        const o0 = !!door.open;
        const S0 = openSleepUI, B0 = WORLD.bedInteract, M0 = showMsg, D0 = openDialog, P0 = openShop; let bed = false;
        openSleepUI = () => { bed = true; }; WORLD.bedInteract = () => { bed = true; return true; }; showMsg = () => {}; openDialog = () => {}; openShop = () => {};
        try { interact(); } finally { openSleepUI = S0; WORLD.bedInteract = B0; showMsg = M0; openDialog = D0; openShop = P0; }
        const toggled = !!door.open !== o0; if (toggled && typeof WORLD.intDoorInteract === 'function') WORLD.intDoorInteract(door);
        return { target: !!t, want, mid: mid.slice(0, 70), bed, toggled, doorNear: !!WORLD.intDoorPrompt() }; }, [s, away]);
      out.push(Object.assign({ site, house: id, away }, r)); }
    await page.evaluate(() => exitInterior()); await page.waitForFunction(() => currentHouse == null, null, { timeout: 60000 }); await g.frames(2);
  }
}
for (const o of out) console.log(' ', JSON.stringify(o));
const on = out.filter(o => !o.away && o.target && o.want), off = out.filter(o => o.away && o.doorNear);
check(`spots in reach of a bed and a door found (${on.length})`, on.length >= 3, out.length);
check('looking at the bed: E goes to the bed and leaves the door, which is not offered', on.every(o => o.bed && !o.toggled && !o.doorNear), on);
check('looking at the bed: the middle prompt is the bed\'s, not the door\'s', on.every(o => o.mid === o.want), on.map(o => [o.mid, o.want]));
check('the same spots looking at the door: E opens or shuts it, and the prompt names the door', off.length >= 3 && off.every(o => o.toggled && !o.bed && /door/.test(o.mid)), off);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
