import { CognitoAuth } from 'amazon-cognito-auth-js';

function getCognitoAuthOptions() {
  const keys = [
    'COGNITO_DOMAIN',
    'COGNITO_USER_POOL_CLIENT_ID',
    'EXTERNAL_BASE_URL',
  ];
  const defaults = [undefined, undefined, 'http://localhost:8000'];
  const values = keys.map(
    (k,i) => process.env[k] || process.env[`GATSBY_${k}`] || defaults[i]
  );
  if (values.reduce((s, v) => v ? s + 1 : s, 0) !== keys.length) {
    throw new Error('Required auth variables missing');
  }
  const [cognitoDomain, cognitoUserPoolClientId, externalBaseUrl] = values;
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

export function getToken(a: CognitoAuth) {
  const session = a.getSignInUserSession();
  if (!session.isValid()) {
    return undefined;
  }
  const aToken = session.getAccessToken().jwtToken;
  const iToken = session.getIdToken().jwtToken;
  return aToken && aToken !== ''
    ? aToken
    : iToken && iToken !== ''
      ? iToken
      : undefined;
}
