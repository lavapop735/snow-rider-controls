// Runtime field offsets apply only to the SHA-256 verified Unity build.
(function (root) {
  'use strict';
  function createMovement(getModule, isSupported) {
    const jumpSpeeds = new Map();
    const travelProfiles = new Map();
    let owner = null, activeFlight = null, forwardApplied = null;
    let jumpPoint = null, sawJump = false, extraJumpUsed = false, groundSample = null;
    function context() {
      const m = getModule();
      if (!isSupported() || !m || !m.HEAP32 || !m.HEAPF32 || !m.HEAPU8) return null;
      const h = m.HEAP32, f = m.HEAPF32, b = m.HEAPU8;
      const valid = (p, size = 4) => p > 0 && p % 4 === 0 && p + size <= b.length;
      const ptr = address => valid(address) ? h[address >>> 2] >>> 0 : 0;
      const statics = slot => {
        const cls = ptr(slot);
        return valid(cls, 96) ? ptr(cls + 92) : 0;
      };
      const player = ptr(statics(3363016)), stat = statics(3362936);
      if (!valid(player, 86) || !valid(stat, 44)) return null;
      const point = ptr(player + 24), data = ptr(player + 12);
      if (!valid(point, 140) || !valid(data, 44)) return null;
      return { m, h, f, b, player, stat, point, data, playing: h[(stat + 40) >>> 2] === 2 };
    }
    const grounded = c => Boolean(c.b[c.point + 124]) && c.f[(c.point + 116) >>> 2] <= 0.1;
    function resetJump() { jumpPoint = null; sawJump = false; extraJumpUsed = false; }
    function syncJump(c, state) {
      if (!c.playing) { resetJump(); state.doubleJumpAvailable = false; return; }
      if (jumpPoint !== c.point) { resetJump(); jumpPoint = c.point; }
      if (grounded(c)) { sawJump = false; extraJumpUsed = false; }
      else if (!state.flight && c.f[(c.point + 116) >>> 2] > 0.1) sawJump = true;
      state.doubleJumpAvailable = c.playing && state.doubleJump && !state.flight && sawJump && !extraJumpUsed && !grounded(c);
    }
    const state = {
      superJump: true, jumpMultiplier: 4, flight: false, flightSpeed: 16, forwardSpeed: 1,
      boostSpeed: 300, boosting: false, doubleJump: true, doubleJumpAvailable: false,
      up: false, down: false, playing: false, status: 'waiting',
      setBoostSpeed(value) {
        const speed = Number(value);
        this.boostSpeed = Number.isFinite(speed) ? Math.max(1, Math.min(10000, Math.round(speed))) : 300;
        this.tick();
      },
      setBoosting(value) { this.boosting = Boolean(value); this.tick(); },
      setDoubleJump(value) { this.doubleJump = Boolean(value); this.tick(); },
      tryDoubleJump() {
        const c = context();
        if (!c || !c.playing || owner !== c.m || !jumpSpeeds.has(c.data)) {
          resetJump();
          this.doubleJumpAvailable = false; return false;
        }
        syncJump(c, this);
        if (!this.doubleJumpAvailable) return false;
        c.f[(c.point + 116) >>> 2] = jumpSpeeds.get(c.data) * (this.superJump ? this.jumpMultiplier : 1);
        c.b[c.player + 84] = 1;
        c.b[c.player + 85] = 0;
        c.b[c.point + 124] = 0;
        extraJumpUsed = true; this.doubleJumpAvailable = false;
        return true;
      },
      getTelemetry() {
        const c = context(), result = { speed: null, height: null, score: null };
        if (!c) return result;
        const score = c.h[(c.stat + 36) >>> 2];
        if (score >= 0) result.score = score;
        const speed = c.playing ? c.f[(c.player + 60) >>> 2] : 0;
        if (Number.isFinite(speed)) result.speed = speed;
        if (groundSample && (groundSample.m !== c.m || groundSample.point !== c.point)) groundSample = null;
        const m = c.m;
        if (!['dynCall_iii', 'dynCall_viii', '_malloc', '_free'].every(name => typeof m[name] === 'function')) return result;
        const onGround = !this.flight && grounded(c);
        let scratch = 0;
        try {
          const transform = m.dynCall_iii(7111, c.point, 0);
          if (!transform) return result;
          scratch = m._malloc(12);
          if (!scratch || scratch % 4 || scratch + 12 > m.HEAPU8.length) return result;
          m.dynCall_viii(3973, scratch, transform, 0);
          const y = m.HEAPF32[(scratch + 4) >>> 2];
          if (!Number.isFinite(y)) return result;
          if (onGround) groundSample = { m, point: c.point, y };
          if (groundSample) result.height = Math.max(0, y - groundSample.y);
        } catch { /* Native telemetry is optional; movement remains available. */ }
        finally { if (scratch) { try { m._free(scratch); } catch {} } }
        return result;
      },
      setJumpMultiplier(value) {
        const multiplier = Number(value);
        this.jumpMultiplier = Number.isFinite(multiplier) ? Math.max(1, Math.min(20, Math.round(multiplier * 2) / 2)) : 4;
        this.tick();
      },
      setForwardSpeed(value) {
        const speed = Number(value);
        this.forwardSpeed = Number.isFinite(speed) ? Math.max(1, Math.min(10000, Math.round(speed))) : 1;
        this.tick();
      },
      setFlightSpeed(value) {
        const speed = Number(value);
        this.flightSpeed = Number.isFinite(speed) ? Math.max(1, Math.min(80, Math.round(speed))) : 16;
        this.tick();
      },
      setSuperJump(value) { this.superJump = Boolean(value); this.tick(); },
      setFlight(value) {
        this.flight = Boolean(value); this.up = false; this.down = false; this.tick();
      },
      tick() {
        this.playing = false;
        this.status = 'waiting';
        this.doubleJumpAvailable = false;
        const c = context();
        if (!c) { this.boosting = false; resetJump(); groundSample = null; return; }
        const { m, h, f, b, player, stat, point, data } = c;
        if (owner !== m) {
          if (owner) this.boosting = false;
          owner = m; jumpSpeeds.clear(); travelProfiles.clear(); activeFlight = null; forwardApplied = null;
          resetJump(); groundSample = null;
        }
        if (!jumpSpeeds.has(data)) {
          const speed = f[(data + 40) >>> 2];
          if (!Number.isFinite(speed) || speed <= 0 || speed > 1000) {
            this.boosting = false; resetJump(); groundSample = null; return;
          }
          jumpSpeeds.set(data, speed);
        }
        this.status = 'ready';
        f[(data + 40) >>> 2] = jumpSpeeds.get(data) * (this.superJump ? this.jumpMultiplier : 1);
        const playing = this.playing = c.playing;
        if (!playing) { this.boosting = false; groundSample = null; }
        syncJump(c, this);
        if (!travelProfiles.has(data)) {
          const base = f[(data + 12) >>> 2], amplitude = f[(data + 20) >>> 2];
          if (Number.isFinite(base) && base >= 0 && Number.isFinite(amplitude) && amplitude >= 0) {
            travelProfiles.set(data, { base, amplitude });
          }
        }
        const profile = travelProfiles.get(data), divisor = f[(data + 16) >>> 2];
        if (profile && Number.isFinite(divisor) && divisor > 0) {
          const factor = this.boosting && playing ? Math.max(this.forwardSpeed, this.boostSpeed) : this.forwardSpeed;
          // Position() recomputes speed from these fields every frame.
          // Scale the input to pow(x, 0.55) so its output scales by factor too.
          f[(data + 12) >>> 2] = profile.base * factor;
          f[(data + 20) >>> 2] = profile.amplitude * Math.pow(factor, 1 / 0.55);
          const changed = !forwardApplied || forwardApplied.player !== player || forwardApplied.data !== data ||
            forwardApplied.factor !== factor || !forwardApplied.playing;
          if (playing && changed && (factor !== 1 || (forwardApplied && forwardApplied.factor !== 1))) {
            const score = Math.max(0, h[(stat + 36) >>> 2]);
            const normal = profile.base + Math.pow(score / divisor * profile.amplitude, 0.55);
            f[(player + 60) >>> 2] = normal * factor;
          }
          forwardApplied = { player, data, factor, playing };
        }
        if (activeFlight && (!this.flight || !playing || activeFlight.point !== point)) {
          // Restore only the current live point, never a recycled object address.
          if (activeFlight.point === point) {
            f[(point + 120) >>> 2] = activeFlight.gravity;
            h[(point + 136) >>> 2] = activeFlight.mask;
            f[(point + 116) >>> 2] = 0;
            b[player + 84] = 0;
          }
          activeFlight = null;
        }
        if (!playing) { this.up = false; this.down = false; return; }
        if (!this.flight) return;
        if (!activeFlight) {
          activeFlight = { point, gravity: f[(point + 120) >>> 2], mask: h[(point + 136) >>> 2] };
        }
        f[(point + 120) >>> 2] = 0;
        h[(point + 136) >>> 2] = 0;
        f[(point + 116) >>> 2] = (Number(this.up) - Number(this.down)) * this.flightSpeed;
        b[player + 84] = 1;
        b[player + 85] = 0;
        b[point + 124] = 0;
      }
    };
    return state;
  }
  if (typeof module === 'object' && module.exports) module.exports = createMovement;
  else root.__srCreateMovement = createMovement;
})(globalThis);
