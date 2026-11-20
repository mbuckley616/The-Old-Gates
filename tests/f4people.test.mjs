// Card F4 (Session 1195): on the new look the townsfolk wear the builder's bodies (docs/design/character-builder.md;
// vendor/people.builder.js and vendor/mh-pack.js, made by scripts/people_bundle.py). The old 17-bone rig still drives them;
// the builder's 163-bone skeleton copies its joints each frame (32-people.js, hbPose). Dunmore at noon: the people in the
// street are the genome's meshes, each the same person on a second boot, walking, under the draw-call budget at the middle
// quality, with the far ones on the cheap level. Pictures in docs/prototypes/f4/.
import { boot, check, ROOT } from './lib/game.mjs';
import { execFileSync } from 'child_process';
import fs from 'fs'; import path from 'path';
const OUT = path.join(ROOT, 'docs', 'prototypes', 'f4'); fs.mkdirSync(OUT, { recursive: true });

// the game's copy of the builder is people.js as it stands (a stale copy would put an old body in the game)
let fresh = true; try { execFileSync('python3', [path.join(ROOT, 'scripts', 'people_bundle.py'), '--check'], { stdio: 'pipe' }); } catch (e) { fresh = false; }
check('vendor/people.builder.js is what people.js makes now (python3 scripts/people_bundle.py)', fresh);

// Dunmore's square at noon, every body within reach of the eye built (one at a time, nearest first, as the game builds them)
async function dunmore(g) {
  const { page } = g;
  await g.intoWorld(); await g.settle('dunmore');
  return page.evaluate(() => { forceTime(12); for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
    const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 4; yaw = 0; pitch = 0; for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
    CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.updateMatrixWorld(true);
    const want = () => [...HB_RIGS].filter(r => (!r.hb || r.hb.cold) && !r.hbFail && r.root.parent === WORLD.scene && r.root.visible && Math.hypot(CAM.position.x - r.root.position.x, CAM.position.z - r.root.position.z) < HBODY.build).length;
    { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); } // the loading comes first (hbTick waits for it)
    REN.render(scene, CAM); const p0 = REN.info.programs.length; // the street drawn once, without the builder's bodies
    let k = 0; const t0 = performance.now(); while (want() && k++ < 1500) tickPeople(1 / 60, 1e5 + k * (HBODY.gap + 1));
    const p1 = REN.info.programs.length, shown = [...HB_RIGS].filter(r => r.hb && r.hb.L < 2).length; REN.render(scene, CAM);
    return { ticks: k, left: want(), ms: Math.round(performance.now() - t0), built: HBODY.n, msEach: Math.round(HBODY.ms / Math.max(1, HBODY.n)), frames: HBODY.frames, worst: Math.round(HBODY.worst), warmed: p1 - p0, shown, atDraw: REN.info.programs.length - p1 }; });
}

const g = await boot({ look: 'new' }); const { page } = g;
const b1 = await dunmore(g);
console.log('  built:', JSON.stringify(b1));
// S1284: a new body's programs are made before it is shown (hbWarm): the first frame that draws them compiles nothing
// S1294: a body is built a few pieces a frame (people.js's makePersonIter), not in one frame
check('each body is built over several frames, a few pieces at a time', b1.built >= 4 && b1.frames >= 2 * b1.built, b1);
check('the first frame that draws the new bodies compiles no program: they were made while the driver stood in', b1.shown >= 4 && b1.warmed > 0 && b1.atDraw === 0, b1);

const who = await page.evaluate(() => { const rs = [...PEOPLE_RIGS].filter(r => r.root.parent === WORLD.scene && !r.foe);
  const hb = rs.filter(r => HB_RIGS.has(r)), built = hb.filter(r => r.hb);
  return { people: rs.length, hb: hb.length, built: built.length, keys: hb.every(r => /^dunmore|:/.test(r.g.hbKey)),
    bones: [...new Set(built.map(r => r.hb.P.skeleton.bones.filter(b => !/^hemBone/.test(b.name)).length))], hem: built.filter(r => r.hb.P.hem).length, // S1989: a long cloak's hem adds one bone of its own (S1999: and its front another)
    driver: built.every(r => r.mesh.skeleton.bones.length >= 17 && r.mesh.skeleton.bones.length <= 20),
    tris: built.map(r => { let t = 0; r.hb.root.traverse(o => { if (o.isMesh) t += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return Math.round(t); }),
    statures: built.map(r => +(r.hb.st * r.hb.root.scale.x * r.root.scale.x).toFixed(2)), oldStatures: built.map(r => +(r.root.scale.y * SCALE.PERSON_MODEL / PW.BODY).toFixed(2)),
    peoples: [...new Set(built.map(r => r.hbG.people))], sample: built.slice(0, 6).map(r => r.g.hbKey) }; });
check('every townsperson in Dunmore wears the builder\'s body, keyed by place and name, on its 163-bone skeleton (a long cloak adds its hem\'s bone) over the 17-bone driver',
  who.people >= 8 && who.hb === who.people && who.built >= 4 && who.keys && who.bones.length === 1 && who.bones[0] === 163 && who.driver, who);
check('at the stature the game gives them (within 2 cm of the driver\'s)', who.statures.every((s, i) => Math.abs(s - who.oldStatures[i]) < .02), { s: who.statures, old: who.oldStatures });

// the same person on every load: the genome comes from the key alone
const genomes = await page.evaluate((keys) => Object.fromEntries(keys.map(k => [k, JSON.stringify(HB.toSaved(HB_GENOMES.get(k)))])), who.sample);
const again = await page.evaluate((keys) => keys.every(k => { const r = [...HB_RIGS].find(x => x.g.hbKey === k).g, o = { people: HB_GENOMES.get(k).people, g: r.female ? 0 : 1, child: !!r.child, old: r.age === 'elder' };
  return JSON.stringify(HB.toSaved(HB.rollGenome(k, o))) === JSON.stringify(HB.toSaved(HB.rollGenome(k, o))); }), who.sample);
check('a genome is the same rolled twice from its key', again);

// S2255 (S2253's note): loose hair falls down the back under a long cloak and rides the chest below the neck, as braids have since S1449.
// On the head's bone alone it swung through the sheet's back with each nod of the driver (dunmore#4:Niamh, 14% of the points by the
// cloak out of it, by up to 2.1 cm). Over 4 s in the street, every loose head under a long cloak (not a cape) whole within the eye's ring
// (S2260: Niamh is Dunmore's Mayor and since #1566 B wears the Crown's crimson cape, so the eye stands 3 m from the street's first loose head
// under a long cloak whose hair is drawn (Dunmore's first), until that body is whole)
const loose = await page.evaluate(() => { const C = [...HB_RIGS].filter(r => r.hbG && r.hbG.hair && r.hbG.hair.style === 'loose' && r.hbG.dress && r.hbG.dress.cloak && !r.hbG.dress.cape && r.root.parent === WORLD.scene && r.root.visible)
    .sort((a, b) => /^dunmore/.test(b.g.hbKey) - /^dunmore/.test(a.g.hbKey));
  let T = null; const eye = () => { const p = T.root.position, x = p.x, z = p.z + 3; CAM.position.set(x, worldH(x, z) + 1.65, z); CAM.updateMatrixWorld(true); };
  for (const c of C) { T = c; let t = 5.9e5; for (let k = 0; k < 600 && !(T.hb && T.hb.P && T.hb.L === 0); k++) { eye(); tickPeople(1 / 60, t += HBODY.gap + 1); } if (T.hb && T.hb.root.getObjectByName('hair')) break; T = null; } /* a hooded head draws no hair */
  if (T) { eye(); for (let i = 0; i < 60; i++) tickPeople(1 / 60, 5.99e5 + i * 17); }
  const rigs = [...HB_RIGS].filter(r => r.hb && r.hb.P && r.hb.L === 0 && r.hbG && r.hbG.hair && r.hbG.hair.style === 'loose' && r.hbG.dress && r.hbG.dress.cloak && !r.hbG.dress.cape && !!r.hb.root.getObjectByName('hair') && !!r.hb.root.getObjectByName('cloak'));
  const count = rig => { const H = rig.hb, ms = []; H.root.updateMatrixWorld(true); H.root.traverse(o => { if (o.isSkinnedMesh) ms.push(o); });
    const posed = m => { const n = m.geometry.attributes.position.count, o = new Float32Array(n * 3), v = new THREE.Vector3(); for (let i = 0; i < n; i++) { m.getVertexPosition(i, v); o[i * 3] = v.x; o[i * 3 + 1] = v.y; o[i * 3 + 2] = v.z; } return o; };
    const CP = [], CN = []; for (const m of ms.filter(m => m.name === 'cloak')) { const p = posed(m), gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(p, 3)); gg.setIndex(m.geometry.index); gg.computeVertexNormals(); const nn = gg.attributes.normal.array; for (let i = 0; i < p.length; i++) { CP.push(p[i]); CN.push(nn[i]); } }
    const cell = .04, grid = new Map(), key = (x, y, z) => Math.floor(x / cell) + ',' + Math.floor(y / cell) + ',' + Math.floor(z / cell);
    for (let q = 0; q < CP.length; q += 3) { const h = key(CP[q], CP[q + 1], CP[q + 2]); let l = grid.get(h); if (!l) grid.set(h, l = []); l.push(q); }
    const nk = new THREE.Vector3(); H.P.byName.neck01.getWorldPosition(nk); let n = 0, out = 0, worst = 0;
    for (const m of ms.filter(m => m.name === 'hair')) { const a = posed(m); for (let i = 0; i < a.length; i += 3) { if (a[i + 1] > nk.y - .1) continue; let best = -1, bd = .0016; const cx = Math.floor(a[i] / cell), cy = Math.floor(a[i + 1] / cell), cz = Math.floor(a[i + 2] / cell);
      for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) for (let w = -1; w <= 1; w++) { const l = grid.get((cx + u) + ',' + (cy + v) + ',' + (cz + w)); if (l) for (const q of l) { const d = (CP[q] - a[i]) ** 2 + (CP[q + 1] - a[i + 1]) ** 2 + (CP[q + 2] - a[i + 2]) ** 2; if (d < bd) { bd = d; best = q; } } }
      if (best < 0) continue; n++; const s = (a[i] - CP[best]) * CN[best] + (a[i + 1] - CP[best + 1]) * CN[best + 1] + (a[i + 2] - CP[best + 2]) * CN[best + 2]; if (s > 0) { out++; worst = Math.max(worst, s); } } }
    return { n, out, worst }; };
  const res = rigs.map(r => ({ key: r.g.hbKey, n: 0, out: 0, worst: 0, chest: (() => { const sk = r.hb.P.skeleton, cb = sk.bones.findIndex(b => b.name === 'spine03'); let on = 0; r.hb.root.traverse(m => { if (m.name === 'hair' && m.geometry.attributes.skinIndex.array.includes(cb)) on++; }); return on > 0; })() }));
  for (let f = 0; f < 8; f++) { for (let i = 0; i < 30; i++) tickPeople(1 / 60, 6e5 + f * 1000 + i * 17); rigs.forEach((r, k) => { const c = count(r); res[k].n += c.n; res[k].out += c.out; res[k].worst = Math.max(res[k].worst, +c.worst.toFixed(3)); }); }
  return res.map(r => ({ ...r, share: +(r.out / Math.max(1, r.n)).toFixed(4) })); });
console.log('  loose under a cloak:', JSON.stringify(loose));
check('loose hair under a long cloak rides the chest below the neck and stays under the sheet as they walk: under 2% of the hair by the cloak outside it, none by 1.2 cm',
  loose.length >= 1 && loose.every(r => r.chest && r.n > 1000 && r.share < .02 && r.worst < .012), loose);
// S2266 — a shoulder cape rides the chest (hbCapeChest): on the root, the spine's bend carried the loose hair under it out through its back
// (Niamh 2.8% → 0.5% of her hair by the cape, Caoimhe 10% → 4.2%)
const capeRide = await page.evaluate(() => [...HB_RIGS].filter(r => r.hb && r.hb.P && r.hbG && r.hbG.dress && r.hbG.dress.cape && r.hb.root.getObjectByName('cloak')).map(r => { const sk = r.hb.P.skeleton, il = sk.bones.indexOf(r.hb.P.byName.root), ic = sk.bones.indexOf(r.hb.P.byName.spine03); let root = 0, chest = 0;
  r.hb.root.traverse(m => { if (!m.isSkinnedMesh || !/^(cloak|cloakHem|brooch|collar\d)$/.test(m.name)) return; const si = m.geometry.attributes.skinIndex.array, sw = m.geometry.attributes.skinWeight.array; for (let i = 0; i < si.length; i++) if (sw[i] > 0) { if (si[i] === il) root++; if (si[i] === ic) chest++; } });
  return { key: r.g.hbKey, root, chest, loose: r.hbG.hair && r.hbG.hair.style === 'loose' && !!r.hb.root.getObjectByName('hair'), over: r.hb.P.cloak ? r.hb.P.cloak.overHair || 0 : -1 }; }));
console.log("  cape rides:", JSON.stringify(capeRide));
check(`a shoulder cape rides the chest, none of it on the root (${capeRide.length} caped bodies: ${capeRide.map(c => c.key + " " + c.chest).join(", ")})`, capeRide.length >= 1 && capeRide.every(c => c.root === 0 && c.chest > 1000), capeRide);
// S2285 (S2267's note): a cape is cleared of the body, and loose hair falls from the back of the head further out than that, so 4% of
// Caoimhe's came out through the cape's back by up to 2.6 cm; a cape over loose hair now stands 1 cm over the hair's own outline
// (buildCloak's overHair: the cape's points it moved out); measured in the street, Caoimhe 4.2% → 0.9% (1.4 cm), Niamh 0.5% → 0.2%
const capeLoose = capeRide.filter(c => c.loose);
check(`a shoulder cape over loose hair stands over the hair (${capeLoose.map(c => c.key + " " + c.over).join(", ")})`, capeLoose.length >= 1 && capeLoose.every(c => c.over > 100), capeLoose);


// S1763 (L1, OG-109's winter column): in winter, out of doors, a share of each people wear the kit's winter coat (the Aurennais the
// burnous); indoors and out of winter, none. 40 villagers a people under a test key, rolled in winter, indoors and in autumn
const winter = await page.evaluate(() => { const was = worldState.gameTimeAbsMinutes, peoples = ['gatelander', 'markman', 'oldblood', 'aurennais'];
  const forget = () => { for (const k of [...HB_GENOMES.keys()]) if (/^wtest/.test(k)) HB_GENOMES.delete(k); for (const k of [...PEOPLE_GENOMES.keys()]) if (/wtest/.test(k)) PEOPLE_GENOMES.delete(k); };
  const run = () => { const res = {}; for (const pk of peoples) { const o = { n: 0, coat: 0, fur: 0, burnous: 0, tint: 0 };
    for (let i = 0; i < 40; i++) { const root = buildNPCMesh({ role: 'villager', name: 'W' + pk + i, people: pk }, { key: 'wtest' }); const rig = [...HB_RIGS].find(x => x.root === root);
      if (!rig) continue; o.n++; const D = rig.hbG.dress; if (D.coat) { o.coat++; if (Math.abs(rig.g.cloth.r - D.coat[0]) < 1e-3) o.tint++; } if (D.coatFur) o.fur++; if (D.burnous) { o.burnous++; if (D.hood === 'down') { o.down = (o.down || 0) + 1; if (o.point == null) { const p = HB.makePerson(rig.hbG); o.point = !!(p.root.getObjectByName('hoodPoint') && p.root.getObjectByName('tassel')); } } }
      HB_RIGS.delete(rig); PEOPLE_RIGS.delete(rig); } res[pk] = o; } forget(); return res; };
  worldState.gameTimeAbsMinutes = 1440 * 28 * 4 + 600; const season = calDay().season, out = run();
  currentHouse = { id: 'wtest' }; const indoor = run(); currentHouse = null;
  worldState.gameTimeAbsMinutes = 600; const autumn = run(), season2 = calDay().season; worldState.gameTimeAbsMinutes = was;
  const sum = (R, f) => Object.values(R).reduce((s, o) => s + f(o), 0);
  return { season, season2, out, indoorAll: sum(indoor, o => o.coat + o.burnous), autumnAll: sum(autumn, o => o.coat + o.burnous) }; });
console.log('  winter:', JSON.stringify(winter));
const W = winter.out;
check('in winter, out of doors, a share of each people wear the winter coat (the Markmen most, fur-lined; the Aurennais the burnous) and the distant copy takes the coat\'s colour',
  winter.season === 'winter' && W.markman.coat >= 28 && W.markman.fur === W.markman.coat && W.gatelander.coat >= 10 && W.gatelander.coat <= 30 && W.oldblood.coat >= 5 && W.oldblood.fur === 0 &&
  W.aurennais.burnous >= 4 && W.aurennais.coat === 0 && Object.values(W).every(o => o.n === 40 && o.tint === o.coat), winter);
// S1770: a burnous worn with its hood down is built with the hood's point hanging down the back, its tassel at the point
check(`a burnous with its hood down (${W.aurennais.down || 0} of ${W.aurennais.burnous}) is built with the hood's point and its tassel`, W.aurennais.down > 0 && W.aurennais.point === true, W.aurennais);
check('indoors and out of winter nobody wears it', winter.season2 !== 'winter' && winter.indoorAll === 0 && winter.autumnAll === 0, winter);

// S1767 (L1, OG-109's Mark formal column): on a feast day seven in ten of the Mark's folk wear the woven bands (a man's tunic to the knee),
// indoors and out; nobody else, and nobody the day after. The Empty Chair falls in winter: out of doors a coat goes over the bands
const feast = await page.evaluate(() => { const was = worldState.gameTimeAbsMinutes, peoples = ['gatelander', 'markman', 'oldblood', 'aurennais'];
  const forget = () => { for (const k of [...HB_GENOMES.keys()]) if (/^ftest/.test(k)) HB_GENOMES.delete(k); for (const k of [...PEOPLE_GENOMES.keys()]) if (/ftest/.test(k)) PEOPLE_GENOMES.delete(k); };
  const run = () => { const res = {}; let one = null; for (const pk of peoples) { const o = { n: 0, bands: 0, knee: 0, men: 0, apron: 0, coat: 0, same: 0 };
    for (let i = 0; i < 40; i++) { const root = buildNPCMesh({ role: 'villager', name: 'F' + pk + i, people: pk }, { key: 'ftest' }); const rig = [...HB_RIGS].find(x => x.root === root);
      if (!rig) continue; o.n++; const D = rig.hbG.dress; if (D.bands) { o.bands++; if (D.skirt === 'knee') o.knee++; if (rig.hbG.g === 1 || rig.hbG.g === undefined && !rig.g.female) o.men++; if (D.apron) o.apron++; if (D.coat) o.coat++;
        if (D.bands.every((v, j) => Math.abs(v - D.bandsMotif[j]) < .02)) o.same++; if (!one && !D.coat) one = rig.hbG; }
      HB_RIGS.delete(rig); PEOPLE_RIGS.delete(rig); } res[pk] = o; } forget(); return { res, one }; };
  const at = n => { worldState.gameTimeAbsMinutes = 1440 * n + 600; return feastOn() ? feastOn().key : null; };
  const k1 = at(168), kind = run(); const k2 = at(169), after = run(); const k3 = at(111), season3 = calDay().season, chair = run();
  currentHouse = { id: 'ftest' }; const chairIn = run(); currentHouse = null; worldState.gameTimeAbsMinutes = was;
  let built = null; if (kind.one) { const keysOf = G => { const p = HB.makePerson(G), k = Object.fromEntries(p.meshes.filter(m => /^(tunic|skirt|cuffs)$/.test(m.name)).map(m => [m.name, m.material.customProgramCacheKey()])); p.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); return k; };
    const keys = keysOf(kind.one), plain = keysOf({ ...kind.one, dress: { ...kind.one.dress, bands: null, bandsMotif: null } });
    built = { loz: Object.keys(keys).filter(k => keys[k] !== plain[k]), knee: kind.one.dress.skirt !== 'knee' || (keys.skirt || '').includes('[-0.345,') }; }
  const sum = (R, f) => Object.values(R).reduce((s, o) => s + f(o), 0);
  return { k1, k2, k3, season3, mark: kind.res.markman, others: sum(kind.res, o => o.bands) - kind.res.markman.bands,
    after: sum(after.res, o => o.bands), chairOut: chair.res.markman, chairIn: chairIn.res.markman, built }; });
console.log('  feast:', JSON.stringify(feast));
const FM = feast.mark;
check('on a feast day seven in ten of the Mark\'s folk wear the woven bands (a man\'s tunic to the knee, the apron off, the lozenges never the ground\'s colour), nobody else, nobody the day after',
  feast.k1 === 'kindling' && feast.k2 === null && FM.n === 40 && FM.bands >= 20 && FM.bands <= 36 && FM.knee >= 1 && FM.apron === 0 && FM.same === 0 && feast.others === 0 && feast.after === 0, feast);
check('the bands are woven into the tunic, the skirt and the cuffs as the kit builds them; on the Empty Chair (winter) a coat goes over them out of doors, not by the hearth',
  !!feast.built && feast.built.loz.includes('tunic') && feast.built.knee && feast.k3 === 'emptychair' && feast.season3 === 'winter' && feast.chairOut.coat >= 15 && feast.chairIn.bands === FM.bands && feast.chairIn.coat === 0, feast);
// S2343 (L1, OG-109's Aurenne travel column): the kit's veil (S1237) on the road's people. An Aurennais traveller (def.roadfolk) with a
// wrap that is not a headscarf draws its end across the face, three in five; nobody at home, and no other people
const veil = await page.evaluate(() => { const o = {}; const one = (def, key) => { const root = buildNPCMesh(def, { key }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete(r); return r; };
  for (const pk of ['aurennais', 'gatelander', 'markman', 'oldblood']) for (const road of [true, false]) { const s = o[pk + (road ? ':road' : ':home')] = { n: 0, wrap: 0, veil: 0 };
    for (let i = 0; i < 60; i++) { const r = one({ role: 'villager', name: 'V' + pk + i, people: pk, female: i % 2 === 1, ...(road ? { roadfolk: 'v' + i } : {}) }, 'vtest'); if (!r) continue;
      s.n++; const D = r.hbG.dress; if (D.wrap && !D.scarf) s.wrap++; if (D.veil) s.veil++; } }
  let G = null; for (let i = 0; i < 60 && !G; i++) { const r = one({ role: 'villager', name: 'Vb' + i, people: 'aurennais', roadfolk: 'vb' + i }, 'vbody'); if (r && r.hbG.dress.veil) G = r.hbG; }
  const P = G && HB.makePerson(G, { hoodStats: false }); return { o, onHead: !!(P && P.byName['head'].getObjectByName('veil')) }; });
check(`an Aurennais on the road with a wrap draws the veil (${veil.o['aurennais:road'].veil} of ${veil.o['aurennais:road'].wrap}), on the head bone; nobody at home or of another people`,
  veil.o['aurennais:road'].veil >= veil.o['aurennais:road'].wrap * .35 && veil.o['aurennais:road'].veil > 0 && veil.onHead && Object.entries(veil.o).every(([k, v]) => k === 'aurennais:road' || v.veil === 0), JSON.stringify(veil.o));

// walking: a walker's builder bones follow the driver's stride
const walk = await page.evaluate(() => { const rig = [...HB_RIGS].find(r => r.hb && r.root.visible && r.root.parent === WORLD.scene && PEOPLE_RIGS.has(r) && !r.sleep && !r.g.gear && r.hb.L === 0); const root = rig.root, fy = root.rotation.y, sk = rig.hb.P.skeleton;
  const snap = () => { root.updateMatrixWorld(true); sk.update(); return Float32Array.from(sk.boneMatrices); };
  const m0 = snap(); let worst = 0, moved = 0;
  for (let i = 1; i <= 40; i++) { root.position.x += Math.sin(fy) * .012; root.position.z += Math.cos(fy) * .012; tickPeople(1 / 60, 3e5 + i * 16.7); }
  const m1 = snap(); for (let i = 0; i < m1.length; i++) { const d = Math.abs(m1[i] - m0[i]); if (d > 1e-4) moved++; worst = Math.max(worst, d); }
  // and the builder's foot stays with the driver's ankle
  const v = new THREE.Vector3(), w = new THREE.Vector3(); rig.B.anL.getWorldPosition(v); rig.hb.P.byName[HBODY.swap ? 'foot.R' : 'foot.L'].getWorldPosition(w);
  return { key: rig.g.hbKey, walk: +rig.w.walk.toFixed(2), level: rig.hb.L, moved, worst: +worst.toFixed(3), footGap: +v.distanceTo(w).toFixed(3), run: +rig.w.run.toFixed(2) }; });
check('walking, the builder\'s bones move with the stride (40 ticks) and its foot keeps to the driver\'s ankle', walk.walk > .9 && walk.moved > 200 && walk.worst > .05 && walk.footGap < .2, walk);

// S1434 — the arms under a cloak (Michael's #274): the cloak rides the pelvis, so through the walk the arms it covers are held in under
// it. Each cloaked walker's hand and forearm points (every other one) are read round the neck's axis against the cloak's columns, as
// people.js's armsThrough does at rest (one through by 3 mm counts: the shoulders still turn a little with the spine), on every third tick of a 60-tick walk; and an arm no cloak covers still swings
const cloaks = await page.evaluate(() => { const v = new THREE.Vector3();
  const test = rig => { const P = rig.hb.P, cloak = rig.hb.full.find(m => m.name === 'cloak'), body = rig.hb.full.filter(m => m.isSkinnedMesh && !m.name).sort((a, b) => b.geometry.attributes.position.count - a.geometry.attributes.position.count)[0];
    rig.root.updateMatrixWorld(true); const inv = cloak.matrixWorld.clone().invert(), K = 56, R = cloak.geometry.attributes.position.count / K, at = (m, i) => { m.getVertexPosition(i, v); return v.applyMatrix4(inv).clone(); };
    const neck = P.byName['neck01'].getWorldPosition(new THREE.Vector3()).applyMatrix4(inv), ax = neck.x, az = neck.z, pol = [];
    for (let k = 0; k < K; k++) { const c = []; for (let r = 0; r < R; r++) { const q = at(cloak, k * R + r); c.push({ th: Math.atan2(q.x - ax, -(q.z - az)), r: Math.hypot(q.x - ax, q.z - az), y: q.y }); } pol.push(c); }
    const col = (k, y) => { const c = pol[k]; let lo = 0; while (lo < R - 2 && c[lo + 1].y > y) lo++; const a = c[lo], b = c[lo + 1], t = Math.max(0, Math.min(1, (a.y - y) / Math.max(1e-6, a.y - b.y))); return { th: a.th + (b.th - a.th) * t, r: a.r + (b.r - a.r) * t }; };
    let yHem = -1e9; for (const c of pol) yHem = Math.max(yHem, c[R - 1].y); const yTop = neck.y - .14, bones = body.skeleton.bones, si = body.geometry.attributes.skinIndex, sw = body.geometry.attributes.skinWeight;
    if (!rig._arm) { rig._arm = []; for (let i = 0; i < si.count; i += 2) { let b = 0, w = 0; for (let q = 0; q < 4; q++) if (sw.getComponent(i, q) > w) { w = sw.getComponent(i, q); b = si.getComponent(i, q); } if (/upperarm|lowerarm|wrist|finger|metacarpal/.test(bones[b].name)) { rig._arm.push(i); (rig._armB = rig._armB || []).push(bones[b].name); } } }
    let tested = 0, out = 0, worst = 0, at0 = null;
    for (let ai = 0; ai < rig._arm.length; ai++) { const i = rig._arm[ai]; const p = at(body, i); if (p.y > yTop || p.y < yHem + .01) continue; const th = Math.atan2(p.x - ax, -(p.z - az)), r = Math.hypot(p.x - ax, p.z - az);
      if (th < col(1, p.y).th || th > col(K - 2, p.y).th) continue; let k = 1, A = col(1, p.y), B = col(2, p.y); while (k < K - 3 && B.th < th) { k++; A = B; B = col(k + 1, p.y); }
      const t = Math.max(0, Math.min(1, (th - A.th) / Math.max(1e-6, B.th - A.th))), cr = A.r + (B.r - A.r) * t; tested++; if (r - cr > worst) { worst = r - cr; at0 = rig._armB[ai] + '@' + p.y.toFixed(2); } if (r > cr + .003) out++; }
    return { tested, out, worst, at: at0 }; };
  const rigs = [...HB_RIGS].filter(r => r.hb && r.hb.L < 2 && r.root.parent === WORLD.scene && !r.sleep && r.hb.full.find(m => m.name === 'cloak')).slice(0, 4);
  return rigs.map(rig => { const root = rig.root, fy = root.rotation.y, hold = rig.hb.hold, o = { key: rig.g.hbKey, held: hold ? hold.size : 0, rest: test(rig), tested: 0, out: 0, worst: 0, swing: 0 };
    const wr = rig.hb.P.byName['wrist.R'], free = hold && !hold.has(rig.hb.map.findIndex(([j]) => j === 'wrR')), seen = [];
    for (let i = 1; i <= 60; i++) { root.position.x += Math.sin(fy) * .012; root.position.z += Math.cos(fy) * .012; tickPeople(1 / 60, 6e5 + i * 16.7);
      if (i > 15 && i % 3 === 0) { const c = test(rig); o.tested += c.tested; o.out += c.out; if (c.worst > o.worst) { o.worst = c.worst; o.at = c.at + ' tick ' + i + ' walk ' + rig.w.walk.toFixed(2); } if (free) seen.push(wr.getWorldPosition(new THREE.Vector3()).applyMatrix4(root.matrixWorld.clone().invert())); } }
    if (free) o.swing = +Math.max(...seen.map(a => Math.max(...seen.map(b => Math.abs(a.z - b.z))))).toFixed(3); o.free = !!free; o.worst = +o.worst.toFixed(3); o.walk = +rig.w.walk.toFixed(2); return o; }); });
console.log('  cloaks:', JSON.stringify(cloaks));
check(`walking, no arm comes out through a cloak (${cloaks.map(c => c.out + ' of ' + c.tested).join(', ')} hand and forearm points under it out by 3 mm or more, at most ${Math.max(...cloaks.map(c => c.worst)) * 1000} mm, ${cloaks.length} cloaked walkers)`,
  cloaks.length >= 2 && cloaks.every(c => c.held > 0 && c.walk > .9 && c.rest.out === 0 && c.tested > 1000 && c.out === 0 && c.worst < .006), cloaks);
const freeArm = cloaks.filter(c => c.free);
if (freeArm.length) check(`the right arm a thrown-back cloak leaves out still swings (the wrist ${freeArm.map(c => c.swing).join(', ')} m fore and aft)`, freeArm.every(c => c.swing > .05), freeArm);
// S1987 — the legs under a long cloak: the cloak rode the pelvis whole, so the stride carried a skirt, the trousers or the boots out through
// its sides and front (S1980's Sinéad, her tunic through at the hip). Its skirts are weighted in part to the thighs and shins (hbCloakLegs).
// The same cloaked walkers, every other point of what they wear on the legs (the legs' bones; the body's own legs too), read round the
// neck's axis against the cloak's columns as the arms are, on every third tick of a 60-tick walk; a point out by 3 mm counts
const cloakLegs = await page.evaluate(() => { const v = new THREE.Vector3();
  const test = rig => { const P = rig.hb.P, cloak = rig.hb.full.find(m => m.name === 'cloak');
    rig.root.updateMatrixWorld(true); const inv = cloak.matrixWorld.clone().invert(), K = 56, R = cloak.geometry.attributes.position.count / K, at = (m, i) => { m.getVertexPosition(i, v); return v.applyMatrix4(inv).clone(); };
    const neck = P.byName['neck01'].getWorldPosition(new THREE.Vector3()).applyMatrix4(inv), ax = neck.x, az = neck.z, pol = [];
    for (let k = 0; k < K; k++) { const c = []; for (let r = 0; r < R; r++) { const q = at(cloak, k * R + r); c.push({ th: Math.atan2(q.x - ax, -(q.z - az)), r: Math.hypot(q.x - ax, q.z - az), y: q.y }); } pol.push(c); }
    const col = (k, y) => { const c = pol[k]; let lo = 0; while (lo < R - 2 && c[lo + 1].y > y) lo++; const a = c[lo], b = c[lo + 1], t = Math.max(0, Math.min(1, (a.y - y) / Math.max(1e-6, a.y - b.y))); return { th: a.th + (b.th - a.th) * t, r: a.r + (b.r - a.r) * t }; };
    let yHem = -1e9; for (const c of pol) yHem = Math.max(yHem, c[R - 1].y); const yTop = neck.y - .14;
    if (!rig._legs) { rig._legs = []; for (const m of rig.hb.full.filter(m => m.isSkinnedMesh && /^(|skirt|trousers|boots|legWraps|apron)$/.test(m.name))) { const g = m.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bones = m.skeleton.bones, u = new Uint8Array(g.attributes.position.count);
      if (g.index) for (const i of g.index.array) u[i] = 1; else u.fill(1); const ix = [];
      for (let i = 0; i < u.length; i += 2) { if (!u[i]) continue; let b = 0, w = 0; for (let q = 0; q < 4; q++) if (sw.getComponent(i, q) > w) { w = sw.getComponent(i, q); b = si.getComponent(i, q); } if (/^(upperleg|lowerleg|foot|toe)/.test(bones[b].name)) ix.push(i); }
      rig._legs.push([m, ix]); } }
    let tested = 0, out = 0, worst = 0;
    for (const [m, ix] of rig._legs) for (const i of ix) { const p = at(m, i); if (p.y > yTop || p.y < yHem + .01) continue; const th = Math.atan2(p.x - ax, -(p.z - az)), r = Math.hypot(p.x - ax, p.z - az);
      if (th < col(1, p.y).th || th > col(K - 2, p.y).th) continue; let k = 1, A = col(1, p.y), B = col(2, p.y); while (k < K - 3 && B.th < th) { k++; A = B; B = col(k + 1, p.y); }
      const t = Math.max(0, Math.min(1, (th - A.th) / Math.max(1e-6, B.th - A.th))), cr = A.r + (B.r - A.r) * t; tested++; worst = Math.max(worst, r - cr); if (r > cr + .003) out++; }
    return { tested, out, worst }; };
  const rigs = [...HB_RIGS].filter(r => r.hb && r.hb.L < 2 && r.root.parent === WORLD.scene && !r.sleep && r.hb.full.find(m => m.name === 'cloak')).slice(0, 4);
  return rigs.map(rig => { const root = rig.root, fy = root.rotation.y, o = { key: rig.g.hbKey, legs: rig.hb.P.cloakLegs ? rig.hb.P.cloakLegs.n : 0, tested: 0, out: 0, worst: 0, hem: rig.hb.P.hem ? 0 : -1 };
    for (let i = 1; i <= 60; i++) { root.position.x += Math.sin(fy) * .012; root.position.z += Math.cos(fy) * .012; tickPeople(1 / 60, 7e5 + i * 16.7);
      if (rig.hb.P.hem) { o.hem = Math.max(o.hem, +rig.hb.P.hem.a.toFixed(2)); o.sL = Math.max(o.sL || 0, rig.hb.P.hem.aS[0]); o.sR = Math.max(o.sR || 0, rig.hb.P.hem.aS[1]); o.side = +Math.min(o.sL, o.sR).toFixed(2); }
      if (i > 15 && i % 3 === 0) { const c = test(rig); o.tested += c.tested; o.out += c.out; o.worst = Math.max(o.worst, c.worst); } }
    o.worst = +o.worst.toFixed(3); return o; }); });
console.log('  legs under the cloaks:', JSON.stringify(cloakLegs));
{ const T = cloakLegs.reduce((a, c) => a + c.tested, 0), O = cloakLegs.reduce((a, c) => a + c.out, 0);
  check(`walking, the legs stay under a long cloak: its skirts go with the thighs (${O} of ${T} points of what the legs wear out of it by 3 mm or more, ${cloakLegs.filter(c => c.tested).length} walkers in a long cloak)`,
    cloakLegs.filter(c => c.tested).length >= 2 && T > 3000 && cloakLegs.every(c => !c.tested || c.legs > 0) && O / T < .08, cloakLegs); }
// S1989 — the hem pushed by the heel: the back of a long cloak rides a bone of its own at the hips (hbCloakLegs adds it, hbHem swings it
// back by the further-trailing leg), so a trailing heel no longer goes out through the back hem (Clodagh of Dunmore, 16.8 cm out)
check(`walking, a long cloak's back hem swings back over the trailing heel (its bone up to ${Math.max(...cloakLegs.map(c => c.hem))} rad)`,
  cloakLegs.every(c => !c.tested || c.hem >= 0) && cloakLegs.filter(c => c.tested && c.hem > .1).length >= 2, cloakLegs);
// S2026 — and each side of the back by its own leg (Clodagh's heel 30–60° off straight back): over the walk both side bones swing back
check(`walking, each side of a long cloak's back swings back over its own heel (both side bones up to ${Math.max(...cloakLegs.map(c => c.side || 0))} rad)`,
  cloakLegs.filter(c => c.tested && c.side > .1).length >= 2, cloakLegs);
// S1974 — a braid laid over a long cloak stays over it in the walk (S1966 laid it there in the builder's pose). The cloak rides the pelvis
// (hbSkinLoose) and the hair the head, so the walk sank most of a braid under the sheet; the hair on the sheet now rides the pelvis too
// (hbHairOnCloak). Before the cast's checks, which leave Dunmore. One cloaked walker of Dunmore rebuilt with a long braid; every third point of it near the sheet (within 4 cm) read
// along the sheet's normal, at rest and on every third tick of a 60-tick walk past the 24th; then her own body is put back
const braidWalk = await page.evaluate(() => { const v = new THREE.Vector3();
  const rig = [...HB_RIGS].find(r => r.hb && r.root.parent === WORLD.scene && !r.sleep && r.hbG && r.hbG.dress && r.hbG.dress.cloak && !r.hbG.dress.cape); if (!rig) return null;
  const G0 = rig.hbG, G = JSON.parse(JSON.stringify(G0)); G.hair = { style: 'braid', len: .75 }; G.dress = Object.assign({}, G.dress, { hood: null, cloakLen: .9 });
  hbDrop(rig); rig.hbG = G; hbAttach(rig); if (!rig.hb) return { fail: true }; hbLevel(rig, 0); hbPose(rig);
  const P = rig.hb.P, full = rig.hb.full, hair = full.filter(m => m.isSkinnedMesh && /^(braid\d|tie|brush)$/.test(m.name)), parts = full.filter(m => m.isSkinnedMesh && /^(cloak|cloakHem|hood|collar\d)$/.test(m.name));
  const sample = () => { rig.root.updateMatrixWorld(true); const CP = [], CN = [];
    for (const m of parts) { const n = m.geometry.attributes.position.count, g2 = new THREE.BufferGeometry(), a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z; }
      g2.setAttribute('position', new THREE.BufferAttribute(a, 3)); if (m.geometry.index) g2.setIndex(m.geometry.index); g2.computeVertexNormals(); const nn = g2.attributes.normal.array; for (let i = 0; i < a.length; i++) { CP.push(a[i]); CN.push(nn[i]); } }
    const cell = .04, grid = new Map(); for (let q = 0; q < CP.length / 3; q++) { const h = Math.floor(CP[q * 3] / cell) + ',' + Math.floor(CP[q * 3 + 1] / cell) + ',' + Math.floor(CP[q * 3 + 2] / cell); let l = grid.get(h); if (!l) grid.set(h, l = []); l.push(q); }
    let n = 0, under = 0, worst = 0;
    for (const m of hair) { const c = m.geometry.attributes.position.count; for (let i = 0; i < c; i += 3) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); let best = -1, bd = cell * cell; const cx = Math.floor(v.x / cell), cy = Math.floor(v.y / cell), cz = Math.floor(v.z / cell);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let e = -1; e <= 1; e++) { const l = grid.get((cx + a) + ',' + (cy + b) + ',' + (cz + e)); if (l) for (const q of l) { const d = (CP[q * 3] - v.x) ** 2 + (CP[q * 3 + 1] - v.y) ** 2 + (CP[q * 3 + 2] - v.z) ** 2; if (d < bd) { bd = d; best = q; } } }
      if (best < 0) continue; const s = (v.x - CP[best * 3]) * CN[best * 3] + (v.y - CP[best * 3 + 1]) * CN[best * 3 + 1] + (v.z - CP[best * 3 + 2]) * CN[best * 3 + 2]; n++; if (s < -.003) under++; worst = Math.min(worst, s); } }
    return { n, under, worst }; };
  const rest = sample(), root = rig.root, fy = root.rotation.y, o = { key: rig.g.hbKey, ride: P.cloak && P.cloak.hairOver && P.cloak.hairOver.ride, rest, tested: 0, under: 0, worst: 0 };
  const T = performance.now() + 1e5; for (let i = 1; i <= 60; i++) { root.position.x += Math.sin(fy) * .012; root.position.z += Math.cos(fy) * .012; tickPeople(1 / 60, T + i * 16.7);
    if (i > 24 && i % 3 === 0) { const c = sample(); o.tested += c.n; o.under += c.under; o.worst = Math.min(o.worst, c.worst); } }
  o.worst = +o.worst.toFixed(4); o.walk = +rig.w.walk.toFixed(2); o.w = Object.fromEntries(Object.entries(rig.w).map(([k, x]) => [k, +x.toFixed(2)]));
  hbDrop(rig); rig.hbG = G0; hbAttach(rig); if (rig.hb) { hbLevel(rig, 0); hbPose(rig); } o.back = !!rig.hb && rig.hbG === G0 && rig.hb.P.hair.style === (G0.hair && G0.hair.style || rig.hb.P.hair.style); return o; });
console.log('  braid over the cloak:', JSON.stringify(braidWalk));
check(`walking, a braid laid over a long cloak stays over it (${braidWalk && braidWalk.under} of ${braidWalk && braidWalk.tested} of its points near the sheet under it by 3 mm or more; it rides the pelvis where it lies on the cloth)`,
  !!braidWalk && !braidWalk.fail && braidWalk.ride && braidWalk.ride.n > 500 && braidWalk.rest.under === 0 && braidWalk.walk > .9 && braidWalk.tested > 3000 && braidWalk.under <= braidWalk.tested * .002 && braidWalk.back, braidWalk);

// the levels by distance, and the budget at the middle quality
const lv = await page.evaluate(() => { SETTINGS.quality = 1; const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 4; yaw = 0; pitch = 0;
  CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.rotation.set(0, 0, 0); CAM.updateMatrixWorld(true); tickPeople(1 / 60, 4e5);
  const rs = [...HB_RIGS].filter(r => r.hb && r.root.parent === WORLD.scene && r.root.visible), d = r => Math.hypot(CAM.position.x - r.root.position.x, CAM.position.z - r.root.position.z);
  const bad = rs.filter(r => (d(r) < HBODY.near - 1 && r.hb.L !== 0) || (d(r) > HBODY.mid + 1 && r.hb.L !== 2) || (r.hb.L === 2) !== r.mesh.visible || (r.hb.L < 2) !== r.hb.root.visible).map(r => [r.g.hbKey, +d(r).toFixed(1), r.hb.L]);
  const t0 = performance.now(); REN.render(scene, CAM); const ms = performance.now() - t0, calls = REN.info.render.calls, tris = REN.info.render.triangles;
  // the same view with every builder's body on its driver's distant copy: what the old bodies cost here
  const keep = rs.map(r => r.hb.L); rs.forEach(r => hbLevel(r, 2)); REN.render(scene, CAM); const base = { calls: REN.info.render.calls, tris: REN.info.render.triangles }; rs.forEach((r, i) => hbLevel(r, keep[i]));
  const big = rs.map(r => { const m = []; r.hb.root.traverse(o => { if (o.isMesh) m.push([o.name || '?', Math.round((o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3)]); }); return { k: r.g.hbKey, n: m.length, top: m.sort((a, b) => b[1] - a[1]).slice(0, 4) }; }).sort((a, b) => b.top[0][1] - a.top[0][1])[0];
  return { calls, tris, base, big, n: rs.length, levels: [0, 1, 2].map(L => rs.filter(r => r.hb.L === L).length), bad, ms: Math.round(ms) }; });
console.log('  budget: Dunmore at noon with the builder\'s townsfolk:', JSON.stringify(lv));
check('near bodies whole, middle ones without their cards, far ones the driver\'s distant copy', lv.n >= 4 && lv.bad.length === 0, lv);
check('Dunmore at noon stays under the budget\'s 1,000 draw calls at the middle quality', lv.calls > 50 && lv.calls < 1000, lv);
// the middle level is one draw call: the body baked into one mesh on the same skeleton
const mid = await page.evaluate(() => { const rig = [...HB_RIGS].find(r => r.hb && r.root.visible && r.root.parent === WORLD.scene); const p = rig.root.position;
  CAM.position.set(p.x + 25, worldH(p.x + 25, p.z) + 1.65, p.z); CAM.updateMatrixWorld(true); tickPeople(1 / 60, 4.5e5);
  const shown = []; rig.hb.root.traverse(o => { if (!o.isMesh) return; let v = true; for (let q = o; q && q !== rig.root; q = q.parent) v = v && q.visible; if (v) shown.push(o); });
  const m = rig.hb.mid, t = (m.geometry.index.count / 3) | 0; let full = 0; for (const o of rig.hb.full) full += ((o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3) | 0;
  return { key: rig.g.hbKey, level: rig.hb.L, shown: shown.length, mid: shown[0] === m, skinned: m.isSkinnedMesh && m.skeleton === rig.hb.P.skeleton, tris: t, fullTris: full, ok: !!rig.hb.full.length }; });
check('a body in the middle range is one mesh on its own skeleton, the whole body baked', mid.level === 1 && mid.shown === 1 && mid.mid && mid.skinned && mid.tris > 10000, mid);
// S2232 — the middle level keeps the hair: a head of long hair bakes a few thousand opaque ribbons from its cards (it was the scalp's shell
// alone, bald from 16 to 42 m), and a bed's fit (hbSkinPts) never reads them
const midHair = await page.evaluate(() => { const rs = [...HB_RIGS].filter(r => r.hb && !r.foe && !r.hbLazy && r.root.parent === WORLD.scene && r.hb.full.some(o => o.name === 'hair' && o.geometry.index && (o.geometry.userData.hairIx && o.geometry.userData.hairIx[1] || o.geometry.index).count > 3e5));
  const rig = rs[0]; if (!rig) return { none: true }; const m = hbMid(rig); if (!m) return { fail: true }; const hr = m.geometry.userData.hair || [];
  let hv = 0; for (let k = 0; k < hr.length; k += 2) hv += hr[k + 1] - hr[k];
  let cards = 0; for (const o of rig.hb.full) if (o.name === 'hair') cards += (o.geometry.userData.hairIx && o.geometry.userData.hairIx[1] || o.geometry.index).count / 3;
  rig.hb.used = null; const pts = hbSkinPts(rig).length / 3, used = rig.hb.used.length; let inHair = 0; for (const i of rig.hb.used) for (let k = 0; k < hr.length; k += 2) if (i >= hr[k] && i < hr[k + 1]) inHair++;
  return { key: rig.g.hbKey, hairVerts: hv, ribbons: hv / 2 - 1, cards: Math.round(cards), pts, used, inHair }; });
check(`a head of long hair keeps its hair in the middle level (${midHair.hairVerts} points of ribbon from ${midHair.cards} card triangles), and a bed's fit reads none of it`,
  midHair.none || (midHair.hairVerts > 1500 && midHair.hairVerts < 16000 && midHair.inHair === 0 && midHair.pts === midHair.used), midHair);
// S2182 — a near body's hair cards are drawn through every 3rd strand point at Middle (S2253: every 6th at Low), every point at High; the same strands
const hairQ = await page.evaluate(() => { const rig = [...HB_RIGS].find(r => r.hb && !r.foe && !r.hbLazy && r.hb.full.some(m => m.name === 'hair' && m.geometry.index));
  if (!rig) return null; const m = rig.hb.full.find(o => o.name === 'hair'), g = m.geometry, tris = () => g.index.count / 3, used = () => new Set(g.index.array).size;
  const q0 = SETTINGS.quality, at = q => { SETTINGS.quality = q; hbLevel(rig, 1); hbLevel(rig, 0); return { tris: tris(), pts: used() }; };
  const hi = at(2), mid = at(1), lo = at(0); SETTINGS.quality = q0; hbLevel(rig, 1);
  return { key: rig.g.hbKey, hi, mid, lo, pos: g.attributes.position.count }; });
console.log('  hair by quality:', JSON.stringify(hairQ));
check(`a near body's hair is drawn through every 3rd strand point at Middle (${hairQ && hairQ.mid.tris} of ${hairQ && hairQ.hi.tris} triangles), every 6th at Low (${hairQ && hairQ.lo.tris}) and whole at High`,
  hairQ && hairQ.hi.pts === hairQ.pos && hairQ.mid.tris < hairQ.hi.tris * .4 && hairQ.mid.tris > hairQ.hi.tris * .25 && hairQ.lo.tris < hairQ.mid.tris * .75 && hairQ.lo.tris > hairQ.hi.tris * .12, hairQ);
// far away every body is the cheap level
const far = await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); CAM.position.set(t.x, worldH(t.x, t.z + 70) + 1.65, t.z + 70); CAM.updateMatrixWorld(true); tickPeople(1 / 60, 5e5);
  const rs = [...HB_RIGS].filter(r => r.hb && r.root.parent === WORLD.scene && r.root.visible && Math.hypot(CAM.position.x - r.root.position.x, CAM.position.z - r.root.position.z) > HBODY.mid + 1);
  return { n: rs.length, cheap: rs.filter(r => r.hb.L === 2 && r.mesh.visible && !r.hb.root.visible).length }; });
check('from 70 m every body past the middle range is on the cheap level', far.n >= 1 && far.cheap === far.n, far);

// pictures: the square, a market, a crowd at 60 m, an inn's common room
// S1224: a frame of the square with its bodies whole takes 7 to 21 s here on software GL and about five times that on a CI runner, so
// the harness's 120 s a picture (S808) ran out on the square twice in a row (#513's run); the pictures get 300 s
const SHOT_MS = 300000;
// S1262: the pictures only when asked (F4_PICS=1). On CI they took about 12 of the suite's 15 minutes, so with the second boot after them it
// met the 900 s a suite is given on both tries (#568, run 39648922301); and each run rewrote the committed pictures. Every check stays
const PICS = process.env.F4_PICS === '1';
if (PICS) {
const shoot = async (name, fn) => { await page.evaluate(fn); for (let i = 0; i < 6; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); } await page.screenshot({ path: path.join(OUT, name), timeout: SHOT_MS }); };
await shoot('f4-square.jpg', () => { const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 4; yaw = 0; pitch = -.06; });
await shoot('f4-market.jpg', () => { const r = [...HB_RIGS].filter(r => r.hb && r.root.visible && r.root.parent === WORLD.scene).sort((a, b) => Math.hypot(a.root.position.x - px, a.root.position.z - pz) - Math.hypot(b.root.position.x - px, b.root.position.z - pz))[0];
  const p = r.root.position, fy = r.root.rotation.y; px = p.x + Math.sin(fy) * 3; pz = p.z + Math.cos(fy) * 3; yaw = Math.atan2(-(p.x - px), -(p.z - pz)); pitch = -.08; });
// the middle level close up beside the whole body: the market's person from 3 m (near 0 shows the bake; then restored)
for (const [name, near] of [['f4-whole.jpg', 16], ['f4-baked.jpg', 0]]) {
  await page.evaluate((near) => { HBODY.near = near; }, near); for (let i = 0; i < 4; i++) { await page.evaluate(() => tickPeople(1 / 60, performance.now())); await g.frames(1); }
  await page.screenshot({ path: path.join(OUT, name), clip: { x: 440, y: 120, width: 400, height: 480 }, timeout: SHOT_MS }); }
await page.evaluate(() => { HBODY.near = 16; });
await shoot('f4-crowd60.jpg', () => { const t = WORLD.siteAnywhere('dunmore'); px = t.x; pz = t.z + 60; yaw = 0; pitch = -.03; });
}
const inn = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const h = S.houses.find(x => x.type === 'inn') || S.houses[0]; px = h.exitX; pz = h.exitZ; goToInterior(h); return h.type; });
for (let k = 0; k < 40 && !(await page.evaluate(() => isInterior())); k++) await page.waitForTimeout(250);
await page.evaluate(() => { HBODY.last = -1e9; }); // the ticks above ran on made-up clocks; the room runs on the page's own
for (let k = 0; k < 12; k++) { await g.frames(1); await page.evaluate(() => tickPeople(1 / 60, performance.now())); }
const room = await page.evaluate(() => { const rs = [...HB_RIGS].filter(r => r.root.parent === scene);
  return { inside: isInterior(), people: rs.length, built: rs.filter(r => r.hb).length }; });
if (PICS) await page.screenshot({ path: path.join(OUT, 'f4-inn.jpg'), timeout: SHOT_MS });
check('in the inn\'s common room the keeper and the drinkers wear the builder\'s bodies too', room.inside && room.people >= 1 && room.built === room.people, { inn, ...room });
check('no page errors', g.errs.length === 0, g.errs.slice(0, 3));
// S1792 (L2, OG-069): the cast (last on this boot: the cloak walk above is sensitive to what ran before it, S1770). Bram, Edna and Corwin at Ashenmoor (and Corwin authored at a harbour) wear the builder's CAST genome, not a
// roll of their key, and the driver follows it (Edna's town roll had made her a young man of 1.85); an Edna of another town is her own woman
const cast = await page.evaluate(() => { const forget = () => { for (const m of [HB_GENOMES, PEOPLE_GENOMES]) for (const k of [...m.keys()]) if (/ctest|ashenmoor|Corwin/.test(k)) m.delete(k); };
  const one = (def, key) => { const root = buildNPCMesh(def, { key }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete && PEOPLE_RIGS.delete(r);
    return { cast: r.hbG.cast || null, fem: r.g.female, age: r.g.age, st: +(r.g.height * personScale(r.g) * SCALE.PERSON_MODEL).toFixed(2), sheet: r.hbG.g === 0,
      hair: r.hbG.hair.style, apron: !!r.hbG.dress.apronLeather, tartan: !!r.hbG.dress.tartan, cape: !!r.hbG.dress.cape, waistcoat: !!r.hbG.dress.waistcoat,
      dHat: r.g.hat, dGear: r.g.gear, dEx: r.g.extras.length, dApron: r.g.apron != null, dStyle: r.g.style, dCloth: r.g.cloth && r.g.cloth.isColor ? r.g.cloth.getHexString() : null, people: r.hbG.people, marks: r.hbG.marks ?? null, robe: !!r.hbG.dress.robe,
      want: (D => D.helm ? 'helm' : (D.cloak && D.hood === 'up') || (D.coat && D.coatHood === 'up') || D.cowl ? 'hood' : (D.wrap || D.scarf) ? 'kerchief' : 'none')(r.hbG.dress) }; };
  forget(); const out = { bram: one({ name: 'Bram', role: 'Blacksmith' }, 'ashenmoor'), edna: one({ name: 'Edna', role: 'Herbalist' }, 'ashenmoor'),
    corwin: one({ name: 'Corwin', role: '', authored: true, people: 'gatelander' }, 'ctest_port'), other: one({ name: 'Edna', role: 'Herbalist' }, 'ctest_town'),
    corwinHome: one({ name: 'Corwin', role: 'Traveling Merchant' }, 'ashenmoor'), aldwyn: one({ name: 'Aldwyn', role: 'Royal Herald', authored: true, people: 'gatelander' }, 'ctest_ironhaven') }; forget(); return out; });
check('the cast: Bram and Edna at Ashenmoor wear the sheet (the leather apron; the green cape and the bun), the driver at the sheet\'s sex, age and stature',
  cast.bram.cast === 'Bram' && cast.bram.apron && !cast.bram.tartan && cast.bram.st === 1.82 && !cast.bram.fem &&
  cast.edna.cast === 'Edna' && cast.edna.fem && cast.edna.age === 'elder' && cast.edna.cape && cast.edna.hair === 'bun' && cast.edna.st === 1.6, cast);
check('Corwin authored at a harbour is the same man in his madder and gold; an Edna of another town keeps her own roll', cast.corwin.cast === 'Corwin' && cast.corwin.waistcoat && cast.other.cast === null, cast);
// S1798 (section I): Edna and Áine carry their sticks again, and the short cape opens on the staff's side instead of being draped over its
// forearm (S1792: it came out level with the arm as a slab 38 cm in front of the neck; without the staff 23 cm)
// S1832 (section I, critic 4 Nov): the far copy wears the sheet too, not the role's hat and gear: no hat on any, Edna's stick, Bram's apron, no bag
check('the cast\'s driver (the far copy) wears the sheet: no hat, Edna\'s stick, Bram\'s apron and hammer (S1835), Corwin no merchant\'s brim or bag; another town\'s Edna wears her own genome\'s head (S2332: no longer the role\'s kerchief)',
  cast.bram.dHat === 'none' && cast.bram.dApron && cast.bram.dGear === 'hammer' && cast.edna.dHat === 'none' && cast.edna.dGear === 'stick' && cast.edna.dEx === 0 && cast.edna.dStyle === 'bun' &&
  cast.corwinHome.cast === 'Corwin' && cast.corwinHome.dHat === 'none' && cast.corwinHome.dEx === 0 && cast.corwinHome.dGear === null && cast.corwin.dHat === 'none' &&
  cast.other.dHat === cast.other.want, cast);
// S2103 (L2, OG-053, Michael's 10 B): Aldwyn, authored beside Ironhaven's plaza, is the herald of the sheet: Old Blood though his def names
// him a Gatelander (the sheet's people is fixed), his marks no further than the wrist, the crimson robe and the cape, 1.6 m, an elder on his stick
check('Aldwyn authored at Ironhaven wears the herald\'s sheet: Old Blood, marked only at the wrist, the crimson robe and cape, an elder of 1.6 m on his staff',
  cast.aldwyn.cast === 'Aldwyn' && cast.aldwyn.people === 'oldblood' && cast.aldwyn.marks > 0 && cast.aldwyn.marks < .1 && cast.aldwyn.robe && cast.aldwyn.cape &&
  cast.aldwyn.st === 1.6 && cast.aldwyn.age === 'elder' && !cast.aldwyn.fem && cast.aldwyn.dGear === 'stick' && cast.aldwyn.dHat === 'none', cast.aldwyn);
const capes = await page.evaluate(() => { const out = {}; for (const nm of ['Edna', 'Áine']) { const G = HB.castGenome(nm, {}), P = HB.makePerson(G, { hoodStats: false });
    P.root.updateMatrixWorld(true); const cl = P.root.getObjectByName('cloak'), pa = cl.geometry.attributes.position, v = new THREE.Vector3(), n = new THREE.Vector3(); P.byName['neck01'].getWorldPosition(n);
    let fwd = -1; for (let i = 0; i < pa.count; i++) fwd = Math.max(fwd, v.fromBufferAttribute(pa, i).applyMatrix4(cl.matrixWorld).z - n.z);
    out[nm] = { staff: !!P.root.getObjectByName('staff'), fwd: +fwd.toFixed(3), out: P.cloak.through.out, under: P.cloak.under }; } return out; });
// S2106 (OG-053): the herald's brooch carries the Crown's wheel-and-compass, worked into its face, at the cape's throat and clear of the cloth's top
const herald = await page.evaluate(() => { const P = HB.makePerson(HB.castGenome('Aldwyn', {}), { hoodStats: false }); P.root.updateMatrixWorld(true); const b = P.root.getObjectByName('brooch'), n = new THREE.Vector3(), w = new THREE.Vector3();
  P.byName['neck01'].getWorldPosition(n); if (b) b.getWorldPosition(w); return { device: b ? b.userData.device || null : null, map: !!(b && b.material.map), r: b ? b.geometry.parameters.radiusTop : 0, fromNeck: +w.distanceTo(n).toFixed(3), plain: (() => { const Q = HB.makePerson(HB.castGenome('Edna', {}), { hoodStats: false }), c = Q.root.getObjectByName('brooch'); return c ? c.userData.device || 'plain' : null; })() }; });
check('Aldwyn\'s brooch is the herald\'s device (the wheel and compass worked into its face, 4.8 cm), within 20 cm of his neck; Edna\'s stays plain', herald.device === 'herald' && herald.map && herald.r === .024 && herald.fromNeck < .2 && herald.plain === 'plain', herald);
// S2113 (L2, OG-053): Aldwyn's travelling dress, the charcoal coat with its hood down and the satchel on his left hip on its strap over the right
// shoulder: nothing of him inside the bag or up through the strap, his hanging arm clear of it; the herald's dress carries none
const satchel = await page.evaluate(() => { const one = o => { const P = HB.makePerson(HB.castGenome('Aldwyn', o), { hoodStats: false }), b = P.root.getObjectByName('satchel'), s = P.root.getObjectByName('satchelStrap'); return { bag: !!b, strap: !!s, coat: !!P.root.getObjectByName('coat'), st: P.satchel, onHip: !!(b && b.parent && /^spine0[12]$/.test(b.parent.name)) }; };
  return { travel: one({ outfit: 'travel' }), herald: one({}) }; });
const st = satchel.travel.st || {};
check('Aldwyn travels in the charcoal coat with the satchel on his hip: 0 points inside the bag, his arm clear of it, nothing through its strap; the herald carries none', satchel.travel.bag && satchel.travel.strap && satchel.travel.coat && satchel.travel.onHip && st.inside === 0 && st.armInside === 0 && !st.armIn && st.strap.through === 0 && st.strap.tested > 100 && st.strap.len > 1.2 && st.strap.len < 2.2 && !satchel.herald.bag && !satchel.herald.coat, satchel);
// S2242 (#1540 B; OG-048, OG-091): the law's two officers by their role's word. The lord's forester in moss green and a leather jerkin under the
// lord's crimson hooded cape, a crossbow in his fist; the Church's inquisitor in a long white tabard over mail, the red shuttle on its
// breast and a white hood, and white far off too. Nothing of either body comes through the tabard
const office = await page.evaluate(() => { const one = (def) => { const root = buildNPCMesh(def, { key: 'otest' }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete && PEOPLE_RIGS.delete(r);
    const D = r.hbG.dress, P = HB.makePerson(r.hbG, { hoodStats: false }), has = n => !!P.root.getObjectByName(n);
    return { cape: !!D.cape, crimson: !!(D.cloak && D.cloak[0] > .4 && D.cloak[1] < .2), hood: has('hoodUp'), crossbow: has('crossbow') || !!D.crossbow, jerkin: !!D.waistcoatLeather, mail: has('mail'), tabard: has('tabard'),
      sign: P.tabard ? P.tabard.sign : 0, out: P.tabard ? P.tabard.out : null, tested: P.tabard ? P.tabard.tested : 0, far: r.g.cloth && r.g.cloth.isColor ? +r.g.cloth.r.toFixed(2) : null, guard: GUARD_ROLE.test(def.role.toLowerCase()) }; };
  return { forester: one({ role: 'Forester', name: 'Tadhg', people: 'gatelander' }), inquisitor: one({ role: 'Inquisitor', name: 'Alain', people: 'aurennais' }) }; });
console.log('  office:', JSON.stringify(office));
check('the lord\'s forester wears the crimson hooded cape over a leather jerkin and carries a crossbow; he is not a guard', office.forester.cape && office.forester.crimson && office.forester.hood && office.forester.crossbow && office.forester.jerkin && !office.forester.tabard && !office.forester.guard, office.forester);
// S2247: his cape opens on the crossbow's side, as over a staff (S1798): it reached 0.46 m in front of his neck, a slab over the stock, with 101 of
// its points inside the crossbow's box; now 0.25 m and 33
const fcape = await page.evaluate(() => { const root = buildNPCMesh({ role: 'Forester', name: 'Tadhg', people: 'gatelander' }, { key: 'otest' }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete && PEOPLE_RIGS.delete(r);
  const P = HB.makePerson(r.hbG, { hoodStats: false }); P.root.updateMatrixWorld(true); const cl = P.root.getObjectByName('cloak'), cb = P.root.getObjectByName('crossbow'), n = new THREE.Vector3(), v = new THREE.Vector3(); P.byName['neck01'].getWorldPosition(n);
  if (!cl || !cb) return { cloak: !!cl, crossbow: !!cb }; const bb = new THREE.Box3().setFromObject(cb), pa = cl.geometry.attributes.position; let fwd = -1, inBox = 0;
  for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(cl.matrixWorld); fwd = Math.max(fwd, v.z - n.z); if (bb.containsPoint(v)) inBox++; }
  const RR = pa.count / 56, st = []; for (let k = 0; k < 56; k++) st.push(new THREE.Vector3().fromBufferAttribute(pa, k * RR).applyMatrix4(cl.matrixWorld)); let gap = 0;
  for (let k = 1; k < 56; k++) if (Math.abs(Math.atan2(st[k].x - n.x, -(st[k].z - n.z))) < 1.2) gap = Math.max(gap, st[k].distanceTo(st[k - 1]));
  return { cloak: true, crossbow: true, fwd: +fwd.toFixed(3), inBox, out: P.cloak.through ? P.cloak.through.out : null, gap: +gap.toFixed(3) }; });
// S2399: its back laid by length like every other cape's, past the open side: the widest gap between neighbouring columns over the back was 7.2 cm, now 3.9
check('the forester\'s cape opens on the crossbow\'s side: under 0.32 m in front of his neck, under 60 of its points in the crossbow\'s box, none of him through it, its back columns under 5.5 cm apart', fcape.cloak && fcape.crossbow && fcape.fwd < .32 && fcape.inBox < 60 && fcape.out === 0 && fcape.gap < .055, fcape);
// S2404 (S2393's owed note): a rolled cape's front stood 6.6 cm off the breast, the tunic's room, two flat boards over the chest; over the breast
// it now lies at 2 cm of room, 1 cm over anything worn there (an apron's bib). Orla's mean gap at the breast was 6.5 cm, now 5.5
const cfront = await page.evaluate(() => { const root = buildNPCMesh({ role: 'villager', name: 'Orla', people: 'gatelander' }, { key: 'cf0' }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete && PEOPLE_RIGS.delete(r);
  if (!r.hbG.dress.cape) return { cape: false }; const P = HB.makePerson(r.hbG, { hoodStats: false }); P.root.updateMatrixWorld(true); const v = new THREE.Vector3(), n = new THREE.Vector3(); P.byName['neck01'].getWorldPosition(n);
  let body = null; P.root.traverse(o => { if (o.isSkinnedMesh && o.name === '' && !body) body = o; }); const B = [], bp = body.geometry.attributes.position;
  for (let i = 0; i < bp.count; i += 2) { v.fromBufferAttribute(bp, i); body.applyBoneTransform(i, v); v.applyMatrix4(body.matrixWorld); B.push(v.clone()); }
  const cl = P.root.getObjectByName('cloak'), pa = cl.geometry.attributes.position; let s = 0, c = 0;
  for (let i = 0; i < pa.count; i++) { const q = v.fromBufferAttribute(pa, i).applyMatrix4(cl.matrixWorld), dy = n.y - q.y; if (Math.abs(Math.atan2(q.x - n.x, -(q.z - n.z))) < 2.5 || dy < .05 || dy > .2) continue;
    let d = 9; for (const b of B) if (Math.abs(b.y - q.y) < .015) d = Math.min(d, Math.hypot(b.x - q.x, b.z - q.z)); if (d < 1) { s += d; c++; } }
  return { cape: true, gap: +(s / Math.max(1, c)).toFixed(4), n: c, out: P.cloak.through ? P.cloak.through.out : null, under: P.cloak.under }; });
check(`a rolled cape's front lies on the breast, not out from it as a shelf: Orla's under 6 cm off the body at the breast (${cfront.gap}), nothing through, nothing under`, cfront.cape && cfront.n > 50 && cfront.gap < .06 && cfront.out === 0 && cfront.under === 0, cfront);
// S2407 (S2404's owed note): over an apron's bib the cape stood 4 cm over the bib, the bib's outline carried up each column through the hair's
// maxima; it is now only blurred. Sorcha's cape was 7.9 cm off the body at the breast and 4.1 over her bib, now 6.0 and 2.3
const cbib = await page.evaluate(() => { const root = buildNPCMesh({ role: 'villager', name: 'Sorcha', people: 'gatelander' }, { key: 'cf0' }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete && PEOPLE_RIGS.delete(r);
  const D = r.hbG.dress; if (!D.cape || !D.bib) return { bib: false }; const P = HB.makePerson(r.hbG, { hoodStats: false }); P.root.updateMatrixWorld(true); const v = new THREE.Vector3(), n = new THREE.Vector3(); P.byName['neck01'].getWorldPosition(n);
  const W = [], bib = P.root.getObjectByName('bib'), bp = bib.geometry.attributes.position; for (let i = 0; i < bp.count; i++) { v.fromBufferAttribute(bp, i); bib.applyBoneTransform(i, v); v.applyMatrix4(bib.matrixWorld); W.push(v.clone()); }
  const cl = P.root.getObjectByName('cloak'), pa = cl.geometry.attributes.position; let s = 0, c = 0;
  for (let i = 0; i < pa.count; i++) { const q = v.fromBufferAttribute(pa, i).applyMatrix4(cl.matrixWorld), dy = n.y - q.y; if (Math.abs(Math.atan2(q.x - n.x, -(q.z - n.z))) < 2.5 || dy < .05 || dy > .2) continue;
    let d = 9; for (const b of W) if (Math.abs(b.y - q.y) < .015) d = Math.min(d, Math.hypot(b.x - q.x, b.z - q.z)); if (d < 1) { s += d; c++; } }
  return { bib: true, gap: +(s / Math.max(1, c)).toFixed(4), n: c, out: P.cloak.through ? P.cloak.through.out : null, under: P.cloak.under }; });
check(`over an apron's bib a cape lies close, not 4 cm out: Sorcha's under 3 cm off the bib at the breast (${cbib.gap}), nothing through, nothing under`, cbib.bib && cbib.n > 50 && cbib.gap < .03 && cbib.out === 0 && cbib.under === 0, cbib);
// S2427 (S2407's owed note): over loose hair worn in front the cape stood 4 cm over the hair, the lock's lean carried up each column through
// the hair's maxima; at the front it is now lifted with what is worn there. Sigrun's (cf1) was 9.1 cm off the body at the breast, now 7.1
const chair = await page.evaluate(() => { const root = buildNPCMesh({ role: 'villager', name: 'Sigrun', people: 'gatelander' }, { key: 'cf1' }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete && PEOPLE_RIGS.delete(r);
  const D = r.hbG.dress; if (!D.cape) return { cape: false }; const P = HB.makePerson(r.hbG, { hoodStats: false }); P.root.updateMatrixWorld(true); const v = new THREE.Vector3(), n = new THREE.Vector3(); P.byName['neck01'].getWorldPosition(n);
  let hair = 0; P.root.traverse(o => { if (o.isMesh && o.name === 'hair') hair++; });
  let body = null; P.root.traverse(o => { if (o.isSkinnedMesh && o.name === '' && !body) body = o; }); const B = [], bp = body.geometry.attributes.position;
  for (let i = 0; i < bp.count; i += 2) { v.fromBufferAttribute(bp, i); body.applyBoneTransform(i, v); v.applyMatrix4(body.matrixWorld); B.push(v.clone()); }
  const cl = P.root.getObjectByName('cloak'), pa = cl.geometry.attributes.position; let s = 0, c = 0;
  for (let i = 0; i < pa.count; i++) { const q = v.fromBufferAttribute(pa, i).applyMatrix4(cl.matrixWorld), dy = n.y - q.y; if (Math.abs(Math.atan2(q.x - n.x, -(q.z - n.z))) < 2.5 || dy < .05 || dy > .2) continue;
    let d = 9; for (const b of B) if (Math.abs(b.y - q.y) < .015) d = Math.min(d, Math.hypot(b.x - q.x, b.z - q.z)); if (d < 1) { s += d; c++; } }
  return { cape: true, hair, gap: +(s / Math.max(1, c)).toFixed(4), n: c, out: P.cloak.through ? P.cloak.through.out : null, under: P.cloak.under }; });
check(`a cape over loose hair worn in front lies on it, not 4 cm out: Sigrun's under 8 cm off the body at the breast (${chair.gap}), nothing through, nothing under`, chair.cape && chair.hair > 0 && chair.n > 50 && chair.gap < .08 && chair.out === 0 && chair.under === 0, chair);
// S2427: the apron is tied over the belt, but its top stood at the belt's own depth and the belt came through it in spikes at the hips.
// Round Sigrun's waist (by 15° of angle, her belt's band), the apron's top now stands at least 3 mm over the belt wherever both are
const abelt = await page.evaluate(() => { const root = buildNPCMesh({ role: 'villager', name: 'Sigrun', people: 'gatelander' }, { key: 'cf1' }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete && PEOPLE_RIGS.delete(r);
  const D = r.hbG.dress; if (!D.apron || !D.belt) return { on: false }; const P = HB.makePerson(r.hbG, { hoodStats: false }); P.root.updateMatrixWorld(true); const c = new THREE.Vector3(); P.byName['spine05'].getWorldPosition(c);
  const v = new THREE.Vector3(), bins = {}; for (const nm of ['belt', 'apron']) { const o = P.root.getObjectByName(nm), pa = o.geometry.attributes.position, R0 = o.geometry.attributes.aBase.array, M = bins[nm] = new Array(24).fill(0);
    for (const i of new Set(o.geometry.index.array)) { const ry = R0[i * 3 + 1]; if (ry < .14 || ry > .17) continue; v.fromBufferAttribute(pa, i); o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld);
      const b = Math.floor((Math.atan2(v.x - c.x, v.z - c.z) + Math.PI) / (2 * Math.PI) * 24) % 24, rr = Math.hypot(v.x - c.x, v.z - c.z); if (rr > M[b]) M[b] = rr; } }
  let both = 0, through = 0, least = 9; for (let b = 0; b < 24; b++) if (bins.belt[b] && bins.apron[b]) { both++; const d = bins.apron[b] - bins.belt[b]; least = Math.min(least, d); if (d < .003) through++; }
  return { on: true, both, through, least: +least.toFixed(4) }; });
check(`an apron is tied over the belt, not through it: round Sigrun's hips the apron's top stands at least 3 mm over the belt (${abelt.through} of ${abelt.both} angles under, least ${abelt.least})`, abelt.on && abelt.both >= 6 && abelt.through === 0, abelt);
// S2420 (S2407's owed note): under the brooch, where the shoulder line turns in to the throat, a front column's upper rows stood up to 9 mm
// inside the line from the row above to the row below, a notch in the opening's edge. Read on Sorcha and Orla: no front point in the top
// 10 cm more than 3 mm inside it
const notch = await page.evaluate(() => ['Sorcha', 'Orla'].map(name => { const root = buildNPCMesh({ role: 'villager', name, people: 'gatelander' }, { key: 'cf0' }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete && PEOPLE_RIGS.delete(r);
  if (!r.hbG.dress.cape) return { name, cape: false }; const P = HB.makePerson(r.hbG, { hoodStats: false }); P.root.updateMatrixWorld(true); const n = new THREE.Vector3(), v = new THREE.Vector3(); P.byName['neck01'].getWorldPosition(n);
  const K = P.cloak.columns, R = P.cloak.rows, cl = P.root.getObjectByName('cloak'), pa = cl.geometry.attributes.position; let worst = 0, tested = 0;
  for (let k = 0; k < K; k++) { const c = []; for (let i = 0; i < R; i++) { v.fromBufferAttribute(pa, k * R + i).applyMatrix4(cl.matrixWorld); c.push({ r: Math.hypot(v.x - n.x, v.z - n.z), th: Math.atan2(v.x - n.x, -(v.z - n.z)), dy: n.y - v.y }); }
    for (let i = 1; i < R - 1; i++) { if (Math.abs(c[i].th) < 2.2 || c[i].dy > .1) continue; tested++; worst = Math.max(worst, (c[i - 1].r + c[i + 1].r) / 2 - c[i].r); } }
  return { name, cape: true, worst: +worst.toFixed(4), tested, out: P.cloak.through ? P.cloak.through.out : null, under: P.cloak.under }; }));
check(`no notch in a shoulder cape's opening under the brooch: no front point in its top 10 cm more than 3 mm inside its column (${notch.map(x => x.name + ' ' + x.worst).join(', ')}), nothing through, nothing under`, notch.every(x => x.cape && x.tested > 20 && x.worst < .003 && x.out === 0 && x.under === 0), notch);
// S2424 (S2399's owed note): a cape's troughs come in only as far as the room under them, and over the arm there is none, so a fold's
// ridge stood 4 cm out alone over one or two columns and the hem rose on it and fell again, two steps over the elder's left elbow
// (Ciaran, cf3: from the back round the left side, a hem point 2.9 cm off its neighbours' line and 1.05 cm above or below it). The
// cape's folds are blurred across the columns now: 2.2 cm and 0.55 cm
const elbow = await page.evaluate(() => { const root = buildNPCMesh({ role: 'villager', name: 'Ciaran', people: 'gatelander' }, { key: 'cf3' }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete && PEOPLE_RIGS.delete(r);
  const D = r.hbG.dress; if (!D.cape || !D.staff) return { cape: !!D.cape, staff: !!D.staff }; const P = HB.makePerson(r.hbG, { hoodStats: false }); P.root.updateMatrixWorld(true); const n = new THREE.Vector3(), v = new THREE.Vector3(); P.byName['neck01'].getWorldPosition(n);
  const K = P.cloak.columns, R = P.cloak.rows, cl = P.root.getObjectByName('cloak'), pa = cl.geometry.attributes.position, H = [];
  for (let k = 0; k < K; k++) { v.fromBufferAttribute(pa, k * R + R - 1).applyMatrix4(cl.matrixWorld); H.push({ r: Math.hypot(v.x - n.x, v.z - n.z), y: v.y, th: Math.atan2(v.x - n.x, -(v.z - n.z)) }); }
  let kr = 0, ky = 0, tested = 0; for (let k = 1; k < K - 1; k++) { if (H[k].th < .6 || H[k].th > 1.9) continue; tested++; kr = Math.max(kr, Math.abs(H[k].r - (H[k - 1].r + H[k + 1].r) / 2)); ky = Math.max(ky, Math.abs(H[k].y - (H[k - 1].y + H[k + 1].y) / 2)); }
  return { cape: true, staff: true, tested, kr: +kr.toFixed(4), ky: +ky.toFixed(4), out: P.cloak.through.out, under: P.cloak.under, tris: P.cloak.tris }; });
check(`a shoulder cape's hem over the left elbow is one curve, not two steps: the elder Ciaran's hem no point over 2.5 cm off its neighbours' line (${elbow.kr}) nor 8 mm above or below it (${elbow.ky}), nothing through, nothing under`, elbow.cape && elbow.staff && elbow.tested >= 8 && elbow.kr < .025 && elbow.ky < .008 && elbow.out === 0 && elbow.under === 0, elbow);
check('the Church\'s inquisitor wears the white tabard over mail with the red shuttle on it (nothing of the body through it) and a white hood, white far off', office.inquisitor.mail && office.inquisitor.tabard && office.inquisitor.sign > 100 && office.inquisitor.out === 0 && office.inquisitor.tested > 1000 && office.inquisitor.hood && office.inquisitor.far > .8, office.inquisitor);
// S2260 (#1566 B, dressed by rank, nation by nation): the head of a town by its well (`_lord`) wears the concept artist's sheet for the
// office, whatever the roll; a guard captain who is not the town's head is still a guard
const powers = await page.evaluate(() => { const one = (def, nation, lord = true) => { const root = buildNPCMesh(Object.assign({ _lord: lord }, def), { key: 'ptest', nation }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete && PEOPLE_RIGS.delete(r);
    const D = r.hbG.dress, P = HB.makePerson(r.hbG, { hoodStats: false }), has = n => !!P.root.getObjectByName(n);
    return { power: r.g.power || null, mail: !!D.mail, spear: !!D.spear, cloak: has('cloak'), crimson: !!(D.cloak && D.cloak[0] > .4 && D.cloak[1] < .1), fur: has('collar0') || has('coatFur0'), coat: has('coat'), sword: has('swordBlade'), staff: has('staffWood'), sash: has('sash'), book: has('bookBlock'), circlet: has('circletBand'), seal: has('sealFace'), legs: !!(D.trousers || D.robe || D.skirt === 'long'), out: P.cloak && P.cloak.through ? P.cloak.through.out : 0, carry: P.sword ? { tipH: P.sword.tipH, pommelH: P.sword.pommelH, lean: P.sword.lean, inside: P.sword.inside } : null }; };
  return { lord: one({ role: 'Lord', name: 'Cathal', people: 'gatelander' }, 'gatelands'), elder: one({ role: 'Elder', name: 'Brigid', people: 'gatelander' }, 'gatelands'),
    captain: one({ role: 'Captain', name: 'Hesta', people: 'markman' }, 'mark'), reeve: one({ role: 'Reeve', name: 'Orm', people: 'markman' }, 'mark'),
    prior: one({ role: 'Prior', name: 'Anselme', people: 'aurennais' }, 'aurenne'), factor: one({ role: 'Factor', name: 'Isaure', people: 'aurennais' }, 'aurenne'),
    guard: one({ role: 'Captain', name: 'Sigrun', people: 'markman' }, 'mark', false) }; });
console.log('  powers:', JSON.stringify(powers));
// S2366: the lord's and the captain's swords are carried lowered too
check('the lord\'s and the captain\'s swords are carried lowered at rest: the tip under the pommel and under 0.8 m', [powers.lord, powers.captain].every(h => h.carry && h.carry.tipH < h.carry.pommelH && h.carry.tipH > .15 && h.carry.tipH < .8 && h.carry.lean > 1.83), [powers.lord.carry, powers.captain.carry]);
{ const P = powers; check('the town\'s head is dressed by office: the lord in crimson and fur with a sword, the Elder\'s staff, the captain\'s black coat with fur and a sword, the reeve\'s staff and fur, the Prior\'s stole and book, the Factor\'s circlet, ledger and seal; none through a cloak; a captain who is not the head is still a guard',
  P.lord.power === 'lord' && P.lord.crimson && P.lord.fur && P.lord.sword && P.elder.staff && P.elder.cloak && P.elder.legs && P.captain.coat && P.captain.fur && P.captain.sword && !P.captain.mail && !P.captain.spear
  && P.reeve.staff && P.reeve.fur && P.prior.sash && P.prior.book && P.factor.circlet && P.factor.book && P.factor.seal && [P.lord, P.elder, P.reeve].every(x => x.out === 0) && P.guard.power === null && P.guard.mail, P); }
// S2353 (L1; OG-048, OG-025, OG-044): a town's guard by their people. The Crown's (a Gatelander) mail under the crimson tabard edged in gold;
// the Mark's hold guard mail and a round shield on the arm, red quartered in blue; the Compact's (an Aurennais) bronze scales and a bronze
// shield over blue and white; the Old Blood's the plain mail. Nothing of the body through the tabard or inside the shield, and far off the
// guard is the tabard's or the mail's colour, not the tunic's
// S2359: the hold guard wears OG-025's fur at the shoulders, the kit's mantle (their own, or wolf grey), and the shield stays on the arm
const guards = await page.evaluate(() => { const one = (people, nation, fem) => { let mailFront = null; const root = buildNPCMesh({ role: 'guard', name: fem ? 'Una' : 'Bran', people, female: fem }, { key: 'gtest' + people, nation }),
    r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete && PEOPLE_RIGS.delete(r);
    const D = r.hbG.dress, P = HB.makePerson(r.hbG, { hoodStats: false }), has = n => !!P.root.getObjectByName(n), far = r.g.cloth;
    return { people: r.g.people, mail: has('mail'), scales: !!D.scales, bronze: !!(D.mail && D.mail[0] > .55 && D.mail[2] < .3), tabard: has('tabard'), crimson: !!(D.tabard && D.tabard[0] > .5 && D.tabard[1] < .1),
      tabOut: P.tabard ? P.tabard.out : null, shield: P.shield ? P.shield.on : null, inside: P.shield ? P.shield.inside : null, metal: !!D.shieldMetal, blue: !!(D.tunic && D.tunic[2] > .5 && D.tunic[0] < .2),
      helm: !!D.helm, spear: !!D.spear, cloak: !!D.cloak, fur: has('mantle0'), armGap: P.shield ? P.shield.armGap : null,
      mailOut: (() => { const tb = P.root.getObjectByName('tabard'); if (!tb) return null; P.root.updateMatrixWorld(true); const nk = new THREE.Vector3(); P.byName['neck01'].getWorldPosition(nk); const rc = new THREE.Raycaster(), v = new THREE.Vector3(), dz = new THREE.Vector3(0, 0, 1), dzF = new THREE.Vector3(0, 0, -1); rc.far = .06; let n = 0, nf = 0;
        P.root.traverse(m => { if (!m.isSkinnedMesh || !/^mail(Skirt)?$/.test(m.name)) return; for (const i of new Set(m.geometry.index.array)) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); if (Math.abs(v.x - nk.x) > .13 || v.y > nk.y - .08) continue; const fr = v.z > nk.z; rc.set(v, fr ? dzF : dz); const h = rc.intersectObject(tb, false); if (h.length && h[0].distance > .001) fr ? nf++ : n++; } }); mailFront = nf; return n; })(), mailFront, lifted: P.tabard ? P.tabard.lifted : null, far: [+far.r.toFixed(2), +far.g.toFixed(2), +far.b.toFixed(2)] }; };
  return { crown: one('gatelander', 'gatelands', false), hold: one('markman', 'mark', false), compact: one('aurennais', 'aurenne', false), compactW: one('aurennais', 'aurenne', true), oldblood: one('oldblood', 'gatelands', false) }; });
console.log('  guards:', JSON.stringify(guards));
// S2384: the mail's own shell no longer comes through the back of the tabard at the belt (the Crown's guard: a band of rings across the
// small of the back, 26 of the mail's points outside the panel, up to 1.2 cm; the tabard now reads the mail's posed surface)
check('no point of the Crown\'s guard\'s mail stands outside the back of the tabard (a band of rings crossed it at the belt)', guards.crown.mailOut === 0, { crown: guards.crown.mailOut });
// S2390: nor out of its front, under the belt where the mail's skirt flares (2 points up to 3 mm on main: the panel's 60 rows cut in
// under the outline they were resampled from, and each row is now lifted to clear it)
check('no point of the Crown\'s guard\'s mail stands outside the front of the tabard either (2 under the belt, up to 3 mm, before S2390)', guards.crown.mailFront === 0, { crown: guards.crown.mailFront, lifted: guards.crown.lifted });
{ const G = guards, near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < .02);
  check('a guard is dressed by their people: the Crown\'s crimson tabard over mail, the hold guard\'s round shield on the arm and fur at the shoulders (S2359), the Compact\'s bronze scales and bronze shield over blue, the Old Blood\'s plain mail; none through the tabard or the shield; far off the tabard\'s or the mail\'s colour',
    Object.values(G).every(x => x.mail && x.helm && x.spear && !x.cloak) && G.crown.people === 'gatelander' && G.crown.tabard && G.crown.crimson && G.crown.tabOut === 0 && G.crown.shield === null && near(G.crown.far, [.55, .08, .08])
    && G.hold.people === 'markman' && !G.hold.tabard && G.hold.shield === 'arm' && G.hold.inside === 0 && !G.hold.scales && G.hold.fur && !G.crown.fur && !G.compact.fur && near(G.hold.far, [.5, .51, .53])
    && [G.compact, G.compactW].every(x => x.people === 'aurennais' && x.scales && x.bronze && x.blue && x.shield === 'arm' && x.inside === 0 && x.metal && near(x.far, [.62, .45, .22]))
    && G.oldblood.people === 'oldblood' && !G.oldblood.tabard && !G.oldblood.scales && G.oldblood.shield === null && near(G.oldblood.far, [.55, .56, .58]), G); }
// S2387 (critic 18 Nov, note 3): in a real town (Dunmore's fortune gives the old kit's tier 3) a guard's stand-in wore S395's steel chest,
// arms and legs over the cloth, so it was a pale doll until the body came. The driver now drops that armour: the tabard's crimson, the mail's sleeves, the helm
const standin = await page.evaluate(() => { const rs = [...PEOPLE_RIGS].filter(r => HB_RIGS.has(r) && r.g.guardTier && r.hbG && (r.hbG.dress || {}).tabard);
  return { n: rs.length, armour: rs.filter(r => r.g.eq && r.g.eq.armour).length, helm: rs.filter(r => r.g.hat === 'helm').length,
    crimson: rs.filter(r => r.g.cloth.r > .5 && r.g.cloth.g < .1).length, keys: rs.slice(0, 4).map(r => r.g.hbKey) }; });
check('Dunmore\'s guards\' stand-ins wear no armour kit over the tabard\'s crimson (a pale doll in steel until the body came)', standin.n > 0 && standin.armour === 0 && standin.helm === standin.n && standin.crimson === standin.n, standin);
// S2329 (#1658 B; OG-064): a guild's head wears the guild's livery over their people's own: the Guildmaster mail under the oxblood tabard
// with the crossed swords and a sword of their people's make, the Archmage the deep blue robe with the star and a staff of their people's
// wood (the driver holds it); a guild member is not dressed so, and nothing of the body comes through the tabard
const guilds = await page.evaluate(() => { const one = (def) => { const root = buildNPCMesh(Object.assign({ _siteId: 'gtest' }, def), { key: 'gtest' }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r);
    const D = r.hbG.dress, P = HB.makePerson(r.hbG, { hoodStats: false }), has = n => !!P.root.getObjectByName(n), T = P.tabard || {};
    return { head: r.g.guildHead || null, gear: r.g.gear || null, people: r.hbG.people, mail: !!D.mail, tabard: has('tabard'), sign: T.sign || 0, out: T.out ?? -1, tested: T.tested || 0, sword: has('swordBlade'), swordMake: D.swordMake, staff: has('staffWood'), staffMake: D.staffMake, robe: !!D.robe, blue: !!(D.robe && D.robe[2] > .3 && D.robe[0] < .2), star: P.guildStar || null, basket: !!D.basket,
      cape: !!D.cloak, capeOpen: D.capeOpen ?? null, brooches: (() => { let n = 0; P.root.traverse(o => { if (o.name === 'brooch') n++; }); return n; })(), capeThrough: P.cloak && P.cloak.through ? P.cloak.through.out : 0, capeTab: (() => { const cp = P.root.getObjectByName('cloak'), tb = P.root.getObjectByName('tabard'); if (!cp || !tb || !D.cape) return null; P.root.updateMatrixWorld(true);
        const nk = new THREE.Vector3(); P.byName['neck01'].getWorldPosition(nk); const rc = new THREE.Raycaster(), v = new THREE.Vector3(), dz = new THREE.Vector3(0, 0, 1), pa = tb.geometry.attributes.position; rc.far = .06; let n = 0;
        for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(tb.matrixWorld); if (v.z > nk.z) continue; rc.set(v, dz); const h = rc.intersectObject(cp, false); if (h.length && h[0].distance > .001) n++; } return n; })(), boots: !!D.boots && !D.sandals, carry: P.sword ? { tipH: P.sword.tipH, pommelH: P.sword.pommelH, lean: P.sword.lean, inside: P.sword.inside } : null }; };
  const ppl = ['gatelander', 'markman', 'aurennais', 'oldblood'], out = {};
  ppl.forEach((pp, i) => { out['f_' + pp] = one({ role: 'Guildmaster', name: 'Gm' + i, people: pp }); out['m_' + pp] = one({ role: 'Archmage', name: 'Am' + i, people: pp }); });
  out.member = one({ role: 'Adept of the Mages', name: 'Mem', people: 'markman' }); return out; });
console.log('  guild heads:', JSON.stringify(guilds));
{ const G = guilds, F = ['gatelander', 'markman', 'aurennais', 'oldblood'].map(p => G['f_' + p]), M = ['gatelander', 'markman', 'aurennais', 'oldblood'].map(p => G['m_' + p]);
  check('the guild heads in the livery over their people (#1658 B): each Guildmaster mail under the tabard with the crossed swords, nothing through it, a sword of their make (arming, norse, nimcha, falchion); each Archmage the blue robe with the star clear of what is worn and a staff of their wood, the driver holding it; a member not so',
    F.every(f => f.head === 'f' && f.mail && f.tabard && f.sign > 50 && f.out === 0 && f.tested > 500 && f.sword && !f.staff && !f.basket) && F.map(f => f.swordMake).join() === 'arming,norse,nimcha,falchion'
    && M.every(m => m.head === 'm' && m.gear === 'stick' && m.robe && m.blue && m.staff && !m.tabard && m.star && m.star.through === 0 && m.star.out > .003 && m.star.out < .006) && M.map(m => m.staffMake).join() === 'hazel,ash,olive,carved'
    && G.member.head === null && !G.member.star, G);
  // S2366 (the critic's 17 Nov note): a sword held at rest is carried lowered, the blade forward and down from the fist (it stood point-up beside the head)
  check('a Guildmaster\'s sword is carried lowered at rest: the tip under the pommel and under 0.8 m, the blade 15° to 50° below the level, at most 3 points of what is worn against it',
    F.every(f => f.carry && f.carry.tipH < f.carry.pommelH && f.carry.tipH > .15 && f.carry.tipH < .8 && f.carry.lean > 1.83 && f.carry.lean < 2.44 && f.carry.inside <= 3), F.map(f => f.carry));
  // S2381 (S2366's owed note): on the walk the sword's arm is held to the hips as a cloak's is, three quarters of the swing taken off.
  // S2382: S2381 measured at 1.3 m/s, past these bodies' run (PW.RUN.on, 1.21 m/s at their scale of 1.25): that was the run, where the
  // blade stood upright at each forward swing, its top 2.0 to 2.1 m off the ground. At the townsfolk's own pace (npcStep: 0.7, a guard
  // 0.95) it rose to 1.15 m unheld and 0.82 held. So a body is walked at 0.95 and then run at 1.3, and the gait is read off the rig;
  // and the lord under his cape walks too: his tip 0.35 to 0.40 m off the ground, the fist 0.84 to 0.88 (0.19 at a run)
  const walk = await page.evaluate(() => { const go = (def, opt) => { const root = buildNPCMesh(def, opt), rig = [...HB_RIGS].find(x => x.root === root);
    const c0 = CAM.position.clone(), x0 = px + 30, z0 = pz + 30, inside = isInterior(); root.position.set(x0, 0, z0); root.rotation.y = 0; scene.add(root); let now = Math.max(performance.now(), HBODY.last || 0) + 1e6, n = 0; { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 20000) runJobs(); }
    const eye = () => { CAM.position.set(root.position.x + 3, root.position.y + 1.65, root.position.z); CAM.lookAt(root.position.x, root.position.y + 1, root.position.z); CAM.updateMatrixWorld(true); };
    eye(); while ((!rig.hb || rig.hb.cold || rig.hb.L !== 0) && n++ < 3000) { now += HBODY.gap + 1; tickPeople(1 / 60, now); }
    let blade = null; if (rig.hb) rig.hb.P.root.traverse(o => { if (o.name === 'swordBlade') blade = o; });
    const gait = () => ({ lo: 9, hi: 0, top: 0, ran: 0, walked: 0 }), res = { built: !!rig.hb, blade: !!blade, held: !!(rig.hb && rig.hb.hold && rig.hb.hold.size >= 3), sword: !!(rig.hb && rig.hb.hold && rig.hb.hold.sword), walk: gait(), run: gait() };
    if (blade) { const v = new THREE.Vector3(), pa = blade.geometry.attributes.position;
      for (let i = 0; i < 360; i++) { root.position.z += (i < 180 ? .95 : 1.3) / 60; eye(); now += 1000 / 60; tickPeople(1 / 60, now);
        if (i % 180 < 60) continue; const G = i < 180 ? res.walk : res.run; if (rig.run) G.ran++; else G.walked++;
        root.updateMatrixWorld(true); let m = 1e9, t = -1e9; for (let k = 0; k < pa.count; k++) { v.fromBufferAttribute(pa, k).applyMatrix4(blade.matrixWorld); m = Math.min(m, v.y); t = Math.max(t, v.y); }
        const h = m - root.position.y; G.top = Math.max(G.top, t - root.position.y); G.lo = Math.min(G.lo, h); G.hi = Math.max(G.hi, h); } }
    root.parent.remove(root); HB_RIGS.delete(rig); PEOPLE_RIGS.delete(rig); CAM.position.copy(c0); CAM.updateMatrixWorld(true);
    for (const G of [res.walk, res.run]) { G.lo = +G.lo.toFixed(3); G.hi = +G.hi.toFixed(3); G.top = +G.top.toFixed(3); } res.inside = inside; res.fail = !!rig.hbFail; return res; };
    return { gm: go({ role: 'Guildmaster', name: 'Gm2', people: 'aurennais', _siteId: 'gtest' }, { key: 'gwalk' }), lord: go({ role: 'Lord', name: 'Cathal', people: 'gatelander', _lord: true }, { key: 'ptest', nation: 'gatelands' }) }; });
  console.log('  sword walk:', JSON.stringify(walk));
  { const W = walk.gm, L = walk.lord;
    check('a Guildmaster with the sword lowered holds its arm (the Aurennais, no cape): walking (0.95 m/s, not running) the blade stays between 0.3 m and 0.95 m off the ground (unheld it rose to 1.15 m); running (1.3 m/s) between 0.15 m and 1.0 m (unheld it stood upright, 2.0 m)',
      W.built && W.blade && W.held && W.sword && W.walk.walked === 120 && W.walk.ran === 0 && W.walk.lo > .3 && W.walk.top < .95 && W.run.ran === 120 && W.run.lo > .15 && W.run.top < 1, W);
    check('the lord walking under his cape (0.95 m/s) carries the sword: its lowest point between 0.3 m and 0.5 m off the ground, its highest under 0.9 m',
      L.built && L.blade && L.held && L.walk.walked === 120 && L.walk.lo > .3 && L.walk.lo < .5 && L.walk.top < .9, L); }
  // S2364 (the critic's 17 Nov note): a head's cape is worn back off the breast, pinned at each shoulder, nothing through it; a Guildmaster in boots
  const caped = F.concat(M).filter(h => h.cape);
  // (an Archmage's cape over the staff already opens on the staff's side, S1798: worn back, it is pinned at the left shoulder alone)
  check(`a guild head's cape is worn back (capeOpen 1; a Guildmaster's pinned at each shoulder, an Archmage's at the left; no arm through it), ${caped.length} of 8 caped; every Guildmaster in boots, not sandals`,
    caped.length >= 2 && caped.every(h => h.capeOpen === 1 && h.brooches === (h.head === 'f' ? 2 : 1) && h.capeThrough === 0) && F.every(f => f.boots), caped.map(h => [h.people, h.head, h.capeOpen, h.brooches, h.capeThrough]));
  // S2382 (S2364's owed note): the tabard's back panel no longer comes through a head's cape down the middle of the back; no point of it
  // stands outside the cape (with the cape within 6 cm behind it, toward the body). The Gatelander had 8, a strip of red over the spine
  check('no point of a Guildmaster\'s tabard stands outside their cape at the back (the Gatelander\'s showed a strip down the spine)', F.filter(f => f.cape).length >= 1 && F.filter(f => f.cape).every(f => f.capeTab === 0), F.map(f => [f.people, f.capeTab])); }
// S2349 (S2329's owed note): the far copy's skirt is the genome's. A long skirt or a robe is the driver's dress to the shin, in the skirt's
// own colour (counted on the hips' bone, as the legs ride the thighs); anything else is the tunic's skirt over the legs. The driver rolled
// its own, and 46 of 208 changed shape at the builder's ring
const skirts = await page.evaluate(() => { const one = (def) => { const root = buildNPCMesh(Object.assign({ _siteId: 'sktest' }, def), { key: 'sktest' }), r = [...HB_RIGS].find(x => x.root === root); HB_RIGS.delete(r); PEOPLE_RIGS.delete(r); return r; };
  const roles = ['villager', 'farmer', 'innkeeper', 'herbalist', 'merchant', 'priest', 'elder'], o = { n: 0, long: 0, wrong: 0, two: 0, twoOk: 0 };
  for (const pk of ['aurennais', 'gatelander', 'markman', 'oldblood']) for (let i = 0; i < 24; i++) { const x = one({ role: roles[i % roles.length], name: 'Sk' + pk + i, people: pk, female: i % 2 === 1 }); if (!x) continue;
    const D = x.hbG.dress || {}, want = !!(D.robe || D.skirt === 'long'); o.n++; if (want) o.long++; if (want !== !!x.g.dress) o.wrong++;
    const sc = D.robe || D.skirtColor; if (want && sc && D.tunic && sc.some((c, j) => Math.abs(c - D.tunic[j]) > .08)) { o.two++; const ca = x.mesh.geometry.attributes.color, si = x.mesh.geometry.attributes.skinIndex, hb = x.mesh.skeleton.bones.findIndex(b => b.name === 'hips'); let n = 0;
      for (let k = 0; k < ca.count; k++) if (si.getX(k) === hb && Math.abs(ca.getX(k) - x.g.skirtCol.r) < .02 && Math.abs(ca.getY(k) - x.g.skirtCol.g) < .02 && Math.abs(ca.getZ(k) - x.g.skirtCol.b) < .02) n++; if (n >= 24) o.twoOk++; } }
  const am = one({ role: 'Archmage', name: 'SkAm', people: 'markman', female: false }), gm = one({ role: 'Guildmaster', name: 'SkGm', people: 'aurennais', female: true });
  o.archmage = !!am.g.dress; o.guildmaster = !!gm.g.dress; return o; });
check(`the far copy wears the genome's skirt: ${skirts.long} of ${skirts.n} in a long skirt or robe, ${skirts.wrong} wrong; ${skirts.twoOk} of ${skirts.two} long skirts unlike the tunic drawn in their own colour on the hips; a man Archmage's robe is a dress far off, a woman Guildmaster's trousers are not`,
  skirts.n >= 80 && skirts.long > 10 && skirts.wrong === 0 && skirts.two > 5 && skirts.twoOk === skirts.two && skirts.archmage && !skirts.guildmaster, skirts);
// S2135 (L2, OG-053): Aldwyn's private study, the cream undertunic under the red over-robe worn open, his journal shut in his right fist
// by its spine, the wheel on its covers: nothing of him within a centimetre of it; neither other dress carries it
const study = await page.evaluate(() => { const one = o => { const P = HB.makePerson(HB.castGenome('Aldwyn', o), { hoodStats: false }), b = P.root.getObjectByName('book'); return { book: !!b, on: b && b.parent && b.parent.name, coat: !!P.root.getObjectByName('coat'), dev: !!P.root.getObjectByName('bookDevice'), st: P.book }; };
  return { study: one({ outfit: 'study' }), travel: one({ outfit: 'travel' }), herald: one({}) }; });
const bs = study.study.st || {};
check('Aldwyn in his study carries his journal in his right fist, the coat open over the undertunic: 0 points of him within 1 cm of the book, the fist on its spine; the herald and the traveller carry none',
  study.study.book && study.study.on === 'wrist.R' && study.study.coat && study.study.dev && bs.inside === 0 && bs.tested > 100 && bs.handPts > 100 && bs.tris < 1000 && !study.travel.book && !study.herald.book, study);
// S2141 (L2, OG-053's belt of instruments): Aldwyn's brass astrolabe on the travelling dress, hung from the belt at the right hip on a thong,
// carried by the hips: nothing of him inside it, his arm and staff clear of it; neither other dress carries it
const astro = await page.evaluate(() => { const one = o => { const P = HB.makePerson(HB.castGenome('Aldwyn', o), { hoodStats: false }), a = P.root.getObjectByName('astrolabe'); return { on: !!a, bone: a && a.parent && a.parent.name, thong: !!P.root.getObjectByName('astrolabeThong'), st: P.astrolabe }; };
  return { travel: one({ outfit: 'travel' }), study: one({ outfit: 'study' }), herald: one({}) }; });
const as = astro.travel.st || {};
check('Aldwyn travels with his astrolabe on his belt at the right hip: 0 points of him inside it, his arm and staff clear, the thong to the belt; the herald and the study carry none',
  astro.travel.on && /^spine0[12]$/.test(astro.travel.bone) && astro.travel.thong && as.inside === 0 && as.tested > 10 && !as.armIn && as.turn < -.5 && as.turn > -2.1 && as.tris < 2000 && !astro.study.on && !astro.herald.on, astro);
// S2202 (L2, OG-053's belt of instruments and Q6's seal): the seal matrix, the penner and the inkhorn on one ring at the front-left of the
// travelling dress's belt, carried by the hips: nothing of him inside any of them, his left arm and what his fists hold clear; no other dress
const skit = await page.evaluate(() => { const one = o => { const P = HB.makePerson(HB.castGenome('Aldwyn', o), { hoodStats: false }), a = P.root.getObjectByName('scholarKit'); return { on: !!a, bone: a && a.parent && a.parent.name, seal: !!(a && a.getObjectByName('sealFace')), thong: !!P.root.getObjectByName('scholarThong'), st: P.scholarKit }; };
  return { travel: one({ outfit: 'travel' }), study: one({ outfit: 'study' }), herald: one({}) }; });
const sk = skit.travel.st || {};
check('Aldwyn travels with his seal, penner and inkhorn on his belt at the front-left: 0 points of him inside them, his arm clear, under 3 cm off the belt; the herald and the study carry none',
  skit.travel.on && skit.travel.seal && /^spine0[12]$/.test(skit.travel.bone) && skit.travel.thong && sk.inside === 0 && sk.tested > 10 && !sk.armIn && sk.turn > 0 && sk.turn < 1 && sk.out < .03 && sk.tris < 2500 && !skit.study.on && !skit.herald.on, skit);
// S2144 (L2, OG-053's rolled maps of the gates): three map rolls in Aldwyn's satchel on the travelling dress, standing out past both its
// ends, nothing of him within them; neither other dress carries them
const maps = await page.evaluate(() => { const one = o => { const P = HB.makePerson(HB.castGenome('Aldwyn', o), { hoodStats: false }); let n = 0, on = null; P.root.traverse(m => { if (m.name === 'mapRoll') { n++; on = m.parent && m.parent.name; } }); return { n, on, st: P.satchel && P.satchel.maps }; };
  return { travel: one({ outfit: 'travel' }), study: one({ outfit: 'study' }), herald: one({}) }; });
const ms = maps.travel.st || {};
check('Aldwyn travels with three rolled maps in his satchel, standing out past both its ends: 0 points of him within them; the herald and the study carry none',
  maps.travel.n === 3 && maps.travel.on === 'satchel' && ms.inside === 0 && ms.out.every(o => o.every(x => x >= .012)) && ms.tris < 1000 && !maps.study.n && !maps.herald.n, maps);
check('Edna and Áine carry their sticks, and the cape stays on the shoulder: under 30 cm in front of the neck, nothing through it', Object.values(capes).every(c => c.staff && c.fwd < .3 && c.out === 0 && c.under === 0), capes);
// S1809 (L2, OG-069): Niamh's lantern, in her right fist on the basket's grip, hanging clear of her and her cloak, on her wrist so it goes where the arm goes
const lantern = await page.evaluate(() => { const P = HB.makePerson(HB.castGenome('Niamh', {}), { hoodStats: false }), ln = P.root.getObjectByName('lantern');
  return { on: !!ln, wrist: ln && ln.parent && ln.parent.name, st: P.lantern, cloak: P.cloak.through.out, under: P.cloak.under }; });
check('Niamh carries her lantern in her right fist: on the wrist, nothing of her within a centimetre of it, the fingers closed and none through its grip, her cloak clear',
  lantern.on && lantern.wrist === 'wrist.R' && lantern.st.inside === 0 && lantern.st.fist === 0 && lantern.st.gap > -.002 && lantern.st.foot > .3 && lantern.cloak === 0 && lantern.under === 0, lantern);
// S1816 (L2, OG-069): Edna's clay pipe, in the left corner of her mouth, carried by the head, nothing of her within 2 mm of it past her lips
const pipe = await page.evaluate(() => { const P = HB.makePerson(HB.castGenome('Edna', {}), { hoodStats: false }), pi = P.root.getObjectByName('pipe');
  return { on: !!pi, bone: pi && pi.parent && pi.parent.name, st: P.pipe }; });
check('Edna smokes her clay pipe: on the head, its mouthpiece inside her lips, nothing worn within 2 mm of the stem past them or of the bowl',
  pipe.on && pipe.bone === 'head' && pipe.st.inside === 0 && pipe.st.tipIn && pipe.st.side === 'L', pipe);
// S1829 (L2, OG-069): Corwin's tankard, by its handle in his right fist, upright, nothing of him near it and no finger through its pewter
const tankard = await page.evaluate(() => { const P = HB.makePerson(HB.castGenome('Corwin', {}), { hoodStats: false }), tk = P.root.getObjectByName('tankard');
  return { on: !!tk, wrist: tk && tk.parent && tk.parent.name, st: P.tankard }; });
check('Corwin holds his tankard: on the wrist, upright, nothing of him within 8 mm of it, no point of the hand in its pewter',
  tankard.on && tankard.wrist === 'wrist.R' && tankard.st.inside === 0 && tankard.st.handIn === 0 && tankard.st.sideIn === 0 && tankard.st.thumbIn === 0 && tankard.st.lean < .1, tankard);
// S1846 (L2, OG-069): Corwin's red coat worn open to the knee over the waistcoat: both shells holed down the front, and the middle-level
// bake (hbCutFn) reads the hole; the waistcoat, its buttons and the belt kept under it; gold at its edges; nothing of the legs out of its
// skirt; the far copy (the driver) in the coat's red, not the shirt's linen
const ocoat = await page.evaluate(() => { const P = HB.makePerson(HB.castGenome('Corwin', {}), { hoodStats: false }), m = k => P.root.getObjectByName(k), c = m('coat'), cs = m('coatSkirt'), f = c && hbCutFn(c.material.userData), fs = cs && hbCutFn(cs.material.userData);
  return { coat: !!c, skirt: !!cs, wc: !!m('waistcoat'), belt: !!m('belt'), btn: P.buttons && P.buttons.buttons, legsOut: P.coat && P.coat.legsOut, trim: !!(c && c.material.customProgramCacheKey().includes('trim')),
    bake: !!(f && fs && f({ x: 0, y: .3, z: .1 }) && !f({ x: .15, y: .3, z: .1 }) && !f({ x: 0, y: .3, z: -.1 }) && fs({ x: 0, y: -.2, z: .1 }) && !fs({ x: .15, y: -.2, z: .1 })), red: new THREE.Color(.5, .12, .1).getHexString() }; });
check('Corwin wears his coat open: the fronts holed collar to hem (and the bake drops them), the waistcoat, its six buttons and the belt under it, gold at the edges, no leg out of its skirt; his far copy in its red',
  ocoat.coat && ocoat.skirt && ocoat.bake && ocoat.wc && ocoat.belt && ocoat.btn === 6 && ocoat.legsOut === 0 && ocoat.trim && cast.corwinHome.dCloth === ocoat.red && cast.corwin.dCloth === ocoat.red, { ocoat, far: cast.corwinHome.dCloth });
// S1835 (L2, OG-069, OG-057): Bram's smith's hammer, by the throat of its haft in his right fist, head up, nothing of him near it, no finger in it
const hammer = await page.evaluate(() => { const P = HB.makePerson(HB.castGenome('Bram', {}), { hoodStats: false }), hm = P.root.getObjectByName('hammer');
  return { on: !!hm, wrist: hm && hm.parent && hm.parent.name, st: P.hammer }; });
check('Bram holds his hammer: on the wrist, upright, nothing of him within 8 mm of it, no point of the hand in its haft or head',
  hammer.on && hammer.wrist === 'wrist.R' && hammer.st.inside === 0 && hammer.st.handIn === 0 && hammer.st.headIn === 0 && hammer.st.thumbIn === 0 && hammer.st.lean < .1, hammer);
// S1841 (L2, OG-069): Bram's sleeves rolled above the elbow: the roll on both arms, the tunic's sleeve cut under it, the forearm's skin drawn;
// Corwin's sleeves down
// S2433: a headscarf has slack (S1029's owed note: it was the fitted dome, a cap): fuller at the temples, creased to the knot, and still
// nothing of the head or the hair through it, the point and its knot still clear
const scarf = await page.evaluate(() => { const G0 = HB.rollGenome('sc:1', { g: 0, people: 'gatelander' }), P = HB.makePerson({ ...G0, hair: { style: 'bun', len: .8 }, dress: { ...G0.dress, cloak: null, hood: null, helm: null, wrap: [.3, .36, .22], scarfPrint: null, wrapBorder: null, scarf: true } }, { hoodStats: false });
  const w = P.wrap, t = P.wrapTail; P.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); return { slack: w.slack, hairOut: w.hairOut, gap: w.gap, overBrow: w.overBrow, tris: w.tris, through: t && t.through, endGap: t && t.knot && t.knot.endGap }; });
check(`a headscarf has slack, not a cap's fit: ${(scarf.slack?.temple * 1000).toFixed(1)} mm over the temples, creases to the knot ${(scarf.slack?.gather * 1000).toFixed(1)} mm deep; nothing of the head or hair through it, nor of the back through its point`,
  scarf.slack && scarf.slack.temple > .005 && scarf.slack.gather > .009 && scarf.slack.creases >= 3 && scarf.hairOut === 0 && scarf.overBrow === 0 && scarf.gap > .006 && scarf.through === 0 && scarf.endGap >= .006, scarf);
const rolled = await page.evaluate(() => { const one = n => { const P = HB.makePerson(HB.castGenome(n, {}), { hoodStats: false }), R0 = HB.PACK.rest, m = k => P.root.getObjectByName(k);
    const roll = m('roll'), tunic = m('tunic'), body = P.meshes ? P.meshes[0] : P.root.children.find(c => c.isSkinnedMesh);
    const ua = i => ((Math.abs(R0[i * 3]) - .1677) * .638 - (R0[i * 3 + 1] - .5246) * .7702 - (R0[i * 3 + 2] - .0146) * .0062) / .2276;
    const bodyIdx = new Set(body.geometry.index.array), fore = [...bodyIdx].filter(i => Math.abs(R0[i * 3]) > .26 && R0[i * 3 + 1] > .1 && R0[i * 3 + 1] < .55 && ua(i) > 1.05 && HB.slvX(R0[i * 3], R0[i * 3 + 1], R0[i * 3 + 2]) < .365).length;
    return { roll: !!roll, rollTris: roll ? roll.geometry.index.count / 3 : 0, hole: !!(tunic && tunic.material.userData.hole), fore, gene: !!HB.castGenome(n, {}).dress.sleevesRolled }; };
  return { bram: one('Bram'), corwin: one('Corwin') }; });
check('Bram\'s sleeves are rolled above the elbow (S1841): the roll drawn, the tunic\'s sleeve holed under it, his forearms\' skin drawn; Corwin\'s sleeves down',
  rolled.bram.gene && rolled.bram.roll && rolled.bram.rollTris > 200 && rolled.bram.hole && rolled.bram.fore > 100 &&
  !rolled.corwin.gene && !rolled.corwin.roll && !rolled.corwin.hole && rolled.corwin.fore < 20, rolled);
await g.close();

// a second boot: the same people, the same bodies
const g2 = await boot({ look: 'new' }); await dunmore(g2);
const g2genomes = await g2.page.evaluate((keys) => Object.fromEntries(keys.map(k => [k, HB_GENOMES.has(k) ? JSON.stringify(HB.toSaved(HB_GENOMES.get(k))) : null])), who.sample);
const same = who.sample.filter(k => g2genomes[k] === genomes[k]).length;
check('on a second boot each of them is the same person (the same genome from the same place and name)', same === who.sample.length && same >= 4, { same, of: who.sample.length });
// S1224 (card F4): the near level's cost where the crowd is thickest. At 18h, the most of Dunmore's people within 16 m of one of them
// (seven, Session 1224); 6 m off their middle, every body within 46 m built, the frame at the middle quality looking four ways
const crowd = await g2.page.evaluate(() => { forceTime(18); for (let i = 0; i < 120; i++) WORLD.tick(1 / 60, performance.now());
  let rs = [...HB_RIGS].filter(r => r.root.parent === WORLD.scene && r.root.visible), P = rs.map(r => [r.root.position.x, r.root.position.z]);
  let best = 0, at = null; for (const [x, z] of P) { const n = P.filter(([a, b]) => Math.hypot(a - x, b - z) < 16).length; if (n > best) { best = n; at = [x, z]; } }
  const near = P.filter(([a, b]) => Math.hypot(a - at[0], b - at[1]) < 16), cx = near.reduce((s, p) => s + p[0], 0) / near.length, cz = near.reduce((s, p) => s + p[1], 0) / near.length;
  px = cx; pz = cz + 6; for (let i = 0; i < 30; i++) WORLD.tick(1 / 60, performance.now());
  { const t1 = performance.now(); while (JOBS.length && performance.now() - t1 < 30000) runJobs(); }
  pitch = -.05; CAM.position.set(px, worldH(px, pz) + 1.65, pz); CAM.rotation.set(pitch, 0, 0, 'YXZ'); CAM.updateMatrixWorld(true);
  const want = () => [...HB_RIGS].filter(r => (!r.hb || r.hb.cold) && !r.hbFail && r.root.parent === WORLD.scene && r.root.visible && Math.hypot(CAM.position.x - r.root.position.x, CAM.position.z - r.root.position.z) < HBODY.build).length;
  let k = 0; while (want() && k++ < 1500) tickPeople(1 / 60, 1e5 + k * (HBODY.gap + 1));
  SETTINGS.quality = 1; rs = [...HB_RIGS].filter(r => r.hb && r.root.parent === WORLD.scene && r.root.visible);
  const views = [0, Math.PI / 2, Math.PI, -Math.PI / 2].map(yw => { yaw = yw; CAM.rotation.set(pitch, yaw, 0, 'YXZ'); CAM.updateMatrixWorld(true); tickPeople(1 / 60, 4e5); REN.render(scene, CAM); return REN.info.render.calls; });
  return { most16: best, built: rs.length, left: want(), near: rs.filter(r => r.hb.L === 0).length, views, worst: Math.max(...views) }; });
console.log('  crowd:', JSON.stringify(crowd));
check(`where Dunmore's crowd is thickest (${crowd.most16} people within 16 m, ${crowd.near} bodies whole), the frame stays under 1,000 draw calls every way you look (${crowd.worst})`, crowd.left === 0 && crowd.most16 >= 4 && crowd.near >= 4 && crowd.worst < 1000, crowd);
await g2.close();
