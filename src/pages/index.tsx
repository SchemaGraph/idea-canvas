// import createHashHistory from 'history/createHashHistory';
import { Provider } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
// import { applySnapshot } from 'mobx-state-tree';
import * as React from 'react';
import { Canvas } from '../components/canvas';
import { Toolbar } from '../components/toolbar';
// import { Info } from '../components/Info';
import Layout from '../layouts';
import { init, store } from '../store';
// import { attach, decodeSnapshot } from '../time';

// tslint:disable-next-line:no-submodule-imports
import '../normalize.css';
import '../styles.css';

const dev = process.env.NODE_ENV !== 'production';
init('yebba4', dev);

export default () => (
  <Provider store={store}>
    <Layout>
      <Toolbar />
      <Canvas />
      {/* <Info/> */}
      {dev && <DevTools />}
    </Layout>
  </Provider>
);
