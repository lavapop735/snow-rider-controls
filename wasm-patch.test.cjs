const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const patch = fs.existsSync(__dirname + '/wasm-patch.js')
  ? require('./wasm-patch.js') : () => { throw new Error('Invincibility patch is not implemented'); };

// Hand-built module: die() writes 1, unrelated() writes 2 to memory[0].
// A pre-existing global makes incorrect global indexing observable.
const fixture = Uint8Array.from([
  0,97,115,109,1,0,0,0,
  1,4,1,96,0,0,
  3,3,2,0,0,
  5,3,1,0,1,
  6,6,1,127,1,65,7,11,
  7,28,3,3,100,105,101,0,0,9,117,110,114,101,108,97,116,101,100,0,1,6,109,101,109,111,114,121,2,0,
  10,21,2,9,0,65,0,65,1,54,2,0,11,9,0,65,0,65,2,54,2,0,11
]);

test('invincibility blocks death only while enabled and leaves other gameplay running', async () => {
  const bytes = patch(fixture, [0]);
  const { instance } = await WebAssembly.instantiate(bytes);
  const e = instance.exports;
  const memory = new Int32Array(e.memory.buffer);
  e.die();
  assert.equal(memory[0], 1);
  memory[0] = 0;
  e.__srInvincible.value = 1;
  e.die();
  assert.equal(memory[0], 0);
  e.unrelated();
  assert.equal(memory[0], 2);
  e.__srInvincible.value = 0;
  e.die();
  assert.equal(memory[0], 1);
  assert.deepEqual(Array.from(fixture.slice(0, 8)), [0,97,115,109,1,0,0,0]);
});

test('invalid target refuses to produce a misleading patched game', () => {
  assert.throws(() => patch(fixture, [99]), /function/i);
});

test('patch preparation works when Chrome blocks synchronous compilation of large games', () => {
  const native = WebAssembly.Module;
  WebAssembly.Module = new Proxy(native, { construct() { throw new Error('Sync compilation disallowed'); } });
  try { assert.equal(WebAssembly.validate(patch(fixture, [0])), true); }
  finally { WebAssembly.Module = native; }
});

test('the shared event dispatcher blocks only the death event, preserving other events', async () => {
  // Same store method with two arguments (delegate pointer and method info).
  const eventFixture = Uint8Array.from([
    0,97,115,109,1,0,0,0,1,6,1,96,2,127,127,0,3,2,1,0,5,3,1,0,1,
    7,16,2,3,100,105,101,0,0,6,109,101,109,111,114,121,2,0,
    10,11,1,9,0,65,0,65,1,54,2,0,11
  ]);
  const bytes = patch(eventFixture, [{ index: 0, event: { typeInfoAddress: 64, staticFieldsOffset: 92, delegateOffset: 60 } }]);
  const { instance } = await WebAssembly.instantiate(bytes);
  const e = instance.exports, memory = new Int32Array(e.memory.buffer);
  memory[64 / 4] = 128;
  memory[(128 + 92) / 4] = 256;
  memory[(256 + 60) / 4] = 512;
  e.__srInvincible.value = 1;
  e.die(512, 0);
  assert.equal(memory[0], 0);
  e.die(513, 0);
  assert.equal(memory[0], 1);
  memory[0] = 0;
  e.__srInvincible.value = 0;
  e.die(512, 0);
  assert.equal(memory[0], 1);
});
