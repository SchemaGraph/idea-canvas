import { Router } from '@reach/router';
import { CognitoAuth } from 'amazon-cognito-auth-js';
import * as React from 'react';
import { App } from '../components/app';
import { ConnectedApp } from '../components/ConnectedApp';
import { initStore } from '../store';
import { getCognitoAuth, getToken } from '../utils/auth';

// tslint:disable-next-line:no-submodule-imports
import '../normalize.css';
import '../styles.css';


const SigninCallback = () => {
  const auth = getCognitoAuth();
  const location = window.location;
  auth.userhandler = {
    // user signed in
    onSuccess: result => {
      console.log('cognitoauth signin succes', result);
    },
    onFailure: err => {
      console.log('cognitoauth signin failure', err);
    },
  };
  auth.parseCognitoWebResponse(location.href);
  const session = auth.getSignInUserSession();
  const state = session.getState();
  if (auth.isUserSignedIn() && state && state !== '') {
    replaceState(`/${state}`);
    return <ConnectedApp auth={auth} graphId={state} token={getToken(auth)} />;
  }
  replaceState('/');
  return <LocalApp auth={auth} />;
};

function replaceState(url: string, title?: string) {
  if (history) {
    history.replaceState({}, title, url);
  }
}

const SignoutCallback = () => {
  replaceState('/');
  return <LocalApp />;
};

const SignoutAction = () => {
  const auth = getCognitoAuth();
  auth.signOut();
  return <h1>SIGNOUT</h1>;
};

const LocalApp: React.SFC<{ auth?: CognitoAuth }> = ({ auth }) => (
  <App store={initStore()} auth={auth || getCognitoAuth()} />
);

export default () => (
  <Router>
    <RenderOrRedirectToLogin path="/:graphId" />
    <LocalApp path="/" />
    <SigninCallback path="/callback/signin" />
    <SignoutCallback path="/callback/signout" />
    <SignoutAction path="/action/signout" />
  </Router>
);

const RenderOrRedirectToLogin: React.SFC<{ graphId: string }> = ({
  graphId,
}) => {
  const auth = getCognitoAuth();
  // This is only available (from localStorage) if we have logged in previously
  const token = getToken(auth);
  if (!token) {
    // redirects to the login page as a side-effect :/
    (auth as any).setState(graphId);
    auth.getSession();
    return null;
  }
  // return React.cloneElement(children as any, { auth, graphId, token });
  return <ConnectedApp {...{ auth, graphId, token }} />;
};
