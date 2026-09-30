const { publicUser, requireSession, send } = require('../../server/google-auth');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { message: 'Method not allowed.' }, { Allow: 'GET' });
  const session = requireSession(req);
  if (!session) return send(res, 401, { message: 'Chưa có phiên Google hợp lệ.' });
  return send(res, 200, { user: publicUser(session) });
};
