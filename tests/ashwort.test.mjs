// The last-but-one of decision #58's four (Session 329, Michael's A): Ashwort's *minimap pulse, reveals nearby enemies
// for 5s*. Nothing read it. Underground, the minimap shows a foe only in a cell you have seen; for the pulse's 5 s it
// shows every undisguised foe on the floor within 20 units, seen or not.
import { boot, check } from './lib/game.mjs';
import { enterDungeon } from './lib/dungeonshot.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();
await enterDungeon(page, { theme: 'goblin', seed: 5 });
const r = await page.evaluate(() => {
  const red = () => { const d = mmC.getImageData(0, 0, 104, 104).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 0xcc && d[i + 1] === 0x33 && d[i + 2] === 0x22) n++; return n; };
  const live = ENEMIES.filter(e => !e.dead && e.floor === currentFloor && !e.disguised);
  const e = live[0]; const x0 = px, z0 = pz;
  // nothing seen: the map's own reveal (5 units round you, each draw) is cleared before every draw, and you stand 12 off
  const M = currentFloor === 2 ? mmRevealed2 : mmRevealed; const draw = () => { for (const row of M) row.fill(0); drawMM(); };
  // Chromium moves a 2D canvas off the GPU after a couple of reads, and its fractional-edge squares then rasterise a few
  // pixels differently (CI saw bare 31, after 29 on the same foes): read it past that switch before counting anything
  for (let i = 0; i < 4; i++) { draw(); red(); }
  ACTIVE_BUFFS.length = 0; px = e.x + 12; pz = e.z; draw(); const bare = red();
  HERB_CONSUME_COUNTS.ashwort = 20; BAG.push(Object.assign({}, HERB_DEF.ashwort.item, { _typeKey: 'ashwort', qty: 1 })); useHerb(BAG.length - 1);
  const buff = ACTIVE_BUFFS.find(b => b.type === 'minimapPulse'); draw(); const pulsed = red();
  const near = live.filter(f => Math.hypot(f.x - px, f.z - pz) < 20).length, byYou = live.filter(f => Math.hypot(f.x - px, f.z - pz) < 6).length;
  px = e.x + 400; pz = e.z + 400; draw(); const far = red();
  ACTIVE_BUFFS.length = 0; px = e.x + 12; pz = e.z; draw(); const after = red(); px = x0; pz = z0;
  return { foes: live.length, near, byYou, bare, pulsed, far, after, has: !!buff, dur: buff && (buff.remaining ?? buff.t ?? buff.dur ?? buff.duration) };
});
console.log('pulse', JSON.stringify(r));
check('eaten, Ashwort gives the pulse', r.has, r);
check('bare, only the foes the map itself reveals round you (5 units) show; under the pulse the rest within 20 units show too; 400 units off, none; after it ends, as bare', r.near > r.byYou && r.bare <= 25 * r.byYou && r.pulsed >= r.bare + 16 * (r.near - r.byYou) && r.far === 0 && r.after === r.bare, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
