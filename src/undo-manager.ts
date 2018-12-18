import {
  addMiddleware,
  applyPatch,
  createActionTrackingMiddleware,
  getEnv,
  getPath,
  IJsonPatch,
  IMiddlewareEvent,
  IPatchRecorder,
  recordPatches,
  types,
  IAnyStateTreeNode,
} from 'mobx-state-tree';
import { IDisposer } from 'mobx-state-tree/dist/utils';
import { Observable, Observer, of, Subject, Subscription } from 'rxjs';
import {
  exhaustMap,
  filter,
  map,
  mergeMap,
  take,
  tap,
  toArray,
} from 'rxjs/operators';
import { setupPatchStream, Entry } from './event-stream';
import { IStore } from './store';
import { logEntry, logPatch } from './utils';
import { Redo } from 'styled-icons/material';

export interface Context {
  recorder: IPatchRecorder;
  actionId: string;
}

const discard = new Set([
  'move',
  'setWidth',
  'setDimensions',
  'setHeight',
  'setWidth',
]);

export const ObservableUndoManager = types
  .model('UndoManager', {
    canUndo: false,
    canRedo: false,
  })
  .actions(self => {
    let undoManager: UndoManager | undefined;
    return {
      setCanUndo(x: boolean) {
        self.canUndo = x;
      },
      setCanRedo(x: boolean) {
        self.canRedo = x;
      },
      undo() {
        if (undoManager) {
          undoManager.undo();
        }
      },
      redo() {
        if (undoManager) {
          undoManager.redo();
        }
      },
      afterCreate() {
        undoManager = getEnv(self).undoManager;
        if (!undoManager) {
          throw new Error('Provide the undoManager in the context');
        } else {
          undoManager.$now.subscribe(({ canUndo, canRedo }) => {
            (self as any).setCanUndo(canUndo);
            (self as any).setCanRedo(canRedo);
          });
        }
      },
    };
  });

type EEntry = Entry & { recorder: IPatchRecorder; event: IMiddlewareEvent };

interface UndoState {
  undo: () => void;
  redo: () => void;
}

function replaceLast(path: string, last: string) {
  const pathParts = path.split('/');
  pathParts.pop();
  pathParts.push(last);
  return pathParts.join('/');
}

function addLast(path: string, last: string) {
  const pathParts = path.split('/');
  pathParts.push(last);
  return pathParts.join('/');
}

function createUndoState(x: EEntry) {
  return {
    undo() {
      let patches: ReadonlyArray<IJsonPatch>;
      switch (x.event.name) {
        case 'commitPosition':
          patches = [
            {
              op: 'replace',
              path: addLast(x.action.path!, 'x'),
              value: x.action.args![0][0],
            },
            {
              op: 'replace',
              path: addLast(x.action.path!, 'y'),
              value: x.action.args![0][1],
            },
          ];
          applyPatch(x.event.tree, patches);
          break;
        default:
          patches = x.inversePatches.slice().reverse();
      }
      console.log(patches);
      applyPatch(x.event.tree, patches);
    },
    redo() {
      let patches: ReadonlyArray<IJsonPatch>;
      switch (x.event.name) {
        case 'commitPosition':
          patches = [
            {
              op: 'replace',
              path: addLast(x.action.path!, 'x'),
              value: x.action.args![1][0],
            },
            {
              op: 'replace',
              path: addLast(x.action.path!, 'y'),
              value: x.action.args![1][1],
            },
          ];
          break;
        default:
          patches = x.patches.slice();
      }
      console.log(patches);
      applyPatch(x.event.tree, patches);
    },
  };
}

export class UndoManager {
  private now = 0;
  private currentRecorder?: IPatchRecorder;
  private patchingInProgress = false;

  private readonly observer: Observer<EEntry>;
  private readonly middlewareSubscription: IDisposer;
  private readonly store: IAnyStateTreeNode;
  private readonly dev: boolean;
  private readonly history: UndoState[] = [];
  public readonly $now = new Subject<{ canUndo: boolean; canRedo: boolean }>();

  constructor(store: IAnyStateTreeNode, dev = true) {
    // NOTE: [plugin-transform-typescript] constructor auto-assign not
    // working with plugin-transform-classes #7074
    // https://github.com/babel/babel/issues/7074
    this.dev = dev;
    this.store = store;
    const middleware = createActionTrackingMiddleware<Context>({
      filter: this.filter,
      onStart: this.onStart,
      onResume: this.onResume,
      onSuspend: this.onSuspend,
      onSuccess: this.onSuccess,
      onFail: this.onFail,
    });
    this.middlewareSubscription = addMiddleware(store, middleware, false);

    const subject = new Subject<Entry>();
    this.observer = subject;
    // this.subscribeToLocalPatches(setupPatchStream(subject));
  }

  private log(msg: string, ...args: any[]) {
    if (this.dev) {
      console.log(msg, ...args);
    }
  }
  private logPatches(patches: ReadonlyArray<IJsonPatch>) {
    if (this.dev) {
      patches.map(logPatch);
    }
  }

  private logError(error: any) {
    if (this.dev) {
      console.error(error);
    }
  }

  // private subscribeToLocalPatches($stream: Observable<EEntry>) {
  //   const $a = $stream.pipe(
  //     filter(({ patches }) => patches.length > 0 && !this.patchingInProgress)
  //   );
  //   return $a
  //     .pipe(
  //       exhaustMap(x => {
  //         if (x.action.name === 'createBox') {
  //           return $a.pipe(
  //             // tap(console.log),
  //             filter(
  //               y =>
  //                 y.action.name === 'initialize' ||
  //                 y.action.name === 'setEditing'
  //             ),
  //             take(2),
  //             toArray(),
  //             map(y => join([x, ...y]))
  //           );
  //         }
  //         return of(x);
  //       })
  //     )
  //     .subscribe(
  //       this.addUndoState,
  //       error => {
  //         this.log('LOCAL SUBSCRIPTION FAILED');
  //         this.logError(error);
  //       },
  //       () => {
  //         this.log('LOCAL SUBSCRIPTION COMPLETED');
  //       }
  //     );
  // }

  private setNow(newNow: number) {
    this.log('NOW', newNow);
    this.now = newNow;
    this.$now.next({ canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  private addUndoState = (x: EEntry) => {
    this.log('ADDUNDOSTATE', x.action.name);
    const h = this.history;
    h.splice(this.now); // deletes forks
    h.push(createUndoState(x));
    this.setNow(h.length);
  };

  public undo = () => {
    const { undo } = this.history[this.now - 1];
    this.patchingInProgress = true;
    // const patches = inversePatches.slice().reverse();
    // this.log('UNDOING', action.name);
    try {
      // patches.forEach(p => applyPatch(this.store, p));
      undo();
      this.setNow(--this.now);
    } catch (error) {
      this.log('FAILED TO UNDO', error);
    } finally {
      this.patchingInProgress = false;
    }
  };

  public redo = () => {
    const { redo } = this.history[this.now];
    this.patchingInProgress = true;
    // this.log('REDOING', action.name);
    try {
      redo();
      this.setNow(++this.now);
    } catch (error) {
      this.log('FAILED TO REDO', error);
    } finally {
      this.patchingInProgress = false;
    }
  };

  public canUndo() {
    return this.now > 0;
  }

  public canRedo() {
    return this.now < this.history.length;
  }

  private filter = ({ name, context }: IMiddlewareEvent) => {
    const verdict =
      !this.currentRecorder &&
      !discard.has(name) &&
      !this.patchingInProgress &&
      context !== this; // don't undo / redo undo redo :)
    return verdict;
  };

  private onStart = (call: IMiddlewareEvent) => {
    const { id, name } = call;
    this.currentRecorder = recordPatches(call.tree);
    return {
      recorder: this.currentRecorder,
      actionId: name + this.now,
    };
  };

  private onResume = (_call: IMiddlewareEvent, _c: Context) => {
    // this.log('ONRESUME', actionId);
  };
  private onSuspend = (_call: IMiddlewareEvent, _c: Context) => {
    // this.log('ONSUSPEND', actionId);
  };

  private onSuccess = (event: IMiddlewareEvent, { recorder }: Context) => {
    // this.log('ONSUSPEND', actionId);
    if (
      recorder &&
      recorder.patches.length > 0 &&
      this.observer &&
      !this.patchingInProgress
    ) {
      // this.log('ONSUCCESS', actionId);
      // logAction(recorder, action);
      const entry = {
        patches: recorder.patches,
        inversePatches: recorder.inversePatches,
        action: {
          name: event.name,
          args: event.args,
          path: getPath(event.context),
        },
        recorder,
        event,
      };
      // console.log(entry);
      // console.log(event.context);
      // console.log(event.tree);
      // this.observer.next(entry);
      this.addUndoState(entry);
    } else {
      // this.log(recorder.patches.length, this.observer);
    }
    this.currentRecorder = undefined;
  };
  private onFail = (
    _call: IMiddlewareEvent,
    { recorder, actionId }: Context
  ) => {
    if (recorder) {
      this.log('ONFAIL', actionId);
      recorder.undo();
      this.currentRecorder = undefined;
    }
  };
}

function join([a, ...rest]: Entry[]) {
  return {
    patches: a.patches.concat(...rest.map(b => b.patches)),
    inversePatches: a.inversePatches.concat(...rest.map(b => b.inversePatches)),
    action: {
      name: [a.action.name, ...rest.map(b => b.action.name)].join('|'),
      args: [],
    },
  };
}
