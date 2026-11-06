// The combat music (Session 231): the fight's cue on the exploring orchestra, scheduled against the audio clock,
// its layers following the fight, and a close that fades instead of cutting. Rendered offline to measure it.
// Session 1901: the islands' bands (OG-112): each island's exploring music on its own five instruments, picked by where you stand.
import { boot, check } from './lib/game.mjs';
const g = await boot(); const { page } = g;

const r = await page.evaluate(async () => {
  const H = devMusicHook, COMBAT = H.combat, EXPLORE = H.explore; const SR = 22050; const saveBus = EXPLORE.bus, saveVerb = EXPLORE.verb;
  const render = async (secs, fn) => {
    const off = new OfflineAudioContext(1, SR * secs, SR); const mg = off.createGain(); mg.connect(off.destination); const p = H.swap(off, mg);
    EXPLORE.bus = null; EXPLORE.verb = null; COMBAT.bus = null; COMBAT.log = [];
    try { fn(off); } finally { H.swap(p[0], p[1]); } EXPLORE.bus = saveBus; EXPLORE.verb = saveVerb; COMBAT.bus = null; H.zone = '';
    const buf = await off.startRendering(); const d = buf.getChannelData(0);
    const rms = []; for (let s = 0; s < secs; s++) { let a = 0; for (let i = s * SR; i < (s + 1) * SR; i++) a += d[i] * d[i]; rms.push(+Math.sqrt(a / SR).toFixed(4)); }
    return rms; };
  const themes = [];
  // 1. the fight grows: one foe for bars 0-5, three for 6-9, a boss (heat 6) after
  let log1 = null, theme1 = null;
  const rms1 = await render(28, () => { H.zone = ''; COMBAT.heat = 1; startMusic('combat'); if (COMBAT.timer) { clearTimeout(COMBAT.timer); COMBAT.timer = null; }
    theme1 = COMBAT.theme; const bar = 4 * 60 / theme1.bpm; combatFill(6 * bar); COMBAT.heat = 3; combatFill(10 * bar); COMBAT.heat = 6; combatFill(14 * bar); log1 = COMBAT.log.slice(); });
  const bar = 4 * 60 / theme1.bpm;
  const drift = Math.max(...log1.map((L, i) => Math.abs(L.t - (log1[0].t + i * bar))));
  const layersAt = b => (log1.find(L => L.bar === b) || { layers: [] }).layers.join('+');
  // 2. the close: two bars, then the fight ends at t=0 of the clock; the cue must be silent by 4 s
  const rms2 = await render(6, () => { H.zone = ''; COMBAT.heat = 3; startMusic('combat'); if (COMBAT.timer) { clearTimeout(COMBAT.timer); COMBAT.timer = null; } combatFill(.6); combatEnd(); });
  // 3. themes change between fights
  for (let i = 0; i < 6; i++) { await render(1, () => { H.zone = ''; startMusic('combat'); if (COMBAT.timer) { clearTimeout(COMBAT.timer); COMBAT.timer = null; } themes.push(COMBAT.theme.id); combatEnd(); }); }
  EXPLORE.bus = saveBus; EXPLORE.verb = saveVerb; COMBAT.bus = null; COMBAT.log = null; H.zone = '';
  return { theme: theme1.id, bpm: theme1.bpm, bars: log1.length, drift: +drift.toExponential(2), l1: layersAt(4), l3: layersAt(7), l6: layersAt(10), rms1, rms2, themes };
});
// 4. in the game's own audio context: a fight starts and hands back to the exploring music
const live = await page.evaluate(async () => { const H = devMusicHook; initAudio(); H.zone = '';
  startMusic('combat'); const during = { zone: H.zone, bus: !!H.combat.bus, timer: !!H.combat.timer };
  await new Promise(res => setTimeout(res, 1500)); const bars = H.combat.bar;
  startMusic('road'); const after = { zone: H.zone, bus: !!H.combat.bus, timer: !!H.combat.timer, explore: H.explore.playing };
  return { during, bars, after }; });
// 5. the islands' bands (Session 1901): each island's five instruments sound, a piece takes them, and the island you stand on picks them
const band = await page.evaluate(async () => {
  const H = devMusicHook, EXPLORE = H.explore, SR = 22050; const saveBus = EXPLORE.bus, saveVerb = EXPLORE.verb;
  const render = async (secs, fn) => { const off = new OfflineAudioContext(1, SR * secs, SR); const mg = off.createGain(); mg.connect(off.destination); const p = H.swap(off, mg);
    EXPLORE.bus = null; EXPLORE.verb = null; try { fn(); } finally { H.swap(p[0], p[1]); } EXPLORE.bus = saveBus; EXPLORE.verb = saveVerb;
    const d = (await off.startRendering()).getChannelData(0); let a = 0, bad = 0; for (let i = 0; i < d.length; i++) { if (!isFinite(d[i])) bad++; else a += d[i] * d[i]; } return { rms: +Math.sqrt(a / d.length).toFixed(4), bad }; };
  const own = { gatelands: ['fiddle', 'whistle', 'bodhran', 'harp', 'lute'], mark: ['tagelharpa', 'warhorn', 'framedrum', 'lyre', 'boneflute'], aurenne: ['oud', 'qanun', 'ney', 'riq', 'santur'] };
  const voices = {}; for (const k in own) for (const v of own[k]) voices[v] = await render(2, () => VOICES[v](v === 'riq' ? 80 : 64, .05, 1.2, .1));
  const home = PIECES.find(p => p.id === 'home'), roads = PIECES.find(p => p.id === 'roads'), isl = {};
  const win = (P, B, from) => { const ev = pieceEvents(P, B).events; return ev.filter(e => e.t >= from && e.t < from + 6); };
  const t0 = pieceEvents(home, ISLAND_BAND.gatelands).events.find(e => e.v === 'bodhran').t;
  for (const k of [null, 'gatelands', 'mark', 'aurenne']) { const B = k ? ISLAND_BAND[k] : null;
    const used = [...new Set([...pieceEvents(home, B).events, ...pieceEvents(roads, B).events].map(e => e.v))].sort();
    const w = win(home, B, t0); isl[k || 'orchestra'] = { used, snd: await render(7, () => { for (const e of w) VOICES[e.v](e.m, e.t - t0 + .05, e.d, e.vel); }) }; }
  // the pick: a spot of each nation in the open world, then a dungeon (the last island holds)
  const was = { px, pz, z: activeZoneId, isl: EXPLORE.island, f: EXPLORE.forceIsland }, spot = {};
  for (let i = 0; i < 40 && Object.keys(spot).length < 3; i++) for (let j = 0; j < 40; j++) { const x = (i + .5) * WORLD.SIZE, z = (j + .5) * WORLD.SIZE, n = nationAt(x, z); if (!spot[n]) spot[n] = [x, z]; }
  const pick = {}; EXPLORE.forceIsland = null; activeZoneId = 'world';
  for (const n in spot) { EXPLORE.island = null; px = spot[n][0]; pz = spot[n][1]; pick[n] = musicIsland(); }
  activeZoneId = 'dungeon'; px = spot.gatelands ? spot.gatelands[0] : px; pz = spot.gatelands ? spot.gatelands[1] : pz; EXPLORE.island = 'mark'; const held = musicIsland();
  px = was.px; pz = was.pz; activeZoneId = was.z; EXPLORE.island = was.isl; EXPLORE.forceIsland = was.f;
  return { voices, isl, spot, pick, held, own };
});
console.log(JSON.stringify(band));
check('each island\'s five instruments sound, with no bad samples', Object.entries(band.voices).every(([k, v]) => v.rms > (/bodhran|framedrum|riq/.test(k) ? .001 : .003) && !v.bad), band.voices);
const B = band.isl, has = (k, list) => list.filter(v => v !== 'harp' || k === 'gatelands').every(v => B[k].used.includes(v));
check('a piece takes the island\'s band: its own lead, arpeggio, counter-line and drum, and no orchestral horn, flute, bells or timpani',
  ['gatelands', 'mark', 'aurenne'].every(k => has(k, band.own[k]) && !B[k].used.some(v => ['horn', 'flute', 'bells', 'timpani'].includes(v))) && B.orchestra.used.includes('horn') && B.orchestra.used.includes('timpani'),
  Object.fromEntries(Object.entries(B).map(([k, v]) => [k, v.used.join(',')])));
check('each band sits within 3 dB of the orchestra in the same bars', ['gatelands', 'mark', 'aurenne'].every(k => !B[k].snd.bad && Math.abs(20 * Math.log10(B[k].snd.rms / B.orchestra.snd.rms)) < 3),
  Object.fromEntries(Object.entries(B).map(([k, v]) => [k, v.snd.rms])));
check('the island you stand on picks the band, and the last one holds under ground', Object.keys(band.pick).length === 3 && Object.entries(band.pick).every(([n, b]) => n === b) && band.held === 'mark', { spot: band.spot, pick: band.pick, held: band.held });
console.log(JSON.stringify(r)); console.log(JSON.stringify(live));
check('live: a fight\'s cue schedules ahead, then gives way to the exploring music', live.during.zone === 'combat' && live.during.bus && live.bars >= 1 && live.after.zone === 'explore' && !live.after.bus && !live.after.timer && live.after.explore, live);
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
const b = 4 * 60 / r.bpm;
const quiet = avg(r.rms1.slice(1, Math.floor(6 * b))), loud = avg(r.rms1.slice(Math.ceil(10 * b) + 1, Math.floor(14 * b)));
check('bars land on the audio clock with no drift', r.bars >= 14 && r.drift < 1e-9, { bars: r.bars, drift: r.drift });
check('layers follow the fight: one foe, three, a boss', r.l1 === 'ost+drum' && r.l3 === 'ost+drum+high+pad+horn' && /choir/.test(r.l6), { l1: r.l1, l3: r.l3, l6: r.l6 });
check('it sounds, and louder as the fight grows', r.rms1.slice(0, Math.floor(14 * b)).every(x => x > .002) && loud > quiet * 1.2, { quiet: +quiet.toFixed(4), loud: +loud.toFixed(4), rms: r.rms1 });
check('the close fades to silence instead of cutting', r.rms2[0] > .002 && r.rms2[2] > .0005 && r.rms2[5] < r.rms2[0] * .02, r.rms2);
check('a fight never repeats the last fight\'s theme', r.themes.every((t, i) => !i || t !== r.themes[i - 1]) && new Set(r.themes).size >= 2, r.themes);
check('no page errors', g.errs.length === 0, g.errs);
await g.close();
