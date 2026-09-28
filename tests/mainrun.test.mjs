// The main quest end to end in the open world (Session 253): backlog A has owed a run of Q0–Q7 since Session 236.
// Q7 waits on issue #32 (Ashenmoor has to burn in the world first). This plays Q0–Q6 from a new character: each quest
// taken from its giver by E and the giver's own dialogue, each kill made in the dungeon its world door opens (killE), each
// sigil touched on its floor (touchSigil), each turn-in by dialogue.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
// a real start: the creator, the tutorial crypt, and out of it by its own exit (the harness's intoWorld skips the crypt)
await page.click('#sb'); await page.waitForTimeout(800);
await page.evaluate(() => ccBegin()); await page.waitForTimeout(9000); await g.hide();
const crypt = await page.evaluate(() => ({ zone: activeZoneId, lid, portal: currentPortal && currentPortal.name }));
await page.evaluate(() => goToOW()); await page.waitForTimeout(9000); await g.hide();
console.log('  crypt', JSON.stringify(crypt), '→', await page.evaluate(() => activeZoneId));
const stop = g.keepAlive();
const W = (ms) => page.waitForTimeout(ms);
const Q = ['q0_arrival', 'q1_first_blood', 'q2_strange_markings', 'q3_the_merchant_knows', 'q4_crypt_of_embers', 'q5_caldric_commission', 'q6_binding_stone', 'q7_the_rubbing'];
const states = () => page.evaluate((Q) => Q.map(id => id.split('_')[0] + ':' + qState(id)).join(' '), Q);
const log = [];
const note = async (what) => { const s = await states(); log.push(what + ' → ' + s); console.log('  ', what, '→', s); return s; };
await note('new character');

// find someone in the world by name, walk up, press E
const talk = async (name, site) => {
  const at = await page.evaluate(({ name, site }) => { if (site) { const t = WORLD.siteAnywhere(site); if (Math.hypot(px - t.x, pz - t.z) > 60) { px = t.x; pz = t.z + 4; } }
    for (let i = 0; i < 180; i++) WORLD.tick(1 / 60, performance.now());
    const n = ZONES.world.npcs.find(n => n.def && n.def.name === name && n.g.visible); if (!n) return null; window._n = n;
    px = n.g.position.x; pz = n.g.position.z + 1.2; jumpY = n.g.position.y; yaw = 0; pitch = 0; return { x: Math.round(n.g.position.x), z: Math.round(n.g.position.z), role: n.def.role }; }, { name, site });
  if (!at) return { found: false };
  await g.frames(2); await page.evaluate(() => { px = _n.g.position.x; pz = _n.g.position.z + 1.2; jumpY = _n.g.position.y; }); await page.keyboard.press('e'); await g.frames(2);
  return { found: true, at, open: await page.evaluate(() => { const d = document.getElementById('dlg'); return !!d && getComputedStyle(d).display !== 'none'; }) };
};
const choices = () => page.evaluate(() => [...document.querySelectorAll('#dlg-choices > *')].map(x => x.textContent.trim()));
const click = (re) => page.evaluate((src) => { const b = [...document.querySelectorAll('#dlg-choices > *')].find(x => new RegExp(src, 'i').test(x.textContent)); if (b) b.click(); return !!b; }, re);
// take or hand in a quest: its title, then onward through the conversation until the state moves
const through = async (id, want) => { const title = await page.evaluate((id) => getQuest(id).title, id); const seen = [];
  let ok = await click(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); await g.frames(2); seen.push((await choices()).join(' | '));
  for (let k = 0; k < 8 && (await page.evaluate((id) => qState(id), id)) !== want; k++) {
    const c = await choices(); const pick = c.find(x => !/farewell|goodbye|back|never mind|not now|not yet|decline|leave it/i.test(x)); if (!pick) break;
    await click(pick.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); await g.frames(2); seen.push(pick); }
  await page.evaluate(() => { try { closeDialog(); } catch (e) {} });
  return { clickedTitle: ok, title, state: await page.evaluate((id) => qState(id), id), seen }; };
const dungeon = async (seed, floor) => { const r = await page.evaluate((seed) => { const e = WORLD.doorAnywhere(seed); if (!e) return { door: false };
    const p = makePortalDef(e); const wp = WORLD.dungeonPos[seed]; if (wp) { p.x = wp.x; p.z = wp.z; } p.zone = 'world'; goToDungeon(p); return { door: true, name: p.name }; }, seed);
  await W(6000); await g.hide();
  if (floor === 2) { await page.evaluate(() => goToFloor2()); await W(3000); await g.hide(); }
  return { ...r, ...(await page.evaluate(() => ({ seed: currentPortal && currentPortal.seed, floor: currentFloor, live: ENEMIES.filter(e => !e.dead).length, sigils: SIGILS.filter(s => s.floor === currentFloor).length }))) }; };
const kill = (n) => page.evaluate((n) => { const live = ENEMIES.filter(e => !e.dead && (e.floor == null || e.floor === currentFloor)).slice(0, n); live.forEach(e => { e.hp = 0; killE(e); }); return live.length; }, n);
const sigil = () => page.evaluate(() => { const s = SIGILS.find(s => s.floor === currentFloor); if (!s) return false; ATTRS.intelligence = Math.max(ATTRS.intelligence, 30); touchSigil(s); return true; });
const up = async () => { await page.evaluate(() => goToOW()); await W(4000); await g.hide(); };

const R = {};
// Q0: out of the crypt
R.q0 = await note('Q0');
// Q1: Bram at the forge in Ashenmoor; five kills in the Dungeon of Shadows (42)
R.bram = await talk('Bram', 'ashenmoor'); R.q1take = R.bram.found ? await through('q1_first_blood', 'active') : null; await note('Q1 taken');
R.d42 = await dungeon(42, 1); R.k1 = await kill(5); await up(); await note('Q1 kills (' + R.k1 + ')');
await talk('Bram', 'ashenmoor'); R.q1done = await through('q1_first_blood', 'complete'); await note('Q1 handed in');
// Q2: Edna; a sigil on floor 2 of the Dungeon of Shadows
R.edna = await talk('Edna', 'ashenmoor'); R.q2take = R.edna.found ? await through('q2_strange_markings', 'active') : null; await note('Q2 taken');
R.d42b = await dungeon(42, 2); R.s2 = await sigil(); await up(); await note('Q2 sigil');
await talk('Edna', 'ashenmoor'); R.q2done = await through('q2_strange_markings', 'complete'); await note('Q2 handed in');
// Q3: Corwin in Ashenmoor; Aldwyn in Ironhaven
R.corwin = await talk('Corwin', 'ashenmoor'); R.q3take = R.corwin.found ? await through('q3_the_merchant_knows', 'active') : null; await note('Q3 taken');
await g.settle('ironhaven'); R.aldwyn = await talk('Aldwyn', 'ironhaven'); R.q3done = R.aldwyn.found ? await through('q3_the_merchant_knows', 'complete') : null; await note('Q3 at Aldwyn');
// Q4: Aldwyn; a sigil on floor 2 of the Crypt of Embers (137)
await talk('Aldwyn', 'ironhaven'); R.q4take = await through('q4_crypt_of_embers', 'active'); await note('Q4 taken');
R.d137 = await dungeon(137, 2); R.s4 = await sigil(); await up(); await note('Q4 sigil');
await g.settle('ironhaven'); await talk('Aldwyn', 'ironhaven'); R.q4done = await through('q4_crypt_of_embers', 'complete'); await note('Q4 handed in');
// Q5: Captain Brynn; eight kills on floor 2 of the Vault of the Tide (845)
R.brynn = await talk('Captain Brynn', 'ironhaven'); R.q5take = R.brynn.found ? await through('q5_caldric_commission', 'active') : null; await note('Q5 taken');
R.d845 = await dungeon(845, 2); R.k5 = await kill(8); await up(); await note('Q5 kills (' + R.k5 + ')');
await g.settle('ironhaven'); await talk('Captain Brynn', 'ironhaven'); R.q5done = await through('q5_caldric_commission', 'complete'); await note('Q5 handed in');
// Q6: Aldwyn; twenty kills in Ironhaven's dungeons
await talk('Aldwyn', 'ironhaven'); R.q6take = await through('q6_binding_stone', 'active'); await note('Q6 taken');
let k6 = 0; for (const seed of [801, 823, 867, 889, 911, 922, 845]) { if (k6 >= 20) break; const d = await dungeon(seed, 1); if (!d.door) continue; k6 += await kill(20 - k6); await up(); }
R.k6 = k6; await note('Q6 kills (' + k6 + ')');
await g.settle('ironhaven'); await talk('Aldwyn', 'ironhaven'); R.q6done = await through('q6_binding_stone', 'complete'); await note('Q6 handed in');
stop();
console.log(JSON.stringify(R, null, 1).slice(0, 6000));
const st = Object.fromEntries(Q.map((id, i) => [i, null]));
const fin = await page.evaluate((Q) => Q.map(qState), Q);
Q.slice(0, 7).forEach((id, i) => check(`Q${i} (${id}) is complete by play`, fin[i] === 'complete', { state: fin[i], log }));
check('Q7 is offered next', fin[7] !== 'locked', fin[7]);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
