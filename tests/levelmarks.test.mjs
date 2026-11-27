// The level on marks (Session 952; skills and perks A, the build sheet's second session; Michael's B on #342): every
// skill-up counts toward the level, a major's or minor's as a mark and any other as a quarter, and a level takes ten marks
// plus half the level. At a bed you place 12 points, at most 5 in one attribute and each to 60, pre-lit in proportion to
// what rose under each attribute. The build sheet's `levelmarks` and `levelsheet` are one boot; the creator's majors and
// minors, the Skills tab and the old save's banked xp are checked in it too.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  const out = {}; ACTIVE_BUFFS.length = 0; level = 1; levelMarks = 0; levelUps = {}; _lvlReadyShown = false;
  skillsChoose(['blade', 'guard', 'armour', 'athletics', 'speech'], ['bow', 'stealth', 'locks', 'cooking', 'gaoth']);
  out.need = [1, 2, 3, 4, 5, 6, 10, 20].map(L => marksNeeded(L));
  // a skill-up by its cost: one use a level, each on its own target so the once-a-second rule lets it through
  let t = 0; const up = (id) => { const s = SKILLS[id]; s.p = skillCost(s.lv) - 1; skillUse(id, 1, 'lm' + (t++)); };
  for (let i = 0; i < 4; i++) up(['blade', 'guard', 'armour', 'bow', 'stealth'][i % 5]);
  out.four = { marks: levelMarks, ready: levelReady() };
  up('stealth'); out.five = { marks: levelMarks, ready: levelReady() };
  for (let i = 5; i < 10; i++) up(['blade', 'guard', 'armour', 'bow', 'stealth'][i % 5]);
  up('blade'); out.eleven = { marks: levelMarks, ready: levelReady() };
  // take it: the bed
  const hp0 = maxHP, st0 = maxStamina; const a0 = { ...ATTRS };
  out.took = takeLevelIfReady(); out.afterTake = { level, marks: levelMarks };
  // the pre-lit sheet: Blade 3, Guard 2, Armour 2, Bow 2, Stealth 2 rose → Might 3, Resolve 2, Fortitude 2, Finesse 4 of 11; 12 in proportion is 3.3, 2.2, 2.2, 4.4, and the last point goes to the largest remainder, Finesse
  out.prelit = { ...luPts }; out.placed = luTotal(); out.cards = document.querySelectorAll('#lu-attrs .lu-attr').length;
  out.rose = (document.querySelector('#lu-attrs .lu-attr[data-key="might"] .lu-attr-rose') || {}).textContent;
  out.sub = document.getElementById('lu-sub').textContent;
  // move points: a sixth in one row is refused; the confirm waits for all 12
  for (const k in luPts) luPts[k] = 0; luRender();
  for (let i = 0; i < 5; i++) luAdd('fortitude', 1); out.sixth = luAdd('fortitude', 1); out.fort = luPts.fortitude;
  out.confirmEarly = confirmLevelUp(); out.disabledEarly = document.getElementById('lu-confirm').disabled;
  for (let i = 0; i < 5; i++) luAdd('might', 1); luAdd('finesse', 1); luAdd('finesse', 1); out.thirteenth = luAdd('swiftness', 1);
  out.hpShown = document.getElementById('lu-hpgain').textContent; out.enabled = !document.getElementById('lu-confirm').disabled;
  out.confirmed = confirmLevelUp();
  out.gain = { fort: ATTRS.fortitude - a0.fortitude, might: ATTRS.might - a0.might, fin: ATTRS.finesse - a0.finesse, other: Object.keys(ATTRS).filter(k => !['fortitude', 'might', 'finesse'].includes(k) && ATTRS[k] !== a0[k]),
    hp: maxHP - hp0, st: maxStamina - st0, ups: Object.keys(levelUps).length };
  // non-major skills: a quarter each, so twenty-four make the next level (6 needed at level 2, S2722)
  levelMarks = 0; levelUps = {};
  for (let i = 0; i < 20; i++) up(['tine', 'alchemy', 'mining', 'joinery'][i % 4]);
  out.forty = { marks: levelMarks, need: marksNeeded(), ready: levelReady() };
  for (let i = 0; i < 4; i++) up('woodcutting'); out.fortyFour = { marks: levelMarks, ready: levelReady() };
  // the cap: an attribute at 58 has room for 2
  ATTRS.charisma = 58; out.room = luRoom('charisma'); ATTRS.charisma = a0.charisma;
  // the Skills tab
  openHub(); hubTab('skills'); out.tab = { rows: document.querySelectorAll('#skill-rows .sk-row').length, first: (document.querySelector('#skill-rows .sk-row') || {}).dataset?.skill, head: document.getElementById('skill-head').textContent };
  closeHub();
  // the bed's old row: the save carries the marks and this level's skill-ups
  const p = JSON.parse(ssStringify(_buildSavePayload())); out.saved = { marks: p.levelMarks, ups: p.levelUps && p.levelUps.woodcutting };
  return out; });
console.log(JSON.stringify(r));
check(`levelmarks: levels 2 to 6 take 5 to 9 marks, then 10 + half the level (#2059 D): ${r.need.join(', ')} at 1–6, 10, 20`, r.need.join() === '5,6,7,8,9,13,15,20', r.need);
check(`levelmarks: four major and minor skill-ups are ${r.four.marks} marks, not yet a level at 1; the fifth banks it`, r.four.marks === 4 && !r.four.ready && r.five.marks === 5 && r.five.ready && r.eleven.marks === 11, r);
check(`levelmarks: the bed takes it: level ${r.afterTake.level}, ${r.afterTake.marks} marks carried`, r.took && r.afterTake.level === 2 && Math.abs(r.afterTake.marks - 6) < 1e-9, r.afterTake);
const P = r.prelit;
check(`levelsheet: 12 pre-lit by what rose (Might ${P.might}, Resolve ${P.resolve}, Fortitude ${P.fortitude}, Finesse ${P.finesse}); *${r.rose}*`,
  r.placed === 12 && P.might === 3 && P.finesse === 5 && P.resolve === 2 && P.fortitude === 2 && /Blade \+3 this level/.test(r.rose) && r.cards === 8, r);
check('levelsheet: a sixth point in one attribute is refused', r.sixth === false && r.fort === 5, r);
check('levelsheet: the confirm waits for all 12, and a thirteenth is refused', r.confirmEarly === false && r.disabledEarly && r.thirteenth === false && r.enabled, r);
check(`levelsheet: placed and confirmed: Fortitude +5, Might +5, Finesse +2, nothing else; ${r.hpShown} shown, +${r.gain.hp} health, +${r.gain.st} stamina`,
  r.confirmed && r.gain.fort === 5 && r.gain.might === 5 && r.gain.fin === 2 && r.gain.other.length === 0 && r.hpShown === '❤ +60 max HP' && r.gain.hp === 60 && r.gain.st === 10 + 25 && r.gain.ups === 0, r.gain);
check(`levelmarks: twenty skill-ups outside the majors and minors are ${r.forty.marks} marks of ${r.forty.need}; four more bank the level`, r.forty.marks === 5 && r.forty.need === 6 && !r.forty.ready && r.fortyFour.marks === 6 && r.fortyFour.ready, r);
check('levelsheet: an attribute at 58 has room for 2', r.room === 2, r.room);
check(`the Skills tab: 23 rows, majors first (${r.tab.first}); *${r.tab.head.slice(0, 60)}…*`, r.tab.rows === 23 && r.tab.first === 'blade' && /Level 2/.test(r.tab.head), r.tab);
check('the save carries the marks and this level\'s skill-ups', r.saved.marks === 6 && r.saved.ups === 4, r.saved);

// an old save's banked xp becomes marks in proportion; a 952 save's marks come back as saved
const m = await page.evaluate(() => {
  const p = JSON.parse(ssStringify(_buildSavePayload())); const old = JSON.parse(JSON.stringify(p)); delete old.levelMarks; delete old.levelUps; old.level = 4; old.xp = 274; old.xpNext = 548;
  _applyLoadData(old, null); const a = { level, marks: levelMarks, need: marksNeeded() };
  _applyLoadData(p, null); const b = { marks: levelMarks, wood: levelUps.woodcutting };
  return { a, b }; });
check(`an old save at level 4 with half its xp banked comes back with ${m.a.marks} of ${m.a.need} marks`, m.a.level === 4 && m.a.marks === 4 && m.a.need === 8, m.a);
check('a save with marks loads them as saved', m.b.marks === 6 && m.b.wood === 4, m.b);

// the creator: the archetype suggests five and five; a click moves a skill; Begin starts them at 25, 15 and 5
const c = await page.evaluate(() => {
  openCharacterCreator(); applyArchetypePreset('scout'); const sug = { maj: _ccState.majors.slice(), min: _ccState.minors.slice() };
  const chips = document.querySelectorAll('#cc-skill-grid .cc-skill').length;
  ccSkillCycle('cooking'); ccSkillCycle('bow'); const bowNow = _ccState.minors.includes('bow') && !_ccState.majors.includes('bow');
  ccSkillCycle('hand'); const handMaj = _ccState.majors.includes('hand');
  return { sug, chips, bowNow, handMaj, maj: _ccState.majors.slice(), min: _ccState.minors.slice(), label: document.getElementById('cc-skill-count').textContent }; });
check(`the creator suggests the Scout's five and five (${c.sug.maj.join(', ')}), 23 skills to choose from`, c.sug.maj.join() === 'bow,athletics,stealth,acrobatics,woodcutting' && c.chips === 23, c);
check(`a click frees a minor, moves a major into it, and Hand-to-hand takes the major's place: majors ${c.maj.join(', ')}; minors ${c.min.join(', ')}`, c.bowNow && c.handMaj && c.maj.length === 5 && c.min.length === 5 && !c.min.includes('cooking'), c);
// S2681 — xp levels nothing since S952, so no toast promises it: a quest that pays xp and no gold ends on its title alone
const qx = await page.evaluate(() => { const id = Object.keys(QS).find(k => { const q = getQuest(k); return q && q.rewards && q.rewards.xp > 0 && !(q.rewards.gold > 0); });
  if (!id) return { none: true }; const seen = [], _l = showMsgLong; showMsgLong = function (tx) { seen.push(String(tx)); return _l.apply(this, arguments); };
  try { QS[id].state = 'reward'; completeQuest(id); } finally { showMsgLong = _l; } return { id, xp: getQuest(id).rewards.xp, seen }; });
check(`a quest paying ${qx.xp} xp and no gold ends on *complete!* with no *XP* in the toast`, !qx.none && qx.seen.some(t => /complete!$/.test(t)) && !qx.seen.some(t => /XP/.test(t)), qx);
// S2722 — #2059 D: a quest handed in pays marks of its own, by what it is
const qm = await page.evaluate(() => {
  const at = (f) => { levelMarks = 0; f(); return levelMarks; };
  const out = {};
  out.main = at(() => { QS.q1_first_blood.state = 'reward'; completeQuest('q1_first_blood'); });
  const sig = QUEST_DEFS.find(q => q.questline === 'sigil_lore'); out.sigil = sig ? at(() => { QS[sig.id] = QS[sig.id] || { state: 'reward' }; QS[sig.id].state = 'reward'; completeQuest(sig.id); }) : 'none';
  const mk = (id, extra) => Object.assign({ id, giver: 'Lord Test', title: 'A test', objective: 'x', kind: 'cull', data: {}, reward: 0, done: true }, extra || {});
  out.job = at(() => qTurnIn(mk('tq:test:0')));
  out.war = at(() => qTurnIn(mk('war:test:siege:1')));
  out.errand = at(() => qTurnIn(mk('er:test:bread:0')));
  out.service = at(() => qTurnIn(mk('tq:test:1', { faction: 'crown' })));
  out.skill = at(() => { const s = SKILLS.blade; s.p = skillCost(s.lv) - 1; skillUse('blade', 1, 'qm'); });
  levelMarks = 0; return out; });
check(`a main-quest step pays ${qm.main} marks, a quest ${qm.errand} (a faction's service ${qm.service}), a lord's job ${qm.job} (a war's ${qm.war}), a sigil's tier ${qm.sigil}`,
  qm.main === 3 && qm.errand === 2 && qm.service === 2 && qm.job === 1 && qm.war === 1 && qm.sigil === 0 && qm.skill === 1, qm);
// S2723 — Michael's B on #2047: the five moments are a card at the top centre, one at a time; the ledger keeps the small lines
const nc = await page.evaluate(() => {
  NOTE_Q.length = 0; _noteOn = null; const L = document.getElementById('ledger'); L.innerHTML = ''; const el = document.getElementById('note-card');
  const s = SKILLS.blade; s.p = skillCost(s.lv) - 1; skillUse('blade', 1, 'nc'); const lv = s.lv;
  const first = { on: el.classList.contains('on'), kind: el.querySelector('.nc')?.dataset.kind, title: el.querySelector('.tt')?.textContent, line: el.querySelector('.ln2')?.textContent, msg: document.getElementById('msg').textContent };
  showMsg('Gold paid.', '#e8d8a0'); showMsgLong('Dunmore discovered', '#e8d8a0', { kind: 'place', title: 'Dunmore', line: 'Discovered' });
  const r = el.getBoundingClientRect();
  return { first, lv, queued: NOTE_Q.map(n => n.kind + ':' + n.title), slips: [...L.children].map(e => e.textContent), box: { top: Math.round(r.top), mid: Math.round(r.left + r.width / 2), W: innerWidth } }; });
check(`a skill's rise is a card (${nc.first.kind}: *${nc.first.title}*, *${nc.first.line}*), a place found waits behind it, and only *Gold paid.* is a slip`,
  nc.first.on && nc.first.kind === 'skill' && nc.first.title === `Blade rises to ${nc.lv}` && /Might/.test(nc.first.line) && /rises to/.test(nc.first.msg)
  && nc.queued.join() === 'place:Dunmore' && nc.slips.join('|') === 'Gold paid.' && nc.box.top >= 20 && nc.box.top <= 40 && Math.abs(nc.box.mid - nc.box.W / 2) < 4, nc);
await page.screenshot({ path: 'tests/tmp/notecard.png' }).catch(() => {});
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
