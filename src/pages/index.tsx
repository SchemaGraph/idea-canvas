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

// tslint:disable-next-line:no-empty-interface
// interface Props {}
// interface State {
//   initialized: boolean;
// }
// export default class App extends React.Component<Props, State> {
//   state = {
//     initialized: false,
//   };

//   constructor(props: Props) {
//     super(props);
//   }

//   async componentDidMount() {
//     await init('ohlalaa');
//     this.setState({ initialized: true });
//   }
//   render() {
//     return (
//       this.state.initialized && (
//         <Provider store={store}>
//           <Layout>
//             <Toolbar />
//             <Canvas />
//             {/* <Info/> */}
//             {/* <DevTools /> */}
//           </Layout>
//         </Provider>
//       )
//     );
//   }
// }
init('yebba4');

export default () => (
  <Provider store={store}>
    <Layout>
      <Toolbar />
      <Canvas />
      {/* <Info/> */}
      {/* <DevTools /> */}
    </Layout>
  </Provider>
);
