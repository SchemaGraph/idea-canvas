import { CognitoAuth } from 'amazon-cognito-auth-js';
import { Provider } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import * as React from 'react';
import { Canvas } from '../components/canvas';
import { Toolbar } from '../components/toolbar';
import Layout from '../layouts';
import { IStore } from '../store';
import { Info } from './Info';
import { attachUndoManager, IUndoManager, UndoRedo } from './time-traveller';
import { TOOL_ADD_NODE } from './toolbar/constants';

interface StraightProps {
  store: IStore;
  auth: CognitoAuth;
  dev?: boolean;
  undoredo?: boolean;
}

export const App: React.SFC<StraightProps> = ({
  store,
  auth,
  undoredo,
  dev,
}) => {
  const handleSignout = () => {
    if (auth.isUserSignedIn()) {
      // also redirects
      auth.signOut();
    }
  };
  if (store.boxes.size === 0) {
    // Select the 'ADD' tool as the default one for an empty diagram
    store.setTool(TOOL_ADD_NODE);
  }
  let undoManager: IUndoManager | undefined;
  if (undoredo) {
    undoManager = attachUndoManager(store);
  }
  return (
    <Provider store={store}>
      <Layout>
        <Canvas />
        <Toolbar
          onSignOut={handleSignout}
          signedIn={auth && auth.isUserSignedIn()}
        />
        <Info />
        {undoManager && <UndoRedo manager={undoManager} />}
        {dev && <DevTools />}
      </Layout>
    </Provider>
  );
};
