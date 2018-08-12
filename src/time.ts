// import { History, Location } from 'history';
// import { debounce } from 'lodash';
// import * as lz from 'lz-string';
// import { applySnapshot, onSnapshot } from 'mobx-state-tree';
// import { IStore, IStoreSnapshot } from './store';
// // var states = [];
// let currentFrame = -1;

// // onSnapshot(store, snapshot => {
// //   if (currentFrame === states.length - 1) {
// //     currentFrame++;
// //     states.push(snapshot);
// //   }
// // });

// export function decodeSnapshot(location: Location): IStoreSnapshot | undefined {
//   try {
//     return JSON.parse(
//       lz.decompressFromEncodedURIComponent(location.pathname.substr(1))
//     );
//   } catch {
//     return undefined;
//   }
// }

// export function encodeSnapshot(snapshot: IStoreSnapshot): string {
//   const sss = JSON.stringify(snapshot);
//   return lz.compressToEncodedURIComponent(sss);
// }

// export function attach(store: IStore, history: History) {
//   const snapshotter = debounce(snapshotterFactory(history), 50);
//   return onSnapshot(store, snapshot => {
//     // console.log(snapshot);
//     if (!snapshot.dragging) {
//       snapshotter(snapshot);
//     }
//   });
// }

// function snapshotterFactory(history: History) {
//   return (snapshot: IStoreSnapshot) => {
//     console.log('SNAPSHOT');
//     currentFrame++;
//     history.push(encodeSnapshot(snapshot));
//   };
// }

// export function previousState() {
//   if (currentFrame === 0) return;
//   currentFrame--;st
//   applySnapshot(store, states[currentFrame]);
// }

// export function nextState() {
//   if (currentFrame === states.length - 1) return;
//   currentFrame++;
//   applySnapshot(store, states[currentFrame]);
// }
