// Today's HUD, for the HUD page: Dunmore at 2 pm with a job taken, then a fight with a bandit and a skeleton.
// Writes current-*.png, plate-*.png (the view with no HUD and no hand, 1280×720) and current.json (every bottom-centre
// line the fight wrote, with its time, and the vitals, compass marks and buffs as the game holds them).
// node docs/prototypes/hud/shoot-current.mjs
import { boot } from '../../../tests/lib/game.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const shot = n => page.screenshot({ path: path.join(here, n + '.png') });
const plate = async n => {
  await page.evaluate(() => { const c = REN.domElement; window._hid = [];
    for (const e of document.querySelectorAll('body *')) if (e !== c && !e.contains(c) && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden') { e.style.visibility = 'hidden'; window._hid.push(e); }
    const gEl = document.getElementById('g'); window._gh = gEl.style.height; gEl.style.height = '720px'; window.dispatchEvent(new Event('resize'));
    if (typeof VM_SCENE !== 'undefined') VM_SCENE.visible = false; });
  await g.spin(null, 2); await page.waitForTimeout(1200);
  await page.evaluate(n => { if (!window._F) return; window._PROJ = window._PROJ || {}; const V = THREE.Vector3; const W = REN.domElement.clientWidth, H = REN.domElement.clientHeight;
    _PROJ[n + ':yaw'] = ((-yaw * 180 / Math.PI) % 360 + 360) % 360; _PROJ[n] = _F.map(e => { const p = new V(e.x, e.mesh.position.y + 1.25 * (e.size || 1), e.z).project(CAM); return { name: e.name, x: Math.round((p.x + 1) / 2 * W), y: Math.round((1 - p.y) / 2 * H) }; }); }, n);
  await shot(n);
  await page.evaluate(() => { for (const e of window._hid) e.style.visibility = ''; const gEl = document.getElementById('g'); gEl.style.height = window._gh; window.dispatchEvent(new Event('resize')); if (typeof VM_SCENE !== 'undefined') VM_SCENE.visible = true; });
  await g.spin(null, 2); await page.waitForTimeout(800);
};
// every line written to the bottom centre, with the game clock's real seconds
await page.evaluate(() => { window._MS = []; const t0 = performance.now();
  for (const f of ['showMsg', 'showMsgLong']) { const o = window[f]; window[f] = function (t, c) { _MS.push({ f, t: String(t), c: c || '#d4b896', s: +((performance.now() - t0) / 1000).toFixed(2) }); return o.apply(this, arguments); }; } });
// a hand some days out: level 6, Might 5, a steel mace with a fire rune (blunt, so a skeleton is weak to it), equipped through useItem
const kit = await page.evaluate(() => { level = 6; xpNext = 200 + level * 150; xp = Math.round(xpNext * .62); ATTRS.might = 5;
  const it = makeItem(3, WEAPON_TYPES.find(t => t.type === 'Mace'), WEAPON_ENCHANTS.find(e => e.effect(10).extraType === 'fire'), false); BAG.push(it); useItem(BAG.length - 1);
  return { weapon: EQ.weapon.name, atk: EQ.weapon.atk, level, might: ATTRS.might }; });
// four of the lord's jobs at once, the way a player who says yes to everything carries them
const jobs = await page.evaluate(() => { const site = SITES.find(t => t.name === 'Dunmore'); const out = []; const MR = Math.random; let sd = 7; Math.random = () => ((sd = (sd * 16807) % 2147483647) - 1) / 2147483646; /* the jobs' rolls pinned, so a re-run takes the same four */
  for (const k of ['deliver', 'road', 'retrieve', 'cull']) { try { const q = townQuestFor(site, k, true); if (q) { qAdd(q); out.push({ kind: k, title: q.title, giver: q.giver }); } } catch (e) { out.push({ kind: k, err: e.message }); } }
  Math.random = MR; return out; });
await page.evaluate(() => { forceTime(14); PHP = Math.round(effMaxHP() * .72); mana = Math.round(effMaxMana() * .55); stamina = Math.round(effMaxStamina() * .8); updateHUD(); });
await g.spin(null, 30); await g.hide(); await page.waitForTimeout(1500);
await shot('current-town');
await plate('plate-town');
const town = await page.evaluate(() => ({ markers: getActiveQuestMarkers().map(m => ({ x: m.x, z: m.z, d: Math.round(Math.hypot(m.x - px, m.z - pz)), glyph: m.glyph || null, col: m.col || null, label: m.label || m.name || null })),
  places: (WORLD.compassPlaces ? WORLD.compassPlaces() : []).map(p => ({ glyph: p.glyph, found: !!p.found, name: p.name || null, d: Math.round(Math.hypot(p.x - px, p.z - pz)) })),
  hp: [Math.floor(PHP), effMaxHP()], mana: [Math.floor(mana), effMaxMana()], st: [Math.floor(stamina), effMaxStamina()], level, xp, xpNext, gold: typeof gold !== 'undefined' ? gold : null,
  px, pz, yawDeg: ((-yaw * 180 / Math.PI) % 360 + 360) % 360, weapon: EQ.weapon && EQ.weapon.name, belt: document.getElementById('bh').textContent, ob: document.getElementById('ob').textContent,
  compass: { w: compassEl.width, h: compassEl.height }, time: gameDateLine ? gameDateLine() : '' }));
// the fight: a bandit and a skeleton three steps ahead, struck through the game's own attack
const fight = await page.evaluate(() => {
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw); const out = [];
  window._F = ['Bandit', 'Skeleton'].map((n, i) => { const d = i ? 6.5 : 4.2, l = i ? 1.6 : -1.1; const x = px + fx * d + l * fz, z = pz + fz * d - l * fx;
    const e = buildZoneEnemy(WORLD.scene, [], x, z, n, null); e.mesh.position.y = WORLD.worldH(x, z); e.locked = false; e.mesh.visible = true; if (!e.mesh.parent) WORLD.scene.add(e.mesh);
    if (typeof ZE !== 'undefined' && !ZE.includes(e)) ZE.push(e); e.ry = Math.atan2(px - x, pz - z); e.mesh.rotation.y = e.ry; return e; });
  for (const e of _F) out.push({ name: e.name, hp: e.hp, maxHp: e.maxHp || e.hp, def: e.def || 0, resist: e.resist || null });
  return out; });
await page.evaluate(() => { _MS.length = 0; });
// the hits, by attack()'s own formula (62-actions.js) at the middle of the weapon's roll, through applyMeleeDamage
const hits = await page.evaluate(() => { const w = EQ.weapon, lo = w ? w.atk[0] : FISTS.atk[0], hi = w ? w.atk[1] : FISTS.atk[1];
  const raw = Math.floor((lo + Math.floor(.5 * (hi - lo)) + Math.floor(level * 1.5)) * (1 + attrEff('might') * ATTR_DMG_PER_POINT));
  const [B, S] = _F; const out = { weapon: w && w.name, wType: weaponDamageType(w), raw, atk: [lo, hi] };
  const face = (e, away) => { e.ry = Math.atan2(px - e.x, pz - e.z) + (away ? Math.PI : 0); e.combatYaw = e.ry; e.mesh.rotation.y = e.ry; };
  const hit = e => { const hp = e.hp; const r = applyMeleeDamage(e, raw); e.hp = hp; return r; };
  face(B); face(S); out.bandit = hit(B); out.skeleton = hit(S);
  face(B, true); out.backstab = hit(B); face(B);
  // the same blow on a staggered bandit (POSTURE_CRIT_MULT) and a spear's on the skeleton (resist.pierce): applyMeleeDamage's arithmetic
  out.crit = Math.max(1, Math.round(raw * POSTURE_CRIT_MULT) - (B.def || 0)); out.critMult = POSTURE_CRIT_MULT;
  out.resisted = Math.max(1, Math.round(raw * S.resist.pierce) - (S.def || 0)); out.pierceMult = S.resist.pierce;
  out.tagWeak = dmgTag({ resistMult: S.resist.blunt }, S); out.tagRes = dmgTag({ resistMult: S.resist.pierce }, S);
  out.riders = Object.fromEntries(WEAPON_ENCHANTS.map(en => { const f = en.effect(out.bandit.dmg); return [f.extraType || en.name || '?', { extra: f.extraDmg || 0, msg: f.msg || '' }]; }).filter(x => x[0] !== '?'));
  return out; });
// and the real path once, to catch whatever lines a swing writes
await page.evaluate(() => { try { attackHeld = false; } catch (_) {} try { attack(); } catch (e) { _MS.push({ f: 'err', t: e.message }); } });
await g.spin(null, 40);
// stage the shot: the bandit 4.5 ahead and left, the skeleton 6.5 ahead and right, both facing you
const stage = () => page.evaluate(() => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  _F.forEach((e, i) => { const d = i ? 6.5 : 4.5, l = i ? -1.5 : 1.3; e.x = px + fx * d + l * fz; e.z = pz + fz * d - l * fx; e.mesh.position.set(e.x, WORLD.worldH(e.x, e.z), e.z);
    e.ry = Math.atan2(px - e.x, pz - e.z); e.mesh.rotation.y = e.ry; e.state = 'idle'; e.alert = false; e.locked = true; e.minLevel = 99; e.mesh.visible = true; }); });
await page.evaluate(() => { pitch = -.06; PHP = Math.round(effMaxHP() * .41); stamina = Math.round(effMaxStamina() * .22); updateHUD(); });
await stage(); await g.spin(null, 2); await stage();
await page.evaluate(_HS => { showMsg(`Hit Skeleton for ${_HS}! (Weak!)`, '#ff9944'); clearTimeout(MSGEL._t); MSGEL.style.transition = 'none'; MSGEL.style.opacity = '1'; }, hits.skeleton.dmg); await page.waitForTimeout(400);
await shot('current-fight');
await stage(); await plate('plate-fight');
const fightNow = await page.evaluate(() => ({ hp: [Math.floor(PHP), effMaxHP()], st: [Math.floor(stamina), effMaxStamina()], foes: _F.map(e => ({ name: e.name, hp: e.hp })), lines: _MS.slice() }));
const near = await page.evaluate(() => { const L = []; try { for (const s of SITES) { if (!s || s.x == null) continue; L.push({ name: s.name, kind: s.kind || s.type || null, d: Math.round(Math.hypot(s.x - px, s.z - pz)), b: Math.round(((Math.atan2(s.x - px, -(s.z - pz)) * 180 / Math.PI) + 360) % 360) }); } } catch (e) { L.push({ err: e.message }); }
  L.sort((a, b) => a.d - b.d); const npcs = []; try { for (const n of (ZONES.world.npcs || [])) { const nm = n.name || (n.def && n.def.name); if (nm) npcs.push({ name: nm, role: n.role || (n.def && n.def.role) || null, d: Math.round(Math.hypot(n.x - px, n.z - pz)) }); } } catch (e) {} npcs.sort((a, b) => a.d - b.d);
  return { towns: L.slice(0, 10), npcs: npcs.slice(0, 12), yawDeg: Math.round(((-yaw * 180 / Math.PI) % 360 + 360) % 360) }; });
// how many places in the code write a line to the bottom centre
const proj = await page.evaluate(() => window._PROJ || null);
const data = { kit, jobs, town, fight, hits, fightNow, near, proj };
fs.writeFileSync(path.join(here, 'current.json'), JSON.stringify(data, null, 1));
console.log('errors', g.errs, JSON.stringify(town).slice(0, 600), JSON.stringify(hits), JSON.stringify(fightNow.lines).slice(0, 800));
await g.close();
