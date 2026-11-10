// Create a self-contained USB folder. No downloads or third-party packages.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = __dirname;
const output = path.resolve(process.argv[2] || path.join(os.homedir(), 'Downloads', 'Snow Rider Controls USB'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const files = new Set(['manifest.json', ...manifest.content_scripts.flatMap(entry => entry.js)]);
for (const file of files) {
  if (path.basename(file) !== file || !fs.statSync(path.join(root, file)).isFile()) throw new Error('Invalid extension file: ' + file);
}
if (fs.existsSync(output)) throw new Error('Output already exists; choose a different folder: ' + output);
fs.mkdirSync(path.join(output, 'Extension'), { recursive: true });
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(output, 'Extension', file));
for (const file of ['Setup - Mac.command', 'Setup - Windows.cmd', 'START HERE.html']) {
  const contents = fs.readFileSync(path.join(root, 'usb-kit', file), 'utf8');
  fs.writeFileSync(path.join(output, file), file.endsWith('.cmd') ? contents.replace(/\r?\n/g, '\r\n') : contents);
}
fs.chmodSync(path.join(output, 'Setup - Mac.command'), 0o755);
fs.copyFileSync(path.join(output, 'START HERE.html'), path.join(output, 'Extension', 'START HERE.html'));
console.log(output);
