// A close portrait of townsfolk on a flat floor, for look-and-feel sessions: closeup(page, genomeTweaks, cam) -> dataURL
export async function closeup(page, opts = {}) {
  return page.evaluate((o) => { forceTime(12); const cv = REN.domElement, sc = WORLD.scene; const bx = px + 300, bz = pz, y = WORLD.worldH(bx, bz) + 60;
    const cam = new THREE.PerspectiveCamera(o.fov || 30, cv.width / cv.height, .05, 100);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshLambertMaterial({ color: 0x6a7a48 })); floor.rotation.x = -Math.PI / 2; floor.position.set(bx, y, bz); sc.add(floor);
    const rigs = []; const who = o.who || [{ name: 'Aoife', role: 'villager' }, { name: 'Brendan', role: 'farmer' }, { name: 'Cathal', role: 'guard' }, { name: 'Deirdre', role: 'villager' }];
    who.forEach((d, i) => { const gn = personGenome(d, { key: 'closeup' }); const r = buildPerson(gn, { noLod: true }); PEOPLE_RIGS.delete(r); r.root.position.set(bx + (i - (who.length - 1) / 2) * (o.gap || .9), y, bz); r.root.rotation.y = o.ry || 0; sc.add(r.root); rigs.push(r);
      pwApply(r, o.walk ? pwWalk(.25 * i, { holds: r.holds, gear: r.g.gear }) : pwIdle(1, { holds: r.holds, gear: r.g.gear, elder: r.g.age === 'elder' })); });
    const c = o.cam || [0, .9, 4.2], l = o.look || [0, .8, 0]; cam.position.set(bx + c[0], y + c[1], bz + c[2]); cam.lookAt(bx + l[0], y + l[1], bz + l[2]); sc.updateMatrixWorld(true); REN.render(sc, cam);
    const out = document.createElement('canvas'); out.width = cv.width; out.height = cv.height; out.getContext('2d').drawImage(cv, 0, 0);
    rigs.forEach(r => sc.remove(r.root)); sc.remove(floor); return out.toDataURL(); }, opts);
}
