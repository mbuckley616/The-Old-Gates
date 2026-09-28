// Photograph a town's houses from the street (Session 194): shots(page, townId, n) -> [dataURL], each a camera 13 units
// out from a house's door and 4 up, at noon, looking at the house.
export async function houseShots(page, town, n = 3) {
  return page.evaluate(([town, n]) => { forceTime(12); const S = WORLD.settlements.get(town); const out = []; const cv = REN.domElement, sc = WORLD.scene;
    const hs = S.houses.filter(h => h.doorX != null).slice(0, 40); const pickN = []; for (let i = 0; i < n; i++) pickN.push(hs[Math.floor((i + .5) * hs.length / n)]);
    for (const h of pickN) { if (!h) continue; const b = S.sol.find(s => s.hid && Math.hypot(s.cx - h.doorX, s.cz - h.doorZ) < 8) || { cx: h.doorX, cz: h.doorZ }; const tx = h.doorX - b.cx, tz = h.doorZ - b.cz, L = Math.hypot(tx, tz) || 1;
      const ex = h.doorX + tx / L * 13 + tz / L * 5, ez = h.doorZ + tz / L * 13 - tx / L * 5, ey = WORLD.worldH(ex, ez) + 4.2;
      const cam = new THREE.PerspectiveCamera(50, cv.width / cv.height, .1, 400); cam.position.set(ex, ey, ez); cam.lookAt(b.cx, WORLD.worldH(b.cx, b.cz) + 2.4, b.cz);
      CAM.position.copy(cam.position); WORLD.tick(1 / 60, performance.now()); sc.updateMatrixWorld(true); REN.render(sc, cam);
      const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); out.push(o.toDataURL()); }
    return out; }, [town, n]);
}
