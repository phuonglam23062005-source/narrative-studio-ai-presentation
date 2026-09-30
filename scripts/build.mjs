import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'dist');
const files = ['index.html', 'styles.css', 'release.css', 'light-theme.css', 'pptora-brand.css', 'foundation-runtime.js', 'presentation-domain.js', 'auth-config.js', 'auth-runtime.js', 'app.js', 'agent-runtime.js', 'release-runtime.js'];

fs.mkdirSync(out, { recursive: true });
for (const file of files) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) throw new Error('Missing build asset: ' + file);
  fs.copyFileSync(source, path.join(out, file));
}

const assets = path.join(root, 'assets');
if (!fs.existsSync(assets)) throw new Error('Missing assets directory: ' + assets);
fs.cpSync(assets, path.join(out, 'assets'), { recursive: true });

console.log('Built ' + files.length + ' static assets plus branding assets to ' + out);
