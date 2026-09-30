const { cookieHeader, createSession, publicUser, send, verifyGoogleCredential } = require('../../server/google-auth');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {}, { Allow: 'OPTIONS, POST' });
  if (req.method !== 'POST') return send(res, 405, { message: 'Method not allowed.' }, { Allow: 'OPTIONS, POST' });
  try {
    const credential = req.body && req.body.credential;
    const claims = await verifyGoogleCredential(credential);
    const user = publicUser(claims);
    const session = createSession(user);
    return send(res, 200, { user }, { 'Set-Cookie': cookieHeader(session, 60 * 60 * 24 * 7) });
  } catch (error) {
    const message = error && error.message ? error.message : 'Không thể xác thực Google.';
    const status = /chưa được cấu hình|AUTH_SESSION_SECRET/.test(message) ? 503 : 401;
    return send(res, status, { message });
  }
};
