// Three of the critic's s360 bugs (2026-10-02), Session 426: a crate on your back read *undefined Bale of Wool* in the HUD
// (`cargoItem` had no icon); a passage from a Compact port was labelled without the ×1.3 the ferry charges (Camuros: 17g,
// charged 22), and the label capped at 120 where the charge caps at 150 and showed a price at rank 2 where the passage is
// free; the dialogue hint still said *1–4 to choose* after Session 392 made 1–9 and 0 answer.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// every port's passages: the label's price against what `ferryTo` asks of a purse one short of it
const ferry = await page.evaluate(() => { const F = WORLD.fstate(); for (const k in F) F[k].rank = 0;
  const rows = []; const g0 = gold;
  for (const s of WORLD.allPorts()) for (const t of WORLD.ferryTopics(s)) {
    const m = /^Passage to (.+) \((\d+)g, /.exec(t.label); const label = m ? +m[2] : null;
    gold = Math.max(0, label - 1); const said = t.fn(); /* the topic's own call, with its own port: names repeat */
    const asked = +((/is (\d+) gold/.exec(said || '') || [])[1]) || null;
    rows.push({ from: s.name, nation: WORLD.nationKeyOf(...WORLD.cellOf(s.x, s.z)), to: m[1], label, asked }); }
  gold = g0; const aur = rows.filter(r => r.nation === 'aurenne');
  // a faction at rank 2 carries you free: the label says so too
  const s = WORLD.allPorts().find(p => WORLD.nationKeyOf(...WORLD.cellOf(p.x, p.z)) === 'gatelands'); F.crown.rank = 2;
  const freeLabels = WORLD.ferryTopics(s).map(t => t.label); F.crown.rank = 0;
  const names = WORLD.allPorts().map(p => p.name); return { n: rows.length, ports: names.length, dupNames: names.filter((x, i) => names.indexOf(x) !== i).length, wrong: rows.filter(r => r.label !== r.asked), aurN: aur.length, aurSample: aur.slice(0, 3), over120: rows.filter(r => r.label > 120).length, freeLabels }; });
console.log(JSON.stringify(ferry));
check('every passage from every port is labelled with what the ferry charges', ferry.n > 0 && ferry.wrong.length === 0, ferry.wrong.slice(0, 8));
check('the Compact\'s ports are among them, their tithe in the label', ferry.aurN > 0 && ferry.aurSample.every(r => r.label === r.asked), ferry.aurSample);
check('at rank 2 with the nation\'s faction, the passages read 0g, as they cost', ferry.freeLabels.length > 0 && ferry.freeLabels.every(l => /\(0g, /.test(l)), ferry.freeLabels);

// a crate on your back in the HUD, and a crate from a save made before it had an icon
const crate = await page.evaluate(() => { BAG.push(WORLD.cargoItem('wool')); updateHUD(); const hud = document.getElementById('bh').textContent;
  const d = JSON.parse(ssStringify(_buildSavePayload())); const old = (d.bag || d.BAG || []).find(it => it && it.type === 'cargo'); if (old) delete old.ico;
  _applyLoadData(d); updateHUD(); const after = document.getElementById('bh').textContent; const it = BAG.find(x => x.type === 'cargo');
  return { hud, oldHadNoIco: !!old, after, ico: it && it.ico }; });
console.log(JSON.stringify(crate));
check('a crate on your back reads with its icon in the HUD, not *undefined*', /📦 Bale of Wool/.test(crate.hud) && !/undefined/.test(crate.hud), crate);
check('a crate loaded from a save made before it had an icon gets one', crate.oldHadNoIco && crate.ico === '📦' && !/undefined/.test(crate.after), crate);

// the dialogue's hint
const hint = await page.evaluate(() => document.getElementById('dlg-hint').textContent);
check('the dialogue hint names the keys that answer (1–9, 0)', /1–9, 0 to choose/.test(hint), hint);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
