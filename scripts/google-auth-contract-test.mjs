import fs from 'node:fs';

const files = {
  helper: fs.readFileSync(new URL('../server/google-auth.js', import.meta.url), 'utf8'),
  config: fs.readFileSync(new URL('../api/auth/config.js', import.meta.url), 'utf8'),
  google: fs.readFileSync(new URL('../api/auth/google.js', import.meta.url), 'utf8'),
  session: fs.readFileSync(new URL('../api/auth/session.js', import.meta.url), 'utf8'),
  logout: fs.readFileSync(new URL('../api/auth/logout.js', import.meta.url), 'utf8'),
  runtime: fs.readFileSync(new URL('../auth-runtime.js', import.meta.url), 'utf8'),
  docs: fs.readFileSync(new URL('../docs/GOOGLE_AUTH_SETUP.md', import.meta.url), 'utf8')
};

const checks = {
  verifiesSignature: files.helper.includes("createVerify('RSA-SHA256')") && files.helper.includes('createPublicKey'),
  verifiesClaims: files.helper.includes('claims.email_verified') && files.helper.includes('claims.iss') && files.helper.includes('claims.aud') && files.helper.includes('claims.exp'),
  serverRoleAllowlist: files.helper.includes('GOOGLE_ADMIN_EMAILS') && files.helper.includes("getRole(claims.email)"),
  httpOnlySession: files.helper.includes('HttpOnly') && files.helper.includes('SameSite=Lax'),
  hasRoutes: files.config.includes('/api/auth/google') && files.google.includes('verifyGoogleCredential') && files.session.includes('requireSession') && files.logout.includes('Set-Cookie'),
  browserConfigFetch: files.runtime.includes('googleConfigEndpoint') && files.runtime.includes('requestServerSession') && files.runtime.includes('credentials'),
  noTokenStorage: !files.runtime.includes("write(SESSION_KEY, credential") && !files.runtime.includes("localStorage.setItem('google"),
  setupDocs: files.docs.includes('AUTH_SESSION_SECRET') && files.docs.includes('GOOGLE_ADMIN_EMAILS')
};

const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
if (failed.length) {
  console.error(JSON.stringify({ failed }, null, 2));
  process.exit(1);
}
console.log('Google auth contract passed: server verification, secure session, role boundary and browser handoff are present.');
