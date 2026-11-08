// Asked in Passing (Session 1510; the quest writer's draft, approved by Michael 14 Oct 2026): a generated townsperson has an
// errand one game-week in five, rolled by town, giver and week. This first slice builds the frame and errand 3, A Fever: the
// hint in the greeting, the ask in About you, the offer by people, the herbs brought by the date for the pay and a point of
// favour, and the lapse past it with the colder greeting for a week. Session 1554 adds errand 1, The Unanswered Letter: the
// three truths at the other town, the truth or the lie told at home, and the lie remembered.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => {
  const site = siteAnywhere('dunmore');
  const mk = i => makeDef(site, site.reg || 'irish', seededRng('ertest', i), 'Villager', 'Seán', {});
  // 1. the rate, over 300 givers with children in one week, and the roll at another hour of the same week
  worldState.quests = []; worldState.gameTimeAbsMinutes = 40 * 1440 + 300;
  const kids = [], tags = new Set(); for (let i = 0; kids.length < 300 && i < 6000; i++) { const d = mk(i); d._twin = i; if (d.bio.kids > 0 && !tags.has(erTag(d))) { tags.add(erTag(d)); kids.push(d); } }
  const on = kids.filter(d => errandFor(d, site)).length; const first = kids.map(d => !!errandFor(d, site));
  worldState.gameTimeAbsMinutes = 40 * 1440 + 1300; const again = kids.map(d => !!errandFor(d, site));
  const fev = d => { const e = errandFor(d, site); return !!e && e.sub === 'fever'; };
  const childless = (() => { let n = 0, l = 0; for (let i = 0; i < 400; i++) { const d = mk(i); d._twin = 'c' + i; const e = !d.bio.kids && errandFor(d, site); if (e && e.sub === 'fever') n++; if (e && e.sub === 'letter') l++; } return { n, l }; })();
  // 2. one giver: the greeting, the ask, the offer
  worldState.gameTimeAbsMinutes = 40 * 1440 + 300;
  const A = kids.find(fev); const pp = A.people;
  worldState.met = {}; const g1 = A.greeting[0]; const g2 = A.greeting[0];
  const you = A.topics.find(t => /^About you/.test(t.label)); const ask = you && you.follow.find(t => t.label === 'Who’s sick?');
  const E = errandFor(A, site);
  // 3. taken: the journal, the top-level topic, not yet
  const g0 = gold; const yes = ask.follow[0].fn(); const q = qActive().find(x => x.kind === 'errand');
  const top = A.topics.find(t => t.label === 'About that errand.'); const notYet = top && top.fn();
  const lordSees = qActive().some(x => x.giverSite === 'dunmore');
  const reoffer = !!errandFor(A, site);
  // 4. the herbs brought by the date
  bagAdd({ ...HERB_DEF[E.key].item, qty: E.n + 1, _typeKey: E.key }); const fav0 = favor(site);
  const done = A.topics.find(t => t.label === 'About that errand.').fn(); const paid = gold - g0;
  const left = bagCount(b => b.type === 'herb' && b.name === E.herb); const fav1 = favor(site);
  const after = { turned: q.turnedIn, topic: !!A.topics.find(t => t.label === 'About that errand.'), reoffer: !!errandFor(A, site) };
  // 5. another giver, let lapse
  const B = kids.find(d => d !== A && d.people === pp && fev(d)) || kids.filter(d => d !== A).find(fev);
  const EB = errandFor(B, site); B.greeting[0]; B.topics.find(t => /^About you/.test(t.label)).follow.find(t => t.label === 'Who’s sick?').follow[0].fn();
  const qb = qActive().find(x => x.kind === 'errand'); worldState.gameTimeAbsMinutes = qb.erDue - 1; tickDatedWork(); const standing = !qb.lapsed;
  worldState.gameTimeAbsMinutes = qb.erDue + 90; tickDatedWork(); const lapsed = { lapsed: !!qb.lapsed, active: qActive().includes(qb), log: GAME_LOG.slice(-2).map(e => e.text) };
  bagAdd({ ...HERB_DEF[EB.key].item, qty: EB.n, _typeKey: EB.key }); const gb = gold;
  const lapseSaid = B.topics.find(t => t.label === 'About that errand.').fn(); const lapsePaid = gold - gb;
  const lapseTwice = !!B.topics.find(t => t.label === 'About that errand.');
  const cold = B.greeting[0]; worldState.gameTimeAbsMinutes = qb.erDue + 1440 * 7 + 10; const warm = B.greeting[0];
  const saved = JSON.parse(JSON.stringify(worldState.quests)).filter(x => x.kind === 'errand').map(x => x.id);
  // 6. S1554 — the letter (errand 1): one giver for each of the three truths
  worldState.gameTimeAbsMinutes = 40 * 1440 + 300; worldState.quests = []; worldState.met = {};
  const lg = {}; for (let i = 0; i < 6000 && Object.keys(lg).length < 3; i++) { const d = mk(10000 + i); d._twin = 'L' + i; const e = errandFor(d, site); if (e && e.sub === 'letter' && !lg[e.truth]) lg[e.truth] = d; }
  const resAt = (E, n) => { const T = siteAnywhere(E.siteId); for (let k = 0; ; k++) { const d = makeDef(T, T.reg || 'irish', seededRng('ertest-res', n + ':' + k), 'Villager', 'Seán', {}); d._twin = 'R' + n + k; if (d.name !== E.who) return d; } };
  const L = {};
  for (const k of ['gone', 'dead', 'there']) { const C = lg[k]; if (!C) continue; const p = erPeople(C); const E = errandFor(C, site); const o = erPro(E);
    C.greeting[0]; const greet = C.greeting[0]; const you = C.topics.find(t => /^About you/.test(t.label)); const ask = you.follow.find(t => t.label === 'You’re waiting on word from someone?');
    const g0 = gold; const yes = ask.follow[0].fn(); const q = qActive().find(x => x.kind === 'errand' && x.giver === C.name);
    const letter = bagCount(b => b.name === `Letter for ${E.who}`); const notYet = C.topics.find(t => t.label === 'About that errand.').fn();
    const res = resAt(E, k.length); const rt = res.topics.find(t => t.label === `I’ve a letter for ${E.who}.`);
    const atHome = !!C.topics.find(t => t.label === `I’ve a letter for ${E.who}.`);
    let heard = null; if (k === 'there') heard = qOnTalk({ name: E.who, _erLetter: q.id }); else heard = rt && rt.fn();
    const tops = C.topics.map(t => t.label); const truthL = ER_LETTER.told[k](o), lieL = ER_LETTER.told.lie(o);
    const pick = k === 'dead' ? lieL : truthL; const said = C.topics.find(t => t.label === pick).fn();
    L[k] = { p, rp: erPeople(res), who: E.who, town: E.town, greet, hint: ER_LETTER.hint[p], offer: ask.response, yes, ys: ER_SHARED[p].yes, title: q.title, letter, notYet, nyw: ER_SHARED[p].notYet,
      rt: !!rt, atHome, heard, want: k === 'there' ? true : ER_LETTER[k][erPeople(res)](o), learned: q.data.learned, tops, truthL, lieL, said,
      wantSaid: k === 'dead' ? ER_LETTER.lie[p] : ER_LETTER.truth[p][k](o), paid: gold - g0, reward: questGold(q.reward), kept: bagCount(b => b.name === `Letter for ${E.who}`), done: q.turnedIn, told: q.data.told }; }
  // the lie remembered: the waiting line some weeks after, then at four game-weeks the giver writes again to the same one, and on the truth says they knew
  let again2 = null; if (lg.dead) { const C = lg.dead, p = erPeople(C), q0 = erRecs(C, site)[0]; const waits = [];
    for (let w = 1; w <= 3; w++) { worldState.gameTimeAbsMinutes = (q0.data.toldWeek + w) * 1440 * 7 + 300; waits.push(C.greeting[0] === ER_LETTER.wait[p](erPro(q0.data))); }
    worldState.gameTimeAbsMinutes = (q0.data.toldWeek + 4) * 1440 * 7 + 300; const E2 = errandFor(C, site);
    C.topics.find(t => /^About you/.test(t.label)).follow.find(t => t.label === 'You’re waiting on word from someone?').follow[0].fn();
    const q2 = qActive().find(x => x.giver === C.name); const res = resAt(E2, 99); res.topics.find(t => t.label === `I’ve a letter for ${E2.who}.`).fn();
    const said = C.topics.find(t => t.label === ER_LETTER.told.dead(erPro(E2))).fn();
    again2 = { waits, E2: E2 && { who: E2.who, truth: E2.truth, again: E2.again }, who: q0.data.who, id: q2 && q2.id, said, want: ER_LETTER.knew[p] + ' ' + ER_LETTER.truth[p].dead(erPro(E2)) }; }
  const lsaved = JSON.parse(JSON.stringify(worldState.quests)).filter(x => x.sub === 'letter').map(x => ({ id: x.id, told: x.data.told, npc: '_npc' in x }));
  return { on, n: kids.length, same: JSON.stringify(first) === JSON.stringify(again), childless, pp, g1, g2, hint: ER_FEVER.hint[pp], ask: ask && ask.response, E: { herb: E.herb, n: E.n, date: E.date, dir: E.dir },
    yes, title: q && q.title, qid: q && q.id, notYet, lordSees, reoffer, done, paid, want: questGold(q.reward), reward: q.reward, left, extra: 1, fav: [fav0, fav1], after,
    pb: B.people, standing, lapsed, lapseSaid, lapsePaid, lapseTwice, cold, warm, saved, L, again: again2, lsaved, F: ER_FEVER, S: ER_SHARED };
});
console.log(JSON.stringify({ ...r, F: undefined, S: undefined }).slice(0, 3000));
check('about one giver with children in five has an errand in a week (300 givers)', r.on >= 35 && r.on <= 85, { on: r.on, n: r.n });
check('the roll is the town\'s, the giver\'s and the week\'s: the same at another hour', r.same);
check('only a giver with children asks for a fever; one without may ask for a letter', r.childless.n === 0 && r.childless.l > 0, r.childless);
check('the first greeting has no hint; the second carries it after First Words', !r.g1.endsWith(r.hint) && r.g2.endsWith(' ' + r.hint) && r.g2.length > r.hint.length + 2, { g1: r.g1, g2: r.g2 });
check('About you holds Who’s sick?, the offer in the giver\'s people\'s words with the herb, the count and the date', !!r.ask && r.ask.includes(r.E.herb) && r.ask.includes(r.E.date) && /two|three|four/i.test(r.ask), r.ask);
check('taken: the journal names it, the giver acknowledges, About that errand. says not yet', r.title === `${r.E.herb} for a fever` && /^er:dunmore:.+:0$/.test(r.qid) && r.yes === r.S[r.pp].yes && r.notYet === r.S[r.pp].notYet, { title: r.title, id: r.qid, yes: r.yes, notYet: r.notYet });
check('the lord does not take the errand for his own, and it is not offered twice', !r.lordSees && !r.reoffer);
check('brought by the date: the herbs taken, the pay a quarter over, the fever line, a point of favour', r.done === r.F.done[r.pp] && r.paid === r.want && r.paid > 0 && r.left === r.extra && r.fav[1] === r.fav[0] + 1, { done: r.done, paid: r.paid, want: r.want, left: r.left, fav: r.fav });
check('turned in, the topic goes and the giver has nothing more this week', r.after.turned && !r.after.topic && !r.after.reoffer, r.after);
check('past the date the fever breaks without you: lapsed, out of the journal\'s work, a line in it', r.standing && r.lapsed.lapsed && !r.lapsed.active && r.lapsed.log.some(t => /broke without the/.test(t)), r.lapsed);
check('the lapse said once, nothing paid, herbs kept', r.lapseSaid === r.F.lapse[r.pb] && r.lapsePaid === 0 && !r.lapseTwice, { said: r.lapseSaid, paid: r.lapsePaid });
check('the greeting is colder for a week after, then warm again', r.cold === r.F.cold[r.pb] && r.warm !== r.F.cold[r.pb], { cold: r.cold, warm: r.warm });
check('the records are plain data in worldState.quests (saved with it)', r.saved.length === 2, r.saved);
for (const k of ['gone', 'dead', 'there']) { const x = r.L[k]; if (!x) { check(`a letter giver whose addressee is ${k}`, false); continue; }
  check(`letter (${k}): the hint after First Words, the ask, the offer naming the town`, x.greet.endsWith(' ' + x.hint) && x.offer.includes(x.town), { greet: x.greet, offer: x.offer });
  check(`letter (${k}): taken, the journal names ${x.who}, the letter in the bag, not yet`, x.yes === x.ys && x.title === `A letter for ${x.who}` && x.letter === 1 && x.notYet === x.nyw, { title: x.title, letter: x.letter });
  check(`letter (${k}): learned at the other town, ${k === 'there' ? 'from the addressee, one line' : 'from a resident in their people\'s words'}; not asked at home`, (k === 'there' ? x.heard === true && !x.rt : x.heard === x.want) && x.learned && !x.atHome, { heard: x.heard, want: x.want });
  check(`letter (${k}): the giver offers the truth and the lie, and answers ${k === 'dead' ? 'the lie' : 'the truth'} in their words, paid`, x.tops.includes(x.truthL) && x.tops.includes(x.lieL) && !x.tops.includes('About that errand.') && x.said === x.wantSaid && x.paid === x.reward && x.done, { said: x.said, want: x.wantSaid, paid: x.paid });
  check(`letter (${k}): the letter ${k === 'there' ? 'was read and is gone' : 'stays in the bag'}`, x.kept === (k === 'there' ? 0 : 1), x.kept); }
if (r.again) { check('the lie remembered: the waiting line in some of the three weeks after', r.again.waits.some(Boolean), r.again.waits);
  check('four game-weeks on, the giver writes again to the same one, and on the truth says they knew', r.again.E2 && r.again.E2.again && r.again.E2.who === r.again.who && r.again.E2.truth === 'dead' && /:1$/.test(r.again.id) && r.again.said === r.again.want, r.again); }
check('the letters are plain data in worldState.quests, no live handle', r.lsaved.length >= 3 && r.lsaved.every(x => !x.npc), r.lsaved);
// S1600 — errand 4, Say the Name at the Door: the offer, the door's prompt and press, the pay by people; the Old Blood's one line;
// a Markman with a spouse never asks; on the truth of a death (errand 1) the name is offered at once
const n4 = await page.evaluate(() => {
  const site = siteAnywhere('dunmore'); worldState.quests = []; worldState.met = {}; worldState.gameTimeAbsMinutes = 60 * 1440 + 300;
  const mk = (i, pp) => { const d = makeDef(site, site.reg || 'irish', seededRng('ertest4', i), 'Villager', 'Seán', {}); d._twin = 'N' + i; if (pp) d.people = pp; return d; };
  const gate = erGate(site); const out = { gate: gate && gate.gate };
  if (!gate) return out;
  const find = (pp, ok) => { for (let i = 0; i < 4000; i++) { const d = mk(pp + i, pp); const e = errandFor(d, site); if (e && e.sub === 'name' && (!ok || ok(d))) return d; } return null; };
  const by = {};
  for (const pp of ['gatelander', 'aurennais', 'markman']) { const A = find(pp); if (!A) continue; const E = errandFor(A, site), o = erPro(E);
    A.greeting[0]; const greet = A.greeting[0]; const ask = A.topics.find(t => /^About you/.test(t.label)).follow.find(t => t.label === 'Can I do anything for you?');
    const g0 = gold, f0 = favor(site), b0 = bagCount(b => b.name === 'Loaf of Bread'); const yes = ask.follow[0].fn(); const q = qActive().find(x => x.giver === A.name && x.sub === 'name');
    const notYet = A.topics.find(t => t.label === 'About that errand.').fn(); const P = { seed: q.data.seed };
    const prompt = erNamePrompt(P), other = erNamePrompt({ seed: -1 }); const said = erNameSay(P); const log = GAME_LOG[GAME_LOG.length - 1].text;
    const after = { prompt: erNamePrompt(P), again: erNameSay(P) }; const top = A.topics.find(t => t.label === 'I said the name.');
    const done = top && top.fn();
    by[pp] = { greet, hint: ER_NAME.hint[pp](o), offer: ask.response, want: ER_NAME.offer[pp](o), yes, ys: ER_SHARED[pp].yes, title: q.title, wtitle: `A name at ${E.gate}`, notYet, ny: ER_SHARED[pp].notYet,
      prompt, other, said, log, wlog: `You say the name at the door of ${E.gate}: ${E.who}.`, after, done, wdone: ER_NAME.done[pp](o), paid: gold - g0, wpaid: questGold(q.reward), fav: favor(site) - f0,
      bread: bagCount(b => b.name === 'Loaf of Bread') - b0, turned: q.turnedIn, spouse: A.bio.spouse }; }
  const OB = find('oldblood'); let ob = null; if (OB) { const ask = OB.topics.find(t => /^About you/.test(t.label)).follow.find(t => t.label === 'Can I do anything for you?'); OB.greeting[0];
    ob = { said: ask && ask.response, follow: !!(ask && ask.follow), greet: OB.greeting[0], first: firstWords(OB, site) }; }
  let mkSpouse = 0; for (let i = 0; i < 1500; i++) { const d = mk('ms' + i, 'markman'); const e = d.bio.spouse && errandFor(d, site); if (e && e.sub === 'name') mkSpouse++; }
  // the hand-off: a letter whose addressee is dead, told truly
  let hand = null; for (let i = 0; i < 6000; i++) { const C = mk('L' + i); const e = errandFor(C, site); if (!e || e.sub !== 'letter' || e.truth !== 'dead' || erPeople(C) === 'oldblood') continue;
    C.topics.find(t => /^About you/.test(t.label)).follow.find(t => t.label === 'You’re waiting on word from someone?').follow[0].fn();
    const q = qActive().find(x => x.giver === C.name && x.sub === 'letter'); q.data.learned = true; const c = C.topics.find(t => t.label === ER_LETTER.told.dead(erPro(e)));
    const said = c.fn(c); const ask = c.follow && c.follow[0]; const yes = ask && ask.follow[0].fn(); const n = qActive().find(x => x.giver === C.name && x.sub === 'name');
    hand = { said, want: ER_LETTER.truth[erPeople(C)].dead(erPro(e)), label: ask && ask.label, offer: ask && ask.response, who: e.who, nwho: n && n.data.who, nid: n && n.id, after: n && n.data.after }; break; }
  return Object.assign(out, { by, ob, mkSpouse, hand, OBL: ER_NAME.oldblood, saved: JSON.parse(JSON.stringify(worldState.quests)).filter(x => x.sub === 'name').length });
});
console.log(JSON.stringify(n4).slice(0, 2500));
check('name: an old gate near the town to send the name to', !!n4.gate, n4.gate);
for (const pp of ['gatelander', 'aurennais', 'markman']) { const x = n4.by && n4.by[pp]; if (!x) { check(`name (${pp}): a giver asks`, false); continue; }
  check(`name (${pp}): the hint after First Words, the offer word for word with the gate`, x.greet.endsWith(' ' + x.hint) && x.offer === x.want && x.offer.includes(n4.gate), { greet: x.greet, offer: x.offer });
  check(`name (${pp}): taken, the journal titles it, About that errand. says not yet`, x.yes === x.ys && x.title === x.wtitle && x.notYet === x.ny, { title: x.title });
  check(`name (${pp}): the door's prompt only at that gate; E says the name into the log, once`, x.prompt === "Press 'E' to say the name" && x.other === null && x.said === true && x.log === x.wlog && x.after.prompt === null && x.after.again === false, { prompt: x.prompt, log: x.log });
  check(`name (${pp}): I said the name. is answered in their words and paid as the draft has it`, x.done === x.wdone && x.turned && x.paid === x.wpaid && x.fav === 1 && x.bread === (pp === 'gatelander' ? 1 : 0) && (pp !== 'markman' || (x.paid === 0 && !x.spouse)), { done: x.done, paid: x.paid, bread: x.bread }); }
check('name: an Old Blood giver has the one line to the ask, no errand and no hint', n4.ob && n4.ob.said === n4.OBL && !n4.ob.follow && !/buried|bury/i.test(n4.ob.greet), n4.ob);
check('name: a Markman with a spouse never asks it', n4.mkSpouse === 0, n4.mkSpouse);
check('name: on the truth of a death the giver offers the name at once, for the one who died', n4.hand && n4.hand.said === n4.hand.want && n4.hand.label === 'Can I do anything for you?' && n4.hand.offer.includes(n4.hand.who) && n4.hand.nwho === n4.hand.who && n4.hand.after === true, n4.hand);
// S1677 — errand 5, The Debt: the offer by the giver's people, the debtor's line by the debtor's people, the three answers at the door,
// each paid and favoured as the draft has it
const d5 = await page.evaluate(() => {
  const site = siteAnywhere('dunmore'); worldState.quests = []; worldState.met = {}; worldState.gameTimeAbsMinutes = 70 * 1440 + 300;
  const mk = (i, pp) => { const d = makeDef(site, site.reg || 'irish', seededRng('ertest5', i), 'Villager', 'Seán', {}); d._twin = 'D' + i; if (pp) d.people = pp; return d; };
  const find = pp => { for (let i = 0; i < 6000; i++) { const d = mk(pp + i, pp); const e = errandFor(d, site); if (e && e.sub === 'debt') return d; } return null; };
  let wrong = 0; for (let i = 0; i < 1500; i++) { const d = mk('w' + i, 'gatelander'); const e = errandFor(d, site); if (e && e.sub === 'debt' && !['cooper', 'carter'].includes(d.bio.trade)) wrong++; }
  const by = {}, choices = { gatelander: 'pay', markman: 'payfor', aurennais: 'keep', oldblood: 'pay' };
  for (const pp of Object.keys(choices)) { const A = find(pp); if (!A) continue; const E = errandFor(A, site);
    A.greeting[0]; const greet = A.greeting[0]; const ask = A.topics.find(t => /^About you/.test(t.label)).follow.find(t => t.label === 'Who owes you?');
    const yes = ask.follow[0].fn(); const q = qActive().find(x => x.giver === A.name && x.sub === 'debt');
    const notYet = A.topics.find(t => t.label === 'About that errand.').fn();
    const T = erDebtTopic(q.id); const label = T.label, said = T.response, labels = T.follow.map(f => f.label);
    const ch = choices[pp], k = ch === 'pay' ? 0 : ch === 'payfor' ? 1 : 2; if (ch === 'payfor') gold += q.data.n;
    const g0 = gold, fd0 = favor(q.data.siteId); const reply = T.follow[k].fn(); const spent = g0 - gold, fd = favor(q.data.siteId) - fd0, gone = !T.avail();
    const top = A.topics.find(t => t.label === (ch === 'keep' ? 'They haven’t got it.' : 'About that errand.')); const g1 = gold, f1 = favor(site); const done = top && top.fn();
    by[pp] = { greet, hint: ER_DEBT.hint[pp], offer: ask.response, want: ER_DEBT.offer[pp](E), yes, ys: ER_SHARED[pp].yes, title: q.title, wtitle: `${E.who}'s debt`, notYet, ny: ER_SHARED[pp].notYet,
      label, wlabel: `${A.name} sent me about the money.`, said, wsaid: ER_DEBT.debtor[q.data.dp](q.data), labels, ch, reply, spent, n: q.data.n, fd, gone,
      done, wdone: ch === 'keep' ? ER_DEBT.keep[pp] : ER_DONE[pp], paid: gold - g1, fav: favor(site) - f1, fifth: questGold(Math.round(q.data.n / 5)), turned: q.turnedIn, dp: q.data.dp,
      wreply: ch === 'pay' ? ER_DEBT.pay[q.data.dp] : ch === 'payfor' ? (q.data.dp === 'oldblood' && playerPeople() === 'oldblood' ? ER_DEBT.paid.oldbloodToOld : ER_DEBT.paid[q.data.dp]) : ER_DEBT.spared[q.data.dp] }; }
  // the debtor at a resident's door, once you come near the town, when that town is built
  let door = null; { let A = null; for (let i = 0; i < 20000 && !A; i++) { const d = mk('door' + i); const e = errandFor(d, site); if (e && e.sub === 'debt' && SETTLE.get(e.siteId)) A = d; } if (!A) A = find('gatelander'); if (A) { A.topics.find(t => /^About you/.test(t.label)).follow.find(t => t.label === 'Who owes you?').follow[0].fn();
    const q = qActive().find(x => x.giver === A.name && x.sub === 'debt'); if (!SETTLE.get(q.data.siteId)) { const H = [...SETTLE.keys()].find(k => k !== 'dunmore' && (SETTLE.get(k).residents || []).some(R => R.door)) || 'dunmore', T = siteAnywhere(H); Object.assign(q.data, { siteId: H, x: T.x, z: T.z }); } const S = SETTLE.get(q.data.siteId);
    if (S) { const ox = px, oz = pz; px = q.data.x; pz = q.data.z; erDebtTick(q); px = ox; pz = oz; const n = q._npc; door = { spawned: !!n, name: n && n.def && n.def.name, who: q.data.who, people: n && n.def && n.def.people, dp: q.data.dp,
      topic: !!(n && n.def && n.def.topics.find(t => t.label === `${A.name} sent me about the money.`)) }; } else door = { unbuilt: q.data.town, n: SETTLE.size, sid: q.data.siteId, keys: [...SETTLE.keys()].slice(-6) }; } }
  return { by, wrong, door, saved: JSON.parse(ssStringify(worldState.quests)).filter(x => x.sub === 'debt' && !('_npc' in x)).length };
});
console.log(JSON.stringify(d5).slice(0, 3000));
check('debt: only the trades that give credit ask it among Villagers (cooper, carter)', d5.wrong === 0, d5.wrong);
for (const pp of ['gatelander', 'markman', 'aurennais', 'oldblood']) { const x = d5.by[pp]; if (!x) { check(`debt (${pp}): a giver asks`, false); continue; }
  check(`debt (${pp}): the hint after First Words, the offer word for word, taken and titled, not yet`, x.greet.endsWith(' ' + x.hint) && x.offer === x.want && x.yes === x.ys && x.title === x.wtitle && x.notYet === x.ny, { greet: x.greet, offer: x.offer, title: x.title });
  check(`debt (${pp}): the debtor's topic and line in the debtor's people's words, the three answers`, x.label === x.wlabel && x.said === x.wsaid && x.labels.length === 3 && x.labels[1] === 'I’ll pay it for you.', { said: x.said, dp: x.dp });
  check(`debt (${pp}): ${x.ch} — the debtor's answer, the gold and the debtor's town's favour as drafted`, x.reply === x.wreply && x.gone && x.spent === (x.ch === 'payfor' ? x.n : 0) && x.fd === (x.ch === 'pay' ? -1 : x.ch === 'payfor' ? 2 : 1), { reply: x.reply, spent: x.spent, fd: x.fd });
  check(`debt (${pp}): turned in at home in the giver's words, a fifth or nothing, the favour`, x.turned && x.done === x.wdone && x.paid === (x.ch === 'keep' ? 0 : x.fifth) && x.fav === (x.ch === 'keep' ? -1 : 1), { done: x.done, paid: x.paid, fav: x.fav }); }
check('debt: the debtor stands at a door of the town, named, in their own people, with the topic', d5.door && (d5.door.unbuilt || (d5.door.spawned && d5.door.name === d5.door.who && d5.door.people === d5.door.dp && d5.door.topic)), d5.door);
check('debt: the records are saved', d5.saved >= 4, d5.saved);

// S1722 — errand 2, The Borrowed Thing: the thing by trade, the borrower's reason on the errand's id and their line in their own people's
// words, the four answers at the door, each paid and favoured as the draft has it; the coin kept past 14 days; the month's return line
const d2 = await page.evaluate(() => {
  const site = siteAnywhere('dunmore'); worldState.quests = []; worldState.met = {}; worldState.gameTimeAbsMinutes = 90 * 1440 + 300;
  const mk = (i, pp) => { const d = makeDef(site, site.reg || 'irish', seededRng('ertest2', i), 'Villager', 'Seán', {}); d._twin = 'B' + i; if (pp) d.people = pp; return d; };
  const find = (pp, why) => { for (let i = 0; i < 8000; i++) { const d = mk(pp + why + i, pp); const e = errandFor(d, site); if (!e || e.sub !== 'borrowed') continue;
    const id = erPre(d, site) + e.idx; if ((seededRng('errand-why', id)() < .5 ? 'need' : 'sold') === why) return d; } return null; };
  let things = 0, bad = 0; for (let i = 0; i < 1500; i++) { const d = mk('t' + i, 'gatelander'); const e = errandFor(d, site); if (e && e.sub === 'borrowed') { things++; if (e.thing !== (ER_BORROW_THING[d.bio.trade] || ['long ladder'])[0]) bad++; } }
  const plan = [['gatelander', 'need', 'hand'], ['markman', 'need', 'month'], ['aurennais', 'sold', 'coin'], ['oldblood', 'sold', 'spare'], ['gatelander', 'sold', 'coin'], ['markman', 'sold', 'spare']];
  const by = [];
  for (const [pp, why, ch] of plan) { const A = find(pp, why); if (!A) { by.push({ pp, why, ch, missing: true }); continue; } const E = errandFor(A, site);
    A.greeting[0]; const greet = A.greeting[0]; const ask = A.topics.find(t => /^About you/.test(t.label)).follow.find(t => t.label === 'Something of yours gone missing?');
    const yes = ask.follow[0].fn(); const q = qActive().find(x => x.giver === A.name && x.sub === 'borrowed');
    const notYet = A.topics.find(t => t.label === 'About that errand.').fn();
    const T = erBorrowTopic(q.id); const label = T.label, said = T.response, labels = T.follow.map(f => f.label), dp = q.data.dp;
    const k = { hand: 0, month: 1, coin: 0, spare: 1 }[ch]; const g0 = gold, fd0 = favor(q.data.siteId); const reply = T.follow[k].fn(); const got = gold - g0, fd = favor(q.data.siteId) - fd0, gone = !T.avail();
    const thing = bagCount(erIsThing(q));
    const top = A.topics.find(t => t.label === erBorrowLabel(q)); const tl = top && top.label;
    const lapse = pp === 'gatelander' && ch === 'coin';
    let done, g1, f1;
    if (lapse) { worldState.gameTimeAbsMinutes += 15 * 1440; f1 = favor(site); qTick(); g1 = gold; const cold = A.greeting[0]; const t2 = A.topics.find(t => t.label === 'About that errand.'); done = t2 && t2.fn();
      by.push({ pp, why, ch, lapse: true, lapsed: q.lapsed, cold, wcold: ER_BORROW.kept[pp](erPro(q.data)), done, fav: favor(site) - f1, paid: gold - g1, said, wsaid: ER_BORROW.sold[dp](q.data), got, n: q.data.n });
      worldState.gameTimeAbsMinutes -= 15 * 1440; continue; }
    g1 = gold; f1 = favor(site); done = top && top.fn();
    const base = Math.min(40, 15 + 5 * (Math.max(1, worldTierAt(site.x, site.z) || 1) - 1));
    const wpaid = ch === 'spare' ? 0 : questGold(ch === 'month' ? Math.round(base / 2) : base) - (ch === 'coin' ? q.data.n : 0);
    let back = null; if (ch === 'month') { const t0 = worldState.gameTimeAbsMinutes; worldState.gameTimeAbsMinutes = q.data.at + 31 * 1440; back = A.greeting[0]; worldState.gameTimeAbsMinutes = t0; }
    by.push({ pp, why, ch, dp, greet, hint: ER_BORROW.hint[pp](E), offer: ask.response, want: ER_BORROW.offer[pp](E), yes, ys: ER_SHARED[pp].yes, title: q.title, wtitle: `${A.name}’s ${E.thing}`, notYet, ny: ER_SHARED[pp].notYet,
      label, wlabel: `${A.name} wants the ${q.data.thing} back.`, said, wsaid: ER_BORROW[why][dp](q.data), labels, reply, wreply: ch === 'month' ? ER_BORROW.month[dp] : ch === 'spare' ? ER_BORROW.spared[dp] : ER_BORROW.take[dp],
      got, wgot: ch === 'coin' ? q.data.n : 0, fd, wfd: { hand: -1, month: 1, coin: 0, spare: 2 }[ch], gone, thing, tl, done, wdone: ch === 'month' ? ER_BORROW.monthDone[pp] : ch === 'spare' ? erLine(ER_BORROW.forgiven[pp], erPro(q.data)) : ER_DONE[pp],
      paid: gold - g1, wpaid, fav: favor(site) - f1, wfav: ch === 'spare' ? 0 : 1, turned: q.turnedIn, left: bagCount(erIsThing(q)), back, wback: ch === 'month' ? A.greeting[0].replace(/.*/, '') + ER_BORROW.back[pp](erPro(q.data)) : null }); }
  return { things, bad, by, saved: JSON.parse(ssStringify(worldState.quests)).filter(x => x.sub === 'borrowed' && !('_npc' in x)).length };
});
console.log(JSON.stringify(d2).slice(0, 3000));
check('borrowed: some givers ask it, each for their trade\'s thing', d2.things > 0 && d2.bad === 0, { things: d2.things, bad: d2.bad });
for (const x of d2.by) { const nm = `borrowed (${x.pp}, ${x.why}, ${x.ch})`; if (x.missing) { check(`${nm}: a giver asks`, false); continue; }
  if (x.lapse) { check(`${nm}: the coin taken, the borrower's line; kept past 14 days the errand lapses, the colder greeting, the line once, a point of favour lost, nothing paid`, x.got === x.n && x.said === x.wsaid && x.lapsed && x.cold === x.wcold && x.done === x.wcold && x.fav === -1 && x.paid === 0, x); continue; }
  check(`${nm}: the hint after First Words, the offer word for word, taken and titled, not yet`, x.greet.endsWith(' ' + x.hint) && x.offer === x.want && x.yes === x.ys && x.title === x.wtitle && x.notYet === x.ny, { greet: x.greet, offer: x.offer, title: x.title });
  check(`${nm}: the borrower's topic and line in the borrower's people's words, the two answers`, x.label === x.wlabel && x.said === x.wsaid && x.labels.length === 2 && !/\{|undefined/.test(x.said), { said: x.said, dp: x.dp, labels: x.labels });
  check(`${nm}: the borrower's answer, the thing or the coin, the borrower's town's favour`, x.reply === x.wreply && x.gone && x.got === x.wgot && x.fd === x.wfd && x.thing === (x.ch === 'hand' ? 1 : 0), { reply: x.reply, got: x.got, fd: x.fd, thing: x.thing });
  check(`${nm}: turned in at home (${x.tl}) in the giver's words, paid and favoured as drafted`, x.turned && x.done === x.wdone && x.paid === x.wpaid && x.fav === x.wfav && x.left === 0, { done: x.done, paid: x.paid, wpaid: x.wpaid, fav: x.fav });
  if (x.ch === 'month') check(`${nm}: a month on, the giver's greeting says it came back`, typeof x.back === 'string' && x.back.endsWith(' ' + x.wback), { back: x.back, want: x.wback }); }
check('borrowed: the records are saved', d2.saved >= 5, d2.saved);

// S1776 — errand 6, The Watch: a night by the giver's fold on the clock, from 22:00 to the bell at 05:00; one night in two two of the
// place's cull beast come at 02:00 and must be killed; out of the circle an hour, or the clock jumped (sleep), and it lapses
const d6 = await page.evaluate(() => {
  const site = siteAnywhere('dunmore'); worldState.quests = []; worldState.met = {}; const T0 = 130 * 1440 + 600; worldState.gameTimeAbsMinutes = T0;
  const day0 = Math.floor(T0 / 1440) * 1440, start = day0 + 1320;
  const mk = (i, pp) => { const d = makeDef(site, site.reg || 'irish', seededRng('ertest6', i), 'Villager', 'Seán', {}); d._twin = 'W' + i; if (pp) d.people = pp; return d; };
  const find = (pp, came) => { for (let i = 0; i < 8000; i++) { const d = mk(pp + i, pp); const e = errandFor(d, site); if (!e || e.sub !== 'watch') continue;
    if (came == null || (seededRng('errand-watch-came', erPre(d, site) + e.idx + ':' + start)() < .5) === came) return d; } return null; };
  let n = 0, bad = 0; for (let i = 0; i < 1500; i++) { const d = mk('t' + i, 'gatelander'); const e = errandFor(d, site); if (e && e.sub === 'watch') { n++; if (e.fold !== (ER_WATCH_AT[d.bio.trade] || ER_WATCH_AT.farmer).fold || !ER_WATCH_AT[d.bio.trade] && !ER_WATCH_KINDS.has(site.kind)) bad++; } }
  const step = (q, to, at) => { while (worldState.gameTimeAbsMinutes < to) { worldState.gameTimeAbsMinutes = Math.min(to, worldState.gameTimeAbsMinutes + 20); if (at) { px = at.x; pz = at.z; } qTick(); } };
  const msgs = []; const sm = window.showMsg; window.showMsg = (t, c) => { msgs.push(t); };
  const plan = [['gatelander', true, 'kept'], ['markman', false, 'kept'], ['aurennais', null, 'left'], ['oldblood', null, 'slept']];
  const by = [];
  try { for (const [pp, came, how] of plan) { worldState.gameTimeAbsMinutes = T0; msgs.length = 0; const A = find(pp, came); if (!A) { by.push({ pp, how, missing: true }); continue; } const E = errandFor(A, site);
    A.greeting[0]; const greet = A.greeting[0]; const ask = A.topics.find(t => /^About you/.test(t.label)).follow.find(t => t.label === 'What’s coming at night?');
    const yes = ask.follow[0].fn(); const q = qActive().find(x => x.giver === A.name && x.sub === 'watch'); const d = q.data;
    const notYet = A.topics.find(t => t.label === 'About that errand.').fn(); const at = { x: d.x, z: d.z };
    step(q, start - 30, at); const before = msgs.length;
    let foes = 0, keyed = false;
    const slip = (mode, min) => { openRestSlip(mode, min); const t = document.getElementById('rs-out').textContent; closeSleepUI(); return t.includes(`The night at the ${d.fold} will be lost.`); };
    const pre = { wait1: slip('wait', 60), sleep8: slip('sleep', 480) };
    if (how === 'kept') { step(q, start + 250, at); const F = ER_WATCH_FOES[q.id] || []; foes = F.length; keyed = F.every((e, i) => e.id === q.id + ':foe:' + i && e.name === d.foe);
      step(q, start + 430, at); const early = d.done; F.forEach(e => { e.dead = true; }); step(q, start + 450, at);
      const label = d.came ? `I sat the night. ${d.beasts}.` : 'I sat the night. Nothing came.'; const top = A.topics.find(t => t.label === label);
      const g1 = gold, f1 = favor(site), b1 = bagCount(b => b.name === 'Loaf of Bread'); const done = top && top.fn();
      by.push({ pp, how, came: d.came, want: came, greet, hint: ER_WATCH.hint[pp](E), offer: ask.response, wantOffer: ER_WATCH.offer[pp](E), yes, ys: ER_SHARED[pp].yes, title: q.title, notYet, ny: ER_SHARED[pp].notYet,
        msgs: msgs.slice(before), wmsgs: [ER_WATCH.settle(d), ...(d.came ? [ER_WATCH.moves(d)] : []), ER_WATCH.bell], foes, keyed, early, label, done, wdone: (d.came ? ER_WATCH.came : ER_WATCH.none)[pp](d),
        paid: gold - g1, wpaid: questGold(q.reward), fav: favor(site) - f1, bread: bagCount(b => b.name === 'Loaf of Bread') - b1, turned: q.turnedIn, left: Object.keys(ER_WATCH_FOES).length, pre }); continue; }
    if (how === 'left') { step(q, start + 60, at); px = d.x + 200; pz = d.z; step(q, start + 200, null); }
    else { step(q, start + 30, at); pre.inWait1 = slip('wait', 60); worldState.gameTimeAbsMinutes = start + 240; qTick(); pre.after = slip('wait', 60); }
    const g1 = gold; const top = A.topics.find(t => t.label === 'About that errand.'); const done = top && top.fn(); const again = !!A.topics.find(t => t.label === 'About that errand.');
    by.push({ pp, how, lapsed: q.lapsed, done, wdone: ER_WATCH.lapse[pp](d), paid: gold - g1, again, cold: A.greeting[0], wcold: ER_FEVER.cold[pp], msgs: msgs.slice(before), wleft: ER_WATCH.left(d), offer: ask.response, wantOffer: ER_WATCH.offer[pp](E), pre }); } }
  finally { window.showMsg = sm; }
  return { n, bad, by, saved: JSON.parse(ssStringify(worldState.quests)).filter(x => x.sub === 'watch').length };
});
console.log(JSON.stringify(d6).slice(0, 3000));
check('watch: some givers ask it, each by their trade\'s fold', d6.n > 0 && d6.bad === 0, { n: d6.n, bad: d6.bad });
for (const x of d6.by) { const nm = `watch (${x.pp}, ${x.how})`; if (x.missing) { check(`${nm}: a giver asks`, false); continue; }
  if (x.how !== 'kept') { check(`${nm}: the offer word for word; lapsed, the line once in the giver's words, nothing paid, the colder greeting`, x.offer === x.wantOffer && x.lapsed && x.done === x.wdone && x.paid === 0 && !x.again && x.cold === x.wcold && x.msgs.includes(x.wleft), x); continue; }
  check(`${nm}: the hint after First Words, the offer word for word, taken and titled, not yet`, x.greet.endsWith(' ' + x.hint) && x.offer === x.wantOffer && x.yes === x.ys && /^A night at the /.test(x.title) && x.notYet === x.ny, { greet: x.greet, offer: x.offer, title: x.title });
  check(`${nm}: the night's lines in order (${x.came ? 'they came' : 'nothing came'})`, x.came === x.want && JSON.stringify(x.msgs) === JSON.stringify(x.wmsgs), { msgs: x.msgs, want: x.wmsgs });
  if (x.came) check(`${nm}: two beasts at two, keyed by the errand; the bell waits until they are dead`, x.foes === 2 && x.keyed && !x.early, { foes: x.foes, keyed: x.keyed, early: x.early });
  check(`${nm}: turned in (${x.label}) in the giver's words, paid, a point of favour${x.pp === 'gatelander' ? ', breakfast' : ''}`, x.turned && x.done === x.wdone && x.paid === x.wpaid && x.fav === 1 && x.bread === (x.pp === 'gatelander' ? 1 : 0) && x.left === 0, { done: x.done, paid: x.paid, fav: x.fav, bread: x.bread }); }
// S1789 — the Wait and Sleep slip says the night will be lost when the jump would lapse it (backlog I, s1180), and only then
{ const k = d6.by.find(x => x.how === 'kept' && x.pre), s = d6.by.find(x => x.how === 'slept' && x.pre);
  check('watch: the slip warns of a jump that loses the night, not of an hour\'s wait before it', !!k && !!s && !k.pre.wait1 && k.pre.sleep8 && s.pre.inWait1 && !s.pre.after, { kept: k && k.pre, slept: s && s.pre }); }
check('watch: the records are saved, no live beast in them', d6.saved >= 4, d6.saved);

// S1817 — errand 12, A Prayer Carried: a prayer for the giver's kin at the nearest shrine within 1,200 of the want's god (a Markman for the
// sea or the mine only, an Aurennais at the Weaver's only, an Old Blood giver one line); said at the altar (shrineInteract), even on a quiet
// day; turned in for the pay and a point of favour; seven days, then the lapse
const d12 = await page.evaluate(() => {
  worldState.quests = []; worldState.met = {}; const T0 = 160 * 1440 + 600; worldState.gameTimeAbsMinutes = T0;
  const towns = []; for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) getCell(i, j).sites.forEach(t => { if (t.pad >= 30 && t.kind !== 'shrine' && t.kind !== 'portal') towns.push(t); });
  const mk = (site, i, pp) => { const d = makeDef(site, site.reg || 'irish', seededRng('ertest12', i), 'Villager', 'Seán', {}); d._twin = 'P' + i; if (pp) d.people = pp; return d; };
  const find = (pp, want) => { for (const site of towns) { if (!erGiver(mk(site, 0, pp), site)) continue; for (let i = 0; i < 400; i++) { const d = mk(site, pp + i, pp); const e = errandFor(d, site);
      if (e && e.sub === 'prayer' && (!want || want(e))) return { d, site, e }; } } return null; };
  const bad = { mk: 0, au: 0, n: 0 }; for (const site of towns.slice(0, 40)) for (let i = 0; i < 60; i++) for (const pp of ['markman', 'aurennais']) { const e = errandFor(mk(site, 'b' + pp + i, pp), site);
    if (!e || e.sub !== 'prayer' || e.oldblood) continue; bad.n++; if (pp === 'markman' && !['muir', 'cloch'].includes(e.godKey)) bad.mk++; if (pp === 'aurennais' && e.godKey !== 'fiodoir') bad.au++; }
  const msgs = []; const sm = window.showMsg; window.showMsg = t => msgs.push(t); const by = [];
  const GOD = k => GODS.find(g => g.key === k);
  try { for (const [pp, how] of [['gatelander', 'fresh'], ['markman', 'quiet'], ['aurennais', 'lapse']]) { worldState.gameTimeAbsMinutes = T0; worldState.shrines = {}; msgs.length = 0;
      const F = find(pp); if (!F) { by.push({ pp, missing: true }); continue; } const { d: A, site, e: E } = F; const p = pp;
      A.greeting[0]; const greet = A.greeting[0]; const you = A.topics.find(t => /^About you/.test(t.label)); const ask = you && you.follow.find(t => t.label === 'Who’s the prayer for?');
      const n = Math.min(40, 15 + 5 * (Math.max(1, worldTierAt(site.x, site.z) || 1) - 1)); const wantOffer = ER_PRAYER.offer[p](Object.assign({}, E, { n }));
      const yes = ask.follow[0].fn(); const q = qActive().find(x => x.giver === A.name && x.sub === 'prayer'); const notYet = A.topics.find(t => t.label === 'About that errand.').fn();
      const x = { pp, how, greet, hint: ER_PRAYER.hint[p](E), offer: ask.response, wantOffer, yes, ys: ER_SHARED[p].yes, title: q.title, wtitle: `A prayer at ${erThe(E.shrine)}`, notYet, ny: ER_SHARED[p].notYet, god: E.godKey, shrine: E.shrine };
      if (how === 'lapse') { worldState.gameTimeAbsMinutes = T0 + 8 * 1440; tickDatedWork(); const g1 = gold; const t = A.topics.find(t => t.label === 'About that errand.'); x.done = t && t.fn(); x.wdone = ER_PRAYER.lapse[p]; x.lapsed = q.lapsed; x.paid = gold - g1; x.again = !!A.topics.find(t => t.label === 'About that errand.'); by.push(x); continue; }
      // a stand-in shrine of another god first (nothing said), then one of the errand's god under the player's feet
      const other = GODS.find(g => g.boon && g.key !== E.godKey); const S0 = { site: { id: 'tshr0', kind: 'shrine', name: 'Test Shrine' }, altar: { x: px, z: pz }, god: other };
      SETTLE.set('tshr0', S0); shrineInteract(); SETTLE.delete('tshr0'); x.wrongGod = q.data.prayed;
      const S1 = { site: { id: 'tshr1', kind: 'shrine', name: 'Cill na Muire' }, altar: { x: px, z: pz }, god: GOD(E.godKey) };
      if (how === 'quiet') worldState.shrines.tshr1 = worldState.gameTimeAbsMinutes - 10;
      SETTLE.set('tshr1', S1); msgs.length = 0; shrineInteract(); SETTLE.delete('tshr1');
      x.prayed = q.data.prayed; x.at = q.data.at; x.line = ER_PRAYER.at({ who: E.who, giver: A.name }); x.quietMsg = msgs.slice();
      const label = `I prayed at Cill na Muire.`; const t = A.topics.find(t => t.label === label); const g1 = gold, f1 = favor(site);
      x.done = t && t.fn(); x.wdone = ER_PRAYER.done[p]; x.paid = gold - g1; x.wpaid = questGold(q.reward); x.fav = favor(site) - f1; x.turned = q.turnedIn; by.push(x); }
    // the Old Blood giver: one line, no errand
    const O = find('oldblood'); var ob = O && (() => { const you = O.d.topics.find(t => /^About you/.test(t.label)); const a = you && you.follow.find(t => t.label === 'Can I do anything for you?'); return { said: a && a.response, follow: !!(a && a.follow) }; })();
  } finally { window.showMsg = sm; }
  return { bad, by, ob, OBL: ER_PRAYER.oldblood, saved: JSON.parse(ssStringify(worldState.quests)).filter(x => x.sub === 'prayer').length };
});
console.log(JSON.stringify(d12).slice(0, 3000));
check('prayer: a Markman asks only for the sea or the mine, an Aurennais only at the Weaver\'s shrine', d12.bad.n > 0 && d12.bad.mk === 0 && d12.bad.au === 0, d12.bad);
for (const x of d12.by) { const nm = `prayer (${x.pp}, ${x.how})`; if (x.missing) { check(`${nm}: a giver asks`, false); continue; }
  check(`${nm}: the hint after First Words, the offer word for word, taken and titled, not yet`, x.greet.endsWith(' ' + x.hint) && x.offer === x.wantOffer && x.yes === x.ys && x.title === x.wtitle && x.notYet === x.ny && !/\{|undefined/.test(x.offer), { greet: x.greet, offer: x.offer, title: x.title });
  if (x.how === 'lapse') { check(`${nm}: seven days pass, the lapse in the giver's words, once, nothing paid`, x.lapsed && x.done === x.wdone && x.paid === 0 && !x.again, x); continue; }
  check(`${nm}: another god's altar says nothing of it; the errand's god's altar says it${x.how === 'quiet' ? ', on a quiet day too' : ''}`, !x.wrongGod && x.prayed && x.at === 'Cill na Muire' && (x.how !== 'quiet' || x.quietMsg.includes(x.line)), { msgs: x.quietMsg, line: x.line });
  check(`${nm}: I prayed at …, answered in their words, paid, a point of favour`, x.turned && x.done === x.wdone && x.paid === x.wpaid && x.paid > 0 && x.fav === 1, { done: x.done, paid: x.paid, fav: x.fav }); }
check('prayer: an Old Blood giver has the one line to the ask, and no errand', !!d12.ob && d12.ob.said === d12.OBL && !d12.ob.follow, d12.ob);
check('prayer: the records are saved', d12.saved >= 3, d12.saved);

// S1857 — errand 9, A Fish for the Wedding: a giver in a port or a town within 400 of the sea; a fine fish by the morning of the day for the
// pay and a point of favour, and the wedding's line that day (erWeddingAt, the day's flag for the square and the meal); a plain one for half;
// past the morning, the lapse
const d9 = await page.evaluate(() => {
  worldState.quests = []; worldState.met = {}; const T0 = 180 * 1440 + 600; worldState.gameTimeAbsMinutes = T0;
  const towns = []; for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) getCell(i, j).sites.forEach(t => { if (t.pad >= 30 && t.kind !== 'shrine' && t.kind !== 'portal') towns.push(t); });
  const mk = (site, i, pp) => { const d = makeDef(site, site.reg || 'irish', seededRng('ertest9', i), 'Innkeeper', 'Seán', {}); d._twin = 'F' + i; if (pp) d.people = pp; return d; };
  const find = pp => { for (const site of towns) { if (!erGiver(mk(site, 0, pp), site)) continue; for (let i = 0; i < 300; i++) { const d = mk(site, pp + i, pp); const e = errandFor(d, site);
      if (e && e.sub === 'fish') return { d, site, e }; } } return null; };
  const inland = towns.filter(t => t.kind !== 'port' && !erSeaNear(t)), coast = towns.filter(t => erSeaNear(t));
  let offInland = 0; for (const site of inland.slice(0, 20)) for (let i = 0; i < 60; i++) { const e = errandFor(mk(site, 'in' + i), site); if (e && e.sub === 'fish') offInland++; }
  const by = [];
  for (const [pp, how] of [['gatelander', 'fine'], ['markman', 'plain'], ['aurennais', 'lapse'], ['oldblood', 'fine']]) { worldState.gameTimeAbsMinutes = T0;
    for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i] && BAG[i]._typeKey === 'fish') BAG.splice(i, 1);
    const F = find(pp); if (!F) { by.push({ pp, missing: true }); continue; } const { d: A, site, e: E } = F; const p = pp;
    A.greeting[0]; const greet = A.greeting[0]; const you = A.topics.find(t => /^About you/.test(t.label)); const ask = you && you.follow.find(t => t.label === 'What’s the wedding missing?');
    const n = Math.min(40, 15 + 5 * (Math.max(1, worldTierAt(site.x, site.z) || 1) - 1)); const wantOffer = ER_FISH.offer[p](Object.assign({}, E, { n }));
    const yes = ask.follow[0].fn(); const q = qActive().find(x => x.giver === A.name && x.sub === 'fish'); const notYet = A.topics.find(t => t.label === 'About that errand.').fn();
    const x = { pp, how, greet, hint: ER_FISH.hint[p](E), offer: ask.response, wantOffer, yes, ys: ER_SHARED[p].yes, title: q.title, notYet, ny: ER_SHARED[p].notYet, days: E.wday - Math.floor(T0 / 1440), sea: erSeaNear(site) };
    if (how === 'lapse') { worldState.gameTimeAbsMinutes = E.wday * 1440 + 400; tickDatedWork(); bagAdd({ name: 'Fine Cod', ico: '🐟', type: 'misc', weight: 1.2, qty: 1, _typeKey: 'fish' });
      const g1 = gold; const t = A.topics.find(t => t.label === 'About that errand.'); x.done = t && t.fn(); x.wdone = ER_FISH.lapse[p]; x.lapsed = q.lapsed; x.paid = gold - g1; x.again = !!A.topics.find(t => t.label === 'About that errand.'); by.push(x); continue; }
    worldState.gameTimeAbsMinutes = E.wday * 1440 + 300; tickDatedWork();
    const fine = how === 'fine'; bagAdd({ name: fine ? 'Fine Cod' : 'Cod', ico: '🐟', type: 'misc', weight: 1, qty: 1, _typeKey: 'fish' });
    const label = fine ? 'A fine cod, for the table.' : 'It’s not a fine one. It’s what I could get.'; const t = A.topics.find(t => t.label === label);
    const g1 = gold, f1 = favor(site); x.done = t && t.fn(); x.wdone = fine ? ER_FISH.fine[p]({ n, weekday: E.weekday }) : ER_FISH.plain[p]; x.paid = gold - g1; x.wpaid = questGold(fine ? n : Math.round(n / 2)); x.fav = favor(site) - f1; x.turned = q.turnedIn;
    x.left = bagCount(b => b._typeKey === 'fish' && b.name === (fine ? 'Fine Cod' : 'Cod'));
    worldState.gameTimeAbsMinutes = E.wday * 1440 + 600; x.wed = A.greeting[0]; x.wwed = ER_FISH.wed[p]; x.on = erWeddingAt(site.id); x.mine = !!erWeddingQ(site.id, erRecs(A, site));
    { const inn = { id: 'g_' + site.id + '_inn9' + pp, siteId: site.id }, st = b => b && b.name === 'Hot Stew', n0 = bagCount(st); x.feast = !!feastOn(absMin()); x.meal = feastMeal(inn); x.meal2 = feastMeal(inn); x.stew = bagCount(st) - n0; } /* S1859 — the wedding's meal at the inn */
    worldState.gameTimeAbsMinutes = E.wday * 1440 + 1500; x.off = erWeddingAt(site.id); x.mealOff = feastOn(absMin()) ? null : feastMeal({ id: 'g_' + site.id + '_inn9' + pp, siteId: site.id }); by.push(x); }
  return { inland: inland.length, coast: coast.length, offInland, by, saved: JSON.parse(ssStringify(worldState.quests)).filter(x => x.sub === 'fish').length };
});
console.log(JSON.stringify(d9).slice(0, 3000));
check('fish: never asked inland, and the coast has towns to ask in', d9.offInland === 0 && d9.coast > 0, { inland: d9.inland, coast: d9.coast, off: d9.offInland });
for (const x of d9.by) { const nm = `fish (${x.pp}, ${x.how})`; if (x.missing) { check(`${nm}: a giver asks`, false); continue; }
  check(`${nm}: the hint after First Words, the offer word for word, taken and titled, not yet; four to six days`, x.sea && x.greet.endsWith(' ' + x.hint) && x.offer === x.wantOffer && x.yes === x.ys && x.title === 'A fish for the wedding' && x.notYet === x.ny && x.days >= 4 && x.days <= 6 && !/\{|undefined/.test(x.offer + x.hint), { greet: x.greet, offer: x.offer, days: x.days });
  if (x.how === 'lapse') { check(`${nm}: past the morning of the day, the lapse in the giver's words, once, nothing paid`, x.lapsed && x.done === x.wdone && x.paid === 0 && !x.again, x); continue; }
  check(`${nm}: the ${x.how} fish taken, answered in their words, ${x.how === 'fine' ? 'paid in full' : 'half paid'}, a point of favour`, x.turned && x.done === x.wdone && x.paid === x.wpaid && x.paid > 0 && x.fav === 1 && x.left === 0, { done: x.done, paid: x.paid, wpaid: x.wpaid, fav: x.fav });
  if (x.how === 'fine' && !x.feast) check(`${nm}: the town's inn gives the wedding's stew on the house that day, once, and not the day after`, x.meal && !x.meal2 && x.stew === 1 && x.mealOff !== true, { meal: x.meal, again: x.meal2, stew: x.stew, after: x.mealOff });
  if (x.how === 'plain') check(`${nm}: a plain fish brings no meal of its own: the inn's stew only if the town keeps another's wedding or a feast that day`, x.meal === !!(x.on || x.feast), { meal: x.meal, wedding: x.on, feast: x.feast });
  if (x.how === 'fine') check(`${nm}: on the day, the wedding's greeting and the day's flag; gone the day after`, x.wed === x.wwed && x.on && !x.off, { wed: x.wed, on: x.on, off: x.off });
  else check(`${nm}: a plain fish keeps no wedding for you`, x.wed !== x.wwed && !x.mine, { wed: x.wed }); }
check('fish: the records are saved', d9.saved >= 3, d9.saved);

// S1908 — errand 10, A Rubbing to Be Read: the nearest carved gate within 900; read by the Mages' Guild head (the English), an Old Blood
// townsperson within 900 (the word's plain sense, and burn it), or by you at Mastery; each label at the giver only once you have it; half for
// Nobody could read it; burn it gives you the gate's rubbing. Never from an Old Blood giver.
const d10 = await page.evaluate(() => {
  worldState.quests = []; worldState.met = {}; const T0 = 220 * 1440 + 600; worldState.gameTimeAbsMinutes = T0;
  const towns = []; for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) getCell(i, j).sites.forEach(t => { if (t.pad >= 30 && t.kind !== 'shrine' && t.kind !== 'portal') towns.push(t); });
  const mk = (site, i, pp) => { const d = makeDef(site, site.reg || 'irish', seededRng('ertest10', i), 'Villager', 'Seán', {}); d._twin = 'R' + i; if (pp) d.people = pp; return d; };
  const find = (pp, ok) => { for (const site of towns) { if (!erGiver(mk(site, 0, pp), site)) continue; for (let i = 0; i < 400; i++) { const d = mk(site, pp + i, pp); const e = errandFor(d, site);
      if (e && e.sub === 'rub' && (!ok || ok(e))) return { d, site, e }; } } return null; };
  let obAsk = 0; for (const site of towns.slice(0, 15)) for (let i = 0; i < 80; i++) { const e = errandFor(mk(site, 'ob' + i, 'oldblood'), site); if (e && e.sub === 'rub') obAsk++; }
  const by = [];
  for (const [pp, how] of [['gatelander', 'guild'], ['markman', 'old'], ['aurennais', 'burn'], ['gatelander', 'mine'], ['markman', 'none']]) { worldState.gameTimeAbsMinutes = T0;
    worldState.sigilsRead = {}; knownWords = {}; for (let i = BAG.length - 1; i >= 0; i--) if (BAG[i] && BAG[i].type === 'rubbing') BAG.splice(i, 1);
    const F = find(pp, how === 'mine' ? e => !!WORD_BY[e.word].nameMa : how === 'old' || how === 'burn' ? e => !!ER_RUB_SENSE[e.word] : null); if (!F) { by.push({ pp, how, missing: true }); continue; }
    const { d: A, site, e: E } = F, p = pp, o = erRubWords(E);
    A.greeting[0]; const greet = A.greeting[0]; const you = A.topics.find(t => /^About you/.test(t.label)); const ask = you && you.follow.find(t => t.label === 'What does the rubbing say?');
    const n = Math.min(40, 15 + 5 * (Math.max(1, worldTierAt(site.x, site.z) || 1) - 1)); const wantOffer = ER_RUB.offer[p](Object.assign({}, E, { gate: erGateIn(E.gate), n }));
    const yes = ask && ask.follow[0].fn(); const q = qActive().find(x => x.giver === A.name && x.sub === 'rub');
    const x = { pp, how, greet, hint: ER_RUB.hint[p], offer: ask && ask.response, wantOffer, yes, ys: ER_SHARED[p].yes, title: q && q.title, item: bagCount(b => b.erRub === (q && q.id)),
      near: Math.hypot(E.gx - site.x, E.gz - site.z), before: A.topics.filter(t => t.quest).map(t => t.label) };
    let readSay = null, want = null, readerFav = null;
    if (how === 'guild') { const head = guildDef('guild_m', site); const t = head.topics.find(t => t.label === 'Can you read this?'); readSay = t && t.fn(); want = ER_RUB.guild[head.people] ? ER_RUB.guild[head.people](o) : ER_RUB.guild.markman(o); readerFav = site.id; }
    if (how === 'old' || how === 'burn') { const R = mk(site, 'reader' + how, 'oldblood'); const t = R.topics.find(t => t.label === 'Can you read this?'); readSay = t && t.fn(); want = ER_RUB.old(o); readerFav = site.id; x.fold = GAME_LOG.length >= 0; }
    if (how === 'mine') { worldState.sigilsRead[E.seed] = E.word; knownWords[E.word] = 3; const it = BAG.find(b => b.erRub === q.id); x.look = erRubLook(it); x.wlook = ER_RUB.look[3](o); const sm = window.showMsg; let said = null; window.showMsg = (m, ...r) => { said = m; return sm(m, ...r); }; try { useItem(BAG.indexOf(it)); } finally { window.showMsg = sm; } x.used = said; x.kept = BAG.includes(it); }
    if (how === 'none') { const R = mk(site, 'notob', 'gatelander'); x.noReader = !R.topics.find(t => t.label === 'Can you read this?'); }
    x.readSay = readSay; x.want = want;
    const label = ER_RUB.told[how](o); x.labels = A.topics.filter(t => t.quest).map(t => t.label);
    const t = A.topics.find(t => t.label === label); const g1 = gold, f1 = favor(site);
    x.done = t && t.fn(); x.wdone = how === 'guild' ? ER_RUB.guildSaid[p](o) : how === 'old' ? ER_RUB.oldSaid[p](o) : how === 'mine' ? ER_RUB.mineSaid[p](o) : how === 'burn' ? ER_RUB.burnSaid[p] : ER_RUB.noneSaid[p];
    x.paid = gold - g1; x.wpaid = questGold(how === 'none' ? Math.round(n / 2) : n); x.fav = favor(site) - f1; x.turned = q.turnedIn; x.left = bagCount(b => b.erRub === q.id);
    x.rubbing = bagCount(b => b.type === 'rubbing' && b.seed === E.seed && b.name === `Rubbing: ${E.gate}`); by.push(x); }
  return { obAsk, by, saved: JSON.parse(ssStringify(worldState.quests)).filter(x => x.sub === 'rub').length };
});
console.log(JSON.stringify(d10).slice(0, 3500));
check('rubbing: an Old Blood giver never asks it', d10.obAsk === 0, d10.obAsk);
for (const x of d10.by) { const nm = `rubbing (${x.pp}, ${x.how})`; if (x.missing) { check(`${nm}: a giver asks`, false); continue; }
  check(`${nm}: the hint after First Words, the offer word for word, taken and titled, the giver's rubbing in the bag, a gate within 900`, x.greet.endsWith(' ' + x.hint) && x.offer === x.wantOffer && x.yes === x.ys && x.title === 'What the rubbing says' && x.item === 1 && x.near <= 900 && !/\{|undefined|null/.test(x.offer), { greet: x.greet, offer: x.offer, near: x.near });
  check(`${nm}: before a reading, only Nobody could read it`, x.before.length === 1 && x.before[0] === 'Nobody could read it.', x.before);
  if (x.how === 'guild' || x.how === 'old' || x.how === 'burn') check(`${nm}: the reader's words`, x.readSay === x.want && !/undefined|null/.test(x.readSay), { said: x.readSay, want: x.want });
  if (x.how === 'mine') check(`${nm}: looking at it, your Mastery's reading`, x.look === x.wlook && !/null|undefined/.test(x.look), { look: x.look });
  if (x.how === 'mine') check(`${nm}: used from the bag, the same reading, and the rubbing kept`, x.used === x.wlook && x.kept, { used: x.used, kept: x.kept });
  if (x.how === 'none') check(`${nm}: a townsperson not of the Old Blood cannot read it`, x.noReader);
  check(`${nm}: told, answered in their words, ${x.how === 'none' ? 'half' : 'in full'}, a point of favour, the lent rubbing gone`, x.turned && x.done === x.wdone && x.paid === x.wpaid && x.paid > 0 && x.fav >= 1 && x.left === 0, { labels: x.labels, done: x.done, paid: x.paid, wpaid: x.wpaid, fav: x.fav });
  check(`${nm}: ${x.how === 'burn' ? 'burn it gives you the gate’s rubbing' : 'no rubbing of yours'}`, x.how === 'burn' ? x.rubbing === 1 : x.rubbing === 0, x.rubbing); }
check('rubbing: the records are saved', d10.saved >= 4, d10.saved);

// S1947 — errand 7, The Stuck Cart: a carter, farmer, cooper or trader's cart in the ditch 150 to 300 along a road out of town; E at it
// (the world's prompt); lifted at Might 5, or unloaded for two hours, when one time in three on the errand's id (on a road not cleared) two
// bandits come up the road, and killing them is a point more; turned in for the pay; fourteen days, the lapse
const d7 = await page.evaluate(() => {
  worldState.quests = []; worldState.met = {}; worldState.roadsCleared = {}; const T0 = 260 * 1440 + 600; worldState.gameTimeAbsMinutes = T0;
  const towns = []; for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) getCell(i, j).sites.forEach(t => { if (t.pad >= 30 && t.kind !== 'shrine' && t.kind !== 'portal') towns.push(t); });
  const mk = (site, i, pp) => { const d = makeDef(site, site.reg || 'irish', seededRng('ertest7', i), 'Villager', 'Seán', {}); d._twin = 'C' + i; if (pp) d.people = pp; return d; };
  const find = (pp, ok) => { for (const site of towns) { if (!erGiver(mk(site, 0, pp), site)) continue; for (let i = 0; i < 500; i++) { const d = mk(site, pp + i, pp); const e = errandFor(d, site);
      if (e && e.sub === 'cart' && (!ok || ok(d, site, e))) return { d, site, e }; } } return null; };
  let wrongTrade = 0; for (const site of towns.slice(0, 15)) for (let i = 0; i < 80; i++) { const d = mk(site, 'wt' + i); const e = errandFor(d, site); if (e && e.sub === 'cart' && !ER_CART_TRADES.has(d.bio.trade)) wrongTrade++; }
  const band = (d, site, e) => seededRng('errand', erPre(d, site) + e.idx + ':band')() < 1 / 3;
  const by = [];
  for (const [pp, how] of [['gatelander', 'lift'], ['markman', 'stuck'], ['aurennais', 'band'], ['oldblood', 'lapse']]) { worldState.gameTimeAbsMinutes = T0; ATTRS.might = how === 'lift' ? 5 : 0;
    const F = find(pp, how === 'band' ? band : how === 'stuck' ? (d, s, e) => !band(d, s, e) : null); if (!F) { by.push({ pp, how, missing: true }); continue; }
    const { d: A, site, e: E } = F, p = pp;
    A.greeting[0]; const greet = A.greeting[0]; const you = A.topics.find(t => /^About you/.test(t.label)); const ask = you && you.follow.find(t => t.label === 'Where’s your cart?');
    const wantOffer = ER_CART.offer[p](E); const yes = ask && ask.follow[0].fn(); const q = qActive().find(x => x.giver === A.name && x.sub === 'cart');
    const notYet = A.topics.find(t => t.label === 'About that errand.'); const x = { pp, how, greet, hint: ER_CART.hint[p], offer: ask && ask.response, wantOffer, yes, ys: ER_SHARED[p].yes, title: q && q.title, wtitle: A.name + "'s cart",
      notYet: notYet && notYet.fn(), ny: ER_SHARED[p].notYet, along: Math.hypot(E.x - site.x, E.z - site.z), trade: A.bio.trade };
    if (how === 'lapse') { worldState.gameTimeAbsMinutes = q.erDue + 5; qTick(); const t = A.topics.find(t => t.label === 'About that errand.'); const g1 = gold; x.done = t && t.fn(); x.wdone = ER_CART.lapse[p]; x.lapsed = q.lapsed; x.paid = gold - g1;
      x.again = !!A.topics.find(t => t.label === 'About that errand.'); by.push(x); continue; }
    px = q.data.x; pz = q.data.z; qTick(); x.mesh = !!(ER_CART_LIVE[q.id] && ER_CART_LIVE[q.id].m && ER_CART_LIVE[q.id].m.parent);
    { const D = erCartDitch(q.data), sx = Math.sin(q.data.ang), sz = Math.cos(q.data.ang); x.beside = [1, -1].map(k => { px = D.x + sx * 1.6 * k + Math.cos(q.data.ang) * .9; pz = D.z + sz * 1.6 * k - Math.sin(q.data.ang) * .9; return WORLD.shipPrompt(); }); }
    px = q.data.x; pz = q.data.z; x.prompt = WORLD.shipPrompt();
    x.opened = erCartInteract() && dlgOpen; x.slip = document.getElementById('dlg-text') && document.getElementById('dlg-text').textContent; try { closeDialog(); } catch (e) {}
    if (how === 'stuck') { x.liftNo = !liftCart(q.id) && !q.data.shifted; worldState.roadsCleared[q.data.ra + '|' + q.data.rb] = T0; }
    if (how === 'lift') x.lifted = liftCart(q.id);
    else { const t0 = worldState.gameTimeAbsMinutes; unloadCart(q.id); x.hours = (worldState.gameTimeAbsMinutes - t0) / 60; x.band = q.data.band;
      const F2 = (ER_CART_LIVE[q.id] && ER_CART_LIVE[q.id].foes) || []; x.foes = F2.length; x.foeIds = F2.map(e => e.id);
      if (how === 'band') { F2.forEach(e => { e.dead = true; }); qTick(); x.killed = q.data.band; } }
    x.shifted = q.data.shifted; x.label = A.topics.filter(t => t.quest).map(t => t.label);
    { const m = ER_CART_LIVE[q.id] && ER_CART_LIVE[q.id].m; x.setDown = m ? { you: +Math.hypot(m.position.x - px, m.position.z - pz).toFixed(2), town: Math.hypot(m.position.x - site.x, m.position.z - site.z) < Math.hypot(q.data.x - site.x, q.data.z - site.z), off: +Math.hypot(m.position.x - q.data.x, m.position.z - q.data.z).toFixed(2), kept: q.data.sx === +m.position.x.toFixed(2) } : null; }
    px = site.x; pz = site.z; qTick(); x.goneAway = !(ER_CART_LIVE[q.id] && ER_CART_LIVE[q.id].m);
    const t = A.topics.find(t => t.label === ER_CART.told); const g1 = gold, f1 = favor(site); x.done = t && t.fn();
    x.wdone = how === 'band' ? ER_CART.done[p] + ' ' + ER_CART.road[p] : ER_CART.done[p]; x.paid = gold - g1; x.wpaid = questGold(E.n); x.fav = favor(site) - f1; x.turned = q.turnedIn; by.push(x); }
  ATTRS.might = 0;
  return { wrongTrade, by, saved: JSON.parse(ssStringify(worldState.quests)).filter(x => x.sub === 'cart').length };
});
console.log(JSON.stringify(d7).slice(0, 3500));
check('cart: only a carter, a farmer, a cooper or a trader asks it', d7.wrongTrade === 0, d7.wrongTrade);
for (const x of d7.by) { const nm = `cart (${x.pp}, ${x.how})`; if (x.missing) { check(`${nm}: a giver asks`, false); continue; }
  check(`${nm}: the hint after First Words, the offer word for word, taken and titled, not yet; the cart on a road out of town`, x.greet.endsWith(' ' + x.hint) && x.offer === x.wantOffer && x.yes === x.ys && x.title === x.wtitle && x.notYet === x.ny && x.along <= 320 && !/\{|undefined|null/.test(x.offer), { greet: x.greet, offer: x.offer, along: x.along, trade: x.trade });
  if (x.how === 'lapse') { check(`${nm}: fourteen days pass, the lapse in the giver's words, once, nothing paid`, x.lapsed && x.done === x.wdone && x.paid === 0 && !x.again, x); continue; }
  check(`${nm}: at the cart, its mesh, the prompt and the slip`, x.mesh && x.prompt === "Press 'E' to see to the cart" && x.opened && x.slip === 'The cart lies nose down in the ditch, one wheel off the ground.', { prompt: x.prompt, slip: x.slip });
  check(`${nm}: the prompt beside the cart in the ditch, on either side of it (S1961)`, x.beside.every(p => p === "Press 'E' to see to the cart"), x.beside);
  check(`${nm}: shifted, the cart is set down on the road toward the town, clear of you (${x.setDown && x.setDown.you} m)`, x.setDown && x.setDown.you >= 5 && x.setDown.town && x.setDown.off >= 8 && x.setDown.kept, x.setDown);
  if (x.how === 'lift') check(`${nm}: lifted at Might 5`, x.lifted && x.shifted);
  if (x.how === 'stuck') check(`${nm}: at Might 0 it does not shift; unloaded, two hours, no bandits on a cleared road`, x.liftNo && x.shifted && x.hours === 2 && !x.band && x.foes === 0, x);
  if (x.how === 'band') check(`${nm}: unloaded, two hours, two bandits come up the road, keyed by the errand, and killed`, x.shifted && x.hours === 2 && x.band === 'came' && x.foes === 2 && x.foeIds.every(i => i.includes(':foe:')) && x.killed === 'killed', x);
  check(`${nm}: the cart gone from the road once you are away`, x.goneAway);
  check(`${nm}: Your cart's out of the ditch., answered in their words, paid, ${x.how === 'band' ? 'two points' : 'a point'} of favour`, x.turned && x.done === x.wdone && x.paid === x.wpaid && x.paid > 0 && x.fav === (x.how === 'band' ? 2 : 1), { labels: x.label, done: x.done, paid: x.paid, fav: x.fav }); }
check('cart: the records are saved', d7.saved >= 3, d7.saved);

// S1981 — errand 8, The Child at the Gate: a giver with children, an old gate within 700; the child at its door when you come within 200,
// Home. Now. or Show me (a carved gate starred on the map, the warm line; else the cold one); the child walks home behind you; turned in
// for the pay, a point of favour for Home. Now. only; the third day, the lapse
const d8 = await page.evaluate(() => {
  worldState.quests = []; worldState.met = {}; worldState.rubbings = {}; const T0 = 300 * 1440 + 600; worldState.gameTimeAbsMinutes = T0;
  const towns = []; for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) getCell(i, j).sites.forEach(t => { if (t.pad >= 30 && t.kind !== 'shrine' && t.kind !== 'portal') towns.push(t); });
  const mk = (site, i, pp) => { const d = makeDef(site, site.reg || 'irish', seededRng('ertest8', i), 'Villager', 'Seán', {}); d._twin = 'K' + i; if (pp) d.people = pp; return d; };
  const find = (pp, ok) => { for (const site of towns) { if (!erGiver(mk(site, 0, pp), site)) continue; for (let i = 0; i < 500; i++) { const d = mk(site, pp + i, pp); const e = errandFor(d, site);
      if (e && e.sub === 'child' && (!ok || ok(d, site, e))) return { d, site, e }; } } return null; };
  let wrong = 0, far = 0; for (const site of towns.slice(0, 15)) for (let i = 0; i < 80; i++) { const d = mk(site, 'wk' + i); const e = errandFor(d, site); if (e && e.sub === 'child') { if (!(d.bio.kids > 0)) wrong++; if (Math.hypot(e.gx - site.x, e.gz - site.z) > 700) far++; } }
  const warm = (d, s, e) => !!gateCarving(e.seed), cold = (d, s, e) => !gateCarving(e.seed);
  const by = [];
  for (const [pp, how] of [['gatelander', 'now'], ['markman', 'warm'], ['aurennais', 'cold'], ['oldblood', 'lapse']]) { worldState.gameTimeAbsMinutes = T0;
    const F = find(pp, how === 'warm' ? warm : how === 'cold' ? cold : null) || (how === 'warm' || how === 'cold' ? find(pp) : null); if (!F) { by.push({ pp, how, missing: true }); continue; }
    const { d: A, site, e: E } = F, p = pp, isWarm = !!gateCarving(E.seed);
    A.greeting[0]; const greet = A.greeting[0]; const you = A.topics.find(t => /^About you/.test(t.label)); const ask = you && you.follow.find(t => t.label === 'Who’s not back?');
    const wantOffer = ER_CHILD.offer[p](erPro(Object.assign({}, E, { gate: erGateIn(E.gate) }))); const yes = ask && ask.follow[0].fn(); const q = qActive().find(x => x.giver === A.name && x.sub === 'child');
    const notYet = A.topics.find(t => t.label === 'About that errand.');
    const x = { pp, how, isWarm, greet, hint: ER_CHILD.hint[p](erPro(E)), offer: ask && ask.response, wantOffer, yes, ys: ER_SHARED[p].yes, title: q && q.title, wtitle: E.who + ' at ' + erGateIn(E.gate),
      notYet: notYet && notYet.fn(), ny: ER_SHARED[p].notYet, kids: A.bio.kids, gateFar: Math.hypot(E.gx - site.x, E.gz - site.z) };
    if (how === 'lapse') { px = E.gx + 300; pz = E.gz; worldState.gameTimeAbsMinutes = q.erDue + 5; qTick(); const t = A.topics.find(t => t.label === 'About that errand.'); const g1 = gold; x.done = t && t.fn(); x.wdone = ER_CHILD.lapse[p](erChildO(q)); x.lapsed = q.lapsed; x.paid = gold - g1;
      x.again = !!A.topics.find(t => t.label === 'About that errand.'); by.push(x); continue; }
    px = E.gx + 250; pz = E.gz; qTick(); x.farNone = !q._npc;
    px = E.gx + 150; pz = E.gz; qTick(); const n = q._npc; x.spawned = !!n && Math.hypot(n.g.position.x - E.gx, n.g.position.z - E.gz) < 3;
    x.child = n && n.def.role === 'Child'; x.body = n && n.g && n.g.parent === sc; x.cgreet = n && n.def.greeting[0]; x.wgreet = ER_CHILD.greet[p];
    const ct = n && n.def.topics.find(t => t.quest); x.ctl = ct && ct.label; x.wctl = `Your ${q.data.pa} wants you home.`; x.cat = ct && ct.response; x.wat = ER_CHILD.at[p];
    x.labels = ct ? ct.follow.map(f => f.label) : [];
    const pick = how === 'now' ? ct.follow[0] : ct.follow[1]; x.said = pick.fn(); x.wsaid = how === 'now' ? '' : isWarm ? ER_CHILD.warm[p] : ER_CHILD.cold[p];
    x.starred = !!worldState.rubbings[E.seed]; x.choice = q.data.choice; x.gone = !(n.def.topics.find(t => t.quest));
    x.early = A.topics.find(t => t.label === 'About that errand.'); x.early = x.early && x.early.fn();
    px = E.gx + 10; pz = E.gz; qTick(); x.follows = q._npc === n && Math.hypot(n.g.position.x - px, n.g.position.z - pz) < 41;
    px = site.x; pz = site.z; qTick(); x.home = q.data.home && !q._npc && !npcs.includes(n);
    const t = A.topics.find(t => t.label === `${E.who} is home.`); const g1 = gold, f1 = favor(site); x.done = t && t.fn();
    x.wdone = (how === 'now' ? ER_CHILD.homeNow : ER_CHILD.shown)[p](erChildO(q)); x.paid = gold - g1; x.wpaid = questGold(E.n); x.fav = favor(site) - f1; x.turned = q.turnedIn; by.push(x); }
  return { wrong, far, by, saved: JSON.parse(ssStringify(worldState.quests)).filter(x => x.sub === 'child').length };
});
console.log(JSON.stringify(d8).slice(0, 3500));
check('child: only a giver with children asks it, at a gate within 700', d8.wrong === 0 && d8.far === 0, d8);
for (const x of d8.by) { const nm = `child (${x.pp}, ${x.how})`; if (x.missing) { check(`${nm}: a giver asks`, false); continue; }
  check(`${nm}: the hint after First Words, the offer word for word, taken and titled, not yet`, x.greet.endsWith(' ' + x.hint) && x.offer === x.wantOffer && x.yes === x.ys && x.title === x.wtitle && x.notYet === x.ny && !/\{|undefined|null/.test(x.offer + x.hint), { greet: x.greet, offer: x.offer });
  if (x.how === 'lapse') { check(`${nm}: the third day, the lapse in the giver's words, once, nothing paid`, x.lapsed && x.done === x.wdone && x.paid === 0 && !x.again, x); continue; }
  check(`${nm}: the child stands at the door within 200 and not before, a child's body, the greeting and the line`, x.farNone && x.spawned && x.child && x.body && x.cgreet === x.wgreet && x.ctl === x.wctl && x.cat === x.wat && x.labels.join('|') === 'Home. Now.|Show me what you found, then home.', x);
  check(`${nm}: ${x.how === 'now' ? 'home now, nothing starred' : x.isWarm ? 'shown the warm stone, the gate starred' : 'shown, the cold line, nothing starred'}`, x.said === x.wsaid && x.choice === (x.how === 'now' ? 'now' : 'show') && x.starred === (x.how !== 'now' && x.isWarm) && x.gone, { said: x.said, starred: x.starred });
  check(`${nm}: not yet while the child walks; the child follows, and is home inside the town`, x.early === x.ny && x.follows && x.home, x);
  check(`${nm}: is home., answered in their words, paid, ${x.how === 'now' ? 'a point' : 'no'} favour`, x.turned && x.done === x.wdone && x.paid === x.wpaid && x.paid > 0 && x.fav === (x.how === 'now' ? 1 : 0), { done: x.done, paid: x.paid, fav: x.fav }); }
check('child: the records are saved, the child is not', d8.saved >= 3, d8.saved);

check('no page errors', g.errs.length === 0, g.errs);
await g.close();
