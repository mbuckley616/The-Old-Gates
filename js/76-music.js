
function sndSpell(id, tier){
  tier=tier||1;
  const gM=[1.0, 1.3, 1.7][tier-1]; // gain multiplier
  const dM=[1.0, 1.15, 1.3][tier-1]; // duration multiplier
  const isT2=tier>=2, isT3=tier>=3;

  // Mastery sub-bass thump — a low impact that signals "something heavy left your hand"
  const thump=()=>{ if(isT3)sfxTone(80,40,.22*dM,0.35*gM,'sine'); };

  if(id==='caor'){
    // Fireball — low sawtooth whoosh + tier layers: t2 adds a higher roar octave; t3 adds a deep rumble
    sfxNoise(.12*dM,1,1,0.4*gM,1800);
    sfxTone(200,80,.3*dM,.2*gM,'sawtooth');
    if(isT2)sfxTone(400,160,.2*dM,.12*gM,'sawtooth'); // octave-up roar
    if(isT3)sfxTone(100,50,.45*dM,.18*gM,'sawtooth'); // deep rumble
    thump();
  } else if(id==='sioc'){
    // Frost bolt — bright shimmer. t2 adds a glassy third; t3 adds a crystalline high
    sfxTone(1400,1800,.15*dM,.18*gM,'sine');
    sfxTone(1800,2400,.1*dM,.12*gM,'sine',8);
    if(isT2)sfxTone(1100,1400,.18*dM,.11*gM,'sine',-6);
    if(isT3)sfxTone(2600,3200,.14*dM,.10*gM,'sine',12);
    thump();
  } else if(id==='sideen'){
    // Wind shear — airy noise. t2 adds second stroke; t3 widens filter sweep
    sfxNoise(.08*dM,1,1,0.25*gM,4000);
    sfxTone(900,1400,.12*dM,.15*gM,'triangle');
    if(isT2){setTimeout(()=>sfxNoise(.06*dM,1,1,0.18*gM,3200),70);}
    if(isT3)sfxTone(600,1800,.22*dM,.12*gM,'triangle');
    thump();
  } else if(id==='cloch_ghear'){
    // Stone spike — crunch + thud. t2 adds second impact; t3 adds ground rumble
    sfxNoise(.08*dM,1,1,0.35*gM,600);
    sfxTone(150,90,.35*dM,.2*gM,'sawtooth');
    if(isT2){setTimeout(()=>{sfxNoise(.06*dM,1,1,0.25*gM,500);sfxTone(130,80,.22*dM,.15*gM,'sawtooth');},90);}
    if(isT3)sfxTone(70,40,.5*dM,.22*gM,'sine'); // sub-rumble like earth shifting
    thump();
  } else if(id==='smol'){
    // Shade bolt — muted square descent. t2 adds parallel darker descent; t3 adds whisper of noise
    sfxTone(500,200,.25*dM,.18*gM,'square');
    sfxNoise(.04*dM,1,1,0.15*gM,300);
    if(isT2)sfxTone(350,140,.22*dM,.13*gM,'square',-4);
    if(isT3){sfxNoise(.1*dM,1,1,0.1*gM,180);sfxTone(240,120,.3*dM,.14*gM,'sine');}
    thump();
  } else if(id==='solas_gheal'){
    // Radiant bolt — bright chord. t2 adds upper octave chord; t3 adds a crystalline shimmer
    sfxChord([523,659,784],.4*dM,.12*gM,'sine');
    if(isT2)sfxChord([1046,1318],.3*dM,.09*gM,'sine');
    if(isT3){sfxTone(1568,2093,.35*dM,.1*gM,'sine');sfxTone(2093,2637,.3*dM,.08*gM,'sine',7);}
    thump();
  } else if(id==='leigheas'){
    // Healing light — warm chord + high sustain. t2 adds a fifth; t3 adds harp-like upper shimmer
    sfxChord([261,329,392],.6*dM,.15*gM,'sine');
    sfxTone(784,880,.5*dM,.1*gM,'sine');
    if(isT2)sfxTone(523,587,.55*dM,.11*gM,'sine');
    if(isT3){sfxChord([1046,1318,1568],.45*dM,.09*gM,'sine');sfxTone(1760,1975,.5*dM,.07*gM,'sine');}
    // Heal doesn't get the thump — wrong flavor
  }
}

// Per-school charge-up SFX — plays during the cast animation buildup (roughly 0→330ms).
// Each school has a distinctive sonic identity so the player can tell what magic is being readied
// even without looking at the viewmodel. All charges are ~quiet so they layer well under other SFX.
function sndSpellCharge(school){
  if(!AX||volLevel===0)return;
  if(school==='tine'){
    // Fire — crackling embers: 4-5 quick noise bursts at random intervals, filtered to crackling range
    for(let i=0;i<5;i++){
      setTimeout(()=>{
        sfxNoise(.04,1,1,0.06+i*0.015,2200+Math.random()*1800);
      }, i*55 + Math.random()*25);
    }
    // Low warm swell underneath
    sfxTone(80,140,.3,.05,'sawtooth');
  } else if(school==='uisce'){
    // Ice/water — crystalline shimmer: ascending glass-like sine tones
    const notes=[1046,1318,1568,2093];
    notes.forEach((f,i)=>{
      setTimeout(()=>sfxTone(f,f*1.05,.25,.05+i*0.01,'sine',4), i*65);
    });
    // Subtle sub-shimmer
    sfxTone(400,600,.3,.04,'sine',-8);
  } else if(school==='gaoth'){
    // Wind — rising whistle: filtered noise sweep + rising sine
    sfxNoise(.28,1,1,0.07,1800);
    setTimeout(()=>sfxNoise(.2,1,1,0.05,3200),100);
    sfxTone(500,1400,.32,.06,'triangle');
  } else if(school==='cloch'){
    // Stone — deep rumble: sub-bass sine, sustained and building
    sfxTone(50,85,.32,.09,'sine');
    setTimeout(()=>sfxTone(65,100,.22,.07,'sine'),90);
    // Faint grit
    sfxNoise(.15,1,1,0.03,200);
  } else if(school==='scath'){
    // Shadow — dark pulse: muted low square with pulse pattern, almost subliminal
    sfxTone(120,90,.3,.07,'square',-6);
    setTimeout(()=>sfxTone(100,70,.22,.05,'square',-10),110);
    setTimeout(()=>sfxTone(85,60,.18,.04,'square',-14),220);
    // Hiss of displaced air
    sfxNoise(.2,1,1,0.02,150);
  } else if(school==='solas'){
    // Light — ascending bell: bright sine chord building through octaves
    sfxTone(523,523,.28,.06,'sine');
    setTimeout(()=>sfxTone(659,659,.25,.06,'sine'),70);
    setTimeout(()=>sfxTone(784,784,.22,.06,'sine'),140);
    setTimeout(()=>sfxTone(1046,1046,.2,.07,'sine'),210);
  }
}

function sndEnemyOrb(){
  sfxTone(440,280,.2,.12,'sine');sfxNoise(.08,1,1,0.15,800);
}
function sndUsePotion(){
  sfxTone(440,600,.2,.12,'sine');sfxTone(600,800,.15,.08,'sine');
}
function sndTabSwitch(){
  if(!AX||volLevel===0)return;
  uiNoise(.04,.2,1200);
  uiTone(600,700,.05,.15,'sine');
}
function sndEquipWeapon(){
  if(!AX||volLevel===0)return;
  uiNoise(.18,.35,3000);
  uiTone(320,800,.12,.2,'sawtooth');
  uiTone(880,1100,.25,.12,'sine');
}
function sndEquipShield(){
  if(!AX||volLevel===0)return;
  uiNoise(.12,.38,400);
  uiTone(160,120,.15,.22,'square');
  uiTone(240,200,.1,.12,'sine');
}
function sndEquipArmor(slot){
  if(!AX||volLevel===0)return;
  if(slot==='head'){
    uiNoise(.09,.3,1200);uiTone(280,200,.1,.2,'square');
  } else if(slot==='chest'){
    uiNoise(.14,.38,800);uiTone(160,110,.15,.24,'sawtooth');uiNoise(.06,.14,600);
  } else if(slot==='hands'){
    uiNoise(.07,.22,1800);uiTone(420,320,.08,.14,'sine');
  } else if(slot==='legs'){
    uiNoise(.1,.28,1000);uiTone(220,160,.12,.18,'square');
  } else if(slot==='feet'){
    uiNoise(.08,.22,500);uiTone(180,140,.1,.14,'sawtooth');
  } else {
    uiNoise(.1,.18,600);
  }
}
function sndReadScroll(){
  if(!AX||volLevel===0)return;
  uiNoise(.22,.2,1400);
  [440,554,659,880,1108].forEach((f,i)=>{
    uiTone(f,f*1.15,.18+i*.02,.18,'sine');
  });
  setTimeout(()=>uiTone(1760,2200,.3,.1,'sine'),200);
}
function sndGoldJingle(){
  if(!AX||volLevel===0)return;
  [[0,1480],[0.04,1760],[0.09,1320]].forEach(([delay,freq])=>{
    uiTone(freq,freq*.92,.18,.22,'sine');
  });
  uiNoise(.05,.14,3500);
}
function sndBuyItem(it){
  if(!AX||volLevel===0)return;
  if(it&&it.type==='equip'){
    if(it.slot==='weapon')sndEquipWeapon();
    else if(it.slot==='offhand')sndEquipShield();
    else sndEquipArmor(it.slot||'');
  } else if(it&&it.type==='potion'){
    uiTone(900,1100,.1,.18,'sine');
    uiTone(1100,900,.08,.14,'sine');
  } else {
    uiTone(480,560,.12,.16,'sine');
    uiNoise(.06,.1,1000);
  }
}

// ── MUSIC ENGINE ──────────────────────────────────────────────────────────
let _musicZone='',_musicNodes=[],_musicScheduler=null,_musicScheduler2=null;
let _combatActive=false,_combatFadeTimer=0;

function _clearMusic(){
  if(typeof combatEnd==='function')combatEnd(); // S231 — a fight's cue closes and fades rather than cutting
  _musicNodes.forEach(n=>{try{n.stop&&n.stop();n.disconnect&&n.disconnect();}catch(e){}});
  _musicNodes=[];
  if(_musicScheduler){clearTimeout(_musicScheduler);_musicScheduler=null;}
  if(_musicScheduler2){clearTimeout(_musicScheduler2);_musicScheduler2=null;}
}

let _currentDungeonTheme='ruins'; // set when entering a dungeon

function _mkDrone(freq,gainVal,detune=0){
  const o=AX.createOscillator();o.type='sawtooth';o.frequency.value=freq;o.detune.value=detune;
  const f=AX.createBiquadFilter();f.type='lowpass';f.frequency.value=400;
  const g=AX.createGain();g.gain.value=0;
  o.connect(f);f.connect(g);g.connect(musicGain);o.start();
  g.gain.setTargetAtTime(gainVal,AX.currentTime,.8);
  _musicNodes.push(o,g);
  return{osc:o,gain:g,filter:f};
}

// ═══════════════════════════════════════════════════════════════════════
// v80 — EXPLORING MUSIC (Music session). Seven original pieces played by a
// small WebAudio orchestra. Each piece is written as key/mode, tempo, and a
// list of sections; a section is a chord progression (one chord per bar,
// scale degrees) plus melody phrases in scale degrees, and an arrangement
// (which voices play). Pieces run 3½–5 minutes; the player shuffles them
// with a crossfade and keeps playing through every peaceful zone and
// interior. Combat, dungeon and burned cues are untouched.
// ═══════════════════════════════════════════════════════════════════════
const EXPLORE={playing:false,track:null,nodes:[],timer:null,startAt:0,order:[],cursor:0,bus:null,verb:null,verbGain:null,fadeTo:null,lastIdx:-1};
const MODES={aeolian:[0,2,3,5,7,8,10],phrygian:[0,1,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],mixolydian:[0,2,4,5,7,9,10],ionian:[0,2,4,5,7,9,11],lydian:[0,2,4,6,7,9,11]};
const NOTE_ROOT={C:60,D:62,E:64,F:65,G:67,A:69,Bb:70,B:71,Eb:63};
function midiHz(m){return 440*Math.pow(2,(m-69)/12);}
// degree (1-based, may exceed 7 or be ≤0) → midi in key/mode, octave offset
function degMidi(root,mode,deg,oct){const iv=MODES[mode];const d=deg-1;const o=Math.floor(d/7),k=((d%7)+7)%7;return root+iv[k]+12*(o+(oct||0));}

// ── the orchestra ──
function _exBus(){
  if(EXPLORE.bus)return EXPLORE.bus;
  const bus=AX.createGain();bus.gain.value=1;bus.connect(musicGain);
  // hall: a generated impulse, 2.6 s, gentle
  const len=AX.sampleRate*2.6,ir=AX.createBuffer(2,len,AX.sampleRate);
  for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++){d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.4)*(i<400?i/400:1);}}
  const verb=AX.createConvolver();verb.buffer=ir;const vg=AX.createGain();vg.gain.value=.32;bus.connect(verb);verb.connect(vg);vg.connect(musicGain);
  EXPLORE.bus=bus;EXPLORE.verb=verb;EXPLORE.verbGain=vg;return bus;
}
// each voice: (midi, t0, dur, vel) → schedules nodes on the bus
let _voiceOut=null;function _vOut(){return _voiceOut||_exBus();}
const VOICES={
  spicc(m,t,dur,vel){const f=midiHz(m);const g=AX.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+.008);g.gain.exponentialRampToValueAtTime(.0004,t+Math.max(.08,dur)+.06);
    const lp=AX.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.min(4200,f*6);lp.Q.value=.7;lp.connect(g);g.connect(_vOut());
    [-6,5].forEach(dt=>{const o=AX.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;o.connect(lp);o.start(t);o.stop(t+dur+.1);EXPLORE.nodes.push(o);});EXPLORE.nodes.push(g);},
  taiko(m,t,dur,vel){const g=AX.createGain();g.gain.setValueAtTime(vel,t);g.gain.exponentialRampToValueAtTime(.0004,t+.55);g.connect(_vOut());
    const o=AX.createOscillator();o.type='sine';o.frequency.setValueAtTime(96,t);o.frequency.exponentialRampToValueAtTime(44,t+.18);o.connect(g);o.start(t);o.stop(t+.6);
    const nb=AX.createBuffer(1,Math.ceil(AX.sampleRate*.12),AX.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const n=AX.createBufferSource();n.buffer=nb;const lp=AX.createBiquadFilter();lp.type='lowpass';lp.frequency.value=220;const ng=AX.createGain();ng.gain.value=vel*.8;n.connect(lp);lp.connect(ng);ng.connect(_vOut());n.start(t);EXPLORE.nodes.push(o,g,n,ng);},
  strings(m,t,dur,vel){const f=midiHz(m);const g=AX.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+Math.min(.9,dur*.4));g.gain.setValueAtTime(vel,t+dur-Math.min(.6,dur*.3));g.gain.linearRampToValueAtTime(0,t+dur+.9);
    const lp=AX.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1500+vel*3000;lp.Q.value=.4;lp.connect(g);g.connect(_vOut());
    [-7,0,6].forEach(dt=>{const o=AX.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;const v=AX.createOscillator();v.frequency.value=4.6;const vg=AX.createGain();vg.gain.value=2.2;v.connect(vg);vg.connect(o.detune);v.start(t);v.stop(t+dur+1);o.connect(lp);o.start(t);o.stop(t+dur+1);EXPLORE.nodes.push(o,v);});EXPLORE.nodes.push(g);},
  lowstrings(m,t,dur,vel){const f=midiHz(m);const g=AX.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+.35);g.gain.setValueAtTime(vel,t+dur-.3);g.gain.linearRampToValueAtTime(0,t+dur+.6);
    const lp=AX.createBiquadFilter();lp.type='lowpass';lp.frequency.value=420;lp.connect(g);g.connect(_vOut());
    [-5,4].forEach(dt=>{const o=AX.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;o.connect(lp);o.start(t);o.stop(t+dur+.7);EXPLORE.nodes.push(o);});EXPLORE.nodes.push(g);},
  horn(m,t,dur,vel){const f=midiHz(m);const g=AX.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+.18);g.gain.setValueAtTime(vel*.85,t+dur-.15);g.gain.linearRampToValueAtTime(0,t+dur+.45);
    const lp=AX.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(700,t);lp.frequency.linearRampToValueAtTime(1400,t+.25);lp.connect(g);g.connect(_vOut());
    const o=AX.createOscillator();o.type='sawtooth';o.frequency.value=f;const o2=AX.createOscillator();o2.type='triangle';o2.frequency.value=f;o2.detune.value=3;const m2=AX.createGain();m2.gain.value=.7;o2.connect(m2);m2.connect(lp);o.connect(lp);o.start(t);o2.start(t);o.stop(t+dur+.5);o2.stop(t+dur+.5);EXPLORE.nodes.push(o,o2,g);},
  flute(m,t,dur,vel){const f=midiHz(m);const g=AX.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+.09);g.gain.setValueAtTime(vel,t+dur-.1);g.gain.linearRampToValueAtTime(0,t+dur+.25);g.connect(_vOut());
    const o=AX.createOscillator();o.type='sine';o.frequency.value=f;const v=AX.createOscillator();v.frequency.value=5.2;const vg=AX.createGain();vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(5,t+.5);v.connect(vg);vg.connect(o.detune);const o2=AX.createOscillator();o2.type='sine';o2.frequency.value=f*2;const g2=AX.createGain();g2.gain.value=.18;o2.connect(g2);g2.connect(g);o.connect(g);o.start(t);o2.start(t);v.start(t);o.stop(t+dur+.3);o2.stop(t+dur+.3);v.stop(t+dur+.3);EXPLORE.nodes.push(o,o2,v,g);},
  harp(m,t,dur,vel){const f=midiHz(m);const g=AX.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+.006);g.gain.exponentialRampToValueAtTime(.0004,t+Math.max(.6,Math.min(2.2,dur*1.6)));g.connect(_vOut());
    const o=AX.createOscillator();o.type='triangle';o.frequency.value=f;const o2=AX.createOscillator();o2.type='sine';o2.frequency.value=f*3.01;const g2=AX.createGain();g2.gain.setValueAtTime(vel*.25,t);g2.gain.exponentialRampToValueAtTime(.0004,t+.4);o2.connect(g2);g2.connect(_vOut());o.connect(g);o.start(t);o2.start(t);o.stop(t+2.4);o2.stop(t+.6);EXPLORE.nodes.push(o,o2,g,g2);},
  choir(m,t,dur,vel){const f=midiHz(m);const g=AX.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+Math.min(1.2,dur*.5));g.gain.setValueAtTime(vel,t+dur-.4);g.gain.linearRampToValueAtTime(0,t+dur+1.2);
    const bp=AX.createBiquadFilter();bp.type='bandpass';bp.frequency.value=720;bp.Q.value=1.1;const bp2=AX.createBiquadFilter();bp2.type='bandpass';bp2.frequency.value=1900;bp2.Q.value=2;bp.connect(g);bp2.connect(g);g.connect(_vOut());
    [-9,0,8].forEach(dt=>{const o=AX.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;const v=AX.createOscillator();v.frequency.value=5;const vg=AX.createGain();vg.gain.value=4;v.connect(vg);vg.connect(o.detune);v.start(t);v.stop(t+dur+1.3);o.connect(bp);o.connect(bp2);o.start(t);o.stop(t+dur+1.3);EXPLORE.nodes.push(o,v);});EXPLORE.nodes.push(g);},
  bells(m,t,dur,vel){const f=midiHz(m);const g=AX.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+.004);g.gain.exponentialRampToValueAtTime(.0004,t+3.2);g.connect(_vOut());
    [[1,1],[2.76,.32],[5.4,.12]].forEach(([r,a])=>{const o=AX.createOscillator();o.type='sine';o.frequency.value=f*r;const ga=AX.createGain();ga.gain.value=a;o.connect(ga);ga.connect(g);o.start(t);o.stop(t+3.3);EXPLORE.nodes.push(o,ga);});EXPLORE.nodes.push(g);},
  timpani(m,t,dur,vel){const f=Math.max(40,midiHz(m-24));const g=AX.createGain();g.gain.setValueAtTime(vel,t);g.gain.exponentialRampToValueAtTime(.0004,t+1.4);g.connect(_vOut());
    const o=AX.createOscillator();o.type='sine';o.frequency.setValueAtTime(f*1.4,t);o.frequency.exponentialRampToValueAtTime(f,t+.12);o.connect(g);o.start(t);o.stop(t+1.5);
    const nb=AX.createBuffer(1,AX.sampleRate*.25,AX.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const n=AX.createBufferSource();n.buffer=nb;const ng=AX.createGain();ng.gain.value=vel*.35;const lp=AX.createBiquadFilter();lp.type='lowpass';lp.frequency.value=300;n.connect(lp);lp.connect(ng);ng.connect(_vOut());n.start(t);EXPLORE.nodes.push(o,g,n,ng);},
};

// ── the pieces ──
// Chords: scale degree of the root (1..7), optional suffix: 'sus' (sus4), '7' (add 7th), 'm' forced minor 3rd, 'M' forced major 3rd.
// Melody phrases: strings of "deg:beats" tokens; a leading "." is a rest; "^"/"_" shift an octave.
// Sections: {name, bars, chords:[...], melody:[phrase,...] (each phrase spans its bars), voices:{pad,bass,harp,lead,counter,choir,bells,timp}, dyn}
const PIECES=[
 {id:'home',name:'The Home Province',root:'D',mode:'dorian',bpm:66,lead:'horn',
  sections:[
   {bars:8,chords:[1,1,6,6,4,4,7,5],melody:['.:4 1:2 3:2','5:3 4:1 3:4','.:2 6:2 5:2 3:2','2:4 1:4','.:4 1:2 2:2','3:3 5:1 6:4','5:2 4:2 3:2 2:2','1:8'],voices:{pad:1,bass:1,harp:0,lead:0,choir:0},dyn:.55},
   {bars:8,chords:[1,1,6,6,4,4,7,5],melody:['.:4 1:2 3:2','5:3 4:1 3:4','.:2 6:2 5:2 3:2','2:4 1:4','.:4 1:2 2:2','3:3 5:1 6:4','5:2 4:2 3:2 2:2','1:8'],voices:{pad:1,bass:1,harp:1,lead:1,choir:0},dyn:.7},
   {bars:8,chords:[4,4,1,1,6,6,5,5],melody:['8:3 7:1 6:4','5:4 3:4','6:3 5:1 3:4','4:4 2:4','8:2 7:2 6:2 5:2','6:4 4:4','5:3 4:1 3:4','2:8'],voices:{pad:1,bass:1,harp:1,lead:1,counter:1,choir:0},dyn:.8},
   {bars:8,chords:[1,1,6,6,4,4,7,5],melody:['.:4 1:2 3:2','5:3 4:1 3:4','.:2 6:2 5:2 3:2','2:4 1:4','.:4 1:2 2:2','3:3 5:1 6:4','5:2 4:2 3:2 2:2','1:8'],voices:{pad:1,bass:1,harp:1,lead:1,counter:1,choir:1,timp:1},dyn:.9},
   {bars:8,chords:[6,6,4,4,1,1,5,5],melody:['3:6 2:2','1:8','.:8','.:8','.:4 1:2 3:2','5:4 4:4','3:4 2:4','1:8'],voices:{pad:1,bass:0,harp:1,lead:1,choir:1},dyn:.55},
   {bars:8,chords:[1,1,1,1,1,1,1,1],melody:['.:8','1:8','.:8','.:8','.:8','.:8','.:8','.:8'],voices:{pad:1,harp:1,bells:1},dyn:.4},
  ]},
 {id:'roads',name:'Grey Roads',root:'A',mode:'aeolian',bpm:58,lead:'flute',
  sections:[
   {bars:8,chords:[1,1,7,7,6,6,7,7],melody:['.:8','.:8','.:8','.:8','.:8','.:8','.:8','.:8'],voices:{pad:1,bass:1},dyn:.5},
   {bars:8,chords:[1,1,7,7,6,6,7,7],melody:['.:2 5:2 7:2 8:2','9:4 8:2 7:2','5:6 .:2','.:2 7:2 8:2 5:2','6:4 5:2 4:2','3:6 .:2','.:2 3:2 4:2 5:2','7:8'],voices:{pad:1,bass:1,lead:1},dyn:.62},
   {bars:8,chords:[4,4,1,1,6,6,5,5],melody:['8:3 9:1 8:4','7:4 5:4','6:3 7:1 6:4','5:4 3:4','4:2 5:2 6:2 7:2','8:4 7:4','5:6 4:2','5:8'],voices:{pad:1,bass:1,lead:1,harp:1},dyn:.72},
   {bars:8,chords:[1,1,7,7,6,6,7,7],melody:['.:2 5:2 7:2 8:2','9:4 8:2 7:2','5:6 .:2','.:2 7:2 8:2 5:2','6:4 5:2 4:2','3:6 .:2','.:2 3:2 4:2 5:2','8:8'],voices:{pad:1,bass:1,lead:1,harp:1,counter:1,choir:1},dyn:.8},
   {bars:8,chords:[6,6,7,7,1,1,1,1],melody:['3:4 2:4','1:8','.:8','.:8','.:8','.:8','.:8','.:8'],voices:{pad:1,harp:1,choir:1},dyn:.5},
  ]},
 {id:'dawn',name:'Sails at Dawn',root:'F',mode:'lydian',bpm:74,lead:'flute',
  sections:[
   {bars:8,chords:[1,1,2,2,1,1,5,5],melody:['.:8','.:8','.:8','.:8','.:8','.:8','.:8','.:8'],voices:{pad:1,harp:1},dyn:.5},
   {bars:8,chords:[1,1,2,2,1,1,5,5],melody:['.:1 5:1 6:1 8:1 9:2 8:2','7:4 5:4','.:1 6:1 7:1 9:1 10:2 9:2','8:4 7:4','5:2 6:2 8:2 9:2','10:4 9:2 8:2','7:2 8:2 9:2 7:2','8:8'],voices:{pad:1,harp:1,lead:1,bass:1},dyn:.7},
   {bars:8,chords:[6,6,4,4,2,2,5,5],melody:['10:3 9:1 8:4','7:2 6:2 5:4','8:3 7:1 6:4','5:2 4:2 3:4','6:2 7:2 8:2 9:2','10:4 8:4','9:2 8:2 7:2 6:2','5:8'],voices:{pad:1,harp:1,lead:1,bass:1,counter:1},dyn:.78},
   {bars:8,chords:[1,1,2,2,1,1,5,5],melody:['.:1 5:1 6:1 8:1 9:2 8:2','7:4 5:4','.:1 6:1 7:1 9:1 10:2 9:2','8:4 7:4','5:2 6:2 8:2 9:2','10:4 9:2 8:2','7:2 8:2 9:2 7:2','8:8'],voices:{pad:1,harp:1,lead:1,bass:1,counter:1,choir:1,timp:1},dyn:.88},
   {bars:8,chords:[1,1,1,1,4,4,1,1],melody:['.:8','5:4 3:4','1:8','.:8','.:8','.:8','.:8','.:8'],voices:{pad:1,harp:1,bells:1},dyn:.45},
  ]},
 {id:'ridges',name:'Snow on the Ridges',root:'E',mode:'aeolian',bpm:54,lead:'horn',
  sections:[
   {bars:8,chords:[1,1,6,6,1,1,3,3],melody:['.:8','.:8','.:8','.:8','.:8','.:8','.:8','.:8'],voices:{choir:1,bells:1},dyn:.45},
   {bars:8,chords:[1,1,6,6,1,1,3,3],melody:['.:4 1:4','5:4 4:2 3:2','2:6 3:2','1:8','.:4 3:4','5:4 6:2 5:2','4:6 3:2','2:8'],voices:{choir:1,pad:1,lead:1,bass:1},dyn:.62},
   {bars:8,chords:[4,4,1,1,6,6,7,7],melody:['8:4 7:2 6:2','5:8','6:4 5:2 4:2','3:8','4:2 5:2 6:2 7:2','8:4 6:4','7:4 5:4','5:8'],voices:{choir:1,pad:1,lead:1,bass:1,counter:1,timp:1},dyn:.82},
   {bars:8,chords:[1,1,6,6,1,1,3,3],melody:['.:4 1:4','5:4 4:2 3:2','2:6 3:2','1:8','.:4 3:4','5:4 6:2 5:2','4:6 3:2','1:8'],voices:{choir:1,pad:1,lead:1,bass:1,harp:1},dyn:.7},
   {bars:8,chords:[1,1,1,1,1,1,1,1],melody:['.:8','.:8','.:8','.:8','.:8','.:8','.:8','.:8'],voices:{choir:1,bells:1},dyn:.4},
  ]},
 {id:'heather',name:'Ashes and Heather',root:'G',mode:'dorian',bpm:64,lead:'horn',
  sections:[
   {bars:8,chords:[1,1,4,4,1,1,7,7],melody:['.:8','.:8','.:8','.:8','.:8','.:8','.:8','.:8'],voices:{bass:1,pad:1},dyn:.5},
   {bars:8,chords:[1,1,4,4,1,1,7,7],melody:['1:2 3:2 5:2 6:2','5:6 3:2','4:2 6:2 8:2 6:2','5:8','1:2 3:2 5:2 6:2','8:4 7:2 6:2','5:4 4:2 3:2','2:8'],voices:{bass:1,pad:1,lead:1,harp:1},dyn:.68},
   {bars:8,chords:[6,6,3,3,4,4,5,5],melody:['3:4 5:2 6:2','8:6 7:2','5:4 3:2 5:2','6:8','4:2 6:2 8:2 9:2','10:4 9:2 8:2','7:4 6:2 5:2','5:8'],voices:{bass:1,pad:1,lead:1,harp:1,counter:1,choir:1},dyn:.8},
   {bars:8,chords:[1,1,4,4,1,1,7,7],melody:['1:2 3:2 5:2 6:2','5:6 3:2','4:2 6:2 8:2 6:2','5:8','1:2 3:2 5:2 6:2','8:4 7:2 6:2','5:4 4:2 3:2','1:8'],voices:{bass:1,pad:1,lead:1,harp:1,timp:1},dyn:.76},
   {bars:8,chords:[1,1,1,1,1,1,1,1],melody:['.:8','1:8','.:8','.:8','.:8','.:8','.:8','.:8'],voices:{pad:1,harp:1},dyn:.42},
  ]},
 {id:'water',name:'Wide Water',root:'C',mode:'mixolydian',bpm:70,lead:'flute',
  sections:[
   {bars:8,chords:[1,1,7,7,1,1,4,4],melody:['.:8','.:8','.:8','.:8','.:8','.:8','.:8','.:8'],voices:{harp:1,pad:1},dyn:.5},
   {bars:8,chords:[1,1,7,7,1,1,4,4],melody:['5:2 6:2 8:4','7:2 6:2 5:4','4:2 5:2 7:4','5:8','5:2 6:2 8:4','9:2 8:2 7:4','6:2 7:2 8:2 6:2','5:8'],voices:{harp:1,pad:1,lead:1,bass:1},dyn:.66},
   {bars:8,chords:[6,6,4,4,1,1,5,5],melody:['3:2 5:2 6:4','8:2 7:2 6:4','6:2 7:2 8:4','9:8','8:2 7:2 6:2 5:2','6:4 5:4','7:2 6:2 5:2 4:2','5:8'],voices:{harp:1,pad:1,lead:1,bass:1,counter:1,choir:1},dyn:.8},
   {bars:8,chords:[1,1,7,7,1,1,4,4],melody:['5:2 6:2 8:4','7:2 6:2 5:4','4:2 5:2 7:4','5:8','5:2 6:2 8:4','9:2 8:2 7:4','6:2 7:2 8:2 6:2','8:8'],voices:{harp:1,pad:1,lead:1,bass:1,counter:1,bells:1},dyn:.74},
   {bars:8,chords:[1,1,1,1,4,4,1,1],melody:['.:8','.:8','.:8','.:8','.:8','.:8','.:8','.:8'],voices:{harp:1,pad:1,bells:1},dyn:.45},
  ]},
 {id:'lantern',name:'Lantern Hours',root:'Bb',mode:'ionian',bpm:60,lead:'flute',
  sections:[
   {bars:8,chords:[1,1,6,6,4,4,5,5],melody:['.:8','.:8','.:8','.:8','.:8','.:8','.:8','.:8'],voices:{harp:1,pad:1},dyn:.48},
   {bars:8,chords:[1,1,6,6,4,4,5,5],melody:['.:2 3:2 5:2 8:2','7:4 5:4','.:2 6:2 8:2 10:2','9:4 8:4','.:2 4:2 6:2 8:2','7:2 6:2 5:4','.:2 5:2 4:2 3:2','2:8'],voices:{harp:1,pad:1,lead:1,bass:1},dyn:.62},
   {bars:8,chords:[2,2,5,5,1,1,6,6],melody:['4:4 6:2 8:2','7:6 5:2','5:4 4:2 3:2','3:8','5:2 6:2 8:2 9:2','10:4 8:4','6:4 5:2 4:2','3:8'],voices:{harp:1,pad:1,lead:1,bass:1,counter:1},dyn:.72},
   {bars:8,chords:[1,1,6,6,4,4,5,5],melody:['.:2 3:2 5:2 8:2','7:4 5:4','.:2 6:2 8:2 10:2','9:4 8:4','.:2 4:2 6:2 8:2','7:2 6:2 5:4','.:2 5:2 4:2 3:2','1:8'],voices:{harp:1,pad:1,lead:1,bass:1,counter:1,choir:1},dyn:.7},
   {bars:8,chords:[1,1,1,1,1,1,1,1],melody:['.:8','.:8','.:8','.:8','.:8','.:8','.:8','.:8'],voices:{harp:1,pad:1,bells:1},dyn:.42},
  ]},
];
// A piece plays its sections in order, then repeats the middle sections
// once with variation (octave-up lead, added counter-line) before the
// coda, which lands it at 3½–5 minutes.
function pieceEvents(P){
  const root=NOTE_ROOT[P.root]||60,mode=P.mode,beat=60/P.bpm;
  const ev=[];let t=0;
  const chordTones=(deg)=>[degMidi(root,mode,deg,0),degMidi(root,mode,deg+2,0),degMidi(root,mode,deg+4,0),degMidi(root,mode,deg+7,0)];
  const plan=[...P.sections];if(P.sections.length>=4){plan.splice(P.sections.length-1,0,Object.assign({},P.sections[1],{vary:1}),Object.assign({},P.sections[2],{vary:1,dyn:Math.min(.95,(P.sections[2].dyn||.7)+.08)}));}
  plan.forEach((S,si)=>{
    const dyn=S.dyn||.6,v=S.voices||{};const t0=t;
    for(let b=0;b<S.bars;b++){
      const deg=S.chords[b%S.chords.length];const ct=chordTones(deg);const bt=t0+b*4*beat;
      if(v.pad){ct.slice(0,3).forEach((m,k)=>ev.push({v:'strings',m:m-12*(k===0?1:0),t:bt,d:4*beat,vel:.055*dyn*(k===0?1.1:.9)}));}
      if(v.choir){ct.slice(0,3).forEach((m,k)=>ev.push({v:'choir',m:m+(k===2?12:0),t:bt,d:4*beat,vel:.04*dyn}));}
      if(v.bass){ev.push({v:'lowstrings',m:ct[0]-24,t:bt,d:2*beat,vel:.11*dyn});ev.push({v:'lowstrings',m:ct[0]-24+(b%2?0:0),t:bt+2*beat,d:2*beat,vel:.09*dyn});}
      if(v.harp){const arp=[ct[0],ct[1],ct[2],ct[3],ct[2],ct[1],ct[0]+12,ct[1]];for(let e=0;e<8;e++){if(S.vary&&e%2)continue;ev.push({v:'harp',m:arp[e]+(e>=4?0:-12)+12,t:bt+e*beat*.5,d:beat*.5,vel:.06*dyn});}}
      if(v.timp&&b%4===0)ev.push({v:'timpani',m:ct[0],t:bt,d:1,vel:.18*dyn});
      if(v.bells&&b%2===0)ev.push({v:'bells',m:ct[b%4===0?0:2]+12,t:bt+(b%4?2*beat:0),d:2,vel:.05*dyn});
    }
    if(v.lead||v.counter){
      (S.melody||[]).forEach((phrase,b)=>{let cur=t0+b*4*beat;phrase.split(' ').forEach(tok=>{const [dS,bS]=tok.split(':');const beats=+bS;if(dS!=='.'){let d=+dS;const m=degMidi(root,mode,d,S.vary?1:0);
          if(v.lead)ev.push({v:P.lead,m:m+(P.lead==='horn'?0:12),t:cur,d:beats*beat*.95,vel:(P.lead==='horn'?.13:.1)*dyn});
          if(v.counter)ev.push({v:'strings',m:degMidi(root,mode,d-2,0),t:cur,d:beats*beat*.95,vel:.05*dyn});}
        cur+=beats*beat;});});
    }
    t=t0+S.bars*4*beat;
  });
  return {events:ev.sort((a,b)=>a.t-b.t),length:t+3};
}
function exploreStop(fade){
  if(!EXPLORE.playing)return;EXPLORE.playing=false;
  if(EXPLORE.timer){clearTimeout(EXPLORE.timer);EXPLORE.timer=null;}
  const bus=EXPLORE.bus;if(bus&&AX){const now=AX.currentTime;bus.gain.cancelScheduledValues(now);bus.gain.setValueAtTime(bus.gain.value,now);bus.gain.linearRampToValueAtTime(0,now+(fade||1.2));}
  const nodes=EXPLORE.nodes;EXPLORE.nodes=[];setTimeout(()=>{nodes.forEach(n=>{try{n.stop&&n.stop();}catch(e){}try{n.disconnect&&n.disconnect();}catch(e){}});},(fade||1.2)*1000+100);
}
function nextPiece(){
  if(!EXPLORE.order.length||EXPLORE.cursor>=EXPLORE.order.length){const idx=PIECES.map((_,i)=>i);for(let i=idx.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}if(idx[0]===EXPLORE.lastIdx&&idx.length>1){[idx[0],idx[1]]=[idx[1],idx[0]];}EXPLORE.order=idx;EXPLORE.cursor=0;}
  const i=EXPLORE.order[EXPLORE.cursor++];EXPLORE.lastIdx=i;return PIECES[i];
}
function explorePlay(){
  if(!AX)return;if(EXPLORE.playing)return;
  EXPLORE.playing=true;const bus=_exBus();const now=AX.currentTime;bus.gain.cancelScheduledValues(now);bus.gain.setValueAtTime(0,now);bus.gain.linearRampToValueAtTime(1,now+2.5);
  const P=nextPiece();const {events,length}=pieceEvents(P);EXPLORE.track=P;EXPLORE.startAt=now+.3;let i=0;
  const CEIL={strings:79,lowstrings:60,horn:74,flute:81,harp:86,choir:77,bells:88,timpani:60};
  const step=()=>{if(!EXPLORE.playing)return;const cur=AX.currentTime;while(i<events.length&&EXPLORE.startAt+events[i].t<cur+1.2){const e=events[i++];const vf=VOICES[e.v];let m=e.m;const c=CEIL[e.v]||84;while(m>c)m-=12;if(vf)vf(m,EXPLORE.startAt+e.t,e.d,e.vel);}
    // prune finished nodes' references now and then
    if(EXPLORE.nodes.length>900)EXPLORE.nodes.splice(0,EXPLORE.nodes.length-600);
    if(i>=events.length&&cur>EXPLORE.startAt+length-2){EXPLORE.playing=false;EXPLORE.timer=null;setTimeout(()=>{if(_musicZone==='explore')explorePlay();},2200);return;}
    EXPLORE.timer=setTimeout(step,300);};
  step();
}
const PEACEFUL_ZONES=new Set(['overworld','village','town','city','forest','road','mountain','wastes','coast','shop','church','castle']);
window.devMusic=function(id){const P=typeof id==='number'?PIECES[id]:PIECES.find(p=>p.id===id);if(!P)return PIECES.map(p=>p.id);exploreStop(.5);EXPLORE.order=[PIECES.indexOf(P)];EXPLORE.cursor=0;_musicZone='explore';setTimeout(explorePlay,600);return P.name;};

function startMusic(zone,theme){
  if(!AX)return;
  // v80 — every peaceful zone shares one exploring playlist that keeps playing across them
  if(PEACEFUL_ZONES.has(zone)){if(_musicZone==='explore'&&EXPLORE.playing)return;_musicZone='explore';_clearMusic();explorePlay();return;}
  const key=zone+(theme||'');
  if(_musicZone===key)return;
  _musicZone=key;
  exploreStop(1.0);
  _clearMusic();
  if(zone==='overworld')_musicOW();
  else if(zone==='village')_musicVillage();
  else if(zone==='town')_musicTown();
  else if(zone==='city')_musicCity();
  else if(zone==='forest')_musicForest();
  else if(zone==='road')_musicRoad();
  else if(zone==='mountain')_musicMountain();
  else if(zone==='wastes')_musicWastes();
  else if(zone==='coast')_musicCoast();
  else if(zone==='shop')_musicShop();
  else if(zone==='church')_musicChurch();
  else if(zone==='castle')_musicCastle();
  else if(zone==='dungeon'){_currentDungeonTheme=theme||'ruins';_musicDungeon();}
  else if(zone==='combat')_musicCombat();
  else if(zone==='burned')_musicBurned();
}

function _musicOW(){
  if(!AX)return;
  const drone1=_mkDrone(110,.06);
  const drone2=_mkDrone(165,.04,5);
  const pad=_mkDrone(220,.035,-8);
  const lfo=AX.createOscillator();lfo.frequency.value=0.18;
  const lfoG=AX.createGain();lfoG.gain.value=300;
  lfo.connect(lfoG);lfoG.connect(pad.filter.frequency);lfo.start();
  _musicNodes.push(lfo,lfoG);
  const PEN_OW=[261,294,330,392,440,523,587,659];
  function schedNote(){
    if(_musicZone!=='overworld')return;
    const now=AX.currentTime;
    const freq=PEN_OW[Math.floor(Math.random()*PEN_OW.length)];
    const dur=0.3+Math.random()*.4;
    const o=AX.createOscillator();o.type='sine';o.frequency.value=freq;
    const o2=AX.createOscillator();o2.type='sine';o2.frequency.value=freq*2.01;
    const g=AX.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.1,now+.02);
    g.gain.exponentialRampToValueAtTime(0.0001,now+dur+.8);
    o.connect(g);o2.connect(g);g.connect(musicGain);
    o.start(now);o2.start(now);o.stop(now+dur+.9);o2.stop(now+dur+.9);
    _musicNodes.push(o,o2,g);
    _musicScheduler=setTimeout(schedNote,1200+Math.random()*1800);
  }
  schedNote();
}

// v61c8 — Burned Ashenmoor ambient. Lower and sparser than _musicOW;
// the village music's pentatonic note scheduler would feel wrong in the
// ruins (too musical, too peaceful). This track:
//   - Three low drones (75 / 95 / 38 Hz). The 38 Hz sub-bass gives the
//     "you can feel it in your chest" quality the design brief wanted.
//   - Slow LFO on the mid drone's filter — breath-like, ~12s period.
//   - Periodic slow keening tone every 8-15s — high, soft, slowly bent
//     downward over ~3s. Reads as a distant cry without being literal.
//   - Periodic filtered noise gust every 5-10s — wind through ash. Low
//     gain, narrow filter, audible only as texture.
// No melodic notes. No percussion. The shape of the silence is the point.
function _musicBurned(){
  if(!AX)return;
  // Three drones: deep sub, low fundamental, mournful fifth-ish overtone
  const sub  =_mkDrone(38, .12, -4);  // chest-rumble layer
  const drone1=_mkDrone(75, .07, 0);  // fundamental
  const drone2=_mkDrone(95, .045, 6); // detuned overtone

  // Heavy low-pass on everything so the track sits "behind a wall"
  sub.filter.frequency.value = 90;
  drone1.filter.frequency.value = 180;
  drone2.filter.frequency.value = 240;

  // Slow filter LFO — breath/sigh quality on drone1
  const lfo=AX.createOscillator();
  lfo.frequency.value=0.085; // ~12s period
  const lfoG=AX.createGain();
  lfoG.gain.value=120;
  lfo.connect(lfoG);
  lfoG.connect(drone1.filter.frequency);
  lfo.start();
  _musicNodes.push(lfo,lfoG);

  // Periodic distant keening — high tone slowly bending down. Sparse.
  function schedKeen(){
    if(_musicZone!=='burned')return;
    const now=AX.currentTime;
    // Pick a high frequency in a "wail" range — 480-720 Hz, slightly
    // detuned across a small ensemble for a "many voices" texture.
    const freq=480+Math.random()*240;
    const dur=2.5+Math.random()*1.5;
    const o=AX.createOscillator();
    o.type='sine';
    o.frequency.setValueAtTime(freq,now);
    o.frequency.exponentialRampToValueAtTime(freq*0.55,now+dur);
    const o2=AX.createOscillator();
    o2.type='sine';
    o2.frequency.setValueAtTime(freq*1.498,now);
    o2.frequency.exponentialRampToValueAtTime(freq*0.55*1.498,now+dur);
    o2.detune.value=-12;
    const g=AX.createGain();
    g.gain.setValueAtTime(0,now);
    // v61c9 — Volume reduced ~40% (.045→.027, .040→.024). Was cutting
    // through the drone bed too prominently; now sits as background
    // texture rather than foreground keen. Adjust here if it needs to
    // come further down or back up.
    g.gain.linearRampToValueAtTime(.027,now+0.6);  // slow fade-in
    g.gain.linearRampToValueAtTime(.024,now+dur*0.7);
    g.gain.exponentialRampToValueAtTime(0.0001,now+dur+0.4);
    // Filter the keening so it sits behind the drones rather than over them
    const filt=AX.createBiquadFilter();
    filt.type='lowpass';
    filt.frequency.value=900;
    filt.Q.value=0.6;
    o.connect(filt);o2.connect(filt);
    filt.connect(g);g.connect(musicGain);
    o.start(now);o2.start(now);
    o.stop(now+dur+.5);o2.stop(now+dur+.5);
    _musicNodes.push(o,o2,g,filt);
    // Reschedule sparsely — long gaps of just drone between keens
    _musicScheduler=setTimeout(schedKeen,8000+Math.random()*7000);
  }
  // Wind/ash gust noise — separate scheduler, runs alongside keen
  function schedGust(){
    if(_musicZone!=='burned')return;
    const now=AX.currentTime;
    const dur=1.5+Math.random()*1.0;
    const buf=AX.createBuffer(1,Math.ceil(AX.sampleRate*dur),AX.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.5;
    const src=AX.createBufferSource();src.buffer=buf;
    const filt=AX.createBiquadFilter();
    filt.type='bandpass';
    filt.frequency.value=320+Math.random()*200;
    filt.Q.value=2.5;
    const g=AX.createGain();
    g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(.06,now+0.4);
    g.gain.linearRampToValueAtTime(.05,now+dur*0.6);
    g.gain.exponentialRampToValueAtTime(0.0001,now+dur);
    src.connect(filt);filt.connect(g);g.connect(musicGain);
    src.start(now);src.stop(now+dur);
    _musicNodes.push(src,g,filt);
    setTimeout(schedGust,5000+Math.random()*5000);
  }
  // Initial offsets so they don't fire simultaneously
  setTimeout(schedKeen, 3000+Math.random()*4000);
  setTimeout(schedGust, 1500+Math.random()*3000);
}

function _musicDungeon(){
  if(!AX)return;
  const t=_currentDungeonTheme;

  // Base frequencies and character vary by theme
  const THEME_MUSIC={
    undead:   {r1:55, r2:58,  r3:73,  lfoF:0.06, lfoAmt:200, rumbleF:100, rumbleGain:.12, extraFn:'whisper'},
    goblin:   {r1:82, r2:87,  r3:110, lfoF:0.14, lfoAmt:280, rumbleF:200, rumbleGain:.10, extraFn:'drip'},
    elemental:{r1:44, r2:55,  r3:66,  lfoF:0.10, lfoAmt:350, rumbleF:80,  rumbleGain:.15, extraFn:'crackle'},
    deep:     {r1:36, r2:40,  r3:54,  lfoF:0.05, lfoAmt:160, rumbleF:60,  rumbleGain:.18, extraFn:'drip'},
    haunted:  {r1:49, r2:52,  r3:73,  lfoF:0.07, lfoAmt:300, rumbleF:120, rumbleGain:.08, extraFn:'whisper'},
    ruins:    {r1:55, r2:58,  r3:82,  lfoF:0.08, lfoAmt:250, rumbleF:120, rumbleGain:.12, extraFn:'none'},
  };
  const m=THEME_MUSIC[t]||THEME_MUSIC.ruins;

  const drone1=_mkDrone(m.r1,.08);
  const drone2=_mkDrone(m.r2,.05,0);
  const drone3=_mkDrone(m.r3,.03,10);

  // Theme tint: elemental gets a higher filter, deep gets very low
  drone1.filter.frequency.value=t==='elemental'?600:t==='deep'?80:200;
  drone2.filter.frequency.value=t==='elemental'?800:t==='deep'?100:300;

  const lfo=AX.createOscillator();lfo.frequency.value=m.lfoF;
  const lfoG=AX.createGain();lfoG.gain.value=m.lfoAmt;
  lfo.connect(lfoG);lfoG.connect(drone1.filter.frequency);lfo.start();
  _musicNodes.push(lfo,lfoG);

  // Periodic ambient event — varies by theme
  function schedAmbient(){
    if(!_musicZone.startsWith('dungeon'))return;
    const now=AX.currentTime;

    if(m.extraFn==='whisper'){
      // High ghostly tone — undead/haunted
      const freq=800+Math.random()*600;
      const o=AX.createOscillator();o.type='sine';o.frequency.value=freq;
      const g=AX.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.04,now+.5);
      g.gain.exponentialRampToValueAtTime(0.0001,now+2.5);
      o.connect(g);g.connect(musicGain);o.start(now);o.stop(now+3);
      _musicNodes.push(o,g);
    } else if(m.extraFn==='drip'){
      // Water drip clicks — goblin/deep
      const o=AX.createOscillator();o.type='sine';o.frequency.value=1200+Math.random()*400;
      const g=AX.createGain();g.gain.setValueAtTime(.06,now);g.gain.exponentialRampToValueAtTime(0.0001,now+.08);
      o.connect(g);g.connect(musicGain);o.start(now);o.stop(now+.1);
      _musicNodes.push(o,g);
    } else if(m.extraFn==='crackle'){
      // Short noise crackle — elemental
      const buf=AX.createBuffer(1,Math.ceil(AX.sampleRate*.06),AX.sampleRate);
      const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.5);
      const src=AX.createBufferSource();src.buffer=buf;
      const f=AX.createBiquadFilter();f.type='highpass';f.frequency.value=2000;
      const g=AX.createGain();g.gain.value=.18;
      src.connect(f);f.connect(g);g.connect(musicGain);src.start(now);
      _musicNodes.push(src,g);
    } else {
      // Default low rumble hit
      const buf=AX.createBuffer(1,Math.ceil(AX.sampleRate*.4),AX.sampleRate);
      const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
      const src=AX.createBufferSource();src.buffer=buf;
      const f=AX.createBiquadFilter();f.type='lowpass';f.frequency.value=m.rumbleF;
      const g=AX.createGain();g.gain.value=m.rumbleGain;
      src.connect(f);f.connect(g);g.connect(musicGain);src.start(now);
      _musicNodes.push(src,g);
    }

    const interval=m.extraFn==='drip'?1500+Math.random()*2500:3000+Math.random()*5000;
    _musicScheduler=setTimeout(schedAmbient,interval);
  }
  schedAmbient();
}

// ── Combat — Oblivion-inspired: dramatic hit, driving ostinato, brass stabs ─
// ═══ COMBAT MUSIC (Session 231) ═══════════════════════════════════════
// Michael, 27 Sep: "stale and simplistic". The fight's cue is now played by the exploring orchestra (VOICES, plus
// spiccato strings and a war drum) in the same hall, and scheduled bar by bar against the audio clock with a 0.6 s
// lookahead, so the eighths no longer drift with setTimeout. Three themes, a different one each fight; each loops an
// A and a B section of eight bars after a two-bar opening. The layers follow the fight (COMBAT.heat, set in tickMusic:
// each alert foe within 30 units counts one, a boss three): low strings and drums always; the high strings and a
// held pad from two; the horn's theme from three; the choir from five. When the fight ends the cue closes on the
// tonic and fades over three seconds while the exploring music comes back in.
const COMBAT={bus:null,timer:null,bar:0,next:0,theme:null,heat:1,log:null,lastTheme:-1};
const COMBAT_THEMES=[
 {id:'steel',root:'D',mode:'aeolian',bpm:138,ost:[0,0,12,0,7,0,12,7],
  A:{chords:[1,1,6,7,1,1,4,5],horn:['1:1.5 5:.5 5:2','.:4','4:1.5 3:.5 1:2','.:4','1:1.5 5:.5 8:2','7:2 5:2','6:1.5 5:.5 4:2','5:4']},
  B:{chords:[6,6,7,7,4,4,5,5],horn:['3:2 4:1 5:1','6:4','5:2 4:1 3:1','2:4','3:2 4:1 5:1','8:4','7:2 6:2','5:4']}},
 {id:'ambush',root:'E',mode:'phrygian',bpm:146,ost:[0,12,0,1,0,12,0,7],
  A:{chords:[1,2,1,2,1,2,7,1],horn:['1:3 2:1','1:4','5:1 4:1 2:2','1:4','1:3 2:1','3:2 2:2','7:2 6:2','7:4']},
  B:{chords:[6,6,2,2,6,6,7,7],horn:['6:2 5:1 3:1','2:4','3:2 2:1 1:1','2:4','6:2 5:1 3:1','5:2 6:2','7:2 5:2','2:4']}},
 {id:'stand',root:'C',mode:'dorian',bpm:128,ost:[0,7,12,7,0,7,10,7],
  A:{chords:[1,1,7,7,4,4,5,5],horn:['5:2 4:1 5:1','1:4','4:2 3:1 2:1','7:4','5:2 4:1 5:1','8:2 7:2','6:2 5:1 4:1','5:4']},
  B:{chords:[4,4,1,1,7,7,5,5],horn:['4:1.5 5:.5 6:2','8:4','7:1.5 6:.5 5:2','4:4','4:1.5 5:.5 6:2','8:2 9:2','8:2 7:2','5:4']}}
];
function _cbVoice(v,m,t,d,vel){_voiceOut=COMBAT.bus;try{VOICES[v](m,t,d,vel);}finally{_voiceOut=null;}}
function combatBar(t0,bar){
  const T=COMBAT.theme,root=NOTE_ROOT[T.root]||60,beat=60/T.bpm,e8=beat/2;const intro=bar<2;
  const S=(Math.floor(Math.max(0,bar-2)/8)%2)?T.B:T.A;const k=Math.max(0,bar-2)%8;const deg=intro?1:S.chords[k];
  const ct=[degMidi(root,T.mode,deg,0),degMidi(root,T.mode,deg+2,0),degMidi(root,T.mode,deg+4,0)];
  const heat=COMBAT.heat,L=['ost','drum'];
  for(let q=0;q<8;q++)_cbVoice('spicc',ct[0]-24+T.ost[q],t0+q*e8,e8*.8,q%2?.075:.11);
  _cbVoice('taiko',0,t0,1,.26);_cbVoice('taiko',0,t0+2*beat,1,.2);
  if(bar%4===3){_cbVoice('taiko',0,t0+3.5*beat,1,.14);_cbVoice('taiko',0,t0+3.75*beat,1,.18);}
  if(bar%4===0)_cbVoice('timpani',ct[0],t0,1,.2);
  if(!intro&&heat>=2){L.push('high','pad');const arp=[ct[0],ct[1],ct[2],ct[1]+12,ct[2],ct[1],ct[0]+12,ct[2]];for(let q=0;q<8;q++)_cbVoice('spicc',arp[q]+12,t0+q*e8,e8*.7,.045);
    ct.forEach((m,n)=>_cbVoice('strings',m-(n?0:12),t0,4*beat*.95,.035));}
  if(!intro&&heat>=3){L.push('horn');let cur=t0;S.horn[k].split(' ').forEach(tok=>{const [dS,bS]=tok.split(':');const b=+bS;if(dS!=='.')_cbVoice('horn',degMidi(root,T.mode,+dS,0),cur,b*beat*.92,.12);cur+=b*beat;});}
  if(!intro&&heat>=5&&k%4===0){L.push('choir');ct.forEach((m,n)=>_cbVoice('choir',m+(n===2?12:0),t0,8*beat*.95,.04));}
  if(COMBAT.log)COMBAT.log.push({bar,t:t0,layers:L});
}
// for tests: swap in an OfflineAudioContext to render the cue, and reach the cue's state
window.devMusicHook={swap(ctx,out){const prev=[AX,musicGain];AX=ctx;musicGain=out;return prev;},get combat(){return COMBAT;},get explore(){return EXPLORE;},set zone(v){_musicZone=v;},get zone(){return _musicZone;}};
function combatFill(until){const beat=60/COMBAT.theme.bpm;while(COMBAT.next<until){combatBar(COMBAT.next,COMBAT.bar);COMBAT.next+=4*beat;COMBAT.bar++;}}
function _musicCombat(){
  if(!AX)return;_exBus();
  let n=Math.floor(Math.random()*COMBAT_THEMES.length);if(n===COMBAT.lastTheme)n=(n+1)%COMBAT_THEMES.length;COMBAT.lastTheme=n;COMBAT.theme=COMBAT_THEMES[n];
  const bus=AX.createGain();bus.gain.value=1;bus.connect(musicGain);bus.connect(EXPLORE.verb);COMBAT.bus=bus;
  const now=AX.currentTime;COMBAT.bar=0;COMBAT.next=now+.08;
  // the opening hit: drum, timpani and a low horn on the tonic
  const root=NOTE_ROOT[COMBAT.theme.root]||60;_cbVoice('taiko',0,now+.02,1,.3);_cbVoice('timpani',root,now+.02,1,.24);_cbVoice('horn',root-12,now+.02,.5,.1);
  const step=()=>{if(COMBAT.bus!==bus)return;combatFill(AX.currentTime+.6);COMBAT.timer=setTimeout(step,150);};step();
}
function combatEnd(){const bus=COMBAT.bus;if(!bus||!AX)return;COMBAT.bus=null;if(COMBAT.timer){clearTimeout(COMBAT.timer);COMBAT.timer=null;}
  const t=Math.max(AX.currentTime,COMBAT.next-.02);const T=COMBAT.theme,root=NOTE_ROOT[T.root]||60;
  // the close: the tonic held under a last drum, then away
  _voiceOut=bus;try{VOICES.taiko(0,t,1,.24);VOICES.timpani(root,t,1,.2);VOICES.lowstrings(root-24,t,1.6,.1);[0,2,4].forEach(d=>VOICES.strings(degMidi(root,T.mode,1+d,0),t,1.6,.035));}finally{_voiceOut=null;}
  bus.gain.cancelScheduledValues(AX.currentTime);bus.gain.setValueAtTime(1,t+1.2);bus.gain.linearRampToValueAtTime(0,t+3.2);
  setTimeout(()=>{try{bus.disconnect();}catch(e){}},(t-AX.currentTime+3.5)*1000);}

// ── Village — warm, childlike, safe ────────────────────────────────────
function _musicVillage(){
  if(!AX)return;
  // Gentle recorder-like melody (sine with soft harmonics)
  const VILLAGE_NOTES=[523,587,659,698,784,698,659,587,523,494,523,0,659,784,880,784,659,0];
  let _vi=0;
  function schedVillage(){
    if(_musicZone!=='village')return;
    const now=AX.currentTime;
    const freq=VILLAGE_NOTES[_vi%VILLAGE_NOTES.length];_vi++;
    if(freq>0){
      const o=AX.createOscillator();o.type='sine';o.frequency.value=freq;
      const o2=AX.createOscillator();o2.type='sine';o2.frequency.value=freq*2;
      const g=AX.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.09,now+.04);
      g.gain.setValueAtTime(.09,now+.28);g.gain.linearRampToValueAtTime(0,now+.42);
      o.connect(g);o2.connect(g);g.connect(musicGain);
      o.start(now);o2.start(now);o.stop(now+.5);o2.stop(now+.5);
      _musicNodes.push(o,o2,g);
    }
    // Plucked string accompaniment on every 4th note
    if(_vi%4===0){
      const chord=[261,330,392];
      chord.forEach(cf=>{
        const co=AX.createOscillator();co.type='triangle';co.frequency.value=cf;
        const cg=AX.createGain();cg.gain.setValueAtTime(.04,now);cg.gain.exponentialRampToValueAtTime(0.001,now+.6);
        co.connect(cg);cg.connect(musicGain);co.start(now);co.stop(now+.7);
        _musicNodes.push(co,cg);
      });
    }
    _musicScheduler=setTimeout(schedVillage,380+(_vi%4===0?120:0));
  }
  schedVillage();
}

// ── Town — folky, strings, market-day feel ─────────────────────────────
function _musicTown(){
  if(!AX)return;
  // Fiddle-like melody — sawtooth with resonant filter for string feel
  const TOWN_NOTES=[293,329,370,440,493,440,370,329,293,247,293,0,
                    370,440,523,493,440,370,329,293,247,220,247,0];
  let _ti=0;
  // Walking bass line
  const bass=_mkDrone(98,.04);bass.filter.frequency.value=300;
  const bass2=_mkDrone(110,.03,5);bass2.filter.frequency.value=280;

  function schedTown(){
    if(_musicZone!=='town')return;
    const now=AX.currentTime;
    const freq=TOWN_NOTES[_ti%TOWN_NOTES.length];_ti++;
    if(freq>0){
      const o=AX.createOscillator();o.type='sawtooth';o.frequency.value=freq;
      const f=AX.createBiquadFilter();f.type='bandpass';f.frequency.value=freq*1.5;f.Q.value=8;
      const g=AX.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.06,now+.02);
      g.gain.setValueAtTime(.06,now+.18);g.gain.linearRampToValueAtTime(0,now+.28);
      o.connect(f);f.connect(g);g.connect(musicGain);o.start(now);o.stop(now+.32);
      _musicNodes.push(o,f,g);
    }
    // Bass walk every 2 notes
    if(_ti%2===0){
      const bf=TOWN_NOTES[(_ti+8)%TOWN_NOTES.length]||147;
      if(bf>0){
        const bo=AX.createOscillator();bo.type='triangle';bo.frequency.value=bf/2;
        const bg=AX.createGain();bg.gain.setValueAtTime(.05,now);bg.gain.exponentialRampToValueAtTime(0.001,now+.35);
        bo.connect(bg);bg.connect(musicGain);bo.start(now);bo.stop(now+.38);
        _musicNodes.push(bo,bg);
      }
    }
    _musicScheduler=setTimeout(schedTown,260+(_ti%6===0?180:0));
  }
  schedTown();
}

// ── City — grand, processional, impressive ─────────────────────────────
function _musicCity(){
  if(!AX)return;
  // Low brass drone — square waves filtered to brass warmth
  const b1=_mkDrone(87,.06);b1.osc.type='square';b1.filter.frequency.value=500;
  const b2=_mkDrone(110,.04,8);b2.osc.type='square';b2.filter.frequency.value=600;
  const b3=_mkDrone(130,.03,-5);b3.osc.type='square';b3.filter.frequency.value=550;
  // Slow string melody
  const CITY_NOTES=[261,293,329,261,293,349,329,293,261,220,246,261,0,0];
  let _cyi=0;
  function schedCity(){
    if(_musicZone!=='city')return;
    const now=AX.currentTime;
    const freq=CITY_NOTES[_cyi%CITY_NOTES.length];_cyi++;
    if(freq>0){
      const o=AX.createOscillator();o.type='sawtooth';o.frequency.value=freq;
      const f=AX.createBiquadFilter();f.type='bandpass';f.frequency.value=freq*2;f.Q.value=5;
      const g=AX.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.08,now+.08);
      g.gain.setValueAtTime(.08,now+.55);g.gain.linearRampToValueAtTime(0,now+.75);
      // Harmony a third above
      const o2=AX.createOscillator();o2.type='sawtooth';o2.frequency.value=freq*1.25;
      const g2=AX.createGain();g2.gain.setValueAtTime(0,now);g2.gain.linearRampToValueAtTime(.04,now+.08);
      g2.gain.setValueAtTime(.04,now+.55);g2.gain.linearRampToValueAtTime(0,now+.75);
      o.connect(f);f.connect(g);g.connect(musicGain);
      o2.connect(g2);g2.connect(musicGain);
      o.start(now);o2.start(now);o.stop(now+.8);o2.stop(now+.8);
      _musicNodes.push(o,o2,f,g,g2);
    }
    _musicScheduler=setTimeout(schedCity,700+(_cyi%4===0?400:0));
  }
  schedCity();
}

// ── Forest — playful, curious, flute-inspired ──────────────────────────
function _musicForest(){
  if(!AX)return;
  // Flute feel — sine with vibrato. Removed the "breathy noise layer" in v37 (it was a 2400Hz sawtooth
  // playing continuously, not actual noise — came through as a grating constant whine).

  const FOREST_NOTES=[523,587,659,784,880,784,659,587,659,523,587,659,523,0,
                      784,880,988,880,784,659,784,659,587,523,0];
  let _fi=0;
  function schedForest(){
    if(_musicZone!=='forest')return;
    const now=AX.currentTime;
    const freq=FOREST_NOTES[_fi%FOREST_NOTES.length];_fi++;
    if(freq>0){
      const o=AX.createOscillator();o.type='sine';o.frequency.value=freq;
      // Vibrato
      const vib=AX.createOscillator();vib.frequency.value=5.5;
      const vibG=AX.createGain();vibG.gain.value=freq*.012;
      vib.connect(vibG);vibG.connect(o.frequency);vib.start(now);vib.stop(now+.6);
      const g=AX.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.1,now+.03);
      g.gain.setValueAtTime(.1,now+.22);g.gain.linearRampToValueAtTime(0,now+.38);
      // Soft pizzicato harmony
      const ph=AX.createOscillator();ph.type='triangle';ph.frequency.value=freq*.5;
      const pg=AX.createGain();pg.gain.setValueAtTime(.03,now);pg.gain.exponentialRampToValueAtTime(0.001,now+.5);
      o.connect(g);g.connect(musicGain);
      ph.connect(pg);pg.connect(musicGain);
      o.start(now);ph.start(now);o.stop(now+.45);ph.stop(now+.55);
      _musicNodes.push(o,vib,vibG,g,ph,pg);
    }
    _musicScheduler=setTimeout(schedForest,280+Math.random()*200+(_fi%5===0?300:0));
  }
  schedForest();

  // Harp accompaniment — slow I-vi-IV-V progression (C - Am - F - G), one chord every ~3s.
  // Each chord arpeggiates 3 notes 40ms apart with a triangle wave + quick attack + 1.8s exp decay for a plucked-string feel.
  // Gain ~0.045 so chords sit behind the flute melody without competing.
  const HARP_CHORDS=[
    [261.63,329.63,392.00], // C major (C4-E4-G4)
    [220.00,261.63,329.63], // A minor (A3-C4-E4)
    [174.61,220.00,261.63], // F major (F3-A3-C4)
    [196.00,246.94,293.66], // G major (G3-B3-D4)
  ];
  let _ci=0;
  function schedHarp(){
    if(_musicZone!=='forest')return;
    const now=AX.currentTime;
    const chord=HARP_CHORDS[_ci%HARP_CHORDS.length];_ci++;
    chord.forEach((freq,ni)=>{
      const noteT=now+ni*0.04;
      const o=AX.createOscillator();o.type='triangle';o.frequency.value=freq;
      const g=AX.createGain();
      g.gain.setValueAtTime(0,noteT);
      g.gain.linearRampToValueAtTime(.045,noteT+.01);
      g.gain.exponentialRampToValueAtTime(0.001,noteT+1.8);
      o.connect(g);g.connect(musicGain);
      o.start(noteT);o.stop(noteT+2.0);
      _musicNodes.push(o,g);
    });
    _musicScheduler2=setTimeout(schedHarp,3000);
  }
  schedHarp();
}

// ── Road — traveling, optimistic, walking pace ─────────────────────────
function _musicRoad(){
  if(!AX)return;
  const ROAD_NOTES=[392,440,494,392,440,523,494,440,392,349,392,440,392,0,
                    494,523,587,523,494,440,494,392,0];
  let _ri=0;
  // Soft lute-like pluck feel — triangle with quick decay
  function schedRoad(){
    if(_musicZone!=='road')return;
    const now=AX.currentTime;
    const freq=ROAD_NOTES[_ri%ROAD_NOTES.length];_ri++;
    if(freq>0){
      const o=AX.createOscillator();o.type='triangle';o.frequency.value=freq;
      const g=AX.createGain();g.gain.setValueAtTime(.1,now);g.gain.exponentialRampToValueAtTime(0.001,now+.55);
      o.connect(g);g.connect(musicGain);o.start(now);o.stop(now+.6);
      // Gentle bass on strong beats
      if(_ri%3===0){
        const bo=AX.createOscillator();bo.type='triangle';bo.frequency.value=freq/2;
        const bg=AX.createGain();bg.gain.setValueAtTime(.06,now);bg.gain.exponentialRampToValueAtTime(0.001,now+.4);
        bo.connect(bg);bg.connect(musicGain);bo.start(now);bo.stop(now+.45);
        _musicNodes.push(bo,bg);
      }
      _musicNodes.push(o,g);
    }
    _musicScheduler=setTimeout(schedRoad,320+(_ri%4===0?220:0));
  }
  schedRoad();
}

// ── Mountain — sparse, cold, exposed ──────────────────────────────────
function _musicMountain(){
  if(!AX)return;
  // Long held tones, sparse
  const drone=_mkDrone(82,.03);drone.filter.frequency.value=200;
  const MOUN_NOTES=[196,220,246,196,0,0,220,0,0,196,174,196,0,0,0];
  let _mi=0;
  function schedMountain(){
    if(_musicZone!=='mountain')return;
    const now=AX.currentTime;
    const freq=MOUN_NOTES[_mi%MOUN_NOTES.length];_mi++;
    if(freq>0){
      const o=AX.createOscillator();o.type='sine';o.frequency.value=freq;
      const g=AX.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.07,now+.4);
      g.gain.setValueAtTime(.07,now+1.4);g.gain.linearRampToValueAtTime(0,now+2.2);
      o.connect(g);g.connect(musicGain);o.start(now);o.stop(now+2.5);
      _musicNodes.push(o,g);
    }
    _musicScheduler=setTimeout(schedMountain,1800+Math.random()*2400);
  }
  schedMountain();
}

// ── Coast — open, drones, wave-roll texture ─────────────────────────
// v61e3: regional identity — coastal arc (West Track, Coastal Road South).
// Modeled on _musicWastes for sparseness but tuned warm rather than wrong.
// Three drones at 130/195/260 Hz form a peaceful chord (rough major-third
// stack); slow LFO on the bottom drone's filter is tide-like (~5s period);
// sparse low-passed noise gusts every 4-8s read as wave-roll. No melody —
// the silence is the point. Salthaven and Carraig Mór keep village music;
// the *roads* between them sound seaward. Player hears the coast on the
// approach and arrives at a place with people in it.
function _musicCoast(){
  if(!AX)return;
  const d1=_mkDrone(130,.045);d1.filter.frequency.value=320;
  const d2=_mkDrone(195,.025,7);d2.filter.frequency.value=380; // slight detune for warmth
  const d3=_mkDrone(260,.018,-5);d3.filter.frequency.value=420;
  // Tide-like slow LFO on the bottom drone's filter cutoff
  const lfo=AX.createOscillator();lfo.frequency.value=0.20; // ~5s period
  const lfoG=AX.createGain();lfoG.gain.value=180;
  lfo.connect(lfoG);lfoG.connect(d1.filter.frequency);lfo.start();
  _musicNodes.push(lfo,lfoG);
  // Wave-roll noise gust — sparse, low-passed, ~3.5s envelope
  function schedCoast(){
    if(_musicZone!=='coast')return;
    const now=AX.currentTime;
    const dur=2.5+Math.random()*1.5;
    const buf=AX.createBuffer(1,Math.ceil(AX.sampleRate*dur),AX.sampleRate);
    const d=buf.getChannelData(0);
    // Triangular envelope — quiet, soft attack, longer tail
    for(let i=0;i<d.length;i++){
      const t=i/d.length;
      const env=t<.3?(t/.3):Math.pow(1-(t-.3)/.7,2);
      d[i]=(Math.random()*2-1)*env;
    }
    const src=AX.createBufferSource();src.buffer=buf;
    const f=AX.createBiquadFilter();f.type='lowpass';f.frequency.value=280;
    const g=AX.createGain();g.gain.value=.10;
    src.connect(f);f.connect(g);g.connect(musicGain);src.start(now);
    _musicNodes.push(src,f,g);
    _musicScheduler=setTimeout(schedCoast,4000+Math.random()*4000);
  }
  schedCoast();
}

// ── Wastes — minimal, drone, wrongness ────────────────────────────────
function _musicWastes(){
  if(!AX)return;
  // Low dissonant drones
  const d1=_mkDrone(55,.05);d1.filter.frequency.value=120;
  const d2=_mkDrone(58,.03,20);d2.filter.frequency.value=140; // slightly off-tune
  const d3=_mkDrone(82,.02,-30);d3.filter.frequency.value=100;
  // Slow LFO
  const lfo=AX.createOscillator();lfo.frequency.value=0.05;
  const lfoG=AX.createGain();lfoG.gain.value=400;
  lfo.connect(lfoG);lfoG.connect(d1.filter.frequency);lfo.start();
  _musicNodes.push(lfo,lfoG);
  // Sparse percussive hits
  function schedWastes(){
    if(_musicZone!=='wastes')return;
    const now=AX.currentTime;
    const buf=AX.createBuffer(1,Math.ceil(AX.sampleRate*.3),AX.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
    const src=AX.createBufferSource();src.buffer=buf;
    const f=AX.createBiquadFilter();f.type='lowpass';f.frequency.value=150;
    const g=AX.createGain();g.gain.value=.14;
    src.connect(f);f.connect(g);g.connect(musicGain);src.start(now);
    _musicNodes.push(src,f,g);
    _musicScheduler=setTimeout(schedWastes,3000+Math.random()*6000);
  }
  schedWastes();
}

// ── Shop interior — light, playful, inviting ───────────────────────────
function _musicShop(){
  if(!AX)return;
  // Lute/harp feel — triangle plucks in major key, bright and quick
  const SHOP_NOTES=[523,659,784,659,523,440,523,659,784,880,784,659,
                    698,784,880,784,698,587,659,784,659,523,587,523,0];
  let _si=0;
  function schedShop(){
    if(_musicZone!=='shop')return;
    const now=AX.currentTime;
    const freq=SHOP_NOTES[_si%SHOP_NOTES.length];_si++;
    if(freq>0){
      // Main pluck
      const o=AX.createOscillator();o.type='triangle';o.frequency.value=freq;
      const g=AX.createGain();g.gain.setValueAtTime(.08,now);g.gain.exponentialRampToValueAtTime(0.001,now+.5);
      // Bright harmonic shimmer
      const o2=AX.createOscillator();o2.type='sine';o2.frequency.value=freq*2;
      const g2=AX.createGain();g2.gain.setValueAtTime(.025,now);g2.gain.exponentialRampToValueAtTime(0.001,now+.3);
      o.connect(g);g.connect(musicGain);o2.connect(g2);g2.connect(musicGain);
      o.start(now);o2.start(now);o.stop(now+.55);o2.stop(now+.35);
      _musicNodes.push(o,o2,g,g2);
    }
    // Gentle chord strum every 8 notes
    if(_si%8===0){
      [523,659,784].forEach((cf,i)=>{
        const co=AX.createOscillator();co.type='triangle';co.frequency.value=cf;
        const cg=AX.createGain();cg.gain.setValueAtTime(.025,now+i*.03);cg.gain.exponentialRampToValueAtTime(0.001,now+.9);
        co.connect(cg);cg.connect(musicGain);co.start(now+i*.03);co.stop(now+1.0);
        _musicNodes.push(co,cg);
      });
    }
    _musicScheduler=setTimeout(schedShop,240+Math.random()*120+(_si%8===0?280:0));
  }
  schedShop();
}

// ── Church — reverent, organ-like ─────────────────────────────────────
function _musicChurch(){
  if(!AX)return;
  // Organ approximation — sine + harmonics (2nd + 3rd) with slow attack
  function _mkOrganTone(freq,gain){
    const o1=AX.createOscillator();o1.type='sine';o1.frequency.value=freq;
    const o2=AX.createOscillator();o2.type='sine';o2.frequency.value=freq*2;
    const o3=AX.createOscillator();o3.type='sine';o3.frequency.value=freq*3;
    const g=AX.createGain();g.gain.setValueAtTime(0,AX.currentTime);g.gain.linearRampToValueAtTime(gain,AX.currentTime+1.2);
    const g2=AX.createGain();g2.gain.value=gain*.4;
    const g3=AX.createGain();g3.gain.value=gain*.2;
    o1.connect(g);o2.connect(g2);o3.connect(g3);g.connect(musicGain);g2.connect(musicGain);g3.connect(musicGain);
    o1.start();o2.start();o3.start();
    _musicNodes.push(o1,o2,o3,g,g2,g3);
    return g;
  }
  _mkOrganTone(130,.04);_mkOrganTone(174,.03);_mkOrganTone(196,.025);
  // Slow chord progression
  const CHURCH_CHORDS=[[261,329,392],[246,311,369],[220,277,329],[261,329,392],[293,370,440],[261,329,392]];
  let _chi=0;
  function schedChurch(){
    if(_musicZone!=='church')return;
    const now=AX.currentTime;
    const chord=CHURCH_CHORDS[_chi%CHURCH_CHORDS.length];_chi++;
    chord.forEach((cf,i)=>{
      const o=AX.createOscillator();o.type='sine';o.frequency.value=cf;
      const o2=AX.createOscillator();o2.type='sine';o2.frequency.value=cf*2;
      const g=AX.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.028-i*.006,now+.5);
      g.gain.setValueAtTime(.028-i*.006,now+2.5);g.gain.linearRampToValueAtTime(0,now+3.5);
      const g2=AX.createGain();g2.gain.setValueAtTime(0,now);g2.gain.linearRampToValueAtTime(.01,now+.5);g2.gain.linearRampToValueAtTime(0,now+3.5);
      o.connect(g);g.connect(musicGain);o2.connect(g2);g2.connect(musicGain);
      o.start(now);o2.start(now);o.stop(now+4);o2.stop(now+4);
      _musicNodes.push(o,o2,g,g2);
    });
    _musicScheduler=setTimeout(schedChurch,3200+Math.random()*800);
  }
  schedChurch();
}

// ── Castle interior — regal, proud ────────────────────────────────────
function _musicCastle(){
  if(!AX)return;
  // Brass-like low tones — square waves with warm filter
  const b1=_mkDrone(130,.05);b1.osc.type='square';b1.filter.frequency.value=700;
  const b2=_mkDrone(164,.04,6);b2.osc.type='square';b2.filter.frequency.value=600;
  // Slow LFO for dignity
  const lfo=AX.createOscillator();lfo.frequency.value=0.12;
  const lfoG=AX.createGain();lfoG.gain.value=60;
  lfo.connect(lfoG);lfoG.connect(b1.filter.frequency);lfo.start();
  _musicNodes.push(lfo,lfoG);
  // Stately string melody — slow, deliberate
  const CASTLE_NOTES=[261,293,329,293,261,246,261,0,293,329,349,329,293,261,246,261,0,0];
  let _cai=0;
  function schedCastle(){
    if(_musicZone!=='castle')return;
    const now=AX.currentTime;
    const freq=CASTLE_NOTES[_cai%CASTLE_NOTES.length];_cai++;
    if(freq>0){
      const o=AX.createOscillator();o.type='sawtooth';o.frequency.value=freq;
      const f=AX.createBiquadFilter();f.type='bandpass';f.frequency.value=freq*1.8;f.Q.value=6;
      const g=AX.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.07,now+.1);
      g.gain.setValueAtTime(.07,now+.7);g.gain.linearRampToValueAtTime(0,now+.95);
      // Harmony below
      const o2=AX.createOscillator();o2.type='sawtooth';o2.frequency.value=freq*.75;
      const g2=AX.createGain();g2.gain.setValueAtTime(0,now);g2.gain.linearRampToValueAtTime(.035,now+.12);
      g2.gain.setValueAtTime(.035,now+.7);g2.gain.linearRampToValueAtTime(0,now+.95);
      o.connect(f);f.connect(g);g.connect(musicGain);o2.connect(g2);g2.connect(musicGain);
      o.start(now);o2.start(now);o.stop(now+1.1);o2.stop(now+1.1);
      _musicNodes.push(o,f,g,o2,g2);
    }
    _musicScheduler=setTimeout(schedCastle,850+(_cai%4===0?500:0));
  }
  schedCastle();
}

// Music zone manager — called each frame
let _lastMusicZone='';
function tickMusic(dt){
  if(!AX)return;
  const anyDungeonAlert=ENEMIES.some(e=>!e.dead&&e.alert);
  const anyZoneAlert=ZE.some(e=>!e.dead&&e.alert);
  {let h=0;for(const e of (isInterior()?[]:lid==='overworld'?ZE:ENEMIES)){if(!e||e.dead||!e.alert)continue;if(Math.hypot(px-e.x,pz-e.z)<30)h+=(e.boss||e.isBoss)?3:1;}COMBAT.heat=Math.max(1,h);} // S231

  if(isInterior()){
    // Interior music based on shop type
    _combatActive=false;_combatFadeTimer=0;
    const itype=currentHouse?currentHouse.type:'misc';
    const itrack=itype==='church'?'church':itype==='castle'?'castle':'shop';
    if(_lastMusicZone!==itrack){startMusic(itrack);_lastMusicZone=itrack;}

  } else if(lid==='overworld'){
    // Zone-specific overworld music
    // v61f: Read from ZONE_BUILDERS (the single source of truth) instead of
    // a hardcoded 3-zone table. Prior code caused every non-{overworld,forest,
    // ironhaven} zone to revert to 'village' after combat music faded —
    // Bealach-South, Hearthwick, and all Act I/II placeholders were affected.
    const zoneTrack=(ZONE_BUILDERS[activeZoneId]&&ZONE_BUILDERS[activeZoneId].musicTrack)||'village';

    if(anyZoneAlert){
      _combatActive=true;_combatFadeTimer=5;
    } else if(_combatActive){
      _combatFadeTimer-=dt;
      if(_combatFadeTimer<=0)_combatActive=false;
    }
    const want=_combatActive?'combat':zoneTrack;
    if(_lastMusicZone!==want){startMusic(want);_lastMusicZone=want;}

  } else {
    // Dungeon
    if(anyDungeonAlert){_combatActive=true;_combatFadeTimer=5;}
    else if(_combatActive){_combatFadeTimer-=dt;if(_combatFadeTimer<=0)_combatActive=false;}
    const want=_combatActive?'combat':'dungeon';
    if(_lastMusicZone!==want){startMusic(want,_currentDungeonTheme);_lastMusicZone=want;}
  }
}
