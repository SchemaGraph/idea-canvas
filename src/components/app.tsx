import { CognitoAuth } from 'amazon-cognito-auth-js';
import { Provider } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import * as React from 'react';
import { Canvas } from '../components/canvas';
import { Toolbar } from '../components/toolbar';
import Layout from '../layouts';
import { IStore } from '../store';
import { attachUndoManager, IUndoManager, UndoRedo } from './time-traveller';
import { TOOL_ADD_NODE } from './toolbar/constants';
import { ContextList } from './context-list';
import { Sidebar, Mainbar, MenuButton } from './sidebar-right';
import styled from 'styled-components';
import { mobileOnly } from '../theme/theme';
import { EditDialog } from './edit-dialog';

interface StraightProps {
  store: IStore;
  auth: CognitoAuth;
  location?: Location;
  dev?: boolean;
  undoredo?: boolean;
}

const MButton = styled(MenuButton)`
  position: absolute;
  left: 10px;
  top: 100px;
  ${mobileOnly`
      display: none !important;
    `};
`;

export const App: React.SFC<StraightProps> = ({
  store,
  auth,
  undoredo,
  dev,
  location,
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
      <Layout location={location}>
        <Mainbar>
          <Canvas />
          {/* <MButton /> */}
          <Toolbar
            onSignOut={handleSignout}
            signedIn={auth && auth.isUserSignedIn()}
          />
          <ContextList />
          {undoManager && <UndoRedo manager={undoManager} />}
          {dev && <DevTools />}
          {<EditDialog />}
        </Mainbar>
        <Sidebar />
      </Layout>
    </Provider>
  );
};
