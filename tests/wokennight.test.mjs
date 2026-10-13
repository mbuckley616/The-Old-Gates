// Session 770 — a householder woken in the night (Michael's A on #255; the critic's s585). Over a sleeper the prompt reads
// *<name> (asleep) — Press 'E' to wake*. Woken, the first talk opens with a night line by her people (the quest writer's
// WOKEN_LINES, the decision's line until then) in place of the greeting, and the introduction is not first. Said once a visit;
// by day and in the awake hours the talk is as before. No crime.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld(); await g.settle('dunmore');
const LINE = "What — who's there? It's the middle of the night.";
const enter = async (hr, k = 0) => { await page.evaluate(([hr, k]) => { forceTime(hr); const S = WORLD.settle.get('dunmore');
  const hs = S.houses.filter(x => x.type === 'home' && !x.ownedByPlayer && !x.shuttered); const h = hs[k]; window._h = h; px = h.exitX; pz = h.exitZ; goToInterior(h); }, [hr, k]);
  await page.waitForTimeout(3000); await g.hide(); };
const leave = async () => { await page.evaluate(() => { try { closeDialog(); } catch (e) {} exitInterior(); }); await page.waitForTimeout(1500); };
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
// 2. E wakes her: the night line, and the introduction is there but not first
const crime0 = await page.evaluate(() => JSON.stringify(worldState.crime || {}));
const t1 = await talk();
const intro = t1.choices.findIndex(c => /^My name is /.test(c));
check('E wakes her and the talk opens with the night line in place of the greeting', t1.open === 'block' && !t1.asleep && t1.text === LINE, t1);
check('woken, the introduction is offered but after her own topics (by day it comes before them)', intro > t1.choices.findIndex(c => /^About you/.test(c)) && t1.choices.findIndex(c => /^About you/.test(c)) >= 0, { intro, choices: t1.choices });
check('being woken is no crime: no bounty, no debt', t1.crime === crime0, { before: crime0, after: t1.crime });
await close();
const pr2 = await stand(true);
check('awake now, the prompt is the ordinary one', /— Press 'E' to talk$/.test(pr2) && !/asleep/.test(pr2), pr2);
// 3. the second talk the same visit: the ordinary greeting
const t2 = await talk();
check('talked to again the same night, she does not repeat the night line', t2.open === 'block' && t2.text !== LINE && t2.text.length > 0, t2.text);
await leave();
// 4. woken by a step beside the bed, then E: the night line still comes first
await enter(1.0, 3);
await page.evaluate(() => { const b = INT_BEDS.find(b => b.owner === 'home'); px = b.x + 1.2; pz = b.z + 1.2; WORLD.tickInterior(1 / 60, performance.now()); });
await stand(true);
const t3 = await talk();
check('woken by a step beside the bed, her first words on E are the night line', !t3.asleep && t3.text === LINE, t3);
await leave();
// 5. awake hours (22h): ordinary greeting, introduction first as before
await page.evaluate(() => { metNPCs.clear(); });
await enter(22, 6);
const pr3 = await stand(true);
const t4 = await talk();
const i4 = t4.choices.findIndex(c => /^My name is /.test(c)), a4 = t4.choices.findIndex(c => /^About you/.test(c));
check('at 22h (awake) the prompt and greeting are the ordinary ones, and the introduction comes before her own topics as before', /— Press 'E' to talk$/.test(pr3) && t4.open === 'block' && t4.text && t4.text !== LINE && i4 >= 0 && i4 < a4, { pr3, text: t4.text, choices: t4.choices });
await leave();
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
