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
import {
  logAction,
  logEntry,
  logPatch,
  setupPatchStream,
} from './event-stream';
import { IStore } from './store';

export interface Entry {
  patches: ReadonlyArray<IJsonPatch>;
  inversePatches: ReadonlyArray<IJsonPatch>;
  action: { name: string; id: number };
}

interface Context {
  recorder: IPatchRecorder;
  actionId: string;
}

const discard = new Set(['setCanvasDimensions', 'setIsDragging']);

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

  constructor(
    store: IStore,
    client: MyApolloClient<any>,
    graphId: string,
    initialVersion: number
  ) {
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
    // console.log('CLIENT', client, this.client, this);
    this.localSubscription = this.subscribeToLocalPatches(
      setupPatchStream(subject)
    );
    this.remoteSubscription = this.subscribeToRemotePatches();
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
            console.log('UPLOADED', this.version);
            logEntry(entry);
            this.version++;
          } else {
            this.undo(entry);
          }
        },
        error => {
          console.log('SUBSCRIPTION FAILED');
          console.error(error);
        },
        () => {
          console.log('SUBSCRIPTION COMPLETED');
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
          console.log(`OUT-OF-DATE, tried %d`, version + 1, error.graphQLErrors[0].data);
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
    console.log('UNDOING', action.name);
    patches.map(p => {
      try {
        applyPatch(this.store, p);
      } catch (error) {
        console.log('FAILED TO APPLY', p);
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
      console.log('FILTERED', name);
    }
    return verdict;
  };
  private onStart = (call: IMiddlewareEvent) => {
    const { id, name } = call;
    // console.log(id, name, 'ONSTART');
    // console.log(call);
    this.currentRecorder = recordPatches(call.tree);
    return {
      recorder: this.currentRecorder,
      actionId: name + this.version,
    };
  };

  private onResume = (call: IMiddlewareEvent, { actionId }: Context) => {
    // console.log('ONRESUME', actionId);
  };
  private onSuspend = (call: IMiddlewareEvent, { actionId }: Context) => {
    // console.log('ONSUSPEND', actionId);
  };

  private onSuccess = (action: IMiddlewareEvent, { recorder }: Context) => {
    // console.log('ONSUSPEND', actionId);
    if (
      recorder &&
      recorder.patches.length > 0 &&
      this.observer &&
      !this.patchingInProgress
    ) {
      // console.log('ONSUCCESS', actionId);
      // logAction(recorder, action);
      this.observer.next({
        patches: recorder.patches,
        inversePatches: recorder.inversePatches,
        action,
      });
    } else {
      // console.log(recorder.patches.length, this.observer);
    }
    this.currentRecorder = undefined;
  };
  private onFail = (
    _call: IMiddlewareEvent,
    { recorder, actionId }: Context
  ) => {
    if (recorder) {
      console.log('ONFAIL', actionId);
      recorder.undo();
      this.currentRecorder = undefined;
    }
  };

  private subscribeToRemotePatches() {
    return this.client.subscribeToPatches(this.graphId).subscribe(
      ({ data: { onCreatePatch } }) => {
        if (onCreatePatch) {
          const entry = deserializeEntry(onCreatePatch);
          if (entry.seq === this.version + 1) {
            try {
              console.log('SUBSCRIBE RESULT', entry.entry.patches);
              this.patchingInProgress = true;
              applyPatch(this.store, entry.entry.patches);
              this.version++;
              this.patchingInProgress = false;
            } catch (error) {
              console.log('SUBSCRIBE RESULT FAILED APPLYING PATCHES');
            }
          } else {
            console.log(
              'SUBSCRIBE RESULT INCORRECT VERSION, GOT %d IS %d',
              entry.seq,
              this.version
            );
          }
        } else {
          console.log('SUBSCRIBE RESULT EMPTY');
        }
      },
      e => {
        console.log('SUBSCRIBE ERROR', e);
      }
    );
  }
}
