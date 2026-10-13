// The Makers' tools, the frame (Session 776; Michael's B on DECISION #175, docs/design/unique-artifacts.md): six tools,
// one per god with a shrine; where the two home-island ones lie is picked from the world, the same on every boot; the
// check reads the attribute's base plus at most 2 from gear; a failed try costs nothing and is kept by the character for
// the journal's *Things not yet yours*; taking (takeArtifact) writes the world row and puts a unique item in the bag;
// giving it up (yieldArtifact) takes it out of the bag, the stash or your hands. Both rows survive a save.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

// 1. the table and the places
const a = await page.evaluate(() => {
  const ids = Object.keys(ARTIFACTS), gods = ids.map(id => ARTIFACTS[id].god);
  const P = artifactPlaces(); const gd = P.gate_blade, lr = P.wolf_cloak;
  const door = gd && [...CELLS.values()].flatMap(c => c.doors || []).find(d => d.seed === gd.door);
  const lair = lr && WORLD.siteAnywhere ? WORLD.siteAnywhere(lr.site) : null;
  const nat = (x, z) => nationKeyOf(...cellOf(x, z));
  return { ids, gods, godKeys: GODS.map(x => x.key), gd, lr, doorKind: door && door.kind, doorExt: door && door.exterior, doorNat: gd && nat(gd.x, gd.z),
    lairKind: lair && lair.kind, lairNat: lr && nat(lr.x, lr.z), anchor: lair && lair.anchor || null };
});
console.log(JSON.stringify(a));
check('six tools, one to each of the six gods with a shrine, none for the Guest', a.ids.length === 6 && new Set(a.gods).size === 6 && a.gods.every(k => a.godKeys.includes(k)), a.gods);
check("the Gate-Blade lies at a gate on the home island (a ruined gatehouse where there is one)", a.gd && a.doorNat === 'gatelands' && !!a.doorKind && a.gd.name, a);
check("the Wolf-Mother's Cloak lies with a home-island lair's master, not a story place", a.lr && a.lairKind === 'lair' && a.lairNat === 'gatelands' && !a.anchor, a);

// 2. the check: base plus at most 2 from gear
const b = await page.evaluate(() => {
  const keep = { ...ATTRS }; const eq = { ...EQ };
  ATTRS.might = 27; const bare = artifactCheck('gate_blade');
  const orig = getArmorEnchantBonuses; window.getArmorEnchantBonuses = () => ({ ...orig(), mightBonus: 5 });
  const geared = artifactCheck('gate_blade'); ATTRS.might = 28; const geared28 = artifactCheck('gate_blade');
  window.getArmorEnchantBonuses = orig;
  ATTRS.resolve = 40; const cloak = artifactCheck('wolf_cloak'); const bell = artifactCheck('drowned_bell');
  Object.assign(ATTRS, keep);
  return { bare, geared, geared28, cloak, bell };
});
console.log(JSON.stringify(b));
check('Might 27 bare does not take the blade (27 of 30)', !b.bare.ok && b.bare.have === 27 && b.bare.need === 30, b.bare);
check('gear adds at most 2: Might 27 with +5 from gear is 29, still short; 28 with it is 30 and takes it', !b.geared.ok && b.geared.have === 29 && b.geared.gear === 2 && b.geared28.ok && b.geared28.have === 30, b);
check('Resolve 40 passes the cloak; the Drowned Bell has no check (the tide is its trial)', b.cloak.ok && b.bell.ok && b.bell.attr === null, b);

// 3. a failed try, the journal, then the take, the save, and the yield
const c = await page.evaluate(async () => {
  delete worldState.artifacts; delete worldState.artifactTries; const keep = { ...ATTRS };
  ATTRS.might = 10; const t1 = artifactTry('gate_blade'); const t2 = artifactTry('gate_blade');
  const tries = JSON.parse(JSON.stringify(worldState.artifactTries)); const st0 = artifactState('gate_blade');
  const bag0 = BAG.filter(it => it.artifact).length;
  openHub('journal'); journalView('quest'); const jtext = document.getElementById('jn-body').innerText; closeHub();
  ATTRS.might = 30; const t3 = artifactTry('gate_blade'); const st1 = JSON.parse(JSON.stringify(artifactState('gate_blade')));
  const item = BAG.find(it => it.artifact === 'gate_blade'); const again = takeArtifact('gate_blade');
  openHub('journal'); journalView('quest'); const jtext2 = document.getElementById('jn-body').innerText; closeHub();
  Object.assign(ATTRS, keep);
  // sell and destroy refuse it
  const sellBlocked = !!(item && item.unique);
  bagAdd({ name: 'Test Candlestick', ico: '🕯', type: 'misc', weight: .5, sellMult: .3, buyPrice: 12, stolen: true, qty: 1 });
  bagAdd({ name: 'Test Relic', ico: '📜', type: 'misc', weight: .1, sellMult: 0, buyPrice: 0, unique: true, qty: 1 });
  await saveToSlot(0); const m = SS.idx.find(e => e.kind === 'manual' && e.slot === 0);
  const cr = JSON.parse(await ssGet(m.key)), wr = JSON.parse(await ssGet(ssWorldKey(m.key)));
  return { t1, t2, tries, st0, bag0, jtext: jtext.slice(0, 400), t3, st1, item: item && { name: item.name, unique: item.unique, artifact: item.artifact }, again, jtext2: jtext2.slice(0, 400), sellBlocked,
    wArt: wr.wS && wr.wS.artifacts, cArt: cr.wS && cr.wS.artifacts, cTries: cr.wS && cr.wS.artifactTries, wTries: wr.wS && wr.wS.artifactTries,
    bagSaved: (cr.BAG || []).some(it => it && it.artifact === 'gate_blade' && it.unique) };
});
console.log(JSON.stringify(c));
check('a try at Might 10 fails and costs nothing: no item, the stone still holds it', !c.t1.ok && c.st0 === null && c.bag0 === 0, c);
check('the try is kept by the character, counted', c.tries.gate_blade && c.tries.gate_blade.n === 2 && c.tries.gate_blade.have === 10, c.tries);
check("the Journal's Quests view lists it under *Things not yet yours* with the rule's number", /Things not yet yours[\s\S]*The Gate-Blade — [^\n]+\. Might 30\./.test(c.jtext), c.jtext);
check('at Might 30 the try takes it: the world row marks it taken, a unique item goes in the bag', c.t3.ok && c.st1 && c.st1.taken && c.item && c.item.unique && c.item.name === 'The Gate-Blade', c);
check('one of each per world: a second take does nothing', c.again === false, c.again);
check('once taken it leaves *Things not yet yours*', !/Things not yet yours/.test(c.jtext2), c.jtext2);
check('the world row carries artifacts, the character row the tries and the item', c.wArt && c.wArt.gate_blade && !c.cArt && c.bagSaved && c.wTries === undefined, c);

// 4. reload, then give it up
g.errs.length = 0; await page.reload(); await page.waitForTimeout(5000);
await page.evaluate(() => document.getElementById('cb').click()); await page.waitForTimeout(12000); await g.hide();
const d = await page.evaluate(() => {
  const st = artifactState('gate_blade'); const held = artifactHeld('gate_blade');
  const cs = BAG.find(it => it.name === 'Test Candlestick'), rl = BAG.find(it => it.name === 'Test Relic');
  const marks = { stolen: cs && cs.stolen, unique: rl && rl.unique };
  const i = BAG.findIndex(it => it.artifact === 'gate_blade'); const it = BAG[i];
  const y = yieldArtifact('gate_blade', 'crown'); const after = artifactState('gate_blade'); const held2 = artifactHeld('gate_blade');
  const y2 = yieldArtifact('gate_blade', 'crown'); const retake = takeArtifact('gate_blade');
  return { st, held, y, after, held2, y2, retake, marks };
});
console.log(JSON.stringify(d));
check('after a reload the blade is still taken and still in the bag', d.st && d.st.taken && d.held, d);
check('a stolen piece is still stolen after the reload, and a quest relic still unique (the save kept neither mark before)', d.marks.stolen === true && d.marks.unique === true, d.marks);
check('yielding it to its claimant takes it out of your hands and the world remembers who has it', d.y && !d.held2 && d.after.yielded === 'crown', d);
check('it cannot be yielded twice, nor taken again from the stone', d.y2 === false && d.retake === false, d);

// 5. the places are the world's: the same after a reload
const e = await page.evaluate(() => { const P = artifactPlaces(); return { gd: P.gate_blade && P.gate_blade.door, lr: P.wolf_cloak && P.wolf_cloak.site }; });
check('the places are the same on a fresh boot', e.gd === a.gd.door && e.lr === a.lr.site, { before: [a.gd.door, a.lr.site], after: e });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
