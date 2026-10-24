// The innkeeper in the voice of the house's people, and French place names that are French (Session 442; the quest
// review's Findings 7 and 8, run 6). The keeper let every room in Markish (*Suit yourself. The fire's free.*), so a Compact
// coaching inn greeted *Be welcome, Master* and then answered like a Mark tavern. The French long names were two endings
// joined by *-le-* (*Valclair-le-Ancy*), the short ones could double a word (*Montmont*) and kept a small letter after
// *Saint-*.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');

const EXPECT = {
  gatelander: { made: 'Your room’s made up already, and the bed’s getting no warmer for the waiting. Upstairs.', empty: 'The house is empty tonight, and an empty house is a cold one, so you’re doubly welcome.', full: 'Every room’s taken tonight, and two strangers in the one room never made a friend of either. The fire’s free, and the chair by it.', not: 'The road’s long and the night’s longer. The fire’s free, if you change your mind.', offerEnd: 'Will I make it up for you?', poorStart: 'That’s ', paidEnd: 'nor yours either.' },
  markman: { made: 'Your room’s made up already. Upstairs.', empty: 'The house is empty tonight.', full: 'Every room’s taken tonight, and I’ll not put two strangers in one. The fire’s free.', not: 'Suit yourself. The fire’s free.', offerEnd: 'Shall I make it up?', poorStart: 'That’s ', paidEnd: 'The other doors aren’t mine to open.' },
  aurennais: { made: 'Your room is made up, Master, as agreed. Upstairs.', empty: 'The house has no other guests tonight, Master.', full: 'Every room is let tonight, Master, and the house does not lodge two strangers in one room. The fire is free of charge.', not: 'As you wish, Master. The fire is free of charge.', offerEnd: 'Shall I enter you for it?', poorStart: 'The room is ', paidEnd: 'and are not mine to open.' },
  oldblood: { made: 'Your room is ready. Upstairs.', empty: 'No one else tonight.', full: 'Every room is taken. I do not put strangers together. The fire is free.', not: 'The fire is free.', offerEnd: 'Shall I make it ready?', poorStart: '', paidEnd: 'The other doors are not mine to open.' } };

const r = await page.evaluate((P) => {
  const inn = WORLD.settle.get('dunmore').houses.find(x => x.type === 'inn' && x.dlg);
  const ask = (T) => { const bed = T.find(x => /A bed for the night/.test(x.label)); return bed; };
  const out = {};
  for (const people of P) {
    const T = WORLD.innTopics(inn, people), row = {};
    worldState.rented = null; worldState.gameTimeAbsMinutes = 3 * 1440 + 20 * 60;
    const bed = ask(T); row.offer = bed.response;
    gold = 1; row.poor = bed.follow[0].fn(); gold = 500;
    row.notTonight = bed.follow[1].response;
    row.paid = bed.follow[0].fn(); row.made = bed.response;
    worldState.rented = { id: inn.id, room: null, until: worldState.gameTimeAbsMinutes + 60 }; row.madePlain = bed.response;
    worldState.rented = null;
    // a house of one room: the offer reads the empty house
    const one = Object.assign({}, inn, { id: inn.id + '_one', w: 3, kit: null }); /* S1368: not the kit's room, whose rooms are its own (Dunmore's first inn is the coaching inn, eight) */ row.emptyOffer = ask(WORLD.innTopics(one, people)).response;
    out[people] = row; }
  // the real keepers: Dunmore's inn (Gatelander), and the people a coaching inn is given
  const real = inn.dlg.topics.find(x => /A bed for the night/.test(x.label)).follow[1].response;
  // names: every settlement in the world
  const all = []; for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) WORLD.getCell(i, j).sites.forEach(t => { if (t.name && /village|town|city|port|outpost|garrison/.test(t.kind)) all.push({ n: t.name, reg: t.reg, drawn: t.drawnName }); });
  return { out, real, inn: inn.name, people: inn.dlg.people, all };
}, Object.keys(EXPECT));

for (const [p, x] of Object.entries(r.out)) console.log(p, JSON.stringify(x));
for (const [p, x] of Object.entries(r.out)) { const E = EXPECT[p];
  check(`${p}: the offer and its close`, x.offer.endsWith(E.offerEnd) && /\d+ gold/.test(x.offer), x.offer);
  check(`${p}: short of gold, paid, and the room already yours`, x.poor.startsWith(E.poorStart) && /(you’ve|have) 1\b/i.test(x.poor) && x.paid.endsWith(E.paidEnd) && x.madePlain === E.made && typeof x.made === 'string', [x.poor, x.paid, x.made, x.madePlain]);
  check(`${p}: the empty house and *Not tonight*`, x.emptyOffer.startsWith(E.empty) && x.notTonight === E.not, [x.emptyOffer, x.notTonight]);
  check(`${p}: no line reads undefined`, Object.values(x).every(v => typeof v === 'string' && !/undefined|\[object|=>/.test(v)), x); }
// S1285 — the Mark's alehall (Michael's A on #588): a place on the wall bench, six of them, never a room up a stair
const b = await page.evaluate(() => {
  const inn = WORLD.settle.get('dunmore').houses.find(x => x.type === 'inn' && x.dlg);
  const hall = Object.assign({}, inn, { id: inn.id + '_hall', kit: { kind: 'markhall', alehall: true }, coachInn: false });
  worldState.rented = null; worldState.gameTimeAbsMinutes = 3 * 1440 + 20 * 60; gold = 500;
  const bed = WORLD.innTopics(hall, 'markman').find(x => /A bed for the night/.test(x.label));
  const offer = bed.response; const paid = bed.follow[0].fn(); const made = bed.response, rented = Object.assign({}, worldState.rented);
  const names = [0, 1, 2, 3, 4, 5].map(k => innRoomName(k, innRooms(hall), hall));
  const saved = currentHouse; currentHouse = hall;
  const prompts = [bedPrompt({ owner: 'inn', room: rented.room }), bedPrompt({ owner: 'inn', room: (rented.room + 1) % 6 })];
  worldState.rented = null; prompts.push(bedPrompt({ owner: 'inn', room: 0 })); currentHouse = saved;
  const plain = WORLD.innTopics(inn, 'markman').find(x => /A bed for the night/.test(x.label)).response;
  return { offer, paid, made, rented, names, n: innRooms(hall), prompts, plain, benchInn: innBench(inn) };
});
console.log(JSON.stringify(b));
const BL = [b.offer, b.paid, b.made, ...b.names, ...b.prompts].join(' | ');
check('the alehall: six places, three on each bench, each named once', b.n === 6 && new Set(b.names).size === 6 && b.names[0] === 'the place by the door on the left bench' && b.names[5] === 'the place by the counter on the right bench', b.names);
check('the alehall: the keeper lets a place on the bench and it is kept as one', b.offer.includes('gold buys a place on the bench') && b.paid.endsWith('Hall keeps the peace, by iron.') && /Your furs are laid/.test(b.made) && b.rented.bench === 1, [b.offer, b.paid, b.made, b.rented]);
check('the alehall: no stair, no door, no room in any line', !/upstairs|up the stairs|door on the|\broom\b|undefined/i.test(BL.replace(/place by the door/g, '')), BL);
check('the alehall: the bench\'s prompts', b.prompts[0] === "Your place \u2014 press 'E' to rest" && /^(Another guest's place|Not your place)$/.test(b.prompts[1]) && /^Ask the keeper for a place on the bench \(\d+ gold\)$/.test(b.prompts[2]), b.prompts);
check('an inn with no alehall keeps its rooms', !b.benchInn && /room/i.test(b.plain), b.plain);
check('Dunmore’s innkeeper is a Gatelander and speaks as one', r.people === 'gatelander' && r.real === EXPECT.gatelander.not, [r.inn, r.people, r.real]);

const names = r.all.map(x => x.n), french = r.all.filter(x => x.reg === 'french');
const doubled = names.filter(n => /^(.+)\1$/i.test(n)), smallAfter = names.filter(n => /^Saint-[a-z]/.test(n)), oldLong = names.filter(n => /-le-(?!Vieux$)[A-Z]/.test(n));
const longFr = french.filter(x => /-(sur-Mer|le-Vieux|la-Forêt|en-Val|les-Prés|sous-Bois)$/.test(x.n));
console.log(JSON.stringify({ places: names.length, french: french.length, saint: names.filter(n => /^Saint-/.test(n)).slice(0, 5), longFr: longFr.slice(0, 6).map(x => x.n), doubledDrawn: r.all.filter(x => x.drawn && /^(.+)\1$/i.test(x.drawn)).map(x => `${x.drawn} → ${x.n}`).slice(0, 6) }));
check('no place name doubles a word (Montmont, Clairclair, Ardard)', doubled.length === 0, doubled);
check('a name after *Saint-* takes a capital', smallAfter.length === 0 && names.some(n => /^Saint-[A-Z]/.test(n)), smallAfter);
check('the French long names take a real qualifier, never *-le-* and an ending', oldLong.length === 0 && longFr.length > 0, { oldLong: oldLong.slice(0, 5), longFr: longFr.length });
check('every place still has its own name', new Set(names).size === names.length, names.length);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
