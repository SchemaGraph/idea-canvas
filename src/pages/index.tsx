// import { Authenticator, withAuthenticator } from 'aws-amplify-react';
import { Redirect, Router } from '@reach/router';
import { CognitoAuth } from 'amazon-cognito-auth-js';
import { AUTH_TYPE } from 'aws-appsync';
import * as React from 'react';
import { getApolloClient } from '../appsync/client';
import { AppSyncConf } from '../appsync/config';
import { App } from '../components/app';
import { initStore, IStore, load } from '../store';
import { getCognitoAuth, getToken } from '../utils/auth';

// tslint:disable-next-line:no-submodule-imports
import '../normalize.css';
import '../styles.css';

const dev = process.env.NODE_ENV !== 'production';
// init('yebba4', dev);

interface State {
  store?: IStore;
  auth?: CognitoAuth;
}

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
    return <ConnectedApp auth={auth} graphId={state} />;
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
    <ConnectedApp path="/:graphId" />
    <LocalApp path="/" />
    <SigninCallback path="/callback/signin" />
    <SignoutCallback path="/callback/signout" />
    <SignoutAction path="/action/signout" />
  </Router>
);
interface Props {
  graphId?: string;
  auth?: CognitoAuth;
}

// tslint:disable-next-line:max-classes-per-file
class ConnectedApp extends React.Component<Props, State> {
  state: State = {};

  async componentDidMount() {
    const { graphId } = this.props;
    const auth = getCognitoAuth();
    // This is only available (from localStorage) if we have logged in previously
    const token = getToken(auth);
    if (!token) {
      // redirects to the login page as a side-effect :/
      (auth as any).setState(graphId);
      auth.getSession();
      return;
    }
    const store = initStore();
    const { url, region, auth: authOptions } = AppSyncConf({
      type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
      jwtToken: () => token,
    });
    const client = getApolloClient(url, region, authOptions);
    await load(store, graphId!, client, dev);
    this.setState({ store, auth });
  }
  render() {
    let { store } = this.state;
    const auth = this.state.auth || getCognitoAuth();
    const { graphId } = this.props;
    console.log('GRAPH', graphId);
    if (!store && !graphId) {
      store = initStore();
    }
    console.log('STORE', store);
    if (!store) {
      return null;
    }
    return <App store={store} auth={auth} />;
  }
}
