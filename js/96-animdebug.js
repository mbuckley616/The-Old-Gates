
// v61ec: WM_SVG_MARKUP retired — the world map is now RENDERED at
// init time from MAP_LAYOUT + the gate graph. See renderWorldMapSVG().
// This eliminates the previous problem where the static SVG markup
// could drift out of sync with code gate definitions. The map is
// now a pure function of the data; drift is structurally impossible.

// ══════════════════════════════════════════════════════════════════════
// END WORLD MAP SYSTEM
// ══════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════
// ANIMATION DEBUG PANEL (v65.7) — toggled with backtick (`)
// ══════════════════════════════════════════════════════════════════════
//
// Live-tune swing and block animation parameters. Reads/writes ANIM_PARAMS;
// the render loop already reads from there each frame, so slider changes are
// reflected in the very next swing or block tween without any reload.
//
// Hotkey: backtick (`) toggles visibility. The panel is overlay HTML — does
// NOT pause the game (so you can swing while sliders are visible).
//
// "Copy values" button serializes the current ANIM_PARAMS object to clipboard
// as a JSON object. Paste back to claude/devlog to bake in as new defaults.
//
// Structure: two tabs (Swing / Block), each with grouped sliders. Each slider
// shows label, current value, and a min/max range. Range is chosen per-param
// to be wide enough for big tweaks but not so wide that fine adjustment is
// hard — typical position params [-2.0, 2.0], typical rotation params [-PI, PI],
// timing params [0, 1] for phase boundaries and [0.1, 2.0] for durations.
//
// To disable in production: comment out the IIFE call at the bottom, or strip
// the whole block. The game runs identically without it; ANIM_PARAMS just
// retains its baked-in defaults.
(function buildAnimDebugPanel(){
  // ── SLIDER DEFINITIONS ─────────────────────────────────────────
  // Each entry: { key, label, min, max, step }
  // key dotted into ANIM_PARAMS (e.g. "swing.v0_tgtX")
  const SLIDER_GROUPS = [
    {
      tab: 'swing',
      title: 'Timing & Depth',
      sliders: [
        {key:'swing.antEnd',     label:'Anticipation end',  min:0,    max:0.95, step:0.01},
        {key:'swing.sweepEnd',   label:'Sweep end',         min:0.2,  max:0.95, step:0.01},
        {key:'swing.holdEnd',    label:'Hold end',          min:0.4,  max:0.99, step:0.01},
        {key:'swing.normalDur',  label:'Normal swing dur',  min:0.15, max:1.2,  step:0.02},
        {key:'swing.powerDur',   label:'Power swing dur',   min:0.2,  max:1.5,  step:0.02},
        // v66.1 — Impact sync + weight scaling.
        {key:'swing.impactPoint',label:'Impact point (p)',  min:0.1,  max:0.95, step:0.01},
        {key:'swing.weightA',    label:'Weight base (A)',   min:0.3,  max:1.0,  step:0.01},
        {key:'swing.weightB',    label:'Weight slope (B)',  min:0,    max:0.25, step:0.005},
        {key:'swing.weightMin',  label:'Weight clamp min',  min:0.4,  max:1.0,  step:0.01},
        {key:'swing.weightMax',  label:'Weight clamp max',  min:1.0,  max:2.0,  step:0.01},
        // v65.8 — Push weapon away from camera during swing (negative = deeper)
        // v65.9: range widened to allow deeper push if needed
        {key:'swing.swingPushZ', label:'Depth push (away)', min:-2.0, max:0.5,  step:0.02},
      ],
    },
    {
      tab: 'swing',
      title: 'Variant 0 — UR→LL slash',
      sliders: [
        {key:'swing.v0_antX',     label:'Anticip X',  min:-1.5, max:1.5, step:0.02},
        {key:'swing.v0_antY',     label:'Anticip Y',  min:-1.5, max:1.5, step:0.02},
        {key:'swing.v0_tgtX',     label:'Target X',   min:-3.0, max:3.0, step:0.02},
        {key:'swing.v0_tgtY',     label:'Target Y',   min:-3.0, max:3.0, step:0.02},
        {key:'swing.v0_tgtZ',     label:'Target Z-rot', min:-3.2, max:3.2, step:0.05},
        {key:'swing.v0_tgtPitch', label:'Target pitch', min:-3.2, max:3.2, step:0.05},
      ],
    },
    {
      tab: 'swing',
      title: 'Variant 1 — UL→LR slash',
      sliders: [
        {key:'swing.v1_antX',     label:'Anticip X',  min:-1.5, max:1.5, step:0.02},
        {key:'swing.v1_antY',     label:'Anticip Y',  min:-1.5, max:1.5, step:0.02},
        {key:'swing.v1_tgtX',     label:'Target X',   min:-3.0, max:3.0, step:0.02},
        {key:'swing.v1_tgtY',     label:'Target Y',   min:-3.0, max:3.0, step:0.02},
        {key:'swing.v1_tgtZ',     label:'Target Z-rot', min:-3.2, max:3.2, step:0.05},
        {key:'swing.v1_tgtPitch', label:'Target pitch', min:-3.2, max:3.2, step:0.05},
      ],
    },
    {
      tab: 'swing',
      title: 'Variant 2 — overhead chop',
      sliders: [
        {key:'swing.v2_antX',     label:'Anticip X',  min:-1.5, max:1.5, step:0.02},
        {key:'swing.v2_antY',     label:'Anticip Y',  min:-1.5, max:1.5, step:0.02},
        {key:'swing.v2_tgtX',     label:'Target X',   min:-3.0, max:3.0, step:0.02},
        {key:'swing.v2_tgtY',     label:'Target Y',   min:-3.0, max:3.0, step:0.02},
        {key:'swing.v2_tgtZ',     label:'Target Z-rot', min:-3.2, max:3.2, step:0.05},
        {key:'swing.v2_tgtPitch', label:'Target pitch', min:-3.2, max:3.2, step:0.05},
      ],
    },
    {
      tab: 'swing',
      title: 'Variant chances (weights, normalized)',
      sliders: [
        {key:'swing.v0_chance', label:'V0 (UR→LL) weight', min:0, max:3, step:0.05},
        {key:'swing.v1_chance', label:'V1 (UL→LR) weight', min:0, max:3, step:0.05},
        {key:'swing.v2_chance', label:'V2 (overhead) weight', min:0, max:3, step:0.05},
      ],
    },
    {
      tab: 'block',
      title: 'Position targets — 1H',
      sliders: [
        {key:'block.posX_1h', label:'PosX 1H', min:-1, max:1, step:0.01},
        {key:'block.posY_1h', label:'PosY 1H', min:-1, max:1, step:0.01},
        {key:'block.posZ_1h', label:'PosZ 1H', min:-1, max:0, step:0.01},
      ],
    },
    {
      tab: 'block',
      title: 'Rotation targets — 1H',
      sliders: [
        {key:'block.rotX_1h', label:'RotX 1H', min:-3.2, max:3.2, step:0.05},
        {key:'block.rotY_1h', label:'RotY 1H', min:-3.2, max:3.2, step:0.05},
        {key:'block.rotZ_1h', label:'RotZ 1H', min:-3.2, max:3.2, step:0.05},
      ],
    },
    {
      tab: 'block',
      title: 'Position targets — 2H',
      sliders: [
        {key:'block.posX_2h', label:'PosX 2H', min:-1, max:1, step:0.01},
        {key:'block.posY_2h', label:'PosY 2H', min:-1, max:1, step:0.01},
        {key:'block.posZ_2h', label:'PosZ 2H', min:-1, max:0, step:0.01},
      ],
    },
    {
      tab: 'block',
      title: 'Rotation targets — 2H',
      sliders: [
        {key:'block.rotX_2h', label:'RotX 2H', min:-3.2, max:3.2, step:0.05},
        {key:'block.rotY_2h', label:'RotY 2H', min:-3.2, max:3.2, step:0.05},
        {key:'block.rotZ_2h', label:'RotZ 2H', min:-3.2, max:3.2, step:0.05},
      ],
    },
    {
      tab: 'block',
      title: 'Position + Rotation — Bow',
      sliders: [
        {key:'block.posX_bow', label:'PosX Bow', min:-1, max:1, step:0.01},
        {key:'block.posY_bow', label:'PosY Bow', min:-1, max:1, step:0.01},
        {key:'block.posZ_bow', label:'PosZ Bow', min:-1, max:0, step:0.01},
        {key:'block.rotX_bow', label:'RotX Bow', min:-3.2, max:3.2, step:0.05},
        {key:'block.rotY_bow', label:'RotY Bow', min:-3.2, max:3.2, step:0.05},
        {key:'block.rotZ_bow', label:'RotZ Bow', min:-3.2, max:3.2, step:0.05},
      ],
    },
  ];

  // ── HELPER: get/set nested ANIM_PARAMS via dotted key ──
  function getParam(k){
    const parts = k.split('.');
    let o = ANIM_PARAMS;
    for(const p of parts){ o = o[p]; if(o===undefined) return undefined; }
    return o;
  }
  function setParam(k, v){
    const parts = k.split('.');
    let o = ANIM_PARAMS;
    for(let i=0; i<parts.length-1; i++){ o = o[parts[i]]; }
    o[parts[parts.length-1]] = v;
  }

  // ── BUILD PANEL DOM ──
  const panel = document.createElement('div');
  panel.id = 'anim-debug-panel';
  panel.style.cssText = `
    position:fixed; top:60px; right:20px; width:380px; max-height:80vh;
    background:rgba(20,22,28,0.94); color:#e8e8e8; font-family:monospace;
    font-size:11px; padding:10px; border:1px solid #444; border-radius:6px;
    z-index:9999; display:none; overflow-y:auto;
    box-shadow:0 4px 20px rgba(0,0,0,0.6);
  `;
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid #444;padding-bottom:6px;">
      <strong style="color:#c8a84a;">ANIM DEBUG</strong>
      <div>
        <button id="anim-tab-swing" style="background:#553;border:none;color:#fff;padding:3px 8px;margin-right:2px;cursor:pointer;border-radius:3px;">Swing</button>
        <button id="anim-tab-block" style="background:#333;border:none;color:#fff;padding:3px 8px;margin-right:8px;cursor:pointer;border-radius:3px;">Block</button>
        <button id="anim-copy" style="background:#264;border:none;color:#fff;padding:3px 8px;cursor:pointer;border-radius:3px;">Copy</button>
      </div>
    </div>
    <div style="margin-bottom:6px;padding:4px;background:#1a1c22;border-radius:3px;">
      <label style="display:flex;align-items:center;gap:4px;">
        <span style="color:#aaa;">Variant lock:</span>
        <select id="anim-variant-lock" style="background:#222;color:#fff;border:1px solid #444;padding:1px 4px;font-family:monospace;font-size:11px;">
          <option value="-1">Random</option>
          <option value="0">V0 — UR→LL</option>
          <option value="1">V1 — UL→LR</option>
          <option value="2">V2 — overhead</option>
        </select>
      </label>
      <label style="display:flex;align-items:center;gap:4px;margin-top:4px;">
        <span style="color:#aaa;">Power 1H bind:</span>
        <select id="anim-power-1h" style="background:#222;color:#fff;border:1px solid #444;padding:1px 4px;font-family:monospace;font-size:11px;">
          <option value="-1">Random (no bind)</option>
          <option value="0">V0 — UR→LL</option>
          <option value="1">V1 — UL→LR</option>
          <option value="2">V2 — overhead</option>
        </select>
      </label>
      <label style="display:flex;align-items:center;gap:4px;margin-top:4px;">
        <span style="color:#aaa;">Power 2H bind:</span>
        <select id="anim-power-2h" style="background:#222;color:#fff;border:1px solid #444;padding:1px 4px;font-family:monospace;font-size:11px;">
          <option value="-1">Random (no bind)</option>
          <option value="0">V0 — UR→LL</option>
          <option value="1">V1 — UL→LR</option>
          <option value="2">V2 — overhead</option>
        </select>
      </label>
    </div>
    <div id="anim-slider-container"></div>
    <div id="anim-copy-feedback" style="color:#7c7;font-size:10px;margin-top:6px;display:none;">Copied to clipboard!</div>
  `;
  document.body.appendChild(panel);

  // ── BUILD SLIDER ROWS ──
  const sliderContainer = panel.querySelector('#anim-slider-container');
  const sliderRows = []; // keep refs for tab filter + value redraw

  for(const group of SLIDER_GROUPS){
    const groupDiv = document.createElement('div');
    groupDiv.dataset.tab = group.tab;
    groupDiv.style.cssText = 'margin-bottom:10px;padding:6px;background:#1a1c22;border-radius:3px;';
    const title = document.createElement('div');
    title.style.cssText = 'color:#c8a84a;font-weight:bold;margin-bottom:4px;font-size:10px;';
    title.textContent = group.title;
    groupDiv.appendChild(title);
    for(const s of group.sliders){
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:4px;margin-bottom:2px;';
      const lbl = document.createElement('span');
      lbl.style.cssText = 'flex:0 0 110px;font-size:10px;color:#bbb;';
      lbl.textContent = s.label;
      const inp = document.createElement('input');
      inp.type = 'range';
      inp.min = s.min;
      inp.max = s.max;
      inp.step = s.step;
      inp.value = getParam(s.key);
      inp.style.cssText = 'flex:1;cursor:pointer;';
      const val = document.createElement('span');
      val.style.cssText = 'flex:0 0 48px;text-align:right;font-size:10px;color:#7cf;';
      val.textContent = Number(inp.value).toFixed(2);
      inp.addEventListener('input', () => {
        const v = parseFloat(inp.value);
        setParam(s.key, v);
        val.textContent = v.toFixed(2);
      });
      row.appendChild(lbl);
      row.appendChild(inp);
      row.appendChild(val);
      groupDiv.appendChild(row);
      sliderRows.push({key:s.key, input:inp, valueEl:val});
    }
    sliderContainer.appendChild(groupDiv);
  }

  // ── TAB SWITCHER ──
  let currentTab = 'swing';
  function showTab(t){
    currentTab = t;
    Array.from(sliderContainer.children).forEach(c => {
      c.style.display = (c.dataset.tab === t) ? '' : 'none';
    });
    document.getElementById('anim-tab-swing').style.background = (t==='swing') ? '#553' : '#333';
    document.getElementById('anim-tab-block').style.background = (t==='block') ? '#553' : '#333';
  }
  document.getElementById('anim-tab-swing').addEventListener('click', () => showTab('swing'));
  document.getElementById('anim-tab-block').addEventListener('click', () => showTab('block'));
  showTab('swing');

  // ── VARIANT LOCK ──
  const variantLockSelect = document.getElementById('anim-variant-lock');
  variantLockSelect.value = String(ANIM_PARAMS.swing.variantLock);
  variantLockSelect.addEventListener('change', () => {
    ANIM_PARAMS.swing.variantLock = parseInt(variantLockSelect.value, 10);
  });

  // ── POWER-ATTACK VARIANT BIND ── (v65.9)
  const power1HSelect = document.getElementById('anim-power-1h');
  power1HSelect.value = String(ANIM_PARAMS.swing.powerVariant1H);
  power1HSelect.addEventListener('change', () => {
    ANIM_PARAMS.swing.powerVariant1H = parseInt(power1HSelect.value, 10);
  });
  const power2HSelect = document.getElementById('anim-power-2h');
  power2HSelect.value = String(ANIM_PARAMS.swing.powerVariant2H);
  power2HSelect.addEventListener('change', () => {
    ANIM_PARAMS.swing.powerVariant2H = parseInt(power2HSelect.value, 10);
  });

  // ── COPY VALUES ──
  document.getElementById('anim-copy').addEventListener('click', () => {
    const json = JSON.stringify(ANIM_PARAMS, null, 2);
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(json).then(() => {
        const fb = document.getElementById('anim-copy-feedback');
        fb.style.display = 'block';
        setTimeout(() => { fb.style.display = 'none'; }, 1500);
      });
    } else {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = json;
      document.body.appendChild(ta);
      ta.select();
      try{ document.execCommand('copy'); }catch(_){}
      ta.remove();
      const fb = document.getElementById('anim-copy-feedback');
      fb.style.display = 'block';
      setTimeout(() => { fb.style.display = 'none'; }, 1500);
    }
  });

  // ── HOTKEY: BACKTICK TOGGLES PANEL ──
  // Listen at the window level so it works even when pointer is locked.
  // Skip if any text input is focused (defensive — we don't have any text
  // inputs in the game, but defense doesn't hurt).
  window.addEventListener('keydown', (e) => {
    if(e.code === 'Backquote' && !e.repeat){
      const active = document.activeElement;
      if(active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')){
        // ignore — user is typing somewhere
        if(active.id !== 'anim-variant-lock') return;
      }
      e.preventDefault();
      panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
    }
  }, true);

  console.log('[anim-debug] Panel ready. Press ` (backtick) to toggle.');
})();
