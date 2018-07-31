// import createHashHistory from 'history/createHashHistory';
import { Provider } from 'mobx-react';
// import DevTools from 'mobx-react-devtools';
// import { applySnapshot } from 'mobx-state-tree';
import * as React from 'react';
import { Canvas } from '../components/canvas';
import { Toolbar } from '../components/toolbar';
// import { Info } from '../components/Info';
import Layout from '../layouts';
import { store } from '../store';
// import { attach, decodeSnapshot } from '../time';

// tslint:disable-next-line:no-submodule-imports
import '../normalize.css';
import '../styles.css';

// function initializeHistory() {
//   const history = createHashHistory();
//   const initialLocation = history.location;
//   const initialPath = initialLocation.pathname;
//   if (initialPath && initialPath.length > 3) {
//     applySnapshot(store, decodeSnapshot(initialLocation));
//   }

//   let snapshotListenerDisposer = attach(store, history);
//   history.listen((location, action) => {
//     if (action === 'POP') {
//       const snapshot = decodeSnapshot(location);
//       if (snapshot) {
//         snapshotListenerDisposer();
//         applySnapshot(store, snapshot);
//         snapshotListenerDisposer = attach(store, history);
//       }
//     }
//   });
// }

export default () => (
  <Provider store={store}>
    <Layout>
      {/* <Controls /> */}
      <Toolbar />
      <Canvas />
      {/* <Init /> */}
      {/* <Info/> */}
      {/* {DevTools && <DevTools />} */}
    </Layout>
  </Provider>
);
