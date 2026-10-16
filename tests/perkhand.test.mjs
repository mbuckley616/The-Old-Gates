// The perks, first wave: the hand and the word (Session 973; skills and perks A, the build sheet's third session). A perk
// is read from its skill at 25, 50, 75 and 100. Built here: Locks' Feel for it (25), Sure hand (50) and Quiet work (75),
// Speech's Haggle (25) and Talk it down (50); the Skills tab shows each skill's four, lit when held.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const r = await page.evaluate(async () => {
  const out = {}; const sk0 = JSON.parse(JSON.stringify(SKILLS));
  const set = (id, lv) => { SKILLS[id] = { lv, p: 0 }; };
  // the gate: 24 is not, 25 is
  set('locks', 24); out.at24 = perk('locks', 25); set('locks', 25); out.at25 = perk('locks', 25); out.at25of50 = perk('locks', 50);
  // Haggle: 5% at Speech 25, none at 24
  const ch = currentHouse; currentHouse = null; const cha = ATTRS.charisma; ATTRS.charisma = 0;
  set('speech', 24); out.b24 = +barterPct().toFixed(4); set('speech', 25); out.b25 = +barterPct().toFixed(4);
  ATTRS.charisma = cha; currentHouse = ch;
  // Sure hand: a pick snaps on the third pin; the two set pins stay at Locks 50, the last one falls at 49
  BAG.push({ name: 'Lockpick', qty: 5, type: 'misc' });
  const snap = lv => { set('locks', lv); openLockpick({ seed: 'perk_test', minPins: 4 }); LP.pins[0].set = true; LP.pins[1].set = true; LP.cur = 2;
    lpBreak('Too soon.'); const n = LP.pins.filter(p => p.set).length; closeLockpick(); return n; };
  out.snap49 = snap(49); out.snap50 = snap(50);
  // Feel for it: the worked pin carries the glow only while it sits at the shear
  const feel = lv => { set('locks', lv); openLockpick({ seed: 'perk_test', minPins: 4 }); LP.cur = 0; LP.pushed = performance.now() - LP.rise - 5; LP.phase = 'hold';
    lpRender(); const el = document.querySelectorAll('#lp-pins .lp-pin')[0]; const hold = el.classList.contains('feel');
    LP.pushed = performance.now(); lpRender(); const rise = el.classList.contains('feel'); closeLockpick(); return { hold, rise }; };
  out.feel24 = feel(24); out.feel25 = feel(25);
  // Quiet work: a witness at 8 units by day sees a pick at Locks 74, not at 75; a walk past is seen either way
  const S = WORLD.settle.get('dunmore'); const npcs = S.npcs; npcs.forEach(n => { n.g.visible = false; });
  const w = npcs.find(n => n.def); const h = S.houses.find(x => x.keeper && x.type !== 'home') || S.houses[0];
  let at = null; for (let k = 0; k < 400 && !at; k++) { const a = (k % 16) / 16 * Math.PI * 2, rr = 2 + Math.floor(k / 16) * 1.5; const x = S.site.x + Math.cos(a) * rr, z = S.site.z + Math.sin(a) * rr;
    for (let b = 0; b < 8 && !at; b++) { const hd = b / 8 * Math.PI * 2; let ok = true; for (let t = 0; t <= 26 && ok; t++) { if (WORLD.solidAt(x + Math.cos(hd) * t / 2, z + Math.sin(hd) * t / 2)) ok = false; } if (ok) at = { x, z, hd }; } }
  if (!at) return { noGround: true };
  px = at.x; pz = at.z; jumpY = 0; forceTime(13); _sneaking = false; EQ.back = null;
  const put = d => { const x = at.x + Math.cos(at.hd) * d, z = at.z + Math.sin(at.hd) * d; w.g.visible = true; w._retreated = false; w.g.position.set(x, WORLD.worldH(x, z), z); w.g.rotation.y = Math.atan2(px - x, pz - z); };
  out.quiet = {};
  for (const lv of [74, 75]) { set('locks', lv); out.quiet[lv] = [5.9, 6.1, 8].map(d => { put(d); return [d, !!WORLD.witnessOf(h, true), !!WORLD.witnessOf(h)]; }); }
  w.g.visible = false;
  // Talk it down: offered at Speech 50 (not 49), halves the fine, and is gone for that town once used
  const n = npcs.find(x => x.def && x.def.role === 'Guard'); n.g.visible = true;
  const C = worldState.crime || (worldState.crime = {}); C[S.site.id] = { bounty: 75, debt: 2, last: dayNow() }; const c = C[S.site.id];
  const labels = () => [...document.querySelectorAll('#dlg-choices > button')].map(b => b.textContent.trim());
  set('speech', 49); confront(n, S, c); out.halt49 = labels(); try { closeDialog(); } catch (e) {}
  set('speech', 50); confront(n, S, c); out.halt50 = labels();
  const btn = [...document.querySelectorAll('#dlg-choices > button')].find(b => /Talk it down/.test(b.textContent)); if (btn) btn.click();
  await new Promise(res => setTimeout(res, 300));
  out.fine = c.bounty; out.halt2 = labels(); try { closeDialog(); } catch (e) {}
  confrontIndoor({ npc: n }, S, c); out.indoor2 = labels(); try { closeDialog(); } catch (e) {}
  delete C[S.site.id];
  // the Skills tab: four perks under Locks; at Locks 50 two are lit; Speech's 75 and 100 are marked not yet built
  set('locks', 50); set('speech', 50); openHub('skills');
  const row = sel => [...document.querySelectorAll(`.sk-perk[data-perk^="${sel}:"]`)].map(e => ({ t: e.textContent, held: e.classList.contains('held'), later: e.classList.contains('later') }));
  out.tabLocks = row('locks'); out.tabSpeech = row('speech'); out.tabCount = document.querySelectorAll('.sk-perks').length; closeHub();
  for (const k in sk0) SKILLS[k] = sk0[k]; return out; });
console.log(JSON.stringify(r));
check('found open ground on Dunmore’s pad', !r.noGround, r);
check(`a perk is held from its rank: Locks 24 ${r.at24}, 25 ${r.at25}; Sure hand not at 25 (${r.at25of50})`, !r.at24 && r.at25 && !r.at25of50, r);
check(`Haggle: Speech 25 takes 5% more off (${r.b24} → ${r.b25})`, Math.abs(r.b25 - r.b24 - .052) < 1e-6, r);
check(`Sure hand: a snapped pick keeps both set pins at Locks 50 (${r.snap50}), drops one at 49 (${r.snap49})`, r.snap50 === 2 && r.snap49 === 1, r);
check(`Feel for it: the pin glows at the shear at Locks 25 (${JSON.stringify(r.feel25)}), never at 24 (${JSON.stringify(r.feel24)})`, r.feel25.hold && !r.feel25.rise && !r.feel24.hold, r);
const q74 = r.quiet && r.quiet[74], q75 = r.quiet && r.quiet[75];
check(`Quiet work: at Locks 75 a pick is seen to 6 units, not 8; a walk past still to 12 (${JSON.stringify(q75)})`, q75 && q75[0][1] && !q75[1][1] && !q75[2][1] && q75[2][2], r.quiet);
check(`at Locks 74 the pick is seen at 8 (${JSON.stringify(q74)})`, q74 && q74[2][1], r.quiet);
check(`Talk it down is offered at Speech 50 (${r.halt50 && r.halt50.length} choices), not 49`, r.halt50.some(l => /Talk it down/.test(l)) && !r.halt49.some(l => /Talk it down/.test(l)), r);
check(`it halves the fine, 75 → ${r.fine}, and the halt reopens on it`, r.fine === 38 && r.halt2.some(l => /\(38 gold\)/.test(l)), r);
check('once in a town: it is not offered again, in the street or indoors', !r.halt2.some(l => /Talk it down/.test(l)) && !r.indoor2.some(l => /Talk it down/.test(l)), r);
check(`the Skills tab: Locks shows four perks, two lit at 50 (${r.tabLocks.map(p => p.t + (p.held ? '*' : '')).join(', ')})`, r.tabLocks.length === 4 && r.tabLocks.filter(p => p.held).length === 2, r.tabLocks);
check(`Speech 75 and 100 are marked not yet in the game`, r.tabSpeech[2].later && r.tabSpeech[3].later && !r.tabSpeech[0].later, r.tabSpeech);
check(`eleven skills carry a perk line (${r.tabCount})`, r.tabCount === 11, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
