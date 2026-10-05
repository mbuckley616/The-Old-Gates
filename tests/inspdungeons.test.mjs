// The inspector's dungeons and its crag (Session 541, Michael's inspector note on `buildings/places/poi-crag`: "Not even sure what
// this is meant to be honestly", and "No dungeon mesh in the inspector either"). The crag is the boulder the lairs, camps and rock
// piles are laid from, listed with the rocks by what it is; every dungeon theme has a floor, built by the game's own makeDungeon
// and buildDunShell; no group of the list is split in two.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => { openInspector();
  const E = INSPECTOR.entries, keys = E.map(e => e.key), themes = Object.keys(THEME_DEF), out = {};
  for (const t of themes) { const e = E.find(x => x.key === 'buildings/dungeons/' + t + '-floor'); if (!e) { out[t] = null; continue; } INSPECTOR.select(e.id); const R = INSPECTOR.built.get(e.id);
    let tris = 0, meshes = 0; R.obj.traverse(o => { if (o.isMesh) { meshes++; const gg = o.geometry; tris += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; } }); out[t] = { tris: Math.round(tris), meshes }; }
  // the groups in list order: each appears in one run
  const runs = []; for (const e of E) { if (!runs.length || runs[runs.length - 1] !== e.group) runs.push(e.group); }
  const crag = keys.filter(k => /crag/.test(k)); closeInspector();
  return { out, themes, crag, runs, poiCrag: keys.includes('buildings/places/poi-crag') };
});
console.log(JSON.stringify(r));
check('every dungeon theme has a floor in the inspector: walls, floor and beams, a thousand triangles or more', r.themes.every(t => r.out[t] && r.out[t].meshes >= 2 && r.out[t].tris > 1000), r.out);
check('the crag is listed with the rocks by what it is, and no longer as a place', !r.poiCrag && r.crag.length === 1 && /^plants-trees-rocks\/rocks\//.test(r.crag[0]), r.crag);
check('no group of the list is split in two', new Set(r.runs).size === r.runs.length, r.runs);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
