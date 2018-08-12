import { CognitoAuth } from 'amazon-cognito-auth-js';

function getCognitoAuthOptions() {
  const cognitoDomain = process.env.COGNITO_DOMAIN;
  const cognitoUserPoolClientId = process.env.COGNITO_USER_POOL_CLIENT_ID;
  const externalBaseUrl =
    process.env.EXTERNAL_BASE_URL || 'http://localhost:8000';
  const signinRedirectUrl = `${externalBaseUrl}/signin`;
  const signoutRedirectUrl = `${externalBaseUrl}/signout`;
  const responseType = 'token';

  return {
    ClientId: cognitoUserPoolClientId,
    AppWebDomain: cognitoDomain,
    RedirectUriSignIn: signinRedirectUrl,
    RedirectUriSignOut: signoutRedirectUrl,
    ResponseType: responseType,
    TokenScopesArray: [
      // 'phone',
      'email',
      // 'profile',
      'openid',
      // 'aws.cognito.signin.user.admin',
    ],
  };
}

export function getCognitoAuth() {
  return new CognitoAuth(getCognitoAuthOptions());
}
