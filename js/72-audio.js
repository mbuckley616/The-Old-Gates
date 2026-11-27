

// ══════════════════════════════════════════════════════════════════════════
// AUDIO SYSTEM
// ══════════════════════════════════════════════════════════════════════════
let AX=null; // AudioContext — created on first user interaction
let masterGain=null,sfxGain=null,musicGain=null,uiGain=null,ambGain=null;
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
    ambGain=AX.createGain();ambGain.gain.value=VOL_SFX[volLevel]*AMB_LEVEL*volKind('ambience');ambGain.connect(masterGain); /* S2727 — the Ambience bus (#2071 B) */
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
// S691 — the settings sheet's four volumes (everything, music, blows and steps, spoken lines) over the button's level; S2727 a fifth, the place's own sound (ambience)
function volKind(k){return (SETTINGS.master/100)*(SETTINGS[k]/100);}
function applyVolumes(){
  if(!AX)return;
  musicGain.gain.setTargetAtTime(VOL_MUSIC[volLevel]*volKind('music'),AX.currentTime,.1);
  sfxGain.gain.setTargetAtTime(VOL_SFX[volLevel]*volKind('effects'),AX.currentTime,.1);
  if(uiGain)uiGain.gain.setTargetAtTime(VOL_SFX[volLevel]*.28*volKind('effects'),AX.currentTime,.1);
  if(ambGain)ambGain.gain.setTargetAtTime(VOL_SFX[volLevel]*AMB_LEVEL*volKind('ambience'),AX.currentTime,.1);
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
// S2409 — the draught at a sliding wall (spells-as-keys-build.md, its table B): a thin, high breath of air, looped, at level 0 to 1
// (68-dungeon-misc.js's gateSecretsTick sets it each frame from how near you stand: within 2 m). SLIDE_AIR.on says it is sounding.
function sndDraught(level){if(typeof AX==='undefined'||!AX){SLIDE_AIR.on=false;return;}
  if(!SLIDE_AIR.src){if(!(level>0))return;const buf=AX.createBuffer(1,AX.sampleRate*2,AX.sampleRate),d=buf.getChannelData(0);let l=0;
    for(let i=0;i<d.length;i++){l=l*.9+(Math.random()*2-1)*.1;d[i]=l*3;}
    const src=AX.createBufferSource();src.buffer=buf;src.loop=true;const f=AX.createBiquadFilter();f.type='bandpass';f.frequency.value=1150;f.Q.value=2.2;
    const g=AX.createGain();g.gain.value=0;src.connect(f);f.connect(g);g.connect(sfxGain);src.start();SLIDE_AIR.src=src;SLIDE_AIR.g=g;SLIDE_AIR.f=f;}
  const v=Math.max(0,Math.min(1,level||0));SLIDE_AIR.on=v>0;SLIDE_AIR.level=v;
  SLIDE_AIR.g.gain.setTargetAtTime(v*.09,AX.currentTime,.15);SLIDE_AIR.f.frequency.setTargetAtTime(1000+v*300+Math.sin(AX.currentTime*1.7)*90,AX.currentTime,.3);}
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
// hits: by weapon class, and whether the thing resisted it (S112's, Session 2443: the plain hit that stood here, later in the
// load, had replaced it since the first push, so every caller's type and resist were dropped)
function sndHitEnemy(wt,resisted){try{
  if(wt==='blunt'){if(resisted){sfxTone(90,45,.28,.28,'sine');sfxNoise(.08,0,0,.12,300);}else{sfxNoise(.2,0,0,.3,380);sfxTone(140,55,.22,.26,'triangle');setTimeout(()=>sfxNoise(.1,0,0,.12,700),60);}}
  else if(wt==='pierce'){if(resisted){sfxTone(3200,2400,.07,.16,'square');sfxNoise(.04,0,0,.08,4000);}else{sfxNoise(.06,0,0,.22,1400);sfxTone(320,120,.1,.16,'triangle');}}
  else if(wt==='slash'||!wt){if(resisted){sfxTone(2100,1700,.16,.22,'square');sfxNoise(.12,0,0,.14,3500);}else{sfxNoise(.14,0,0,.26,2600);sfxTone(700,260,.09,.12,'triangle');}}
  else{sfxNoise(.1,0,0,.2,1500);}
}catch(e){}}
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
// S2416 — a step on a hollow slab (a stair under the floor): lower, with a ring in it
function sndHollowStep(sprint){
  sfxNoise(sprint?.06:.08,1,1,sprint?.16:.11,200);sfxTone(150,96,.22,sprint?.08:.06,'sine');
}
// v80 S147 — snow underfoot: shorter, softer, lower than bare ground
// S2483 — nailed boots on stone and planks (indoors, in a gate; `hobnailNoisy`): the step, and iron's short tick in it
function sndNailStep(sprint){
  sfxNoise(sprint?.055:.07,1,1,sprint?.18:.12,sprint?500:300);sfxTone(2600,1900,.035,sprint?.05:.04,'square');
}
/* S2515 — the draw and the sheathe heard (S2466's owed: "No sound comes with the draw"). Three voices by how the thing is worn
   (third person's rule, tpSheathAt): a blade from its scabbard is steel along leather, the length of the blade, and on the draw the
   ring of it clear; a hafted weapon from the belt's frog is leather and an iron clink; a staff, a wand or a spear's shaft is wood and
   leather. Scheduled on the audio clock (at), not timers. Cosmetic: nothing waits for it. */
function drawVoice(it){if(!it)return null;const s=it.weaponShape||'',im=typeof implementOf==='function'?implementOf(it):null;
  if(im||/^(staff|wand|spear)$/.test(s))return 'wood';if(/^(mace|flail|warhammer|greataxe|greatclub|axe|hatchet|maul)$/.test(s))return 'haft';return 'blade';}
function drawBladeLen(it){const s=(it&&it.weaponShape)||'';return s==='dagger'?.14:/^(longsword|claymore)$/.test(s)?.34:.22;}
function _sfxSweepAt(at,dur,f0,f1,gainPk,Q,rise){const t=AX.currentTime+at;
  const buf=AX.createBuffer(1,Math.ceil(AX.sampleRate*dur),AX.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const src=AX.createBufferSource();src.buffer=buf;const f=AX.createBiquadFilter();f.type='bandpass';f.Q.value=Q;
  f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);
  const g=AX.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gainPk,t+dur*(rise||.3));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  src.connect(f);f.connect(g);g.connect(sfxGain);src.start(t);src.stop(t+dur);}
function _sfxToneAt(at,freq,freqEnd,dur,gainPk,wave){const t=AX.currentTime+at,o=AX.createOscillator();o.type=wave||'sine';o.frequency.setValueAtTime(freq,t);
  if(freqEnd)o.frequency.exponentialRampToValueAtTime(freqEnd,t+dur);const g=AX.createGain();g.gain.setValueAtTime(gainPk,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(sfxGain);o.start(t);o.stop(t+dur);}
const DRAW_SND={n:0,last:null};
function sndDraw(it){const v=drawVoice(it);DRAW_SND.n++;DRAW_SND.last={kind:'draw',voice:v};if(!v||!AX||volLevel===0)return;_drawPlay(v,it);}
function _drawPlay(v,it){try{
  if(v==='blade'){const L=drawBladeLen(it),p=.22/L;
    _sfxSweepAt(0,L,1700*Math.sqrt(p),4200*Math.sqrt(p),.11,7,.5);
    _sfxToneAt(L*.92,3100*Math.sqrt(p),3050*Math.sqrt(p),.55,.03);_sfxToneAt(L*.92,4650*Math.sqrt(p),null,.35,.018);_sfxSweepAt(L*.9,.03,5000,5000,.05,2,.2);}
  else if(v==='haft'){_sfxSweepAt(0,.1,650,900,.09,3);_sfxToneAt(.07,1700,1480,.08,.05,'triangle');_sfxToneAt(.07,2900,null,.03,.02,'square');}
  else{_sfxSweepAt(0,.16,800,1300,.07,2.5,.4);_sfxToneAt(.14,380,260,.08,.09,'triangle');}
}catch(e){}}
function sndSheathe(it){const v=drawVoice(it);DRAW_SND.n++;DRAW_SND.last={kind:'sheathe',voice:v};if(!v||!AX||volLevel===0)return;try{
  if(v==='blade'){const L=drawBladeLen(it),p=.22/L;
    _sfxSweepAt(0,L*.9,3600*Math.sqrt(p),1500*Math.sqrt(p),.09,6,.25);
    _sfxSweepAt(L*.88,.05,1300,1000,.12,2,.15);_sfxToneAt(L*.88,420,300,.06,.06,'triangle');}
  else if(v==='haft'){_sfxToneAt(0,1600,1450,.07,.04,'triangle');_sfxSweepAt(.05,.09,450,320,.12,2.5,.2);_sfxToneAt(.05,160,110,.08,.08);}
  else{_sfxSweepAt(0,.14,1200,700,.06,2.5,.3);_sfxToneAt(.12,300,220,.08,.08,'triangle');}
}catch(e){}}
// S2523 — a place found. `discover` (83) has called sndDiscover since the first push, and no file ever made it, so a discovery was silent.
// A low open fifth (D4 and A4) struck together, then the octave over it as a bell, on the audio clock: under half the quest chime's peak.
// One in any 1.5 s, so a load or a jump that finds three places at once rings once.
const DISC_SND={n:0,rung:0,at:-1e9};
function sndDiscover(){DISC_SND.n++;const now=performance.now();if(now-DISC_SND.at<1500)return;DISC_SND.at=now;DISC_SND.rung++;
  if(!AX||volLevel===0)return;try{
  _sfxToneAt(0,293.66,292.8,.55,.10,'triangle');_sfxToneAt(0,440,438.7,.5,.08,'triangle');
  _sfxToneAt(.22,587.33,586,.9,.09,'triangle');_sfxToneAt(.22,1174.66,null,.7,.035,'sine');
}catch(e){}}
/* S2704 — a herb picked is heard (Michael, 25 Nov: "We need to add sound effects when picking herbs in the overworld"). It had only the
   UI's confirm beep. Five voices by what the plant is (PLANT_KIND, or a specimen's kin): leaves and stems rustle and the stem snaps;
   moss, a rosette or a root tears from the ground with a soft thud of earth; a cap or a bracket breaks with a dull pop; a water or sea
   plant comes up with a slosh and a bubble; a crystal chips with a glassy tick. On the audio clock, cosmetic, about 0.3 s, a little
   varied each time so ten picks in a glade are not one sound ten times. PICK_SND counts the calls and keeps the last voice (tests). */
const PICK_SND={n:0,last:null};
function pickVoice(key,wet){if(/^(shardmoss|sunglass|skyshard|saltcrystal)$/.test(key||''))return 'crystal';const k=(typeof PLANT_KIND!=='undefined'&&PLANT_KIND[key])||key||'';
  if(wet||/^(kelp|sealily|pearl|waterleaf)$/.test(k))return 'wet';if(/^(mushrooms|bracket)$/.test(k)||/cap|shroom|caverglow/.test(k))return 'fungus';
  if(/^(moss|clay|root|rosette|cliffflower|wisp)$/.test(k))return 'ground';return 'leaf';}
function sndPick(key,wet){const v=pickVoice(key,wet);PICK_SND.n++;PICK_SND.last=v;if(typeof AX==='undefined'||!AX||volLevel===0)return v;try{
  const j=()=>.9+Math.random()*.2;
  if(v==='leaf'){_sfxSweepAt(0,.09,2600*j(),3400*j(),.07,1.2,.25);_sfxSweepAt(.07,.11,3000*j(),2200*j(),.06,1.2,.2);
    _sfxSweepAt(.16,.025,4200,4200,.09,3,.1);_sfxToneAt(.16,1250*j(),900,.03,.035,'triangle');}
  else if(v==='ground'){_sfxSweepAt(0,.2,450*j(),1100*j(),.08,1.6,.7);_sfxSweepAt(.19,.08,300,220,.09,2,.15);_sfxToneAt(.19,140*j(),85,.09,.08);}
  else if(v==='fungus'){_sfxSweepAt(0,.05,900*j(),600,.08,2.5,.2);_sfxToneAt(.01,280*j(),160,.07,.08,'triangle');_sfxSweepAt(.06,.07,1800,1200,.03,1.5,.3);}
  else if(v==='wet'){_sfxSweepAt(0,.22,320*j(),700*j(),.09,1.4,.5);_sfxToneAt(.12,480*j(),950*j(),.06,.04);_sfxToneAt(.2,620*j(),1250*j(),.05,.03);}
  else{_sfxToneAt(0,3800*j(),3700,.12,.03,'triangle');_sfxToneAt(0,5600*j(),null,.08,.014);_sfxSweepAt(0,.03,6000,6000,.05,3,.1);}
}catch(e){}return v;}
/* S2710 — an item heard by what it is (Michael, 25 Nov: "Sound effects when looting or equipping an item should be specific to that
   item type. A swiping/grabbing sound if moving to / from a container, and also a sound for using/consuming/equipping"). Until now a
   take from a chest or the stash was silent, equipping was one of six UI beeps by slot, and a potion, a herb, a meal and a cup of water
   all played the same two rising sines. itemVoice names what a thing sounds like; itemTouch is its small contact sound (metal's clink,
   glass, paper, wood, coin, stone or a soft thud). A move between a container and the bag (sndMove) is a sweep of cloth, up for a take
   and down for a put, and the thing's touch; equipping (sndEquipItem) is the thing put on: a blade or a haft drawn as S2515's draw, a bow
   strung, plate's clang and a buckle, mail's rings, bronze's sheet, wooden boards' clack, leather's creak, cloth's rustle, a shield's
   strap and its knock or clang, a ring's tink, arrows into the quiver; consuming (sndConsume) is a potion's cork and glugs and bubbles, a
   drink's glugs, a meal's bites, a herb chewed. On the effects bus and the audio clock, cosmetic; ITEM_SND counts calls (tests). */
const ITEM_SND={n:0,last:null};
function itemVoice(it){if(!it)return 'soft';if(it.type==='gold')return 'coin';
  if(it.type==='equip'){const sl=it.slot||'';
    if(sl==='weapon'){const sh=it.weaponShape||'';if(sh==='bow'||sh==='crossbow')return 'bow';return drawVoice(it);}
    if(sl==='ring'||sl==='amulet')return 'trinket';
    if(sl==='offhand')return it.shieldType==='shield'?((it.tier||1)<=1?'shieldwood':'shieldmetal'):'wood';
    if(it.line==='robe')return 'cloth';if(it.line==='light')return 'leather';
    const mt=typeof MATERIALS!=='undefined'&&it.tier&&MATERIALS[Math.max(1,Math.min(10,it.tier))-1];
    if(!mt||mt.name!==it.material)return /leather|boot|hide|fur|belt/i.test(it.name||'')?'leather':'cloth'; /* the starter clothes and the made-up pieces: of no metal */
    const f=typeof AR_FAM!=='undefined'?AR_FAM[Math.max(1,Math.min(10,it.tier||1))]:'plate';
    return f==='lamellar'?'lamellar':f==='muscle'?'sheet':f==='mail'?'mail':'plate';}
  if(it.type==='ammo')return 'arrows';
  if(it.type==='potion'||it.brew)return 'potion';if(it.vessel||it.cup)return 'drink';if(it.meal||it.food||it._typeKey==='fish')return 'food';
  if(it.type==='herb')return 'herb';if(it.type==='book'||it.type==='spellbook'||it.type==='rubbing'||it.erRub||/scroll|letter|map|note|deed/i.test(it.name||''))return 'paper';
  if(it.ore||it.ingot||/stone|ore|ingot|gem/i.test(it.name||''))return 'stone';
  if(it.log||it.plank||it.spar||it.heartwood)return 'wood';
  if(/key|lockpick|coin|nail|chain|tool/i.test(it.name||'')||it.tool)return 'metal';return 'soft';}
function itemTouchClass(v){return /^(blade|haft|plate|mail|sheet|shieldmetal|trinket|metal)$/.test(v)?(v==='mail'?'rings':'metal'):
  /^(potion)$/.test(v)?'glass':v==='coin'?'coin':v==='paper'?'paper':v==='stone'?'stone':/^(wood|bow|lamellar|shieldwood|arrows)$/.test(v)?'wood':'soft';}
function _clangAt(at,f,g,dur){[[1,1],[2.76,.55],[5.4,.3],[8.93,.14]].forEach(([m,a])=>_sfxToneAt(at,f*m,f*m*.995,dur/(1+m*.25),g*a,'sine'));_sfxSweepAt(at,.03,f*6,f*5,g*.8,2,.1);}
function itemTouch(c,at,j){j=j||1;
  if(c==='metal')_clangAt(at,1150*j,.03,.25);
  else if(c==='rings'){for(let k=0;k<5;k++)_sfxToneAt(at+k*.022+Math.random()*.01,(3200+Math.random()*1800)*j,null,.06,.016,'triangle');_sfxSweepAt(at,.12,5000,4200,.03,2,.2);}
  else if(c==='glass'){_sfxToneAt(at,2600*j,2580*j,.18,.03,'sine');_sfxToneAt(at+.05,3500*j,null,.12,.016,'sine');}
  else if(c==='coin'){for(let k=0;k<4;k++)_sfxToneAt(at+k*.035,(2900+k*370)*j,null,.1,.025,'sine');_sfxSweepAt(at,.14,6000,5000,.025,2.5,.2);}
  else if(c==='paper'){_sfxSweepAt(at,.12,3600*j,2400*j,.05,.9,.3);_sfxSweepAt(at+.1,.08,2800,3400,.035,.9,.3);}
  else if(c==='stone'){_sfxSweepAt(at,.05,700*j,500,.09,2,.1);_sfxToneAt(at,190*j,130,.07,.08,'triangle');}
  else if(c==='wood'){_sfxToneAt(at,520*j,430*j,.06,.06,'triangle');_sfxSweepAt(at,.03,1500,1200,.06,3,.1);}
  else{_sfxSweepAt(at,.07,500*j,320*j,.07,1.4,.2);_sfxToneAt(at,120*j,90,.06,.05);}}
function sndMove(it,dir,at){const v=itemVoice(it);ITEM_SND.n++;ITEM_SND.last={kind:'move',dir:dir||'take',voice:v};if(typeof AX==='undefined'||!AX||volLevel===0)return v;try{
  const j=.92+Math.random()*.16,take=dir!=='put',a=at||0;
  _sfxSweepAt(a,.13,take?900*j:2400*j,take?2400*j:900*j,.07,1.1,take?.35:.6);
  itemTouch(itemTouchClass(v),a+(take?.1:.12),j);
}catch(e){}return v;}
/* S2717 — the counter, by what changes hands (S2710's owed item): a buy is your coins counted onto the counter, then the piece taken up
   by its own touch (a blade's metal, a potion's glass, a book's paper); a sale is the piece put down by its touch, then the keeper's coins
   counted into your hand. Both on the effects bus with the other item sounds; ITEM_SND.last says {kind:'buy'|'sell',voice}. */
function sndTrade(it,dir){const sell=dir==='sell',v=sndMove(it,sell?'put':'take',sell?0:.16);ITEM_SND.last={kind:sell?'sell':'buy',voice:v};
  if(typeof AX==='undefined'||!AX||volLevel===0)return v;try{const j=.94+Math.random()*.12;itemTouch('coin',sell?.24:0,j);if(sell)itemTouch('coin',.36,j*1.06);}catch(e){}return v;}
function sndEquipItem(it){const v=itemVoice(it);ITEM_SND.n++;ITEM_SND.last={kind:'equip',voice:v};if(typeof AX==='undefined'||!AX||volLevel===0)return v;try{
  const j=.94+Math.random()*.12,buckle=at=>{_sfxToneAt(at,1900*j,1700,.04,.03,'square');_sfxSweepAt(at,.04,3000,2600,.04,3,.1);};
  if(v==='blade'||v==='haft'||(v==='wood'&&it&&it.slot==='weapon'))_drawPlay(v,it);
  else if(v==='bow'){_sfxSweepAt(0,.18,700,1100,.06,2,.4);_sfxToneAt(.16,190*j,180*j,.3,.06,'triangle');_sfxToneAt(.16,380*j,null,.18,.02,'sine');}
  else if(v==='plate'){_sfxSweepAt(0,.08,1200,700,.06,1.5,.3);_clangAt(.07,420*j,.07,.55);_clangAt(.19,610*j,.035,.35);buckle(.36);}
  else if(v==='sheet'){_sfxSweepAt(0,.08,1000,600,.06,1.5,.3);_clangAt(.07,330*j,.06,.6);buckle(.34);}
  else if(v==='mail'){_sfxSweepAt(0,.1,900,600,.05,1.5,.3);itemTouch('rings',.04,j);itemTouch('rings',.16,j*.95);itemTouch('rings',.28,j*1.05);_sfxToneAt(.3,140,100,.08,.05);}
  else if(v==='lamellar'){for(let k=0;k<4;k++)itemTouch('wood',k*.055,j*(1+k*.04));buckle(.3);}
  else if(v==='leather'){_sfxSweepAt(0,.22,260*j,520*j,.06,4,.5);_sfxSweepAt(.2,.12,480*j,300*j,.04,4,.3);buckle(.3);}
  else if(v==='cloth'){_sfxSweepAt(0,.25,1200*j,2600*j,.05,.8,.5);_sfxSweepAt(.2,.15,2400*j,1400*j,.035,.8,.3);}
  else if(v==='shieldwood'||v==='shieldmetal'){_sfxSweepAt(0,.14,350,560,.05,4,.5);buckle(.12);if(v==='shieldwood'){_sfxToneAt(.2,210*j,170,.12,.09,'triangle');_sfxSweepAt(.2,.05,900,700,.06,2,.1);}else _clangAt(.2,360*j,.06,.5);}
  else if(v==='trinket'){_sfxToneAt(0,3300*j,3280*j,.35,.03,'sine');_sfxToneAt(.07,4950*j,null,.25,.014,'sine');}
  else if(v==='arrows'){for(let k=0;k<5;k++)_sfxToneAt(k*.03+Math.random()*.012,(780+Math.random()*300)*j,null,.04,.035,'triangle');_sfxSweepAt(0,.18,1600,1100,.03,1.2,.4);}
  else itemTouch(itemTouchClass(v),0,j);
}catch(e){}return v;}
function sndConsume(kind){const v=kind||'potion';ITEM_SND.n++;ITEM_SND.last={kind:'consume',voice:v};if(typeof AX==='undefined'||!AX||volLevel===0)return v;try{
  const j=.94+Math.random()*.12,glug=at=>{_sfxToneAt(at,170*j,260*j,.07,.08,'sine');_sfxSweepAt(at,.07,350,600,.05,3,.3);};
  if(v==='potion'){_sfxToneAt(0,720*j,380,.03,.08,'sine');_sfxSweepAt(0,.03,2600,1800,.07,2,.1);glug(.18);glug(.34);glug(.5);
    for(let k=0;k<5;k++)_sfxToneAt(.6+k*.045+Math.random()*.02,(700+Math.random()*700)*j,(1300+Math.random()*700)*j,.03,.025,'sine');}
  else if(v==='drink'){_sfxSweepAt(0,.15,300,650,.05,1.4,.5);glug(.12);glug(.28);glug(.44);}
  else if(v==='food'){for(let k=0;k<3;k++){_sfxSweepAt(k*.22,.06,1800*j,900*j,.07,1.2,.1);_sfxSweepAt(k*.22+.07,.1,500,300,.04,1.5,.3);}}
  else{_sfxSweepAt(0,.08,2400*j,1600*j,.05,1.2,.2);_sfxSweepAt(.15,.08,1600*j,900*j,.045,1.4,.2);_sfxSweepAt(.3,.08,1400*j,800*j,.035,1.4,.2);}
}catch(e){}return v;}
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
// S1913 — the Bellthroat's call at dusk (OG-040: "whose call echoes across valleys at dusk, an ambient sound"): three low booms off the
// throat sac, falling a little, and the same again quieter a breath later for the valley's echo. k is 0 (at the edge of hearing) to 1 (beside it)
function sndBellthroat(k){
  if(!AX||volLevel===0)return;k=Math.max(0,Math.min(1,k||0));const g=.04+.22*k;
  const boom=(a,f)=>{sfxTone(f,f*.72,.26,a,'sine');sfxTone(f*2,f*1.4,.18,a*.25,'triangle');};
  for(let i=0;i<3;i++)setTimeout(()=>boom(g,190-i*12),i*320);
  for(let i=0;i<3;i++)setTimeout(()=>boom(g*.3,190-i*12),700+i*320);
}
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

// ── WHAT A PLACE SOUNDS LIKE (Session 2727; Michael's B on #2071, the build sheet's first session) ──────────────────
// The Ambience bus: every bed → one lowpass (the weather's damping) → the duck (× 0.7 while a piece plays) → ambGain (the effects'
// level × 0.6 × the Ambience slider) → master. Outdoors in the open world, two beds: the wind (by height and island; a wood's canopy
// takes some and adds the leaves) and the nearest water within 80 m (a river, a lake's lapping, the sea's swell). Everything here is
// cosmetic (Math.random, the page's clock) and writes nothing to worldState. The tick runs from the main loop, every 0.25 s, indoors
// too, so the beds fade at a door or a gate's mouth instead of hanging. AMB is the state the suite (placesound) reads.
const AMB_LEVEL=.6,AMB_TICK=.25,AMB_WATER_R=80,AMB_WATER_PEAK=.10;
const AMB_DAMP={clear:[18000,1],fog:[2000,.7],rain:[1200,.6],snow:[3000,.8],storm:[900,.5]};
const AMB={on:false,v:null,t:0,open:false,island:null,height:0,forest:false,beds:{wind:0,leaves:0,water:0,waterKind:null,waterD:Infinity,murmur:0,fire:0,fountain:0},
  gust:false,gustPh:0,gustP:7,gustMul:1,cut:18000,dampMul:1,duck:1,nodes:0,live:0,spots:[],forge:null,tavern:null,bell:{count:0,strokes:0,key:null},horn:{count:0,key:null},
  calls:{count:0,next:0,last:null,heard:0},room:{kind:null,decay:0,wet:0},hour:null,townsfolk:0};
// S2730 — the nodes a sound makes and when they end, so the bus never holds more than AMB_MAX at once (the build sheet's 40)
const AMB_MAX=40,_ambLive=[];
function ambRoom(n){const t=AX?AX.currentTime:0;for(let i=_ambLive.length-1;i>=0;i--)if(_ambLive[i][0]<=t)_ambLive.splice(i,1);
  let s=0;for(const e of _ambLive)s+=e[1];AMB.live=AMB.nodes+s;return AMB.live+n<=AMB_MAX;}
function ambTake(n,until){_ambLive.push([until,n]);AMB.live+=n;}
function ambEnsure(){if(AMB.v)return true;if(!AX||!ambGain)return false;
  try{const n=AX.sampleRate*4,buf=AX.createBuffer(1,n,AX.sampleRate),d=buf.getChannelData(0);let b=0;
    for(let i=0;i<n;i++){const w=Math.random()*2-1;b=b*.98+w*.02;d[i]=w*.5+b*3;} /* one 4 s noise with a brown body, shared by every bed */
    const src=AX.createBufferSource();src.buffer=buf;src.loop=true;
    const damp=AX.createBiquadFilter();damp.type='lowpass';damp.frequency.value=18000;damp.Q.value=.5;
    const duck=AX.createGain();duck.gain.value=1;damp.connect(duck);duck.connect(ambGain);
    const pan=AX.createStereoPanner?AX.createStereoPanner():null;if(pan)pan.connect(damp);const wOut=pan||damp;
    let count=3+(pan?1:0);
    const voice=(type,f,q,out)=>{const fl=AX.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=AX.createGain();g.gain.value=0;src.connect(fl);fl.connect(g);g.connect(out);count+=2;return {f:fl,g};};
    const lapped=(type,f,q,hz,depth,out)=>{const lap=AX.createGain();lap.gain.value=1-depth;lap.connect(out);const o=AX.createOscillator();o.frequency.value=hz;const og=AX.createGain();og.gain.value=depth;o.connect(og);og.connect(lap.gain);o.start();count+=3;const v=voice(type,f,q,lap);v.lfo=o;v.lap=lap;v.depth=og;return v;};
    /* S2730 — one water voice, retuned by the kind of water nearest (only the nearest ever sounds): a river's 900 Hz band, a lake's
       lapping at 0.5 Hz, the sea's 9–12 s swell. It was three voices (S2727); the 40-node budget wants the room for the town's spots */
    const v={src,damp,duck,pan,
      wind:voice('bandpass',500,.7,damp),
      leaves:voice('bandpass',4000,.8,damp),
      water:lapped('bandpass',900,1,.5,0,wOut),
      murmur:voice('bandpass',460,.9,damp),          /* the town's voices, a babble the tick swells and lets fall */
      spot:voice('bandpass',2000,1.4,damp)};         /* a room's fire indoors (crackled by the tick), Aurenne's fountain outdoors */
    v.water.kind=null;
    /* S2730 — the rooms' echo: one convolver on decaying noise, the effects' and the ambience's buses sent to it by the room */
    const conv=AX.createConvolver();conv.normalize=true;const wet=AX.createGain();wet.gain.value=1;conv.connect(wet);wet.connect(masterGain);
    const sS=AX.createGain(),sA=AX.createGain();sS.gain.value=0;sA.gain.value=0;sfxGain.connect(sS);ambGain.connect(sA);sS.connect(conv);sA.connect(conv);count+=4;
    v.conv=conv;v.sendS=sS;v.sendA=sA;
    src.start();AMB.v=v;AMB.nodes=count;AMB.on=true;return true;}catch(e){console.warn('ambience',e);return false;}}
// the weather's damping: each kind's cutoff (blended in log frequency) and level, by how far the weather has turned (WX.k)
function ambDampTarget(){const out=[18000,1];if(typeof WX==='undefined'||!WX)return out;const cur=WX.type,nxt=WX.next,mix=(nxt!==cur)?(WX.k||0):0;
  let lf=0,m=0;const add=(t,w)=>{if(w<=0)return;const D=AMB_DAMP[t]||AMB_DAMP.clear;lf+=w*Math.log(D[0]);m+=w*D[1];};add(cur,1-mix);add(nxt,mix);
  out[0]=Math.exp(lf);out[1]=m;return out;}
// the nearest water within 80 m: a river or a lake from the routed carve grid (RVG, the same whether a cell is loaded or not),
// the sea where the land is under SEA_Y on 8 bearings at 10, 25, 50 and 80 m (and under your feet). Returns {kind,d,bx,bz}.
const _ambRs=[0,0];
function ambFresh(x,z,R){let best=null;if(typeof RVG==='undefined'||typeof riverSample!=='function')return best;if(typeof RV!=='undefined'&&!RV.ready&&typeof routeWorld==='function')routeWorld();
  const gx=Math.floor(x/RVSG),gz=Math.floor(z/RVSG),seen=new Set();
  for(let i=gx-1;i<=gx+1;i++)for(let j=gz-1;j<=gz+1;j++){const bk=RVG.get(sgKey(i,j));if(!bk)continue;
    for(const e of bk){if(e.lk){if(seen.has(e.lk))continue;seen.add(e.lk);const d=Math.max(0,Math.hypot(x-e.lk.x,z-e.lk.z)-e.lk.r);if(d<R&&(!best||d<best.d))best={kind:'lake',d,bx:e.lk.x,bz:e.lk.z};continue;}
      riverSample(e.rv,e.i0,e.i1,x,z,_ambRs);const d=Math.max(0,_ambRs[0]-_ambRs[1]);if(d<R&&(!best||d<best.d))best={kind:'river',d,bx:x,bz:z};}}
  return best;}
function ambWater(x,z){let best=ambFresh(x,z,AMB_WATER_R);const fresh=best;
  const wet=(sx,sz)=>{if(worldH(sx,sz)>=SEA_Y)return false;const f=ambFresh(sx,sz,1);return !f||f.d>0;}; /* under sea level, and not a lake's or a river's bed */
  if(wet(x,z))return {kind:'sea',d:0,bx:x,bz:z};
  let r0=0;for(const r of [10,25,50,80]){if(best&&best.d<=r)break;for(let k=0;k<8;k++){const a=k*Math.PI/4,sx=x+Math.sin(a)*r,sz=z+Math.cos(a)*r;
    if(wet(sx,sz)){let lo=r0,hi=r;for(let n=0;n<4;n++){const m=(lo+hi)/2;if(wet(x+Math.sin(a)*m,z+Math.cos(a)*m))hi=m;else lo=m;} /* the shore found along that bearing to a metre or so */
      if(!best||hi<best.d)best={kind:'sea',d:hi,bx:x+Math.sin(a)*hi,bz:z+Math.cos(a)*hi};}}if(best&&best.kind==='sea')break;r0=r;}
  return best||fresh;}
function ambSet(p,v,t,tau){try{p.setTargetAtTime(v,t,tau);}catch(e){p.value=v;}}
// ── S2730, the build sheet's second session: the town and the hours, the calls, indoors and the rooms' echo ─────────────────
// The spots are the town's own: the forge's hammer in the smith's hours, the tavern's reel 17–21, Aurenne's fountain on the square,
// the nearest four within 40 m; the Gatelands' church bell at 6, 12 and 18 and the Mark's horn at the watch's change carry to 400 m.
// The calls are the island's birds and insects by the hour. Indoors a fire crackles, and every room has an echo by its size.
const AMB_SPOT_R=40,AMB_FAR_R=400,AMB_MURMUR_R=40;
const AMB_LVL={forge:.08,tavern:.05,fountain:.06,bell:.12,horn:.10,call:.05,fire:.04,murmurEach:.01,murmurMax:.12};
const AMB_ECHO={small:[.4,.22],hall:[.8,.22],great:[1.2,.22],nave:[1.8,.30],side:[.7,.22]};
const AMB_ECHO_KIND={inn:'hall',guild_f:'hall',guild_m:'hall',market:'hall',castle:'great',church:'great',constable:'great',academy:'great'};
const AMB_LEAD={gatelands:'fiddle',mark:'boneflute',aurenne:'oud'};
/* a reel in eighths, by scale degree from the island's root (two bars, played round): D for the Gatelands and the Mark, A for Aurenne */
const AMB_REEL=[5,3,5,8,7,5,3,2,1,3,5,3,2,1,2,3,5,3,5,8,9,8,7,5,6,5,3,2,1,2,1,1],AMB_REEL_MODE={gatelands:['mixolydian',62],mark:['dorian',62],aurenne:['phrygian',57]};
function ambPanOf(x,z){const dx=x-px,dz=z-pz,L=Math.hypot(dx,dz);return L>1?Math.max(-1,Math.min(1,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/L*.7)):0;}
function ambFall(d,R){return Math.pow(Math.max(0,1-d/R),2);}
// a short sound: oscillators (ratio, level) at f, through one gain with an envelope, panned; n nodes counted against the budget
function ambStrike(t,f,parts,lvl,att,dec,pan,type){const n=2*parts.length+2;if(!ambRoom(n))return false;
  const g=AX.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(lvl,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+att+dec);
  const p=AX.createStereoPanner?AX.createStereoPanner():AX.createGain();if(p.pan)p.pan.value=pan;g.connect(p);p.connect(AMB.v.damp);
  for(const [r,a,glide] of parts){const o=AX.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(f*r,t);if(glide)o.frequency.exponentialRampToValueAtTime(f*r*glide,t+att+dec);
    const og=AX.createGain();og.gain.value=a;o.connect(og);og.connect(g);o.start(t);o.stop(t+att+dec+.05);}
  ambTake(n,t+att+dec+.1);return true;}
function ambSeaWithin(x,z,R){const wet=(sx,sz)=>{if(worldH(sx,sz)>=SEA_Y)return false;const f=ambFresh(sx,sz,1);return !f||f.d>0;};
  if(wet(x,z))return true;for(let r=R/3;r<=R+1;r+=R/3)for(let k=0;k<8;k++){const a=k*Math.PI/4;if(wet(x+Math.sin(a)*r,z+Math.cos(a)*r))return true;}return false;}
// the hour crossed since the last tick, within a quarter hour of it (a jump of the clock past it rings nothing)
function ambCrossed(H,h,last){if(last==null)return false;const hh=h<last?h+24:h;for(const x of [H,H+24])if(x>last&&x<=hh&&hh-x<.25)return true;return false;}
// the town's sound: the murmur from its people, the spots near you, the bell and the horn
function ambTown(t,h,V){const B=AMB.beds;let folk=0;
  try{for(const n of npcs){if(!n.g||!n.g.visible)continue;if(Math.hypot(n.g.position.x-px,n.g.position.z-pz)<AMB_MURMUR_R)folk++;}}catch(e){}
  AMB.townsfolk=folk;B.murmur=Math.min(AMB_LVL.murmurMax,folk*AMB_LVL.murmurEach);
  const spots=[];let church=null,hornAt=null;
  try{for(const S of SETTLE.values()){const s=S.site;if(!s)continue;const ds=Math.hypot(s.x-px,s.z-pz);if(ds>AMB_FAR_R+300)continue;
    const isle=(()=>{try{const n=nationAt(s.x,s.z);return n==='mark'||n==='aurenne'?n:'gatelands';}catch(e){return 'gatelands';}})();
    const dead=S.raid||(typeof storyRuin==='function'&&storyRuin(s.id));
    for(const H of S.houses||[]){if(H.exitX==null)continue;const d=Math.hypot(H.exitX-px,H.exitZ-pz);
      if(H.type==='church'&&isle==='gatelands'&&!dead&&d<AMB_FAR_R&&(!church||d<church.d))church={x:H.exitX,z:H.exitZ,d};
      if(d>=AMB_SPOT_R||dead)continue;
      if((H.type==='weapon'||H.type==='forge')&&!shopClosedNow(H))spots.push({kind:'forge',id:H.id,x:H.exitX,z:H.exitZ,d,isle});
      else if(H.type==='inn'&&h>=HRS.inn&&h<HRS.night)spots.push({kind:'tavern',id:H.id,x:H.exitX,z:H.exitZ,d,isle});}
    if(isle==='aurenne'&&s.kind!=='village'&&!dead){const fx=s.x+6,fz=s.z+4,d=Math.hypot(fx-px,fz-pz);if(d<AMB_SPOT_R)spots.push({kind:'fountain',id:s.id,x:fx,z:fz,d,isle});} /* the square's water, by the well (genSettlement's cx+6, cz+4) */
    if(isle==='mark'&&!dead){let G=null;try{G=handoverGate(S);}catch(e){}if(G&&G.x!=null){const d=Math.hypot(G.x-px,G.z-pz);if(d<AMB_FAR_R&&(!hornAt||d<hornAt.d))hornAt={x:G.x,z:G.z,d};}}}}catch(e){}
  spots.sort((a,b)=>a.d-b.d);spots.length=Math.min(4,spots.length);AMB.spots=spots.map(s=>({kind:s.kind,d:+s.d.toFixed(1)}));
  // the fountain
  const fo=spots.find(s=>s.kind==='fountain');B.fountain=fo?AMB_LVL.fountain*ambFall(fo.d,AMB_SPOT_R):0;
  // the forge: a stroke every 0.8–1.4 s in runs of 4–9, then 3–8 s of quiet
  const fg=spots.find(s=>s.kind==='forge');
  if(fg){const F=AMB.forge&&AMB.forge.id===fg.id?AMB.forge:(AMB.forge={id:fg.id,next:t+.3,left:4+Math.floor(Math.random()*6),strokes:0});F.on=true;F.d=fg.d;
    while(F.next<t+AMB_TICK){const at=Math.max(F.next,t);const lv=AMB_LVL.forge*ambFall(fg.d,AMB_SPOT_R);
      if(ambStrike(at,560+Math.random()*60,[[1,1],[2.76,.45],[5.4,.2]],lv,.002,.5,ambPanOf(fg.x,fg.z)))F.strokes++;
      if(--F.left>0)F.next=at+.8+Math.random()*.6;else{F.left=4+Math.floor(Math.random()*6);F.next=at+3+Math.random()*5;}}}
  else if(AMB.forge)AMB.forge.on=false;
  // the tavern: the island band's lead playing a reel, through a 900 Hz lowpass; the crowd is the murmur's
  const tv=spots.find(s=>s.kind==='tavern');
  if(tv){let T=AMB.tavern;if(!T||T.id!==tv.id){if(T&&T.out)try{T.out.disconnect();}catch(e){}T=AMB.tavern={id:tv.id,i:0,next:t+.2,notes:0,out:null,lp:null};}
    if(!T.out&&ambRoom(2)){T.lp=AX.createBiquadFilter();T.lp.type='lowpass';T.lp.frequency.value=900;T.out=AX.createStereoPanner?AX.createStereoPanner():AX.createGain();T.lp.connect(T.out);T.out.connect(V.damp);AMB.nodes+=2;}
    T.on=true;T.d=tv.d;T.lead=AMB_LEAD[tv.isle]||'fiddle';B.murmur=Math.min(AMB_LVL.murmurMax,B.murmur+.03*ambFall(tv.d,AMB_SPOT_R));
    if(T.out){if(T.out.pan)ambSet(T.out.pan,ambPanOf(tv.x,tv.z),t,.2);const M=AMB_REEL_MODE[tv.isle]||AMB_REEL_MODE.gatelands,step=60/112/2,vf=typeof VOICES!=='undefined'&&VOICES[T.lead];
      const lv=AMB_LVL.tavern*ambFall(tv.d,AMB_SPOT_R)*6;
      while(vf&&T.next<t+AMB_TICK+.1){const at=Math.max(T.next,t);if(ambRoom(7)){_voiceOut=T.lp;try{vf(degMidi(M[1],M[0],AMB_REEL[T.i%AMB_REEL.length],0),at,step*.9,Math.min(.3,lv));}catch(e){}finally{_voiceOut=null;}ambTake(7,at+step+.4);T.notes++;}
        T.i++;T.next=at+step;}}}
  else if(AMB.tavern){const T=AMB.tavern;T.on=false;if(T.out){try{T.out.disconnect();}catch(e){}T.out=null;T.lp=null;AMB.nodes-=2;}AMB.tavern=null;}
  // the Gatelands' bell at 6, 12 and 18: three strokes three times, 2.5 s apart, the last with a 9 s tail
  const day=typeof gameDayNow==='function'?gameDayNow():0;
  for(const H of [6,12,18])if(church&&ambCrossed(H,h,AMB.hour)){const key=day+':'+H;if(AMB.bell.key===key)continue;AMB.bell.key=key;AMB.bell.count++;AMB.bell.at=H;
    const lv=AMB_LVL.bell*ambFall(church.d,AMB_FAR_R),pn=ambPanOf(church.x,church.z);
    for(let i=0;i<9;i++){const at=t+.1+i*2.5+Math.floor(i/3)*2.5;AMB.bell.strokes++;
      setTimeout(()=>{if(!AX||!AMB.v)return;ambStrike(Math.max(AX.currentTime,at),196,[[1,1],[2.4,.35],[.5,.4]],lv,.004,i===8?9:3,pn);},Math.max(0,(at-t-.2)*1000));}}
  // the Mark's horn at the watch's change (HANDOVER, 6:30 and 19:00): one call of 2.5 s
  for(const H of HANDOVER)if(hornAt&&ambCrossed(H,h,AMB.hour)){const key=day+':'+H;if(AMB.horn.key===key)continue;AMB.horn.key=key;AMB.horn.count++;AMB.horn.at=H;
    ambStrike(t+.1,110,[[1,1],[1.5,.35],[2,.25]],AMB_LVL.horn*ambFall(hornAt.d,AMB_FAR_R),.35,2.15,ambPanOf(hornAt.x,hornAt.z),'sawtooth');}}
// the island's calls by the hour: one every 4–20 s (twice as often at dawn, half as often in rain), half as far in fog, none in a storm
const AMB_CALLS={gatelands:{day:['skylark','blackbird','rook'],night:['crickets']},mark:{day:['raven','hawk'],night:[]},aurenne:{day:[],night:['crickets']}};
function ambCallPlay(kind,t,lv,pn){const S=(f,parts,a,d,type,at)=>ambStrike(at==null?t:at,f,parts,lv,a,d,pn,type);
  switch(kind){
    case 'skylark':{let k=0;for(let i=0;i<10;i++){if(S(2600+Math.random()*1800,[[1,1,1+(Math.random()-.5)*.4]],.01,.08,'sine',t+i*.13))k++;}return k>0;}
    case 'blackbird':{let k=0;for(let i=0;i<5;i++){if(S(1500+Math.random()*1300,[[1,1,1.1+Math.random()*.3]],.03,.22,'sine',t+i*.3))k++;}return k>0;}
    case 'rook':{let k=0;for(let i=0;i<2+Math.floor(Math.random()*2);i++){if(S(420+Math.random()*60,[[1,1,.85],[2,.4,.85]],.02,.24,'sawtooth',t+i*.45))k++;}return k>0;}
    case 'raven':{let k=0;for(let i=0;i<1+Math.floor(Math.random()*2);i++){if(S(300+Math.random()*40,[[1,1,.8],[2.02,.5,.8]],.03,.32,'sawtooth',t+i*.6))k++;}return k>0;}
    case 'hawk':return S(3200,[[1,1,.62]],.08,.9,'sawtooth');
    case 'gull':{let k=0;for(let i=0;i<3+Math.floor(Math.random()*4);i++){if(S(1250-i*60,[[1,1,.7],[2,.3,.7]],.02,.2,'triangle',t+i*.24))k++;}return k>0;}
    case 'owl':{const a=S(380,[[1,1,.97]],.08,.5,'sine');S(380,[[1,1,.95]],.12,.9,'sine',t+.9);return a;}
    case 'crickets':{let k=0;for(let c=0;c<4;c++)for(let i=0;i<3;i++){if(S(4500+Math.random()*120,[[1,1]],.004,.03,'sine',t+c*.5+i*.05))k++;}return k>0;}
    case 'cicadas':return S(5200,[[1,1],[1.02,.8]],.6,3.5,'sawtooth');}
  return false;}
function ambCalls(t,h,isle){const C=AMB.calls,W=typeof WX!=='undefined'&&WX?WX.type:'clear';
  if(W==='storm'){C.next=Math.max(C.next,t+4);C.state='storm';return;}
  if(C.next===0){C.next=t+1+Math.random()*4;return;}
  if(t<C.next)return;
  let gap=4+Math.random()*16;if(h>=5&&h<8)gap/=2;if(W==='rain')gap*=2;C.next=t+gap;
  const night=h>=18||h<5,L=AMB_CALLS[isle]||AMB_CALLS.gatelands,pool=(night?L.night:L.day).slice();
  if(night&&isle==='gatelands'&&Math.random()<.25){pool.length=0;pool.push('owl');}
  if(!night&&isle==='aurenne'){try{if(ambSeaWithin(px,pz,300))pool.push('gull');}catch(e){}if(h>=11&&h<16)pool.push('cicadas');}
  if(!pool.length){C.state='none';return;}
  const kind=pool[Math.floor(Math.random()*pool.length)],reach=W==='fog'?40:80,d=10+Math.random()*70;C.last=kind;C.count++;
  if(d>reach){C.state='lost';return;}
  const a=Math.random()*Math.PI*2;if(ambCallPlay(kind,t+.05,AMB_LVL.call*ambFall(d,reach),ambPanOf(px+Math.sin(a)*d,pz+Math.cos(a)*d)))C.heard++;C.state=kind;}
// where you are, for the echo: a room by its house, a gate's vault (a ceiling over 10 m: the nave, the crossing) or any other underground
function ambRoomKind(){
  if(typeof isInterior==='function'&&isInterior()){const H=typeof currentHouse!=='undefined'?currentHouse:null;return AMB_ECHO_KIND[H&&H.type]||'small';}
  if(typeof activeZoneId!=='undefined'&&activeZoneId==='dungeon'){let c=0;try{c=dCeil(px,pz);}catch(e){}return c>10?'nave':'side';}
  return null;}
const _ambIR=new Map();
function ambIR(decay){if(_ambIR.has(decay))return _ambIR.get(decay);const sr=AX.sampleRate,n=Math.ceil(sr*decay),b=AX.createBuffer(2,n,sr);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.exp(-6.9*i/n);} /* −60 dB over the decay */
  _ambIR.set(decay,b);return b;}
function ambEcho(t,V){const k=ambRoomKind(),R=AMB.room;
  if(!k){R.kind=null;R.wet=0;ambSet(V.sendS.gain,0,t,.3);ambSet(V.sendA.gain,0,t,.3);return;}
  const E=AMB_ECHO[k];if(R.kind!==k){R.kind=k;R.decay=E[0];try{V.conv.buffer=ambIR(E[0]);}catch(e){}}
  R.wet=E[1];ambSet(V.sendS.gain,E[1],t,.3);ambSet(V.sendA.gain,E[1],t,.3);}
// a room's fire: any lit fire or hearth in the room crackles, a bed of 0.015 and pops to 0.04
function ambRoomFire(){if(!(typeof isInterior==='function'&&isInterior()))return false;try{for(const r of FURN_LIVE){if(r.parent!==interiorScene)continue;const U=r.userData;
  if(U.fire||(U.hearthFire&&U.hearthFire.visible))return true;}}catch(e){}return false;}
function tickAmbience(dt){
  const now=performance.now()/1000;if(now-AMB.t<AMB_TICK)return;AMB.t=now;
  if(!AX||!ambGain)return;
  const open=typeof activeZoneId!=='undefined'&&activeZoneId==='world'&&lid==='overworld'&&!(typeof isInterior==='function'&&isInterior());
  AMB.open=open;if(!open&&!AMB.v&&!(typeof isInterior==='function'&&isInterior())&&activeZoneId!=='dungeon')return;if(!ambEnsure())return;
  const V=AMB.v,t=AX.currentTime,B=AMB.beds;ambRoom(0);
  let h=12;try{h=gameHour();}catch(e){}
  // the music's duck, eased over 3 s
  const playing=typeof EXPLORE!=='undefined'&&EXPLORE.playing;AMB.duck=playing?.7:1;ambSet(V.duck.gain,AMB.duck,t,1);
  // the damping
  const D=open?ambDampTarget():[18000,1];AMB.cut=D[0];AMB.dampMul=D[1];ambSet(V.damp.frequency,D[0],t,.4);
  // the echo, and a room's fire
  ambEcho(t,V);
  const fire=ambRoomFire();B.fire=fire?AMB_LVL.fire:0;
  if(fire){const S=V.spot;if(S.mode!=='fire'){S.mode='fire';S.f.frequency.value=2600;S.f.Q.value=.6;}ambSet(S.g.gain,.015,t,.05);
    const n=Math.floor(Math.random()*3);for(let i=0;i<n;i++){const at=t+Math.random()*AMB_TICK;try{S.g.gain.setTargetAtTime(AMB_LVL.fire,at,.005);S.g.gain.setTargetAtTime(.015,at+.02,.03);}catch(e){}}}
  else if(V.spot.mode==='fire'){V.spot.mode=null;ambSet(V.spot.g.gain,0,t,.3);}
  if(!open){B.wind=B.leaves=B.water=B.murmur=B.fountain=0;B.waterKind=null;B.waterD=Infinity;AMB.gust=false;AMB.spots=[];AMB.townsfolk=0;
    if(AMB.forge)AMB.forge.on=false;if(AMB.tavern&&AMB.tavern.out){try{AMB.tavern.out.disconnect();}catch(e){}AMB.nodes-=2;}AMB.tavern=null;
    for(const k of ['wind','leaves','water','murmur'])ambSet(V[k].g.gain,0,t,.33);if(!fire)ambSet(V.spot.g.gain,0,t,.33);AMB.hour=h;return;} /* the world's beds fade over 1 s at the door */
  // the wind: 0.05 at sea level, +0.03 per 50 m, at most 0.14; by island
  let ht=0;try{ht=Math.max(0,worldH(px,pz)-SEA_Y);}catch(e){}AMB.height=ht;
  let isle='gatelands';try{const n=nationAt(px,pz);if(n==='mark'||n==='aurenne')isle=n;}catch(e){}AMB.island=isle;
  let wind=Math.min(.14,.05+.03*ht/50);
  if(isle==='mark'){AMB.gust=true;AMB.gustPh+=AMB_TICK/AMB.gustP;if(AMB.gustPh>=1){AMB.gustPh-=1;AMB.gustP=5+Math.random()*5;}
    const s=.5+.5*Math.sin(AMB.gustPh*Math.PI*2),lo=ht>150?.4:.5,hi=ht>150?1.9:1.6;AMB.gustMul=lo+(hi-lo)*s;wind*=AMB.gustMul;
    ambSet(V.wind.f.frequency,620,t,.5);V.wind.f.type='bandpass';V.wind.f.Q.value=.5;}
  else{AMB.gust=false;AMB.gustMul=1;
    if(isle==='aurenne'){V.wind.f.type='lowpass';ambSet(V.wind.f.frequency,350,t,.5);V.wind.f.Q.value=.4;}
    else{V.wind.f.type='bandpass';ambSet(V.wind.f.frequency,500,t,.5);V.wind.f.Q.value=.7;}}
  let forest=false;try{forest=typeof specBiome==='function'&&specBiome(px,pz)==='forest';}catch(e){}AMB.forest=forest;
  if(forest)wind*=.6;
  B.wind=wind;B.leaves=forest?.035:0;
  // the water
  let W=null;try{W=ambWater(px,pz);}catch(e){}
  const lvl=W?AMB_WATER_PEAK*Math.pow(Math.max(0,1-W.d/AMB_WATER_R),2):0;B.water=lvl;B.waterKind=W?W.kind:null;B.waterD=W?W.d:Infinity;
  if(V.pan&&W){const dx=W.bx-px,dz=W.bz-pz,L=Math.hypot(dx,dz);ambSet(V.pan.pan,L>1?Math.max(-1,Math.min(1,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/L*.6)):0,t,.2);}
  if(W&&V.water.kind!==W.kind){const w=V.water;w.kind=W.kind; /* a river's band, a lake's lapping at 0.5 Hz, the sea's 9–12 s swell */
    const T={river:['bandpass',900,1,.5,0],lake:['lowpass',520,.5,.5,.45],sea:['lowpass',700,.4,1/(9+Math.random()*3),.6]}[W.kind];
    w.f.type=T[0];ambSet(w.f.frequency,T[1],t,.1);w.f.Q.value=T[2];ambSet(w.lfo.frequency,T[3],t,.1);ambSet(w.depth.gain,T[4],t,.1);ambSet(w.lap.gain,1-T[4],t,.1);}
  // the town and the hours, and the calls
  try{ambTown(t,h,V);}catch(e){console.warn('ambience town',e);}
  try{ambCalls(t,h,isle);}catch(e){console.warn('ambience calls',e);}
  AMB.hour=h;
  const M=AMB.dampMul;
  ambSet(V.wind.g.gain,B.wind*M,t,.4);ambSet(V.leaves.g.gain,B.leaves*M,t,.4);ambSet(V.water.g.gain,lvl*M,t,.4);
  ambSet(V.murmur.g.gain,B.murmur*M*(.65+Math.random()*.7),t,.15); /* the babble: each quarter second the crowd swells or falls a little */
  if(V.spot.mode!=='fountain'){V.spot.mode='fountain';V.spot.f.frequency.value=2000;V.spot.f.Q.value=1.4;}ambSet(V.spot.g.gain,B.fountain*M,t,.4);}
