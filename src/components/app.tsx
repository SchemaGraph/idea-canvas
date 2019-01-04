import { CognitoAuth } from 'amazon-cognito-auth-js';
import { Provider } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import * as React from 'react';
import { Canvas } from './canvas/canvas';
import { Toolbar } from '../components/toolbar';
import Layout from '../layouts';
import { IStore } from '../models/store';
import { UndoRedo } from './time-traveller';
import { TOOL_ADD_NODE } from './toolbar/constants';
import { ContextList } from './context-list';
import { Sidebar, Mainbar, MenuButton } from './sidebar/sidebar-right';
import styled from 'styled-components';
import { mobileOnly } from '../theme/theme';
import { EditDialog } from './edit-dialog';
import { SimulationCanvas } from './canvas/simulation-canvas';
import SplitPane from '../utils/splitter';
import { connect } from '../utils';
import { FunctionComponent, useRef, useEffect } from 'react';
import useComponentSize from '@rehooks/component-size';
import { observer } from 'mobx-react-lite';
import { SidebarLeft } from './sidebar/sidebar-left';
interface Props {
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

const WrapWithPanes: FunctionComponent<{
  isMobile: boolean;
  empty: boolean;
}> = ({ empty, isMobile, children }) => {
  if (empty) {
    return null;
  }

  if (isMobile) {
    return <>{children}</>;
  }
  return (
    <SplitPane sizes={[0, 100, 0]} minSize={[0, 300, 170]} gutterSize={6}>
      <SidebarLeft/>
      <Mainbar>{children}</Mainbar>
      <Sidebar />
    </SplitPane>
  );
};

const AppBase: FunctionComponent<Props> = ({
  store,
  auth,
  undoredo,
  dev,
  location,
}) => {
  console.log('MAIN');
  const layoutRef = useRef<HTMLDivElement>(null);
  const { width, height } = useComponentSize(layoutRef);
  useEffect(
    () => {
      store.setAppDimensions(width, height);
    },
    [width, height]
  );

  const handleSignout = () => {
    if (auth.isUserSignedIn()) {
      // also redirects
      auth.signOut();
    }
  };
  const { undoManager, isMobile } = store;

  return (
    <Provider store={store}>
      <Layout location={location} ref={layoutRef}>
        <WrapWithPanes isMobile={!!isMobile} empty={isMobile === undefined || width === 0 || height === 0}>
          <Canvas />
          <Toolbar
            onSignOut={handleSignout}
            signedIn={auth && auth.isUserSignedIn()}
          />
          <ContextList />
          {undoManager && <UndoRedo manager={undoManager} />}
          {dev && <DevTools />}
        </WrapWithPanes>
      </Layout>
    </Provider>
  );
};

export const App = connect<Props>((store, props) => ({
  store,
  ...props,
}))(observer(AppBase));
