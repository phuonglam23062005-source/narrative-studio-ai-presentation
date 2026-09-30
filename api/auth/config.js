const { configuredClientId, send } = require('../../server/google-auth');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { message: 'Method not allowed.' }, { Allow: 'GET' });
  return send(res, 200, {
    googleClientId: configuredClientId(),
    googleVerifyEndpoint: '/api/auth/google',
    googleSessionEndpoint: '/api/auth/session',
    googleLogoutEndpoint: '/api/auth/logout',
    serverAuth: Boolean(configuredClientId() && process.env.AUTH_SESSION_SECRET)
  });
};
