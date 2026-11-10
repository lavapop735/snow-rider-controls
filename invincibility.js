(function (root) {
  'use strict';
  function install(page, build) {
    if (page.location.pathname !== '/mobile/games/snow-rider-3d/game.html' || page.__srInvincibility) return;
    const state = page.__srInvincibility = {
      status: 'waiting', enabled: true, flag: null,
      setEnabled(value) {
        this.enabled = Boolean(value);
        if (this.flag) this.flag.value = this.enabled ? 1 : 0;
      }
    };
    const wasm = page.WebAssembly;
    const original = wasm.instantiate.bind(wasm);
    wasm.instantiate = async function (source, imports) {
      if (source instanceof wasm.Module) return original(source, imports);
      const bytes = ArrayBuffer.isView(source)
        ? new Uint8Array(source.buffer, source.byteOffset, source.byteLength) : new Uint8Array(source);
      let patched;
      try {
        const digest = await page.crypto.subtle.digest('SHA-256', bytes);
        const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
        if (hash !== build.sha256) {
          if (state.status !== 'ready') state.status = 'unsupported';
          return original(source, imports);
        }
        patched = page.__srPatchWasm(bytes, build.functions);
      } catch (error) {
        state.status = 'failed';
        state.error = error.message;
        return original(source, imports);
      }
      let result;
      try { result = await original(patched, imports); }
      catch (error) { state.status = 'failed'; state.error = error.message; return original(source, imports); }
      state.flag = result.instance.exports.__srInvincible;
      state.setEnabled(state.enabled);
      state.status = 'ready';
      return result;
    };
    if (wasm.instantiateStreaming) {
      wasm.instantiateStreaming = async function (response, imports) {
        return wasm.instantiate(await (await response).arrayBuffer(), imports);
      };
    }
  }
  if (typeof module === 'object' && module.exports) module.exports = install;
  else install(root, {
    // Hooda Math SnowRider3D-gd-1, verified 2026-10-09.
    sha256: 'b6d05467e8594da11fcb844b51fe51db6d7765fd33b95b7568a1c778e2736efc',
    functions: [{
      index: 46030, // UnityEvent.Invoke(this, MethodInfo): void
      event: { typeInfoAddress: 3362936, staticFieldsOffset: 92, delegateOffset: 60 }
    }]
  });
})(globalThis);
