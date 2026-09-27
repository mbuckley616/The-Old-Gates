// A line-up of houses by style (Session 194): each style's detailed house on a floor at noon, its plain distant copy
// behind it. lineup(page, keys, seed) -> dataURL
export async function houseLineup(page, keys, seed = 1, opts = {}) {
  return page.evaluate(([keys, seed, opts]) => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 500, bz = pz, y = WORLD.worldH(bx, bz) + 90;
    const cam = new THREE.PerspectiveCamera(opts.fov || 35, cv.width / cv.height, .3, 400); const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 80), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true }); const ms = []; const gap = opts.gap || 11;
    keys.forEach((k, i) => { const H = WORLD.houseProto(k, opts.w || 7, opts.d || 5, seed + i * 17, opts); const x = bx + (i - (keys.length - 1) / 2) * gap;
      const m = new THREE.Mesh(H.hi, mat); m.position.set(x, y, bz); m.rotation.y = opts.ry == null ? .35 : opts.ry; sc.add(m); ms.push(m);
      if (opts.lo !== false) { const l = new THREE.Mesh(H.lo, mat); l.position.set(x, y, bz - 12); l.rotation.y = m.rotation.y; sc.add(l); ms.push(l); } });
    const cz = opts.camZ || 20 + keys.length * 2.2; cam.position.set(bx, y + (opts.camY || 5), bz + cz); cam.lookAt(bx, y + 2.5, bz - 2); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0); ms.forEach(m => sc.remove(m)); sc.remove(floor); return o.toDataURL(); }, [keys, seed, opts]);
}
