// Finding 19 of the quest review's run 10 (Session 621): a townsperson born in their own town answered *Who are you?* with
// *Born here. N years, man and boy.*, a woman as well as a man. The line now says what it says for anyone, in every
// people's register: *Born here, and here these N years.*
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const out = { born: 0, women: 0, old: [], sample: '' };
for (const id of ['dunmore', 'portclare']) {
  await g.settle(id);
  const r = await page.evaluate((id) => { const S = WORLD.settle.get(id); if (!S) return null; const o = { born: 0, women: 0, old: [], sample: '' };
    const defs = S.npcs.map(n => n.def).concat((S.houses || []).map(h => h.dlg).filter(Boolean));
    for (const d of defs) { if (!d.bio || d.bio.born !== S.site.name) continue; let ts = []; try { ts = d.topics || []; } catch (e) {}
      const flat = (L) => (L || []).flatMap(t => t ? [t, ...flat(t.follow)] : []); const t = flat(ts).find(t => t.label === 'Who are you?'); if (!t || typeof t.response !== 'string') continue;
      o.born++; if (Object.values(NAMES).some(b => b.f && b.f.includes(d.name))) o.women++;
      if (/man and boy/.test(t.response)) o.old.push(d.name + ': ' + t.response);
      else if (!o.sample && t.response.startsWith(`Born here, and here these ${d.bio.years} years.`)) o.sample = d.name + ': ' + t.response; }
    return o; }, id);
  if (!r) continue;
  out.born += r.born; out.women += r.women; out.old.push(...r.old); out.sample = out.sample || r.sample;
}
console.log(JSON.stringify(out));
check(`townsfolk born in their town answer *Who are you?* (${out.born}, ${out.women} of them women)`, out.born >= 5 && out.women >= 1, out);
check('none says *man and boy*', out.old.length === 0, out.old.slice(0, 5));
check('they say *Born here, and here these N years.*', !!out.sample, out.sample);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
