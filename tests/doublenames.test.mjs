// Forts, peaks, lakes and gates no longer say a word twice (quest review run 7, Finding 13), Session 462. Finding 8 renamed
// a doubled *place*; nothing renamed the names `genName` gives a fort, a peak or a lake (*Montmont Tower*, *Ardard Watch*,
// *Mont Montmont*), nor the generated gates' names from `dungeonName` (*The Lost Chasm of the Lost*, *The Deep Depths of
// the Deep*). Both now step past a doubled half without a new draw, so only the names that doubled change: the old
// namer is kept here, copied from the build before the session, to show it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  function oldDungeonName(seed,theme){
    const h=s=>{let v=s^0xdeadbeef;v=(v^(v>>>16))*0x45d9f3b;v=(v^(v>>>16))*0x45d9f3b;return(v^(v>>>16))>>>0;};
    const pick=(arr,n)=>arr[h(seed*37+n)%arr.length];
    const PREFIXES={
      undead:   ['Ancient','Forgotten','Cursed','Hollow','Sunken','Dead','Pale','Ashen'],
      goblin:   ['Stinking','Rotten','Filthy','Dark','Hidden','Gnawed','Cramped','Reeking'],
      elemental:['Burning','Frozen','Scorched','Shattered','Blazing','Frost','Iron','Molten'],
      deep:     ['Deep','Black','Broken','Collapsed','Flooded','Lost','Sunken','Buried'],
      haunted:  ['Haunted','Whispering','Wailing','Silent','Shrouded','Cursed','Pale','Dim'],
      ruins:    ['Ruined','Crumbling','Fallen','Shattered','Old','Forsaken','Desolate','Worn'],
    };
    const NOUNS={
      undead:   ['Crypt','Tomb','Barrow','Ossuary','Mausoleum','Charnel House','Catacomb','Sepulchre'],
      goblin:   ['Warren','Den','Burrow','Pit','Hole','Cavern','Lair','Nest'],
      elemental:['Forge','Vault','Spire','Chamber','Crucible','Furnace','Sanctum','Core'],
      deep:     ['Depths','Abyss','Chasm','Delve','Fissure','Grotto','Hollow','Rift'],
      haunted:  ['Manor','Hall','Tower','Keep','Ruin','Estate','Manse','Sanctum'],
      ruins:    ['Ruin','Remnant','Hold','Fort','Citadel','Bastion','Redoubt','Outpost'],
    };
    const SUFFIXES=[
      'of Shadows','of the Fallen','of No Return','of Despair','of the Ancients',
      'of Sorrow','of the Damned','of the Lost','of Silence','of the Deep',
      'of Ash','of Bone','of the Void','of Whispers','of the Forsaken',
    ];
    const pre=pick(PREFIXES[theme]||PREFIXES.ruins,1);
    const noun=pick(NOUNS[theme]||NOUNS.ruins,2);
    const suf=pick(SUFFIXES,3);
    return `The ${pre} ${noun} ${suf}`;
  }
  const THEMES = ['undead', 'goblin', 'elemental', 'deep', 'haunted', 'ruins'];
  const lc = w => { w = w.toLowerCase(); return w === 'depths' ? 'deep' : w; };
  const same = (a, b) => { a = lc(a); b = lc(b); const n = Math.min(4, a.length, b.length); return a.slice(0, n) === b.slice(0, n); };
  const says2 = n => { const w = n.replace(/^The /, '').split(' ').filter(x => x !== 'of' && x !== 'the'); return w.some((x, i) => w.some((y, k) => k > i && same(x, y))); };
  let total = 0, changed = 0, oldBad = 0, newBad = 0, keptWrong = 0; const ex = [];
  for (let seed = 0; seed < 5000; seed++) for (const th of THEMES) {
    total++; const o = oldDungeonName(seed, th), n = dungeonName(seed, th);
    if (says2(o)) oldBad++; if (says2(n)) newBad++;
    if (o !== n) { changed++; if (ex.length < 6) ex.push(`${o} → ${n}`); if (!says2(o)) keptWrong++; }
  }
  WORLD.rawH(1, 1);
  const dbl = w => { const b = w.replace('-', '').toLowerCase(); for (let k = 2; k <= b.length / 2; k++) if (b.length === 2 * k && b.slice(0, k) === b.slice(k)) return true; return false; };
  const firstWordDbl = n => n.split(/[ ]/).some(dbl);
  const forts = [], peaks = [], lakes = [], bad = [];
  for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) {
    const c = WORLD.getCell(i, j); if (c.home) continue;
    c.doors.forEach(e => { if (e.exterior && e.canonicalName) { forts.push(e.canonicalName); if (firstWordDbl(e.canonicalName)) bad.push(e.canonicalName); } });
    c.peaks.forEach(p => { peaks.push(p.name); if (firstWordDbl(p.name)) bad.push(p.name); });
    c.lakes.forEach(l => { lakes.push(l.name); if (firstWordDbl(l.name)) bad.push(l.name); });
  }
  return { total, changed, oldBad, newBad, keptWrong, ex, nf: forts.length, np: peaks.length, nl: lakes.length, bad, sample: forts.slice(0, 6) };
});
console.log(JSON.stringify(r));
check('gate names over seeds 0–4,999 and six themes: the old namer doubled a word in some, the new in none', r.oldBad > 0 && r.newBad === 0, { oldBad: r.oldBad, newBad: r.newBad });
check('only the doubled names change (every changed name doubled before; none drawn anew)', r.changed === r.oldBad && r.keptWrong === 0, { changed: r.changed, oldBad: r.oldBad, ex: r.ex });
check('every fort, peak and lake in the world is named', r.nf > 50 && r.np > 10 && r.nl > 3, { nf: r.nf, np: r.np, nl: r.nl });
check('no fort, peak or lake name holds a doubled word (*Montmont Tower*, *Ardard Watch*)', r.bad.length === 0, r.bad.slice(0, 8));
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
