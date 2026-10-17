// F2b, session 1 (Session 1033; docs/design/scale-numbers-build.md, *Reach* and *Sight, hearing*): your blow's reach is hull
// to hull in metres, by weapon class, so it lands when the foe's centre is inside your hull (0.30) + the weapon's reach + the
// foe's hull. The sheet's `reachtable` row: each class against a townsperson (a Bandit, 0.30), a wolf (0.35) and a troll (0.8),
// stepped in by 0.05 from 4 m; the first distance that lands is within 0.05 of the sheet's table. With it the shove (0.8 hull
// to hull) and the sheet's `stillhear` row: a foe facing away hears you standing still at 0.9 centre to centre (it was 0.5).
// The numbers below are the sheet's, written out, not read from the code.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const SHEET = { Fists: .9, Dagger: 1.2, Sword: 1.6, Scimitar: 1.6, Mace: 1.6, Longsword: 1.8, Flail: 1.8, GreatClub: 1.9, WarHammer: 1.9, Claymore: 2.2, GreatAxe: 2.2 };
const HULL = { you: .30, Bandit: .30, Wolf: .35, 'Cave Troll': .8 };
const r = await page.evaluate(([SHEET]) => {
  const sc = new THREE.Group(); scene.add(sc); sc.visible = false;
  const foes = {}; for (const k of ['Bandit', 'Wolf', 'Cave Troll']) { const e = buildZoneEnemy(sc, [], px + 50, pz + 50, k, null); e.alert = true; e.locked = false; foes[k] = e; }
  const saveZE = ZE.slice(), w0 = EQ.weapon, sh0 = EQ.offhand;
  const shapes = { Dagger: 'dagger', Sword: 'sword', Scimitar: 'scimitar', Mace: 'mace', Longsword: 'longsword', Flail: 'flail', GreatClub: 'greatclub', WarHammer: 'warhammer', Claymore: 'claymore', GreatAxe: 'greataxe' };
  const weapon = cls => { if (cls === 'Fists') return null; const T = WEAPON_TYPES.find(t => t.shape === shapes[cls] || t.weaponShape === shapes[cls]); if (!T) return undefined; const it = makeItem(1, T, null, false); return it; };
  const place = (e, d) => { e.x = px + fwdX * d; e.z = pz + fwdZ * d; if (e.mesh) e.mesh.position.set(e.x, e.mesh.position.y, e.z); };
  const rows = [];
  for (const cls of Object.keys(SHEET)) {
    const w = weapon(cls); if (w === undefined) { rows.push({ cls, missing: true }); continue; }
    EQ.weapon = w; const row = weaponAttack(w);
    for (const [kind, e] of Object.entries(foes)) {
      ZE.length = 0; ZE.push(e); let first = null;
      for (let k = 400; k > 20; k -= 5) { const d = k / 100; place(e, d); e.hp = e.maxHp = 1e6; e.dead = false; delete e.staggerUntil; e.shieldUp = false;
        resolvePlayerStrike(false); if (e.hp < 1e6) { first = +d.toFixed(2); break; } }
      rows.push({ cls, kind, row: row.reach, first, want: +(reachTo(e, row.reach)).toFixed(2), hull: hullOf(e) });
    }
  }
  // the shove, no shield: the first distance at which it reaches the Bandit
  EQ.weapon = null; EQ.offhand = null; const b = foes.Bandit; ZE.length = 0; ZE.push(b); let shove = null;
  for (let k = 300; k > 20; k -= 5) { const d = k / 100; place(b, d); b.alert = false; atkCd = 0; stamina = maxStamina; b.posture = b.maxPosture; doBash(); if (b.alert) { shove = +d.toFixed(2); break; } }
  // still hearing: the Bandit faces away, you stand still, stepped in from 2 m
  _pStep = false; _sneaking = false; let heard = null;
  for (let k = 200; k > 10; k -= 5) { const d = k / 100; place(b, d); b.combatYaw = Math.atan2(fwdX, fwdZ); if (canSeePlayer(b, d, 20)) { heard = +d.toFixed(2); break; } }
  ZE.length = 0; saveZE.forEach(e => ZE.push(e)); EQ.weapon = w0; EQ.offhand = sh0; scene.remove(sc); atkCd = 0;
  return { rows, shove, heard };
}, [SHEET]);
console.log(JSON.stringify(r));
const rows = r.rows.filter(x => !x.missing);
check('every weapon class in the sheet is in the game', r.rows.every(x => !x.missing), r.rows.filter(x => x.missing));
check('the hulls are the sheet\'s: a Bandit 0.30, a wolf 0.35, a troll 0.8', rows.every(x => Math.abs(x.hull - HULL[x.kind]) < 1e-9), rows.map(x => [x.kind, x.hull]));
check('each class\'s reach is the sheet\'s, hull to hull', Object.keys(SHEET).every(c => rows.filter(x => x.cls === c).every(x => Math.abs(x.row - SHEET[c]) < 1e-9)), rows.map(x => [x.cls, x.row]));
check('the first distance that lands is within 0.05 of you + reach + its hull, all classes × three foes',
  rows.length === 33 && rows.every(x => x.first != null && Math.abs(x.first - (HULL.you + SHEET[x.cls] + HULL[x.kind])) <= 0.05 + 1e-9), rows.map(x => [x.cls, x.kind, x.first, +(HULL.you + SHEET[x.cls] + HULL[x.kind]).toFixed(2)]));
const sw = rows.find(x => x.cls === 'Sword' && x.kind === 'Bandit'), dg = rows.find(x => x.cls === 'Dagger' && x.kind === 'Bandit'), cl = rows.find(x => x.cls === 'Claymore' && x.kind === 'Bandit');
check('against a townsperson a sword still lands at 2.2 centre to centre; the dagger at 1.8, the claymore at 2.8', Math.abs(sw.first - 2.2) <= .05 + 1e-9 && Math.abs(dg.first - 1.8) <= .05 + 1e-9 && Math.abs(cl.first - 2.8) <= .05 + 1e-9, { sw, dg, cl });
check('the shove reaches a Bandit at 0.8 hull to hull (1.4 centre to centre; it was 2.0)', r.shove != null && Math.abs(r.shove - 1.4) <= .05 + 1e-9, r.shove);
check('standing still behind a guard, you are heard at 0.9 (it was 0.5)', r.heard != null && Math.abs(r.heard - 0.9) <= .05 + 1e-9, r.heard);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
