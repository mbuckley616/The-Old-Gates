// The canon's register (Session 254, quest review run 1): the guild heads, the halt and the yield speak in the voice of
// their own town's people. Markish is the old text and the fallback.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const stop = g.keepAlive();

// the tables: all four peoples, every line filled
const tab = await page.evaluate(() => { const P = ['gatelander', 'markman', 'aurennais', 'oldblood']; const S = WORLD.settle.get('dunmore');
  const H = WORLD.haltLines(S), Y = WORLD.yieldLines(S), G = WORLD.guildGreet;
  return { dunmore: WORLD.peopleOfSite(S.site), halt: H.greet(40, 'Dunmore'), yield: Y.greet(80),
    full: P.every(p => G.guild_f[p].length === 2 && G.guild_m[p].length === 2),
    mk: G.guild_f.markman[0] }; });
console.log(JSON.stringify(tab));
check('four peoples in the guild table; the Markish row is the old line', tab.full && tab.mk === "The board's behind me. Work if you want it.", tab);

// the halt, by play, in Dunmore: the guard at the town's own voice
const setup = `const S = WORLD.settle.get('dunmore'); const site = S.site; forceTime(12); px = site.x; pz = site.z + 18; jumpY = 0;
  const gd = WORLD.guardsOf(S)[0]; gd.g.visible = true; gd._retreated = false; gd._drawn = false; gd.sched = { type: 'guard', a: { x: px + 2.5, z: pz }, b: { x: px + 2.5, z: pz } }; gd.g.position.set(px + 2.5, WORLD.worldH(px + 2.5, pz), pz);
  worldState.crime = { dunmore: { bounty: 25, debt: 1, last: 0 } };`;
const halt = await page.evaluate((setup) => { eval(setup); WORLD.tickCrime(1 / 60, performance.now());
  const greet = dlgNPC && dlgNPC.greeting[0]; gold = 0; const poor = dlgNPC.topics[0].fn(); gold = 100; const pay = dlgNPC.topics[0].fn(); closeDialog();
  const L = WORLD.haltLines(WORLD.settle.get('dunmore')); return { greet, poor, pay, want: L.greet(25, 'Dunmore'), wantPoor: L.poor, wantPay: L.pay, gold }; }, setup);
console.log(JSON.stringify(halt));
check('Dunmore\'s guard halts you in Dunmore\'s voice, and pays out in it', halt.greet === halt.want && halt.poor === halt.wantPoor && halt.pay === halt.wantPay && halt.gold === 75, halt);

// the yield, by play: refuse, then at a fifth of health
const yl = await page.evaluate(async (setup) => { const wait = ms => new Promise(r => setTimeout(r, ms)); for (let t = 0; t < 6; t += 1 / 60) WORLD.tickCrime(1 / 60, performance.now()); eval(setup); WORLD.tickCrime(1 / 60, performance.now()); if (!dlgOpen) return { noHalt: true };
  const refuse = dlgNPC.topics[1].fn(); await wait(300); PHP = Math.round(maxHP * .2); WORLD.tickCrime(1 / 60, performance.now());
  const greet = dlgOpen && dlgNPC.greeting[0]; gold = 0; const poor = dlgNPC.topics[0].fn(); closeDialog();
  const S = WORLD.settle.get('dunmore'); const H = WORLD.haltLines(S), Y = WORLD.yieldLines(S);
  return { refuse, greet, poor, wantRefuse: H.refuse, want: Y.greet(50), wantPoor: Y.poor }; }, setup);
console.log(JSON.stringify(yl));
check('refused, he draws in the same voice; the yield too', yl.refuse === yl.wantRefuse && yl.greet === yl.want && yl.poor === yl.wantPoor, yl);

// the guild head's greeting, in the hall
const gh = await page.evaluate(() => { const S = WORLD.settle.get('dunmore'); const out = [];
  for (const h of S.houses.filter(x => /guild/.test(x.type))) { const d = h.dlg || null; out.push({ type: h.type, d: d && { name: d.name, people: d.people, greeting: d.greeting } }); }
  return out; });
console.log(JSON.stringify(gh));
const ghOk = await page.evaluate((gh) => gh.length > 0 && gh.every(x => x.d && JSON.stringify(x.d.greeting) === JSON.stringify(WORLD.guildGreet[x.type][x.d.people] || WORLD.guildGreet[x.type].markman)), gh);
check('the guild heads greet by their own people', ghOk, gh);
stop(); check('no page errors', g.errs.length === 0, g.errs);
await g.close();
