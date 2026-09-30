/* Public, non-secret auth configuration. Replace placeholders only after setting up OAuth/server verification. */
window.NarrativeAuthConfig = Object.freeze({
  googleClientId: '',
  googleVerifyEndpoint: '/api/auth/google',
  googleConfigEndpoint: '/api/auth/config',
  googleSessionEndpoint: '/api/auth/session',
  googleLogoutEndpoint: '/api/auth/logout',
  serverAuth: false,
  localAdminEmails: []
});
