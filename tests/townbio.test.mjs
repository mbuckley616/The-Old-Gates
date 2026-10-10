// The townsfolk's talk (Session 698, the critic's s482). *How are things here, honestly?* answered with the map card's line,
// number and all: Glencarra's smith said *prosperous (77). Better than my father saw.* It now says the word alone. A
// townsperson could come from a lair or a ruin (*I came from Glenree's Lair*), and one born here counted their age from
// 3 (a priest: *Born here, and here these 7 years.*). Birthplaces are now places people live (KIND_PLAN), and the born-here
// are 18 at the least.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
const out = { people: 0, bornHere: 0, young: [], away: 0, badPlace: [], places: {}, honest: [], numbers: [], fares: [] };
for (const id of ['dunmore', 'portclare']) {
  await g.settle(id);
  const r = await page.evaluate((id) => { const S = WORLD.settle.get(id); if (!S) return null;
    const all = []; for (const c of CELLS.values()) for (const t of (c.sites || [])) all.push(t);
    const kindOf = n => { const t = all.find(t => t.name === n); return t ? t.kind : '?'; };
    const o = { people: 0, bornHere: 0, young: [], away: 0, badPlace: [], places: {}, honest: [], numbers: [], fares: [] };
    const defs = S.npcs.map(n => n.def).concat((S.houses || []).map(h => h.dlg).filter(Boolean));
    const flat = (L) => (L || []).flatMap(t => t ? [t, ...flat(t.follow), ...flat(t.then)] : []);
    for (const d of defs) { if (!d.bio) continue; o.people++;
      if (d.bio.born === S.site.name) { o.bornHere++; if (d.bio.years < 18) o.young.push(d.name + ' ' + d.bio.years); }
      else { o.away++; const k = kindOf(d.bio.born); o.places[k] = (o.places[k] || 0) + 1; const P = KIND_PLAN[k]; if (!P || !(P.n[0] > 0)) o.badPlace.push(d.name + ': ' + d.bio.born + ' (' + k + ')'); }
      let ts = []; try { ts = d.topics || []; } catch (e) {}
      for (const t of flat(ts)) { if (t.label !== 'How are things here, honestly?' && t.label !== 'How fares the town?') continue; let s = ''; try { s = t.response; } catch (e) {} if (typeof s !== 'string') continue;
        (t.label === 'How fares the town?' ? o.fares : o.honest).push(s); if (/\d/.test(s)) o.numbers.push(s); } }
    return o; }, id);
  if (!r) continue;
  out.people += r.people; out.bornHere += r.bornHere; out.away += r.away; out.young.push(...r.young); out.badPlace.push(...r.badPlace); out.honest.push(...r.honest); out.fares.push(...r.fares); out.numbers.push(...r.numbers);
  for (const k in r.places) out.places[k] = (out.places[k] || 0) + r.places[k];
}
console.log(JSON.stringify({ ...out, honest: out.honest.slice(0, 3), fares: out.fares.slice(0, 2) }));
check(`townsfolk read in two towns (${out.people}: ${out.bornHere} born here, ${out.away} from elsewhere)`, out.people >= 40 && out.bornHere >= 10 && out.away >= 10, out.people);
check('nobody born here is under eighteen', out.young.length === 0, out.young.slice(0, 8));
check('everyone from elsewhere comes from a place people live (no lair, ruin, camp or shrine)', out.badPlace.length === 0, { bad: out.badPlace.slice(0, 8), places: out.places });
check('*How are things here, honestly?* is answered in words, with no number', out.honest.length >= 5 && out.numbers.length === 0 && out.honest.every(s => /^[A-Z][a-z ]+\. /.test(s)), { honest: out.honest.slice(0, 4), numbers: out.numbers.slice(0, 4) });
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
