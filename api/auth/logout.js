const { cookieHeader, send } = require('../../server/google-auth');

module.exports = function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { message: 'Method not allowed.' }, { Allow: 'POST' });
  return send(res, 200, { ok: true }, { 'Set-Cookie': cookieHeader('', 0) });
};
