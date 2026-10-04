// Session 475 (the critic, 4 Oct, s374): every open-world save was labelled "the open country" in the slot list, since
// `zoneOf` read the zone only. A save now carries its place's name (`ssPlaceName`): the town when you stand in it, "near"
// the nearest place within 1,500, a house with its town, a gate by its name; the slot list and the death screen show it,
// and an old save without one keeps the old label. The export file's build was the literal 's373'; it reads the tag.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await g.settle('dunmore');

const slotText = (n) => page.evaluate(async (n) => { await saveToSlot(n); const m = SS.idx.find(e => e.kind === 'manual' && e.slot === n);
  _slMode = 'load'; renderSLSlots(); const el = [...document.querySelectorAll('#sl-slots .sl-slot-name')].map(x => x.textContent);
  return { place: m && m.place, label: el.find(t => t.includes(m.place || '¬')) || el.join(' / ') }; }, n);

const t = await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore'); px = t.x + 3; pz = t.z + 3; return { name: t.name, pad: t.pad }; });
const s1 = await slotText(0);
check(`a save in ${t.name}'s street reads "${s1.label}"`, s1.place === t.name && s1.label === `Lv${await page.evaluate(() => level)} · ${t.name}`, { s1, t });

const near = await page.evaluate(() => { const t = WORLD.siteAnywhere('dunmore');
  for (let a = 0; a < 24; a++) { const x = t.x + Math.cos(a / 24 * 6.283) * (t.pad + 260), z = t.z + Math.sin(a / 24 * 6.283) * (t.pad + 260);
    let best = null, bd = 1e9; for (const s of WORLD.SITES) { const d = Math.hypot(x - s.x, z - s.z); if (d < bd) { bd = d; best = s; } }
    if (best === t) { px = x; pz = z; return { x, z, d: Math.round(bd) }; } } return null; });
const s2 = await slotText(1);
check(`out on the land ${near && near.d} from its middle, it reads "${s2.label}"`, !!near && s2.place === 'near ' + t.name, { s2, near });

const s3 = await page.evaluate(() => { const was = currentHouse; currentHouse = { name: 'The Bramble Hearth', siteId: 'dunmore' }; const a = ssPlaceName(); currentHouse = was;
  const b = (() => { const z = activeZoneId, p = currentPortal; activeZoneId = 'dungeon'; currentPortal = { name: 'The Lost Chasm of Silence' }; const r = ssPlaceName(); activeZoneId = z; currentPortal = p; return r; })();
  return { house: a, gate: b }; });
check(`indoors a save names the house and its town ("${s3.house}"); underground the gate ("${s3.gate}")`, s3.house === 'The Bramble Hearth, ' + t.name && s3.gate === 'The Lost Chasm of Silence', s3);

const old = await page.evaluate(() => { const m = SS.idx.find(e => e.kind === 'manual' && e.slot === 0); const keep = m.place; delete m.place; renderSLSlots();
  const el = [...document.querySelectorAll('#sl-slots .sl-slot-name')].map(x => x.textContent); m.place = keep; return el; });
check('an old save with no place keeps "the open country"', old.some(x => /· the open country$/.test(x)), old);

const tag = await page.evaluate(() => ({ tag: ssBuildTag(), bar: /build (s\d+)/.exec(document.getElementById('cbar').textContent)[1] }));
check(`the export's build is the running tag (${tag.tag})`, tag.tag === tag.bar && /^s\d+$/.test(tag.tag), tag);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
