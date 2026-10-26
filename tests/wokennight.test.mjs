// Session 770 — a householder woken in the night (Michael's A on #255; the critic's s585). Over a sleeper the prompt reads
// *<name> (asleep) — Press 'E' to wake*. Woken, the first talk opens with a night line by her people (the quest writer's
// WOKEN_LINES, the decision's line until then) in place of the greeting, and the introduction is not first. Said once a visit;
// by day and in the awake hours the talk is as before. No crime.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
/* S785: each people has its own night line (the quest review's Finding 29); the resident's is read from the game at each check */
const NIGHT = { gatelander: "Weaver keep us — who's that? It's the black of the night. A friend knocks, and a friend knocks by day.", markman: "Iron and blood! Who's there? Middle of the night, friend. Say it quick.", aurennais: "Who is there? Master — it is the middle of the night. Whatever our arrangement was, I do not recall it including this hour.", oldblood: "Who stands there. It is meán oíche. The door was shut." };
const lineNow = () => page.evaluate(() => wokenLine(currentHouse));
const enter = async (hr, k = 0) => { await page.evaluate(([hr, k]) => { forceTime(hr); const S = WORLD.settle.get('dunmore');
  const hs = S.houses.filter(x => x.type === 'home' && !x.ownedByPlayer && !x.shuttered); const h = hs[k]; window._h = h; /* S1437: the generated home's rules; a Dunmore home's kit townhouse room is kittownhouse's, so the visit sets its kit aside */ if (h.kit) { h._kitWas = h.kit; h.kit = null; } px = h.exitX; pz = h.exitZ; goToInterior(h); }, [hr, k]);
  await page.waitForTimeout(3000); await g.hide(); };
const leave = async () => { await page.evaluate(() => { try { closeDialog(); } catch (e) {} exitInterior(); }); await page.waitForTimeout(1500); await page.evaluate(() => { const h = window._h; if (h && h._kitWas) { h.kit = h._kitWas; delete h._kitWas; } }); };
// stand 2.1 off the bed's side (or, awake, 1.6 from the resident), look at her, and let the loop draw a few frames for the prompt
const stand = (awake) => page.evaluate(async (awake) => { const b = INT_BEDS.find(b => b.owner === 'home'); const m = intNPCMesh;
  if (awake) { for (const [ox, oz] of [[1.6, 0], [-1.6, 0], [0, 1.6], [0, -1.6]]) { if (!intSolidAt(m.position.x + ox, m.position.z + oz, .3, 0)) { px = m.position.x + ox; pz = m.position.z + oz; break; } } }
  else { px = b.x + 2.1; pz = b.z; }
  jumpY = 0; onGround = true;
  const mid = () => { m.updateMatrixWorld(true); const v = new THREE.Vector3(), c = new THREE.Vector3(); let n = 0; m.traverse(o => { if (o.isBone) { o.getWorldPosition(v); c.add(v); n++; } }); return n ? c.divideScalar(n) : m.position.clone(); };
  for (let i = 0; i < 12; i++) { const c = mid(); lookAtPt(c.x, c.y, c.z); await new Promise(r => requestAnimationFrame(() => r())); }
  const ipr = document.getElementById('ipr'); const out = ipr && ipr.style.display !== 'none' && +ipr.style.opacity > 0 ? ipr.textContent : ''; if (!out) return ('DBG' + JSON.stringify({ t: ipr.textContent, d: ipr.style.display, o: ipr.style.opacity, dist: Math.hypot(px - intNPCPos.x, pz - intNPCPos.z), aim: aimAt({ g: intNPCMesh }, 3.6), cy: CAM.position.y, dir: (()=>{const v=new THREE.Vector3();CAM.getWorldDirection(v);return [v.x,v.y,v.z].map(a=>+a.toFixed(2));})(), to: [m.position.x-px, m.position.y, m.position.z-pz].map(a=>+a.toFixed(2)), yaw, pitch, tp: thirdPerson, vis: m.visible, par: !!m.parent, kids: m.children.length, dlg: dlgOpen, pos: [px, pz, CAM.position.x, CAM.position.z] })); return out; }, !!awake);
const talk = () => page.evaluate(() => { document.getElementById('dlg-text').textContent = ''; interact(); const t = document.getElementById('dlg-text').textContent;
  const ch = [...document.querySelectorAll('#dlg-choices .dlg-choice')].map(b => b.textContent.replace(/^\d+\.\s*/, ''));
  return { open: getComputedStyle(document.getElementById('dlg')).display, text: t, choices: ch, asleep: !!intNPCMesh.userData.asleep, crime: JSON.stringify(worldState.crime || {}) }; });
const close = () => page.evaluate(() => { try { closeDialog(); } catch (e) {} });
await page.evaluate(() => { metNPCs.clear(); });

// 1. at 2h the prompt over the sleeper
await enter(2.0, 6);
const pr = { ipr: await stand() , ...(await page.evaluate(() => ({ asleep: !!intNPCMesh.userData.asleep, keeper: _h.keeper }))) };
check('at 2h the prompt over a sleeping resident reads "<name> (asleep) — Press \'E\' to wake"', pr.asleep && pr.ipr === `${pr.keeper} (asleep) — Press 'E' to wake`, pr);
/* S1407: the HUD's line names a home's resident and says she sleeps, not *the keeper* (the critic's s896) */
const ob1 = await page.evaluate(() => { updateHUD(); return document.getElementById('ob').textContent; });
check('at 2h the HUD line reads "<name> is asleep · Press E to wake", never "the keeper"', ob1 === `${pr.keeper} is asleep · Press E to wake · Walk south to exit`, ob1);
// 2. E wakes her: the night line, and the introduction is there but not first
const crime0 = await page.evaluate(() => JSON.stringify(worldState.crime || {}));
const t1 = await talk(); const L1 = await lineNow();
const intro = t1.choices.findIndex(c => /^My name is /.test(c));
check(`E wakes her and the talk opens with her people's night line in place of the greeting: *${t1.text}*`, t1.open === 'block' && !t1.asleep && t1.text === L1 && Object.values(NIGHT).includes(L1), t1);
check('woken, the introduction is offered but after her own topics (by day it comes before them)', intro > t1.choices.findIndex(c => /^About you/.test(c)) && t1.choices.findIndex(c => /^About you/.test(c)) >= 0, { intro, choices: t1.choices });
check('being woken is no crime: no bounty, no debt', t1.crime === crime0, { before: crime0, after: t1.crime });
await close();
const pr2 = await stand(true);
check('awake now, the prompt is the ordinary one', /— Press 'E' to talk$/.test(pr2) && !/asleep/.test(pr2), pr2);
// 3. the second talk the same visit: the ordinary greeting
const t2 = await talk();
check('talked to again the same night, she does not repeat the night line', t2.open === 'block' && t2.text !== L1 && t2.text.length > 0, t2.text);
await leave();
// 4. woken by a step beside the bed, then E: the night line still comes first
await enter(1.0, 3);
await page.evaluate(() => { const b = INT_BEDS.find(b => b.owner === 'home'); px = b.x + 1.2; pz = b.z + 1.2; WORLD.tickInterior(1 / 60, performance.now()); });
await stand(true);
const t3 = await talk(); const L3 = await lineNow();
check('woken by a step beside the bed, her first words on E are the night line', !t3.asleep && t3.text === L3 && Object.values(NIGHT).includes(L3), t3);
await leave();
// 5. awake hours (22h): ordinary greeting, introduction first as before
await page.evaluate(() => { metNPCs.clear(); });
await enter(22, 6);
const pr3 = await stand(true);
const ob3 = await page.evaluate(() => { updateHUD(); return document.getElementById('ob').textContent; }), k3 = await page.evaluate(() => _h.keeper);
check('at 22h the HUD line names her: "Press E near <name> to talk"', ob3 === `Press E near ${k3} to talk · Walk south to exit`, ob3);
const t4 = await talk();
const i4 = t4.choices.findIndex(c => /^My name is /.test(c)), a4 = t4.choices.findIndex(c => /^About you/.test(c));
check('at 22h (awake) the prompt and greeting are the ordinary ones, and the introduction comes before her own topics as before', /— Press 'E' to talk$/.test(pr3) && t4.open === 'block' && t4.text && !Object.values(NIGHT).includes(t4.text) && i4 >= 0 && i4 < a4, { pr3, text: t4.text, choices: t4.choices });
await leave();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
