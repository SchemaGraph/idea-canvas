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
} from 'mobx-state-tree';
import { IDisposer } from 'mobx-state-tree/dist/utils';
import { Observable, Observer, of, Subject, Subscription } from 'rxjs';
import { exhaustMap, filter, map, mergeMap, take, tap, toArray } from 'rxjs/operators';
import { setupPatchStream } from './event-stream';
import { Context, Entry } from './patch-manager';
import { IStore } from './store';
import { logEntry, logPatch } from './utils';

const discard = new Set([
  'setCanvasDimensions',
  'setIsDragging',
  'setDragging',
  'setZoom',
  'setTool',
//  'setEditing',
  'setDimensions',
  'setWidth',
  'startConnecting',
  'updateConnecting',
  'endConnecting'
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
            console.log('GOT $NOW');
            (self as any).setCanUndo(canUndo);
            (self as any).setCanRedo(canRedo);
          });
        }
      },
    };
  });

export class UndoManager {
  private now = 0;
  private currentRecorder?: IPatchRecorder;
  private patchingInProgress = false;

  private readonly observer: Observer<Entry>;
  private readonly middlewareSubscription: IDisposer;
  private readonly store: IStore;
  private readonly dev: boolean;
  private readonly history: Entry[] = [];
  public readonly $now = new Subject<{ canUndo: boolean; canRedo: boolean }>();

  constructor(store: IStore, dev = true) {
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
    this.subscribeToLocalPatches(setupPatchStream(subject));
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

  private subscribeToLocalPatches($stream: Observable<Entry>) {
    const $a = $stream.pipe(
      filter(({ patches }) => patches.length > 0 && !this.patchingInProgress)
    );
    return $a
      .pipe(
        exhaustMap(x => {
          if (x.action.name === 'createBox') {
            return $a.pipe(
              // tap(console.log),
              filter(y => y.action.name === 'initialize' || y.action.name === 'setEditing'),
              take(2),
              toArray(),
              map(y => join([x, ...y])),
            );
          }
          return of(x);
        })
      )
      .subscribe(
        this.addUndoState,
        error => {
          this.log('LOCAL SUBSCRIPTION FAILED');
          this.logError(error);
        },
        () => {
          this.log('LOCAL SUBSCRIPTION COMPLETED');
        }
      );
  }

  private setNow(newNow: number) {
    this.log('NOW', newNow);
    this.now = newNow;
    this.$now.next({ canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  private addUndoState = (x: Entry) => {
    this.log('ADDUNDOSTATE', x.action.name);
    const h = this.history;
    h.splice(this.now); // deletes forks
    h.push(x);
    this.setNow(h.length);
  };

  public undo = () => {
    const { inversePatches, action } = this.history[this.now - 1];
    this.patchingInProgress = true;
    const patches = inversePatches.slice().reverse();
    this.log('UNDOING', action.name);
    patches.map(p => {
      try {
        applyPatch(this.store, p);
      } catch (error) {
        this.log('FAILED TO APPLY', p);
      }
      return 1;
    });
    this.patchingInProgress = false;
    this.setNow(--this.now);
  };

  public redo = () => {
    const { patches, action } = this.history[this.now];
    this.patchingInProgress = true;
    this.log('REDOING', action.name);
    patches.map(p => {
      try {
        applyPatch(this.store, p);
      } catch (error) {
        this.log('FAILED TO APPLY', p);
      }
      return 1;
    });
    this.patchingInProgress = false;
    this.setNow(++this.now);
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

  private onSuccess = (action: IMiddlewareEvent, { recorder }: Context) => {
    // this.log('ONSUSPEND', actionId);
    if (
      recorder &&
      recorder.patches.length > 0 &&
      this.observer &&
      !this.patchingInProgress
    ) {
      // this.log('ONSUCCESS', actionId);
      // logAction(recorder, action);
      this.observer.next({
        patches: recorder.patches,
        inversePatches: recorder.inversePatches,
        action: {
          name: action.name,
          args: action.args,
          path: getPath(action.context),
        },
      });
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
