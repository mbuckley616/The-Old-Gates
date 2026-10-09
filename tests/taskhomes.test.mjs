// A Mages' draught or hearth task names a place where it can be done (Session 675, the critic's s480 note: `genTask` sent
// a *deliver* or *hearth* task to one of the three nearest sites with a pad, and Hermit's Camp, with no houses and one
// Hermit, is among them for Ironhaven and Vieux Marché; `onTalk` takes the draught only from a house's keeper and a hearth
// is a home's, so the task could never be done). A draught now goes only to a place whose plan has houses, a hearth only
// to one whose plan has homes beyond its shops. Each place named is then built and checked for a keeper and a home.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const r = await page.evaluate(() => { const out = {}; const rnd = Math.random; let seed = 7;
  Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const id of ['ironhaven', 'vieux_marche']) { const site = SITE[id]; const near = nearSites(site, 700).slice(0, 3).map(t => t.id);
    const T = { deliver: {}, hearth: {} }; const st = gstate().guild_m, n0 = st.n;
    for (let i = 0; i < 400; i++) { const t = genTask('guild_m', site); if (t.kind in T) T[t.kind][t.siteId] = (T[t.kind][t.siteId] || 0) + 1; }
    st.n = n0; out[id] = { near, deliver: T.deliver, hearth: T.hearth }; }
  Math.random = rnd; return out; });
console.log(JSON.stringify(r));
const named = [...new Set(Object.values(r).flatMap(o => [...Object.keys(o.deliver), ...Object.keys(o.hearth)]))];
check('Hermit\'s Camp is among the three nearest places to Ironhaven or Vieux Marché (the case the critic met)', Object.values(r).some(o => o.near.includes('hermit_camp')), r);
check('both kinds are still drawn, from both halls', Object.values(r).every(o => Object.keys(o.deliver).length && Object.keys(o.hearth).length), r);
check('no draught and no hearth is sent to Hermit\'s Camp', !named.includes('hermit_camp'), named);
const built = {};
for (const id of named) { await g.settle(id);
  built[id] = await page.evaluate((id) => { const S = WORLD.settle.get(id); return { kind: SITE[id].kind, keepers: S.houses.filter(h => h.keeper).length, homes: S.houses.filter(h => h.type === 'home').length }; }, id); }
console.log(JSON.stringify(built));
check('every place a draught is sent to has a keeper to take it', Object.values(r).every(o => Object.keys(o.deliver).every(id => built[id].keepers > 0)), built);
check('every place a hearth is sent to has a home', Object.values(r).every(o => Object.keys(o.hearth).every(id => built[id].homes > 0)), built);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
