import { CognitoAuth } from 'amazon-cognito-auth-js';

function getCognitoAuthOptions() {
  const keys = [
    'COGNITO_DOMAIN',
    'COGNITO_USER_POOL_CLIENT_ID',
    'EXTERNAL_BASE_URL',
  ];
  const defaults = [undefined, undefined, 'http://localhost:8000'];
  const values = keys.map(
    (k, i) => process.env[k] || process.env[`GATSBY_${k}`] || defaults[i]
  );
  if (values.reduce((s, v) => (v ? s + 1 : s), 0) !== keys.length) {
    throw new Error('Required auth variables missing');
  }
  const [cognitoDomain, cognitoUserPoolClientId, externalBaseUrl] = values;
  const signinRedirectUrl = `${externalBaseUrl}/callback/signin`;
  const signoutRedirectUrl = `${externalBaseUrl}/callback/signout`;
  const responseType = 'token';

  return {
    ClientId: cognitoUserPoolClientId!,
    AppWebDomain: cognitoDomain!,
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
  const auth = new CognitoAuth(getCognitoAuthOptions());
  auth.userhandler = {
    // user signed in
    onSuccess: result => {
      return result;
    },
    onFailure: err => {
      return err;
    },
  };
  return auth;
}

export interface State {
  action: string;
  graphId?: string;
}
export function getState(a: CognitoAuth): State | undefined {
  const session = getValidSession(a);
  if (!session) {
    return undefined;
  }
  const state = session.getState();
  try {
    const parts = state.split('_');
    if (parts.length === 1) {
      return {
        action: parts[0],
      };
    }
    if (parts.length === 2) {
      return {
        action: parts[0],
        graphId: parts[1],
      };
    }
  } catch {
    // nothing to do
  }
  return undefined;
}
export function setState(
  a: CognitoAuth,
  action: string,
  graphId?: string
): CognitoAuth {
  const parts = [action];
  if (graphId) {
    parts.push(graphId);
  }
  a.setState(parts.map(p => p.replace('_', '-')).join('_'));
  return a;
}

export function getValidSession(a: CognitoAuth) {
  const session = a.getSignInUserSession() || a.getCachedSession();
  if (session.isValid()) {
    return session;
  }
  return undefined;
}

export function getToken(a: CognitoAuth) {
  const session = getValidSession(a);
  if (!session) {
    return undefined;
  }
  const aToken = session.getAccessToken().getJwtToken();
  const iToken = session.getIdToken().getJwtToken();
  return aToken && aToken !== ''
    ? aToken
    : iToken && iToken !== ''
      ? iToken
      : undefined;
}
