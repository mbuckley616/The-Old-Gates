// The bestiary page for the creature kit (Session 772): every plan in creatures.js at true size, each beside a 1.8 m
// figure on a floor ruled in metres (?view=line), or one creature walking with its gaits, its seed and its sliders
// (?view=one&plan=ironwolf&gait=trot&seed=7). ?bones shows the skeleton through the flesh.
import * as THREE from 'three';
import { Q, W, H, STILL, STATS, makeRenderer, makeComposer, run } from './common.js';
import { PLANS, GAITS, SLIDERS, genome, build, pose, step, speedOf } from './creatures.js';

const R = makeRenderer(.9), scene = new THREE.Scene(); scene.background = new THREE.Color(.52, .58, .64); scene.fog = new THREE.Fog(scene.background, 60, 260);
const cam = new THREE.PerspectiveCamera(32, W / H, .05, 600);
const sun = new THREE.DirectionalLight(new THREE.Color(1, .93, .82), 3); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0003; sun.shadow.normalBias = .03;
scene.add(sun, sun.target, new THREE.HemisphereLight(new THREE.Color(.62, .7, .82), new THREE.Color(.3, .26, .2), 1.1));
const rim = new THREE.DirectionalLight(new THREE.Color(.7, .8, 1), 1.2); rim.position.set(-20, 12, -30); scene.add(rim);
// the floor: one-metre squares, every fifth line darker, over a mottled earth
function floorTex() { const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'); x.fillStyle = '#7d7462'; x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${60 + Math.random() * 50},${55 + Math.random() * 40},${40 + Math.random() * 30},.18)`; x.fillRect(Math.random() * 1024, Math.random() * 1024, 2 + Math.random() * 10, 2 + Math.random() * 10); }
  for (let i = 0; i <= 5; i++) { x.fillStyle = i % 5 === 0 ? 'rgba(30,26,20,.55)' : 'rgba(40,34,26,.3)'; const p = i * 1024 / 5, w = i % 5 === 0 ? 5 : 2; x.fillRect(p - w / 2, 0, w, 1024); x.fillRect(0, p - w / 2, 1024, w); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const FT = floorTex(); FT.repeat.set(400 / 5, 400 / 5);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: FT, roughness: .95 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
// the measure: a plain 1.8 m figure (grey; the people's builder makes the real ones)
function figure() { const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x8a8f96, roughness: .7 }), cap = (r, l, x, y, z) => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 12), m); c.position.set(x, y, z); c.castShadow = true; g.add(c); };
  cap(.075, .74, .1, .46, 0); cap(.075, .74, -.1, .46, 0); cap(.17, .42, 0, 1.2, 0); cap(.05, .56, .25, 1.12, 0); cap(.05, .56, -.25, 1.12, 0);
  const h = new THREE.Mesh(new THREE.SphereGeometry(.105, 20, 14), m); h.scale.set(.9, 1.12, 1); h.position.y = 1.68; h.castShadow = true; g.add(h); return g; }

const VIEW = Q.get('view') || 'line', SHOW_BONES = Q.has('bones'), live = [];
function skeletonView(C) { const h = new THREE.SkeletonHelper(C.rig); h.material.depthTest = false; h.material.linewidth = 2; h.material.color = new THREE.Color(1, .85, .2); scene.add(h);
  for (const m of C.meshes) { if (m.name.startsWith('fur')) m.visible = false; else { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = .35; m.material.depthWrite = false; } }
  C.rig.traverse(o => { if (o.isMesh && !o.isSkinnedMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .35; } }); }
const all = {}; STATS.creatures = all;
function make(plan, key, over) { const g = genome(plan, key, over); const C = build(g); C.gait = Q.get('gait') && PLANS[plan].gaits.includes(Q.get('gait')) ? Q.get('gait') : PLANS[plan].gaits[0];
  all[plan] = { ...C.stats, gait: C.gait, speed: +speedOf(C).toFixed(2), legs: C.B.legs.length }; if (SHOW_BONES) skeletonView(C); return C; }
const bbox = C => { C.root.updateMatrixWorld(true); C.meshes.forEach(m => m.computeBoundingBox && m.computeBoundingBox()); return new THREE.Box3().setFromObject(C.root); };

if (VIEW === 'line') {
  // every plan, small to large, turned three-quarters to the camera, each with the measure behind its shoulder
  const built = (Q.get('plans') ? Q.get('plans').split(',') : Object.keys(PLANS)).map((plan, i) => { const C = make(plan, plan + ':line:' + (+(Q.get('seed') || 0) + i)); pose(C, .15 + i * .23);
    C.root.rotation.y = Math.PI / 2 - .3; return { C, h: bbox(C).max.y }; }).sort((a, b) => a.h - b.h);
  let x = 0; const placed = [];
  for (const { C } of built) { scene.add(C.root); const b = bbox(C), w = b.max.x - b.min.x; C.root.position.x = x - b.min.x; const f = figure(); f.position.set(x + w / 2 + .3, 0, b.min.z - .6); scene.add(f);
    placed.push({ C, x0: x, x1: x + w }); x += w + Math.max(1.2, w * .18); live.push({ C, inPlace: true }); }
  const span = x, mid = span / 2, hmax = Math.max(...placed.map(p => bbox(p.C).max.y));
  cam.fov = 26; cam.updateProjectionMatrix(); const d = (span * .5) / Math.tan(cam.fov * Math.PI / 360) / (W / H);
  cam.position.set(mid, hmax * .5 + .6, d); cam.lookAt(mid, hmax * .36, 0);
  sun.position.set(mid + 30, 50, 40); sun.target.position.set(mid, 0, 0); Object.assign(sun.shadow.camera, { left: -span * .7, right: span * .7, top: 30, bottom: -30, near: 1, far: 200 }); sun.shadow.camera.updateProjectionMatrix();
} else {
  const plan = PLANS[Q.get('plan')] ? Q.get('plan') : 'ironwolf';
  const turn = C => { C.root.rotation.y = -(C.plan.heading || 0) * Math.PI / 180; }; // a crab walks sideways: turn it so it goes up the floor
  let C = make(plan, +(Q.get('seed') || 0) || plan + ':one'); turn(C); scene.add(C.root); live.push({ C });
  // a swimmer's water: a still surface above it (Session 774)
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x3d6f86, transparent: true, opacity: .28, roughness: .1, side: THREE.DoubleSide, depthWrite: false })); water.rotation.x = -Math.PI / 2; scene.add(water);
  const wet = C => { water.visible = !!C.plan.water; water.position.y = (C.plan.water || 0) * C.S; }; wet(C);
  const f = figure(); scene.add(f);
  const frame = () => { const b = bbox(C), size = b.getSize(new THREE.Vector3()), r = Math.max(size.x, size.y, size.z * .8);
    fz = b.min.z - C.root.position.z - .5; f.position.set(0, 0, C.root.position.z + fz);
    cam.fov = 30; cam.updateProjectionMatrix(); const cv = Q.get('cam') || 'side', d = r * 2.7 + .7;
    const off = cv === 'front' ? new THREE.Vector3(d * .35, size.y * .45, d) : cv === 'top' ? new THREE.Vector3(d * .3, d * 1.1, d * .2) : new THREE.Vector3(d, b.min.y + size.y * .45 + .4, d * .12);
    return { off, look: new THREE.Vector3(0, b.min.y + size.y * .4, (b.min.z - C.root.position.z) * .35) }; };
  pose(C, +(Q.get('phase') || .2)); let fz = 0, F = frame(); // framed in the pose it is shown in: a bird aloft is higher than one perched
  const place = () => { const p = C.root.position; cam.position.copy(p).add(F.off); cam.lookAt(p.x + F.look.x, F.look.y, p.z + F.look.z); sun.position.set(p.x + 25, 40, p.z + 30); sun.target.position.copy(p); };
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 150 }); sun.shadow.camera.updateProjectionMatrix();
  place(); live[0].refit = () => { pose(live[0].C, live[0].C.phase); F = frame(); place(); };
  live[0].follow = () => { if (C.root.position.z > 120) { C.root.position.z -= 240; } f.position.z = C.root.position.z + fz; place(); };
  if (!STILL) panel(plan, g => { scene.remove(C.root); C = make(g.plan, g.seed, g); turn(C); wet(C); C.gait = live[0].C.gait; scene.add(C.root); live[0].C = C; pose(C, 0); F = frame(); place(); });
}

// the panel (live view only): plan, gait, roll a seed, the generic sliders, and the genome as JSON
function panel(plan, rebuild) {
  const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:10px;top:10px;width:260px;background:rgba(20,22,26,.82);color:#efe7d6;font:13px/1.4 system-ui,sans-serif;padding:10px 12px;border-radius:6px;display:grid;gap:6px;max-height:92vh;overflow:auto';
  let g = genome(plan, +(Q.get('seed') || 0) || plan + ':one');
  const html = () => `<b style="font-size:15px;cursor:pointer" id=fold title="Fold the panel">${PLANS[g.plan].name} ▾</b><span style="opacity:.7">${PLANS[g.plan].src}</span>
    <label>Body plan <select id=pl>${Object.keys(PLANS).map(k => `<option value=${k}${k === g.plan ? ' selected' : ''}>${PLANS[k].name}</option>`).join('')}</select></label>
    <div>${PLANS[g.plan].gaits.map(k => `<button data-g=${k}>${k}</button>`).join(' ')}</div>
    <div><button id=roll>Roll a seed</button> <span id=sd>seed ${g.seed}</span></div>
    ${Object.keys(SLIDERS).map(k => `<label>${k} <input type=range min=${SLIDERS[k][0]} max=${SLIDERS[k][1]} step=.01 value=${g.sliders[k]} data-s=${k} style="width:150px"> <span>${g.sliders[k].toFixed(2)}</span></label>`).join('')}
    <textarea id=js rows=5 style="width:100%;font:11px monospace;background:#111;color:#cfc">${JSON.stringify(g)}</textarea>
    <span id=st style="opacity:.7"></span>`;
  const draw = () => { d.innerHTML = html(); const C = live[0].C; d.querySelector('#st').textContent = `${C.stats.bones} bones · ${C.stats.tris.toLocaleString()} triangles · built in ${C.stats.ms} ms · ${speedOf(C).toFixed(1)} m/s`;
    d.querySelector('#fold').onclick = () => { d.classList.toggle('folded'); [...d.children].forEach((c, i) => { if (i) c.style.display = d.classList.contains('folded') ? 'none' : ''; }); };
    d.querySelector('#pl').onchange = e => { g = genome(e.target.value, e.target.value + ':one'); rebuild(g); live[0].C.gait = PLANS[g.plan].gaits[0]; draw(); };
    d.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { live[0].C.gait = b.dataset.g; live[0].refit && live[0].refit(); });
    d.querySelector('#roll').onclick = () => { g = genome(g.plan, (Math.random() * 1e9) >>> 0); rebuild(g); draw(); };
    d.querySelectorAll('[data-s]').forEach(i => { i.oninput = () => i.nextElementSibling.textContent = (+i.value).toFixed(2); i.onchange = () => { g.sliders[i.dataset.s] = +i.value; rebuild(g); draw(); }; }); };
  document.body.appendChild(d); draw(); if (innerWidth < 700) d.querySelector('#fold').click();
}

const comp = makeComposer(R, scene, cam, { bloom: .18, bloomT: .95, sat: 1.05, vig: .3 });
run(comp, cam, { tick: (t, dt) => { if (STILL) return; for (const L of live) { step(L.C, dt); if (!L.inPlace) { L.C.root.position.z += L.C.moved || 0; L.follow && L.follow(); } } } });
