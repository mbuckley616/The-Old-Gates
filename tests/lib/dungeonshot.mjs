// Enter a dungeon of a given theme and seed and photograph it from a few places (look-and-feel sessions, Session 189).
// dungeonShots(page, {theme, seed, size, interior}) -> [{where, url}]; the scene is rendered with the game's own camera.
export async function enterDungeon(page, o = {}) {
  await page.evaluate((o) => { const p = Object.assign({}, PORTALS[0], { theme: o.theme || 'ruins', seed: o.seed || 11, size: o.size || 'medium', interior: o.interior || 'cave', zone: 'world', tutorial: false, lair: null }, o.name ? { name: o.name } : {});
    goToDungeon(p); }, o);
  for (let k = 0; k < 40 && !(await page.evaluate(() => activeZoneId === 'dungeon' && typeof dScene !== 'undefined' && scene === dScene)); k++) await page.waitForTimeout(500);
  await page.waitForTimeout(1500);
}
export async function dungeonShots(page) {
  return page.evaluate(() => { const out = [];
    // places with a long view: open cells with the most open cells ahead in one direction
    const open = (c, r) => r >= 0 && r < dR && c >= 0 && c < dC && dMap[r][c] > 0 && dMap[r][c] !== 2;
    const cands = []; for (let r = 1; r < dR - 1; r++) for (let c = 1; c < dC - 1; c++) { if (!open(c, r)) continue;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let n = 0; while (open(c + dc * (n + 1), r + dr * (n + 1)) && n < 12) n++; let wide = 0; for (let k = 1; k <= Math.min(n, 4); k++) wide += (open(c + dc * k + dr, r + dr * k + dc) ? 1 : 0) + (open(c + dc * k - dr, r + dr * k - dc) ? 1 : 0); cands.push({ c, r, dc, dr, n, wide }); } }
    cands.sort((a, b) => (b.n + b.wide * .7) - (a.n + a.wide * .7)); const picks = [cands[0], cands.find(x => x.wide <= 1 && x.n >= 5) || cands[3], cands[Math.floor(cands.length / 6)]].filter(Boolean);
    for (const p of picks) { px = p.c; pz = p.r; yaw = Math.atan2(-p.dc, -p.dr); pitch = -.08; CAM.position.set(px, 1.55, pz); CAM.rotation.set(0, 0, 0); CAM.rotation.order = 'YXZ'; CAM.rotation.y = yaw; CAM.rotation.x = pitch;
      const L = new THREE.PointLight(0xffa860, 1.6, 12); L.position.set(px + Math.sin(yaw) * .3, 1.5, pz + Math.cos(yaw) * .3); dScene.add(L); // a lantern carried behind the eye, the same for every picture
      CAM.updateMatrixWorld(true); REN.render(dScene, CAM); const cv = REN.domElement, o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); out.push({ where: [p.c, p.r, p.dc, p.dr], url: o.toDataURL() }); dScene.remove(L); }
    return out; });
}
