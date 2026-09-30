const crypto = require('node:crypto');

const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const SESSION_COOKIE = 'narrative_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

let cachedKeys = null;
let cachedKeysExpiresAt = 0;

function base64UrlDecode(value) {
  return Buffer.from(String(value).replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (String(value).length % 4)) % 4), 'base64');
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function json(value) {
  return JSON.stringify(value);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function configuredClientId() {
  return String(process.env.GOOGLE_CLIENT_ID || process.env.PUBLIC_GOOGLE_CLIENT_ID || '').trim();
}

function configuredAdminEmails() {
  return String(process.env.GOOGLE_ADMIN_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
}

function getRole(email) {
  return configuredAdminEmails().includes(normalizeEmail(email)) ? 'admin' : 'customer';
}

function sessionSecret() {
  return String(process.env.AUTH_SESSION_SECRET || '').trim();
}

function signSession(payload) {
  const encoded = base64UrlEncode(Buffer.from(json(payload), 'utf8'));
  const signature = crypto.createHmac('sha256', sessionSecret()).update(encoded).digest();
  return encoded + '.' + base64UrlEncode(signature);
}

function verifySession(value) {
  if (!value || !sessionSecret()) return null;
  const parts = String(value).split('.');
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac('sha256', sessionSecret()).update(parts[0]).digest();
  const actual = base64UrlDecode(parts[1]);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[0]).toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

function parseCookies(header) {
  return String(header || '').split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return cookies;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function cookieHeader(value, maxAge) {
  return SESSION_COOKIE + '=' + (value || '') + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + String(maxAge);
}

function publicUser(claims) {
  return {
    id: String(claims.sub),
    name: String(claims.name || claims.email.split('@')[0]),
    email: normalizeEmail(claims.email),
    role: getRole(claims.email),
    provider: 'google',
    picture: String(claims.picture || '')
  };
}

async function googleKeys(forceRefresh) {
  if (!forceRefresh && cachedKeys && cachedKeysExpiresAt > Date.now()) return cachedKeys;
  const response = await fetch(CERTS_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Không tải được khóa xác thực Google.');
  const payload = await response.json();
  if (!Array.isArray(payload.keys)) throw new Error('Phản hồi khóa Google không hợp lệ.');
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAge = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedKeys = payload.keys;
  cachedKeysExpiresAt = Date.now() + Math.max(60, Math.min(maxAge, 86400)) * 1000;
  return cachedKeys;
}

async function verifyGoogleCredential(credential) {
  const clientId = configuredClientId();
  if (!clientId) throw new Error('Google OAuth chưa được cấu hình trên server.');
  const parts = String(credential || '').split('.');
  if (parts.length !== 3) throw new Error('Credential Google không hợp lệ.');
  let header;
  let claims;
  try {
    header = JSON.parse(base64UrlDecode(parts[0]).toString('utf8'));
    claims = JSON.parse(base64UrlDecode(parts[1]).toString('utf8'));
  } catch (error) {
    throw new Error('Credential Google không thể đọc.');
  }
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Thuật toán credential Google không hợp lệ.');
  const findKey = (keys) => keys.find((key) => key.kid === header.kid);
  let key = findKey(await googleKeys(false));
  if (!key) key = findKey(await googleKeys(true));
  if (!key) throw new Error('Không tìm thấy khóa ký credential Google.');
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(parts[0] + '.' + parts[1]);
  verifier.end();
  if (!verifier.verify(crypto.createPublicKey({ key, format: 'jwk' }), base64UrlDecode(parts[2]))) throw new Error('Chữ ký credential Google không hợp lệ.');
  const now = Math.floor(Date.now() / 1000);
  const issuerValid = claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com';
  const audienceValid = Array.isArray(claims.aud) ? claims.aud.includes(clientId) : claims.aud === clientId;
  if (!issuerValid || !audienceValid || !claims.sub || !claims.email || claims.email_verified !== true || !claims.exp || claims.exp <= now || (claims.iat && claims.iat > now + 300)) {
    throw new Error('Credential Google đã hết hạn hoặc không dành cho ứng dụng này.');
  }
  return claims;
}

function requireSession(req) {
  return verifySession(parseCookies(req.headers && req.headers.cookie)[SESSION_COOKIE]);
}

function createSession(user) {
  if (!sessionSecret()) throw new Error('AUTH_SESSION_SECRET chưa được cấu hình trên server.');
  const now = Math.floor(Date.now() / 1000);
  return signSession({ ...user, iat: now, exp: now + SESSION_MAX_AGE });
}

function send(res, status, body, headers) {
  res.statusCode = status;
  Object.entries({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }).forEach(([key, value]) => res.setHeader(key, value));
  res.end(json(body));
}

module.exports = {
  SESSION_COOKIE,
  cookieHeader,
  configuredClientId,
  createSession,
  json,
  parseCookies,
  publicUser,
  requireSession,
  send,
  sessionSecret,
  verifyGoogleCredential
};
