import ApolloClient from 'apollo-client';
import { FetchResult } from 'apollo-link';
import {
  addMiddleware,
  applyPatch,
  createActionTrackingMiddleware,
  IJsonPatch,
  IMiddlewareEvent,
  IPatchRecorder,
  recordPatches,
} from 'mobx-state-tree';
import { IDisposer } from 'mobx-state-tree/dist/utils';
import { Observable, Observer, Subject, Subscription } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { deserializeEntry, MyApolloClient } from './appsync/client';
import { setupPatchStream } from './event-stream';
import { onCreatePatch_onCreatePatch } from './gql/generated/onCreatePatch';
import { IStore } from './store';
import { logEntry } from './utils';

export interface Entry {
  patches: ReadonlyArray<IJsonPatch>;
  inversePatches: ReadonlyArray<IJsonPatch>;
  action: { name: string; id: number };
}

interface Context {
  recorder: IPatchRecorder;
  actionId: string;
}

const discard = new Set([
  'setCanvasDimensions',
  'setIsDragging',
  'setDragging',
  'setZoom',
  'setTool',
]);

export class PatchManager {
  private version = 0;
  private currentRecorder?: IPatchRecorder;
  private observer?: Observer<Entry>;
  private localSubscription?: Subscription;
  private patchingInProgress = false;

  private readonly initialVersion: number;
  private readonly applied: Set<string> = new Set();
  private readonly middlewareSubscription: IDisposer;
  private readonly client: MyApolloClient<any>;
  private readonly store: IStore;
  private readonly $patchStream: Observable<Entry>;
  private readonly graphId: string;
  private readonly remoteSubscription: ZenObservable.Subscription;
  private readonly dev: boolean;

  constructor(
    store: IStore,
    client: MyApolloClient<any>,
    graphId: string,
    initialVersion: number,
    dev = true
  ) {
    // NOTE: [plugin-transform-typescript] constructor auto-assign not
    // working with plugin-transform-classes #7074
    // https://github.com/babel/babel/issues/7074
    this.dev = dev;
    this.graphId = graphId;
    this.version = initialVersion;
    this.initialVersion = initialVersion;
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
    this.$patchStream = subject;
    this.observer = subject;
    this.client = client;
    // this.log('CLIENT', client, this.client, this);
    this.localSubscription = this.subscribeToLocalPatches(
      setupPatchStream(subject)
    );
    this.remoteSubscription = this.subscribeToRemotePatches();
  }

  private log(msg: string, ...args: any[]) {
    if (this.dev) {
      console.log(msg, ...args);
    }
  }

  private logError(error: any) {
    if (this.dev) {
      console.error(error);
    }
  }

  private subscribeToLocalPatches($stream: Observable<Entry>) {
    return $stream
      .pipe(
        // tap(_ => console.log('OUTER AFTER')),
        mergeMap(this.tryUpload, 1)
      )
      .subscribe(
        ({ result, entry }) => {
          if (!result.errors) {
            this.log('UPLOADED', this.version);
            logEntry(entry);
            this.version++;
          } else {
            this.undo(entry);
          }
        },
        error => {
          this.log('SUBSCRIPTION FAILED');
          this.logError(error);
        },
        () => {
          this.log('SUBSCRIPTION COMPLETED');
        }
      );
  }

  public tryUpload = async (x: Entry) => {
    const version = this.version;

    try {
      const result = await this.client.uploadPatches(this.graphId, x, version);
      return {
        entry: x,
        result: {
          errors: result.errors ? 1 : 0,
        },
      };
    } catch (error) {
      // Most probably a condition exception
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const { errorType } = error.graphQLErrors[0];
        if (errorType === 'DynamoDB:ConditionalCheckFailedException') {
          this.log(
            `OUT-OF-DATE, tried %d`,
            version + 1,
            error.graphQLErrors[0].data
          );
          return {
            entry: x,
            result: {
              errors: 1,
            },
          };
        }
      }
      throw error;
    }
  };

  public undo({ inversePatches, action }: Entry) {
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
  }

  private filter = ({ name, context }: IMiddlewareEvent) => {
    const verdict =
      !this.currentRecorder &&
      !discard.has(name) &&
      !this.patchingInProgress &&
      context !== this; // don't undo / redo undo redo :)
    if (!verdict) {
      this.log('FILTERED', name);
    }
    return verdict;
  };
  private onStart = (call: IMiddlewareEvent) => {
    const { id, name } = call;
    // this.log(id, name, 'ONSTART');
    // this.log(call);
    this.currentRecorder = recordPatches(call.tree);
    return {
      recorder: this.currentRecorder,
      actionId: name + this.version,
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
        action,
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

  private subscribeToRemotePatches() {
    return this.client.subscribeToPatches(this.graphId).subscribe(
      ({ data: { onCreatePatch: patch } }) => {
        if (patch) {
          this.applyRemotePatch(patch);
        } else {
          this.log('SUBSCRIBE RESULT EMPTY');
        }
      },
      e => {
        this.log('SUBSCRIBE ERROR', e);
      }
    );
  }

  private applyRemotePatch(patch: onCreatePatch_onCreatePatch) {
    const {seq, entry: {patches}} = deserializeEntry(patch);
    if (seq === this.version + 1) {
      try {
        this.log('SUBSCRIBE RESULT', patches);
        this.patchingInProgress = true;
        applyPatch(this.store, patches);
        this.version++;
        this.patchingInProgress = false;
      } catch (error) {
        this.log('SUBSCRIBE RESULT FAILED APPLYING PATCHES');
      }
    } else {
      this.log(
        'SUBSCRIBE RESULT INCORRECT VERSION, GOT %d IS %d',
        seq,
        this.version
      );
    }

  }
}
