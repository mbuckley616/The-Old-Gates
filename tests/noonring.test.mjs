// The Noon Ring (Session 786; the page's Sky row, in the approved draft's words, Michael's 1A on DECISION #263): the Sundial
// Ring is the Noon Ring now. Used from the bag, once a game-day, it turns the weather: clear to rain, rain to clear; any other
// sky, or under a roof, it does not turn. Carried in a storm, one lightning flash in three comes down close (the draft's line
// the first time, a log line after). The trial on the cairn is owed (its prop is the look builder's).
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;
await g.intoWorld();

const r = await page.evaluate(() => {
  delete worldState.artifacts; if (worldState.stats) delete worldState.stats.ringStruck; window._keepA = { ...ATTRS };
  ATTRS.swiftness = 30; const c = artifactTry('sundial_ring'); const i = BAG.findIndex(it => it.artifact === 'sundial_ring'); const it = BAG[i];
  const said = []; const sm = showMsg; showMsg = (t) => said.push(t);
  const use = () => { said.length = 0; useItem(BAG.findIndex(x => x.artifact === 'sundial_ring')); return said[0]; };
  const set = (w) => { WX.type = w; WX.next = w; WX.k = 0; };
  const out = { name: ARTIFACTS.sundial_ring.name, ok: c.ok, item: it && { name: it.name, unique: it.unique, desc: it.desc } };
  set('clear'); const d0 = worldState.gameTimeAbsMinutes; out.clear = use(); out.clearNext = WX.next; out.again = use(); out.againNext = WX.next;
  worldState.gameTimeAbsMinutes = d0 + 1440; set('rain'); out.rain = use(); out.rainNext = WX.next;
  worldState.gameTimeAbsMinutes = d0 + 2880; set('fog'); out.fog = use(); out.fogNext = WX.next; set('storm'); out.storm = use();
  out.log = GAME_LOG.slice(-2).map(l => l.icon + ' ' + l.text);
  // the storm's lightning: with the ring, about one flash in three is close; without, none
  set('storm'); const flashes = (n) => { let close = 0; for (let k = 0; k < n; k++) if (noonRingFlash()) close++; return close; };
  said.length = 0; const n = 3000, withRing = flashes(n); out.firstStrike = said[0]; out.strikeLines = said.length; out.after = GAME_LOG[GAME_LOG.length - 1].text;
  BAG.splice(BAG.indexOf(it), 1); out.without = flashes(300); out.withRing = withRing / n;
  // through the weather tick itself: a flash in a storm calls it
  BAG.push(it); WX.storm = 1; let calls = 0; const f = noonRingFlash; noonRingFlash = () => { calls++; return f(); }; WX.flashT = 0;
  for (let k = 0; k < 600; k++) WORLD.tick(1 / 60, performance.now()); noonRingFlash = f; out.tickCalls = calls;
  showMsg = sm; BAG.splice(BAG.indexOf(it), 1); delete worldState.artifacts; Object.assign(ATTRS, window._keepA); set('clear');
  return out; });
console.log(JSON.stringify(r));
check(`the Sundial Ring is *${r.name}* now; taken at Swiftness 30, *${r.item.name}*, unique, with the draft's words`, r.name === 'the Noon Ring' && r.ok && r.item.name === 'The Noon Ring' && r.item.unique && /Fáinne an Lae/.test(r.item.desc), r);
check(`under a clear sky: *${r.clear}*, and the weather turns to rain`, r.clear === 'You turn the ring a quarter on your finger. By the time you look up, the sky has begun to close.' && r.clearNext === 'rain', r);
check(`the same day: *${r.again}*, and nothing turns`, r.again === 'The ring will not turn again today.' && r.againNext === 'rain', r);
check(`the next day in rain: *${r.rain}*, and it clears`, r.rain === 'You turn the ring back. The rain thins and stops, and the light comes through as if it had only been waiting.' && r.rainNext === 'clear', r);
check(`in fog and in a storm: *${r.fog}*; the sky is left as it is`, r.fog === 'The ring does not turn under this sky.' && r.storm === r.fog && r.fogNext === 'fog' && r.log.every(l => l.startsWith('☀')), r);
check(`in a storm, ${(r.withRing * 100).toFixed(1)}% of flashes come down close with the ring, ${r.without} without; the first says *${r.firstStrike}*, the rest log *${r.after}*`, Math.abs(r.withRing - 1 / 3) < .04 && r.without === 0 && r.firstStrike === 'Lightning comes down a stone’s throw from you. The ring is warm.' && r.strikeLines === 1 && r.after === 'Lightning, close.', r);
check(`the weather's own tick asks it at each flash (${r.tickCalls} in ten seconds of storm)`, r.tickCalls >= 1, r);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
