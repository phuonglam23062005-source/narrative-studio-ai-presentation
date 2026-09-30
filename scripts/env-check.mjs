import fs from 'node:fs';

const envExample = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const required = ['APP_ENV=local', 'PUBLIC_DEFAULT_LOCALE=vi', 'PUBLIC_LOCAL_ONLY=true'];
const secretNames = ['SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY', 'R2_SECRET_ACCESS_KEY', 'CANVA_CLIENT_SECRET'];
const missing = required.filter((entry) => !envExample.split(/\r?\n/).includes(entry));
const populatedSecrets = envExample.split(/\r?\n/).filter((line) => secretNames.some((name) => line.startsWith(name + '=') && line.slice(name.length + 1).trim()));

if (missing.length || populatedSecrets.length) {
  console.error(JSON.stringify({ missing, populatedSecrets }, null, 2));
  process.exit(1);
}

console.log('Environment contract passed: public defaults present, secret placeholders empty.');
