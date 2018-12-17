import { Router } from '@reach/router';
import { CognitoAuth } from 'amazon-cognito-auth-js';
import * as React from 'react';
import { App } from '../components/app';
import { ConnectedApp } from '../components/connected-app';
import { initStore, localClear, localLoad } from '../store';
import {
  getCognitoAuth,
  getState,
  getToken,
  getValidSession,
  setState,
  CognitoOptions,
} from '../utils/auth';
import { graphql } from 'gatsby';

// tslint:disable-next-line:no-submodule-imports
import '../normalize.css';
import '../styles.css';

const ACTION_SIGNIN = 'signin';
const ACTION_SIGNOUT = 'signout';
const ACTION_GRAPH = 'graph';
const SigninCallback: React.SFC<{ auth: CognitoAuth; location?: Location }> = ({
  auth,
  location,
}) => {
  let error: any = {};
  if (location) {
    // const location = window.location;
    error = auth.parseCognitoWebResponse(location.href);
    const state = getState(auth);
    const token = getToken(auth);
    if (token && state) {
      const { action, graphId } = state;
      if (action === ACTION_GRAPH && graphId) {
        replaceState(`/${graphId}`);
        return <ConnectedApp auth={auth} graphId={graphId} token={token} />;
      } else if (action === ACTION_SIGNIN) {
        replaceState(`/`);
        return <Profile auth={auth} />;
      } else {
        replaceState(`/`);
        return <LocalApp auth={auth} />;
      }
    }
  }
  return (
    <div>
      <h1>Sign in failed </h1>
      <pre>{JSON.stringify(error, undefined, 2)}</pre>
    </div>
  );
};

function replaceState(url: string, title?: string) {
  if (history) {
    history.replaceState({}, title || 'unknown', url);
  }
}

const SignoutCallback = ({ auth }: { auth: CognitoAuth }) => {
  // const auth = getCognitoAuth();
  // const state = getState(auth);
  // if (state) {
  //   // Trying to re-signin
  //   if (state.action === ACTION_SIGNIN) {

  //   }
  // }
  replaceState('/');
  return <LocalApp auth={auth} />;
};

const SignoutAction = ({ auth }: { auth: CognitoAuth }) => {
  setState(auth, ACTION_SIGNOUT).signOut();
  return <h1>SIGNOUT</h1>;
};

const SigninAction = ({ auth }: { auth: CognitoAuth }) => {
  setState(auth, ACTION_SIGNIN);
  // Redirects if not logged in!
  const session: string = auth.getSession() as any;
  if (session) {
    return <Profile auth={auth} />;
  }
  return (
    <div>
      <h1>Redirecting to the sign-in page...</h1>
    </div>
  );
};

const LocalApp: React.SFC<{ auth: CognitoAuth; location?: Location }> = ({
  auth,
  location,
}) => {
  const store = initStore();
  localLoad(store);
  return <App store={store} auth={auth} undoredo={true} location={location} />;
};

const NewLocalApp: React.SFC<{ auth: CognitoAuth; location?: Location }> = ({
  auth,
  location,
}) => {
  localClear();
  replaceState(`/`);
  return <LocalApp auth={auth} location={location} />;
};

const Profile: React.SFC<{ auth: CognitoAuth }> = ({ auth }) => {
  const session = getValidSession(auth);
  if (!session) {
    return (
      <div>
        <h1>Not signed in</h1>
      </div>
    );
  }
  return (
    <div>
      <h1>Signed in</h1>
      <pre>
        {JSON.stringify(session.getIdToken().decodePayload(), undefined, 2)}
      </pre>
    </div>
  );
};

const CurrentProfile = ({ auth }: { auth: CognitoAuth }) => (
  <Profile auth={auth} />
);

const RenderOrRedirectToLogin: React.SFC<{
  auth: CognitoAuth;
  graphId?: string;
  location?: Location;
}> = ({ auth, graphId, location }) => {
  if (!graphId) {
    return null;
  }
  // This is only available (from localStorage) if we have logged in previously
  const token = getToken(auth);
  if (!token) {
    // redirects to the login page as a side-effect :/
    setState(auth, ACTION_GRAPH, graphId).getSession();

    return null;
  }
  // return React.cloneElement(children as any, { auth, graphId, token });
  return <ConnectedApp {...{ auth, graphId, token, location }} />;
};

export default ({
  data: {
    site: { siteMetadata },
  },
}: {
  data: {
    site: {
      siteMetadata: CognitoOptions;
    };
  };
}) => {
  const auth = getCognitoAuth(siteMetadata);
  return (
    <Router>
      <RenderOrRedirectToLogin auth={auth} path="/:graphId" />
      <LocalApp auth={auth} path="/" />
      <NewLocalApp auth={auth} path="/action/new" />
      <SigninCallback auth={auth} path="/callback/signin" />
      <SignoutCallback auth={auth} path="/callback/signout" />
      <SignoutAction auth={auth} path="/action/signout" />
      <SigninAction auth={auth} path="/action/signin" />
      <CurrentProfile auth={auth} path="/action/profile" />
    </Router>
  );
};

export const query = graphql`
  query {
    site {
      siteMetadata {
        cognitoDomain
        cognitoUserPoolClientId
        externalBaseUrl
      }
    }
  }
`;
