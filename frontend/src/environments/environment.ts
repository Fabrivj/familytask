export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080/api',
  google: {
    clientId: '323889242549-h7odf4vu63hl0f1ld33bj259el812be3.apps.googleusercontent.com',
    redirectUri: 'http://localhost:4200/auth/callback',
    scope: 'openid email profile',
    authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  invitationTokenKey: 'invitation_token',
};
