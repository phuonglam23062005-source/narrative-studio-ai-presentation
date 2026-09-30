/* Auth boundary: local demo accounts plus an explicit Google OAuth adapter. */
(function () {
  var USERS_KEY = 'narrative-studio.users.v1';
  var SESSION_KEY = 'narrative-studio.session.v1';
  var foundation = window.NarrativeFoundation;
  var storage = foundation && foundation.storage ? foundation.storage : window.localStorage;
  var config = window.NarrativeAuthConfig || {};
  var googleScriptPromise = null;
  var bound = false;

  function byId(id) { return document.getElementById(id); }
  function read(key, fallback) {
    try { var value = storage.getItem(key); return value ? JSON.parse(value) : fallback; } catch (error) { return fallback; }
  }
  function write(key, value) { storage.setItem(key, JSON.stringify(value)); }
  function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
  function normalizeRole(value) { return String(value || '').toLowerCase() === 'admin' ? 'admin' : 'customer'; }
  function roleLabel(role) { return normalizeRole(role) === 'admin' ? 'Quản trị viên' : 'Khách hàng'; }
  function configuredAdminEmails() {
    var source = Array.isArray(config.localAdminEmails) ? config.localAdminEmails : String(config.localAdminEmails || '').split(',');
    return source.map(normalizeEmail).filter(Boolean);
  }
  function isLocalAdminEmail(email) { return configuredAdminEmails().indexOf(normalizeEmail(email)) !== -1; }
  function publicUser(user) {
    user = user || {};
    return {
      id: user.id || ('user_' + Date.now()),
      name: String(user.name || user.email || 'Người dùng').trim(),
      email: normalizeEmail(user.email),
      role: normalizeRole(user.role),
      provider: user.provider || 'local',
      picture: user.picture || ''
    };
  }
  function currentSession() { return read(SESSION_KEY, null); }
  function currentUser() {
    var session = currentSession();
    if (!session || !session.email) return null;
    if (session.name || session.role || session.provider === 'google') return publicUser(session);
    var user = read(USERS_KEY, []).find(function (candidate) { return candidate.email === session.email; });
    return user ? publicUser(user) : null;
  }
  function setStatus(message, tone) {
    var status = byId('authStatus');
    if (!status) return;
    status.textContent = message || '';
    status.className = 'auth-status' + (tone ? ' ' + tone : '');
  }
  function setGoogleStatus(message, tone) {
    var status = byId('googleAuthStatus');
    if (!status) return;
    status.textContent = message || '';
    status.className = 'google-auth-status' + (tone ? ' ' + tone : '');
  }
  function googleReadyConfig() {
    return Boolean(String(config.googleClientId || '').trim() && String(config.googleVerifyEndpoint || '').trim());
  }
  function setRoleUI(user) {
    var role = normalizeRole(user && user.role);
    document.body.classList.remove('role-admin', 'role-customer');
    document.body.classList.add('role-' + role);
    var badge = byId('roleBadge');
    var pill = byId('rolePill');
    [badge, pill].forEach(function (node) {
      if (!node) return;
      node.textContent = roleLabel(role);
      node.className = node.id === 'rolePill' ? 'role-pill ' + role : 'role-badge ' + role;
    });
    var name = user && (user.name || user.email) ? (user.name || user.email.split('@')[0]) : 'Người dùng';
    if (byId('userName')) byId('userName').textContent = name;
    if (byId('userEmail')) byId('userEmail').textContent = user.email || '';
    if (byId('userAvatar')) byId('userAvatar').textContent = name.slice(0, 2).toUpperCase();
    var adminNav = document.querySelector('.admin-only.role-nav');
    if (adminNav) adminNav.setAttribute('aria-hidden', String(role !== 'admin'));
    renderAdminDashboard(user);
  }
  function clearUserUI() {
    if (byId('userName')) byId('userName').textContent = 'Chưa đăng nhập';
    if (byId('userEmail')) byId('userEmail').textContent = 'Phiên đã đóng';
    if (byId('userAvatar')) byId('userAvatar').textContent = '—';
    if (byId('roleBadge')) { byId('roleBadge').textContent = 'Khách hàng'; byId('roleBadge').className = 'role-badge customer'; }
    if (byId('rolePill')) { byId('rolePill').textContent = 'Khách hàng'; byId('rolePill').className = 'role-pill customer'; }
    renderAdminDashboard(null);
  }
  function showApp(user) {
    user = publicUser(user);
    document.body.classList.remove('auth-locked');
    byId('authGate').classList.add('hidden');
    setRoleUI(user);
    window.dispatchEvent(new CustomEvent('narrative:authenticated', { detail: user }));
  }
  function showAuth(mode) {
    document.body.classList.add('auth-locked');
    document.body.classList.remove('role-admin', 'role-customer');
    clearUserUI();
    byId('authGate').classList.remove('hidden');
    var login = mode !== 'register';
    byId('loginForm').classList.toggle('hidden', !login);
    byId('registerForm').classList.toggle('hidden', login);
    byId('showLoginBtn').classList.toggle('active', login);
    byId('showRegisterBtn').classList.toggle('active', !login);
    byId('showLoginBtn').setAttribute('aria-selected', String(login));
    byId('showRegisterBtn').setAttribute('aria-selected', String(!login));
  }
  function digest(value) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      var bytes = new TextEncoder().encode(value);
      return window.crypto.subtle.digest('SHA-256', bytes).then(function (buffer) {
        return Array.from(new Uint8Array(buffer)).map(function (part) { return part.toString(16).padStart(2, '0'); }).join('');
      });
    }
    return Promise.resolve('local-' + btoa(unescape(encodeURIComponent(value))));
  }
  function loadGoogleScript() {
    if (window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve();
    if (googleScriptPromise) return googleScriptPromise;
    googleScriptPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error('Không tải được Google Identity Services.')); };
      document.head.appendChild(script);
    });
    return googleScriptPromise;
  }
  function handleGoogleCredential(response) {
    var credential = response && response.credential;
    if (!credential) return setGoogleStatus('Google không trả về credential hợp lệ.', 'error');
    var endpoint = String(config.googleVerifyEndpoint || '').trim();
    if (!endpoint) return setGoogleStatus('Đã nhận credential Google, nhưng chưa có endpoint server để xác thực. Chưa đăng nhập.', 'error');
    setGoogleStatus('Đang xác thực tài khoản Google trên server…', 'pending');
    fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ credential: credential })
    }).then(function (result) {
      return result.json().catch(function () { return {}; }).then(function (payload) {
        if (!result.ok) throw new Error(payload.message || 'Server từ chối credential Google.');
        return payload;
      });
    }).then(function (payload) {
      var verified = payload.user || payload;
      if (!verified.email) throw new Error('Server chưa trả về user email đã xác thực.');
      var user = publicUser({
        id: verified.id || verified.sub || verified.googleSub,
        name: verified.name || verified.email.split('@')[0],
        email: verified.email,
        role: verified.role,
        provider: 'google',
        picture: verified.picture
      });
      if (!user.id) throw new Error('Server chưa trả về định danh tài khoản.');
      write(SESSION_KEY, { provider: 'google', id: user.id, name: user.name, email: user.email, role: user.role, picture: user.picture, signedInAt: new Date().toISOString() });
      setGoogleStatus('Đăng nhập Google thành công.', 'success');
      showApp(user);
    }).catch(function (error) {
      setGoogleStatus(error.message || 'Không thể xác thực Google.', 'error');
    });
  }
  function setupGoogle() {
    var host = byId('googleButton');
    var fallback = byId('googleUnavailableButton');
    if (!host || !fallback) return;
    var clientId = String(config.googleClientId || '').trim();
    if (!clientId) {
      host.classList.add('hidden');
      fallback.classList.remove('hidden');
      setGoogleStatus('Google OAuth chưa được cấu hình cho bản local.');
      return;
    }
    loadGoogleScript().then(function () {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) throw new Error('Google Identity Services chưa sẵn sàng.');
      window.google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleCredential, cancel_on_tap_outside: true, context: 'signin' });
      host.innerHTML = '';
      window.google.accounts.id.renderButton(host, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', locale: 'vi', width: 360 });
      fallback.classList.add('hidden');
      setGoogleStatus(googleReadyConfig() ? 'Google đã sẵn sàng; role do server quyết định.' : 'Đã tải nút Google; cần endpoint server verify trước khi đăng nhập.', googleReadyConfig() ? 'success' : 'pending');
    }).catch(function (error) {
      host.classList.add('hidden');
      fallback.classList.remove('hidden');
      setGoogleStatus(error.message || 'Không thể tải Google Identity Services.', 'error');
    });
  }
  function makeText(tag, text, className) {
    var node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function renderAdminDashboard(user) {
    var list = byId('adminUserList');
    var count = byId('adminLocalUserCount');
    var identity = byId('adminIdentity');
    var identityMeta = byId('adminIdentityMeta');
    var googleStatus = byId('adminGoogleStatus');
    var googleMeta = byId('adminGoogleMeta');
    var welcome = byId('adminWelcome');
    var users = read(USERS_KEY, []).map(publicUser);
    if (user && user.provider === 'google' && !users.some(function (candidate) { return candidate.email === user.email; })) users.push(user);
    if (count) count.textContent = String(users.length);
    if (identity) identity.textContent = user ? (user.name || user.email) : '—';
    if (identityMeta) identityMeta.textContent = user ? user.email + ' · ' + roleLabel(user.role) : 'Chưa đăng nhập';
    if (welcome && user) welcome.textContent = 'Xin chào, ' + (user.name || user.email) + ' · khu vực quản trị';
    if (googleStatus) googleStatus.textContent = googleReadyConfig() ? 'Sẵn sàng' : 'Chưa cấu hình';
    if (googleMeta) googleMeta.textContent = googleReadyConfig() ? 'Credential được gửi tới endpoint verify server.' : 'Cần client ID và endpoint verify server.';
    if (!list) return;
    list.innerHTML = '';
    if (!users.length) {
      list.appendChild(makeText('p', 'Chưa có tài khoản local nào.', 'admin-empty'));
      return;
    }
    users.forEach(function (candidate) {
      var row = document.createElement('div');
      row.className = 'admin-user-row';
      var identityNode = document.createElement('div');
      identityNode.appendChild(makeText('strong', candidate.name));
      identityNode.appendChild(makeText('span', candidate.email));
      row.appendChild(identityNode);
      row.appendChild(makeText('em', roleLabel(candidate.role), 'role-badge ' + candidate.role));
      list.appendChild(row);
    });
  }
  function registerLocal(event) {
    event.preventDefault();
    var name = byId('registerName').value.trim();
    var email = normalizeEmail(byId('registerEmail').value);
    var password = byId('registerPassword').value;
    if (!name || !email || password.length < 6) return setStatus('Điền đủ thông tin; mật khẩu cần ít nhất 6 ký tự.', 'error');
    var users = read(USERS_KEY, []);
    if (users.some(function (user) { return user.email === email; })) return setStatus('Email này đã có trong trình duyệt. Hãy đăng nhập.', 'error');
    return digest(password).then(function (passwordHash) {
      users.push({ id: 'user_' + Date.now(), name: name, email: email, role: isLocalAdminEmail(email) ? 'admin' : 'customer', passwordHash: passwordHash, createdAt: new Date().toISOString() });
      write(USERS_KEY, users);
      byId('loginEmail').value = email;
      byId('loginPassword').value = '';
      showAuth('login');
      setStatus('Tạo tài khoản thành công. Đăng nhập để bắt đầu.', 'success');
    });
  }
  function loginLocal(event) {
    event.preventDefault();
    var email = normalizeEmail(byId('loginEmail').value);
    var password = byId('loginPassword').value;
    var user = read(USERS_KEY, []).find(function (candidate) { return candidate.email === email; });
    if (!user) return setStatus('Email hoặc mật khẩu chưa đúng.', 'error');
    return digest(password).then(function (passwordHash) {
      if (user.passwordHash !== passwordHash) return setStatus('Email hoặc mật khẩu chưa đúng.', 'error');
      var role = isLocalAdminEmail(email) ? 'admin' : 'customer';
      user.role = role;
      write(USERS_KEY, read(USERS_KEY, []).map(function (candidate) { return candidate.email === email ? user : candidate; }));
      var sessionUser = publicUser({ id: user.id, name: user.name, email: user.email, role: role, provider: 'local' });
      write(SESSION_KEY, { provider: 'local', id: sessionUser.id, name: sessionUser.name, email: sessionUser.email, role: sessionUser.role, signedInAt: new Date().toISOString() });
      setStatus('');
      showApp(sessionUser);
    });
  }
  function bind() {
    if (bound) return;
    bound = true;
    var sessionUser = currentUser();
    if (sessionUser) showApp(sessionUser); else showAuth('login');
    byId('showLoginBtn').addEventListener('click', function () { setStatus(''); showAuth('login'); });
    byId('showRegisterBtn').addEventListener('click', function () { setStatus(''); showAuth('register'); });
    byId('registerForm').addEventListener('submit', registerLocal);
    byId('loginForm').addEventListener('submit', loginLocal);
    byId('logoutBtn').addEventListener('click', function () {
      storage.removeItem(SESSION_KEY);
      showAuth('login');
      setStatus('Đã đăng xuất khỏi tài khoản.', 'success');
    });
    setupGoogle();
  }

  window.NarrativeAuth = Object.freeze({
    version: 'auth-boundary.v2',
    currentSession: currentSession,
    currentUser: currentUser,
    isAdmin: function () { var user = currentUser(); return Boolean(user && user.role === 'admin'); },
    googleConfigured: googleReadyConfig
  });
  bind();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
})();
