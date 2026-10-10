// Session 671: the quest writer's Findings 21 and 22, applied as written. The yard's note on a sunk ship says whose yard is
// raising her and how many days are left once the raising is paid (and still *Ask about raising her.* before). At the Ashfeld,
// Varek argues the canon's side: the gates are a cage called a loom, and helping him is unbinding it.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const pid = await page.evaluate(() => WORLD.allPorts()[0].id);
const yard = await page.evaluate((pid) => { const site = WORLD.siteAnywhere(pid); worldState.ship = null; gold = 6000; WORLD.tut.sea = null; openYardPanel(site);
  const st = worldState.ship = { cls: 'cog', name: 'Ember Wake', hull: 0, rig: 100, sunk: { x: 0, z: 0 } };
  const note = () => { yardPanelDraw(); return document.getElementById('yardui').textContent; };
  const unpaid = note(); const now = worldState.gameTimeAbsMinutes || 0;
  st.raise = { site: pid, due: now + 3 * 1440 }; const three = note();
  st.raise.due = now + 1440 - 5; const one = note();
  return { name: site.name, unpaid, three, one }; }, pid);
const has = (s, t) => s.includes(t);
console.log(JSON.stringify({ name: yard.name }));
check('sunk and not yet paid for: the note sends you to ask', has(yard.unpaid, 'The Ember Wake lies on the bottom. Ask about raising her.'), yard.unpaid.slice(0, 300));
check(`paid for: the yard at ${yard.name} is raising her, three days yet, then one day`, has(yard.three, `The Ember Wake lies on the bottom. The yard at ${yard.name} is raising her: 3 days yet.`) && has(yard.one, `The yard at ${yard.name} is raising her: one day yet.`) && !has(yard.three, 'Ask about raising her'), { three: yard.three.slice(0, 300), one: yard.one.slice(0, 300) });
await page.evaluate(() => { try { closeYardPanel(); } catch (e) {} worldState.ship = null; });

// the Ashfeld: Varek's lines, as the canon has him
const v = await page.evaluate(() => { const S = story(); S.act = 2; S.step = 'ashfeld'; const f = siteAnywhere('ashfeld'); px = f.x; pz = f.z; tickAshfeld();
  const n = ASH.npc; const d = n && n.def; if (!d) return null; const T = d.topics;
  const row = (re) => T.find(t => re.test(t.label));
  const out = { first: row(/what are you doing to the sigils/).response, labels: T.map(t => t.label) };
  const st = JSON.parse(JSON.stringify(S));
  out.stop = row(/^Stop\./).fn(); Object.assign(S, JSON.parse(JSON.stringify(st)));
  out.help = row(/^I'll help/).fn(); out.choice = S.choice; out.step = S.step; return out; });
console.log(JSON.stringify(v));
check('Varek: they built a cage and called it a loom; two hundred and fifty years; what it runs on', v && v.first === "Unwriting them. Every one I can reach. They built a cage and called it a loom, and the dead pay for its keeping. Take it apart, and the dead can stay. I've spent two hundred and fifty years at it, stone by stone. You've spent a season keeping it running, gate by gate, for coin. Did anyone ever tell you what it runs on?", v);
check('stop: you would have me leave it running', v && v.stop === "You'd have me leave it running. Then go and see what it runs on. The place beneath all the gates is on the far side of Aurenne, under the water. The Root. I'll be there before you, because I always am. Decide there.", v && v.stop);
check('help is unbinding it, and still leads to the Root as the help choice', v && v.labels.includes("I'll help you unbind it.") && !v.labels.includes("I'll help you close them.") && v.help === "Then there is one gate left that matters, and it isn't a gate. The Root, under the water off Aurenne's far shore. Everything runs back to it. Meet me there, and we'll take the last stone out with our hands." && v.choice === 'help' && v.step === 'root', v && { labels: v.labels, help: v.help, choice: v.choice, step: v.step });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
