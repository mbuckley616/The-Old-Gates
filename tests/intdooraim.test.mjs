// A door in a doorway answers E only in reach AND with the crosshair on it (Session 680; Michael, 6 Oct 2026 playtest: "E
// should need range AND the reticle on the object"; the beds, boxes, hatches, chair and stash went over in Sessions
// 645–656, and the doors were left by nearness). In inns and back-room shops in two towns, stand 1.0 from a door on each
// side: looking at the doorway the prompt names the door and E opens it, and E again shuts it; looking along the wall or
// back into the room, no door is offered and E leaves it as it is; 1.8 away looking straight at it, nothing.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const out = [];
for (const site of ['dunmore', 'vieux_marche']) {
  await g.settle(site);
  const hs = await page.evaluate((site) => { const S = WORLD.settle.get(site); return S ? S.houses.filter(h => h.dlg && /inn|potion|weapon|armor|misc/.test(h.type)).slice(0, 4).map(h => h.id) : []; }, site);
  for (const id of hs) {
    await page.evaluate(([site, id]) => { const h = WORLD.settle.get(site).houses.find(x => x.id === id); window._bh = h; px = h.exitX; pz = h.exitZ; goToInterior(h); }, [site, id]);
    await page.waitForFunction(() => currentHouse === window._bh, null, { timeout: 60000 }); await g.frames(2); await g.hide();
    const n = await page.evaluate(() => (INT_DOORS || []).length);
    for (let di = 0; di < Math.min(n, 2); di++) for (const side of [1, -1]) {
      const r = await page.evaluate(async ([di, side]) => {
        const d = INT_DOORS[di]; const nx = Math.cos(d.ang), nz = -Math.sin(d.ang), ux = Math.sin(d.ang), uz = Math.cos(d.ang);
        for (const p of (INT_NPCS || [])) if (p.g) p.g.position.set(-50, p.g.position.y, -50);
        if (d.open) WORLD.intDoorInteract(d);
        const eh = () => jumpY + (typeof _eyeHeightCur === 'number' ? _eyeHeightCur : 1.6);
        const stand = async (dist, look) => { px = d.x + nx * side * dist; pz = d.z + nz * side * dist; jumpY = d.y; onGround = true;
          if (typeof intSolidAt === 'function' && intSolidAt(px, pz, .3, d.y)) return null;
          const aim = () => { const [tx, tz] = look === 'door' ? [d.x, d.z] : look === 'wall' ? [px + ux * 3, pz + uz * 3] : [px + nx * side * 3, pz + nz * side * 3]; lookAtPt(tx, look === 'door' ? d.y + .8 : eh(), tz); };
          const at = () => Math.abs(CAM.position.y - eh()) < .05 && Math.hypot(CAM.position.x - px, CAM.position.z - pz) < .05;
          for (let i = 0; i < 60; i++) { aim(); CAM.position.set(-99, -99, -99); await new Promise(r => requestAnimationFrame(() => r())); if (i >= 3 && at()) break; }
          aim(); const ipr = document.getElementById('ipr'); const mid = ipr && ipr.style.display !== 'none' && +ipr.style.opacity > 0 ? ipr.textContent : '';
          const o0 = !!d.open; const M0 = showMsg, D0 = openDialog, P0 = openShop, S0 = openSleepUI; showMsg = () => {}; openDialog = () => {}; openShop = () => {}; openSleepUI = () => {};
          try { interact(); } finally { showMsg = M0; openDialog = D0; openShop = P0; openSleepUI = S0; }
          const opened = !!d.open !== o0; let shut = null;
          if (opened) { showMsg = () => {}; try { interact(); } finally { showMsg = M0; } shut = !d.open; if (d.open) WORLD.intDoorInteract(d); }
          return { mid: /door/.test(mid), offered: !!WORLD.intDoorPrompt(), opened, shut }; };
        return { di, side, at: await stand(1.0, 'door'), wall: await stand(1.0, 'wall'), back: await stand(1.0, 'back'), far: await stand(1.8, 'door') }; }, [di, side]);
      if (r.at) out.push(Object.assign({ site, house: id }, r));
    }
    await page.evaluate(() => exitInterior()); await page.waitForFunction(() => currentHouse == null, null, { timeout: 60000 }); await g.frames(2);
  }
}
for (const o of out) console.log(' ', JSON.stringify(o));
const at = out.map(o => o.at), wall = out.map(o => o.wall).filter(Boolean), back = out.map(o => o.back).filter(Boolean), far = out.map(o => o.far).filter(Boolean);
check(`door sides stood at (${at.length}) in ${new Set(out.map(o => o.house)).size} houses`, at.length >= 6, out.length);
check('looking at the doorway in reach: the prompt names the door, E opens it and E again shuts it', at.every(o => o.mid && o.offered && o.opened && o.shut), at);
check('looking along the wall: no door offered, E leaves it shut', wall.length >= 4 && wall.every(o => !o.offered && !o.opened), wall);
check('looking back into the room: no door offered, E leaves it shut', back.length >= 4 && back.every(o => !o.offered && !o.opened), back);
check('1.8 away looking straight at it: out of reach', far.length >= 4 && far.every(o => !o.offered && !o.opened), far);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
