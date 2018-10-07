import { GraphQLError } from 'graphql';
import {
  addMiddleware,
  applyAction,
  applyPatch,
  createActionTrackingMiddleware,
  getPath,
  IJsonPatch,
  IMiddlewareEvent,
  IPatchRecorder,
  ISerializedActionCall,
  recordPatches,
} from 'mobx-state-tree';
import { IDisposer } from 'mobx-state-tree/dist/utils';
import { Observable, Observer, Subject, Subscription } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import {
  deserializeRemotePatch,
  deserializeRemotePatches,
  flattenPatches,
  MyApolloClient,
} from './appsync/client';
import { setupPatchStream } from './event-stream';
import { createPatch_createPatch } from './gql/generated/createPatch';
import { getPatches_getPatches } from './gql/generated/getPatches';
import { onCreatePatch_onCreatePatch } from './gql/generated/onCreatePatch';
import { IStore } from './store';
import { logPatch } from './utils';

// interface IMiddlewareEvent = {
//   type: IMiddlewareEventType;
//   name: string;
//   id: number;
//   parentId: number;
//   rootId: number;
//   context: IAnyStateTreeNode;
//   tree: IAnyStateTreeNode;
//   args: any[];
// };

export interface Entry {
  patches: ReadonlyArray<IJsonPatch>;
  inversePatches: ReadonlyArray<IJsonPatch>;
  action: ISerializedActionCall;
}

export interface Context {
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
  updateInProgress: any;

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
    return $stream
      .pipe(
        // tap(_ => console.log('OUTER AFTER')),
        mergeMap(this.tryUpload, 1)
      )
      .subscribe(
        ({ errors, entry, updateWith }) => {
          if (!errors || !errors.length) {
            // this.log('UPLOADED', this.version);
            // logEntry(entry);
            this.version++;
            this.log('mutation committed, new version is %d', this.version);
          } else if (updateWith) {
            this.rebaseWith(entry, updateWith);
            this.log('mutation conflict, updated to version %d', this.version);
          } else {
            this.undo(entry);
            this.log('mutation conflict, reverting back to version %d', this.version);
          }
          this.logPatches(entry.patches);
        },
        error => {
          this.log('LOCAL SUBSCRIPTION FAILED');
          this.logError(error);
        },
        () => {
          this.log('LOCAL SUBSCRIPTION COMPLETED');
        }
      );
  }

  public tryUpload = async (
    x: Entry
  ): Promise<{
    entry: Entry;
    errors?: GraphQLError[];
    updateWith?: createPatch_createPatch;
  }> => {
    const version = this.version;

    try {
      const { data, errors } = await this.client.uploadPatches(
        this.graphId,
        x,
        version
      );
      // this.log('MUTATION RESULT', data);
      return {
        entry: x,
        errors,
      };
    } catch (error) {
      // Most probably a condition exception
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const err = error.graphQLErrors[0];
        const { errorType } = err;
        if (errorType === 'DynamoDB:ConditionalCheckFailedException') {
          // this.log(`OUT-OF-DATE, tried %d`, version + 1, err.data);
          return {
            entry: x,
            errors: err.graphQLErrors,
            updateWith: err.data,
          };
        }
      }
      throw error;
    }
  };

  private tryUpdate = async () => {
    this.updateInProgress = true;
    const version = this.version;
    this.log('UPDATING TO THE NEWEST VERSION');

    try {
      const {
        data: { getPatches },
      } = await this.client.getPatches(this.graphId, version);
      if (getPatches && getPatches && getPatches.length > 0) {
        return this.applyRemotePatches(getPatches);
      } else {
        this.log('ALREADY AT THE NEWEST VERSION');
      }
    } catch (error) {
      this.logError(error);
    } finally {
      this.updateInProgress = false;
    }
    return 0;
  };

  private applyRemotePatches(remotePatches: getPatches_getPatches[]) {
    const version = this.version;
    const { patches, version: newVersion } = deserializeRemotePatches(
      remotePatches
    );
    if (newVersion !== version + patches.length) {
      throw new Error(
        `Won't apply incompatible patches, ${newVersion} !== ${version} + ${
          patches.length
        }`
      );
    }
    this.log('TRYING TO UPDATE', patches);
    this.patchingInProgress = true;
    applyPatch(this.store, flattenPatches(patches.map(p => p.payload)));
    this.patchingInProgress = false;
    this.version = newVersion;
    return newVersion - version;
  }

  private async rebase(entry: Entry) {
    this.undo(entry);
    const forwarded = await this.tryUpdate();
    if (!forwarded) {
      throw new Error('REBASE: Already at the newest version');
    }
    applyAction(this.store, entry.action);
  }

  public rebaseWith(entry: Entry, patch: createPatch_createPatch) {
    this.undo(entry);
    this.applyRemotePatches([patch]);
    applyAction(this.store, entry.action);
  }

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
      // this.log('FILTERED', name);
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
      this.log('ONFAIL', actionId, recorder);
      recorder.undo();
      this.currentRecorder = undefined;
    }
  };

  private subscribeToRemotePatches() {
    return this.client.subscribeToPatches(this.graphId).subscribe(
      ({ data: { onCreatePatch: patch } }) => {
        if (patch) {
          this.applyRealtimePatch(patch);
        } else {
          this.log('SUBSCRIBE RESULT EMPTY');
        }
      },
      e => {
        this.log('SUBSCRIBE ERROR', e);
      }
    );
  }

  private applyRealtimePatch(patch: onCreatePatch_onCreatePatch) {
    if (this.updateInProgress) {
      return;
    }
    const remote = deserializeRemotePatch(patch);
    const { seq, payload, client } = remote;
    if (seq === this.version + 1 && client !== this.client.id) {
      try {
        this.patchingInProgress = true;
        applyPatch(this.store, payload);
        this.version++;
        this.patchingInProgress = false;
        this.log('remote patch committed, new version is %d', this.version);
      } catch (error) {
        this.log('SUBSCRIBE RESULT FAILED APPLYING PATCHES');
      }
      this.logPatches(remote.payload);
    } else {
      if (client === this.client.id) {
        // this.log('SUBSCRIBE: IGNORED SELF MUTATION');
      } else {
        this.log(
          'SUBSCRIBE RESULT INCORRECT VERSION, GOT %d IS %d',
          seq,
          this.version
        );
        this.logPatches(remote.payload);
        if (seq >= this.version) {
          this.tryUpdate();
        }
      }
    }
  }
}
