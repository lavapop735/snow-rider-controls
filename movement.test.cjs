const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const create = fs.existsSync(__dirname + '/movement.js') ? require('./movement.js')
  : () => { throw new Error('Movement controls not implemented'); };
function setup() {
  const buffer = new ArrayBuffer(4 * 1024 * 1024);
  const m = { HEAP32: new Int32Array(buffer), HEAPF32: new Float32Array(buffer), HEAPU8: new Uint8Array(buffer) };
  const i = m.HEAP32, f = m.HEAPF32;
  i[3362936 / 4] = 4096; i[(4096 + 92) / 4] = 8192;
  i[(8192 + 40) / 4] = 2;
  i[3363016 / 4] = 24576; i[(24576 + 92) / 4] = 28672;
  i[28672 / 4] = 12288;
  i[(12288 + 24) / 4] = 16384; i[(12288 + 12) / 4] = 20480;
  f[(20480 + 40) / 4] = 10;
  f[(20480 + 12) / 4] = 5;
  f[(20480 + 16) / 4] = 5;
  f[(20480 + 20) / 4] = 1;
  i[(8192 + 36) / 4] = 5;
  f[(12288 + 60) / 4] = 6;
  f[(16384 + 116) / 4] = -3;
  f[(16384 + 120) / 4] = -20;
  m.HEAPU8[16384 + 124] = 1;
  i[(16384 + 136) / 4] = 256;
  let ready = true, currentModule = m;
  return { m, c: create(() => currentModule, () => ready), setReady(v) { ready = v; },
    setModule(v) { currentModule = v; } };
}
test('super jump multiplies jump speed without compounding each frame and restores normal speed', () => {
  const { m, c } = setup();
  c.tick(); c.tick();
  assert.equal(m.HEAPF32[(20480 + 40) / 4], 40);
  c.setSuperJump(false); c.tick();
  assert.equal(m.HEAPF32[(20480 + 40) / 4], 10);
});
test('selected jump strength applies immediately without compounding subsequent frames', () => {
  const { m, c } = setup(), jump = () => m.HEAPF32[(20480 + 40) / 4];
  c.setJumpMultiplier(6.5); c.tick(); c.tick();
  assert.equal(jump(), 65);
  c.setJumpMultiplier(2); c.tick(); c.tick();
  assert.equal(jump(), 20);
});
test('disabling super jump restores the base speed while retaining the selected strength', () => {
  const { m, c } = setup(), jump = () => m.HEAPF32[(20480 + 40) / 4];
  c.setJumpMultiplier(8);
  c.setSuperJump(false);
  assert.equal(jump(), 10);
  c.setJumpMultiplier(5.5); c.tick();
  assert.equal(jump(), 10);
  c.setSuperJump(true);
  assert.equal(jump(), 55);
});
test('jump strength clamps to safe half steps and invalid values use the default strength', () => {
  const { m, c } = setup();
  for (const [input, expected] of [[0,10],[100,200],[3.26,35],[3.24,30],[NaN,40],[Infinity,40],['bad',40],['6.5',65]]) {
    c.setJumpMultiplier(input); c.tick();
    assert.equal(m.HEAPF32[(20480 + 40) / 4], expected);
  }
});
test('play status follows the verified game mode', () => {
  const { m, c } = setup();
  assert.equal(c.playing, false);
  for (const [mode, expected] of [[2,true],[3,false],[0,false],[1,false],[2,true]]) {
    m.HEAP32[(8192 + 40) / 4] = mode;
    c.tick();
    assert.equal(c.playing, expected);
  }
});
test('play status clears when a previously ready build becomes unsupported or uninitialized', () => {
  const { m, c, setReady, setModule } = setup();
  c.tick();
  assert.equal(c.playing, true);
  setReady(false); c.tick();
  assert.equal(c.playing, false);
  assert.equal(c.status, 'waiting');
  setReady(true); c.tick();
  assert.equal(c.playing, true);
  setModule(null); c.tick();
  assert.equal(c.playing, false);
  setModule(m); c.tick();
  assert.equal(c.playing, true);
  setModule({}); c.tick();
  assert.equal(c.playing, false);
  setModule(m); c.tick();
  assert.equal(c.playing, true);
  m.HEAP32[3363016 / 4] = 0; c.tick();
  assert.equal(c.playing, false);
});
test('flight ascends, hovers and descends and restores gravity when switched off', () => {
  const { m, c } = setup(), f = m.HEAPF32;
  c.setFlight(true); c.up = true; c.tick();
  assert.equal(f[(16384 + 116) / 4], 16);
  assert.equal(f[(16384 + 120) / 4], 0);
  assert.equal(m.HEAPU8[16384 + 124], 0);
  assert.equal(m.HEAP32[(16384 + 136) / 4], 0);
  c.up = false; c.tick();
  assert.equal(f[(16384 + 116) / 4], 0);
  c.down = true; c.tick();
  assert.equal(f[(16384 + 116) / 4], -16);
  c.setFlight(false); c.tick();
  assert.equal(f[(16384 + 120) / 4], -20);
  assert.equal(m.HEAP32[(16384 + 136) / 4], 256);
  assert.equal(m.HEAPU8[12288 + 84], 0);
});
test('flight stops overriding physics outside an active run', () => {
  const { m, c } = setup();
  c.setFlight(true); c.up = true; c.tick();
  m.HEAP32[(8192 + 40) / 4] = 3;
  c.tick();
  assert.equal(m.HEAPF32[(16384 + 120) / 4], -20);
  assert.equal(m.HEAPF32[(16384 + 116) / 4], 0);
});
test('unsupported builds never alter the game memory', () => {
  const { m, c, setReady } = setup();
  setReady(false); c.setFlight(true); c.up = true; c.tick();
  assert.equal(m.HEAPF32[(20480 + 40) / 4], 10);
  assert.equal(m.HEAPF32[(16384 + 116) / 4], -3);
});

test('an uninitialized player class never follows unrelated low memory as a pointer', () => {
  const { m, c } = setup();
  m.HEAP32[3363016 / 4] = 0;
  m.HEAP32[92 / 4] = 28672;
  c.tick();
  assert.equal(m.HEAPF32[(20480 + 40) / 4], 10);
});

test('selected flight speed applies immediately to ascent and descent while preserving hover', () => {
  const { m, c } = setup(), velocity = () => m.HEAPF32[(16384 + 116) / 4];
  c.setFlight(true); c.up = true;
  c.setFlightSpeed(35); c.tick();
  assert.equal(velocity(), 35);
  c.setFlightSpeed(7); c.tick();
  assert.equal(velocity(), 7);
  c.up = false; c.down = true; c.tick();
  assert.equal(velocity(), -7);
  c.down = false; c.tick();
  assert.equal(velocity(), 0);
});

test('flight speed is bounded and invalid values cannot write NaN into physics', () => {
  const { m, c } = setup();
  c.setFlight(true); c.up = true;
  for (const [input, expected] of [[1000,80],[-5,1],[NaN,16],[Infinity,16],['23',23]]) {
    c.setFlightSpeed(input); c.tick();
    assert.equal(m.HEAPF32[(16384 + 116) / 4], expected);
  }
});

test('forward speed changes actual travel immediately and scales the native acceleration formula', () => {
  const { m, c } = setup(), f=m.HEAPF32;
  c.setForwardSpeed(300); c.tick(); c.tick();
  assert.equal(f[(12288 + 60) / 4], 1800);
  // The engine reads these asset fields again every frame; they must stay boosted.
  const engineTarget=f[(20480+12)/4]+Math.pow(f[(20480+20)/4],0.55);
  assert.ok(Math.abs(engineTarget-1800)<0.001);
  c.setForwardSpeed(1); c.tick();
  assert.equal(f[(12288+60)/4],6);
  assert.equal(f[(20480+12)/4],5);
  assert.equal(f[(20480+20)/4],1);
});

test('forward boost applies without flight enabled and is independent of ascent speed', () => {
  const { m, c } = setup();
  c.setForwardSpeed(20); c.tick();
  assert.equal(c.flight,false);
  assert.equal(m.HEAPF32[(12288+60)/4],120);
  c.setFlightSpeed(35);
  assert.equal(m.HEAPF32[(12288+60)/4],120);
});

test('forward speed bounds prevent invalid physics values', () => {
  const { m, c } = setup();
  for (const [input,expected] of [[500,500],[1000,1000],[10000,10000],[15000,10000],[-2,1],[NaN,1],[Infinity,1],['10',10]]) {
    c.setForwardSpeed(input); c.tick();
    assert.equal(m.HEAPF32[(12288+60)/4],6*expected);
  }
});

test('held boost changes travel temporarily and releases to the selected forward speed', () => {
  const { m, c } = setup(), speed = () => m.HEAPF32[(12288 + 60) / 4];
  c.setForwardSpeed(10); c.setBoosting(true); c.tick();
  assert.equal(c.forwardSpeed, 10);
  assert.equal(speed(), 1800);
  c.setForwardSpeed(20); c.tick();
  assert.equal(c.forwardSpeed, 20);
  assert.equal(speed(), 1800);
  c.setBoosting(false);
  assert.equal(speed(), 120);
});
test('boost respects its bounds and never slows a faster selected forward speed', () => {
  const { m, c } = setup();
  c.setForwardSpeed(100); c.setBoostSpeed(10); c.setBoosting(true);
  assert.equal(m.HEAPF32[(12288 + 60) / 4], 600);
  for (const [input, expected] of [[500,500],[1000,1000],[10000,10000],[15000,10000],[-2,1],[NaN,300],[Infinity,300],['140',140]]) {
    c.setBoostSpeed(input);
    assert.equal(c.boostSpeed, expected);
  }
});
test('boost clears outside an active run and never carries into a replacement module', () => {
  const { m, c, setModule } = setup();
  c.setForwardSpeed(10); c.setBoosting(true);
  m.HEAP32[(8192 + 40) / 4] = 3; c.tick();
  assert.equal(c.boosting, false);
  assert.equal(m.HEAPF32[(20480 + 12) / 4], 50);
  m.HEAP32[(8192 + 40) / 4] = 2; c.tick();
  assert.equal(m.HEAPF32[(12288 + 60) / 4], 60);
  c.setBoosting(true);
  const replacement = setup().m;
  setModule(replacement); c.tick();
  assert.equal(c.boosting, false);
  assert.equal(replacement.HEAPF32[(12288 + 60) / 4], 60);
});
test('double jump requires a native first jump and gives one extra jump until landing', () => {
  const { m, c } = setup(), b = m.HEAPU8, velocity = () => m.HEAPF32[(16384 + 116) / 4];
  c.tick();
  assert.equal(c.tryDoubleJump(), false);
  assert.equal(velocity(), -3);
  b[16384 + 124] = 0; c.tick();
  assert.equal(c.tryDoubleJump(), false, 'Walking off an edge is not a native first jump');
  m.HEAPF32[(16384 + 116) / 4] = 40; c.tick();
  b[12288 + 84] = 0;
  assert.equal(c.doubleJumpAvailable, true, 'Releasing native jump input does not lose the extra jump');
  assert.equal(c.tryDoubleJump(), true);
  assert.equal(velocity(), 40);
  assert.equal(b[12288 + 84], 1);
  assert.equal(b[12288 + 85], 0);
  assert.equal(b[16384 + 124], 0);
  m.HEAPF32[(16384 + 116) / 4] = -2; c.tick();
  assert.equal(c.tryDoubleJump(), false);
  assert.equal(velocity(), -2);
  c.setDoubleJump(false); c.setDoubleJump(true);
  assert.equal(c.tryDoubleJump(), false, 'Toggling the option must not grant another extra jump');
  b[16384 + 124] = 1; c.tick();
  b[16384 + 124] = 0; m.HEAPF32[(16384 + 116) / 4] = 40; c.setJumpMultiplier(6.5);
  assert.equal(c.tryDoubleJump(), true);
  assert.equal(velocity(), 65);
});
test('double jump respects normal jump strength and flight, mode and build gates', () => {
  const { m, c, setReady } = setup(), b = m.HEAPU8;
  c.tick(); b[16384 + 124] = 0; m.HEAPF32[(16384 + 116) / 4] = 40; c.tick();
  c.setDoubleJump(false);
  assert.equal(c.tryDoubleJump(), false);
  c.setDoubleJump(true); c.setFlight(true);
  assert.equal(c.tryDoubleJump(), false);
  c.setFlight(false); m.HEAPF32[(16384 + 116) / 4] = 40;
  m.HEAP32[(8192 + 40) / 4] = 3;
  assert.equal(c.tryDoubleJump(), false);
  m.HEAP32[(8192 + 40) / 4] = 2; setReady(false);
  assert.equal(c.tryDoubleJump(), false);
  setReady(true); c.setSuperJump(false);
  assert.equal(c.tryDoubleJump(), true);
  assert.equal(m.HEAPF32[(16384 + 116) / 4], 10);
});
test('ending a run rearms double jump for the next native jump', () => {
  const { m, c } = setup(), b = m.HEAPU8;
  c.tick(); b[16384 + 124] = 0; m.HEAPF32[(16384 + 116) / 4] = 40; c.tick();
  assert.equal(c.tryDoubleJump(), true);
  m.HEAP32[(8192 + 40) / 4] = 3; c.tick();
  m.HEAP32[(8192 + 40) / 4] = 2; c.tick();
  assert.equal(c.tryDoubleJump(), true);
});
test('a sticky grounded flag during ascent does not grant unlimited extra jumps', () => {
  const { m, c } = setup();
  c.tick();
  m.HEAPF32[(16384 + 116) / 4] = 40;
  c.tick();
  assert.equal(m.HEAPF32[(16384 + 116) / 4], 40, 'The native first jump is not overwritten');
  assert.equal(c.doubleJumpAvailable, true);
  assert.equal(c.tryDoubleJump(), true);
  c.tick();
  assert.equal(c.doubleJumpAvailable, false);
  assert.equal(c.tryDoubleJump(), false);
  m.HEAPU8[16384 + 124] = 1;
  m.HEAPF32[(16384 + 116) / 4] = 0; c.tick();
  assert.equal(c.doubleJumpAvailable, false, 'Confirmed landing rearms a cycle but is not itself an extra jump');
  m.HEAPF32[(16384 + 116) / 4] = 40; c.tick();
  assert.equal(c.doubleJumpAvailable, true);
});
test('unsupported builds refuse boost and extra jump without altering memory', () => {
  const { m, c, setReady } = setup();
  setReady(false); c.setBoosting(true);
  assert.equal(c.boosting, false);
  assert.equal(c.tryDoubleJump(), false);
  assert.equal(m.HEAPF32[(12288 + 60) / 4], 6);
  assert.equal(m.HEAPF32[(16384 + 116) / 4], -3);
});
test('telemetry reads current speed without changing gameplay and handles unavailable builds', () => {
  const { m, c, setReady, setModule } = setup();
  c.tick();
  m.HEAPF32[(12288 + 60) / 4] = 123;
  assert.deepEqual(c.getTelemetry(), { speed: 123, height: null, score: 5 });
  assert.equal(m.HEAPF32[(12288 + 60) / 4], 123);
  m.HEAPF32[(12288 + 60) / 4] = 456;
  assert.equal(c.getTelemetry().speed, 456);
  setReady(false);
  assert.deepEqual(c.getTelemetry(), { speed: null, height: null, score: null });
  setReady(true); setModule(null);
  assert.deepEqual(c.getTelemetry(), { speed: null, height: null, score: null });
  const replacement = setup().m;
  replacement.HEAPF32[(12288 + 60) / 4] = 789;
  setModule(replacement);
  assert.equal(c.getTelemetry().speed, 789, 'The getter reads the current module instead of cached speed');
});
test('telemetry reports zero motion in menu and ended modes without erasing native speed', () => {
  const { m, c } = setup();
  c.tick();
  m.HEAPF32[(12288 + 60) / 4] = 123;
  for (const mode of [0, 1, 3]) {
    m.HEAP32[(8192 + 40) / 4] = mode;
    assert.equal(c.getTelemetry().speed, 0);
    assert.equal(m.HEAPF32[(12288 + 60) / 4], 123);
  }
  m.HEAP32[(8192 + 40) / 4] = 2;
  assert.equal(c.getTelemetry().speed, 123);
});
test('native height telemetry tracks height above the last grounded position and frees scratch memory', () => {
  const { m, c } = setup();
  let y = 3, allocations = 0, frees = 0;
  m.dynCall_iii = (index, point, method) => {
    assert.deepEqual([index, point, method], [7111, 16384, 0]);
    return 32768;
  };
  m._malloc = size => { assert.equal(size, 12); allocations++; return 36864; };
  m._free = scratch => { assert.equal(scratch, 36864); frees++; };
  m.dynCall_viii = (index, scratch, transform, method) => {
    assert.deepEqual([index, scratch, transform, method], [3973, 36864, 32768, 0]);
    m.HEAPF32[(scratch + 4) / 4] = y;
  };
  c.tick();
  assert.equal(c.getTelemetry().height, 0);
  m.HEAPU8[16384 + 124] = 0; y = 8;
  assert.equal(c.getTelemetry().height, 5);
  y = 1;
  assert.equal(c.getTelemetry().height, 0);
  assert.equal(allocations, frees);
  m.dynCall_viii = () => { throw new Error('Native sampling unavailable'); };
  assert.equal(c.getTelemetry().height, null);
  assert.equal(allocations, frees);
});

test('1000x speed remains applied through native acceleration and boost release', () => {
  const { m, c } = setup(), f=m.HEAPF32;
  c.setForwardSpeed(1000); c.tick(); c.tick();
  assert.equal(f[(12288+60)/4],6000);
  const engineTarget=f[(20480+12)/4]+Math.pow(f[(20480+20)/4],0.55);
  assert.ok(Math.abs(engineTarget-6000)<0.001);
  c.setForwardSpeed(10); c.setBoostSpeed(1000); c.setBoosting(true);
  assert.equal(f[(12288+60)/4],6000);
  c.setBoosting(false);
  assert.equal(f[(12288+60)/4],60);
});

test('10000x travel stays finite and persists through native acceleration', () => {
  const { m, c } = setup(), f=m.HEAPF32;
  c.setForwardSpeed(10000); c.tick(); c.tick();
  assert.equal(f[(12288+60)/4],60000);
  const native=f[(20480+12)/4]+Math.pow(f[(20480+20)/4],0.55);
  assert.ok(Number.isFinite(native) && Math.abs(native-60000)<0.01);
  c.setForwardSpeed(10); c.setBoostSpeed(10000); c.setBoosting(true);
  assert.equal(f[(12288+60)/4],60000);
  c.setBoosting(false); assert.equal(f[(12288+60)/4],60);
});

test('score telemetry reads live and ended scores and never changes the native score', () => {
  const { m, c, setReady } = setup();
  for (const score of [0, 12345, 1000000]) {
    m.HEAP32[(8192+36)/4]=score;
    const before=Buffer.from(m.HEAPU8);
    assert.equal(c.getTelemetry().score,score);
    assert.deepEqual(Buffer.from(m.HEAPU8),before);
  }
  m.HEAP32[(8192+40)/4]=3;
  assert.equal(c.getTelemetry().score,1000000);
  m.HEAP32[(8192+36)/4]=0;
  assert.equal(c.getTelemetry().score,0);
  setReady(false); assert.equal(c.getTelemetry().score,null);
});
