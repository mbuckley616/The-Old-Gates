// Town roads and buildings (Session 193): how much of a town's drawn paths and of the world's roads runs under its
// buildings, and how much of its street grid doubles a road. measureTowns(page, n) builds up to n towns and reports.
export async function measureTowns(page, n = 24) {
  return page.evaluate((n) => { const out = []; const kinds = { town: 1, city: 1, village: 1, port: 1, garrison: 1 };
    const sites = WORLD.SITES.filter(t => kinds[t.kind] && t.pad > 0).slice(0, n);
    for (const t of sites) { let S = WORLD.settlements.get(t.id); if (!S) { try { S = WORLD.genSettlement(t); } catch (e) { out.push({ id: t.id, err: String(e).slice(0, 80) }); continue; } } if (!S) continue;
      const blds = S.sol.filter(b => b.bt); const inB = (x, z, grow) => blds.find(b => { const ex = x - b.cx, ez = z - b.cz; const c = b.c == null ? 1 : b.c, s = b.s || 0; const lx = ex * c - ez * s, lz = ex * s + ez * c; return Math.abs(lx) < b.rx - .3 + (grow || 0) && Math.abs(lz) < b.rz - .3 + (grow || 0); });
      let pathIn = 0, pathN = 0, footIn = 0, footN = 0, onRoad = 0, cross = 0;
      for (const p of (S.paths || [])) { for (let i = 0; i < p.pts.length - 1; i++) { const a = p.pts[i], b = p.pts[i + 1]; const L = Math.hypot(b.x - a.x, b.z - a.z), k = Math.max(1, Math.ceil(L / .5)); const nx = -(b.z - a.z) / (L || 1), nz = (b.x - a.x) / (L || 1);
        for (let j = 0; j <= k; j++) { for (const o of [-.4, 0, .4]) { const x = a.x + (b.x - a.x) * j / k + nx * o * p.w, z = a.z + (b.z - a.z) * j / k + nz * o * p.w; const hit = !!inB(x, z);
          if (p.w < 2) { footN++; if (hit) footIn++; } else { pathN++; if (hit) pathIn++; if (o === 0) { const ri = WORLD.roadInfo(x, z); if (ri && ri.d < 1.4 + p.w / 2) onRoad++; else if (ri && ri.d < 5) cross++; } } } } } }
      // the world's roads under a building's footprint
      let roadIn = 0, roadB = 0; for (const b of blds) { let hit = false; const c = b.c == null ? 1 : b.c, s = b.s || 0; for (let u = -1; u <= 1; u += .25) for (let v = -1; v <= 1; v += .25) { const lx = u * (b.rx - .3), lz = v * (b.rz - .3); const x = b.cx + lx * c + lz * s, z = b.cz - lx * s + lz * c; const ri = WORLD.roadInfo(x, z); if (ri && ri.d < 2.2) hit = true; } roadB++; if (hit) roadIn++; }
      out.push({ id: t.id, kind: t.kind, blds: blds.length, streetInBld: pathN ? +(pathIn / pathN).toFixed(3) : 0, streetOnRoad: pathN ? +(onRoad * 3 / pathN).toFixed(3) : 0, streetBesideRoad: pathN ? +(cross * 3 / pathN).toFixed(3) : 0, footInBld: footN ? +(footIn / footN).toFixed(3) : 0, bldOnRoad: roadIn }); }
    return out; }, n);
}
