
// v61f9: FORT_EXTERIORS — exterior-shell builders for fort_door portals.
// Each entry is a function (sc, sol, p, ty, M) that constructs the visible
// fort silhouette AROUND a door portal at (p.x, p.z). The door itself
// (void + door leaves + torch + sol-block) is drawn separately by the
// shared _spawnFortDoor helper so the interact zone stays consistent
// regardless of exterior style.
//
// M is the materials bundle (fortStoneM, fortStoneDkM, voidM, doorMat).
// Each exterior builder is responsible for: its silhouette geometry,
// any sol-blockers around the structure, and ANY decorative scatter
// around the approach (rubble, banner, well, etc.) — the spec is
// "everything that makes this fort look like THIS kind of fort."
//
// Registered exteriors:
//   gatehouse         — twin towers + crenellated lintel + curtain-wall stubs
//   watchtower        — three-tier stone tower + perimeter wall + courtyard
//   palisade          — wooden frontier outpost with pointed-log fence ring
//                       (Session 41)
//   monastery         — abandoned cloister: tall remnant wall + cross + low
//                       cloister stubs + fallen pews (Session 41)
//   earthwork         — concentric earth berms + palisade fragments + door
//                       cut into the inner berm (Session 41)
//   keep              — single squat stone block with heavy iron door, arrow
//                       slits, capstone trim (Session 41)
//   ruined_gatehouse  — gatehouse variant: one tower collapsed, lintel sags,
//                       one curtain stub heaped with rubble (Session 41)
//   watchtower_canopy — watchtower variant: same tower, no perimeter wall
//                       or courtyard furniture. Reads as deep-woods-alone
//                       (Session 41)
const FORT_EXTERIORS = {

  // ── gatehouse ─────────────────────────────────────────────────────
  // v61g5: 2× scale + perimeter wall. The twin towers + lintel are now
  // the SOUTH GATE of an enclosed compound. A stone curtain wall ring
  // (~24u radius) encloses the courtyard, with the gate opening on the
  // south face (player approach). Interior door sits at the BACK of
  // the courtyard at (p.x, p.z) — _spawnFortDoor renders it set into
  // the perimeter's back wall (the stub IS the back wall here, with
  // perimeter segments extending laterally to meet the back-wall edges).
  //
  // Coordinate convention v61g5: (p.x, p.z) is the INTERIOR DOOR at
  // the back of the courtyard. Gate showpiece (twin towers + lintel)
  // sits at z = p.z + perimR (south of door). Courtyard between them.
  // Player walks: south road → side path → south gate (twin towers) →
  //               courtyard → north back-wall → interior door.
  //
  // Used by the bealach_central prototype "Old Garrison."
  gatehouse: function(sc, sol, p, ty, M){
    const S = 2.0;                  // v61g5 scale factor
    const perimR = 24;              // perimeter radius (24u → 48u diameter)
    const voidW = 1.3 * S, voidH = 1.8 * S;  // matches _spawnFortDoor v61g5

    // Gate center at (p.x, p.z + perimR) — south face of the perimeter,
    // facing the player.
    const gateCx = p.x;
    const gateCz = p.z + perimR;
    const faceZ = gateCz - 0.22 * S;  // the towers' faceZ (matches old convention)

    // ── Twin gate towers (THE SHOWPIECE — at the south gate) ────────
    const towerW = 1.0 * S, towerH = 3.2 * S, towerD = 1.4 * S;
    [-1, 1].forEach(side=>{
      const tx = gateCx + side * (voidW/2 + towerW/2 + 0.08 * S);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerD), M.fortStoneM);
      tower.position.set(tx, ty + towerH/2, faceZ - 0.1 * S);
      sc.add(tower);
      sol.push({cx:tx, cz:faceZ - 0.1 * S, rx:towerW/2, rz:towerD/2});
      const cap = new THREE.Mesh(new THREE.BoxGeometry(towerW + 0.18 * S, 0.2 * S, towerD + 0.18 * S), M.fortStoneDkM);
      cap.position.set(tx, ty + towerH + 0.1 * S, faceZ - 0.1 * S);
      sc.add(cap);
      [-1, 0, 1].forEach(cdx=>{
        const cren = new THREE.Mesh(new THREE.BoxGeometry(0.28 * S, 0.32 * S, towerD + 0.18 * S), M.fortStoneM);
        cren.position.set(tx + cdx * 0.32 * S, ty + towerH + 0.36 * S, faceZ - 0.1 * S);
        sc.add(cren);
      });
      const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.08 * S, 0.5 * S), M.voidM);
      // v61g5: slit faces +Z (outward, toward player approach side), not
      // -Z which would face into the courtyard.
      slit.position.set(tx, ty + towerH * 0.65, faceZ - 0.1 * S + towerD/2 + 0.005);
      sc.add(slit);
    });

    // ── Lintel spanning the twin towers (the gate's top) ────────────
    const lintelW = voidW + 0.16 * S, lintelH = 0.4 * S;
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(lintelW, lintelH, 1.2 * S), M.fortStoneDkM);
    lintel.position.set(gateCx, ty + voidH + lintelH/2, faceZ - 0.1 * S);
    sc.add(lintel);
    [-1, 0, 1].forEach(cdx=>{
      const cren = new THREE.Mesh(new THREE.BoxGeometry(0.22 * S, 0.3 * S, 1.2 * S), M.fortStoneM);
      cren.position.set(gateCx + cdx * 0.28 * S, ty + voidH + lintelH + 0.15 * S, faceZ - 0.1 * S);
      sc.add(cren);
    });

    // ── Perimeter curtain wall (stone register) ─────────────────────
    // A square-ish ring of stone wall segments at ~perimR distance from
    // the door (p.x, p.z). The south side (toward player) has a wide gap
    // where the gate towers sit; segments fan around east, north, west,
    // back to the towers. Back wall (north, at z = p.z - 0.1) has a gap
    // in the middle where _spawnFortDoor's stub will sit — the perimeter
    // segments extend laterally from the stub edges outward.
    const wallH = 2.4 * S;
    const wallD = 0.8;  // wall thickness (not scaled — 0.8u reads as substantial)
    const wallSegLen = 4.0;  // each segment 4u long
    // v61g5b: stubHalfW 2.5→5.0 to match the upgraded doorhouse (10u wide),
    // backZ p.z → p.z-1.45 so the back wall meets the doorhouse south
    // face flush instead of floating 1.45u south of it.
    const stubHalfW = 5.0;
    const backZ = p.z - 1.45;
    const CX = p.x;
    const CZ = p.z + perimR;
    const halfX = perimR;
    const halfZ = perimR;

    // Helper — emit one wall segment + sol
    const wallSeg = (cx, cz, len, axis)=>{
      const w = axis === 'x' ? len : wallD;
      const d = axis === 'x' ? wallD : len;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), M.fortStoneM);
      seg.position.set(cx, ty + wallH/2, cz);
      sc.add(seg);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.18, d + 0.05), M.fortStoneDkM);
      cap.position.set(cx, ty + wallH + 0.09, cz);
      sc.add(cap);
      sol.push({cx, cz, rx:w/2, rz:d/2});
    };

    // ── South face: split by the gate ───────────────────────────────
    const gateHalfW = voidW/2 + towerW + 0.4 * S;
    {
      const x1 = CX - halfX, x2 = CX - gateHalfW;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, CZ, segLen, 'x');
    }
    {
      const x1 = CX + gateHalfW, x2 = CX + halfX;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, CZ, segLen, 'x');
    }

    // ── East face: gate corner north to back corner (extended for backZ)
    {
      const z1 = CZ, z2 = backZ;
      const segLen = z1 - z2;
      wallSeg(CX + halfX, (z1 + z2)/2, segLen, 'z');
    }
    // ── West face
    {
      const z1 = CZ, z2 = backZ;
      const segLen = z1 - z2;
      wallSeg(CX - halfX, (z1 + z2)/2, segLen, 'z');
    }

    // ── North (back) face: split by the doorhouse ───────────────────
    // Left of doorhouse
    {
      const x1 = CX - halfX, x2 = CX - stubHalfW;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, backZ, segLen, 'x');
    }
    // Right of doorhouse
    {
      const x1 = CX + stubHalfW, x2 = CX + halfX;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, backZ, segLen, 'x');
    }

    // ── Gate torches (v61g5b) ───────────────────────────────────────
    // Wall-mounted torches just outside each gate tower, lit from above
    // the lintel line. Tower top is at ty + towerH + 0.36*S (cap+cren).
    _spawnGateTorches(sc, gateCx, gateCz, ty, gateHalfW, ty + towerH * 0.9, p.col);

    // ── Curtain wall stubs flanking the gate (heritage from v61f9) ──
    // Small fragments on each outer side of the towers, suggesting that
    // more wall used to extend further but has fallen. Scaled & placed
    // just outside the gate towers' lateral footprint.
    [-1, 1].forEach(side=>{
      const wx = gateCx + side * (voidW/2 + towerW + 0.6 * S + 0.5 * S);
      const wh = 2.2 * S;
      const wallStub = new THREE.Mesh(new THREE.BoxGeometry(1.0 * S, wh, 1.0 * S), M.fortStoneM);
      wallStub.position.set(wx, ty + wh/2, faceZ - 0.1 * S);
      sc.add(wallStub);
      sol.push({cx:wx, cz:faceZ - 0.1 * S, rx:0.5 * S, rz:0.5 * S});
      const crumble = new THREE.Mesh(new THREE.BoxGeometry(0.6 * S, 0.4 * S, 0.6 * S), M.fortStoneDkM);
      crumble.position.set(wx + side * 0.35 * S, ty + wh + 0.2 * S, faceZ - 0.1 * S);
      crumble.rotation.set(0.1, side * 0.2, 0.05);
      sc.add(crumble);
    });
  },

  // ── watchtower ────────────────────────────────────────────────────
  // v61g5: 2× scale + rectangular perimeter (48×24).
  // Three-tier stone tower at the back of an enclosed courtyard (just
  // north of the interior door). The gate-arch ruin sits at the south
  // perimeter face — it is now the SHOWPIECE gate of the compound, not
  // a separate atmospheric feature. Courtyard between gate and tower:
  // fallen lintel, rubble scatter, banner pole, dry well.
  //
  // Coordinate convention v61g5: (p.x, p.z) is the INTERIOR DOOR at
  // the back of the courtyard. Tower sits just north of the door (TZ =
  // p.z - baseR - 1.0 * S). Perimeter is a rectangle spanning z ∈
  // [p.z, p.z + 2*perimR] and x ∈ [p.x - 2*perimR, p.x + 2*perimR]
  // — wait, no. Per gatehouse precedent: perimeter footprint is
  // 48 wide × 24 deep (halfX = perimR, halfZ = perimR/2 effectively),
  // with z ∈ [p.z, p.z + 2*perimR/something]. For watchtower we use
  // the same rectangle as gatehouse: x ∈ [p.x-perimR, p.x+perimR],
  // z ∈ [p.z, p.z+perimR] where perimR=24. South gate at z = p.z+perimR.
  watchtower: function(sc, sol, p, ty, M){
    const S = 2.0;
    const perimR = 24;
    const baseR = 2.6 * S;
    const baseH = 4.0 * S;
    const TX = p.x;
    // v61g5: tower center sits just north of the door — baseR+1.0*S
    // north of p.z, leaving ~0.6u clearance between tower south face
    // (at p.z - 1.0*S) and the door face (at p.z - 1.4*S).
    const TZ = p.z - baseR - 1.0 * S;
    const HY = ty;

    const mossMat = new THREE.MeshLambertMaterial({color:0x4a5838});
    const woodMat = new THREE.MeshLambertMaterial({color:0x4a3a28});
    const clothMat = new THREE.MeshLambertMaterial({color:0x807870, side:THREE.DoubleSide});

    // ── Tier 1 (base) — solid cylinder behind the door ──────────────
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(baseR, baseR, baseH, 18), M.fortStoneM);
    tier1.position.set(TX, HY + baseH/2, TZ);
    sc.add(tier1);
    // sol-blocker for tower body. Door portal's own sol entry covers the
    // south approach corridor — this entry covers the rest of the
    // cylinder so the player can't walk through the tower from sides
    // or behind.
    sol.push({cx:TX, cz:TZ - 0.3 * S, rx:baseR, rz:baseR - 0.4 * S});

    // ── Tier 2 — partially collapsed cylinder ──────────────────────
    const t2R = 2.1 * S, t2H = 2.6 * S;
    const t2Y = HY + baseH;
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(t2R, t2R, t2H, 16), M.fortStoneM);
    tier2.position.set(TX, t2Y + t2H/2, TZ);
    sc.add(tier2);
    // v61g5c: rubble fall lowered to GROUND LEVEL at the base of the tower
    // (was floating at t2Y+0.5/1.0/1.5 = 9-11u up in mid-air). Now reads as
    // "stones that fell from the collapsed tier-2 west side and settled at
    // the foot of the tower." Three stones at ty + small_y, clustered just
    // west of the cylinder base.
    [[-baseR - 0.4 * S, 0.30 * S, 0.2 * S],
     [-baseR - 0.9 * S, 0.25 * S, -0.4 * S],
     [-baseR - 0.7 * S, 0.20 * S, 0.7 * S]].forEach(([dx, yy, dz])=>{
      const fall = new THREE.Mesh(new THREE.BoxGeometry(0.7 * S, 0.55 * S, 0.7 * S), M.fortStoneDkM);
      fall.position.set(TX + dx, ty + yy, TZ + dz);
      fall.rotation.set(Math.random()*0.4, Math.random()*Math.PI, Math.random()*0.3);
      sc.add(fall);
    });
    const t2Rim = new THREE.Mesh(new THREE.TorusGeometry(t2R - 0.05 * S, 0.2 * S, 6, 16), M.fortStoneDkM);
    t2Rim.rotation.x = Math.PI/2;
    t2Rim.position.set(TX - 0.15 * S, t2Y + t2H - 0.1 * S, TZ);
    sc.add(t2Rim);

    // ── Tier 3 — crown remnant ─────────────────────────────────────
    // v61g5c: replaced partial-cylinder + backside-inner-cylinder
    // (which only rendered from one side and looked like a clipping glitch
    // from the other side) with a CLOSED FULL CYLINDER + scattered broken
    // stone boxes around the rim on the west side. Reads "crown intact in
    // the east, broken open in the west" from every viewing angle.
    const t3R = 1.6 * S, t3H = 1.7 * S;
    const t3Y = t2Y + t2H;
    // Full cylinder (closed, both ends visible)
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(t3R, t3R, t3H, 12), M.fortStoneM);
    tier3.position.set(TX, t3Y + t3H/2, TZ);
    sc.add(tier3);
    // Broken-stone fragments scattered around the west-side rim, reading
    // as the broken-open portion of the crown. Sit ON TOP of the cylinder,
    // angled outward, varying heights.
    const brokenStones = [
      [-0.55, 0.85, -0.40, 0.4, 0.7, 0.5, 0.25],   // dx_mult, yy_mult, dz_mult, w, h, d, rotZ
      [-0.65, 1.05, 0.10, 0.45, 0.55, 0.45, -0.15],
      [-0.50, 0.90, 0.45, 0.4, 0.6, 0.4, 0.3],
      [-0.25, 1.20, -0.55, 0.35, 0.4, 0.35, 0.1],
    ];
    brokenStones.forEach(([dxm, yym, dzm, w, h, d, rz])=>{
      const stone = new THREE.Mesh(new THREE.BoxGeometry(w * S, h * S, d * S), M.fortStoneDkM);
      stone.position.set(TX + dxm * t3R, t3Y + yym * t3H, TZ + dzm * t3R);
      stone.rotation.set(Math.random()*0.2, Math.random()*Math.PI, rz);
      sc.add(stone);
    });
    // Moss patch on the intact (east) side of the crown
    const t3Moss = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * S, 0.22 * S, 0.05 * S, 8), mossMat);
    t3Moss.position.set(TX + 0.5 * S, t3Y + t3H + 0.04 * S, TZ - 0.3 * S);
    sc.add(t3Moss);

    // ── Perimeter wall (rectangular, stone curtain) ─────────────────
    // Matches the gatehouse pattern: 48u wide × 24u deep rectangle, gate
    // opening on the south face, back wall split around the doorhouse.
    // v61g5b: stubHalfW 2.5→5.0 (doorhouse upgrade), backZ p.z→p.z-1.45
    // (back wall meets doorhouse south face flush).
    const wallH = 2.4 * S;
    const wallD = 0.8;
    const stubHalfW = 5.0;
    const backZ = p.z - 1.45;
    const CX = p.x;
    const CZ = p.z + perimR;  // south face Z
    const halfX = perimR;

    const wallSeg = (cx, cz, len, axis)=>{
      const w = axis === 'x' ? len : wallD;
      const d = axis === 'x' ? wallD : len;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), M.fortStoneM);
      seg.position.set(cx, ty + wallH/2, cz);
      sc.add(seg);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.18, d + 0.05), M.fortStoneDkM);
      cap.position.set(cx, ty + wallH + 0.09, cz);
      sc.add(cap);
      sol.push({cx, cz, rx:w/2, rz:d/2});
    };

    // ── Gate-arch ruin (south opening) — THE SHOWPIECE ──────────────
    const GATE_HALF_W = 2.5 * S;
    [-1, 1].forEach(side=>{
      const pillX = CX + side * GATE_HALF_W;
      const pillZ = CZ;
      const pillY = ty;
      const pillH = 2.4 * S;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7 * S, pillH, 0.7 * S), M.fortStoneM);
      pillar.position.set(pillX, pillY + pillH/2, pillZ);
      pillar.rotation.z = side * 0.06;
      sc.add(pillar);
      sol.push({cx:pillX, cz:pillZ, rx:0.4 * S, rz:0.4 * S});
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.95 * S, 0.35 * S, 0.95 * S), M.fortStoneDkM);
      cap.position.set(pillX + side * 0.04 * S, pillY + pillH + 0.2 * S, pillZ);
      cap.rotation.z = side * 0.08;
      sc.add(cap);
    });

    // South face wall segments — left and right of the gate
    {
      const x1 = CX - halfX, x2 = CX - GATE_HALF_W;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, CZ, segLen, 'x');
    }
    {
      const x1 = CX + GATE_HALF_W, x2 = CX + halfX;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, CZ, segLen, 'x');
    }

    // East face: from south corner to back wall (v61g5b: backZ)
    wallSeg(CX + halfX, (CZ + backZ)/2, CZ - backZ, 'z');
    // West face: mirror
    wallSeg(CX - halfX, (CZ + backZ)/2, CZ - backZ, 'z');

    // Back (north) face — split by the doorhouse
    {
      const x1 = CX - halfX, x2 = CX - stubHalfW;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, backZ, segLen, 'x');
    }
    {
      const x1 = CX + stubHalfW, x2 = CX + halfX;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, backZ, segLen, 'x');
    }

    // ── Gate torches (v61g5b) ───────────────────────────────────────
    _spawnGateTorches(sc, CX, CZ, ty, GATE_HALF_W, ty + 2.4 * S, p.col);

    // ── Fallen lintel — large stone in the courtyard ───────────────
    // Off the gate-to-door axis so the player can pass on either side
    // without it blocking the door approach.
    const lintelX = TX + 1.5 * S;
    const lintelZ = CZ - 4 * S;
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.6 * S, 0.5 * S, 0.75 * S), M.fortStoneM);
    lintel.position.set(lintelX, ty + 0.25 * S, lintelZ);
    lintel.rotation.y = 0.4;
    sc.add(lintel);
    sol.push({cx:lintelX, cz:lintelZ, rx:1.3 * S, rz:0.55 * S});

    // ── Courtyard rubble scatter — 6 piles ─────────────────────────
    // Positions scaled out to spread across the larger courtyard.
    const rubblePositions = [
      [TX - 4.0 * S, CZ - 6.0 * S], [TX + 4.5 * S, CZ - 7.0 * S],
      [TX - 6.0 * S, CZ - 12.0 * S], [TX + 6.0 * S, CZ - 13.0 * S],
      [TX - 5.0 * S, CZ - 18.0 * S], [TX + 5.5 * S, CZ - 19.0 * S],
    ];
    rubblePositions.forEach(([rx, rz])=>{
      const pile = new THREE.Mesh(new THREE.BoxGeometry(0.9 * S, 0.5 * S, 0.9 * S), M.fortStoneM);
      pile.position.set(rx, ty + 0.25 * S, rz);
      pile.rotation.y = Math.random() * Math.PI;
      sc.add(pile);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.5 * S, 0.28 * S, 0.5 * S), M.fortStoneDkM);
      top.position.set(rx + 0.1 * S, ty + 0.64 * S, rz - 0.1 * S);
      sc.add(top);
      sol.push({cx:rx, cz:rz, rx:0.5 * S, rz:0.5 * S});
    });

    // ── Fallen banner pole + tatter ─────────────────────────────────
    const poleX = TX + 3.5 * S, poleZ = CZ - 8.0 * S;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * S, 0.05 * S, 2.8 * S, 6), woodMat);
    pole.rotation.z = Math.PI/2;
    pole.rotation.y = 0.6;
    pole.position.set(poleX, ty + 0.06 * S, poleZ);
    sc.add(pole);
    const tatter = new THREE.Mesh(new THREE.PlaneGeometry(0.5 * S, 0.7 * S), clothMat);
    tatter.rotation.x = -Math.PI/2 + 0.3;
    tatter.position.set(poleX + 1.3 * S, ty + 0.10 * S, poleZ + 0.15 * S);
    sc.add(tatter);

    // ── Dry well ─────────────────────────────────────────────────────
    const wellX = TX - 7.0 * S, wellZ = CZ - 10.0 * S;
    const wellRing = new THREE.Mesh(new THREE.CylinderGeometry(0.85 * S, 0.85 * S, 0.5 * S, 16), M.fortStoneM);
    wellRing.position.set(wellX, ty + 0.25 * S, wellZ);
    sc.add(wellRing);
    const wellHole = new THREE.Mesh(new THREE.CylinderGeometry(0.65 * S, 0.65 * S, 0.4 * S, 16), new THREE.MeshLambertMaterial({color:0x0a0a08}));
    wellHole.position.set(wellX, ty + 0.30 * S, wellZ);
    sc.add(wellHole);
    sol.push({cx:wellX, cz:wellZ, rx:0.95 * S, rz:0.95 * S});
  },

  // ── palisade ──────────────────────────────────────────────────────
  // v61g5: 2× scale + rectangular wooden palisade perimeter.
  // Wooden frontier outpost. Pointed-log fence in a 48×24 rectangle
  // enclosing the courtyard, with the south face split for the gate.
  // The log gate cap + flanking heavy logs (the SHOWPIECE) sit at the
  // south face, framing the gap. The watch-platform stub sits inside
  // the courtyard. Wood register distinct from the stone forts.
  //
  // Coordinate convention v61g5: (p.x, p.z) is the INTERIOR DOOR at the
  // back of the courtyard. Gate gap centered at (p.x, p.z + perimR) on
  // the south face. Player walks: road → side path → south log gate →
  // courtyard → north back wall → interior door.
  palisade: function(sc, sol, p, ty, M){
    const S = 2.0;
    const perimR = 24;
    // Wood materials — warm log brown for posts, slightly darker for caps
    const logMat = new THREE.MeshLambertMaterial({color:0x5c3a20});
    const logDkMat = new THREE.MeshLambertMaterial({color:0x3a2410});
    const logLtMat = new THREE.MeshLambertMaterial({color:0x6a4628});

    const CX = p.x;
    const CZ = p.z + perimR;        // south face Z
    const halfX = perimR;
    // v61g5b: stubHalfW 2.5→5.0 (doorhouse upgrade), backZ p.z→p.z-1.45.
    const stubHalfW = 5.0;
    const backZ = p.z - 1.45;

    // ── Helper: emit a row of pointed palisade logs along an axis ──
    // (x1, z1) → (x2, z2) along either X or Z axis. Pseudo-random log
    // height variance per index for organic feel. Each log gets a sol
    // entry; row sol coverage is sparse but each individual log blocks.
    const palisadeRow = (x1, z1, x2, z2, startSeed)=>{
      const dx = x2 - x1, dz = z2 - z1;
      const dist = Math.hypot(dx, dz);
      const spacing = 0.6;  // log every 0.6u along the row
      const n = Math.max(1, Math.floor(dist / spacing));
      for(let i = 0; i <= n; i++){
        const t = i / n;
        const lx = x1 + dx * t;
        const lz = z1 + dz * t;
        const lh = 2.2 * S + (((i * 7 + startSeed) % 5) * 0.15 * S);
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * S, 0.20 * S, lh, 6), logMat);
        log.position.set(lx, ty + lh/2, lz);
        sc.add(log);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.20 * S, 0.35 * S, 6), logDkMat);
        cap.position.set(lx, ty + lh + 0.17 * S, lz);
        sc.add(cap);
        sol.push({cx:lx, cz:lz, rx:0.25 * S, rz:0.25 * S});
      }
    };

    // ── South face: split by the gate ───────────────────────────────
    const GATE_HALF_W = 2.5 * S;  // gate opening half-width (the showpiece sits in this gap)
    // Left of gate
    palisadeRow(CX - halfX, CZ, CX - GATE_HALF_W, CZ, 0);
    // Right of gate
    palisadeRow(CX + GATE_HALF_W, CZ, CX + halfX, CZ, 100);

    // ── East face: south corner → back wall (v61g5b: backZ)
    palisadeRow(CX + halfX, CZ, CX + halfX, backZ, 200);
    // ── West face: south corner → back wall ─────────────────────────
    palisadeRow(CX - halfX, CZ, CX - halfX, backZ, 300);

    // ── North (back) face — split by doorhouse ──────────────────────
    palisadeRow(CX - halfX, backZ, CX - stubHalfW, backZ, 400);
    palisadeRow(CX + stubHalfW, backZ, CX + halfX, backZ, 500);

    // ── Gate showpiece: heavy log gate cap + flanking logs ──────────
    // Two thick vertical logs flanking the south gate gap + horizontal
    // lintel log spanning. Replaces _spawnFortDoor's stone frame look
    // here with a wood-coded gate framing. Logs taller than palisade.
    const gateLogH = 3.4 * S;
    const gateLogR = 0.28 * S;
    [-1, 1].forEach(side=>{
      const gx = CX + side * (GATE_HALF_W - 0.3 * S);
      const gz = CZ;
      const gateLog = new THREE.Mesh(new THREE.CylinderGeometry(gateLogR, gateLogR, gateLogH, 8), logLtMat);
      gateLog.position.set(gx, ty + gateLogH/2, gz);
      sc.add(gateLog);
      sol.push({cx:gx, cz:gz, rx:0.32 * S, rz:0.32 * S});
      const gateCap = new THREE.Mesh(new THREE.ConeGeometry(0.32 * S, 0.45 * S, 8), logDkMat);
      gateCap.position.set(gx, ty + gateLogH + 0.22 * S, gz);
      sc.add(gateCap);
    });
    // Horizontal lintel log spanning the gap
    const lintel = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * S, 0.22 * S, 2 * (GATE_HALF_W - 0.3 * S) + 0.3 * S, 8), logMat);
    lintel.rotation.z = Math.PI/2;
    lintel.position.set(CX, ty + gateLogH - 0.4 * S, CZ);
    sc.add(lintel);

    // ── Gate torches (v61g5b) ───────────────────────────────────────
    _spawnGateTorches(sc, CX, CZ, ty, GATE_HALF_W, ty + gateLogH * 0.85, p.col);

    // ── Watch-platform stub — tall pole canted, broken planks on top ─
    // Inside the perimeter, off to the side. Tall pole with a small
    // broken-plank platform at the top, canted slightly.
    const wpX = CX + 5.5 * S, wpZ = CZ - 10.0 * S;
    const wpH = 4.2 * S;
    const wpPole = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * S, 0.20 * S, wpH, 6), logMat);
    wpPole.rotation.z = 0.06;
    wpPole.position.set(wpX, ty + wpH/2, wpZ);
    sc.add(wpPole);
    const wpPlat = new THREE.Mesh(new THREE.BoxGeometry(1.2 * S, 0.08 * S, 0.9 * S), logDkMat);
    wpPlat.position.set(wpX + 0.2 * S, ty + wpH - 0.05 * S, wpZ);
    wpPlat.rotation.z = 0.06;
    wpPlat.rotation.x = -0.12;
    sc.add(wpPlat);
    const wpFrag = new THREE.Mesh(new THREE.BoxGeometry(0.5 * S, 0.06 * S, 0.3 * S), logMat);
    wpFrag.position.set(wpX + 0.85 * S, ty + wpH - 0.45 * S, wpZ + 0.1 * S);
    wpFrag.rotation.z = -0.7;
    sc.add(wpFrag);
    sol.push({cx:wpX, cz:wpZ, rx:0.25 * S, rz:0.25 * S});

    // ── Courtyard scatter — barrel/crate ────────────────────────────
    const crateX = CX - 4.5 * S, crateZ = CZ - 12.0 * S;
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8 * S, 0.7 * S, 0.8 * S), logLtMat);
    crate.position.set(crateX, ty + 0.35 * S, crateZ);
    crate.rotation.y = 0.4;
    sc.add(crate);
    sol.push({cx:crateX, cz:crateZ, rx:0.45 * S, rz:0.45 * S});
    // Tipped barrel beside it
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * S, 0.35 * S, 0.85 * S, 10), logMat);
    barrel.rotation.z = Math.PI/2 + 0.2;
    barrel.position.set(crateX + 1.1 * S, ty + 0.35 * S, crateZ + 0.3 * S);
    sc.add(barrel);
    sol.push({cx:crateX + 1.1 * S, cz:crateZ + 0.3 * S, rx:0.5 * S, rz:0.4 * S});
  },

  // ── monastery ─────────────────────────────────────────────────────
  // v61g5: 2× scale + rectangular stone perimeter (low cloister-style
  // curtain wall, no crenellations — Norman austerity).
  //
  // Abandoned cloister. The tall remnant wall + pointed arch is now the
  // BACK wall of the perimeter, with the door set into it (the wall
  // around _spawnFortDoor's stub IS the remnant wall). Cloister stubs
  // run laterally as part of the side walls. The stone cross + fallen
  // pews are in the courtyard. The south GATE SHOWPIECE is a single
  // arched stone gate opening (Norman pointed-arch register).
  //
  // Coordinate convention v61g5: (p.x, p.z) is the interior door at the
  // back of the courtyard. Gate at z = p.z + perimR on south face.
  monastery: function(sc, sol, p, ty, M){
    const S = 2.0;
    const perimR = 24;
    const CX = p.x;
    const CZ = p.z + perimR;        // south face Z
    const halfX = perimR;
    // v61g5b: stubHalfW 2.5→5.0 (doorhouse upgrade), backZ p.z→p.z-1.45.
    const stubHalfW = 5.0;
    const backZ = p.z - 1.45;

    // ── Remnant wall — tall stone wall at the back, around the door ─
    // v61g5b: widened from 12u→16u to accommodate the upgraded 10u-wide
    // doorhouse with 3u of stone on each side. Positioned at backZ so it
    // sits flush with the perimeter back-wall line.
    const wallW = 8.0 * S, wallH = 5.0 * S, wallD = 0.7 * S;
    const wallZ = backZ;
    // The wall opening matches the doorhouse width (10u centered).
    const wallOpenHalf = 5.0;
    // Left section
    const wallL_W = wallW/2 - wallOpenHalf;
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(wallL_W, wallH, wallD), M.fortStoneM);
    wallL.position.set(p.x - wallOpenHalf - wallL_W/2, ty + wallH/2, wallZ);
    sc.add(wallL);
    sol.push({cx:p.x - wallOpenHalf - wallL_W/2, cz:wallZ, rx:wallL_W/2, rz:wallD/2});
    // Right section
    const wallR_W = wallL_W;
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(wallR_W, wallH, wallD), M.fortStoneM);
    wallR.position.set(p.x + wallOpenHalf + wallR_W/2, ty + wallH/2, wallZ);
    sc.add(wallR);
    sol.push({cx:p.x + wallOpenHalf + wallR_W/2, cz:wallZ, rx:wallR_W/2, rz:wallD/2});
    // Top section (above doorway) — bridges the opening above the door.
    // doorClearH must clear the upgraded 3.6u-tall door + 0.4u frame.
    const topGapW = 2 * wallOpenHalf;
    const doorClearH = 4.4 * S;  // v61g5b: bumped from 2.6*S for taller door
    if(wallH > doorClearH){
      const wallT = new THREE.Mesh(new THREE.BoxGeometry(topGapW, wallH - doorClearH, wallD), M.fortStoneM);
      wallT.position.set(p.x, ty + doorClearH + (wallH - doorClearH)/2, wallZ);
      sc.add(wallT);
    }
    // Crumbled cap fragments along the top
    [-2.5 * S, 0, 2.5 * S].forEach(dx=>{
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.6 * S - Math.abs(dx)*0.12, 0.3 * S, wallD + 0.1 * S), M.fortStoneDkM);
      cap.position.set(p.x + dx, ty + wallH + 0.15 * S, wallZ);
      cap.rotation.z = dx === 0 ? 0 : (dx > 0 ? 1 : -1) * 0.04;
      sc.add(cap);
    });

    // Pointed arch above the doorway — Norman sacred register.
    // v61g5b: scaled up to sit above the larger 10u doorway.
    const archStone = (dx, ry)=>{
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.7 * S, 1.8 * S, wallD + 0.05 * S), M.fortStoneDkM);
      s.position.set(p.x + dx, ty + 4.0 * S, wallZ + 0.02 * S);
      s.rotation.z = ry;
      sc.add(s);
    };
    archStone(-1.4 * S, 0.45);
    archStone(1.4 * S, -0.45);

    // ── Perimeter (low cloister curtain wall) ───────────────────────
    const peri_wallH = 1.6 * S;
    const peri_wallD = 0.6;
    const wallSeg = (cx, cz, len, axis)=>{
      const w = axis === 'x' ? len : peri_wallD;
      const d = axis === 'x' ? peri_wallD : len;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(w, peri_wallH, d), M.fortStoneM);
      seg.position.set(cx, ty + peri_wallH/2, cz);
      sc.add(seg);
      sol.push({cx, cz, rx:w/2, rz:d/2});
    };

    // East face — extended to backZ
    wallSeg(CX + halfX, (CZ + backZ)/2, CZ - backZ, 'z');
    // West face
    wallSeg(CX - halfX, (CZ + backZ)/2, CZ - backZ, 'z');
    // Back face extensions (from remnant wall outward to perimeter corners)
    {
      const x1 = CX - halfX, x2 = CX - wallW/2;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, backZ, segLen, 'x');
    }
    {
      const x1 = CX + wallW/2, x2 = CX + halfX;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, backZ, segLen, 'x');
    }

    // South face: split by gate
    const GATE_HALF_W = 2.5 * S;
    {
      const x1 = CX - halfX, x2 = CX - GATE_HALF_W;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, CZ, segLen, 'x');
    }
    {
      const x1 = CX + GATE_HALF_W, x2 = CX + halfX;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, CZ, segLen, 'x');
    }

    // ── Gate showpiece: arched stone gate at south face ─────────────
    const gatePostH = 3.6 * S;
    const gatePostW = 0.6 * S;
    const gatePostD = 0.8 * S;
    [-1, 1].forEach(side=>{
      const gx = CX + side * (GATE_HALF_W - gatePostW/2);
      const gz = CZ;
      const post = new THREE.Mesh(new THREE.BoxGeometry(gatePostW, gatePostH, gatePostD), M.fortStoneM);
      post.position.set(gx, ty + gatePostH/2, gz);
      sc.add(post);
      sol.push({cx:gx, cz:gz, rx:gatePostW/2, rz:gatePostD/2});
    });
    // Pointed-arch lintel — two angled stones meeting at a peak.
    const gateLintelY = ty + gatePostH;
    [-1, 1].forEach(side=>{
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.5 * S, 1.4 * S, gatePostD + 0.05 * S), M.fortStoneDkM);
      stone.position.set(CX + side * (GATE_HALF_W * 0.5), gateLintelY + 0.4 * S, CZ + 0.02 * S);
      stone.rotation.z = -side * 0.45;
      sc.add(stone);
    });

    // ── Gate torches (v61g5b) ───────────────────────────────────────
    _spawnGateTorches(sc, CX, CZ, ty, GATE_HALF_W, ty + gatePostH * 0.85, p.col);

    // ── Cloister stubs — low walls fanning east and west of remnant ──
    // Repositioned for v61g5: now sit just inside the east and west
    // perimeter walls, projecting toward the courtyard center. Reads as
    // the remnants of the inner cloister walk.
    [-1, 1].forEach(side=>{
      const startX = p.x + side * (wallW/2 + 0.6 * S);
      for(let i = 0; i < 4; i++){
        const sx = startX + side * (i * 1.2 * S);
        const sz = wallZ + 1.5 * S + i * 0.6 * S;   // run INTO the courtyard
        const h = 0.9 * S - i * 0.12 * S;
        const stub = new THREE.Mesh(new THREE.BoxGeometry(1.0 * S, h, 0.5 * S), M.fortStoneM);
        stub.position.set(sx, ty + h/2, sz);
        stub.rotation.y = side * 0.08 * i;
        sc.add(stub);
        sol.push({cx:sx, cz:sz, rx:0.5 * S, rz:0.3 * S});
        if(i === 1){
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * S, 0.20 * S, 1.6 * S, 8), M.fortStoneDkM);
          col.position.set(sx, ty + h + 0.8 * S, sz);
          sc.add(col);
        }
      }
    });

    // ── Stone cross — center-east of courtyard ─────────────────────
    const crX = p.x + 4.5 * S, crZ = CZ - 14.0 * S;
    const crH = 2.5 * S;
    const crShaft = new THREE.Mesh(new THREE.BoxGeometry(0.22 * S, crH, 0.22 * S), M.fortStoneDkM);
    crShaft.position.set(crX, ty + crH/2, crZ);
    crShaft.rotation.z = -0.04;
    sc.add(crShaft);
    const crArm = new THREE.Mesh(new THREE.BoxGeometry(0.95 * S, 0.22 * S, 0.22 * S), M.fortStoneDkM);
    crArm.position.set(crX - 0.05 * S, ty + crH * 0.7, crZ);
    crArm.rotation.z = -0.04;
    sc.add(crArm);
    const crBase = new THREE.Mesh(new THREE.BoxGeometry(0.55 * S, 0.25 * S, 0.55 * S), M.fortStoneM);
    crBase.position.set(crX, ty + 0.13 * S, crZ);
    sc.add(crBase);
    sol.push({cx:crX, cz:crZ, rx:0.32 * S, rz:0.32 * S});

    // ── Fallen pew/bench scatter in courtyard ───────────────────────
    const woodMat = new THREE.MeshLambertMaterial({color:0x4a3018});
    [[p.x - 3.5 * S, CZ - 18.0 * S, 0.6], [p.x - 1.8 * S, CZ - 14.0 * S, -0.3], [p.x + 2.0 * S, CZ - 10.0 * S, 1.2]].forEach(([bx, bz, br])=>{
      const pew = new THREE.Mesh(new THREE.BoxGeometry(1.8 * S, 0.18 * S, 0.5 * S), woodMat);
      pew.position.set(bx, ty + 0.09 * S, bz);
      pew.rotation.y = br;
      pew.rotation.z = 0.15;
      sc.add(pew);
      sol.push({cx:bx, cz:bz, rx:0.7 * S, rz:0.3 * S});
    });
  },

  // ── earthwork ─────────────────────────────────────────────────────
  // v61g5: 2× scale + concentric berm perimeter.
  // Pre-stone hillfort. Two concentric earth berms enclose a 48u-wide
  // outer compound. The OUTER berm is the perimeter (gap on south for
  // the gate showpiece — stone door-retaining frame); the INNER berm
  // is a sacred inner ring with a smaller gap on north (where the door
  // sits at the back wall). Player walks through south gate, across
  // the outer berm gap, across the courtyard between berms, through the
  // north inner-berm gap, up to the door. The two-tier defense reads
  // as the oldest fort form on the map.
  //
  // Coordinate convention v61g5: (p.x, p.z) is the interior door at the
  // back of the courtyard. Berms centered between gate and door.
  earthwork: function(sc, sol, p, ty, M){
    const S = 2.0;
    const perimR = 24;
    // v61g5b: switched from concentric circular berms (which were
    // overlapping at near-identical radius and blocking the south
    // corridor) to a rectangular earthen berm matching the gatehouse
    // 48×24 footprint. Hillforts in reality were often rectangular too
    // (ringforts, castros) — the predecessor-culture register comes from
    // earth + sod cap + palisade fragments on top, not from circular shape.
    const earthMat = new THREE.MeshLambertMaterial({color:0x6a4828});
    const sodMat = new THREE.MeshLambertMaterial({color:0x4a5028});
    const palLogMat = new THREE.MeshLambertMaterial({color:0x4a2c14});

    const CX = p.x;
    const CZ = p.z + perimR;       // south face Z
    const halfX = perimR;
    const backZ = p.z - 1.45;
    const stubHalfW = 5.0;
    const bermH = 1.6 * S;          // lower than stone walls — earthen register
    const bermD = 1.8;              // 1.8u deep (substantial earth fill)

    // ── Helper: emit one earth berm segment + sod cap + palisade fragment + sol
    // Like wallSeg in other forts but with earthen materials and a sparse
    // palisade log fragment on top every other segment.
    let palCounter = 0;
    const bermSeg = (cx, cz, len, axis)=>{
      const w = axis === 'x' ? len : bermD;
      const d = axis === 'x' ? bermD : len;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(w, bermH, d), earthMat);
      seg.position.set(cx, ty + bermH/2, cz);
      sc.add(seg);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.2 * S, d + 0.05), sodMat);
      cap.position.set(cx, ty + bermH + 0.1 * S, cz);
      sc.add(cap);
      sol.push({cx, cz, rx:w/2, rz:d/2});
      // Sparse palisade log on top — every other segment for visual rhythm.
      palCounter++;
      if(palCounter % 2 === 0){
        const palH = 1.0 * S + ((palCounter * 7) % 5) * 0.1 * S;
        const palLog = new THREE.Mesh(new THREE.CylinderGeometry(0.10 * S, 0.12 * S, palH, 5), palLogMat);
        palLog.position.set(cx, ty + bermH + 0.2 * S + palH/2, cz);
        palLog.rotation.z = (palCounter % 3 - 1) * 0.15;
        sc.add(palLog);
        const palCap = new THREE.Mesh(new THREE.ConeGeometry(0.13 * S, 0.20 * S, 5), palLogMat);
        palCap.position.set(palLog.position.x, ty + bermH + 0.2 * S + palH + 0.10 * S, palLog.position.z);
        sc.add(palCap);
      }
    };

    // Split each face into ~3-4 segments to give the palisade fragments
    // distributed coverage along the perimeter.
    const subdivide = (x1, z1, x2, z2, n)=>{
      const dx = x2 - x1, dz = z2 - z1;
      const totalLen = Math.hypot(dx, dz);
      if(totalLen < 0.5) return;
      const axis = Math.abs(dx) > Math.abs(dz) ? 'x' : 'z';
      const segLen = totalLen / n;
      for(let i = 0; i < n; i++){
        const t = (i + 0.5) / n;
        const cx = x1 + dx * t;
        const cz = z1 + dz * t;
        bermSeg(cx, cz, segLen, axis);
      }
    };

    // ── South face: split by gate ───────────────────────────────────
    const GATE_HALF_W = 2.5 * S;  // gate opening half-width
    subdivide(CX - halfX, CZ, CX - GATE_HALF_W, CZ, 3);
    subdivide(CX + GATE_HALF_W, CZ, CX + halfX, CZ, 3);
    // ── East face (gate corner → back corner) ───────────────────────
    subdivide(CX + halfX, CZ, CX + halfX, backZ, 4);
    // ── West face
    subdivide(CX - halfX, CZ, CX - halfX, backZ, 4);
    // ── Back face: split by doorhouse
    subdivide(CX - halfX, backZ, CX - stubHalfW, backZ, 2);
    subdivide(CX + stubHalfW, backZ, CX + halfX, backZ, 2);

    // ── Gate showpiece: predecessor-culture stone door-frame at south
    // gate gap. Two heavy flanking slabs + a horizontal lintel above —
    // Irish-register masonry, scaled to read as the gate showpiece.
    const gateZ = CZ;
    [-1, 1].forEach(side=>{
      const sx = CX + side * 1.6 * S;
      const sz = gateZ;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.7 * S, 3.2 * S, 0.85 * S), M.fortStoneM);
      slab.position.set(sx, ty + 1.6 * S, sz);
      sc.add(slab);
      sol.push({cx:sx, cz:sz, rx:0.4 * S, rz:0.45 * S});
    });
    const gateLintel = new THREE.Mesh(new THREE.BoxGeometry(3.6 * S, 0.55 * S, 1.0 * S), M.fortStoneDkM);
    gateLintel.position.set(CX, ty + 3.4 * S, gateZ);
    sc.add(gateLintel);

    // ── Gate torches (v61g5b) ───────────────────────────────────────
    _spawnGateTorches(sc, CX, gateZ, ty, 1.6 * S, ty + 3.2 * S * 0.85, p.col);

    // ── Door retaining stones at the doorhouse flanks ───────────────
    [-1, 1].forEach(side=>{
      const sx = p.x + side * 5 * S;
      const sz = p.z - 0.2 * S;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.55 * S, 2.8 * S, 0.7 * S), M.fortStoneM);
      slab.position.set(sx, ty + 1.4 * S, sz);
      sc.add(slab);
      sol.push({cx:sx, cz:sz, rx:0.32 * S, rz:0.35 * S});
    });
    const eLintel = new THREE.Mesh(new THREE.BoxGeometry(11 * S, 0.42 * S, 0.85 * S), M.fortStoneDkM);
    eLintel.position.set(p.x, ty + 2.95 * S, p.z - 0.2 * S);
    sc.add(eLintel);

    // ── Scattered cairn-stones in courtyard ─────────────────────────
    [[CX - 9 * S, CZ - 8 * S], [CX + 8 * S, CZ - 18 * S], [CX - 4 * S, CZ - 10 * S]].forEach(([cx, cz])=>{
      const stack1 = new THREE.Mesh(new THREE.BoxGeometry(0.5 * S, 0.4 * S, 0.5 * S), M.fortStoneM);
      stack1.position.set(cx, ty + 0.2 * S, cz);
      sc.add(stack1);
      const stack2 = new THREE.Mesh(new THREE.BoxGeometry(0.35 * S, 0.3 * S, 0.35 * S), M.fortStoneDkM);
      stack2.position.set(cx + 0.05 * S, ty + 0.55 * S, cz - 0.05 * S);
      sc.add(stack2);
      sol.push({cx:cx, cz:cz, rx:0.3 * S, rz:0.3 * S});
    });
  },

  // ── keep ──────────────────────────────────────────────────────────
  // v61g5: 2× scale + low stone curtain perimeter with a modest south
  // gate-arch (lord's-holdfast register).
  //
  // The KEEP itself is the showpiece — single squat block sitting at the
  // back of the courtyard with the door in its south face. The perimeter
  // is a low stone curtain (less imposing than the keep) with a modest
  // arched gate on the south face. Reads "lord's hold, retreated to."
  //
  // Coordinate convention v61g5: (p.x, p.z) is the interior door at the
  // keep's south face. Block sits behind door (north). Perimeter encloses
  // the courtyard south of the keep.
  keep: function(sc, sol, p, ty, M){
    const S = 2.0;
    const perimR = 24;
    // v61g5b: block widened 4.4*S → 7.0*S (8.8u → 14u) so it visibly
    // engulfs the 10u-wide doorhouse and reads as the keep itself, not
    // a narrower structure with a doorhouse poking out the side. Block
    // depth bumped 4.0*S → 5.0*S for the same proportional substance.
    const blockW = 7.0 * S, blockH = 6.0 * S, blockD = 5.0 * S;
    const KX = p.x;
    // Block sits so its south face is at backZ = p.z - 1.45, flush with
    // the perimeter back wall line and the doorhouse south face. Block
    // extends north (into the back of the perimeter) from there.
    const backZ_local = p.z - 1.45;
    const KZ = backZ_local - blockD/2;  // block center

    // ── Main block — THE SHOWPIECE ──────────────────────────────────
    const block = new THREE.Mesh(new THREE.BoxGeometry(blockW, blockH, blockD), M.fortStoneM);
    block.position.set(KX, ty + blockH/2, KZ);
    sc.add(block);
    sol.push({cx:KX, cz:KZ, rx:blockW/2, rz:blockD/2});

    // ── Capstone trim — darker band around the top ──────────────────
    const cap = new THREE.Mesh(new THREE.BoxGeometry(blockW + 0.3 * S, 0.4 * S, blockD + 0.3 * S), M.fortStoneDkM);
    cap.position.set(KX, ty + blockH + 0.2 * S, KZ);
    sc.add(cap);
    [-1, 1].forEach(sx=>{
      [-1, 1].forEach(sz=>{
        const cren = new THREE.Mesh(new THREE.BoxGeometry(0.5 * S, 0.6 * S, 0.5 * S), M.fortStoneM);
        cren.position.set(KX + sx * (blockW/2 - 0.15 * S), ty + blockH + 0.7 * S, KZ + sz * (blockD/2 - 0.15 * S));
        sc.add(cren);
      });
    });

    // ── Arrow slits — narrow vertical voids flanking the doorhouse ──
    // v61g5b: pushed out to ±3.5*S (was ±1.5*S) so they sit OUTSIDE
    // the 10u doorhouse, on the visible portions of the keep's south
    // face.
    const slitFaceZ = KZ + blockD/2 + 0.005 * S;
    [-1, 1].forEach(side=>{
      const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.22 * S, 1.1 * S), M.voidM);
      slit.position.set(KX + side * 3.5 * S, ty + blockH * 0.7, slitFaceZ);
      sc.add(slit);
      const surround = new THREE.Mesh(new THREE.BoxGeometry(0.40 * S, 1.25 * S, 0.08 * S), M.fortStoneDkM);
      surround.position.set(KX + side * 3.5 * S, ty + blockH * 0.7, slitFaceZ - 0.04 * S);
      sc.add(surround);
    });

    // ── Banner mount above doorhouse ────────────────────────────────
    // v61g5b: positioned higher (banner now reads above the doorhouse
    // crown, not behind it).
    const ironMat = new THREE.MeshLambertMaterial({color:0x252220});
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.8 * S, 0.10 * S, 0.20 * S), ironMat);
    bracket.position.set(KX, ty + blockH - 0.4 * S, slitFaceZ + 0.05 * S);
    sc.add(bracket);
    const bannerMat = new THREE.MeshLambertMaterial({color:0x4a3a3a, side:THREE.DoubleSide});
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.8 * S, 1.5 * S), bannerMat);
    banner.position.set(KX, ty + blockH - 1.2 * S, slitFaceZ + 0.05 * S);
    banner.rotation.y = 0.05;
    sc.add(banner);
    const tear = new THREE.Mesh(new THREE.PlaneGeometry(0.20 * S, 0.30 * S), bannerMat);
    tear.position.set(KX + 0.25 * S, ty + blockH - 2.1 * S, slitFaceZ + 0.06 * S);
    tear.rotation.y = 0.1;
    tear.rotation.z = 0.4;
    sc.add(tear);

    // ── Perimeter (low stone curtain wall) ──────────────────────────
    const peri_wallH = 1.8 * S;
    const peri_wallD = 0.6;
    // v61g5b: stubHalfW 2.5→5.0 unused here (keep block is wider than
    // doorhouse so it fills the back wall); kept for documentation.
    const stubHalfW = 5.0;
    const backZ = p.z - 1.45;
    const CX = p.x;
    const CZ = p.z + perimR;
    const halfX = perimR;

    const wallSeg = (cx, cz, len, axis)=>{
      const w = axis === 'x' ? len : peri_wallD;
      const d = axis === 'x' ? peri_wallD : len;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(w, peri_wallH, d), M.fortStoneM);
      seg.position.set(cx, ty + peri_wallH/2, cz);
      sc.add(seg);
      const wcap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.14, d + 0.05), M.fortStoneDkM);
      wcap.position.set(cx, ty + peri_wallH + 0.07, cz);
      sc.add(wcap);
      sol.push({cx, cz, rx:w/2, rz:d/2});
    };

    // South face split by gate (gate opening 4u wide centered on CX).
    const GATE_HALF_W = 2.0 * S;
    {
      const x1 = CX - halfX, x2 = CX - GATE_HALF_W;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, CZ, segLen, 'x');
    }
    {
      const x1 = CX + GATE_HALF_W, x2 = CX + halfX;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, CZ, segLen, 'x');
    }
    // East face — extends to backZ
    wallSeg(CX + halfX, (CZ + backZ)/2, CZ - backZ, 'z');
    // West face
    wallSeg(CX - halfX, (CZ + backZ)/2, CZ - backZ, 'z');
    // Back face — the KEEP occupies the central back area, so segments
    // run from perimeter corners to the keep's east+west faces.
    const keepHalfW = blockW/2;
    {
      const x1 = CX - halfX, x2 = CX - keepHalfW;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, backZ, segLen, 'x');
    }
    {
      const x1 = CX + keepHalfW, x2 = CX + halfX;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, backZ, segLen, 'x');
    }

    // ── Gate showpiece: modest stone gate-arch ──────────────────────
    const gatePostH = 3.0 * S;
    const gatePostW = 0.7 * S;
    const gatePostD = 0.9 * S;
    [-1, 1].forEach(side=>{
      const gx = CX + side * (GATE_HALF_W - gatePostW/2);
      const post = new THREE.Mesh(new THREE.BoxGeometry(gatePostW, gatePostH, gatePostD), M.fortStoneM);
      post.position.set(gx, ty + gatePostH/2, CZ);
      sc.add(post);
      sol.push({cx:gx, cz:CZ, rx:gatePostW/2, rz:gatePostD/2});
    });
    const gateLintel = new THREE.Mesh(new THREE.BoxGeometry(2 * GATE_HALF_W + 0.3 * S, 0.5 * S, gatePostD + 0.1 * S), M.fortStoneDkM);
    gateLintel.position.set(CX, ty + gatePostH + 0.25 * S, CZ);
    sc.add(gateLintel);

    // ── Gate torches (v61g5b) ───────────────────────────────────────
    _spawnGateTorches(sc, CX, CZ, ty, GATE_HALF_W, ty + gatePostH * 0.85, p.col);

    // ── Stone scatter at the base — natural weathering ──────────────
    [[KX - 4.5 * S, KZ + blockD/2 + 1.0 * S], [KX + 4.2 * S, KZ + blockD/2 + 0.6 * S]].forEach(([sx, sz])=>{
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.6 * S, 0.4 * S, 0.5 * S), M.fortStoneM);
      stone.position.set(sx, ty + 0.2 * S, sz);
      stone.rotation.y = Math.random() * Math.PI;
      sc.add(stone);
      sol.push({cx:sx, cz:sz, rx:0.35 * S, rz:0.3 * S});
    });
  },

  // ── ruined_gatehouse ──────────────────────────────────────────────
  // v61g5: 2× scale + rectangular stone perimeter. Variant of gatehouse:
  // one tower (west) stays intact, the east tower has collapsed to a
  // stub, the lintel sags toward the collapsed side. East curtain has
  // also partially collapsed — replaced with rubble heap. Same dramatic
  // silhouette as new gatehouse, dramatically different state.
  //
  // Coordinate convention v61g5: matches gatehouse — (p.x, p.z) is the
  // interior door at the back of the courtyard. Gate at south face of
  // perimeter with twin towers (one of which is collapsed).
  ruined_gatehouse: function(sc, sol, p, ty, M){
    const S = 2.0;
    const perimR = 24;
    const voidW = 1.3 * S, voidH = 1.8 * S;

    const gateCx = p.x;
    const gateCz = p.z + perimR;
    const faceZ = gateCz - 0.22 * S;

    // ── INTACT TOWER (west, side = -1) ──────────────────────────────
    const towerW = 1.0 * S, towerH = 3.2 * S, towerD = 1.4 * S;
    {
      const side = -1;
      const tx = gateCx + side * (voidW/2 + towerW/2 + 0.08 * S);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerD), M.fortStoneM);
      tower.position.set(tx, ty + towerH/2, faceZ - 0.1 * S);
      sc.add(tower);
      sol.push({cx:tx, cz:faceZ - 0.1 * S, rx:towerW/2, rz:towerD/2});
      const cap = new THREE.Mesh(new THREE.BoxGeometry(towerW + 0.18 * S, 0.2 * S, towerD + 0.18 * S), M.fortStoneDkM);
      cap.position.set(tx, ty + towerH + 0.1 * S, faceZ - 0.1 * S);
      sc.add(cap);
      [-1, 0, 1].forEach(cdx=>{
        const cren = new THREE.Mesh(new THREE.BoxGeometry(0.28 * S, 0.32 * S, towerD + 0.18 * S), M.fortStoneM);
        cren.position.set(tx + cdx * 0.32 * S, ty + towerH + 0.36 * S, faceZ - 0.1 * S);
        sc.add(cren);
      });
      const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.08 * S, 0.5 * S), M.voidM);
      slit.position.set(tx, ty + towerH * 0.65, faceZ - 0.1 * S + towerD/2 + 0.005);
      sc.add(slit);
    }

    // ── COLLAPSED TOWER (east, side = +1) — stub + rubble heap ──────
    {
      const side = 1;
      const tx = gateCx + side * (voidW/2 + towerW/2 + 0.08 * S);
      const stubH = 1.0 * S;
      const stub = new THREE.Mesh(new THREE.BoxGeometry(towerW, stubH, towerD), M.fortStoneM);
      stub.position.set(tx, ty + stubH/2, faceZ - 0.1 * S);
      stub.rotation.z = 0.08;
      sc.add(stub);
      sol.push({cx:tx, cz:faceZ - 0.1 * S, rx:towerW/2, rz:towerD/2});
      // Rubble heap east of stub
      [0.6, 1.1, 0.4].forEach((dx, i)=>{
        const rh = 0.7 * S - i * 0.15 * S;
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.6 * S + i*0.1 * S, rh, 0.6 * S + i*0.1 * S), i % 2 === 0 ? M.fortStoneDkM : M.fortStoneM);
        r.position.set(tx + dx * 1.0 * S, ty + rh/2, faceZ - 0.1 * S + (i - 1) * 0.3 * S);
        r.rotation.set(Math.random()*0.5, Math.random()*Math.PI, Math.random()*0.4);
        sc.add(r);
        sol.push({cx:tx + dx * 1.0 * S, cz:faceZ - 0.1 * S + (i - 1)*0.3 * S, rx:0.4 * S, rz:0.4 * S});
      });
      // Fallen capstone at an angle
      const fallenCap = new THREE.Mesh(new THREE.BoxGeometry(1.2 * S, 0.22 * S, 1.2 * S), M.fortStoneDkM);
      fallenCap.position.set(tx + 1.4 * S, ty + 0.85 * S, faceZ - 0.1 * S + 0.5 * S);
      fallenCap.rotation.set(0.3, 0.4, -0.4);
      sc.add(fallenCap);
    }

    // ── Sagging lintel — tilted toward collapsed side ───────────────
    const lintelW = voidW + 0.16 * S, lintelH = 0.4 * S;
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(lintelW, lintelH, 1.2 * S), M.fortStoneDkM);
    lintel.position.set(gateCx - 0.05 * S, ty + voidH + lintelH/2, faceZ - 0.1 * S);
    lintel.rotation.z = -0.15;  // sags toward +X (east, collapsed side)
    sc.add(lintel);
    // West crenellations only (intact side)
    [-1, 0].forEach(cdx=>{
      const cren = new THREE.Mesh(new THREE.BoxGeometry(0.22 * S, 0.3 * S, 1.2 * S), M.fortStoneM);
      cren.position.set(gateCx + cdx * 0.28 * S, ty + voidH + lintelH + 0.13 * S, faceZ - 0.1 * S);
      sc.add(cren);
    });

    // ── Curtain wall stub (intact, west side only) ──────────────────
    {
      const wx = gateCx - (voidW/2 + towerW + 0.6 * S + 0.5 * S);
      const wh = 2.2 * S;
      const wallStub = new THREE.Mesh(new THREE.BoxGeometry(1.0 * S, wh, 1.0 * S), M.fortStoneM);
      wallStub.position.set(wx, ty + wh/2, faceZ - 0.1 * S);
      sc.add(wallStub);
      sol.push({cx:wx, cz:faceZ - 0.1 * S, rx:0.5 * S, rz:0.5 * S});
      const crumble = new THREE.Mesh(new THREE.BoxGeometry(0.6 * S, 0.4 * S, 0.6 * S), M.fortStoneDkM);
      crumble.position.set(wx - 0.35 * S, ty + wh + 0.2 * S, faceZ - 0.1 * S);
      crumble.rotation.set(0.1, -0.2, 0.05);
      sc.add(crumble);
    }

    // ── East curtain stub — REPLACED with rubble heap (collapsed) ───
    {
      const wx = gateCx + (voidW/2 + towerW + 0.6 * S + 0.5 * S);
      [[0, 0.6, 0], [0.4, 0.9, 0.2], [-0.3, 0.45, -0.3], [0.6, 0.3, -0.1]].forEach(([dx, h, dz])=>{
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.7 * S, h * S, 0.7 * S), M.fortStoneM);
        r.position.set(wx + dx * S, ty + h*S/2, faceZ - 0.1 * S + dz * S);
        r.rotation.set(Math.random()*0.4, Math.random()*Math.PI, Math.random()*0.3);
        sc.add(r);
        sol.push({cx:wx + dx * S, cz:faceZ - 0.1 * S + dz * S, rx:0.4 * S, rz:0.4 * S});
      });
    }

    // ── Perimeter wall (same pattern as gatehouse, with east-side ruin)
    // East face partially collapsed: build it but with shorter segments
    // and gaps reading as breach points. West face is fully intact.
    // v61g5b: stubHalfW 2.5→5.0 (doorhouse upgrade), backZ p.z→p.z-1.45.
    const wallH = 2.4 * S;
    const wallD = 0.8;
    const stubHalfW = 5.0;
    const backZ = p.z - 1.45;
    const CX = p.x;
    const CZ = p.z + perimR;
    const halfX = perimR;

    const wallSeg = (cx, cz, len, axis, ruinous)=>{
      const w = axis === 'x' ? len : wallD;
      const d = axis === 'x' ? wallD : len;
      const matFortStone = ruinous ? M.fortStoneDkM : M.fortStoneM;
      const matCap = ruinous ? M.fortStoneM : M.fortStoneDkM;
      // Ruinous segments shorter in height
      const segH = ruinous ? wallH * 0.55 : wallH;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(w, segH, d), matFortStone);
      seg.position.set(cx, ty + segH/2, cz);
      if(ruinous) seg.rotation.z = 0.06;
      sc.add(seg);
      if(!ruinous){
        const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.18, d + 0.05), matCap);
        cap.position.set(cx, ty + segH + 0.09, cz);
        sc.add(cap);
      }
      sol.push({cx, cz, rx:w/2, rz:d/2});
    };

    // South face split by gate
    const gateHalfW = voidW/2 + towerW + 0.4 * S;
    {
      const x1 = CX - halfX, x2 = CX - gateHalfW;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, CZ, segLen, 'x', false);
    }
    {
      const x1 = CX + gateHalfW, x2 = CX + halfX;
      const segLen = x2 - x1;
      // East side of gate is the collapsed side — make this segment ruinous
      if(segLen > 0.5) wallSeg((x1 + x2)/2, CZ, segLen, 'x', true);
    }

    // East face — partially collapsed: build as two halves with a gap.
    // v61g5b: spans CZ→backZ (was CZ→p.z).
    {
      const z1 = CZ, z2 = backZ + (CZ - backZ) * 0.45;
      const segLen = z1 - z2;
      wallSeg(CX + halfX, (z1 + z2)/2, segLen, 'z', true);
    }
    {
      const z1 = backZ + (CZ - backZ) * 0.30, z2 = backZ;
      const segLen = z1 - z2;
      wallSeg(CX + halfX, (z1 + z2)/2, segLen, 'z', false);
    }
    // Rubble pile in the east-face gap
    [0, 0.5, -0.3].forEach((dx, i)=>{
      const rh = 0.55 * S - i * 0.1 * S;
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.7 * S, rh, 0.7 * S), i % 2 === 0 ? M.fortStoneM : M.fortStoneDkM);
      r.position.set(CX + halfX + dx * S, ty + rh/2, backZ + (CZ - backZ) * 0.375 + (i - 1) * 0.4 * S);
      r.rotation.set(Math.random()*0.4, Math.random()*Math.PI, Math.random()*0.3);
      sc.add(r);
    });

    // West face — fully intact (v61g5b: backZ)
    wallSeg(CX - halfX, (CZ + backZ)/2, CZ - backZ, 'z', false);

    // Back face split by doorhouse (v61g5b: backZ + stubHalfW=5.0)
    {
      const x1 = CX - halfX, x2 = CX - stubHalfW;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, backZ, segLen, 'x', false);
    }
    {
      const x1 = CX + stubHalfW, x2 = CX + halfX;
      const segLen = x2 - x1;
      if(segLen > 0.5) wallSeg((x1 + x2)/2, backZ, segLen, 'x', false);
    }

    // ── Gate torches (v61g5b) — only west torch lit; east tower
    // collapsed so no torch there (single torch reads "this fort still
    // has someone tending the gate, but only one side").
    const woodMat_rg = new THREE.MeshLambertMaterial({color:0x5a3010});
    const flameMat_rg = new THREE.MeshBasicMaterial({color:0xffcc66});
    {
      const tx = gateCx - (gateHalfW + 0.6);
      const ty_torch = ty + towerH * 0.9 - 0.6;
      const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 5), woodMat_rg);
      bracket.rotation.z = Math.PI/2;
      bracket.position.set(gateCx - (gateHalfW + 0.35), ty_torch + 0.05, gateCz + 0.05);
      sc.add(bracket);
      const tstick = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 5), woodMat_rg);
      tstick.position.set(tx, ty_torch + 0.30, gateCz + 0.05);
      sc.add(tstick);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.20, 6, 6), flameMat_rg);
      flame.position.set(tx, ty_torch + 0.78, gateCz + 0.05);
      sc.add(flame);
      const tl = new THREE.PointLight(p.col || 0xffcc66, 2.4, 16);
      tl.position.set(tx, ty_torch + 0.78, gateCz + 0.05);
      sc.add(tl);
    }
  },

  // ── watchtower_canopy ─────────────────────────────────────────────
  // v61g5: 2× scale + sparse wood palisade fragments along perimeter.
  // Variant of watchtower for deep-canopy placements where dense forest
  // reads as the natural perimeter. Same three-tier tower silhouette at
  // 2× scale, plus SCATTERED pointed-log palisade fragments at the
  // perimeter positions (~ every 60° around the ring, not every 15°
  // like the full palisade fort). The canopy is still narratively the
  // perimeter; the fragments are just enough to read "someone tried to
  // mark this place out, and then stopped." A single broken-log gate
  // marker at the south arc gives the player a visible "this is the
  // way in" cue.
  //
  // Same coordinate convention as watchtower: door at (p.x, p.z), tower
  // just north of door.
  watchtower_canopy: function(sc, sol, p, ty, M){
    const S = 2.0;
    const perimR = 24;
    const baseR = 2.6 * S;
    const baseH = 4.0 * S;
    const TX = p.x;
    const TZ = p.z - baseR - 1.0 * S;
    const HY = ty;

    const mossMat = new THREE.MeshLambertMaterial({color:0x4a5838});
    const logMat = new THREE.MeshLambertMaterial({color:0x5c3a20});
    const logDkMat = new THREE.MeshLambertMaterial({color:0x3a2410});

    // ── Tier 1 (base) ──────────────────────────────────────────────
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(baseR, baseR, baseH, 18), M.fortStoneM);
    tier1.position.set(TX, HY + baseH/2, TZ);
    sc.add(tier1);
    sol.push({cx:TX, cz:TZ - 0.3 * S, rx:baseR, rz:baseR - 0.4 * S});

    // ── Tier 2 — partially collapsed ───────────────────────────────
    const t2R = 2.1 * S, t2H = 2.6 * S;
    const t2Y = HY + baseH;
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(t2R, t2R, t2H, 16), M.fortStoneM);
    tier2.position.set(TX, t2Y + t2H/2, TZ);
    sc.add(tier2);
    // v61g5c: rubble fall to ground level (same as watchtower)
    [[-baseR - 0.4 * S, 0.30 * S, 0.2 * S],
     [-baseR - 0.9 * S, 0.25 * S, -0.4 * S],
     [-baseR - 0.7 * S, 0.20 * S, 0.7 * S]].forEach(([dx, yy, dz])=>{
      const fall = new THREE.Mesh(new THREE.BoxGeometry(0.7 * S, 0.55 * S, 0.7 * S), M.fortStoneDkM);
      fall.position.set(TX + dx, ty + yy, TZ + dz);
      fall.rotation.set(Math.random()*0.4, Math.random()*Math.PI, Math.random()*0.3);
      sc.add(fall);
    });
    const t2Rim = new THREE.Mesh(new THREE.TorusGeometry(t2R - 0.05 * S, 0.2 * S, 6, 16), M.fortStoneDkM);
    t2Rim.rotation.x = Math.PI/2;
    t2Rim.position.set(TX - 0.15 * S, t2Y + t2H - 0.1 * S, TZ);
    sc.add(t2Rim);

    // ── Tier 3 — crown remnant ─────────────────────────────────────
    // v61g5c: closed full cylinder + scattered broken stones (same fix
    // as watchtower base builder — partial-cylinder approach in v61g5
    // rendered as a clipping glitch from the broken-open side).
    const t3R = 1.6 * S, t3H = 1.7 * S;
    const t3Y = t2Y + t2H;
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(t3R, t3R, t3H, 12), M.fortStoneM);
    tier3.position.set(TX, t3Y + t3H/2, TZ);
    sc.add(tier3);
    const brokenStones = [
      [-0.55, 0.85, -0.40, 0.4, 0.7, 0.5, 0.25],
      [-0.65, 1.05, 0.10, 0.45, 0.55, 0.45, -0.15],
      [-0.50, 0.90, 0.45, 0.4, 0.6, 0.4, 0.3],
      [-0.25, 1.20, -0.55, 0.35, 0.4, 0.35, 0.1],
    ];
    brokenStones.forEach(([dxm, yym, dzm, w, h, d, rz])=>{
      const stone = new THREE.Mesh(new THREE.BoxGeometry(w * S, h * S, d * S), M.fortStoneDkM);
      stone.position.set(TX + dxm * t3R, t3Y + yym * t3H, TZ + dzm * t3R);
      stone.rotation.set(Math.random()*0.2, Math.random()*Math.PI, rz);
      sc.add(stone);
    });
    const t3Moss = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * S, 0.22 * S, 0.05 * S, 8), mossMat);
    t3Moss.position.set(TX + 0.5 * S, t3Y + t3H + 0.04 * S, TZ - 0.3 * S);
    sc.add(t3Moss);

    // ── Sparse perimeter palisade fragments — just enough to read ──
    // v61g5c: heights now uniform (2.4*S), lean reduced to ±0.04 max
    // for a deliberate "intentional marking" rather than random scatter.
    // Cap alignment fixed — previous version used `+sin(lean)*lh/2`
    // which both had the wrong sign AND ignored the Y-offset from
    // rotating a tall cylinder, so caps drifted away from log tops.
    // Six positions around the rectangle perimeter — corners + mid-edges.
    const CX = p.x;
    const CCZ = p.z + perimR/2;
    const fragH = 2.4 * S;
    const fragSpots = [
      // [lx, lz, lean]
      [CX - perimR,         p.z + 1,      0.03],   // SW corner
      [CX - perimR * 0.6,   p.z + 0.5,   -0.02],   // NW (near door)
      [CX + perimR * 0.6,   p.z + 0.5,    0.02],   // NE
      [CX + perimR,         p.z + 1,     -0.03],   // SE corner
      [CX - perimR,         CCZ + 4 * S,  0.04],   // West mid
      [CX + perimR,         CCZ - 4 * S, -0.04],   // East mid
    ];
    fragSpots.forEach(([lx, lz, lean])=>{
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * S, 0.20 * S, fragH, 6), logMat);
      log.position.set(lx, ty + fragH/2, lz);
      log.rotation.z = lean;
      sc.add(log);
      // Cap sits at the rotated top of the cylinder. Cylinder default-up
      // axis is +Y, so top center pre-rotation is (0, fragH/2, 0); after
      // rotating around Z by `lean`, top moves to (-sin(lean)*fragH/2,
      // cos(lean)*fragH/2, 0). Add cap height (0.35*S/2) along the same
      // rotated up-axis so the cap sits seated on the log top.
      const ux = -Math.sin(lean), uy = Math.cos(lean);
      const topX = lx + ux * fragH/2;
      const topY = ty + fragH/2 + uy * fragH/2;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.20 * S, 0.35 * S, 6), logDkMat);
      cap.position.set(topX + ux * 0.175 * S, topY + uy * 0.175 * S, lz);
      cap.rotation.z = lean;
      sc.add(cap);
      sol.push({cx:lx, cz:lz, rx:0.25 * S, rz:0.25 * S});
    });

    // ── Gate marker — single fallen log at south arc ────────────────
    // A horizontally-lying log on the ground at the south "gate" position,
    // reading as a long-fallen lintel that once marked the entrance. No
    // standing gateposts — the canopy is the perimeter, but this fallen
    // log says "this is the way in."
    const gateLogLen = 3.0 * S;
    const gateMarker = new THREE.Mesh(new THREE.CylinderGeometry(0.20 * S, 0.22 * S, gateLogLen, 6), logMat);
    gateMarker.rotation.z = Math.PI/2;
    gateMarker.rotation.y = 0.08;
    gateMarker.position.set(CX, ty + 0.22 * S, p.z + perimR);
    sc.add(gateMarker);
    sol.push({cx:CX, cz:p.z + perimR, rx:gateLogLen/2, rz:0.25 * S});
  },
};

// v61f9: shared door+void+frame+torch builder for fort_door portals.
// Called AFTER the FORT_EXTERIORS shell builder so the door reads as
// part of whatever structure the exterior built. All exterior types
// use this same door at (p.x, p.z) so the interact zone is consistent.
//
// v61f9 (post-playtest): door frame added (two narrow stone pillars
// flanking the door + a header above) so the door reads as an actual
// doorway carved into the structure, not a flat plane hovering on the
// wall. Torch repositioned with a wall bracket so it visibly attaches
// to the structure instead of floating in space.
//
// v61f11 (post-playtest): door pulled forward and a flat doorway-stub
// added in front of the door. v61f10 had the door at faceZ = p.z - 0.22
// — only 0.22u forward of the portal coord — but the watchtower's
// cylinder body has its south-face surface AT p.z (since TZ = p.z -
// baseR puts the cylinder spanning z in [TZ-baseR, TZ+baseR] = [p.z-
// 5.2, p.z]). The curved polygon-cylinder surface bulged forward past
// p.z in places, occluding the door visual and the sol-blocker pushed
// the player away before they could reach the door interact radius.
// Now: door at faceZ = p.z - 0.7, with a flat 1.5u-wide stub box sitting
// between cylinder and door to host the doorway architecture cleanly.
function _spawnFortDoor(sc, sol, p, ty, M){
  // v61g5: door faceZ pulled back to -1.4u (was -0.7) for the 2× scale.
  // This gives the player room to stand at +Z and see the full door
  // visual without being inside it, and gives the back-wall stub room
  // to sit behind without poking through.
  const faceZ = p.z - 1.4;
  // v61g5: door visual scaled 2× — 1.3×1.8 → 2.6×3.6 — to match the
  // 2× scaled fort exteriors. A 3.6u-tall door reads as imposing
  // against a doubled-up keep, gatehouse, or remnant wall.
  const voidW = 2.6, voidH = 3.6;

  // v61g5b: stub upgraded from thin panel (5.0×1.2) to proper built
  // DOORHOUSE (10.0×3.0×6.0u). Twice as wide, two-and-a-half times as
  // deep, taller crown above the door. Sits with its SOUTH face just
  // behind the door plane (z = p.z - 1.45) so the perimeter back wall
  // can be set at z = p.z - 1.45 too — back-wall segments now meet the
  // doorhouse east and west faces flush instead of floating in front
  // of a small detached stub. Each FORT_EXTERIORS builder uses
  // stubHalfW=5.0 (was 2.5) and backZ=p.z-1.45 (was p.z) for back-wall
  // construction.
  const stubW = 10.0;
  const stubH = voidH + 2.4;   // 6.0u tall — crown above door
  const stubD = 3.0;
  // Center the stub so its SOUTH face sits at z = p.z - 1.45 (just behind
  // the door plane at faceZ = p.z - 1.4). Stub center z = (p.z - 1.45) - stubD/2.
  const stubCz = (p.z - 1.45) - stubD/2;
  const stub = new THREE.Mesh(new THREE.BoxGeometry(stubW, stubH, stubD), M.fortStoneM);
  stub.position.set(p.x, ty + stubH/2, stubCz);
  sc.add(stub);
  const stubCap = new THREE.Mesh(new THREE.BoxGeometry(stubW + 0.2, 0.32, stubD + 0.2), M.fortStoneDkM);
  stubCap.position.set(p.x, ty + stubH + 0.16, stubCz);
  sc.add(stubCap);
  // Two crenellation stubs on top corners — reads as a small built keep.
  [-1, 1].forEach(side=>{
    const cren = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, stubD + 0.2), M.fortStoneM);
    cren.position.set(p.x + side * (stubW/2 - 0.4), ty + stubH + 0.32 + 0.275, stubCz);
    sc.add(cren);
  });
  // Sol-block the doorhouse footprint — full extent so player can't
  // walk through it from sides or behind. Door portal's own sol entry
  // (added later in this function) covers the front interact corridor.
  sol.push({cx:p.x - stubW/2 + 0.3, cz:stubCz, rx:0.3, rz:stubD/2});  // west edge
  sol.push({cx:p.x + stubW/2 - 0.3, cz:stubCz, rx:0.3, rz:stubD/2});  // east edge
  sol.push({cx:p.x, cz:stubCz - stubD/2 + 0.3, rx:stubW/2 - 0.6, rz:0.3});  // north edge
  // Two flank segments at the south face on either side of the door void
  sol.push({cx:p.x - voidW/2 - (stubW/2 - voidW/2)/2, cz:stubCz + stubD/2 - 0.3, rx:(stubW/2 - voidW/2)/2 - 0.05, rz:0.3});
  sol.push({cx:p.x + voidW/2 + (stubW/2 - voidW/2)/2, cz:stubCz + stubD/2 - 0.3, rx:(stubW/2 - voidW/2)/2 - 0.05, rz:0.3});

  // v61g5: detail dimensions scaled 2× — frame pillars, header, keystone,
  // leaf gaps, iron bands/studs/handle, torch elements. The S factor is
  // local to the door — exteriors carry their own scale constants.
  const S = 2.0;

  // Stone door frame: two narrow pillars flanking the door + header
  // above. Now sits on the FACE of the stub, clearly in front of the
  // structure behind.
  const frameW = 0.18 * S;
  const frameD = 0.15 * S;
  [-1, 1].forEach(side=>{
    const fx = p.x + side * (voidW/2 + frameW/2);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(frameW, voidH + 0.30, frameD), M.fortStoneDkM);
    frame.position.set(fx, ty + (voidH + 0.30)/2, faceZ + 0.04 * S);
    sc.add(frame);
  });
  const headerW = voidW + 2 * frameW + 0.08;
  const header = new THREE.Mesh(new THREE.BoxGeometry(headerW, 0.44, frameD + 0.04), M.fortStoneDkM);
  header.position.set(p.x, ty + voidH + 0.22, faceZ + 0.04 * S);
  sc.add(header);
  const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.20, frameD + 0.08), M.fortStoneM);
  keystone.position.set(p.x, ty + voidH + 0.44 + 0.10, faceZ + 0.04 * S);
  sc.add(keystone);

  // Door void (the dark portal entrance) — sits behind the wooden door
  // leaves. Player sees the closed door; the void represents the dark
  // interior glimpsed at the door's edges.
  const cave = new THREE.Mesh(new THREE.PlaneGeometry(voidW, voidH), M.voidM);
  cave.position.set(p.x, ty + voidH/2, faceZ);
  sc.add(cave);

  // Heavy wooden double-leaf door. v61f14b: z-flipped — leaves are now
  // IN FRONT of the void plane (higher z, closer to player). Player
  // approaches from +Z, so "in front" of the void = higher z.
  // Previously leaves at faceZ - 0.05 were BEHIND the void at faceZ
  // and occluded by it. Iron bands/studs/handles also flipped.
  // v61g5: leaf body & ironwork scaled 2× to match door size.
  const doorMat = new THREE.MeshLambertMaterial({color:0x6a4a28});
  const ironMat = new THREE.MeshLambertMaterial({color:0x252220});
  [-1, 1].forEach(side=>{
    const leafW = (voidW - 0.12) / 2;
    const leafH = voidH - 0.08;
    const leafCx = p.x + side * (leafW/2 + 0.02);
    const leafCy = ty + voidH/2;
    // Door leaf body — 0.04u in front of void plane
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, 0.16), doorMat);
    leaf.position.set(leafCx, leafCy, faceZ + 0.04);
    sc.add(leaf);
    // Two horizontal iron bands — in front of leaf
    [0.30, -0.30].forEach(yFrac=>{
      const band = new THREE.Mesh(new THREE.BoxGeometry(leafW - 0.08, 0.16, 0.20), ironMat);
      band.position.set(leafCx, leafCy + yFrac * leafH, faceZ + 0.16);
      sc.add(band);
    });
    // Iron studs — in front of leaf
    [0.45, -0.45].forEach(yFrac=>{
      const stud = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 0.08), ironMat);
      stud.position.set(leafCx - side * (leafW/2 - 0.16), leafCy + yFrac * leafH, faceZ + 0.18);
      sc.add(stud);
    });
    // Door handle ring on inner edge — in front of leaf
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 4, 8), ironMat);
    handle.rotation.y = Math.PI/2;
    handle.position.set(leafCx + side * (leafW/2 - 0.24), leafCy, faceZ + 0.20);
    sc.add(handle);
  });

  // Torch with attached wall bracket. v61f11: brighter (intensity 1.6,
  // range 8) and positioned closer to the door so light lands on the
  // door visual instead of being swallowed by the structure behind.
  // v61g5: torch position scales with voidW/frameW automatically; light
  // intensity & range bumped slightly for the larger door area.
  const torchX = p.x + voidW/2 + frameW + 0.84;
  const torchY = ty + voidH + 0.10;
  const wallX = p.x + voidW/2 + frameW + 0.04;
  const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.84, 5), new THREE.MeshLambertMaterial({color:0x5a3010}));
  bracket.rotation.z = Math.PI/2;
  bracket.position.set((wallX + torchX)/2, torchY + 0.04, faceZ + 0.08);
  sc.add(bracket);
  const tstick = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.56, 5), new THREE.MeshLambertMaterial({color:0x5a3010}));
  tstick.position.set(torchX, torchY + 0.20, faceZ + 0.08);
  sc.add(tstick);
  // v61g5: PointLight intensity 1.6→2.0 and range 8→12 for the bigger door area.
  const tl = new THREE.PointLight(p.col, 2.0, 12);
  tl.position.set(torchX, torchY + 0.60, faceZ + 0.08);
  sc.add(tl);
  const tf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 5, 5), new THREE.MeshBasicMaterial({color:0xffcc66}));
  tf.position.copy(tl.position);
  sc.add(tf);

  // sol-block the door — solid up to the door face, leaving 0.5u south
  // of the threshold as the interact approach corridor. v61f11: tightened
  // so the player can actually reach the door (previous radius 1.5 with
  // cz = p.z+0.4 pushed the player too far away — they could see the
  // door but not stand within interact range).
  // v61g5: radius scaled with voidW (1.2 → 1.2 keeps interact-corridor
  // narrow regardless of door width — the player still walks straight
  // at the door coord to interact).
  sol.push({cx:p.x, cz:faceZ + 0.05, rx:1.2, rz:0.05});
}

// v61g5b: shared gate-torch helper. Places a wall-mounted torch on each
// side of a gate showpiece — bracket + stick + flame + PointLight. The
// torch register matches _spawnFortDoor's door torch but slightly bigger
// and brighter (gates are read from farther away). Caller passes the
// gate centerline (gx, gz), the gate opening half-width, the gate post
// height (so torches sit just below the cap), and the portal color for
// the light tint.
//
// Used by every FORT_EXTERIORS builder at its south gate showpiece.
function _spawnGateTorches(sc, gx, gz, ty, gateOpeningHalfW, gatePostTopY, col){
  const woodMat = new THREE.MeshLambertMaterial({color:0x5a3010});
  const flameMat = new THREE.MeshBasicMaterial({color:0xffcc66});
  [-1, 1].forEach(side=>{
    const tx = gx + side * (gateOpeningHalfW + 0.6);  // 0.6u outside gate gap
    const ty_torch = gatePostTopY - 0.6;              // 0.6u below post top
    // Bracket (horizontal arm jutting outward from post)
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 5), woodMat);
    bracket.rotation.z = Math.PI/2;
    bracket.position.set(gx + side * (gateOpeningHalfW + 0.35), ty_torch + 0.05, gz + 0.05);
    sc.add(bracket);
    // Torch stick
    const tstick = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 5), woodMat);
    tstick.position.set(tx, ty_torch + 0.30, gz + 0.05);
    sc.add(tstick);
    // Flame
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.20, 6, 6), flameMat);
    flame.position.set(tx, ty_torch + 0.78, gz + 0.05);
    sc.add(flame);
    // Light — brighter + bigger range than door torch (read from far)
    const tl = new THREE.PointLight(col || 0xffcc66, 2.4, 16);
    tl.position.set(tx, ty_torch + 0.78, gz + 0.05);
    sc.add(tl);
  });
}

// Shared portal mesh builder — works for any scene/sol pair
// getY: optional function(x,z)=>number for terrain height offset (overworld only)
function spawnPortalMeshes(sc,portals,sol,getY){
  const _y=getY||((x,z)=>0);
  const rockM=new THREE.MeshLambertMaterial({color:0x4a4038});
  const darkRockM=new THREE.MeshLambertMaterial({color:0x1e1810});
  const voidM=new THREE.MeshBasicMaterial({color:0x080604,side:THREE.DoubleSide});
  // v61f8: fort_door materials — built stonework register, distinct from
  // cave_door's natural-rock palette. Same warm-grey family as Greywatch
  // walls / Droichead bridge for masonry continuity across the world.
  const fortStoneM = new THREE.MeshLambertMaterial({color:0x787068});
  const fortStoneDkM = new THREE.MeshLambertMaterial({color:0x5a544c});
  // v61f9: materials bundle passed to FORT_EXTERIORS builders so they
  // can render with consistent palette without each defining its own.
  const fortMaterials = {fortStoneM, fortStoneDkM, voidM};
  portals.forEach(p=>{
    const ty=_y(p.x,p.z); // terrain base Y for this portal

    // v61f8 / v61f9: kind dispatch. Default 'cave_door' (existing
    // carved-stone-and-rocks mesh, the canonical "old gate" appearance
    // for anchor dungeons). 'fort_door' routes to FORT_EXTERIORS for
    // the surrounding shell (gatehouse / watchtower / etc.) followed
    // by _spawnFortDoor for the consistent door visual and interact.
    const kind = p.kind || 'cave_door';

    if(kind === 'fort_door'){
      const exteriorType = p.exterior || 'gatehouse';
      const builder = FORT_EXTERIORS[exteriorType];
      if(builder){
        builder(sc, sol, p, ty, fortMaterials);
      } else {
        console.warn(`spawnPortalMeshes: unknown fort exterior '${exteriorType}', falling back to gatehouse`);
        FORT_EXTERIORS.gatehouse(sc, sol, p, ty, fortMaterials);
      }
      _spawnFortDoor(sc, sol, p, ty, fortMaterials);
      return; // skip the cave_door branch below
    }

    // ── cave_door: an old gate (S578, Michael's A on DECISION #169) ──
    buildOldGateFront(sc,p,ty,sol,getY);
  });
}

// S578 — an old gate (Michael's A on DECISION #169, the Session 571 prototype): a dressed-stone doorway cut into a turf mound.
// The mound's front is cut flat behind a stone headwall whose top follows the mound's curve, so no turf stands in the doorway
// (Michael: "the grassy hillock … is bursting through the doorway"); a heavy two-leaf door fills it, set back in the reveal.
// Two jambs and a lintel with a capstone frame it, the binding marks glow down the jambs and in a ring on the lintel in the
// theme's colour, stepped wing walls hold the mound, and a ring of marker stones stands nine out, one mark each facing the door.
// The seed varies the mound's size, which markers have fallen, the moss and the wear. Faces -z, as the old mouth did.
function buildOldGateFront(sc,p,ty,sol,getY){
  const gy=getY||((x,z)=>ty);const h0=(p.seed*2654435761)>>>0;let rs=(h0^0x9e3779b9)>>>0;const r=()=>{rs=(rs*1664525+1013904223)>>>0;return rs/4294967296;};
  const col=(typeof THEME_GLOW!=='undefined'&&THEME_GLOW[p.theme])||p.col||0xffd060;
  const G=new THREE.Group();G.position.set(p.x,ty,p.z);G.name='oldGate';
  const C=(c)=>new THREE.MeshLambertMaterial({color:c});
  const stone=C(0x8a8478),dark=C(0x5e5a52),pale=C(0x9a9488),moss=C(0x4f6a34),turf=C(0x4e6a34),oak=C(0x3a2a18),oakDk=C(0x2c2014),iron=C(0x2a2826);
  const glow=new THREE.MeshBasicMaterial({color:col});
  const B=(w,h,d,m,x,y,z,rx,ry,rz,par)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.set(rx||0,ry||0,rz||0);(par||G).add(o);return o;};
  // the mound: a half-dome behind, its front cut flat at z=.22 (inside the headwall) for three either side of the door, easing back to its own curve past the wing walls
  const MW=6.0+r()*.9,MH=4.0+r()*.7,MD=6.4+r()*.6,MC=4.5,ZF=.22,HX=3.0;
  const mg=new THREE.SphereGeometry(1,44,12,0,Math.PI*2,0,Math.PI/2);const mp=mg.attributes.position;
  for(let i=0;i<mp.count;i++){const x=mp.getX(i)*MW,z=mp.getZ(i)*MD+MC,t=Math.min(1,Math.max(0,(Math.abs(x)-HX)/1.2));mp.setXYZ(i,x,mp.getY(i)*MH,z<ZF?ZF+(z-ZF)*t*t*(3-2*t):z);}
  mg.computeVertexNormals();const mound=new THREE.Mesh(mg,turf);mound.position.y=-.25;G.add(mound);
  // the headwall: the mound's cut face in stone, its top the mound's curve at the cut, the doorway through it
  const cutK=1-((ZF-MC)/MD)**2,HW=Math.min(HX,MW*Math.sqrt(cutK)),topAt=x=>MH*Math.sqrt(Math.max(0,cutK-(x/MW)**2))-.25;
  const sh=new THREE.Shape();sh.moveTo(-HW,-.25);for(let k=0;k<=24;k++){const x=-HW+2*HW*k/24;sh.lineTo(x,topAt(x)-.08);}sh.lineTo(HW,-.25);sh.lineTo(-HW,-.25);
  const hole=new THREE.Path();hole.moveTo(-.75,-.2);hole.lineTo(.75,-.2);hole.lineTo(.75,2.7);hole.lineTo(-.75,2.7);hole.lineTo(-.75,-.2);sh.holes.push(hole);
  const hg=new THREE.ExtrudeGeometry(sh,{depth:.5,bevelEnabled:false});const head=new THREE.Mesh(hg,stone);head.position.z=-.25;G.add(head);
  // its courses: a thin dark line every .45, as wide as the wall at that height, broken at the doorway
  for(let y=.45;y<MH-.4;y+=.45){const w=Math.min(HW,MW*Math.sqrt(Math.max(0,cutK-((y+.33)/MH)**2)))-.1;if(w<.4)break;
    if(y<2.7){for(const s of[-1,1]){const a=.78,len=w-a;if(len>.1)B(len,.03,.02,dark,s*(a+len/2),y,-.26);}}else B(2*w,.03,.02,dark,0,y,-.26);}
  // the frame: jambs, a lintel, a capstone stepped over it
  for(const s of[-1,1]){B(.62,2.72,.8,stone,s*1.06,1.34,-.65);B(.7,.16,.88,pale,s*1.06,.05,-.65);
    for(let i=0;i<6;i++)B(i%2?.22:.12,.05,.02,glow,s*1.06,.5+i*.34,-1.06);
    B(.05,1.9,.02,glow,s*1.06,1.35,-1.06);
    // wing walls stepping down, splayed a little, in front of the headwall
    for(let k=0;k<3;k++){const x=s*(1.95+k*.95),ht=Math.min(topAt(Math.abs(x))-.2,2.5-k*.6);B(.95,ht,.6,k%2?dark:stone,x,ht/2-.05,-.55-k*.12,0,s*-.22,0);
      if(r()<.45)B(.9,.05,.5,moss,x,ht-.03,-.55-k*.12,0,s*-.22,0);}
    sol.push({cx:p.x+s*1.06,cz:p.z-.65,rx:.31,rz:.4},{cx:p.x+s*3.0,cz:p.z-.7,rx:1.55,rz:.45});}
  B(3.0,.55,.95,stone,0,2.97,-.68);B(2.3,.32,.8,dark,0,3.4,-.6);if(r()<.6)B(1.6+r()*.5,.05,.6,moss,(r()-.5)*.4,3.58,-.6);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.2,.035,6,20),glow);ring.position.set(0,2.97,-1.16);G.add(ring);
  B(.05,.3,.02,glow,0,2.97,-1.16);B(.3,.05,.02,glow,0,2.97,-1.16);
  // the door, set back in the reveal: two leaves of planks on iron straps, a ring on each, the seam dark between them
  const DZ=-.02;B(1.52,.04,.14,oakDk,0,2.68,DZ);
  for(const s of[-1,1]){const lf=new THREE.Group();lf.position.set(s*.375,0,DZ);G.add(lf);
    for(let i=0;i<4;i++)B(.18,2.66,.09,i%2?oakDk:oak,s*(-.27+i*.18),1.33,0,0,0,0,lf);
    for(const y of[.45,1.35,2.25])B(.72,.09,.03,iron,0,y,-.06,0,0,0,lf);
    const rg=new THREE.Mesh(new THREE.TorusGeometry(.09,.016,5,12),iron);rg.position.set(-s*.24,1.1,-.08);lf.add(rg);}
  B(.02,2.66,.1,C(0x0a0806),0,1.33,DZ-.02);
  // a threshold slab under the door, worn steps out to the apron, the binding line cut along the sill
  const wear=r();B(1.5,.12,.82,stone,0,.04,-.62);B(1.5,.08,.1,glow,0,.11,-1.06);
  B(2.6,.13,1.0,wear<.5?stone:dark,0,.0,-1.55,0,(r()-.5)*.04,0);B(2.0,.1,.7,dark,(r()-.5)*.3,-.03,-2.35,0,(r()-.5)*.12,0);
  if(wear>.6)B(1.2,.09,.5,stone,(r()-.5)*.8,-.06,-3.0,0,(r()-.5)*.5,0);
  // the marker stones on a ring nine out, each with one mark facing the door; some by the seed have fallen
  for(let k=0;k<7;k++){const a=Math.PI*(.25+k*.25)+(r()-.5)*.12,rad=8.6+r()*.8,mx=Math.sin(a)*rad,mz=-Math.cos(a)*rad*.9+1.5;
    const ly=gy(p.x+mx,p.z+mz)-ty,fallen=r()<.22,hgt=.95+r()*.35;
    const st=fallen?B(.45,hgt,.32,stone,mx,ly+.14,mz,Math.PI/2-.1,a+(r()-.5),0):B(.45,hgt,.32,k%2?stone:pale,mx,ly+hgt/2-.12,mz,0,a,(r()-.5)*.16);
    if(!fallen){const m=new THREE.Mesh(new THREE.BoxGeometry(.04,.4,.02),glow);m.position.set(0,hgt*.12,-.17);st.add(m);sol.push({cx:p.x+mx,cz:p.z+mz,rx:.3,rz:.3});}}
  // the mound itself is solid, from the headwall back: twelve slices across its dome, each as wide as the turf stands .3 high at the slice's middle (S630; one box of .6 its depth left the back third open)
  sol.push({cx:p.x,cz:p.z+1.5,rx:HW,rz:1.75});
  {const zb=MC+MD*Math.sqrt(1-(.55/MH)**2),dz=(zb-ZF)/12;for(let k=0;k<12;k++){const zc=ZF+dz*(k+.5),q=1-((zc-MC)/MD)**2-(.55/MH)**2;if(q>0)sol.push({cx:p.x,cz:p.z+zc,rx:MW*Math.sqrt(q),rz:dz/2});}}
  const L=new THREE.PointLight(col,1.2,9);L.position.set(0,1.6,-1.9);G.add(L);
  // baked to two draws (the stone, wood and turf by vertex colour; the marks), with the world's mergeGeos where it is loaded
  if(typeof mergeGeos==='function'){G.position.set(0,0,0);G.updateMatrixWorld(true);const solidL=[],glowL=[],dead=[];
    G.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry;(o.material===glow?glowL:solidL).push([g,o.matrixWorld.clone(),o.material.color]);dead.push(o);});
    dead.forEach(o=>{o.parent.remove(o);o.geometry.dispose();});G.children.filter(o=>o.isGroup).forEach(o=>G.remove(o));
    const ms=new THREE.Mesh(mergeGeos(solidL),new THREE.MeshLambertMaterial({vertexColors:true}));ms.castShadow=true;ms.receiveShadow=true;G.add(ms);
    G.add(new THREE.Mesh(mergeGeos(glowL),new THREE.MeshBasicMaterial({vertexColors:true})));G.position.set(p.x,ty,p.z);}
  else G.traverse(o=>{if(o.isMesh&&o.material!==glow)o.castShadow=true;});
  sc.add(G);
  if(typeof dressPortalExterior==='function')dressPortalExterior(sc,p,ty,sol,true); // the sigil's glow, for a sigil gate
  return G;
}
