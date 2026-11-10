const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { webcrypto, createHash } = require('node:crypto');
const patch = require('./wasm-patch.js');
const install = fs.existsSync(__dirname + '/invincibility.js')
  ? require('./invincibility.js') : () => { throw new Error('Invincibility loader is not implemented'); };
const fixture = Uint8Array.from([
  0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,3,1,0,1,
  7,16,2,3,100,105,101,0,0,6,109,101,109,111,114,121,2,0,
  10,11,1,9,0,65,0,65,1,54,2,0,11
]);
function setup(hash = createHash('sha256').update(fixture).digest('hex')) {
  const page = { WebAssembly: { ...WebAssembly, Module: WebAssembly.Module,
    instantiate: WebAssembly.instantiate, instantiateStreaming: WebAssembly.instantiateStreaming },
    crypto: webcrypto, __srPatchWasm: patch, location: { pathname: '/mobile/games/snow-rider-3d/game.html' } };
  install(page, { sha256: hash, functions: [0] });
  return page;
}
test('loading a supported game enables protection and the toggle restores deaths', async () => {
  const page = setup();
  const { instance } = await page.WebAssembly.instantiate(fixture);
  const memory = new Int32Array(instance.exports.memory.buffer);
  instance.exports.die();
  assert.equal(memory[0], 0);
  assert.equal(page.__srInvincibility.status, 'ready');
  page.__srInvincibility.setEnabled(false);
  instance.exports.die();
  assert.equal(memory[0], 1);
});
test('unsupported game version runs unchanged and never claims protection', async () => {
  const page = setup('incorrect-build');
  const { instance } = await page.WebAssembly.instantiate(fixture);
  instance.exports.die();
  assert.equal(new Int32Array(instance.exports.memory.buffer)[0], 1);
  assert.equal(page.__srInvincibility.status, 'unsupported');
});
test('streaming Unity loading applies the same protection', async () => {
  const page = setup();
  const { instance } = await page.WebAssembly.instantiateStreaming(Promise.resolve(new Response(fixture)));
  instance.exports.die();
  assert.equal(new Int32Array(instance.exports.memory.buffer)[0], 0);
});
test('other game pages keep their original wasm loader', () => {
  const page = { location: { pathname: '/mobile/games/another-game/game.html' }, WebAssembly };
  install(page, { sha256: '', functions: [] });
  assert.equal(page.__srInvincibility, undefined);
});
