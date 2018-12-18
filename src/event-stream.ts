import { IJsonPatch, ISerializedActionCall } from 'mobx-state-tree';
import { merge, Observable, of } from 'rxjs';
import {
  debounceTime,
  defaultIfEmpty,
  exhaustMap,
  filter,
  map,
  reduce,
  take,
  takeUntil,
} from 'rxjs/operators';
export interface Entry {
  patches: ReadonlyArray<IJsonPatch>;
  inversePatches: ReadonlyArray<IJsonPatch>;
  action: ISerializedActionCall;
}
export function setupPatchStream($stream: Observable<Entry>) {
  const $optimized = $stream.pipe(
    exhaustMap(x => {
      const $current = of(x);
      if (!isBoxMoveAction(x)) {
        // console.log('MERGEMAP NO');
        return $current;
      } else {
        // console.log('MERGEMAP GOT BOXMOVE');
      }
      const $notaboxmoveaction = $stream.pipe(
        filter(y => !isSameBox(x, y)),
        take(1)
      );

      const $tooslow = $stream.pipe(
        filter(y => isSameBox(x, y)),
        debounceTime(500),
        take(1)
      );

      // see if we get another soon
      return $stream.pipe(
        filter(isBoxMoveAction),
        // tap(_ => console.log('INNER 1')),
        takeUntil(merge($notaboxmoveaction, $tooslow)),
        // tap(logEntry),
        reduce(moveActionReducer, findXY(x)),
        map(moveActionShaper(x)),
        // tap(_ => console.log('COMBINED3')),
        // tap(_ => console.log('INNER 2')),
        defaultIfEmpty(x)
      );
    })
  );
  return $optimized;
  // return $optimized.pipe(
  //   buffer($optimized.pipe(debounceTime(100))),
  // );
}

function moveActionShaper(first: Entry): (y: XY) => Entry {
  return lastXY => {
    const { action, patches: originalPatches } = first;
    const firstPatch = originalPatches[0];
    const pathParts = firstPatch.path.split('/');
    pathParts.pop();
    // console.log(action);
    // const id = (action.context as any).id;
    // const lastPatch = lastt.patches[lastt.patches.length - 1];
    const originalXY: XY = {
      x: 0,
      y: 0,
    };
    for (const k in lastXY) {
      if (k === 'x' || k === 'y') {
        pathParts.push(k);
        const path = pathParts.join('/');
        pathParts.pop();
        const originalK = originalPatches.find(p => p.path === path);
        if (originalK) {
          originalXY[k] = originalK.value;
        }
      }
    }

    const patches: IJsonPatch[] = [];
    const inversePatches: IJsonPatch[] = [];
    for (const k in lastXY) {
      if (k === 'x' || k === 'y') {
        pathParts.push(k);
        const path = pathParts.join('/');
        pathParts.pop();
        // console.log(path);
        patches.push({
          op: 'replace',
          path,
          value: lastXY[k],
        });
        inversePatches.push({
          op: 'replace',
          path,
          value: originalXY[k],
        });
      }
    }
    return {
      action,
      patches,
      inversePatches,
    };
  };
}
interface XY {
  x?: number;
  y?: number;
}
function findXY(v: Entry, i: 'patches' | 'inversePatches' = 'patches') {
  return v[i].reduce<XY>((acc, { path, value }) => {
    const parts = path.split('/');
    const key = parts.pop();
    if (key === 'x') {
      return {
        ...acc,
        x: value as number,
      };
    }
    if (key === 'y') {
      return {
        ...acc,
        y: value as number,
      };
    }
    return acc;
  }, {});
}

function moveActionReducer(acc: XY, v: Entry) {
  return {
    ...acc,
    ...findXY(v),
  };
}

// function sameAction(a: Entry, b: Entry) {
//   return
// }

function isBoxMoveAction(a: Entry) {
  return a.action.name === 'move';
}
function getBoxId(a: Entry) {
  const pathParts = a.patches[0].path.split('/');
  if (pathParts[1] === 'boxes') {
    return pathParts[2];
  }
  return undefined;
}

function isSameBox(a: Entry, b: Entry) {
  return (
    isBoxMoveAction(a) &&
    isBoxMoveAction(b) &&
    (getBoxId(a) === getBoxId(b)) !== undefined
  );
}
