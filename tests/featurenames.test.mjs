// The peaks, lakes and great rivers take their word from their own people's tongue (quest review run 6, Finding 9),
// Session 446. Before it a peak drew Sliabh, Mont, Ben or Cnoc anywhere (*Mont Ballymore* in the Gatelands, the Scots
// *Ben* that no people speaks), a lake in the Mark was *Mere Ashford*, and Aurenne's rivers began with a small *la*.
// Home's authored landmarks (The Cinder) are not drawn and are left out.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
const r = await page.evaluate(() => {
  WORLD.rawH(1, 1);
  const FORMS = { gatelander: [/^Sliabh /, /^Cnoc /], markman: [/ Fell$/, / Tor$/], aurennais: [/^Mont /, /^Pic /] };
  const LFORM = { gatelander: [/^Loch /], markman: [/ Mere$/, /mere Water$/], aurennais: [/^Lac /] };
  const peaks = [], lakes = [], bad = [];
  for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) {
    const c = WORLD.getCell(i, j); const ppl = WORLD.nationOf(i, j).people; if (c.home) continue;
    c.peaks.forEach(p => { peaks.push(`${p.name} (${ppl})`); if (!(FORMS[ppl] || FORMS.gatelander).some(re => re.test(p.name))) bad.push(`${p.name} (${ppl})`); });
    c.lakes.forEach(l => { lakes.push(`${l.name} (${ppl})`); if (!(LFORM[ppl] || LFORM.gatelander).some(re => re.test(l.name))) bad.push(`${l.name} (${ppl})`); });
  }
  const all = peaks.concat(lakes);
  const rivers = WORLD.routed.great.map(x => x.name);
  return { np: peaks.length, nl: lakes.length, bad, ben: all.filter(x => /^Ben |^Mere /.test(x)), sample: peaks.slice(0, 4).concat(lakes.slice(0, 4)),
    forms: { fell: all.filter(x => / (Fell|Tor) /.test(x)).length, mont: all.filter(x => /^(Mont|Pic) /.test(x)).length, sliabh: all.filter(x => /^(Sliabh|Cnoc) /.test(x)).length },
    rivers, small: rivers.filter(x => /^[a-z]/.test(x)) };
});
console.log(JSON.stringify(r));
check('every peak and lake in the world is named', r.np > 10 && r.nl > 3, { np: r.np, nl: r.nl });
check('each peak and lake takes its people\'s word, in its place in the name', r.bad.length === 0, r.bad.slice(0, 8));
check('no Scots *Ben*, no *Mere* before a name', r.ben.length === 0, r.ben);
check('the three peoples\' forms all occur', r.forms.fell > 0 && r.forms.mont > 0 && r.forms.sliabh > 0, r.forms);
check('no great river\'s name begins with a small letter (*La Dorée*)', r.rivers.length > 0 && r.small.length === 0, r.rivers);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
