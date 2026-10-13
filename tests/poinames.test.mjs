// One name per place reaches the places outside the towns (Session 756). The critic's s585 found three lairs doubled
// (two *Dogiaen's Lair*s 1,400 apart, both in reach of about seventy towns' rumours); 22 shrines, spires, glades, camps,
// ruins and lairs shared a name. The pass of Session 432 now ranks them after every settlement, and a lost one keeps its form.
import { boot, check } from './lib/game.mjs';
const POI = ['shrine', 'tower', 'lair', 'glade', 'camp', 'bcamp', 'ruin'];
const FORM = { shrine: /^Shrine of \S/, tower: / Spire$/, lair: /'s Lair$/, glade: / Glade$/, camp: / Camp$/, bcamp: / Camp$/, ruin: /^Ruins of \S/ };
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(([P]) => {
  WORLD.anchoredPlaces(); const all = [];
  for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) { const c = WORLD.getCell(i, j); c.sites.forEach(t => all.push({ t, c, home: i === 5 && j === 10 })); }
  const named = all.filter(o => o.t.name).map(o => o.t.name); const dups = [...new Set(named.filter((x, i) => named.indexOf(x) !== i))];
  const pois = all.filter(o => P.includes(o.t.kind) && !o.home).map(o => o.t);
  const renamed = pois.filter(t => t.drawnName).map(t => ({ kind: t.kind, from: t.drawnName, to: t.name }));
  const settledRenamed = all.filter(o => ['city', 'town', 'port', 'village', 'outpost'].includes(o.t.kind) && o.t.drawnName).length;
  const doors = []; all.forEach(o => { if (o.t.kind === 'lair' && o.t.anchor !== 'root') { const d = o.c.doors.find(x => x.lairDoor && x.lairSite === o.t.id); doors.push({ name: o.t.name, canon: d && d.canonicalName, place: d && d.lair.place }); } });
  const ids = ['c2_3_p2', 'c3_3_p1', 'c1_1_p1', 'c3_6_i2', 'c4_8_p3', 'c8_11_i2'].map(id => (all.find(o => o.t.id === id) || {}).t?.name);
  // the rumour: every town within two provinces of either of the first pair, with both lairs marked killed
  worldState.lairs = worldState.lairs || {}; worldState.lairs.c2_3_p2 = 1; worldState.lairs.c3_3_p1 = 1;
  const towns = all.filter(o => ['town', 'village', 'city', 'port'].includes(o.t.kind) && Math.abs(o.c.i - 2.5) <= 2.5 && Math.abs(o.c.j - 3) <= 2).map(o => o.t);
  let both = 0, heard = 0; for (const s of towns) { const lines = liveRumours(s).filter(l => /^Somebody killed the thing at /.test(l)); heard += lines.length; const names = lines.map(l => /at (.+?)\./.exec(l)[1]); if (names.length === 2 && names[0] !== names[1]) both++; else if (names.length === 2) both = -999; }
  const salt = doors.find(d => d.name === 'The Salt Mouth');
  return { pois: pois.length, dups, renamed, settledRenamed, doors, ids, towns: towns.length, heard, both, salt,
  };
}, [POI]);
console.log(JSON.stringify({ pois: r.pois, dups: r.dups, renamed: r.renamed.length, settledRenamed: r.settledRenamed, ids: r.ids, towns: r.towns, heard: r.heard, both: r.both, salt: r.salt, sample: r.renamed.slice(0, 6) }));
check('no two named places in the world share a name (shrines, spires, lairs, glades, camps and ruins with the towns)', r.pois > 400 && r.dups.length === 0, r.dups);
check('the critic\'s three doubled lairs are six names now', new Set(r.ids).size === 6 && r.ids.every(Boolean), r.ids);
check('only the second of each pair was renamed: 24 places, each keeping its form (Shrine of …, … Spire, …\'s Lair)', r.renamed.length >= 20 && r.renamed.length <= 30 && r.renamed.every(x => FORM[x.kind].test(x.to) && FORM[x.kind].test(x.from)), r.renamed.filter(x => !FORM[x.kind].test(x.to)));
check('no settlement lost a name it kept before (they rank first, as in Session 432)', r.settledRenamed > 200 && r.settledRenamed < 300, r.settledRenamed);
check('every lair\'s cavern door (the Root\'s is its own) reads the lair\'s name as it stands, renamed or not', r.doors.length === 40 && r.doors.every(d => d.canon === `${d.name} — the cavern` && d.place === d.name.replace(/'s Lair$/, '')), r.doors.filter(d => d.canon !== `${d.name} — the cavern`).slice(0, 3));
check('the Salt Mouth\'s cavern still reads its anchored name', r.salt && r.salt.canon === 'The Salt Mouth — the cavern' && r.salt.place === 'The Salt Mouth', r.salt);
check('a town in reach of both old Dogiaen\'s Lairs, with both killed, names two different lairs', r.heard > 0 && r.both > 0, { heard: r.heard, both: r.both });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
