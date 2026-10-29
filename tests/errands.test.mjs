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
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
