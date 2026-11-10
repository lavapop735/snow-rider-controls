// Runs inside the Unity iframe only (the one that exposes gameInstance).
(function () {
  if (location.pathname !== '/mobile/games/snow-rider-3d/game.html' || window.__srBoost) return;
  window.__srBoost = true;

  const KEY = 'srBoost';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} };

  const mod = () => window.gameInstance && window.gameInstance.Module;
  // ---------- Autopilot (pixel based, untested blind) ----------
  const W = 96, H = 60;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const dbg = document.createElement('canvas'); dbg.width = W * 2; dbg.height = H * 2;
  dbg.style.cssText = 'display:none;margin-top:4px;border:1px solid #888';
  const dx = dbg.getContext('2d');
  const cfg = Object.assign({ lookTop: 0.34, lookBot: 0.58, gap: 18, brown: 22, dark: 105, dead: 5, hold: 14, period: 3, flip: false }, load().cfg);
  let auto = false, held = 0, target = null, frame = 0;

  // obstacle = brownish/orange or dark pixel. Snow (white or bluish shade), sky and clouds are not.
  function isObs(d, i) {
    const r = d[i], g = d[i + 1], bl = d[i + 2];
    return (r - bl > cfg.brown) || (r + g + bl < cfg.dark * 3);
  }

  function key(type, code, kc) {
    const e = new KeyboardEvent(type, { key: code, code, bubbles: true, cancelable: true });
    Object.defineProperty(e, 'keyCode', { get: () => kc });
    Object.defineProperty(e, 'which', { get: () => kc });
    (findCanvas() || document).dispatchEvent(e);
  }
  function steer(dir) { // -1 left, 0 straight, 1 right
    if (dir === held) return;
    if (held === -1) key('keyup', 'ArrowLeft', 37);
    if (held === 1) key('keyup', 'ArrowRight', 39);
    if (dir === -1) key('keydown', 'ArrowLeft', 37);
    if (dir === 1) key('keydown', 'ArrowRight', 39);
    held = dir;
  }

  function think(gl) {
    frame++;
    cx.drawImage(gl, 0, 0, W, H);
    const img = cx.getImageData(0, 0, W, H), d = img.data;
    const y0 = Math.floor(H * cfg.lookTop), y1 = Math.floor(H * cfg.lookBot);
    const danger = new Float32Array(W);
    for (let y = y0; y < y1; y++) {
      const w = 0.4 + 1.6 * (y - y0) / Math.max(1, y1 - y0); // nearer rows weigh more
      for (let x = 0; x < W; x++) if (isObs(d, (y * W + x) * 4)) danger[x] += w;
    }
    // sled needs a clear corridor of cfg.gap columns: cost of each candidate window
    const gap = cfg.gap, half = gap >> 1, c = W >> 1;
    const pre = new Float32Array(W + 1);
    for (let x = 0; x < W; x++) pre[x + 1] = pre[x] + danger[x];
    const cost = (x) => pre[Math.min(W, x + half)] - pre[Math.max(0, x - half)] + Math.abs(x - c) * 0.15;
    let best = c, bc = cost(c);
    for (let x = half; x < W - half; x++) { const k = cost(x); if (k < bc) { bc = k; best = x; } }
    // hysteresis: keep the old target unless the new one is clearly better
    if (target !== null && cost(target) <= bc + 4) best = target;
    target = best;

    const err = best - c;
    let dir = 0;
    if (Math.abs(err) > cfg.dead) {
      // big error: hold the key; small error: tap it every other frame
      dir = (Math.abs(err) > cfg.hold || frame % cfg.period === 0) ? Math.sign(err) : 0;
      if (cfg.flip) dir = -dir;
    }
    steer(dir);

    if (dbg.style.display !== 'none') {
      for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (isObs(d, i)) { d[i] = 255; d[i + 1] = 0; d[i + 2] = 0; }
      }
      cx.putImageData(img, 0, 0);
      dx.drawImage(cv, 0, 0, W * 2, H * 2);
      dx.strokeStyle = 'yellow'; dx.strokeRect(0, y0 * 2, W * 2, (y1 - y0) * 2);
      dx.fillStyle = 'rgba(0,255,0,.6)'; dx.fillRect((best - half) * 2, y0 * 2, gap * 2, (y1 - y0) * 2);
      dx.fillStyle = '#0af'; dx.fillRect(c * 2 - 1, 0, 2, H * 2);
    }
  }

  function findCanvas() { return document.querySelector('#gameContainer canvas') || document.querySelector('canvas'); }
  const saved = load();
  const movement = window.__srCreateMovement(mod,
    () => window.__srInvincibility && window.__srInvincibility.status === 'ready');
  window.__srMovement = movement;
  movement.setFlightSpeed(saved.flightSpeed ?? 16);
  movement.setForwardSpeed(saved.forwardSpeed ?? 1);
  movement.setJumpMultiplier(saved.jumpMultiplier ?? 4);
  movement.setSuperJump(saved.superJump !== false);
  movement.setFlight(saved.flight === true);
  movement.setBoostSpeed(saved.boostSpeed ?? 300);
  movement.setDoubleJump(saved.doubleJump !== false);
  const loadouts = window.__srCreateLoadouts(saved.loadouts, list => save({ ...load(), loadouts: list }));
  const protection = () => window.__srInvincibility;
  if (protection()) protection().setEnabled(saved.invincible !== false);

  const heldKeys = new Set();
  const buttonHeld = { up: false, down: false };
  let boostHeld = false;
  function updateFlightInput() {
    movement.up = movement.flight && (heldKeys.has('Space') || buttonHeld.up);
    movement.down = movement.flight && (heldKeys.has('ShiftLeft') || heldKeys.has('ShiftRight') || buttonHeld.down);
    movement.tick();
  }
  function updateBoost() { movement.setBoosting(heldKeys.has('KeyB') || boostHeld); }
  function release() { heldKeys.clear(); buttonHeld.up = false; buttonHeld.down = false; boostHeld = false; updateBoost(); updateFlightInput(); }
  const panel = window.__srCreatePanel({
    movement, protection, settings: saved, save: patch => save({ ...load(), ...patch }), cfg, loadouts,
    getAuto: () => auto,
    setAuto: value => { auto = value; if (!auto) { steer(0); target = null; } },
    showDebug: visible => { dbg.style.display = visible ? 'block' : 'none'; },
    hold: (direction, pressed) => { buttonHeld[direction] = pressed; updateFlightInput(); },
    boost: pressed => { boostHeld = pressed; updateBoost(); },
    release
  });
  panel.attachDebug(dbg);
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (cb) {
    return raf(function (t) {
      movement.tick();
      cb(t);
      if (auto) {
        const gl = findCanvas();
        if (gl) try { think(gl); } catch (error) { auto = false; steer(0); panel.message('Autopilot stopped: game image unavailable.'); }
      }
    });
  };
  function isEditing(event) {
    return event.composedPath().some(element => element instanceof Element &&
      (element.matches('input,textarea,select') || element.isContentEditable));
  }
  addEventListener('keydown', event => {
    if (isEditing(event)) return;
    if (event.altKey && !event.ctrlKey && !event.metaKey && !event.repeat) {
      const actions = { KeyF: 'srflight', KeyJ: 'srjump', KeyI: 'srinvincible', KeyA: 'srauto' };
      if (event.code === 'KeyS') { event.preventDefault(); panel.toggle(); return; }
      if (actions[event.code]) { event.preventDefault(); panel.click(actions[event.code]); return; }
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.code === 'KeyB' && movement.playing) { event.preventDefault(); heldKeys.add(event.code); updateBoost(); return; }
    if (!movement.flight && !event.repeat && ['ArrowUp','Space'].includes(event.code)) {
      if (movement.tryDoubleJump()) { event.preventDefault(); panel.render(); }
    }
    if (!movement.flight || event.altKey || event.ctrlKey || event.metaKey) return;
    if (['Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
      event.preventDefault(); heldKeys.add(event.code); updateFlightInput();
    }
  });
  addEventListener('keyup', event => {
    if (heldKeys.delete(event.code)) { if(event.code==='KeyB')updateBoost();else updateFlightInput(); if (movement.flight || event.code==='KeyB') event.preventDefault(); }
  }, true);
  addEventListener('blur', release);
  addEventListener('visibilitychange', () => { if (document.hidden) release(); });
  const statusTimer = setInterval(() => { panel.render(); }, 300);
  addEventListener('pagehide', () => { clearInterval(statusTimer); release(); auto = false; steer(0); }, { once: true });
})();
