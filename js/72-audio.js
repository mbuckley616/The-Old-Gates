

// ══════════════════════════════════════════════════════════════════════════
// AUDIO SYSTEM
// ══════════════════════════════════════════════════════════════════════════
let AX=null; // AudioContext — created on first user interaction
let masterGain=null,sfxGain=null,musicGain=null,uiGain=null;
let volLevel=2; // 0=mute 1=quiet 2=loud
const VOL_ICONS=['🔇','🔉','🔊'];
const VOL_MUSIC=[0,0.18,0.38];
const VOL_SFX  =[0,0.28,0.55];

// v61b0: optional override for initAudio's automatic startMusic call.
// Set this to {zone, theme} BEFORE calling initAudio (or _enterGame
// which calls it) to skip the default 'overworld' music start. The
// tutorial flow uses this so character creation → tutorial spawn never
// briefly plays village music between the audio context init and the
// dungeon music switch. Reset to null after use so subsequent
// initAudio calls (defensive — initAudio is normally idempotent) don't
// inherit the tutorial value.
let _initialMusicOverride = null;
function initAudio(){
  if(AX)return;
  try{
    AX=new(window.AudioContext||window.webkitAudioContext)();
    masterGain=AX.createGain();masterGain.gain.value=1;masterGain.connect(AX.destination);
    musicGain=AX.createGain();musicGain.gain.value=VOL_MUSIC[volLevel]*volKind('music');musicGain.connect(masterGain);
    sfxGain=AX.createGain();sfxGain.gain.value=VOL_SFX[volLevel]*volKind('effects');sfxGain.connect(masterGain);
    uiGain=AX.createGain();uiGain.gain.value=VOL_SFX[volLevel]*.28*volKind('effects');uiGain.connect(masterGain);
    if(_initialMusicOverride){
      startMusic(_initialMusicOverride.zone, _initialMusicOverride.theme);
    } else {
      startMusic('overworld');
    }
  }catch(e){console.warn('Audio init failed',e);}
}
function cycleVol(){
  volLevel=(volLevel+1)%3;
  document.getElementById('vol-btn').textContent=VOL_ICONS[volLevel];
  applyVolumes();
}
// S691 — the settings sheet's four volumes (everything, music, blows and steps, spoken lines) over the button's level
function volKind(k){return (SETTINGS.master/100)*(SETTINGS[k]/100);}
function applyVolumes(){
  if(!AX)return;
  musicGain.gain.setTargetAtTime(VOL_MUSIC[volLevel]*volKind('music'),AX.currentTime,.1);
  sfxGain.gain.setTargetAtTime(VOL_SFX[volLevel]*volKind('effects'),AX.currentTime,.1);
  if(uiGain)uiGain.gain.setTargetAtTime(VOL_SFX[volLevel]*.28*volKind('effects'),AX.currentTime,.1);
}

// ── SFX HELPERS ───────────────────────────────────────────────────────────
function uiNoise(dur,gainPk,filterFreq){
  if(!AX||volLevel===0||!uiGain)return;
  const t=AX.currentTime;
  const buf=AX.createBuffer(1,Math.ceil(AX.sampleRate*dur),AX.sampleRate);
  const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const src=AX.createBufferSource();src.buffer=buf;
  const filt=AX.createBiquadFilter();filt.type='bandpass';filt.frequency.value=filterFreq||800;filt.Q.value=1.5;
  const g=AX.createGain();g.gain.setValueAtTime(gainPk,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(filt);filt.connect(g);g.connect(uiGain);src.start(t);src.stop(t+dur);
}
function uiTone(freq,freqEnd,dur,gainPk,wave='sine'){
  if(!AX||volLevel===0||!uiGain)return;
  const t=AX.currentTime;
  const o=AX.createOscillator();o.type=wave;o.frequency.setValueAtTime(freq,t);
  if(freqEnd)o.frequency.exponentialRampToValueAtTime(freqEnd,t+dur);
  const g=AX.createGain();g.gain.setValueAtTime(gainPk,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(uiGain);o.start(t);o.stop(t+dur);
}
function sfxNoise(dur,freq,freqEnd,gainPk,filterFreq){
  if(!AX||volLevel===0)return;
  const t=AX.currentTime;
  const buf=AX.createBuffer(1,Math.ceil(AX.sampleRate*dur),AX.sampleRate);
  const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const src=AX.createBufferSource();src.buffer=buf;
  const filt=AX.createBiquadFilter();filt.type='bandpass';filt.frequency.value=filterFreq||800;filt.Q.value=1.5;
  const g=AX.createGain();g.gain.setValueAtTime(gainPk,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(filt);filt.connect(g);g.connect(sfxGain);src.start(t);src.stop(t+dur);
}
function sfxTone(freq,freqEnd,dur,gainPk,wave='sine',detune=0){
  if(!AX||volLevel===0)return;
  const t=AX.currentTime;
  const o=AX.createOscillator();o.type=wave;o.frequency.setValueAtTime(freq,t);
  if(freqEnd)o.frequency.exponentialRampToValueAtTime(freqEnd,t+dur);
  o.detune.value=detune;
  const g=AX.createGain();g.gain.setValueAtTime(gainPk,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(sfxGain);o.start(t);o.stop(t+dur);
}
function sfxChord(freqs,dur,gainPk,wave='sine'){
  freqs.forEach((f,i)=>sfxTone(f,null,dur,gainPk/(i*.3+1),wave));
}

// ── FAOLCHÚ BOSS AUDIO (v61c3) ────────────────────────────────────────────
// Three layered procedural sounds for the boss. Each combines:
//   - A low animal vocal element (sawtooth pitched in the 80-220Hz range)
//   - A higher 'scream' overtone that the wolf shouldn't anatomically have
//     — pitches around 600-900Hz that drift downward, evoking the human-
//     adjacent quality the Faolchú's binding tried to produce
//   - Filtered noise for the breath/roughness texture
//
// The "horse" suggestion in the design brief lands as a high airy noise
// pass at the tail of the bite, mimicking a snort. We don't have sample-
// based audio so the timbre is approximated through filter sweeps.

// Telegraph wind-up — unsettling growl-scream that descends. Played when
// the boss starts winding up its bite. Replaces the generic sndTelegraph
// for boss enemies. Duration ~0.55s to span the full telegraph window.
function sndFaolchuGrowl(){
  // Low growl base — sawtooth sliding down from 180 to 90 Hz
  sfxTone(180, 90, 0.55, 0.16, 'sawtooth');
  // Scream overtone — second voice, detuned, sliding down from 720 to 400
  sfxTone(720, 400, 0.50, 0.09, 'sawtooth', 18);
  // Breath roughness — filtered low noise, gritty
  sfxNoise(0.55, 1, 1, 0.18, 320);
  // Trailing rasp — short squarewave bite at the end, signals "now"
  setTimeout(()=>{
    sfxTone(140, 60, 0.10, 0.12, 'square');
    sfxNoise(0.08, 1, 1, 0.15, 1200);
  }, 420);
}

// Strike — guttural snap bite. Played when the boss commits a strike
// (after the telegraph, regardless of hit/whiff). Layers a sharp noise
// burst (the snap of jaws) with a low impact tone and a horse-snort-like
// noise tail. Quick — ~0.3s total.
function sndFaolchuBite(){
  // Snap — short broadband noise burst, high filter, percussive
  sfxNoise(0.06, 1, 1, 0.45, 2800);
  // Jaw impact — low square thud
  sfxTone(95, 50, 0.10, 0.30, 'square');
  // Snort/exhale tail — airy high-frequency noise, evokes the horse-
  // adjacent quality the design brief asked for
  setTimeout(()=>{
    sfxNoise(0.18, 1, 1, 0.14, 1800);
  }, 80);
  // Subharmonic wolf yip — quick sawtooth chirp
  setTimeout(()=>{
    sfxTone(420, 220, 0.08, 0.10, 'sawtooth', 12);
  }, 120);
}

// Phase transition roar — full-throated, longer, designed to startle.
// Played when the boss crosses into Phase 2 or Phase 3. Three voices
// stacked at slightly different pitches for a "this is not one creature"
// quality, plus heavy low noise.
function sndFaolchuRoar(){
  // Three sawtooth voices, descending, slightly detuned from each other
  sfxTone(220, 110, 0.85, 0.18, 'sawtooth');
  sfxTone(330, 165, 0.85, 0.14, 'sawtooth', 15);
  sfxTone(165, 80, 0.85, 0.16, 'sawtooth', -12);
  // Scream layer — higher pitched, holds a beat then drops
  sfxTone(880, 480, 0.75, 0.10, 'sawtooth', 22);
  // Breath / throat noise — long, rough
  sfxNoise(0.85, 1, 1, 0.22, 280);
  // Aftershock noise burst — the roar's tail, more rasp
  setTimeout(()=>{
    sfxNoise(0.30, 1, 1, 0.16, 600);
    sfxTone(140, 70, 0.30, 0.12, 'sawtooth');
  }, 600);
}

// Death — the seams unmaking themselves. Procedural cracking noises with
// a dropping tone and a final dissolve. Played when the boss hits 0 HP.
function sndFaolchuDeath(){
  // Initial crack/snap
  sfxNoise(0.12, 1, 1, 0.40, 2000);
  sfxTone(180, 60, 0.18, 0.25, 'sawtooth');
  // Mid: stuttering 'unmaking' — short noise bursts at intervals
  setTimeout(()=>{ sfxNoise(0.08, 1, 1, 0.30, 1400); sfxTone(220, 100, 0.10, 0.15, 'sawtooth'); }, 200);
  setTimeout(()=>{ sfxNoise(0.10, 1, 1, 0.28, 900); sfxTone(160, 70, 0.12, 0.12, 'square'); }, 420);
  // Final dissolve — long descending wail, fading to silence
  setTimeout(()=>{
    sfxTone(440, 50, 1.20, 0.18, 'sine');
    sfxTone(330, 40, 1.20, 0.10, 'sine', 8);
    sfxNoise(1.20, 1, 1, 0.10, 200);
  }, 700);
}

// v61d0 — Loot reveal cue. Fires ~1.8s after boss death, just as the
// sndFaolchuDeath descending wail (700ms + 1200ms duration) dissolves to
// silence. Two pure sines in a perfect-fifth relationship (the harmonic
// register the binding's makers used — see the sigil hum's 60/90 Hz pair)
// marking that the boss has left something behind. Tonal opposite of the
// boss's sawtooth-noise palette: clean, brief, harmonically stable. The
// subtle high-band noise at the start reads as the binding releasing the
// trophy. Pairs with the bumped 2.2u loot indicator height to make the
// "loot is here" moment unmissable across audio + visual channels.
function sndFaolchuLootReveal(){
  sfxNoise(0.10, 1, 1, 0.04, 3000);
  sfxTone(880, null, 0.45, 0.10, 'sine');
  setTimeout(()=>{ sfxTone(1320, null, 0.40, 0.08, 'sine'); }, 120);
}

// ── SIGIL AMBIENT HUM ─────────────────────────────────────────────────────
// A low stone-resonance drone that fades in as the player approaches a sigil.
// Implemented as a single persistent oscillator pair (fundamental + fifth) routed
// through a dedicated gain node that we ramp based on closest-sigil proximity.
// Created lazily on first call; stopped on dungeon exit to avoid bleed.
let _sigilHumOsc1=null,_sigilHumOsc2=null,_sigilHumGain=null;
function ensureSigilHum(){
  if(!AX||_sigilHumOsc1)return;
  try{
    _sigilHumGain=AX.createGain();
    _sigilHumGain.gain.value=0;
    _sigilHumGain.connect(sfxGain);
    _sigilHumOsc1=AX.createOscillator();
    _sigilHumOsc1.type='sine';_sigilHumOsc1.frequency.value=60; // low rumble
    _sigilHumOsc1.connect(_sigilHumGain);
    _sigilHumOsc1.start();
    _sigilHumOsc2=AX.createOscillator();
    _sigilHumOsc2.type='sine';_sigilHumOsc2.frequency.value=90; // perfect fifth above = harmonic stability
    _sigilHumOsc2.detune.value=-4; // subtle detune — less pure, more "stone"
    // Second oscillator at half-gain — the fundamental dominates
    const g2=AX.createGain();g2.gain.value=0.45;
    _sigilHumOsc2.connect(g2);g2.connect(_sigilHumGain);
    _sigilHumOsc2.start();
  }catch(e){/* silent */}
}
// Drive hum gain from closest-sigil proximity in [0..1]. Called every tick inside dungeons.
// Gain ramps via setTargetAtTime so discrete per-frame changes don't click.
function updateSigilHum(prox){
  if(!AX||volLevel===0)return;
  ensureSigilHum();
  if(!_sigilHumGain)return;
  // Only audible when near a sigil — peak gain 0.18, well below spell SFX
  const target=prox*prox*0.18; // squared curve: barely-there at distance, prominent up close
  _sigilHumGain.gain.setTargetAtTime(target, AX.currentTime, 0.18);
}
// Silence the hum explicitly — called on dungeon exit so it doesn't bleed into overworld
function silenceSigilHum(){
  if(!_sigilHumGain||!AX)return;
  _sigilHumGain.gain.setTargetAtTime(0, AX.currentTime, 0.08);
}

// ── SFX LIBRARY ───────────────────────────────────────────────────────────
// v69.1 — Swing now produces TWO sounds: a whoosh of air on the way to the
// target (sndWhoosh, fired at swing-start) and a percussive contact at impact
// (sndSwing, tightened below). "whoooosh-THUNK" — travel, then arrival.
function sndSwing(){
  // v69.1 — Tightened toward a contact/arrival character so it's distinct from
  // the leading whoosh: shorter noise, higher bandpass (a "tk" snap rather than
  // an airy sweep), brief low body. The actual enemy-hit sounds (sndHitEnemy /
  // sndPowerHit) still layer on top when a swing connects; this is the
  // air-contact whiff you hear even on a miss.
  sfxNoise(.06, 1, 1, 0.28, 2000);
  sfxTone(150, 70, .07, .06, 'sawtooth');
}
// v69.1 — Whoosh of air as the blade travels. Bandpass center scales INVERSELY
// with weapon weight (heavy = low/deep air, light = high/whippy), and the sweep
// duration follows the weight→speed factor so a slow weapon's whoosh is longer
// and lower. Reuses _weaponSwingFactor() so audio pitch and swing speed stay
// physically coherent — a faster swing is inherently higher-pitched.
//   factor ~0.835 (dagger) → high center ~1500 Hz, short
//   factor 1.0   (sword)   → neutral center ~900 Hz
//   factor 1.40  (hammer)  → low center ~450 Hz, longer
function sndWhoosh(){
  if(!AX||volLevel===0)return;
  const f = _weaponSwingFactor();              // 0.72..1.40, sword=1.0
  // Center frequency: inverse of factor. Sword baseline 900 Hz.
  const center = Math.max(380, Math.min(1700, 900 / f));
  // Duration scales with the swing factor (slower swing = longer whoosh),
  // anchored so the sword's whoosh (~0.18s) leads its ~0.30s windup to impact.
  const dur = 0.14 * f + 0.05;                 // dagger ~0.17s, hammer ~0.25s
  // Sweep the bandpass DOWN over the swing — the air-cut "whoo→sh" tail.
  // sfxNoise ramps the bandpass from `filterFreq` toward... it only takes one
  // center, so we build the swept version inline for the downward glide.
  try{
    const t = AX.currentTime;
    const buf = AX.createBuffer(1, Math.ceil(AX.sampleRate*dur), AX.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const src = AX.createBufferSource(); src.buffer = buf;
    const filt = AX.createBiquadFilter();
    filt.type = 'bandpass';
    filt.Q.value = 2.2;                         // tighter Q than sfxNoise's 1.5 → more "tonal" air
    filt.frequency.setValueAtTime(center*1.25, t);
    filt.frequency.exponentialRampToValueAtTime(center*0.55, t+dur);  // glide down
    const g = AX.createGain();
    // Soft attack so it reads as air building, not a click; gentle fade.
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t+dur*0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    src.connect(filt); filt.connect(g); g.connect(sfxGain);
    src.start(t); src.stop(t+dur);
    // Heavier weapons get a faint low sawtooth body under the air — gives the
    // hammer/claymore mass the dagger doesn't have. Only when factor > 1.05.
    if(f > 1.05){
      sfxTone(center*0.5, center*0.32, dur, 0.05*(f-1.0), 'sawtooth');
    }
  }catch(e){/* silent */}
}
function sndHitEnemy(){
  sfxNoise(.07,1,1,0.5,2200);
  sfxTone(320,160,.08,.12,'square');
}
function sndPlayerHurt(){
  sfxTone(120,60,.25,.3,'sawtooth');
  sfxNoise(.18,1,1,0.4,300);
}
function sndTelegraph(){
  // Rising tense "tch!" — short upward chirp with a noise tick. Signals wind-up to the player
  // so they can time a parry. Quiet enough not to clutter a crowded encounter.
  sfxTone(220, 380, 0.11, 0.11, 'triangle');
  sfxNoise(.04, 800, 1, 0.14, 2400);
}
function sndParry(){
  // Bright metallic ring — two detuned sine waves + quick decay
  sfxTone(880,1200,.35,.4,'sine');
  sfxTone(1100,1400,.3,.25,'sine',12);
  sfxTone(440,500,.5,.15,'sine');
}
function sndBlock(){
  sfxNoise(.1,1,1,0.35,600);
  sfxTone(180,140,.1,.15,'square');
}
function sndPowerCharge(){
  // v62.5 — Rebalanced louder and more distinct. The v62 version (sfxTone
  // 0.08 vol) was too quiet to compete with footstep/combat ambience, so the
  // player couldn't reliably hear the threshold cross. Now: base rising tone
  // at 0.16 (2× louder), brighter overtone triangle at 290Hz for a clearer
  // "click" character, and a heftier noise band. Reads as "you're committed"
  // without being obnoxious. Still quieter than sndParry (which uses 0.40).
  sfxTone(160, 280, 0.20, 0.16, 'sine');
  sfxTone(220, 360, 0.10, 0.10, 'triangle', 4);
  sfxNoise(.20, 1, 1, 0.10, 700);
}
function sndPowerHit(){
  // Heavier than sndHitEnemy — adds a low body-impact tone underneath the
  // standard noise crunch. Distinct from a regular swing landing so the
  // player feels the difference without reading the hit message.
  sfxNoise(.14, 1, 1, 0.42, 220);
  sfxTone(70, 50, 0.18, 0.32, 'sine');
  sfxTone(140, 90, 0.10, 0.18, 'triangle');
}
// v71 — Bash. Shield bash = a heavy metal-on-shield CLANG (bright noise burst +
// a mid clonk). Weapon/bare bash = a duller wooden/body shove (lower, softer, no
// bright ring). The two are audibly distinct so the player feels which bash they
// got, matching the mechanical split (force-break vs posture-chunk).
function sndBash(hasShield){
  if(hasShield){
    sfxNoise(.12, 1, 1, 0.40, 1400);          // bright metallic clack
    sfxTone(220, 120, 0.12, 0.26, 'square');  // shield-boss clonk
    sfxTone(90, 60, 0.16, 0.22, 'sine');      // body thud underneath
  } else {
    sfxNoise(.10, 1, 1, 0.30, 500);           // dull shove
    sfxTone(120, 80, 0.14, 0.22, 'sine');
  }
}
// v64 — Bow audio. Three cues:
//  - sndBowDraw : the creak of wood + string flexing as the player pulls back.
//                 Plays once on draw start (mousedown with bow + arrows). The
//                 stamina-drain tension is conveyed by the rising pitch.
//  - sndBowRelease : the snap-thwip of release + arrow flight. Plays at the
//                    moment of fire; carries draw-strength info via volume
//                    scaling so a partial-draw release sounds noticeably
//                    weaker than a full draw.
//  - sndBowEmpty : dry click when mousedown fires with no arrows. The "ammo
//                  out" feedback signal — non-musical, short, unmistakable.
function sndBowDraw(){
  // Rising creak. Lower than sndPowerCharge so the two systems sound distinct
  // when a player swaps melee/bow mid-fight.
  sfxTone(110, 180, 0.35, 0.10, 'sawtooth', 6);
  sfxNoise(.30, 1, 1, 0.04, 200);
}
function sndBowRelease(strength){
  // strength in 0..1 from _bowDrawStrength(). Volume scales with strength so
  // partial-draws feel weaker. Frequency stays constant — the snap is what
  // it is — but the body-thump under it grows with commitment.
  const s = Math.max(0.3, Math.min(1.0, strength||0.5));
  sfxNoise(.05, 1, 1, 0.18*s, 1200);    // short string-snap
  sfxTone(420, 280, 0.08, 0.12*s, 'triangle');
  sfxTone(90, 40, 0.12, 0.16*s, 'sine'); // body thump
}
function sndBowEmpty(){
  // Dry click — the player tapped fire with no arrows in the ammo slot.
  // Brief, no body thump, no rising pitch. Reads as "nothing happened."
  sfxTone(200, 220, 0.04, 0.06, 'square');
  sfxNoise(.02, 1, 1, 0.04, 1800);
}
function sndFootstep(sprint){
  sfxNoise(sprint?.055:.07,1,1,sprint?.18:.12,sprint?500:300);
}
// v80 S147 — snow underfoot: shorter, softer, lower than bare ground
function sndSnowStep(sprint){
  sfxNoise(sprint?.045:.055,1,1,sprint?.10:.07,sprint?260:180);
}
function sndJump(){
  sfxTone(200,320,.15,.12,'sine');
  sfxNoise(.1,1,1,0.08,800);
}
function sndLand(){
  sfxNoise(.12,1,1,0.35,250);
  sfxTone(100,60,.12,.2,'sine');
}
function sndChestOpen(){
  // Wooden creak
  sfxTone(180,120,.22,.18,'sawtooth',8);
  sfxNoise(.15,1,1,0.2,400);
  // Sparkle
  setTimeout(()=>{
    sfxTone(1200,1600,.15,.12,'sine');
    sfxTone(1600,2000,.1,.08,'sine');
  },180);
}
function sndDoorUnlock(){
  sfxNoise(.08,1,1,0.4,600);
  sfxTone(140,80,.3,.25,'sawtooth');
  sfxNoise(.18,1,1,0.3,200);
}
// v61gf: door open/close rewritten for weight + creak texture. Previous (v61g6)
// sounds were ~0.22s and read as "poots" per playtest. New four-stage open:
//   (1) handle/latch click — short noise burst, narrow band
//   (2) initial creak — slow rising sawtooth with detune, ~0.45s
//   (3) sustained groan — filtered low noise + sub-bass tone, ~0.5s
//   (4) heavy thunk at the limit — low sawtooth + brief noise
// Close is the same shape in reverse (handle, descending creak, thunk), ~0.8s.
// All stages share a single AX.currentTime base via setTimeout offsets — keeps
// timing tight even if AX is slightly behind.
function sndDoorOpen(){
  // (1) handle click
  sfxNoise(.05, 1, 1, 0.35, 1800);
  // (2) initial creak — rising pitch, slow attack
  setTimeout(()=>{
    sfxTone(140, 220, .45, .14, 'sawtooth', 12);
    sfxNoise(.45, 1, 1, 0.10, 700);
  }, 80);
  // (3) sustained groan — overlap with the tail of the creak
  setTimeout(()=>{
    sfxTone(90, 75, .50, .12, 'sawtooth');   // sub-bass body
    sfxNoise(.50, 1, 1, 0.08, 300);          // dry low rumble
  }, 380);
  // (4) heavy thunk at the limit
  setTimeout(()=>{
    sfxTone(85, 55, .18, .22, 'sawtooth');
    sfxNoise(.12, 1, 1, 0.28, 180);
  }, 1000);
}
function sndDoorClose(){
  // (1) handle/swing start
  sfxNoise(.04, 1, 1, 0.25, 1600);
  // (2) swing creak — descending pitch, faster than open
  setTimeout(()=>{
    sfxTone(200, 110, .30, .13, 'sawtooth', 10);
    sfxNoise(.30, 1, 1, 0.09, 600);
  }, 60);
  // (3) heavy thunk meeting the frame — slightly louder than the open thunk
  setTimeout(()=>{
    sfxTone(95, 50, .20, .28, 'sawtooth');
    sfxNoise(.15, 1, 1, 0.34, 160);
  }, 480);
}
function sndEnemyDeath(){
  sfxNoise(.18,1,1,0.4,350);
  sfxTone(160,60,.2,.15,'sawtooth');
}
// Per-monster alert cries — called once when enemy first spots the player
function sndEnemyCry(name){
  if(!AX||volLevel===0)return;
  if(name==='Skeleton'){
    // Rattling clatter — noise burst + high pitched scrape
    sfxNoise(.08,1,1,.5,2800);
    sfxNoise(.12,1,1,.3,1200);
    sfxTone(900,400,.15,.1,'sawtooth');
  } else if(name==='Goblin'){
    // High-pitched shriek — fast rising squeal
    sfxTone(600,1400,.12,.35,'square');
    sfxTone(800,1800,.09,.2,'square',15);
    setTimeout(()=>sfxTone(500,1200,.08,.15,'square'),80);
  } else if(name==='Cave Troll'){
    // Deep rumbling roar
    sfxNoise(.4,1,1,.5,120);
    sfxTone(55,40,.5,.4,'sawtooth');
    sfxTone(80,50,.35,.25,'sawtooth',8);
    setTimeout(()=>sfxNoise(.25,1,1,.3,80),200);
  } else if(name==='Golem'){
    // Stone grinding + heavy thud
    sfxNoise(.3,1,1,.45,300);
    sfxTone(80,40,.4,.35,'sawtooth');
    sfxNoise(.15,1,1,.4,150);
    setTimeout(()=>{sfxNoise(.2,1,1,.3,200);sfxTone(60,30,.3,.2,'sawtooth');},250);
  } else if(name==='Phantom'){
    // Eerie wail — sine waves sweeping
    sfxTone(400,800,.4,.25,'sine');
    sfxTone(600,300,.5,.2,'sine',8);
    setTimeout(()=>{sfxTone(500,900,.3,.15,'sine');},200);
  } else if(name==='Wraith'){
    // Piercing shriek — high + rapid vibrato
    sfxTone(1200,800,.35,.3,'sine',20);
    sfxTone(900,1400,.4,.2,'sine',18);
    setTimeout(()=>sfxTone(1400,600,.3,.15,'sine',25),100);
  }
}
function sndLevelUp(){
  // Rising arpeggio
  const notes=[261,329,392,523,659,784];
  notes.forEach((f,i)=>{
    setTimeout(()=>{
      sfxTone(f,f*1.02,.22,.2,'sine');
      sfxTone(f*2,f*2.02,.18,.1,'sine');
    },i*80);
  });
  // Shimmer at end
  setTimeout(()=>{sfxTone(1046,1200,.4,.15,'sine');},480);
}
function sndEnterDungeon(){
  sfxNoise(.8,1,1,0.25,120);
  sfxTone(80,40,1.0,.2,'sawtooth');
}
function sndReturnOW(){
  sfxTone(440,520,.6,.12,'sine');
  sfxTone(550,640,.5,.08,'sine');
}
