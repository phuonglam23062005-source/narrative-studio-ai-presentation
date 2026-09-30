import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'dist');
const files = ['index.html', 'styles.css', 'release.css', 'light-theme.css', 'foundation-runtime.js', 'presentation-domain.js', 'auth-config.js', 'auth-runtime.js', 'app.js', 'agent-runtime.js', 'release-runtime.js'];

fs.mkdirSync(out, { recursive: true });
for (const file of files) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) throw new Error('Missing build asset: ' + file);
  fs.copyFileSync(source, path.join(out, file));
}

console.log('Built ' + files.length + ' static assets to ' + out);
