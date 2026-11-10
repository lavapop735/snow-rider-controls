(function () {
  'use strict';
  window.__srCreatePanel = function (options) {
    const m = options.movement;
    const host = document.createElement('div');
    host.id = 'sr-controls';
    host.style.cssText = 'position:fixed;left:12px;top:12px;z-index:2147483647;width:min(300px,calc(100vw - 24px))';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
      :host{all:initial;color-scheme:dark}
      *{box-sizing:border-box}button,input,select{font:inherit}
      .panel{font:13px/1.45 "Trebuchet MS",Arial,sans-serif;color:#eff8ff;background:#132b42;border:1px solid #45677f;border-radius:14px;overflow:hidden;box-shadow:0 12px 32px #081c3640}
      .top{display:flex;align-items:center;gap:10px;padding:12px;cursor:grab;touch-action:none;background:#1b3750;user-select:none}
      .mark{width:28px;height:28px;flex:none;color:#a7d9f0}
      .brand{flex:1;min-width:0}.brand strong{font-size:16px;display:block}.status{color:#b7d2e4;font-size:11px;display:flex;align-items:center;gap:5px}
      .dot{width:6px;height:6px;border-radius:50%;background:#ffb36b}.dot.ready{background:#64cfca}
      button{border:1px solid #56738a;border-radius:8px;background:#24445f;color:#eff8ff;cursor:pointer;min-height:32px;padding:6px 10px;transition:background .12s,border-color .12s}
      button:hover{background:#345976}button:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid #ffb36b;outline-offset:2px}
      button:disabled{opacity:.5;cursor:default}.fold{width:32px;padding:4px;font-size:18px}
      .body{max-height:calc(100vh - 90px);overflow-y:auto;overscroll-behavior:contain;padding:0 14px 12px;scrollbar-width:thin;scrollbar-color:#56738a #132b42}
      [hidden]{display:none!important}.section{padding:12px 0;border-top:1px solid #345269}.section:first-child{border:0}
      .ability{display:flex;align-items:center;gap:8px;padding:5px 0}.ability>div{flex:1}.ability strong{font-size:13px}.hint{font-size:11px;color:#b7d2e4;margin-top:1px}
      .toggle{min-width:46px;font-size:11px;font-weight:bold}.toggle[aria-pressed=true]{background:#64cfca;color:#0b2a3c;border-color:#64cfca}
      .field{margin:10px 0 4px}.field:first-child{margin-top:0}.label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:3px;font-weight:bold}
      .number{display:flex;align-items:center;gap:4px;color:#b7d2e4;font-weight:normal}.number input{width:58px;padding:3px 5px;border:1px solid #56738a;border-radius:6px;background:#0e2337;color:#eff8ff;text-align:right;min-height:27px}
      #srforwardnumber,#srboostnumber{width:76px}
      input[type=range]{width:100%;height:22px;accent-color:#64cfca;cursor:pointer;margin:0;touch-action:pan-y}
      .presets{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:3px}.presets button{padding:4px;min-height:28px;font-size:11px}.presets .selected{border-color:#64cfca;background:#2f6171}.presets .max{color:#ffbd83}
      .flight-buttons{display:flex;gap:7px;margin-top:10px}.flight-buttons button{flex:1;touch-action:none;user-select:none;background:#294e66}.flight-buttons button.held{background:#64cfca;color:#0b2a3c}
      .keys{font-size:11px;color:#b7d2e4;margin-top:7px}kbd{font:inherit;border:1px solid #56738a;border-radius:4px;padding:0 4px;color:#eff8ff}
      details{border-top:1px solid #345269;padding-top:10px}summary{cursor:pointer;color:#b7d2e4;font-size:12px}.advanced{padding-top:8px}.advanced label{display:flex;justify-content:space-between;align-items:center;margin:7px 0;color:#b7d2e4}.advanced input[type=number]{width:50px;background:#0e2337;color:#eff8ff;border:1px solid #56738a;border-radius:4px;padding:3px}
      .advanced-actions{display:flex;gap:6px;align-items:center}.debug{margin-top:8px}.debug canvas{display:block;max-width:100%;border-radius:5px}
      .footer{display:flex;gap:7px;padding-top:12px;margin-top:10px;border-top:1px solid #345269}.footer button{flex:1;font-size:11px}.footer .reset{background:transparent}
      .message{font-size:11px;color:#b7d2e4;padding-top:9px;min-height:24px}.mini{font-size:11px;color:#b7d2e4;padding:0 12px 10px}
      .telemetry{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:10px 0;border-bottom:1px solid #345269}.stat{color:#b7d2e4;font-size:11px}.stat strong{display:block;font-size:19px;color:#eff8ff;font-variant-numeric:tabular-nums}.stat.score{grid-column:1/-1}.stat.score strong{font-size:26px;color:#a7e7df;overflow-wrap:anywhere}.stat small{font-size:10px;font-weight:normal}.boost-line{display:flex;gap:8px;align-items:center;margin:8px 0}.boost-line button{flex:1;color:#ffbd83}.boost-line button.held{background:#ffb36b;color:#132b42;border-color:#ffb36b}.jump-again{width:100%;margin-top:6px}
      .loadout-select{display:flex;gap:6px;margin:9px 0}.loadout-select select{min-width:0;flex:1;background:#0e2337;color:#eff8ff;border:1px solid #56738a;border-radius:6px;padding:6px}.loadout-name{width:100%;border:1px solid #56738a;border-radius:6px;padding:7px;background:#0e2337;color:#eff8ff}.loadout-actions{display:flex;gap:6px;margin:7px 0}.loadout-actions button{flex:1;font-size:11px}#srloadouts{margin-top:10px;border-top:0;padding:0}
      @media(prefers-reduced-motion:reduce){button{transition:none}}
      </style>
      <div class="panel">
        <div class="top" id="srdrag">
          <svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M2 25 12 6l7 13 5-9 7 15Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m8 14 4 2 3-3M20 17l4 2 3-2M2 29h29" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <div class="brand"><strong>Snow Rider</strong><span class="status"><i id="srdot" class="dot"></i><span id="srstatus">Loading game</span></span></div>
          <button id="srhead" class="fold" aria-label="Minimize controls" aria-expanded="true" aria-controls="srbody">−</button>
        </div>
        <div id="srmini" class="mini" hidden></div>
        <div id="srbody" class="body">
          <div class="telemetry">
            <div class="stat score" title="Current score read directly from the game">Score<strong id="srlivescore">—</strong></div>
            <div class="stat" title="Actual forward speed in game units per second">Speed<strong><span id="srlivespeed">—</span> <small>u/s</small></strong></div>
            <div class="stat" title="Height above the last grounded position in game units; not exact clearance above terrain">Height<strong><span id="srliveheight">—</span> <small>units</small></strong></div>
          </div>
          <details id="srloadouts"><summary>Loadouts · save or switch a setup</summary>
            <div class="loadout-select"><select id="srloadoutselect" aria-label="Choose a loadout"></select><button id="srloadoutapply">Load</button></div>
            <input id="srloadoutname" class="loadout-name" type="text" maxlength="32" placeholder="Name this setup" aria-label="Loadout name">
            <div class="loadout-actions"><button id="srloadoutsave">Save current</button><button id="srloadoutdelete">Delete saved</button></div>
          </details>
          <div class="section">
            <div class="ability"><div><strong>Invincibility</strong><div class="hint">Keep riding after crashes</div></div><button id="srinvincible" class="toggle" aria-label="Invincibility" aria-pressed="true">On</button></div>
            <div class="ability"><div><strong>Flight</strong><div class="hint">Rise, descend and hover</div></div><button id="srflight" class="toggle" aria-label="Flight" aria-pressed="false">Off</button></div>
            <div class="ability"><div><strong>Super jump</strong><div class="hint">Use the Up arrow to jump</div></div><button id="srjump" class="toggle" aria-label="Super jump" aria-pressed="true">On</button></div>
            <div class="field"><div class="label"><label for="srjumpstrength">Jump strength</label><span class="number"><input id="srjumpnumber" type="number" min="1" max="20" step="0.5" aria-label="Jump strength multiplier"><span>×</span></span></div><input id="srjumpstrength" type="range" min="1" max="20" step="0.5" value="4" aria-label="Jump strength"></div>
            <div class="ability"><div><strong>Double jump</strong><div class="hint">Tap Up again while airborne</div></div><button id="srdoublejump" class="toggle" aria-label="Double jump" aria-pressed="true">On</button></div>
            <button id="srjumpagain" class="jump-again">Jump again</button>
          </div>
          <div class="section">
            <div class="field"><div class="label"><label for="srforwardspeed">Forward speed</label><span class="number"><input id="srforwardnumber" type="number" min="1" max="10000" step="1" aria-label="Forward speed multiplier"><span>×</span></span></div><input id="srforwardspeed" type="range" min="1" max="10000" step="1" value="1" aria-label="Forward speed"></div>
            <div class="presets"><button id="srpresetnormal" data-speed="1">1×</button><button data-speed="10">10×</button><button data-speed="100">100×</button><button id="srpresetmax" class="max" data-speed="10000">10,000×</button></div>
            <div class="boost-line"><button id="srboost">Hold boost · B</button><span class="number"><input id="srboostnumber" type="number" min="1" max="10000" step="1" value="300" aria-label="Boost speed multiplier"><span>×</span></span></div>
            <div class="field"><div class="label"><label for="srflightspeed">Rise / descend speed</label><span class="number"><input id="srrisenumber" type="number" min="1" max="80" step="1" aria-label="Rise and descend speed"></span></div><input id="srflightspeed" type="range" min="1" max="80" step="1" value="16" aria-label="Rise and descend speed"></div>
            <div class="flight-buttons"><button id="srrise">Rise ↑</button><button id="srdescend">Descend ↓</button></div>
            <div class="keys">Hold a button, or <kbd>Space</kbd> to rise and <kbd>Shift</kbd> to descend. Release to hover.</div>
          </div>
          <details><summary>Autopilot · experimental</summary><div class="advanced">
            <div class="advanced-actions"><button id="srauto" class="toggle" aria-pressed="false">Off</button><button id="srdbg" aria-pressed="false">Show vision</button></div>
            <label>Reverse steering<input id="srflip" type="checkbox"></label>
            <label>Tap interval<input id="srper" type="number" min="1" max="10" step="1"></label>
            <label>Hold threshold<input id="srhold" type="number" min="2" max="40" step="1"></label>
            <div id="srdebug" class="debug" hidden></div>
          </div></details>
          <div class="footer"><button id="srnormal">Normal ride</button><button id="srreset" class="reset">Reset defaults</button></div>
          <div class="keys"><kbd>Alt S</kbd> panel &nbsp; <kbd>Alt F</kbd> flight &nbsp; <kbd>Alt J</kbd> jump &nbsp; <kbd>Alt I</kbd> shield</div>
          <div id="srmsg" class="message" role="status" aria-live="polite">Your settings save automatically.</div>
        </div>
      </div>`;
    const $ = id => root.getElementById(id);
    const saved = options.settings || {};
    let opened = saved.panelOpen !== false, debug = false;
    const persist = () => options.save({
      forwardSpeed: m.forwardSpeed, flightSpeed: m.flightSpeed, jumpMultiplier: m.jumpMultiplier,
      superJump: m.superJump, flight: m.flight, boostSpeed: m.boostSpeed, doubleJump: m.doubleJump,
      invincible: options.protection() ? options.protection().enabled : saved.invincible !== false,
      panelOpen: opened, panelPosition: { left: parseFloat(host.style.left), top: parseFloat(host.style.top) },
      cfg: { period: options.cfg.period, hold: options.cfg.hold, flip: options.cfg.flip }
    });
    function message(text) { $('srmsg').textContent = text; }
    function setOpen(value) {
      opened = value; $('srbody').hidden = !opened; $('srmini').hidden = opened;
      $('srhead').textContent = opened ? '−' : '+';
      $('srhead').setAttribute('aria-expanded', String(opened));
      $('srhead').setAttribute('aria-label', opened ? 'Minimize controls' : 'Expand controls');
      position(parseFloat(host.style.left), parseFloat(host.style.top));
      persist();
    }
    function toggle(button, value) { button.setAttribute('aria-pressed', String(value)); button.textContent = value ? 'On' : 'Off'; }
    function value(id, value) { if (root.activeElement !== $(id)) $(id).value = value; }
    function render() {
      const protection = options.protection();
      const ready = protection && protection.status === 'ready';
      const movementReady = ready && m.status === 'ready';
      let status = movementReady ? (m.playing ? (m.boosting ? 'Boosting' : 'Riding') : 'Ready to ride') : 'Loading game';
      if (!protection) status = 'Reload the game to connect';
      if (protection && protection.status === 'unsupported') status = 'Game version unsupported';
      if (protection && protection.status === 'failed') status = 'Controls unavailable';
      $('srstatus').textContent = status; $('srdot').classList.toggle('ready', Boolean(movementReady));
      $('srinvincible').disabled = !ready;
      $('srflight').disabled = $('srjump').disabled = !movementReady;
      $('srdoublejump').disabled = !movementReady;
      $('srjumpagain').disabled = !movementReady || !m.doubleJumpAvailable;
      $('srboost').disabled = !movementReady || !m.playing;
      $('srrise').disabled = $('srdescend').disabled = !movementReady || !m.flight || !m.playing;
      toggle($('srinvincible'), Boolean(protection && protection.enabled));
      toggle($('srflight'), m.flight); toggle($('srjump'), m.superJump); toggle($('srauto'), options.getAuto());
      toggle($('srdoublejump'), m.doubleJump);
      $('srboost').classList.toggle('held', m.boosting);
      $('srboost').textContent = m.boosting ? 'Boosting · release to return' : 'Hold boost · B';
      if (!ready) { $('srinvincible').textContent = '—'; $('srinvincible').setAttribute('aria-pressed', 'false'); }
      if (!movementReady) { $('srflight').textContent = $('srjump').textContent = '—'; }
      if (!movementReady) $('srdoublejump').textContent = '—';
      value('srforwardspeed', m.forwardSpeed); value('srforwardnumber', m.forwardSpeed);
      value('srflightspeed', m.flightSpeed); value('srrisenumber', m.flightSpeed);
      value('srjumpstrength', m.jumpMultiplier); value('srjumpnumber', m.jumpMultiplier);
      value('srboostnumber', m.boostSpeed);
      const telemetry = m.getTelemetry();
      const scoreText = Number.isInteger(telemetry.score) && telemetry.score >= 0 ? telemetry.score.toLocaleString('en-GB') : '—';
      $('srlivescore').textContent = scoreText;
      $('srlivespeed').textContent = Number.isFinite(telemetry.speed) ? Math.max(0, telemetry.speed).toFixed(1) : '—';
      $('srliveheight').textContent = Number.isFinite(telemetry.height) ? telemetry.height.toFixed(1) : '—';
      $('srliveheight').title = telemetry.height == null ? 'Height calibrates when you land.' : 'Height above the last grounded position.';
      for (const button of root.querySelectorAll('[data-speed]')) {
        const selected = Number(button.dataset.speed) === m.forwardSpeed;
        button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected));
      }
      $('srrise').classList.toggle('held', m.up); $('srdescend').classList.toggle('held', m.down);
      $('srmini').textContent = `Score ${scoreText} · ${m.boosting ? Math.max(m.forwardSpeed,m.boostSpeed)+'× boost' : m.forwardSpeed+'× speed'}${m.flight ? ' · Flying' : ''}${m.superJump ? ' · '+m.jumpMultiplier+'× jump' : ''}`;
    }
    $('srhead').onclick = () => setOpen(!opened);
    $('srinvincible').onclick = () => {
      const p = options.protection(); if (!p || p.status !== 'ready') return;
      p.setEnabled(!p.enabled); persist(); render(); message(p.enabled ? 'Invincibility on.' : 'Invincibility off.');
    };
    $('srflight').onclick = () => {
      options.release(); m.setFlight(!m.flight); persist(); render();
      message(m.flight ? 'Flight on. Hold Space, Shift or a flight button.' : 'Flight off. Normal gravity restored.');
    };
    $('srjump').onclick = () => { m.setSuperJump(!m.superJump); persist(); render(); message(m.superJump ? 'Super jump on.' : 'Normal jump restored.'); };
    $('srdoublejump').onclick = () => { m.setDoubleJump(!m.doubleJump); persist(); render(); };
    $('srjumpagain').onclick = () => { if (m.tryDoubleJump()) message('Extra jump used. Land to recharge.'); render(); };
    $('srboostnumber').onchange = () => { m.setBoostSpeed($('srboostnumber').value); $('srboostnumber').value = m.boostSpeed; persist(); render(); };
    function bind(rangeId, numberId, setter) {
      const apply = input => {
        const raw = input.value.trim();
        if (raw !== '' && Number.isFinite(Number(raw))) setter(Number(raw));
        input.value = rangeId === 'srforwardspeed' ? m.forwardSpeed : rangeId === 'srflightspeed' ? m.flightSpeed : m.jumpMultiplier;
        persist(); render();
      };
      $(rangeId).oninput = () => apply($(rangeId)); $(numberId).onchange = () => apply($(numberId));
    }
    bind('srforwardspeed', 'srforwardnumber', value => m.setForwardSpeed(value));
    bind('srflightspeed', 'srrisenumber', value => m.setFlightSpeed(value));
    bind('srjumpstrength', 'srjumpnumber', value => m.setJumpMultiplier(value));
    for (const button of root.querySelectorAll('[data-speed]')) button.onclick = () => { m.setForwardSpeed(button.dataset.speed); persist(); render(); };
    function holdButton(id, direction) {
      const button = $(id);
      button.onpointerdown = event => {
        if (button.disabled || event.button !== 0) return;
        event.preventDefault(); button.setPointerCapture(event.pointerId); options.hold(direction, true); render();
      };
      const release = () => { options.hold(direction, false); render(); };
      button.onpointerup = release; button.onpointercancel = release; button.onlostpointercapture = release;
      button.onkeydown = event => {
        if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); options.hold(direction, true); render(); }
      };
      button.onkeyup = event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); release(); } };
      button.onblur = release;
    }
    holdButton('srrise', 'up'); holdButton('srdescend', 'down');
    const boost = $('srboost');
    boost.onpointerdown = event => { if (boost.disabled || event.button!==0) return; event.preventDefault(); boost.setPointerCapture(event.pointerId); options.boost(true); render(); };
    const releaseBoost = () => { options.boost(false); render(); };
    boost.onpointerup = releaseBoost; boost.onpointercancel = releaseBoost; boost.onlostpointercapture = releaseBoost; boost.onblur = releaseBoost;
    boost.onkeydown = event => { if (event.code==='Space' || event.code==='Enter') { event.preventDefault(); options.boost(true); render(); } };
    boost.onkeyup = event => { if (event.code==='Space' || event.code==='Enter') { event.preventDefault(); releaseBoost(); } };
    function snapshot() {
      return { forwardSpeed:m.forwardSpeed,flightSpeed:m.flightSpeed,jumpMultiplier:m.jumpMultiplier,boostSpeed:m.boostSpeed,
        flight:m.flight,superJump:m.superJump,doubleJump:m.doubleJump,invincible:options.protection()?.enabled!==false };
    }
    function loadoutSelection() {
      const entry=options.loadouts.get($('srloadoutselect').value);
      $('srloadoutapply').disabled=!entry;
      $('srloadoutdelete').disabled=!entry || !entry.id.startsWith('custom-');
      if(entry?.id.startsWith('custom-')) $('srloadoutname').value=entry.name;
    }
    function refreshLoadouts(selected='') {
      const select=$('srloadoutselect');select.replaceChildren();
      const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Choose a loadout';select.appendChild(placeholder);
      const built=document.createElement('optgroup'),custom=document.createElement('optgroup');built.label='Ready-made';custom.label='Your saved loadouts';
      for(const entry of options.loadouts.all()) { const item=document.createElement('option');item.value=entry.id;item.textContent=entry.name;(entry.id.startsWith('custom-')?custom:built).appendChild(item); }
      select.appendChild(built);if(custom.children.length)select.appendChild(custom);select.value=selected;loadoutSelection();
    }
    $('srloadoutselect').onchange=loadoutSelection;
    $('srloadoutapply').onclick=()=>{
      const entry=options.loadouts.get($('srloadoutselect').value);if(!entry)return;
      const v=entry.values;options.release();options.setAuto(false);m.setFlight(false);
      m.setForwardSpeed(v.forwardSpeed);m.setFlightSpeed(v.flightSpeed);m.setJumpMultiplier(v.jumpMultiplier);m.setBoostSpeed(v.boostSpeed);
      m.setSuperJump(v.superJump);m.setDoubleJump(v.doubleJump);m.setFlight(v.flight);
      const p=options.protection();if(p)p.setEnabled(v.invincible);persist();render();message('Loaded '+entry.name+'.');
    };
    $('srloadoutsave').onclick=()=>{
      try { const entry=options.loadouts.save($('srloadoutname').value,snapshot());refreshLoadouts(entry.id);message('Saved '+entry.name+'.'); }
      catch(error){message(error.message);}
    };
    $('srloadoutdelete').onclick=()=>{if(options.loadouts.remove($('srloadoutselect').value)){refreshLoadouts();$('srloadoutname').value='';message('Saved loadout deleted.');}};
    refreshLoadouts();
    $('srauto').onclick = () => { options.setAuto(!options.getAuto()); render(); message('Autopilot is experimental.'); };
    $('srdbg').onclick = () => { debug = !debug; options.showDebug(debug); $('srdebug').hidden = !debug; $('srdbg').textContent = debug ? 'Hide vision' : 'Show vision'; $('srdbg').setAttribute('aria-pressed', String(debug)); };
    $('srflip').checked = options.cfg.flip; $('srper').value = options.cfg.period; $('srhold').value = options.cfg.hold;
    $('srflip').onchange = () => { options.cfg.flip = $('srflip').checked; persist(); };
    $('srper').onchange = () => { options.cfg.period = Math.max(1, Math.min(10, Number($('srper').value) || 3)); $('srper').value = options.cfg.period; persist(); };
    $('srhold').onchange = () => { options.cfg.hold = Math.max(2, Math.min(40, Number($('srhold').value) || 14)); $('srhold').value = options.cfg.hold; persist(); };
    function normal(defaults) {
      options.release(); m.setFlight(false); m.setForwardSpeed(1); options.setAuto(false);
      m.setSuperJump(defaults); m.setDoubleJump(defaults); if (defaults) {
        m.setJumpMultiplier(4); m.setFlightSpeed(16);
        m.setBoostSpeed(300);
        options.cfg.period = 3; options.cfg.hold = 14; options.cfg.flip = false;
        $('srper').value = 3; $('srhold').value = 14; $('srflip').checked = false;
        debug = false; options.showDebug(false); $('srdebug').hidden = true;
        $('srdbg').textContent = 'Show vision'; $('srdbg').setAttribute('aria-pressed', 'false');
      }
      const p = options.protection(); if (p) p.setEnabled(defaults);
      persist(); render(); message(defaults ? 'Default abilities restored.' : 'Normal ride. Movement boosts and protection are off.');
    }
    $('srnormal').onclick = () => normal(false); $('srreset').onclick = () => normal(true);
    // Keep editing/navigation keys in this panel out of the game's input handlers.
    root.addEventListener('keydown', event => { if (!event.altKey && !event.ctrlKey && !event.metaKey) event.stopPropagation(); });
    root.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (button && event.detail > 0) {
        const canvas = document.querySelector('#gameContainer canvas');
        if (canvas && canvas.tabIndex >= 0) canvas.focus({ preventScroll: true });
        else button.blur();
      }
    });
    let drag = null;
    function position(left, top) {
      const width = host.getBoundingClientRect().width || 300;
      host.style.left = Math.max(8, Math.min(innerWidth - width - 8, left)) + 'px';
      host.style.top = Math.max(8, Math.min(innerHeight - (opened ? 180 : 100), top)) + 'px';
      $('srbody').style.maxHeight = Math.max(80, innerHeight - parseFloat(host.style.top) - 76) + 'px';
    }
    $('srdrag').onpointerdown = event => {
      if (event.target.closest('button') || event.button !== 0) return;
      drag = { x: event.clientX - parseFloat(host.style.left), y: event.clientY - parseFloat(host.style.top) };
      $('srdrag').setPointerCapture(event.pointerId);
    };
    $('srdrag').onpointermove = event => { if (drag) position(event.clientX - drag.x, event.clientY - drag.y); };
    $('srdrag').onpointerup = () => { if (drag) { drag = null; persist(); } };
    $('srdrag').onpointercancel = () => { drag = null; };
    window.addEventListener('resize', () => position(parseFloat(host.style.left), parseFloat(host.style.top)));
    document.body.appendChild(host);
    const initial = saved.panelPosition;
    position(initial && Number.isFinite(initial.left) ? initial.left : 12, initial && Number.isFinite(initial.top) ? initial.top : 12);
    setOpen(opened); render();
    return { host, render, message, toggle: () => setOpen(!opened), click: id => $(id).click(), attachDebug: canvas => $('srdebug').appendChild(canvas) };
  };
})();
