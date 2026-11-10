// Add a reversible guard to known void methods in a verified Unity build.
(function (root) {
  'use strict';
  function join(parts) {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of parts) { out.set(p, at); at += p.length; }
    return out;
  }
  function u32(value) {
    const out = [];
    do { const b = value & 127; value >>>= 7; out.push(b | (value ? 128 : 0)); } while (value);
    return Uint8Array.from(out);
  }
  function reader(bytes) {
    return { at: 0, uint() {
      let n = 0, shift = 0, b;
      do {
        if (this.at >= bytes.length || shift > 28) throw new Error('Invalid wasm integer');
        b = bytes[this.at++]; n |= (b & 127) << shift; shift += 7;
      } while (b & 128);
      return n >>> 0;
    } };
  }
  function i32(value) {
    const out = [];
    let more;
    do {
      const b = value & 127; value >>= 7;
      more = !((value === 0 && !(b & 64)) || (value === -1 && (b & 64)));
      out.push(b | (more ? 128 : 0));
    } while (more);
    return Uint8Array.from(out);
  }
  function patch(bytes, functions) {
    bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (bytes.length < 8 || bytes[0] !== 0 || bytes[1] !== 97 || bytes[2] !== 115 || bytes[3] !== 109) {
      throw new Error('Invalid wasm header');
    }
    const sections = [];
    const r = reader(bytes); r.at = 8;
    while (r.at < bytes.length) {
      const id = bytes[r.at++], size = r.uint(), end = r.at + size;
      if (end > bytes.length) throw new Error('Invalid wasm section');
      sections.push({ id, data: bytes.slice(r.at, end) }); r.at = end;
    }
    // Count imports directly: Chrome disallows synchronous compilation >8MB.
    let importedFunctions = 0, importedGlobals = 0;
    const imports = sections.find(s => s.id === 2);
    if (imports) {
      const ir = reader(imports.data), count = ir.uint();
      const skipName = () => { const length = ir.uint(); ir.at += length; };
      const limits = () => { const flags = ir.uint(); ir.uint(); if (flags & 1) ir.uint(); };
      for (let i = 0; i < count; i++) {
        skipName(); skipName();
        const kind = imports.data[ir.at++];
        if (kind === 0) { importedFunctions++; ir.uint(); }
        else if (kind === 1) { ir.at++; limits(); }
        else if (kind === 2) limits();
        else if (kind === 3) { importedGlobals++; ir.at += 2; }
        else throw new Error('Unsupported wasm import');
      }
    }
    function section(id) {
      let s = sections.find(s => s.id === id);
      if (!s) {
        s = { id, data: Uint8Array.of(0) };
        const at = sections.findIndex(s => s.id !== 0 && s.id > id);
        sections.splice(at < 0 ? sections.length : at, 0, s);
      }
      return s;
    }
    const globals = section(6), gr = reader(globals.data), count = gr.uint();
    const globalIndex = importedGlobals + count;
    globals.data = join([u32(count + 1), globals.data.slice(gr.at), Uint8Array.of(127, 1, 65, 0, 11)]);
    const exports = section(7), er = reader(exports.data), ec = er.uint();
    const name = new TextEncoder().encode('__srInvincible');
    exports.data = join([u32(ec + 1), exports.data.slice(er.at), u32(name.length), name, Uint8Array.of(3), u32(globalIndex)]);
    const code = section(10), cr = reader(code.data), functionCount = cr.uint();
    const targets = new Map(functions.map(target => {
      const spec = typeof target === 'number' ? { index: target } : target;
      return [spec.index - importedFunctions, spec];
    }));
    if (!targets.size || [...targets.keys()].some(i => !Number.isInteger(i) || i < 0 || i >= functionCount)) {
      throw new Error('Invalid death function index');
    }
    const bodies = [u32(functionCount)];
    for (let i = 0; i < functionCount; i++) {
      const size = cr.uint();
      let body = code.data.slice(cr.at, cr.at + size); cr.at += size;
      if (targets.has(i)) {
        const br = reader(body), locals = br.uint();
        for (let j = 0; j < locals; j++) { br.uint(); br.at++; }
        const event = targets.get(i).event;
        // UnityEvent.Invoke is shared: suppress only GameControl.OnEnd.
        const condition = event ? join([
          Uint8Array.of(0x20, 0, 0x41), i32(event.typeInfoAddress),
          Uint8Array.of(0x28, 2, 0, 0x28, 2), u32(event.staticFieldsOffset),
          Uint8Array.of(0x28, 2), u32(event.delegateOffset),
          Uint8Array.of(0x46, 0x04, 0x40, 0x0f, 0x0b)
        ]) : Uint8Array.of(0x0f);
        const guard = join([Uint8Array.of(0x23), u32(globalIndex), Uint8Array.of(0x04, 0x40), condition, Uint8Array.of(0x0b)]);
        body = join([body.slice(0, br.at), guard, body.slice(br.at)]);
      }
      bodies.push(u32(body.length), body);
    }
    code.data = join(bodies);
    const output = join([bytes.slice(0, 8), ...sections.map(s => join([Uint8Array.of(s.id), u32(s.data.length), s.data]))]);
    if (!WebAssembly.validate(output)) throw new Error('Death function patch failed wasm validation');
    return output;
  }
  if (typeof module === 'object' && module.exports) module.exports = patch;
  else root.__srPatchWasm = patch;
})(globalThis);
