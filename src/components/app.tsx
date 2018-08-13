import { CognitoAuth } from 'amazon-cognito-auth-js';
import { Provider } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import * as React from 'react';
import { Canvas } from '../components/canvas';
import { Toolbar } from '../components/toolbar';
import Layout from '../layouts';
import { IStore } from '../store';

interface StraightProps {
  store: IStore;
  auth: CognitoAuth;
  dev?: boolean;
}

export const App: React.SFC<StraightProps> = ({ store, auth, dev }) => {
  const handleSignout = () => {
    if (auth.isUserSignedIn()) {
      // also redirects
      auth.signOut();
    }
  };
  return (
    <Provider store={store}>
      <Layout>
        <Toolbar
          onSignOut={handleSignout}
          signedIn={auth && auth.isUserSignedIn()}
        />
        <Canvas />
        {dev && <DevTools />}
      </Layout>
    </Provider>
  );
};
