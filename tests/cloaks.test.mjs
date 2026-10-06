// Capes and cloaks (Session 552, Michael's B on DECISION #148, docs/design/capes-and-cloaks.md): a back slot, six mundane
// kinds at def 1, each one small virtue in its place; sold by place; looted at tier 4 and up with a cloak enchant at 0.6 of
// a ring's; saved with the character.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');

// 1. the slot, the table, sneak, swim, barter, the stock, the loot, the save
const r = await page.evaluate(() => {
  const was = EQ.back; const wear = k => { EQ.back = k ? makeCloak(k) : null; if (typeof _armorBonusDirty !== 'undefined') _armorBonusDirty = true; };
  const slots = EQ_SLOTS.map(s => s.key);
  _sneaking = true; wear(null); const sn0 = _sneakDetectMult(); wear('hood'); const snH = _sneakDetectMult(); wear('wool'); const snW = _sneakDetectMult(); _sneaking = false;
  const swim = {}; for (const k of [null, 'wool', 'hood', 'oilskin', 'fur', 'cape', 'pilgrim']) { wear(k); swim[k || 'none'] = cloakSwimMult(); }
  // barter at a counter in Aurenne and in the Gatelands
  const nat = t => nationKeyOf(...cellOf(t.x, t.z));
  const ALL = allSites(); const au = ALL.find(t => (t.kind === 'town' || t.kind === 'city') && nat(t) === 'aurenne'), mk = ALL.find(t => (t.kind === 'town' || t.kind === 'city') && nat(t) === 'mark');
  const port = ALL.find(t => t.kind === 'port'), dun = WORLD.settle.get('dunmore').site;
  const ch = currentHouse; const bart = (t, k) => { wear(k); currentHouse = { siteId: t.id, type: 'misc' }; const v = barterPct(); currentHouse = ch; return v; };
  const barter = { auNone: bart(au, null), auCape: bart(au, 'cape'), dunCape: bart(dun, 'cape'), auWool: bart(au, 'wool') };
  const stock = t => cloaksFor({ siteId: t.id, type: 'misc' }).map(c => c.virtue);
  const stocks = { dun: stock(dun), au: stock(au), mk: stock(mk), port: port ? stock(port) : null, smith: cloaksFor({ siteId: dun.id, type: 'weapon' }).length, armour: cloaksFor({ siteId: dun.id, type: 'armor' }).length, dunChurch: WORLD.settle.get('dunmore').houses.some(h => h.type === 'church') };
  // loot: a high level, many rolls on one seeded stream
  const lv = level; level = 30; let armour4 = 0, cloaks = 0, ench = [], bad = 0;
  withLootRng(seededRng('cloaktest', 1), () => { for (let i = 0; i < 20000; i++) { const it = rollLoot({ hp: 3 }, null, 'chest'); if (!it || it.type !== 'equip' || it.atk) continue; if ((it.tier || 0) < 4 && !it.virtue) continue; armour4++;
    if (it.virtue) { cloaks++; if (!it.enchant || !it.enchant._cloak || it.def !== 1 || it.slot !== 'back') bad++; if (ench.length < 3) ench.push({ name: it.name, tier: it.tier, stats: it.enchantStats }); } } });
  level = lv;
  const ring = ARMOR_ENCHANTS.find(e => e.id === 'st_regen').apply({ tier: 6 }), cl = ARMOR_ENCHANTS.find(e => e.id === 'cloak_vigor').apply({ tier: 6 });
  // the save: a magical cloak worn round-trips with its kind and its enchant
  const mc = makeCloak('fur', 6, ARMOR_ENCHANTS.find(e => e.id === 'cloak_vigor')); const s = JSON.parse(JSON.stringify(_serItem(mc))); const back = _restoreEnchant(s);
  EQ.back = was;
  return { slots, sn0, snH, snW, swim, barter, stocks, armour4, cloaks, bad, ench, ring, cl, saved: { virtue: back.virtue, name: back.name, ench: back.enchant && back.enchant.id, stats: back.enchantStats, def: back.def, slot: back.slot } };
});
console.log(JSON.stringify(r).slice(0, 2500));
check('a Back slot, after the Head, and EQ carries it', r.slots[0] === 'head' && r.slots[1] === 'back', r.slots);
check('the dark hood: seen 5% less while sneaking; the traveller\'s cloak changes nothing', Math.abs(r.snH / r.sn0 - .95) < 1e-9 && r.snW === r.sn0, { sn0: r.sn0, snH: r.snH, snW: r.snW });
check('in the water: cloth × .9, fur × .85, oilskin and no cloak × 1', r.swim.none === 1 && r.swim.oilskin === 1 && r.swim.fur === .85 && ['wool', 'hood', 'cape', 'pilgrim'].every(k => r.swim[k] === .9), r.swim);
check('the short cape: barter +2% at Aurenne\'s counters, nothing in the Gatelands; another cloak nothing', Math.abs(r.barter.auCape - r.barter.auNone - .02) < 1e-9 && r.barter.dunCape === r.barter.auNone && r.barter.auWool === r.barter.auNone, r.barter);
check('the stock by place: the traveller\'s everywhere, the hood in towns, oilskin in ports, fur in the Mark, the cape in Aurenne; only armourers and goods shops',
  r.stocks.dun.includes('wool') && r.stocks.dun.includes('hood') && !r.stocks.dun.includes('fur') && !r.stocks.dun.includes('cape') && (r.stocks.dun.includes('pilgrim') === r.stocks.dunChurch) &&
  r.stocks.au.includes('cape') && !r.stocks.au.includes('fur') && r.stocks.mk.includes('fur') && !r.stocks.mk.includes('cape') && (!r.stocks.port || r.stocks.port.includes('oilskin')) && r.stocks.smith === 0 && r.stocks.armour >= 2, r.stocks);
check('loot at tier 4 and up: about one armour drop in twelve is a cloak, every one magical with a cloak enchant, def 1, on the back', r.armour4 > 600 && r.cloaks / r.armour4 > .06 && r.cloaks / r.armour4 < .11 && r.bad === 0, { armour4: r.armour4, cloaks: r.cloaks, share: r.cloaks / r.armour4, ench: r.ench });
check('a cloak enchant is 0.6 of the ring\'s', Math.abs(r.cl.stRegen - Math.round(r.ring.stRegen * .6 * 100) / 100) < 1e-9 && r.cl.stRegen > 0, { ring: r.ring, cloak: r.cl });
check('a magical cloak saved and loaded keeps its kind, its enchant and its stats', r.saved.virtue === 'fur' && r.saved.ench === 'cloak_vigor' && r.saved.stats && r.saved.stats.stRegen === r.cl.stRegen && r.saved.def === 1 && r.saved.slot === 'back', r.saved);

// 2. the fur: the main loop's stamina regen is × 1.1 while furWarm() holds (g.spin ticks the world, not the loop's regen, so
// the multiplier is checked where it is decided)
const fur = await page.evaluate(() => {
  const was = EQ.back, wx = WX.type;
  return { warm: (EQ.back = makeCloak('fur'), WX.type = 'snow', furWarm()), cold: (WX.type = 'clear', forceTime(12), furWarm()), none: (EQ.back = null, WX.type = 'snow', furWarm()), restore: (EQ.back = was, WX.type = wx, true) };
});
check('the fur warms in falling snow, not under a clear noon, and no other cloak does', fur.warm === true && fur.cold === false && fur.none === false, fur);
await page.evaluate(() => { EQ.back = null; });

// 3. the pilgrim's grey: a shrine's boon lasts a quarter longer
const id = await page.evaluate(() => { let best = null, bd = 1e9; for (const c of CELLS.values()) for (const s of c.sites) if (s.kind === 'shrine' && godOf(s).boon) { const d = Math.hypot(s.x - px, s.z - pz); if (d < bd) { bd = d; best = s.id; } } return best; });
await g.settle(id); await page.evaluate((id) => { const t = WORLD.siteAnywhere(id); px = t.x; pz = t.z + 3; }, id); await page.waitForTimeout(3000);
const p = await page.evaluate(() => {
  const S = [...SETTLE.values()].find(S => S.site.kind === 'shrine' && S.altar && S.god && S.god.boon); if (!S) return null;
  const god = S.god, idx = CAL.days.findIndex(d => d.god === god.key), other = 14 + (idx + 1) % 7;
  const pray = (k) => { EQ.back = k ? makeCloak(k) : null; delete (worldState.shrines || {})[S.site.id]; worldState.gameTimeAbsMinutes = other * 1440 + 600; worldState.gameTimeMinutes = 600; px = S.altar.x + 1; pz = S.altar.z; ACTIVE_BUFFS.length = 0;
    const sm = window.showMsg; window.showMsg = () => {}; try { shrineInteract(); } finally { window.showMsg = sm; } const b = ACTIVE_BUFFS.find(b => b.label === god.boon.label); return b ? b.remaining : null; };
  const plain = pray(null), grey = pray('pilgrim'); EQ.back = null; return { plain, grey };
});
check('the pilgrim\'s grey: a shrine\'s boon 1800 → 2250', p && p.plain === 1800 && p.grey === 2250, p);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
