// The Mark's rings (arenas-build.md, the sheet's `ring` suite). Session 1639 laid the ladder's ground: the twelve bouts' table, the
// rings it is fought in, each bout's fighter (its tier, its moves by bout, its weapon rolled on its id, the shield of 10 or 11 and the
// champion's), and the two saves (`arena` the character's, `rings` the world's). The call, the purse, the forfeit and the wager join it
// as their sessions land.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await page.evaluate(() => { REN.render = () => {}; });

const r = await page.evaluate(() => {
  const out = {};
  out.rows = LADDER.map(b => b.tier + ':' + b.purse + ':' + (b.feint ? 'f' : '') + (b.heavy ? 'h' : '')).join(' ');
  const S = ladderSites(); out.sites = S.map(s => s.name + ' (' + s.kind + ')'); out.seat = S[0] && S[0].anchor;
  out.mark = S.every(s => { const [i, j] = cellOf(s.x, s.z); return nationKeyOf(i, j) === 'mark'; });
  // fighters, built away from you and from each other, then taken out again
  const F = {}; const x0 = px + 60, z0 = pz + 60;
  for (const b of [1, 4, 7, 10, 11, 12]) { const e = ladderFighter(b, x0 + b * 3, z0); F[b] = e; }
  const rolls = (e) => { let h = 0, f = 0; e._heavyLast = e._feintLast = false; for (let k = 0; k < 60; k++) { if (foeHeavyRoll(e)) h++; else if (foeFeintRoll(e)) f++; } return { h, f }; };
  out.moves = Object.fromEntries([1, 4, 7].map(b => [b, rolls(F[b])]));
  out.tier = Object.fromEntries([1, 4, 7, 12].map(b => [b, F[b].tier != null ? F[b].tier : null]));
  out.shield = Object.fromEntries([10, 11, 12].map(b => [b, !!F[b].shieldUp]));
  const plain4 = buildZoneEnemy(scene, [], x0, z0 + 9, 'Bandit Captain', null, { tier: 4 }); out.champ = { hp: F[12].maxHp, base: plain4.maxHp };
  if (plain4.mesh && plain4.mesh.parent) plain4.mesh.parent.remove(plain4.mesh);
  for (const e of Object.values(F)) if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh);
  out.w = []; for (let b = 1; b <= 12; b++) out.w.push(ladderWeapon(b));
  out.kind = foeWeaponKind(F[4]) === ladderWeapon(4) && foeWeaponKind(F[1]) === ladderWeapon(1);
  out.ids = [1, 12].map(b => F[b].id);
  // the save: rank and the ban are the character's, a dead name on a post the world's
  const A = arenaState(); A.rank = 5; A.banUntil = dayNow() + 28; const R = ringOf(S[0].id); R.dead.push('Test Fighter'); ringsState().next[5] = 1;
  const d = JSON.parse(ssStringify(_buildSavePayload())); const rows = ssSplitPayload(d);
  out.inC = !!rows.c.wS && !!rows.c.wS.arena && !(rows.c.wS && rows.c.wS.rings); out.inW = !!rows.w.wS && !!rows.w.wS.rings && !rows.w.wS.arena;
  delete worldState.arena; delete worldState.rings;
  _applyLoadData(JSON.parse(JSON.stringify(rows.c)), JSON.parse(JSON.stringify(rows.w)));
  out.back = { rank: arenaState().rank, ban: arenaState().banUntil - dayNow(), dead: ringOf(S[0].id).dead.slice(), id5: ladderFighterId(5) };
  return out; });
console.log(JSON.stringify(r));
check(`the ladder's twelve bouts, tier:purse:moves: ${r.rows}`,
  r.rows === '1:50: 1:60: 1:70: 2:120:f 2:140:f 2:160:f 3:250:fh 3:280:fh 3:310:fh 4:450:fh 4:500:fh 4:1000:fh', r.rows);
check(`its rings: ${r.sites.join(', ')}, Caer Slige first, every one Markish`, r.seat === 'caer_slige' && r.mark && r.sites.length >= 4, r);
check(`moves by bout, in 60 wind-ups: bout 1 heavy ${r.moves[1].h} feint ${r.moves[1].f}; bout 4 heavy ${r.moves[4].h} feint ${r.moves[4].f}; bout 7 heavy ${r.moves[7].h} feint ${r.moves[7].f}`,
  r.moves[1].h === 0 && r.moves[1].f === 0 && r.moves[4].h === 0 && r.moves[4].f > 0 && r.moves[7].h > 0 && r.moves[7].f > 0, r.moves);
check(`a shield on one of bouts 10 and 11 (${r.shield[10]}, ${r.shield[11]}) and on the champion (${r.shield[12]})`, r.shield[10] !== r.shield[11] && r.shield[12], r.shield);
check(`the champion's health ×1.6 over a tier-4 fighter: ${r.champ.hp} against ${r.champ.base}`, r.champ.hp === Math.round(r.champ.base * 1.6), r.champ);
check(`weapons by bout, never the bout before's: ${r.w.join(', ')}; the fighter holds its own (${r.kind})`,
  r.w.every((w, i) => ['sword', 'axe', 'mace', 'spear', 'dagger'].includes(w) && (i === 0 || w !== r.w[i - 1])) && r.kind, r.w);
check(`fighters keyed by bout and replacement: ${r.ids.join(', ')}`, r.ids[0] === 'ring:1:0' && r.ids[1] === 'ring:12:0', r.ids);
check(`the save: the arena in the character row (${r.inC}), the rings in the world row (${r.inW}); back after a load: rank ${r.back.rank}, ban ${r.back.ban} days, the post's ${r.back.dead.join()}, bout 5's fighter ${r.back.id5}`,
  r.inC && r.inW && r.back.rank === 5 && r.back.ban === 28 && r.back.dead.join() === 'Test Fighter' && r.back.id5 === 'ring:5:1', r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
