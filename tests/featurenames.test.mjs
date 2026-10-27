// The peaks, lakes and great rivers take their word from their own people's tongue (quest review run 6, Finding 9),
// Session 446. Before it a peak drew Sliabh, Mont, Ben or Cnoc anywhere (*Mont Ballymore* in the Gatelands, the Scots
// *Ben* that no people speaks), a lake in the Mark was *Mere Ashford*, and Aurenne's rivers began with a small *la*.
// Home's authored landmarks (The Cinder) are not drawn and are left out.
// Session 1472 (the Aurennais Register, approved 14 Oct): Aurenne takes its own register, not the Crown's Norman one.
// Its peaks are *Jebel* and *Akra*, its lakes *Birket*, its rivers *Chrysa* to *Safia*; its places, people, signs, inns and
// rumours are drawn from the `aurennais` banks, and the Crown's *french* places on the home island are unchanged.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  WORLD.rawH(1, 1);
  const FORMS = { gatelander: [/^Sliabh /, /^Cnoc /], markman: [/ Fell$/, / Tor$/], aurennais: [/^Jebel /, /^Akra /] };
  const LFORM = { gatelander: [/^Loch /], markman: [/ Mere$/, /mere Water$/], aurennais: [/^Birket /] };
  const peaks = [], lakes = [], bad = [];
  for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) {
    const c = WORLD.getCell(i, j); const ppl = WORLD.nationOf(i, j).people; if (c.home) continue;
    c.peaks.forEach(p => { peaks.push(`${p.name} (${ppl})`); if (!(FORMS[ppl] || FORMS.gatelander).some(re => re.test(p.name))) bad.push(`${p.name} (${ppl})`); });
    c.lakes.forEach(l => { lakes.push(`${l.name} (${ppl})`); if (!(LFORM[ppl] || LFORM.gatelander).some(re => re.test(l.name))) bad.push(`${l.name} (${ppl})`); });
  }
  const all = peaks.concat(lakes);
  const rivers = WORLD.routed.great.map(x => x.name);
  return { np: peaks.length, nl: lakes.length, bad, ben: all.filter(x => /^Ben |^Mere /.test(x)), sample: peaks.slice(0, 4).concat(lakes.slice(0, 4)),
    forms: { fell: all.filter(x => / (Fell|Tor) /.test(x)).length, jebel: all.filter(x => /^(Jebel|Akra) /.test(x)).length, sliabh: all.filter(x => /^(Sliabh|Cnoc) /.test(x)).length },
    rivers, small: rivers.filter(x => /^[a-z]/.test(x)) };
});
console.log(JSON.stringify(r));
check('every peak and lake in the world is named', r.np > 10 && r.nl > 3, { np: r.np, nl: r.nl });
check('each peak and lake takes its people\'s word, in its place in the name', r.bad.length === 0, r.bad.slice(0, 8));
check('no Scots *Ben*, no *Mere* before a name', r.ben.length === 0, r.ben);
check('the three peoples\' forms all occur', r.forms.fell > 0 && r.forms.jebel > 0 && r.forms.sliabh > 0, r.forms);
check('no great river\'s name begins with a small letter (*La Dorée*)', r.rivers.length > 0 && r.small.length === 0, r.rivers);
const a = await page.evaluate(() => {
  const AU = NAMES.aurennais, S = SYL.aurennais, AQ = / (Maior|Minor|Paralia|al-Qasr|al-Bir)$/;
  const bare = n => n.replace(/^(Shrine of |Ruins of |Per-)/, '').replace(/('s Lair| Glade| Spire| Camp| Keep| Hold| Watch| Gate| Tower| Road)$/, '').replace(AQ, '');
  const fromBank = n => S[0].some(x => bare(n).startsWith(x) && S[1].includes(bare(n).slice(x.length)));
  const anchored = new Set(['Caer Slige', 'Port Blackhand', 'The Salt Mouth', 'Cill an Aoi']);
  const sites = [], off = [], lords = [], badLord = [], cells = [];
  for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) {
    const c = WORLD.getCell(i, j); if (c.home || c.type === 'sea') continue;
    if (nationKeyOf(i, j) !== 'aurenne') { if (c.reg === 'aurennais') cells.push(`${i},${j}`); continue; }
    if (c.reg !== 'aurennais') cells.push(`${i},${j} ${c.reg}`);
    c.sites.forEach(t => { if (!t.name) return; sites.push(t.name); if (!anchored.has(t.name) && !fromBank(t.name)) off.push(t.name);
      if (t.pad > 0 && ['village', 'town', 'port', 'city'].includes(t.kind) && nationKeyOf(...cellOf(t.x, t.z)) === 'aurenne') { const l = lordFor(t); lords.push(l.name); if (!AU.m.includes(l.name) && !AU.f.includes(l.name)) badLord.push(l.name); } });
  }
  const others = ['irish', 'french', 'anglo'].flatMap(k => NAMES[k].m.concat(NAMES[k].f));
  const clash = AU.m.concat(AU.f).filter(n => others.includes(n) || /^Ald/.test(n));
  const home = WORLD.getCell(HOME_I, HOME_J).sites.filter(t => t.reg === 'french').map(t => t.name);
  return { n: sites.length, off: off.slice(0, 8), lords: lords.length, badLord: badLord.slice(0, 6), cells, clash, sample: sites.slice(0, 8),
    people: PEOPLES.aurennais.names, peak: PEAK_FORM.aurennais.map(f => f('Tamassa')), lake: LAKE_FORM.aurennais('Helion'),
    nouns: ['weapon', 'armor', 'potion', 'misc', 'shipwright', 'church', 'barber'].map(t => SHOP_NOUN[t].aurennais).join(','),
    inns: INN_NAMES.aurennais.length, rumours: RUMORS.aurennais.length, culture: CULTURES.aurennais && CULTURES.aurennais.name,
    long: nameBanks('aurennais').map(b => b.length), longSample: nameBanks('aurennais')[1].slice(0, 6),
    rivers: RIVER_NAMES.aurenne.join(','), home, fr: { m: NAMES.french.m[0], church: SHOP_NOUN.church.french, inn: INN_NAMES.french[0] } };
});
console.log(JSON.stringify(a));
check('Aurenne\'s places are drawn from its own register (or anchored)', a.n > 20 && a.off.length === 0, { n: a.n, off: a.off, sample: a.sample });
check('every cell of Aurenne, and only Aurenne, takes the aurennais register', a.cells.length === 0, a.cells);
check('Aurenne\'s lords are named from its bank, and its people draw from it', a.lords > 3 && a.badLord.length === 0 && a.people === 'aurennais', { lords: a.lords, bad: a.badLord, people: a.people });
check('no Aurennais name is another bank\'s, or begins Ald-', a.clash.length === 0, a.clash);
check('the land\'s words, signs, inns and talk', a.peak.join() === 'Jebel Tamassa,Akra Tamassa' && a.lake === 'Birket Helion' && a.nouns === 'Forge,Armoury,Apothecary,Emporium,Dockyard,Chapel,Barber' && a.inns === 6 && a.rumours === 6 && a.culture === 'Aurennais' && a.rivers === 'Chrysa,Albana,Agria,Khadra,Lenta,Safia', a);
check('the long forms: 144 short names, six qualifiers each', a.long[0] === 144 && a.long[1] === 864 && a.longSample.includes('Al' + 'ia Maior') && a.longSample.includes('Per-Alia'), { long: a.long, sample: a.longSample });
check('the Crown\'s french register stays for the home island', a.fr.m === 'Étienne' && a.fr.church === 'Chapelle' && a.fr.inn === 'Auberge du Cerf', { fr: a.fr, home: a.home });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
